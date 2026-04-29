import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    allowedHosts: ['scilab-0069.informatik.uni-kl.de'],
  },
  build: {
    outDir: 'dist/frontend',
  },
})
