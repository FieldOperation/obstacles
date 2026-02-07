# Mobile App Setup for Expo Go

## Quick Start

### 1. Install Dependencies
```powershell
cd mobile
npm install
```

### 2. Get Your Computer's IP Address
For Windows:
```powershell
ipconfig | findstr /i "IPv4"
```

Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)

### 3. Update API URL
Edit `mobile/src/services/api.ts` and replace `localhost` with your computer's IP address:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_IP_ADDRESS:3001/api'  // Replace YOUR_IP_ADDRESS
  : 'https://your-production-api.com/api';
```

**Example:**
If your IP is `192.168.1.100`, use:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3001/api'
  : 'https://your-production-api.com/api';
```

### 4. Start Expo
```powershell
cd mobile
npm start
```

### 5. Open in Expo Go

**On your phone:**
1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the **same WiFi network** as your computer
3. Scan the QR code shown in the terminal
   - **iOS**: Use the Camera app to scan
   - **Android**: Use the Expo Go app to scan

**Or use tunnel mode** (works on different networks):
```powershell
npm start -- --tunnel
```

## Important Notes

### Network Requirements
- ✅ Phone and computer must be on the **same WiFi network** (for LAN mode)
- ✅ Or use `--tunnel` mode (works anywhere but slower)
- ✅ Backend must be running on port 3001
- ✅ Firewall may need to allow port 3001

### Troubleshooting

**Can't connect to backend:**
- Verify backend is running: `http://localhost:3001/health`
- Check IP address is correct
- Ensure phone and computer are on same network
- Try tunnel mode: `npm start -- --tunnel`

**Expo Go can't load app:**
- Check Expo Go app is installed
- Make sure you're scanning the QR code correctly
- Try clearing Expo Go cache

**API connection errors:**
- Verify the IP address in `mobile/src/services/api.ts`
- Check backend CORS settings allow your IP
- Test backend directly: `http://YOUR_IP:3001/health`

## Testing

Once the app loads in Expo Go:
1. Login with: `admin@example.com` / `password123`
2. Test creating a case with GPS and photos
3. Test viewing cases list
4. Test closing a case

## Development Tips

- **Hot Reload**: Changes auto-reload in Expo Go
- **Shake device**: Opens developer menu
- **Console logs**: Check Metro bundler terminal
- **Network requests**: Check backend terminal for API calls
