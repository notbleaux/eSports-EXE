/** [Ver001.000] */
/**
 * Damage Dealt Lens
 * =================
 * Visualizes damage distribution across the map.
 * Shows where damage was dealt, by whom, and its effectiveness.
 * Uses graduated circles with directional indicators.
 */

import type { Lens, GameData, LensOptions, DamageEvent, Vector2D } from '../types'
import { renderStain } from '../../lenses/helpers'

export interface DamageDealtOptions extends Partial<LensOptions> {
  /** Minimum damage to display */
  minDamage?: number
  /** Show damage direction arrows */
  showDirection?: boolean
  /** Group by attacker */
  groupByAttacker?: boolean
  /** Highlight critical damage (>100) */
  highlightCritical?: boolean
  /** Show damage numbers */
  showNumbers?: boolean
  /** Animate damage pulses */
  animatePulses?: boolean
}

/** Processed damage event with calculated properties */
interface ProcessedDamage {
  position: Vector2D
  attacker: string
  victim: string
  damage: number
  isCritical: boolean
  isFatal: boolean
  timestamp: number
  direction?: Vector2D
}

/**
 * Process damage events for visualization
 */
function processDamageEvents(events: DamageEvent[]): ProcessedDamage[] {
  return events.map(event => ({
    position: event.position,
    attacker: event.attacker,
    victim: event.victim,
    damage: event.damage,
    isCritical: event.damage >= 100,
    isFatal: event.isFatal ?? false,
    timestamp: event.timestamp,
    direction: undefined // Would be calculated from player positions
  }))
}

/**
 * Get color based on damage amount
 */
function getDamageColor(damage: number, isFatal: boolean): string {
  if (isFatal) return 'rgb(185, 28, 28)' // Dark red for kills
  if (damage >= 100) return 'rgb(239, 68, 68)' // Red for critical
  if (damage >= 75) return 'rgb(249, 115, 22)' // Orange for heavy
  if (damage >= 50) return 'rgb(234, 179, 8)' // Yellow for medium
  return 'rgb(156, 163, 175)' // Gray for light
}

/**
 * Get radius based on damage amount
 */
function getDamageRadius(damage: number): number {
  const baseRadius = 8
  const scaleFactor = Math.min(2, damage / 50)
  return baseRadius * scaleFactor
}

export const damageDealtLens: Lens = {
  name: 'damage-dealt',
  displayName: 'Damage Dealt',
  description: 'Shows damage distribution. Size = damage amount, Color = severity (Red = critical, Gray = light).',
  opacity: 0.75,

  defaultOptions: {
    opacity: 0.75,
    colors: { primary: 'rgb(239, 68, 68)' },
    blendMode: 'multiply',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: DamageDealtOptions
  ): void => {
    const mergedOptions = { ...damageDealtLens.defaultOptions, ...options }
    const {
      minDamage = 10,
      showDirection = true,
      groupByAttacker = false,
      highlightCritical = true,
      showNumbers = true,
      animatePulses = false
    } = options || {}

    const processed = processDamageEvents(data.damageEvents)
    const filtered = processed.filter(d => d.damage >= minDamage)

    if (filtered.length === 0) return

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity ?? 0.75

    // Group by position for clustering
    const clusters = clusterDamageEvents(filtered, 60)

    clusters.forEach(cluster => {
      // Calculate cluster properties
      const totalDamage = cluster.reduce((sum, d) => sum + d.damage, 0)
      const maxDamage = Math.max(...cluster.map(d => d.damage))
      const hasFatal = cluster.some(d => d.isFatal)
      const hasCritical = cluster.some(d => d.isCritical)

      const centerX = cluster.reduce((sum, d) => sum + d.position.x, 0) / cluster.length
      const centerY = cluster.reduce((sum, d) => sum + d.position.y, 0) / cluster.length

      const radius = getDamageRadius(maxDamage) * (1 + cluster.length * 0.1)
      const color = getDamageColor(maxDamage, hasFatal)

      // Draw damage stain
      renderStain(ctx, { x: centerX, y: centerY }, color, maxDamage / 150, {
        radius: radius * 1.5,
        irregularity: 0.3
      })

      // Draw main circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Critical damage indicator
      if (highlightCritical && hasCritical) {
        ctx.strokeStyle = '#fbbf24' // Amber border
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Fatal damage indicator
      if (hasFatal) {
        // Draw X mark
        const xSize = radius * 0.6
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX - xSize, centerY - xSize)
        ctx.lineTo(centerX + xSize, centerY + xSize)
        ctx.moveTo(centerX + xSize, centerY - xSize)
        ctx.lineTo(centerX - xSize, centerY + xSize)
        ctx.stroke()
      }

      // Show damage number
      if (showNumbers) {
        ctx.fillStyle = 'white'
        ctx.font = `bold ${Math.max(8, radius)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(Math.round(totalDamage).toString(), centerX, centerY)
      }

      // Draw direction arrows if enabled
      if (showDirection) {
        cluster.forEach(damage => {
          if (damage.direction) {
            drawDirectionArrow(ctx, damage.position, damage.direction, color)
          }
        })
      }
    })

    // Draw damage flow lines
    drawDamageFlow(ctx, filtered)

    ctx.restore()
  }
}

/**
 * Cluster damage events by proximity
 */
function clusterDamageEvents(events: ProcessedDamage[], threshold: number): ProcessedDamage[][] {
  const clusters: ProcessedDamage[][] = []
  const visited = new Set<number>()

  events.forEach((event, index) => {
    if (visited.has(index)) return

    const cluster: ProcessedDamage[] = [event]
    visited.add(index)

    events.forEach((other, otherIndex) => {
      if (visited.has(otherIndex) || index === otherIndex) return

      const dx = event.position.x - other.position.x
      const dy = event.position.y - other.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < threshold) {
        cluster.push(other)
        visited.add(otherIndex)
      }
    })

    clusters.push(cluster)
  })

  return clusters
}

/**
 * Draw direction arrow for damage source
 */
function drawDirectionArrow(
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  direction: Vector2D,
  color: string
): void {
  const arrowLength = 25
  const angle = Math.atan2(direction.y, direction.x)

  const endX = position.x + Math.cos(angle) * arrowLength
  const endY = position.y + Math.sin(angle) * arrowLength

  ctx.save()
  ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', ', 0.6)')
  ctx.lineWidth = 2

  // Draw arrow shaft
  ctx.beginPath()
  ctx.moveTo(position.x, position.y)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // Draw arrowhead
  ctx.fillStyle = ctx.strokeStyle
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(
    endX - 8 * Math.cos(angle - Math.PI / 6),
    endY - 8 * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    endX - 8 * Math.cos(angle + Math.PI / 6),
    endY - 8 * Math.sin(angle + Math.PI / 6)
  )
  ctx.fill()

  ctx.restore()
}

/**
 * Draw damage flow connections
 */
function drawDamageFlow(ctx: CanvasRenderingContext2D, events: ProcessedDamage[]): void {
  const timeWindow = 5000 // 5 seconds

  // Group by attacker
  const byAttacker = new Map<string, ProcessedDamage[]>()
  events.forEach(event => {
    const list = byAttacker.get(event.attacker) || []
    list.push(event)
    byAttacker.set(event.attacker, list)
  })

  // Draw connections for each attacker's damage sequence
  byAttacker.forEach(damages => {
    damages.sort((a, b) => a.timestamp - b.timestamp)

    for (let i = 1; i < damages.length; i++) {
      const timeDiff = damages[i].timestamp - damages[i - 1].timestamp

      if (timeDiff < timeWindow) {
        const prev = damages[i - 1]
        const curr = damages[i]

        const alpha = 0.3 * (1 - timeDiff / timeWindow)
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])

        ctx.beginPath()
        ctx.moveTo(prev.position.x, prev.position.y)
        ctx.lineTo(curr.position.x, curr.position.y)
        ctx.stroke()
      }
    }
  })

  ctx.setLineDash([])
}

export default damageDealtLens
