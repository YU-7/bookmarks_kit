# Chrome 扩展开发加速指南

## 🚀 快速开始

### 方法 1：使用 Watch 模式（推荐）

这是最简单的方法，只需要一个命令：

```bash
npm run dev
# 或
pnpm dev
```

这个命令会：
- ✅ 监听文件变化并自动重新构建
- ✅ 自动复制 manifest.json 和图标文件到 dist 目录
- ✅ 在构建完成时提示你刷新扩展

**使用步骤：**
1. 运行 `npm run dev` 或 `pnpm dev`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目的 `dist` 目录
5. 每次保存代码后，构建会自动完成，控制台会显示提示
6. 在扩展页面点击刷新图标 🔄 即可看到更改

### 方法 2：使用文件监听提示（可选）

如果你想在文件变化时收到更明显的提示，可以在另一个终端运行：

```bash
npm run watch
# 或
pnpm watch
```

这个脚本会监听 `dist` 目录的变化，并在控制台显示提示。

### 方法 3：使用 Chrome Extension Reloader（最自动化）

1. 安装 [Chrome Extension Reloader](https://chrome.google.com/webstore/detail/fimgfedafeadlieiabdeeaodndnlbhid) 扩展
2. 配置扩展ID（在 `chrome://extensions/` 页面可以找到你的扩展ID）
3. 这样每次文件变化后，扩展会自动重载（需要配合方法1使用）

## ⌨️ 快捷键提示

在 Chrome 扩展页面 (`chrome://extensions/`)：
- **Windows/Linux**: 在扩展卡片上按 `Ctrl+R` 快速重载
- **Mac**: 在扩展卡片上按 `Cmd+R` 快速重载

或者直接点击扩展卡片上的刷新图标 🔄

## 📋 开发工作流

1. **启动开发模式**：`npm run dev` 或 `pnpm dev`
2. **加载扩展**：在 Chrome 中加载 `dist` 目录作为扩展
3. **修改代码**：编辑你的源代码文件
4. **保存文件**：保存后 Vite 会自动重新构建
5. **刷新扩展**：在扩展页面点击刷新图标 🔄（控制台会提示）
6. **测试更改**：验证你的修改是否正确

## ⚠️ 注意事项

- `dist` 目录会在每次构建时清空，manifest.json 和图标文件会自动复制
- **Background service worker** 的更改需要完全重载扩展才能生效
- **Content scripts** 的更改也需要重载扩展
- **Popup** 和 **Sidepanel** 页面的更改通常在重载扩展后立即生效
- 确保在 Chrome 中加载的是 `dist` 目录，而不是源代码目录

## 🔧 技术细节

项目使用了以下 Vite 插件来加速开发：
- `copyManifest()`: 自动复制 manifest.json 和图标文件
- `chromeExtensionReload()`: 在构建完成时显示重载提示

这些插件会在每次构建时自动运行，无需额外配置。
