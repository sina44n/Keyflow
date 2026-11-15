import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Automatic development backend runner ensures Django on 127.0.0.1:8000 is always available
function djangoAutoStartPlugin() {
  let backendProc = null
  return {
    name: 'django-auto-start',
    configureServer(server) {
      if (process.env.NODE_ENV === 'production' || process.env.VITE_API_URL) return

      const backendDir = path.resolve(__dirname, '../backend')
      const isWin = process.platform === 'win32'
      const pythonPath = isWin
        ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
        : path.join(backendDir, '.venv', 'bin', 'python')

      if (!fs.existsSync(pythonPath)) return

      // Check if backend is already active on port 8000
      const checkReq = http.get('http://127.0.0.1:8000/api/health/', { timeout: 1500 }, (res) => {
        if (res.statusCode === 200) {
          console.log('[Django Auto-Start] Django backend is healthy on 127.0.0.1:8000.')
        }
      })
      checkReq.on('error', () => {
        console.log('[Django Auto-Start] Django is offline. Launching development backend on 127.0.0.1:8000...')
        try {
          backendProc = spawn(pythonPath, ['manage.py', 'runserver', '127.0.0.1:8000', '--noreload'], {
            cwd: backendDir,
            stdio: 'ignore',
            windowsHide: true,
          })
          backendProc.on('error', (err) => console.warn('[Django Auto-Start] Spawn warning:', err.message))
          backendProc.on('exit', (code) => {
            if (code !== null && code !== 0) console.warn('[Django Auto-Start] Django process exited with code:', code)
          })
        } catch (e) {
          console.warn('[Django Auto-Start] Spawn error:', e.message)
        }
      })
      checkReq.on('timeout', () => checkReq.destroy())

      const cleanUp = () => {
        if (backendProc && !backendProc.killed) {
          try {
            backendProc.kill()
          } catch {}
          backendProc = null
        }
      }

      process.on('exit', cleanUp)
      process.on('SIGINT', () => { cleanUp(); process.exit(); })
      process.on('SIGTERM', () => { cleanUp(); process.exit(); })
      server.httpServer?.on('close', cleanUp)
    },
  }
}

// https://vite.dev/config/
const proxyTarget = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    djangoAutoStartPlugin(),
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
