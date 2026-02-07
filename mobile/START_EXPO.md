# Start Mobile App with Expo Go

## Step-by-Step Instructions

### 1. Install Dependencies (if not already done)
```powershell
cd mobile
npm install
```

### 2. Verify API Configuration
Check `mobile/src/services/api.ts` - it should have your computer's IP:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.18:3001/api'  // Your IP address
  : 'https://your-production-api.com/api';
```

**If your IP is different**, update it in `mobile/src/services/api.ts`

### 3. Make Sure Backend is Running
The backend should be running on port 3001. If not:
```powershell
cd backend
npm run dev
```

### 4. Start Expo
```powershell
cd mobile
npm start
```

You'll see a QR code in the terminal.

### 5. Open in Expo Go

**On Your Phone:**
1. **Install Expo Go**:
   - iOS: App Store → Search "Expo Go"
   - Android: Play Store → Search "Expo Go"

2. **Connect to Same WiFi**:
   - Make sure your phone and computer are on the **same WiFi network**

3. **Scan QR Code**:
   - **iOS**: Open Camera app → Point at QR code → Tap notification
   - **Android**: Open Expo Go app → Tap "Scan QR code" → Scan

### 6. If QR Code Doesn't Work

**Option A: Use Tunnel Mode** (works on different networks):
```powershell
npm start -- --tunnel
```

**Option B: Enter URL Manually**:
- In Expo Go, tap "Enter URL manually"
- Type: `exp://YOUR_COMPUTER_IP:8081`
- Or use the URL shown in the terminal

## Troubleshooting

### "Unable to connect to server"
- ✅ Check backend is running: http://localhost:3001/health
- ✅ Verify IP address in `mobile/src/services/api.ts`
- ✅ Ensure phone and computer are on same WiFi
- ✅ Try tunnel mode: `npm start -- --tunnel`

### "Network request failed"
- ✅ Update IP address in `mobile/src/services/api.ts`
- ✅ Check Windows Firewall allows port 3001
- ✅ Test backend from phone's browser: `http://YOUR_IP:3001/health`

### Expo Go shows blank screen
- ✅ Check Metro bundler terminal for errors
- ✅ Shake device → Reload
- ✅ Clear Expo Go cache (shake device → Clear cache)

## Quick Test

Once app loads:
1. Login: `admin@example.com` / `password123`
2. Try creating a case
3. Test GPS location capture
4. Test photo upload

## Your Current IP
Based on your network, your IP is likely: **192.168.1.18**

If this doesn't work, check which IP matches your WiFi network:
```powershell
ipconfig | findstr /i "IPv4"
```
