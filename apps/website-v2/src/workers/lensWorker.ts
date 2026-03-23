/** [Ver001.000]
 * Lens Worker for 4NJZ4 TENET Platform
 * High-performance lens calculation Web Worker with GPU acceleration support
 * 
 * Features:
 * - Generic lens calculation for all 16 SpecMap lenses
 * - Message passing protocol with typed actions
 * - Error handling and recovery
 * - Worker pool integration (max 4 concurrent)
 * - Performance profiling hooks
 * - WebGL heatmap acceleration (with CPU fallback)
 */

/// <reference lib="webworker" />

// Simple logger for worker context
const workerLogger = {
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(`[Lens Worker] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(`[Lens Worker] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.info(`[Lens Worker] ${msg}`, meta ? JSON.stringify(meta) : '');
  }
};

import type {
  HeatmapCell,
  FlowVector,
  KillEvent,
  PlayerPosition,
  DamageEvent,
  SoundEvent
} from '../components/SpecMapViewer/lenses/types'

// ============================================================================
// Worker State
// ============================================================================

const ctx: Worker = self as unknown as Worker

interface WorkerState {
  isReady: boolean
  supportedFeatures: {
    webgl: boolean
    webgl2: boolean
    offscreenCanvas: boolean
  }
  performanceMetrics: Map<string, {
    count: number
    totalTime: number
    avgTime: number
    maxTime: number
  }>
  gl: WebGLRenderingContext | WebGL2RenderingContext | null
  heatmapTextureCache: Map<string, WebGLTexture | null>
}

const state: WorkerState = {
  isReady: false,
  supportedFeatures: {
    webgl: false,
    webgl2: false,
    offscreenCanvas: false
  },
  performanceMetrics: new Map(),
  gl: null,
  heatmapTextureCache: new Map()
}

// ============================================================================
// Message Types
// ============================================================================

export type LensWorkerAction =
  | 'INIT'
  | 'CALCULATE_HEATMAP'
  | 'CALCULATE_FLOW_FIELD'
  | 'CALCULATE_TENSION_GRID'
  | 'CALCULATE_AGGREGATION'
  | 'RENDER_HEATMAP_GPU'
  | 'RENDER_HEATMAP_CPU'
  | 'GET_STATS'
  | 'RESET'
  | 'DISPOSE'

export interface LensWorkerMessage {
  id: string
  action: LensWorkerAction
  payload: unknown
  timestamp: number
}

export interface LensWorkerResponse {
  id: string
  action: LensWorkerAction
  success: boolean
  data?: unknown
  error?: string
  timing?: {
    startTime: number
    endTime: number
    duration: number
  }
}

// ============================================================================
// Heatmap Calculation Types
// ============================================================================

interface HeatmapCalculationPayload {
  events: Array<{ x: number; y: number; weight?: number }>
  bounds: { width: number; height: number }
  gridSize: number
  radius: number
  falloff: 'gaussian' | 'linear' | 'exponential'
}

interface FlowFieldPayload {
  positions: PlayerPosition[]
  bounds: { width: number; height: number }
  gridSize: number
  influenceRadius: number
}

interface TensionGridPayload {
  killEvents: KillEvent[]
  bounds: { width: number; height: number }
  gridSize: number
  firstBloodWeight: number
}

interface AggregationPayload {
  data: number[]
  operation: 'sum' | 'avg' | 'median' | 'std' | 'min' | 'max' | 'percentile'
  options?: {
    percentile?: number
    weights?: number[]
  }
}

interface GPUHeatmapPayload {
  cells: HeatmapCell[]
  canvas: OffscreenCanvas
  colorRamp: { r: number; g: number; b: number }[]
  intensity: number
}

// ============================================================================
// Initialization
// ============================================================================

function initialize(): void {
  // Detect supported features
  state.supportedFeatures.offscreenCanvas = typeof OffscreenCanvas !== 'undefined'
  state.supportedFeatures.webgl = typeof WebGLRenderingContext !== 'undefined'
  state.supportedFeatures.webgl2 = typeof WebGL2RenderingContext !== 'undefined'

  state.isReady = true

  sendResponse({
    id: 'init',
    action: 'INIT',
    success: true,
    data: {
      status: 'ready',
      features: state.supportedFeatures
    }
  })
}

// ============================================================================
// Heatmap Calculations
// ============================================================================

function calculateHeatmap(payload: HeatmapCalculationPayload): HeatmapCell[] {
  const { events, bounds, gridSize, radius, falloff } = payload
  const cells: HeatmapCell[] = []
  const cellWidth = bounds.width / gridSize
  const cellHeight = bounds.height / gridSize

  // Initialize grid
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      cells.push({
        x: gx * cellWidth + cellWidth / 2,
        y: gy * cellHeight + cellHeight / 2,
        value: 0,
        intensity: 0
      })
    }
  }

  // Accumulate values from events
  events.forEach(event => {
    cells.forEach(cell => {
      const dx = cell.x - event.x
      const dy = cell.y - event.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < radius) {
        const weight = event.weight ?? 1
        let influence: number

        switch (falloff) {
          case 'linear':
            influence = (1 - dist / radius) * weight
            break
          case 'exponential':
            influence = Math.exp(-dist / (radius / 3)) * weight
            break
          case 'gaussian':
          default:
            influence = Math.exp(-(dist * dist) / (2 * (radius / 2) ** 2)) * weight
            break
        }

        cell.value += influence
      }
    })
  })

  // Normalize intensities
  const maxValue = Math.max(...cells.map(c => c.value), 0.001)
  cells.forEach(cell => {
    cell.intensity = Math.min(1, cell.value / maxValue)
  })

  return cells
}

// ============================================================================
// Tension Grid Calculations
// ============================================================================

function calculateTensionGrid(payload: TensionGridPayload): HeatmapCell[] {
  const { killEvents, bounds, gridSize, firstBloodWeight } = payload
  const cells: HeatmapCell[] = []
  const cellWidth = bounds.width / gridSize
  const cellHeight = bounds.height / gridSize
  const influenceRadius = Math.min(bounds.width, bounds.height) / gridSize * 3

  // Initialize grid
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      cells.push({
        x: gx * cellWidth + cellWidth / 2,
        y: gy * cellHeight + cellHeight / 2,
        value: 0,
        intensity: 0
      })
    }
  }

  // Accumulate tension from kill events
  killEvents.forEach(event => {
    cells.forEach(cell => {
      const dx = cell.x - event.position.x
      const dy = cell.y - event.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < influenceRadius) {
        // Gaussian falloff
        const weight = Math.exp(-(dist * dist) / (2 * (influenceRadius / 2) ** 2))
        cell.value += weight

        // First bloods create more tension
        if (event.isFirstBlood) {
          cell.value += weight * firstBloodWeight
        }
      }
    })
  })

  // Normalize intensities
  const maxValue = Math.max(...cells.map(c => c.value), 1)
  cells.forEach(cell => {
    cell.intensity = Math.min(1, cell.value / maxValue)
  })

  return cells
}

// ============================================================================
// Flow Field Calculations
// ============================================================================

function calculateFlowField(payload: FlowFieldPayload): FlowVector[] {
  const { positions, bounds, gridSize, influenceRadius } = payload
  const vectors: FlowVector[] = []

  // Create grid of sample points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i / gridSize) * bounds.width + bounds.width / (gridSize * 2)
      const y = (j / gridSize) * bounds.height + bounds.height / (gridSize * 2)

      let totalDx = 0
      let totalDy = 0
      let totalWeight = 0

      // Sample nearby player movements
      positions.forEach(player => {
        for (let k = 1; k < player.positions.length; k++) {
          const prev = player.positions[k - 1]
          const curr = player.positions[k]

          const dx = x - curr.x
          const dy = y - curr.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < influenceRadius) {
            const weight = 1 - dist / influenceRadius
            const moveDx = curr.x - prev.x
            const moveDy = curr.y - prev.y

            totalDx += moveDx * weight
            totalDy += moveDy * weight
            totalWeight += weight
          }
        }
      })

      if (totalWeight > 0) {
        const avgDx = totalDx / totalWeight
        const avgDy = totalDy / totalWeight
        const magnitude = Math.sqrt(avgDx * avgDx + avgDy * avgDy)

        if (magnitude > 0.1) {
          vectors.push({
            position: { x, y },
            direction: {
              x: avgDx / magnitude,
              y: avgDy / magnitude
            },
            magnitude: Math.min(1, magnitude / 10)
          })
        }
      }
    }
  }

  return vectors
}

// ============================================================================
// Statistical Aggregations
// ============================================================================

function calculateAggregation(payload: AggregationPayload): number {
  const { data, operation, options } = payload

  if (data.length === 0) return 0

  switch (operation) {
    case 'sum':
      return data.reduce((a, b) => a + b, 0)

    case 'avg':
      return data.reduce((a, b) => a + b, 0) / data.length

    case 'median': {
      const sorted = [...data].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    }

    case 'std': {
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      const squaredDiffs = data.map(v => Math.pow(v - avg, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length
      return Math.sqrt(variance)
    }

    case 'min':
      return Math.min(...data)

    case 'max':
      return Math.max(...data)

    case 'percentile': {
      const percentile = options?.percentile ?? 50
      const sorted = [...data].sort((a, b) => a - b)
      const index = Math.ceil((percentile / 100) * sorted.length) - 1
      return sorted[Math.max(0, index)]
    }

    default:
      return 0
  }
}

// ============================================================================
// GPU Heatmap Rendering (WebGL)
// ============================================================================

function renderHeatmapGPU(payload: GPUHeatmapPayload): { success: boolean; renderTime: number } {
  const startTime = performance.now()
  const { cells, canvas, colorRamp, intensity } = payload

  if (!state.supportedFeatures.webgl) {
    return { success: false, renderTime: 0 }
  }

  // Get or create WebGL context
  let gl = state.gl
  if (!gl) {
    gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false
    }) as WebGLRenderingContext | null

    if (!gl) {
      return { success: false, renderTime: 0 }
    }

    state.gl = gl
    initializeHeatmapShaders(gl)
  }

  // Render heatmap using WebGL
  renderHeatmapToCanvas(gl, cells, canvas.width, canvas.height, colorRamp, intensity)

  return {
    success: true,
    renderTime: performance.now() - startTime
  }
}

// Vertex shader for heatmap rendering
const HEATMAP_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`

// Fragment shader for heatmap rendering with color ramp
const HEATMAP_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_heatmapTexture;
  uniform vec3 u_colorRamp[5];
  uniform float u_intensity;
  
  vec3 getColor(float value) {
    value = clamp(value * u_intensity, 0.0, 1.0);
    
    float idx = value * 4.0;
    int i = int(floor(idx));
    float t = fract(idx);
    
    if (i >= 4) return u_colorRamp[4];
    
    vec3 c1 = u_colorRamp[i];
    vec3 c2 = u_colorRamp[i + 1];
    return mix(c1, c2, t);
  }
  
  void main() {
    float heatValue = texture2D(u_heatmapTexture, v_texCoord).r;
    vec3 color = getColor(heatValue);
    float alpha = heatValue * u_intensity;
    gl_FragColor = vec4(color, alpha);
  }
`

let heatmapProgram: WebGLProgram | null = null
let heatmapPositionBuffer: WebGLBuffer | null = null
let heatmapTexCoordBuffer: WebGLBuffer | null = null

function initializeHeatmapShaders(gl: WebGLRenderingContext): void {
  // Create shader program
  const vs = createShader(gl, gl.VERTEX_SHADER, HEATMAP_VERTEX_SHADER)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, HEATMAP_FRAGMENT_SHADER)

  if (!vs || !fs) return

  const program = gl.createProgram()
  if (!program) return

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    workerLogger.error('Shader program link failed', { infoLog: gl.getProgramInfoLog(program) || undefined })
    return
  }

  heatmapProgram = program

  // Create buffers
  heatmapPositionBuffer = gl.createBuffer()
  heatmapTexCoordBuffer = gl.createBuffer()

  // Set up fullscreen quad
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])

  gl.bindBuffer(gl.ARRAY_BUFFER, heatmapPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, heatmapTexCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    workerLogger.error('Shader compile error', { infoLog: gl.getShaderInfoLog(shader) || undefined })
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function renderHeatmapToCanvas(
  gl: WebGLRenderingContext,
  cells: HeatmapCell[],
  width: number,
  height: number,
  colorRamp: { r: number; g: number; b: number }[],
  intensity: number
): void {
  if (!heatmapProgram) return

  // Create heatmap texture from cells
  const texture = createHeatmapTexture(gl, cells, width, height)

  // Set up viewport
  gl.viewport(0, 0, width, height)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Enable blending for transparency
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Use shader program
  gl.useProgram(heatmapProgram)

  // Set up position attribute
  const positionLoc = gl.getAttribLocation(heatmapProgram, 'a_position')
  gl.bindBuffer(gl.ARRAY_BUFFER, heatmapPositionBuffer)
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

  // Set up texCoord attribute
  const texCoordLoc = gl.getAttribLocation(heatmapProgram, 'a_texCoord')
  gl.bindBuffer(gl.ARRAY_BUFFER, heatmapTexCoordBuffer)
  gl.enableVertexAttribArray(texCoordLoc)
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0)

  // Bind texture
  const textureLoc = gl.getUniformLocation(heatmapProgram, 'u_heatmapTexture')
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(textureLoc, 0)

  // Set color ramp
  const colorRampLoc = gl.getUniformLocation(heatmapProgram, 'u_colorRamp')
  const colors = new Float32Array(15) // 5 colors * 3 components
  for (let i = 0; i < Math.min(5, colorRamp.length); i++) {
    colors[i * 3] = colorRamp[i].r / 255
    colors[i * 3 + 1] = colorRamp[i].g / 255
    colors[i * 3 + 2] = colorRamp[i].b / 255
  }
  gl.uniform3fv(colorRampLoc, colors)

  // Set intensity
  const intensityLoc = gl.getUniformLocation(heatmapProgram, 'u_intensity')
  gl.uniform1f(intensityLoc, intensity)

  // Draw fullscreen quad
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function createHeatmapTexture(
  gl: WebGLRenderingContext,
  cells: HeatmapCell[],
  width: number,
  height: number
): WebGLTexture {
  // Create a data texture for the heatmap
  const textureSize = 256
  const data = new Uint8Array(textureSize * textureSize)

  // Rasterize cells into texture
  cells.forEach(cell => {
    const tx = Math.floor((cell.x / width) * textureSize)
    const ty = Math.floor((cell.y / height) * textureSize)

    if (tx >= 0 && tx < textureSize && ty >= 0 && ty < textureSize) {
      const idx = ty * textureSize + tx
      data[idx] = Math.max(data[idx], Math.floor(cell.intensity * 255))

      // Add some blur by affecting neighbors
      const blurRadius = 2
      for (let dx = -blurRadius; dx <= blurRadius; dx++) {
        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
          const nx = tx + dx
          const ny = ty + dy
          if (nx >= 0 && nx < textureSize && ny >= 0 && ny < textureSize) {
            const nidx = ny * textureSize + nx
            const falloff = 1 - Math.sqrt(dx * dx + dy * dy) / (blurRadius + 1)
            data[nidx] = Math.max(data[nidx], Math.floor(cell.intensity * 255 * Math.max(0, falloff)))
          }
        }
      }
    }
  })

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, textureSize, textureSize, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  return texture!
}

// ============================================================================
// CPU Fallback Heatmap Rendering
// ============================================================================

function renderHeatmapCPU(payload: GPUHeatmapPayload): { success: boolean; renderTime: number } {
  const startTime = performance.now()
  const { cells, canvas, colorRamp, intensity } = payload

  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) {
    return { success: false, renderTime: 0 }
  }

  // Clear canvas
  ctx2d.clearRect(0, 0, canvas.width, canvas.height)

  // Render cells
  cells.forEach(cell => {
    const colorIndex = Math.floor(cell.intensity * (colorRamp.length - 1))
    const color = colorRamp[Math.min(colorIndex, colorRamp.length - 1)]

    const alpha = cell.intensity * intensity
    ctx2d.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`

    const radius = 20 * (0.5 + cell.intensity * 0.5)
    ctx2d.beginPath()
    ctx2d.arc(cell.x, cell.y, radius, 0, Math.PI * 2)
    ctx2d.fill()
  })

  return {
    success: true,
    renderTime: performance.now() - startTime
  }
}

// ============================================================================
// Performance Tracking
// ============================================================================

function recordPerformance(action: string, duration: number): void {
  const current = state.performanceMetrics.get(action) || {
    count: 0,
    totalTime: 0,
    avgTime: 0,
    maxTime: 0
  }

  current.count++
  current.totalTime += duration
  current.avgTime = current.totalTime / current.count
  current.maxTime = Math.max(current.maxTime, duration)

  state.performanceMetrics.set(action, current)
}

function getStats(): Record<string, unknown> {
  const stats: Record<string, unknown> = {}

  state.performanceMetrics.forEach((metrics, action) => {
    stats[action] = {
      count: metrics.count,
      avgTime: Math.round(metrics.avgTime * 100) / 100,
      maxTime: Math.round(metrics.maxTime * 100) / 100,
      totalTime: Math.round(metrics.totalTime * 100) / 100
    }
  })

  return {
    metrics: stats,
    features: state.supportedFeatures,
    uptime: performance.now()
  }
}

// ============================================================================
// Message Handler
// ============================================================================

function sendResponse(response: LensWorkerResponse): void {
  ctx.postMessage(response)
}

ctx.onmessage = (event: MessageEvent<LensWorkerMessage>) => {
  const { id, action, payload, timestamp } = event.data
  const startTime = performance.now()

  try {
    let result: unknown

    switch (action) {
      case 'INIT':
        initialize()
        return

      case 'CALCULATE_HEATMAP':
        result = calculateHeatmap(payload as HeatmapCalculationPayload)
        break

      case 'CALCULATE_TENSION_GRID':
        result = calculateTensionGrid(payload as TensionGridPayload)
        break

      case 'CALCULATE_FLOW_FIELD':
        result = calculateFlowField(payload as FlowFieldPayload)
        break

      case 'CALCULATE_AGGREGATION':
        result = calculateAggregation(payload as AggregationPayload)
        break

      case 'RENDER_HEATMAP_GPU':
        result = renderHeatmapGPU(payload as GPUHeatmapPayload)
        break

      case 'RENDER_HEATMAP_CPU':
        result = renderHeatmapCPU(payload as GPUHeatmapPayload)
        break

      case 'GET_STATS':
        result = getStats()
        break

      case 'RESET':
        state.performanceMetrics.clear()
        state.heatmapTextureCache.clear()
        result = { success: true }
        break

      case 'DISPOSE':
        if (state.gl) {
          // Clean up WebGL resources
          const gl = state.gl
          gl.deleteProgram(heatmapProgram)
          gl.deleteBuffer(heatmapPositionBuffer)
          gl.deleteBuffer(heatmapTexCoordBuffer)
          state.heatmapTextureCache.forEach(texture => {
            if (texture) gl.deleteTexture(texture)
          })
          state.gl = null
        }
        result = { success: true }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    recordPerformance(action, duration)

    sendResponse({
      id,
      action,
      success: true,
      data: result,
      timing: {
        startTime,
        endTime,
        duration
      }
    })
  } catch (error) {
    sendResponse({
      id,
      action,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ============================================================================
// Worker Error Handling
// ============================================================================

ctx.onerror = (error: ErrorEvent) => {
  workerLogger.error('Worker error', { 
    message: error.message,
    filename: error.filename,
    lineno: error.lineno,
  })

  sendResponse({
    id: 'error',
    action: 'INIT',
    success: false,
    error: `Worker error: ${error.message}`
  })
}

// Send ready signal on load
sendResponse({
  id: 'ready',
  action: 'INIT',
  success: true,
  data: { status: 'loaded' }
})

export {}
