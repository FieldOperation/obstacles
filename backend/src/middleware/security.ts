import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", env.API_BASE_URL || '*'],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Socket.IO
});

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9)
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 5 : 20, // Limit each IP to 5 login attempts per windowMs in production
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 50 : 200, // Limit each IP to 50 uploads per hour in production
  message: {
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request size limiter middleware
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = env.MAX_FILE_SIZE;
    if (size > maxSize) {
      return res.status(413).json({
        error: `Request entity too large. Maximum size is ${maxSize} bytes.`,
      });
    }
  }
  next();
};
