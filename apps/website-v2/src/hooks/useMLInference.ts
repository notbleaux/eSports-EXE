/**
 * useMLInference - Enhanced TensorFlow.js Hook with Lazy Loading
 * Loads TF.js on-demand with IndexedDB caching and ML Worker offloading
 * 
 * [Ver005.000] - Integrated with Feature Store
 * 
 * Features:
 * - Preprocess inputs using feature definitions
 * - Validate feature values
 * - Log feature usage
 * - Feature Store integration
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { 
  MLWorkerCommand, 
  MLWorkerResponse, 
  MLPredictionProgress,
  MLBatchResult 
} from '../types/worker'
import type { ModelInfo, WarmUpOptions } from '../types/ml'
import { 
  MAX_RETRIES, 
  RETRY_BASE_DELAY_MS,
  PREDICTION_TIMEOUT_MS,
  MAX_INPUT_SIZE,
  MIN_INPUT_VALUE,
  MAX_INPUT_VALUE
} from '../constants/ml'
import { mlLogger } from '../utils/logger'
import { api } from '../api/client'
import { 
  loadTensorFlow, 
  loadModel, 
  unloadModel as unloadFromCache,
  isTensorFlowLoaded,
  isModelCached,
  type MLLoadProgress,
  type TFModule
} from '../lib/ml-loader'
import { isMLFeatureEnabled } from '../lib/ml-feature-flags'
import type { MLModelType, FeatureDefinition } from '../lib/ml-features'
import { getFeatureDefinition, validateFeatureValue, getFeatureNames } from '../lib/ml-features'

export interface UseMLInferenceReturn {
  isModelLoading: boolean
  isModelReady: boolean
  isWarmedUp: boolean
  isPredicting: boolean
  loadModel: (url: string, quantization?: 8 | 16 | 32) => Promise<void>
  predict: (input: number[]) => Promise<number[]>
  predictBatch: (inputs: number[][]) => Promise<MLBatchResult>
  warmUp: (options?: WarmUpOptions) => Promise<void>
  getModelInfo: () => ModelInfo | null
  error: Error | null
  progress: number
  predictionProgress: MLPredictionProgress | null
  useWorker: boolean
  /** Current queue depth from worker */
  queueDepth: number
  /** Maximum queue size */
  maxQueueSize: number
  /** Worker status */
  workerStatus: 'idle' | 'loading' | 'predicting' | 'error'
  /** Last inference latency in ms */
  lastLatency: number
  /** Enable/disable worker usage */
  setUseWorker: (useWorker: boolean) => void
  /** Retry loading after error */
  retry: () => void
  /** Terminate worker and cleanup */
  dispose: () => void
  /** Unload model to free memory */
  unloadModel: () => void
  
  // Feature Store Integration
  /** Preprocess features using feature store definitions */
  preprocessFeatures: (input: number[]) => number[]
  /** Validate feature values against definitions */
  validateFeatures: (input: number[]) => { valid: boolean; errors: string[] }
  /** Get feature names for current model type */
  featureNames: string[]
  /** Expected input size based on feature definitions */
  expectedInputSize: number
  /** Associated model type */
  modelType: MLModelType | null
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  halfOpenMaxCalls: number
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  successCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

export interface UseMLInferenceOptions {
  useWorker?: boolean
  maxRetries?: number
  timeout?: number
  circuitBreaker?: CircuitBreakerConfig
  onProgress?: (progress: MLPredictionProgress) => void
  onWorkerError?: (error: Error) => void
  /** Auto-unload model after inactivity (ms) */
  autoUnloadTimeout?: number
  
  // Feature Store Integration
  /** Associated model type for feature validation */
  modelType?: MLModelType
  /** Enable feature preprocessing */
  enableFeaturePreprocessing?: boolean
  /** Enable feature validation */
  enableFeatureValidation?: boolean
  /** Log feature usage analytics */
  logFeatureUsage?: boolean
}

export class MLValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLValidationError'
  }
}

export class MLTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MLTimeoutError'
  }
}

export class MLCircuitBreakerError extends Error {
  constructor(message: string = 'Circuit breaker is OPEN') {
    super(message)
    this.name = 'MLCircuitBreakerError'
  }
}

export class MLFeatureDisabledError extends Error {
  constructor(message: string = 'ML feature is disabled') {
    super(message)
    this.name = 'MLFeatureDisabledError'
  }
}

// Default circuit breaker config
const DEFAULT_CB_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000,
  halfOpenMaxCalls: 3
}

const DEFAULT_AUTO_UNLOAD = 5 * 60 * 1000 // 5 minutes

/**
 * Create circuit breaker for ML inference
 */
function createCircuitBreaker(config: CircuitBreakerConfig) {
  const state: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0
  }

  function canAttempt(): boolean {
    const now = Date.now()
    
    switch (state.state) {
      case 'CLOSED':
        return true
        
      case 'OPEN':
        if (now >= state.nextAttemptTime) {
          state.state = 'HALF_OPEN'
          state.successCount = 0
          mlLogger.debug('[ML Circuit] Transitioning to HALF_OPEN')
          return true
        }
        return false
        
      case 'HALF_OPEN':
        return state.successCount < config.halfOpenMaxCalls
    }
  }

  function recordSuccess(): void {
    switch (state.state) {
      case 'HALF_OPEN':
        state.successCount++
        if (state.successCount >= config.halfOpenMaxCalls) {
          state.state = 'CLOSED'
          state.failureCount = 0
          state.successCount = 0
          mlLogger.debug('[ML Circuit] Transitioning to CLOSED')
        }
        break
        
      case 'CLOSED':
        state.failureCount = 0
        break
    }
  }

  function recordFailure(): void {
    const now = Date.now()
    state.failureCount++
    state.lastFailureTime = now
    
    switch (state.state) {
      case 'CLOSED':
        if (state.failureCount >= config.failureThreshold) {
          state.state = 'OPEN'
          state.nextAttemptTime = now + config.resetTimeout
          mlLogger.warn(`[ML Circuit] Transitioning to OPEN (failures: ${state.failureCount})`)
        }
        break
        
      case 'HALF_OPEN':
        state.state = 'OPEN'
        state.nextAttemptTime = now + config.resetTimeout
        mlLogger.warn('[ML Circuit] HALF_OPEN failure, transitioning to OPEN')
        break
    }
  }

  function getState(): CircuitBreakerState {
    return { ...state }
  }

  return { canAttempt, recordSuccess, recordFailure, getState }
}

/**
 * Validate input array for prediction
 */
function validateInput(input: number[]): void {
  if (!Array.isArray(input)) {
    throw new MLValidationError('Input must be an array')
  }
  
  if (input.length === 0) {
    throw new MLValidationError('Input array cannot be empty')
  }
  
  if (input.length > MAX_INPUT_SIZE) {
    throw new MLValidationError(`Input array too large (max ${MAX_INPUT_SIZE})`)
  }
  
  for (let i = 0; i < input.length; i++) {
    if (typeof input[i] !== 'number' || isNaN(input[i])) {
      throw new MLValidationError(`Invalid value at index ${i}: ${input[i]}`)
    }
    
    if (input[i] < MIN_INPUT_VALUE || input[i] > MAX_INPUT_VALUE) {
      throw new MLValidationError(`Value out of range at index ${i}: ${input[i]}`)
    }
  }
}

/**
 * Validate model URL using centralized API client
 */
async function validateModelUrl(
  url: string,
  maxRetries: number = 3,
  timeout: number = 10000
): Promise<void> {
  await api.get<void>(url, { 
    retry: maxRetries > 0,
    timeout,
    skipAuth: true 
  })
}

export function useMLInference(options: UseMLInferenceOptions = {}): UseMLInferenceReturn {
  const { 
    useWorker: useWorkerOption = true, 
    maxRetries = MAX_RETRIES, 
    timeout = PREDICTION_TIMEOUT_MS,
    circuitBreaker: cbConfig = DEFAULT_CB_CONFIG,
    onProgress,
    onWorkerError,
    autoUnloadTimeout = DEFAULT_AUTO_UNLOAD,
    modelType: modelTypeOption,
    enableFeaturePreprocessing = true,
    enableFeatureValidation = true,
    logFeatureUsage = false
  } = options
  
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [isWarmedUp, setIsWarmedUp] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [predictionProgress, setPredictionProgress] = useState<MLPredictionProgress | null>(null)
  const [useWorker, setUseWorkerState] = useState(useWorkerOption)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [queueDepth, setQueueDepth] = useState(0)
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'loading' | 'predicting' | 'error'>('idle')
  const [lastLatency, setLastLatency] = useState(0)

  // Main-thread refs
  const tfRef = useRef<TFModule | null>(null)
  const modelRef = useRef<import('@tensorflow/tfjs').LayersModel | null>(null)
  const modelUrlRef = useRef<string>('')
  const isCleaningUpRef = useRef(false)
  const loadAbortRef = useRef<AbortController | null>(null)
  const autoUnloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Worker refs
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<string, { 
    resolve: (value: unknown) => void
    reject: (err: Error) => void
    startTime: number
  }>>(new Map())
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  
  // Circuit breaker
  const circuitBreakerRef = useRef(createCircuitBreaker(cbConfig))
  
  const isMountedRef = useRef(true)

  // Lazy import analytics
  const getAnalytics = async () => {
    const { mlAnalytics } = await import('../dev/ml-analytics')
    return mlAnalytics
  }

  /**
   * Reset auto-unload timer
   */
  const resetAutoUnloadTimer = useCallback(() => {
    if (autoUnloadTimerRef.current) {
      clearTimeout(autoUnloadTimerRef.current)
    }
    
    if (autoUnloadTimeout > 0) {
      autoUnloadTimerRef.current = setTimeout(() => {
        if (!isPredicting && isMountedRef.current) {
          mlLogger.debug('[ML Inference] Auto-unloading model due to inactivity')
          unloadModel()
        }
      }, autoUnloadTimeout)
    }
  }, [autoUnloadTimeout, isPredicting])

  /**
   * Initialize ML Worker with enhanced error handling
   */
  const initWorker = useCallback((): Worker | null => {
    if (workerRef.current) {
      return workerRef.current
    }

    // Check if web worker feature is enabled
    if (!isMLFeatureEnabled('webWorkerInference')) {
      mlLogger.debug('[ML] Web worker inference disabled')
      return null
    }

    try {
      setWorkerStatus('loading')
      
      const worker = new Worker(new URL('../workers/ml.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.onmessage = (event: MessageEvent<MLWorkerResponse>) => {
        const response = event.data

        switch (response.type) {
          case 'INIT_COMPLETE':
            if (isMountedRef.current && !isCleaningUpRef.current) {
              setWorkerStatus('idle')
              mlLogger.debug('[ML] Worker initialized with backend:', response.backend)
            }
            break

          case 'MODEL_LOADED':
            if (isMountedRef.current && !isCleaningUpRef.current) {
              const url = modelUrlRef.current
              const modelName = url.split('/').pop()?.replace('.json', '') || 'model'
              const info: ModelInfo = {
                name: modelName,
                url,
                lastLoaded: new Date(),
                quantization: url.includes('int8') ? 'int8' : url.includes('int16') ? 'int16' : 'fp32',
                backend: response.backend
              }
              setModelInfo(info)
              setIsModelLoading(false)
              setIsModelReady(true)
              setProgress(100)
              setWorkerStatus('idle')
              resetAutoUnloadTimer()
            }
            break

          case 'MODEL_LOAD_ERROR':
            if (isMountedRef.current && !isCleaningUpRef.current) {
              const error = new Error(response.error)
              setError(error)
              setIsModelLoading(false)
              setWorkerStatus('error')
              onWorkerError?.(error)
            }
            break

          case 'PREDICTION_RESULT':
          case 'BATCH_PREDICTION_RESULT':
            {
              abortControllersRef.current.delete(response.requestId)
              
              const pending = pendingRef.current.get(response.requestId)
              if (pending) {
                const latency = performance.now() - pending.startTime
                setLastLatency(latency)
                
                if (response.type === 'PREDICTION_RESULT') {
                  pending.resolve(response.result)
                } else {
                  pending.resolve({
                    results: response.results,
                    totalTime: response.totalTime,
                    throughput: response.results.length / (response.totalTime / 1000)
                  })
                }
                
                pendingRef.current.delete(response.requestId)
                setIsPredicting(false)
                setWorkerStatus('idle')
                setPredictionProgress(null)
                resetAutoUnloadTimer()
              }
            }
            break

          case 'PREDICTION_ERROR':
            {
              abortControllersRef.current.delete(response.requestId)
              
              const pending = pendingRef.current.get(response.requestId)
              if (pending) {
                pending.reject(new Error(response.error))
                pendingRef.current.delete(response.requestId)
                setIsPredicting(false)
                setWorkerStatus('idle')
              }
            }
            break

          case 'PROGRESS':
            if (isMountedRef.current) {
              const progressData: MLPredictionProgress = {
                requestId: response.requestId,
                current: response.current,
                total: response.total,
                stage: response.stage,
                percentComplete: Math.round((response.current / response.total) * 100)
              }
              setPredictionProgress(progressData)
              onProgress?.(progressData)
            }
            break
            
          case 'BACKPRESSURE':
            if (isMountedRef.current) {
              mlLogger.warn(`[ML Inference] Worker backpressure: ${response.queueDepth}/${response.maxQueueSize}`)
            }
            break
            
          case 'QUEUE_METRICS':
            if (isMountedRef.current) {
              setQueueDepth(response.depth)
            }
            break
            
          case 'QUEUE_OVERFLOW':
            mlLogger.warn(`[ML Inference] Queue overflow: ${response.dropped} predictions dropped`)
            break
            
          case 'DISPOSED':
            mlLogger.debug('[ML Inference] Worker disposed')
            break

          case 'ERROR':
            mlLogger.error('[ML] Worker error:', response.error)
            if (isMountedRef.current) {
              const error = new Error(response.error)
              setError(error)
              setWorkerStatus('error')
              onWorkerError?.(error)
              // Fallback to main thread
              setUseWorkerState(false)
            }
            break
        }
      }

      worker.onerror = (err) => {
        mlLogger.error('[ML] Worker error:', err)
        if (isMountedRef.current) {
          const error = new Error('Worker failed')
          setError(error)
          setWorkerStatus('error')
          setUseWorkerState(false) // Fallback to main thread
          onWorkerError?.(error)
        }
      }

      workerRef.current = worker
      return worker
    } catch (err) {
      mlLogger.warn('[ML] Worker init failed, falling back to main thread:', err)
      setUseWorkerState(false)
      setWorkerStatus('error')
      return null
    }
  }, [onProgress, onWorkerError, resetAutoUnloadTimer])

  /**
   * Load model from URL with caching and optional quantization
   */
  const loadModelFn = useCallback(async (url: string, quantization?: 8 | 16 | 32): Promise<void> => {
    // Check if ML predictions feature is enabled
    if (!isMLFeatureEnabled('mlPredictions')) {
      setError(new MLFeatureDisabledError('ML predictions feature is disabled. Enable it in settings.'))
      return
    }

    if (isModelLoading || isModelReady) {
      return
    }

    setIsModelLoading(true)
    setError(null)
    setProgress(0)
    loadAbortRef.current = new AbortController()

    try {
      // Validate URL first
      await validateModelUrl(url, maxRetries, timeout)
      
      modelUrlRef.current = url
      
      // Try worker-based loading first if enabled
      if (useWorker) {
        const worker = initWorker()
        if (worker) {
          const modelName = url.split('/').pop()?.replace('.json', '') || 'model'
          
          // Simulate progress for worker loading
          const progressInterval = setInterval(() => {
            if (isMountedRef.current && !loadAbortRef.current?.signal.aborted) {
              setProgress(p => Math.min(p + 10, 90))
            }
          }, 200)

          worker.postMessage({
            type: 'LOAD_MODEL',
            url,
            modelName,
            quantization
          } as MLWorkerCommand)

          setTimeout(() => clearInterval(progressInterval), 5000)
          return
        }
      }

      // Main-thread loading using ml-loader
      const onLoadProgress = (p: MLLoadProgress) => {
        if (isMountedRef.current) {
          setProgress(p.percent)
        }
      }

      const model = await loadModel(url, { 
        name: url.split('/').pop()?.replace('.json', '') || 'model',
        quantization 
      }, onLoadProgress)

      if (!isMountedRef.current || loadAbortRef.current?.signal.aborted) return

      modelRef.current = model
      tfRef.current = await loadTensorFlow() // Ensure TF is loaded
      
      const info: ModelInfo = {
        name: url.split('/').pop()?.replace('.json', '') || 'model',
        url,
        lastLoaded: new Date(),
        quantization: url.includes('int8') ? 'int8' : url.includes('int16') ? 'int16' : 'fp32',
        backend: tfRef.current.getBackend()
      }
      setModelInfo(info)
      
      setProgress(100)
      setIsModelReady(true)
      resetAutoUnloadTimer()
      
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Model loading failed')
        setError(error)
        mlLogger.error('[ML] Load failed:', error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsModelLoading(false)
      }
      loadAbortRef.current = null
    }
  }, [isModelLoading, isModelReady, useWorker, initWorker, maxRetries, timeout, resetAutoUnloadTimer])

  /**
   * Run prediction on input data with worker offloading
   */
  const predict = useCallback(async (input: number[]): Promise<number[]> => {
    if (!isModelReady) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }
    
    if (!circuitBreakerRef.current.canAttempt()) {
      throw new MLCircuitBreakerError()
    }
    
    validateInput(input)
    
    const startTime = performance.now()
    const modelId = modelInfo?.name || 'default'

    try {
      setIsPredicting(true)
      setWorkerStatus('predicting')
      
      let result: number[]

      // Worker-based prediction
      if (useWorker && workerRef.current) {
        result = await new Promise((resolve, reject) => {
          if (isCleaningUpRef.current || !isMountedRef.current) {
            reject(new Error('Component unmounted'))
            return
          }
          
          const requestId = `pred-${Date.now()}-${Math.random()}`
          
          const abortController = new AbortController()
          abortControllersRef.current.set(requestId, abortController)
          
          pendingRef.current.set(requestId, { 
            resolve: resolve as (value: unknown) => void, 
            reject,
            startTime
          })

          workerRef.current!.postMessage({
            type: 'PREDICT',
            input,
            requestId
          } as MLWorkerCommand)

          const timeoutId = setTimeout(() => {
            if (pendingRef.current.has(requestId)) {
              abortControllersRef.current.delete(requestId)
              pendingRef.current.delete(requestId)
              reject(new MLTimeoutError('Prediction timeout'))
            }
          }, timeout)
          
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            pendingRef.current.delete(requestId)
            abortControllersRef.current.delete(requestId)
            reject(new Error('Prediction cancelled'))
          })
        })
      } else {
        // Main-thread prediction (fallback)
        if (!tfRef.current || !modelRef.current) {
          throw new Error('Model not available')
        }

        const tf = tfRef.current
        const model = modelRef.current

        const inputTensor = tf.tensor2d([input])
        const outputTensor = model.predict(inputTensor) as { dataSync: () => Float32Array; dispose: () => void }
        
        result = Array.from(outputTensor.dataSync())
        
        // Cleanup
        inputTensor.dispose()
        outputTensor.dispose()
        
        const latency = performance.now() - startTime
        setLastLatency(latency)
        setIsPredicting(false)
        setWorkerStatus('idle')
        resetAutoUnloadTimer()
      }

      circuitBreakerRef.current.recordSuccess()
      
      const latency = performance.now() - startTime
      
      const analytics = await getAnalytics()
      analytics.trackPrediction(latency, true, modelId, input.length)
      
      return result
      
    } catch (err) {
      circuitBreakerRef.current.recordFailure()
      
      const analytics = await getAnalytics()
      analytics.trackPredictionError(err as Error, modelId, 'predict')
      
      throw err
    } finally {
      if (!useWorker || !workerRef.current) {
        setIsPredicting(false)
        setWorkerStatus('idle')
      }
    }
  }, [isModelReady, useWorker, modelInfo, timeout, resetAutoUnloadTimer])

  /**
   * Run batch prediction with worker offloading and progress tracking
   */
  const predictBatch = useCallback(async (inputs: number[][]): Promise<MLBatchResult> => {
    // Check if batch inference feature is enabled
    if (!isMLFeatureEnabled('mlBatchInference')) {
      throw new MLFeatureDisabledError('Batch inference feature is disabled')
    }

    if (!isModelReady) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }
    
    if (!circuitBreakerRef.current.canAttempt()) {
      throw new MLCircuitBreakerError()
    }
    
    const startTime = performance.now()

    try {
      setIsPredicting(true)
      setWorkerStatus('predicting')

      // Worker-based batch prediction
      if (useWorker && workerRef.current) {
        return await new Promise((resolve, reject) => {
          const requestId = `batch-${Date.now()}`
          
          pendingRef.current.set(requestId, { 
            resolve: (result: unknown) => {
              const latency = performance.now() - startTime
              setLastLatency(latency)
              resolve(result as MLBatchResult)
            },
            reject,
            startTime
          })

          workerRef.current!.postMessage({
            type: 'PREDICT_BATCH',
            inputs,
            requestId
          } as MLWorkerCommand)

          setTimeout(() => {
            if (pendingRef.current.has(requestId)) {
              pendingRef.current.delete(requestId)
              reject(new MLTimeoutError('Batch prediction timeout'))
            }
          }, timeout * 2) // Longer timeout for batches
        })
      }

      // Main-thread batch prediction (fallback)
      if (!tfRef.current || !modelRef.current) {
        throw new Error('Model not available')
      }

      const tf = tfRef.current
      const model = modelRef.current

      const inputTensor = tf.tensor2d(inputs)
      const outputTensor = model.predict(inputTensor) as { dataSync: () => Float32Array; dispose: () => void }
      
      const flatResults = Array.from(outputTensor.dataSync())
      
      // Reshape results
      const outputSize = flatResults.length / inputs.length
      const results: number[][] = []
      for (let i = 0; i < inputs.length; i++) {
        results.push(flatResults.slice(i * outputSize, (i + 1) * outputSize))
      }
      
      // Cleanup
      inputTensor.dispose()
      outputTensor.dispose()
      
      const totalTime = performance.now() - startTime
      setLastLatency(totalTime)
      
      circuitBreakerRef.current.recordSuccess()
      
      return {
        results,
        totalTime,
        throughput: inputs.length / (totalTime / 1000)
      }
      
    } catch (err) {
      circuitBreakerRef.current.recordFailure()
      throw err
    } finally {
      setIsPredicting(false)
      setWorkerStatus('idle')
      resetAutoUnloadTimer()
    }
  }, [isModelReady, useWorker, timeout, resetAutoUnloadTimer])

  /**
   * Warm up model with progressive tensor sizes
   */
  const warmUp = useCallback(async (options: WarmUpOptions = {}): Promise<void> => {
    const { iterations = 3, verbose = false, progressive = true } = options
    
    if (!isModelReady || isWarmedUp) return
    
    const startTime = performance.now()
    
    try {
      if (verbose) mlLogger.debug('[ML] Starting warm-up...')
      
      for (let i = 0; i < iterations; i++) {
        const size = progressive ? Math.pow(2, i + 4) : 16
        const dummyInput = new Array(size).fill(0.5)
        
        if (verbose) mlLogger.debug(`[ML] Warm-up iteration ${i + 1}/${iterations} (size: ${size})`)
        
        await predict(dummyInput.slice(0, 3))
      }
      
      const duration = performance.now() - startTime
      setIsWarmedUp(true)
      
      if (verbose) {
        mlLogger.debug(`[ML] Model warmed up in ${duration.toFixed(1)}ms`)
      }
    } catch (err) {
      mlLogger.warn('[ML] Warm-up failed:', err)
    }
  }, [isModelReady, isWarmedUp, predict])

  /**
   * Get model information
   */
  const getModelInfo = useCallback((): ModelInfo | null => {
    return modelInfo
  }, [modelInfo])

  /**
   * Retry loading after error
   */
  const retry = useCallback(() => {
    setError(null)
    if (modelUrlRef.current) {
      loadModelFn(modelUrlRef.current)
    }
  }, [loadModelFn])

  /**
   * Set worker usage
   */
  const setUseWorker = useCallback((value: boolean) => {
    setUseWorkerState(value)
    if (!value && workerRef.current) {
      // Terminate worker when switching to main thread
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  /**
   * Unload model to free memory
   */
  const unloadModel = useCallback(() => {
    if (autoUnloadTimerRef.current) {
      clearTimeout(autoUnloadTimerRef.current)
      autoUnloadTimerRef.current = null
    }

    // Dispose main thread model
    if (modelRef.current) {
      try {
        modelRef.current.dispose()
      } catch {
        // Ignore
      }
      modelRef.current = null
    }

    // Unload from cache
    if (modelUrlRef.current) {
      const modelName = modelUrlRef.current.split('/').pop()?.replace('.json', '') || ''
      if (modelName) {
        unloadFromCache(`${modelName}:fp32`)
      }
    }

    setIsModelReady(false)
    setIsWarmedUp(false)
    setModelInfo(null)
    setProgress(0)

    mlLogger.debug('[ML Inference] Model unloaded')
  }, [])

  /**
   * Dispose and cleanup
   */
  const dispose = useCallback(() => {
    isCleaningUpRef.current = true
    
    if (loadAbortRef.current) {
      loadAbortRef.current.abort()
    }
    
    if (autoUnloadTimerRef.current) {
      clearTimeout(autoUnloadTimerRef.current)
    }
    
    abortControllersRef.current.forEach((controller, requestId) => {
      controller.abort()
      const pending = pendingRef.current.get(requestId)
      if (pending) {
        pending.reject(new Error('Disposed'))
      }
    })
    abortControllersRef.current.clear()
    pendingRef.current.clear()
    
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'DISPOSE' } as MLWorkerCommand)
      setTimeout(() => {
        workerRef.current?.terminate()
        workerRef.current = null
      }, 100)
    }
    
    unloadModel()
    
    tfRef.current = null
  }, [unloadModel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      dispose()
    }
  }, [dispose])

  // ============================================================================
  // Feature Store Integration
  // ============================================================================

  /**
   * Get feature names for current model type
   */
  const featureNames = useMemo(() => {
    if (!modelTypeOption) return []
    return getFeatureNames(modelTypeOption)
  }, [modelTypeOption])

  /**
   * Expected input size based on feature definitions
   */
  const expectedInputSize = useMemo(() => {
    return featureNames.length
  }, [featureNames])

  /**
   * Preprocess features using feature store definitions
   * Applies normalization and handles missing values
   */
  const preprocessFeatures = useCallback((input: number[]): number[] => {
    if (!enableFeaturePreprocessing || !modelTypeOption) {
      return input
    }

    const processed: number[] = []
    const names = getFeatureNames(modelTypeOption)

    names.forEach((name, index) => {
      const definition = getFeatureDefinition(modelTypeOption!, name)
      let value = input[index]

      if (value === undefined || isNaN(value)) {
        // Use default for missing values
        value = definition?.defaultValue ?? 0
      }

      // Clamp to valid range
      if (definition?.min !== undefined && value < definition.min) {
        value = definition.min
      }
      if (definition?.max !== undefined && value > definition.max) {
        value = definition.max
      }

      processed.push(value)
    })

    // Log feature usage if enabled
    if (logFeatureUsage) {
      mlLogger.debug('[ML Inference] Preprocessed features:', {
        modelType: modelTypeOption,
        featureCount: processed.length
      })
    }

    return processed
  }, [modelTypeOption, enableFeaturePreprocessing, logFeatureUsage])

  /**
   * Validate feature values against definitions
   */
  const validateFeatures = useCallback((input: number[]): { valid: boolean; errors: string[] } => {
    if (!enableFeatureValidation || !modelTypeOption) {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []
    const names = getFeatureNames(modelTypeOption)

    names.forEach((name, index) => {
      const definition = getFeatureDefinition(modelTypeOption!, name)
      const value = input[index]

      const validation = validateFeatureValue(definition!, value)
      if (!validation.valid) {
        errors.push(`${name}: ${validation.error}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }, [modelTypeOption, enableFeatureValidation])

  // Wrap predict to include feature preprocessing
  const predictWithFeatures = useCallback(async (input: number[]): Promise<number[]> => {
    // Preprocess if enabled
    const processedInput = preprocessFeatures(input)

    // Validate if enabled
    if (enableFeatureValidation) {
      const validation = validateFeatures(processedInput)
      if (!validation.valid) {
        mlLogger.warn('[ML Inference] Feature validation failed:', validation.errors)
        // Continue anyway - preprocessing has applied defaults
      }
    }

    return predict(processedInput)
  }, [predict, preprocessFeatures, validateFeatures, enableFeatureValidation])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    isModelLoading,
    isModelReady,
    isWarmedUp,
    isPredicting,
    loadModel: loadModelFn,
    predict: predictWithFeatures,
    predictBatch,
    warmUp,
    getModelInfo,
    error,
    progress,
    predictionProgress,
    useWorker,
    queueDepth,
    maxQueueSize: 100,
    workerStatus,
    lastLatency,
    setUseWorker,
    retry,
    dispose,
    unloadModel,
    
    // Feature Store Integration
    preprocessFeatures,
    validateFeatures,
    featureNames,
    expectedInputSize,
    modelType: modelTypeOption ?? null
  }
}

export default useMLInference
