/**
 * Bundle Analysis Script for Mascot Assets
 * 
 * Analyzes the size impact of mascot files and generates optimization recommendations.
 * 
 * [Ver001.000] - REF-004 Bundle Optimization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SIZE_THRESHOLDS = {
  warning: 50 * 1024,    // 50KB - warn if file larger
  critical: 100 * 1024,  // 100KB - critical if file larger
};

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath, arrayOfFiles = [], pattern = null) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, pattern);
    } else {
      if (!pattern || file.match(pattern)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file size with gzip compression estimate
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Simple gzip estimate (SVGs usually compress ~60-80%)
  const gzipEstimate = Math.floor(content.length * 0.3);
  
  return {
    file: path.basename(filePath),
    path: filePath,
    size: stats.size,
    gzipEstimate,
    sizeFormatted: formatBytes(stats.size),
    gzipFormatted: formatBytes(gzipEstimate),
  };
}

/**
 * Analyze mascot bundle
 */
function analyzeMascotBundle() {
  console.log('🔍 Mascot Bundle Analysis Report');
  console.log('=================================\n');
  
  let totalOriginalSize = 0;
  let totalGzipEstimate = 0;
  const report = {
    timestamp: new Date().toISOString(),
    summary: {},
    details: {},
    recommendations: [],
  };

  // Define directories to analyze
  const directories = [
    { type: 'svgs', path: path.join(PROJECT_ROOT, 'public', 'mascots'), pattern: /\.svg$/ },
    { type: 'css', path: path.join(PROJECT_ROOT, 'public', 'mascots', 'css'), pattern: /\.css$/ },
    { type: 'components', path: path.join(PROJECT_ROOT, 'src', 'components', 'mascots'), pattern: /\.tsx$/ },
  ];

  // Analyze each directory
  for (const dir of directories) {
    const type = dir.type;
    const dirPath = dir.path;
    const pattern = dir.pattern;
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      continue;
    }

    let files = [];
    try {
      files = getAllFiles(dirPath, [], pattern);
    } catch (err) {
      console.log(`⚠️  Error reading ${type}: ${err.message}`);
      continue;
    }
    
    if (files.length === 0) {
      console.log(`ℹ️  No ${type} files found in ${dirPath}`);
      continue;
    }
    
    const fileInfos = files.map(getFileInfo);
    
    const typeTotal = fileInfos.reduce((sum, f) => sum + f.size, 0);
    const typeGzipTotal = fileInfos.reduce((sum, f) => sum + f.gzipEstimate, 0);
    totalOriginalSize += typeTotal;
    totalGzipEstimate += typeGzipTotal;
    
    // Sort by size descending
    const sorted = fileInfos.sort((a, b) => b.size - a.size);
    const largest = sorted.slice(0, 5);
    
    // Find critical files
    const criticalFiles = fileInfos.filter(f => f.size > SIZE_THRESHOLDS.critical);
    const warningFiles = fileInfos.filter(f => f.size > SIZE_THRESHOLDS.warning && f.size <= SIZE_THRESHOLDS.critical);
    
    report.summary[type] = {
      count: files.length,
      totalSize: typeTotal,
      totalSizeFormatted: formatBytes(typeTotal),
      gzipEstimate: typeGzipTotal,
      gzipFormatted: formatBytes(typeGzipTotal),
      averageSize: typeTotal / (files.length || 1),
      averageFormatted: formatBytes(typeTotal / (files.length || 1)),
      criticalCount: criticalFiles.length,
      warningCount: warningFiles.length,
    };
    
    report.details[type] = {
      largest,
      critical: criticalFiles,
      warnings: warningFiles,
      all: sorted,
    };
    
    // Console output
    console.log(`\n📦 ${type.toUpperCase()}`);
    console.log(`   Count: ${files.length}`);
    console.log(`   Total: ${formatBytes(typeTotal)} (est. ${formatBytes(typeGzipTotal)} gzip)`);
    console.log(`   Average: ${formatBytes(typeTotal / (files.length || 1))}`);
    
    if (criticalFiles.length > 0) {
      console.log(`   ⚠️  Critical files (>100KB): ${criticalFiles.length}`);
    }
    if (warningFiles.length > 0) {
      console.log(`   ⚡ Warning files (>50KB): ${warningFiles.length}`);
    }
    
    console.log(`\n   📊 Top 5 Largest:`);
    largest.forEach((f, i) => {
      const indicator = f.size > SIZE_THRESHOLDS.critical ? '🔴' : f.size > SIZE_THRESHOLDS.warning ? '🟡' : '🟢';
      console.log(`      ${indicator} ${i + 1}. ${f.file}: ${f.sizeFormatted} (est. ${f.gzipFormatted} gzip)`);
    });
  }

  // Summary
  console.log('\n\n📈 OVERALL SUMMARY');
  console.log('==================');
  console.log(`Total Original Size: ${formatBytes(totalOriginalSize)}`);
  console.log(`Estimated Gzipped: ${formatBytes(totalGzipEstimate)}`);
  console.log(`Target (<100KB): ${totalGzipEstimate < 100 * 1024 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Generate recommendations
  const recommendations = [];
  
  if (totalGzipEstimate > 100 * 1024) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Total bundle size exceeds 100KB target',
      solution: 'Implement lazy loading for non-critical mascot components',
      impact: 'HIGH',
    });
  }
  
  // Check for size variants
  const svgFiles = report.details.svgs?.all || [];
  const mascotGroups = {};
  svgFiles.forEach(f => {
    const baseName = f.file.replace(/-\d+x\d+\.svg$/, '').replace(/-\d+\.svg$/, '');
    if (!mascotGroups[baseName]) mascotGroups[baseName] = [];
    mascotGroups[baseName].push(f);
  });
  
  for (const [mascot, files] of Object.entries(mascotGroups)) {
    if (files.length > 3) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${mascot} has ${files.length} size variants loaded upfront`,
        solution: 'Load only required size, lazy load others',
        impact: 'MEDIUM',
      });
    }
  }
  
  // Check component sizes
  const componentFiles = report.details.components?.all || [];
  const largeComponents = componentFiles.filter(f => f.size > 20 * 1024 && !f.file.includes('.test.'));
  if (largeComponents.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: `${largeComponents.length} components exceed 20KB`,
      solution: 'Split components into separate chunks with manualChunks',
      impact: 'HIGH',
    });
  }
  
  report.recommendations = recommendations;
  
  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('==================');
  if (recommendations.length === 0) {
    console.log('✅ No issues found! Bundle is optimized.');
  } else {
    recommendations.forEach((rec, i) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`\n${priorityIcon} ${i + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
      console.log(`   Impact: ${rec.impact}`);
    });
  }
  
  // Save report to file
  const reportPath = path.join(PROJECT_ROOT, 'tests', 'optimization', 'BUNDLE_ANALYSIS_REPORT.json');
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n\n📝 Report saved to: ${reportPath}`);
  } catch (err) {
    console.log(`\n\n⚠️  Could not save report: ${err.message}`);
  }
  
  return report;
}

/**
 * Analyze build output
 */
function analyzeBuildOutput() {
  const distPath = path.join(PROJECT_ROOT, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('\n⚠️  No build output found. Run "npm run build" first.');
    return null;
  }
  
  console.log('\n\n🏗️  BUILD OUTPUT ANALYSIS');
  console.log('========================');
  
  let jsFiles = [];
  let assetFiles = [];
  
  try {
    const jsPath = path.join(distPath, 'js');
    if (fs.existsSync(jsPath)) {
      jsFiles = getAllFiles(jsPath, [], /\.js$/);
    }
    
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      assetFiles = getAllFiles(assetsPath);
    }
  } catch (err) {
    console.log(`⚠️  Error reading build output: ${err.message}`);
    return null;
  }
  
  let totalJsSize = 0;
  const chunkAnalysis = {};
  
  jsFiles.forEach(file => {
    try {
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf-8');
      totalJsSize += stats.size;
      
      const fileName = path.basename(file);
      chunkAnalysis[fileName] = {
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        lines: content.split('\n').length,
      };
    } catch (err) {
      console.log(`⚠️  Error analyzing ${file}: ${err.message}`);
    }
  });
  
  console.log(`\nJavaScript chunks: ${jsFiles.length}`);
  console.log(`Total JS size: ${formatBytes(totalJsSize)}`);
  
  // Sort by size
  const sortedChunks = Object.entries(chunkAnalysis)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10);
  
  if (sortedChunks.length > 0) {
    console.log('\n📊 Largest JS chunks:');
    sortedChunks.forEach(([name, info], i) => {
      const isMascot = name.includes('mascot');
      const icon = isMascot ? '🎭' : '📦';
      console.log(`   ${icon} ${i + 1}. ${name}: ${info.sizeFormatted}`);
    });
    
    // Show mascot chunks specifically
    const mascotChunks = sortedChunks.filter(([name]) => name.includes('mascot'));
    if (mascotChunks.length > 0) {
      console.log('\n🎭 Mascot chunks:');
      mascotChunks.forEach(([name, info]) => {
        console.log(`   - ${name}: ${info.sizeFormatted}`);
      });
    }
  }
  
  return {
    totalJsSize,
    chunkCount: jsFiles.length,
    chunks: chunkAnalysis,
  };
}

// Run analysis
console.log('\n');
const bundleReport = analyzeMascotBundle();
const buildReport = analyzeBuildOutput();

// Final summary
console.log('\n\n✅ ANALYSIS COMPLETE');
console.log('====================');
console.log('Next steps:');
console.log('1. Review recommendations above');
console.log('2. Implement lazy loading for mascot components');
console.log('3. Update vite.config.js with manualChunks');
console.log('4. Run npm run build:analyze to verify improvements');
console.log('');
