import { defineConfig } from 'vite';
import { resolve } from 'path';
import { terser } from 'rollup-plugin-terser';
import gzipPlugin from 'rollup-plugin-gzip';

// ============================================
// VITE CONFIG - Bundle Optimization
// Purpose: Code splitting, tree shaking, compression
// ============================================

export default defineConfig({
  // Base configuration
  base: './',
  
  // Build configuration
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Output directory
    outDir: 'dist',
    
    // Clean output directory
    emptyOutDir: true,
    
    // Source maps for debugging (disable in production)
    sourcemap: false,
    
    // Minification
    minify: 'terser',
    
    // CSS optimization
    cssMinify: true,
    
    // Terser options
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        dead_code: true,
        unused: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Rollup options for advanced splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sator: resolve(__dirname, '../hub1-sator/index.html'),
        rotas: resolve(__dirname, '../hub2-rotas/index.html'),
        info: resolve(__dirname, '../hub3-information/index.html'),
        games: resolve(__dirname, '../hub4-games/index.html')
      },
      
      output: {
        // Entry file naming
        entryFileNames: 'js/[name]-[hash].js',
        
        // Chunk file naming
        chunkFileNames: 'js/[name]-[hash].js',
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        
        // Manual chunks for code splitting
        manualChunks: {
          // Vendor libraries
          'vendor-core': ['react', 'react-dom'],
          'vendor-utils': ['lodash-es', 'date-fns'],
          'vendor-charts': ['chart.js', 'd3'],
          
          // Feature-based chunks
          'feature-auth': ['./src/auth/login.ts', './src/auth/register.ts'],
          'feature-analytics': ['./src/analytics/dashboard.ts', './src/analytics/charts.ts'],
          'feature-data': ['./src/data/api.ts', './src/data/cache.ts'],
          
          // Hub-specific chunks
          'hub-sator': ['./src/hubs/sator/index.ts'],
          'hub-rotas': ['./src/hubs/rotas/index.ts'],
          'hub-info': ['./src/hubs/information/index.ts'],
          'hub-games': ['./src/hubs/games/index.ts']
        }
      },
      
      plugins: [
        // Additional terser for extra compression
        terser({
          compress: {
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true
          }
        }),
        
        // Gzip compression
        gzipPlugin({
          filter: /\.(js|css|html|svg)$/,
          minSize: 1024 // Only compress files > 1KB
        })
      ]
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Module preload polyfill
    modulePreload: {
      polyfill: true
    },
    
    // Assets inline limit (8KB)
    assetsInlineLimit: 8192,
    
    // Report chunk sizes
    reportCompressedSize: true
  },
  
  // Development configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview configuration
  preview: {
    port: 4173
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared'),
      '@hubs': resolve(__dirname, './src/hubs'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`
      }
    }
  },
  
  // Plugin configuration
  plugins: [
    // Custom plugin for critical CSS extraction
    {
      name: 'critical-css',
      enforce: 'post',
      transformIndexHtml(html) {
        // Inject critical CSS inline
        const criticalCSS = `
          /* Critical CSS - inlined for performance */
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{font-size:16px;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}
          body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e8e6e3;line-height:1.6}
          .container{width:100%;max-width:1280px;margin:0 auto;padding:0 1rem}
          .site-header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,10,15,.95);backdrop-filter:blur(10px)}
          .header-inner{display:flex;align-items:center;justify-content:space-between;height:64px;padding:0 1rem}
          main{padding-top:64px;min-height:100vh}
          img{max-width:100%;height:auto;display:block}
          .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem 1.5rem;font-weight:600;font-size:.875rem;border-radius:8px;border:none;cursor:pointer;min-height:48px;min-width:48px}
          .btn:focus-visible{outline:2px solid #00f0ff;outline-offset:2px}
          @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
        `;
        
        return html.replace(
          '</head>',
          `<style>${criticalCSS}</style>\n</head>`
        );
      }
    },
    
    // Custom plugin for resource hints
    {
      name: 'resource-hints',
      enforce: 'post',
      transformIndexHtml(html, { bundle }) {
        let hints = '';
        
        // Add preload hints for critical chunks
        if (bundle) {
          Object.entries(bundle).forEach(([fileName, chunk]) => {
            if (chunk.isEntry && fileName.endsWith('.js')) {
              hints += `  <link rel="modulepreload" href="/${fileName}"\u003e\n`;
            }
          });
        }
        
        return html.replace('</head>', `${hints}</head>`);
      }
    }
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'chart.js'],
    exclude: ['@generated/*']
  },
  
  // ESBuild options
  esbuild: {
    jsxInject: `import React from 'react'`,
    target: 'es2020'
  }
});
