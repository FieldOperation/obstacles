import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all roads (optionally filtered by zone)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.query;

    const where: any = {};
    if (zoneId) where.zoneId = zoneId;

    const roads = await prisma.road.findMany({
      where,
      include: {
        zone: true,
        _count: {
          select: {
            cases: true
          }
        }
      },
      orderBy: [
        { zone: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({ roads });
  } catch (error: any) {
    console.error('Get roads error:', error);
    res.status(500).json({ error: 'Failed to fetch roads' });
  }
});

// Get roads by zone
router.get('/zone/:zoneId', async (req: AuthRequest, res) => {
  try {
    const roads = await prisma.road.findMany({
      where: { zoneId: req.params.zoneId },
      include: {
        _count: {
          select: {
            cases: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ roads });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch roads' });
  }
});

// Get road by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const road = await prisma.road.findUnique({
      where: { id: req.params.id },
      include: {
        zone: true,
        _count: {
          select: {
            cases: true
          }
        }
      }
    });

    if (!road) {
      return res.status(404).json({ error: 'Road not found' });
    }

    res.json({ road });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch road' });
  }
});

// Create road (Admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('zoneId').isUUID()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, zoneId } = req.body;

      // Verify zone exists
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId }
      });

      if (!zone) {
        return res.status(404).json({ error: 'Zone not found' });
      }

      // Check if road exists in this zone
      const existingRoad = await prisma.road.findUnique({
        where: {
          name_zoneId: {
            name,
            zoneId
          }
        }
      });

      if (existingRoad) {
        return res.status(400).json({ error: 'Road already exists in this zone' });
      }

      const road = await prisma.road.create({
        data: {
          name,
          zoneId
        },
        include: {
          zone: true
        }
      });

      res.status(201).json({ road });
    } catch (error: any) {
      console.error('Create road error:', error);
      res.status(500).json({ error: 'Failed to create road' });
    }
  }
);

// Update road (Admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('zoneId').optional().isUUID()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, zoneId } = req.body;
      const updateData: any = {};

      if (name) updateData.name = name;
      if (zoneId) {
        // Verify zone exists
        const zone = await prisma.zone.findUnique({
          where: { id: zoneId }
        });

        if (!zone) {
          return res.status(404).json({ error: 'Zone not found' });
        }

        updateData.zoneId = zoneId;
      }

      const road = await prisma.road.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          zone: true
        }
      });

      res.json({ road });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Road not found' });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Road name already exists in this zone' });
      }
      console.error('Update road error:', error);
      res.status(500).json({ error: 'Failed to update road' });
    }
  }
);

// Delete road (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.road.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Road deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Road not found' });
    }
    console.error('Delete road error:', error);
    res.status(500).json({ error: 'Failed to delete road' });
  }
});

export default router;
