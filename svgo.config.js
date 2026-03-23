module.exports = {
  multipass: true,
  plugins: [
    'preset-default',
    { name: 'removeViewBox', active: false },
    { name: 'removeDimensions', active: true },
    { name: 'cleanupIds', active: true },
    { name: 'convertPathData', active: true },
    { name: 'convertTransform', active: true },
    { name: 'removeEmptyAttrs', active: true },
    { name: 'removeEmptyContainers', active: true },
    { name: 'mergePaths', active: true },
    { name: 'convertShapeToPath', active: true },
    { name: 'sortAttrs', active: true },
    { name: 'removeXMLProcInst', active: true },
    { name: 'removeComments', active: true },
    { name: 'removeMetadata', active: true },
    { name: 'removeTitle', active: false }, // Keep for accessibility
    { name: 'removeDesc', active: false },  // Keep for accessibility
    { name: 'convertColors', active: true, params: { shorthex: true }},
  ]
};
