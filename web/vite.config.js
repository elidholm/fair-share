import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: ['fairshare.fun', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://api_v1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Node 24+ ships an experimental global `localStorage`/`sessionStorage` that
    // shadows the one jsdom provides for the test environment, breaking
    // `localStorage` access in tests. Disable it in the worker processes.
    execArgv: ['--no-experimental-webstorage'],
  },
});
