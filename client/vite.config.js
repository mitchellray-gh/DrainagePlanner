import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Split large libraries into their own cacheable chunks. tfjs is also
        // dynamically imported, so it only downloads when the AI panel is used.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@tensorflow')) return 'tfjs'
          if (id.includes('leaflet')) return 'leaflet'
          if (id.includes('framer-motion')) return 'framer'
          if (id.includes('react')) return 'react-vendor'
          return 'vendor'
        }
      }
    }
  }
})
