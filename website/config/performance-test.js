/**
 * Performance Testing Script
 * Run with: node performance-test.js
 * 
 * Tests Lighthouse scores and validates performance budgets
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // URLs to test
  urls: [
    'http://localhost:3000/',
    'http://localhost:3000/landing.html',
    'http://localhost:3000/launchpad.html',
    'http://localhost:3000/njz-central/index.html',
    'http://localhost:3000/hub1-sator/index.html',
    'http://localhost:3000/hub2-rotas/index.html',
    'http://localhost:3000/hub3-information/index.html',
    'http://localhost:3000/hub4-games/index.html'
  ],
  
  // Lighthouse configuration
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      },
      emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  },
  
  // Mobile configuration
  mobileConfig: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4
      },
      screenEmulation: {
        mobile: true,
        width: 360,
        height: 640,
        deviceScaleFactor: 2.625,
        disabled: false
      }
    }
  },
  
  // Performance budget thresholds
  budgets: {
    performance: 90,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    fcp: 1000,
    lcp: 2500,
    tti: 3800,
    cls: 0.1,
    tbt: 200
  }
};

// ============================================
// TEST FUNCTIONS
// ============================================

async function runLighthouse(url, config, deviceType) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error'
    }, config);
    
    await chrome.kill();
    return { 
      success: true, 
      data: result.lhr,
      deviceType
    };
  } catch (error) {
    await chrome.kill();
    return { success: false, error: error.message };
  }
}

function extractMetrics(lhr) {
  return {
    // Scores
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    
    // Core Web Vitals
    fcp: lhr.audits['first-contentful-paint'].numericValue,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tti: lhr.audits['interactive'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    speedIndex: lhr.audits['speed-index'].numericValue,
    
    // Resource sizes
    totalByteWeight: lhr.audits['total-byte-weight'].numericValue,
    jsSize: lhr.audits['total-byte-weight'].details?.items
      ?.filter(item => item.url.endsWith('.js'))
      ?.reduce((sum, item) => sum + item.totalBytes, 0) || 0,
    
    // Opportunities
    opportunities: lhr.audits
  };
}

function checkBudget(metrics, budgets) {
  const results = [];
  
  // Score checks
  if (metrics.performance < budgets.performance) {
    results.push({
      type: 'error',
      metric: 'Performance Score',
      value: metrics.performance,
      threshold: budgets.performance
    });
  }
  
  if (metrics.accessibility < budgets.accessibility) {
    results.push({
      type: 'error', 
      metric: 'Accessibility Score',
      value: metrics.accessibility,
      threshold: budgets.accessibility
    });
  }
  
  // Timing checks
  if (metrics.fcp > budgets.fcp) {
    results.push({
      type: 'error',
      metric: 'FCP',
      value: `${metrics.fcp.toFixed(0)}ms`,
      threshold: `${budgets.fcp}ms`
    });
  }
  
  if (metrics.lcp > budgets.lcp) {
    results.push({
      type: 'error',
      metric: 'LCP',
      value: `${metrics.lcp.toFixed(0)}ms`,
      threshold: `${budgets.lcp}ms`
    });
  }
  
  if (metrics.tti > budgets.tti) {
    results.push({
      type: 'error',
      metric: 'TTI',
      value: `${metrics.tti.toFixed(0)}ms`,
      threshold: `${budgets.tti}ms`
    });
  }
  
  if (metrics.cls > budgets.cls) {
    results.push({
      type: 'error',
      metric: 'CLS',
      value: metrics.cls.toFixed(3),
      threshold: budgets.cls
    });
  }
  
  return results;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  let report = `# Performance Test Report\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  // Summary table
  report += `## Summary\n\n`;
  report += `| URL | Device | Performance | Accessibility | Best Practices | SEO | Status |\n`;
  report += `|-----|--------|-------------|---------------|----------------|-----|--------|\n`;
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (!result.success) {
      report += `| ${result.url} | ${result.deviceType} | - | - | - | - | ❌ ERROR |\n`;
      failed++;
      return;
    }
    
    const m = result.metrics;
    const status = result.budgetViolations.length === 0 ? '✅ PASS' : '❌ FAIL';
    
    report += `| ${result.url.replace('http://localhost:3000', '')} | ${result.deviceType} | ${m.performance} | ${m.accessibility} | ${m.bestPractices} | ${m.seo} | ${status} |\n`;
    
    if (result.budgetViolations.length === 0) passed++;
    else failed++;
  });
  
  report += `\n## Results: ${passed} passed, ${failed} failed\n\n`;
  
  // Detailed results
  results.forEach(result => {
    if (!result.success) return;
    
    report += `### ${result.url.replace('http://localhost:3000', '')} (${result.deviceType})\n\n`;
    
    const m = result.metrics;
    report += `- **Performance**: ${m.performance}/100\n`;
    report += `- **Accessibility**: ${m.accessibility}/100\n`;
    report += `- **Best Practices**: ${m.bestPractices}/100\n`;
    report += `- **SEO**: ${m.seo}/100\n`;
    report += `- **FCP**: ${m.fcp.toFixed(0)}ms\n`;
    report += `- **LCP**: ${m.lcp.toFixed(0)}ms\n`;
    report += `- **TTI**: ${m.tti.toFixed(0)}ms\n`;
    report += `- **CLS**: ${m.cls.toFixed(3)}\n`;
    report += `- **TBT**: ${m.tbt.toFixed(0)}ms\n`;
    report += `- **Total Size**: ${formatBytes(m.totalByteWeight)}\n`;
    
    if (result.budgetViolations.length > 0) {
      report += `\n**Budget Violations:**\n`;
      result.budgetViolations.forEach(v => {
        report += `- ${v.metric}: ${v.value} (threshold: ${v.threshold})\n`;
      });
    }
    
    report += `\n`;
  });
  
  return report;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Starting Performance Tests...\n');
  
  const results = [];
  
  for (const url of CONFIG.urls) {
    console.log(`Testing: ${url}`);
    
    // Desktop test
    console.log('  Running desktop test...');
    const desktopResult = await runLighthouse(url, CONFIG.lighthouseConfig, 'desktop');
    
    if (desktopResult.success) {
      const metrics = extractMetrics(desktopResult.data);
      const violations = checkBudget(metrics, CONFIG.budgets);
      results.push({
        url,
        deviceType: 'desktop',
        success: true,
        metrics,
        budgetViolations: violations
      });
      console.log(`    Performance: ${metrics.performance} | FCP: ${metrics.fcp.toFixed(0)}ms | LCP: ${metrics.lcp.toFixed(0)}ms`);
    } else {
      results.push({
        url,
        deviceType: 'desktop',
        success: false,
        error: desktopResult.error
      });
      console.log(`    ERROR: ${desktopResult.error}`);
    }
    
    // Mobile test
    console.log('  Running mobile test...');
    const mobileResult = await runLighthouse(url, CONFIG.mobileConfig, 'mobile');
    
    if (mobileResult.success) {
      const metrics = extractMetrics(mobileResult.data);
      const violations = checkBudget(metrics, CONFIG.budgets);
      results.push({
        url,
        deviceType: 'mobile',
        success: true,
        metrics,
        budgetViolations: violations
      });
      console.log(`    Performance: ${metrics.performance} | FCP: ${metrics.fcp.toFixed(0)}ms | LCP: ${metrics.lcp.toFixed(0)}ms`);
    } else {
      results.push({
        url,
        deviceType: 'mobile',
        success: false,
        error: mobileResult.error
      });
      console.log(`    ERROR: ${mobileResult.error}`);
    }
    
    console.log('');
  }
  
  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(__dirname, '..', 'performance-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
  
  // Exit with error code if any tests failed
  const failures = results.filter(r => !r.success || r.budgetViolations.length > 0);
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} tests failed budget requirements`);
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
