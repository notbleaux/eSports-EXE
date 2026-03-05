import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// ============================================
// HUB3 INFORMATION - Vite Config with Optimizations
// ============================================

export default defineConfig({
  plugins: [react()],
  base: '/',
  
  // Build configuration
  build: {
    // Target modern browsers
    target: 'es2020',
    
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    cssMinify: true,
    
    // Rollup options
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        
        // Strategic code splitting
        manualChunks: {
          'vendor-core': ['react', 'react-dom'],
          'feature-grid': ['./src/components/NJZGrid.jsx'],
          'feature-search': ['./src/components/DirectorySearch.jsx'],
          'feature-membership': ['./src/components/MembershipTiers.jsx']
        }
      }
    },
    
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    assetsInlineLimit: 8192
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@data': resolve(__dirname, './src/data')
    }
  },
  
  css: {
    devSourcemap: true
  },
  
  server: {
    port: 3003,
    open: true
  },
  
  preview: {
    port: 4173
  }
})
