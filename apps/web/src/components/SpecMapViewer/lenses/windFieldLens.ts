// @ts-nocheck
/** [Ver001.000] */
/**
 * Wind Field Lens
 * ===============
 * Visualizes movement trends through a flowing vector field.
 * White arrows show the dominant movement patterns,
 * revealing rotations, pushes, and defensive setups.
 */

import type { Lens, GameData, LensOptions, FlowVector } from './types'
import { renderVectorField, calculateMovementFlow } from './helpers'

export interface WindFieldLensOptions extends Partial<LensOptions> {
  /** Vector arrow color */
  vectorColor?: string
  /** Field density (0.1 to 1.0) */
  density?: number
  /** Arrow size in pixels */
  arrowSize?: number
  /** Minimum velocity to display */
  minVelocity?: number
  /** Show team-specific colors */
  teamColors?: boolean
}

/** Attackers color - warm/aggressive */
const ATTACKERS_COLOR = 'rgb(239, 68, 68)'   // Red-500
/** Defenders color - cool/defensive */
const DEFENDERS_COLOR = 'rgb(59, 130, 246)'  // Blue-500

export const windFieldLens: Lens = {
  name: 'wind',
  displayName: 'Wind Field',
  description: 'Visualizes movement flow through vector arrows. Shows team rotations, attack patterns, and defensive positioning trends.',
  opacity: 0.3,
  
  defaultOptions: {
    opacity: 0.3,
    color: 'rgb(255, 255, 255)', // White
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: false
  },
  
  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: WindFieldLensOptions
  ): void => {
    const { playerPositions } = data
    
    if (playerPositions.length === 0) return
    
    const mergedOptions = { ...windFieldLens.defaultOptions, ...options }
    const { opacity } = mergedOptions
    const {
      vectorColor = mergedOptions.color,
      density = 0.3,
      arrowSize = 20,
      minVelocity = 0.1,
      teamColors = false
    } = options || {}
    
    // Calculate flow field from all player movements
    const flowField = calculateMovementFlow(playerPositions)
    
    // Filter by minimum velocity
    const filteredField = flowField.filter((v) => v.magnitude >= minVelocity)
    
    ctx.save()
    ctx.globalAlpha = opacity
    
    // If team colors enabled, calculate separate flow fields
    if (teamColors) {
      const attackers = playerPositions.filter((p) => p.team === 'attackers')
      const defenders = playerPositions.filter((p) => p.team === 'defenders')
      
      // Render attackers flow (red)
      if (attackers.length > 0) {
        const attackersFlow = calculateMovementFlow(attackers)
        renderVectorField(
          ctx,
          attackersFlow.filter((v) => v.magnitude >= minVelocity),
          {
            color: ATTACKERS_COLOR,
            density: density * 0.7,
            arrowSize: arrowSize * 1.1
          }
        )
      }
      
      // Render defenders flow (blue)
      if (defenders.length > 0) {
        const defendersFlow = calculateMovementFlow(defenders)
        renderVectorField(
          ctx,
          defendersFlow.filter((v) => v.magnitude >= minVelocity),
          {
            color: DEFENDERS_COLOR,
            density: density * 0.7,
            arrowSize: arrowSize * 1.1
          }
        )
      }
      
      // Draw team indicator
      ctx.font = '10px sans-serif'
      ctx.fillStyle = ATTACKERS_COLOR
      ctx.fillText('● Attackers', 10, 20)
      ctx.fillStyle = DEFENDERS_COLOR
      ctx.fillText('● Defenders', 10, 35)
    } else {
      // Single color flow field
      renderVectorField(ctx, filteredField, {
        color: vectorColor,
        density,
        arrowSize
      })
    }
    
    // Add flow magnitude legend
    if (mergedOptions.showLabels) {
      ctx.fillStyle = vectorColor
      ctx.font = '10px sans-serif'
      ctx.fillText('Flow intensity indicates movement speed', 10, ctx.canvas.height - 10)
    }
    
    ctx.restore()
  }
}

export default windFieldLens
