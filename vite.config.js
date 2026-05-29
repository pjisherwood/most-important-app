import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Single-chunk build — keeps deployment simple
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
