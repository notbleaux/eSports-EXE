/**
 * Performance Test Configuration
 * Tools: Lighthouse, Web Vitals, Bundle Analyzer
 */

module.exports = {
  // Lighthouse CI configuration
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/landing.html',
        'http://localhost:3000/hub1-sator/',
        'http://localhost:3000/hub2-rotas/dist/',
        'http://localhost:3000/hub3-information/dist/',
        'http://localhost:3000/hub4-games/dist/'
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000
    },
    
    assert: {
      assertions: {
        // Core Web Vitals
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        
        // Resource budgets
        'resource-summary:document:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 200000 }]
      }
    },
    
    upload: {
      target: 'temporary-public-storage'
    }
  },
  
  // Bundle analysis
  bundle: {
    maxSize: {
      javascript: 250000, // 250KB
      css: 50000,         // 50KB
      image: 100000       // 100KB per image
    },
    
    // Chunk size limits
    chunks: {
      maxInitialSize: 250000,  // 250KB
      maxAsyncSize: 500000     // 500KB
    }
  },
  
  // Performance budgets
  budgets: [
    {
      path: '/*',
      resourceSizes: [
        { resourceType: 'document', budget: 50 },
        { resourceType: 'stylesheet', budget: 100 },
        { resourceType: 'image', budget: 1000 },
        { resourceType: 'media', budget: 500 },
        { resourceType: 'font', budget: 200 },
        { resourceType: 'script', budget: 500 },
        { resourceType: 'total', budget: 2000 }
      ],
      resourceCounts: [
        { resourceType: 'third-party', budget: 10 }
      ],
      timings: [
        { metric: 'interactive', budget: 3800 },
        { metric: 'first-meaningful-paint', budget: 2000 },
        { metric: 'speed-index', budget: 3400 }
      ]
    }
  ]
};
