/**
 * ML Feature Flags - Conditional ML Loading Based on Routes and Settings
 * 
 * [Ver001.000] - Feature flag system for ML bundle optimization
 * 
 * Provides:
 * - Route-based ML activation
 * - User preference storage
 * - Environment-based feature toggles
 * - Lazy loading coordination
 */

import { mlLogger } from '../utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface MLFeatureFlags {
  // Core ML features
  mlPredictions: boolean
  mlAnalytics: boolean
  mlBatchInference: boolean
  mlStreaming: boolean
  
  // Model types
  winProbabilityModel: boolean
  playerRatingModel: boolean
  teamSynergyModel: boolean
  mapPredictionModel: boolean
  
  // Optimizations
  modelQuantization: boolean
  webWorkerInference: boolean
  gpuAcceleration: boolean
  modelPreloading: boolean
}

export interface MLRouteConfig {
  path: string
  features: (keyof MLFeatureFlags)[]
  preloadModels: string[]
  priority: 'critical' | 'high' | 'normal' | 'low'
}

export type MLFeatureKey = keyof MLFeatureFlags

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_FLAGS: MLFeatureFlags = {
  // Core features - disabled by default to reduce bundle
  mlPredictions: false,
  mlAnalytics: false,
  mlBatchInference: false,
  mlStreaming: false,
  
  // Model types
  winProbabilityModel: false,
  playerRatingModel: false,
  teamSynergyModel: false,
  mapPredictionModel: false,
  
  // Optimizations
  modelQuantization: true,
  webWorkerInference: true,
  gpuAcceleration: true,
  modelPreloading: false
}

// Route-based feature activation
const ROUTE_CONFIGS: MLRouteConfig[] = [
  {
    path: '/hub-1-sator',
    features: ['mlPredictions', 'winProbabilityModel', 'playerRatingModel'],
    preloadModels: ['win-probability-v1'],
    priority: 'high'
  },
  {
    path: '/hub-1-sator/analytics',
    features: ['mlAnalytics', 'mlBatchInference', 'playerRatingModel', 'teamSynergyModel'],
    preloadModels: ['player-rating-v1', 'team-synergy-v1'],
    priority: 'critical'
  },
  {
    path: '/hub-2-rotas',
    features: ['mlPredictions', 'mapPredictionModel'],
    preloadModels: ['map-prediction-v1'],
    priority: 'normal'
  },
  {
    path: '/predictions',
    features: ['mlPredictions', 'mlBatchInference', 'winProbabilityModel'],
    preloadModels: ['win-probability-v1'],
    priority: 'high'
  },
  {
    path: '/live',
    features: ['mlStreaming', 'winProbabilityModel'],
    preloadModels: ['win-probability-v1'],
    priority: 'critical'
  }
]

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY = 'sator:ml:features'
const STORAGE_VERSION = 'v1'

// ============================================================================
// State
// ============================================================================

let currentFlags: MLFeatureFlags = { ...DEFAULT_FLAGS }
let flagsLoaded = false

// ============================================================================
// Feature Flag Management
// ============================================================================

/**
 * Load feature flags from storage and environment
 */
export function loadFeatureFlags(): MLFeatureFlags {
  if (flagsLoaded) {
    return { ...currentFlags }
  }

  // Start with defaults
  let flags = { ...DEFAULT_FLAGS }

  // Override from localStorage (user preferences)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.version === STORAGE_VERSION) {
          flags = { ...flags, ...parsed.flags }
        }
      }
    } catch (error) {
      mlLogger.warn('[ML Flags] Failed to load stored flags:', error)
    }

    // Override from URL params (debugging)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('ml-enabled')) {
      flags.mlPredictions = urlParams.get('ml-enabled') === 'true'
    }
    if (urlParams.has('ml-analytics')) {
      flags.mlAnalytics = urlParams.get('ml-analytics') === 'true'
    }

    // Override from environment
    if (import.meta.env.VITE_ML_ENABLED === 'true') {
      flags.mlPredictions = true
    }
  }

  currentFlags = flags
  flagsLoaded = true

  mlLogger.debug('[ML Flags] Loaded:', flags)
  return { ...currentFlags }
}

/**
 * Check if a specific ML feature is enabled
 */
export function isMLFeatureEnabled(feature: MLFeatureKey): boolean {
  if (!flagsLoaded) {
    loadFeatureFlags()
  }
  return currentFlags[feature]
}

/**
 * Check if any ML feature is enabled
 */
export function isAnyMLFeatureEnabled(): boolean {
  if (!flagsLoaded) {
    loadFeatureFlags()
  }
  return Object.values(currentFlags).some(v => v === true)
}

/**
 * Enable/disable a specific feature
 */
export function setMLFeature(feature: MLFeatureKey, enabled: boolean): void {
  currentFlags[feature] = enabled
  saveFeatureFlags()
  mlLogger.info(`[ML Flags] ${feature}: ${enabled ? 'enabled' : 'disabled'}`)
}

/**
 * Enable all ML features (for power users)
 */
export function enableAllMLFeatures(): void {
  Object.keys(currentFlags).forEach(key => {
    currentFlags[key as MLFeatureKey] = true
  })
  saveFeatureFlags()
  mlLogger.info('[ML Flags] All features enabled')
}

/**
 * Reset to default flags
 */
export function resetMLFeatures(): void {
  currentFlags = { ...DEFAULT_FLAGS }
  saveFeatureFlags()
  mlLogger.info('[ML Flags] Reset to defaults')
}

function saveFeatureFlags(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: STORAGE_VERSION,
        flags: currentFlags
      }))
    } catch (error) {
      mlLogger.warn('[ML Flags] Failed to save flags:', error)
    }
  }
}

// ============================================================================
// Route-Based Activation
// ============================================================================

/**
 * Get ML features needed for a specific route
 */
export function getFeaturesForRoute(path: string): {
  features: MLFeatureKey[]
  shouldLoadML: boolean
  modelsToPreload: string[]
  priority: MLRouteConfig['priority']
} {
  const config = ROUTE_CONFIGS.find(r => 
    path.startsWith(r.path) || path === r.path
  )

  if (!config) {
    return {
      features: [],
      shouldLoadML: false,
      modelsToPreload: [],
      priority: 'low'
    }
  }

  // Filter to only enabled features
  const enabledFeatures = config.features.filter(f => isMLFeatureEnabled(f))

  return {
    features: enabledFeatures,
    shouldLoadML: enabledFeatures.length > 0,
    modelsToPreload: config.preloadModels,
    priority: config.priority
  }
}

/**
 * Check if ML should be loaded for current route
 */
export function shouldLoadMLForRoute(path: string): boolean {
  const { shouldLoadML } = getFeaturesForRoute(path)
  return shouldLoadML
}

/**
 * Get models to preload for current route
 */
export function getModelsToPreload(path: string): string[] {
  const { modelsToPreload, shouldLoadML } = getFeaturesForRoute(path)
  return shouldLoadML ? modelsToPreload : []
}

// ============================================================================
// React Hook Helpers
// ============================================================================

/**
 * Hook-compatible feature checker
 */
export function createFeatureChecker() {
  return {
    isEnabled: isMLFeatureEnabled,
    isAnyEnabled: isAnyMLFeatureEnabled,
    getForRoute: getFeaturesForRoute,
    shouldLoadForRoute: shouldLoadMLForRoute,
    getPreloadModels: getModelsToPreload
  }
}

/**
 * Get all available route configs
 */
export function getRouteConfigs(): readonly MLRouteConfig[] {
  return ROUTE_CONFIGS
}

/**
 * Add custom route configuration (for plugins/extensions)
 */
export function addRouteConfig(config: MLRouteConfig): void {
  // Remove existing config for same path if exists
  const existingIndex = ROUTE_CONFIGS.findIndex(r => r.path === config.path)
  if (existingIndex > -1) {
    ROUTE_CONFIGS.splice(existingIndex, 1)
  }
  ROUTE_CONFIGS.push(config)
  mlLogger.debug('[ML Flags] Added route config:', config.path)
}

// ============================================================================
// Bundle Size Optimization Helpers
// ============================================================================

/**
 * Get list of ML modules that should be dynamically imported
 * based on enabled features
 */
export function getRequiredMLModules(): string[] {
  const modules: string[] = []

  if (currentFlags.mlPredictions || currentFlags.mlBatchInference) {
    modules.push('@tensorflow/tfjs')
  }

  if (currentFlags.webWorkerInference) {
    modules.push('../workers/ml.worker')
  }

  return modules
}

/**
 * Estimate bundle size impact of enabled features
 */
export function estimateMLBundleSize(): {
  estimatedSizeKB: number
  modules: string[]
} {
  const modules: string[] = []
  let sizeKB = 0

  if (currentFlags.mlPredictions || currentFlags.mlBatchInference) {
    modules.push('@tensorflow/tfjs')
    sizeKB += 2200 // ~2.2MB for TF.js
  }

  if (currentFlags.modelQuantization) {
    sizeKB -= 1100 // ~50% reduction with quantization
  }

  if (currentFlags.webWorkerInference) {
    modules.push('ml-worker')
    sizeKB += 50 // ~50KB worker overhead
  }

  return {
    estimatedSizeKB: Math.max(0, sizeKB),
    modules
  }
}

// Initialize on load
loadFeatureFlags()

export default createFeatureChecker
