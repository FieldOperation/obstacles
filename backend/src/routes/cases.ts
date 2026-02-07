import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult, query } from 'express-validator';
import { PrismaClient, CaseType, CaseStatus } from '@prisma/client';
import { AuthRequest, requireWorkerOrAdmin } from '../middleware/auth';
import { canModifyCase } from '../middleware/rbac';
import { uploadLimiter } from '../middleware/security';
import { io } from '../index';
import { env } from '../config/env';
import { logger } from '../config/logger';

const router = express.Router();
const prisma = new PrismaClient();

const CASE_UPLOAD_DIR = path.join(env.UPLOAD_DIR, 'cases');

// Ensure case upload directory exists
if (!fs.existsSync(CASE_UPLOAD_DIR)) {
  fs.mkdirSync(CASE_UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CASE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `case-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all cases with filters
router.get(
  '/',
  [
    query('type').optional().isIn(['OBSTACLE', 'DAMAGE']),
    query('status').optional().isIn(['OPEN', 'CLOSED']),
    query('zoneId').optional().isUUID(),
    query('roadId').optional().isUUID(),
    query('developerId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 10000 })
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        type,
        status,
        zoneId,
        roadId,
        developerId,
        page = '1',
        limit = '50'
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};

      // Apply role-based filtering
      if (req.user?.role === 'WORKER' && !req.user.zoneId) {
        // Worker without zone can only see their own cases
        where.createdById = req.user.id;
      } else if (req.user?.role === 'WORKER' && req.user.zoneId) {
        // Worker with zone can see cases in their zone
        where.zoneId = req.user.zoneId;
      } else if (req.user?.role === 'OTHERS') {
        // Others can see all cases (read-only)
        // No additional filter
      }
      // Admins see all cases

      if (type) where.type = type;
      if (status) where.status = status;
      if (zoneId) where.zoneId = zoneId;
      if (roadId) where.roadId = roadId;
      if (developerId) where.developerId = developerId;

      const [cases, total] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          include: {
            zone: true,
            road: true,
            developer: true,
            createdBy: {
              select: { id: true, name: true, email: true }
            },
            closedBy: {
              select: { id: true, name: true, email: true }
            },
            photos: true,
            closurePhotos: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.case.count({ where })
      ]);

      res.json({
        cases,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error: any) {
      console.error('Get cases error:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  }
);

// Get case by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: req.params.id },
      include: {
        zone: true,
        road: true,
        developer: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        closedBy: {
          select: { id: true, name: true, email: true }
        },
        photos: true,
        closurePhotos: true
      }
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check permissions
    if (req.user?.role === 'WORKER' && 
        caseRecord.createdById !== req.user.id &&
        caseRecord.zoneId !== req.user.zoneId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ case: caseRecord });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Create case
router.post(
  '/',
  requireWorkerOrAdmin,
  uploadLimiter,
  upload.array('photos', 10),
  [
    body('type').isIn(['OBSTACLE', 'DAMAGE']),
    body('zoneId').isUUID(),
    body('roadId').isUUID(),
    body('developerId').optional().isUUID(),
    body('description').trim().notEmpty(),
    body('plannedWork').optional().trim(),
    body('latitude').isFloat(),
    body('longitude').isFloat()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        type,
        zoneId,
        roadId,
        developerId,
        description,
        plannedWork,
        latitude,
        longitude
      } = req.body;

      // Validate plannedWork for OBSTACLE type
      if (type === 'OBSTACLE' && !plannedWork) {
        return res.status(400).json({ error: 'Planned work is required for obstacles' });
      }

      // Verify zone and road exist
      const [zone, road] = await Promise.all([
        prisma.zone.findUnique({ where: { id: zoneId } }),
        prisma.road.findUnique({ where: { id: roadId } })
      ]);

      if (!zone) {
        return res.status(404).json({ error: 'Zone not found' });
      }
      if (!road || road.zoneId !== zoneId) {
        return res.status(404).json({ error: 'Road not found or does not belong to zone' });
      }

      // Create case
      const caseRecord = await prisma.case.create({
        data: {
          type: type as CaseType,
          zoneId,
          roadId,
          developerId: developerId || null,
          description,
          plannedWork: type === 'OBSTACLE' ? plannedWork : null,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          createdById: req.user!.id,
          photos: {
            create: (req.files as Express.Multer.File[]).map(file => ({
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              latitude: req.body.photoLatitude ? parseFloat(req.body.photoLatitude) : null,
              longitude: req.body.photoLongitude ? parseFloat(req.body.photoLongitude) : null
            }))
          }
        },
        include: {
          zone: true,
          road: true,
          developer: true,
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          photos: true
        }
      });

      // Send notification to Others role users
      const othersUsers = await prisma.user.findMany({
        where: { role: 'OTHERS' }
      });

      for (const user of othersUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            caseId: caseRecord.id,
            title: `New ${type} Case Created`,
            message: `A new ${type.toLowerCase()} case has been created in ${zone.name} - ${road.name}`
          }
        });
      }

      // Emit socket event
      io.emit('case:created', caseRecord);

      res.status(201).json({ case: caseRecord });
    } catch (error: any) {
      console.error('Create case error:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  }
);

// Update case
router.put(
  '/:id',
  requireWorkerOrAdmin,
  canModifyCase,
  [
    body('description').optional().trim().notEmpty(),
    body('plannedWork').optional().trim(),
    body('developerId').optional().isUUID()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, plannedWork, developerId } = req.body;

      const updateData: any = {};
      if (description) updateData.description = description;
      if (plannedWork !== undefined) updateData.plannedWork = plannedWork;
      if (developerId !== undefined) updateData.developerId = developerId || null;

      const caseRecord = await prisma.case.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          zone: true,
          road: true,
          developer: true,
          photos: true
        }
      });

      io.emit('case:updated', caseRecord);

      res.json({ case: caseRecord });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Case not found' });
      }
      console.error('Update case error:', error);
      res.status(500).json({ error: 'Failed to update case' });
    }
  }
);

// Close case
router.post(
  '/:id/close',
  requireWorkerOrAdmin,
  canModifyCase,
  uploadLimiter,
  upload.array('closurePhotos', 10),
  [
    body('closureNotes').trim().notEmpty()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { closureNotes } = req.body;

      // Check if case is already closed
      const existingCase = await prisma.case.findUnique({
        where: { id: req.params.id }
      });

      if (!existingCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      if (existingCase.status === 'CLOSED') {
        return res.status(400).json({ error: 'Case is already closed' });
      }

      // Close case
      const caseRecord = await prisma.case.update({
        where: { id: req.params.id },
        data: {
          status: 'CLOSED',
          closedById: req.user!.id,
          closedAt: new Date(),
          closureNotes
        },
        include: {
          zone: true,
          road: true,
          developer: true,
          closedBy: {
            select: { id: true, name: true, email: true }
          },
          photos: true,
          closurePhotos: true
        }
      });

      // Create closure photos separately to avoid relation ambiguity
      if ((req.files as Express.Multer.File[]).length > 0) {
        await prisma.photo.createMany({
          data: (req.files as Express.Multer.File[]).map(file => ({
            caseId: caseRecord.id, // Required field - set to the case ID
            closureCaseId: caseRecord.id, // This marks it as a closure photo
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            latitude: req.body.photoLatitude ? parseFloat(req.body.photoLatitude) : null,
            longitude: req.body.photoLongitude ? parseFloat(req.body.photoLongitude) : null
          }))
        });

        // Fetch the updated case with closure photos
        const updatedCase = await prisma.case.findUnique({
          where: { id: req.params.id },
          include: {
            zone: true,
            road: true,
            developer: true,
            closedBy: {
              select: { id: true, name: true, email: true }
            },
            photos: true,
            closurePhotos: true
          }
        });

        if (updatedCase) {
          Object.assign(caseRecord, updatedCase);
        }
      }

      // Send notification
      const othersUsers = await prisma.user.findMany({
        where: { role: 'OTHERS' }
      });

      for (const user of othersUsers) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            caseId: caseRecord.id,
            title: `Case Closed`,
            message: `Case in ${caseRecord.zone.name} - ${caseRecord.road.name} has been closed`
          }
        });
      }

      io.emit('case:closed', caseRecord);

      res.json({ case: caseRecord });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Case not found' });
      }
      console.error('Close case error:', error);
      res.status(500).json({ error: 'Failed to close case' });
    }
  }
);

// Delete case (Admin only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.case.delete({
      where: { id: req.params.id }
    });

    io.emit('case:deleted', { id: req.params.id });

    res.json({ message: 'Case deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Case not found' });
    }
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

export default router;
