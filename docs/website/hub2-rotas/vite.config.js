import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// ============================================
// HUB2 ROTAS - Enhanced Vite Config with Optimizations
// ============================================

export default defineConfig({
  plugins: [react()],
  base: './',
  
  // Build configuration
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    cssMinify: true,
    
    // esbuild options for production (faster than terser)
    esbuildOptions: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    },
    
    // Enhanced Rollup options for code splitting
    rollupOptions: {
      output: {
        // Entry file naming with content hash
        entryFileNames: 'js/[name]-[hash:8].js',
        chunkFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash:8][extname]'
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash:8][extname]'
          }
          if (/\.(woff2?|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash:8][extname]'
          }
          return 'assets/[name]-[hash:8][extname]'
        },
        
        // Strategic code splitting for performance
        manualChunks: {
          // Core vendor - React essentials (loaded first)
          'vendor-core': ['react', 'react-dom'],
          
          // Main application code
          'app-main': ['./src/App.jsx']
        }
      }
    },
    
    // Chunk size warning
    chunkSizeWarningLimit: 150,
    cssCodeSplit: true,
    
    // Module preload polyfill for older browsers
    modulePreload: {
      polyfill: true
    },
    
    // Inline assets smaller than 8KB
    assetsInlineLimit: 8192,
    
    // Report compressed sizes
    reportCompressedSize: true
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@generated/*']
  },
  
  // Development server
  server: {
    port: 3002,
    open: true
  },
  
  // Preview server
  preview: {
    port: 4172
  }
})
