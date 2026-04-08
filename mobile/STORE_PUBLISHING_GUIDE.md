# Publishing Obstacles CMS to App Stores

This guide walks you through publishing the Obstacles CMS mobile app to the **Apple App Store** and **Google Play Store** using EAS Build and EAS Submit.

---

## Costs (Required)

| Store | Fee | Notes |
|-------|-----|-------|
| **Apple App Store** | $99 USD/year | [Apple Developer Program](https://developer.apple.com/programs) |
| **Google Play Store** | $25 USD one-time | [Google Play Console](https://play.google.com/console/signup) |
| **Expo EAS** | Free tier available | [expo.dev/pricing](https://expo.dev/pricing) – builds on free plan |

---

## Overview

1. **EAS Build** – Builds production binaries (.ipa for iOS, .aab for Android) in the cloud
2. **EAS Submit** – Uploads those binaries to the stores
3. **Store consoles** – You complete metadata, screenshots, and submit for review

---

## Prerequisites Checklist

### Both stores
- [ ] Expo account ([expo.dev/signup](https://expo.dev/signup))
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`

### Apple App Store only
- [ ] Apple Developer account ($99/year)
- [ ] App created in [App Store Connect](https://appstoreconnect.apple.com/) with bundle ID `com.obstacles.cms`
- [ ] `ascAppId` (Apple ID of your app) – find in App Store Connect → Your App → App Information → General → Apple ID

### Google Play Store only
- [ ] Google Play Developer account ($25 one-time)
- [ ] App created in [Google Play Console](https://play.google.com/console/)
- [ ] **First upload must be manual** – Google requires this before API submissions work
- [ ] Google Service Account key (for automated submissions) – see [Expo’s guide](https://expo.fyi/creating-google-service-account)

---

## Step 1: Configure EAS Build

From the `mobile` folder:

```powershell
cd mobile
eas build:configure
```

This creates or updates `eas.json`. The project already has an `eas.json` with production profiles.

---

## Step 2: Build for Production

### Build both platforms

```powershell
eas build --platform all --profile production
```

### Or build one at a time

```powershell
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

EAS will prompt for credentials if needed:

- **iOS**: Sign in with your Apple ID; EAS can generate signing certificates and provisioning profiles
- **Android**: EAS can create a new keystore, or you can provide your own

Builds run in the cloud. You’ll get a link to monitor progress. When complete, you’ll get a download link for the build.

---

## Step 3: Prepare Store Assets

Before submission, prepare:

### App icon
- **iOS**: 1024×1024 px (no transparency)
- **Android**: 512×512 px

Expo uses the default icon if none is set. For custom icons, add to `app.json`:

```json
"icon": "./assets/icon.png"
```

### Screenshots (required per store)

**Apple App Store**
- iPhone 6.7": 1290×2796 px (or 3x)
- iPhone 6.5": 1284×2778 px
- iPad Pro 12.9": 2048×2732 px (if supporting iPad)

**Google Play**
- Phone: min 320 px, short side at least 320 px
- 7" tablet: 1024×500 px minimum
- 10" tablet: 1280×800 px minimum

### Store listing text
- App name: **Obstacles CMS**
- Short description (80 chars)
- Full description
- Privacy policy URL (required for both stores)
- Category (e.g. Business, Productivity)

---

## Step 4: Submit to Apple App Store

### 4.1 Create app in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. **My Apps** → **+** → **New App**
3. Platform: iOS
4. Name: **Obstacles CMS**
5. Primary language
6. Bundle ID: `com.obstacles.cms`
7. SKU: e.g. `obstacles-cms-001`
8. User Access: Full Access

### 4.2 Update eas.json with your Apple IDs

Edit `mobile/eas.json` and set your values:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_APPLE_TEAM_ID"
    }
  }
}
```

- **ascAppId**: App Store Connect → Your App → App Information → Apple ID (numeric)
- **appleTeamId**: [developer.apple.com/account](https://developer.apple.com/account) → Membership → Team ID

### 4.3 Submit the build

```powershell
eas submit --platform ios --profile production --latest
```

Or build and submit in one step:

```powershell
eas build --platform ios --profile production --auto-submit
```

### 4.4 Complete in App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com/) → Your App
2. Add screenshots, description, keywords, support URL, etc.
3. Answer the export compliance and content questions
4. In **TestFlight** or **App Store** tab, select the uploaded build
5. **Submit for Review**

Review often takes 24–48 hours.

---

## Step 5: Submit to Google Play Store

### 5.1 First-time manual upload (required)

Google needs one manual upload before EAS Submit can be used.

1. Download the `.aab` file from your EAS build
2. Go to [Google Play Console](https://play.google.com/console/)
3. Select your app (create it if needed with package `com.obstacles.cms`)
4. **Release** → **Production** (or **Internal testing** first) → **Create new release**
5. Upload the `.aab` file
6. Add release notes
7. Review and roll out

### 5.2 After the first manual upload

For later releases you can use EAS Submit:

```powershell
eas submit --platform android --profile production --latest
```

Or build + submit:

```powershell
eas build --platform android --profile production --auto-submit
```

### 5.3 Google Service Account (for automated submit)

1. Follow [Expo’s Google Service Account guide](https://expo.fyi/creating-google-service-account)
2. In the EAS dashboard: Your Project → **Credentials** → **Android** → add the JSON key
3. Or set in `eas.json`:
   ```json
   "android": {
     "serviceAccountKeyPath": "./path-to-your-key.json"
   }
   ```

### 5.4 Store listing in Play Console

1. **Store presence** → **Main store listing**
2. App name, short description, full description
3. Screenshots (phone and tablet)
4. Privacy policy URL
5. Content rating questionnaire
6. Target audience and ads declaration

---

## Quick Command Summary

| Action | Command |
|--------|---------|
| Configure EAS | `eas build:configure` |
| Build both platforms | `eas build --platform all --profile production` |
| Build + submit iOS | `eas build --platform ios --profile production --auto-submit` |
| Build + submit Android | `eas build --platform android --profile production --auto-submit` |
| Submit existing build | `eas submit --platform ios --latest` or `--platform android --latest` |
| List builds | `eas build:list` |

---

## Troubleshooting

### “No builds found”
Run a production build first: `eas build --platform ios --profile production`

### iOS: “Missing ascAppId”
Create the app in App Store Connect and add `ascAppId` to `eas.json`.

### Android: “First upload must be manual”
Use the Play Console to upload the first `.aab` manually. After that, EAS Submit works.

### Build fails
- Check [EAS Build troubleshooting](https://docs.expo.dev/build-reference/troubleshooting/)
- Ensure `app.json` has correct `bundleIdentifier` (iOS) and `package` (Android)
- Confirm you’re logged in: `eas whoami`

---

## Your App Identifiers

- **Bundle ID (iOS)**: `com.obstacles.cms`
- **Package (Android)**: `com.obstacles.cms`

---

## Further Reading

- [EAS Build – Create your first build](https://docs.expo.dev/build/setup)
- [EAS Submit – Introduction](https://docs.expo.dev/submit/introduction)
- [Submit to Apple App Store](https://docs.expo.dev/submit/ios/)
- [Submit to Google Play Store](https://docs.expo.dev/submit/android)
