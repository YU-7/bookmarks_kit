/**
 * 监听 dist 目录变化并提示重载扩展
 * 使用方法：在另一个终端运行 node scripts/watch-and-reload.js
 */

import { watch } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = resolve(__dirname, '..', 'dist')

console.log('👀 正在监听 dist 目录变化...')
console.log(`📁 监听目录: ${distDir}\n`)

let reloadTimer = null

watch(distDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return
  
  // 忽略临时文件
  if (filename.includes('.tmp') || filename.includes('~')) return
  
  // 防抖：300ms 内的变化只提示一次
  if (reloadTimer) {
    clearTimeout(reloadTimer)
  }
  
  reloadTimer = setTimeout(() => {
    console.log('\n✨ 检测到文件变化:', filename)
    console.log('🔄 请在 Chrome 扩展页面点击"重新加载"按钮')
    console.log('   chrome://extensions/ → 找到你的扩展 → 点击刷新图标\n')
  }, 300)
})

console.log('💡 提示：')
console.log('   1. 打开 chrome://extensions/')
console.log('   2. 开启"开发者模式"')
console.log('   3. 找到你的扩展，点击刷新图标 🔄')
console.log('   4. 或者使用快捷键：在扩展卡片上按 Ctrl+R (Windows) / Cmd+R (Mac)\n')

