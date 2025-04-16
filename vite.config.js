import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // 确保将资源复制到输出目录
    assetsInlineLimit: 0,
  },
  // 解决 Chrome 扩展的 CSP 问题
  server: {
    port: 3000,
    strictPort: true,
  },
  // 确保所有资源都有正确的路径
  base: './',
})
