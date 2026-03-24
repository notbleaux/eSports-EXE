/**
 * useStreamingInference.ts
 * Stubbed version - workers disabled for build compatibility
 * 
 * [Ver001.000] - Stubbed to prevent Vite worker bundling issues
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useModelStore } from '@/stores/modelStore'
import { usePrediction } from './usePrediction'
import type { NormalizedPlayerFrame } from '@/hub-4-opera/types'

export interface StreamingInferenceOptions {
  wsUrl: string
  debounceDelay?: number
  maxBatchSize?: number
}

export interface StreamingInferenceResult {
  isStreaming: boolean
  isPaused: boolean
  error: Error | null
  throughput: number
  bufferSize: number
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
}

export function useStreamingInference(
  _options: StreamingInferenceOptions
): StreamingInferenceResult {
  const [isStreaming] = useState(false)
  const [isPaused] = useState(false)
  const [error] = useState<Error | null>(new Error('Streaming disabled - workers not available'))
  const [throughput] = useState(0)
  const [bufferSize] = useState(0)

  const start = useCallback(() => {
    console.warn('[Streaming Inference] Workers disabled - streaming unavailable')
  }, [])

  const stop = useCallback(() => {}, [])
  const pause = useCallback(() => {}, [])
  const resume = useCallback(() => {}, [])

  return {
    isStreaming,
    isPaused,
    error,
    throughput,
    bufferSize,
    start,
    stop,
    pause,
    resume
  }
}

export default useStreamingInference
