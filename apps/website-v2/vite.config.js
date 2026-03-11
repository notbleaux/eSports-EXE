import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/eSports-EXE/platform/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@hub-1': path.resolve(__dirname, './src/hub-1-sator'),
      '@hub-2': path.resolve(__dirname, './src/hub-2-rotas'),
      '@hub-3': path.resolve(__dirname, './src/hub-3-arepo'),
      '@hub-4': path.resolve(__dirname, './src/hub-4-opera')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion', 'gsap', '@gsap/react'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})