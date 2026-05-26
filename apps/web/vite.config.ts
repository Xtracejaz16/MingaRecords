import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // SPA fallback: serve index.html for unknown routes
    // Required because the app uses hash-based routing
    fs: {
      strict: false,
    },
  },
  preview: {
    // SPA fallback for preview server too
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
