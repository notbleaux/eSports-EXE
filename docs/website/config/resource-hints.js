/**
 * Resource Hints Generator
 * Generates preconnect, prefetch, and preload hints based on route
 */

const RESOURCE_HINTS = {
  // External domains used across all hubs
  external: {
    fonts: {
      preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      preload: [
        {
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
          as: 'style'
        }
      ]
    },
    cdn: {
      preconnect: ['https://cdn.tailwindcss.com'],
      dnsPrefetch: ['https://cdn.tailwindcss.com']
    }
  },
  
  // Hub-specific critical resources
  hubs: {
    sator: {
      preload: [
        '/hub1-sator/styles.css',
        '/hub1-sator/app.js'
      ],
      prefetch: [
        '/hub2-rotas/dist/index.html'
      ]
    },
    rotas: {
      preload: [
        '/hub2-rotas/dist/assets/index.css'
      ],
      modulepreload: [
        '/hub2-rotas/dist/assets/index.js'
      ]
    },
    information: {
      preload: [
        '/hub3-information/dist/assets/index.css'
      ],
      modulepreload: [
        '/hub3-information/dist/assets/index.js'
      ]
    },
    games: {
      preload: [
        '/hub4-games/dist/index.html'
      ]
    }
  }
};

/**
 * Generate resource hints HTML for a specific hub
 * @param {string} hub - Hub name (sator, rotas, information, games)
 * @returns {string} HTML string with resource hints
 */
function generateResourceHints(hub = 'default') {
  const hints = [];
  
  // Add external preconnects
  RESOURCE_HINTS.external.fonts.preconnect.forEach(url => {
    hints.push(`<link rel="preconnect" href="${url}"${url.includes('gstatic') ? ' crossorigin' : ''}>`);
  });
  
  // Add DNS prefetch for CDNs
  RESOURCE_HINTS.external.cdn.dnsPrefetch.forEach(url => {
    hints.push(`<link rel="dns-prefetch" href="${url}">`);
  });
  
  // Add hub-specific hints
  const hubHints = RESOURCE_HINTS.hubs[hub];
  if (hubHints) {
    hubHints.preload?.forEach(href => {
      hints.push(`<link rel="preload" href="${href}" as="${getAssetType(href)}">`);
    });
    
    hubHints.modulepreload?.forEach(href => {
      hints.push(`<link rel="modulepreload" href="${href}">`);
    });
    
    hubHints.prefetch?.forEach(href => {
      hints.push(`<link rel="prefetch" href="${href}">`);
    });
  }
  
  return hints.join('\n');
}

function getAssetType(href) {
  if (href.endsWith('.css')) return 'style';
  if (href.endsWith('.js')) return 'script';
  if (href.endsWith('.woff2') || href.endsWith('.woff')) return 'font';
  return 'fetch';
}

module.exports = { generateResourceHints, RESOURCE_HINTS };
