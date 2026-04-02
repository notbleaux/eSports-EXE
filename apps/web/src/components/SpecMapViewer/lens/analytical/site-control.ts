// @ts-nocheck
/** [Ver001.000] */
/**
 * Site Control Lens
 * =================
 * Visualizes site ownership over time.
 * Shows attacker/defender control transitions and contested periods.
 * Uses colored overlays to indicate control state at each location.
 */

import type { Lens, GameData, LensOptions, Vector2D } from '../types'

export interface SiteControlOptions extends Partial<LensOptions> {
  /** Time window to show (in ms from current) */
  timeWindow?: number
  /** Show control transition animations */
  showTransitions?: boolean
  /** Highlight contested areas */
  highlightContested?: boolean
  /** Show control percentage indicators */
  showPercentages?: boolean
  /** Minimum control time to display (ms) */
  minControlTime?: number
  /** Show zone labels */
  showLabels?: boolean
}

/** Site/area definition */
interface ControlZone {
  id: string
  name: string
  center: Vector2D
  radius: number
  type: 'site' | 'mid' | 'chokepoint'
}

/** Control event for a zone */
interface ControlEvent {
  zoneId: string
  team: 'attackers' | 'defenders' | 'contested'
  startTime: number
  endTime: number
  strength: number // 0.0 to 1.0
  playerCount: number
}

/** Default control zones for Valorant maps */
function getDefaultZones(mapName: string): ControlZone[] {
  // Simplified zone definitions - would be map-specific in production
  return [
    { id: 'a-site', name: 'A Site', center: { x: 200, y: 200 }, radius: 120, type: 'site' },
    { id: 'b-site', name: 'B Site', center: { x: 800, y: 800 }, radius: 120, type: 'site' },
    { id: 'mid', name: 'Mid', center: { x: 500, y: 500 }, radius: 100, type: 'mid' },
    { id: 'a-main', name: 'A Main', center: { x: 100, y: 300 }, radius: 80, type: 'chokepoint' },
    { id: 'b-main', name: 'B Main', center: { x: 900, y: 700 }, radius: 80, type: 'chokepoint' }
  ]
}

/**
 * Calculate control events from game data
 * Analyzes player positions and kill events to determine zone control
 */
function calculateControlEvents(
  data: GameData,
  zones: ControlZone[],
  currentTime: number,
  timeWindow: number
): ControlEvent[] {
  const events: ControlEvent[] = []
  const startTime = currentTime - timeWindow

  zones.forEach(zone => {
    // Analyze player positions in zone
    const positionsInZone = data.playerPositions.filter(player => {
      return player.positions.some(pos => {
        const dx = pos.x - zone.center.x
        const dy = pos.y - zone.center.y
        return Math.sqrt(dx * dx + dy * dy) < zone.radius
      })
    })

    // Count players by team
    const attackers = positionsInZone.filter(p => p.team === 'attackers').length
    const defenders = positionsInZone.filter(p => p.team === 'defenders').length

    // Determine control
    let team: ControlEvent['team']
    let strength = 0

    if (attackers > 0 && defenders > 0) {
      team = 'contested'
      strength = Math.min(attackers, defenders) / Math.max(attackers, defenders)
    } else if (attackers > defenders) {
      team = 'attackers'
      strength = Math.min(1, attackers / 3)
    } else if (defenders > attackers) {
      team = 'defenders'
      strength = Math.min(1, defenders / 3)
    } else {
      team = 'defenders' // Default to defenders if empty
      strength = 0.3
    }

    events.push({
      zoneId: zone.id,
      team,
      startTime,
      endTime: currentTime,
      strength,
      playerCount: attackers + defenders
    })
  })

  return events
}

/**
 * Get color for team control
 */
function getTeamColor(team: ControlEvent['team'], strength: number): string {
  const alpha = 0.3 + strength * 0.4

  switch (team) {
    case 'attackers':
      return `rgba(239, 68, 68, ${alpha})` // Red
    case 'defenders':
      return `rgba(59, 130, 246, ${alpha})` // Blue
    case 'contested':
      return `rgba(168, 85, 247, ${alpha})` // Purple
    default:
      return `rgba(156, 163, 175, ${alpha})` // Gray
  }
}

/**
 * Get border color for team control
 */
function getTeamBorderColor(team: ControlEvent['team']): string {
  switch (team) {
    case 'attackers':
      return '#ef4444'
    case 'defenders':
      return '#3b82f6'
    case 'contested':
      return '#a855f7'
    default:
      return '#9ca3af'
  }
}

export const siteControlLens: Lens = {
  name: 'site-control',
  displayName: 'Site Control',
  description: 'Shows site ownership over time. Blue = Defender control, Red = Attacker control, Purple = Contested.',
  opacity: 0.6,

  defaultOptions: {
    opacity: 0.6,
    color: 'rgb(59, 130, 246)',
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: SiteControlOptions
  ): void => {
    const mergedOptions = { ...siteControlLens.defaultOptions, ...options }
    const {
      timeWindow = 30000,
      showTransitions = true,
      highlightContested = true,
      showPercentages = true,
      minControlTime = 2000
    } = options || {}

    const zones = getDefaultZones(data.metadata.mapName)
    const currentTime = Date.now()
    const events = calculateControlEvents(data, zones, currentTime, timeWindow)

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity

    zones.forEach(zone => {
      const event = events.find(e => e.zoneId === zone.id)
      if (!event) return

      const x = zone.center.x
      const y = zone.center.y
      const radius = zone.radius

      // Draw zone background
      ctx.fillStyle = getTeamColor(event.team, event.strength)
      ctx.beginPath()

      if (zone.type === 'site') {
        // Sites are rectangular
        ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, 10)
      } else {
        // Other zones are circular
        ctx.arc(x, y, radius, 0, Math.PI * 2)
      }

      ctx.fill()

      // Draw border
      ctx.strokeStyle = getTeamBorderColor(event.team)
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw contested indicator
      if (highlightContested && event.team === 'contested') {
        ctx.strokeStyle = '#fbbf24' // Amber
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])

        // Pulse animation effect
        const pulseRadius = radius + 10 + Math.sin(currentTime / 200) * 5
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw zone label
      if (mergedOptions.showLabels) {
        ctx.fillStyle = 'white'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(zone.name, x, y - 10)

        // Draw control info
        ctx.font = '10px sans-serif'
        const controlText = event.team === 'contested'
          ? 'CONTESTED'
          : `${Math.round(event.strength * 100)}% ${event.team === 'attackers' ? 'ATK' : 'DEF'}`
        ctx.fillText(controlText, x, y + 8)
      }

      // Draw player count indicator
      if (event.playerCount > 0) {
        const countX = x + radius - 15
        const countY = y - radius + 15

        ctx.fillStyle = event.team === 'attackers' ? '#ef4444' : '#3b82f6'
        ctx.beginPath()
        ctx.arc(countX, countY, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'white'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(event.playerCount.toString(), countX, countY)
      }

      // Draw transition arrows if enabled
      if (showTransitions) {
        drawControlTransition(ctx, zone, event, events)
      }
    })

    // Draw control flow lines between zones
    if (showTransitions) {
      drawControlFlow(ctx, zones, events)
    }

    ctx.restore()
  }
}

/**
 * Draw control transition indicators
 */
function drawControlTransition(
  ctx: CanvasRenderingContext2D,
  zone: ControlZone,
  event: ControlEvent,
  allEvents: ControlEvent[]
): void {
  // Check for control changes (simplified - would need historical data)
  const arrowSize = 15
  const x = zone.center.x
  const y = zone.center.y + zone.radius + 20

  ctx.fillStyle = event.team === 'attackers' ? '#ef4444' : '#3b82f6'

  // Draw directional indicator based on control direction
  ctx.beginPath()
  if (event.team === 'attackers') {
    // Arrow pointing in (attackers pushing)
    ctx.moveTo(x - arrowSize, y - arrowSize)
    ctx.lineTo(x, y)
    ctx.lineTo(x + arrowSize, y - arrowSize)
  } else {
    // Arrow pointing out (defenders holding)
    ctx.moveTo(x - arrowSize, y)
    ctx.lineTo(x, y + arrowSize)
    ctx.lineTo(x + arrowSize, y)
  }
  ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = 3
  ctx.stroke()
}

/**
 * Draw control flow between connected zones
 */
function drawControlFlow(
  ctx: CanvasRenderingContext2D,
  zones: ControlZone[],
  events: ControlEvent[]
): void {
  // Define zone connections
  const connections = [
    { from: 'a-main', to: 'a-site' },
    { from: 'b-main', to: 'b-site' },
    { from: 'mid', to: 'a-site' },
    { from: 'mid', to: 'b-site' }
  ]

  connections.forEach(conn => {
    const fromZone = zones.find(z => z.id === conn.from)
    const toZone = zones.find(z => z.id === conn.to)
    const fromEvent = events.find(e => e.zoneId === conn.from)
    const toEvent = events.find(e => e.zoneId === conn.to)

    if (!fromZone || !toZone || !fromEvent || !toEvent) return

    // Draw flow line if different teams control connected zones
    if (fromEvent.team !== toEvent.team && fromEvent.team !== 'contested' && toEvent.team !== 'contested') {
      const x1 = fromZone.center.x
      const y1 = fromZone.center.y
      const x2 = toZone.center.x
      const y2 = toZone.center.y

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw flow direction arrow
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      const angle = Math.atan2(y2 - y1, x2 - x1)

      ctx.fillStyle = fromEvent.team === 'attackers' ? '#ef4444' : '#3b82f6'
      ctx.beginPath()
      ctx.moveTo(
        midX + Math.cos(angle) * 10,
        midY + Math.sin(angle) * 10
      )
      ctx.lineTo(
        midX + Math.cos(angle + 2.5) * 8,
        midY + Math.sin(angle + 2.5) * 8
      )
      ctx.lineTo(
        midX + Math.cos(angle - 2.5) * 8,
        midY + Math.sin(angle - 2.5) * 8
      )
      ctx.fill()
    }
  })
}

export default siteControlLens
