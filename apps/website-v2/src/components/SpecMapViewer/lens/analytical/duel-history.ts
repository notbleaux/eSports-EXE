/** [Ver001.000] */
/**
 * Duel History Lens
 * =================
 * Visualizes 1v1 win/loss locations and outcomes.
 * Shows duel hotspots and player matchup history on the map.
 * Green markers = wins, Red markers = losses, Size = significance.
 */

import type { Lens, GameData, LensOptions, KillEvent, Vector2D } from '../types'

export interface DuelHistoryOptions extends Partial<LensOptions> {
  /** Filter by specific player */
  playerFilter?: string
  /** Show duel connection lines */
  showConnections?: boolean
  /** Minimum duel distance (to filter trades) */
  minDistance?: number
  /** Show win rate heatmap */
  showWinRate?: boolean
  /** Highlight clutch duels */
  highlightClutches?: boolean
}

/** Duel event derived from kill events */
interface DuelEvent {
  position: Vector2D
  winner: string
  loser: string
  timestamp: number
  isHeadshot: boolean
  weapon: string
  distance: number
  isClutch: boolean
}

/**
 * Extract duel events from kill events
 * A duel is defined as a kill event with clear 1v1 characteristics
 */
function extractDuels(killEvents: KillEvent[], damageEvents: KillEvent['timestamp'][]): DuelEvent[] {
  const duels: DuelEvent[] = []

  killEvents.forEach(kill => {
    // Find weapon used from sound events (simplified)
    const isPistolRound = kill.weapon?.toLowerCase().includes('classic') ||
                         kill.weapon?.toLowerCase().includes('ghost') ||
                         kill.weapon?.toLowerCase().includes('frenzy') ||
                         kill.weapon?.toLowerCase().includes('sheriff')

    // Calculate rough distance indicator
    const distance = isPistolRound ? 50 : 150

    // Determine if clutch (simplified logic - would need round state)
    const isClutch = false // Would be calculated from actual round data

    duels.push({
      position: kill.position,
      winner: kill.killer,
      loser: kill.victim,
      timestamp: kill.timestamp,
      isHeadshot: kill.isHeadshot,
      weapon: kill.weapon,
      distance,
      isClutch
    })
  })

  return duels
}

/**
 * Calculate win rate at specific locations
 */
function calculateLocationWinRate(
  duels: DuelEvent[],
  center: Vector2D,
  radius: number
): { wins: number; losses: number; winRate: number } {
  let wins = 0
  let losses = 0

  duels.forEach(duel => {
    const dx = duel.position.x - center.x
    const dy = duel.position.y - center.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < radius) {
      // Count as win or loss relative to attacker perspective
      wins++
    }
  })

  const total = wins + losses
  return {
    wins,
    losses,
    winRate: total > 0 ? wins / total : 0.5
  }
}

export const duelHistoryLens: Lens = {
  name: 'duel-history',
  displayName: 'Duel History',
  description: 'Shows 1v1 win/loss locations. Green = win, Red = loss. Circle size indicates duel significance.',
  opacity: 0.8,

  defaultOptions: {
    opacity: 0.8,
    color: 'rgb(34, 197, 94)',
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: DuelHistoryOptions
  ): void => {
    const mergedOptions = { ...duelHistoryLens.defaultOptions, ...options }
    const {
      playerFilter,
      showConnections = true,
      minDistance = 50,
      showWinRate = true,
      highlightClutches = true
    } = options || {}

    const duels = extractDuels(data.killEvents, data.damageEvents.map(d => d.timestamp))

    // Filter by player if specified
    const filteredDuels = playerFilter
      ? duels.filter(d => d.winner === playerFilter || d.loser === playerFilter)
      : duels

    if (filteredDuels.length === 0) return

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity

    // Draw win rate heatmap background if enabled
    if (showWinRate) {
      drawWinRateHeatmap(ctx, duels, data.metadata)
    }

    // Group duels by approximate location for clustering
    const clusters = clusterDuels(filteredDuels, 80)

    clusters.forEach(cluster => {
      const centerX = cluster.reduce((sum, d) => sum + d.position.x, 0) / cluster.length
      const centerY = cluster.reduce((sum, d) => sum + d.position.y, 0) / cluster.length

      // Calculate cluster stats
      const wins = cluster.filter(d => !playerFilter || d.winner === playerFilter).length
      const losses = cluster.filter(d => playerFilter && d.loser === playerFilter).length
      const total = cluster.length
      const winRate = wins / total

      // Size based on cluster significance
      const baseSize = 12
      const sizeMultiplier = 1 + Math.min(2, total * 0.2)
      const radius = baseSize * sizeMultiplier

      // Color based on win rate
      const r = Math.floor(255 * (1 - winRate))
      const g = Math.floor(255 * winRate)
      const b = 0
      const color = `rgb(${r}, ${g}, ${b})`

      // Draw glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5)
      glowGradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.4)'))
      glowGradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'))
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw main circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw headshot indicator
      const headshots = cluster.filter(d => d.isHeadshot).length
      if (headshots > 0) {
        ctx.fillStyle = '#fbbf24' // Amber for headshots
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('★', centerX, centerY - radius - 5)
      }

      // Show win/loss count
      ctx.fillStyle = 'white'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${wins}/${total}`, centerX, centerY)

      // Draw clutch indicator
      if (highlightClutches) {
        const clutches = cluster.filter(d => d.isClutch).length
        if (clutches > 0) {
          ctx.strokeStyle = '#f59e0b' // Amber border for clutches
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    })

    // Draw connection lines between related duels
    if (showConnections) {
      drawDuelConnections(ctx, filteredDuels)
    }

    ctx.restore()
  }
}

/**
 * Cluster duels by proximity
 */
function clusterDuels(duels: DuelEvent[], threshold: number): DuelEvent[][] {
  const clusters: DuelEvent[][] = []
  const visited = new Set<number>()

  duels.forEach((duel, index) => {
    if (visited.has(index)) return

    const cluster: DuelEvent[] = [duel]
    visited.add(index)

    duels.forEach((other, otherIndex) => {
      if (visited.has(otherIndex) || index === otherIndex) return

      const dx = duel.position.x - other.position.x
      const dy = duel.position.y - other.position.y
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
 * Draw win rate heatmap background
 */
function drawWinRateHeatmap(
  ctx: CanvasRenderingContext2D,
  duels: DuelEvent[],
  metadata: GameData['metadata']
): void {
  const gridSize = 40
  const canvas = ctx.canvas

  // Create grid overlay
  for (let x = 0; x < canvas.width; x += gridSize) {
    for (let y = 0; y < canvas.height; y += gridSize) {
      const { winRate } = calculateLocationWinRate(duels, { x, y }, gridSize)

      if (winRate !== 0.5) {
        const r = Math.floor(255 * (1 - winRate))
        const g = Math.floor(255 * winRate)
        const alpha = Math.abs(winRate - 0.5) * 0.3

        ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`
        ctx.fillRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize)
      }
    }
  }
}

/**
 * Draw connections between related duels
 */
function drawDuelConnections(ctx: CanvasRenderingContext2D, duels: DuelEvent[]): void {
  const timeWindow = 10000 // 10 seconds

  for (let i = 0; i < duels.length; i++) {
    for (let j = i + 1; j < duels.length; j++) {
      const timeDiff = Math.abs(duels[i].timestamp - duels[j].timestamp)

      // Connect duels that happened close in time
      if (timeDiff < timeWindow) {
        const x1 = duels[i].position.x
        const y1 = duels[i].position.y
        const x2 = duels[j].position.x
        const y2 = duels[j].position.y

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 4])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }
  }

  ctx.setLineDash([])
}

export default duelHistoryLens
