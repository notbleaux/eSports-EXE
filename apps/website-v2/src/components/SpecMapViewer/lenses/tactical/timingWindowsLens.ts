/** [Ver001.000] */
/**
 * Timing Windows Lens
 * ===================
 * Visualizes optimal execute timings with window analysis.
 * Shows recommended windows, success probabilities, and prerequisites.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { TimingWindow } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface TimingWindowsLensOptions extends Partial<LensOptions> {
  /** Color for optimal timing */
  optimalColor?: string
  /** Color for viable windows */
  viableColor?: string
  /** Color for risky windows */
  riskyColor?: string
  /** Show window details */
  showDetails?: boolean
  /** Show success probability */
  showProbability?: boolean
  /** Minimum probability threshold */
  minProbability?: number
}

/** Timeline position constants */
const TIMELINE_Y = 85
const TIMELINE_START_X = 10
const TIMELINE_END_X = 90

export const timingWindowsLens: Lens = {
  name: 'timing-windows',
  displayName: 'Timing Windows',
  description: 'Visualizes optimal execute timing windows with success probabilities, prerequisites, and risk assessment.',
  opacity: 0.7,

  defaultOptions: {
    opacity: 0.7,
    color: 'rgb(16, 185, 129)', // Emerald-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: TimingWindowsLensOptions
  ): void => {
    const mergedOptions = { ...timingWindowsLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const optimalColor = options?.optimalColor || 'rgb(34, 197, 94)'   // Green-500
    const viableColor = options?.viableColor || 'rgb(234, 179, 8)'     // Yellow-500
    const riskyColor = options?.riskyColor || 'rgb(239, 68, 68)'       // Red-500
    const showDetails = options?.showDetails !== false
    const showProbability = options?.showProbability !== false
    const minProbability = options?.minProbability ?? 0.3

    // Get timing windows from model
    const gameState = toPredictionState(data)
    const windows = predictionModel.predictTimingWindows(gameState)
      .filter(w => w.successProbability >= minProbability)

    if (windows.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Draw timeline base
    drawTimeline(ctx, data.metadata.matchTime)

    // Draw each timing window
    windows.forEach((window, index) => {
      const color = getWindowColor(window.successProbability, optimalColor, viableColor, riskyColor)
      drawTimingWindow(ctx, window, index, color, showDetails, showProbability)
    })

    // Draw current time indicator
    drawCurrentTimeIndicator(ctx, data.metadata.matchTime)

    ctx.restore()
  }
}

/** Draw the round timeline base */
function drawTimeline(ctx: CanvasRenderingContext2D, currentTime: number): void {
  ctx.save()

  // Timeline bar background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(TIMELINE_START_X, TIMELINE_Y)
  ctx.lineTo(TIMELINE_END_X, TIMELINE_Y)
  ctx.stroke()

  // Phase markers
  const phases = [
    { time: 0, label: 'Start' },
    { time: 30000, label: 'Early' },
    { time: 60000, label: 'Mid' },
    { time: 90000, label: 'Late' },
    { time: 100000, label: 'End' }
  ]

  phases.forEach(phase => {
    const x = timeToX(phase.time)

    // Tick mark
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, TIMELINE_Y - 5)
    ctx.lineTo(x, TIMELINE_Y + 5)
    ctx.stroke()

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(phase.label, x, TIMELINE_Y + 12)
  })

  ctx.restore()
}

/** Draw a timing window bar */
function drawTimingWindow(
  ctx: CanvasRenderingContext2D,
  window: TimingWindow,
  index: number,
  color: string,
  showDetails: boolean,
  showProbability: boolean
): void {
  const startX = timeToX(window.startTime)
  const endX = timeToX(window.endTime)
  const optimalX = timeToX(window.optimalTime)
  const barY = TIMELINE_Y - 20 - index * 12
  const height = 8

  ctx.save()

  // Window bar background
  ctx.fillStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba')
  ctx.fillRect(startX, barY, endX - startX, height)

  // Window border
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.strokeRect(startX, barY, endX - startX, height)

  // Optimal time marker
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(optimalX, barY - 3)
  ctx.lineTo(optimalX - 4, barY - 8)
  ctx.lineTo(optimalX + 4, barY - 8)
  ctx.closePath()
  ctx.fill()

  // Success probability indicator
  if (showProbability) {
    const probY = barY + height / 2
    ctx.fillStyle = 'white'
    ctx.font = 'bold 7px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(window.successProbability * 100)}%`, (startX + endX) / 2, probY)
  }

  // Window details
  if (showDetails) {
    drawWindowDetails(ctx, window, startX, endX, barY - 15, color)
  }

  ctx.restore()
}

/** Draw window details tooltip */
function drawWindowDetails(
  ctx: CanvasRenderingContext2D,
  window: TimingWindow,
  startX: number,
  endX: number,
  y: number,
  color: string
): void {
  const midX = (startX + endX) / 2

  ctx.save()

  // Background
  const lines = [
    `Duration: ${Math.round(window.duration / 1000)}s`,
    `Optimal: ${Math.round(window.optimalTime / 1000)}s`,
    window.prerequisites[0] ? `Need: ${window.prerequisites[0]}` : ''
  ].filter(Boolean)

  const lineHeight = 10
  const boxHeight = lines.length * lineHeight + 6
  const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width))
  const boxWidth = maxWidth + 10

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(midX - boxWidth / 2, y - boxHeight, boxWidth, boxHeight)

  // Text
  ctx.fillStyle = color
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  lines.forEach((line, i) => {
    ctx.fillText(line, midX, y - boxHeight + 8 + i * lineHeight)
  })

  ctx.restore()
}

/** Draw current time indicator */
function drawCurrentTimeIndicator(ctx: CanvasRenderingContext2D, currentTime: number): void {
  const x = timeToX(currentTime)

  ctx.save()

  // Vertical line
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(x, TIMELINE_Y - 40)
  ctx.lineTo(x, TIMELINE_Y + 5)
  ctx.stroke()

  // Time label
  const seconds = Math.round(currentTime / 1000)
  const timeText = `${seconds}s`

  ctx.fillStyle = '#3b82f6'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(timeText, x, TIMELINE_Y - 45)

  // Triangle pointer
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.moveTo(x, TIMELINE_Y + 5)
  ctx.lineTo(x - 4, TIMELINE_Y + 10)
  ctx.lineTo(x + 4, TIMELINE_Y + 10)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

/** Convert time (ms) to x coordinate */
function timeToX(time: number): number {
  const maxTime = 100000 // 100 seconds
  const clampedTime = Math.max(0, Math.min(time, maxTime))
  const ratio = clampedTime / maxTime
  return TIMELINE_START_X + (TIMELINE_END_X - TIMELINE_START_X) * ratio
}

/** Get color based on success probability */
function getWindowColor(
  probability: number,
  optimalColor: string,
  viableColor: string,
  riskyColor: string
): string {
  if (probability >= 0.6) return optimalColor
  if (probability >= 0.45) return viableColor
  return riskyColor
}

export default timingWindowsLens
