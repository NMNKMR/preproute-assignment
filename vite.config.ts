/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Proxy /api to the real backend in dev so the browser never makes a
      // cross-origin request (the staging API does not allow CORS from localhost).
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      css: true,
      pool: 'threads',
      include: ['tests/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    },
  }
})
