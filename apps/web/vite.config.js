import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
// import { visualizer } from 'rollup-plugin-visualizer'

// Plugin to build and copy service worker and PWA assets
const serviceWorkerPlugin = () => ({
  name: 'service-worker',
  async writeBundle() {
    try {
      const esbuild = await import('esbuild')
      const result = await esbuild.build({
        entryPoints: ['./src/sw.ts'],
        bundle: false,
        write: false,
        format: 'esm',
        target: 'es2020',
        platform: 'browser',
      })
      fs.writeFileSync('./dist/sw.js', result.outputFiles[0].text)
    } catch {
      fs.copyFileSync('./src/sw.ts', './dist/sw.js')
    }
    
    fs.copyFileSync('./public/manifest.json', './dist/manifest.json')
    if (!fs.existsSync('./dist/icons')) fs.mkdirSync('./dist/icons')
    fs.copyFileSync('./public/icons/icon-192x192.svg', './dist/icons/icon-192x192.svg')
    fs.copyFileSync('./public/icons/icon-512x512.svg', './dist/icons/icon-512x512.svg')
  }
})

export default defineConfig({
  plugins: [
    react(), 
    serviceWorkerPlugin(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@hub-1': path.resolve(__dirname, './src/hub-1-sator'),
      '@hub-2': path.resolve(__dirname, './src/hub-2-rotas'),
      '@hub-3': path.resolve(__dirname, './src/hub-3-arepo'),
      '@hub-4': path.resolve(__dirname, './src/hub-4-opera'),
      '@hub-5': path.resolve(__dirname, './src/hub-5-tenet'),
      '@njz/types': path.resolve(__dirname, '../../packages/@njz/types/src/index.ts'),
      '@njz/ui': path.resolve(__dirname, '../../packages/@njz/ui/src/index.ts'),
      '@sator/types': path.resolve(__dirname, '../../packages/shared/types'),
      '@sator/services': path.resolve(__dirname, '../../packages/shared/services/help')
    },
    dedupe: ['react', 'react-dom', 'framer-motion']
  },
  worker: {
    format: 'es',
    minify: 'esbuild'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'vendor-three'
          }
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap'
          }
        },
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.css$/i.test(name)) return 'css/[name]-[hash][extname]'
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) return 'img/[name]-[hash][extname]'
          return 'assets/[name]-[hash][extname]'
        },
      }
    },
    cssCodeSplit: true,
    cssMinify: true,
  },
  server: {
    port: 5173,
    open: true,
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.ico'],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
