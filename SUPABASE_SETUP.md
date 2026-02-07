# Supabase Database Setup

Your Supabase connection string has been configured. Here's what you need to know:

## Connection String

Your Supabase PostgreSQL connection string:
```
postgresql://postgres:Fo@2026@2027@db.uarbweqbrdcqtvmyzmvb.supabase.co:5432/postgres
```

**Important**: The password contains `@` symbols which need to be URL encoded as `%40` in the connection string.

## Backend .env Configuration

Create or update `backend/.env` with:

```env
# Database - Supabase (Session Pooler)
DATABASE_URL="postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## Setup Steps

1. **Create the .env file** in the `backend/` directory:

**Option A: Use the setup script (Windows PowerShell):**
```powershell
cd backend
.\setup-env.ps1
```

**Option B: Use the setup script (Linux/Mac):**
```bash
cd backend
chmod +x setup-env.sh
./setup-env.sh
```

**Option C: Create manually** - Copy the configuration above into `backend/.env`

2. **Install dependencies** (if not already done):
```bash
cd backend
npm install
```

3. **Generate Prisma Client**:
```bash
npx prisma generate
```

4. **Run database migrations**:
```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your Supabase database.

5. **Seed initial data** (optional):
```bash
npx prisma db seed
```

This creates:
- 2 zones (Zone A, Zone B)
- 3 roads
- 2 developers
- 3 default users (admin, worker, others)

6. **Start the backend server**:
```bash
npm run dev
```

## Verify Connection

You can verify the connection by:

1. **Using Prisma Studio**:
```bash
npx prisma studio
```
This opens a web interface to view your database.

2. **Checking Supabase Dashboard**:
- Go to your Supabase project dashboard
- Navigate to "Table Editor" to see your tables
- Navigate to "SQL Editor" to run queries

## Important Notes

### Password Encoding
The password `Fo@2026@2027` contains `@` symbols. In the DATABASE_URL, these must be URL encoded:
- `@` becomes `%40`
- So `Fo@2026@2027` becomes `Fo%402026%402027`

### Connection Pooling (Optional)
Supabase recommends using connection pooling for better performance. You can use the pooler connection string instead:

```
postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

However, for development, the direct connection works fine.

### SSL Connection
Supabase requires SSL connections. Prisma handles this automatically, but if you encounter SSL errors, you can add to your connection string:

```
?sslmode=require
```

Full connection string with SSL:
```
postgresql://postgres:Fo%402026%402027@db.uarbweqbrdcqtvmyzmvb.supabase.co:5432/postgres?sslmode=require
```

## Troubleshooting

### Connection Refused
- Verify your Supabase project is active
- Check the connection string is correct
- Ensure password encoding is correct (`@` → `%40`)

### SSL Errors
- Add `?sslmode=require` to the connection string
- Or set `PGSSLMODE=require` environment variable

### Migration Errors
- Ensure you have the correct permissions in Supabase
- Check that the database exists
- Verify the connection string is correct

### Prisma Client Generation Errors
- Run `npx prisma generate` after any schema changes
- Clear node_modules and reinstall if needed

## Next Steps

After setting up the database:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Start the mobile app: `cd mobile && npm start`

Your Supabase database is now ready to use!
