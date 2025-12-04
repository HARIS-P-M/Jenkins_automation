import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    strictPort: false,
    host: 'localhost',
    open: true
  },
  resolve: {
    alias: {
      'simple-peer': 'simple-peer/simplepeer.min.js',
    },
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  optimizeDeps: {
    include: ['simple-peer']
  }
})
