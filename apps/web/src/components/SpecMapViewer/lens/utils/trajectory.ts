// @ts-nocheck
/** [Ver001.000] */
/**
 * Trajectory Renderer
 * ===================
 * Advanced path rendering with fade effects, predictive trajectory
 * visualization, and Level-of-Detail (LOD) optimization for performance.
 */

import type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'

/** Trajectory point with metadata */
export interface TrajectoryPoint {
  x: number
  y: number
  timestamp: number
  velocity?: Vector2D
  certainty?: number // 0.0 to 1.0, for predicted points
}

/** Trajectory segment for efficient rendering */
export interface TrajectorySegment {
  start: TrajectoryPoint
  end: TrajectoryPoint
  distance: number
  angle: number
}

/** Trajectory rendering options */
export interface TrajectoryOptions {
  /** Path color */
  color: string
  /** Path width in pixels */
  width: number
  /** Global opacity (0.0 to 1.0) */
  opacity: number
  /** Enable fade effect along path */
  fade: boolean
  /** Fade direction: 'start', 'end', 'both' */
  fadeDirection: 'start' | 'end' | 'both'
  /** Fade intensity (0.0 to 1.0) */
  fadeIntensity: number
  /** Enable glow effect */
  glow: boolean
  /** Glow color */
  glowColor: string
  /** Glow radius */
  glowRadius: number
  /** Path style: 'solid', 'dashed', 'dotted' */
  style: 'solid' | 'dashed' | 'dotted'
  /** Dash pattern for dashed lines */
  dashPattern: number[]
  /** Enable predictive trajectory extension */
  predictive: boolean
  /** Number of predictive points to render */
  predictivePoints: number
  /** Color for predictive portion */
  predictiveColor: string
  /** Line cap style */
  lineCap: CanvasLineCap
  /** Line join style */
  lineJoin: CanvasLineJoin
}

/** Default trajectory options */
export const defaultTrajectoryOptions: TrajectoryOptions = {
  color: 'rgb(59, 130, 246)',
  width: 3,
  opacity: 0.8,
  fade: true,
  fadeDirection: 'end',
  fadeIntensity: 0.7,
  glow: false,
  glowColor: 'rgba(59, 130, 246, 0.3)',
  glowRadius: 10,
  style: 'solid',
  dashPattern: [5, 5],
  predictive: false,
  predictivePoints: 5,
  predictiveColor: 'rgba(156, 163, 175, 0.5)',
  lineCap: 'round',
  lineJoin: 'round'
}

/** LOD configuration for performance */
export interface LODConfig {
  /** Distance thresholds for LOD levels */
  thresholds: number[]
  /** Simplification factors for each level */
  simplificationFactors: number[]
  /** Minimum points to maintain */
  minPoints: number
}

/** Default LOD configuration */
export const defaultLODConfig: LODConfig = {
  thresholds: [100, 300, 600],
  simplificationFactors: [1, 2, 4, 8],
  minPoints: 10
}

/**
 * Calculate distance between two points
 */
function distance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate between two points
 */
function lerpPoint(a: TrajectoryPoint, b: TrajectoryPoint, t: number): TrajectoryPoint {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    timestamp: lerp(a.timestamp, b.timestamp, t)
  }
}

/**
 * Douglas-Peucker algorithm for path simplification
 */
export function simplifyPath(
  points: TrajectoryPoint[],
  epsilon: number
): TrajectoryPoint[] {
  if (points.length <= 2) return points

  // Find point with maximum distance from line between first and last
  let maxDist = 0
  let maxIndex = 0

  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToLineDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon)
    const right = simplifyPath(points.slice(maxIndex), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function pointToLineDistance(
  point: TrajectoryPoint,
  lineStart: TrajectoryPoint,
  lineEnd: TrajectoryPoint
): number {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy

  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Apply LOD simplification based on view distance
 */
export function applyLOD(
  points: TrajectoryPoint[],
  viewDistance: number,
  config: LODConfig = defaultLODConfig
): TrajectoryPoint[] {
  // Determine LOD level based on view distance
  let lodLevel = 0
  for (let i = 0; i < config.thresholds.length; i++) {
    if (viewDistance > config.thresholds[i]) {
      lodLevel = i + 1
    }
  }

  const factor = config.simplificationFactors[Math.min(lodLevel, config.simplificationFactors.length - 1)]
  
  if (factor === 1) return points

  // Simplify by sampling every nth point
  const simplified: TrajectoryPoint[] = []
  for (let i = 0; i < points.length; i += factor) {
    simplified.push(points[i])
  }

  // Always include last point
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1])
  }

  // Ensure minimum points
  if (simplified.length < config.minPoints && points.length >= config.minPoints) {
    return applyLOD(points, viewDistance * 0.5, config)
  }

  return simplified
}

/**
 * Generate predictive trajectory points based on current velocity
 */
export function generatePredictiveTrajectory(
  lastPoint: TrajectoryPoint,
  count: number,
  timeStep: number = 100
): TrajectoryPoint[] {
  const predicted: TrajectoryPoint[] = []
  const velocity = lastPoint.velocity || { x: 0, y: 0 }
  
  let currentPoint = { ...lastPoint }
  
  for (let i = 0; i < count; i++) {
    // Decaying certainty for further predictions
    const certainty = Math.max(0.1, 1 - (i / count) * 0.8)
    
    const nextPoint: TrajectoryPoint = {
      x: currentPoint.x + velocity.x * timeStep * 0.01,
      y: currentPoint.y + velocity.y * timeStep * 0.01,
      timestamp: currentPoint.timestamp + timeStep,
      velocity: {
        x: velocity.x * 0.95, // Decay velocity slightly
        y: velocity.y * 0.95
      },
      certainty
    }
    
    predicted.push(nextPoint)
    currentPoint = nextPoint
  }
  
  return predicted
}

/**
 * Calculate opacity based on fade settings
 */
function calculateFadeOpacity(
  index: number,
  totalPoints: number,
  options: TrajectoryOptions
): number {
  if (!options.fade) return options.opacity

  const progress = index / (totalPoints - 1)
  const intensity = options.fadeIntensity

  switch (options.fadeDirection) {
    case 'start':
      return options.opacity * (intensity + progress * (1 - intensity))
    case 'end':
      return options.opacity * (1 - progress * intensity)
    case 'both':
      const midProgress = Math.abs(progress - 0.5) * 2
      return options.opacity * (1 - midProgress * intensity)
    default:
      return options.opacity
  }
}

/**
 * Render a trajectory path with all effects
 */
export function renderTrajectory(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  options: Partial<TrajectoryOptions> = {}
): void {
  if (points.length < 2) return

  const opts = { ...defaultTrajectoryOptions, ...options }

  ctx.save()
  ctx.lineCap = opts.lineCap
  ctx.lineJoin = opts.lineJoin

  // Render glow effect if enabled
  if (opts.glow) {
    ctx.save()
    ctx.shadowColor = opts.glowColor
    ctx.shadowBlur = opts.glowRadius
    ctx.strokeStyle = opts.glowColor
    ctx.lineWidth = opts.width + 4
    ctx.globalAlpha = opts.opacity * 0.5
    renderPath(ctx, points, opts)
    ctx.restore()
  }

  // Render main path with fade
  if (opts.fade) {
    renderFadedPath(ctx, points, opts)
  } else {
    ctx.strokeStyle = opts.color
    ctx.lineWidth = opts.width
    ctx.globalAlpha = opts.opacity
    renderPath(ctx, points, opts)
  }

  // Render predictive portion
  if (opts.predictive && points.length > 0) {
    const lastPoint = points[points.length - 1]
    if (lastPoint.velocity) {
      const predicted = generatePredictiveTrajectory(lastPoint, opts.predictivePoints)
      renderPredictivePath(ctx, lastPoint, predicted, opts)
    }
  }

  ctx.restore()
}

/**
 * Render basic path
 */
function renderPath(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  opts: TrajectoryOptions
): void {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  // Use quadratic curves for smoother paths
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2
    const yc = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
  }

  // Connect to last point
  if (points.length > 1) {
    const last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
  }

  // Apply style
  if (opts.style === 'dashed') {
    ctx.setLineDash(opts.dashPattern)
  } else if (opts.style === 'dotted') {
    ctx.setLineDash([opts.width, opts.width * 2])
  }

  ctx.stroke()
}

/**
 * Render path with opacity fade
 */
function renderFadedPath(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  opts: TrajectoryOptions
): void {
  // Render path segments with varying opacity
  for (let i = 0; i < points.length - 1; i++) {
    const opacity = calculateFadeOpacity(i, points.length, opts)
    
    ctx.beginPath()
    ctx.moveTo(points[i].x, points[i].y)
    ctx.lineTo(points[i + 1].x, points[i + 1].y)
    
    ctx.strokeStyle = opts.color
    ctx.lineWidth = opts.width
    ctx.globalAlpha = opacity
    ctx.setLineDash([])
    ctx.stroke()
  }
}

/**
 * Render predictive trajectory with dashed style
 */
function renderPredictivePath(
  ctx: CanvasRenderingContext2D,
  startPoint: TrajectoryPoint,
  predictedPoints: TrajectoryPoint[],
  opts: TrajectoryOptions
): void {
  if (predictedPoints.length === 0) return

  ctx.save()
  ctx.strokeStyle = opts.predictiveColor
  ctx.lineWidth = opts.width * 0.8
  ctx.setLineDash([4, 4])

  ctx.beginPath()
  ctx.moveTo(startPoint.x, startPoint.y)

  for (let i = 0; i < predictedPoints.length; i++) {
    const point = predictedPoints[i]
    const certainty = point.certainty || 0.5
    ctx.globalAlpha = certainty * opts.opacity
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    
    // Draw certainty indicators
    ctx.fillStyle = opts.predictiveColor
    ctx.beginPath()
    ctx.arc(point.x, point.y, 3 * certainty, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  ctx.restore()
}

/**
 * Render multiple trajectories with batching for performance
 */
export function renderTrajectories(
  ctx: CanvasRenderingContext2D,
  trajectories: TrajectoryPoint[][],
  options: Partial<TrajectoryOptions> = {}
): void {
  trajectories.forEach(points => {
    renderTrajectory(ctx, points, options)
  })
}

/**
 * Create animated trajectory renderer
 */
export class AnimatedTrajectoryRenderer {
  private points: TrajectoryPoint[]
  private options: TrajectoryOptions
  private currentIndex: number = 0
  private animationId: number | null = null
  private speed: number

  constructor(
    points: TrajectoryPoint[],
    options: Partial<TrajectoryOptions>,
    speed: number = 2
  ) {
    this.points = points
    this.options = { ...defaultTrajectoryOptions, ...options }
    this.speed = speed
  }

  start(ctx: CanvasRenderingContext2D, onComplete?: () => void): void {
    const animate = () => {
      if (this.currentIndex >= this.points.length - 1) {
        if (onComplete) onComplete()
        return
      }

      this.currentIndex = Math.min(
        this.points.length - 1,
        this.currentIndex + this.speed
      )

      const visiblePoints = this.points.slice(0, this.currentIndex + 1)
      renderTrajectory(ctx, visiblePoints, this.options)

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

  reset(): void {
    this.currentIndex = 0
  }
}

/**
 * Calculate trajectory statistics
 */
export function calculateTrajectoryStats(points: TrajectoryPoint[]): {
  totalDistance: number
  averageSpeed: number
  maxSpeed: number
  duration: number
} {
  if (points.length < 2) {
    return { totalDistance: 0, averageSpeed: 0, maxSpeed: 0, duration: 0 }
  }

  let totalDistance = 0
  let maxSpeed = 0
  const speeds: number[] = []

  for (let i = 1; i < points.length; i++) {
    const dist = distance(points[i - 1], points[i])
    const time = points[i].timestamp - points[i - 1].timestamp
    const speed = time > 0 ? dist / time : 0

    totalDistance += dist
    speeds.push(speed)
    maxSpeed = Math.max(maxSpeed, speed)
  }

  const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
  const duration = points[points.length - 1].timestamp - points[0].timestamp

  return {
    totalDistance,
    averageSpeed: isFinite(averageSpeed) ? averageSpeed : 0,
    maxSpeed: isFinite(maxSpeed) ? maxSpeed : 0,
    duration
  }
}

export default {
  renderTrajectory,
  renderTrajectories,
  simplifyPath,
  applyLOD,
  generatePredictiveTrajectory,
  calculateTrajectoryStats,
  AnimatedTrajectoryRenderer,
  defaultTrajectoryOptions,
  defaultLODConfig
}
