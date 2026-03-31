/** [Ver004.002] - Fixed missing type exports
 * Hooks Index
 * 
 * Central export point for all custom React hooks.
 */

// Animation hooks
export * from './animation';

// Cognitive Load hooks
export {
  useCognitiveLoad,
  useCognitiveLoadLevel,
  useIsHighCognitiveLoad,
  useCognitiveMetric,
  useCognitiveTaskTracker,
} from './useCognitiveLoad';
export type {
  UseCognitiveLoadOptions,
  UseCognitiveLoadResult,
} from './useCognitiveLoad';

// Help system hooks
export { useKnowledgeGraph } from './useKnowledgeGraph';
export type {
  UseKnowledgeGraphOptions,
  UseKnowledgeGraphReturn,
} from './useKnowledgeGraph';
export { useHelpSearch } from './useHelpSearch';
export type {
  UseHelpSearchOptions,
  UseHelpSearchReturn,
} from './useHelpSearch';
export { useRecommendations } from './useRecommendations';
export type {
  UseRecommendationsOptions,
  UseRecommendationsReturn,
} from './useRecommendations';
export { useContextDetection } from './useContextDetection';
export type {
  UseContextDetectionReturn,
} from '../lib/help/context-types';

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

// Broadcast
export { useBroadcast, useHelpBroadcast } from './useBroadcast';
export type {
  UseBroadcastReturn,
  UseBroadcastOptions,
} from '../lib/broadcast/types';
export type {
  UseHelpBroadcastOptions,
} from './useBroadcast';

// Live Match (Real-time)
export {
  useLiveMatch,
  useLiveEvents,
  useLiveScore,
  useLiveConnectionStatus,
  useLiveMatches,
} from './useLiveMatch';
export type {
  UseLiveMatchOptions,
  UseLiveMatchReturn,
} from '../lib/realtime/types';

// TanStack Query — Data Fetching Hooks
export { useMatchHistory } from './useMatchHistory';
export { useLiveMatches as useLiveMatchesQuery } from './useLiveMatches';
export { useMatchData } from './useMatchData';
export { useMatchHistoryDetail } from './useMatchHistoryDetail';
export { useReviewQueue } from './useReviewQueue';
export type { ReviewQueueItem } from './useReviewQueue';

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

// Voice command hooks
export { useVoiceCommand } from './useVoiceCommand';
export type {
  UseVoiceCommandOptions,
  UseVoiceCommandReturn,
} from './useVoiceCommand';

// Export hooks
export { useExport } from './useExport';
export type { UseExportOptions, UseExportReturn } from './useExport';

// Touch gesture hooks
export {
  useTouchGesture,
  useSwipeGesture,
  usePinchGesture,
  usePanGesture,
  useTapGesture,
  useLongPressGesture,
  type GestureDirection,
  type GestureType,
  type Point2D,
  type Velocity2D,
  type GestureState,
  type SwipeConfig,
  type PinchConfig,
  type LongPressConfig,
  type TapConfig,
  type PanConfig,
  type TouchGestureConfig,
  type GestureHandlers,
  type UseTouchGestureReturn,
} from './useTouchGesture';

// Mobile screen reader hooks
export {
  useMobileScreenReader,
  type ScreenReaderType,
  type MobileScreenReaderState,
  type MobileAnnouncementOptions,
  type ScreenReaderNavigationOptions,
  type PageChangeOptions,
  type FocusTrapConfig,
  type UseMobileScreenReaderReturn,
} from './useMobileScreenReader';

// Audio hooks
export {
  useAudio,
  useVoiceAudio,
  useSFXAudio,
  useAmbientAudio,
  usePersistentAudioSettings,
  useAudioAnimationSync,
} from './useAudio';
export type {
  UseAudioReturn,
  UseAudioOptions,
} from './useAudio';
