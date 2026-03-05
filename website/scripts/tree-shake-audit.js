/**
 * Tree Shake Audit Script
 * Identifies potentially unused exports
 */

const fs = require('fs');
const path = require('path');

function auditExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all exports
  const exportMatches = content.match(/export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*(\w+)/g) || [];
  
  // Find local usage of those exports
  const exports = exportMatches.map(match => {
    const name = match.replace(/export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*/, '');
    const usageCount = (content.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
    return { name, export: match, usageCount };
  });
  
  // Check for exports used only once (just the export statement)
  const potentiallyUnused = exports.filter(e => e.usageCount <= 1);
  
  return { file: filePath, exports, potentiallyUnused };
}

// Run audit on shared modules
const filesToAudit = [
  'shared/router/index.js',
  'shared/components/index.js',
  'shared/analytics/index.js'
];

console.log('=== Tree Shake Audit Results ===\n');

filesToAudit.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const result = auditExports(fullPath);
    console.log(`\n=== ${file} ===`);
    console.log(`Total exports: ${result.exports.length}`);
    if (result.potentiallyUnused.length > 0) {
      console.log('⚠️ Potentially unused exports:');
      result.potentiallyUnused.forEach(e => {
        console.log(`  - ${e.name}`);
      });
    } else {
      console.log('✅ All exports appear to be used');
    }
  } else {
    console.log(`\n=== ${file} ===`);
    console.log('❌ File not found');
  }
});
