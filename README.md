# 2048 Capacitor (iOS/Android) & Web

[English](README.md) | [中文说明](README-zh.md)

This repository contains a simple implementation of the classic 2048 game for Capacitor (iOS/Android) and the web.

- Capacitor app in the repository root (`android/`, `ios/`, `capacitor.config.ts`).
- Web version in `capacitor-2048/web/index.html` (inline styles + game logic).

## Getting Started (Capacitor)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run on device or simulator:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## Sync Web Assets to Native

When `capacitor-2048/web/index.html` changes:

```bash
npx cap sync
```

## Building Android APKs

From the repository root:

```bash
cd android
./gradlew assembleDebug
./gradlew assembleRelease
```

Outputs:

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release (per-ABI split): `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`, `app-armeabi-v7a-release.apk`, etc.

Note: release builds are currently signed with the debug keystore and are intended for internal testing / side-loading, not for app store submission.

## Building iOS App

1. Open the iOS project:
   ```bash
   npx cap open ios
   ```
2. In Xcode, set your Team/Bundle ID in Signing & Capabilities, then Run (device) or Archive (distribution).

## Getting Started (Web)

- Open `capacitor-2048/web/index.html` directly in a browser, or
- Serve it with any static file server, for example:
  ```bash
  cd capacitor-2048/web
  npx serve .
  ```

## License

This project is licensed under the MIT License. See `LICENSE` for details.
