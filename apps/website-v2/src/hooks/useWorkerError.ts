/**
 * useWorkerError - Centralize worker error detection and recovery
 * [Ver001.000]
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export type WorkerErrorType = 'init-failed' | 'message-timeout' | 'runtime-error' | 'none'

interface WorkerErrorState {
  hasError: boolean
  errorType: WorkerErrorType
  error: Error | null
  retryCount: number
}

interface UseWorkerErrorReturn extends WorkerErrorState {
  retry: () => void
  fallbackToDom: () => void
  trackInit: (promise: Promise<void>) => Promise<void>
  trackMessage: <T>(promise: Promise<T>, timeoutMs?: number) => Promise<T>
  onRuntimeError: (error: Error) => void
}

export function useWorkerError(maxRetries = 2): UseWorkerErrorReturn {
  const [state, setState] = useState<WorkerErrorState>({
    hasError: false,
    errorType: 'none',
    error: null,
    retryCount: 0,
  })

  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  const retry = useCallback(() => {
    setState({
      hasError: false,
      errorType: 'none',
      error: null,
      retryCount: state.retryCount + 1,
    })
  }, [state.retryCount])

  const fallbackToDom = useCallback(() => {
    setState({
      hasError: true,
      errorType: 'init-failed',
      error: new Error('Worker unavailable - using DOM fallback'),
      retryCount: state.retryCount,
    })
  }, [state.retryCount])

  const trackInit = useCallback(
    async (promise: Promise<void>): Promise<void> => {
      try {
        await promise
        setState({
          hasError: false,
          errorType: 'none',
          error: null,
          retryCount: 0,
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        
        if (state.retryCount < maxRetries) {
          // Auto-retry on init failure
          setTimeout(() => retry(), 1000)
        } else {
          setState({
            hasError: true,
            errorType: 'init-failed',
            error: err,
            retryCount: state.retryCount,
          })
        }
        throw err
      }
    },
    [maxRetries, retry, state.retryCount]
  )

  const trackMessage = useCallback(
    async <T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
      return new Promise((resolve, reject) => {
        // Set timeout
        messageTimeoutRef.current = setTimeout(() => {
          setState({
            hasError: true,
            errorType: 'message-timeout',
            error: new Error(`Worker message timeout after ${timeoutMs}ms`),
            retryCount: state.retryCount,
          })
          reject(new Error('Worker message timeout'))
        }, timeoutMs)

        // Execute promise
        promise
          .then((result) => {
            if (messageTimeoutRef.current) {
              clearTimeout(messageTimeoutRef.current)
              messageTimeoutRef.current = null
            }
            resolve(result)
          })
          .catch((error) => {
            if (messageTimeoutRef.current) {
              clearTimeout(messageTimeoutRef.current)
              messageTimeoutRef.current = null
            }
            
            const err = error instanceof Error ? error : new Error(String(error))
            setState({
              hasError: true,
              errorType: 'runtime-error',
              error: err,
              retryCount: state.retryCount,
            })
            reject(err
)
          })
      })
    },
    [state.retryCount]
  )

  const onRuntimeError = useCallback((error: Error) => {
    setState({
      hasError: true,
      errorType: 'runtime-error',
      error,
      retryCount: state.retryCount,
    })
  }, [state.retryCount])

  return {
    ...state,
    retry,
    fallbackToDom,
    trackInit,
    trackMessage,
    onRuntimeError,
  }
}

export default useWorkerError
