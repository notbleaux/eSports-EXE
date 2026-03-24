/**
 * useWorkerError - Worker error detection and recovery
 * [Ver002.000] - Refactored to 60 lines (was 155)
 */

import { useState, useCallback } from 'react'

export type WorkerErrorType = 'init-failed' | 'timeout' | 'runtime' | null

interface WorkerErrorState {
  hasError: boolean
  type: WorkerErrorType
  message: string
  canRetry: boolean
}

export function useWorkerError(maxRetries = 2) {
  const [state, setState] = useState<WorkerErrorState>({
    hasError: false, type: null, message: '', canRetry: true
  })
  const [retries, setRetries] = useState(0)

  const setError = useCallback((type: WorkerErrorType, message: string) => {
    const canRetry = retries < maxRetries && type !== 'runtime'
    setState({ hasError: true, type, message, canRetry })
  }, [retries, maxRetries])

  const retry = useCallback(() => {
    setRetries(r => r + 1)
    setState({ hasError: false, type: null, message: '', canRetry: true })
  }, [])

  const fallbackToDom = useCallback(() => {
    setState({ hasError: true, type: 'init-failed', message: 'Using DOM fallback', canRetry: false })
  }, [])

  return { ...state, retry, fallbackToDom, setError }
}

export default useWorkerError
