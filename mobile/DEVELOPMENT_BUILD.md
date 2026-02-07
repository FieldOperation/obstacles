# Development Build Setup (Advanced Alternative)

## What is a Development Build?

A Development Build is a custom build of your app that includes Expo's developer tools. Unlike Expo Go:
- ✅ No SDK version restrictions
- ✅ Can use any React version
- ✅ Full native module support
- ✅ Better for production apps
- ❌ Requires building the app (takes time)

## Option 1: Local Development Build (Recommended)

### Prerequisites
- Android Studio installed (for Android)
- Xcode installed (for iOS, Mac only)

### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

### Step 2: Configure EAS

```powershell
cd mobile
eas build:configure
```

### Step 3: Create Development Build

**For Android:**
```powershell
eas build --profile development --platform android
```

**For iOS (Mac only):**
```powershell
eas build --profile development --platform ios
```

### Step 4: Install on Device/Emulator

After the build completes, you'll get a download link. Install it on your device or emulator.

### Step 5: Start Development Server

```powershell
npm start
```

The app will connect to the development server automatically.

## Option 2: Use Prebuild (Local Build)

### Step 1: Generate Native Projects

```powershell
cd mobile
npx expo prebuild
```

This creates `android/` and `ios/` folders.

### Step 2: Run on Android

```powershell
npx expo run:android
```

### Step 3: Run on iOS (Mac only)

```powershell
npx expo run:ios
```

## Benefits

- ✅ No Expo Go SDK restrictions
- ✅ Can use React 18 (downgrade if needed)
- ✅ Full control over native code
- ✅ Better performance
- ✅ Production-ready setup

## Quick Start: Android Emulator (Easier)

If you just want to test quickly, use Android Emulator instead:
See `ANDROID_EMULATOR_SETUP.md` for instructions.
