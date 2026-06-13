import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Proxy /api/* requests to Wrangler Pages Functions during local dev.
  // Run `npm run dev:api` in a separate terminal to start the Functions
  // server on port 8788, then `npm run dev` (or `npm run dev:full` for both).
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
