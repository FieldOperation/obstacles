# Fix Port Conflict and Connection Issues

## Issues Found
1. **Port 3000 was in use** - Frontend couldn't start on port 3000
2. **ENOBUFS errors** - Too many connection attempts to backend
3. **Frontend moved to port 3001** - Conflict with backend

## Solutions Applied

### 1. Killed Process on Port 3000
The process using port 3000 has been terminated.

### 2. Updated Vite Config
- Added `strictPort: true` to fail if port is in use
- Added better proxy error handling
- Increased timeout to 30 seconds

### 3. Updated API Service
- Added connection error handling
- Added 30-second timeout
- Better error messages

## Next Steps

### 1. Restart Frontend
```powershell
cd frontend
npm run dev
```

The frontend should now start on port 3000.

### 2. Verify Backend is Running
```powershell
# Check if backend is on port 3001
netstat -ano | findstr ":3001" | findstr "LISTENING"
```

If not running, start it:
```powershell
cd backend
npm run dev
```

### 3. Test Connection
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/health

## If ENOBUFS Errors Persist

The ENOBUFS error means too many connections. This can happen if:
- Multiple browser tabs are open
- React Query is making too many requests
- Backend is slow to respond

**Solutions:**
1. Close other browser tabs
2. Clear browser cache
3. Restart both frontend and backend
4. Check backend logs for slow queries

## Port Configuration

- **Frontend**: Port 3000 (strict)
- **Backend**: Port 3001
- **Proxy**: `/api` → `http://localhost:3001`

If port 3000 is still in use, find and kill the process:
```powershell
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F
```
