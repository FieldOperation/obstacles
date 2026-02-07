# Production Deployment Guide

This guide will help you deploy the Obstacles Case Management System to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ database (or Supabase)
- Domain name with SSL certificate
- Server/hosting provider (AWS, DigitalOcean, Heroku, etc.)

## Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install mobile dependencies (if building mobile app)
cd ../mobile
npm install
```

## Step 2: Backend Configuration

### 2.1 Environment Variables

Create `backend/.env` file:

```bash
cd backend
cp .env.example .env
# Edit .env with your production values
```

**Required Environment Variables:**

```env
# Database - Use production database URL
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT - Generate a strong secret (32+ characters)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-generated-secret-here-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=production

# CORS - Your frontend domain(s), comma-separated
CORS_ORIGIN="https://app.yourdomain.com,https://www.yourdomain.com"

# Frontend URL
FRONTEND_URL="https://app.yourdomain.com"

# API Base URL
API_BASE_URL="https://api.yourdomain.com"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Sentry (Optional but recommended)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Logging
LOG_LEVEL="info"
```

### 2.2 Generate JWT Secret

```bash
# Generate a strong JWT secret
openssl rand -base64 32
```

Copy the output to `JWT_SECRET` in your `.env` file.

### 2.3 Database Setup

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

### 2.4 Build Backend

```bash
cd backend
npm run build
```

## Step 3: Frontend Configuration

### 3.1 Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 3.2 Build Frontend

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/` directory.

### 3.3 Deploy Frontend

You can deploy the `dist/` folder to:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your repository
- **AWS S3 + CloudFront**: Upload to S3, configure CloudFront
- **Nginx**: Serve the `dist` folder

**Nginx Configuration Example:**

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    
    root /var/www/obstacles-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 4: Backend Deployment

### Option A: Using PM2 (Recommended for VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Start the backend
cd backend
pm2 start dist/index.js --name obstacles-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option B: Using Docker

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t obstacles-api .
docker run -d \
  --name obstacles-api \
  -p 3001:3001 \
  --env-file .env \
  obstacles-api
```

### Option C: Using Systemd (Linux)

Create `/etc/systemd/system/obstacles-api.service`:

```ini
[Unit]
Description=Obstacles API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/obstacles-backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable obstacles-api
sudo systemctl start obstacles-api
```

### Nginx Reverse Proxy for Backend

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 5: SSL Certificate

Use Let's Encrypt (free SSL):

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Step 6: Mobile App Configuration

### 6.1 Environment Variables

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 6.2 Update app.json

Add to `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api"
    }
  }
}
```

### 6.3 Build Mobile App

```bash
cd mobile

# For Android
eas build --platform android

# For iOS
eas build --platform ios
```

## Step 7: File Storage (Production)

For production, you should use cloud storage instead of local filesystem:

### Option A: AWS S3

1. Create S3 bucket
2. Install AWS SDK: `npm install aws-sdk @aws-sdk/client-s3`
3. Update file upload logic to use S3

### Option B: Cloudinary

1. Create Cloudinary account
2. Install: `npm install cloudinary`
3. Update file upload logic

### Option C: Supabase Storage

If using Supabase, use Supabase Storage for file uploads.

## Step 8: Monitoring & Logs

### View Logs

```bash
# PM2 logs
pm2 logs obstacles-api

# Systemd logs
sudo journalctl -u obstacles-api -f

# Application logs
tail -f backend/logs/combined-*.log
tail -f backend/logs/error-*.log
```

### Health Check

Test the health endpoint:

```bash
curl https://api.yourdomain.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-02-07T...",
  "environment": "production",
  "database": "connected"
}
```

## Step 9: Security Checklist

- [ ] Strong JWT_SECRET configured (32+ characters)
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (default: 100 req/15min)
- [ ] Security headers enabled (Helmet.js)
- [ ] Environment variables secured (not in git)
- [ ] Database credentials secured
- [ ] File uploads moved to cloud storage
- [ ] Sentry error tracking configured
- [ ] Logs are being monitored
- [ ] Firewall configured (only necessary ports open)

## Step 10: Post-Deployment

1. **Test all endpoints** - Verify API is working
2. **Test authentication** - Login/logout flow
3. **Test file uploads** - Verify file storage
4. **Monitor logs** - Check for errors
5. **Set up backups** - Database backups
6. **Set up alerts** - Uptime monitoring

## Troubleshooting

### Backend won't start
- Check environment variables are set
- Verify database connection
- Check logs: `pm2 logs` or `journalctl -u obstacles-api`

### CORS errors
- Verify CORS_ORIGIN includes your frontend domain
- Check browser console for exact error
- Ensure frontend is using correct API URL

### Database connection failed
- Verify DATABASE_URL is correct
- Check database is accessible from server
- Test connection: `npx prisma db pull`

### File uploads not working
- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE is sufficient
- Check file permissions

## Support

For issues, check:
- Backend logs: `backend/logs/`
- PM2 status: `pm2 status`
- System logs: `journalctl -u obstacles-api`
- Sentry dashboard (if configured)
