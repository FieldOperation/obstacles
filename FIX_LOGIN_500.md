# Fix Login 500 Error

## Problem
The login endpoint returns a 500 error because Prisma Client is not generated.

## Solution

### Step 1: Stop the Backend Server
In the terminal where you're running `npm run dev` for the backend:
- Press `Ctrl+C` to stop the server

### Step 2: Generate Prisma Client
```powershell
cd backend
npx prisma generate
```

### Step 3: Restart Backend Server
```powershell
npm run dev
```

### Step 4: Test Login Again
Try logging in at http://localhost:3000 with:
- Email: `admin@example.com`
- Password: `password123`

## Why This Happened
The Prisma Client needs to be generated after:
- Installing dependencies
- Running migrations
- Schema changes

The backend server was running but couldn't query the database because Prisma Client wasn't generated.

## Verify It's Fixed
After restarting, check:
1. Backend terminal shows: `🚀 Server running on port 3001`
2. No errors in backend terminal
3. Login works in the frontend
