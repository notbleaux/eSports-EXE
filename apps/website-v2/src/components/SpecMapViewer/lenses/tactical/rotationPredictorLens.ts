/** [Ver001.000] */
/**
 * Rotation Predictor Lens
 * =======================
 * Visualizes predicted team rotations with confidence indicators.
 * Shows likely rotation paths, timing estimates, and risk assessments.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { RotationPrediction, TeamSide, Bombsite } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface RotationPredictorLensOptions extends Partial<LensOptions> {
  /** Color for attacker rotations */
  attackerColor?: string
  /** Color for defender rotations */
  defenderColor?: string
  /** Show confidence indicators */
  showConfidence?: boolean
  /** Show timing estimates */
  showTiming?: boolean
  /** Minimum confidence threshold (0-1) */
  confidenceThreshold?: number
  /** Arrow size in pixels */
  arrowSize?: number
}

/** Site coordinates for rotation visualization */
const SITE_COORDS: Record<Bombsite, { x: number; y: number }> = {
  A: { x: 25, y: 25 },
  B: { x: 50, y: 45 },
  Mid: { x: 32, y: 32 }
}

export const rotationPredictorLens: Lens = {
  name: 'rotation-predictor',
  displayName: 'Rotation Predictor',
  description: 'Predicts and visualizes team rotations with confidence indicators, timing estimates, and pathway analysis.',
  opacity: 0.75,

  defaultOptions: {
    opacity: 0.75,
    color: 'rgb(139, 92, 246)', // Violet-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: RotationPredictorLensOptions
  ): void => {
    const mergedOptions = { ...rotationPredictorLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const attackerColor = options?.attackerColor || 'rgb(239, 68, 68)'   // Red-500
    const defenderColor = options?.defenderColor || 'rgb(59, 130, 246)'  // Blue-500
    const showConfidence = options?.showConfidence !== false
    const showTiming = options?.showTiming !== false
    const confidenceThreshold = options?.confidenceThreshold ?? 0.4
    const arrowSize = options?.arrowSize ?? 14

    // Get predictions from model
    const gameState = toPredictionState(data)
    const predictions = predictionModel.predictRotations(data.playerPositions, gameState)
      .filter(p => p.confidence >= confidenceThreshold)

    if (predictions.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    predictions.forEach((prediction, index) => {
      const color = prediction.playerCount >= 3 ? attackerColor : defenderColor
      const fromPos = SITE_COORDS[prediction.from]
      const toPos = SITE_COORDS[prediction.to]

      // Draw predicted rotation path
      drawRotationPath(ctx, fromPos, toPos, prediction, color, arrowSize, index)

      // Draw confidence indicator
      if (showConfidence) {
        drawConfidenceIndicator(ctx, fromPos, toPos, prediction.confidence, color)
      }

      // Draw timing estimate
      if (showTiming && showLabels) {
        drawTimingLabel(ctx, fromPos, toPos, prediction.estimatedTime, prediction.playerCount)
      }

      // Draw risk warning for high-risk rotations
      if (prediction.riskLevel === 'high') {
        drawRiskWarning(ctx, fromPos, toPos)
      }
    })

    ctx.restore()
  }
}

/** Draw the predicted rotation path with animated flow */
function drawRotationPath(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  prediction: RotationPrediction,
  color: string,
  arrowSize: number,
  index: number
): void {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)

  // Animation offset based on index and time
  const animationOffset = (Date.now() / 1000 + index * 0.5) % 1

  ctx.save()

  // Draw base path (dashed line)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.4
  ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Draw animated flow particles
  ctx.setLineDash([])
  ctx.globalAlpha = 0.8

  const particleCount = Math.max(3, Math.floor(prediction.playerCount * 0.8))
  for (let i = 0; i < particleCount; i++) {
    const particleProgress = (animationOffset + i / particleCount) % 1
    const px = from.x + dx * particleProgress
    const py = from.y + dy * particleProgress

    // Particle glow
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, arrowSize * 0.6)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba'))
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(px, py, arrowSize * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw arrowhead at destination
  const arrowProgress = 0.85 // Position arrow near destination
  const arrowX = from.x + dx * arrowProgress
  const arrowY = from.y + dy * arrowProgress

  ctx.translate(arrowX, arrowY)
  ctx.rotate(angle)

  // Arrow shape
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-arrowSize, -arrowSize / 2)
  ctx.lineTo(-arrowSize * 0.6, 0)
  ctx.lineTo(-arrowSize, arrowSize / 2)
  ctx.closePath()

  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.fill()

  ctx.restore()
}

/** Draw confidence level indicator */
function drawConfidenceIndicator(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  confidence: number,
  color: string
): void {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const radius = 10

  ctx.save()

  // Background circle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.arc(midX, midY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Confidence arc
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + Math.PI * 2 * confidence

  ctx.strokeStyle = confidence > 0.7 ? '#22c55e' : confidence > 0.5 ? '#eab308' : '#ef4444'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(midX, midY, radius - 2, startAngle, endAngle)
  ctx.stroke()

  // Confidence percentage
  ctx.fillStyle = 'white'
  ctx.font = 'bold 8px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${Math.round(confidence * 100)}%`, midX, midY)

  ctx.restore()
}

/** Draw timing estimate label */
function drawTimingLabel(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  estimatedTime: number,
  playerCount: number
): void {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const labelX = from.x + dx * 0.3
  const labelY = from.y + dy * 0.3 - 15

  const timeSeconds = Math.round(estimatedTime / 1000)

  ctx.save()

  // Label background
  const text = `${timeSeconds}s • ${playerCount}p`
  ctx.font = '10px sans-serif'
  const metrics = ctx.measureText(text)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(
    labelX - metrics.width / 2 - 4,
    labelY - 8,
    metrics.width + 8,
    16
  )

  // Label text
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, labelX, labelY)

  ctx.restore()
}

/** Draw risk warning indicator */
function drawRiskWarning(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number }
): void {
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2 - 25

  ctx.save()

  // Pulsing warning
  const pulse = (Math.sin(Date.now() / 200) + 1) / 2

  ctx.fillStyle = `rgba(234, 179, 8, ${0.5 + pulse * 0.5})`
  ctx.beginPath()
  ctx.moveTo(midX, midY - 6)
  ctx.lineTo(midX + 6, midY + 6)
  ctx.lineTo(midX - 6, midY + 6)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', midX, midY + 3)

  ctx.restore()
}

export default rotationPredictorLens
