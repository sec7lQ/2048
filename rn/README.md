# RN 2048

React Native 实现的 2048，支持滑动/按键移动、合并弹跳动画、计分和历史最高分（AsyncStorage 持久化）。

## 运行与打包（APK）

1. 安装依赖（需 Node/npm/yarn 环境）：
   ```bash
   npm install
   # 或 yarn install
   ```
2. Android 端准备：
   - 安装 Android Studio、SDK、platform-tools，配置 `ANDROID_HOME`。
   - 启用 USB 调试的真机或启动 Android 模拟器。
3. 启动 Metro 并安装到设备：
   ```bash
   npm run start   # 启动打包服务
   npm run android # 安装并运行
   ```
4. 生成 APK（调试版）：
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   产物在 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 主要文件
- `App.js`：核心逻辑和 UI，使用 `PanResponder` 监听滑动，`Animated` 处理平移/缩放动画，`AsyncStorage` 保存最佳分数。
- `index.js` / `app.json` / `babel.config.js`：RN 入口与配置。
- `package.json`：依赖与脚本。

> 此仓库未包含 android/ios 原生目录；如果你用 `npx react-native init` 新建工程后，把这些 JS 文件覆盖进去即可运行与打包。
