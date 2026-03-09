const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// ============================================
// WEBPACK CONFIG - Production Optimization
// Purpose: Bundle splitting, minification, compression
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const analyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  
  entry: {
    // Main entry points
    main: './src/index.js',
    
    // Vendor chunks
    vendor: ['react', 'react-dom', 'react-router-dom'],
    charts: ['chart.js', 'd3'],
    utils: ['lodash-es', 'date-fns', 'axios'],
    
    // Feature chunks
    'feature-auth': './src/features/auth/index.js',
    'feature-analytics': './src/features/analytics/index.js',
    'feature-dashboard': './src/features/dashboard/index.js',
    
    // Hub chunks (loaded on demand)
    'hub-sator': { import: './src/hubs/sator/index.js', dependOn: 'vendor' },
    'hub-rotas': { import: './src/hubs/rotas/index.js', dependOn: 'vendor' },
    'hub-information': { import: './src/hubs/information/index.js', dependOn: 'vendor' },
    'hub-games': { import: './src/hubs/games/index.js', dependOn: 'vendor' }
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name]-[contenthash:8].js',
    chunkFilename: 'js/[name]-[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[name]-[contenthash:8][ext]',
    clean: true,
    publicPath: '/'
  },
  
  optimization: {
    // Enable tree shaking
    usedExports: true,
    sideEffects: false,
    
    // Module concatenation
    concatenateModules: true,
    
    // Split chunks configuration
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 244000, // 244KB to stay under 250KB limit
      cacheGroups: {
        // Vendor chunk (node_modules)
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true
        },
        
        // Common chunk (shared code)
        common: {
          minChunks: 2,
          chunks: 'all',
          enforce: true,
          priority: 5,
          reuseExistingChunk: true
        },
        
        // React and related
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        
        // UI components
        ui: {
          test: /[\\/]components[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 15
        }
      }
    },
    
    // Runtime chunk
    runtimeChunk: {
      name: 'runtime'
    },
    
    // Minimizers
    minimizer: [
      // JavaScript minification
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
            passes: 3,
            dead_code: true,
            unused: true,
            hoist_funs: true,
            hoist_vars: true,
            if_return: true,
            join_vars: true,
            cascade: true
          },
          mangle: {
            safari10: true,
            properties: isProduction ? {
              regex: /^_/ // Only mangle private properties
            } : false
          },
          format: {
            comments: false,
            beautify: false
          }
        },
        extractComments: false
      }),
      
      // CSS minification
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: { exclude: false },
              minifyFontValues: { removeQuotes: false }
            }
          ]
        }
      })
    ]
  },
  
  module: {
    rules: [
      // JavaScript/TypeScript
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: true,
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions', 'not dead']
                },
                useBuiltIns: 'usage',
                corejs: 3,
                modules: false // Enable tree shaking
              }],
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties',
              isProduction && 'babel-plugin-transform-remove-console'
            ].filter(Boolean)
          }
        }
      },
      
      // CSS
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: isProduction 
                  ? '[hash:base64:8]' 
                  : '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          'postcss-loader'
        ]
      },
      
      // SCSS
      {
        test: /\.s[ac]ss$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      
      // Images
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB inline limit
          }
        },
        generator: {
          filename: 'images/[name]-[contenthash:8][ext]'
        }
      },
      
      // Fonts
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name]-[contenthash:8][ext]'
        }
      }
    ]
  },
  
  plugins: [
    // Extract CSS to separate files
    new MiniCssExtractPlugin({
      filename: 'css/[name]-[contenthash:8].css',
      chunkFilename: 'css/[name]-[contenthash:8].chunk.css',
      ignoreOrder: false
    }),
    
    // HTML generation
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true,
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      } : false,
      // Preload critical chunks
      preload: ['runtime', 'vendor', 'main']
    }),
    
    // Gzip compression
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 1024,
      minRatio: 0.8,
      deleteOriginalAssets: false
    }),
    
    // Brotli compression
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
        }
      },
      threshold: 1024,
      minRatio: 0.8,
      deleteOriginalAssets: false
    }),
    
    // Bundle analyzer (only when ANALYZE=true)
    analyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: 'bundle-analysis.html'
    })
  ].filter(Boolean),
  
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },
  
  // Performance hints
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 250000, // 250KB
    maxAssetSize: 250000, // 250KB
    assetFilter: (assetFilename) => {
      return !assetFilename.endsWith('.map') && 
             !assetFilename.endsWith('.br') && 
             !assetFilename.endsWith('.gz');
    }
  },
  
  // Dev server
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    compress: true
  },
  
  // Source maps
  devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
  
  // Cache
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },
  
  // Stats
  stats: {
    preset: 'normal',
    modules: true,
    chunks: true,
    chunkModules: true,
    chunkOrigins: true,
    depth: true,
    env: true,
    reasons: true,
    usedExports: true,
    providedExports: true,
    optimizationBailout: true,
    errorDetails: true,
    publicPath: true,
    logging: 'verbose'
  }
};
