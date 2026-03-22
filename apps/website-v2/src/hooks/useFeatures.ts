/**
 * useFeatures - React Hook for ML Feature Access
 * 
 * [Ver001.000] - MVP Feature Hook
 * 
 * Provides:
 * - React hook for feature extraction
 * - Auto-recompute on data change
 * - Feature caching and memoization
 * - Integration with ML inference
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { mlLogger } from '../utils/logger'
import {
  featureExtractor,
  type ExtractedFeatures,
  type FeatureExtractionOptions,
  type WinProbabilityInput
} from '../lib/feature-extractor'
import type { MLModelType } from '../lib/ml-features'

// ============================================================================
// Types
// ============================================================================

export interface UseFeaturesOptions extends FeatureExtractionOptions {
  /** Auto-extract on mount/data change */
  autoExtract?: boolean
  /** Debounce ms for re-extraction */
  debounceMs?: number
  /** Dependencies that trigger re-extraction */
  deps?: unknown[]
}

export interface UseFeaturesReturn<T> {
  /** Extracted feature vector */
  features: ExtractedFeatures | null
  /** Feature names */
  featureNames: string[]
  /** Raw feature vector (numbers) */
  vector: number[]
  /** Whether features are being extracted */
  isExtracting: boolean
  /** Error if extraction failed */
  error: Error | null
  /** Number of features */
  featureCount: number
  /** Missing features */
  missingFeatures: string[]
  /** Extraction timestamp */
  extractedAt: number | null
  /** Manually trigger extraction */
  extract: () => Promise<void>
  /** Invalidate cache and re-extract */
  refresh: () => Promise<void>
  /** Get feature by name */
  getFeature: (name: string) => number | undefined
  /** Get feature object (name -> value) */
  toObject: () => Record<string, number>
}

export interface UseWinProbabilityFeaturesReturn extends UseFeaturesReturn<WinProbabilityInput> {
  /** Team A win probability (requires model) */
  predictWinProbability: () => Promise<number | null>
}

// ============================================================================
// Generic Feature Hook
// ============================================================================

export function useFeatures<T>(
  modelType: MLModelType,
  data: T | null,
  extractor: (data: T) => ExtractedFeatures,
  options: UseFeaturesOptions = {}
): UseFeaturesReturn<T> {
  const {
    autoExtract = true,
    debounceMs = 100,
    useCache = true,
    deps = []
  } = options

  const [features, setFeatures] = useState<ExtractedFeatures | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [extractedAt, setExtractedAt] = useState<number | null>(null)
  
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  // Memoized extraction
  const extract = useCallback(async () => {
    if (!data) {
      setFeatures(null)
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const result = extractor(data)
      
      if (isMountedRef.current) {
        setFeatures(result)
        setExtractedAt(Date.now())
        mlLogger.debug(`[useFeatures] Extracted ${result.vector.length} features for ${modelType}`)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Feature extraction failed')
        setError(error)
        mlLogger.error('[useFeatures] Extraction failed:', error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsExtracting(false)
      }
    }
  }, [data, modelType, extractor])

  // Debounced extraction
  const debouncedExtract = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      extract()
    }, debounceMs)
  }, [extract, debounceMs])

  // Auto-extract on data change
  useEffect(() => {
    if (autoExtract) {
      debouncedExtract()
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [autoExtract, debouncedExtract, ...deps])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Refresh function (invalidate cache and re-extract)
  const refresh = useCallback(async () => {
    featureExtractor.invalidateCache()
    await extract()
  }, [extract])

  // Get feature by name
  const getFeature = useCallback((name: string): number | undefined => {
    if (!features) return undefined
    const index = features.names.indexOf(name)
    return index >= 0 ? features.vector[index] : undefined
  }, [features])

  // Convert to object
  const toObject = useCallback((): Record<string, number> => {
    if (!features) return {}
    const obj: Record<string, number> = {}
    features.names.forEach((name, i) => {
      obj[name] = features.vector[i]
    })
    return obj
  }, [features])

  // Memoized derived values
  const vector = useMemo(() => features?.vector || [], [features])
  const featureNames = useMemo(() => features?.names || [], [features])
  const featureCount = useMemo(() => features?.vector.length || 0, [features])
  const missingFeatures = useMemo(() => features?.metadata.missingFeatures || [], [features])

  return {
    features,
    featureNames,
    vector,
    isExtracting,
    error,
    featureCount,
    missingFeatures,
    extractedAt,
    extract,
    refresh,
    getFeature,
    toObject
  }
}

// ============================================================================
// Win Probability Hook
// ============================================================================

export function useWinProbabilityFeatures(
  input: WinProbabilityInput | null,
  options: UseFeaturesOptions = {}
): UseWinProbabilityFeaturesReturn {
  const base = useFeatures(
    'win_probability',
    input,
    (data) => featureExtractor.extractWinProbability(data, { useCache: options.useCache }),
    options
  )

  // Predict win probability using the extracted features
  // Note: This would integrate with an actual model in production
  const predictWinProbability = useCallback(async (): Promise<number | null> => {
    if (!base.features) return null
    
    // Simple heuristic-based prediction for MVP
    // In production, this would call useMLInference.predict()
    const vector = base.features.vector
    const ratingDiffIndex = base.features.names.indexOf('rating_diff_avg')
    
    if (ratingDiffIndex < 0) return 0.5
    
    const ratingDiff = vector[ratingDiffIndex]
    // Convert normalized rating diff back to probability
    // This is a simplified model - real model would use all features
    const probability = 0.5 + (ratingDiff - 0.5) * 0.6
    
    return Math.max(0.05, Math.min(0.95, probability))
  }, [base.features])

  return {
    ...base,
    predictWinProbability
  }
}

// ============================================================================
// Player Performance Hook
// ============================================================================

export interface UsePlayerPerformanceFeaturesOptions extends UseFeaturesOptions {
  playerId?: string
  includeRecentStats?: boolean
}

export function usePlayerPerformanceFeatures(
  player: { id: string; stats?: unknown } | null,
  options: UsePlayerPerformanceFeaturesOptions = {}
) {
  return useFeatures(
    'player_performance',
    player,
    (data) => featureExtractor.extractPlayerPerformance(
      data as Parameters<typeof featureExtractor.extractPlayerPerformance>[0],
      undefined,
      { useCache: options.useCache }
    ),
    options
  )
}

// ============================================================================
// Team Synergy Hook
// ============================================================================

export function useTeamSynergyFeatures(
  team: { id: string; players?: unknown[] } | null,
  options: UseFeaturesOptions = {}
) {
  return useFeatures(
    'team_synergy',
    team,
    (data) => featureExtractor.extractTeamSynergy(
      data as Parameters<typeof featureExtractor.extractTeamSynergy>[0],
      { useCache: options.useCache }
    ),
    options
  )
}

// ============================================================================
// Batch Features Hook
// ============================================================================

export interface UseBatchFeaturesOptions extends UseFeaturesOptions {
  batchSize?: number
  parallel?: boolean
}

export interface UseBatchFeaturesReturn<T> {
  features: ExtractedFeatures[]
  isExtracting: boolean
  error: Error | null
  progress: number
  extract: () => Promise<void>
}

export function useBatchFeatures<T>(
  modelType: MLModelType,
  items: T[],
  extractor: (item: T) => ExtractedFeatures,
  options: UseBatchFeaturesOptions = {}
): UseBatchFeaturesReturn<T> {
  const { batchSize = 10, parallel = false, autoExtract = true } = options
  
  const [features, setFeatures] = useState<ExtractedFeatures[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  const extract = useCallback(async () => {
    if (!items.length) {
      setFeatures([])
      return
    }

    setIsExtracting(true)
    setError(null)
    setProgress(0)

    try {
      const results: ExtractedFeatures[] = []
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = batch.map(extractor)
        results.push(...batchResults)
        
        setProgress(Math.min(100, ((i + batch.length) / items.length) * 100))
        
        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      setFeatures(results)
      mlLogger.info(`[useBatchFeatures] Extracted ${results.length} feature sets`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch extraction failed')
      setError(error)
      mlLogger.error('[useBatchFeatures] Extraction failed:', error)
    } finally {
      setIsExtracting(false)
    }
  }, [items, batchSize, extractor])

  useEffect(() => {
    if (autoExtract) {
      extract()
    }
  }, [autoExtract, extract, items.length])

  return {
    features,
    isExtracting,
    error,
    progress,
    extract
  }
}

// ============================================================================
// Feature Store Hook (for accessing metadata)
// ============================================================================

export interface FeatureStoreInfo {
  version: string
  models: {
    name: string
    featureCount: number
    description: string
  }[]
}

export function useFeatureStore(): FeatureStoreInfo {
  return useMemo(() => ({
    version: '1.0.0',
    models: [
      {
        name: 'win_probability',
        featureCount: 22,
        description: 'Predicts match win probability'
      },
      {
        name: 'player_performance',
        featureCount: 17,
        description: 'Predicts individual player performance'
      },
      {
        name: 'team_synergy',
        featureCount: 13,
        description: 'Measures team coordination'
      }
    ]
  }), [])
}

// ============================================================================
// Feature Comparison Hook
// ============================================================================

export interface FeatureComparison {
  name: string
  valueA: number
  valueB: number
  diff: number
  diffPercent: number
}

export function useFeatureComparison(
  featuresA: ExtractedFeatures | null,
  featuresB: ExtractedFeatures | null
): FeatureComparison[] {
  return useMemo(() => {
    if (!featuresA || !featuresB) return []
    
    const comparisons: FeatureComparison[] = []
    
    featuresA.names.forEach((name, i) => {
      const valueA = featuresA.vector[i]
      const j = featuresB.names.indexOf(name)
      
      if (j >= 0) {
        const valueB = featuresB.vector[j]
        const diff = valueA - valueB
        const diffPercent = valueB !== 0 ? (diff / valueB) * 100 : 0
        
        comparisons.push({
          name,
          valueA,
          valueB,
          diff,
          diffPercent
        })
      }
    })
    
    return comparisons
  }, [featuresA, featuresB])
}

// ============================================================================
// Export
// ============================================================================

export default useFeatures
