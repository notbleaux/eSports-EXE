/**
 * VirtualGrid - Windowed Rendering with Granular State Selectors
 * Uses split stores for optimal re-render performance
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGridWorker } from '../workers/useGridWorker'
import { useCols, useRowHeight } from '../store/staticStore'
import { usePanels } from '../store/dynamicStore'
import { useEphemeralStore } from '../store/ephemeralStore'

interface PanelData {
  id: string
  title: string
  content: string
}

interface VirtualGridProps {
  rowHeight?: number
  overscan?: number
  onVisibleRangeChange?: (start: number, end: number) => void
  onPerformanceMetrics?: (metrics: { renderTime: number; visibleCount: number }) => void
}

const GAP = 4

export const VirtualGrid: React.FC<VirtualGridProps> = ({
  rowHeight: propRowHeight,
  overscan = 5,
  onVisibleRangeChange,
  onPerformanceMetrics,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Granular store selectors - only re-render when specific state changes
  const staticCols = useCols()
  const staticRowHeight = useRowHeight()
  const panels = usePanels()
  const isScrolling = useEphemeralStore((state) => state.isScrolling)
  
  const rowHeight = propRowHeight ?? staticRowHeight
  const cols = staticCols
  
  const [containerWidth, setContainerWidth] = useState(800)
  const [isInitialized, setIsInitialized] = useState(false)
  const visibleRangeRef = useRef({ start: 0, end: 0 })

  const panelCount = panels.length
  const rows = Math.ceil(panelCount / cols)

  const { isReady, init, render } = useGridWorker({
    onRenderComplete: (count, time) => {
      onPerformanceMetrics?.({
        renderTime: time,
        visibleCount: count,
      })
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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !isReady || isInitialized) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    init(canvas, rect.width * dpr, rect.height * dpr)
      .then(() => setIsInitialized(true))
      .catch(console.error)
  }, [isReady, isInitialized, init])

  // Virtualizer with reduced re-renders during scroll
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
    scrollPaddingEnd: 0,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  // Calculate visible panel IDs
  const visiblePanelIds = useMemo(() => {
    const ids: string[] = []
    const startRow = virtualItems[0]?.index ?? 0
    const endRow = virtualItems[virtualItems.length - 1]?.index ?? 0

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col
        if (index < panelCount) {
          ids.push(panels[index]?.i ?? `panel-${index}`)
        }
      }
    }

    return ids
  }, [virtualItems, cols, panelCount, panels])

  // Notify range change
  useEffect(() => {
    if (virtualItems.length === 0) return
    const start = virtualItems[0].index * cols
    const end = Math.min((virtualItems[virtualItems.length - 1].index + 1) * cols, panelCount)

    if (visibleRangeRef.current.start !== start || visibleRangeRef.current.end !== end) {
      visibleRangeRef.current = { start, end }
      onVisibleRangeChange?.(start, end)
    }
  }, [virtualItems, cols, panelCount, onVisibleRangeChange])

  // Debounced render during scrolling to reduce worker calls
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!isInitialized || visiblePanelIds.length === 0) return

    const cellWidth = Math.floor((containerWidth - GAP * (cols + 1)) / cols)
    const cellHeight = rowHeight - GAP

    const visiblePanels = visiblePanelIds.map((id, index) => {
      const panelIndex = panels.findIndex((p) => p?.i === id)
      const row = Math.floor(panelIndex / cols)
      const col = panelIndex % cols

      const virtualRow = virtualItems.find((v) => v.index === row)
      const y = (virtualRow?.start ?? row * rowHeight) + GAP
      const x = GAP + col * (cellWidth + GAP)

      return {
        id,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        title: panels[panelIndex]?.title ?? `Panel ${panelIndex + 1}`,
        content: panels[panelIndex]?.content ?? `Row ${row + 1}, Col ${col + 1}`,
      }
    })

    // Debounce during scroll, immediate when stopped
    if (isScrolling) {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
      renderTimeoutRef.current = setTimeout(() => {
        render(visiblePanels).catch(console.error)
      }, 16) // 1 frame delay during scroll
    } else {
      render(visiblePanels).catch(console.error)
    }

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current)
    }
  }, [isInitialized, visiblePanelIds, isScrolling, virtualItems, containerWidth, cols, rowHeight, panels, render])

  return (
    <div
      ref={parentRef}
      style={{
        height: '400px',
        overflow: 'auto',
        position: 'relative',
        border: '1px solid rgba(157, 78, 221, 0.3)',
        borderRadius: '8px',
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
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
      </div>
    </div>
  )
}

export default VirtualGrid
