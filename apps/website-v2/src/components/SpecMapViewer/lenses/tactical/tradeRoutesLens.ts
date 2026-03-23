/** [Ver001.000] */
/**
 * Trade Routes Lens
 * =================
 * Visualizes optimal support paths for trading kills.
 * Shows route safety ratings, travel times, and counter-utility risks.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { TradeRoute, Vector2D } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface TradeRoutesLensOptions extends Partial<LensOptions> {
  /** Color for safe routes */
  safeColor?: string
  /** Color for risky routes */
  riskyColor?: string
  /** Color for dangerous routes */
  dangerousColor?: string
  /** Show route safety ratings */
  showSafety?: boolean
  /** Show travel times */
  showTiming?: boolean
  /** Show utility risks */
  showRisks?: boolean
  /** Show optimal agents */
  showAgents?: boolean
  /** Minimum safety rating to show */
  minSafetyRating?: number
}

export const tradeRoutesLens: Lens = {
  name: 'trade-routes',
  displayName: 'Trade Routes',
  description: 'Visualizes optimal support paths for trading kills with safety ratings, travel times, and counter-utility risk assessment.',
  opacity: 0.7,

  defaultOptions: {
    opacity: 0.7,
    color: 'rgb(14, 165, 233)', // Sky-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: TradeRoutesLensOptions
  ): void => {
    const mergedOptions = { ...tradeRoutesLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const safeColor = options?.safeColor || 'rgb(34, 197, 94)'      // Green-500
    const riskyColor = options?.riskyColor || 'rgb(234, 179, 8)'    // Yellow-500
    const dangerousColor = options?.dangerousColor || 'rgb(239, 68, 68)' // Red-500
    const showSafety = options?.showSafety !== false
    const showTiming = options?.showTiming !== false
    const showRisks = options?.showRisks !== false
    const showAgents = options?.showAgents !== false
    const minSafetyRating = options?.minSafetyRating ?? 0.3

    // Calculate trade routes between key positions
    const gameState = toPredictionState(data)
    const routes: TradeRoute[] = []

    // Generate routes from alive attackers to potential entry points
    const aliveAttackers = data.playerPositions.filter(p => {
      const isAlive = gameState.alivePlayers.attackers.includes(p.playerId)
      return isAlive && p.team === 'attackers'
    })

    const entryPoints: Vector2D[] = [
      { x: 20, y: 20 }, // A site entry
      { x: 50, y: 45 }, // B site entry
      { x: 32, y: 32 }  // Mid entry
    ]

    aliveAttackers.forEach(player => {
      const lastPos = player.positions[player.positions.length - 1]
      if (!lastPos) return

      entryPoints.forEach(entry => {
        const dist = Math.hypot(entry.x - lastPos.x, entry.y - lastPos.y)
        if (dist > 10 && dist < 60) {
          const calculatedRoutes = predictionModel.calculateTradeRoutes(
            { x: lastPos.x, y: lastPos.y },
            entry,
            gameState
          )
          routes.push(...calculatedRoutes)
        }
      })
    })

    // Filter by safety rating
    const validRoutes = routes.filter(r => r.safetyRating >= minSafetyRating)

    if (validRoutes.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Sort by safety (safest first)
    validRoutes.sort((a, b) => b.safetyRating - a.safetyRating)

    validRoutes.forEach((route, index) => {
      const color = getRouteColor(route.safetyRating, safeColor, riskyColor, dangerousColor)
      const isPrimary = index === 0

      // Draw route path
      drawRoutePath(ctx, route, color, isPrimary)

      // Draw safety rating
      if (showSafety && showLabels) {
        drawSafetyRating(ctx, route, color)
      }

      // Draw timing info
      if (showTiming && showLabels) {
        drawTimingInfo(ctx, route)
      }

      // Draw risk indicators
      if (showRisks && route.utilityRisks.length > 0) {
        drawRiskIndicators(ctx, route)
      }

      // Draw recommended agents
      if (showAgents && showLabels && isPrimary) {
        drawAgentRecommendations(ctx, route)
      }
    })

    ctx.restore()
  }
}

/** Draw route path with waypoints */
function drawRoutePath(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute,
  color: string,
  isPrimary: boolean
): void {
  ctx.save()

  // Build full path including waypoints
  const path: Vector2D[] = [route.start, ...route.waypoints, route.end]

  // Animated dash offset
  const dashOffset = (Date.now() / 50) % 20

  // Draw base path
  ctx.strokeStyle = color
  ctx.lineWidth = isPrimary ? 3 : 2
  ctx.globalAlpha = isPrimary ? 0.8 : 0.5
  ctx.setLineDash(isPrimary ? [10, 5] : [5, 5])
  ctx.lineDashOffset = -dashOffset

  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y)
  }
  ctx.stroke()

  // Draw glow for primary route
  if (isPrimary) {
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // Draw waypoints
  route.waypoints.forEach((wp, i) => {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(wp.x, wp.y, 3, 0, Math.PI * 2)
    ctx.fill()

    // Waypoint number
    ctx.fillStyle = 'white'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((i + 1).toString(), wp.x, wp.y)
  })

  // Draw start marker
  drawMarker(ctx, route.start, color, 'S', isPrimary)

  // Draw end marker
  drawMarker(ctx, route.end, color, 'E', isPrimary)

  ctx.restore()
}

/** Draw marker at route endpoint */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  pos: Vector2D,
  color: string,
  label: string,
  isPrimary: boolean
): void {
  const radius = isPrimary ? 6 : 4

  // Outer ring
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2)
  ctx.stroke()

  // Inner fill
  ctx.fillStyle = color
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Label
  ctx.fillStyle = 'white'
  ctx.font = `bold ${isPrimary ? 9 : 7}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, pos.x, pos.y)
}

/** Draw safety rating indicator */
function drawSafetyRating(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute,
  color: string
): void {
  // Find midpoint of route for label placement
  const midIndex = Math.floor(route.waypoints.length / 2)
  const midPoint = route.waypoints[midIndex] || route.start

  const labelY = midPoint.y - 10

  ctx.save()

  // Safety percentage
  const safetyPct = Math.round(route.safetyRating * 100)
  const text = `${safetyPct}% safe`

  ctx.font = 'bold 9px sans-serif'
  const metrics = ctx.measureText(text)

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(
    midPoint.x - metrics.width / 2 - 4,
    labelY - 7,
    metrics.width + 8,
    14
  )

  // Text
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, midPoint.x, labelY)

  ctx.restore()
}

/** Draw timing information */
function drawTimingInfo(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute
): void {
  const lastWp = route.waypoints[route.waypoints.length - 1] || route.start
  const labelY = lastWp.y + 15

  ctx.save()

  const seconds = Math.round(route.travelTime / 1000)
  const text = `~${seconds}s`

  ctx.font = '9px sans-serif'
  const metrics = ctx.measureText(text)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(
    lastWp.x - metrics.width / 2 - 3,
    labelY - 6,
    metrics.width + 6,
    12
  )

  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, lastWp.x, labelY)

  // Trade success rate
  const successText = `${Math.round(route.tradeSuccessRate * 100)}% trade`
  ctx.font = '8px sans-serif'
  const successMetrics = ctx.measureText(successText)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(
    lastWp.x - successMetrics.width / 2 - 3,
    labelY + 10,
    successMetrics.width + 6,
    11
  )

  ctx.fillStyle = route.tradeSuccessRate > 0.7 ? '#22c55e' : '#eab308'
  ctx.fillText(successText, lastWp.x, labelY + 15)

  ctx.restore()
}

/** Draw risk indicators along route */
function drawRiskIndicators(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute
): void {
  if (route.utilityRisks.length === 0) return

  ctx.save()

  route.waypoints.forEach((wp, i) => {
    if (i < route.utilityRisks.length) {
      const risk = route.utilityRisks[i]

      // Warning icon
      ctx.fillStyle = 'rgba(234, 179, 8, 0.8)'
      ctx.beginPath()
      ctx.moveTo(wp.x + 10, wp.y - 8)
      ctx.lineTo(wp.x + 16, wp.y + 2)
      ctx.lineTo(wp.x + 4, wp.y + 2)
      ctx.closePath()
      ctx.fill()

      // Exclamation mark
      ctx.fillStyle = '#000'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', wp.x + 10, wp.y - 1)

      // Risk tooltip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.font = '7px sans-serif'
      const metrics = ctx.measureText(risk)
      ctx.fillRect(wp.x + 10 - metrics.width / 2, wp.y + 5, metrics.width + 4, 10)

      ctx.fillStyle = '#eab308'
      ctx.fillText(risk, wp.x + 12, wp.y + 10)
    }
  })

  ctx.restore()
}

/** Draw recommended agent icons */
function drawAgentRecommendations(
  ctx: CanvasRenderingContext2D,
  route: TradeRoute
): void {
  const endX = route.end.x
  const endY = route.end.y + 25

  ctx.save()

  ctx.font = '8px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  route.optimalAgents.slice(0, 2).forEach((agent, i) => {
    const y = endY + i * 12

    // Agent color dot
    const colors: Record<string, string> = {
      'Omen': '#4c1d95',
      'Jett': '#0ea5e9',
      'Yoru': '#7c3aed',
      'Raze': '#ea580c',
      'Phoenix': '#f97316',
      'Neon': '#06b6d4'
    }

    ctx.fillStyle = colors[agent] || '#6b7280'
    ctx.beginPath()
    ctx.arc(endX - 15, y, 3, 0, Math.PI * 2)
    ctx.fill()

    // Agent name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText(agent, endX, y)
  })

  ctx.restore()
}

/** Get color based on safety rating */
function getRouteColor(
  rating: number,
  safeColor: string,
  riskyColor: string,
  dangerousColor: string
): string {
  if (rating >= 0.7) return safeColor
  if (rating >= 0.5) return riskyColor
  return dangerousColor
}

export default tradeRoutesLens
