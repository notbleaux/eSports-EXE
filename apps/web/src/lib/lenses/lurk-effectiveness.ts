/** [Ver001.000]
 * Lurk Effectiveness Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes lurker path effectiveness and backstab timing.
 * Reveals optimal lurk routes, timing windows, and impact metrics.
 * 
 * Features:
 * - Lurker path analysis
 * - Backstab timing optimization
 * - Rotation force calculation
 * - Information value assessment
 * - Timing guide generation
 */

import type {
  LurkEffectivenessData,
  LurkRound,
  TimedPosition,
  LurkTimings,
  LurkImpact,
  LurkOutcome,
  OptimalLurkPath,
  BackstabOpportunity,
  LurkMetrics,
  LurkTimingGuide,
  Player,
  MapBounds,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Lurker movement speed (units/second) */
export const LURK_SPEED = 180

/** Crouch speed multiplier */
export const CROUCH_MULTIPLIER = 0.5

/** Lurk timing phases */
export const LURK_PHASES = {
  early: { start: 0, end: 15, label: 'Early' },
  mid: { start: 15, end: 35, label: 'Mid' },
  late: { start: 35, end: 80, label: 'Late' }
}

/** Backstab opportunity window (seconds before/after execute) */
export const BACKSTAB_WINDOW = 8

/** Minimum lurk distance to be effective */
export const MIN_LURK_DISTANCE = 1500

/** Maximum lurk distance before timing issues */
export const MAX_LURK_DISTANCE = 4000

/** Colors for lurk visualization */
export const LURK_COLORS = {
  path: {
    optimal: 'rgba(0, 255, 150, 0.8)',
    good: 'rgba(150, 255, 150, 0.6)',
    risky: 'rgba(255, 255, 100, 0.6)',
    dangerous: 'rgba(255, 150, 100, 0.6)'
  },
  hide: 'rgba(100, 150, 200, 0.5)',
  risk: 'rgba(255, 100, 100, 0.4)',
  backstab: {
    high: 'rgba(255, 50, 50, 0.8)',
    medium: 'rgba(255, 150, 50, 0.7)',
    low: 'rgba(255, 200, 100, 0.6)'
  },
  timing: {
    early: 'rgba(100, 200, 255, 0.6)',
    optimal: 'rgba(0, 255, 150, 0.6)',
    late: 'rgba(255, 200, 50, 0.6)'
  },
  impact: {
    high: 'rgba(0, 255, 100, 0.8)',
    medium: 'rgba(200, 255, 100, 0.7)',
    low: 'rgba(255, 255, 150, 0.6)'
  }
}

// ============================================================================
// Types
// ============================================================================

/** Lurk calculation options */
export interface LurkOptions {
  minDistance?: number
  maxDistance?: number
  considerStealth?: boolean
  backstabWindow?: number
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Raw lurk data from match */
export interface RawLurkData {
  roundId: string
  playerId: string
  path: { position: Vector2D; timestamp: number; velocity: number; isHidden: boolean }[]
  executeTime: number
  rotationsForced: number
  backstabKills: number
  informationGathered: number
  outcome: 'success' | 'caught' | 'timed_out'
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate lurk effectiveness analysis
 * @param players - Array of player positions
 * @param mapBounds - Map boundary information
 * @param rawLurks - Raw lurk data from matches
 * @param options - Calculation options
 * @returns Lurk effectiveness data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  rawLurks: RawLurkData[] = [],
  options: LurkOptions = {}
): LensResult<LurkEffectivenessData> {
  const {
    minDistance = MIN_LURK_DISTANCE,
    maxDistance = MAX_LURK_DISTANCE,
    considerStealth = true,
    backstabWindow = BACKSTAB_WINDOW
  } = options

  const lurkers = players.filter(p => p.team === 'attackers' && p.isAlive)

  // Process lurk data
  const rounds = rawLurks.length > 0
    ? processRawLurks(rawLurks)
    : generateSyntheticLurks(lurkers, mapBounds)

  // Calculate optimal paths
  const optimalPaths = calculateOptimalPaths(
    rounds,
    mapBounds,
    minDistance,
    maxDistance,
    considerStealth
  )

  // Identify backstab opportunities
  const opportunities = identifyBackstabOpportunities(
    rounds,
    optimalPaths,
    backstabWindow
  )

  // Calculate metrics
  const metrics = calculateLurkMetrics(rounds)

  // Generate timing guide
  const timingGuide = generateTimingGuide(rounds, optimalPaths)

  const data: LurkEffectivenessData = {
    rounds,
    optimalPaths,
    opportunities,
    metrics,
    timingGuide
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(rounds.length, optimalPaths.length),
      sampleSize: rounds.length
    }
  }
}

/**
 * Process raw lurk data
 */
function processRawLurks(rawLurks: RawLurkData[]): LurkRound[] {
  return rawLurks.map((raw, index) => {
    const path: TimedPosition[] = raw.path.map(p => ({
      position: p.position,
      timestamp: p.timestamp,
      velocity: p.velocity,
      isHidden: p.isHidden
    }))

    const timings: LurkTimings = {
      initialMove: path[0]?.timestamp || 0,
      positionReached: path[path.length - 1]?.timestamp || 0,
      firstContact: path.find(p => !p.isHidden)?.timestamp,
      backstab: raw.backstabKills > 0 ? raw.executeTime : undefined,
      rotationCall: raw.rotationsForced > 0 ? raw.executeTime - 5 : undefined
    }

    const impact: LurkImpact = {
      rotationsForced: raw.rotationsForced,
      informationGathered: raw.informationGathered,
      backstabKills: raw.backstabKills,
      distractionTime: timings.positionReached - timings.initialMove,
      sitePressure: raw.rotationsForced * 0.2
    }

    const outcome: LurkOutcome = {
      success: raw.outcome === 'success',
      reason: raw.backstabKills > 0 ? 'backstab' : 
              raw.rotationsForced > 0 ? 'rotation_force' : 
              raw.informationGathered > 0 ? 'info' : 'none',
      value: calculateLurkValue(impact)
    }

    return {
      id: `lurk-${index}`,
      playerId: raw.playerId,
      path,
      timings,
      impact,
      outcome
    }
  })
}

/**
 * Generate synthetic lurk data
 */
function generateSyntheticLurks(
  lurkers: Player[],
  mapBounds: MapBounds
): LurkRound[] {
  const rounds: LurkRound[] = []

  for (let i = 0; i < 15; i++) {
    const lurker = lurkers[i % lurkers.length] || { id: `lurker-${i}` }
    const startPos = { x: Math.random() * 200, y: Math.random() * 200 + 300 }
    const endPos = { x: mapBounds.width - 200 - Math.random() * 300, y: Math.random() * 400 }

    const pathLength = 10 + Math.floor(Math.random() * 10)
    const path: TimedPosition[] = []

    for (let j = 0; j < pathLength; j++) {
      const t = j / (pathLength - 1)
      path.push({
        position: {
          x: startPos.x + (endPos.x - startPos.x) * t + (Math.random() - 0.5) * 50,
          y: startPos.y + (endPos.y - startPos.y) * t + (Math.random() - 0.5) * 50
        },
        timestamp: 5 + j * 3,
        velocity: Math.random() > 0.3 ? LURK_SPEED : LURK_SPEED * CROUCH_MULTIPLIER,
        isHidden: Math.random() > 0.4
      })
    }

    const executeTime = 35 + Math.random() * 15
    const hasBackstab = Math.random() > 0.6
    const rotationsForced = hasBackstab ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3)

    const timings: LurkTimings = {
      initialMove: path[0].timestamp,
      positionReached: path[path.length - 1].timestamp,
      firstContact: Math.random() > 0.5 ? executeTime - 5 : undefined,
      backstab: hasBackstab ? executeTime : undefined,
      rotationCall: rotationsForced > 0 ? executeTime - 3 : undefined
    }

    const impact: LurkImpact = {
      rotationsForced,
      informationGathered: Math.floor(Math.random() * 4),
      backstabKills: hasBackstab ? Math.floor(Math.random() * 2) + 1 : 0,
      distractionTime: timings.positionReached - timings.initialMove,
      sitePressure: rotationsForced * 0.2 + (hasBackstab ? 0.3 : 0)
    }

    const outcome: LurkOutcome = {
      success: hasBackstab || rotationsForced > 1,
      reason: hasBackstab ? 'backstab' : rotationsForced > 0 ? 'rotation_force' : 'info',
      value: calculateLurkValue(impact)
    }

    rounds.push({
      id: `lurk-${i}`,
      playerId: lurker.id,
      path,
      timings,
      impact,
      outcome
    })
  }

  return rounds
}

/**
 * Calculate lurk value
 */
function calculateLurkValue(impact: LurkImpact): number {
  return (
    impact.rotationsForced * 0.3 +
    impact.backstabKills * 0.4 +
    impact.informationGathered * 0.15 +
    Math.min(1, impact.distractionTime / 30) * 0.15
  )
}

/**
 * Calculate optimal lurk paths
 */
function calculateOptimalPaths(
  rounds: LurkRound[],
  mapBounds: MapBounds,
  minDistance: number,
  maxDistance: number,
  considerStealth: boolean
): OptimalLurkPath[] {
  const paths: OptimalLurkPath[] = []

  // Analyze successful lurks to find optimal patterns
  const successfulLurks = rounds.filter(r => r.outcome.success)

  if (successfulLurks.length === 0) {
    // Generate default paths
    return generateDefaultPaths(mapBounds, minDistance, maxDistance)
  }

  // Cluster similar paths
  const pathClusters = clusterPaths(successfulLurks.map(r => r.path))

  for (const cluster of pathClusters.slice(0, 3)) {
    const avgPath = averagePath(cluster)
    const start = avgPath[0]?.position || { x: 0, y: 0 }
    const end = avgPath[avgPath.length - 1]?.position || { x: 0, y: 0 }
    
    const dist = distance(start, end)
    if (dist < minDistance || dist > maxDistance) continue

    const estimatedTime = dist / LURK_SPEED
    const riskPoints = identifyRiskPoints(avgPath, mapBounds)
    const hidePoints = considerStealth 
      ? avgPath.filter(p => p.isHidden).map(p => p.position)
      : []
    const backstabPositions = findBackstabPositions(avgPath, mapBounds)

    // Calculate success rate from similar paths
    const similarPathIds = new Set(cluster.map((_, i) => i))
    const similarRounds = successfulLurks.filter((_, i) => similarPathIds.has(i % cluster.length))
    const successRate = similarRounds.length / rounds.filter(r => 
      similarPathIds.has(rounds.indexOf(r) % cluster.length)
    ).length || 0.5

    paths.push({
      id: `optimal-${paths.length}`,
      start,
      waypoints: avgPath.map(p => p.position),
      end,
      estimatedTime,
      riskPoints,
      hidePoints,
      backstabPositions,
      successRate
    })
  }

  return paths.sort((a, b) => b.successRate - a.successRate)
}

/**
 * Generate default paths when no data available
 */
function generateDefaultPaths(
  mapBounds: MapBounds,
  minDistance: number,
  maxDistance: number
): OptimalLurkPath[] {
  const paths: OptimalLurkPath[] = []

  // Generate 3 default path templates
  const templates = [
    { start: { x: 100, y: 300 }, end: { x: mapBounds.width - 200, y: 400 } },
    { start: { x: 150, y: 500 }, end: { x: mapBounds.width - 300, y: 200 } },
    { start: { x: 200, y: 200 }, end: { x: mapBounds.width - 150, y: 600 } }
  ]

  for (const template of templates) {
    const dist = distance(template.start, template.end)
    if (dist < minDistance || dist > maxDistance) continue

    const waypoints = generateWaypoints(template.start, template.end, 8)

    paths.push({
      id: `default-${paths.length}`,
      start: template.start,
      waypoints,
      end: template.end,
      estimatedTime: dist / LURK_SPEED,
      riskPoints: waypoints.filter((_, i) => i % 3 === 0),
      hidePoints: waypoints.filter((_, i) => i % 2 === 0),
      backstabPositions: [template.end],
      successRate: 0.5
    })
  }

  return paths
}

/**
 * Generate waypoints between start and end
 */
function generateWaypoints(start: Vector2D, end: Vector2D, count: number): Vector2D[] {
  const waypoints: Vector2D[] = [start]

  for (let i = 1; i < count - 1; i++) {
    const t = i / (count - 1)
    waypoints.push({
      x: start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 100,
      y: start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 100
    })
  }

  waypoints.push(end)
  return waypoints
}

/**
 * Cluster similar paths
 */
function clusterPaths(paths: TimedPosition[][]): TimedPosition[][][] {
  // Simplified clustering - groups paths with similar endpoints
  const clusters: TimedPosition[][][] = []
  const threshold = 500

  for (const path of paths) {
    let added = false
    for (const cluster of clusters) {
      const clusterEnd = cluster[0][cluster[0].length - 1].position
      const pathEnd = path[path.length - 1].position
      
      if (distance(clusterEnd, pathEnd) < threshold) {
        cluster.push(path)
        added = true
        break
      }
    }
    
    if (!added) {
      clusters.push([path])
    }
  }

  return clusters.sort((a, b) => b.length - a.length)
}

/**
 * Calculate average path from cluster
 */
function averagePath(cluster: TimedPosition[][]): TimedPosition[] {
  const minLength = Math.min(...cluster.map(p => p.length))
  const avgPath: TimedPosition[] = []

  for (let i = 0; i < minLength; i++) {
    const positions = cluster.map(p => p[i].position)
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length

    avgPath.push({
      position: { x: avgX, y: avgY },
      timestamp: cluster[0][i].timestamp,
      velocity: cluster[0][i].velocity,
      isHidden: cluster.filter(p => p[i].isHidden).length > cluster.length / 2
    })
  }

  return avgPath
}

/**
 * Identify risk points along path
 */
function identifyRiskPoints(path: TimedPosition[], _mapBounds: MapBounds): Vector2D[] {
  const risks: Vector2D[] = []

  for (const point of path) {
    // Points near common angles are risky
    if (!point.isHidden) {
      risks.push(point.position)
    }
  }

  return risks
}

/**
 * Find potential backstab positions
 */
function findBackstabPositions(path: TimedPosition[], _mapBounds: MapBounds): Vector2D[] {
  // Last few positions are potential backstab spots
  return path.slice(-3).map(p => p.position)
}

/**
 * Identify backstab opportunities
 */
function identifyBackstabOpportunities(
  rounds: LurkRound[],
  optimalPaths: OptimalLurkPath[],
  _backstabWindow: number
): BackstabOpportunity[] {
  const opportunities: BackstabOpportunity[] = []

  // Analyze successful backstab rounds
  const backstabRounds = rounds.filter(r => r.impact.backstabKills > 0)

  for (const round of backstabRounds) {
    if (!round.timings.backstab) continue

    const backstabPos = round.path[round.path.length - 1]?.position
    if (!backstabPos) continue

    // Find target area (typically site or common rotate path)
    const targetArea = {
      x: backstabPos.x + 200,
      y: backstabPos.y + (Math.random() - 0.5) * 200
    }

    const optimalTiming = round.timings.backstab
    const expectedValue = round.outcome.value

    // Calculate escape routes
    const escapeRoutes = [
      { x: backstabPos.x - 150, y: backstabPos.y - 100 },
      { x: backstabPos.x - 150, y: backstabPos.y + 100 }
    ]

    opportunities.push({
      position: backstabPos,
      targetArea,
      optimalTiming,
      expectedValue,
      escapeRoutes
    })
  }

  // Add opportunities from optimal paths
  for (const path of optimalPaths) {
    for (const backstabPos of path.backstabPositions) {
      if (!opportunities.some(o => distance(o.position, backstabPos) < 100)) {
        opportunities.push({
          position: backstabPos,
          targetArea: { x: backstabPos.x + 200, y: backstabPos.y },
          optimalTiming: 40 + Math.random() * 10,
          expectedValue: path.successRate * 0.8,
          escapeRoutes: []
        })
      }
    }
  }

  return opportunities
}

/**
 * Calculate lurk metrics
 */
function calculateLurkMetrics(rounds: LurkRound[]): LurkMetrics {
  const successes = rounds.filter(r => r.outcome.success).length
  const survivalCount = rounds.filter(r => !r.path.some(p => !p.isHidden && p.timestamp > 20)).length
  const backstabCount = rounds.filter(r => r.impact.backstabKills > 0).length

  const avgImpact = rounds.length > 0
    ? rounds.reduce((sum, r) => sum + r.outcome.value, 0) / rounds.length
    : 0

  const totalInfoValue = rounds.reduce((sum, r) => sum + r.impact.informationGathered, 0)

  return {
    successRate: rounds.length > 0 ? successes / rounds.length : 0,
    averageImpact: avgImpact,
    backstabRate: rounds.length > 0 ? backstabCount / rounds.length : 0,
    survivalRate: rounds.length > 0 ? survivalCount / rounds.length : 0,
    infoValue: rounds.length > 0 ? totalInfoValue / rounds.length : 0
  }
}

/**
 * Generate timing guide
 */
function generateTimingGuide(
  rounds: LurkRound[],
  _optimalPaths: OptimalLurkPath[]
): LurkTimingGuide {
  // Analyze timing distributions
  const earlyLurks = rounds.filter(r => r.timings.initialMove < LURK_PHASES.early.end)
  const midLurks = rounds.filter(r => 
    r.timings.initialMove >= LURK_PHASES.mid.start && 
    r.timings.initialMove < LURK_PHASES.mid.end
  )
  void rounds.filter(r => r.timings.initialMove >= LURK_PHASES.late.start)

  const optimalBackstab = rounds.length > 0
    ? rounds.reduce((sum, r) => sum + (r.timings.backstab || 40), 0) / rounds.length
    : 40

  return {
    earlyLurk: {
      start: 0,
      end: LURK_PHASES.early.end,
      useCase: earlyLurks.length > midLurks.length 
        ? 'Aggressive info gathering, early rotations'
        : 'High risk, use when enemy plays passive'
    },
    midLurk: {
      start: LURK_PHASES.mid.start,
      end: LURK_PHASES.mid.end,
      useCase: 'Balanced timing, most effective for backstabs'
    },
    lateLurk: {
      start: LURK_PHASES.late.start,
      end: 80,
      useCase: 'Desperation plays, cleanup scenarios'
    },
    optimalBackstab: Math.round(optimalBackstab)
  }
}

/**
 * Calculate confidence score
 */
function calculateConfidence(roundCount: number, pathCount: number): number {
  const baseConfidence = 0.55
  const roundBonus = Math.min(0.3, roundCount * 0.02)
  const pathBonus = Math.min(0.15, pathCount * 0.05)
  return Math.min(1.0, baseConfidence + roundBonus + pathBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render lurk effectiveness to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<LurkEffectivenessData>,
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

  // Render optimal paths
  for (const path of data.optimalPaths) {
    renderOptimalPath(ctx, path)
  }

  // Render lurk rounds
  for (const round of data.rounds) {
    renderLurkRound(ctx, round)
  }

  // Render backstab opportunities
  for (const opportunity of data.opportunities) {
    renderBackstabOpportunity(ctx, opportunity)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render optimal path
 */
function renderOptimalPath(ctx: CanvasRenderingContext2D, path: OptimalLurkPath): void {
  // Determine path color based on success rate
  let color = LURK_COLORS.path.risky
  if (path.successRate > 0.75) {
    color = LURK_COLORS.path.optimal
  } else if (path.successRate > 0.55) {
    color = LURK_COLORS.path.good
  } else if (path.successRate < 0.35) {
    color = LURK_COLORS.path.dangerous
  }

  // Draw path line
  if (path.waypoints.length > 1) {
    ctx.beginPath()
    ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y)
    
    for (let i = 1; i < path.waypoints.length; i++) {
      ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y)
    }
    
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // Draw hide points
  for (const hide of path.hidePoints) {
    ctx.beginPath()
    ctx.arc(hide.x, hide.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = LURK_COLORS.hide
    ctx.fill()
  }

  // Draw risk points
  for (const risk of path.riskPoints) {
    ctx.beginPath()
    ctx.arc(risk.x, risk.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = LURK_COLORS.risk
    ctx.fill()
  }

  // Draw start and end markers
  ctx.beginPath()
  ctx.arc(path.start.x, path.start.y, 10, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.fillStyle = 'black'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('S', path.start.x, path.start.y)

  ctx.beginPath()
  ctx.arc(path.end.x, path.end.y, 12, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()
}

/**
 * Render lurk round
 */
function renderLurkRound(ctx: CanvasRenderingContext2D, round: LurkRound): void {
  // Draw path with impact-based coloring
  if (round.path.length > 1) {
    const color = round.outcome.value > 0.6 
      ? LURK_COLORS.impact.high
      : round.outcome.value > 0.3 
        ? LURK_COLORS.impact.medium 
        : LURK_COLORS.impact.low

    ctx.beginPath()
    ctx.moveTo(round.path[0].position.x, round.path[0].position.y)
    
    for (let i = 1; i < round.path.length; i++) {
      ctx.lineTo(round.path[i].position.x, round.path[i].position.y)
    }
    
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.4
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Draw outcome indicator
  const endPos = round.path[round.path.length - 1]?.position
  if (endPos) {
    ctx.beginPath()
    ctx.arc(endPos.x, endPos.y + 20, 6, 0, Math.PI * 2)
    ctx.fillStyle = round.outcome.success ? LURK_COLORS.impact.high : LURK_COLORS.impact.low
    ctx.fill()
  }
}

/**
 * Render backstab opportunity
 */
function renderBackstabOpportunity(ctx: CanvasRenderingContext2D, opportunity: BackstabOpportunity): void {
  // Draw opportunity zone
  const color = opportunity.expectedValue > 0.6
    ? LURK_COLORS.backstab.high
    : opportunity.expectedValue > 0.4
      ? LURK_COLORS.backstab.medium
      : LURK_COLORS.backstab.low

  ctx.beginPath()
  ctx.arc(opportunity.position.x, opportunity.position.y, 20, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw target area
  ctx.beginPath()
  ctx.arc(opportunity.targetArea.x, opportunity.targetArea.y, 15, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
  ctx.fill()
  
  ctx.beginPath()
  ctx.moveTo(opportunity.position.x, opportunity.position.y)
  ctx.lineTo(opportunity.targetArea.x, opportunity.targetArea.y)
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Draw escape routes
  for (const route of opportunity.escapeRoutes) {
    ctx.beginPath()
    ctx.moveTo(opportunity.position.x, opportunity.position.y)
    ctx.lineTo(route.x, route.y)
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Timing label
  ctx.font = '9px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(`${opportunity.optimalTiming.toFixed(0)}s`, opportunity.position.x, opportunity.position.y + 4)
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: LurkEffectivenessData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Lurk Rounds: ${data.rounds.length}`, 10, y)
  y += 20

  ctx.fillText(`Success Rate: ${(data.metrics.successRate * 100).toFixed(0)}%`, 10, y)
  y += 20

  ctx.fillText(`Backstab Rate: ${(data.metrics.backstabRate * 100).toFixed(0)}%`, 10, y)
  y += 20

  ctx.fillText(`Avg Impact: ${data.metrics.averageImpact.toFixed(2)}`, 10, y)
  y += 25

  // Timing guide
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Timing Guide:', 10, y)
  y += 18

  ctx.font = '10px sans-serif'
  ctx.fillText(`Early: ${data.timingGuide.earlyLurk.start}-${data.timingGuide.earlyLurk.end}s`, 10, y)
  y += 14
  ctx.fillText(`Optimal Backstab: ${data.timingGuide.optimalBackstab}s`, 10, y)
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
 * Calculate optimal lurk timing for a scenario
 */
export function calculateOptimalLurkTiming(
  lurkDistance: number,
  executeTime: number,
  isStealthy: boolean
): { startTime: number; arrivalTime: number } {
  const speed = isStealthy ? LURK_SPEED * CROUCH_MULTIPLIER : LURK_SPEED
  const travelTime = lurkDistance / speed
  
  // Arrive just before or during execute
  const arrivalTime = executeTime + (Math.random() * 4 - 2)
  const startTime = Math.max(0, arrivalTime - travelTime)

  return { startTime, arrivalTime }
}

/**
 * Evaluate lurk path quality
 */
export function evaluateLurkPath(
  path: Vector2D[],
  hidePoints: Vector2D[],
  riskPoints: Vector2D[]
): number {
  const totalDistance = path.reduce((sum, pos, i) => {
    if (i === 0) return 0
    return sum + distance(path[i - 1], pos)
  }, 0)

  // Optimal distance check
  const distanceScore = totalDistance >= MIN_LURK_DISTANCE && totalDistance <= MAX_LURK_DISTANCE ? 1 : 0.5

  // Hide point coverage
  const hideScore = Math.min(1, hidePoints.length / 4)

  // Risk minimization
  const riskScore = Math.max(0, 1 - (riskPoints.length / path.length))

  return (distanceScore * 0.4 + hideScore * 0.3 + riskScore * 0.3)
}

/**
 * Get lurk phase for a timestamp
 */
export function getLurkPhase(timestamp: number): string {
  for (const [_key, phase] of Object.entries(LURK_PHASES)) {
    if (timestamp >= phase.start && timestamp < phase.end) {
      return phase.label
    }
  }
  return 'Unknown'
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  calculateOptimalLurkTiming,
  evaluateLurkPath,
  getLurkPhase,
  LURK_SPEED,
  MIN_LURK_DISTANCE,
  MAX_LURK_DISTANCE,
  BACKSTAB_WINDOW,
  LURK_COLORS
}
