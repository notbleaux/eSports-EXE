/**
 * UnifiedGrid - Single Grid Component with Worker/DOM/Auto Modes
 * Consolidates VirtualGrid + HybridGrid functionality
 * [Ver001.000]
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGridWorker } from '../workers/useGridWorker'
import { useCols, useRowHeight, useGap } from '../store/staticStore'
import { usePanels } from '../store/dynamicStore'
import { useEphemeralStore } from '../store/ephemeralStore'

export type GridMode = 'worker' | 'dom' | 'auto'

interface UnifiedGridProps {
  mode?: GridMode
  rowHeight?: number
  overscan?: number
  panelCount?: number
  onPerformanceMetrics?: (metrics: {
    renderTime: number
    visibleCount: number
    mode: 'worker' | 'dom'
  }) => void
  onError?: (error: Error) => void
  onWorkerFallback?: () => void
  loadingComponent?: React.ReactNode
}

// Feature detection
const supportsOffscreenCanvas = () =>
  typeof OffscreenCanvas !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype

export const UnifiedGrid: React.FC<UnifiedGridProps> = ({
  mode = 'auto',
  rowHeight: propRowHeight,
  overscan = 5,
  panelCount: propPanelCount,
  onPerformanceMetrics,
  onError,
  onWorkerFallback,
  loadingComponent,
}) => {
  // Determine actual render mode
  const [effectiveMode, setEffectiveMode] = useState<'worker' | 'dom'>(() => {
    if (mode === 'worker') return 'worker'
    if (mode === 'dom') return 'dom'
    return supportsOffscreenCanvas() ? 'worker' : 'dom'
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const staticCols = useCols()
  const staticRowHeight = useRowHeight()
  const staticGap = useGap()
  const panels = usePanels()
  const isScrolling = useEphemeralStore((state) => state.isScrolling)

  const rowHeight = propRowHeight ?? staticRowHeight
  const cols = staticCols
  const GAP = staticGap

  const [containerWidth, setContainerWidth] = useState(800)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [renderTime, setRenderTime] = useState(0)
  const [workerError, setWorkerError] = useState<Error | null>(null)

  const panelCount = propPanelCount ?? panels.length
  const rows = Math.ceil(panelCount / cols)

  const { isReady, init, render } = useGridWorker({
    onRenderComplete: (count, time) => {
      setRenderTime(time)
      onPerformanceMetrics?.({ renderTime: time, visibleCount: count, mode: effectiveMode })
    },
  })

  // Measure container
  useEffect(() => {
    if (!parentRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(parentRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Initialize worker with fallback
  useEffect(() => {
    if (effectiveMode !== 'worker' || !canvasRef.current || !isReady || isInitialized) {
      if (effectiveMode === 'dom') setIsLoading(false)
      return
    }

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    init(canvas, rect.width * dpr, rect.height * dpr)
      .then(() => {
        setIsInitialized(true)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[UnifiedGrid] Worker init failed, falling back to DOM:', err)
        setWorkerError(err)
        setEffectiveMode('dom')
        onWorkerFallback?.()
        onError?.(err)
        setIsLoading(false)
      })
  }, [effectiveMode, isReady, isInitialized, init, onError, onWorkerFallback])

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  // Calculate visible panels
  const visiblePanels = useMemo(() => {
    const result: Array<{ id: string; index: number; row: number; col: number }> = []
    const startRow = virtualItems[0]?.index ?? 0
    const endRow = virtualItems[virtualItems.length - 1]?.index ?? 0

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col
        if (index < panelCount) {
          result.push({ id: panels[index]?.i ?? `panel-${index}`, index, row, col })
        }
      }
    }
    return result
  }, [virtualItems, cols, panelCount, panels])

  // Render timeout ref for debouncing
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Render panels
  useEffect(() => {
    if (visiblePanels.length === 0) return

    const cellWidth = Math.floor((containerWidth - GAP * (cols + 1)) / cols)
    const cellHeight = rowHeight - GAP

    const panelData = visiblePanels.map(({ id, index, row, col }) => {
      const virtualRow = virtualItems.find((v) => v.index === row)
      const y = (virtualRow?.start ?? row * rowHeight) + GAP
      const x = GAP + col * (cellWidth + GAP)

      return {
        id,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        title: panels[index]?.title ?? `Panel ${index + 1}`,
        content: panels[index]?.content ?? `Row ${row + 1}, Col ${col + 1}`,
      }
    })

    if (effectiveMode === 'worker' && isInitialized) {
      // Debounced worker render
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)

      if (isScrolling) {
        renderTimeoutRef.current = setTimeout(() => {
          render(panelData).catch((err) => {
            console.error('[UnifiedGrid] Worker render failed:', err)
            setEffectiveMode('dom')
            onWorkerFallback?.()
          })
        }, 16)
      } else {
        render(panelData).catch((err) => {
          console.error('[UnifiedGrid] Worker render failed:', err)
          setEffectiveMode('dom')
          onWorkerFallback?.()
        })
      }
    } else {
      // DOM render
      const startTime = performance.now()
      renderToDOM(panelData, containerRef.current)
      const time = performance.now() - startTime
      setRenderTime(time)
      onPerformanceMetrics?.({
        renderTime: time,
        visibleCount: panelData.length,
        mode: 'dom',
      })
    }

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
    }
  }, [
    visiblePanels,
    isInitialized,
    isScrolling,
    virtualItems,
    containerWidth,
    cols,
    rowHeight,
    panels,
    render,
    effectiveMode,
    onPerformanceMetrics,
    onWorkerFallback,
  ])

  // DOM rendering
  const renderToDOM = (
    panels: Array<{
      id: string
      x: number
      y: number
      width: number
      height: number
      title: string
      content: string
    }>,
    container: HTMLDivElement | null
  ) => {
    if (!container) return

    // Simple diff
    const existing = new Set(Array.from(container.children).map((c) => c.getAttribute('data-id')))
    const current = new Set(panels.map((p) => p.id))

    // Remove old
    Array.from(container.children).forEach((child) => {
      const id = child.getAttribute('data-id')
      if (id && !current.has(id)) child.remove()
    })

    // Add/update
    panels.forEach((panel) => {
      let el = container.querySelector(`[data-id="${panel.id}"]`) as HTMLElement
      if (!el) {
        el = document.createElement('div')
        el.setAttribute('data-id', panel.id)
        el.style.cssText = `
          position: absolute;
          background: rgba(30, 30, 40, 0.85);
          border: 1px solid rgba(157, 78, 221, 0.6);
          border-radius: 4px;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        `
        container.appendChild(el)
      }
      el.style.left = `${panel.x}px`
      el.style.top = `${panel.y}px`
      el.style.width = `${panel.width}px`
      el.style.height = `${panel.height}px`
      el.innerHTML = `
        <div style="font-weight: bold; font-size: 12px; color: #fff; margin-bottom: 4px;">${panel.title}</div>
        <div style="font-size: 11px; color: rgba(200, 200, 220, 0.8);">${panel.content}</div>
      `
    })
  }

  const targetMet = renderTime > 0 && renderTime < 16

  // Loading skeleton
  const defaultSkeleton = (
    <div
      style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        border: '1px solid rgba(157, 78, 221, 0.3)',
        borderRadius: '8px',
        color: '#6b7280',
      }}
    >
      <div>Initializing Grid...</div>
    </div>
  )

  if (isLoading) {
    return <>{loadingComponent ?? defaultSkeleton}</>
  }

  return (
    <div className="unified-grid">
      {/* Status header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ color: effectiveMode === 'worker' ? '#4ade80' : '#fbbf24' }}>
            Mode: {effectiveMode === 'worker' ? '⚡ Worker' : '🌐 DOM'}
            {mode === 'auto' && ' (auto)'}
          </span>
          <span style={{ color: targetMet ? '#4ade80' : '#fbbf24' }}>
            Render: {renderTime > 0 ? `${renderTime.toFixed(2)}ms` : '--'}
            {targetMet && ' ✓'}
          </span>
          <span style={{ color: '#9ca3af' }}>
            Panels: {visiblePanels.length} / {panelCount}
          </span>
        </div>
        {workerError && (
          <span style={{ color: '#f87171', fontSize: 11 }}>
            Worker failed — using DOM fallback
          </span>
        )}
      </div>

      {/* Grid container */}
      <div
        ref={parentRef}
        role="grid"
        aria-label="Virtualized panel grid"
        aria-rowcount={rows}
        style={{
          height: '400px',
          overflow: 'auto',
          position: 'relative',
          border: '1px solid rgba(157, 78, 221, 0.3)',
          borderRadius: '8px',
          background: '#0a0a0f',
        }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {effectiveMode === 'worker' ? (
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${totalHeight}px`,
              }}
            />
          ) : (
            <div
              ref={containerRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${totalHeight}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default UnifiedGrid
