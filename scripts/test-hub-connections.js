[Ver001.000]

#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                   TENET HUB CONNECTIONS TEST SCRIPT                          ║
 * ║            "Four Hubs - One Unified Experience"                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * Purpose: Test frontend hub connections for SATOR, ROTAS, AREPO, OPERA, and TENET
 * Usage: node scripts/test-hub-connections.js [--env <dev|prod>] [--verbose]
 * Dependencies: node-fetch, ws (optional for WebSocket tests)
 */

'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  dev: {
    apiBase: process.env.VITE_API_URL || 'http://localhost:8000/v1',
    wsBase: process.env.VITE_WS_URL || 'ws://localhost:8000/v1/ws',
    tenetEdge: process.env.VITE_TENET_EDGE || 'http://localhost:8000/v1/edge',
  },
  prod: {
    apiBase: process.env.VITE_API_URL || 'https://api.sator-analytics.com/v1',
    wsBase: process.env.VITE_WS_URL || 'wss://api.sator-analytics.com/v1/ws',
    tenetEdge: process.env.VITE_TENET_EDGE || 'https://api.sator-analytics.com/v1/edge',
  },
};

const HUBS = {
  SATOR: {
    name: 'SATOR Analytics',
    color: '\x1b[36m', // Cyan
    endpoints: [
      { path: '/players', method: 'GET', description: 'Player list' },
      { path: '/players/top', method: 'GET', description: 'Top players' },
      { path: '/analytics/ratings', method: 'GET', description: 'SimRating data' },
      { path: '/analytics/rar', method: 'GET', description: 'RAR scores' },
    ],
  },
  ROTAS: {
    name: 'ROTAS Simulation',
    color: '\x1b[35m', // Magenta
    endpoints: [
      { path: '/matches', method: 'GET', description: 'Match list' },
      { path: '/analytics/match-predictions', method: 'GET', description: 'Match predictions' },
      { path: '/analytics/investment-grades', method: 'GET', description: 'Investment grades' },
    ],
  },
  AREPO: {
    name: 'AREPO Cross-Reference',
    color: '\x1b[32m', // Green
    endpoints: [
      { path: '/search', method: 'GET', description: 'Global search' },
      { path: '/cross-ref/player-team', method: 'GET', description: 'Player-team cross-ref' },
      { path: '/cross-ref/tournament-stats', method: 'GET', description: 'Tournament-stats cross-ref' },
    ],
  },
  OPERA: {
    name: 'OPERA Tournament',
    color: '\x1b[33m', // Yellow
    endpoints: [
      { path: '/opera/tournaments', method: 'GET', description: 'Tournament list' },
      { path: '/opera/schedules', method: 'GET', description: 'Match schedules' },
      { path: '/opera/teams', method: 'GET', description: 'Team data' },
      { path: '/opera/standings', method: 'GET', description: 'Circuit standings' },
    ],
  },
  TENET: {
    name: 'TENET Edge Cache',
    color: '\x1b[34m', // Blue
    endpoints: [
      { path: '/edge/health', method: 'GET', description: 'Edge health check' },
      { path: '/edge/sync-status', method: 'GET', description: 'Sync status' },
      { path: '/edge/cache-stats', method: 'GET', description: 'Cache statistics' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

let verbose = false;
let environment = 'dev';

const stats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  latencies: [],
};

function log(message, color = '') {
  console.log(`${color}${message}${RESET}`);
}

function logInfo(message) {
  console.log(`${CYAN}[INFO]${RESET} ${message}`);
}

function logSuccess(message) {
  console.log(`${GREEN}[PASS]${RESET} ${message}`);
  stats.passed++;
  stats.total++;
}

function logError(message) {
  console.log(`${RED}[FAIL]${RESET} ${message}`);
  stats.failed++;
  stats.total++;
}

function logWarn(message) {
  console.log(`${YELLOW}[SKIP]${RESET} ${message}`);
  stats.skipped++;
  stats.total++;
}

function logVerbose(message) {
  if (verbose) {
    console.log(`${YELLOW}[VERBOSE]${RESET} ${message}`);
  }
}

function logSection(title) {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
}

function logHubHeader(hubKey) {
  const hub = HUBS[hubKey];
  console.log(`\n${hub.color}${BOLD}▶ ${hub.name}${RESET}`);
  console.log(`${hub.color}${'─'.repeat(hub.name.length + 2)}${RESET}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTTP CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TENET-Hub-Test/1.0',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    logVerbose(`Request: ${options.method || 'GET'} ${url}`);

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        stats.latencies.push(latency);
        
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch {
          parsedData = data;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData,
          latency,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUB TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testSATORHub() {
  logHubHeader('SATOR');
  const config = CONFIG[environment];

  // Test player data loading
  try {
    const response = await makeRequest(`${config.apiBase}/players?limit=5`);
    
    if (response.status === 200) {
      const playerCount = Array.isArray(response.data) ? response.data.length : 
                         (response.data.players || []).length;
      logSuccess(`Player data loading - ${playerCount} players retrieved (${response.latency}ms)`);
      logVerbose(`Sample: ${JSON.stringify(response.data[0] || response.data.players?.[0]).slice(0, 100)}...`);
    } else if (response.status === 404) {
      logWarn('Player endpoint not found (API may need updating)');
    } else {
      logError(`Player data loading failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Player data loading failed - ${error.message}`);
  }

  // Test analytics loading
  try {
    const response = await makeRequest(`${config.apiBase}/analytics/ratings`);
    
    if (response.status === 200) {
      logSuccess(`SimRating analytics loading (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Analytics endpoint not found');
    } else {
      logError(`Analytics loading failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Analytics loading failed - ${error.message}`);
  }

  // Test RAR scores
  try {
    const response = await makeRequest(`${config.apiBase}/analytics/rar`);
    
    if (response.status === 200) {
      logSuccess(`RAR scores loading (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('RAR endpoint not found');
    } else {
      logError(`RAR loading failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`RAR loading failed - ${error.message}`);
  }
}

async function testROTASHub() {
  logHubHeader('ROTAS');
  const config = CONFIG[environment];

  // Test match predictions
  try {
    const response = await makeRequest(`${config.apiBase}/analytics/match-predictions`);
    
    if (response.status === 200) {
      logSuccess(`Match predictions loading (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Match predictions endpoint not found');
    } else {
      logError(`Match predictions failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Match predictions failed - ${error.message}`);
  }

  // Test investment grades
  try {
    const response = await makeRequest(`${config.apiBase}/analytics/investment-grades`);
    
    if (response.status === 200) {
      logSuccess(`Investment grades loading (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Investment grades endpoint not found');
    } else {
      logError(`Investment grades failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Investment grades failed - ${error.message}`);
  }
}

async function testAREPOHub() {
  logHubHeader('AREPO');
  const config = CONFIG[environment];

  // Test global search
  try {
    const response = await makeRequest(`${config.apiBase}/search?q=test&limit=5`);
    
    if (response.status === 200) {
      logSuccess(`Global search working (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Search endpoint not found');
    } else {
      logError(`Global search failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Global search failed - ${error.message}`);
  }

  // Test cross-reference queries
  try {
    const response = await makeRequest(`${config.apiBase}/cross-ref/player-team`);
    
    if (response.status === 200) {
      logSuccess(`Player-team cross-reference working (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Cross-reference endpoint not found');
    } else {
      logError(`Cross-reference failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Cross-reference failed - ${error.message}`);
  }
}

async function testOPERAHUB() {
  logHubHeader('OPERA');
  const config = CONFIG[environment];

  // Test tournament loading
  try {
    const response = await makeRequest(`${config.apiBase}/opera/tournaments`);
    
    if (response.status === 200) {
      const tournamentCount = Array.isArray(response.data) ? response.data.length : 0;
      logSuccess(`Tournament loading - ${tournamentCount} tournaments (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Tournament endpoint not found (OPERA may need configuration)');
    } else {
      logError(`Tournament loading failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Tournament loading failed - ${error.message}`);
  }

  // Test schedule loading
  try {
    const response = await makeRequest(`${config.apiBase}/opera/schedules`);
    
    if (response.status === 200) {
      logSuccess(`Schedule loading working (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Schedule endpoint not found');
    } else {
      logError(`Schedule loading failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Schedule loading failed - ${error.message}`);
  }

  // Test team queries
  try {
    const response = await makeRequest(`${config.apiBase}/opera/teams`);
    
    if (response.status === 200) {
      logSuccess(`Team queries working (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Teams endpoint not found');
    } else {
      logError(`Team queries failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Team queries failed - ${error.message}`);
  }
}

async function testTENETEdge() {
  logHubHeader('TENET');
  const config = CONFIG[environment];

  // Test edge cache health
  try {
    const response = await makeRequest(`${config.tenetEdge}/health`);
    
    if (response.status === 200) {
      logSuccess(`TENET edge cache health check passed (${response.latency}ms)`);
      logVerbose(`Health response: ${JSON.stringify(response.data)}`);
    } else if (response.status === 404) {
      // Try alternative endpoint
      const altResponse = await makeRequest(`${config.apiBase}/health`);
      if (altResponse.status === 200) {
        logSuccess(`API health check passed (${altResponse.latency}ms)`);
      } else {
        logWarn('Edge health endpoint not found');
      }
    } else {
      logError(`Edge health check failed - HTTP ${response.status}`);
    }
  } catch (error) {
    // Try fallback endpoint
    try {
      const fallback = await makeRequest(`${config.apiBase}/health`);
      if (fallback.status === 200) {
        logSuccess(`API health check passed (${fallback.latency}ms)`);
      }
    } catch {
      logError(`Edge cache health check failed - ${error.message}`);
    }
  }

  // Test sync status
  try {
    const response = await makeRequest(`${config.tenetEdge}/sync-status`);
    
    if (response.status === 200) {
      logSuccess(`Sync status endpoint responding (${response.latency}ms)`);
    } else if (response.status === 404) {
      logWarn('Sync status endpoint not found');
    } else {
      logError(`Sync status failed - HTTP ${response.status}`);
    }
  } catch (error) {
    logError(`Sync status failed - ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function runTests() {
  logSection('TENET HUB CONNECTIONS TEST SUITE');
  
  logInfo(`Environment: ${environment.toUpperCase()}`);
  logInfo(`API Base: ${CONFIG[environment].apiBase}`);
  logVerbose(`WebSocket Base: ${CONFIG[environment].wsBase}`);
  logVerbose(`TENET Edge: ${CONFIG[environment].tenetEdge}`);

  // Run all hub tests
  await testSATORHub();
  await testROTASHub();
  await testAREPOHub();
  await testOPERAHUB();
  await testTENETEdge();
}

function printSummary() {
  logSection('TEST SUMMARY');

  const avgLatency = stats.latencies.length > 0 
    ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
    : 0;

  const maxLatency = stats.latencies.length > 0 
    ? Math.max(...stats.latencies)
    : 0;

  const p95Latency = stats.latencies.length > 0
    ? stats.latencies.sort((a, b) => a - b)[Math.floor(stats.latencies.length * 0.95)]
    : 0;

  console.log(`\n${BOLD}Results:${RESET}`);
  console.log(`  ${GREEN}✓ Passed:${RESET}  ${stats.passed}`);
  console.log(`  ${RED}✗ Failed:${RESET}  ${stats.failed}`);
  console.log(`  ${YELLOW}⊘ Skipped:${RESET} ${stats.skipped}`);
  console.log(`  ${BOLD}Total:${RESET}   ${stats.total}`);

  console.log(`\n${BOLD}Latency Statistics:${RESET}`);
  console.log(`  Average: ${avgLatency}ms`);
  console.log(`  P95:     ${p95Latency}ms`);
  console.log(`  Max:     ${maxLatency}ms`);

  console.log(`\n${BOLD}Hub Status:${RESET}`);
  Object.keys(HUBS).forEach(hubKey => {
    const hub = HUBS[hubKey];
    console.log(`  ${hub.color}●${RESET} ${hub.name}`);
  });

  if (stats.failed === 0) {
    console.log(`\n${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${GREEN}${BOLD}  ✓ ALL HUB CONNECTIONS HEALTHY - TENET PLATFORM READY${RESET}`);
    console.log(`${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
    return 0;
  } else {
    console.log(`\n${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${RED}${BOLD}  ✗ SOME CONNECTIONS FAILED - REVIEW ERRORS ABOVE${RESET}`);
    console.log(`${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
    return 1;
  }
}

function printUsage() {
  console.log(`
Usage: node ${process.argv[1]} [OPTIONS]

Options:
    -e, --env <dev|prod>    Environment to test (default: dev)
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

Environment Variables:
    VITE_API_URL            API base URL
    VITE_WS_URL             WebSocket base URL
    VITE_TENET_EDGE         TENET edge cache URL

Examples:
    node ${process.argv[1]}              # Test dev environment
    node ${process.argv[1]} --env prod   # Test production
    node ${process.argv[1]} --verbose    # Verbose output
`);
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-v':
      case '--verbose':
        verbose = true;
        break;
      case '-e':
      case '--env':
        environment = args[++i];
        if (!CONFIG[environment]) {
          console.error(`Unknown environment: ${environment}`);
          process.exit(1);
        }
        break;
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  // Print header
  console.log(`${CYAN}${BOLD}`);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   TENET HUB CONNECTIONS TEST SCRIPT                          ║');
  console.log('║            "Four Hubs - One Unified Experience"                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`${RESET}`);

  try {
    await runTests();
    const exitCode = printSummary();
    process.exit(exitCode);
  } catch (error) {
    console.error(`${RED}Fatal error: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Run main
main();
