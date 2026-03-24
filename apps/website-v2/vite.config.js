import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { visualizer } from 'rollup-plugin-visualizer'

// Plugin to build and copy service worker and PWA assets
const serviceWorkerPlugin = () => ({
  name: 'service-worker',
  async writeBundle() {
    // Try to use esbuild, fallback to simple copy if not available
    let swSource;
    
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
      swSource = result.outputFiles[0].text
      console.log('[Vite] Service Worker built with esbuild')
    } catch (err) {
      // Fallback: copy as-is if esbuild not available or build fails
      console.log('[Vite] esbuild not available, copying sw.ts as-is')
      swSource = fs.readFileSync('./src/sw.ts', 'utf-8')
    }
    
    fs.writeFileSync('./dist/sw.js', swSource)
    
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
  plugins: [
    react(), 
    serviceWorkerPlugin(),
    visualizer({
      filename: './dist/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  // Base path: '/' for Vercel, '/eSports-EXE/' for GitHub Pages/local
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
      '@sator/types': path.resolve(__dirname, '../../packages/shared/types'),
      '@sator/services': path.resolve(__dirname, '../../packages/shared/services/help')
    },
    dedupe: ['react', 'react-dom', 'framer-motion']
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'js/workers/[name]-[hash].js'
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
    // Enable minification optimizations
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Advanced manual chunks for optimal code splitting
        manualChunks: (id) => {
          // React core ecosystem - always needed for initial render
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-core';
          }
          
          // State management and data fetching
          if (id.includes('node_modules/@tanstack/react-query') || 
              id.includes('node_modules/zustand')) {
            return 'data-layer';
          }
          
          // UI Animation - medium priority
          if (id.includes('node_modules/framer-motion')) {
            return 'ui-animation';
          }
          
          // Advanced animation (GSAP) - lazy loaded when needed
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) {
            return 'gsap-vendor';
          }
          
          // Three.js 3D - heavy, only loaded when 3D components mount
          if (id.includes('node_modules/three') || 
              id.includes('node_modules/@react-three/fiber') || 
              id.includes('node_modules/@react-three/drei')) {
            return 'three-vendor';
          }
          
          // ML/TensorFlow - very heavy, strictly on-demand
          if (id.includes('node_modules/@tensorflow')) {
            return 'ml-vendor';
          }
          
          // ONNX runtime - separate from TF.js
          if (id.includes('node_modules/onnxruntime-web')) {
            return 'onnx-vendor';
          }
          
          // Charting and visualization
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts-vendor';
          }
          
          // Utility libraries - group small utilities together
          if (id.includes('node_modules/clsx') || 
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/lucide-react')) {
            return 'utils-vendor';
          }
          
          // Grid layout - used in dashboard
          if (id.includes('node_modules/react-grid-layout')) {
            return 'grid-vendor';
          }
          
          // Virtualization - for large lists
          if (id.includes('node_modules/@tanstack/react-virtual')) {
            return 'virtual-vendor';
          }
          
          // Hub-specific chunks - each hub gets its own chunk
          if (id.includes('/hub-1-sator/')) {
            return 'hub-sator';
          }
          if (id.includes('/hub-2-rotas/')) {
            return 'hub-rotas';
          }
          if (id.includes('/hub-3-arepo/')) {
            return 'hub-arepo';
          }
          if (id.includes('/hub-4-opera/')) {
            return 'hub-opera';
          }
          if (id.includes('/hub-5-tenet/')) {
            return 'hub-tenet';
          }
          
          // ML components chunk
          if (id.includes('/MLPredictionPanel') || 
              id.includes('/StreamingPredictionPanel') ||
              id.includes('/ml-analytics') ||
              id.includes('/useSimRating') ||
              id.includes('/useMLInference')) {
            return 'ml-components';
          }
          
          // Analytics and monitoring
          if (id.includes('/performance/') || id.includes('/monitoring/')) {
            return 'analytics-internal';
          }
          
          // Shared components chunk
          if (id.includes('/shared/')) {
            return 'shared';
          }
          
          // MASCOT CHUNKS - REF-004 Optimization
          // Base mascot utilities (always lightweight)
          if (id.includes('/mascots/MascotAssetEnhanced') || 
              id.includes('/mascots/MascotAssetLazy') ||
              id.includes('/mascots/MascotSkeleton')) {
            return 'mascot-base';
          }
          
          // Dropout style mascots
          if (id.includes('/mascots/generated/dropout/')) {
            return 'mascot-dropout';
          }
          
          // NJ style mascots
          if (id.includes('/mascots/generated/nj/')) {
            return 'mascot-nj';
          }
          
          // Default/legacy mascot components
          if (id.includes('/mascots/generated/') && 
              !id.includes('/dropout/') && 
              !id.includes('/nj/') &&
              !id.includes('/svg/')) {
            return 'mascot-default';
          }
          
          // Mascot SVG components (size variants)
          if (id.includes('/mascots/generated/svg/')) {
            return 'mascot-svgs';
          }
          
          // Default: let Rollup handle with automatic chunking
          return null;
        },
        // Optimize chunk file naming for better caching
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // Vendor chunks
          if (name.includes('vendor') || name.includes('react') || name.includes('data') || 
              name.includes('animation') || name.includes('utils')) {
            return 'js/vendor/[name]-[hash].js';
          }
          // Hub chunks
          if (name.includes('hub-')) {
            return 'js/hubs/[name]-[hash].js';
          }
          // Component chunks
          if (name.includes('components') || name.includes('ml-')) {
            return 'js/components/[name]-[hash].js';
          }
          
          // Mascot chunks
          if (name.includes('mascot')) {
            return 'js/mascots/[name]-[hash].js';
          }
          // Default chunks
          return 'js/chunks/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const info = name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/i.test(name)) {
            return 'css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
            return 'img/[name]-[hash][extname]'
          }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
            return 'fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      }
    },
    // Split CSS into separate files for better caching
    cssCodeSplit: true,
    // Enable CSS optimization
    cssMinify: true,
    // Target already set at build level to 'esnext'
    // Enable module preload polyfill
    modulePreload: {
      polyfill: true,
    },
  },
  server: {
    port: 5173,
    open: true,
    headers: {
      'Content-Type': 'application/javascript'
    }
  },
  // Proper asset handling for static files
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.ico'],
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'framer-motion',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // Exclude heavy deps from pre-bundling to keep dev startup fast
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-wasm',
      '@tensorflow/tfjs-backend-webgpu',
      'onnxruntime-web',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'recharts',
      'd3',
      'gsap',
      '@gsap/react'
    ]
  },
  // CSS optimization
  css: {
    devSourcemap: true,
  },
})
