# Quick Start - Mobile App with Expo Go

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Expo Go on Your Phone
- **iOS**: App Store → Search "Expo Go" → Install
- **Android**: Play Store → Search "Expo Go" → Install

### Step 2: Start Expo
```powershell
cd mobile
npm start
```

You'll see a QR code in the terminal.

### Step 3: Scan QR Code
- **iOS**: Open Camera app → Point at QR code → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR code" → Scan

## ⚙️ Configuration

### API URL Setup
The app is configured to use: `http://192.168.1.18:3001/api`

**If this doesn't work:**
1. Find your computer's IP:
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```
2. Update `mobile/src/services/api.ts` with your IP
3. Restart Expo (press `r` in the terminal)

### Network Requirements
- ✅ Phone and computer on **same WiFi network**
- ✅ Backend running on port 3001
- ✅ Windows Firewall allows port 3001

## 🔧 Troubleshooting

### Can't Connect to Backend
**Solution**: Use tunnel mode (works on any network):
```powershell
npm start -- --tunnel
```

### QR Code Doesn't Work
1. Make sure Expo Go is installed
2. Check phone and computer are on same WiFi
3. Try tunnel mode: `npm start -- --tunnel`
4. Or enter URL manually in Expo Go

### App Shows Blank Screen
1. Shake device → Reload
2. Check Metro bundler terminal for errors
3. Clear cache: Shake device → Clear cache

## 📱 Testing the App

Once loaded in Expo Go:

1. **Login**: `admin@example.com` / `password123`
2. **Create Case**:
   - Tap "Create Case"
   - Select Zone and Road
   - Add description
   - Allow location access
   - Take/select photos
   - Submit
3. **View Cases**: Tap "View Cases" to see all cases
4. **Close Case**: Open a case → Tap "Close Case"

## 🎯 Current Configuration

- **Backend URL**: `http://192.168.1.18:3001/api`
- **Expo Port**: 8081 (default)
- **Backend Port**: 3001

## 💡 Tips

- **Hot Reload**: Changes auto-reload in Expo Go
- **Shake Device**: Opens developer menu
- **Reload**: Press `r` in Expo terminal
- **Clear Cache**: Press `c` in Expo terminal
