/**
 * Test Fixtures - Mock data for testing
 * 
 * [Ver001.000]
 */

import { PredictionResult } from '@/store/predictionHistoryStore'
import { CachedModel } from '@/store/mlCacheStore'

// ============================================================================
// API Fixtures
// ============================================================================

export const mockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  headers: new Headers({ 'content-type': 'application/json' }),
})

export const mockApiError = (message: string, code: string, status: number) => ({
  message,
  code,
  status,
})

// ============================================================================
// ML Model Fixtures
// ============================================================================

export const createMockModel = (overrides?: Partial<CachedModel>): CachedModel => ({
  id: 'test-model-v1',
  url: '/models/test-model-v1.json',
  name: 'Test Model',
  sizeBytes: 1024 * 1024, // 1MB
  lastAccessed: Date.now(),
  accessCount: 1,
  quantization: 'fp32',
  cacheHit: 0,
  cacheMiss: 0,
  ...overrides,
})

export const mockModelMetadata = {
  name: 'test-model',
  version: '1.0.0',
  inputShape: [1, 10],
  outputShape: [1, 2],
  quantization: 'fp32' as const,
}

// ============================================================================
// Prediction Fixtures
// ============================================================================

export const createMockPrediction = (overrides?: Partial<PredictionResult>): PredictionResult => ({
  id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  input: [0.5, 0.3, 0.2],
  output: [0.8, 0.15, 0.05],
  confidence: 0.85,
  modelId: 'test-model-v1',
  timestamp: new Date(),
  latencyMs: 25.5,
  ...overrides,
})

export const mockPredictions: PredictionResult[] = [
  createMockPrediction({ modelId: 'model-a', confidence: 0.9, latencyMs: 20 }),
  createMockPrediction({ modelId: 'model-b', confidence: 0.6, latencyMs: 30 }),
  createMockPrediction({ modelId: 'model-a', confidence: 0.85, latencyMs: 25 }),
]

// ============================================================================
// Analytics Fixtures
// ============================================================================

export const mockAnalyticsEvent = {
  type: 'prediction' as const,
  timestamp: Date.now(),
  data: { modelId: 'test-model', confidence: 0.9 },
  sessionId: 'sess-test-123',
}

export const mockAnalyticsBatch = {
  events: [mockAnalyticsEvent],
  metadata: {
    batchSize: 1,
    sentAt: new Date().toISOString(),
    clientVersion: '2.0.0',
  },
}

export const mockDashboardData = {
  predictions: {
    total: 100,
    errors: 5,
    avgLatency: 20.5,
    p95Latency: 45.2,
  },
  models: {
    active: ['model-a', 'model-b'],
    loads: 50,
    errors: 2,
  },
  realtime: {
    predictionsPerSecond: 10.5,
    activeUsers: 25,
  },
}

// ============================================================================
// User Fixtures
// ============================================================================

export const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  is_active: true,
  is_verified: true,
  avatar_url: 'https://example.com/avatar.png',
}

// ============================================================================
// Health Check Fixtures
// ============================================================================

export const mockHealthStatus = {
  status: 'healthy' as const,
  version: '2.0.0',
  timestamp: Date.now(),
  uptime: 3600,
  checks: {
    mlModel: { status: 'loaded' as const, lastCheck: Date.now() },
    api: { status: 'connected' as const, lastChecked: Date.now(), latency: 50 },
    cache: { status: 'warm' as const, hitRate: 0.95, modelCount: 3 },
    webVitals: { status: 'good' as const, cls: 0.1, lcp: 1.5, fid: 20 },
  },
  metadata: {
    environment: 'test',
    region: 'us-east-1',
    instance: 'test-instance',
  },
}

// ============================================================================
// Component Test Helpers
// ============================================================================

export const createMockBoundingClientRect = (overrides?: Partial<DOMRect>): DOMRect => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: () => '',
  ...overrides,
})

export const createMockResizeObserverEntry = (
  target: Element,
  contentRect: DOMRect = createMockBoundingClientRect()
): ResizeObserverEntry => ({
  target,
  contentRect,
  borderBoxSize: [],
  contentBoxSize: [],
  devicePixelContentBoxSize: [],
})
