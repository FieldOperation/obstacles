# Mobile App – Dependency Notes

## What Was Fixed

- **metro-react-native-babel-preset** – Removed. The app uses `babel-preset-expo` (via Expo), which is the correct preset. The deprecated `metro-react-native-babel-preset` was redundant.

## Remaining Warnings & Vulnerabilities

### High severity (4 vulnerabilities)

These come from **Expo's** internal dependencies (`@expo/cli` → `tar`, `cacache`):

- `tar` – Arbitrary file overwrite, symlink poisoning, path traversal

**Fix options:**

1. **Upgrade to Expo SDK 54** (recommended for production):
   ```bash
   npx expo install expo@^54
   ```
   Then follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk/). This is a breaking change and may require code adjustments.

2. **Keep Expo 52 for now** – The `tar` issues mainly affect extraction/installation. For a development or internal app, risk is lower.

### Other deprecation warnings (transitive)

These come from nested dependencies and can’t be fixed without upgrading Expo:

- `glob@7.2.3` / `glob@10.5.0`
- `@xmldom/xmldom@0.7.13`
- `@babel/plugin-proposal-async-generator-functions`

### react-native-vector-icons

Deprecated in favor of per-icon-family packages. See  
https://github.com/oblador/react-native-vector-icons/blob/master/MIGRATION.md  
`react-native-paper` still relies on it, so migration should wait until the paper stack supports the new icons.

## Summary

- ✅ Safe changes applied (removed unused metro preset)
- ⚠️ 4 high-severity vulnerabilities remain in Expo’s dependencies
- 📌 To resolve them fully: upgrade to Expo SDK 54 when ready
- 📌 App should run as-is; the vulnerabilities mainly affect `npm install` and packaging tools
