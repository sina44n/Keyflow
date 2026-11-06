import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Proxy Error] Django backend at 127.0.0.1:8000 is unreachable:', err.message);
            if (!res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend service unreachable. Ensure Django is running on 127.0.0.1:8000 (manage.py runserver).',
                code: 'BACKEND_OFFLINE'
              }));
            }
          });
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Preview Proxy Error] Django backend at 127.0.0.1:8000 is unreachable:', err.message);
            if (!res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend service unreachable. Ensure Django is running on 127.0.0.1:8000.',
                code: 'BACKEND_OFFLINE'
              }));
            }
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 15000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@clerk')) return 'vendor-clerk';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            return 'vendor';
          }
          if (id.includes('curriculum')) {
            return 'academy-curriculum';
          }
        },
      },
    },
  },
})
