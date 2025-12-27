import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { chromeExtensionReload } from './scripts/vite-plugin-chrome-reload'
import { copyManifest } from './scripts/vite-plugin-copy-manifest'
import { copySqlJs } from './scripts/vite-plugin-copy-sqljs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss(), copyManifest(), copySqlJs(), chromeExtensionReload()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        search: resolve(__dirname, 'search.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' 
            ? 'assets/[name].js' 
            : 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.html' || 
              assetInfo.name === 'search.html' || 
              assetInfo.name === 'sidepanel.html') {
            return '[name][extname]'
          }
          return 'assets/[name].[ext]'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: './',
})
