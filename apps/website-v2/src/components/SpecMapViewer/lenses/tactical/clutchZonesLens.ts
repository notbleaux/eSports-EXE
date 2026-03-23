/** [Ver001.000] */
/**
 * Clutch Zones Lens
 * =================
 * Visualizes high-success clutch positions with historical data.
 * Shows success rates, recommended agents, and tactical advantages.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { ClutchZone, TeamSide } from './predictionInterface'
import { predictionModel } from './predictionInterface'

export interface ClutchZonesLensOptions extends Partial<LensOptions> {
  /** Color for high success zones */
  highSuccessColor?: string
  /** Color for medium success zones */
  mediumSuccessColor?: string
  /** Color for low success zones */
  lowSuccessColor?: string
  /** Show success rate */
  showSuccessRate?: boolean
  /** Show agent recommendations */
  showAgents?: boolean
  /** Show tactical info */
  showTactical?: boolean
  /** Minimum success rate threshold */
  minSuccessRate?: number
}

export const clutchZonesLens: Lens = {
  name: 'clutch-zones',
  displayName: 'Clutch Zones',
  description: 'Visualizes high-success clutch positions with historical win rates, recommended agents, and tactical advantages.',
  opacity: 0.65,

  defaultOptions: {
    opacity: 0.65,
    color: 'rgb(168, 85, 247)', // Purple-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: ClutchZonesLensOptions
  ): void => {
    const mergedOptions = { ...clutchZonesLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const highSuccessColor = options?.highSuccessColor || 'rgb(34, 197, 94)'   // Green-500
    const mediumSuccessColor = options?.mediumSuccessColor || 'rgb(168, 85, 247)' // Purple-500
    const lowSuccessColor = options?.lowSuccessColor || 'rgb(239, 68, 68)'     // Red-500
    const showSuccessRate = options?.showSuccessRate !== false
    const showAgents = options?.showAgents !== false
    const showTactical = options?.showTactical !== false
    const minSuccessRate = options?.minSuccessRate ?? 0.2

    // Get clutch zones for key positions
    const zones: ClutchZone[] = []
    data.playerPositions.forEach(player => {
      const lastPos = player.positions[player.positions.length - 1]
      if (!lastPos) return

      const playerZones = predictionModel.identifyClutchZones(
        { x: lastPos.x, y: lastPos.y },
        player.team
      )
      zones.push(...playerZones)
    })

    // Also add predefined clutch spots
    const predefinedZones = [
      { x: 25, y: 25, team: 'defenders' as TeamSide },
      { x: 50, y: 45, team: 'defenders' as TeamSide },
      { x: 32, y: 32, team: 'attackers' as TeamSide }
    ]

    predefinedZones.forEach(pos => {
      const posZones = predictionModel.identifyClutchZones({ x: pos.x, y: pos.y }, pos.team)
      zones.push(...posZones)
    })

    // Filter by success rate and deduplicate
    const uniqueZones = deduplicateZones(zones).filter(z => z.successRate >= minSuccessRate)

    if (uniqueZones.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Sort by success rate (highest first)
    uniqueZones.sort((a, b) => b.successRate - a.successRate)

    uniqueZones.forEach((zone, index) => {
      const color = getSuccessColor(zone.successRate, highSuccessColor, mediumSuccessColor, lowSuccessColor)

      // Draw zone visualization
      drawClutchZone(ctx, zone, color, index === 0)

      // Draw success rate
      if (showSuccessRate && showLabels) {
        drawSuccessRateLabel(ctx, zone, color)
      }

      // Draw agent recommendations
      if (showAgents && showLabels) {
        drawAgentRecommendations(ctx, zone)
      }

      // Draw tactical info
      if (showTactical && showLabels) {
        drawTacticalInfo(ctx, zone)
      }
    })

    ctx.restore()
  }
}

/** Draw clutch zone visualization */
function drawClutchZone(
  ctx: CanvasRenderingContext2D,
  zone: ClutchZone,
  color: string,
  isBest: boolean
): void {
  ctx.save()

  // Pulsing effect for best zone
  const pulse = isBest ? (Math.sin(Date.now() / 300) + 1) / 2 : 0

  // Zone circle
  const gradient = ctx.createRadialGradient(
    zone.position.x,
    zone.position.y,
    0,
    zone.position.x,
    zone.position.y,
    zone.radius
  )

  const alpha = 0.15 + zone.successRate * 0.25 + (isBest ? pulse * 0.1 : 0)
  gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'))
  gradient.addColorStop(0.6, color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba'))
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, zone.radius, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = isBest ? 2 + pulse : 1.5
  ctx.globalAlpha = isBest ? 0.8 + pulse * 0.2 : 0.6
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, zone.radius, 0, Math.PI * 2)
  ctx.stroke()

  // Center marker
  ctx.fillStyle = color
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, 4, 0, Math.PI * 2)
  ctx.fill()

  // Sample size indicator (small dots around edge)
  const dotCount = Math.min(8, Math.floor(zone.sampleSize / 5))
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2
    const dotX = zone.position.x + Math.cos(angle) * (zone.radius - 3)
    const dotY = zone.position.y + Math.sin(angle) * (zone.radius - 3)

    ctx.fillStyle = color
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** Draw success rate label */
function drawSuccessRateLabel(
  ctx: CanvasRenderingContext2D,
  zone: ClutchZone,
  color: string
): void {
  const labelY = zone.position.y - zone.radius - 8

  ctx.save()

  // Background
  const text = `${Math.round(zone.successRate * 100)}% win rate`
  ctx.font = 'bold 10px sans-serif'
  const metrics = ctx.measureText(text)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(
    zone.position.x - metrics.width / 2 - 4,
    labelY - 8,
    metrics.width + 8,
    16
  )

  // Text
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, zone.position.x, labelY)

  // Sample size
  const sampleText = `n=${zone.sampleSize}`
  ctx.font = '8px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillText(sampleText, zone.position.x, labelY + 12)

  ctx.restore()
}

/** Draw agent recommendations */
function drawAgentRecommendations(
  ctx: CanvasRenderingContext2D,
  zone: ClutchZone
): void {
  const startY = zone.position.y + zone.radius + 10

  ctx.save()

  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  zone.recommendedAgents.slice(0, 2).forEach((agent, i) => {
    const y = startY + i * 12

    // Agent icon placeholder (colored dot)
    const colors: Record<string, string> = {
      'Cypher': '#00d4aa',
      'Killjoy': '#ffea00',
      'Sage': '#00ffff',
      'Chamber': '#c8a2c8',
      'Jett': '#87ceeb',
      'Raze': '#ff6b35'
    }

    ctx.fillStyle = colors[agent] || '#94a3b8'
    ctx.beginPath()
    ctx.arc(zone.position.x - 20, y, 3, 0, Math.PI * 2)
    ctx.fill()

    // Agent name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(agent, zone.position.x, y)
  })

  ctx.restore()
}

/** Draw tactical information */
function drawTacticalInfo(
  ctx: CanvasRenderingContext2D,
  zone: ClutchZone
): void {
  const infoX = zone.position.x + zone.radius + 10
  const startY = zone.position.y - 15

  ctx.save()

  ctx.font = '8px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  // Cover rating
  ctx.fillStyle = zone.coverRating > 0.7 ? '#22c55e' : zone.coverRating > 0.5 ? '#eab308' : '#ef4444'
  ctx.fillText(`Cover: ${Math.round(zone.coverRating * 100)}%`, infoX, startY)

  // Escape rating
  ctx.fillStyle = zone.escapeRating > 0.7 ? '#22c55e' : zone.escapeRating > 0.5 ? '#eab308' : '#ef4444'
  ctx.fillText(`Escape: ${Math.round(zone.escapeRating * 100)}%`, infoX, startY + 12)

  ctx.restore()
}

/** Get color based on success rate */
function getSuccessColor(
  rate: number,
  highColor: string,
  mediumColor: string,
  lowColor: string
): string {
  if (rate >= 0.4) return highColor
  if (rate >= 0.3) return mediumColor
  return lowColor
}

/** Deduplicate zones by position proximity */
function deduplicateZones(zones: ClutchZone[]): ClutchZone[] {
  const unique: ClutchZone[] = []
  const threshold = 10 // pixels

  zones.forEach(zone => {
    const isDuplicate = unique.some(existing => {
      const dist = Math.hypot(
        existing.position.x - zone.position.x,
        existing.position.y - zone.position.y
      )
      return dist < threshold
    })

    if (!isDuplicate) {
      unique.push(zone)
    }
  })

  return unique
}

export default clutchZonesLens
