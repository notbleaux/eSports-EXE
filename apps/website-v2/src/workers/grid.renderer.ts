/**
 * Grid Renderer - Canvas 2D Rendering Engine
 * High-performance panel rendering with grid layout algorithm
 */

// Local PanelData type for grid rendering
interface PanelData {
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

export interface RenderStats {
  panelCount: number
  renderTime: number
  fps: number
  memoryEstimate: number
}

export interface GridLayout {
  rows: number
  cols: number
  cellWidth: number
  cellHeight: number
  padding: number
}

export interface RenderOptions {
  showGridLines?: boolean
  showPanelBorders?: boolean
  showTitles?: boolean
  antialias?: boolean
  dpr?: number
}

const DEFAULT_OPTIONS: RenderOptions = {
  showGridLines: true,
  showPanelBorders: true,
  showTitles: true,
  antialias: true,
  dpr: 1,
}

const COLORS = {
  background: '#0a0a0f',
  gridLine: 'rgba(157, 78, 221, 0.15)',
  panelBackground: 'rgba(20, 20, 30, 0.85)',
  panelBorder: 'rgba(157, 78, 221, 0.6)',
  panelTitleBar: 'rgba(30, 30, 45, 0.95)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(200, 200, 220, 0.8)',
  accent: '#9d4edd',
}

/**
 * Calculate grid layout for panels
 */
export function calculateGridLayout(
  panelCount: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 16
): GridLayout {
  const cols = Math.ceil(Math.sqrt(panelCount * (canvasWidth / canvasHeight)))
  const rows = Math.ceil(panelCount / cols)

  const availableWidth = canvasWidth - padding * (cols + 1)
  const availableHeight = canvasHeight - padding * (rows + 1)

  return {
    rows,
    cols,
    cellWidth: Math.floor(availableWidth / cols),
    cellHeight: Math.floor(availableHeight / rows),
    padding,
  }
}

/**
 * Generate panel positions based on grid layout
 */
export function generatePanelLayout(
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 16
): PanelData[] {
  const layout = calculateGridLayout(count, canvasWidth, canvasHeight, padding)
  const panels: PanelData[] = []

  for (let i = 0; i < count; i++) {
    const col = i % layout.cols
    const row = Math.floor(i / layout.cols)

    panels.push({
      id: `panel-${i}`,
      x: padding + col * (layout.cellWidth + padding),
      y: padding + row * (layout.cellHeight + padding),
      width: layout.cellWidth,
      height: layout.cellHeight,
      title: `Panel ${i + 1}`,
      content: `${layout.cellWidth}×${layout.cellHeight}`,
    })
  }

  return panels
}

/**
 * Clear canvas with background color
 */
export function clearCanvas(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, width, height)
}

/**
 * Draw grid lines
 */
export function drawGridLines(
  ctx: OffscreenCanvasRenderingContext2D,
  layout: GridLayout,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.strokeStyle = COLORS.gridLine
  ctx.lineWidth = 1

  // Vertical lines
  for (let col = 0; col <= layout.cols; col++) {
    const x = col * (layout.cellWidth + layout.padding) + layout.padding / 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight)
    ctx.stroke()
  }

  // Horizontal lines
  for (let row = 0; row <= layout.rows; row++) {
    const y = row * (layout.cellHeight + layout.padding) + layout.padding / 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth, y)
    ctx.stroke()
  }
}

/**
 * Render single panel with title bar
 */
export function renderPanel(
  ctx: OffscreenCanvasRenderingContext2D,
  panel: PanelData,
  options: RenderOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { x, y, width, height, title, content } = panel
  const titleBarHeight = 28

  // Panel shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  // Panel background
  ctx.fillStyle = COLORS.panelBackground
  ctx.fillRect(x, y, width, height)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Panel border
  if (opts.showPanelBorders) {
    ctx.strokeStyle = COLORS.panelBorder
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, width, height)
  }

  // Title bar
  ctx.fillStyle = COLORS.panelTitleBar
  ctx.fillRect(x + 1, y + 1, width - 2, titleBarHeight)

  // Title bar border
  ctx.strokeStyle = COLORS.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 1, y + titleBarHeight)
  ctx.lineTo(x + width - 1, y + titleBarHeight)
  ctx.stroke()

  // Title text
  if (opts.showTitles && title) {
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, x + 12, y + titleBarHeight / 2 + 1)
  }

  // Content area
  if (content) {
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // Word wrap content
    const maxWidth = width - 24
    const lineHeight = 16
    const startY = y + titleBarHeight + 12

    const words = content.split(' ')
    let line = ''
    let currentY = startY

    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x + 12, currentY)
        line = word + ' '
        currentY += lineHeight

        // Prevent overflow
        if (currentY > y + height - 16) break
      } else {
        line = testLine
      }
    }

    if (currentY <= y + height - 16) {
      ctx.fillText(line, x + 12, currentY)
    }
  }
}

/**
 * Render full grid with all panels
 */
export function renderGrid(
  ctx: OffscreenCanvasRenderingContext2D,
  panels: PanelData[],
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions = {}
): RenderStats {
  const startTime = performance.now()
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Clear canvas
  clearCanvas(ctx, canvasWidth, canvasHeight)

  // Calculate layout for grid lines
  const layout = calculateGridLayout(panels.length, canvasWidth, canvasHeight)

  // Draw grid lines
  if (opts.showGridLines) {
    drawGridLines(ctx, layout, canvasWidth, canvasHeight)
  }

  // Render panels
  for (const panel of panels) {
    renderPanel(ctx, panel, opts)
  }

  const renderTime = performance.now() - startTime
  const memoryEstimate = panels.length * (layout.cellWidth * layout.cellHeight * 4) // RGBA bytes

  return {
    panelCount: panels.length,
    renderTime,
    fps: renderTime > 0 ? 1000 / renderTime : 60,
    memoryEstimate,
  }
}

/**
 * Resize canvas with DPI scaling
 */
export function resizeCanvas(
  canvas: OffscreenCanvas,
  width: number,
  height: number,
  dpr: number = 1
): void {
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
}
