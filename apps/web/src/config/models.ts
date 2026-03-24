/**
 * Model Configuration - ML Model settings and defaults
 * 
 * [Ver001.000]
 */

import {
  MAX_MODEL_SIZE_BYTES,
  MAX_QUANTIZED_MODEL_SIZE_BYTES,
  MAX_CONCURRENT_MODELS,
  MODEL_SWITCH_TIMEOUT_MS,
  MAX_RETRIES,
  PREDICTION_TIMEOUT_MS,
  WARMUP_ITERATIONS,
  BUFFER_SIZE,
  MAX_PREDICTIONS_HISTORY,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_RESET_MS
} from '../constants/ml'

// Model loading configuration
export const MODEL_CONFIG = {
  // Size limits
  maxSizeBytes: MAX_MODEL_SIZE_BYTES,
  maxQuantizedSizeBytes: MAX_QUANTIZED_MODEL_SIZE_BYTES,
  
  // Concurrency
  maxConcurrentModels: MAX_CONCURRENT_MODELS,
  switchTimeoutMs: MODEL_SWITCH_TIMEOUT_MS,
  
  // Retry logic
  maxRetries: MAX_RETRIES,
  predictionTimeoutMs: PREDICTION_TIMEOUT_MS,
  
  // Warmup
  warmupIterations: WARMUP_ITERATIONS,
  
  // Default quantization (8-bit for production)
  defaultQuantization: 8 as 8 | 16 | 32,
  
  // Supported backends in priority order
  backendPriority: ['webgpu', 'wasm', 'cpu'] as const,
  
  // Cache configuration
  cacheName: 'ml-model-cache',
  cacheVersion: 1
} as const

// Prediction configuration
export const PREDICTION_CONFIG = {
  // Input validation
  maxInputSize: 1000,
  minInputValue: -1000,
  maxInputValue: 1000,
  
  // Batch processing
  maxBatchSize: 100,
  defaultBatchSize: 32,
  
  // Performance thresholds
  maxLatencyMs: 100,
  warningLatencyMs: 50,
  
  // Circuit breaker
  circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD,
  circuitBreakerResetMs: CIRCUIT_BREAKER_RESET_MS
} as const

// Streaming configuration
export const STREAMING_CONFIG = {
  // WebSocket
  reconnectBaseMs: 1000,
  reconnectMaxMs: 30000,
  heartbeatIntervalMs: 30000,
  messageTimeoutMs: 5000,
  
  // Rate limiting
  maxPredictionsPerSecond: 10,
  debounceMs: 100,
  
  // Buffer
  bufferSize: BUFFER_SIZE,
  maxPredictionsHistory: MAX_PREDICTIONS_HISTORY,
  
  // Lag thresholds
  lagGreenThresholdMs: 100,
  lagYellowThresholdMs: 500
} as const

// Default model IDs
export const DEFAULT_MODELS = {
  production: 'sator-default',
  staging: 'sator-experimental',
  fallback: 'sator-fallback'
} as const

// Model version format
export const VERSION_FORMAT = {
  pattern: /^v\d+\.\d+\.\d+(-[a-z0-9]+)?$/,
  example: 'v1.2.3-beta'
} as const
