import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Vite 插件：复制 sql.js 的 WASM 文件到 dist 目录
 */
export function copySqlJs() {
  const rootDir = resolve(__dirname, '..')
  const sqlJsDist = resolve(rootDir, 'node_modules', 'sql.js', 'dist')
  const targetDir = resolve(rootDir, 'dist', 'assets', 'sqljs')

  return {
    name: 'copy-sqljs',
    buildStart() {
      // 监听 sql.js 文件变化
      const wasmFile = join(sqlJsDist, 'sql-wasm.wasm')
      const jsFile = join(sqlJsDist, 'sql-wasm.js')
      // @ts-ignore - Vite plugin context
      if (this.addWatchFile && existsSync(wasmFile)) {
        // @ts-ignore - Vite plugin context
        this.addWatchFile(wasmFile)
        // @ts-ignore - Vite plugin context
        if (existsSync(jsFile)) this.addWatchFile(jsFile)
      }
    },
    writeBundle() {
      // 在所有文件写入后复制 sql.js 文件
      try {
        if (!existsSync(sqlJsDist)) {
          console.warn('⚠️ sql.js dist 目录不存在，跳过复制')
          return
        }

        // 创建目标目录
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }

        // 复制 WASM 文件
        const wasmFile = join(sqlJsDist, 'sql-wasm.wasm')
        if (existsSync(wasmFile)) {
          const targetWasm = join(targetDir, 'sql-wasm.wasm')
          copyFileSync(wasmFile, targetWasm)
          console.log('✅ sql-wasm.wasm copied to dist/assets/sqljs/')
        }

        // 复制 JS 文件（如果需要）
        const jsFile = join(sqlJsDist, 'sql-wasm.js')
        if (existsSync(jsFile)) {
          const targetJs = join(targetDir, 'sql-wasm.js')
          copyFileSync(jsFile, targetJs)
          console.log('✅ sql-wasm.js copied to dist/assets/sqljs/')
        }
      } catch (error) {
        console.error('❌ 复制 sql.js 文件失败:', error)
      }
    }
  }
}
