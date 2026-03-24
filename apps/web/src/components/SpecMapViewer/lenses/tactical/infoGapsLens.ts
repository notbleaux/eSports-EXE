/** [Ver001.000] */
/**
 * Info Gaps Lens
 * ==============
 * Visualizes unobserved map areas with risk assessment.
 * Shows information gaps, time since last intel, and recommended actions.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { InfoGap } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface InfoGapsLensOptions extends Partial<LensOptions> {
  /** Color for low risk gaps */
  lowRiskColor?: string
  /** Color for medium risk gaps */
  mediumRiskColor?: string
  /** Color for high risk gaps */
  highRiskColor?: string
  /** Color for critical risk gaps */
  criticalRiskColor?: string
  /** Show time since intel */
  showTime?: boolean
  /** Show risk level */
  showRiskLevel?: boolean
  /** Show recommendations */
  showRecommendations?: boolean
  /** Maximum time threshold (ms) */
  maxTimeThreshold?: number
}

/** Key map areas to monitor */
const KEY_AREAS = [
  { name: 'A Site', center: { x: 25, y: 25 }, radius: 18 },
  { name: 'B Site', center: { x: 50, y: 45 }, radius: 18 },
  { name: 'Mid', center: { x: 32, y: 32 }, radius: 12 },
  { name: 'A Short', center: { x: 15, y: 20 }, radius: 10 },
  { name: 'B Long', center: { x: 60, y: 45 }, radius: 10 },
  { name: 'Hookah', center: { x: 55, y: 35 }, radius: 8 },
  { name: 'Showers', center: { x: 20, y: 15 }, radius: 8 }
]

export const infoGapsLens: Lens = {
  name: 'info-gaps',
  displayName: 'Info Gaps',
  description: 'Visualizes unobserved map areas with risk assessment, time since last intel, and recommended information gathering actions.',
  opacity: 0.65,

  defaultOptions: {
    opacity: 0.65,
    color: 'rgb(234, 179, 8)', // Yellow-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: InfoGapsLensOptions
  ): void => {
    const mergedOptions = { ...infoGapsLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const lowRiskColor = options?.lowRiskColor || 'rgb(34, 197, 94)'      // Green-500
    const mediumRiskColor = options?.mediumRiskColor || 'rgb(234, 179, 8)' // Yellow-500
    const highRiskColor = options?.highRiskColor || 'rgb(249, 115, 22)'   // Orange-500
    const criticalRiskColor = options?.criticalRiskColor || 'rgb(239, 68, 68)' // Red-500
    const showTime = options?.showTime !== false
    const showRiskLevel = options?.showRiskLevel !== false
    const showRecommendations = options?.showRecommendations !== false
    const maxTimeThreshold = options?.maxTimeThreshold ?? 60000

    // Get info gaps from model
    const gameState = toPredictionState(data)
    let gaps = predictionModel.identifyInfoGaps(gameState)

    // Ensure all key areas are covered
    KEY_AREAS.forEach(area => {
      const existing = gaps.find(g =>
        Math.hypot(g.center.x - area.center.x, g.center.y - area.center.y) < 10
      )

      if (!existing) {
        // Check if area is visible
        const isVisible = data.playerPositions.some(p => {
          const lastPos = p.positions[p.positions.length - 1]
          if (!lastPos) return false
          return Math.hypot(lastPos.x - area.center.x, lastPos.y - area.center.y) < 25
        })

        if (!isVisible) {
          gaps.push({
            center: area.center,
            radius: area.radius,
            timeSinceIntel: gameState.roundTime,
            confidence: 0,
            riskLevel: gameState.roundTime > 30000 ? 'high' : 'medium',
            recommendedActions: ['Deploy recon', 'Check angle', 'Use utility'],
            visibleAreas: []
          })
        }
      }
    })

    // Filter by time threshold
    gaps = gaps.filter(g => g.timeSinceIntel <= maxTimeThreshold)

    if (gaps.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Sort by risk (highest first)
    const riskOrder = { critical: 3, high: 2, medium: 1, low: 0 }
    gaps.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel])

    gaps.forEach((gap, index) => {
      const color = getRiskColor(gap.riskLevel, {
        lowRiskColor,
        mediumRiskColor,
        highRiskColor,
        criticalRiskColor
      })
      const isCritical = gap.riskLevel === 'critical' || gap.riskLevel === 'high'

      // Draw gap area
      drawGapArea(ctx, gap, color, isCritical)

      // Draw time indicator
      if (showTime && showLabels) {
        drawTimeIndicator(ctx, gap, color)
      }

      // Draw risk level
      if (showRiskLevel && showLabels) {
        drawRiskLabel(ctx, gap, color)
      }

      // Draw recommendations
      if (showRecommendations && showLabels && isCritical) {
        drawRecommendations(ctx, gap)
      }
    })

    ctx.restore()
  }
}

/** Draw information gap area */
function drawGapArea(
  ctx: CanvasRenderingContext2D,
  gap: InfoGap,
  color: string,
  isCritical: boolean
): void {
  ctx.save()

  // Pulsing effect for critical gaps
  const pulse = isCritical ? (Math.sin(Date.now() / 250) + 1) / 2 : 0

  // Base area
  const gradient = ctx.createRadialGradient(
    gap.center.x,
    gap.center.y,
    0,
    gap.center.x,
    gap.center.y,
    gap.radius
  )

  const alpha = 0.1 + (isCritical ? pulse * 0.15 : 0)
  gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'))
  gradient.addColorStop(0.6, color.replace(')', `, ${alpha * 0.6})`).replace('rgb', 'rgba'))
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(gap.center.x, gap.center.y, gap.radius, 0, Math.PI * 2)
  ctx.fill()

  // Border with question mark pattern
  ctx.strokeStyle = color
  ctx.lineWidth = isCritical ? 2 + pulse : 1.5
  ctx.globalAlpha = isCritical ? 0.6 + pulse * 0.3 : 0.4

  // Dashed border
  ctx.setLineDash([4, 4])
  ctx.lineDashOffset = -Date.now() / 50
  ctx.beginPath()
  ctx.arc(gap.center.x, gap.center.y, gap.radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Question mark in center
  ctx.fillStyle = color
  ctx.globalAlpha = 0.7
  ctx.font = `bold ${isCritical ? 16 : 12}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', gap.center.x, gap.center.y)

  ctx.restore()
}

/** Draw time since last intel indicator */
function drawTimeIndicator(
  ctx: CanvasRenderingContext2D,
  gap: InfoGap,
  color: string
): void {
  const labelY = gap.center.y - gap.radius - 10

  ctx.save()

  const seconds = Math.round(gap.timeSinceIntel / 1000)
  const text = `${seconds}s no info`

  ctx.font = '9px sans-serif'
  const metrics = ctx.measureText(text)

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(
    gap.center.x - metrics.width / 2 - 4,
    labelY - 7,
    metrics.width + 8,
    14
  )

  // Text - color changes based on time
  let textColor = color
  if (gap.timeSinceIntel > 45000) textColor = '#ef4444'
  else if (gap.timeSinceIntel > 30000) textColor = '#f97316'

  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, gap.center.x, labelY)

  ctx.restore()
}

/** Draw risk level label */
function drawRiskLabel(
  ctx: CanvasRenderingContext2D,
  gap: InfoGap,
  color: string
): void {
  const labelY = gap.center.y + gap.radius + 12

  ctx.save()

  const riskText = gap.riskLevel.toUpperCase()

  ctx.font = 'bold 8px sans-serif'
  const metrics = ctx.measureText(riskText)

  // Background pill
  const pillWidth = metrics.width + 8
  const pillHeight = 12

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  roundRect(
    ctx,
    gap.center.x - pillWidth / 2,
    labelY - pillHeight / 2,
    pillWidth,
    pillHeight,
    6
  )
  ctx.fill()

  // Text
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(riskText, gap.center.x, labelY)

  ctx.restore()
}

/** Draw recommended actions */
function drawRecommendations(
  ctx: CanvasRenderingContext2D,
  gap: InfoGap
): void {
  const startY = gap.center.y + gap.radius + 25

  ctx.save()

  ctx.font = '8px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  gap.recommendedActions.slice(0, 2).forEach((action, i) => {
    const y = startY + i * 11

    // Action icon
    const icons: Record<string, string> = {
      'Send scout': '👁',
      'Use recon ability': '📡',
      'Pre-fire common angles': '🔫',
      'Deploy recon': '📡',
      'Check angle': '👁',
      'Use utility': '⚡'
    }

    const icon = icons[action] || '•'

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText(`${icon} ${action}`, gap.center.x, y)
  })

  ctx.restore()
}

/** Get color based on risk level */
function getRiskColor(
  level: InfoGap['riskLevel'],
  colors: {
    lowRiskColor: string
    mediumRiskColor: string
    highRiskColor: string
    criticalRiskColor: string
  }
): string {
  switch (level) {
    case 'low': return colors.lowRiskColor
    case 'medium': return colors.mediumRiskColor
    case 'high': return colors.highRiskColor
    case 'critical': return colors.criticalRiskColor
    default: return colors.mediumRiskColor
  }
}

/** Helper: Draw rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export default infoGapsLens
