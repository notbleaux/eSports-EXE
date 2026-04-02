// @ts-nocheck
/** [Ver001.000] */
/**
 * Secured Lens
 * ============
 * Visualizes site control status through material degradation over time.
 * Shows which team controls each site and how secure that control is.
 */

import type { Lens, GameData, LensOptions } from './types'

export interface SecuredLensOptions extends Partial<LensOptions> {
  /** Color for attacker control */
  attackerColor?: string
  /** Color for defender control */
  defenderColor?: string
  /** Color for contested/neutral */
  contestedColor?: string
  /** Degradation rate (0-1 per second) */
  degradationRate?: number
  /** Show control percentage */
  showPercentage?: boolean
}

/** Site control status */
interface SiteControl {
  site: 'A' | 'B'
  controller: 'attackers' | 'defenders' | 'contested' | null
  controlLevel: number // 0-1
  lastChangeTime: number
  timeHeld: number // seconds
  isDegrading: boolean
}

/** Site bounds for Bind */
const SITE_BOUNDS = {
  A: { minX: 20, maxX: 30, minY: 20, maxY: 30, centerX: 25, centerY: 25 },
  B: { minX: 45, maxX: 55, minY: 40, maxY: 50, centerX: 50, centerY: 45 }
}

export const securedLens: Lens = {
  name: 'secured',
  displayName: 'Secured',
  description: 'Visualizes site control status through material degradation. Shows which team controls each bombsite and the stability of that control over time.',
  opacity: 0.6,

  defaultOptions: {
    opacity: 0.6,
    color: 'rgb(16, 185, 129)', // Emerald-500
    blendMode: 'multiply',
    animationSpeed: 1,
    showLabels: true
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: SecuredLensOptions
  ): void => {
    const mergedOptions = { ...securedLens.defaultOptions, ...options }
    const { opacity, showLabels } = mergedOptions
    const attackerColor = options?.attackerColor || 'rgba(239, 68, 68, 0.6)'   // Red
    const defenderColor = options?.defenderColor || 'rgba(59, 130, 246, 0.6)'  // Blue
    const contestedColor = options?.contestedColor || 'rgba(234, 179, 8, 0.6)' // Yellow
    const degradationRate = options?.degradationRate || 0.05
    const showPercentage = options?.showPercentage !== false

    // Calculate site control from game data
    const siteControls = calculateSiteControl(data)
    const currentTime = data.metadata.matchTime

    ctx.save()

    siteControls.forEach(control => {
      const bounds = SITE_BOUNDS[control.site]
      
      // Calculate degradation based on time held
      const degradation = calculateDegradation(control, currentTime, degradationRate)
      
      // Choose color based on controller
      let baseColor: string
      switch (control.controller) {
        case 'attackers':
          baseColor = attackerColor
          break
        case 'defenders':
          baseColor = defenderColor
          break
        case 'contested':
          baseColor = contestedColor
          break
        default:
          baseColor = 'rgba(128, 128, 128, 0.3)' // Neutral gray
      }

      // Draw site overlay with degradation effect
      drawSiteOverlay(ctx, bounds, baseColor, control.controlLevel, degradation, opacity)

      // Draw control indicator
      if (showLabels) {
        drawControlIndicator(ctx, bounds, control, degradation, baseColor)
      }

      // Draw material degradation effects
      if (control.isDegrading || control.controlLevel < 1) {
        drawDegradationEffects(ctx, bounds, degradation, control.controller)
      }
    })

    ctx.restore()
  },

  update: (deltaTime: number): void => {
    // Update degradation animation
  },

  reset: (): void => {
    // Reset degradation state
  }
}

/** Calculate site control from player positions and events */
function calculateSiteControl(data: GameData): SiteControl[] {
  const controls: SiteControl[] = []
  const { playerPositions, killEvents, metadata } = data
  const currentTime = metadata.matchTime

  // Analyze each site
  (['A', 'B'] as const).forEach(site => {
    const bounds = SITE_BOUNDS[site]
    
    // Count players at site
    let attackersAtSite = 0
    let defendersAtSite = 0

    playerPositions.forEach(player => {
      const lastPos = player.positions[player.positions.length - 1]
      if (!lastPos) return

      if (lastPos.x >= bounds.minX && lastPos.x <= bounds.maxX &&
          lastPos.y >= bounds.minY && lastPos.y <= bounds.maxY) {
        if (player.team === 'attackers') attackersAtSite++
        else defendersAtSite++
      }
    })

    // Determine control
    let controller: SiteControl['controller'] = null
    let controlLevel = 0
    let isDegrading = false

    if (attackersAtSite > 0 && defendersAtSite === 0) {
      controller = 'attackers'
      controlLevel = Math.min(1, attackersAtSite / 3) // Max control at 3+ players
    } else if (defendersAtSite > 0 && attackersAtSite === 0) {
      controller = 'defenders'
      controlLevel = Math.min(1, defendersAtSite / 3)
    } else if (attackersAtSite > 0 && defendersAtSite > 0) {
      controller = 'contested'
      controlLevel = 0.5
      isDegrading = true
    }

    // Check for recent kills at site (affects control stability)
    const recentKills = killEvents.filter(k => {
      const timeDiff = currentTime - k.timestamp
      return timeDiff < 10000 && // Within 10 seconds
        k.position.x >= bounds.minX && k.position.x <= bounds.maxX &&
        k.position.y >= bounds.minY && k.position.y <= bounds.maxY
    })

    if (recentKills.length > 2) {
      isDegrading = true
      controlLevel *= 0.7 // Reduce control due to chaos
    }

    controls.push({
      site,
      controller,
      controlLevel,
      lastChangeTime: currentTime - 30000, // Placeholder
      timeHeld: 30, // Placeholder
      isDegrading
    })
  })

  return controls
}

/** Calculate material degradation based on time and control */
function calculateDegradation(
  control: SiteControl,
  currentTime: number,
  rate: number
): number {
  if (!control.controller) return 1 // Full degradation for neutral

  // Base degradation on how long control has been held
  const baseDegradation = Math.max(0, 1 - (control.timeHeld * rate))
  
  // Increase degradation if contested
  if (control.isDegrading) {
    return Math.min(1, baseDegradation + 0.3)
  }

  // Reduce degradation based on control level
  return Math.max(0, baseDegradation - (control.controlLevel * 0.3))
}

/** Draw site overlay with control color */
function drawSiteOverlay(
  ctx: CanvasRenderingContext2D,
  bounds: typeof SITE_BOUNDS['A'],
  color: string,
  controlLevel: number,
  degradation: number,
  opacity: number
): void {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  ctx.save()

  // Base site overlay
  ctx.fillStyle = color
  ctx.globalAlpha = opacity * (0.3 + controlLevel * 0.4)
  
  // Draw rounded rectangle for site
  roundRect(ctx, bounds.minX, bounds.minY, width, height, 3)
  ctx.fill()

  // Degradation pattern overlay
  if (degradation > 0) {
    ctx.globalAlpha = opacity * degradation * 0.5
    drawDegradationPattern(ctx, bounds, degradation)
  }

  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = opacity
  roundRect(ctx, bounds.minX, bounds.minY, width, height, 3)
  ctx.stroke()

  ctx.restore()
}

/** Draw degradation pattern (cracks, wear) */
function drawDegradationPattern(
  ctx: CanvasRenderingContext2D,
  bounds: typeof SITE_BOUNDS['A'],
  degradation: number
): void {
  const seed = bounds.centerX * 1000 + bounds.centerY
  
  ctx.save()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.lineWidth = 1

  // Draw crack lines based on degradation
  const numCracks = Math.floor(degradation * 8)
  
  for (let i = 0; i < numCracks; i++) {
    const startX = bounds.minX + 5 + (pseudoRandom(seed + i) * (bounds.maxX - bounds.minX - 10))
    const startY = bounds.minY + 5 + (pseudoRandom(seed + i + 100) * (bounds.maxY - bounds.minY - 10))
    
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    
    // Jagged crack line
    let x = startX
    let y = startY
    const segments = 3 + Math.floor(pseudoRandom(seed + i + 200) * 4)
    
    for (let j = 0; j < segments; j++) {
      x += (pseudoRandom(seed + i + j * 10) - 0.5) * 10
      y += (pseudoRandom(seed + i + j * 10 + 500) - 0.5) * 10
      ctx.lineTo(x, y)
    }
    
    ctx.stroke()
  }

  ctx.restore()
}

/** Draw control indicator text */
function drawControlIndicator(
  ctx: CanvasRenderingContext2D,
  bounds: typeof SITE_BOUNDS['A'],
  control: SiteControl,
  degradation: number,
  color: string
): void {
  ctx.save()

  // Site label
  ctx.fillStyle = 'white'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Draw label background
  const label = `${control.site} SITE`
  const metrics = ctx.measureText(label)
  const labelY = bounds.centerY - 8
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(
    bounds.centerX - metrics.width / 2 - 4,
    labelY - 8,
    metrics.width + 8,
    16
  )
  
  ctx.fillStyle = color
  ctx.fillText(label, bounds.centerX, labelY)

  // Control percentage
  if (control.controller) {
    const percentText = `${Math.round(control.controlLevel * 100)}%`
    ctx.font = '11px sans-serif'
    ctx.fillStyle = degradation > 0.5 ? 'rgba(255, 100, 100, 0.9)' : 'rgba(200, 200, 200, 0.9)'
    
    const statusText = control.isDegrading ? 'CONTESTED' : 'SECURED'
    ctx.fillText(statusText, bounds.centerX, bounds.centerY + 10)
  }

  ctx.restore()
}

/** Draw additional degradation effects */
function drawDegradationEffects(
  ctx: CanvasRenderingContext2D,
  bounds: typeof SITE_BOUNDS['A'],
  degradation: number,
  controller: SiteControl['controller']
): void {
  ctx.save()

  // Pulsing warning effect for contested sites
  if (controller === 'contested') {
    const pulse = (Math.sin(Date.now() / 200) + 1) / 2 // 0-1 pulse
    
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)' // Warning yellow
    ctx.lineWidth = 2 + pulse * 2
    ctx.globalAlpha = 0.3 + pulse * 0.3
    
    roundRect(ctx, bounds.minX - 2, bounds.minY - 2, 
      bounds.maxX - bounds.minX + 4, bounds.maxY - bounds.minY + 4, 5)
    ctx.stroke()
  }

  // Material wear particles for high degradation
  if (degradation > 0.7) {
    const numParticles = Math.floor((degradation - 0.7) * 20)
    
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'
    for (let i = 0; i < numParticles; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX)
      const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
      const size = 1 + Math.random() * 2
      
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
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

/** Pseudo-random number generator for deterministic patterns */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default securedLens
