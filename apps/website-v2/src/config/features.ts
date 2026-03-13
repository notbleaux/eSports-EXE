/**
 * Feature Flags - Application feature configuration
 * 
 * [Ver001.000]
 */

import { getEnvironment } from './environment'

const env = getEnvironment()

// Feature flags interface
export interface FeatureFlags {
  // ML Features
  mlInference: boolean
  mlStreaming: boolean
  mlBatchPredictions: boolean
  mlQuantization: boolean
  
  // UI Features
  darkMode: boolean
  offlineMode: boolean
  analyticsPanel: boolean
  predictionHistory: boolean
  
  // Experimental
  webgpuBackend: boolean
  wasmBackend: boolean
  abTesting: boolean
}

// Default feature flags
export const DEFAULT_FEATURES: FeatureFlags = {
  mlInference: true,
  mlStreaming: true,
  mlBatchPredictions: true,
  mlQuantization: true,
  darkMode: true,
  offlineMode: true,
  analyticsPanel: true,
  predictionHistory: true,
  webgpuBackend: false,
  wasmBackend: true,
  abTesting: false
} as const

// Environment-specific overrides
const ENV_FEATURES: Record<string, Partial<FeatureFlags>> = {
  development: {
    mlStreaming: true,
    abTesting: true,
    webgpuBackend: true
  },
  staging: {
    abTesting: true
  },
  production: {
    webgpuBackend: false
  }
}

// Get effective feature flags
export function getFeatures(): FeatureFlags {
  const envFeatures = ENV_FEATURES[env.NODE_ENV] || {}
  
  // Allow localStorage override in development
  let localOverrides: Partial<FeatureFlags> = {}
  if (env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('feature-flags')
      if (stored) {
        localOverrides = JSON.parse(stored)
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  
  return {
    ...DEFAULT_FEATURES,
    ...envFeatures,
    ...localOverrides
  }
}

// Check if feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatures()[feature]
}

// Toggle feature (development only)
export function toggleFeature(feature: keyof FeatureFlags): void {
  if (env.NODE_ENV !== 'development') {
    console.warn('Feature toggling only allowed in development')
    return
  }
  
  const current = getFeatures()
  const newValue = !current[feature]
  
  try {
    localStorage.setItem('feature-flags', JSON.stringify({
      ...current,
      [feature]: newValue
    }))
    console.log(`Feature '${feature}' ${newValue ? 'enabled' : 'disabled'}`)
  } catch {
    console.error('Failed to toggle feature')
  }
}
