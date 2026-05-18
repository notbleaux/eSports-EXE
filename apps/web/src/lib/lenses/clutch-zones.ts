// @ts-nocheck
/** [Ver001.000]
 * Clutch Zones Lens
 * =================
 * Highlights areas where clutch situations occur with success rate analysis.
 * 
 * Features:
 * - Clutch location identification
 * - Success rate by position
 * - Multi-kill zone detection
 * - 1vX situation analysis
 * - Clutch heatmap visualization
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Clutch zone data */
export interface ClutchZone {
  /** Unique identifier */
  id: string
  /** Zone position */
  position: { x: number; y: number }
  /** Zone radius */
  radius: number
  /** Number of clutch attempts in this zone */
  attempts: number
  /** Number of successful clutches */
  successes: number
  /** Success rate (0.0 - 1.0) */
  successRate: number
  /** Average clutch size (1v1, 1v2, etc.) */
  avgClutchSize: number
  /** Best agent for this zone */
  bestAgents: Array<{ agent: string; successRate: number; count: number }>
  /** Recent clutch events */
  recentEvents: ClutchEvent[]
  /** Zone tier based on success rate */
  tier: 'god' | 'excellent' | 'good' | 'average' | 'poor'
  /** Average time to clutch completion */
  avgTimeToComplete: number
}

/** Individual clutch event */
export interface ClutchEvent {
  /** Event timestamp */
  timestamp: number
  /** Player who clutched (or attempted) */
  playerId: string
  /** Agent used */
  agent: string
  /** Clutch situation (1vX) */
  situation: { remainingAllies: number; remainingEnemies: number }
  /** Whether clutch was successful */
  wasSuccessful: boolean
  /** Position during clutch */
  position: { x: number; y: number }
  /** Duration of clutch in ms */
  duration: number
  /** Key kills during clutch */
  kills: Array<{ time: number; weapon: string; headshot: boolean }>
}

/** Input data for clutch zone calculation */
export interface ClutchZoneInput {
  /** Historical clutch events */
  events: ClutchEvent[]
  /** Map bounds */
  mapBounds: { minX: number; maxX: number; minY: number; maxY: number }
  /** Zone grid size (smaller = more granular) */
  gridSize?: number
  /** Minimum events to consider zone valid */
  minEvents?: number
  /** Current player positions (for live prediction) */
  currentPositions?: Array<{
    playerId: string
    x: number
    y: number
    team: 'allies' | 'enemies'
    health: number
  }>
}

/** Lens data output */
export interface ClutchZoneLensData {
  /** Clutch zones */
  zones: ClutchZone[]
  /** Heatmap of clutch activity */
  heatmap: HeatmapCell[]
  /** Overall clutch statistics */
  statistics: {
    totalAttempts: number
    totalSuccesses: number
    overallSuccessRate: number
    avgClutchSize: number
    bestZone?: string
  }
  /** Recommended clutch positions for current situation */
  recommendations: Array<{
    position: { x: number; y: number }
    confidence: number
    reasoning: string[]
  }>
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface ClutchZoneRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: ClutchZoneLensData
  /** Show success rate numbers */
  showRates?: boolean
  /** Show zone tiers */
  showTiers?: boolean
  /** Show recent event markers */
  showEvents?: boolean
  /** Show recommendations */
  showRecommendations?: boolean
  /** Minimum tier to display */
  minTier?: ClutchZone['tier']
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Tier thresholds based on success rate */
export const TIER_THRESHOLDS: Record<ClutchZone['tier'], number> = {
  god: 0.8,
  excellent: 0.65,
  good: 0.5,
  average: 0.35,
  poor: 0
}

/** Tier colors */
export const TIER_COLORS: Record<ClutchZone['tier'], string> = {
  god: '#fbbf24',      // Gold
  excellent: '#a855f7', // Purple
  good: '#22c55e',     // Green
  average: '#3b82f6',  // Blue
  poor: '#64748b'      // Slate
}

/** Default grid size */
export const DEFAULT_GRID_SIZE = 20

/** Default minimum events */
export const DEFAULT_MIN_EVENTS = 2

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate clutch zones based on input data
 * @param input - Clutch zone input data
 * @returns Clutch zone lens data
 */
export function calculate(input: ClutchZoneInput): ClutchZoneLensData {
  const calculatedAt = Date.now()
  const gridSize = input.gridSize || DEFAULT_GRID_SIZE
  const minEvents = input.minEvents || DEFAULT_MIN_EVENTS
  
  // Group events into grid cells
  const cellEvents = groupEventsIntoCells(input.events, input.mapBounds, gridSize)
  
  // Generate zones from cells
  const zones = generateZones(cellEvents, minEvents)
  
  // Generate heatmap
  const heatmap = generateHeatmap(zones, input.mapBounds)
  
  // Calculate statistics
  const statistics = calculateStatistics(zones)
  
  // Generate recommendations
  const recommendations = generateRecommendations(zones, input.currentPositions)
  
  return {
    zones,
    heatmap,
    statistics,
    recommendations,
    calculatedAt
  }
}

/**
 * Group events into grid cells
 */
function groupEventsIntoCells(
  events: ClutchEvent[],
  bounds: ClutchZoneInput['mapBounds'],
  gridSize: number
): Map<string, ClutchEvent[]> {
  const cells = new Map<string, ClutchEvent[]>()
  
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const cellWidth = width / gridSize
  const cellHeight = height / gridSize
  
  events.forEach(event => {
    const gridX = Math.floor((event.position.x - bounds.minX) / cellWidth)
    const gridY = Math.floor((event.position.y - bounds.minY) / cellHeight)
    const key = `${gridX},${gridY}`
    
    if (!cells.has(key)) {
      cells.set(key, [])
    }
    cells.get(key)!.push(event)
  })
  
  return cells
}

/**
 * Generate clutch zones from cell events
 */
function generateZones(
  cellEvents: Map<string, ClutchEvent[]>,
  minEvents: number
): ClutchZone[] {
  const zones: ClutchZone[] = []
  
  cellEvents.forEach((events, key) => {
    if (events.length < minEvents) return
    
    const [gridX, gridY] = key.split(',').map(Number)
    
    // Calculate position (center of cell)
    const position = {
      x: gridX * 5 + 2.5,
      y: gridY * 5 + 2.5
    }
    
    // Calculate stats
    const attempts = events.length
    const successes = events.filter(e => e.wasSuccessful).length
    const successRate = successes / attempts
    
    // Calculate average clutch size
    const totalClutchSize = events.reduce((sum, e) => 
      sum + e.situation.remainingEnemies, 0
    )
    const avgClutchSize = totalClutchSize / attempts
    
    // Find best agents
    const agentStats = new Map<string, { attempts: number; successes: number }>()
    events.forEach(e => {
      const stats = agentStats.get(e.agent) || { attempts: 0, successes: 0 }
      stats.attempts++
      if (e.wasSuccessful) stats.successes++
      agentStats.set(e.agent, stats)
    })
    
    const bestAgents = Array.from(agentStats.entries())
      .map(([agent, stats]) => ({
        agent,
        successRate: stats.successes / stats.attempts,
        count: stats.attempts
      }))
      .filter(a => a.count >= 2)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
    
    // Get recent events
    const recentEvents = [...events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
    
    // Determine tier
    const tier = determineTier(successRate)
    
    // Calculate average time to complete
    const avgTimeToComplete = events
      .filter(e => e.wasSuccessful)
      .reduce((sum, e) => sum + e.duration, 0) / successes || 0
    
    zones.push({
      id: `zone-${gridX}-${gridY}`,
      position,
      radius: 10,
      attempts,
      successes,
      successRate,
      avgClutchSize,
      bestAgents,
      recentEvents,
      tier,
      avgTimeToComplete
    })
  })
  
  return zones.sort((a, b) => b.successRate - a.successRate)
}

/**
 * Determine zone tier based on success rate
 */
function determineTier(successRate: number): ClutchZone['tier'] {
  if (successRate >= TIER_THRESHOLDS.god) return 'god'
  if (successRate >= TIER_THRESHOLDS.excellent) return 'excellent'
  if (successRate >= TIER_THRESHOLDS.good) return 'good'
  if (successRate >= TIER_THRESHOLDS.average) return 'average'
  return 'poor'
}

/**
 * Generate heatmap from zones
 */
function generateHeatmap(
  zones: ClutchZone[],
  _bounds: ClutchZoneInput['mapBounds']
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  zones.forEach(zone => {
    // Create heatmap cells around zone center
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const dist = zone.radius * 0.7
      
      const x = zone.position.x + Math.cos(angle) * dist
      const y = zone.position.y + Math.sin(angle) * dist
      
      // Intensity based on success rate and number of attempts
      const intensity = zone.successRate * Math.min(1, zone.attempts / 10) * 0.8
      
      cells.push({ x, y, value: intensity, intensity })
    }
    
    // Center cell
    cells.push({
      x: zone.position.x,
      y: zone.position.y,
      value: zone.successRate,
      intensity: zone.successRate * 0.9
    })
  })
  
  return cells
}

/**
 * Calculate overall statistics
 */
function calculateStatistics(zones: ClutchZone[]): ClutchZoneLensData['statistics'] {
  const totalAttempts = zones.reduce((sum, z) => sum + z.attempts, 0)
  const totalSuccesses = zones.reduce((sum, z) => sum + z.successes, 0)
  const overallSuccessRate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0
  const avgClutchSize = zones.length > 0 
    ? zones.reduce((sum, z) => sum + z.avgClutchSize, 0) / zones.length 
    : 0
  
  const bestZone = zones.length > 0 
    ? zones.sort((a, b) => b.successRate - a.successRate)[0].id
    : undefined
  
  return {
    totalAttempts,
    totalSuccesses,
    overallSuccessRate,
    avgClutchSize,
    bestZone
  }
}

/**
 * Generate recommendations for current situation
 */
function generateRecommendations(
  zones: ClutchZone[],
  currentPositions?: ClutchZoneInput['currentPositions']
): ClutchZoneLensData['recommendations'] {
  const recommendations: ClutchZoneLensData['recommendations'] = []
  
  if (!currentPositions) {
    // Return best zones overall
    zones
      .filter(z => z.tier === 'god' || z.tier === 'excellent')
      .slice(0, 3)
      .forEach(zone => {
        recommendations.push({
          position: zone.position,
          confidence: zone.successRate,
          reasoning: [
            `${(zone.successRate * 100).toFixed(0)}% success rate`,
            `${zone.attempts} clutch attempts`,
            `Best agents: ${zone.bestAgents.slice(0, 2).map(a => a.agent).join(', ')}`
          ]
        })
      })
    
    return recommendations
  }
  
  // Find ally players in clutch situation
  const allies = currentPositions.filter(p => p.team === 'allies' && p.health > 0)
  const enemies = currentPositions.filter(p => p.team === 'enemies')
  
  if (allies.length === 1 && enemies.length >= 2) {
    // Clutch situation - find best zone near current position
    const playerPos = allies[0]
    
    zones
      .filter(z => z.tier !== 'poor')
      .sort((a, b) => {
        // Score based on success rate and distance
        const distA = Math.sqrt(
          Math.pow(a.position.x - playerPos.x, 2) + 
          Math.pow(a.position.y - playerPos.y, 2)
        )
        const distB = Math.sqrt(
          Math.pow(b.position.x - playerPos.x, 2) + 
          Math.pow(b.position.y - playerPos.y, 2)
        )
        return (b.successRate * 100 - distA) - (a.successRate * 100 - distB)
      })
      .slice(0, 3)
      .forEach(zone => {
        recommendations.push({
          position: zone.position,
          confidence: zone.successRate * 0.9,
          reasoning: [
            `${(zone.successRate * 100).toFixed(0)}% clutch success rate`,
            `${zone.attempts} attempts in this zone`,
            ...zone.bestAgents.slice(0, 2).map(a => `+${a.agent} (${(a.successRate * 100).toFixed(0)}%)`)
          ]
        })
      })
  }
  
  return recommendations
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render clutch zones to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: ClutchZoneRenderOptions): boolean {
  const {
    canvas,
    data,
    showRates = true,
    showTiers = true,
    showEvents = true,
    showRecommendations = true,
    minTier = 'poor',
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Filter zones by tier
  const tierValues = Object.keys(TIER_THRESHOLDS) as ClutchZone['tier'][]
  const minTierIndex = tierValues.indexOf(minTier)
  const visibleZones = data.zones.filter(z => {
    const zoneTierIndex = tierValues.indexOf(z.tier)
    return zoneTierIndex <= minTierIndex
  })
  
  // Render heatmap base
  renderHeatmapBase(ctx, data.heatmap, animationProgress)
  
  // Render zones
  visibleZones.forEach(zone => {
    renderZone(ctx, zone, showRates, showTiers, showEvents, animationProgress)
  })
  
  // Render recommendations
  if (showRecommendations) {
    data.recommendations.forEach((rec, index) => {
      renderRecommendation(ctx, rec, index)
    })
  }
  
  // Render statistics overlay
  renderStatistics(ctx, data.statistics)
  
  ctx.restore()
  return true
}

/**
 * Render heatmap base
 */
function renderHeatmapBase(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapCell[],
  animationProgress: number
): void {
  heatmap.forEach(cell => {
    const intensity = cell.intensity * animationProgress * 0.5
    if (intensity < 0.05) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 6
    )
    gradient.addColorStop(0, `rgba(168, 85, 247, ${intensity})`)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 6, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Render a single zone
 */
function renderZone(
  ctx: CanvasRenderingContext2D,
  zone: ClutchZone,
  showRates: boolean,
  showTiers: boolean,
  showEvents: boolean,
  animationProgress: number
): void {
  const color = TIER_COLORS[zone.tier]
  const radius = zone.radius * animationProgress
  
  ctx.save()
  
  // Zone circle
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // Zone fill
  ctx.fillStyle = color + '20'
  ctx.globalAlpha = 0.3
  ctx.fill()
  
  // Success rate ring
  if (showRates) {
    ctx.globalAlpha = 0.8
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(
      zone.position.x, 
      zone.position.y, 
      radius * 0.7, 
      -Math.PI / 2, 
      -Math.PI / 2 + Math.PI * 2 * zone.successRate
    )
    ctx.stroke()
  }
  
  // Tier badge
  if (showTiers) {
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    ctx.font = 'bold 4px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(zone.tier[0].toUpperCase(), zone.position.x, zone.position.y - radius - 3)
  }
  
  // Success rate text
  if (showRates) {
    ctx.fillStyle = zone.successRate > 0.5 ? '#22c55e' : '#fbbf24'
    ctx.font = 'bold 5px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${(zone.successRate * 100).toFixed(0)}%`, zone.position.x, zone.position.y)
  }
  
  // Recent event markers
  if (showEvents && zone.recentEvents.length > 0) {
    zone.recentEvents.slice(0, 3).forEach((event, i) => {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
      const markerX = zone.position.x + Math.cos(angle) * (radius + 3)
      const markerY = zone.position.y + Math.sin(angle) * (radius + 3)
      
      ctx.fillStyle = event.wasSuccessful ? '#22c55e' : '#ef4444'
      ctx.beginPath()
      ctx.arc(markerX, markerY, 1.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  
  ctx.restore()
}

/**
 * Render recommendation
 */
function renderRecommendation(
  ctx: CanvasRenderingContext2D,
  rec: ClutchZoneLensData['recommendations'][0],
  index: number
): void {
  ctx.save()
  
  // Draw line from position to info
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(rec.position.x, rec.position.y)
  ctx.lineTo(rec.position.x + 15, rec.position.y - 10 - index * 8)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Draw confidence indicator
  ctx.fillStyle = `rgba(34, 197, 94, ${rec.confidence})`
  ctx.beginPath()
  ctx.arc(rec.position.x, rec.position.y, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

/**
 * Render statistics overlay
 */
function renderStatistics(
  ctx: CanvasRenderingContext2D,
  stats: ClutchZoneLensData['statistics']
): void {
  ctx.save()
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(2, 2, 35, 20)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '3px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  ctx.fillText(`Attempts: ${stats.totalAttempts}`, 4, 4)
  ctx.fillText(`Success: ${(stats.overallSuccessRate * 100).toFixed(0)}%`, 4, 9)
  ctx.fillText(`Avg 1v${stats.avgClutchSize.toFixed(1)}`, 4, 14)
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get best zones for a specific clutch situation
 * @param data - Lens data
 * @param remainingEnemies - Number of remaining enemies
 * @returns Filtered and sorted zones
 */
export function getBestZonesForSituation(
  data: ClutchZoneLensData,
  remainingEnemies: number
): ClutchZone[] {
  return data.zones
    .filter(z => z.avgClutchSize >= remainingEnemies - 0.5 && z.avgClutchSize <= remainingEnemies + 0.5)
    .sort((a, b) => b.successRate - a.successRate)
}

/**
 * Get agent recommendations for a zone
 * @param zone - Clutch zone
 * @returns Recommended agents with success rates
 */
export function getAgentRecommendations(
  zone: ClutchZone
): Array<{ agent: string; confidence: number }> {
  return zone.bestAgents.map(a => ({
    agent: a.agent,
    confidence: a.successRate
  }))
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  getBestZonesForSituation,
  getAgentRecommendations,
  TIER_THRESHOLDS,
  TIER_COLORS,
  DEFAULT_GRID_SIZE,
  DEFAULT_MIN_EVENTS
}
