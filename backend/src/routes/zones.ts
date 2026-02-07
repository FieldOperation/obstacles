import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all zones
router.get('/', async (req: AuthRequest, res) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: {
            roads: true,
            cases: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ zones });
  } catch (error: any) {
    console.error('Get zones error:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// Get zone by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: req.params.id },
      include: {
        roads: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            cases: true,
            users: true
          }
        }
      }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ zone });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch zone' });
  }
});

// Create zone (Admin only)
router.post(
  '/',
  requireAdmin,
  [body('name').trim().notEmpty()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;

      // Check if zone exists
      const existingZone = await prisma.zone.findUnique({
        where: { name }
      });

      if (existingZone) {
        return res.status(400).json({ error: 'Zone already exists' });
      }

      const zone = await prisma.zone.create({
        data: { name }
      });

      res.status(201).json({ zone });
    } catch (error: any) {
      console.error('Create zone error:', error);
      res.status(500).json({ error: 'Failed to create zone' });
    }
  }
);

// Update zone (Admin only)
router.put(
  '/:id',
  requireAdmin,
  [body('name').trim().notEmpty()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;

      const zone = await prisma.zone.update({
        where: { id: req.params.id },
        data: { name }
      });

      res.json({ zone });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Zone not found' });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Zone name already exists' });
      }
      console.error('Update zone error:', error);
      res.status(500).json({ error: 'Failed to update zone' });
    }
  }
);

// Delete zone (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.zone.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Zone deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Zone not found' });
    }
    console.error('Delete zone error:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
});

export default router;
