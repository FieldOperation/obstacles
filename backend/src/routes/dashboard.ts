import express from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient, CaseStatus, CaseType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get(
  '/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('zoneId').optional().isUUID(),
    query('roadId').optional().isUUID(),
    query('developerId').optional().isUUID(),
    query('type').optional().isIn(['OBSTACLE', 'DAMAGE'])
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        startDate,
        endDate,
        zoneId,
        roadId,
        developerId,
        type
      } = req.query;

      // Build where clause
      const where: any = {};

      // Apply role-based filtering
      if (req.user?.role === 'WORKER' && req.user.zoneId) {
        where.zoneId = req.user.zoneId;
      } else if (req.user?.role === 'WORKER' && !req.user.zoneId) {
        where.createdById = req.user.id;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      if (zoneId) where.zoneId = zoneId;
      if (roadId) where.roadId = roadId;
      if (developerId) where.developerId = developerId;
      if (type) where.type = type as CaseType;

      // Get statistics - batch queries to avoid connection pool exhaustion
      // First, get all cases data in fewer queries
      const allCases = await prisma.case.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          zoneId: true,
          roadId: true,
          developerId: true,
          createdAt: true,
          closedAt: true
        }
      });

      // Calculate statistics from in-memory data
      const totalCases = allCases.length;
      const openCases = allCases.filter(c => c.status === 'OPEN').length;
      const closedCases = allCases.filter(c => c.status === 'CLOSED').length;

      // Get zone and road names in parallel
      const [zones, roads, developers] = await Promise.all([
        prisma.zone.findMany({ select: { id: true, name: true } }),
        prisma.road.findMany({ 
          include: { zone: { select: { name: true } } }
        }),
        prisma.developer.findMany({ select: { id: true, name: true } })
      ]);

      // Calculate grouped statistics
      const casesByZone = Object.entries(
        allCases.reduce((acc, c) => {
          acc[c.zoneId] = (acc[c.zoneId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([zoneId, count]) => ({
        zoneId,
        zoneName: zones.find(z => z.id === zoneId)?.name || 'Unknown',
        count
      }));

      const casesByRoad = Object.entries(
        allCases.reduce((acc, c) => {
          acc[c.roadId] = (acc[c.roadId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([roadId, count]) => {
        const road = roads.find(r => r.id === roadId);
        return {
          roadId,
          roadName: road?.name || 'Unknown',
          zoneName: road?.zone?.name || 'Unknown',
          count
        };
      });

      const casesByDeveloper = Object.entries(
        allCases
          .filter(c => c.developerId)
          .reduce((acc, c) => {
            acc[c.developerId!] = (acc[c.developerId!] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      ).map(([developerId, count]) => ({
        developerId,
        developerName: developers.find(d => d.id === developerId)?.name || 'Unknown',
        count
      }));

      const casesByType = Object.entries(
        allCases.reduce((acc, c) => {
          acc[c.type] = (acc[c.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({
        type: type as CaseType,
        count
      }));

      // Calculate average resolution time
      const closedCasesWithTime = allCases.filter(c => c.status === 'CLOSED' && c.closedAt);
      const averageResolutionTime = closedCasesWithTime.length > 0
        ? closedCasesWithTime.reduce((sum, c) => {
            if (c.closedAt) {
              return sum + (c.closedAt.getTime() - c.createdAt.getTime());
            }
            return sum;
          }, 0) / closedCasesWithTime.length / (1000 * 60 * 60)
        : null;

      // Cases over time
      const startDateFilter = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const filteredCases = allCases.filter(c => c.createdAt >= startDateFilter);
      const casesOverTime = Object.entries(
        filteredCases.reduce((acc, c) => {
          const date = c.createdAt.toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { created: 0, closed: 0, obstacle: 0, damage: 0 };
          }
          acc[date].created++;
          if (c.status === 'CLOSED') acc[date].closed++;
          if (c.type === 'OBSTACLE') acc[date].obstacle++;
          if (c.type === 'DAMAGE') acc[date].damage++;
          return acc;
        }, {} as Record<string, { created: number; closed: number; obstacle: number; damage: number }>)
      ).map(([date, counts]) => ({
        date,
        ...counts
      }));

      res.json({
        totalCases,
        openCases,
        closedCases,
        casesByZone,
        casesByRoad,
        casesByDeveloper,
        casesByType,
        averageResolutionTimeHours: averageResolutionTime,
        casesOverTime
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard statistics',
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  }
);

export default router;
