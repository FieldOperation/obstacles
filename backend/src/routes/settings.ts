import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const LOGO_UPLOAD_DIR = path.join(UPLOAD_DIR, 'logos');

// Ensure logo upload directory exists
if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
}

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, LOGO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const logoType = req.body.logoType || 'logo';
    cb(null, `${logoType}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default for logos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get system settings (including logos)
router.get('/', async (req: AuthRequest, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: {}
      });
    }

    // Build full URLs for logos
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const settingsWithUrls = {
      ...settings,
      contractorLogoUrl: settings.contractorLogo 
        ? `${baseUrl}/uploads/logos/${settings.contractorLogo}` 
        : null,
      ownerLogoUrl: settings.ownerLogo 
        ? `${baseUrl}/uploads/logos/${settings.ownerLogo}` 
        : null
    };

    res.json({ settings: settingsWithUrls });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Upload contractor logo
router.post(
  '/contractor-logo',
  requireAdmin,
  upload.single('logo'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get or create settings
      let settings = await prisma.systemSettings.findFirst();
      
      // Delete old logo if exists
      if (settings?.contractorLogo) {
        const oldLogoPath = path.join(LOGO_UPLOAD_DIR, settings.contractorLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: {
            contractorLogo: req.file.filename,
            updatedBy: req.user!.id
          }
        });
      } else {
        settings = await prisma.systemSettings.update({
          where: { id: settings.id },
          data: {
            contractorLogo: req.file.filename,
            updatedBy: req.user!.id
          }
        });
      }

      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      res.json({
        message: 'Contractor logo uploaded successfully',
        logoUrl: `${baseUrl}/uploads/logos/${req.file.filename}`
      });
    } catch (error: any) {
      console.error('Upload contractor logo error:', error);
      res.status(500).json({ error: 'Failed to upload contractor logo' });
    }
  }
);

// Upload owner logo
router.post(
  '/owner-logo',
  requireAdmin,
  upload.single('logo'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get or create settings
      let settings = await prisma.systemSettings.findFirst();
      
      // Delete old logo if exists
      if (settings?.ownerLogo) {
        const oldLogoPath = path.join(LOGO_UPLOAD_DIR, settings.ownerLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      if (!settings) {
        settings = await prisma.systemSettings.create({
          data: {
            ownerLogo: req.file.filename,
            updatedBy: req.user!.id
          }
        });
      } else {
        settings = await prisma.systemSettings.update({
          where: { id: settings.id },
          data: {
            ownerLogo: req.file.filename,
            updatedBy: req.user!.id
          }
        });
      }

      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      res.json({
        message: 'Owner logo uploaded successfully',
        logoUrl: `${baseUrl}/uploads/logos/${req.file.filename}`
      });
    } catch (error: any) {
      console.error('Upload owner logo error:', error);
      res.status(500).json({ error: 'Failed to upload owner logo' });
    }
  }
);

// Delete contractor logo
router.delete('/contractor-logo', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (settings?.contractorLogo) {
      const logoPath = path.join(LOGO_UPLOAD_DIR, settings.contractorLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          contractorLogo: null,
          updatedBy: req.user!.id
        }
      });
    }

    res.json({ message: 'Contractor logo deleted successfully' });
  } catch (error: any) {
    console.error('Delete contractor logo error:', error);
    res.status(500).json({ error: 'Failed to delete contractor logo' });
  }
});

// Delete owner logo
router.delete('/owner-logo', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (settings?.ownerLogo) {
      const logoPath = path.join(LOGO_UPLOAD_DIR, settings.ownerLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ownerLogo: null,
          updatedBy: req.user!.id
        }
      });
    }

    res.json({ message: 'Owner logo deleted successfully' });
  } catch (error: any) {
    console.error('Delete owner logo error:', error);
    res.status(500).json({ error: 'Failed to delete owner logo' });
  }
});

export default router;
