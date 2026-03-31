/** [Ver001.000] */
/**
 * Ability Efficiency Lens
 * =======================
 * Visualizes utility usage vs impact correlation.
 * Shows where abilities were used and their effectiveness.
 * Green = high impact, Red = low impact, Size = value generated.
 */

import type { Lens, GameData, LensOptions, Vector2D } from '../types'

export interface AbilityEfficiencyOptions extends Partial<LensOptions> {
  /** Minimum impact threshold to display */
  impactThreshold?: number
  /** Show ability labels */
  showLabels?: boolean
  /** Group by ability type */
  groupByType?: boolean
}

/** Ability usage event with impact metrics */
interface AbilityEvent {
  position: Vector2D
  ability: string
  agent: string
  impact: number // 0.0 to 1.0 (damage, assists, etc.)
  cost: number // Credit cost
  timestamp: number
  efficiency: number // impact / cost ratio
}

/** Agent ability costs (simplified) */
const abilityCosts: Record<string, number> = {
  'blaze': 200, 'curveball': 250, 'hot hands': 0, 'run it back': 0,
  'sonic sensor': 0, 'boom bot': 300, 'paint shells': 200, 'showstopper': 0,
  'trapwire': 200, 'cyber cage': 100, 'spycam': 0, 'neural theft': 0,
  'cloudburst': 200, 'updraft': 150, 'tailwind': 0, 'blade storm': 0,
  'barrier orb': 400, 'slow orb': 200, 'healing orb': 0, 'resurrection': 0,
  'q-shaped explosion': 200, 'flash': 250, 'zero/point': 0, 'NULL/cmd': 0,
  'incendiary': 250, 'stim beacon': 200, 'sky smoke': 100, 'orbital strike': 0,
  'poison cloud': 200, 'toxic screen': 0, 'snake bite': 100, 'vipers pit': 0,
  'blast pack': 200, 'bouncy grenade': 200,
  'flashpoint': 250, 'fault line': 0, 'aftershock': 200, 'rolling thunder': 0,
  'shrouded step': 100, 'paranoia': 250, 'dark cover': 150, 'from the shadows': 0,
  'trailblazer': 300, 'guiding light': 250, 'regrowth': 150, 'seekers': 0
}

/**
 * Calculate ability efficiency based on game data
 * This is a simplified calculation - real implementation would use actual match data
 */
function calculateAbilityEfficiency(data: GameData): AbilityEvent[] {
  const events: AbilityEvent[] = []
  const abilityEvents = data.soundEvents.filter(e => e.soundType === 'ability')

  abilityEvents.forEach(sound => {
    // Find nearby kills/damage to estimate impact
    const nearbyKills = data.killEvents.filter(kill => {
      const dx = kill.position.x - sound.position.x
      const dy = kill.position.y - sound.position.y
      return Math.sqrt(dx * dx + dy * dy) < 300 // 300px radius
    })

    const nearbyDamage = data.damageEvents.filter(dmg => {
      const dx = dmg.position.x - sound.position.x
      const dy = dmg.position.y - sound.position.y
      return Math.sqrt(dx * dx + dy * dy) < 300
    })

    // Calculate impact
    let impact = 0
    impact += nearbyKills.length * 0.3
    impact += nearbyDamage.reduce((sum, d) => sum + d.damage, 0) / 500
    impact = Math.min(1, impact)

    const ability = sound.source.toLowerCase()
    const cost = abilityCosts[ability] || 200
    const efficiency = cost > 0 ? impact / (cost / 400) : impact

    events.push({
      position: sound.position,
      ability,
      agent: sound.source,
      impact,
      cost,
      timestamp: sound.timestamp,
      efficiency: Math.min(1, efficiency)
    })
  })

  return events
}

export const abilityEfficiencyLens: Lens = {
  name: 'ability-efficiency',
  displayName: 'Ability Efficiency',
  description: 'Shows utility usage vs impact. Green = efficient, Red = wasted. Circle size indicates total value generated.',
  opacity: 0.75,

  defaultOptions: {
    opacity: 0.75,
    colors: { primary: 'rgb(34, 197, 94)' },
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: AbilityEfficiencyOptions
  ): void => {
    const mergedOptions = { ...abilityEfficiencyLens.defaultOptions, ...options }
    const {
      impactThreshold = 0.1,
      showLabels = false,
      groupByType = true
    } = options || {}

    const events = calculateAbilityEfficiency(data)
    const filteredEvents = events.filter(e => e.impact >= impactThreshold)

    if (filteredEvents.length === 0) return

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity ?? 0.75

    // Group events by position for clustering
    const clusters = groupByType ? groupEventsByProximity(filteredEvents, 100) : filteredEvents.map(e => [e])

    clusters.forEach(cluster => {
      if (cluster.length === 0) return

      // Calculate cluster center
      const centerX = cluster.reduce((sum, e) => sum + e.position.x, 0) / cluster.length
      const centerY = cluster.reduce((sum, e) => sum + e.position.y, 0) / cluster.length
      const avgEfficiency = cluster.reduce((sum, e) => sum + e.efficiency, 0) / cluster.length
      const totalImpact = cluster.reduce((sum, e) => sum + e.impact, 0)
      const totalCost = cluster.reduce((sum, e) => sum + e.cost, 0)

      // Size based on total value
      const baseRadius = 15
      const sizeMultiplier = 0.5 + Math.min(2, totalImpact * 2)
      const radius = baseRadius * sizeMultiplier

      // Color based on efficiency (green = efficient, red = wasted)
      const r = Math.floor(255 * (1 - avgEfficiency))
      const g = Math.floor(255 * avgEfficiency)
      const color = `rgb(${r}, ${g}, 0)`

      // Draw outer glow
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5)
      glowGradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.3)'))
      glowGradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'))
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw main circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw efficiency indicator ring
      const ringRadius = radius + 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * avgEfficiency)
      ctx.strokeStyle = avgEfficiency > 0.5 ? '#22c55e' : '#ef4444'
      ctx.lineWidth = 3
      ctx.stroke()

      // Show cost/impact ratio
      if (showLabels && totalCost > 0) {
        ctx.fillStyle = 'white'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = `${Math.round(totalImpact * 100)}%`
        ctx.fillText(label, centerX, centerY)
      }
    })

    // Draw connecting lines for ability combos
    drawAbilityCombos(ctx, filteredEvents)

    ctx.restore()
  }
}

/**
 * Group events by proximity for clustering
 */
function groupEventsByProximity(events: AbilityEvent[], threshold: number): AbilityEvent[][] {
  const clusters: AbilityEvent[][] = []
  const visited = new Set<number>()

  events.forEach((event, index) => {
    if (visited.has(index)) return

    const cluster: AbilityEvent[] = [event]
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
 * Draw lines connecting abilities used in quick succession (combos)
 */
function drawAbilityCombos(ctx: CanvasRenderingContext2D, events: AbilityEvent[]): void {
  const comboWindow = 3000 // 3 seconds

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const timeDiff = Math.abs(events[i].timestamp - events[j].timestamp)

      if (timeDiff < comboWindow) {
        const x1 = events[i].position.x
        const y1 = events[i].position.y
        const x2 = events[j].position.x
        const y2 = events[j].position.y

        // Check if abilities are in different areas (coordination)
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        if (distance > 200) {
          ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)' // Purple for combos
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }
  }
}

export default abilityEfficiencyLens
