# Java 17 Setup for Android Build

## Problem
Android Gradle plugin requires Java 17, but you have Java 11 installed.

## Solution: Install Java 17

### Option 1: Download Java 17 (Recommended)

1. **Download Java 17:**
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Download "JDK 17" for Windows x64
   - Install it (default location: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot`)

2. **Set JAVA_HOME:**
   ```powershell
   # Find your Java 17 installation path
   # Usually: C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
   
   # Set for current session
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot"
   
   # Set permanently (run as Administrator)
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot', 'Machine')
   ```

3. **Verify:**
   ```powershell
   java -version
   # Should show version 17
   ```

### Option 2: Use Android Studio's Bundled JDK

If Android Studio is installed, it includes Java 17:

1. **Find Android Studio JDK:**
   - Usually at: `C:\Users\YourUsername\AppData\Local\Android\Sdk\jbr`
   - Or: `C:\Program Files\Android\Android Studio\jbr`

2. **Configure Gradle to use it:**
   Edit `mobile/android/gradle.properties` and add:
   ```properties
   org.gradle.java.home=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk\\jbr
   ```
   (Use double backslashes `\\` in the path)

### Option 3: Quick Fix - Configure gradle.properties

After installing Java 17, add this to `mobile/android/gradle.properties`:

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.x.x.x-hotspot
```

Replace the path with your actual Java 17 installation path.

## After Installing Java 17

1. **Restart your terminal**
2. **Verify Java version:**
   ```powershell
   java -version
   ```
3. **Try building again:**
   ```powershell
   cd mobile
   npx expo run:android
   ```

## Quick Check

Run this to see if Java 17 is already installed somewhere:
```powershell
Get-ChildItem "C:\Program Files" -Filter "*jdk*17*" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
```
