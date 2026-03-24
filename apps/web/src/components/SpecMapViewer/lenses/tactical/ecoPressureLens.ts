/** [Ver001.000] */
/**
 * Eco Pressure Lens
 * =================
 * Visualizes force buy risk and economic pressure indicators.
 * Shows team economy status, predicted round type, and counter-strategy recommendations.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { EcoPressure, TeamSide } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface EcoPressureLensOptions extends Partial<LensOptions> {
  /** Color for low pressure */
  lowPressureColor?: string
  /** Color for medium pressure */
  mediumPressureColor?: string
  /** Color for high pressure */
  highPressureColor?: string
  /** Color for extreme pressure */
  extremePressureColor?: string
  /** Show economy bars */
  showEconomy?: boolean
  /** Show pressure meter */
  showPressureMeter?: boolean
  /** Show round type prediction */
  showRoundType?: boolean
  /** Show counter strategies */
  showStrategies?: boolean
}

export const ecoPressureLens: Lens = {
  name: 'eco-pressure',
  displayName: 'Eco Pressure',
  description: 'Visualizes force buy risk and economic pressure with team economy status, round type predictions, and counter-strategy recommendations.',
  opacity: 0.75,

  defaultOptions: {
    opacity: 0.75,
    color: 'rgb(244, 63, 94)', // Rose-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: EcoPressureLensOptions
  ): void => {
    const mergedOptions = { ...ecoPressureLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const lowPressureColor = options?.lowPressureColor || 'rgb(34, 197, 94)'      // Green-500
    const mediumPressureColor = options?.mediumPressureColor || 'rgb(234, 179, 8)' // Yellow-500
    const highPressureColor = options?.highPressureColor || 'rgb(249, 115, 22)'   // Orange-500
    const extremePressureColor = options?.extremePressureColor || 'rgb(239, 68, 68)' // Red-500
    const showEconomy = options?.showEconomy !== false
    const showPressureMeter = options?.showPressureMeter !== false
    const showRoundType = options?.showRoundType !== false
    const showStrategies = options?.showStrategies !== false

    // Get eco pressure from model
    const gameState = toPredictionState(data)
    const pressure = predictionModel.assessEcoPressure(gameState)

    ctx.save()
    ctx.globalAlpha = opacity

    // Draw team economy panel
    if (showEconomy && showLabels) {
      drawEconomyPanel(ctx, pressure, gameState, {
        lowPressureColor,
        mediumPressureColor,
        highPressureColor,
        extremePressureColor
      })
    }

    // Draw pressure meter
    if (showPressureMeter && showLabels) {
      drawPressureMeter(ctx, pressure, {
        lowPressureColor,
        mediumPressureColor,
        highPressureColor,
        extremePressureColor
      })
    }

    // Draw round type prediction
    if (showRoundType && showLabels) {
      drawRoundTypePrediction(ctx, pressure)
    }

    // Draw counter strategies
    if (showStrategies && showLabels) {
      drawCounterStrategies(ctx, pressure)
    }

    // Draw pressure overlay on map
    drawPressureOverlay(ctx, pressure, {
      lowPressureColor,
      mediumPressureColor,
      highPressureColor,
      extremePressureColor
    })

    ctx.restore()
  }
}

/** Draw economy panel for both teams */
function drawEconomyPanel(
  ctx: CanvasRenderingContext2D,
  pressure: EcoPressure,
  gameState: ReturnType<typeof toPredictionState>,
  colors: {
    lowPressureColor: string
    mediumPressureColor: string
    highPressureColor: string
    extremePressureColor: string
  }
): void {
  const panelX = 5
  const panelY = 5
  const panelWidth = 90
  const panelHeight = 45

  ctx.save()

  // Panel background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight)

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('ECONOMY', panelX + 5, panelY + 3)

  // Attacker economy bar
  const attackerEco = gameState.economy.attackers
  const maxEco = 20000
  const barWidth = panelWidth - 30
  const barHeight = 8

  drawEcoBar(
    ctx,
    panelX + 5,
    panelY + 18,
    barWidth,
    barHeight,
    attackerEco,
    maxEco,
    '#ef4444',
    'ATK'
  )

  // Defender economy bar
  const defenderEco = gameState.economy.defenders
  drawEcoBar(
    ctx,
    panelX + 5,
    panelY + 32,
    barWidth,
    barHeight,
    defenderEco,
    maxEco,
    '#3b82f6',
    'DEF'
  )

  ctx.restore()
}

/** Draw individual economy bar */
function drawEcoBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  max: number,
  color: string,
  label: string
): void {
  const fillRatio = Math.min(1, value / max)

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(x + 15, y, width, height)

  // Fill
  ctx.fillStyle = color
  ctx.fillRect(x + 15, y, width * fillRatio, height)

  // Label
  ctx.fillStyle = color
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y + height / 2)

  // Value
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.textAlign = 'right'
  ctx.fillText(`$${Math.round(value / 1000)}k`, x + 15 + width, y + height / 2)
}

/** Draw pressure meter */
function drawPressureMeter(
  ctx: CanvasRenderingContext2D,
  pressure: EcoPressure,
  colors: {
    lowPressureColor: string
    mediumPressureColor: string
    highPressureColor: string
    extremePressureColor: string
  }
): void {
  const meterX = 5
  const meterY = 55
  const meterWidth = 90
  const meterHeight = 35

  ctx.save()

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(meterX, meterY, meterWidth, meterHeight)

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('PRESSURE', meterX + 5, meterY + 3)

  // Pressure gauge
  const gaugeY = meterY + 20
  const gaugeWidth = meterWidth - 10
  const gaugeHeight = 10

  // Background track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(meterX + 5, gaugeY, gaugeWidth, gaugeHeight)

  // Pressure segments
  const segments = 10
  const segmentWidth = gaugeWidth / segments
  const filledSegments = Math.floor(pressure.pressureLevel * segments)

  for (let i = 0; i < filledSegments; i++) {
    const ratio = i / segments
    const color = getPressureColor(ratio, colors)
    const x = meterX + 5 + i * segmentWidth + 1

    ctx.fillStyle = color
    ctx.fillRect(x, gaugeY + 1, segmentWidth - 2, gaugeHeight - 2)
  }

  // Pressure percentage
  ctx.fillStyle = getPressureColor(pressure.pressureLevel, colors)
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${Math.round(pressure.pressureLevel * 100)}%`, meterX + meterWidth / 2, gaugeY - 6)

  ctx.restore()
}

/** Draw round type prediction */
function drawRoundTypePrediction(
  ctx: CanvasRenderingContext2D,
  pressure: EcoPressure
): void {
  const panelX = 5
  const panelY = 95
  const panelWidth = 90
  const panelHeight = 40

  ctx.save()

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight)

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('PREDICTION', panelX + 5, panelY + 3)

  // Round type badge
  const roundType = pressure.predictedRoundType
  const typeColors: Record<string, string> = {
    'force': '#ef4444',
    'eco': '#6b7280',
    'half-buy': '#eab308',
    'full-buy': '#22c55e'
  }

  const badgeY = panelY + 20
  const badgeWidth = 70
  const badgeHeight = 16

  ctx.fillStyle = typeColors[roundType] || '#6b7280'
  roundRect(ctx, panelX + 10, badgeY, badgeWidth, badgeHeight, 8)
  ctx.fill()

  ctx.fillStyle = 'white'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(roundType.toUpperCase(), panelX + 10 + badgeWidth / 2, badgeY + badgeHeight / 2)

  // Force buy warning
  if (pressure.forceBuyRisk > 0.5) {
    const warningY = badgeY + badgeHeight + 8
    const pulse = (Math.sin(Date.now() / 200) + 1) / 2

    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.5})`
    ctx.font = 'bold 8px sans-serif'
    ctx.fillText('⚠ FORCE BUY RISK', panelX + panelWidth / 2, warningY)
  }

  ctx.restore()
}

/** Draw counter strategies */
function drawCounterStrategies(
  ctx: CanvasRenderingContext2D,
  pressure: EcoPressure
): void {
  const panelX = 5
  const panelY = 140
  const panelWidth = 90
  const lineHeight = 11

  ctx.save()

  const strategies = pressure.counterStrategies.slice(0, 3)
  const panelHeight = 18 + strategies.length * lineHeight

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight)

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('COUNTER PLAY', panelX + 5, panelY + 3)

  // Strategies
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'left'

  strategies.forEach((strategy, i) => {
    const y = panelY + 16 + i * lineHeight

    // Bullet
    ctx.fillStyle = '#22c55e'
    ctx.fillText('→', panelX + 5, y)

    // Strategy text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    const maxWidth = panelWidth - 15
    const words = strategy.split(' ')
    let line = ''
    let lineY = y

    words.forEach(word => {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, panelX + 15, lineY)
        line = word + ' '
        lineY += 10
      } else {
        line = testLine
      }
    })
    ctx.fillText(line, panelX + 15, lineY)
  })

  ctx.restore()
}

/** Draw pressure overlay on map areas */
function drawPressureOverlay(
  ctx: CanvasRenderingContext2D,
  pressure: EcoPressure,
  colors: {
    lowPressureColor: string
    mediumPressureColor: string
    highPressureColor: string
    extremePressureColor: string
  }
): void {
  if (pressure.pressureLevel < 0.3) return

  ctx.save()

  const color = getPressureColor(pressure.pressureLevel, colors)
  const pulse = (Math.sin(Date.now() / 300) + 1) / 2

  // Aggression prediction indicator
  const aggressionLevels: Record<string, number> = {
    'passive': 0.2,
    'moderate': 0.5,
    'aggressive': 0.8,
    'desperate': 1.0
  }

  const aggressionLevel = aggressionLevels[pressure.aggressionPrediction] || 0.5

  if (aggressionLevel > 0.5) {
    // Warning overlay on map
    const gradient = ctx.createRadialGradient(
      37, 32, 0,
      37, 32, 40
    )

    const alpha = (pressure.pressureLevel * 0.1 + pulse * 0.05) * aggressionLevel
    gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'))
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(37, 32, 40, 0, Math.PI * 2)
    ctx.fill()

    // Aggression text
    ctx.fillStyle = color
    ctx.globalAlpha = 0.7 + pulse * 0.3
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      pressure.aggressionPrediction.toUpperCase(),
      37,
      32
    )
  }

  ctx.restore()
}

/** Get color based on pressure level */
function getPressureColor(
  level: number,
  colors: {
    lowPressureColor: string
    mediumPressureColor: string
    highPressureColor: string
    extremePressureColor: string
  }
): string {
  if (level < 0.3) return colors.lowPressureColor
  if (level < 0.5) return colors.mediumPressureColor
  if (level < 0.7) return colors.highPressureColor
  return colors.extremePressureColor
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

export default ecoPressureLens
