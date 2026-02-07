import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

// Initialize Sentry before anything else
import { initSentry } from './config/sentry';
initSentry();

// Import configuration
import { env } from './config/env';
import { logger } from './config/logger';

// Import middleware
import { securityHeaders, compressionMiddleware, apiLimiter, authLimiter, uploadLimiter } from './middleware/security';
import { httpLogger } from './middleware/morgan';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import caseRoutes from './routes/cases';
import zoneRoutes from './routes/zones';
import roadRoutes from './routes/roads';
import developerRoutes from './routes/developers';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import { authenticateToken } from './middleware/auth';
import { setupSocketIO } from './socket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN || (env.NODE_ENV === 'production' ? env.FRONTEND_URL : 'http://localhost:3000'),
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Ensure upload directory exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Security middleware (must be first)
app.use(securityHeaders);
app.use(compressionMiddleware);

// CORS configuration
const corsOptions = {
  origin: env.NODE_ENV === 'production' 
    ? (env.FRONTEND_URL ? [env.FRONTEND_URL] : env.CORS_ORIGIN.split(',').map(o => o.trim()))
    : env.CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: `${env.MAX_FILE_SIZE}b` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_FILE_SIZE}b` }));

// HTTP request logging
app.use(httpLogger);

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Enhanced health check
app.get('/health', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'connected',
    });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: 'disconnected',
      error: env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/zones', authenticateToken, zoneRoutes);
app.use('/api/roads', authenticateToken, roadRoutes);
app.use('/api/developers', authenticateToken, developerRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

httpServer.listen(env.PORT, () => {
  logger.info('Server started', {
    port: env.PORT,
    environment: env.NODE_ENV,
    uploadDir: path.resolve(env.UPLOAD_DIR),
  });
  
  if (env.NODE_ENV === 'development') {
    console.log(`🚀 Server running on port ${env.PORT}`);
    console.log(`📁 Upload directory: ${path.resolve(env.UPLOAD_DIR)}`);
  }
});

export { io };
