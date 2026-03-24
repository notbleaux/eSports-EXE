/** [Ver002.000]
 * useGridWorker Hook for 4NJZ4 TENET Platform
 * Hook for offloading grid rendering to a Web Worker with Worker Pool support
 * 
 * Features:
 * - Worker Pool integration for multiple grids
 * - OffscreenCanvas transfer
 * - Virtual scrolling calculations
 * - Fallback for non-Worker browsers
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useWorker } from './useWorker'
import { WorkerPool, getWorkerPool, isWorkerSupported, isOffscreenCanvasSupported } from '../../lib/worker-utils'
import type {
  GridInitPayload,
  GridRenderPayload,
  GridScrollPayload,
  GridResizePayload,
  GridRenderResult,
  GridVisibleRange
} from '../../types/worker'

// Worker factory for grid worker
// WORKER DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
const createGridWorker = (): Worker => {
  throw new Error('Workers disabled for build compatibility');
  /* Original code disabled - pattern broken:
  // WORKER DISABLED - new Worker(new URL('../../workers/grid.worker.ts', import.meta.url), {
  */
}

export interface UseGridWorkerOptions {
  columns: number
  rows: number
  cellWidth?: number
  cellHeight?: number
  useWorkerPool?: boolean
  workerPool?: WorkerPool
  onError?: (error: Error) => void
  onRenderComplete?: (stats: { renderTime: number; renderedCells: number }) => void
}

export interface UseGridWorkerReturn {
  isReady: boolean
  isRendering: boolean
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  init: () => Promise<void>
  render: (data: GridRenderPayload) => Promise<{ renderedCells: number; renderTime: number }>
  scroll: (scrollTop: number, scrollLeft: number) => Promise<void>
  resize: (width: number, height: number) => Promise<void>
  calculateVisibleRange: (
    scrollTop: number,
    scrollLeft: number,
    viewportWidth: number,
    viewportHeight: number
  ) => Promise<GridVisibleRange>
  terminate: () => void
  workerSupported: boolean
  offscreenSupported: boolean
}

/**
 * Hook for managing grid rendering via Web Worker
 * 
 * @example
 * ```tsx
 * const { canvasRef, render, isReady } = useGridWorker({
 *   columns: 10,
 *   rows: 1000,
 *   useWorkerPool: true
 * });
 * 
 * useEffect(() => {
 *   if (isReady) {
 *     render({ data, columns, viewport, scrollTop, scrollLeft });
 *   }
 * }, [isReady, data]);
 * ```
 */
export function useGridWorker(options: UseGridWorkerOptions): UseGridWorkerReturn {
  const { 
    columns, 
    rows, 
    cellWidth = 100, 
    cellHeight = 40, 
    useWorkerPool = false,
    workerPool: externalPool,
    onError,
    onRenderComplete
  } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const poolRef = useRef<WorkerPool | null>(externalPool || null)

  // Check browser capabilities
  const workerSupported = isWorkerSupported()
  const offscreenSupported = isOffscreenCanvasSupported()

  // Initialize worker pool if requested
  useEffect(() => {
    if (useWorkerPool && !poolRef.current && workerSupported) {
      poolRef.current = getWorkerPool('grid', createGridWorker, {
        maxWorkers: 4,
        idleTimeoutMs: 30000,
        taskTimeoutMs: 30000
      })
    }
  }, [useWorkerPool, workerSupported])

  const { isReady, isBusy, postMessage, terminate } = useWorker({
    workerType: 'grid',
    workerFactory: createGridWorker,
    onError,
    onReady: () => {
      // Auto-initialize when worker is ready
      if (!isInitialized && !useWorkerPool) {
        init()
      }
    }
  })

  /**
   * Initialize the grid worker with OffscreenCanvas
   */
  const init = useCallback(async (): Promise<void> => {
    // If using worker pool, skip individual initialization
    if (useWorkerPool && poolRef.current) {
      setIsInitialized(true)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      throw new Error('Canvas element not found')
    }

    // Check OffscreenCanvas support
    if (!offscreenSupported) {
      throw new Error('OffscreenCanvas not supported in this browser')
    }

    // Transfer canvas control to offscreen
    const offscreen = canvas.transferControlToOffscreen()
    offscreenCanvasRef.current = offscreen

    const payload: GridInitPayload = {
      canvas: offscreen,
      columns: Array.from({ length: columns }, (_, i) => ({
        key: `col-${i}`,
        header: `Column ${i}`,
        width: cellWidth
      })),
      rows,
      cellWidth,
      cellHeight
    }

    await postMessage('init', payload)
    setIsInitialized(true)
  }, [columns, rows, cellWidth, cellHeight, postMessage, useWorkerPool, offscreenSupported])

  /**
   * Render grid cells
   */
  const render = useCallback(async (
    data: GridRenderPayload
  ): Promise<{ renderedCells: number; renderTime: number }> => {
    // Use worker pool if available
    if (useWorkerPool && poolRef.current) {
      try {
        const result = await poolRef.current.execute<GridRenderPayload, GridRenderResult>('render', data)
        onRenderComplete?.({ 
          renderTime: result.renderTime, 
          renderedCells: result.renderedCells || 0 
        })
        return {
          renderedCells: result.renderedCells || 0,
          renderTime: result.renderTime
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Worker pool render failed'))
        throw error
      }
    }

    // Fall back to individual worker
    if (!isInitialized) {
      throw new Error('Grid worker not initialized')
    }

    const result = await postMessage<GridRenderPayload, GridRenderResult>('render', data)
    onRenderComplete?.({ 
      renderTime: result.renderTime, 
      renderedCells: result.renderedCells || 0 
    })
    return {
      renderedCells: result.renderedCells || 0,
      renderTime: result.renderTime
    }
  }, [isInitialized, postMessage, useWorkerPool, onRenderComplete, onError])

  /**
   * Update scroll position
   */
  const scroll = useCallback(async (
    scrollTop: number,
    scrollLeft: number
  ): Promise<void> => {
    // Use worker pool if available
    if (useWorkerPool && poolRef.current) {
      try {
        const payload: GridScrollPayload = { scrollTop, scrollLeft }
        await poolRef.current.execute<GridScrollPayload, GridRenderResult>('scroll', payload)
        return
      } catch (error) {
        // Fall through to individual worker
      }
    }

    if (!isInitialized) return

    const payload: GridScrollPayload = { scrollTop, scrollLeft }
    await postMessage('scroll', payload)
  }, [isInitialized, postMessage, useWorkerPool])

  /**
   * Resize the grid
   */
  const resize = useCallback(async (
    width: number,
    height: number
  ): Promise<void> => {
    // Use worker pool if available
    if (useWorkerPool && poolRef.current) {
      try {
        const payload: GridResizePayload = { width, height }
        await poolRef.current.execute<GridResizePayload, GridRenderResult>('resize', payload)
        return
      } catch (error) {
        // Fall through to individual worker
      }
    }

    if (!isInitialized) return

    const payload: GridResizePayload = { width, height }
    await postMessage('resize', payload)
  }, [isInitialized, postMessage, useWorkerPool])

  /**
   * Calculate visible range for virtual scrolling
   */
  const calculateVisibleRange = useCallback(async (
    scrollTop: number,
    scrollLeft: number,
    viewportWidth: number,
    viewportHeight: number
  ): Promise<GridVisibleRange> => {
    // Use worker pool if available
    if (useWorkerPool && poolRef.current) {
      try {
        const result = await poolRef.current.execute<{
          scrollTop: number
          scrollLeft: number
          viewportWidth: number
          viewportHeight: number
        }, GridVisibleRange>('calculateRange', {
          scrollTop,
          scrollLeft,
          viewportWidth,
          viewportHeight
        })
        return result
      } catch (error) {
        // Fall through to local calculation
      }
    }

    if (!isInitialized) {
      // Fallback calculation
      const startRow = Math.max(0, Math.floor(scrollTop / cellHeight))
      const visibleCount = Math.ceil(viewportHeight / cellHeight)
      const endRow = Math.min(rows, startRow + visibleCount)

      return {
        startRow,
        endRow,
        startCol: 0,
        endCol: columns
      }
    }

    return await postMessage('calculateRange', {
      scrollTop,
      scrollLeft,
      viewportWidth,
      viewportHeight
    })
  }, [isInitialized, postMessage, useWorkerPool, cellHeight, rows, columns])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (offscreenCanvasRef.current) {
        // OffscreenCanvas will be garbage collected when worker terminates
        offscreenCanvasRef.current = null
      }
      // Note: WorkerPool is managed globally and should not be disposed here
      // unless this was the only grid using it
    }
  }, [])

  return {
    isReady: useWorkerPool ? true : isReady,
    isRendering: isBusy,
    canvasRef,
    init,
    render,
    scroll,
    resize,
    calculateVisibleRange,
    terminate,
    workerSupported,
    offscreenSupported
  }
}

export default useGridWorker
