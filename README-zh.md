# 2048 Capacitor（iOS/Android）与 Web 版本

[English](README.md) | [中文说明](README-zh.md)

本仓库包含经典 2048 游戏的两个实现：Capacitor（iOS/Android）版本和 Web 版本。

- 仓库根目录：Capacitor App（`android/`、`ios/`、`capacitor.config.ts`）。
- `capacitor-2048/web/`：独立的浏览器版本，所有样式和游戏逻辑都在 `capacitor-2048/web/index.html` 中。

## 快速开始（Capacitor）

1. 安装依赖：
   ```bash
   npm install
   ```
2. 在设备或模拟器上运行：
   ```bash
   npm run android
   # 或
   npm run ios
   ```

## 同步 Web 资源到原生工程

当 `capacitor-2048/web/index.html` 有改动时：

```bash
npx cap sync
```

## Android 安装包构建

在仓库根目录执行：

```bash
cd android
./gradlew assembleDebug
./gradlew assembleRelease
```

打包结果：

- Debug：`android/app/build/outputs/apk/debug/app-debug.apk`
- Release（按 ABI 拆分）：`android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`、`app-armeabi-v7a-release.apk` 等。

注意：当前 Release 使用的是 debug keystore，仅适合自用/内测，不适合提交应用商店。

## iOS 构建与安装

1. 打开 iOS 工程：
   ```bash
   npx cap open ios
   ```
2. 在 Xcode 的 Signing & Capabilities 中设置 Team/Bundle ID，然后 Run 真机安装或 Archive 打包分发。

## 快速开始（Web）

- 直接在浏览器中打开 `capacitor-2048/web/index.html`，或
- 使用任意静态文件服务器进行本地服务，例如：
  ```bash
  cd capacitor-2048/web
  npx serve .
  ```

## 许可证

本项目使用 MIT 开源许可证，详情见 `LICENSE` 文件。
