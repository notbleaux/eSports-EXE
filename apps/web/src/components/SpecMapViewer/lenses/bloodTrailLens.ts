/** [Ver001.000] */
/**
 * Blood Trail Lens
 * ================
 * Visualizes damage and death through organic staining overlays.
 * Blue stains represent first bloods (significant opening kills).
 * Red stains represent regular kills and damage.
 * Creates a visceral record of combat on the map.
 */

import type { Lens, GameData, LensOptions } from './types'
import { renderStain } from './helpers'

export interface BloodTrailLensOptions extends Partial<LensOptions> {
  /** Color for first blood stains */
  firstBloodColor?: string
  /** Color for regular kill stains */
  killColor?: string
  /** Color for non-fatal damage stains */
  damageColor?: string
  /** Stain size multiplier */
  sizeMultiplier?: number
}

/** Stain record for tracking rendered stains */
interface StainRecord {
  id: string
  position: { x: number; y: number }
  color: string
  intensity: number
  radius: number
  timestamp: number
}

// Track rendered stains to avoid re-rendering
const renderedStains: Map<string, StainRecord> = new Map()

export const bloodTrailLens: Lens = {
  name: 'blood',
  displayName: 'Blood Trail',
  description: 'Visualizes combat damage through organic staining. Blue marks first bloods, red marks kills, creating a visceral battle history.',
  opacity: 0.5,
  
  defaultOptions: {
    opacity: 0.5,
    color: 'rgb(185, 28, 28)', // Red-700
    blendMode: 'multiply',
    animationSpeed: 1,
    showLabels: false
  },
  
  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: BloodTrailLensOptions
  ): void => {
    const { damageEvents } = data
    
    const mergedOptions = { ...bloodTrailLens.defaultOptions, ...options }
    const { opacity } = mergedOptions
    const {
      firstBloodColor = 'rgb(29, 78, 216)',   // Blue-700
      killColor = 'rgb(185, 28, 28)',          // Red-700
      damageColor = 'rgb(127, 29, 29)',        // Red-900 (darker)
      sizeMultiplier = 1
    } = options || {}
    
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = opacity
    
    damageEvents.forEach((event) => {
      // Generate unique ID for this damage event
      const stainId = `${event.timestamp}-${event.position.x}-${event.position.y}-${event.victim}`
      
      // Determine color based on event type
      let color: string
      let baseIntensity: number
      let radius: number
      
      if (event.isFirstBlood) {
        color = firstBloodColor
        baseIntensity = 0.9
        radius = 25 * sizeMultiplier
      } else if (event.isFatal) {
        color = killColor
        baseIntensity = 0.7
        radius = 20 * sizeMultiplier
      } else {
        color = damageColor
        baseIntensity = 0.4
        radius = 12 * sizeMultiplier
      }
      
      // Scale by damage amount
      const intensity = Math.min(1, baseIntensity * (event.damage / 100))
      
      // Store stain record
      if (!renderedStains.has(stainId)) {
        renderedStains.set(stainId, {
          id: stainId,
          position: event.position,
          color,
          intensity,
          radius,
          timestamp: event.timestamp
        })
      }
      
      // Render the stain
      renderStain(ctx, event.position, color, intensity, {
        radius,
        irregularity: 0.4
      })
      
      // Add spray pattern for gunshot wounds
      if (event.damage > 50) {
        const sprayCount = Math.floor(event.damage / 25)
        for (let i = 0; i < sprayCount; i++) {
          const angle = Math.random() * Math.PI * 2
          const distance = radius * (0.8 + Math.random() * 0.7)
          const size = 2 + Math.random() * 3
          
          ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${intensity * 0.5})`)
          ctx.beginPath()
          ctx.arc(
            event.position.x + Math.cos(angle) * distance,
            event.position.y + Math.sin(angle) * distance,
            size,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }
    })
    
    // Draw connecting trails for sequences
    const sortedEvents = [...damageEvents].sort((a, b) => a.timestamp - b.timestamp)
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const prev = sortedEvents[i - 1]
      const curr = sortedEvents[i]
      
      // Only connect events that are close in time and space
      const timeDiff = curr.timestamp - prev.timestamp
      const distance = Math.sqrt(
        Math.pow(curr.position.x - prev.position.x, 2) +
        Math.pow(curr.position.y - prev.position.y, 2)
      )
      
      if (timeDiff < 5000 && distance < 200) {
        ctx.strokeStyle = killColor.replace('rgb', 'rgba').replace(')', ', 0.15)')
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(prev.position.x, prev.position.y)
        ctx.lineTo(curr.position.x, curr.position.y)
        ctx.stroke()
      }
    }
    
    ctx.restore()
  },
  
  reset: (): void => {
    renderedStains.clear()
  }
}

export default bloodTrailLens
