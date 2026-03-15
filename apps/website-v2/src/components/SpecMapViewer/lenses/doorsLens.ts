/** [Ver001.000] */
/**
 * Doors Lens
 * ==========
 * Visualizes rotation patterns and site takes through animated arrows.
 * Shows team movement trends between sites with cycling indicators.
 */

import type { Lens, GameData, LensOptions } from './types'

export interface DoorsLensOptions extends Partial<LensOptions> {
  /** Arrow color for attackers */
  attackerColor?: string
  /** Arrow color for defenders */
  defenderColor?: string
  /** Arrow size */
  arrowSize?: number
  /** Animation speed */
  cycleSpeed?: number
  /** Show trail decay */
  showTrails?: boolean
}

/** Rotation event from game data */
interface RotationEvent {
  fromSite: 'A' | 'B' | 'Mid'
  toSite: 'A' | 'B' | 'Mid'
  timestamp: number
  team: 'attackers' | 'defenders'
  playerCount: number
  success: boolean
}

/** Detected rotation pattern */
interface RotationPattern {
  type: 'A-to-B' | 'B-to-A' | 'Mid-split' | 'Retake'
  frequency: number
  lastOccurrence: number
  successRate: number
}

export const doorsLens: Lens = {
  name: 'doors',
  displayName: 'Doors',
  description: 'Reveals rotation patterns and site takes through animated directional arrows. Shows team movement trends between bombsites.',
  opacity: 0.7,

  defaultOptions: {
    opacity: 0.7,
    color: 'rgb(234, 179, 8)', // Yellow-500
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: DoorsLensOptions
  ): void => {
    const mergedOptions = { ...doorsLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const attackerColor = options?.attackerColor || 'rgb(239, 68, 68)'   // Red
    const defenderColor = options?.defenderColor || 'rgb(59, 130, 246)'  // Blue
    const arrowSize = options?.arrowSize || 12
    const cycleSpeed = options?.cycleSpeed || 1
    const showTrails = options?.showTrails !== false

    // Calculate rotation patterns from player positions
    const patterns = analyzeRotationPatterns(data)
    
    ctx.save()
    ctx.globalAlpha = opacity

    // Draw rotation arrows for each detected pattern
    patterns.forEach(pattern => {
      const arrow = getArrowForPattern(pattern)
      const color = pattern.team === 'attackers' ? attackerColor : defenderColor
      
      // Draw animated cycling arrows
      drawCyclingArrow(ctx, arrow, color, arrowSize, cycleSpeed, showTrails)
      
      // Draw frequency indicator
      if (showLabels) {
        drawFrequencyLabel(ctx, arrow, pattern.frequency, color)
      }
    })

    // Draw site connection lines
    drawSiteConnections(ctx, patterns, attackerColor, defenderColor, opacity)

    ctx.restore()
  },

  update: (deltaTime: number): void => {
    // Animation state update would go here
    // Tracked via requestAnimationFrame in actual implementation
  },

  reset: (): void => {
    // Reset animation state
  }
}

/** Analyze player positions to detect rotation patterns */
function analyzeRotationPatterns(data: GameData): RotationPattern[] {
  const patterns: RotationPattern[] = []
  const { playerPositions, metadata } = data

  // Group positions by team
  const attackers: typeof playerPositions = []
  const defenders: typeof playerPositions = []
  
  playerPositions.forEach(pos => {
    if (pos.team === 'attackers') attackers.push(pos)
    else defenders.push(pos)
  })

  // Detect A-to-B rotations (attackers)
  const aToB = detectSiteTransition(attackers, 'A', 'B')
  if (aToB.count > 0) {
    patterns.push({
      type: 'A-to-B',
      frequency: aToB.count,
      lastOccurrence: aToB.lastTime,
      successRate: aToB.successRate
    })
  }

  // Detect B-to-A rotations (attackers)
  const bToA = detectSiteTransition(attackers, 'B', 'A')
  if (bToA.count > 0) {
    patterns.push({
      type: 'B-to-A',
      frequency: bToA.count,
      lastOccurrence: bToA.lastTime,
      successRate: bToA.successRate
    })
  }

  // Detect retakes (defenders)
  const retakeA = detectRetake(defenders, 'A')
  if (retakeA.count > 0) {
    patterns.push({
      type: 'Retake',
      frequency: retakeA.count,
      lastOccurrence: retakeA.lastTime,
      successRate: retakeA.successRate
    })
  }

  return patterns.map(p => ({ ...p, team: p.type === 'Retake' ? 'defenders' : 'attackers' } as RotationPattern & { team: 'attackers' | 'defenders' }))
}

/** Detect transitions between sites */
function detectSiteTransition(
  positions: GameData['playerPositions'],
  from: 'A' | 'B',
  to: 'A' | 'B'
): { count: number; lastTime: number; successRate: number } {
  // Simplified detection - would use actual position history in full implementation
  let count = 0
  let successes = 0
  let lastTime = 0

  // Site bounding boxes (simplified)
  const siteBounds = {
    A: { minX: 20, maxX: 30, minY: 20, maxY: 30 },
    B: { minX: 45, maxX: 55, minY: 40, maxY: 50 }
  }

  positions.forEach(player => {
    const recent = player.positions.slice(-20) // Last 20 positions
    let wasAtFrom = false
    let arrivedAtTo = false

    recent.forEach((pos, i) => {
      const bound = siteBounds[from]
      if (pos.x >= bound.minX && pos.x <= bound.maxX &&
          pos.y >= bound.minY && pos.y <= bound.maxY) {
        wasAtFrom = true
      }
      
      const toBound = siteBounds[to]
      if (wasAtFrom && 
          pos.x >= toBound.minX && pos.x <= toBound.maxX &&
          pos.y >= toBound.minY && pos.y <= toBound.maxY) {
        arrivedAtTo = true
        lastTime = Math.max(lastTime, pos.timestamp)
      }
    })

    if (wasAtFrom && arrivedAtTo) {
      count++
      successes++
    }
  })

  return {
    count,
    lastTime,
    successRate: count > 0 ? successes / count : 0
  }
}

/** Detect retake attempts */
function detectRetake(
  positions: GameData['playerPositions'],
  site: 'A' | 'B'
): { count: number; lastTime: number; successRate: number } {
  // Simplified retake detection
  return { count: 0, lastTime: 0, successRate: 0 }
}

/** Get arrow configuration for pattern */
function getArrowForPattern(pattern: RotationPattern): {
  startX: number
  startY: number
  endX: number
  endY: number
  team: 'attackers' | 'defenders'
} {
  const siteCenters = {
    A: { x: 25, y: 25 },
    B: { x: 50, y: 45 },
    Mid: { x: 32, y: 32 }
  }

  switch (pattern.type) {
    case 'A-to-B':
      return {
        startX: siteCenters.A.x,
        startY: siteCenters.A.y,
        endX: siteCenters.B.x,
        endY: siteCenters.B.y,
        team: 'attackers'
      }
    case 'B-to-A':
      return {
        startX: siteCenters.B.x,
        startY: siteCenters.B.y,
        endX: siteCenters.A.x,
        endY: siteCenters.A.y,
        team: 'attackers'
      }
    case 'Retake':
      return {
        startX: siteCenters.Mid.x,
        startY: siteCenters.Mid.y,
        endX: siteCenters.A.x,
        endY: siteCenters.A.y,
        team: 'defenders'
      }
    default:
      return {
        startX: siteCenters.A.x,
        startY: siteCenters.A.y,
        endX: siteCenters.B.x,
        endY: siteCenters.B.y,
        team: 'attackers'
      }
  }
}

/** Draw animated cycling arrow */
function drawCyclingArrow(
  ctx: CanvasRenderingContext2D,
  arrow: { startX: number; startY: number; endX: number; endY: number },
  color: string,
  size: number,
  speed: number,
  showTrails: boolean
): void {
  const { startX, startY, endX, endY } = arrow
  const dx = endX - startX
  const dy = endY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)

  // Animation phase (0-1)
  const phase = (Date.now() / 1000 * speed) % 1

  // Draw trail
  if (showTrails) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.3
    
    for (let i = 0; i < 5; i++) {
      const trailPhase = (phase + i * 0.2) % 1
      const trailX = startX + dx * trailPhase
      const trailY = startY + dy * trailPhase
      
      ctx.beginPath()
      ctx.arc(trailX, trailY, size * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
    ctx.restore()
  }

  // Draw main arrow
  const arrowX = startX + dx * phase
  const arrowY = startY + dy * phase

  ctx.save()
  ctx.translate(arrowX, arrowY)
  ctx.rotate(angle)

  // Arrow body
  ctx.beginPath()
  ctx.moveTo(-size, -size/3)
  ctx.lineTo(size/2, -size/3)
  ctx.lineTo(size/2, -size/2)
  ctx.lineTo(size * 1.5, 0)
  ctx.lineTo(size/2, size/2)
  ctx.lineTo(size/2, size/3)
  ctx.lineTo(-size, size/3)
  ctx.closePath()

  ctx.fillStyle = color
  ctx.fill()
  
  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.stroke()

  ctx.restore()

  // Draw connection line
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.restore()
}

/** Draw frequency label */
function drawFrequencyLabel(
  ctx: CanvasRenderingContext2D,
  arrow: { startX: number; startY: number; endX: number; endY: number },
  frequency: number,
  color: string
): void {
  const midX = (arrow.startX + arrow.endX) / 2
  const midY = (arrow.startY + arrow.endY) / 2

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.arc(midX, midY, 12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(frequency.toString(), midX, midY)
  ctx.restore()
}

/** Draw site connection lines */
function drawSiteConnections(
  ctx: CanvasRenderingContext2D,
  patterns: RotationPattern[],
  attackerColor: string,
  defenderColor: string,
  opacity: number
): void {
  // Draw base connection between sites
  const siteA = { x: 25, y: 25 }
  const siteB = { x: 50, y: 45 }

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 7])
  ctx.globalAlpha = opacity * 0.5
  
  ctx.beginPath()
  ctx.moveTo(siteA.x, siteA.y)
  ctx.lineTo(siteB.x, siteB.y)
  ctx.stroke()
  ctx.restore()
}

export default doorsLens
