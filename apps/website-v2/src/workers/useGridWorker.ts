/**
 * useGridWorker Hook - Main Thread Interface for Grid Worker
 * MANUALLY DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
 * [Ver003.000] - Completely disabled, returns error state
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
 * ALWAYS RETURNS FALSE - workers disabled
 */
function checkSupport(): boolean {
  return false
}

/**
 * React hook for managing grid worker
 * COMPLETELY DISABLED - returns error state
 */
export function useGridWorker(options: UseGridWorkerOptions = {}): UseGridWorkerReturn {
  const { 
    onError, 
    maxRetries = 2 
  } = options

  const [isReady, setIsReady] = useState(false)
  const isSupported = false
  const [error, setError] = useState<WorkerError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Always set error on mount - workers disabled
  useEffect(() => {
    const err: WorkerError = {
      type: 'unsupported',
      message: 'Web Workers disabled for build compatibility',
      timestamp: Date.now(),
    }
    setError(err)
    onError?.(err)
  }, [onError])

  const canRetry = false

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    const err: WorkerError = {
      type: 'unsupported',
      message: 'Web Workers disabled - retry not available',
      timestamp: Date.now(),
    }
    setError(err)
    onError?.(err)
  }, [onError])

  const init = useCallback(async (): Promise<void> => {
    throw new Error('Worker not available - disabled for build')
  }, [])

  const render = useCallback(async (): Promise<void> => {
    throw new Error('Worker not available - disabled for build')
  }, [])

  const renderPanel = useCallback(async (): Promise<void> => {
    throw new Error('Worker not available - disabled for build')
  }, [])

  const resize = useCallback(async (): Promise<void> => {
    throw new Error('Worker not available - disabled for build')
  }, [])

  const clear = useCallback(async (): Promise<void> => {
    // No-op
  }, [])

  const destroy = useCallback(() => {
    // No-op
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

export default useGridWorker
