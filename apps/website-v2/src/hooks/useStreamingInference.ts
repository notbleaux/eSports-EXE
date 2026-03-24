/**
 * useStreamingInference - Real-time Streaming ML Inference Hook
 * Connects to data-stream.worker for real-time predictions with debouncing
 * 
 * [Ver002.000] - Fixed worker cleanup race conditions
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useMLInference } from './useMLInference'
import type { DataStreamCommand, DataStreamResponse, StreamData } from '../workers/data-stream.worker'
// Types defined locally to avoid conflicts
// Constants available in '../constants/ml' if needed for future enhancements:
// BUFFER_SIZE, MAX_STREAMING_PREDICTIONS, DEBOUNCE_MS, LAG_GREEN/RED_THRESHOLD_MS
// import { analyticsSync } from '../services/analyticsSync'
import { streamingLogger } from '../utils/logger'

/**
 * Debounce hook for stable debounced callbacks
 */
function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCallTimeRef = useRef(0)
  const fnRef = useRef(fn)

  // Keep fn ref up to date
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current

    const execute = () => {
      lastCallTimeRef.current = Date.now()
      fnRef.current(...args)
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (timeSinceLastCall >= delay) {
      execute()
    } else {
      timeoutRef.current = setTimeout(execute, delay - timeSinceLastCall)
    }
  }, [delay])
}

export interface PredictionResult {
  id: string
  input: number[]
  output: number[]
  confidence: number
  modelId: string
  timestamp: Date
  latencyMs: number
}

export interface StreamingMetrics {
  lag: number // ms between data timestamp and prediction time
  throughput: number // predictions per second
  bufferSize: number // current buffer size
}

export interface UseStreamingInferenceOptions {
  wsUrl?: string
  maxPredictionsPerSecond?: number
  modelUrl?: string
}

export interface UseStreamingInferenceReturn {
  predictions: PredictionResult[]
  isStreaming: boolean
  isPaused: boolean
  lag: number
  throughput: number
  bufferSize: number
  error: Error | null
  pause: () => void
  resume: () => void
  start: () => void
  stop: () => void
}



/**
 * Calculate confidence from prediction output using softmax
 */
function calculateConfidence(output: number[]): number {
  if (output.length === 0) return 0
  const maxVal = Math.max(...output)
  const sum = output.reduce((a, b) => a + b, 0)
  return sum > 0 ? maxVal / sum : 0
}

/**
 * Hook for real-time streaming ML inference
 */
export function useStreamingInference(
  options: UseStreamingInferenceOptions = {}
): UseStreamingInferenceReturn {
  const {
    wsUrl = 'ws://localhost:8080/stream',
    maxPredictionsPerSecond = 10,
    modelUrl = '/models/default-model.json'
  } = options

  // State
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lag, setLag] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [bufferSize, setBufferSize] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // Refs
  const workerRef = useRef<Worker | null>(null)
  const isMountedRef = useRef(true)
  const isCleaningUpRef = useRef(false)
  const predictionCountRef = useRef(0)
  const lastThroughputCalcRef = useRef(Date.now())
  const pendingDataRef = useRef<StreamData | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activePredictionRef = useRef<boolean>(false)

  // ML Inference hook
  const { predict, isModelReady, loadModel } = useMLInference({ useWorker: true })

  // Load model on mount
  useEffect(() => {
    if (!isModelReady && !isCleaningUpRef.current) {
      loadModel(modelUrl).catch((err) => {
        // Ignore errors if cleaning up
        if (isCleaningUpRef.current || !isMountedRef.current) return
        
        streamingLogger.error('[Streaming Inference] Failed to load model:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Model load failed'))
        }
      })
    }
    
    return () => {
      // Cancel any in-progress model load
      if (!isModelReady && isCleaningUpRef.current) {
        // loadModel will be aborted via parent cleanup
      }
    }
  }, [isModelReady, loadModel, modelUrl])

  // Calculate debounce delay based on max predictions per second
  const debounceDelay = useMemo(() => {
    return Math.max(16, 1000 / maxPredictionsPerSecond) // Minimum 16ms (60fps)
  }, [maxPredictionsPerSecond])

  /**
   * Process prediction data
   */
  const processPredictionData = useCallback(async (data: StreamData) => {
    if (!isModelReady || !isMountedRef.current) {
      return
    }

    const startTime = performance.now()

    try {
      // Calculate lag (time between data timestamp and processing)
      const currentLag = Date.now() - data.timestamp
      setLag(currentLag)

      // Run prediction
      const result = await predict(data.features)
      const latencyMs = performance.now() - startTime

      // Create prediction result
      const prediction: PredictionResult = {
        id: data.id,
        input: data.features,
        output: result,
        confidence: calculateConfidence(result),
        modelId: 'streaming-model',
        timestamp: new Date(),
        latencyMs
      }

      // Update predictions (keep last 10)
      setPredictions((prev) => [prediction, ...prev].slice(0, 10))

      // Save to history store for analytics
      try {
        const { usePredictionHistoryStore } = await import('../store/predictionHistoryStore')
        usePredictionHistoryStore.getState().addPrediction(prediction)
      } catch {
        // History store not available, continue
      }

      // Update throughput counter
      predictionCountRef.current++
    } catch (err) {
      streamingLogger.error('[Streaming Inference] Prediction failed:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Prediction failed'))
      }
    }
  }, [isModelReady, predict])

  /**
   * Debounced wrapper for prediction processing
   */
  const processPrediction = useDebounce(processPredictionData, debounceDelay)

  /**
   * Calculate throughput every second
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastThroughputCalcRef.current) / 1000
      const count = predictionCountRef.current

      if (elapsed >= 1) {
        setThroughput(count / elapsed)
        predictionCountRef.current = 0
        lastThroughputCalcRef.current = now
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  /**
   * Initialize data stream worker
   * WORKER DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
   */
  const initWorker = useCallback((): Worker | null => {
    // Worker disabled - returning null to use fallback mode
    return null;
    
    /* Original worker code disabled - pattern broken to prevent Vite detection:
    if (workerRef.current) {
      return workerRef.current
    }

    try {
      // WORKER DISABLED - new Worker(new URL('../workers/data-stream.worker.ts', import.meta.url), {

      worker.onmessage = (event: MessageEvent<DataStreamResponse>) => {
        const response = event.data

        // Ignore messages during cleanup
        if (isCleaningUpRef.current) {
          return
        }

        switch (response.type) {
          case 'CONNECTED':
            if (isMountedRef.current) {
              setIsStreaming(true)
              setError(null)
            }
            break

          case 'DISCONNECTED':
            if (isMountedRef.current) {
              setIsStreaming(false)
            }
            break

          case 'DATA':
            if (isMountedRef.current && !isPaused && !isCleaningUpRef.current) {
              pendingDataRef.current = response.data
              processPrediction(response.data)
            }
            break

          case 'BUFFER_STATUS':
            if (isMountedRef.current) {
              setBufferSize(response.size)
            }
            break

          case 'PAUSED':
            if (isMountedRef.current) {
              setIsPaused(true)
            }
            break

          case 'RESUMED':
            if (isMountedRef.current) {
              setIsPaused(false)
            }
            break

          case 'ERROR':
            if (isMountedRef.current) {
              setError(new Error(response.error))
            }
            break

          case 'RECONNECTING':
            if (!isCleaningUpRef.current) {
              streamingLogger.debug(`[Streaming Inference] Reconnecting attempt ${response.attempt} in ${response.delayMs}ms`)
            }
            break
        }
      }

      worker.onerror = (err) => {
        streamingLogger.error('[Streaming Inference] Worker error:', err)
        if (isMountedRef.current) {
          setError(new Error('Data stream worker failed'))
        }
      }

      workerRef.current = worker
      return worker
    } catch (err) {
      streamingLogger.error('[Streaming Inference] Failed to initialize worker:', err)
      if (isMountedRef.current) {
        setError(new Error('Failed to initialize data stream worker'))
      }
      return null
    }
    */
  }, [isPaused, processPrediction])

  /**
   * Start streaming
   */
  const start = useCallback(() => {
    const worker = initWorker()
    if (worker) {
      worker.postMessage({ type: 'CONNECT', url: wsUrl } as DataStreamCommand)
    }
  }, [initWorker, wsUrl])

  /**
   * Stop streaming
   */
  const stop = useCallback(() => {
    // Cancel any active prediction
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Streaming stopped')
      abortControllerRef.current = null
    }
    
    if (workerRef.current) {
      try {
        workerRef.current.postMessage({ type: 'DISCONNECT' } as DataStreamCommand)
      } catch {
        // Worker may already be terminated
      }
    }
    setIsStreaming(false)
    activePredictionRef.current = false
  }, [])

  /**
   * Pause streaming (keep connection, drop data)
   */
  const pause = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'PAUSE' } as DataStreamCommand)
    }
  }, [])

  /**
   * Resume streaming
   */
  const resume = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESUME' } as DataStreamCommand)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      isCleaningUpRef.current = true
      
      // Cancel any active prediction first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted')
        abortControllerRef.current = null
      }
      activePredictionRef.current = false
      
      // Stop streaming and cleanup worker
      if (workerRef.current) {
        try {
          // Send disconnect first
          workerRef.current.postMessage({ type: 'DISCONNECT' } as DataStreamCommand)
          
          // Give worker time to cleanup gracefully, then terminate
          setTimeout(() => {
            if (workerRef.current) {
              try {
                workerRef.current.terminate()
              } catch {
                // Already terminated
              }
              workerRef.current = null
            }
          }, 100)
        } catch {
          // Worker already terminated or errored
          workerRef.current = null
        }
      }
      
      // Clear any pending data
      pendingDataRef.current = null
    }
  }, [])

  // Auto-start when model is ready
  useEffect(() => {
    if (isModelReady && !isStreaming && !error && !isCleaningUpRef.current) {
      start()
    }
    
    return () => {
      // Stop streaming if model becomes unavailable
      if (!isModelReady && isStreaming) {
        stop()
      }
    }
  }, [isModelReady, isStreaming, error, start, stop])

  return {
    predictions,
    isStreaming,
    isPaused,
    lag,
    throughput,
    bufferSize,
    error,
    pause,
    resume,
    start,
    stop
  }
}

export default useStreamingInference
