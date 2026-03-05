/**
 * PurgeCSS Configuration
 * Removes unused CSS based on template analysis
 */

module.exports = {
  content: [
    '../index.html',
    '../hub1-sator/index.html',
    '../hub2-rotas/dist/**/*.html',
    '../hub2-rotas/src/**/*.{js,jsx,ts,tsx}',
    '../hub3-information/src/**/*.{js,jsx,ts,tsx}',
    '../hub4-games/app/**/*.{js,jsx,ts,tsx}'
  ],
  css: [
    '../njz-design-system.css',
    '../shared/styles/*.css'
  ],
  safelist: [
    // Dynamic classes that PurgeCSS might miss
    /^sator-/,
    /^rotas-/,
    /^hub-/,
    /^animate-/,
    /^stagger-/,
    /^io-/,
    /^reveal/,
    /^skeleton/,
    'is-visible',
    'loaded',
    'focus-visible',
    // Tailwind classes used dynamically
    /^col-span-/,
    /^row-span-/
  ],
  extractors: [
    {
      extractor: class {
        static extract(content) {
          return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
        }
      },
      extensions: ['html', 'js', 'jsx', 'ts', 'tsx']
    }
  ]
};
