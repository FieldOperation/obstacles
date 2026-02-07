import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { role, zoneId, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (role) where.role = role;
    if (zoneId) where.zoneId = zoneId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          zoneId: true,
          zone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        zoneId: true,
        zone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (Admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['ADMIN', 'WORKER', 'OTHERS']),
    body('zoneId').optional().isUUID()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, zoneId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          zoneId: zoneId || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          zoneId: true,
          zone: true,
          createdAt: true
        }
      });

      res.status(201).json({ user });
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Update user (Admin only)
router.put(
  '/:id',
  requireAdmin,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('name').optional().trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'WORKER', 'OTHERS']),
    body('zoneId')
      .optional({ checkFalsy: true })
      .custom((value) => {
        if (!value || value === '') return true;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return true;
        throw new Error('zoneId must be a valid UUID');
      })
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, zoneId } = req.body;
      const updateData: any = {};

      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (zoneId !== undefined) updateData.zoneId = zoneId || null;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          zoneId: true,
          zone: true,
          updatedAt: true
        }
      });

      res.json({ user });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
