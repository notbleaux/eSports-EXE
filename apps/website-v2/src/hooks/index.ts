/** [Ver001.000]
 * Hooks Index
 * 
 * Central export point for all custom React hooks.
 */

// Animation hooks
export * from './animation';

// ML hooks
export { useMLInference } from './useMLInference';
export type { 
  UseMLInferenceReturn, 
  UseMLInferenceOptions,
  CircuitBreakerConfig,
  CircuitBreakerState,
  MLValidationError,
  MLTimeoutError,
  MLCircuitBreakerError,
  MLFeatureDisabledError
} from './useMLInference';
export { useMLModelManager } from './useMLModelManager';
export { useMLModelManagerWithRegistry } from './useMLModelManagerWithRegistry';
export { useStreamingInference } from './useStreamingInference';
export { useMLFeatureFlags } from './useMLFeatureFlags';

// Worker hooks
export * from './workers';

// Feature flags
export { useFeatureFlag } from './useFeatureFlag';

// WebSocket
export { useWebSocket } from './useWebSocket';

// Service Worker & PWA
export { useServiceWorker } from './useServiceWorker';
export { usePWA } from './usePWA';

// Workers
export { useWorkerError } from './useWorkerError';

// Analytics hooks
export { usePredictionAccuracy } from './usePredictionAccuracy';
export type {
  AccuracyMetrics,
  ModelAccuracy,
  TimeSeriesPoint,
  ConfusionMatrix,
  AccuracyData,
  UsePredictionAccuracyOptions,
  UsePredictionAccuracyReturn,
} from './usePredictionAccuracy';
