/** [Ver001.001] - Exported UseWorkerOptions and UseWorkerReturn types
 * useWorker Hook for NJZiteGeisTe Platform
 * Generic worker management hook with lifecycle handling
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type {
  WorkerType,
  WorkerMessage,
  WorkerResponse,
  WorkerStatus
} from '../../types/worker'
import { handleWorkerError, workerPerformance } from '../../lib/worker-utils'

export interface UseWorkerOptions {
  workerType: WorkerType
  workerFactory: () => Worker
  onMessage?: (data: unknown) => void
  onError?: (error: Error) => void
  onReady?: () => void
}

export interface UseWorkerReturn {
  isReady: boolean
  isBusy: boolean
  error: Error | null
  status: WorkerStatus | null
  postMessage: <T, R>(action: string, payload: T) => Promise<R>
  terminate: () => void
}

/**
 * Generic hook for managing a Web Worker
 */
export function useWorker(options: UseWorkerOptions): UseWorkerReturn {
  const { workerType, workerFactory, onMessage, onError, onReady } = options

  const workerRef = useRef<Worker | null>(null)
  const pendingTasksRef = useRef<Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
    startTime: number
  }>>(new Map())

  const [isReady, setIsReady] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [taskCount, setTaskCount] = useState(0)

  // Initialize worker
  useEffect(() => {
    try {
      const worker = workerFactory()
      workerRef.current = worker

      worker.onmessage = (event: MessageEvent<WorkerResponse<unknown> | { type: string; workerType: string }>) => {
        const data = event.data

        // Handle ready signal
        if ('type' in data && data.type === 'ready') {
          setIsReady(true)
          onReady?.()
          return
        }

        // Handle regular response
        const response = data as WorkerResponse<unknown>
        const task = pendingTasksRef.current.get(response.id)

        if (task) {
          const duration = performance.now() - task.startTime
          workerPerformance.record(`${workerType}:${response.success ? 'success' : 'error'}`, duration)

          pendingTasksRef.current.delete(response.id)
          setTaskCount(prev => prev + 1)
          setIsBusy(false)

          if (response.success) {
            task.resolve(response.data)
          } else {
            task.reject(new Error(response.error || 'Worker error'))
          }
        }

        onMessage?.(response)
      }

      worker.onerror = (err: ErrorEvent) => {
        const error = new Error(err.message || 'Worker error')
        handleWorkerError(workerType, error)
        setError(error)
        onError?.(error)

        // Reject all pending tasks
        pendingTasksRef.current.forEach((task) => {
          task.reject(error)
        })
        pendingTasksRef.current.clear()
      }

      return () => {
        worker.terminate()
        // Reject all pending tasks on cleanup
        pendingTasksRef.current.forEach((task) => {
          task.reject(new Error('Worker terminated'))
        })
        pendingTasksRef.current.clear()
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      handleWorkerError(workerType, error)
      setError(error)
      onError?.(error)
    }
  }, [workerFactory, onMessage, onError, onReady, workerType])

  // Post message to worker
  const postMessage = useCallback(<T, R>(action: string, payload: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const message: WorkerMessage<T> = { id, action, payload }

      pendingTasksRef.current.set(id, {
        resolve: (value) => resolve(value as R),
        reject,
        startTime: performance.now()
      })

      setIsBusy(true)
      workerRef.current.postMessage(message)
    })
  }, [])

  // Terminate worker
  const terminate = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setIsReady(false)

    // Reject all pending tasks
    pendingTasksRef.current.forEach((task) => {
      task.reject(new Error('Worker terminated'))
    })
    pendingTasksRef.current.clear()
  }, [])

  return {
    isReady,
    isBusy,
    error,
    status: isReady ? (isBusy ? 'busy' : 'idle') : 'initializing',
    postMessage,
    terminate
  }
}

export default useWorker
