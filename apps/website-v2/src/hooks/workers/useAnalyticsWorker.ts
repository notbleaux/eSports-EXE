/** [Ver001.000]
 * useAnalyticsWorker Hook for 4NJZ4 TENET Platform
 * Hook for SimRating, RAR, and statistical calculations via Web Worker
 */

import { useCallback, useState } from 'react'
import { useWorker } from './useWorker'
import type {
  SimRatingPayload,
  SimRatingResult,
  RARPayload,
  RARResult,
  AggregationPayload
} from '../../types/worker'

// Worker factory for analytics worker
const createAnalyticsWorker = (): Worker => {
  return new Worker(new URL('../../workers/analytics.worker.ts', import.meta.url), {
    type: 'module'
  })
}

interface UseAnalyticsWorkerOptions {
  onError?: (error: Error) => void
  onReady?: () => void
}

interface WorkerStats {
  calculationsCompleted: number
  averageCalculationTime: number
  cacheHits: number
  cacheMisses: number
  cacheSize: number
}

interface UseAnalyticsWorkerReturn {
  isReady: boolean
  isCalculating: boolean
  stats: WorkerStats | null
  calculateSimRating: (payload: SimRatingPayload) => Promise<SimRatingResult>
  calculateRAR: (payload: RARPayload) => Promise<RARResult>
  calculateAggregation: (
    data: number[],
    operation: AggregationPayload['operation'],
    options?: AggregationPayload['options']
  ) => Promise<number>
  clearCache: () => Promise<void>
  getStats: () => Promise<WorkerStats>
  terminate: () => void
}

/**
 * Hook for managing analytics calculations via Web Worker
 */
export function useAnalyticsWorker(
  options: UseAnalyticsWorkerOptions = {}
): UseAnalyticsWorkerReturn {
  const { onError, onReady } = options

  const [stats, setStats] = useState<WorkerStats | null>(null)

  const { isReady, isBusy, postMessage, terminate } = useWorker({
    workerType: 'analytics',
    workerFactory: createAnalyticsWorker,
    onError,
    onReady
  })

  /**
   * Calculate SimRating for a player
   */
  const calculateSimRating = useCallback(async (
    payload: SimRatingPayload
  ): Promise<SimRatingResult> => {
    const result = await postMessage<SimRatingPayload, SimRatingResult>('simrating', payload)
    return result
  }, [postMessage])

  /**
   * Calculate RAR (Role-Adjusted Rating)
   */
  const calculateRAR = useCallback(async (
    payload: RARPayload
  ): Promise<RARResult> => {
    const result = await postMessage<RARPayload, RARResult>('rar', payload)
    return result
  }, [postMessage])

  /**
   * Calculate statistical aggregation
   */
  const calculateAggregation = useCallback(async (
    data: number[],
    operation: AggregationPayload['operation'],
    options?: AggregationPayload['options']
  ): Promise<number> => {
    const payload: AggregationPayload = { data, operation, options }
    const result = await postMessage<AggregationPayload, number>('aggregate', payload)
    return result
  }, [postMessage])

  /**
   * Clear calculation cache
   */
  const clearCache = useCallback(async (): Promise<void> => {
    await postMessage('clearCache', {})
  }, [postMessage])

  /**
   * Get worker statistics
   */
  const getStats = useCallback(async (): Promise<WorkerStats> => {
    const result = await postMessage<unknown, WorkerStats>('stats', {})
    setStats(result)
    return result
  }, [postMessage])

  return {
    isReady,
    isCalculating: isBusy,
    stats,
    calculateSimRating,
    calculateRAR,
    calculateAggregation,
    clearCache,
    getStats,
    terminate
  }
}

/**
 * Hook for batch SimRating calculations with caching
 */
export function useBatchSimRatings(
  options: UseAnalyticsWorkerOptions = {}
) {
  const analytics = useAnalyticsWorker(options)
  const [results, setResults] = useState<Map<string, SimRatingResult>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateBatch = useCallback(async (
    players: Array<{ id: string; payload: SimRatingPayload }>
  ): Promise<Map<string, SimRatingResult>> => {
    setIsProcessing(true)
    const newResults = new Map(results)

    try {
      for (const player of players) {
        // Skip if already cached
        if (newResults.has(player.id)) continue

        const result = await analytics.calculateSimRating(player.payload)
        newResults.set(player.id, result)
      }

      setResults(newResults)
      return newResults
    } finally {
      setIsProcessing(false)
    }
  }, [analytics, results])

  const clearResults = useCallback(() => {
    setResults(new Map())
  }, [])

  return {
    ...analytics,
    results,
    isProcessing,
    calculateBatch,
    clearResults
  }
}

/**
 * Hook for real-time SimRating with debouncing
 */
export function useRealtimeSimRating(
  options: UseAnalyticsWorkerOptions & {
    debounceMs?: number
  } = {}
) {
  const { debounceMs = 100, ...workerOptions } = options
  const analytics = useAnalyticsWorker(workerOptions)
  const [currentRating, setCurrentRating] = useState<SimRatingResult | null>(null)
  const [pendingPayload, setPendingPayload] = useState<SimRatingPayload | null>(null)

  // Debounced calculation effect would go here
  // For now, provide immediate calculation method

  const calculate = useCallback(async (
    payload: SimRatingPayload
  ): Promise<SimRatingResult> => {
    setPendingPayload(payload)
    const result = await analytics.calculateSimRating(payload)
    setCurrentRating(result)
    setPendingPayload(null)
    return result
  }, [analytics])

  return {
    ...analytics,
    currentRating,
    pendingPayload,
    calculate
  }
}
