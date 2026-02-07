import morgan from 'morgan';
import { morganStream } from '../config/logger';

// HTTP request logger middleware
export const httpLogger = morgan(
  process.env.NODE_ENV === 'production' 
    ? 'combined' // Apache combined log format for production
    : 'dev', // Colored output for development
  {
    stream: morganStream,
    skip: (req, res) => {
      // Skip logging for health checks in production
      return process.env.NODE_ENV === 'production' && req.path === '/health';
    },
  }
);
