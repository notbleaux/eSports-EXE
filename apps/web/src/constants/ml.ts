/**
 * ML Constants - Centralized magic numbers and configuration
 * 
 * [Ver001.000]
 */

// Buffer sizes
export const BUFFER_SIZE = 100
export const MAX_PREDICTIONS_HISTORY = 1000
export const PREDICTIONS_PER_PAGE = 50
export const MAX_STREAMING_PREDICTIONS = 10

// Retry configuration
export const MAX_RETRIES = 3
export const RETRY_BASE_DELAY_MS = 1000
export const RETRY_MAX_DELAY_MS = 30000
export const RETRY_JITTER_MS = 100

// Timing
export const DEBOUNCE_MS = 250
export const PREDICTION_TIMEOUT_MS = 10000
export const WARMUP_ITERATIONS = 3
export const CIRCUIT_BREAKER_THRESHOLD = 5
export const CIRCUIT_BREAKER_RESET_MS = 30000

// WebSocket
export const WS_RECONNECT_BASE_MS = 1000
export const WS_RECONNECT_MAX_MS = 30000
export const WS_HEARTBEAT_INTERVAL_MS = 30000
export const WS_MESSAGE_TIMEOUT_MS = 5000

// Model constraints
export const MAX_MODEL_SIZE_BYTES = 512000 // 500KB
export const MAX_QUANTIZED_MODEL_SIZE_BYTES = 153600 // 150KB
export const MAX_CONCURRENT_MODELS = 5
export const MODEL_SWITCH_TIMEOUT_MS = 50

// Input validation
export const MAX_INPUT_SIZE = 1000
export const MIN_INPUT_VALUE = -1000
export const MAX_INPUT_VALUE = 1000

// Performance thresholds
export const LAG_GREEN_THRESHOLD_MS = 100
export const LAG_YELLOW_THRESHOLD_MS = 500
export const LATENCY_P95_THRESHOLD_MS = 100

// A/B Testing
export const AB_TEST_MIN_SAMPLE_SIZE = 100
export const AB_TEST_CONFIDENCE_THRESHOLD = 0.95
export const AB_TEST_MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Cache
export const DEFAULT_MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB
export const CACHE_EVICTION_BATCH_SIZE = 3
