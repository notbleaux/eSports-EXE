/**
 * [Ver002.000]
 * Bundle Analysis Script
 * 
 * Analyzes the production bundle size and provides insights
 * for optimization opportunities.
 * 
 * Usage: node scripts/bundle-analyze.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const distPath = path.join(__dirname, '../apps/web/dist/assets');

/**
 * Get gzipped size of a file
 */
function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Categorize files by type
 */
function categorizeFile(filename) {
  if (filename.includes('vendor')) return 'vendor';
  if (filename.includes('worker')) return 'worker';
  if (filename.includes('index-') && filename.endsWith('.js')) return 'chunk';
  if (filename.endsWith('.css')) return 'style';
  if (filename.endsWith('.map')) return 'sourcemap';
  return 'other';
}

function analyzeBundle() {
  console.log('\n📦 Bundle Analysis Report');
  console.log('=========================\n');

  // Check if dist folder exists
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Error: ${distPath} does not exist.`);
    console.log('   Run "npm run build" first to generate the production bundle.\n');
    process.exit(1);
  }

  const files = fs.readdirSync(distPath)
    .filter(f => !f.endsWith('.map')) // Exclude source maps from main analysis
    .map(f => {
      const filePath = path.join(distPath, f);
      const stat = fs.statSync(filePath);
      const gzipSize = getGzippedSize(filePath);
      return { 
        name: f, 
        size: stat.size, 
        gzipSize,
        category: categorizeFile(f)
      };
    })
    .sort((a, b) => b.size - a.size);

  // Group by category
  const categories = {};
  files.forEach(f => {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  });

  // Display by category
  const categoryOrder = ['vendor', 'chunk', 'worker', 'style', 'other'];
  let grandTotal = 0;
  let grandTotalGzip = 0;

  categoryOrder.forEach(cat => {
    if (categories[cat] && categories[cat].length > 0) {
      console.log(`\n📁 ${cat.toUpperCase()} FILES:`);
      console.log('-'.repeat(80));
      console.log(`${'File Name'.padEnd(40)} ${'Raw Size'.padEnd(12)} ${'Gzipped'.padEnd(12)} ${'% of Total'}`);
      console.log('-'.repeat(80));

      const catTotal = categories[cat].reduce((sum, f) => sum + f.size, 0);
      const catTotalGzip = categories[cat].reduce((sum, f) => sum + f.gzipSize, 0);

      categories[cat].forEach(f => {
        const percent = ((f.size / catTotal) * 100).toFixed(1);
        console.log(
          `${f.name.slice(0, 38).padEnd(40)} ` +
          `${formatBytes(f.size).padEnd(12)} ` +
          `${formatBytes(f.gzipSize).padEnd(12)} ` +
          `${percent}%`
        );
      });

      console.log('-'.repeat(80));
      console.log(
        `${'CATEGORY TOTAL:'.padEnd(40)} ` +
        `${formatBytes(catTotal).padEnd(12)} ` +
        `${formatBytes(catTotalGzip).padEnd(12)}`
      );

      grandTotal += catTotal;
      grandTotalGzip += catTotalGzip;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Bundle Size (raw):    ${formatBytes(grandTotal)}`);
  console.log(`Total Bundle Size (gzipped): ${formatBytes(grandTotalGzip)}`);
  console.log(`Compression Ratio:          ${((1 - grandTotalGzip/grandTotal) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  // Performance Targets Check
  console.log('\n🎯 PERFORMANCE TARGETS:');
  console.log('-'.repeat(80));
  
  const targetSize = 500 * 1024; // 500KB target
  const targetMet = grandTotalGzip < targetSize;
  
  console.log(`Bundle size target: < 500 KB gzipped`);
  console.log(`Current size:       ${formatBytes(grandTotalGzip)}`);
  console.log(`Status:             ${targetMet ? '✅ PASS' : '❌ FAIL'} (${targetMet ? 'Under' : 'Over'} by ${formatBytes(Math.abs(grandTotalGzip - targetSize))})`);

  // Largest files warning
  console.log('\n⚠️  OPTIMIZATION OPPORTUNITIES:');
  console.log('-'.repeat(80));
  
  const largeFiles = files.filter(f => f.gzipSize > 100 * 1024); // > 100KB gzipped
  if (largeFiles.length > 0) {
    console.log('Large chunks (>100KB gzipped) - consider further splitting:');
    largeFiles.forEach(f => {
      console.log(`  • ${f.name}: ${formatBytes(f.gzipSize)}`);
    });
  } else {
    console.log('✅ No oversized chunks detected');
  }

  // Vendor analysis
  if (categories['vendor']) {
    const vendorTotal = categories['vendor'].reduce((sum, f) => sum + f.gzipSize, 0);
    console.log(`\n📦 Vendor chunks total: ${formatBytes(vendorTotal)}`);
    console.log('   (React, Three.js, TensorFlow.js, etc.)');
  }

  console.log('\n');

  // Return metrics for programmatic use
  return {
    totalRaw: grandTotal,
    totalGzip: grandTotalGzip,
    compressionRatio: (1 - grandTotalGzip/grandTotal) * 100,
    targetMet,
    files: files.map(f => ({
      name: f.name,
      rawSize: f.size,
      gzipSize: f.gzipSize,
      category: f.category
    }))
  };
}

// Run analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle, formatBytes };
