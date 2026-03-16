/**
 * [Ver002.000]
 * Performance Load Test
 * =====================
 * k6 load testing for betting API endpoints and general performance.
 * 
 * Targets:
 * - API response: < 200ms p95
 * - WebSocket latency: < 50ms
 * - Bundle size: < 500KB gzipped
 * - Error rate: < 1%
 * 
 * Usage: k6 run --env BASE_URL=http://localhost:8000 tests/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const wsLatency = new Trend('ws_latency');
const bettingLatency = new Trend('betting_latency');

// Test configuration - Performance Wave 2 Targets
export const options = {
  stages: [
    // Ramp up
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    // Sustained load - 100 concurrent users
    { duration: '3m', target: 100 },
    // Spike test - 200 concurrent users
    { duration: '1m', target: 200 },
    { duration: '2m', target: 200 },
    // Ramp down
    { duration: '1m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Performance targets: < 200ms p95, < 500ms p99
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    // Custom metric targets
    betting_latency: ['p(95)<200'],
    api_latency: ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Test data
const MAPS = ['bind', 'haven', 'ascent'];
const LENS_TYPES = [['tension'], ['ripple'], ['wind'], ['tension', 'wind']];
const MATCH_IDS = ['match_001', 'match_002', 'match_003', 'match_004', 'match_005'];

export default function () {
  const mapId = MAPS[Math.floor(Math.random() * MAPS.length)];
  const matchId = MATCH_IDS[Math.floor(Math.random() * MATCH_IDS.length)];
  
  // Test 1: Betting - Get match odds (with Redis caching)
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/api/betting/matches/${matchId}/odds`);
    const latency = new Date() - start;
    bettingLatency.add(latency);
    apiLatency.add(latency);
    
    const success = check(res, {
      'odds status is 200': (r) => r.status === 200,
      'odds response < 200ms': (r) => r.timings.duration < 200,
      'odds has match_id': (r) => r.json('match_id') !== undefined,
      'odds has team_a_decimal': (r) => r.json('team_a_decimal') !== undefined,
      'odds has team_b_decimal': (r) => r.json('team_b_decimal') !== undefined,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
  
  // Test 2: Betting - Get leaderboard (cached)
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/api/betting/leaderboard?limit=10&period=all_time`);
    const latency = new Date() - start;
    bettingLatency.add(latency);
    apiLatency.add(latency);
    
    const success = check(res, {
      'leaderboard status is 200': (r) => r.status === 200,
      'leaderboard response < 200ms': (r) => r.timings.duration < 200,
      'leaderboard has entries': (r) => Array.isArray(r.json('entries')),
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
  
  // Test 3: List maps
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/v1/maps`);
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'list maps status is 200': (r) => r.status === 200,
      'list maps returns array': (r) => Array.isArray(r.json()),
      'list maps < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
  
  // Test 4: Get map grid
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/v1/maps/${mapId}/grid`);
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'get grid status is 200': (r) => r.status === 200,
      'get grid has dimensions': (r) => r.json('dimensions') !== null,
      'get grid has sites': (r) => r.json('sites') !== null,
      'get grid < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
  
  // Test 5: Health check
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/api/betting/health`);
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'health status is 200': (r) => r.status === 200,
      'health service is healthy': (r) => r.json('status') === 'healthy',
      'health < 100ms': (r) => r.timings.duration < 100,
    });
    
    errorRate.add(!success);
  }
  
  sleep(1);
}

// WebSocket test scenario (run with: k6 run --env SCENARIO=ws k6-load-test.js)
export function wsTest() {
  const wsUrl = `${BASE_URL.replace('http', 'ws')}/v1/ws/lens-updates`;
  
  const start = new Date();
  const res = ws.connect(wsUrl, null, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        action: 'subscribe',
        map_id: 'bind',
        lens_types: ['tension'],
      }));
    });
    
    socket.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'lens_update') {
        const latency = Date.now() - start;
        wsLatency.add(latency);
        
        check(data, {
          'ws lens update received': () => data.type === 'lens_update',
          'ws has map_id': () => data.map_id !== undefined,
          'ws has data': () => data.data !== undefined,
        });
        
        socket.close();
      }
    });
    
    socket.setTimeout(function () {
      socket.close();
    }, 5000);
  });
  
  check(res, { 'WebSocket status is 101': (r) => r && r.status === 101 });
}

// Setup
export function setup() {
  console.log('='.repeat(80));
  console.log('🚀 Performance Load Test - Wave 2');
  console.log('='.repeat(80));
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Targets:');
  console.log('  • API response: < 200ms p95');
  console.log('  • WebSocket latency: < 50ms');
  console.log('  • Bundle size: < 500KB gzipped');
  console.log('  • Error rate: < 1%');
  console.log('='.repeat(80));
  
  // Warm up endpoints
  console.log('\nWarming up endpoints...');
  http.get(`${BASE_URL}/v1/maps`);
  http.get(`${BASE_URL}/v1/maps/bind/grid`);
  http.get(`${BASE_URL}/api/betting/health`);
  http.get(`${BASE_URL}/api/betting/matches/match_001/odds`);
  console.log('Warmup complete\n');
  
  return { startTime: new Date() };
}

// Teardown
export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log('\n' + '='.repeat(80));
  console.log('📊 Load Test Complete');
  console.log('='.repeat(80));
  console.log(`Duration: ${duration}s`);
  console.log('\nRun bundle analysis:');
  console.log('  node scripts/bundle-analyze.js');
  console.log('\nRun database optimization:');
  console.log('  python scripts/optimize_queries.py');
  console.log('='.repeat(80));
}
