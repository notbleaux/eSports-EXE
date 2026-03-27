import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@njz/types': path.resolve(__dirname, '../../packages/@njz/types/src/index.ts'),
      '@njz/ui': path.resolve(__dirname, '../../packages/@njz/ui/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
})
