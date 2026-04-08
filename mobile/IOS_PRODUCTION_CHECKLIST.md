# iOS Production Checklist — Obstacles CMS

Step-by-step to get the mobile app on the **Apple App Store**. Do these in order.

---

## Prerequisites (before building)

### 1. Apple Developer account
- Enroll at [developer.apple.com/programs](https://developer.apple.com/programs) — **$99 USD/year**.
- Wait for approval if new.

### 2. Expo / EAS
- Create an Expo account: [expo.dev/signup](https://expo.dev/signup).
- Install EAS CLI and log in:
  ```powershell
  npm install -g eas-cli
  eas login
  ```
- Link the project (from the `mobile` folder) if needed:
  ```powershell
  cd mobile
  eas build:configure
  ```

### 3. Production environment variables (Supabase)
The app uses **Supabase** for auth and data (same as the web). The production build must have:

- `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL (same as obstaclessystem.net).
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key.

**Option A – EAS Secrets (recommended; no keys in repo)**  
From the `mobile` folder:
```powershell
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_anon_key_here"
```

**Option B – Local .env for build**  
Create or edit `mobile/.env` (do not commit; add to .gitignore):
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```
Then run the build; EAS will use `.env` when present.

Use the same Supabase project as your live site (obstaclessystem.net).

---

## Step 1: Create the app in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → **My Apps**.
2. Click **+** → **New App**.
3. **Platform:** iOS.  
4. **Name:** Obstacles CMS.  
5. **Primary language:** e.g. English.  
6. **Bundle ID:** Select or create one with **`com.obstacles.cms`** (must match `app.json` → `expo.ios.bundleIdentifier`).  
7. **SKU:** e.g. `obstacles-cms-001`.  
8. **User Access:** Full Access.  
9. Create the app.

**Get the Apple ID (numeric):**  
In App Store Connect → your app → **App Information** → **General** → note the **Apple ID** (e.g. `1234567890`). You’ll use it as `ascAppId` for EAS Submit.

**Get your Team ID:**  
[developer.apple.com/account](https://developer.apple.com/account) → **Membership** → **Team ID**.

---

## Step 2: Set EAS Submit config for iOS

Edit **`mobile/eas.json`**. Under `submit.production.ios` set your IDs:

```json
"submit": {
  "production": {
    "android": { ... },
    "ios": {
      "ascAppId": "YOUR_APPLE_ID_FROM_APP_STORE_CONNECT",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

Replace with the numeric Apple ID and Team ID you noted above.

---

## Step 3: Build for iOS (production)

From the **`mobile`** folder:

```powershell
cd mobile
eas build --platform ios --profile production
```

- EAS will prompt for **Apple ID** and possibly **password / app-specific password** and **distribution certificate** choices. You can let EAS create and manage credentials.
- Build runs in the cloud. When it finishes, you’ll get a link to download the `.ipa` (or use **Submit** in the next step).

---

## Step 4: Submit the build to App Store Connect

After a successful build:

```powershell
eas submit --platform ios --profile production --latest
```

Or next time you can build and submit in one go:

```powershell
eas build --platform ios --profile production --auto-submit
```

The build will appear in **App Store Connect** under your app → **TestFlight** (and later **App Store** when you submit for review).

---

## Step 5: Store listing in App Store Connect

1. In [App Store Connect](https://appstoreconnect.apple.com/) → your app.
2. **App Information:** Name, subtitle, category (e.g. Business or Productivity), privacy policy URL (required).
3. **Pricing:** Free or paid.
4. **Prepare for Submission:**  
   - **Screenshots:** e.g. iPhone 6.7" (1290×2796 px). You can use simulator or device.  
   - **Description,** **Keywords,** **Support URL.**  
   - **Version:** 1.0.0 (match `app.json`).  
   - **Build:** Select the build you submitted with EAS.
5. Answer **Export Compliance** and any **Content / Advertising** questions.
6. Click **Submit for Review**.

Apple review usually takes **24–48 hours**.

---

## Step 6: App icon (optional but recommended)

- **iOS:** 1024×1024 px, no transparency.  
- In **`mobile/app.json`** you can set: `"icon": "./assets/icon.png"`.  
- Replace `mobile/assets/icon.png` with your 1024×1024 icon and rebuild if you change it.

---

## Quick reference

| Item | Value |
|------|--------|
| Bundle ID | `com.obstacles.cms` |
| App name | Obstacles CMS |
| Env vars (production) | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Build | `eas build --platform ios --profile production` |
| Submit | `eas submit --platform ios --profile production --latest` |
| Full guide | `STORE_PUBLISHING_GUIDE.md` |

---

## If something fails

- **Build fails:** Check [expo.dev/build](https://expo.dev/build) for logs. Ensure Supabase env vars are set (EAS secrets or `.env`).
- **Submit fails:** Confirm `ascAppId` and `appleTeamId` in `eas.json` and that the app exists in App Store Connect with bundle ID `com.obstacles.cms`.
- **App crashes / no data:** Ensure production Supabase URL and anon key are the same project as obstaclessystem.net.
