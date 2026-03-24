/**
 * useMLWorker Hook
 * COMPLETELY DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  MLWorkerRequest,
  MLWorkerResponse,
  MLInitPayload,
  MLInferencePayload,
  MLBatchPayload,
  MLPredictionResult
} from '../../types/worker'

// Worker factory - DISABLED
const createMLWorker = (): Worker => {
  throw new Error('Workers disabled for build compatibility')
}

interface UseMLWorkerOptions {
  onError?: (error: Error) => void
  onReady?: () => void
}

interface UseMLWorkerReturn {
  isReady: boolean
  isLoading: boolean
  error: Error | null
  predict: (features: number[]) => Promise<MLPredictionResult>
  predictBatch: (features: number[][]) => Promise<MLPredictionResult[]>
  initialize: (modelPath: string) => Promise<void>
  terminate: () => void
}

export function useMLWorker(options: UseMLWorkerOptions = {}): UseMLWorkerReturn {
  const { onError, onReady } = options
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const err = new Error('ML Workers disabled for build compatibility')
    setError(err)
    onError?.(err)
  }, [onError])

  const initialize = useCallback(async (): Promise<void> => {
    throw new Error('ML Worker not available - disabled for build')
  }, [])

  const predict = useCallback(async (): Promise<MLPredictionResult> => {
    throw new Error('ML Worker not available - disabled for build')
  }, [])

  const predictBatch = useCallback(async (): Promise<MLPredictionResult[]> => {
    throw new Error('ML Worker not available - disabled for build')
  }, [])

  const terminate = useCallback(() => {
    // No-op
  }, [])

  return {
    isReady,
    isLoading,
    error,
    predict,
    predictBatch,
    initialize,
    terminate,
  }
}

export default useMLWorker
