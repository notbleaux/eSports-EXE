/** [Ver001.000] */
/**
 * Lens Render Helpers
 * ===================
 * Utility functions for rendering lens visualizations.
 */

import type {
  HeatmapCell,
  FlowVector,
  KillEvent,
  PlayerPosition,
  Vector2D,
  RenderHelpers
} from './types'

/** Calculate distance between two points */
const distance = (a: Vector2D, b: Vector2D): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

/** Linear interpolation */
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Create radial gradient for heatmap cells */
const createHeatGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): CanvasGradient => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color.replace(')', ', 0.8)').replace('rgb', 'rgba'))
  gradient.addColorStop(0.5, color.replace(')', ', 0.3)').replace('rgb', 'rgba'))
  gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'))
  return gradient
}

/** Render heatmap from cell data */
const renderHeatmap = (
  ctx: CanvasRenderingContext2D,
  cells: HeatmapCell[],
  options: { color: string; opacity: number; radius: number }
): void => {
  const { color, opacity, radius } = options
  
  ctx.save()
  ctx.globalAlpha = opacity
  
  cells.forEach((cell) => {
    const x = cell.x
    const y = cell.y
    const cellRadius = radius * (0.5 + cell.intensity * 0.5)
    
    const gradient = createHeatGradient(ctx, x, y, cellRadius, color)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, cellRadius, 0, Math.PI * 2)
    ctx.fill()
  })
  
  ctx.restore()
}

/** Render expanding ripple effect */
const renderRipple = (
  ctx: CanvasRenderingContext2D,
  center: Vector2D,
  progress: number,
  options: { color: string; maxRadius: number; lineWidth: number }
): void => {
  const { color, maxRadius, lineWidth } = options
  const radius = maxRadius * progress
  const alpha = 1 - progress
  
  ctx.save()
  ctx.strokeStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba')
  ctx.lineWidth = lineWidth * (1 - progress * 0.5)
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** Render organic blood/decal stain */
const renderStain = (
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  color: string,
  intensity: number,
  options: { radius?: number; irregularity?: number } = {}
): void => {
  const { radius = 15, irregularity = 0.3 } = options
  const actualRadius = radius * (0.7 + intensity * 0.6)
  
  ctx.save()
  ctx.fillStyle = color.replace(')', `, ${0.3 + intensity * 0.4})`).replace('rgb', 'rgba')
  
  // Create irregular blob shape
  ctx.beginPath()
  const points = 12
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = actualRadius * (1 + (Math.random() - 0.5) * irregularity)
    const x = position.x + Math.cos(angle) * r
    const y = position.y + Math.sin(angle) * r
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      // Use quadratic curves for organic feel
      const prevAngle = ((i - 1) / points) * Math.PI * 2
      const prevR = actualRadius * (1 + (Math.random() - 0.5) * irregularity)
      const prevX = position.x + Math.cos(prevAngle) * prevR
      const prevY = position.y + Math.sin(prevAngle) * prevR
      const cpX = (prevX + x) / 2 + (Math.random() - 0.5) * 5
      const cpY = (prevY + y) / 2 + (Math.random() - 0.5) * 5
      ctx.quadraticCurveTo(cpX, cpY, x, y)
    }
  }
  ctx.closePath()
  ctx.fill()
  
  // Add splatter spots
  const splatterCount = Math.floor(3 + intensity * 5)
  for (let i = 0; i < splatterCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = actualRadius * (0.5 + Math.random() * 0.8)
    const size = 2 + Math.random() * 4 * intensity
    
    ctx.beginPath()
    ctx.arc(
      position.x + Math.cos(angle) * dist,
      position.y + Math.sin(angle) * dist,
      size,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
  
  ctx.restore()
}

/** Render vector field showing movement flow */
const renderVectorField = (
  ctx: CanvasRenderingContext2D,
  vectors: FlowVector[],
  options: { color: string; density: number; arrowSize: number }
): void => {
  const { color, density, arrowSize } = options
  const step = Math.max(1, Math.floor(1 / density))
  
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  
  for (let i = 0; i < vectors.length; i += step) {
    const vector = vectors[i]
    const { position, direction, magnitude } = vector
    
    // Scale arrow by magnitude
    const len = arrowSize * magnitude
    const angle = Math.atan2(direction.y, direction.x)
    
    // Draw arrow shaft
    ctx.lineWidth = 1 + magnitude * 2
    ctx.globalAlpha = 0.2 + magnitude * 0.5
    
    ctx.beginPath()
    ctx.moveTo(position.x, position.y)
    ctx.lineTo(
      position.x + Math.cos(angle) * len,
      position.y + Math.sin(angle) * len
    )
    ctx.stroke()
    
    // Draw arrowhead
    const headLen = len * 0.3
    ctx.beginPath()
    ctx.moveTo(
      position.x + Math.cos(angle) * len,
      position.y + Math.sin(angle) * len
    )
    ctx.lineTo(
      position.x + Math.cos(angle - 0.5) * (len - headLen),
      position.y + Math.sin(angle - 0.5) * (len - headLen)
    )
    ctx.lineTo(
      position.x + Math.cos(angle + 0.5) * (len - headLen),
      position.y + Math.sin(angle + 0.5) * (len - headLen)
    )
    ctx.closePath()
    ctx.fill()
  }
  
  ctx.restore()
}

/** Calculate tension grid from kill events using Gaussian distribution */
const calculateTension = (
  events: KillEvent[],
  mapBounds: { width: number; height: number }
): HeatmapCell[] => {
  const gridSize = 20
  const cells: HeatmapCell[] = []
  const cellWidth = mapBounds.width / gridSize
  const cellHeight = mapBounds.height / gridSize
  
  // Initialize grid
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      cells.push({
        x: gx * cellWidth + cellWidth / 2,
        y: gy * cellHeight + cellHeight / 2,
        value: 0,
        intensity: 0
      })
    }
  }
  
  // Accumulate tension from kill events
  events.forEach((event) => {
    const influenceRadius = 100 // pixels
    
    cells.forEach((cell) => {
      const dist = distance(cell, event.position)
      if (dist < influenceRadius) {
        // Gaussian falloff
        const weight = Math.exp(-(dist * dist) / (2 * (influenceRadius / 2) ** 2))
        cell.value += weight
        
        // First bloods create more tension
        if (event.isFirstBlood) {
          cell.value += weight * 0.5
        }
      }
    })
  })
  
  // Normalize intensities
  const maxValue = Math.max(...cells.map((c) => c.value), 1)
  cells.forEach((cell) => {
    cell.intensity = Math.min(1, cell.value / maxValue)
  })
  
  return cells
}

/** Calculate movement flow field from player positions */
const calculateMovementFlow = (positions: PlayerPosition[]): FlowVector[] => {
  const vectors: FlowVector[] = []
  const gridSize = 15
  
  // Create grid of sample points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i / gridSize) * 1000 + 50 // Assuming 1000px map width
      const y = (j / gridSize) * 1000 + 50
      
      let totalDx = 0
      let totalDy = 0
      let totalWeight = 0
      
      // Sample nearby player movements
      positions.forEach((player) => {
        for (let k = 1; k < player.positions.length; k++) {
          const prev = player.positions[k - 1]
          const curr = player.positions[k]
          
          const dist = distance({ x, y }, curr)
          const influenceRadius = 150
          
          if (dist < influenceRadius) {
            const weight = 1 - dist / influenceRadius
            const dx = curr.x - prev.x
            const dy = curr.y - prev.y
            
            totalDx += dx * weight
            totalDy += dy * weight
            totalWeight += weight
          }
        }
      })
      
      if (totalWeight > 0) {
        const avgDx = totalDx / totalWeight
        const avgDy = totalDy / totalWeight
        const magnitude = Math.sqrt(avgDx * avgDx + avgDy * avgDy)
        
        if (magnitude > 0.1) {
          vectors.push({
            position: { x, y },
            direction: {
              x: avgDx / magnitude,
              y: avgDy / magnitude
            },
            magnitude: Math.min(1, magnitude / 10)
          })
        }
      }
    }
  }
  
  return vectors
}

/** Export all render helpers */
export const renderHelpers: RenderHelpers = {
  renderHeatmap,
  renderRipple,
  renderStain,
  renderVectorField,
  calculateTension,
  calculateMovementFlow
}

export {
  renderHeatmap,
  renderRipple,
  renderStain,
  renderVectorField,
  calculateTension,
  calculateMovementFlow
}
