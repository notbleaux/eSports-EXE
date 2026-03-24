/**
 * useStreamingInference.ts
 * Stubbed version - workers disabled for build compatibility
 * 
 * [Ver002.000] - Stubbed to prevent Vite worker bundling issues
 */

import { useState, useCallback } from 'react'

export interface StreamingInferenceOptions {
  wsUrl?: string
  modelUrl?: string
  maxPredictionsPerSecond?: number
  debounceDelay?: number
}

export interface Prediction {
  timestamp: number
  confidence: number
  result: unknown
}

export interface StreamingInferenceResult {
  predictions: Prediction[]
  isStreaming: boolean
  isPaused: boolean
  isModelReady: boolean
  lag: number
  throughput: number
  bufferSize: number
  error: Error | null
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
}

export function useStreamingInference(
  _options: StreamingInferenceOptions = {}
): StreamingInferenceResult {
  const [isPaused, setIsPaused] = useState(false)

  const start = useCallback(() => {
    console.warn('[Streaming Inference] Workers disabled - streaming unavailable')
  }, [])

  const stop = useCallback(() => {}, [])
  
  const pause = useCallback(() => setIsPaused(true), [])
  
  const resume = useCallback(() => setIsPaused(false), [])

  return {
    predictions: [],
    isStreaming: false,
    isPaused,
    isModelReady: false,
    lag: 0,
    throughput: 0,
    bufferSize: 0,
    error: new Error('Streaming disabled - workers not available'),
    start,
    stop,
    pause,
    resume
  }
}

export type UseStreamingInferenceReturn = StreamingInferenceResult

export default useStreamingInference
