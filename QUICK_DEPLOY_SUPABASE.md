# Quick Deploy: Supabase Setup

## ✅ You're Using Supabase - Perfect!

Since you're using Supabase, deployment is simple:

1. **Database**: ✅ Already in Supabase cloud
2. **Backend**: Deploy to Railway (5 minutes)
3. **Frontend**: Upload to HostGator (5 minutes)

## 🚀 Quick Steps

### 1. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Create new project → Deploy from GitHub
3. Set root directory to `backend`
4. Add environment variables:
   ```
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=generate-32-char-secret
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```
5. Railway gives you a URL like `https://your-app.railway.app`

### 2. Deploy Frontend to HostGator

1. Build frontend:
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://your-app.railway.app/api" > .env.production
   npm run build
   ```

2. Upload `frontend/dist/*` to HostGator `public_html/`

3. Create `.htaccess` in `public_html/`:
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

### 3. Done! 🎉

- Frontend: `https://yourdomain.com`
- Backend: `https://your-app.railway.app`
- Database: Supabase (already working)

## 📚 Full Guide

See **DEPLOY_WITH_SUPABASE.md** for detailed instructions.
