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
  type: 'site' | 'chokepoint' | 'mid'
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
    { id: 'a-site', name: 'A Site', center: { x: 200, y: 200 }, radius: 120, type: 'site' as const },
    { id: 'b-site', name: 'B Site', center: { x: 800, y: 800 }, radius: 120, type: 'site' as const },
    { id: 'mid', name: 'Mid Control', center: { x: 500, y: 500 }, radius: 100, type: 'mid' as const },
    { id: 'a-main', name: 'A Main', center: { x: 100, y: 200 }, radius: 80, type: 'chokepoint' as const },
    { id: 'b-main', name: 'B Main', center: { x: 900, y: 800 }, radius: 80, type: 'chokepoint' as const }
  ]
}

/** Calculate control events from game data */
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
      return player.positions?.some(pos => {
        const dx = pos.x - zone.center.x
        const dy = pos.y - zone.center.y
        return Math.sqrt(dx * dx + dy * dy) < zone.radius
      }) ?? false
    })

    // Count players by team
    const attackers = positionsInZone.filter(p => p.team === 'attackers').length
    const defenders = positionsInZone.filter(p => p.team === 'defenders').length

    // Determine control state
    let team: ControlEvent['team'] = 'contested'
    let strength = 0.5

    if (attackers > 0 && defenders === 0) {
      team = 'attackers'
      strength = Math.min(attackers / 3, 1.0)
    } else if (defenders > 0 && attackers === 0) {
      team = 'defenders'
      strength = Math.min(defenders / 3, 1.0)
    } else {
      // Contested - strength based on ratio
      const total = attackers + defenders
      if (total > 0) {
        strength = Math.max(attackers, defenders) / total
      }
    }

    events.push({
      zoneId: zone.id,
      team,
      startTime,
      endTime: currentTime,
      strength,
      playerCount: positionsInZone.length
    })
  })

  return events
}

/** Get color for team control */
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
      return `rgba(128, 128, 128, ${alpha})`
  }
}

/** Get border color for team control */
function getTeamBorderColor(team: ControlEvent['team']): string {
  switch (team) {
    case 'attackers':
      return '#ef4444'
    case 'defenders':
      return '#3b82f6'
    case 'contested':
      return '#a855f7'
    default:
      return '#808080'
  }
}

export const siteControlLens: Lens = {
  id: 'site-control',
  name: 'site-control',
  displayName: 'Site Control',
  description: 'Shows site ownership over time. Blue = Defender control, Red = Attacker control, Purple = Contested.',
  opacity: 0.6,

  defaultOptions: {
    opacity: 0.6,
    colors: { primary: 'rgb(59, 130, 246)' },
    blendMode: 'source-over' as const,
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

    const zones = getDefaultZones((data.metadata?.mapName as string) ?? '')
    const currentTime = Date.now()
    const events = calculateControlEvents(data, zones, currentTime, timeWindow)

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity ?? 1

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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.beginPath()
        ctx.arc(countX, countY, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'white'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(event.playerCount.toString(), countX, countY)
      }
    })

    // Draw transition arrows if enabled
    if (showTransitions) {
      drawTransitionArrows(ctx, events, zones, currentTime, minControlTime)
    }

    // Draw percentage indicators if enabled
    if (showPercentages) {
      drawPercentageIndicators(ctx, events, zones)
    }

    ctx.restore()
  }
}

/** Draw arrows showing control transitions */
function drawTransitionArrows(
  ctx: CanvasRenderingContext2D,
  events: ControlEvent[],
  zones: ControlZone[],
  currentTime: number,
  minControlTime: number
): void {
  // Simplified transition visualization
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])

  events.forEach(event => {
    if (event.endTime - event.startTime < minControlTime) return

    const zone = zones.find(z => z.id === event.zoneId)
    if (!zone) return

    // Draw small arrow indicating control direction
    const angle = (currentTime / 1000) % (Math.PI * 2)
    const arrowLength = 20
    const x = zone.center.x + Math.cos(angle) * (zone.radius - 10)
    const y = zone.center.y + Math.sin(angle) * (zone.radius - 10)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(
      x + Math.cos(angle + Math.PI / 4) * arrowLength,
      y + Math.sin(angle + Math.PI / 4) * arrowLength
    )
    ctx.stroke()
  })

  ctx.setLineDash([])
}

/** Draw percentage indicators for control strength */
function drawPercentageIndicators(
  ctx: CanvasRenderingContext2D,
  events: ControlEvent[],
  zones: ControlZone[]
): void {
  ctx.fillStyle = 'white'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  events.forEach(event => {
    const zone = zones.find(z => z.id === event.zoneId)
    if (!zone) return

    const percentage = Math.round(event.strength * 100)
    ctx.fillText(`${percentage}%`, zone.center.x, zone.center.y + zone.radius + 20)
  })
}
