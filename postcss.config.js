module.exports = {
  plugins: [
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifyFontValues: true,
        minifySelectors: true,
        mergeRules: true,
        mergeIdents: true,
        reduceIdents: false, // Keep animation names readable
        discardUnused: false, // Keep all keyframes
      }]
    })
  ]
};
