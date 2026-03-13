/**
 * useGridWorker Hook - Main Thread Interface for Grid Worker
 * Manages worker lifecycle and provides typed message interface
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorkerCommand, WorkerResponse, PanelData } from './grid.worker'

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
 */
export function useGridWorker(options: UseGridWorkerOptions = {}): UseGridWorkerReturn {
  const { width = 800, height = 600, onError, onRenderComplete, maxRetries = 2 } = options

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
      setError('OffscreenCanvas or Web Workers not supported')
      return
    }

    let isMounted = true

    // Create worker
    const worker = new Worker(new URL('./grid.worker.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current = worker

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      switch (response.type) {
        case 'PING':
          if (isMounted) setIsReady(true)
          break

        case 'INIT_SUCCESS':
          resolvePending('INIT')
          break

        case 'RENDER_COMPLETE':
          resolvePending('RENDER')
          onRenderComplete?.(response.panelCount, response.renderTime)
          break

        case 'RESIZE_SUCCESS':
          resolvePending('RESIZE')
          break

        case 'CLEAR_COMPLETE':
          resolvePending('CLEAR')
          break

        case 'ERROR': {
          const workerError: WorkerError = {
            type: classifyError(response.message),
            message: response.message,
            timestamp: Date.now(),
          }
          rejectPending(workerError)
          onError?.(workerError)
          if (isMounted) setError(workerError)
          break
        }
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
      pendingRef.current.clear()
    }
  }, [isSupported, onError, onRenderComplete])

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

  // Classify error message to type
  const classifyError = (message: string): WorkerErrorType => {
    if (message.includes('INIT') || message.includes('initialize')) return 'init-failed'
    if (message.includes('RENDER') || message.includes('render')) return 'render-failed'
    if (message.includes('timeout') || message.includes('timed out')) return 'timeout'
    if (message.includes('not supported')) return 'unsupported'
    return 'unknown'
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

  // Retry last operation
  const retry = useCallback(() => {
    if (retryCount >= maxRetries) return
    
    setRetryCount(prev => prev + 1)
    setError(null)
    
    // Retry last render if panels exist
    if (lastPanelsRef.current.length > 0) {
      render(lastPanelsRef.current).catch(() => {})
    }
  }, [retryCount, maxRetries])

  const canRetry = retryCount < maxRetries

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
          type: 'INIT',
          canvas: offscreen,
          width: w,
          height: h,
        }

        // Send with transfer
        await new Promise<void>((resolve, reject) => {
          const id = `INIT-${++messageIdRef.current}`
          pendingRef.current.set(id, { resolve, reject })

          setTimeout(() => {
            if (pendingRef.current.has(id)) {
              pendingRef.current.delete(id)
              reject('INIT timed out')
            }
          }, 5000)

          workerRef.current!.postMessage(command, [offscreen])
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
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
      const command: WorkerCommand = { type: 'RENDER', panels }
      await sendMessage(command, 'RENDER')
    },
    [sendMessage]
  )

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
          panelId: panel.id,
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
      const command: WorkerCommand = { type: 'RESIZE', width: w, height: h }
      await sendMessage(command, 'RESIZE')
    },
    [sendMessage]
  )

  /**
   * Clear canvas
   */
  const clear = useCallback(async (): Promise<void> => {
    const command: WorkerCommand = { type: 'CLEAR' }
    await sendMessage(command, 'CLEAR')
  }, [sendMessage])

  /**
   * Destroy worker and cleanup
   */
  const destroy = useCallback((): void => {
    if (workerRef.current) {
      const command: WorkerCommand = { type: 'DESTROY' }
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
