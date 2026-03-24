/** [Ver001.000]
 * Trade Routes Lens
 * =================
 * Shows common rotation paths with frequency and timing analysis.
 * 
 * Features:
 * - Path frequency visualization
 * - Timing analysis per route
 * - Optimal route calculation
 * - Route effectiveness scoring
 * - Heatmap of high-traffic areas
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Trade route definition */
export interface TradeRoute {
  /** Unique route identifier */
  id: string
  /** Route name */
  name: string
  /** Start position */
  from: { x: number; y: number; name: string }
  /** End position */
  to: { x: number; y: number; name: string }
  /** Route waypoints */
  waypoints: Array<{ x: number; y: number }>
  /** Usage statistics */
  stats: {
    /** Times route was used */
    frequency: number
    /** Average completion time (ms) */
    avgTime: number
    /** Success rate (0.0 - 1.0) */
    successRate: number
    /** Average trade success (player saved) */
    tradeRate: number
  }
  /** Route properties */
  properties: {
    /** Route distance */
    distance: number
    /** Is this a default/common route */
    isCommon: boolean
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high'
    /** Visibility exposure */
    exposure: number
  }
  /** Current status */
  status: 'clear' | 'contested' | 'blocked' | 'unknown'
  /** Team that primarily uses this route */
  primaryTeam: 'attackers' | 'defenders' | 'both'
}

/** Route usage event */
export interface RouteEvent {
  /** Event timestamp */
  timestamp: number
  /** Player using route */
  playerId: string
  /** Team */
  team: 'attackers' | 'defenders'
  /** Route taken */
  routeId: string
  /** Time taken */
  duration: number
  /** Was trade successful */
  tradeSuccessful: boolean
  /** Enemies encountered */
  enemiesEncountered: number
}

/** Input data for trade route calculation */
export interface TradeRouteInput {
  /** Historical route events */
  events: RouteEvent[]
  /** Defined routes on map */
  routes: Array<{
    id: string
    name: string
    from: { x: number; y: number; name: string }
    to: { x: number; y: number; name: string }
    waypoints: Array<{ x: number; y: number }>
  }>
  /** Current player positions */
  currentPositions?: Array<{
    playerId: string
    team: 'attackers' | 'defenders'
    x: number
    y: number
  }>
  /** Current enemy positions (for contested calculation) */
  enemyPositions?: Array<{
    x: number
    y: number
  }>
  /** Time filter (only events within this window) */
  timeWindow?: number
}

/** Lens data output */
export interface TradeRouteLensData {
  /** Calculated routes with stats */
  routes: TradeRoute[]
  /** Traffic heatmap */
  trafficHeatmap: HeatmapCell[]
  /** Route recommendations */
  recommendations: Array<{
    route: string
    confidence: number
    reasoning: string[]
  }>
  /** Summary statistics */
  summary: {
    totalRotations: number
    avgRotationTime: number
    bestRoute?: string
    mostUsedRoute?: string
  }
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface TradeRouteRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: TradeRouteLensData
  /** Show route labels */
  showLabels?: boolean
  /** Show frequency indicators */
  showFrequency?: boolean
  /** Show timing info */
  showTiming?: boolean
  /** Show contested status */
  showStatus?: boolean
  /** Minimum frequency to display */
  minFrequency?: number
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Risk thresholds */
export const RISK_THRESHOLDS = {
  low: 0.3,
  medium: 0.6,
  high: 0.8
}

/** Status colors */
export const STATUS_COLORS: Record<TradeRoute['status'], string> = {
  clear: '#22c55e',    // Green
  contested: '#eab308', // Yellow
  blocked: '#ef4444',   // Red
  unknown: '#64748b'    // Slate
}

/** Team colors */
export const TEAM_COLORS = {
  attackers: '#ef4444',
  defenders: '#3b82f6',
  both: '#a855f7'
}

/** Default time window (5 minutes) */
export const DEFAULT_TIME_WINDOW = 5 * 60 * 1000

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate trade routes based on input data
 * @param input - Trade route input
 * @returns Trade route lens data
 */
export function calculate(input: TradeRouteInput): TradeRouteLensData {
  const calculatedAt = Date.now()
  const timeWindow = input.timeWindow || DEFAULT_TIME_WINDOW
  
  // Filter events by time window
  const cutoffTime = calculatedAt - timeWindow
  const recentEvents = input.events.filter(e => e.timestamp >= cutoffTime)
  
  // Calculate route statistics
  const routes = calculateRouteStats(input.routes, recentEvents, input)
  
  // Generate traffic heatmap
  const trafficHeatmap = generateTrafficHeatmap(routes, recentEvents)
  
  // Generate recommendations
  const recommendations = generateRecommendations(routes, input)
  
  // Calculate summary
  const summary = calculateSummary(routes)
  
  return {
    routes,
    trafficHeatmap,
    recommendations,
    summary,
    calculatedAt
  }
}

/**
 * Calculate statistics for each route
 */
function calculateRouteStats(
  definedRoutes: TradeRouteInput['routes'],
  events: RouteEvent[],
  input: TradeRouteInput
): TradeRoute[] {
  return definedRoutes.map(route => {
    // Get events for this route
    const routeEvents = events.filter(e => e.routeId === route.id)
    
    // Calculate frequency
    const frequency = routeEvents.length
    
    // Calculate average time
    const avgTime = frequency > 0
      ? routeEvents.reduce((sum, e) => sum + e.duration, 0) / frequency
      : 0
    
    // Calculate success rate
    const successfulEvents = routeEvents.filter(e => e.tradeSuccessful).length
    const successRate = frequency > 0 ? successfulEvents / frequency : 0
    
    // Calculate trade rate
    const trades = routeEvents.filter(e => e.tradeSuccessful).length
    const tradeRate = frequency > 0 ? trades / frequency : 0
    
    // Calculate distance
    const distance = calculateRouteDistance(route.waypoints)
    
    // Determine if common route
    const isCommon = frequency >= 5
    
    // Calculate risk level
    const enemiesEncountered = routeEvents.reduce((sum, e) => sum + e.enemiesEncountered, 0)
    const avgEnemies = frequency > 0 ? enemiesEncountered / frequency : 0
    const riskLevel: TradeRoute['properties']['riskLevel'] = 
      avgEnemies > 1.5 ? 'high' : avgEnemies > 0.5 ? 'medium' : 'low'
    
    // Determine status
    const status = determineRouteStatus(route, input)
    
    // Determine primary team
    const attackerUses = routeEvents.filter(e => e.team === 'attackers').length
    const defenderUses = routeEvents.filter(e => e.team === 'defenders').length
    const primaryTeam: TradeRoute['primaryTeam'] = 
      attackerUses > defenderUses * 1.5 ? 'attackers' :
      defenderUses > attackerUses * 1.5 ? 'defenders' : 'both'
    
    return {
      id: route.id,
      name: route.name,
      from: route.from,
      to: route.to,
      waypoints: route.waypoints,
      stats: {
        frequency,
        avgTime,
        successRate,
        tradeRate
      },
      properties: {
        distance,
        isCommon,
        riskLevel,
        exposure: avgEnemies
      },
      status,
      primaryTeam
    }
  })
}

/**
 * Calculate route distance
 */
function calculateRouteDistance(waypoints: Array<{ x: number; y: number }>): number {
  let distance = 0
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x
    const dy = waypoints[i].y - waypoints[i - 1].y
    distance += Math.sqrt(dx * dx + dy * dy)
  }
  return distance
}

/**
 * Determine route status based on current positions
 */
function determineRouteStatus(
  route: TradeRouteInput['routes'][0],
  input: TradeRouteInput
): TradeRoute['status'] {
  if (!input.enemyPositions || input.enemyPositions.length === 0) {
    return 'unknown'
  }
  
  // Check if enemies are near route
  let enemiesNearRoute = 0
  
  input.enemyPositions.forEach(enemy => {
    // Check distance to route waypoints
    const minDist = Math.min(...route.waypoints.map(wp => {
      const dx = wp.x - enemy.x
      const dy = wp.y - enemy.y
      return Math.sqrt(dx * dx + dy * dy)
    }))
    
    if (minDist < 15) {
      enemiesNearRoute++
    }
  })
  
  if (enemiesNearRoute >= 2) return 'blocked'
  if (enemiesNearRoute >= 1) return 'contested'
  return 'clear'
}

/**
 * Generate traffic heatmap
 */
function generateTrafficHeatmap(
  routes: TradeRoute[],
  events: RouteEvent[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const cellMap = new Map<string, { x: number; y: number; intensity: number }>()
  
  // Aggregate traffic at each waypoint
  routes.forEach(route => {
    const routeEvents = events.filter(e => e.routeId === route.id)
    
    route.waypoints.forEach((wp, index) => {
      // Weight by position in route (midpoints have more traffic)
      const positionWeight = 1 - Math.abs(index - route.waypoints.length / 2) / (route.waypoints.length / 2) * 0.3
      const intensity = routeEvents.length * 0.1 * positionWeight
      
      const key = `${Math.round(wp.x)},${Math.round(wp.y)}`
      const existing = cellMap.get(key)
      
      if (existing) {
        existing.intensity += intensity
      } else {
        cellMap.set(key, { x: wp.x, y: wp.y, intensity })
      }
    })
  })
  
  cellMap.forEach((cell, key) => {
    if (cell.intensity > 0.05) {
      cells.push({
        x: cell.x,
        y: cell.y,
        value: cell.intensity,
        intensity: Math.min(1, cell.intensity)
      })
    }
  })
  
  return cells
}

/**
 * Generate route recommendations
 */
function generateRecommendations(
  routes: TradeRoute[],
  input: TradeRouteInput
): TradeRouteLensData['recommendations'] {
  const recommendations: TradeRouteLensData['recommendations'] = []
  
  if (!input.currentPositions) return recommendations
  
  // Find players who might need to rotate
  input.currentPositions.forEach(player => {
    // Find best route from current position
    const availableRoutes = routes.filter(r => r.status !== 'blocked')
    
    if (availableRoutes.length === 0) return
    
    // Score routes
    const scoredRoutes = availableRoutes.map(route => {
      const distToStart = Math.sqrt(
        Math.pow(player.x - route.from.x, 2) + 
        Math.pow(player.y - route.from.y, 2)
      )
      
      const score = (
        route.stats.successRate * 0.4 +
        route.stats.tradeRate * 0.3 +
        (1 - route.properties.exposure / 3) * 0.2 -
        distToStart / 100 * 0.1
      )
      
      return { route, score }
    }).sort((a, b) => b.score - a.score)
    
    const best = scoredRoutes[0]
    if (best) {
      recommendations.push({
        route: best.route.id,
        confidence: best.score,
        reasoning: [
          `${(best.route.stats.successRate * 100).toFixed(0)}% success rate`,
          `${best.route.stats.frequency} recent uses`,
          `${(best.route.stats.avgTime / 1000).toFixed(1)}s avg time`,
          `Status: ${best.route.status}`
        ]
      })
    }
  })
  
  return recommendations
}

/**
 * Calculate summary statistics
 */
function calculateSummary(routes: TradeRoute[]): TradeRouteLensData['summary'] {
  const totalRotations = routes.reduce((sum, r) => sum + r.stats.frequency, 0)
  
  const avgRotationTime = totalRotations > 0
    ? routes.reduce((sum, r) => sum + r.stats.avgTime * r.stats.frequency, 0) / totalRotations
    : 0
  
  const bestRoute = routes
    .filter(r => r.stats.frequency > 0)
    .sort((a, b) => b.stats.successRate - a.stats.successRate)[0]?.id
  
  const mostUsedRoute = routes
    .sort((a, b) => b.stats.frequency - a.stats.frequency)[0]?.id
  
  return {
    totalRotations,
    avgRotationTime,
    bestRoute,
    mostUsedRoute
  }
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render trade routes to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: TradeRouteRenderOptions): boolean {
  const {
    canvas,
    data,
    showLabels = true,
    showFrequency = true,
    showTiming = true,
    showStatus = true,
    minFrequency = 0,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Filter routes
  const visibleRoutes = data.routes.filter(r => r.stats.frequency >= minFrequency)
  
  // Render traffic heatmap
  renderTrafficHeatmap(ctx, data.trafficHeatmap, animationProgress)
  
  // Render routes
  visibleRoutes.forEach(route => {
    renderRoute(ctx, route, showLabels, showFrequency, showTiming, showStatus, animationProgress)
  })
  
  // Render summary
  renderSummary(ctx, data.summary)
  
  ctx.restore()
  return true
}

/**
 * Render traffic heatmap
 */
function renderTrafficHeatmap(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapCell[],
  animationProgress: number
): void {
  heatmap.forEach(cell => {
    const intensity = cell.intensity * animationProgress * 0.5
    if (intensity < 0.05) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 5
    )
    gradient.addColorStop(0, `rgba(234, 179, 8, ${intensity})`)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 5, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Render a single route
 */
function renderRoute(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute,
  showLabels: boolean,
  showFrequency: boolean,
  showTiming: boolean,
  showStatus: boolean,
  animationProgress: number
): void {
  const color = TEAM_COLORS[route.primaryTeam]
  const statusColor = STATUS_COLORS[route.status]
  const lineWidth = Math.max(1, route.stats.frequency * 0.3) * animationProgress
  
  ctx.save()
  
  // Draw route path
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  if (route.status === 'contested') {
    ctx.setLineDash([4, 4])
  } else if (route.status === 'blocked') {
    ctx.setLineDash([2, 6])
  }
  
  ctx.beginPath()
  ctx.moveTo(route.from.x, route.from.y)
  route.waypoints.forEach(wp => {
    ctx.lineTo(wp.x, wp.y)
  })
  ctx.lineTo(route.to.x, route.to.y)
  ctx.stroke()
  
  ctx.setLineDash([])
  
  // Draw start/end markers
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(route.from.x, route.from.y, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(route.to.x, route.to.y, 2, 0, Math.PI * 2)
  ctx.fill()
  
  // Status indicator
  if (showStatus) {
    const midIndex = Math.floor(route.waypoints.length / 2)
    const midPoint = route.waypoints[midIndex] || route.from
    
    ctx.fillStyle = statusColor
    ctx.beginPath()
    ctx.arc(midPoint.x, midPoint.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Labels
  if (showLabels) {
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '3px sans-serif'
    ctx.textAlign = 'center'
    
    // Route name at midpoint
    const midPoint = route.waypoints[Math.floor(route.waypoints.length / 2)]
    if (midPoint) {
      ctx.fillText(route.name, midPoint.x, midPoint.y - 5)
    }
  }
  
  // Frequency indicator
  if (showFrequency && route.stats.frequency > 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '3px sans-serif'
    ctx.textAlign = 'center'
    
    const labelPoint = route.waypoints[Math.floor(route.waypoints.length * 0.3)]
    if (labelPoint) {
      ctx.fillText(`${route.stats.frequency}×`, labelPoint.x, labelPoint.y + 6)
    }
  }
  
  // Timing info
  if (showTiming && route.stats.avgTime > 0) {
    ctx.fillStyle = '#64748b'
    ctx.font = '2.5px sans-serif'
    ctx.textAlign = 'center'
    
    const labelPoint = route.waypoints[Math.floor(route.waypoints.length * 0.7)]
    if (labelPoint) {
      ctx.fillText(`${(route.stats.avgTime / 1000).toFixed(1)}s`, labelPoint.x, labelPoint.y + 6)
    }
  }
  
  ctx.restore()
}

/**
 * Render summary overlay
 */
function renderSummary(ctx: CanvasRenderingContext2D, summary: TradeRouteLensData['summary']): void {
  ctx.save()
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(2, 2, 45, 22)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '3px sans-serif'
  ctx.textAlign = 'left'
  
  ctx.fillText(`Routes: ${summary.totalRotations}`, 4, 6)
  ctx.fillText(`Avg: ${(summary.avgRotationTime / 1000).toFixed(1)}s`, 4, 11)
  
  if (summary.bestRoute) {
    ctx.fillText(`Best: ${summary.bestRoute}`, 4, 16)
  }
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Find optimal route between two points
 * @param from - Start position
 * @param to - End position
 * @param routes - Available routes
 * @returns Best route or undefined
 */
export function findOptimalRoute(
  from: { x: number; y: number },
  to: { x: number; y: number },
  routes: TradeRoute[]
): TradeRoute | undefined {
  return routes
    .filter(r => r.status !== 'blocked')
    .map(r => {
      const fromDist = Math.sqrt(
        Math.pow(r.from.x - from.x, 2) + Math.pow(r.from.y - from.y, 2)
      )
      const toDist = Math.sqrt(
        Math.pow(r.to.x - to.x, 2) + Math.pow(r.to.y - to.y, 2)
      )
      const score = r.stats.successRate * 0.6 + (1 - (fromDist + toDist) / 200) * 0.4
      return { route: r, score }
    })
    .sort((a, b) => b.score - a.score)[0]?.route
}

/**
 * Calculate route risk score
 * @param route - Route to evaluate
 * @returns Risk score (0-1, higher = more risky)
 */
export function calculateRouteRisk(route: TradeRoute): number {
  const exposureRisk = Math.min(1, route.properties.exposure / 3)
  const frequencyRisk = route.stats.frequency < 3 ? 0.3 : 0
  const successRisk = 1 - route.stats.successRate
  
  return (exposureRisk + frequencyRisk + successRisk) / 3
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  findOptimalRoute,
  calculateRouteRisk,
  STATUS_COLORS,
  TEAM_COLORS,
  DEFAULT_TIME_WINDOW
}
