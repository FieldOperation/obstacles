import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check if user can access a zone (admin or zone-scoped access)
export const canAccessZone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admins have access to all zones
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Workers and Others can only access their assigned zone
  const zoneId = req.params.zoneId || req.body.zoneId || req.query.zoneId;
  
  if (zoneId && req.user.zoneId !== zoneId) {
    return res.status(403).json({ error: 'Access denied to this zone' });
  }

  next();
};

// Check if user can modify a case
export const canModifyCase = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const caseId = req.params.id || req.params.caseId;

  if (!caseId) {
    return next();
  }

  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { createdById: true, zoneId: true }
    });

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Admins can modify any case
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Workers can only modify their own cases or cases in their zone
    if (req.user.role === 'WORKER') {
      // Worker can modify if they created it
      if (caseRecord.createdById === req.user.id) {
        return next();
      }
      // Worker can modify if case is in their zone (both must have zoneId and they must match)
      if (req.user.zoneId && caseRecord.zoneId && caseRecord.zoneId === req.user.zoneId) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Insufficient permissions to modify this case' });
  } catch (error: any) {
    console.error('canModifyCase error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Error checking permissions', details: error.message });
  }
};
