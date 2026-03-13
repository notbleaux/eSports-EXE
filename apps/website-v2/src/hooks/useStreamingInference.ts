/**
 * useStreamingInference - Real-time Streaming ML Inference Hook
 * Connects to data-stream.worker for real-time predictions with debouncing
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useMLInference } from './useMLInference'
import type { DataStreamCommand, DataStreamResponse, StreamData } from '../workers/data-stream.worker'

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
 * Debounce function for limiting prediction rate
 */
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastCallTime = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    const execute = () => {
      lastCallTime = Date.now()
      fn(...args)
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (timeSinceLastCall >= delay) {
      execute()
    } else {
      timeoutId = setTimeout(execute, delay - timeSinceLastCall)
    }
  }
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
  const predictionCountRef = useRef(0)
  const lastThroughputCalcRef = useRef(Date.now())
  const pendingDataRef = useRef<StreamData | null>(null)

  // ML Inference hook
  const { predict, isModelReady, loadModel } = useMLInference({ useWorker: true })

  // Load model on mount
  useEffect(() => {
    if (!isModelReady) {
      loadModel(modelUrl).catch((err) => {
        console.error('[Streaming Inference] Failed to load model:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Model load failed'))
        }
      })
    }
  }, [isModelReady, loadModel, modelUrl])

  // Calculate debounce delay based on max predictions per second
  const debounceDelay = useMemo(() => {
    return Math.max(16, 1000 / maxPredictionsPerSecond) // Minimum 16ms (60fps)
  }, [maxPredictionsPerSecond])

  /**
   * Process data for prediction with debouncing
   */
  const processPrediction = useCallback(
    debounce(async (data: StreamData) => {
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
        } catch (e) {
          // History store not available, continue
        }

        // Update throughput counter
        predictionCountRef.current++
      } catch (err) {
        console.error('[Streaming Inference] Prediction failed:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Prediction failed'))
        }
      }
    }, debounceDelay),
    [isModelReady, predict, debounceDelay]
  )

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
   */
  const initWorker = useCallback((): Worker | null => {
    if (workerRef.current) {
      return workerRef.current
    }

    try {
      const worker = new Worker(new URL('../workers/data-stream.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.onmessage = (event: MessageEvent<DataStreamResponse>) => {
        const response = event.data

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
            if (isMountedRef.current && !isPaused) {
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
            console.log(`[Streaming Inference] Reconnecting attempt ${response.attempt} in ${response.delayMs}ms`)
            break
        }
      }

      worker.onerror = (err) => {
        console.error('[Streaming Inference] Worker error:', err)
        if (isMountedRef.current) {
          setError(new Error('Data stream worker failed'))
        }
      }

      workerRef.current = worker
      return worker
    } catch (err) {
      console.error('[Streaming Inference] Failed to initialize worker:', err)
      if (isMountedRef.current) {
        setError(new Error('Failed to initialize data stream worker'))
      }
      return null
    }
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
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'DISCONNECT' } as DataStreamCommand)
    }
    setIsStreaming(false)
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
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'DISCONNECT' } as DataStreamCommand)
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // Auto-start when model is ready
  useEffect(() => {
    if (isModelReady && !isStreaming && !error) {
      start()
    }
  }, [isModelReady, isStreaming, error, start])

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
