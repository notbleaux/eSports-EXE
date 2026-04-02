// @ts-nocheck
/** [Ver001.000]
 * GPU-Accelerated Heatmap Renderer for NJZiteGeisTe Platform
 * WebGL-based heatmap rendering with CPU fallback
 * 
 * Features:
 * - WebGL 1.0/2.0 heatmap renderer
 * - GPU aggregation shaders
 * - Automatic fallback to CPU for unsupported devices
 * - Performance profiling hooks
 * - Color ramp customization
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

export interface GPUHeatmapOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement | OffscreenCanvas
  /** Heatmap cell data */
  cells: HeatmapCell[]
  /** Color ramp for heatmap gradient */
  colorRamp?: HeatmapColorRamp
  /** Global intensity multiplier */
  intensity?: number
  /** Radius multiplier for cell rendering */
  radius?: number
  /** Enable GPU rendering (auto-fallback if unsupported) */
  useGPU?: boolean
  /** Blend mode for rendering */
  blendMode?: GlobalCompositeOperation
}

export interface HeatmapColorStop {
  position: number // 0.0 to 1.0
  color: { r: number; g: number; b: number; a: number }
}

export type HeatmapColorRamp = HeatmapColorStop[]

export interface GPUHeatmapResult {
  success: boolean
  renderTime: number
  method: 'webgl' | 'webgl2' | 'cpu'
  drawCalls: number
}

export interface GPUCapabilities {
  webgl: boolean
  webgl2: boolean
  maxTextureSize: number
  floatTextures: boolean
  instancing: boolean
}

// ============================================================================
// Default Color Ramps
// ============================================================================

export const DEFAULT_COLOR_RAMPS = {
  /** Classic heatmap: black → red → yellow → white */
  heat: [
    { position: 0.0, color: { r: 0, g: 0, b: 0, a: 0 } },
    { position: 0.25, color: { r: 64, g: 0, b: 0, a: 0.5 } },
    { position: 0.5, color: { r: 255, g: 0, b: 0, a: 0.7 } },
    { position: 0.75, color: { r: 255, g: 255, b: 0, a: 0.8 } },
    { position: 1.0, color: { r: 255, g: 255, b: 255, a: 0.9 } }
  ] as HeatmapColorRamp,

  /** Cool blue gradient */
  cool: [
    { position: 0.0, color: { r: 0, g: 0, b: 64, a: 0 } },
    { position: 0.5, color: { r: 0, g: 128, b: 255, a: 0.6 } },
    { position: 1.0, color: { r: 128, g: 255, b: 255, a: 0.9 } }
  ] as HeatmapColorRamp,

  /** Tension/Combat red gradient */
  tension: [
    { position: 0.0, color: { r: 40, g: 0, b: 0, a: 0 } },
    { position: 0.3, color: { r: 139, g: 0, b: 0, a: 0.4 } },
    { position: 0.6, color: { r: 220, g: 38, b: 38, a: 0.7 } },
    { position: 0.85, color: { r: 255, g: 100, b: 100, a: 0.85 } },
    { position: 1.0, color: { r: 255, g: 200, b: 200, a: 0.95 } }
  ] as HeatmapColorRamp,

  /** Viridis-like perceptually uniform */
  viridis: [
    { position: 0.0, color: { r: 68, g: 1, b: 84, a: 0.3 } },
    { position: 0.25, color: { r: 59, g: 82, b: 139, a: 0.5 } },
    { position: 0.5, color: { r: 33, g: 144, b: 140, a: 0.7 } },
    { position: 0.75, color: { r: 94, g: 201, b: 98, a: 0.8 } },
    { position: 1.0, color: { r: 253, g: 231, b: 37, a: 0.9 } }
  ] as HeatmapColorRamp,

  /** Monochrome grayscale */
  grayscale: [
    { position: 0.0, color: { r: 0, g: 0, b: 0, a: 0 } },
    { position: 0.5, color: { r: 128, g: 128, b: 128, a: 0.5 } },
    { position: 1.0, color: { r: 255, g: 255, b: 255, a: 0.9 } }
  ] as HeatmapColorRamp
}

// ============================================================================
// GPU Capability Detection
// ============================================================================

export function detectGPUCapabilities(): GPUCapabilities {
  if (typeof window === 'undefined') {
    return {
      webgl: false,
      webgl2: false,
      maxTextureSize: 0,
      floatTextures: false,
      instancing: false
    }
  }

  const canvas = document.createElement('canvas')
  
  // Try WebGL2 first
  let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
  if (gl) {
    return {
      webgl: true,
      webgl2: true,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      floatTextures: true,
      instancing: true
    }
  }

  // Fall back to WebGL1
  gl = canvas.getContext('webgl') as WebGLRenderingContext | null
  if (!gl) {
    gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  }

  if (gl) {
    const ext = gl.getExtension('OES_texture_float')
    return {
      webgl: true,
      webgl2: false,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      floatTextures: !!ext,
      instancing: false
    }
  }

  return {
    webgl: false,
    webgl2: false,
    maxTextureSize: 0,
    floatTextures: false,
    instancing: false
  }
}

// Global capabilities cache
let cachedCapabilities: GPUCapabilities | null = null

export function getGPUCapabilities(): GPUCapabilities {
  if (!cachedCapabilities) {
    cachedCapabilities = detectGPUCapabilities()
  }
  return cachedCapabilities
}

// ============================================================================
// Shader Sources
// ============================================================================

// Vertex shader for point-based heatmap rendering
const POINT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_intensity;
  
  uniform vec2 u_resolution;
  uniform float u_pointSize;
  uniform float u_radius;
  
  varying float v_intensity;
  
  void main() {
    vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    gl_PointSize = u_pointSize * (0.5 + a_intensity * 0.5);
    v_intensity = a_intensity;
  }
`

// Fragment shader for circular heat points
const POINT_FRAGMENT_SHADER = `
  precision mediump float;
  varying float v_intensity;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Gaussian falloff from center
    float alpha = exp(-dist * dist * 8.0) * v_intensity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

// Vertex shader for fullscreen color ramp application
const RAMP_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`

// Fragment shader for color ramp application
const RAMP_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_heatmapTexture;
  uniform vec3 u_colorRamp[5];
  uniform float u_rampSize;
  uniform float u_intensity;
  
  vec3 sampleColorRamp(float value) {
    value = clamp(value * u_intensity, 0.0, 1.0);
    float idx = value * (u_rampSize - 1.0);
    int i = int(floor(idx));
    float t = fract(idx);
    
    if (i >= int(u_rampSize) - 1) return u_colorRamp[int(u_rampSize) - 1];
    
    vec3 c1 = u_colorRamp[i];
    vec3 c2 = u_colorRamp[i + 1];
    return mix(c1, c2, t);
  }
  
  void main() {
    float heatValue = texture2D(u_heatmapTexture, v_texCoord).r;
    vec3 color = sampleColorRamp(heatValue);
    float alpha = min(1.0, heatValue * u_intensity * 2.0);
    gl_FragColor = vec4(color, alpha);
  }
`

// ============================================================================
// WebGL Heatmap Renderer
// ============================================================================

class WebGLHeatmapRenderer {
  private gl: WebGLRenderingContext
  private pointProgram: WebGLProgram
  private rampProgram: WebGLProgram
  private framebuffer: WebGLFramebuffer | null = null
  private heatmapTexture: WebGLTexture | null = null
  private renderTexture: WebGLTexture | null = null
  private pointBuffer: WebGLBuffer
  private intensityBuffer: WebGLBuffer
  private quadBuffer: WebGLBuffer
  private texCoordBuffer: WebGLBuffer
  private textureSize = 512

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    
    // Initialize shaders
    this.pointProgram = this.createProgram(POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER)
    this.rampProgram = this.createProgram(RAMP_VERTEX_SHADER, RAMP_FRAGMENT_SHADER)
    
    // Initialize buffers
    this.pointBuffer = gl.createBuffer()!
    this.intensityBuffer = gl.createBuffer()!
    this.quadBuffer = gl.createBuffer()!
    this.texCoordBuffer = gl.createBuffer()!
    
    // Set up fullscreen quad
    this.setupQuad()
    
    // Initialize textures
    this.initializeTextures()
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`)
    }

    return shader
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const gl = this.gl
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource)
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource)

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`)
    }

    return program
  }

  private setupQuad(): void {
    const gl = this.gl
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
  }

  private initializeTextures(): void {
    const gl = this.gl

    // Create heatmap accumulation texture
    this.heatmapTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.heatmapTexture)
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE,
      this.textureSize, this.textureSize, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // Create framebuffer
    this.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.heatmapTexture, 0
    )
  }

  render(
    cells: HeatmapCell[],
    width: number,
    height: number,
    colorRamp: HeatmapColorRamp,
    intensity: number
  ): { drawCalls: number; renderTime: number } {
    const gl = this.gl
    const startTime = performance.now()
    let drawCalls = 0

    // Step 1: Accumulate heat values to offscreen texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.viewport(0, 0, this.textureSize, this.textureSize)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Enable additive blending for heat accumulation
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)

    // Render points
    this.renderPoints(cells, width, height)
    drawCalls++

    // Step 2: Apply color ramp and render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, width, height)

    // Standard alpha blending for output
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.applyColorRamp(colorRamp, intensity)
    drawCalls++

    return {
      drawCalls,
      renderTime: performance.now() - startTime
    }
  }

  private renderPoints(cells: HeatmapCell[], width: number, height: number): void {
    const gl = this.gl
    const program = this.pointProgram

    gl.useProgram(program)

    // Prepare position data
    const positions = new Float32Array(cells.length * 2)
    const intensities = new Float32Array(cells.length)

    cells.forEach((cell, i) => {
      positions[i * 2] = cell.x
      positions[i * 2 + 1] = cell.y
      intensities[i] = cell.intensity
    })

    // Set up position attribute
    const positionLoc = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    // Set up intensity attribute
    const intensityLoc = gl.getAttribLocation(program, 'a_intensity')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.intensityBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, intensities, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(intensityLoc)
    gl.vertexAttribPointer(intensityLoc, 1, gl.FLOAT, false, 0, 0)

    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    const pointSizeLoc = gl.getUniformLocation(program, 'u_pointSize')

    gl.uniform2f(resolutionLoc, width, height)
    gl.uniform1f(pointSizeLoc, 40) // Base point size

    // Draw points
    gl.drawArrays(gl.POINTS, 0, cells.length)
  }

  private applyColorRamp(colorRamp: HeatmapColorRamp, intensity: number): void {
    const gl = this.gl
    const program = this.rampProgram

    gl.useProgram(program)

    // Set up position attribute
    const positionLoc = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    // Set up texCoord attribute
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.enableVertexAttribArray(texCoordLoc)
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0)

    // Bind heatmap texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.heatmapTexture)
    const textureLoc = gl.getUniformLocation(program, 'u_heatmapTexture')
    gl.uniform1i(textureLoc, 0)

    // Set color ramp (limit to 5 colors for shader)
    const colors = new Float32Array(15)
    const limitedRamp = colorRamp.slice(0, 5)
    limitedRamp.forEach((stop, i) => {
      colors[i * 3] = stop.color.r / 255
      colors[i * 3 + 1] = stop.color.g / 255
      colors[i * 3 + 2] = stop.color.b / 255
    })

    const rampLoc = gl.getUniformLocation(program, 'u_colorRamp')
    gl.uniform3fv(rampLoc, colors)

    const rampSizeLoc = gl.getUniformLocation(program, 'u_rampSize')
    gl.uniform1f(rampSizeLoc, limitedRamp.length)

    const intensityLoc = gl.getUniformLocation(program, 'u_intensity')
    gl.uniform1f(intensityLoc, intensity)

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose(): void {
    const gl = this.gl
    gl.deleteProgram(this.pointProgram)
    gl.deleteProgram(this.rampProgram)
    gl.deleteBuffer(this.pointBuffer)
    gl.deleteBuffer(this.intensityBuffer)
    gl.deleteBuffer(this.quadBuffer)
    gl.deleteBuffer(this.texCoordBuffer)
    gl.deleteTexture(this.heatmapTexture)
    gl.deleteFramebuffer(this.framebuffer)
  }
}

// ============================================================================
// CPU Fallback Renderer
// ============================================================================

class CPUHeatmapRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    cells: HeatmapCell[],
    colorRamp: HeatmapColorRamp,
    intensity: number
  ): { drawCalls: number; renderTime: number } {
    const startTime = performance.now()

    ctx.save()
    ctx.globalCompositeOperation = 'screen'

    // Sort cells by intensity for better visual layering
    const sortedCells = [...cells].sort((a, b) => a.intensity - b.intensity)

    sortedCells.forEach(cell => {
      // Sample color from ramp
      const color = this.sampleColorRamp(cell.intensity, colorRamp)
      const alpha = cell.intensity * intensity

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`

      const radius = 30 * (0.5 + cell.intensity * 0.5)

      // Create radial gradient for smooth falloff
      const gradient = ctx.createRadialGradient(
        cell.x, cell.y, 0,
        cell.x, cell.y, radius
      )
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`)
      gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cell.x, cell.y, radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()

    return {
      drawCalls: cells.length,
      renderTime: performance.now() - startTime
    }
  }

  private sampleColorRamp(intensity: number, ramp: HeatmapColorRamp): { r: number; g: number; b: number } {
    // Find the two stops to interpolate between
    for (let i = 0; i < ramp.length - 1; i++) {
      const stop1 = ramp[i]
      const stop2 = ramp[i + 1]

      if (intensity >= stop1.position && intensity <= stop2.position) {
        const t = (intensity - stop1.position) / (stop2.position - stop1.position)
        return {
          r: Math.round(stop1.color.r + (stop2.color.r - stop1.color.r) * t),
          g: Math.round(stop1.color.g + (stop2.color.g - stop1.color.g) * t),
          b: Math.round(stop1.color.b + (stop2.color.b - stop1.color.b) * t)
        }
      }
    }

    // Return last stop if intensity is at maximum
    const lastStop = ramp[ramp.length - 1]
    return { r: lastStop.color.r, g: lastStop.color.g, b: lastStop.color.b }
  }
}

// ============================================================================
// Main Renderer
// ============================================================================

let webglRenderer: WebGLHeatmapRenderer | null = null
const cpuRenderer = new CPUHeatmapRenderer()

/**
 * Render a heatmap using GPU acceleration with automatic CPU fallback
 */
export function renderGPUHeatmap(options: GPUHeatmapOptions): GPUHeatmapResult {
  const {
    canvas,
    cells,
    colorRamp = DEFAULT_COLOR_RAMPS.tension,
    intensity = 1.0,
    useGPU = true
  } = options

  // Try WebGL first if enabled
  if (useGPU) {
    const caps = getGPUCapabilities()

    if (caps.webgl && canvas instanceof HTMLCanvasElement) {
      try {
        // Lazy initialize WebGL renderer
        if (!webglRenderer) {
          const gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: false
          }) as WebGLRenderingContext | null

          if (gl) {
            webglRenderer = new WebGLHeatmapRenderer(gl)
          }
        }

        if (webglRenderer) {
          const result = webglRenderer.render(
            cells,
            canvas.width,
            canvas.height,
            colorRamp,
            intensity
          )

          return {
            success: true,
            renderTime: result.renderTime,
            method: caps.webgl2 ? 'webgl2' : 'webgl',
            drawCalls: result.drawCalls
          }
        }
      } catch (error) {
        console.warn('WebGL heatmap rendering failed, falling back to CPU:', error)
      }
    }
  }

  // CPU fallback
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) {
    return {
      success: false,
      renderTime: 0,
      method: 'cpu',
      drawCalls: 0
    }
  }

  // Clear canvas
  ctx2d.clearRect(0, 0, canvas.width, canvas.height)

  const result = cpuRenderer.render(ctx2d, cells, colorRamp, intensity)

  return {
    success: true,
    renderTime: result.renderTime,
    method: 'cpu',
    drawCalls: result.drawCalls
  }
}

/**
 * Dispose GPU resources
 */
export function disposeGPUHeatmap(): void {
  if (webglRenderer) {
    webglRenderer.dispose()
    webglRenderer = null
  }
}

/**
 * Create a custom color ramp
 */
export function createColorRamp(stops: { pos: number; r: number; g: number; b: number; a?: number }[]): HeatmapColorRamp {
  return stops.map(stop => ({
    position: stop.pos,
    color: {
      r: stop.r,
      g: stop.g,
      b: stop.b,
      a: stop.a ?? 1.0
    }
  })).sort((a, b) => a.position - b.position)
}

/**
 * Pre-calculate heatmap cells from events
 */
export function calculateHeatmapCells(
  events: Array<{ x: number; y: number; weight?: number }>,
  bounds: { width: number; height: number },
  options: {
    gridSize?: number
    radius?: number
    falloff?: 'gaussian' | 'linear' | 'exponential'
  } = {}
): HeatmapCell[] {
  const {
    gridSize = 20,
    radius = 100,
    falloff = 'gaussian'
  } = options

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
// Performance Profiling
// ============================================================================

interface HeatmapPerformanceMetrics {
  renderCount: number
  totalRenderTime: number
  avgRenderTime: number
  maxRenderTime: number
  gpuRenders: number
  cpuRenders: number
}

const metrics: HeatmapPerformanceMetrics = {
  renderCount: 0,
  totalRenderTime: 0,
  avgRenderTime: 0,
  maxRenderTime: 0,
  gpuRenders: 0,
  cpuRenders: 0
}

export function recordHeatmapPerformance(renderTime: number, method: 'webgl' | 'webgl2' | 'cpu'): void {
  metrics.renderCount++
  metrics.totalRenderTime += renderTime
  metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount
  metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime)

  if (method === 'webgl' || method === 'webgl2') {
    metrics.gpuRenders++
  } else {
    metrics.cpuRenders++
  }
}

export function getHeatmapPerformanceMetrics(): HeatmapPerformanceMetrics {
  return { ...metrics }
}

export function resetHeatmapPerformanceMetrics(): void {
  metrics.renderCount = 0
  metrics.totalRenderTime = 0
  metrics.avgRenderTime = 0
  metrics.maxRenderTime = 0
  metrics.gpuRenders = 0
  metrics.cpuRenders = 0
}

export default {
  renderGPUHeatmap,
  disposeGPUHeatmap,
  calculateHeatmapCells,
  createColorRamp,
  getGPUCapabilities,
  DEFAULT_COLOR_RAMPS,
  recordHeatmapPerformance,
  getHeatmapPerformanceMetrics,
  resetHeatmapPerformanceMetrics
}
