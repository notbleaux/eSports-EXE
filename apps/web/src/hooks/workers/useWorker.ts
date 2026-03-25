/** [Ver001.000]
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

interface UseWorkerOptions {
  workerType: WorkerType
  workerFactory: () => Worker
  onMessage?: (data: unknown) => void
  onError?: (error: Error) => void
  onReady?: () => void
}

interface UseWorkerReturn {
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
            const error = new Error(response.error || 'Worker task failed')
            task.reject(error)
            setError(error)
            onError?.(error)
          }
        }

        onMessage?.(response.data)
      }

      worker.onerror = (err) => {
        const error = handleWorkerError(err)
        setError(error)
        onError?.(error)

        // Reject all pending tasks
        for (const task of pendingTasksRef.current.values()) {
          task.reject(error)
        }
        pendingTasksRef.current.clear()
        setIsBusy(false)
      }

      worker.onmessageerror = (err) => {
        const error = handleWorkerError(err)
        setError(error)
        onError?.(error)
      }
    } catch (err) {
      const error = handleWorkerError(err)
      setError(error)
      onError?.(error)
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        // Terminate worker
        workerRef.current.terminate()
        workerRef.current = null

        // Reject pending tasks
        for (const task of pendingTasksRef.current.values()) {
          task.reject(new Error('Worker terminated'))
        }
        pendingTasksRef.current.clear()
      }
    }
  }, [workerFactory, workerType, onMessage, onError, onReady])

  /**
   * Post a message to the worker
   */
  const postMessage = useCallback(<T, R>(action: string, payload: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      if (!isReady) {
        reject(new Error('Worker not ready'))
        return
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const message: WorkerMessage<T> = {
        id,
        type: workerType,
        action,
        payload
      }

      pendingTasksRef.current.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        startTime: performance.now()
      })

      setIsBusy(true)
      workerRef.current.postMessage(message)
    })
  }, [isReady, workerType])

  /**
   * Terminate the worker
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      setIsReady(false)
      setIsBusy(false)

      // Reject pending tasks
      for (const task of pendingTasksRef.current.values()) {
        task.reject(new Error('Worker terminated'))
      }
      pendingTasksRef.current.clear()
    }
  }, [])

  const status: WorkerStatus | null = workerRef.current ? {
    type: workerType,
    id: workerRef.current as unknown as string,
    state: isBusy ? 'busy' : error ? 'error' : isReady ? 'idle' : 'terminated',
    taskCount,
    errorCount: error ? 1 : 0,
    lastActivity: Date.now()
  } : null

  return {
    isReady,
    isBusy,
    error,
    status,
    postMessage,
    terminate
  }
}
