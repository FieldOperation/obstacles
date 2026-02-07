# Next Steps - Getting Your Application Running

## ✅ What's Already Done

- ✅ Database connected to Supabase
- ✅ Database migrations completed
- ✅ Seed data loaded (zones, roads, developers, users)
- ✅ Backend code fixed and ready
- ✅ Port 3001 is free

## 🚀 Step-by-Step Setup

### Step 1: Start the Backend Server

Open a terminal and run:

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📁 Upload directory: ...
```

**Keep this terminal open!**

### Step 2: Start the Frontend (New Terminal)

Open a **new terminal window** and run:

```powershell
cd frontend
npm install  # If you haven't installed dependencies yet
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Keep this terminal open too!**

### Step 3: Access the Application

1. Open your browser and go to: **http://localhost:3000**
2. You should see the login page
3. Use these credentials to log in:

   **Admin Account:**
   - Email: `admin@example.com`
   - Password: `password123`

   **Worker Account:**
   - Email: `worker@example.com`
   - Password: `password123`

   **Read-Only Account:**
   - Email: `others@example.com`
   - Password: `password123`

### Step 4: Test the Application

#### As Admin:
1. ✅ View the Executive Dashboard
2. ✅ Create/Edit/Delete Users
3. ✅ Manage Zones, Roads, and Developers
4. ✅ Create and manage cases
5. ✅ View analytics

#### As Worker:
1. ✅ Create new cases (Obstacles or Damages)
2. ✅ Upload photos with GPS location
3. ✅ Close cases with closure notes
4. ✅ View cases in your zone

#### As Others (Read-only):
1. ✅ View all cases
2. ✅ Receive real-time notifications
3. ✅ View dashboard (read-only)

### Step 5: Create Your First Case (Optional)

1. Log in as **Worker** or **Admin**
2. Click "New Case" or go to `/cases/new`
3. Fill in the form:
   - Select case type (Obstacle or Damage)
   - Choose Zone and Road
   - Add description
   - Allow location access (for GPS)
   - Upload photos
4. Submit the case
5. View it in the cases list

### Step 6: Mobile App (Optional)

If you want to test the mobile app:

```powershell
# In a new terminal
cd mobile
npm install  # If not already installed
npm start
```

Then:
- Press `i` for iOS simulator (if you have Xcode)
- Press `a` for Android emulator (if you have Android Studio)
- Or scan the QR code with Expo Go app on your phone

**Important**: Update `mobile/src/services/api.ts` with your computer's IP address if testing on a physical device.

## 📋 Quick Reference

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Worker | worker@example.com | password123 |
| Others | others@example.com | password123 |

### URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Prisma Studio** (Database Viewer): `cd backend && npx prisma studio`

### Common Commands

```powershell
# Backend
cd backend
npm run dev              # Start server
npx prisma studio        # View database
npx prisma migrate dev   # Create new migration

# Frontend
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production

# Mobile
cd mobile
npm start                # Start Expo
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is free: `netstat -ano | findstr :3001`
- Kill process if needed: `taskkill /PID <PID> /F`
- Check `.env` file exists and has correct DATABASE_URL

### Frontend won't start
- Check if port 3000 is free
- Run `npm install` in frontend directory
- Check browser console for errors

### Can't connect to database
- Verify Supabase project is active
- Check connection string in `backend/.env`
- Test connection: `cd backend && npx prisma db pull`

### Login not working
- Verify database was seeded: `cd backend && npx prisma db seed`
- Check backend logs for errors
- Verify JWT_SECRET is set in `.env`

## 🎯 What to Do Next

1. **Explore the Dashboard** - See analytics and metrics
2. **Create Test Data** - Add zones, roads, and cases
3. **Test Notifications** - Create a case and see real-time updates
4. **Try Mobile App** - Test on your phone or emulator
5. **Customize** - Modify colors, add features, etc.

## 📚 Documentation

- **Setup Guide**: See [SETUP.md](./SETUP.md)
- **Supabase Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Troubleshooting**: See [backend/TROUBLESHOOTING.md](./backend/TROUBLESHOOTING.md)

## 🎉 You're All Set!

Your case management system is ready to use. Start with the backend, then frontend, and you'll be up and running!
