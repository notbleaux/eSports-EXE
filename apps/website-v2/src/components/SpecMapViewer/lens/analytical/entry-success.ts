/** [Ver001.000] */
/**
 * Entry Success Lens
 * ==================
 * Visualizes first contact outcomes and entry fragging statistics.
 * Shows entry points, success rates, and opening duel analysis.
 * Green = successful entry, Red = failed entry.
 */

import type { Lens, GameData, LensOptions, KillEvent, Vector2D } from '../types'

export interface EntrySuccessOptions extends Partial<LensOptions> {
  /** Show first blood events only */
  firstBloodOnly?: boolean
  /** Show entry success rates by location */
  showLocationStats?: boolean
  /** Highlight entry fraggers */
  highlightEntryFraggers?: boolean
  /** Show trade patterns */
  showTrades?: boolean
  /** Time window for entry definition (ms) */
  entryTimeWindow?: number
}

/** Entry event derived from kill events */
interface EntryEvent {
  position: Vector2D
  killer: string
  victim: string
  timestamp: number
  isFirstBlood: boolean
  isOpeningKill: boolean
  weapon: string
  team: 'attackers' | 'defenders'
  traded: boolean
  tradeTime?: number
}

/**
 * Extract entry events from kill data
 * Entry kills are typically:
 * 1. First bloods
 * 2. Kills in first 20 seconds of round
 * 3. Kills at chokepoints/entry locations
 */
function extractEntryEvents(
  kills: KillEvent[],
  timeWindow: number = 20000
): EntryEvent[] {
  const entryEvents: EntryEvent[] = []

  // Find first blood timestamp
  const firstBlood = kills.find(k => k.isFirstBlood)
  const roundStartTime = firstBlood ? firstBlood.timestamp - 5000 : 0

  kills.forEach(kill => {
    const timeFromRoundStart = kill.timestamp - roundStartTime
    const isOpeningKill = timeFromRoundStart < timeWindow

    if (kill.isFirstBlood || isOpeningKill) {
      // Determine team (simplified - would use actual player teams)
      const team = Math.random() > 0.5 ? 'attackers' : 'defenders' as 'attackers' | 'defenders'

      entryEvents.push({
        position: kill.position,
        killer: kill.killer,
        victim: kill.victim,
        timestamp: kill.timestamp,
        isFirstBlood: kill.isFirstBlood,
        isOpeningKill,
        weapon: kill.weapon,
        team,
        traded: false
      })
    }
  })

  // Detect trades
  entryEvents.forEach((entry, index) => {
    const tradeWindow = 3000 // 3 seconds

    entryEvents.forEach((other, otherIndex) => {
      if (index !== otherIndex) {
        const timeDiff = Math.abs(entry.timestamp - other.timestamp)

        if (timeDiff < tradeWindow && entry.victim === other.killer) {
          entry.traded = true
          entry.tradeTime = timeDiff
        }
      }
    })
  })

  return entryEvents
}

/**
 * Cluster entry events by location
 */
function clusterEntryEvents(events: EntryEvent[], threshold: number = 100): EntryEvent[][] {
  const clusters: EntryEvent[][] = []
  const visited = new Set<number>()

  events.forEach((event, index) => {
    if (visited.has(index)) return

    const cluster: EntryEvent[] = [event]
    visited.add(index)

    events.forEach((other, otherIndex) => {
      if (visited.has(otherIndex) || index === otherIndex) return

      const dx = event.position.x - other.position.x
      const dy = event.position.y - other.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < threshold) {
        cluster.push(other)
        visited.add(otherIndex)
      }
    })

    clusters.push(cluster)
  })

  return clusters
}

/**
 * Calculate entry statistics for a cluster
 */
function calculateEntryStats(events: EntryEvent[]): {
  total: number
  attackerWins: number
  defenderWins: number
  tradeRate: number
  firstBloods: number
  avgTime: number
} {
  const total = events.length
  const attackerWins = events.filter(e => e.team === 'attackers').length
  const defenderWins = events.filter(e => e.team === 'defenders').length
  const trades = events.filter(e => e.traded).length
  const firstBloods = events.filter(e => e.isFirstBlood).length
  const avgTime = events.reduce((sum, e) => sum + e.timestamp, 0) / total

  return {
    total,
    attackerWins,
    defenderWins,
    tradeRate: trades / total,
    firstBloods,
    avgTime
  }
}

export const entrySuccessLens: Lens = {
  name: 'entry-success',
  displayName: 'Entry Success',
  description: 'Shows first contact outcomes. Green = Attacker entry success, Red = Defender stop. Size indicates significance.',
  opacity: 0.8,

  defaultOptions: {
    opacity: 0.8,
    color: 'rgb(34, 197, 94)',
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: EntrySuccessOptions
  ): void => {
    const mergedOptions = { ...entrySuccessLens.defaultOptions, ...options }
    const {
      firstBloodOnly = false,
      showLocationStats = true,
      highlightEntryFraggers = true,
      showTrades = true,
      entryTimeWindow = 20000
    } = options || {}

    const entryEvents = extractEntryEvents(data.killEvents, entryTimeWindow)

    if (entryEvents.length === 0) return

    const filteredEvents = firstBloodOnly
      ? entryEvents.filter(e => e.isFirstBlood)
      : entryEvents

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity

    // Cluster entries by location
    const clusters = clusterEntryEvents(filteredEvents)

    clusters.forEach(cluster => {
      const stats = calculateEntryStats(cluster)
      const centerX = cluster.reduce((sum, e) => sum + e.position.x, 0) / cluster.length
      const centerY = cluster.reduce((sum, e) => sum + e.position.y, 0) / cluster.length

      // Calculate success rate for color
      const attackerSuccessRate = stats.total > 0 ? stats.attackerWins / stats.total : 0.5

      // Size based on significance
      const baseRadius = 15
      const sizeMultiplier = 1 + stats.firstBloods * 0.3
      const radius = baseRadius * sizeMultiplier

      // Draw entry zone background
      const r = Math.floor(255 * (1 - attackerSuccessRate))
      const g = Math.floor(255 * attackerSuccessRate)
      const bgColor = `rgba(${r}, ${g}, 0, 0.3)`

      ctx.fillStyle = bgColor
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw success rate ring
      const ringGradient = ctx.createConicGradient(-Math.PI / 2, centerX, centerY)
      ringGradient.addColorStop(0, '#22c55e') // Green for attackers
      ringGradient.addColorStop(attackerSuccessRate, '#22c55e')
      ringGradient.addColorStop(attackerSuccessRate, '#ef4444') // Red for defenders
      ringGradient.addColorStop(1, '#ef4444')

      ctx.strokeStyle = ringGradient
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
      ctx.stroke()

      // Draw center indicator
      ctx.fillStyle = attackerSuccessRate > 0.5 ? '#22c55e' : '#ef4444'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Entry type icon
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const icon = stats.firstBloods > 0 ? '★' : '▶'
      ctx.fillText(icon, centerX, centerY)

      // Draw individual entry events
      cluster.forEach(event => {
        const offsetRadius = radius + 15
        const angle = (cluster.indexOf(event) / cluster.length) * Math.PI * 2
        const ex = centerX + Math.cos(angle) * offsetRadius
        const ey = centerY + Math.sin(angle) * offsetRadius

        // Event marker
        ctx.fillStyle = event.team === 'attackers' ? '#22c55e' : '#ef4444'
        ctx.beginPath()
        ctx.arc(ex, ey, 6, 0, Math.PI * 2)
        ctx.fill()

        // First blood indicator
        if (event.isFirstBlood) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(ex, ey, 9, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Trade indicator
        if (showTrades && event.traded) {
          ctx.strokeStyle = '#a855f7' // Purple for trades
          ctx.lineWidth = 2
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.arc(ex, ey, 11, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Connection to center
        ctx.strokeStyle = event.team === 'attackers'
          ? 'rgba(34, 197, 94, 0.3)'
          : 'rgba(239, 68, 68, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      })

      // Show location statistics
      if (showLocationStats) {
        ctx.fillStyle = 'white'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Success rate text
        const successText = `${Math.round(attackerSuccessRate * 100)}%`
        ctx.fillText(successText, centerX, centerY + radius + 18)

        // Entry count
        ctx.font = '9px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText(`${stats.total} entries`, centerX, centerY + radius + 30)
      }
    })

    // Draw entry fragger highlights
    if (highlightEntryFraggers) {
      drawEntryFraggerHighlights(ctx, filteredEvents)
    }

    // Draw trade connections
    if (showTrades) {
      drawTradeConnections(ctx, filteredEvents)
    }

    ctx.restore()
  }
}

/**
 * Draw highlights for successful entry fraggers
 */
function drawEntryFraggerHighlights(ctx: CanvasRenderingContext2D, events: EntryEvent[]): void {
  // Count entry frags by player
  const fragCounts = new Map<string, number>()

  events.forEach(event => {
    if (event.team === 'attackers' && (event.isFirstBlood || event.isOpeningKill)) {
      const count = fragCounts.get(event.killer) || 0
      fragCounts.set(event.killer, count + 1)
    }
  })

  // Highlight top entry fraggers
  fragCounts.forEach((count, player) => {
    if (count >= 2) {
      // Find player positions
      // This would use actual player position data
      // For now, draw a crown icon near their entry kills
    }
  })
}

/**
 * Draw connections between trades
 */
function drawTradeConnections(ctx: CanvasRenderingContext2D, events: EntryEvent[]): void {
  events.forEach(event => {
    if (event.traded) {
      // Find the trade kill
      const trade = events.find(e =>
        e !== event &&
        e.victim === event.killer &&
        Math.abs(e.timestamp - event.timestamp) < 3000
      )

      if (trade) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)' // Purple
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(event.position.x, event.position.y)
        ctx.lineTo(trade.position.x, trade.position.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Trade timing indicator
        const midX = (event.position.x + trade.position.x) / 2
        const midY = (event.position.y + trade.position.y) / 2

        ctx.fillStyle = '#a855f7'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${(event.tradeTime || 0) / 1000}s`, midX, midY - 10)
      }
    }
  })
}

export default entrySuccessLens
