import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built site works from any address, including a sub-folder.
  base: './',
  // satellite.js ships an optional WebAssembly worker that uses top-level await.
  worker: { format: 'es' },
})
