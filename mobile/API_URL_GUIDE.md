# API URL Configuration Guide

## ✅ Current Setup (Automatic Detection)

The API URL is **already configured** to automatically detect your environment:

- **Android Emulator**: Uses `http://10.0.2.2:3001/api` automatically
- **iOS Simulator**: Uses `http://localhost:3001/api` automatically
- **Physical Device**: Would need manual IP address

## 📱 For Android Emulator (Current Setup)

**NO CHANGES NEEDED!** The app automatically uses `10.0.2.2` when running on Android emulator.

`10.0.2.2` is a special IP address that Android emulator uses to access your computer's `localhost`.

## 📱 For Physical Device (If Needed Later)

If you want to test on a **real phone** instead of emulator:

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig | findstr /i "IPv4"
```

Look for an IP like `192.168.1.18` or `192.168.0.100` (your local network IP)

### Step 2: Update API URL

Edit `mobile/src/services/api.ts`:

**Option A: Manual IP (for physical device)**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.18:3001/api'  // Replace with YOUR IP
  : 'https://your-production-api.com/api';
```

**Option B: Keep auto-detection but add physical device support**
```typescript
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (!__DEV__) return 'https://your-production-api.com/api';
  
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // Emulator uses 10.0.2.2, physical device uses your IP
    return 'http://10.0.2.2:3001/api';  // For emulator
    // OR use your IP for physical device:
    // return 'http://192.168.1.18:3001/api';
  }
  
  return 'http://localhost:3001/api';  // iOS simulator
};

const API_BASE_URL = getApiUrl();
```

### Step 3: Update SocketContext

Also update `mobile/src/contexts/SocketContext.tsx` with the same IP:

```typescript
const socketUrl = __DEV__ 
  ? 'http://192.168.1.18:3001'  // Match your API IP
  : 'https://your-production-api.com';
```

## ✅ Current Configuration Summary

**File**: `mobile/src/services/api.ts`
- ✅ Auto-detects Android emulator
- ✅ Uses `10.0.2.2:3001/api` for Android emulator
- ✅ Uses `localhost:3001/api` for iOS simulator

**File**: `mobile/src/contexts/SocketContext.tsx`
- ✅ Auto-detects Android emulator
- ✅ Uses `10.0.2.2:3001` for Android emulator
- ✅ Uses `localhost:3001` for iOS simulator

## 🚀 Ready to Test!

Since you're using **Android Emulator**, you don't need to change anything!

Just:
1. Make sure backend is running: `cd backend && npm run dev`
2. Start emulator in Android Studio
3. Run: `cd mobile && npm start -- --android`

The app will automatically connect to `http://10.0.2.2:3001/api` ✅
