# Troubleshooting Supabase Connection Issues

## Common Connection Errors

### Error: P1001 - Can't reach database server

This error means Prisma cannot connect to your Supabase database. Try these solutions:

#### Solution 1: Add SSL Parameter

Update your `backend/.env` file to include SSL mode:

```env
DATABASE_URL="postgresql://postgres:Fo%402026%402027@db.uarbweqbrdcqtvmyzmvb.supabase.co:5432/postgres?sslmode=require"
```

#### Solution 2: Check Supabase Project Status

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Verify your project is active (not paused)
3. Check if there are any IP restrictions enabled

#### Solution 3: Use Connection Pooler

Supabase provides a connection pooler that might work better. Update your connection string:

```env
DATABASE_URL="postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Note**: The pooler uses a different format:
- Username: `postgres.uarbweqbrdcqtvmyzmvb` (includes project ref)
- Port: `6543` (pooler port, not 5432)
- Host: `aws-0-us-east-1.pooler.supabase.com` (pooler hostname)

#### Solution 4: Check Firewall/Network

- Ensure your firewall isn't blocking port 5432 or 6543
- Try from a different network (mobile hotspot) to rule out network issues
- Check if your ISP blocks database connections

#### Solution 5: Verify Connection String Format

Make sure:
- Password is URL encoded: `@` → `%40`
- No extra spaces or quotes in the connection string
- The `.env` file is in the `backend/` directory

#### Solution 6: Test Connection Directly

You can test the connection using `psql` or a PostgreSQL client:

```bash
# Install psql if needed, then test:
psql "postgresql://postgres:Fo%402026%402027@db.uarbweqbrdcqtvmyzmvb.supabase.co:5432/postgres?sslmode=require"
```

Or use a GUI tool like pgAdmin, DBeaver, or TablePlus with these settings:
- Host: `db.uarbweqbrdcqtvmyzmvb.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `Fo@2026@2027`
- SSL Mode: `Require`

## Quick Fix Commands

### Update .env with SSL (PowerShell)
```powershell
cd backend
$content = Get-Content .env
$content = $content -replace 'postgres\?', 'postgres?sslmode=require'
$content | Set-Content .env
```

### Update .env with SSL (Bash)
```bash
cd backend
sed -i 's/postgres$/postgres?sslmode=require/' .env
```

### Regenerate Prisma Client After Fix
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Alternative: Use Supabase Connection Pooler

The pooler is more reliable for serverless/cloud environments. Update your `.env`:

```env
DATABASE_URL="postgresql://postgres.uarbweqbrdcqtvmyzmvb:Fo%402026%402027@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

**To find your pooler connection string:**
1. Go to Supabase Dashboard → Your Project
2. Settings → Database
3. Look for "Connection Pooling" section
4. Copy the "Connection string" (Session mode)

## Still Having Issues?

1. **Check Supabase Dashboard**:
   - Project Settings → Database
   - Verify connection string matches
   - Check if project is paused

2. **Verify Password**:
   - The password `Fo@2026@2027` should be encoded as `Fo%402026%402027`
   - Each `@` becomes `%40`

3. **Check Prisma Logs**:
   - Run with verbose: `DEBUG="*" npx prisma migrate dev`
   - Look for specific SSL or connection errors

4. **Contact Supabase Support**:
   - If project is active and connection string is correct
   - They can check server-side issues
