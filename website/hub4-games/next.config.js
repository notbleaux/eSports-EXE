/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for smaller bundles
  output: 'standalone',
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    unoptimized: true, // Required for static export
  },
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports for common libraries
    optimizePackageImports: [
      'framer-motion',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
    // Turbopack for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Transpile Three.js packages
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'zustand',
  ],
  
  // Webpack optimization
  webpack: (config, { isServer, nextRuntime }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate React chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            // Framer Motion separate
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              chunks: 'all',
              priority: 15,
            },
            // Three.js separate
            threejs: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'threejs',
              chunks: 'all',
              priority: 12,
            },
          },
        },
        minimize: true,
      };
      
      // Add support for GLSL shaders
      config.module.rules.push({
        test: /\.glsl$/,
        use: 'raw-loader',
      });
    }
    
    // Disable source maps
    config.devtool = false;
    
    return config;
  },
  
  // ESLint config
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript config
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Compression
  compress: true,
  
  // Powered by header
  poweredByHeader: false,
  
  // Trailing slash for SEO
  trailingSlash: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
