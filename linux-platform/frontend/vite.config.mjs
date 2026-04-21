import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const frontendPort = Number(process.env.FRONTEND_PORT || 19307)
const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 18681)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true
      }
    }
  }
})
