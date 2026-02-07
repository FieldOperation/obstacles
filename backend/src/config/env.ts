import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // CORS
  CORS_ORIGIN: string;
  
  // File Upload
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  
  // Sentry (optional)
  SENTRY_DSN?: string;
  
  // API URLs (for production)
  API_BASE_URL?: string;
  FRONTEND_URL?: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

function validateEnv(): EnvConfig {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
  
  // Validate JWT_SECRET strength in production
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long in production. ' +
        'Generate a strong secret using: openssl rand -base64 32'
      );
    }
    if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error(
        'JWT_SECRET must be changed from the default value in production!'
      );
    }
  }
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    CORS_ORIGIN: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    SENTRY_DSN: process.env.SENTRY_DSN,
    API_BASE_URL: process.env.API_BASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };
}

export const env = validateEnv();
