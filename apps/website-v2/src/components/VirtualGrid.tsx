/**
 * VirtualGrid - Windowed Rendering with @tanstack/react-virtual v3
 * Sends only visible panel IDs to worker for rendering
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGridWorker } from '../workers/useGridWorker'

interface PanelData {
  id: string
  title: string
  content: string
}

interface VirtualGridProps {
  panels: PanelData[]
  rowHeight?: number
  overscan?: number
  onVisibleRangeChange?: (start: number, end: number) => void
  onPerformanceMetrics?: (metrics: { renderTime: number; visibleCount: number }) => void
}

const GAP = 4
const COLS = 2

export const VirtualGrid: React.FC<VirtualGridProps> = ({
  panels,
  rowHeight = 100,
  overscan = 5,
  onVisibleRangeChange,
  onPerformanceMetrics,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [isInitialized, setIsInitialized] = useState(false)
  const visibleRangeRef = useRef({ start: 0, end: 0 })

  const rows = Math.ceil(panels.length / COLS)

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

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  // Calculate visible panel IDs
  const visiblePanelIds = useMemo(() => {
    const ids: string[] = []
    const startRow = virtualItems[0]?.index ?? 0
    const endRow = virtualItems[virtualItems.length - 1]?.index ?? 0

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < COLS; col++) {
        const index = row * COLS + col
        if (index < panels.length) {
          ids.push(panels[index].id)
        }
      }
    }

    return ids
  }, [virtualItems, panels])

  // Notify range change
  useEffect(() => {
    if (virtualItems.length === 0) return
    const start = virtualItems[0].index * COLS
    const end = Math.min((virtualItems[virtualItems.length - 1].index + 1) * COLS, panels.length)

    if (visibleRangeRef.current.start !== start || visibleRangeRef.current.end !== end) {
      visibleRangeRef.current = { start, end }
      onVisibleRangeChange?.(start, end)
    }
  }, [virtualItems, panels.length, onVisibleRangeChange])

  // Send visible panels to worker
  useEffect(() => {
    if (!isInitialized || visiblePanelIds.length === 0) return

    const cellWidth = Math.floor((containerWidth - GAP * (COLS + 1)) / COLS)
    const cellHeight = rowHeight - GAP

    const visiblePanels = visiblePanelIds.map((id, index) => {
      const panelIndex = panels.findIndex((p) => p.id === id)
      const row = Math.floor(panelIndex / COLS)
      const col = panelIndex % COLS

      const virtualRow = virtualItems.find((v) => v.index === row)
      const y = (virtualRow?.start ?? row * rowHeight) + GAP
      const x = GAP + col * (cellWidth + GAP)

      return {
        id,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        title: panels[panelIndex]?.title ?? '',
        content: panels[panelIndex]?.content ?? '',
      }
    })

    render(visiblePanels).catch(console.error)
  }, [isInitialized, visiblePanelIds, virtualItems, containerWidth, rowHeight, panels, render])

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
