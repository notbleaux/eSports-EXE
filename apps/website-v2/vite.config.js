import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin to build and copy service worker and PWA assets
const serviceWorkerPlugin = () => ({
  name: 'service-worker',
  async writeBundle() {
    // Use esbuild to properly compile sw.ts to sw.js
    const esbuild = await import('esbuild')
    
    try {
      const result = await esbuild.build({
        entryPoints: ['./src/sw.ts'],
        bundle: false,
        write: false,
        format: 'esm',
        target: 'es2020',
        platform: 'browser',
      })
      
      fs.writeFileSync('./dist/sw.js', result.outputFiles[0].text)
      console.log('[Vite] Service Worker built with esbuild')
    } catch (err) {
      console.error('[Vite] Service Worker build failed:', err)
      // Fallback: copy as-is if build fails
      const swSource = fs.readFileSync('./src/sw.ts', 'utf-8')
      fs.writeFileSync('./dist/sw.js', swSource)
    }
    
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
  worker: {
    format: 'es'
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion', 'gsap', '@gsap/react'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Note: @tensorflow/tfjs is loaded dynamically via import() - NOT in bundle
          'analytics': ['./src/dev/ml-analytics.ts', './src/services/analyticsSync.ts']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})