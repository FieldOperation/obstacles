# Railway Environment Variables - Copy & Paste

Use these exact variable names and values when setting up Railway.

## Required Variables (Copy these to Railway)

### 1. DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### 2. JWT_SECRET
```
Name: JWT_SECRET
Value: [Generate using: openssl rand -base64 32]
```
**Important**: Must be 32+ characters. Generate a new one for production!

### 3. NODE_ENV
```
Name: NODE_ENV
Value: production
```

### 4. PORT
```
Name: PORT
Value: 3001
```

### 5. JWT_EXPIRES_IN
```
Name: JWT_EXPIRES_IN
Value: 7d
```

### 6. CORS_ORIGIN
```
Name: CORS_ORIGIN
Value: https://yourdomain.com
```
Replace `yourdomain.com` with your actual HostGator domain.

### 7. FRONTEND_URL
```
Name: FRONTEND_URL
Value: https://yourdomain.com
```
Same as CORS_ORIGIN.

### 8. UPLOAD_DIR
```
Name: UPLOAD_DIR
Value: ./uploads
```

### 9. MAX_FILE_SIZE
```
Name: MAX_FILE_SIZE
Value: 10485760
```

### 10. API_BASE_URL (Add After Getting Railway URL)
```
Name: API_BASE_URL
Value: https://your-app-production.up.railway.app
```
Replace with your actual Railway URL (get this after deployment).

## Quick Copy Template

When adding variables in Railway, use this format:

```
DATABASE_URL=postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-generated-secret-here-minimum-32-characters
NODE_ENV=production
PORT=3001
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

Then add `API_BASE_URL` after you get your Railway URL.

## Testing Values (If You Don't Have Domain Yet)

If you're testing before setting up your domain:

```
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

Update these later when you have your domain.
