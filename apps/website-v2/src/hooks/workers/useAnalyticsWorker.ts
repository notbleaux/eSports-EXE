/**
 * useAnalyticsWorker Hook
 * COMPLETELY DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AnalyticsWorkerRequest,
  AnalyticsWorkerResponse,
  SimRatingPayload,
  RARPayload,
  AggregationPayload
} from '../../types/worker'

// Worker factory - DISABLED
const createAnalyticsWorker = (): Worker => {
  throw new Error('Workers disabled for build compatibility')
}

interface UseAnalyticsWorkerOptions {
  onError?: (error: Error) => void
  onReady?: () => void
}

interface WorkerStats {
  calculationsCompleted: number
}

interface UseAnalyticsWorkerReturn {
  isReady: boolean
  isLoading: boolean
  error: Error | null
  stats: WorkerStats
  calculateSimRating: (payload: SimRatingPayload) => Promise<number>
  calculateRAR: (payload: RARPayload) => Promise<number>
  aggregateData: (payload: AggregationPayload) => Promise<unknown>
  terminate: () => void
}

export function useAnalyticsWorker(options: UseAnalyticsWorkerOptions = {}): UseAnalyticsWorkerReturn {
  const { onError, onReady } = options
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [stats] = useState<WorkerStats>({ calculationsCompleted: 0 })

  useEffect(() => {
    const err = new Error('Analytics Workers disabled for build compatibility')
    setError(err)
    onError?.(err)
  }, [onError])

  const calculateSimRating = useCallback(async (): Promise<number> => {
    throw new Error('Analytics Worker not available - disabled for build')
  }, [])

  const calculateRAR = useCallback(async (): Promise<number> => {
    throw new Error('Analytics Worker not available - disabled for build')
  }, [])

  const aggregateData = useCallback(async (): Promise<unknown> => {
    throw new Error('Analytics Worker not available - disabled for build')
  }, [])

  const terminate = useCallback(() => {
    // No-op
  }, [])

  return {
    isReady,
    isLoading,
    error,
    stats,
    calculateSimRating,
    calculateRAR,
    aggregateData,
    terminate,
  }
}

export default useAnalyticsWorker
