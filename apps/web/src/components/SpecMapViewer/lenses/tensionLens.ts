/** [Ver001.000] */
/**
 * Tension Lens
 * ============
 * Visualizes combat pressure through heatmap overlay.
 * Darker/Red areas indicate high tension zones where kills cluster.
 * Reveals chokepoints and dangerous areas on the map.
 */

import type { Lens, GameData, LensOptions } from './types'
import { calculateTension, renderHeatmap } from './helpers'

export interface TensionLensOptions extends Partial<LensOptions> {
  /** Heat color gradient - from low to high tension */
  heatColors?: string[]
  /** Influence radius for kill events */
  influenceRadius?: number
  /** Minimum intensity to display */
  threshold?: number
}

export const tensionLens: Lens = {
  name: 'tension',
  displayName: 'Tension',
  description: 'Reveals combat pressure zones through heatmap visualization. Red areas indicate frequent engagements and dangerous chokepoints.',
  opacity: 0.6,
  
  defaultOptions: {
    opacity: 0.6,
    color: 'rgb(220, 38, 38)', // Red-600
    blendMode: 'screen',
    animationSpeed: 1,
    showLabels: false
  },
  
  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: TensionLensOptions
  ): void => {
    const { killEvents } = data
    
    if (killEvents.length === 0) return
    
    const mergedOptions = { ...tensionLens.defaultOptions, ...options }
    const { opacity, color } = mergedOptions
    const { threshold = 0.1 } = options || {}
    
    // Get canvas dimensions for bounds
    const bounds = {
      width: ctx.canvas.width,
      height: ctx.canvas.height
    }
    
    // Calculate tension grid
    const tensionGrid = calculateTension(killEvents, bounds)
    
    // Filter by threshold
    const filteredGrid = tensionGrid.filter((cell) => cell.intensity >= threshold)
    
    // Render heatmap
    renderHeatmap(ctx, filteredGrid, {
      color,
      opacity,
      radius: 60
    })
    
    // Draw kill markers for emphasis
    ctx.save()
    killEvents.forEach((event) => {
      const alpha = event.isFirstBlood ? 0.8 : 0.4
      ctx.globalAlpha = alpha * (opacity / 0.6)
      ctx.fillStyle = event.isFirstBlood ? '#3b82f6' : color // Blue for first bloods
      
      // Draw X marker for kills
      const size = event.isFirstBlood ? 8 : 5
      ctx.beginPath()
      ctx.moveTo(event.position.x - size, event.position.y - size)
      ctx.lineTo(event.position.x + size, event.position.y + size)
      ctx.moveTo(event.position.x + size, event.position.y - size)
      ctx.lineTo(event.position.x - size, event.position.y + size)
      ctx.strokeStyle = ctx.fillStyle
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Glow effect for first bloods
      if (event.isFirstBlood) {
        const gradient = ctx.createRadialGradient(
          event.position.x, event.position.y, 0,
          event.position.x, event.position.y, 20
        )
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(event.position.x, event.position.y, 20, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    ctx.restore()
  }
}

export default tensionLens
