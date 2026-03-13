/**
 * HybridGrid - Unified Grid with Automatic Render Mode Detection
 * Uses Web Worker + OffscreenCanvas when supported, falls back to DOM rendering
 * [Ver001.000]
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGridWorker } from '../workers/useGridWorker'
import { useCols, useRowHeight } from '../store/staticStore'
import { usePanels } from '../store/dynamicStore'
import { useEphemeralStore } from '../store/ephemeralStore'

interface HybridGridProps {
  rowHeight?: number
  overscan?: number
  onPerformanceMetrics?: (metrics: { renderTime: number; visibleCount: number; mode: 'worker' | 'dom' }) => void
  onError?: (error: Error) => void
}

const GAP = 4

// Feature detection for OffscreenCanvas
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype

export const HybridGrid: React.FC<HybridGridProps> = ({
  rowHeight: propRowHeight,
  overscan = 5,
  onPerformanceMetrics,
  onError,
}) => {
  const renderMode = supportsOffscreenCanvas ? 'worker' : 'dom'
  
  const parentRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const staticCols = useCols()
  const staticRowHeight = useRowHeight()
  const panels = usePanels()
  const isScrolling = useEphemeralStore((state) => state.isScrolling)
  
  const rowHeight = propRowHeight ?? staticRowHeight
  const cols = staticCols
  
  const [containerWidth, setContainerWidth] = useState(800)
  const [isInitialized, setIsInitialized] = useState(false)
  const [renderTime, setRenderTime] = useState(0)

  const panelCount = panels.length
  const rows = Math.ceil(panelCount / cols)

  const { isReady, init, render } = useGridWorker({
    onRenderComplete: (count, time) => {
      setRenderTime(time)
      onPerformanceMetrics?.({ renderTime: time, visibleCount: count, mode: 'worker' })
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

  // Initialize worker canvas (worker mode only)
  useEffect(() => {
    if (renderMode !== 'worker' || !canvasRef.current || !isReady || isInitialized) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    init(canvas, rect.width * dpr, rect.height * dpr)
      .then(() => setIsInitialized(true))
      .catch((err) => {
        onError?.(err)
        console.error('Worker init failed:', err)
      })
  }, [renderMode, isReady, isInitialized, init, onError])

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

  // Render to worker or DOM
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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

    if (renderMode === 'worker' && isInitialized) {
      // Debounced worker render during scroll
      if (isScrolling) {
        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
        renderTimeoutRef.current = setTimeout(() => {
          render(panelData).catch(onError)
        }, 16)
      } else {
        render(panelData).catch(onError)
      }
    } else {
      // DOM rendering fallback
      const startTime = performance.now()
      renderToDOM(panelData, containerRef.current)
      const time = performance.now() - startTime
      setRenderTime(time)
      onPerformanceMetrics?.({ renderTime: time, visibleCount: panelData.length, mode: 'dom' })
    }

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
    }
  }, [visiblePanels, isInitialized, isScrolling, virtualItems, containerWidth, cols, rowHeight, panels, render, renderMode, onError, onPerformanceMetrics])

  // DOM rendering fallback
  const renderToDOM = (panels: Array<{ id: string; x: number; y: number; width: number; height: number; title: string; content: string }>, container: HTMLDivElement | null) => {
    if (!container) return
    
    // Only update changed panels (simple diff)
    const existing = new Set(Array.from(container.children).map(c => c.getAttribute('data-id')))
    const current = new Set(panels.map(p => p.id))
    
    // Remove old panels
    Array.from(container.children).forEach(child => {
      const id = child.getAttribute('data-id')
      if (id && !current.has(id)) {
        child.remove()
      }
    })
    
    // Add/update panels
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

  return (
    <div className="hybrid-grid">
      <div className="grid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span style={{ color: renderMode === 'worker' ? '#4ade80' : '#fbbf24' }}>
            Mode: {renderMode === 'worker' ? '⚡ Worker' : '🌐 DOM Fallback'}
          </span>
          <span style={{ color: targetMet ? '#4ade80' : '#fbbf24' }}>
            Render: {renderTime.toFixed(2)}ms {targetMet ? '✓' : ''}
          </span>
          <span style={{ color: '#9ca3af' }}>
            Panels: {visiblePanels.length} / {panelCount}
          </span>
        </div>
      </div>

      <div
        ref={parentRef}
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
          {renderMode === 'worker' ? (
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

export default HybridGrid
