# Deployment Guide: Supabase + HostGator

## ✅ Perfect Setup!

Since you're using **Supabase** for your database, deployment is much simpler:

- ✅ **Database**: Already in the cloud (Supabase)
- ✅ **Backend**: Deploy to Railway/Render (Node.js hosting)
- ✅ **Frontend**: Deploy to HostGator (static files)

## 🎯 Deployment Architecture

```
┌─────────────────┐
│   HostGator     │  ← Frontend (React static files)
│  (Static Host)  │
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────┐
│  Railway/Render │  ← Backend (Node.js API)
│  (Node.js Host) │
└────────┬────────┘
         │ Database Queries
         ▼
┌─────────────────┐
│    Supabase     │  ← Database (Already set up! ✅)
│  (PostgreSQL)   │
└─────────────────┘
```

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [x] Supabase database is set up ✅ (You have this!)
- [ ] Backend migrations run on Supabase
- [ ] Strong JWT_SECRET generated
- [ ] Production URLs configured
- [ ] Frontend built for production

## 🚀 Step 1: Prepare Supabase Database

### 1.1 Run Migrations on Supabase

Your database is already connected. Just ensure migrations are applied:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Apply migrations to Supabase
npx prisma migrate deploy
```

This will create all tables in your Supabase database.

### 1.2 (Optional) Seed Initial Data

```bash
npx prisma db seed
```

### 1.3 Verify in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Verify tables are created: `User`, `Case`, `Zone`, `Road`, `Developer`, etc.

## 🚀 Step 2: Deploy Backend to Railway (Recommended)

### Why Railway?
- ✅ Free tier available ($5/month after free credits)
- ✅ Automatic deployments from GitHub
- ✅ Easy environment variable setup
- ✅ Automatic SSL certificates
- ✅ Works perfectly with Supabase

### 2.1 Prepare Backend

```bash
cd backend

# Generate JWT secret
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use online tool: https://generate-secret.vercel.app/32
```

### 2.2 Deploy to Railway

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or "Empty Project" to deploy manually)

3. **Connect Repository**
   - Authorize Railway to access your GitHub
   - Select your `obstacles` repository
   - Railway will detect it's a Node.js project

4. **Configure Settings**
   - **Root Directory**: Set to `backend`
   - **Build Command**: `npm run build` (or Railway auto-detects)
   - **Start Command**: `npm start`

5. **Set Environment Variables**

   In Railway dashboard, go to **Variables** tab and add:

   ```env
   # Database - Your Supabase connection string
   DATABASE_URL=postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   
   # JWT - Your generated secret (32+ characters)
   JWT_SECRET=your-generated-secret-here-minimum-32-characters
   JWT_EXPIRES_IN=7d
   
   # Server
   NODE_ENV=production
   PORT=3001
   
   # CORS - Your HostGator domain
   CORS_ORIGIN=https://yourdomain.com
   
   # Frontend URL
   FRONTEND_URL=https://yourdomain.com
   
   # API Base URL (Railway will provide this after deployment)
   # Set this AFTER you get your Railway URL
   API_BASE_URL=https://your-app.railway.app
   
   # File Upload
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   ```

6. **Deploy**
   - Railway will automatically:
     - Install dependencies
     - Run `npm run build`
     - Start the server
   - Wait for deployment to complete (~2-3 minutes)

7. **Get Your Backend URL**
   - Railway provides a URL like: `https://your-app.railway.app`
   - Copy this URL - you'll need it for frontend

8. **Update API_BASE_URL**
   - Go back to Variables
   - Update `API_BASE_URL` with your Railway URL: `https://your-app.railway.app`

9. **Test Backend**
   ```bash
   curl https://your-app.railway.app/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "environment": "production",
     "database": "connected"
   }
   ```

## 🚀 Step 3: Deploy Frontend to HostGator

### 3.1 Build Frontend

```bash
cd frontend

# Create production environment file
# Replace with your Railway backend URL
echo "VITE_API_BASE_URL=https://your-app.railway.app/api" > .env.production

# Build for production
npm run build
```

This creates optimized files in `frontend/dist/` folder.

### 3.2 Upload to HostGator

1. **Login to HostGator cPanel**

2. **Open File Manager**
   - Navigate to `public_html/` (or your domain folder)

3. **Upload Files**
   - Select ALL files from `frontend/dist/` folder
   - Upload to `public_html/`
   - **Important**: Upload the CONTENTS of `dist/`, not the `dist` folder itself

4. **Create .htaccess File**

   In `public_html/`, create `.htaccess` file:

   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   
   # Enable compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
   </IfModule>
   
   # Cache static assets
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

5. **Verify Upload**
   - Visit your domain: `https://yourdomain.com`
   - Should see your app loading

## 🔧 Step 4: Configure CORS

Make sure your Railway backend allows requests from your HostGator domain:

1. **In Railway Dashboard** → Variables
2. **Update CORS_ORIGIN**:
   ```
   CORS_ORIGIN=https://yourdomain.com
   ```
3. **Redeploy** (Railway auto-redeploys when variables change)

## 📁 Step 5: File Uploads (Optional Enhancement)

Currently, files are stored locally on Railway. For production, consider:

### Option A: Supabase Storage (Recommended)

Supabase provides file storage. You can migrate file uploads to use Supabase Storage instead of local filesystem.

### Option B: Keep Local (Temporary)

For now, Railway's filesystem works, but files will be lost on redeploy. Use this for testing, then migrate to Supabase Storage.

## ✅ Verification Steps

### 1. Test Backend Health
```bash
curl https://your-app.railway.app/health
```

### 2. Test Frontend
- Visit: `https://yourdomain.com`
- Try logging in
- Check browser console for errors

### 3. Test API Connection
- Open browser DevTools (F12)
- Go to Network tab
- Try logging in
- Verify API calls go to: `https://your-app.railway.app/api/...`

### 4. Test Database
- Create a case
- Check Supabase dashboard → Table Editor → `Case` table
- Verify data is saved

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Railway logs
- Verify all environment variables are set
- Check JWT_SECRET is 32+ characters

**Problem**: Database connection failed
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Verify password encoding (`@` → `%40`)

**Problem**: CORS errors
- Verify CORS_ORIGIN includes your HostGator domain
- Check browser console for exact error
- Ensure frontend uses correct API URL

### Frontend Issues

**Problem**: Blank page
- Check browser console for errors
- Verify all files uploaded correctly
- Check .htaccess file exists

**Problem**: API calls fail
- Verify `VITE_API_BASE_URL` in `.env.production`
- Check CORS settings in backend
- Verify Railway backend is running

**Problem**: Routes don't work (404)
- Verify `.htaccess` file is uploaded
- Check mod_rewrite is enabled in HostGator

## 📊 Final Architecture

```
User Browser
    │
    ├─→ https://yourdomain.com (HostGator)
    │   └─→ React App (Static Files)
    │
    └─→ API Calls → https://your-app.railway.app/api
                    └─→ Node.js Backend
                        └─→ Supabase Database
```

## 🎉 You're Done!

Your system is now live:
- ✅ Frontend: `https://yourdomain.com`
- ✅ Backend: `https://your-app.railway.app`
- ✅ Database: Supabase (cloud)

## 🔄 Updates & Maintenance

### Update Backend
1. Push changes to GitHub
2. Railway auto-deploys (if connected to GitHub)
3. Or manually redeploy in Railway dashboard

### Update Frontend
1. Make changes
2. Run `npm run build`
3. Upload new `dist/` files to HostGator

### View Logs
- **Backend**: Railway dashboard → Deployments → View Logs
- **Database**: Supabase dashboard → Logs

## 💰 Cost Estimate

- **HostGator**: Your existing plan (frontend hosting)
- **Railway**: Free tier → $5/month after free credits
- **Supabase**: Free tier (500MB database, 1GB file storage)

**Total**: ~$5/month (after Railway free credits)

---

**Need help?** Check Railway logs and Supabase dashboard for detailed error messages.
