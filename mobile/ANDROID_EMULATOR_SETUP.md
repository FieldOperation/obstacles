# Android Emulator Setup (Alternative to Expo Go)

## Why Use Android Emulator?
- ✅ Works on Windows (unlike iOS Simulator which requires Mac)
- ✅ No SDK version restrictions
- ✅ Full control over the app
- ✅ Better for testing native features
- ✅ Can use React 18 (more stable)

## Step 1: Install Android Studio

1. Download Android Studio: https://developer.android.com/studio
2. Install it (includes Android SDK and emulator)
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

## Step 2: Create an Android Virtual Device (AVD)

1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
4. Select a device (e.g., "Pixel 5" or "Pixel 6")
5. Click "Next"
6. Select a system image:
   - **Recommended**: "Tiramisu" (API 33) or "UpsideDownCake" (API 34)
   - Click "Download" if needed
7. Click "Next" → "Finish"

## Step 3: Start the Emulator

1. In Virtual Device Manager, click the ▶️ (Play) button next to your device
2. Wait for the emulator to boot (first time takes a few minutes)

## Step 4: Update API URL for Emulator

Edit `mobile/src/services/api.ts`:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3001/api'  // Android emulator uses 10.0.2.2 for localhost
  : 'https://your-production-api.com/api';
```

**Note**: Android emulator uses `10.0.2.2` instead of `localhost` to access your computer.

## Step 5: Start Expo with Android

```powershell
cd mobile
npm start -- --android
```

Or:
```powershell
cd mobile
npm start
# Then press 'a' in the terminal
```

## Step 6: Test the App

The app should automatically open in the Android emulator!

## Troubleshooting

### Emulator is slow
- Close other applications
- Increase RAM allocation in AVD settings
- Use a lighter system image (API 30 or 31)

### Can't connect to backend
- Make sure backend is running: `http://localhost:3001/health`
- Verify API URL is `http://10.0.2.2:3001/api` in `api.ts`
- Check Windows Firewall allows port 3001

### Expo doesn't detect emulator
- Make sure emulator is fully booted (home screen visible)
- Run: `adb devices` to verify emulator is connected
- Restart Expo: `npm start -- --android`

## Benefits Over Expo Go

- ✅ No SDK version restrictions
- ✅ Can use React 18 (more stable)
- ✅ Full native module support
- ✅ Better performance
- ✅ More realistic testing environment
