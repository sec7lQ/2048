# Android 调试指南

## 方法 1：Chrome DevTools 调试（推荐）

最简单有效的调试方法，适合调试 JavaScript/CSS/HTML 问题。

### 步骤：

1. 启动应用到 Android 设备/模拟器：
   ```bash
   npm run android
   ```

2. 在 Chrome 浏览器中打开：
   ```
   chrome://inspect
   ```

3. 找到你的应用（com.game2048）并点击 "inspect"

4. 使用 DevTools：
   - Console: 查看 JavaScript 错误和日志
   - Elements: 检查 DOM 和 CSS
   - Sources: 设置断点调试
   - Network: 查看网络请求
   - Performance: 性能分析

### 添加调试日志：

在你的 web/index.html 中添加 console.log：

```javascript
// 在关键位置添加日志
console.log('Game started');
console.log('Grid size:', gridSize);
console.log('Score:', score);
```

## 方法 2：Android Studio Logcat

查看 Android 系统日志和原生错误。

### 步骤：

1. 在 Android Studio 中打开项目：
   ```bash
   npm run open:android
   ```

2. 点击底部的 "Logcat" 标签

3. 过滤日志：
   - 在搜索框输入：`package:com.game2048`
   - 或搜索：`Capacitor` 查看 Capacitor 相关日志

4. 查看不同级别的日志：
   - Verbose (V): 详细信息
   - Debug (D): 调试信息
   - Info (I): 一般信息
   - Warn (W): 警告
   - Error (E): 错误

## 方法 3：使用 Capacitor CLI 实时重载

支持代码修改后自动刷新应用。

### 步骤：

1. 获取你的电脑 IP 地址：
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

2. 编辑 capacitor.config.json，添加 server 配置：
   ```json
   {
     "appId": "com.game2048",
     "appName": "2048",
     "webDir": "web",
     "server": {
       "url": "http://YOUR_IP:8080",
       "cleartext": true
     }
   }
   ```

3. 启动本地服务器（在 web 目录）：
   ```bash
   cd web
   npx serve -p 8080
   ```

4. 同步并运行：
   ```bash
   npx cap sync
   npm run android
   ```

5. 修改 web/index.html，保存后刷新应用即可看到变化

**注意**：调试完成后记得删除 server 配置！

## 方法 4：添加调试面板（推荐开发时使用）

在你的 web 应用中添加一个简单的调试面板。

### 在 web/index.html 中添加：

```html
<!-- 在 </body> 前添加 -->
<div id="debug-panel" style="
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.8);
  color: #0f0;
  font-family: monospace;
  font-size: 10px;
  padding: 8px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 9999;
  display: none;
"></div>

<script>
// 添加全局调试函数
window.debug = function(msg) {
  const panel = document.getElementById('debug-panel');
  panel.style.display = 'block';
  const time = new Date().toLocaleTimeString();
  panel.innerHTML += `[${time}] ${msg}<br>`;
  panel.scrollTop = panel.scrollHeight;
  console.log(msg);
};

// 捕获所有错误
window.addEventListener('error', function(e) {
  window.debug('ERROR: ' + e.message + ' at ' + e.filename + ':' + e.lineno);
});

// 使用示例
// window.debug('游戏开始');
// window.debug('分数: ' + score);
</script>
```

## 方法 5：检查 WebView 加载状态

如果应用打开后是空白屏幕，可能是 WebView 加载问题。

### 检查步骤：

1. 查看 Logcat 中的错误信息
2. 检查 web 文件是否正确同步：
   ```bash
   npx cap sync
   ```
3. 验证文件路径：
   ```bash
   ls -la android/app/src/main/assets/public/
   ```
   应该能看到 index.html

## 常见问题排查

### 1. 应用闪退
- 查看 Logcat 错误日志
- 检查是否有 JavaScript 错误（Chrome DevTools）

### 2. 白屏/空白屏幕
- 确保已运行 `npx cap sync`
- 检查 web/index.html 是否存在
- 查看 Chrome DevTools Console 是否有错误

### 3. 触摸/手势不响应
- 检查 CSS 的 `touch-action` 属性
- 查看是否有 JavaScript 错误阻止事件

### 4. 性能问题
- 使用 Chrome DevTools Performance 标签分析
- 检查动画是否使用了 GPU 加速（transform, opacity）
- 查看是否有内存泄漏

## 快速调试 checklist

- [ ] 设备/模拟器已连接（`adb devices`）
- [ ] 应用已安装并运行（`npm run android`）
- [ ] Chrome DevTools 已连接（`chrome://inspect`）
- [ ] 已检查 Console 是否有错误
- [ ] 已检查 Logcat 是否有错误
- [ ] web 文件已同步（`npx cap sync`）

## 有用的命令

```bash
# 查看连接的设备
adb devices

# 查看应用日志
adb logcat | grep -i capacitor

# 卸载应用
adb uninstall com.game2048

# 重新安装
npm run android

# 清除应用数据
adb shell pm clear com.game2048

# 同步 web 文件
npx cap sync

# 在 Android Studio 中打开
npm run open:android
```

## 推荐的调试工作流

1. **开发阶段**：使用 Chrome DevTools + 实时重载
2. **测试阶段**：在真机上测试，查看 Logcat
3. **发布前**：关闭所有调试日志，移除调试面板
