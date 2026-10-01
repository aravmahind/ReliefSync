import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
      '/admin/volunteers': 'http://localhost:5001',
      '/admin/requests': 'http://localhost:5001',
    },
  },
})
