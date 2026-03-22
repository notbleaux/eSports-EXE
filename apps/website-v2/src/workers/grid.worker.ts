/** [Ver002.000]
 * Grid Worker for 4NJZ4 TENET Platform
 * High-performance grid rendering with OffscreenCanvas support
 * 
 * Features:
 * - Virtual scrolling for 1000+ rows
 * - 60fps rendering optimization
 * - Cell-level styling
 * - Column-based formatting
 */

/// <reference lib="webworker" />

import type {
  GridRenderCommand,
  GridRenderResult,
  GridInitPayload,
  GridRenderPayload,
  GridScrollPayload,
  GridResizePayload,
  GridColumn,
  GridRow,
  GridVisibleRange
} from '../types/worker'

const ctx: Worker = self as unknown as Worker

// Grid rendering state
let canvas: OffscreenCanvas | null = null
let ctx2d: OffscreenCanvasRenderingContext2D | null = null
let columns: GridColumn[] = []
let rowHeight = 40
let headerHeight = 48
let totalRows = 0
let scrollTop = 0
let scrollLeft = 0
let renderData: GridRow[] = []
let theme = {
  backgroundColor: '#050508',
  headerBackgroundColor: '#1a1a25',
  rowBackgroundColor: '#0a0a0f',
  alternateRowBackgroundColor: '#12121a',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  textColor: '#ffffff',
  headerTextColor: '#ffd700',
  accentColor: '#ffd700'
}

// Send ready signal
ctx.postMessage({ type: 'ready', workerType: 'grid' })

ctx.onmessage = (event: MessageEvent<GridRenderCommand>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'init':
        handleInit(payload as GridInitPayload)
        break

      case 'render':
        handleRender(payload as GridRenderPayload)
        break

      case 'scroll':
        handleScroll(payload as GridScrollPayload)
        break

      case 'resize':
        handleResize(payload as GridResizePayload)
        break

      case 'calculateRange':
        handleCalculateRange(payload as {
          scrollTop: number
          scrollLeft: number
          viewportWidth: number
          viewportHeight: number
        })
        break

      case 'terminate':
        handleTerminate()
        break
    }
  } catch (error) {
    const result: GridRenderResult = {
      success: false,
      renderTime: performance.now(),
      renderedCells: 0
    }
    ctx.postMessage(result)
  }
}

function handleInit(payload: GridInitPayload): void {
  if (payload.canvas instanceof OffscreenCanvas) {
    canvas = payload.canvas
    ctx2d = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true // Low-latency rendering
    })

    if (payload.columns) {
      columns = payload.columns
    }

    // Send success response
    const result: GridRenderResult = {
      success: true,
      renderTime: performance.now(),
      renderedCells: 0
    }
    ctx.postMessage(result)
  }
}

function handleRender(payload: GridRenderPayload): void {
  if (!ctx2d || !canvas) {
    const result: GridRenderResult = {
      success: false,
      renderTime: performance.now(),
      renderedCells: 0
    }
    ctx.postMessage(result)
    return
  }

  // Update state from payload
  if (payload.data) renderData = payload.data
  if (payload.columns) columns = payload.columns
  if (payload.rowHeight) rowHeight = payload.rowHeight
  if (payload.headerHeight) headerHeight = payload.headerHeight
  if (payload.theme) theme = { ...theme, ...payload.theme }
  if (payload.scrollTop !== undefined) scrollTop = payload.scrollTop
  if (payload.scrollLeft !== undefined) scrollLeft = payload.scrollLeft

  totalRows = renderData.length

  const renderStartTime = performance.now()

  // Perform the actual rendering
  const { renderedCells, visibleRows } = renderGrid(ctx2d, canvas, payload)

  const result: GridRenderResult = {
    success: true,
    renderTime: performance.now() - renderStartTime,
    renderedCells,
    visibleRows
  }

  ctx.postMessage(result)
}

function handleScroll(payload: GridScrollPayload): void {
  scrollTop = payload.scrollTop
  scrollLeft = payload.scrollLeft

  // Re-render with new scroll position
  if (ctx2d && canvas && renderData.length > 0) {
    const { renderedCells, visibleRows } = renderGrid(ctx2d, canvas, {
      data: renderData,
      columns,
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      scrollTop,
      scrollLeft,
      rowHeight,
      headerHeight,
      theme
    })

    const result: GridRenderResult = {
      success: true,
      renderTime: 0,
      renderedCells,
      visibleRows
    }

    ctx.postMessage(result)
  }
}

function handleResize(payload: GridResizePayload): void {
  if (canvas) {
    canvas.width = payload.width
    canvas.height = payload.height

    // Re-render if we have data
    if (ctx2d && renderData.length > 0) {
      const { renderedCells, visibleRows } = renderGrid(ctx2d, canvas, {
        data: renderData,
        columns,
        viewport: { x: 0, y: 0, width: payload.width, height: payload.height },
        scrollTop,
        scrollLeft,
        rowHeight,
        headerHeight,
        theme
      })

      const result: GridRenderResult = {
        success: true,
        renderTime: 0,
        renderedCells,
        visibleRows
      }

      ctx.postMessage(result)
    }
  }
}

function handleCalculateRange(payload: {
  scrollTop: number
  scrollLeft: number
  viewportWidth: number
  viewportHeight: number
}): void {
  const visibleRange = calculateVisibleRange(
    payload.scrollTop,
    payload.scrollLeft,
    payload.viewportWidth,
    payload.viewportHeight
  )

  ctx.postMessage({
    type: 'calculateRange',
    data: visibleRange
  })
}

function handleTerminate(): void {
  canvas = null
  ctx2d = null
  columns = []
  renderData = []
  scrollTop = 0
  scrollLeft = 0
}

function calculateVisibleRange(
  st: number,
  sl: number,
  viewportWidth: number,
  viewportHeight: number
): GridVisibleRange {
  const startRow = Math.max(0, Math.floor(st / rowHeight))
  const endRow = Math.min(totalRows, Math.ceil((st + viewportHeight - headerHeight) / rowHeight))

  let accumulatedWidth = 0
  let startCol = 0
  let endCol = columns.length

  // Calculate visible columns based on scroll position
  for (let i = 0; i < columns.length; i++) {
    if (accumulatedWidth < sl) {
      startCol = i
    }
    accumulatedWidth += columns[i].width
    if (accumulatedWidth > sl + viewportWidth && endCol === columns.length) {
      endCol = i + 1
      break
    }
  }

  return {
    startRow,
    endRow,
    startCol,
    endCol
  }
}

function renderGrid(
  context: OffscreenCanvasRenderingContext2D,
  canvasEl: OffscreenCanvas,
  params: GridRenderPayload
): { renderedCells: number; visibleRows: number } {
  const { data, viewport, scrollTop: st, scrollLeft: sl } = params
  const { width, height } = viewport

  // Clear canvas with background color
  context.fillStyle = theme.backgroundColor
  context.fillRect(0, 0, width, height)

  // Calculate visible range
  const visibleRange = calculateVisibleRange(st, sl, width, height)
  const { startRow, endRow, startCol, endCol } = visibleRange

  let renderedCells = 0
  const visibleRows = Math.min(endRow, data.length) - startRow

  // Pre-calculate column positions for performance
  const colPositions: { x: number; width: number }[] = []
  let currentX = -sl
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx]
    colPositions.push({ x: currentX, width: col.width })
    currentX += col.width
  }

  // Render header row
  context.fillStyle = theme.headerBackgroundColor
  context.fillRect(0, 0, width, headerHeight)

  // Header border
  context.strokeStyle = theme.borderColor
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(0, headerHeight - 0.5)
  context.lineTo(width, headerHeight - 0.5)
  context.stroke()

  // Render headers
  context.font = '600 13px system-ui, -apple-system, sans-serif'
  context.textBaseline = 'middle'

  for (let colIdx = startCol; colIdx < Math.min(endCol, columns.length); colIdx++) {
    const col = columns[colIdx]
    const { x, width: colWidth } = colPositions[colIdx]

    // Skip if outside viewport
    if (x + colWidth < 0 || x > canvasEl.width) continue

    // Header text
    context.fillStyle = theme.headerTextColor
    context.textAlign = (col.align || 'left') as CanvasTextAlign

    const textX = col.align === 'right' ? x + colWidth - 12 :
                  col.align === 'center' ? x + colWidth / 2 :
                  x + 12
    context.fillText(col.header, textX, headerHeight / 2)

    // Column border
    context.strokeStyle = theme.borderColor
    context.beginPath()
    context.moveTo(x + colWidth - 0.5, 0)
    context.lineTo(x + colWidth - 0.5, headerHeight)
    context.stroke()

    renderedCells++
  }

  // Render data rows (only visible ones)
  const firstVisibleY = startRow * rowHeight + headerHeight - st

  for (let rowIdx = startRow; rowIdx < Math.min(endRow, data.length); rowIdx++) {
    const row = data[rowIdx]
    const y = (rowIdx - startRow) * rowHeight + firstVisibleY

    // Skip if outside viewport
    if (y > canvasEl.height) break
    if (y + rowHeight < headerHeight) continue

    // Row background (alternating)
    const isAlternate = rowIdx % 2 === 1
    context.fillStyle = isAlternate ? theme.alternateRowBackgroundColor : theme.rowBackgroundColor
    context.fillRect(0, y, width, rowHeight)

    // Render cells
    for (let colIdx = startCol; colIdx < Math.min(endCol, columns.length); colIdx++) {
      const col = columns[colIdx]
      const { x, width: colWidth } = colPositions[colIdx]

      // Skip if outside viewport
      if (x + colWidth < 0 || x > canvasEl.width) continue

      const value = row[col.key]
      const formattedValue = formatCellValue(value, col.type)

      // Cell text
      context.fillStyle = theme.textColor
      context.font = '400 13px system-ui, -apple-system, sans-serif'
      context.textAlign = (col.align || 'left') as CanvasTextAlign

      const textX = col.align === 'right' ? x + colWidth - 12 :
                    col.align === 'center' ? x + colWidth / 2 :
                    x + 12

      // Truncate text if too long
      const maxWidth = colWidth - 24
      const metrics = context.measureText(formattedValue)
      let displayText = formattedValue
      if (metrics.width > maxWidth) {
        let truncated = formattedValue
        while (context.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1)
        }
        displayText = truncated + '...'
      }

      context.fillText(displayText, textX, y + rowHeight / 2)

      // Cell border
      context.strokeStyle = theme.borderColor
      context.lineWidth = 0.5
      context.beginPath()
      context.moveTo(x + colWidth - 0.5, y)
      context.lineTo(x + colWidth - 0.5, y + rowHeight)
      context.stroke()

      renderedCells++
    }

    // Row border
    context.strokeStyle = theme.borderColor
    context.lineWidth = 0.5
    context.beginPath()
    context.moveTo(0, y + rowHeight - 0.5)
    context.lineTo(width, y + rowHeight - 0.5)
    context.stroke()
  }

  return { renderedCells, visibleRows }
}

function formatCellValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return ''

  switch (type) {
    case 'number':
      if (typeof value === 'number') {
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
      }
      return String(value)

    case 'rating':
      if (typeof value === 'number') {
        return value.toFixed(2)
      }
      return String(value)

    case 'trend':
      if (typeof value === 'number') {
        const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→'
        return `${arrow} ${Math.abs(value).toFixed(1)}%`
      }
      return String(value)

    default:
      return String(value)
  }
}

export {}
