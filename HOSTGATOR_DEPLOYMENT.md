# HostGator Deployment Guide

## ⚠️ Important: HostGator Compatibility Assessment

**Your system is NOT fully ready for HostGator shared hosting.** Here's why and what you need to know:

### HostGator Limitations

1. **Node.js Support:**
   - ❌ **Shared Hosting**: Limited or no Node.js support (PHP-focused)
   - ✅ **VPS/Dedicated**: Full Node.js support available
   - ⚠️ **Node.js Selector** (if available): May work but with restrictions

2. **Database:**
   - ❌ HostGator provides **MySQL**, not **PostgreSQL**
   - ✅ You're using **Supabase** (cloud PostgreSQL) - This works! ✅

3. **Socket.IO:**
   - ❌ Shared hosting typically doesn't support persistent WebSocket connections
   - ⚠️ May work on VPS but requires proper configuration

4. **File Storage:**
   - ⚠️ Local filesystem on shared hosting has limitations
   - ✅ Better to use cloud storage (AWS S3, Cloudinary)

## ✅ What CAN Be Deployed to HostGator

### Option 1: Frontend Only (Static Files) ✅

The React frontend can be deployed as static files to HostGator shared hosting:

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload `frontend/dist/` folder** to HostGator via:
   - cPanel File Manager
   - FTP client
   - Upload to `public_html/` or your domain folder

3. **Configure API URL:**
   - The frontend will need to connect to your backend API
   - Backend must be hosted elsewhere (see options below)

### Option 2: Full Deployment (VPS/Dedicated) ✅

If you have HostGator VPS or Dedicated server:

✅ **This will work!** Follow the standard deployment guide.

## 🚀 Recommended Deployment Strategy

### Best Option: Hybrid Deployment

**Frontend → HostGator (Static Files)**  
**Backend → Railway/Render (Node.js)**  
**Database → Supabase (Already set up! ✅)**

### Why This Works:

1. ✅ Frontend is just static HTML/CSS/JS files (works on any hosting)
2. ✅ Backend needs Node.js (Railway/Render are perfect for this)
3. ✅ Database is already in Supabase cloud - no database hosting needed! ✅
4. ✅ Simple architecture, easy to maintain

### Recommended Backend Hosting Options:

1. **Railway** (Recommended) - Easy Node.js deployment
   - Free tier available
   - Automatic deployments
   - PostgreSQL support

2. **Render** - Similar to Railway
   - Free tier available
   - Easy setup

3. **Heroku** - Classic choice
   - Paid plans
   - Very reliable

4. **DigitalOcean App Platform**
   - Good performance
   - Reasonable pricing

5. **AWS EC2 / Lightsail**
   - Full control
   - More setup required

## 📋 Step-by-Step: Deploy Frontend to HostGator

### Step 1: Build Frontend

```bash
cd frontend

# Create production environment file
echo "VITE_API_BASE_URL=https://your-backend-api.com/api" > .env.production

# Build
npm run build
```

### Step 2: Upload to HostGator

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to `public_html/`** (or your domain folder)
4. **Upload all files from `frontend/dist/`**
   - Select all files in `dist/` folder
   - Upload to `public_html/`

### Step 3: Configure .htaccess (for React Router)

Create `.htaccess` in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 4: Update API URL

Make sure your frontend `.env.production` has the correct backend API URL:

```env
VITE_API_BASE_URL=https://your-backend-api.railway.app/api
```

## 🚀 Step-by-Step: Deploy Backend to Railway (Recommended)

### Step 1: Prepare Backend

```bash
cd backend

# Create .env file
# Copy from ENV_SETUP.md and configure:
# - DATABASE_URL (your Supabase URL - already have this!)
# - JWT_SECRET (generate: openssl rand -base64 32)
# - CORS_ORIGIN (your HostGator domain)
# - FRONTEND_URL (your HostGator domain)
# - API_BASE_URL (will be your Railway URL)
```

### Step 2: Deploy to Railway

1. **Sign up at railway.app**
2. **Create New Project**
3. **Deploy from GitHub** (connect your repo)
   - Or deploy from local folder
4. **Set Environment Variables** in Railway dashboard:
   ```
   DATABASE_URL=your-supabase-url
   JWT_SECRET=your-generated-secret
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   PORT=3001
   ```
5. **Railway will automatically:**
   - Install dependencies
   - Build the project
   - Start the server
   - Provide a URL (e.g., `https://your-app.railway.app`)

### Step 3: Update Frontend API URL

Update `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://your-app.railway.app/api
```

Rebuild and re-upload frontend to HostGator.

## 🔧 Alternative: If You Have HostGator VPS

If you have HostGator VPS or Dedicated server, you can deploy everything there:

### Prerequisites:
- SSH access
- Node.js 18+ installed
- PM2 or systemd for process management

### Steps:

1. **SSH into your server**
2. **Clone your repository**
3. **Install dependencies:**
   ```bash
   cd backend
   npm install
   npm run build
   ```
4. **Configure environment variables** (create `.env` file)
5. **Set up PM2:**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name obstacles-api
   pm2 save
   pm2 startup
   ```
6. **Configure Nginx** (if available) or use port forwarding
7. **Deploy frontend** to `public_html/`

## ⚠️ Important Considerations

### Socket.IO on HostGator

Socket.IO may not work on shared hosting due to:
- WebSocket restrictions
- Long-running process limitations

**Solution:** 
- Use polling fallback (already configured in your code)
- Or disable real-time features if not critical
- Or use a separate service for Socket.IO (Socket.IO Cloud)

### File Uploads

**Current:** Local filesystem (won't work well on shared hosting)

**Recommended:** Use cloud storage:
- AWS S3
- Cloudinary
- Supabase Storage (if using Supabase)

## ✅ Quick Checklist

Before deploying:

- [ ] **Backend:** Deploy to Railway/Render/Heroku
- [ ] **Frontend:** Build and upload to HostGator
- [ ] **Database:** Supabase (already configured ✅)
- [ ] **JWT Secret:** Generated and configured
- [ ] **CORS:** Configured for your HostGator domain
- [ ] **API URLs:** Updated in frontend
- [ ] **SSL:** Enabled on both HostGator and backend hosting
- [ ] **File Storage:** Consider moving to cloud storage

## 🎯 Recommended Architecture

```
┌─────────────────┐
│   HostGator     │
│  (Static Files) │
│   Frontend App   │
└────────┬────────┘
         │ HTTPS
         │ API Calls
         ▼
┌─────────────────┐
│    Railway      │
│  (Node.js API)  │
│   Backend App   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│  (PostgreSQL)    │
│    Database     │
└─────────────────┘
```

## 📞 Next Steps

1. **Choose backend hosting** (Railway recommended)
2. **Deploy backend** first
3. **Get backend URL**
4. **Update frontend** with backend URL
5. **Build and deploy frontend** to HostGator
6. **Test everything**

## 🆘 Need Help?

If you encounter issues:
1. Check backend logs (Railway dashboard)
2. Check frontend console (browser dev tools)
3. Verify CORS settings
4. Verify API URLs are correct
5. Check SSL certificates are valid

---

**Summary:** Your system is ready, but HostGator shared hosting won't work for the backend. Deploy frontend to HostGator and backend to Railway/Render for best results!
