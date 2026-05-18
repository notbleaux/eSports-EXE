// @ts-nocheck
/** [Ver001.000]
 * Entry Fragging Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes entry fragging success rates by position and timing.
 * Reveals optimal entry points, first blood patterns, and coordination strategies.
 * 
 * Features:
 * - Entry success rate by position
 * - First blood analysis
 * - Entry timing optimization
 * - Team coordination metrics
 * - Position-specific recommendations
 */

import type {
  EntryFraggingData,
  EntryAttempt,
  EntryOutcome,
  FirstBlood,
  EntryPositionStats,
  EntryRecommendation,
  Player,
  MapBounds,
  Site,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Entry timing windows in seconds */
export const ENTRY_TIMINGS = {
  rush: { min: 0, max: 10, label: 'Rush' },
  fast: { min: 10, max: 20, label: 'Fast' },
  default: { min: 20, max: 35, label: 'Default' },
  late: { min: 35, max: 60, label: 'Late' }
}

/** Minimum sample size for reliable stats */
export const MIN_SAMPLE_SIZE = 5

/** Entry point detection radius */
export const ENTRY_RADIUS = 200

/** Colors for entry visualization */
export const ENTRY_COLORS = {
  success: {
    high: 'rgba(0, 255, 100, 0.8)',
    medium: 'rgba(200, 255, 100, 0.7)',
    low: 'rgba(255, 200, 100, 0.6)',
    poor: 'rgba(255, 100, 100, 0.6)'
  },
  firstBlood: {
    attacker: 'rgba(0, 200, 255, 1)',
    defender: 'rgba(255, 80, 80, 1)'
  },
  site: 'rgba(255, 200, 100, 0.3)',
  siteBorder: 'rgba(255, 200, 100, 0.8)',
  entryPath: 'rgba(255, 255, 255, 0.4)',
  killLine: 'rgba(255, 100, 100, 0.8)'
}

// ============================================================================
// Types
// ============================================================================

/** Entry calculation options */
export interface EntryOptions {
  minSampleSize?: number
  considerTiming?: boolean
  considerUtility?: boolean
  siteFocus?: string
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Raw entry event from match data */
export interface RawEntryEvent {
  timestamp: number
  entryPoint: Vector2D
  site: Site
  attackers: string[]
  defenders: string[]
  firstBlood?: FirstBlood
  outcome: 'success' | 'failure'
  utilityUsed: string[]
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate entry fragging analysis
 * @param players - Array of player data
 * @param mapBounds - Map boundary information
 * @param rawEvents - Raw entry events from match data
 * @param options - Calculation options
 * @returns Entry fragging data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  rawEvents: RawEntryEvent[] = [],
  options: EntryOptions = {}
): LensResult<EntryFraggingData> {
  const {
    minSampleSize = MIN_SAMPLE_SIZE,
    considerUtility: _considerUtility = true,
    siteFocus
  } = options

  const attackers = players.filter(p => p.team === 'attackers' && p.isAlive)
  const sites = siteFocus 
    ? mapBounds.sites.filter(s => s.name.toLowerCase() === siteFocus.toLowerCase())
    : mapBounds.sites

  // Generate entry attempts from events or create synthetic ones
  const attempts = rawEvents.length > 0 
    ? processRawEvents(rawEvents, players)
    : generateSyntheticEntries(attackers, sites, players)

  // Calculate position statistics
  const positionStats = calculatePositionStats(attempts, sites, minSampleSize)

  // Calculate overall stats
  const overallStats = calculateOverallStats(attempts)

  // Generate recommendations
  const recommendations = generateEntryRecommendations(positionStats, sites, _considerUtility)

  const data: EntryFraggingData = {
    attempts,
    positionStats,
    overallStats,
    recommendations
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(attempts.length, minSampleSize),
      sampleSize: attempts.length
    }
  }
}

/**
 * Process raw entry events
 */
function processRawEvents(
  events: RawEntryEvent[],
  players: Player[]
): EntryAttempt[] {
  return events.map((event, index) => {
    const attackerPlayers = players.filter(p => event.attackers.includes(p.id))
    const defenderPlayers = players.filter(p => event.defenders.includes(p.id))

    const outcome: EntryOutcome = {
      success: event.outcome === 'success',
      kills: event.firstBlood ? 1 : 0,
      deaths: event.firstBlood?.victim && event.attackers.includes(event.firstBlood.victim) ? 1 : 0,
      trades: 0,
      siteTaken: event.outcome === 'success'
    }

    return {
      id: `entry-${index}`,
      roundId: `round-${index}`,
      site: event.site,
      entryPoint: event.entryPoint,
      entryTime: event.timestamp,
      attackers: attackerPlayers,
      defenders: defenderPlayers,
      outcome,
      firstBlood: event.firstBlood
    }
  })
}

/**
 * Generate synthetic entry data for demonstration
 */
function generateSyntheticEntries(
  attackers: Player[],
  sites: Site[],
  allPlayers: Player[]
): EntryAttempt[] {
  const attempts: EntryAttempt[] = []

  for (const site of sites) {
    // Generate entry points around the site
    const entryPoints = generateEntryPoints(site)
    
    for (let i = 0; i < 15; i++) {
      const entryPoint = entryPoints[i % entryPoints.length]
      const timing = Math.random() * 40 + 5
      
      const entryAttackers = attackers.slice(0, Math.floor(Math.random() * 3) + 1)
      const entryDefenders = allPlayers.filter(p => 
        p.team === 'defenders' && 
        distance(p.position, site.position) < site.radius * 2
      )

      const hasFirstBlood = Math.random() > 0.5
      const firstBloodKill = hasFirstBlood ? {
        time: timing + Math.random() * 2,
        killer: Math.random() > 0.4 ? entryAttackers[0]?.id : entryDefenders[0]?.id,
        victim: Math.random() > 0.4 ? entryDefenders[0]?.id : entryAttackers[0]?.id,
        weapon: ['Vandal', 'Phantom', 'Operator'][Math.floor(Math.random() * 3)],
        position: {
          x: entryPoint.x + (Math.random() - 0.5) * 100,
          y: entryPoint.y + (Math.random() - 0.5) * 100
        },
        isEntryKill: true
      } : undefined

      const success = Math.random() > 0.4

      attempts.push({
        id: `entry-${site.name}-${i}`,
        roundId: `round-${i}`,
        site,
        entryPoint,
        entryTime: timing,
        attackers: entryAttackers,
        defenders: entryDefenders,
        outcome: {
          success,
          kills: success ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
          deaths: success ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2) + 1,
          trades: Math.floor(Math.random() * 2),
          siteTaken: success
        },
        firstBlood: firstBloodKill
      })
    }
  }

  return attempts
}

/**
 * Generate potential entry points for a site
 */
function generateEntryPoints(site: Site): Vector2D[] {
  const points: Vector2D[] = []
  const numPoints = 6
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const distance = site.radius * (1.5 + Math.random() * 0.5)
    
    points.push({
      x: site.position.x + Math.cos(angle) * distance,
      y: site.position.y + Math.sin(angle) * distance
    })
  }
  
  return points
}

/**
 * Calculate position statistics
 */
function calculatePositionStats(
  attempts: EntryAttempt[],
  _sites: Site[],
  minSampleSize: number
): EntryPositionStats[] {
  const positionGroups = new Map<string, EntryAttempt[]>()

  // Group attempts by entry point proximity
  for (const attempt of attempts) {
    const key = `${attempt.site.name}-${Math.floor(attempt.entryPoint.x / ENTRY_RADIUS)}-${Math.floor(attempt.entryPoint.y / ENTRY_RADIUS)}`
    
    if (!positionGroups.has(key)) {
      positionGroups.set(key, [])
    }
    positionGroups.get(key)!.push(attempt)
  }

  const stats: EntryPositionStats[] = []

  for (const [_key, group] of positionGroups) {
    if (group.length < minSampleSize) continue

    const avgX = group.reduce((sum, a) => sum + a.entryPoint.x, 0) / group.length
    const avgY = group.reduce((sum, a) => sum + a.entryPoint.y, 0) / group.length

    const successes = group.filter(a => a.outcome.success).length
    const firstBloods = group.filter(a => a.firstBlood?.killer && 
      a.attackers.some(att => att.id === a.firstBlood?.killer)).length
    const deaths = group.filter(a => a.outcome.deaths > 0).length

    const successRate = successes / group.length
    const kdr = deaths > 0 ? group.reduce((sum, a) => sum + a.outcome.kills, 0) / deaths : group.length
    const avgTime = group.reduce((sum, a) => sum + a.entryTime, 0) / group.length

    stats.push({
      position: { x: avgX, y: avgY },
      attempts: group.length,
      successes,
      firstBloods,
      deaths,
      kdr,
      successRate,
      averageTime: avgTime
    })
  }

  return stats.sort((a, b) => b.successRate - a.successRate)
}

/**
 * Calculate overall statistics
 */
function calculateOverallStats(attempts: EntryAttempt[]): EntryFraggingData['overallStats'] {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      successRate: 0,
      averageEntryTime: 0,
      firstBloodRate: 0
    }
  }

  const successes = attempts.filter(a => a.outcome.success).length
  const firstBloods = attempts.filter(a => a.firstBlood).length
  const avgTime = attempts.reduce((sum, a) => sum + a.entryTime, 0) / attempts.length

  return {
    totalAttempts: attempts.length,
    successRate: successes / attempts.length,
    averageEntryTime: avgTime,
    firstBloodRate: firstBloods / attempts.length
  }
}

/**
 * Generate entry recommendations
 */
function generateEntryRecommendations(
  positionStats: EntryPositionStats[],
  sites: Site[],
  considerUtility: boolean
): EntryRecommendation[] {
  const recommendations: EntryRecommendation[] = []

  // Get top performing positions for each site
  const sitePositions = new Map<string, EntryPositionStats[]>()
  
  for (const stat of positionStats) {
    for (const site of sites) {
      if (distance(stat.position, site.position) < site.radius * 3) {
        if (!sitePositions.has(site.name)) {
          sitePositions.set(site.name, [])
        }
        sitePositions.get(site.name)!.push(stat)
      }
    }
  }

  for (const [siteName, positions] of sitePositions) {
    // Sort by success rate
    positions.sort((a, b) => b.successRate - a.successRate)
    
    const bestPosition = positions[0]
    if (!bestPosition || bestPosition.successRate < 0.3) continue

    // Determine coordination level
    let coordination: 'solo' | 'double' | 'triple' = 'solo'
    if (bestPosition.successRate > 0.7) {
      coordination = 'double'
    }
    if (bestPosition.successRate > 0.85) {
      coordination = 'triple'
    }

    // Determine utility
    const utility: string[] = []
    if (considerUtility) {
      if (bestPosition.firstBloods < bestPosition.attempts * 0.3) {
        utility.push('flash_entry')
      }
      if (bestPosition.deaths > bestPosition.attempts * 0.4) {
        utility.push('smoke_block')
      }
    }

    recommendations.push({
      site: siteName,
      entryPoint: bestPosition.position,
      utility,
      coordination,
      timing: bestPosition.averageTime,
      confidence: bestPosition.successRate
    })
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculate confidence score
 */
function calculateConfidence(attemptCount: number, minSampleSize: number): number {
  const baseConfidence = 0.5
  const sampleBonus = Math.min(0.4, (attemptCount / (minSampleSize * 5)) * 0.4)
  return Math.min(1.0, baseConfidence + sampleBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render entry fragging analysis to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<EntryFraggingData>,
  options: Partial<LensRenderOptions> = {}
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const {
    opacity = 0.8,
    scale = 1,
    offset = { x: 0, y: 0 },
    showLabels = true
  } = options

  const { data } = result

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.scale(scale, scale)
  ctx.translate(offset.x, offset.y)

  // Render site areas
  renderSiteAreas(ctx, data.attempts)

  // Render entry attempts
  for (const attempt of data.attempts) {
    renderEntryAttempt(ctx, attempt)
  }

  // Render position statistics
  for (const stat of data.positionStats) {
    renderPositionStat(ctx, stat)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render site areas
 */
function renderSiteAreas(ctx: CanvasRenderingContext2D, attempts: EntryAttempt[]): void {
  const processedSites = new Set<string>()

  for (const attempt of attempts) {
    if (processedSites.has(attempt.site.name)) continue
    processedSites.add(attempt.site.name)

    ctx.beginPath()
    ctx.arc(attempt.site.position.x, attempt.site.position.y, attempt.site.radius, 0, Math.PI * 2)
    ctx.fillStyle = ENTRY_COLORS.site
    ctx.fill()
    ctx.strokeStyle = ENTRY_COLORS.siteBorder
    ctx.lineWidth = 2
    ctx.stroke()

    // Site label
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(attempt.site.name.toUpperCase(), attempt.site.position.x, attempt.site.position.y)
  }
}

/**
 * Render an entry attempt
 */
function renderEntryAttempt(ctx: CanvasRenderingContext2D, attempt: EntryAttempt): void {
  // Draw entry point
  ctx.beginPath()
  ctx.arc(attempt.entryPoint.x, attempt.entryPoint.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = attempt.outcome.success ? ENTRY_COLORS.success.high : ENTRY_COLORS.success.poor
  ctx.fill()
  
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw path to site
  ctx.beginPath()
  ctx.moveTo(attempt.entryPoint.x, attempt.entryPoint.y)
  ctx.lineTo(attempt.site.position.x, attempt.site.position.y)
  ctx.strokeStyle = ENTRY_COLORS.entryPath
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Draw first blood if occurred
  if (attempt.firstBlood) {
    ctx.beginPath()
    ctx.moveTo(attempt.firstBlood.position.x, attempt.firstBlood.position.y)
    const targetX = attempt.firstBlood.killer && attempt.attackers.some(a => a.id === attempt.firstBlood?.killer)
      ? attempt.site.position.x
      : attempt.entryPoint.x
    const targetY = attempt.firstBlood.killer && attempt.attackers.some(a => a.id === attempt.firstBlood?.killer)
      ? attempt.site.position.y
      : attempt.entryPoint.y
    ctx.lineTo(targetX, targetY)
    
    ctx.strokeStyle = ENTRY_COLORS.killLine
    ctx.lineWidth = 2
    ctx.stroke()

    // First blood marker
    ctx.beginPath()
    ctx.arc(attempt.firstBlood.position.x, attempt.firstBlood.position.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = ENTRY_COLORS.firstBlood.attacker
    ctx.fill()
  }
}

/**
 * Render position statistics
 */
function renderPositionStat(ctx: CanvasRenderingContext2D, stat: EntryPositionStats): void {
  // Determine color based on success rate
  let color = ENTRY_COLORS.success.poor
  if (stat.successRate > 0.7) {
    color = ENTRY_COLORS.success.high
  } else if (stat.successRate > 0.5) {
    color = ENTRY_COLORS.success.medium
  } else if (stat.successRate > 0.3) {
    color = ENTRY_COLORS.success.low
  }

  // Draw stat zone
  const radius = 20 + stat.attempts * 2
  ctx.beginPath()
  ctx.arc(stat.position.x, stat.position.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Success rate text
  ctx.font = 'bold 12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${(stat.successRate * 100).toFixed(0)}%`, stat.position.x, stat.position.y)

  // Attempt count
  ctx.font = '10px sans-serif'
  ctx.fillText(`n=${stat.attempts}`, stat.position.x, stat.position.y + 12)
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: EntryFraggingData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Entry Attempts: ${data.overallStats.totalAttempts}`, 10, y)
  y += 20
  
  ctx.fillText(`Success Rate: ${(data.overallStats.successRate * 100).toFixed(0)}%`, 10, y)
  y += 20
  
  ctx.fillText(`Avg Entry Time: ${data.overallStats.averageEntryTime.toFixed(1)}s`, 10, y)
  y += 20
  
  ctx.fillText(`First Blood Rate: ${(data.overallStats.firstBloodRate * 100).toFixed(0)}%`, 10, y)
  y += 25

  // Recommendations
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Recommendations:', 10, y)
  y += 18

  ctx.font = '11px sans-serif'
  for (const rec of data.recommendations.slice(0, 3)) {
    ctx.fillText(
      `${rec.site}: ${rec.coordination} entry @ ${rec.timing.toFixed(0)}s (${(rec.confidence * 100).toFixed(0)}%)`,
      10, y
    )
    y += 16
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Distance between two points
 */
function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Get entry timing category
 */
export function getEntryTimingCategory(timeSeconds: number): string {
  for (const [_key, window] of Object.entries(ENTRY_TIMINGS)) {
    if (timeSeconds >= window.min && timeSeconds <= window.max) {
      return window.label
    }
  }
  return 'Unknown'
}

/**
 * Calculate entry difficulty rating
 */
export function calculateEntryDifficulty(
  entryPoint: Vector2D,
  site: Site,
  defenders: Player[]
): number {
  const distToSite = distance(entryPoint, site.position)
  const nearbyDefenders = defenders.filter(d => 
    distance(d.position, entryPoint) < ENTRY_RADIUS * 2
  ).length

  // Higher distance and more defenders = higher difficulty
  const distanceFactor = Math.min(1, distToSite / (site.radius * 3))
  const defenderFactor = Math.min(1, nearbyDefenders / 3)

  return (distanceFactor * 0.3 + defenderFactor * 0.7)
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  getEntryTimingCategory,
  calculateEntryDifficulty,
  ENTRY_TIMINGS,
  ENTRY_RADIUS,
  ENTRY_COLORS
}
