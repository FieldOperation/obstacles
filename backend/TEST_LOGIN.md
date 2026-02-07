# Testing Login - Troubleshooting 500 Error

## Quick Checks

### 1. Verify Backend is Running
```powershell
netstat -ano | findstr :3001
```
Should show the backend server listening on port 3001.

### 2. Test Backend Health Endpoint
Open in browser or use curl:
```
http://localhost:3001/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 3. Check Backend Logs
Look at the terminal where you ran `npm run dev` in the backend directory. You should see detailed error messages there.

### 4. Test Login with curl (PowerShell)
```powershell
$body = @{
    email = "admin@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

## Common Issues

### Issue: JWT_SECRET not set
**Solution**: Make sure `backend/.env` has:
```
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### Issue: Database connection failed
**Solution**: 
1. Check `DATABASE_URL` in `backend/.env`
2. Test connection: `cd backend && npx prisma db pull`

### Issue: User doesn't exist
**Solution**: Seed the database:
```powershell
cd backend
npx prisma db seed
```

### Issue: Prisma Client not generated
**Solution**:
```powershell
cd backend
npx prisma generate
```

## Check Backend Terminal

The most important thing is to **check the backend terminal** where you ran `npm run dev`. It will show the actual error message that's causing the 500 error.

Look for lines like:
- `Login error: ...`
- `Error stack: ...`
- Any red error messages

## Next Steps

1. **Check backend terminal** for error details
2. **Verify backend is running** on port 3001
3. **Test health endpoint** to confirm server is up
4. **Check .env file** has all required variables
5. **Verify database connection** works
