# Push Notifications Setup

Push notifications are sent when a case is **created** or **closed**. OTHERS-role users receive them even when the app is closed.

## 1. Run SQL in Supabase

Run `ADD_PUSH_TOKENS.sql` in Supabase SQL Editor to create the `push_tokens` table.

## 2. Set Expo Project ID

For Expo Push Token to work, add to your `mobile/.env`:

```
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

Find your project ID at [expo.dev](https://expo.dev) → your project → Overview.

## 3. Development Build Required

Push notifications **do not work in Expo Go** on Android (SDK 53+). Use a development build:

```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

Or build with EAS:

```bash
eas build --profile development --platform android
```

## 4. Permissions

- On first launch, users are prompted for notification permission after login.
- Tokens are saved to `push_tokens` and used to send notifications when cases are created or closed.
- OTHERS-role users must have logged in at least once so their token is stored.
