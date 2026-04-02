// @ts-nocheck
/** [Ver001.000] */
/**
 * Performance Heatmap Lens
 * ========================
 * Visualizes kill/death density across the map.
 * Reveals high-activity zones, chokepoints, and dangerous areas.
 * Uses GPU-accelerated heatmap generation with temporal decay.
 */

import type { Lens, GameData, LensOptions } from '../types'
import { generateHeatmap, HeatmapPoint, HeatmapGradient } from '../utils/heatmap'

export interface PerformanceHeatmapOptions extends Partial<LensOptions> {
  /** Show kills (true), deaths (false), or both (undefined) */
  showKills?: boolean
  /** Heatmap radius in pixels */
  radius?: number
  /** Temporal decay for animations */
  temporalDecay?: boolean
  /** Decay rate in milliseconds */
  decayRate?: number
  /** Custom gradient for heatmap */
  gradient?: HeatmapGradient
  /** Weight multiplier for kill events */
  killWeight?: number
  /** Weight multiplier for death events */
  deathWeight?: number
  /** Highlight first bloods */
  highlightFirstBloods?: boolean
}

/** Performance-optimized gradient: transparent -> yellow -> orange -> red */
export const performanceGradient: HeatmapGradient = {
  stops: [
    { offset: 0.0, color: 'rgba(0, 0, 0, 0)' },
    { offset: 0.2, color: 'rgba(255, 255, 0, 0.3)' },
    { offset: 0.5, color: 'rgba(255, 165, 0, 0.6)' },
    { offset: 0.8, color: 'rgba(255, 69, 0, 0.8)' },
    { offset: 1.0, color: 'rgba(220, 20, 60, 0.9)' }
  ]
}

/** Kill gradient (blue tones) */
export const killGradient: HeatmapGradient = {
  stops: [
    { offset: 0.0, color: 'rgba(0, 0, 139, 0)' },
    { offset: 0.3, color: 'rgba(30, 144, 255, 0.4)' },
    { offset: 0.7, color: 'rgba(0, 0, 255, 0.7)' },
    { offset: 1.0, color: 'rgba(0, 0, 139, 0.9)' }
  ]
}

/** Death gradient (red tones) */
export const deathGradient: HeatmapGradient = {
  stops: [
    { offset: 0.0, color: 'rgba(139, 0, 0, 0)' },
    { offset: 0.3, color: 'rgba(255, 99, 71, 0.4)' },
    { offset: 0.7, color: 'rgba(255, 0, 0, 0.7)' },
    { offset: 1.0, color: 'rgba(139, 0, 0, 0.9)' }
  ]
}

export const performanceHeatmapLens: Lens = {
  name: 'performance-heatmap',
  displayName: 'Performance Heatmap',
  description: 'Visualizes kill/death density across the map. Red zones indicate high combat activity and dangerous chokepoints.',
  opacity: 0.65,

  defaultOptions: {
    opacity: 0.65,
    color: 'rgb(220, 38, 38)',
    blendMode: 'screen',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: PerformanceHeatmapOptions
  ): void => {
    const mergedOptions = { ...performanceHeatmapLens.defaultOptions, ...options }
    const {
      showKills = undefined,
      radius = 50,
      temporalDecay = false,
      decayRate = 5000,
      gradient = performanceGradient,
      killWeight = 1.0,
      deathWeight = 1.0,
      highlightFirstBloods = true
    } = options || {}

    const points: HeatmapPoint[] = []
    const currentTime = Date.now()

    // Process kill events
    data.killEvents.forEach(event => {
      const isKill = showKills !== false
      const isDeath = showKills !== true

      if (isKill) {
        points.push({
          x: event.position.x,
          y: event.position.y,
          intensity: killWeight * (event.isFirstBlood ? 1.5 : 1.0),
          timestamp: temporalDecay ? currentTime - (data.metadata.matchTime - event.timestamp) : undefined,
          radius: event.isFirstBlood ? radius * 1.3 : radius
        })
      }
    })

    // Process damage events as death indicators
    if (isDeath) {
      data.damageEvents
        .filter(event => event.isFatal)
        .forEach(event => {
          points.push({
            x: event.position.x,
            y: event.position.y,
            intensity: deathWeight * (event.isFirstBlood ? 1.5 : 1.0),
            timestamp: temporalDecay ? currentTime - (data.metadata.matchTime - event.timestamp) : undefined,
            radius: event.isFirstBlood ? radius * 1.3 : radius
          })
        })
    }

    if (points.length === 0) return

    // Generate heatmap
    ctx.save()
    generateHeatmap(ctx, points, {
      radius,
      opacity: mergedOptions.opacity,
      gradient,
      temporalDecay,
      decayRate,
      currentTime,
      blurSigma: 20,
      resolution: 0.5 // Lower resolution for performance
    })
    ctx.restore()

    // Highlight first bloods
    if (highlightFirstBloods) {
      ctx.save()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2

      data.killEvents
        .filter(event => event.isFirstBlood)
        .forEach(event => {
          const x = event.position.x
          const y = event.position.y
          const size = 8

          // Draw X marker
          ctx.beginPath()
          ctx.moveTo(x - size, y - size)
          ctx.lineTo(x + size, y + size)
          ctx.moveTo(x + size, y - size)
          ctx.lineTo(x - size, y + size)
          ctx.stroke()

          // Glow effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25)
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, 25, 0, Math.PI * 2)
          ctx.fill()
        })

      ctx.restore()
    }
  }
}

export default performanceHeatmapLens
