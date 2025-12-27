import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Vite 插件：自动复制 manifest.json 和图标文件到 dist 目录
 */
export function copyManifest() {
  const rootDir = resolve(__dirname, '..')
  const manifestSrc = resolve(rootDir, 'manifest.json')
  const iconsSrc = resolve(rootDir, 'icons')
  
  return {
    name: 'copy-manifest',
    buildStart() {
      // 监听文件变化，以便在开发模式下重新构建
      // @ts-ignore - Vite plugin context
      if (this.addWatchFile) {
        // @ts-ignore - Vite plugin context
        this.addWatchFile(manifestSrc)
        if (existsSync(iconsSrc)) {
          const files = readdirSync(iconsSrc)
          files.forEach(file => {
            const filePath = join(iconsSrc, file)
            if (statSync(filePath).isFile()) {
              // @ts-ignore - Vite plugin context
              this.addWatchFile(filePath)
            }
          })
        }
      }
    },
    writeBundle() {
      // 在所有文件写入后复制 manifest 和图标
      try {
        // 复制 manifest.json
        const manifestDest = resolve(rootDir, 'dist', 'manifest.json')
        const distDir = dirname(manifestDest)
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true })
        }
        copyFileSync(manifestSrc, manifestDest)
        console.log('✅ Manifest.json copied to dist/')
        
        // 复制图标文件
        const iconsDest = resolve(rootDir, 'dist', 'icons')
        if (existsSync(iconsSrc)) {
          if (!existsSync(iconsDest)) {
            mkdirSync(iconsDest, { recursive: true })
          }
          
          const files = readdirSync(iconsSrc)
          files.forEach(file => {
            const srcPath = join(iconsSrc, file)
            const destPath = join(iconsDest, file)
            if (statSync(srcPath).isFile()) {
              copyFileSync(srcPath, destPath)
            }
          })
          console.log('✅ Icons copied to dist/icons/')
        }
      } catch (error) {
        console.error('❌ 复制 manifest 和图标文件失败:', error)
      }
    },
  }
}

