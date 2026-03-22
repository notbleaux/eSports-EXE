/**
 * useMLFeatureFlags - React Hook for ML Feature Flag Management
 * 
 * [Ver001.000] - React integration for ML bundle optimization
 * 
 * Provides:
 * - Reactive ML feature flag state
 * - Route-based activation
 * - User preference persistence
 * - Bundle size estimation
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  loadFeatureFlags,
  isMLFeatureEnabled,
  isAnyMLFeatureEnabled,
  setMLFeature,
  enableAllMLFeatures,
  resetMLFeatures,
  getFeaturesForRoute,
  shouldLoadMLForRoute,
  getModelsToPreload,
  estimateMLBundleSize,
  type MLFeatureKey,
  type MLFeatureFlags
} from '../lib/ml-feature-flags'
import { mlLogger } from '../utils/logger'

export interface UseMLFeatureFlagsReturn {
  // Feature states
  flags: MLFeatureFlags
  isEnabled: (feature: MLFeatureKey) => boolean
  isAnyEnabled: boolean
  
  // Route-based
  shouldLoadML: boolean
  currentRouteFeatures: MLFeatureKey[]
  modelsToPreload: string[]
  
  // Actions
  enableFeature: (feature: MLFeatureKey) => void
  disableFeature: (feature: MLFeatureKey) => void
  toggleFeature: (feature: MLFeatureKey) => void
  enableAll: () => void
  reset: () => void
  
  // Bundle info
  bundleEstimate: {
    estimatedSizeKB: number
    modules: string[]
  }
  
  // Loading state
  isLoading: boolean
}

/**
 * React hook for ML feature flag management
 */
export function useMLFeatureFlags(): UseMLFeatureFlagsReturn {
  const location = useLocation()
  const [flags, setFlags] = useState<MLFeatureFlags>(loadFeatureFlags())
  const [isLoading, setIsLoading] = useState(true)

  // Load flags on mount
  useEffect(() => {
    const loaded = loadFeatureFlags()
    setFlags(loaded)
    setIsLoading(false)
    mlLogger.debug('[useMLFeatureFlags] Loaded:', loaded)
  }, [])

  // Update flags when location changes (for route-based activation)
  useEffect(() => {
    const routeFeatures = getFeaturesForRoute(location.pathname)
    
    // Auto-enable features based on route if not explicitly disabled
    if (routeFeatures.shouldLoadML) {
      setFlags(current => {
        const updated = { ...current }
        let changed = false
        
        routeFeatures.features.forEach(feature => {
          if (!updated[feature]) {
            updated[feature] = true
            changed = true
          }
        })
        
        if (changed) {
          mlLogger.debug('[useMLFeatureFlags] Auto-enabled for route:', routeFeatures.features)
        }
        
        return updated
      })
    }
  }, [location.pathname])

  // Memoized computations
  const isEnabled = useCallback((feature: MLFeatureKey): boolean => {
    return flags[feature]
  }, [flags])

  const isAnyEnabled = useMemo(() => {
    return Object.values(flags).some(v => v === true)
  }, [flags])

  const shouldLoadML = useMemo(() => {
    return shouldLoadMLForRoute(location.pathname) && isAnyEnabled
  }, [location.pathname, isAnyEnabled])

  const currentRouteFeatures = useMemo(() => {
    return getFeaturesForRoute(location.pathname).features
  }, [location.pathname])

  const modelsToPreload = useMemo(() => {
    return getModelsToPreload(location.pathname)
  }, [location.pathname])

  const bundleEstimate = useMemo(() => {
    return estimateMLBundleSize()
  }, [flags])

  // Actions
  const enableFeature = useCallback((feature: MLFeatureKey) => {
    setMLFeature(feature, true)
    setFlags(current => ({ ...current, [feature]: true }))
    mlLogger.info(`[useMLFeatureFlags] Enabled: ${feature}`)
  }, [])

  const disableFeature = useCallback((feature: MLFeatureKey) => {
    setMLFeature(feature, false)
    setFlags(current => ({ ...current, [feature]: false }))
    mlLogger.info(`[useMLFeatureFlags] Disabled: ${feature}`)
  }, [])

  const toggleFeature = useCallback((feature: MLFeatureKey) => {
    const newValue = !flags[feature]
    setMLFeature(feature, newValue)
    setFlags(current => ({ ...current, [feature]: newValue }))
    mlLogger.info(`[useMLFeatureFlags] Toggled: ${feature} = ${newValue}`)
  }, [flags])

  const enableAll = useCallback(() => {
    enableAllMLFeatures()
    setFlags({ ...loadFeatureFlags() })
    mlLogger.info('[useMLFeatureFlags] All features enabled')
  }, [])

  const reset = useCallback(() => {
    resetMLFeatures()
    setFlags({ ...loadFeatureFlags() })
    mlLogger.info('[useMLFeatureFlags] Reset to defaults')
  }, [])

  return {
    flags,
    isEnabled,
    isAnyEnabled,
    shouldLoadML,
    currentRouteFeatures,
    modelsToPreload,
    enableFeature,
    disableFeature,
    toggleFeature,
    enableAll,
    reset,
    bundleEstimate,
    isLoading
  }
}

export default useMLFeatureFlags
