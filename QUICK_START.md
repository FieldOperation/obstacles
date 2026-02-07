# Quick Start Guide

## 1. Database Setup

**Using Supabase (Already configured!):**

Your Supabase connection string is ready. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details.

**Or use local PostgreSQL:**

```bash
# Create PostgreSQL database
createdb obstacles_db
```

## 2. Backend Setup

```bash
cd backend

# Create .env file (Windows PowerShell):
.\setup-env.ps1

# Or (Linux/Mac):
chmod +x setup-env.sh && ./setup-env.sh

# Or create manually - see SUPABASE_SETUP.md for the connection string

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start server
npm run dev
```

Backend should be running on http://localhost:3001

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend should be running on http://localhost:3000

## 4. Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start
```

Then:
- Press `i` for iOS
- Press `a` for Android
- Scan QR code with Expo Go app

**Important**: Update API URL in `mobile/src/services/api.ts` for your device.

## 5. Login

Use these default credentials:
- **Admin**: admin@example.com / password123
- **Worker**: worker@example.com / password123
- **Others**: others@example.com / password123

## Common Issues

**Port 3001 already in use?**
- Change PORT in `backend/.env`

**Can't connect to database?**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `backend/.env`

**Mobile app can't reach API?**
- Use your computer's IP address instead of localhost
- Check both devices are on same network
- Verify backend CORS settings

## Next Steps

1. Create your first zone in the web app (Admin → Zones)
2. Add roads to the zone
3. Create a case as a Worker
4. View dashboard analytics as Admin

For detailed setup, see [SETUP.md](./SETUP.md)
