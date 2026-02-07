# Railway Deployment - Step-by-Step Guide

This guide will walk you through deploying your backend to Railway, one step at a time.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] GitHub account (free)
- [ ] Your code pushed to GitHub (or we'll help you do this)
- [ ] Supabase database connection string ready
- [ ] 15-20 minutes

## 🚀 Step 1: Prepare Your Code

### 1.1 Check Your Backend is Ready

```bash
cd backend

# Verify package.json exists and has build script
# Should see: "build": "prisma generate && tsc"
```

### 1.2 Run Migrations Locally (Optional but Recommended)

Before deploying, make sure your Supabase database has all tables:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Apply migrations to Supabase
npx prisma migrate deploy
```

This ensures your database is ready. Railway will also generate Prisma Client during build, but it's good to verify migrations work first.

### 1.3 Generate JWT Secret

You'll need a strong JWT secret (32+ characters). Let's generate one:

**Option A: Using PowerShell (Windows)**
```powershell
# Generate a secure random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option B: Using Online Tool**
1. Go to: https://generate-secret.vercel.app/32
2. Copy the generated secret
3. Save it somewhere safe (you'll need it in Step 4)

**Option C: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Save this secret** - you'll need it in Step 4!

### 1.4 Get Your Supabase Connection String

You should already have this. It looks like:
```
postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

If you need to find it:
1. Go to your Supabase project dashboard
2. Settings → Database
3. Connection Pooling → Session mode
4. Copy the connection string

## 🚀 Step 2: Push Code to GitHub (If Not Already)

### 2.1 Check if You Have a Git Repository

```bash
cd C:\Users\user\Desktop\obstacles

# Check if git is initialized
git status
```

If you see "not a git repository", continue to Step 2.2.
If you see file listings, skip to Step 2.3.

### 2.2 Initialize Git and Push to GitHub

**A. Create GitHub Repository**

1. Go to [github.com](https://github.com)
2. Click the **+** icon (top right) → **New repository**
3. Repository name: `obstacles` (or any name you like)
4. Description: "Obstacles Case Management System"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize with README" (you already have code)
7. Click **Create repository**

**B. Initialize Git Locally**

```bash
cd C:\Users\user\Desktop\obstacles

# Initialize git
git init

# Add all files
git add .

# Create .gitignore if it doesn't exist (it should already exist)
# Make sure it includes: .env, node_modules/, dist/, logs/

# Commit
git commit -m "Initial commit - ready for Railway deployment"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/obstacles.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: You'll be asked for GitHub username and password/token.

### 2.3 If Code is Already on GitHub

Just make sure your latest code is pushed:

```bash
cd C:\Users\user\Desktop\obstacles

git add .
git commit -m "Update for Railway deployment"
git push
```

## 🚀 Step 3: Sign Up for Railway

### 3.1 Go to Railway

1. Open browser: https://railway.app
2. Click **"Start a New Project"** or **"Login"**

### 3.2 Sign Up / Login

**Option A: Sign Up with GitHub (Recommended)**
1. Click **"Login with GitHub"**
2. Authorize Railway to access your GitHub
3. You're in!

**Option B: Sign Up with Email**
1. Enter your email
2. Check your email for verification
3. Create password and login

### 3.3 Complete Setup

- Railway may ask for payment info (you can skip for now - free tier available)
- You'll see the Railway dashboard

## 🚀 Step 4: Create New Project

### 4.1 Start New Project

1. In Railway dashboard, click **"New Project"** button (top right)
2. You'll see deployment options

### 4.2 Choose Deployment Method

**Option A: Deploy from GitHub (Recommended)**

1. Click **"Deploy from GitHub repo"**
2. If first time, authorize Railway to access GitHub
3. Select your repository: `obstacles` (or whatever you named it)
4. Click **"Deploy Now"**

**Option B: Deploy from Template**

1. Click **"Empty Project"**
2. We'll configure it manually

### 4.3 Configure Project Settings

After selecting your repo, Railway will:

1. **Detect it's a Node.js project** ✅
2. **Start building** (this may fail initially - that's OK!)

## 🚀 Step 5: Configure Backend Settings

### 5.1 Set Root Directory

Railway needs to know your backend is in a subfolder:

1. In your project, click on the **service** (it might be named after your repo)
2. Click **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Enter: `backend`
5. Click **"Update"**

### 5.2 Verify Build Settings

1. Still in **Settings**
2. Check **"Build Command"**: Should be `npm run build` (or Railway auto-detects)
   - This will run: `prisma generate && tsc` (generates Prisma Client and compiles TypeScript)
3. Check **"Start Command"**: Should be `npm start` (or Railway auto-detects)
   - This will run: `node dist/index.js`

If these are wrong:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Note**: The build process automatically generates Prisma Client, so your database connection will work!

### 5.3 Save Changes

Railway will automatically redeploy when you change settings.

## 🚀 Step 6: Set Environment Variables

This is the most important step!

### 6.1 Open Variables Tab

1. In your Railway project
2. Click **"Variables"** tab (or **"Environment"** tab)

### 6.2 Add Each Variable

Click **"New Variable"** and add these one by one:

#### Variable 1: DATABASE_URL

- **Name**: `DATABASE_URL`
- **Value**: Your Supabase connection string
  ```
  postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
  ```
- Click **"Add"**

#### Variable 2: JWT_SECRET

- **Name**: `JWT_SECRET`
- **Value**: The secret you generated in Step 1.2 (32+ characters)
  ```
  your-generated-secret-here-minimum-32-characters
  ```
- Click **"Add"**

#### Variable 3: NODE_ENV

- **Name**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

#### Variable 4: PORT

- **Name**: `PORT`
- **Value**: `3001`
- Click **"Add"**

#### Variable 5: JWT_EXPIRES_IN

- **Name**: `JWT_EXPIRES_IN`
- **Value**: `7d`
- Click **"Add"**

#### Variable 6: CORS_ORIGIN

- **Name**: `CORS_ORIGIN`
- **Value**: Your HostGator domain (or `http://localhost:3000` for testing)
  ```
  https://yourdomain.com
  ```
  Or if you don't have domain yet:
  ```
  http://localhost:3000
  ```
- Click **"Add"**

#### Variable 7: FRONTEND_URL

- **Name**: `FRONTEND_URL`
- **Value**: Same as CORS_ORIGIN
  ```
  https://yourdomain.com
  ```
- Click **"Add"**

#### Variable 8: UPLOAD_DIR

- **Name**: `UPLOAD_DIR`
- **Value**: `./uploads`
- Click **"Add"**

#### Variable 9: MAX_FILE_SIZE

- **Name**: `MAX_FILE_SIZE`
- **Value**: `10485760`
- Click **"Add"**

### 6.3 Verify All Variables

You should have 9 variables:
- ✅ DATABASE_URL
- ✅ JWT_SECRET
- ✅ NODE_ENV
- ✅ PORT
- ✅ JWT_EXPIRES_IN
- ✅ CORS_ORIGIN
- ✅ FRONTEND_URL
- ✅ UPLOAD_DIR
- ✅ MAX_FILE_SIZE

## 🚀 Step 7: Wait for Deployment

### 7.1 Monitor Deployment

1. Go to **"Deployments"** tab
2. You'll see deployment progress:
   - 🔄 "Building..."
   - 🔄 "Deploying..."
   - ✅ "Deployed" (or ❌ "Failed")

### 7.2 Check Logs

1. Click on the deployment
2. Click **"View Logs"**
3. You should see:
   ```
   Installing dependencies...
   Building...
   Starting server...
   🚀 Server running on port 3001
   ```

### 7.3 If Deployment Fails

**Common Issues:**

**Issue**: "Missing required environment variables"
- **Fix**: Go back to Variables tab, make sure all 9 variables are set

**Issue**: "JWT_SECRET must be at least 32 characters"
- **Fix**: Generate a new secret (Step 1.2) and update JWT_SECRET variable

**Issue**: "Cannot find module"
- **Fix**: Make sure Root Directory is set to `backend`

**Issue**: "Database connection failed"
- **Fix**: Check DATABASE_URL is correct, verify Supabase is active

## 🚀 Step 8: Get Your Backend URL

### 8.1 Find Your URL

1. In Railway project, go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. You'll see a URL like: `https://your-app-production.up.railway.app`
4. **Copy this URL** - you'll need it!

### 8.2 (Optional) Add Custom Domain

If you have a custom domain:
1. Click **"Generate Domain"** or **"Add Custom Domain"**
2. Enter your domain: `api.yourdomain.com`
3. Railway will give you DNS records to add
4. Add DNS records in your domain registrar
5. Wait for DNS propagation (5-30 minutes)

### 8.3 Update API_BASE_URL Variable

1. Go back to **"Variables"** tab
2. Add new variable:
   - **Name**: `API_BASE_URL`
   - **Value**: Your Railway URL (from Step 8.1)
     ```
     https://your-app-production.up.railway.app
     ```
3. Click **"Add"**

Railway will automatically redeploy.

## 🚀 Step 9: Test Your Backend

### 9.1 Test Health Endpoint

Open browser or use curl:

```
https://your-app-production.up.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-02-07T...",
  "environment": "production",
  "database": "connected"
}
```

### 9.2 Test API Endpoint

Try the auth endpoint (should return an error, but that's OK - means it's working):

```
https://your-app-production.up.railway.app/api/auth/login
```

Should return:
```json
{
  "error": "Email and password are required"
}
```

This means your API is working! ✅

### 9.3 Check Logs

1. In Railway, go to **"Deployments"** tab
2. Click latest deployment
3. Click **"View Logs"**
4. You should see:
   ```
   Server started
   port: 3001
   environment: production
   ```

## 🚀 Step 10: Update Frontend (Next Step)

Now that your backend is deployed, you need to:

1. **Update frontend** to use your Railway URL
2. **Build frontend**
3. **Deploy to HostGator**

See **DEPLOY_WITH_SUPABASE.md** for frontend deployment steps.

## ✅ Railway Deployment Complete!

Your backend is now live at:
- **URL**: `https://your-app-production.up.railway.app`
- **Health Check**: `https://your-app-production.up.railway.app/health`
- **API Base**: `https://your-app-production.up.railway.app/api`

## 📊 Railway Dashboard Overview

### Useful Tabs:

1. **Deployments**: See all deployments, view logs
2. **Variables**: Manage environment variables
3. **Settings**: Configure build, domain, etc.
4. **Metrics**: View CPU, memory usage (if on paid plan)
5. **Logs**: Real-time application logs

### Monitoring:

- Railway automatically restarts your app if it crashes
- Logs are available in real-time
- You can view deployment history

## 🔄 Updating Your Backend

When you make changes:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Railway auto-deploys** (if connected to GitHub)
   - Or manually trigger deployment in Railway dashboard

3. **Check deployment** in Deployments tab

## 🆘 Troubleshooting

### Backend Won't Start

1. **Check Logs**: Deployments → View Logs
2. **Check Variables**: Make sure all are set
3. **Check Root Directory**: Should be `backend`

### Database Connection Failed

1. **Verify DATABASE_URL** is correct
2. **Check Supabase** is active
3. **Test connection** locally first

### CORS Errors

1. **Update CORS_ORIGIN** variable with your frontend domain
2. **Redeploy** (Railway auto-redeploys on variable change)

### 500 Errors

1. **Check Logs** for specific error
2. **Verify JWT_SECRET** is 32+ characters
3. **Check all environment variables** are set

## 📝 Quick Reference

**Your Railway URL**: `https://your-app-production.up.railway.app`

**Environment Variables Needed**:
- DATABASE_URL
- JWT_SECRET (32+ chars)
- NODE_ENV=production
- PORT=3001
- CORS_ORIGIN
- FRONTEND_URL
- API_BASE_URL (set after getting URL)

**Next Steps**:
1. ✅ Backend deployed to Railway
2. ⏭️ Deploy frontend to HostGator
3. ⏭️ Update frontend API URL
4. ⏭️ Test everything

---

**Need help?** Check Railway logs first - they usually show the exact error!
