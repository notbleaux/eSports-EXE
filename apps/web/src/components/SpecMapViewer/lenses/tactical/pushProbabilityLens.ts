/** [Ver001.000] */
/**
 * Push Probability Lens
 * =====================
 * Visualizes site execute likelihood with probability heatmaps.
 * Shows predicted targets, expected compositions, and utility commitment.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { PushProbability, Bombsite } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface PushProbabilityLensOptions extends Partial<LensOptions> {
  /** Color for high probability */
  highProbColor?: string
  /** Color for medium probability */
  mediumProbColor?: string
  /** Color for low probability */
  lowProbColor?: string
  /** Show probability numbers */
  showProbability?: boolean
  /** Show utility prediction */
  showUtility?: boolean
  /** Show expected timing */
  showTiming?: boolean
  /** Minimum probability threshold */
  minProbability?: number
}

/** Site visualization bounds */
const SITE_BOUNDS: Record<Bombsite, { x: number; y: number; width: number; height: number }> = {
  A: { x: 20, y: 20, width: 15, height: 15 },
  B: { x: 45, y: 40, width: 15, height: 15 },
  Mid: { x: 27, y: 27, width: 12, height: 12 }
}

export const pushProbabilityLens: Lens = {
  name: 'push-probability',
  displayName: 'Push Probability',
  description: 'Visualizes site execute likelihood with probability heatmaps, expected compositions, and utility commitment predictions.',
  opacity: 0.7,

  defaultOptions: {
    opacity: 0.7,
    color: 'rgb(249, 115, 22)', // Orange-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: PushProbabilityLensOptions
  ): void => {
    const mergedOptions = { ...pushProbabilityLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const highProbColor = options?.highProbColor || 'rgb(239, 68, 68)'     // Red-500
    const mediumProbColor = options?.mediumProbColor || 'rgb(249, 115, 22)' // Orange-500
    const lowProbColor = options?.lowProbColor || 'rgb(234, 179, 8)'       // Yellow-500
    const showProbability = options?.showProbability !== false
    const showUtility = options?.showUtility !== false
    const showTiming = options?.showTiming !== false
    const minProbability = options?.minProbability ?? 0.2

    // Get push probabilities from model
    const gameState = toPredictionState(data)
    const probabilities = predictionModel.predictPushProbability(gameState)
      .filter(p => p.probability >= minProbability)

    if (probabilities.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Sort by probability (highest first)
    probabilities.sort((a, b) => b.probability - a.probability)

    probabilities.forEach((prob, index) => {
      const bounds = SITE_BOUNDS[prob.targetSite]
      const color = getProbabilityColor(prob.probability, highProbColor, mediumProbColor, lowProbColor)

      // Draw probability heat overlay
      drawProbabilityOverlay(ctx, bounds, prob, color, index === 0)

      // Draw probability label
      if (showProbability && showLabels) {
        drawProbabilityLabel(ctx, bounds, prob, color)
      }

      // Draw utility prediction
      if (showUtility && showLabels) {
        drawUtilityPrediction(ctx, bounds, prob)
      }

      // Draw timing prediction
      if (showTiming && showLabels) {
        drawTimingPrediction(ctx, bounds, prob)
      }
    })

    ctx.restore()
  }
}

/** Draw probability heat overlay on site */
function drawProbabilityOverlay(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  prob: PushProbability,
  color: string,
  isPrimary: boolean
): void {
  ctx.save()

  // Pulsing effect for highest probability
  const pulse = isPrimary ? (Math.sin(Date.now() / 400) + 1) / 2 : 0.5

  // Base overlay
  const gradient = ctx.createRadialGradient(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
    0,
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
    bounds.width
  )

  const alpha = 0.2 + prob.probability * 0.3 + (isPrimary ? pulse * 0.1 : 0)
  gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'))
  gradient.addColorStop(0.7, color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba'))
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.fillRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10)

  // Border glow for primary target
  if (isPrimary) {
    ctx.strokeStyle = color
    ctx.lineWidth = 2 + pulse
    ctx.shadowColor = color
    ctx.shadowBlur = 10 + pulse * 5
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  ctx.restore()
}

/** Draw probability percentage label */
function drawProbabilityLabel(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  prob: PushProbability,
  color: string
): void {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2

  ctx.save()

  // Background circle
  const radius = 14
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.beginPath()
  ctx.arc(centerX, centerY - 5, radius, 0, Math.PI * 2)
  ctx.fill()

  // Probability text
  const percentage = Math.round(prob.probability * 100)
  ctx.fillStyle = color
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${percentage}%`, centerX, centerY - 5)

  // Site label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = '9px sans-serif'
  ctx.fillText(`Site ${prob.targetSite}`, centerX, centerY + 12)

  ctx.restore()
}

/** Draw utility prediction icons */
function drawUtilityPrediction(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  prob: PushProbability
): void {
  const startX = bounds.x + 2
  const y = bounds.y + bounds.height + 5

  ctx.save()
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const utility = prob.utilityCommitment
  const items: { icon: string; count: number; color: string }[] = [
    { icon: '○', count: utility.smokes, color: '#94a3b8' },
    { icon: '✦', count: utility.flashes, color: '#fbbf24' },
    { icon: '🔥', count: utility.mollies, color: '#f97316' }
  ]

  let x = startX
  items.forEach(item => {
    if (item.count > 0) {
      ctx.fillStyle = item.color
      ctx.fillText(`${item.icon}${item.count}`, x, y)
      x += 18
    }
  })

  ctx.restore()
}

/** Draw timing prediction */
function drawTimingPrediction(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  prob: PushProbability
): void {
  const centerX = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height + 18

  ctx.save()

  const seconds = Math.round(prob.expectedTiming / 1000)
  const text = `~${seconds}s`

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, centerX, y)

  ctx.restore()
}

/** Get color based on probability value */
function getProbabilityColor(
  probability: number,
  highColor: string,
  mediumColor: string,
  lowColor: string
): string {
  if (probability >= 0.6) return highColor
  if (probability >= 0.4) return mediumColor
  return lowColor
}

export default pushProbabilityLens
