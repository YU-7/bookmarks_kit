import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

// 复制 manifest.json
const manifestSrc = resolve(rootDir, 'manifest.json')
const manifestDest = resolve(rootDir, 'dist', 'manifest.json')
copyFileSync(manifestSrc, manifestDest)
console.log('✅ Manifest.json copied to dist/')

// 复制图标文件
const iconsSrc = resolve(rootDir, 'icons')
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
      console.log(`✅ Icon ${file} copied to dist/icons/`)
    }
  })
} else {
  console.warn('⚠️  Icons directory not found. Please add icon files to icons/ directory.')
}

