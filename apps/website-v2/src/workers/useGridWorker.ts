/**
 * useGridWorker Hook - Main Thread Interface for Grid Worker
 * Manages worker lifecycle and provides typed message interface
 * 
 * [Ver002.000] - Updated to use types/worker.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { 
  GridRenderCommand as WorkerCommand,
  GridRenderResult as WorkerResponse,
  GridRow as PanelData
} from '../types/worker'

export type WorkerErrorType = 'init-failed' | 'render-failed' | 'timeout' | 'unsupported' | 'unknown'

export interface WorkerError {
  type: WorkerErrorType
  message: string
  panelId?: string
  timestamp: number
}

interface UseGridWorkerOptions {
  width?: number
  height?: number
  onError?: (error: WorkerError) => void
  onRenderComplete?: (panelCount: number, renderTime: number) => void
  maxRetries?: number
}

interface UseGridWorkerReturn {
  isReady: boolean
  isSupported: boolean
  error: WorkerError | null
  retry: () => void
  retryCount: number
  canRetry: boolean
  init: (canvas: HTMLCanvasElement, width: number, height: number) => Promise<void>
  render: (panels: PanelData[]) => Promise<void>
  renderPanel: (panel: PanelData) => Promise<void>
  resize: (width: number, height: number) => Promise<void>
  clear: () => Promise<void>
  destroy: () => void
}

/**
 * Check if OffscreenCanvas and Web Workers are supported
 */
function checkSupport(): boolean {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    'transferControlToOffscreen' in HTMLCanvasElement.prototype
  )
}

/**
 * React hook for managing grid worker
 * 
 * @deprecated Use the new useGridWorker from '@/hooks/workers/useGridWorker' instead
 */
export function useGridWorker(options: UseGridWorkerOptions = {}): UseGridWorkerReturn {
  const { 
    /* width/height reserved for future canvas sizing */
    onError, 
    onRenderComplete, 
    maxRetries = 2 
  } = options

  const workerRef = useRef<Worker | null>(null)
  const canvasRef = useRef<OffscreenCanvas | null>(null)
  const pendingRef = useRef<Map<string, { resolve: () => void; reject: (err: WorkerError) => void }>>(new Map())
  const messageIdRef = useRef(0)
  const lastPanelsRef = useRef<PanelData[]>([])

  const [isReady, setIsReady] = useState(false)
  const [isSupported] = useState(() => checkSupport())
  const [error, setError] = useState<WorkerError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Initialize worker on mount
  useEffect(() => {
    if (!isSupported) {
      const err: WorkerError = {
        type: 'unsupported',
        message: 'OffscreenCanvas or Web Workers not supported',
        timestamp: Date.now(),
      }
      setError(err)
      return
    }

    let isMounted = true

    // WORKER DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
    // Create worker
    // const worker = new Worker(new URL('./grid.worker.ts', import.meta.url), {
    //   type: 'module',
    // })
    // workerRef.current = worker
    
    // Set error state since worker is disabled
    const err: WorkerError = {
      type: 'unsupported',
      message: 'Web Workers disabled for build compatibility',
      timestamp: Date.now(),
    }
    setError(err)
    return

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      if (!response.success) {
        const workerError: WorkerError = {
          type: 'unknown',
          message: 'Worker operation failed',
          timestamp: Date.now(),
        }
        rejectPending(workerError)
        onError?.(workerError)
        if (isMounted) setError(workerError)
        return
      }

      // Success - resolve pending
      resolvePending('operation')
      
      if (response.renderTime !== undefined && response.renderedCells !== undefined) {
        onRenderComplete?.(response.renderedCells, response.renderTime)
      }
      
      if (isMounted && !isReady) {
        setIsReady(true)
      }
    }

    // Handle worker errors
    worker.onerror = (err) => {
      const workerError: WorkerError = {
        type: 'unknown',
        message: err.message || 'Worker error occurred',
        timestamp: Date.now(),
      }
      rejectPending(workerError)
      onError?.(workerError)
      if (isMounted) setError(workerError)
    }

    // Cleanup
    return () => {
      isMounted = false
      worker.terminate()
      workerRef.current = null
      // Clear pending map on cleanup
      pendingRef.current.clear()
    }
  }, [isSupported, onError, onRenderComplete, isReady])

  // Helper to resolve pending promises
  const resolvePending = (operation: string) => {
    const key = pendingRef.current.keys().next().value
    if (key && key.startsWith(operation)) {
      pendingRef.current.get(key)?.resolve()
      pendingRef.current.delete(key)
    }
  }

  // Helper to reject pending promises
  const rejectPending = (error: WorkerError) => {
    pendingRef.current.forEach(({ reject }) => reject(error))
    pendingRef.current.clear()
  }

  // Helper to send message and wait for response
  const sendMessage = useCallback(
    (command: WorkerCommand, operation: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          const err: WorkerError = {
            type: 'init-failed',
            message: 'Worker not initialized',
            timestamp: Date.now(),
          }
          reject(err)
          return
        }

        const id = `${operation}-${++messageIdRef.current}`
        pendingRef.current.set(id, { 
          resolve, 
          reject: (err: WorkerError) => reject(err)
        })

        // Set timeout for operation
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id)
            const timeoutError: WorkerError = {
              type: 'timeout',
              message: `${operation} timed out`,
              timestamp: Date.now(),
            }
            reject(timeoutError)
          }
        }, 5000)

        workerRef.current.postMessage(command)
      })
    },
    []
  )

  // Retry state tracking
  const canRetry = retryCount < maxRetries
  
  // Retry function - will be populated after render is defined
  const retryRef = useRef<() => void>(() => {})
  
  const retry = useCallback(() => {
    retryRef.current()
  }, [])

  /**
   * Initialize worker with canvas
   */
  const init = useCallback(
    async (canvas: HTMLCanvasElement, w: number, h: number): Promise<void> => {
      if (!workerRef.current) {
        throw new Error('Worker not available')
      }

      try {
        // Transfer canvas control to offscreen
        const offscreen = canvas.transferControlToOffscreen()
        canvasRef.current = offscreen

        const command: WorkerCommand = {
          type: 'init',
          payload: {
            canvas: offscreen,
            width: w,
            height: h,
          }
        }

        // Send with transfer
        await new Promise<void>((resolve, reject) => {
          const id = `INIT-${++messageIdRef.current}`
          pendingRef.current.set(id, { resolve, reject })

          setTimeout(() => {
            if (pendingRef.current.has(id)) {
              pendingRef.current.delete(id)
              const timeoutErr: WorkerError = {
                type: 'timeout',
                message: 'INIT timed out',
                timestamp: Date.now()
              }
              reject(timeoutErr)
            }
          }, 5000)

          workerRef.current!.postMessage(command, [offscreen])
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const errObj: WorkerError = {
          type: 'init-failed',
          message,
          timestamp: Date.now()
        }
        setError(errObj)
        throw err
      }
    },
    []
  )

  /**
   * Render panels to canvas
   */
  const render = useCallback(
    async (panels: PanelData[]): Promise<void> => {
      lastPanelsRef.current = panels
      const command: WorkerCommand = { 
        type: 'render',
        payload: { panels }
      }
      await sendMessage(command, 'RENDER')
    },
    [sendMessage]
  )

  // Update retry implementation when dependencies change (after render is defined)
  useEffect(() => {
    retryRef.current = () => {
      if (retryCount >= maxRetries) return
      
      setRetryCount(prev => prev + 1)
      setError(null)
      
      // Retry last render if panels exist
      if (lastPanelsRef.current.length > 0) {
        render(lastPanelsRef.current).catch(() => {})
      }
    }
  }, [retryCount, maxRetries, render])

  /**
   * Render single panel with error isolation
   */
  const renderPanel = useCallback(
    async (panel: PanelData): Promise<void> => {
      try {
        await render([panel])
      } catch (err) {
        const workerError: WorkerError = {
          type: 'render-failed',
          message: err instanceof Error ? err.message : 'Panel render failed',
          panelId: String(panel.id),
          timestamp: Date.now(),
        }
        onError?.(workerError)
        throw workerError
      }
    },
    [render, onError]
  )

  /**
   * Resize canvas
   */
  const resize = useCallback(
    async (w: number, h: number): Promise<void> => {
      const command: WorkerCommand = { 
        type: 'resize',
        payload: { width: w, height: h }
      }
      await sendMessage(command, 'RESIZE')
    },
    [sendMessage]
  )

  /**
   * Clear canvas
   */
  const clear = useCallback(async (): Promise<void> => {
    const command: WorkerCommand = { 
      type: 'terminate',
      payload: {}
    }
    await sendMessage(command, 'CLEAR')
  }, [sendMessage])

  /**
   * Destroy worker and cleanup
   */
  const destroy = useCallback((): void => {
    if (workerRef.current) {
      const command: WorkerCommand = { 
        type: 'terminate',
        payload: {}
      }
      workerRef.current.postMessage(command)
      workerRef.current.terminate()
      workerRef.current = null
    }
    canvasRef.current = null
    pendingRef.current.clear()
    setIsReady(false)
    setError(null)
  }, [])

  return {
    isReady,
    isSupported,
    error,
    retry,
    retryCount,
    canRetry,
    init,
    render,
    renderPanel,
    resize,
    clear,
    destroy,
  }
}

export type { PanelData }
