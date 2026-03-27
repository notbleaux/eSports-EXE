import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@njz/types': path.resolve(__dirname, '../../packages/@njz/types/src/index.ts'),
      '@njz/websocket-client': path.resolve(__dirname, '../../packages/@njz/websocket-client/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: 'index.html',
      },
    },
  },
})
