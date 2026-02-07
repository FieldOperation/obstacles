import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all developers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const developers = await prisma.developer.findMany({
      include: {
        _count: {
          select: {
            cases: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ developers });
  } catch (error: any) {
    console.error('Get developers error:', error);
    res.status(500).json({ error: 'Failed to fetch developers' });
  }
});

// Get developer by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const developer = await prisma.developer.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            cases: true
          }
        }
      }
    });

    if (!developer) {
      return res.status(404).json({ error: 'Developer not found' });
    }

    res.json({ developer });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch developer' });
  }
});

// Create developer (Admin only)
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

      // Check if developer exists
      const existingDeveloper = await prisma.developer.findUnique({
        where: { name }
      });

      if (existingDeveloper) {
        return res.status(400).json({ error: 'Developer already exists' });
      }

      const developer = await prisma.developer.create({
        data: { name }
      });

      res.status(201).json({ developer });
    } catch (error: any) {
      console.error('Create developer error:', error);
      res.status(500).json({ error: 'Failed to create developer' });
    }
  }
);

// Update developer (Admin only)
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

      const developer = await prisma.developer.update({
        where: { id: req.params.id },
        data: { name }
      });

      res.json({ developer });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Developer not found' });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Developer name already exists' });
      }
      console.error('Update developer error:', error);
      res.status(500).json({ error: 'Failed to update developer' });
    }
  }
);

// Delete developer (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.developer.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Developer deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Developer not found' });
    }
    console.error('Delete developer error:', error);
    res.status(500).json({ error: 'Failed to delete developer' });
  }
});

export default router;
