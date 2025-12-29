# 2048 React Native 与 Web 版本

[English](README.md) | [中文说明](README-zh.md)

本仓库包含经典 2048 游戏的两个实现：React Native 版本和 Web 版本。

- `rn/`：使用函数组件和 hooks 的 React Native 实现。
- `web/`：独立的浏览器版本，所有样式和游戏逻辑都在 `web/index.html` 中。

## 快速开始（React Native）

1. 安装依赖：
   ```bash
   cd rn
   npm install
   ```
2. 启动 Metro：
   ```bash
   npm run start
   ```
3. 在设备或模拟器上运行：
   ```bash
   npm run android
   # 或
   npm run ios
   ```

## 快速开始（Web）

- 直接在浏览器中打开 `web/index.html`，或
- 使用任意静态文件服务器进行本地服务，例如：
  ```bash
  cd web
  npx serve .
  ```

## 许可证

本项目使用 MIT 开源许可证，详情见 `LICENSE` 文件。

