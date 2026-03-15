/** [Ver001.000] */
/**
 * Ripple Lens
 * ===========
 * Visualizes sound propagation through expanding concentric circles.
 * Footsteps, gunfire, and abilities create ripples that expand outward,
 * revealing the acoustic signature of the match.
 */

import type { Lens, GameData, LensOptions } from './types'
import { renderRipple } from './helpers'

export interface RippleLensOptions extends Partial<LensOptions> {
  /** Maximum radius of ripples in pixels */
  maxRadius?: number
  /** Ripple expansion speed */
  speed?: number
  /** Sound type color mapping */
  typeColors?: Record<string, string>
}

/** Sound type to color mapping */
const defaultTypeColors: Record<string, string> = {
  footstep: 'rgb(6, 182, 212)',    // Cyan-500
  gunfire: 'rgb(239, 68, 68)',      // Red-500
  ability: 'rgb(168, 85, 247)',     // Purple-500
  reload: 'rgb(234, 179, 8)',       // Yellow-500
  defuse: 'rgb(34, 197, 94)'        // Green-500
}

/** Active ripple animation state */
interface ActiveRipple {
  id: string
  position: { x: number; y: number }
  startTime: number
  duration: number
  color: string
  maxRadius: number
  intensity: number
}

// Track active ripples for animation
let activeRipples: ActiveRipple[] = []
let animationFrame: number | null = null

export const rippleLens: Lens = {
  name: 'ripple',
  displayName: 'Ripple',
  description: 'Visualizes sound events as expanding ripples. Cyan for footsteps, red for gunfire, purple for abilities.',
  opacity: 0.4,
  
  defaultOptions: {
    opacity: 0.4,
    color: 'rgb(6, 182, 212)', // Cyan-500
    blendMode: 'screen',
    animationSpeed: 1,
    showLabels: false
  },
  
  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: RippleLensOptions
  ): void => {
    const { soundEvents } = data
    
    const mergedOptions = { ...rippleLens.defaultOptions, ...options }
    const { opacity } = mergedOptions
    const {
      maxRadius = 80,
      typeColors = defaultTypeColors
    } = options || {}
    
    const now = Date.now()
    const rippleDuration = 2000 // 2 seconds per ripple
    
    // Add new sound events as ripples
    soundEvents.forEach((event) => {
      // Check if we already have this event as an active ripple
      const eventId = `${event.timestamp}-${event.position.x}-${event.position.y}`
      const exists = activeRipples.some((r) => r.id === eventId)
      
      if (!exists) {
        activeRipples.push({
          id: eventId,
          position: event.position,
          startTime: now - (data.metadata.matchTime - event.timestamp),
          duration: rippleDuration,
          color: typeColors[event.type] || mergedOptions.color,
          maxRadius: maxRadius * (0.5 + event.intensity * 0.5),
          intensity: event.intensity
        })
      }
    })
    
    // Clean up expired ripples
    activeRipples = activeRipples.filter(
      (ripple) => now - ripple.startTime < ripple.duration
    )
    
    // Render active ripples
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    
    activeRipples.forEach((ripple) => {
      const elapsed = now - ripple.startTime
      const progress = Math.min(1, elapsed / ripple.duration)
      
      // Multiple concentric rings for richer effect
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const ringProgress = Math.min(1, (elapsed - i * 200) / (ripple.duration - i * 200))
        if (ringProgress > 0) {
          const ringOpacity = (1 - ringProgress) * opacity * ripple.intensity
          ctx.globalAlpha = ringOpacity
          
          renderRipple(ctx, ripple.position, ringProgress, {
            color: ripple.color,
            maxRadius: ripple.maxRadius * (1 + i * 0.3),
            lineWidth: 2 - i * 0.5
          })
        }
      }
      
      // Draw source point
      if (progress < 0.3) {
        ctx.globalAlpha = (1 - progress / 0.3) * opacity
        ctx.fillStyle = ripple.color
        ctx.beginPath()
        ctx.arc(ripple.position.x, ripple.position.y, 3 * ripple.intensity, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    
    ctx.restore()
  },
  
  update: (deltaTime: number): void => {
    // Animation update logic if needed
    // Currently handled in render loop
  },
  
  reset: (): void => {
    activeRipples = []
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }
}

export default rippleLens
