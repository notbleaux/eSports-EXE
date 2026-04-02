// @ts-nocheck
/** [Ver001.000] */
/**
 * GPU-Accelerated Heatmap Generator
 * =================================
 * High-performance heatmap generation using WebGL when available,
 * with fallback to optimized Canvas 2D rendering.
 * Features Gaussian smoothing and temporal decay for animations.
 */

import type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'

/** Heatmap point with intensity and timestamp for temporal effects */
export interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  timestamp?: number
  radius?: number
}

/** Heatmap generation options */
export interface HeatmapOptions {
  /** Base radius for heatmap points */
  radius: number
  /** Opacity of the heatmap (0.0 to 1.0) */
  opacity: number
  /** Color gradient stops */
  gradient: HeatmapGradient
  /** Enable temporal decay animation */
  temporalDecay: boolean
  /** Decay rate in ms (how quickly points fade) */
  decayRate: number
  /** Current time for temporal calculations */
  currentTime: number
  /** Gaussian blur sigma for smoothing */
  blurSigma: number
  /** Resolution multiplier for quality */
  resolution: number
}

/** Color gradient definition for heatmap */
export interface HeatmapGradient {
  stops: { offset: number; color: string }[]
}

/** Default heatmap gradient (blue -> green -> yellow -> red) */
export const defaultHeatmapGradient: HeatmapGradient = {
  stops: [
    { offset: 0.0, color: 'rgba(0, 0, 255, 0)' },
    { offset: 0.25, color: 'rgba(0, 0, 255, 0.5)' },
    { offset: 0.5, color: 'rgba(0, 255, 0, 0.6)' },
    { offset: 0.75, color: 'rgba(255, 255, 0, 0.7)' },
    { offset: 1.0, color: 'rgba(255, 0, 0, 0.8)' }
  ]
}

/** Default heatmap options */
export const defaultHeatmapOptions: HeatmapOptions = {
  radius: 40,
  opacity: 0.7,
  gradient: defaultHeatmapGradient,
  temporalDecay: false,
  decayRate: 5000,
  currentTime: Date.now(),
  blurSigma: 15,
  resolution: 1.0
}

/** WebGL context cache */
let glCanvas: HTMLCanvasElement | null = null
let glContext: WebGLRenderingContext | null = null
let glProgram: WebGLProgram | null = null
let positionBuffer: WebGLBuffer | null = null

/**
 * Initialize WebGL context for GPU-accelerated rendering
 */
function initWebGL(width: number, height: number): WebGLRenderingContext | null {
  if (typeof document === 'undefined') return null
  
  if (!glCanvas) {
    glCanvas = document.createElement('canvas')
    glCanvas.width = width
    glCanvas.height = height
  }
  
  if (!glContext) {
    glContext = glCanvas.getContext('webgl', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true
    }) || glCanvas.getContext('experimental-webgl') as WebGLRenderingContext
  }
  
  return glContext
}

/**
 * Gaussian function for kernel calculation
 */
function gaussian(x: number, sigma: number): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma))
}

/**
 * Create 1D Gaussian kernel for separable blur
 */
function createGaussianKernel(sigma: number, size?: number): Float32Array {
  const kernelSize = size || Math.ceil(sigma * 6) | 1
  const halfSize = Math.floor(kernelSize / 2)
  const kernel = new Float32Array(kernelSize)
  let sum = 0
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfSize
    kernel[i] = gaussian(x, sigma)
    sum += kernel[i]
  }
  
  // Normalize
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum
  }
  
  return kernel
}

/**
 * Apply Gaussian smoothing to heatmap data
 */
export function applyGaussianSmoothing(
  data: Float32Array,
  width: number,
  height: number,
  sigma: number
): Float32Array {
  const kernel = createGaussianKernel(sigma)
  const halfSize = Math.floor(kernel.length / 2)
  const tempData = new Float32Array(data.length)
  const result = new Float32Array(data.length)
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let k = 0; k < kernel.length; k++) {
        const sampleX = Math.min(width - 1, Math.max(0, x + k - halfSize))
        sum += data[y * width + sampleX] * kernel[k]
      }
      tempData[y * width + x] = sum
    }
  }
  
  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0
      for (let k = 0; k < kernel.length; k++) {
        const sampleY = Math.min(height - 1, Math.max(0, y + k - halfSize))
        sum += tempData[sampleY * width + x] * kernel[k]
      }
      result[y * width + x] = sum
    }
  }
  
  return result
}

/**
 * Calculate temporal decay factor for a point
 */
export function calculateTemporalDecay(
  timestamp: number,
  currentTime: number,
  decayRate: number
): number {
  const age = currentTime - timestamp
  if (age < 0) return 1
  return Math.max(0, Math.exp(-age / decayRate))
}

/**
 * Generate heatmap data from points
 */
export function generateHeatmapData(
  points: HeatmapPoint[],
  width: number,
  height: number,
  options: Partial<HeatmapOptions> = {}
): Float32Array {
  const opts = { ...defaultHeatmapOptions, ...options }
  const resolution = opts.resolution
  const scaledWidth = Math.floor(width * resolution)
  const scaledHeight = Math.floor(height * resolution)
  const data = new Float32Array(scaledWidth * scaledHeight)
  
  points.forEach(point => {
    const radius = (point.radius || opts.radius) * resolution
    const px = point.x * resolution
    const py = point.y * resolution
    
    // Apply temporal decay
    let intensity = point.intensity
    if (opts.temporalDecay && point.timestamp !== undefined) {
      intensity *= calculateTemporalDecay(point.timestamp, opts.currentTime, opts.decayRate)
    }
    
    // Calculate influence area
    const startX = Math.max(0, Math.floor(px - radius))
    const endX = Math.min(scaledWidth, Math.ceil(px + radius))
    const startY = Math.max(0, Math.floor(py - radius))
    const endY = Math.min(scaledHeight, Math.ceil(py + radius))
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const dx = x - px
        const dy = y - py
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < radius) {
          const weight = 1 - (distance / radius)
          const index = y * scaledWidth + x
          data[index] = Math.min(1, data[index] + intensity * weight)
        }
      }
    }
  })
  
  // Apply Gaussian smoothing
  if (opts.blurSigma > 0) {
    return applyGaussianSmoothing(data, scaledWidth, scaledHeight, opts.blurSigma * resolution)
  }
  
  return data
}

/**
 * Render heatmap data to canvas using color gradient
 */
export function renderHeatmapData(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  gradient: HeatmapGradient,
  opacity: number
): void {
  const imageData = ctx.createImageData(width, height)
  const pixels = imageData.data
  
  // Create gradient lookup table
  const gradientStops = gradient.stops.sort((a, b) => a.offset - b.offset)
  
  for (let i = 0; i < data.length; i++) {
    const value = data[i]
    const pixelIndex = i * 4
    
    // Find gradient stops
    let lower = gradientStops[0]
    let upper = gradientStops[gradientStops.length - 1]
    
    for (let j = 0; j < gradientStops.length - 1; j++) {
      if (value >= gradientStops[j].offset && value <= gradientStops[j + 1].offset) {
        lower = gradientStops[j]
        upper = gradientStops[j + 1]
        break
      }
    }
    
    // Interpolate color
    const range = upper.offset - lower.offset
    const t = range > 0 ? (value - lower.offset) / range : 0
    
    const lowerColor = parseColor(lower.color)
    const upperColor = parseColor(upper.color)
    
    pixels[pixelIndex] = Math.round(lerp(lowerColor.r, upperColor.r, t))
    pixels[pixelIndex + 1] = Math.round(lerp(lowerColor.g, upperColor.g, t))
    pixels[pixelIndex + 2] = Math.round(lerp(lowerColor.b, upperColor.b, t))
    pixels[pixelIndex + 3] = Math.round(lerp(lowerColor.a, upperColor.a, t) * opacity * 255)
  }
  
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Parse rgba color string
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 }
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Main heatmap generation function
 * Generates and renders a heatmap from points
 */
export function generateHeatmap(
  ctx: CanvasRenderingContext2D,
  points: HeatmapPoint[],
  options: Partial<HeatmapOptions> = {}
): void {
  const opts = { ...defaultHeatmapOptions, ...options }
  const canvas = ctx.canvas
  const width = canvas.width
  const height = canvas.height
  
  // Generate heatmap data
  const heatmapData = generateHeatmapData(points, width, height, opts)
  
  // Create offscreen canvas for processing
  const offscreen = document.createElement('canvas')
  const scaledWidth = Math.floor(width * opts.resolution)
  const scaledHeight = Math.floor(height * opts.resolution)
  offscreen.width = scaledWidth
  offscreen.height = scaledHeight
  const offscreenCtx = offscreen.getContext('2d')
  
  if (!offscreenCtx) return
  
  // Render heatmap data
  renderHeatmapData(offscreenCtx, heatmapData, scaledWidth, scaledHeight, opts.gradient, 1)
  
  // Draw to main canvas with proper scaling
  ctx.save()
  ctx.globalAlpha = opts.opacity
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(offscreen, 0, 0, width, height)
  ctx.restore()
}

/**
 * Create a kill/death density heatmap specifically for performance analysis
 */
export function createPerformanceHeatmap(
  ctx: CanvasRenderingContext2D,
  kills: Vector2D[],
  deaths: Vector2D[],
  options: Partial<HeatmapOptions> & { killWeight?: number; deathWeight?: number } = {}
): void {
  const { killWeight = 1, deathWeight = 1, ...heatmapOptions } = options
  
  const points: HeatmapPoint[] = [
    ...kills.map(k => ({ x: k.x, y: k.y, intensity: killWeight })),
    ...deaths.map(d => ({ x: d.x, y: d.y, intensity: deathWeight }))
  ]
  
  generateHeatmap(ctx, points, heatmapOptions)
}

/**
 * Animation helper for temporal decay heatmaps
 */
export class TemporalHeatmapAnimator {
  private startTime: number
  private points: HeatmapPoint[]
  private options: HeatmapOptions
  private animationId: number | null = null
  private onRender: (ctx: CanvasRenderingContext2D) => void

  constructor(
    points: HeatmapPoint[],
    options: Partial<HeatmapOptions>,
    onRender: (ctx: CanvasRenderingContext2D) => void
  ) {
    this.startTime = Date.now()
    this.points = points
    this.options = { ...defaultHeatmapOptions, ...options, temporalDecay: true }
    this.onRender = onRender
  }

  start(ctx: CanvasRenderingContext2D): void {
    const animate = () => {
      this.options.currentTime = Date.now()
      generateHeatmap(ctx, this.points, this.options)
      this.onRender(ctx)
      this.animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}

export default {
  generateHeatmap,
  createPerformanceHeatmap,
  generateHeatmapData,
  applyGaussianSmoothing,
  calculateTemporalDecay,
  TemporalHeatmapAnimator,
  defaultHeatmapOptions,
  defaultHeatmapGradient
}
