/** [Ver001.000] */
/**
 * Utility Coverage Lens
 * =====================
 * Visualizes smoke/molly/flash coverage areas with decay tracking.
 * Shows active utility, remaining duration, and team attribution.
 */

import type { Lens, GameData, LensOptions } from '../types'
import type { UtilityCoverage as UtilityCoverageType, TeamSide } from './predictionInterface'
import { predictionModel, toPredictionState } from './predictionInterface'

export interface UtilityCoverageLensOptions extends Partial<LensOptions> {
  /** Smoke color */
  smokeColor?: string
  /** Molotov color */
  mollyColor?: string
  /** Flash color */
  flashColor?: string
  /** Decoy color */
  decoyColor?: string
  /** Show duration timers */
  showTimers?: boolean
  /** Show decay progress */
  showDecay?: boolean
  /** Show team attribution */
  showTeams?: boolean
  /** Minimum time remaining to show (ms) */
  minTimeRemaining?: number
}

/** Utility type colors */
const DEFAULT_COLORS = {
  smoke: 'rgb(148, 163, 184)',  // Slate-400 (gray smoke)
  molly: 'rgb(249, 115, 22)',   // Orange-500 (fire)
  flash: 'rgb(251, 191, 36)',   // Amber-400 (bright flash)
  decoy: 'rgb(168, 162, 158)'   // Stone-400 (neutral)
}

export const utilityCoverageLens: Lens = {
  name: 'utility-coverage',
  displayName: 'Utility Coverage',
  description: 'Visualizes active smoke, molotov, and flash coverage areas with decay tracking and remaining duration timers.',
  opacity: 0.6,

  defaultOptions: {
    opacity: 0.6,
    color: 'rgb(148, 163, 184)', // Slate-400
    blendMode: 'multiply',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: UtilityCoverageLensOptions
  ): void => {
    const mergedOptions = { ...utilityCoverageLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const smokeColor = options?.smokeColor || DEFAULT_COLORS.smoke
    const mollyColor = options?.mollyColor || DEFAULT_COLORS.molly
    const flashColor = options?.flashColor || DEFAULT_COLORS.flash
    const decoyColor = options?.decoyColor || DEFAULT_COLORS.decoy
    const showTimers = options?.showTimers !== false
    const showDecay = options?.showDecay !== false
    const showTeams = options?.showTeams !== false
    const minTimeRemaining = options?.minTimeRemaining ?? 500

    // Get utility coverage from model
    const gameState = toPredictionState(data)
    const utilities = predictionModel.analyzeUtilityCoverage(gameState)
      .filter(u => u.timeRemaining >= minTimeRemaining)

    // Also generate utility from kill events (flash assists)
    const killBasedUtility = generateUtilityFromKills(data)
    utilities.push(...killBasedUtility)

    if (utilities.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Sort by type (smokes last for proper blending)
    utilities.sort((a, b) => {
      const typeOrder = { smoke: 3, molly: 2, flash: 1, decoy: 0 }
      return typeOrder[a.type] - typeOrder[b.type]
    })

    utilities.forEach(utility => {
      const color = getUtilityColor(utility.type, { smokeColor, mollyColor, flashColor, decoyColor })

      // Draw coverage area
      drawCoverageArea(ctx, utility, color, showDecay)

      // Draw timer
      if (showTimers && showLabels) {
        drawDurationTimer(ctx, utility, color)
      }

      // Draw team indicator
      if (showTeams && showLabels) {
        drawTeamIndicator(ctx, utility)
      }
    })

    ctx.restore()
  },

  update: (deltaTime: number): void => {
    // Update decay animation
  }
}

/** Generate utility data from kill events (flash assists, etc.) */
function generateUtilityFromKills(data: GameData): UtilityCoverageType[] {
  const utilities: UtilityCoverageType[] = []

  // Look for recent kills that might involve utility
  const recentKills = data.killEvents.slice(-3)
  const currentTime = data.metadata.matchTime

  recentKills.forEach((kill, i) => {
    // Add flash effect for recent headshots
    if (kill.isHeadshot) {
      const timeSince = currentTime - kill.timestamp
      if (timeSince < 2000) {
        utilities.push({
          type: 'flash',
          position: kill.position,
          radius: 15,
          timeRemaining: 2000 - timeSince,
          maxDuration: 2000,
          decayProgress: timeSince / 2000,
          team: 'attackers', // Simplified
          affectedArea: []
        })
      }
    }
  })

  return utilities
}

/** Draw utility coverage area with decay effect */
function drawCoverageArea(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string,
  showDecay: boolean
): void {
  ctx.save()

  const decayAlpha = showDecay ? 1 - utility.decayProgress * 0.5 : 1
  const currentRadius = utility.radius * (1 - utility.decayProgress * 0.2)

  // Type-specific rendering
  switch (utility.type) {
    case 'smoke':
      drawSmokeArea(ctx, utility, color, currentRadius, decayAlpha)
      break
    case 'molly':
      drawMollyArea(ctx, utility, color, currentRadius, decayAlpha)
      break
    case 'flash':
      drawFlashArea(ctx, utility, color, currentRadius, decayAlpha)
      break
    case 'decoy':
      drawDecoyArea(ctx, utility, color, currentRadius, decayAlpha)
      break
  }

  ctx.restore()
}

/** Draw smoke area with cloud effect */
function drawSmokeArea(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string,
  radius: number,
  alpha: number
): void {
  // Multiple overlapping circles for smoke cloud effect
  const cloudCircles = 5
  for (let i = 0; i < cloudCircles; i++) {
    const angle = (i / cloudCircles) * Math.PI * 2 + Date.now() / 3000
    const offsetRadius = radius * 0.3
    const offsetX = Math.cos(angle) * offsetRadius
    const offsetY = Math.sin(angle) * offsetRadius

    const gradient = ctx.createRadialGradient(
      utility.position.x + offsetX,
      utility.position.y + offsetY,
      0,
      utility.position.x + offsetX,
      utility.position.y + offsetY,
      radius * 0.7
    )

    gradient.addColorStop(0, color.replace(')', `, ${0.5 * alpha})`).replace('rgb', 'rgba'))
    gradient.addColorStop(0.5, color.replace(')', `, ${0.3 * alpha})`).replace('rgb', 'rgba'))
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(utility.position.x + offsetX, utility.position.y + offsetY, radius * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }

  // Central denser area
  const centerGradient = ctx.createRadialGradient(
    utility.position.x,
    utility.position.y,
    0,
    utility.position.x,
    utility.position.y,
    radius
  )

  centerGradient.addColorStop(0, color.replace(')', `, ${0.4 * alpha})`).replace('rgb', 'rgba'))
  centerGradient.addColorStop(0.7, color.replace(')', `, ${0.2 * alpha})`).replace('rgb', 'rgba'))
  centerGradient.addColorStop(1, 'transparent')

  ctx.fillStyle = centerGradient
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/** Draw molotov area with fire effect */
function drawMollyArea(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string,
  radius: number,
  alpha: number
): void {
  // Flickering fire effect
  const flicker = 0.8 + Math.random() * 0.2

  const gradient = ctx.createRadialGradient(
    utility.position.x,
    utility.position.y,
    0,
    utility.position.x,
    utility.position.y,
    radius
  )

  const fireColor = `rgba(249, 115, 22, ${0.6 * alpha * flicker})`
  const emberColor = `rgba(239, 68, 68, ${0.4 * alpha * flicker})`

  gradient.addColorStop(0, fireColor)
  gradient.addColorStop(0.5, emberColor)
  gradient.addColorStop(0.8, `rgba(234, 179, 8, ${0.2 * alpha})`)
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Fire particles
  const particles = 4
  for (let i = 0; i < particles; i++) {
    const angle = (i / particles) * Math.PI * 2 + Date.now() / 500
    const dist = radius * (0.3 + Math.random() * 0.4)
    const px = utility.position.x + Math.cos(angle) * dist
    const py = utility.position.y + Math.sin(angle) * dist
    const size = 2 + Math.random() * 3

    ctx.fillStyle = `rgba(251, 191, 36, ${0.8 * alpha})`
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Draw flash area with burst effect */
function drawFlashArea(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string,
  radius: number,
  alpha: number
): void {
  // Flash burst effect
  const burstAlpha = alpha * (1 - utility.decayProgress * 0.8)

  const gradient = ctx.createRadialGradient(
    utility.position.x,
    utility.position.y,
    0,
    utility.position.x,
    utility.position.y,
    radius
  )

  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * burstAlpha})`)
  gradient.addColorStop(0.3, color.replace(')', `, ${0.6 * burstAlpha})`).replace('rgb', 'rgba'))
  gradient.addColorStop(0.7, color.replace(')', `, ${0.2 * burstAlpha})`).replace('rgb', 'rgba'))
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Star burst lines
  const lines = 8
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * burstAlpha})`
  ctx.lineWidth = 1

  for (let i = 0; i < lines; i++) {
    const angle = (i / lines) * Math.PI * 2
    const startR = radius * 0.3
    const endR = radius * (0.7 + Math.random() * 0.2)

    ctx.beginPath()
    ctx.moveTo(
      utility.position.x + Math.cos(angle) * startR,
      utility.position.y + Math.sin(angle) * startR
    )
    ctx.lineTo(
      utility.position.x + Math.cos(angle) * endR,
      utility.position.y + Math.sin(angle) * endR
    )
    ctx.stroke()
  }
}

/** Draw decoy area with ripple effect */
function drawDecoyArea(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string,
  radius: number,
  alpha: number
): void {
  // Ripple effect
  const rippleCount = 3
  const ripplePhase = (Date.now() / 1000) % 1

  for (let i = 0; i < rippleCount; i++) {
    const rippleProgress = (ripplePhase + i / rippleCount) % 1
    const rippleRadius = radius * 0.2 + radius * 0.8 * rippleProgress
    const rippleAlpha = alpha * (1 - rippleProgress) * 0.5

    ctx.strokeStyle = color.replace(')', `, ${rippleAlpha})`).replace('rgb', 'rgba')
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(utility.position.x, utility.position.y, rippleRadius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Center dot
  ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba')
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, 4, 0, Math.PI * 2)
  ctx.fill()
}

/** Draw duration timer */
function drawDurationTimer(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType,
  color: string
): void {
  const seconds = Math.ceil(utility.timeRemaining / 1000)
  const labelY = utility.position.y - utility.radius - 8

  ctx.save()

  // Background
  const text = `${seconds}s`
  ctx.font = 'bold 10px sans-serif'
  const metrics = ctx.measureText(text)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.arc(utility.position.x, labelY, 12, 0, Math.PI * 2)
  ctx.fill()

  // Decay arc
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + Math.PI * 2 * (1 - utility.decayProgress)

  ctx.strokeStyle = utility.decayProgress > 0.7 ? '#ef4444' : '#22c55e'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(utility.position.x, labelY, 10, startAngle, endAngle)
  ctx.stroke()

  // Timer text
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, utility.position.x, labelY)

  ctx.restore()
}

/** Draw team attribution indicator */
function drawTeamIndicator(
  ctx: CanvasRenderingContext2D,
  utility: UtilityCoverageType
): void {
  const indicatorX = utility.position.x + utility.radius + 5
  const indicatorY = utility.position.y

  ctx.save()

  const teamColor = utility.team === 'attackers' ? '#ef4444' : '#3b82f6'

  ctx.fillStyle = teamColor
  ctx.beginPath()
  ctx.arc(indicatorX, indicatorY, 4, 0, Math.PI * 2)
  ctx.fill()

  // Type icon
  const icons: Record<string, string> = {
    smoke: '○',
    molly: '🔥',
    flash: '✦',
    decoy: '◎'
  }

  ctx.fillStyle = 'white'
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(icons[utility.type] || '?', indicatorX + 8, indicatorY)

  ctx.restore()
}

/** Get color for utility type */
function getUtilityColor(
  type: UtilityCoverageType['type'],
  colors: { smokeColor: string; mollyColor: string; flashColor: string; decoyColor: string }
): string {
  switch (type) {
    case 'smoke': return colors.smokeColor
    case 'molly': return colors.mollyColor
    case 'flash': return colors.flashColor
    case 'decoy': return colors.decoyColor
    default: return colors.smokeColor
  }
}

export default utilityCoverageLens
