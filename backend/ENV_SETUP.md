# Backend Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
# For Supabase: Use the connection pooler URL
# Format: postgresql://postgres.USERNAME:PASSWORD@REGION.pooler.supabase.com:5432/postgres
# Note: URL encode special characters in password (@ becomes %40)
DATABASE_URL="postgresql://postgres:password@localhost:5432/obstacles_db"

# JWT Authentication
# IMPORTANT: Generate a strong secret for production using: openssl rand -base64 32
# Must be at least 32 characters long in production
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
# For production, use your frontend domain(s), comma-separated for multiple origins
# Example: CORS_ORIGIN="https://app.example.com,https://www.example.com"
CORS_ORIGIN="http://localhost:3000"

# Frontend URL (for production)
# Used for Socket.IO and CORS configuration
FRONTEND_URL="http://localhost:3000"

# API Base URL (for production)
# Used for generating absolute URLs in responses
API_BASE_URL="http://localhost:3001"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
# 10485760 = 10MB in bytes

# Sentry Error Tracking (Optional)
# Get your DSN from https://sentry.io
# SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Logging
LOG_LEVEL="info"
# Options: error, warn, info, verbose, debug, silly
```

## Quick Setup

### Development

1. Copy the configuration above into `backend/.env`
2. Update `DATABASE_URL` with your database connection string
3. Update `JWT_SECRET` (can use placeholder for development)
4. Run: `npm run dev`

### Production

1. Generate a strong JWT secret:
   ```bash
   openssl rand -base64 32
   ```

2. Create `backend/.env` with production values:
   - Strong `JWT_SECRET` (32+ characters)
   - Production `DATABASE_URL`
   - Production `CORS_ORIGIN` (your frontend domain)
   - `NODE_ENV=production`
   - Production `FRONTEND_URL` and `API_BASE_URL`

3. The application will validate all required variables on startup.

## Validation

The application validates environment variables on startup. If any required variables are missing or invalid, the server will not start and will display an error message.

### Production Validation

In production mode (`NODE_ENV=production`), additional validations:
- `JWT_SECRET` must be at least 32 characters
- `JWT_SECRET` cannot be the default placeholder value
