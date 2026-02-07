# Setup Guide - Obstacles Case Management System

This guide will help you set up and run the complete case management system.

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Expo CLI** (for mobile app): `npm install -g expo-cli`
- **Git**

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### 2. Database Setup

**Using Supabase (Recommended)**

Your Supabase connection is already configured. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details.

**Or use local PostgreSQL:**

1. Create a PostgreSQL database:
```sql
CREATE DATABASE obstacles_db;
```

2. Configure environment variables:
```bash
cd backend
# Create .env file (see SUPABASE_SETUP.md for Supabase config)
```

3. Edit `backend/.env` with your database credentials:

**For Supabase:**
```
DATABASE_URL="postgresql://postgres:Fo%402026%402027@db.uarbweqbrdcqtvmyzmvb.supabase.co:5432/postgres"
```

**For local PostgreSQL:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/obstacles_db?schema=public"
```

**Other required variables:**
```
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:3000"
```

4. Run database migrations:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

5. (Optional) Seed initial data:
```bash
npx prisma db seed
```

This creates:
- 2 zones (Zone A, Zone B)
- 3 roads
- 2 developers
- 3 users:
  - Admin: admin@example.com / password123
  - Worker: worker@example.com / password123
  - Others: others@example.com / password123

### 3. Create Upload Directory

```bash
mkdir -p backend/uploads/cases
```

### 4. Running the Application

#### Backend API (Terminal 1)
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

#### Frontend Web App (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

#### Mobile App (Terminal 3)
```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**Note**: For mobile app to work, update the API URL in `mobile/src/services/api.ts`:
- For physical device: Use your computer's local IP address (e.g., `http://192.168.1.100:3001/api`)
- For emulator: Use `http://localhost:3001/api` (Android) or `http://localhost:3001/api` (iOS)

## Project Structure

```
obstacles/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Auth & RBAC middleware
│   │   └── socket.ts  # Socket.IO setup
│   └── prisma/        # Database schema & migrations
├── frontend/         # React web application
│   └── src/
│       ├── pages/    # Page components
│       ├── components/ # Reusable components
│       └── contexts/  # React contexts
└── mobile/           # React Native mobile app
    └── src/
        ├── screens/  # Screen components
        └── contexts/ # React contexts
```

## Features

### Web Application
- ✅ User authentication
- ✅ Role-based access control (Admin, Worker, Others)
- ✅ Create and manage cases (Obstacles & Damages)
- ✅ Master data management (Zones, Roads, Developers)
- ✅ Executive dashboard with analytics
- ✅ Real-time notifications
- ✅ Photo uploads with geotagging
- ✅ Case closure workflow

### Mobile Application
- ✅ User authentication
- ✅ Create cases with GPS location
- ✅ Camera integration for photos
- ✅ View cases list
- ✅ Case details and closure
- ✅ Real-time notifications
- ✅ Offline support (basic)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - List cases (with filters)
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `POST /api/cases/:id/close` - Close case
- `DELETE /api/cases/:id` - Delete case (Admin only)

### Master Data
- `GET /api/zones` - List zones
- `POST /api/zones` - Create zone (Admin)
- `PUT /api/zones/:id` - Update zone (Admin)
- `DELETE /api/zones/:id` - Delete zone (Admin)

Similar endpoints for `/api/roads` and `/api/developers`

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Roles & Permissions

### Admin
- Full access to all features
- User management
- Master data management (Zones, Roads, Developers)
- Can create, edit, close, and delete cases

### Worker
- Create new cases
- Upload photos and geolocation
- Close cases with closure notes
- View cases in their assigned zone (or all if no zone assigned)

### Others (Read-only)
- View all cases
- Receive real-time notifications
- Cannot create or edit cases

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database exists

### Port Already in Use
- Change PORT in `backend/.env`
- Update CORS_ORIGIN if needed
- Update frontend proxy in `frontend/vite.config.ts`

### Mobile App Can't Connect to API
- Ensure backend is running
- Update API URL in `mobile/src/services/api.ts`
- For physical device, use your computer's IP address
- Check firewall settings

### Photo Upload Issues
- Ensure `backend/uploads/cases` directory exists
- Check file size limits in backend
- Verify multer configuration

## Development

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### View Database
```bash
cd backend
npx prisma studio
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve dist/ folder with a web server
```

**Mobile:**
```bash
cd mobile
expo build:android  # or expo build:ios
```

## Security Notes

- Change JWT_SECRET in production
- Use environment variables for sensitive data
- Implement rate limiting in production
- Use HTTPS in production
- Configure CORS properly for production domains
- Store uploaded files securely (consider cloud storage)

## Next Steps

1. Set up production database
2. Configure cloud storage for photos (AWS S3, etc.)
3. Set up CI/CD pipeline
4. Add unit and integration tests
5. Implement offline sync for mobile app
6. Add push notifications for mobile
7. Set up monitoring and logging

## Support

For issues or questions, please check:
- Backend logs in terminal
- Browser console for frontend errors
- React Native debugger for mobile app
