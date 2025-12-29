# 2048 React Native & Web

[English](README.md) | [中文说明](README-zh.md)

This repository contains a simple implementation of the classic 2048 game for both React Native (`rn/`) and the web (`web/`).

- `rn/`: React Native implementation using function components and hooks.
- `web/`: Standalone browser version with inline styles and game logic in `web/index.html`.

## Getting Started (React Native)

1. Install dependencies:
   ```bash
   cd rn
   npm install
   ```
2. Start Metro:
   ```bash
   npm run start
   ```
3. Run on device or simulator:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## Getting Started (Web)

- Open `web/index.html` directly in a browser, or
- Serve it with any static file server, for example:
  ```bash
  cd web
  npx serve .
  ```

## License

This project is licensed under the MIT License. See `LICENSE` for details.
