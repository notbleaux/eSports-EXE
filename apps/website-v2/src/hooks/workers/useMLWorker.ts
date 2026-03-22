/** [Ver001.000]
 * useMLWorker Hook for 4NJZ4 TENET Platform
 * Hook for TensorFlow.js ML inference via Web Worker
 */

import { useCallback, useRef, useState } from 'react'
import { useWorker } from './useWorker'
import type {
  MLModelConfig,
  MLInferencePayload,
  MLBatchPayload,
  MLPredictionResult
} from '../../types/worker'

// Worker factory for ML worker
const createMLWorker = (): Worker => {
  return new Worker(new URL('../../workers/ml.worker.ts', import.meta.url), {
    type: 'module'
  })
}

interface UseMLWorkerOptions {
  onError?: (error: Error) => void
  onReady?: () => void
}

interface UseMLWorkerReturn {
  isReady: boolean
  isLoading: boolean
  isPredicting: boolean
  backend: string | null
  stats: {
    totalPredictions: number
    averageInferenceTime: number
    warmModels: string[]
  } | null
  initialize: () => Promise<{ backend: string }>
  loadModel: (modelPath: string, config?: Partial<MLModelConfig>) => Promise<void>
  predict: (inputs: number[][], modelType: 'simrating' | 'prediction' | 'classification') => Promise<MLPredictionResult>
  predictBatch: (batch: MLBatchPayload['batch'], modelType: 'simrating' | 'prediction' | 'classification') => Promise<MLPredictionResult[]>
  warmModel: (modelType: string, inputShape: number[]) => Promise<void>
  getStats: () => Promise<{
    backend: string
    totalPredictions: number
    averageInferenceTime: number
    warmModels: string[]
    cachedModels: string[]
  }>
  dispose: () => Promise<void>
  terminate: () => void
}

/**
 * Hook for managing ML inference via Web Worker
 */
export function useMLWorker(options: UseMLWorkerOptions = {}): UseMLWorkerReturn {
  const { onError, onReady } = options

  const [backend, setBackend] = useState<string | null>(null)
  const [stats, setStats] = useState<UseMLWorkerReturn['stats']>(null)
  const modelPathsRef = useRef<Set<string>>(new Set())

  const { isReady, isBusy, postMessage, terminate } = useWorker({
    workerType: 'ml',
    workerFactory: createMLWorker,
    onError,
    onReady
  })

  /**
   * Initialize TensorFlow.js backend
   */
  const initialize = useCallback(async (): Promise<{ backend: string }> => {
    const result = await postMessage<unknown, { backend: string }>('init', {})
    setBackend(result.backend)
    return result
  }, [postMessage])

  /**
   * Load a TensorFlow.js model
   */
  const loadModel = useCallback(async (
    modelPath: string,
    config?: Partial<MLModelConfig>
  ): Promise<void> => {
    await postMessage('loadModel', { modelPath, config })
    modelPathsRef.current.add(modelPath)
  }, [postMessage])

  /**
   * Run single prediction
   */
  const predict = useCallback(async (
    inputs: number[][],
    modelType: 'simrating' | 'prediction' | 'classification'
  ): Promise<MLPredictionResult> => {
    const payload: MLInferencePayload = { inputs, modelType }
    const result = await postMessage<MLInferencePayload, MLPredictionResult>('predict', payload)
    
    // Update stats
    setStats(prev => prev ? {
      ...prev,
      totalPredictions: prev.totalPredictions + 1
    } : null)
    
    return result
  }, [postMessage])

  /**
   * Run batch prediction
   */
  const predictBatch = useCallback(async (
    batch: MLBatchPayload['batch'],
    modelType: 'simrating' | 'prediction' | 'classification'
  ): Promise<MLPredictionResult[]> => {
    const payload: MLBatchPayload = { batch, modelType }
    const results = await postMessage<MLBatchPayload, MLPredictionResult[]>('predictBatch', payload)
    
    // Update stats
    setStats(prev => prev ? {
      ...prev,
      totalPredictions: prev.totalPredictions + batch.length
    } : null)
    
    return results
  }, [postMessage])

  /**
   * Warm up a model with dummy data
   */
  const warmModel = useCallback(async (
    modelType: string,
    inputShape: number[]
  ): Promise<void> => {
    await postMessage('warm', { modelType, inputShape })
    
    setStats(prev => prev ? {
      ...prev,
      warmModels: [...prev.warmModels, modelType]
    } : null)
  }, [postMessage])

  /**
   * Get worker statistics
   */
  const getStats = useCallback(async (): Promise<{
    backend: string
    totalPredictions: number
    averageInferenceTime: number
    warmModels: string[]
    cachedModels: string[]
  }> => {
    const result = await postMessage<unknown, {
      backend: string
      totalPredictions: number
      averageInferenceTime: number
      warmModels: string[]
      cachedModels: string[]
    }>('stats', {})
    
    setStats({
      totalPredictions: result.totalPredictions,
      averageInferenceTime: result.averageInferenceTime,
      warmModels: result.warmModels
    })
    
    return result
  }, [postMessage])

  /**
   * Dispose all models and cleanup
   */
  const dispose = useCallback(async (): Promise<void> => {
    await postMessage('dispose', {})
    modelPathsRef.current.clear()
    setBackend(null)
    setStats(null)
  }, [postMessage])

  return {
    isReady,
    isLoading: isBusy,
    isPredicting: isBusy,
    backend,
    stats,
    initialize,
    loadModel,
    predict,
    predictBatch,
    warmModel,
    getStats,
    dispose,
    terminate
  }
}
