import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@esportexe/types': path.resolve(__dirname, '../../packages/@esportexe/types/src/index.ts'),
      '@esportexe/websocket-client': path.resolve(__dirname, '../../packages/@esportexe/websocket-client/src/index.ts'),
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
