/**
 * useGridWorker Hook
 * COMPLETELY DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  GridWorkerRequest,
  GridWorkerResponse,
  GridRenderCommand,
  GridRenderResult,
  GridVisibleRange
} from '../../types/worker'

// Worker factory - DISABLED
const createGridWorker = (): Worker => {
  throw new Error('Workers disabled for build compatibility')
}

export interface UseGridWorkerOptions {
  columns: number
  rows: number
  cellWidth?: number
  cellHeight?: number
  useWorkerPool?: boolean
  workerPool?: unknown
  onError?: (error: Error) => void
  onRenderComplete?: (stats: { renderTime: number; renderedCells: number }) => void
}

interface UseGridWorkerReturn {
  isReady: boolean
  isSupported: boolean
  error: Error | null
  render: () => Promise<void>
  clear: () => void
  destroy: () => void
}

export function useGridWorker(options: UseGridWorkerOptions): UseGridWorkerReturn {
  const { onError } = options
  const [isReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const err = new Error('Grid Workers disabled for build compatibility')
    setError(err)
    onError?.(err)
  }, [onError])

  const render = useCallback(async (): Promise<void> => {
    throw new Error('Grid Worker not available - disabled for build')
  }, [])

  const clear = useCallback(() => {
    // No-op
  }, [])

  const destroy = useCallback(() => {
    // No-op
  }, [])

  return {
    isReady,
    isSupported: false,
    error,
    render,
    clear,
    destroy,
  }
}

export default useGridWorker
