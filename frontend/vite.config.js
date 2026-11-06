import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const proxyTarget = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error(`[Vite Proxy Error] Backend at ${proxyTarget} is unreachable:`, err.message);
            if (!res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: `Backend service unreachable at ${proxyTarget}. In local development, ensure Django is running (manage.py runserver).`,
                code: 'BACKEND_OFFLINE',
                target: proxyTarget
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
        target: proxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error(`[Vite Preview Proxy Error] Backend at ${proxyTarget} is unreachable:`, err.message);
            if (!res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: `Backend service unreachable at ${proxyTarget}. Ensure backend is running.`,
                code: 'BACKEND_OFFLINE',
                target: proxyTarget
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
