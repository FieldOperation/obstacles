# Gradle Build Tips

## First Build Takes Time

The first `npx expo run:android` build can take **5-10 minutes** because it:
- Downloads all Gradle dependencies
- Compiles native Android code
- Builds the entire app

**This is normal!** Subsequent builds will be much faster (30 seconds - 2 minutes).

## Java Installation Warning

If you see:
```
Invalid Java installation found at 'C:\Users\user\.gradle\.tmp\jdks\...'
```

**This is usually not critical** - the build will continue. However, if the build fails, try:

### Fix 1: Clear Gradle Cache
```powershell
cd mobile/android
.\gradlew clean
cd ..
```

### Fix 2: Reinstall Java JDK
1. Download JDK 17 from: https://adoptium.net/
2. Install it
3. Set `JAVA_HOME` environment variable to JDK installation path
4. Restart terminal

### Fix 3: Let Gradle Auto-Provision
Gradle will try to auto-provision Java. Just wait - it usually works.

## Build Progress

You'll see:
- `CONFIGURING` - Setting up build (takes longest on first build)
- `BUILDING` - Compiling code
- `INSTALLING` - Installing on emulator
- `RUNNING` - Starting the app

## If Build Fails

1. **Check Android Studio is installed**
2. **Make sure emulator is running**
3. **Try cleaning and rebuilding:**
   ```powershell
   cd mobile/android
   .\gradlew clean
   cd ..
   npx expo run:android
   ```

## Speeding Up Future Builds

After first build, subsequent builds are much faster because:
- Dependencies are cached
- Only changed files are recompiled
- Gradle daemon is running

## Current Status

Your build is currently **CONFIGURING** - this is the longest phase. Just wait for it to complete!
