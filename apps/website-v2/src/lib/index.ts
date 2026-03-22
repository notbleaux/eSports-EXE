/** [Ver001.000]
 * Lib Index
 * 
 * Central export point for utility libraries.
 */

// API Client
export { api, handleApiError } from './api-client';
export type { ApiError, RequestConfig } from './api-client';

// Easing functions
export * from './easing';

// Worker utilities
export { createWorker, terminateWorker, wrapWorker } from './worker-utils';
export type { WorkerWrapper, WorkerMessage } from './worker-utils';

// ML Loader - Dynamic TensorFlow.js loading
export {
  loadTensorFlow,
  setBackend,
  getCurrentBackend,
  isTensorFlowLoaded,
  loadModel,
  unloadModel,
  preloadModel,
  isModelCached,
  getCachedModel,
  clearMemoryCache,
  clearIndexedDBCache,
  getCacheStats,
  warmUpModel,
  dispose as disposeML,
  isMLEnabled,
  setMLEnabled,
  shouldAutoLoadML,
  updateMLConfig,
  getMLConfig,
  createMLLoader
} from './ml-loader';
export type {
  TFModule,
  TFBackend,
  MLLoadProgress,
  MLModelEntry,
  MLFeatureConfig,
  MLProgressCallback
} from './ml-loader';

// ML Feature Flags
export {
  loadFeatureFlags,
  isMLFeatureEnabled,
  isAnyMLFeatureEnabled,
  setMLFeature,
  enableAllMLFeatures,
  resetMLFeatures,
  getFeaturesForRoute,
  shouldLoadMLForRoute,
  getModelsToPreload,
  getRequiredMLModules,
  estimateMLBundleSize,
  getRouteConfigs,
  addRouteConfig,
  createFeatureChecker
} from './ml-feature-flags';
export type {
  MLFeatureFlags,
  MLRouteConfig,
  MLFeatureKey
} from './ml-feature-flags';
