import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /predict, /classes, /health → Flask at :5000
      // This avoids all CORS issues by making requests same-origin
      '/predict': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/classes': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
