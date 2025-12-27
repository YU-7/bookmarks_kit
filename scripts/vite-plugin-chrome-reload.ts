/**
 * Vite 插件：在开发模式下自动提示重载 Chrome 扩展
 */
export function chromeExtensionReload() {
  return {
    name: 'chrome-extension-reload',
    buildEnd() {
      console.log('\n✨ 构建完成！请在 Chrome 扩展页面点击"重新加载"按钮')
      console.log('   chrome://extensions/ → 找到你的扩展 → 点击刷新图标 🔄\n')
    },
  }
}

