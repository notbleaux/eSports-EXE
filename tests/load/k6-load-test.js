/**
 * [Ver001.001]
 * SpecMapViewer Load Test
 * =======================
 * k6 load testing for map API endpoints.
 * 
 * Targets:
 * - 1000 RPS sustained
 * - <100ms p95 latency
 * - <500ms p99 latency
 * - 0% error rate
 * 
 * Usage: k6 run --env BASE_URL=http://localhost:8000 k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const wsLatency = new Trend('ws_latency');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    // Sustained load
    { duration: '5m', target: 1000 },
    // Spike test
    { duration: '1m', target: 2000 },
    { duration: '5m', target: 1000 },
    // Ramp down
    { duration: '2m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Test data
const MAPS = ['bind', 'haven', 'ascent'];
const LENS_TYPES = [['tension'], ['ripple'], ['wind'], ['tension', 'wind']];

export default function () {
  const mapId = MAPS[Math.floor(Math.random() * MAPS.length)];
  
  // Test 1: List maps
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/v1/maps`);
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'list maps status is 200': (r) => r.status === 200,
      'list maps returns array': (r) => Array.isArray(r.json()),
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.1);
  
  // Test 2: Get map grid
  {
    const start = new Date();
    const res = http.get(`${BASE_URL}/v1/maps/${mapId}/grid`);
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'get grid status is 200': (r) => r.status === 200,
      'get grid has dimensions': (r) => r.json('dimensions') !== null,
      'get grid has sites': (r) => r.json('sites') !== null,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.1);
  
  // Test 3: Get lens data
  {
    const lensTypes = LENS_TYPES[Math.floor(Math.random() * LENS_TYPES.length)];
    const start = new Date();
    const res = http.post(
      `${BASE_URL}/v1/maps/${mapId}/lens-data`,
      JSON.stringify({ lens_types: lensTypes }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'lens data status is 200': (r) => r.status === 200,
      'lens data has lens_data': (r) => r.json('lens_data') !== null,
      'lens data has timestamp': (r) => r.json('timestamp') !== null,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.1);
  
  // Test 4: Pathfinding
  {
    const start = new Date();
    const res = http.post(
      `${BASE_URL}/v1/maps/pathfind`,
      JSON.stringify({
        start: { x: 10 + Math.random() * 100, y: 10 + Math.random() * 100 },
        end: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 300 },
        avoid_chokepoints: Math.random() > 0.5,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    const latency = new Date() - start;
    apiLatency.add(latency);
    
    const success = check(res, {
      'pathfind status is 200': (r) => r.status === 200,
      'pathfind has path': (r) => Array.isArray(r.json('path')),
      'pathfind has distance': (r) => typeof r.json('distance') === 'number',
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
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
  console.log(`Starting load test against ${BASE_URL}`);
  console.log('Target: 1000 RPS sustained');
  console.log('Expected p95 latency: <100ms');
  
  // Warm up
  http.get(`${BASE_URL}/v1/maps`);
  http.get(`${BASE_URL}/v1/maps/bind/grid`);
  
  return { startTime: new Date() };
}

// Teardown
export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`\nLoad test completed in ${duration}s`);
}
