# Native Build Guide (Fix for React 19 Error)

## Problem
The "Cannot read property 'S' of undefined" error persists even with React 18. This is likely a Metro bundler/Expo dev server compatibility issue.

## Solution: Use Native Build

Instead of using Expo's development server, we'll create a native Android build that runs directly on the emulator.

## Step 1: Prebuild Native Projects

This generates the `android/` and `ios/` folders:

```powershell
cd mobile
npx expo prebuild
```

**Note**: This will create native Android/iOS projects. You can delete them later if needed.

## Step 2: Run on Android

```powershell
npx expo run:android
```

This will:
1. Build the native Android app
2. Install it on your emulator
3. Start the app

## Step 3: Start Development Server

In a separate terminal, start the Metro bundler:

```powershell
cd mobile
npx expo start
```

The app will connect to the Metro bundler automatically.

## Benefits

- ✅ Avoids Expo dev server compatibility issues
- ✅ More stable
- ✅ Better performance
- ✅ Closer to production build

## If Prebuild Fails

If `npx expo prebuild` fails, try:

```powershell
npx expo prebuild --clean
```

This cleans any existing native projects first.

## Troubleshooting

**"Command not found" errors:**
- Make sure Android Studio is installed
- Make sure Android SDK is configured

**Build fails:**
- Check Android Studio is installed
- Verify emulator is running
- Try: `npx expo run:android --device`
