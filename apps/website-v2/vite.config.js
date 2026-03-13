import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin to build and copy service worker and PWA assets
const serviceWorkerPlugin = () => ({
  name: 'service-worker',
  writeBundle() {
    // Copy sw.ts to dist as sw.js
    const swSource = fs.readFileSync('./src/sw.ts', 'utf-8')
    const swJS = swSource
      .replace(/: \w+/g, '')
      .replace(/: [A-Z][a-zA-Z<>]*/g, '')
      .replace(/interface \w+ \{[^}]+\}/g, '')
      .replace(/type \w+ = .+/g, '')
      .replace(/import\/export type[^;]+;/g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/<>/g, '')
    
    fs.writeFileSync('./dist/sw.js', swJS)
    
    // Copy manifest and icons
    fs.copyFileSync('./public/manifest.json', './dist/manifest.json')
    
    // Copy icons (SVG for now, PNG would be generated in production)
    if (!fs.existsSync('./dist/icons')) fs.mkdirSync('./dist/icons')
    fs.copyFileSync('./public/icons/icon-192x192.svg', './dist/icons/icon-192x192.svg')
    fs.copyFileSync('./public/icons/icon-512x512.svg', './dist/icons/icon-512x512.svg')
    
    console.log('[Vite] PWA assets built')
  }
})

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@hub-1': path.resolve(__dirname, './src/hub-1-sator'),
      '@hub-2': path.resolve(__dirname, './src/hub-2-rotas'),
      '@hub-3': path.resolve(__dirname, './src/hub-3-arepo'),
      '@hub-4': path.resolve(__dirname, './src/hub-4-opera'),
      '@hub-5': path.resolve(__dirname, './src/hub-5-tenet')
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