/**
 * useMLInference - TensorFlow.js Dynamic Import Hook
 * Loads TF.js on-demand with IndexedDB caching
 * Supports both main-thread and worker-based inference
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { MLWorkerCommand, MLWorkerResponse } from '../workers/ml.worker'

export interface UseMLInferenceReturn {
  isModelLoading: boolean
  isModelReady: boolean
  loadModel: (url: string) => Promise<void>
  predict: (input: number[]) => Promise<number[]>
  error: Error | null
  progress: number
  useWorker: boolean
}

export interface UseMLInferenceOptions {
  useWorker?: boolean
}

// TF.js types (loaded dynamically)
type TFModule = typeof import('@tensorflow/tfjs')

export function useMLInference(options: UseMLInferenceOptions = {}): UseMLInferenceReturn {
  const { useWorker: useWorkerOption = true } = options
  
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [useWorker, setUseWorker] = useState(useWorkerOption)

  // Main-thread refs
  const tfRef = useRef<TFModule | null>(null)
  const modelRef = useRef<unknown>(null)
  
  // Worker refs
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<string, { resolve: (value: number[]) => void; reject: (err: Error) => void }>>(new Map())
  
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      
      // Cleanup worker
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'DISPOSE' } as MLWorkerCommand)
        workerRef.current.terminate()
        workerRef.current = null
      }
      
      // Cleanup main-thread model
      if (modelRef.current && tfRef.current) {
        try {
          (modelRef.current as { dispose?: () => void }).dispose?.()
        } catch {}
      }
    }
  }, [])

  /**
   * Initialize ML Worker
   */
  const initWorker = useCallback((): Worker | null => {
    if (workerRef.current) {
      return workerRef.current
    }

    try {
      const worker = new Worker(new URL('../workers/ml.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.onmessage = (event: MessageEvent<MLWorkerResponse>) => {
        const response = event.data

        switch (response.type) {
          case 'MODEL_LOADED':
            if (isMountedRef.current) {
              setIsModelLoading(false)
              setIsModelReady(true)
              setProgress(100)
            }
            break

          case 'MODEL_LOAD_ERROR':
            if (isMountedRef.current) {
              setError(new Error(response.error))
              setIsModelLoading(false)
            }
            break

          case 'PREDICTION_RESULT':
            {
              const pending = pendingRef.current.get(response.requestId)
              if (pending) {
                pending.resolve(response.result)
                pendingRef.current.delete(response.requestId)
              }
            }
            break

          case 'PREDICTION_ERROR':
            {
              const pending = pendingRef.current.get(response.requestId)
              if (pending) {
                pending.reject(new Error(response.error))
                pendingRef.current.delete(response.requestId)
              }
            }
            break
        }
      }

      worker.onerror = (err) => {
        console.error('[ML] Worker error:', err)
        if (isMountedRef.current) {
          setError(new Error('Worker failed'))
          setUseWorker(false) // Fallback to main thread
        }
      }

      workerRef.current = worker
      return worker
    } catch (err) {
      console.warn('[ML] Worker init failed, falling back to main thread:', err)
      setUseWorker(false)
      return null
    }
  }, [])

  /**
   * Dynamically load TensorFlow.js (main thread fallback)
   */
  const loadTensorFlow = useCallback(async (): Promise<TFModule> => {
    if (tfRef.current) {
      return tfRef.current
    }

    try {
      const tf = await import('@tensorflow/tfjs')
      tf.setBackend('webgl')
      
      if (isMountedRef.current) {
        tfRef.current = tf
      }
      
      return tf
    } catch (err) {
      throw new Error(`Failed to load TensorFlow.js: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  /**
   * Load model from URL with caching
   */
  const loadModel = useCallback(async (url: string): Promise<void> => {
    if (isModelLoading || isModelReady) {
      return
    }

    setIsModelLoading(true)
    setError(null)
    setProgress(0)

    try {
      if (useWorker) {
        // Worker-based loading
        const worker = initWorker()
        if (worker) {
          const modelName = url.split('/').pop()?.replace('.json', '') || 'model'
          
          // Simulate progress for worker loading
          const progressInterval = setInterval(() => {
            if (isMountedRef.current && progress < 90) {
              setProgress(p => Math.min(p + 10, 90))
            }
          }, 200)

          worker.postMessage({
            type: 'LOAD_MODEL',
            url,
            modelName
          } as MLWorkerCommand)

          // Progress will be updated on MODEL_LOADED
          setTimeout(() => clearInterval(progressInterval), 5000)
          return
        }
      }

      // Main-thread loading (fallback)
      const tf = await loadTensorFlow()
      
      if (!isMountedRef.current) return
      setProgress(30)

      const modelName = url.split('/').pop()?.replace('.json', '') || 'model'
      let model: unknown

      try {
        model = await tf.loadLayersModel(`indexeddb://${modelName}`)
        console.log('[ML] Model loaded from IndexedDB cache')
      } catch {
        model = await tf.loadLayersModel(url, {
          onProgress: (fraction: number) => {
            if (isMountedRef.current) {
              setProgress(30 + Math.floor(fraction * 60))
            }
          }
        })
        
        try {
          await (model as { save: (path: string) => Promise<void> }).save(`indexeddb://${modelName}`)
          console.log('[ML] Model cached to IndexedDB')
        } catch (cacheErr) {
          console.warn('[ML] Failed to cache model:', cacheErr)
        }
      }

      if (!isMountedRef.current) return

      modelRef.current = model
      setProgress(100)
      setIsModelReady(true)
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Model loading failed')
        setError(error)
        console.error('[ML] Load failed:', error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsModelLoading(false)
      }
    }
  }, [isModelLoading, isModelReady, useWorker, initWorker, loadTensorFlow, progress])

  /**
   * Run prediction on input data
   */
  const predict = useCallback(async (input: number[]): Promise<number[]> => {
    if (!isModelReady) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    // Worker-based prediction
    if (useWorker && workerRef.current) {
      return new Promise((resolve, reject) => {
        const requestId = `pred-${Date.now()}-${Math.random()}`
        pendingRef.current.set(requestId, { resolve, reject })

        workerRef.current!.postMessage({
          type: 'PREDICT',
          input,
          requestId
        } as MLWorkerCommand)

        // Timeout
        setTimeout(() => {
          if (pendingRef.current.has(requestId)) {
            pendingRef.current.delete(requestId)
            reject(new Error('Prediction timeout'))
          }
        }, 5000)
      })
    }

    // Main-thread prediction (fallback)
    if (!tfRef.current || !modelRef.current) {
      throw new Error('Model not available')
    }

    try {
      const tf = tfRef.current
      const model = modelRef.current as { predict: (input: unknown) => unknown }

      const inputTensor = tf.tensor2d([input])
      const outputTensor = model.predict(inputTensor) as { dataSync: () => Float32Array }
      const output = Array.from(outputTensor.dataSync())

      inputTensor.dispose()
      
      return output
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Prediction failed')
      console.error('[ML] Prediction failed:', error)
      throw error
    }
  }, [isModelReady, useWorker])

  return {
    isModelLoading,
    isModelReady,
    loadModel,
    predict,
    error,
    progress,
    useWorker
  }
}

export default useMLInference
