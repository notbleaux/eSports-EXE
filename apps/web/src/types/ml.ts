/**
 * ML Type Definitions - Centralized TypeScript interfaces
 * 
 * [Ver001.000]
 */

// Core prediction types
export interface PredictionResult {
  id: string
  input: number[]
  output: number[]
  confidence: number
  modelId: string
  timestamp: Date
  latencyMs: number
  accuracy?: number
}

export interface StreamData {
  id: string
  features: number[]
  timestamp: number
}

export interface BatchPredictionResult {
  results: number[][]
  totalTime: number
  throughput: number
}

// Model types
export interface ModelInfo {
  name: string
  url: string
  sizeBytes?: number
  lastLoaded: Date | null
  quantization: 'fp32' | 'int16' | 'int8' | 'unknown'
  backend: string
}

export interface ModelMetadata {
  id: string
  version: string
  url: string
  checksum: string
  accuracy: number
  size: number
  deployedAt: Date
  status?: 'development' | 'staging' | 'production'
  quantization?: 'fp32' | 'int16' | 'int8'
  tags?: string[]
}

export interface LoadedModel {
  id: string
  url: string
  name: string
  info: ModelInfo | null
  isLoading: boolean
  isReady: boolean
  loadedAt: number
  error: Error | null
  sizeBytes: number
  quantization: 'fp32' | 'int16' | 'int8'
}

export interface ModelComparison {
  modelA: LoadedModel
  modelB: LoadedModel
  sizeDiff: number
  sizeDiffPercent: number
  latencyDiff?: number
  memoryDiff?: number
  recommendation: 'A' | 'B' | 'equivalent'
}

// Configuration types
export interface LoadOptions {
  name?: string
  quantization?: 8 | 16 | 32
  priority?: number
  preload?: boolean
}

export interface WarmUpOptions {
  iterations?: number
  verbose?: boolean
  progressive?: boolean
}

export interface UseMLInferenceOptions {
  useWorker?: boolean
  maxRetries?: number
  timeout?: number
  circuitBreaker?: CircuitBreakerConfig
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  halfOpenMaxCalls: number
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  successCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

// Streaming types
export interface StreamingMetrics {
  lag: number
  throughput: number
  bufferSize: number
}

export interface UseStreamingInferenceOptions {
  wsUrl?: string
  maxPredictionsPerSecond?: number
  modelUrl?: string
}

export interface UseStreamingInferenceReturn {
  predictions: PredictionResult[]
  isStreaming: boolean
  isPaused: boolean
  lag: number
  throughput: number
  bufferSize: number
  error: Error | null
  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
}

// Analytics types
export interface PredictionEvent {
  timestamp: number
  latency: number
  success: boolean
  modelId: string
  inputSize: number
  errorType?: string
}

export interface ModelLoadEvent {
  timestamp: number
  modelId: string
  duration: number
  source: 'cache' | 'network'
  sizeBytes?: number
  quantization?: 'fp32' | 'int16' | 'int8'
}

export interface MLError {
  type: 'validation' | 'inference' | 'network' | 'timeout' | 'unknown'
  message: string
  stack?: string
}

export interface LatencyDistribution {
  p50: number
  p95: number
  p99: number
  min: number
  max: number
  avg: number
}

export interface ModelMetrics {
  modelId: string
  predictions: number
  errors: number
  avgLatency: number
  latencyDistribution: LatencyDistribution
  cacheHitRate: number
  lastUsed: number
}

export interface AnalyticsReport {
  generatedAt: number
  timeRange: { start: number; end: number }
  summary: {
    totalPredictions: number
    totalErrors: number
    errorRate: number
    avgLatency: number
    activeModels: number
  }
  latencyDistribution: LatencyDistribution
  modelMetrics: ModelMetrics[]
  errorsByType: Record<string, number>
  hourlyActivity: { hour: number; predictions: number; errors: number }[]
}

// A/B Testing types
export interface VariantConfig {
  id: string
  modelId: string
  modelUrl: string
  name: string
  description?: string
}

export interface ABTestConfig {
  id: string
  variantA: VariantConfig
  variantB: VariantConfig
  trafficSplit?: number
  minSampleSize?: number
  confidenceThreshold?: number
  maxDuration?: number
  primaryMetric?: 'latency' | 'accuracy' | 'error_rate'
}

export interface ABTestStats {
  variantA: {
    id: string
    predictions: number
    avgLatency: number
    errorRate: number
    p95Latency: number
  }
  variantB: {
    id: string
    predictions: number
    avgLatency: number
    errorRate: number
    p95Latency: number
  }
  confidence: number
  winner: 'A' | 'B' | null
  isSignificant: boolean
  sampleSizeAdequate: boolean
}

// Filter and query types
export interface DateRange {
  start: Date
  end: Date
}

export interface FilterOptions {
  modelId?: string
  minConfidence?: number
  startDate?: Date
  endDate?: Date
  searchQuery?: string
}

// Error types
export class MLValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLValidationError'
  }
}

export class MLTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLTimeoutError'
  }
}

export class MLCircuitBreakerError extends Error {
  constructor(message: string = 'Circuit breaker is OPEN') {
    super(message)
    this.name = 'MLCircuitBreakerError'
  }
}
