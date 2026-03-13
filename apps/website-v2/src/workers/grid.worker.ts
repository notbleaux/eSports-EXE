/**
 * Grid Worker - OffscreenCanvas Rendering Thread
 * Handles canvas-based grid rendering in a dedicated worker thread
 * 
 * [Ver001.000]
 */

// ============================================================================
// MESSAGE PROTOCOL TYPES
// ============================================================================

export type WorkerCommand =
  | { type: 'INIT'; canvas: OffscreenCanvas; width: number; height: number }
  | { type: 'RENDER'; panels: PanelData[] }
  | { type: 'RESIZE'; width: number; height: number }
  | { type: 'CLEAR' }
  | { type: 'DESTROY' }

export type WorkerResponse =
  | { type: 'INIT_SUCCESS'; timestamp: number }
  | { type: 'RENDER_COMPLETE'; panelCount: number; renderTime: number }
  | { type: 'RESIZE_SUCCESS'; width: number; height: number }
  | { type: 'CLEAR_COMPLETE' }
  | { type: 'ERROR'; message: string; stack?: string }
  | { type: 'PING'; timestamp: number }

export interface PanelData {
  id: string
  x: number
  y: number
  width: number
  height: number
  title?: string
  content?: string
  backgroundColor?: string
  borderColor?: string
}

export interface LayoutCell {
  x: number
  y: number
  width: number
  height: number
  color: string
}

// ============================================================================
// PORCELAIN³ COLOR PALETTE
// ============================================================================

const PORCELAIN_COLORS = {
  background: '#0a0a0f',
  gridLine: 'rgba(157, 78, 221, 0.15)',
  panelBg: [
    'rgba(245, 245, 250, 0.95)',  // Porcelain white
    'rgba(240, 240, 245, 0.95)',
    'rgba(235, 235, 242, 0.95)',
    'rgba(250, 248, 245, 0.95)',  // Warm porcelain
  ],
  panelBorder: 'rgba(157, 78, 221, 0.6)',
  titleBar: 'rgba(30, 30, 45, 0.95)',
  textPrimary: '#1a1a2e',
  textSecondary: 'rgba(26, 26, 46, 0.8)',
  accent: '#9d4edd',
  gap: 4,
}

// ============================================================================
// WORKER STATE
// ============================================================================

interface WorkerState {
  canvas: OffscreenCanvas | null
  ctx: OffscreenCanvasRenderingContext2D | null
  width: number
  height: number
  isInitialized: boolean
  panels: Map<string, PanelData>
}

const state: WorkerState = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  isInitialized: false,
  panels: new Map(),
}

// ============================================================================
// GRID LAYOUT ALGORITHM
// ============================================================================

export function calculateLayout(
  panels: PanelData[],
  canvasWidth: number,
  canvasHeight: number
): LayoutCell[] {
  const count = panels.length
  if (count === 0) return []

  // Calculate grid dimensions based on aspect ratio
  const aspectRatio = canvasWidth / canvasHeight
  const cols = Math.ceil(Math.sqrt(count * aspectRatio))
  const rows = Math.ceil(count / cols)

  // Calculate cell dimensions with gaps
  const gap = PORCELAIN_COLORS.gap
  const availableWidth = canvasWidth - gap * (cols + 1)
  const availableHeight = canvasHeight - gap * (rows + 1)
  const cellWidth = Math.floor(availableWidth / cols)
  const cellHeight = Math.floor(availableHeight / rows)

  // Generate layout cells
  return panels.map((panel, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const colorIndex = index % PORCELAIN_COLORS.panelBg.length

    return {
      x: gap + col * (cellWidth + gap),
      y: gap + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
      color: panel.backgroundColor || PORCELAIN_COLORS.panelBg[colorIndex],
    }
  })
}

// ============================================================================
// PANEL RENDERING
// ============================================================================

export function renderPanels(panels: PanelData[]): void {
  if (!state.ctx || !state.canvas) {
    throw new Error('Worker not initialized')
  }

  const ctx = state.ctx
  const { width, height } = state

  // Clear canvas
  ctx.fillStyle = PORCELAIN_COLORS.background
  ctx.fillRect(0, 0, width, height)

  // Calculate layout
  const layout = calculateLayout(panels, width, height)

  // Render grid lines
  drawGridLines(ctx, layout, width, height)

  // Render each panel
  layout.forEach((cell, index) => {
    const panel = panels[index]
    renderCell(ctx, cell, panel)
  })
}

function drawGridLines(
  ctx: OffscreenCanvasRenderingContext2D,
  layout: LayoutCell[],
  canvasWidth: number,
  canvasHeight: number
): void {
  if (layout.length === 0) return

  ctx.strokeStyle = PORCELAIN_COLORS.gridLine
  ctx.lineWidth = 1

  // Find grid dimensions from layout
  const gap = PORCELAIN_COLORS.gap
  const cellWidth = layout[0].width
  const cellHeight = layout[0].height
  const cols = Math.floor((canvasWidth - gap) / (cellWidth + gap))
  const rows = Math.ceil(layout.length / cols)

  // Vertical lines
  for (let col = 0; col <= cols; col++) {
    const x = gap / 2 + col * (cellWidth + gap)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight)
    ctx.stroke()
  }

  // Horizontal lines
  for (let row = 0; row <= rows; row++) {
    const y = gap / 2 + row * (cellHeight + gap)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth, y)
    ctx.stroke()
  }
}

function renderCell(
  ctx: OffscreenCanvasRenderingContext2D,
  cell: LayoutCell,
  panel: PanelData
): void {
  const { x, y, width, height, color } = cell
  const titleBarHeight = 24

  // Panel shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  // Panel background
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Panel border
  ctx.strokeStyle = PORCELAIN_COLORS.panelBorder
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)

  // Title bar
  ctx.fillStyle = PORCELAIN_COLORS.titleBar
  ctx.fillRect(x + 1, y + 1, width - 2, titleBarHeight)

  // Title bar accent line
  ctx.strokeStyle = PORCELAIN_COLORS.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 1, y + titleBarHeight)
  ctx.lineTo(x + width - 1, y + titleBarHeight)
  ctx.stroke()

  // Title text
  if (panel.title) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(panel.title, x + 8, y + titleBarHeight / 2 + 1)
  }

  // Content text
  if (panel.content) {
    ctx.fillStyle = PORCELAIN_COLORS.textSecondary
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    const maxWidth = width - 16
    const _lineHeight = 14  // Reserved for future multi-line support
    const startY = y + titleBarHeight + 6

    // Simple truncation for content
    let text = panel.content
    let metrics = ctx.measureText(text)

    while (metrics.width > maxWidth && text.length > 0) {
      text = text.slice(0, -1)
      metrics = ctx.measureText(text + '...')
    }

    if (text !== panel.content) {
      text += '...'
    }

    ctx.fillText(text, x + 8, startY)
  }
}

// ============================================================================
// PERFORMANCE BENCHMARK
// ============================================================================

export function measureRenderTime(panelCounts: number[] = [10, 20, 50]): void {
  if (!state.ctx || !state.canvas) {
    console.error('[Worker] Cannot measure: not initialized')
    return
  }

  console.log('[Worker] Starting render benchmark...')

  panelCounts.forEach((count) => {
    // Generate test panels
    const panels: PanelData[] = Array.from({ length: count }, (_, i) => ({
      id: `bench-${i}`,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      title: `Panel ${i + 1}`,
      content: `Benchmark panel ${i + 1}`,
    }))

    // Measure render time
    const startTime = performance.now()
    renderPanels(panels)
    const renderTime = performance.now() - startTime

    const status = renderTime < 16 ? '✓ PASS' : '✗ FAIL'
    console.log(
      `[Worker] Render ${count} panels: ${renderTime.toFixed(2)}ms ${status}` +
        ` (target: <16ms)`
    )
  })

  console.log('[Worker] Benchmark complete')
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

function handleInit(
  canvas: OffscreenCanvas,
  width: number,
  height: number
): WorkerResponse {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { type: 'ERROR', message: 'Failed to get 2D context from OffscreenCanvas' }
    }

    state.canvas = canvas
    state.ctx = ctx
    state.width = width
    state.height = height
    state.isInitialized = true

    canvas.width = width
    canvas.height = height

    // Clear with background
    ctx.fillStyle = PORCELAIN_COLORS.background
    ctx.fillRect(0, 0, width, height)

    return { type: 'INIT_SUCCESS', timestamp: Date.now() }
  } catch (error) {
    return {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error during init',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

function handleRender(panels: PanelData[]): WorkerResponse {
  if (!state.isInitialized || !state.ctx || !state.canvas) {
    return { type: 'ERROR', message: 'Worker not initialized' }
  }

  const startTime = performance.now()

  try {
    renderPanels(panels)

    const renderTime = performance.now() - startTime

    // Update panels map
    state.panels.clear()
    for (const panel of panels) {
      state.panels.set(panel.id, panel)
    }

    return {
      type: 'RENDER_COMPLETE',
      panelCount: panels.length,
      renderTime,
    }
  } catch (error) {
    return {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error during render',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

function handleResize(width: number, height: number): WorkerResponse {
  if (!state.isInitialized || !state.canvas) {
    return { type: 'ERROR', message: 'Worker not initialized' }
  }

  try {
    state.width = width
    state.height = height
    state.canvas.width = width
    state.canvas.height = height

    return { type: 'RESIZE_SUCCESS', width, height }
  } catch (error) {
    return {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error during resize',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

function handleClear(): WorkerResponse {
  if (!state.isInitialized || !state.ctx || !state.canvas) {
    return { type: 'ERROR', message: 'Worker not initialized' }
  }

  try {
    state.ctx.fillStyle = PORCELAIN_COLORS.background
    state.ctx.fillRect(0, 0, state.width, state.height)
    state.panels.clear()
    return { type: 'CLEAR_COMPLETE' }
  } catch (error) {
    return {
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error during clear',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

function handleDestroy(): WorkerResponse {
  state.canvas = null
  state.ctx = null
  state.width = 0
  state.height = 0
  state.isInitialized = false
  state.panels.clear()

  return { type: 'CLEAR_COMPLETE' }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const command = event.data
  let response: WorkerResponse

  switch (command.type) {
    case 'INIT':
      response = handleInit(command.canvas, command.width, command.height)
      break
    case 'RENDER':
      response = handleRender(command.panels)
      break
    case 'RESIZE':
      response = handleResize(command.width, command.height)
      break
    case 'CLEAR':
      response = handleClear()
      break
    case 'DESTROY':
      response = handleDestroy()
      break
    default:
      response = { type: 'ERROR', message: `Unknown command type` }
  }

  self.postMessage(response)
}

// ============================================================================
// WORKER READY SIGNAL
// ============================================================================

self.postMessage({ type: 'PING', timestamp: Date.now() })
