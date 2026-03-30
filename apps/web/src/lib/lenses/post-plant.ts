/** [Ver001.000]
 * Post-Plant Positioning Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes post-plant positioning and defuse stop scenarios.
 * Reveals optimal positions, win rates, and defuse predictions.
 * 
 * Features:
 * - Post-plant position analysis
 * - Win rate by position and role
 * - Defuse stop prediction
 * - Escape route visualization
 * - Timing recommendations
 */

import type {
  PostPlantData,
  PostPlantScenario,
  PostPlantEvent,
  OptimalPostPlantPosition,
  DefuseStopPrediction,
  Player,
  MapBounds,
  Site,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Bomb timer duration in seconds */
export const BOMB_TIMER = 45

/** Defuse time in seconds */
export const DEFUSE_TIME = 7

/** Half-defuse time in seconds */
export const HALF_DEFUSE_TIME = 3.5

/** Plant time in seconds */
export const PLANT_TIME = 4

/** Post-plant phases in seconds */
export const POSTPLANT_PHASES = {
  early: { start: 0, end: 10, label: 'Early' },
  mid: { start: 10, end: 25, label: 'Mid' },
  late: { start: 25, end: 45, label: 'Late' },
  critical: { start: 38, end: 45, label: 'Critical' }
}

/** Position evaluation radius */
export const POSITION_EVAL_RADIUS = 300

/** Colors for post-plant visualization */
export const POSTPLANT_COLORS = {
  win: {
    high: 'rgba(0, 255, 100, 0.7)',
    medium: 'rgba(200, 255, 100, 0.6)',
    low: 'rgba(255, 200, 100, 0.5)',
    poor: 'rgba(255, 100, 100, 0.5)'
  },
  bomb: {
    safe: 'rgba(0, 200, 0, 0.8)',
    planted: 'rgba(255, 150, 0, 0.9)',
    defusing: 'rgba(255, 255, 0, 0.9)',
    exploding: 'rgba(255, 50, 50, 0.9)'
  },
  position: {
    anchor: 'rgba(0, 200, 255, 0.6)',
    offSite: 'rgba(200, 150, 255, 0.6)',
    lurker: 'rgba(255, 200, 100, 0.6)',
    rotator: 'rgba(100, 255, 150, 0.6)'
  },
  escape: 'rgba(255, 255, 255, 0.4)',
  los: 'rgba(255, 255, 255, 0.2)'
}

// ============================================================================
// Types
// ============================================================================

/** Post-plant calculation options */
export interface PostPlantOptions {
  bombTimer?: number
  defuseTime?: number
  considerEscape?: boolean
  siteFocus?: string
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Raw post-plant event from match data */
export interface RawPostPlantEvent {
  roundId: string
  site: Site
  bombPosition: Vector2D
  plantTime: number
  winner: 'attackers' | 'defenders'
  method: 'explosion' | 'defuse' | 'elimination'
  timeElapsed: number
  attackerPositions: Vector2D[]
  defenderPositions: Vector2D[]
  defuseAttempts?: {
    startTime: number
    stopTime?: number
    playerId: string
    stoppedBy?: string
  }[]
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate post-plant positioning analysis
 * @param players - Array of player positions
 * @param mapBounds - Map boundary information
 * @param rawEvents - Raw post-plant events
 * @param options - Calculation options
 * @returns Post-plant analysis data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  rawEvents: RawPostPlantEvent[] = [],
  options: PostPlantOptions = {}
): LensResult<PostPlantData> {
  const {
    bombTimer = BOMB_TIMER,
    defuseTime = DEFUSE_TIME,
    considerEscape = true,
    siteFocus
  } = options

  const sites = siteFocus
    ? mapBounds.sites.filter(s => s.name.toLowerCase() === siteFocus.toLowerCase())
    : mapBounds.sites

  // Generate scenarios from events or synthetic
  const scenarios = rawEvents.length > 0
    ? processRawEvents(rawEvents)
    : generateSyntheticScenarios(players, sites)

  // Calculate optimal positions
  const optimalPositions = calculateOptimalPositions(scenarios, sites, considerEscape)

  // Calculate win rates
  const winRates = calculateWinRates(scenarios, optimalPositions)

  // Generate defuse stop predictions
  const predictions = generateDefusePredictions(scenarios, bombTimer, defuseTime)

  const data: PostPlantData = {
    scenarios,
    optimalPositions,
    winRates,
    predictions
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(scenarios.length, optimalPositions.length),
      sampleSize: scenarios.length
    }
  }
}

/**
 * Process raw post-plant events
 */
function processRawEvents(events: RawPostPlantEvent[]): PostPlantScenario[] {
  return events.map((event, index) => {
    const keyEvents: PostPlantEvent[] = []

    // Add defuse attempts as events
    if (event.defuseAttempts) {
      for (const attempt of event.defuseAttempts) {
        keyEvents.push({
          time: attempt.startTime,
          type: 'defuse_start',
          position: event.bombPosition,
          playerId: attempt.playerId,
          details: {}
        })

        if (attempt.stopTime) {
          keyEvents.push({
            time: attempt.stopTime,
            type: 'defuse_stop',
            position: event.bombPosition,
            playerId: attempt.playerId,
            details: { stoppedBy: attempt.stoppedBy }
          })
        }
      }
    }

    return {
      id: `pp-${index}`,
      roundId: event.roundId,
      site: event.site,
      plantTime: event.plantTime,
      bombPosition: event.bombPosition,
      attackerPositions: [], // Would be populated from actual data
      defenderPositions: [],
      outcome: {
        winner: event.winner,
        method: event.method,
        timeElapsed: event.timeElapsed
      },
      keyEvents: keyEvents.sort((a, b) => a.time - b.time)
    }
  })
}

/**
 * Generate synthetic post-plant scenarios
 */
function generateSyntheticScenarios(
  players: Player[],
  sites: Site[]
): PostPlantScenario[] {
  const scenarios: PostPlantScenario[] = []
  const attackers = players.filter(p => p.team === 'attackers' && p.isAlive)
  const defenders = players.filter(p => p.team === 'defenders' && p.isAlive)

  for (const site of sites) {
    for (let i = 0; i < 10; i++) {
      const bombPosition = {
        x: site.position.x + (Math.random() - 0.5) * site.radius * 0.5,
        y: site.position.y + (Math.random() - 0.5) * site.radius * 0.5
      }

      const timeElapsed = Math.random() * BOMB_TIMER
      const winner = Math.random() > 0.45 ? 'attackers' : 'defenders'

      const keyEvents: PostPlantEvent[] = []
      
      // Add some synthetic events
      if (Math.random() > 0.5) {
        keyEvents.push({
          time: timeElapsed * 0.3,
          type: 'utility_use',
          position: bombPosition,
          playerId: 'attacker-1',
          details: { utility: 'smoke' }
        })
      }

      if (winner === 'defenders' && Math.random() > 0.3) {
        keyEvents.push({
          time: timeElapsed - 5,
          type: 'defuse_start',
          position: bombPosition,
          playerId: 'defender-1',
          details: {}
        })
      }

      scenarios.push({
        id: `pp-${site.name}-${i}`,
        roundId: `round-${i}`,
        site,
        plantTime: 45,
        bombPosition,
        attackerPositions: attackers,
        defenderPositions: defenders,
        outcome: {
          winner,
          method: winner === 'attackers' ? 'explosion' : 'defuse',
          timeElapsed
        },
        keyEvents
      })
    }
  }

  return scenarios
}

/**
 * Calculate optimal post-plant positions
 */
function calculateOptimalPositions(
  scenarios: PostPlantScenario[],
  sites: Site[],
  considerEscape: boolean
): OptimalPostPlantPosition[] {
  const positions: OptimalPostPlantPosition[] = []

  for (const site of sites) {
    // Generate candidate positions around the site
    const candidates = generateCandidatePositions(site)

    for (const position of candidates) {
      const role = determinePositionRole(position, site)
      const lineOfSight = hasLineOfSight(position, site)
      const escapeRoutes = considerEscape ? calculateEscapeRoutes(position, site) : []
      const coverQuality = calculateCoverQuality(position)

      // Calculate effectiveness based on win rates
      const effectiveness = calculatePositionEffectiveness(position, scenarios, site)

      if (effectiveness > 0.3) {
        positions.push({
          position,
          site: site.name,
          role,
          effectiveness,
          lineOfSightToBomb: lineOfSight,
          escapeRoutes,
          coverQuality
        })
      }
    }
  }

  return positions.sort((a, b) => b.effectiveness - a.effectiveness)
}

/**
 * Generate candidate positions for post-plant
 */
function generateCandidatePositions(site: Site): Vector2D[] {
  const positions: Vector2D[] = []
  const numPositions = 8
  const radiusRange = { min: site.radius * 0.8, max: site.radius * 2.5 }

  for (let i = 0; i < numPositions; i++) {
    const angle = (i / numPositions) * Math.PI * 2
    const radius = radiusRange.min + Math.random() * (radiusRange.max - radiusRange.min)

    positions.push({
      x: site.position.x + Math.cos(angle) * radius,
      y: site.position.y + Math.sin(angle) * radius
    })
  }

  return positions
}

/**
 * Determine position role based on distance and angle to site
 */
function determinePositionRole(
  position: Vector2D,
  site: Site
): OptimalPostPlantPosition['role'] {
  const dist = distance(position, site.position)

  if (dist < site.radius * 1.2) {
    return 'site_anchor'
  } else if (dist > site.radius * 2) {
    return 'lurker'
  } else if (Math.abs(getAngleToSite(position, site)) < Math.PI / 4) {
    return 'off_site'
  } else {
    return 'rotator'
  }
}

/**
 * Check if position has line of sight to bomb
 */
function hasLineOfSight(position: Vector2D, site: Site): boolean {
  const dist = distance(position, site.position)
  return dist < site.radius * 3
}

/**
 * Calculate escape routes from position
 */
function calculateEscapeRoutes(position: Vector2D, site: Site): Vector2D[] {
  const routes: Vector2D[] = []
  const numRoutes = 3
  const escapeDistance = 400

  for (let i = 0; i < numRoutes; i++) {
    // Calculate angle away from site
    const angleToSite = Math.atan2(
      site.position.y - position.y,
      site.position.x - position.x
    )
    const escapeAngle = angleToSite + (i - 1) * (Math.PI / 6)

    routes.push({
      x: position.x + Math.cos(escapeAngle) * escapeDistance,
      y: position.y + Math.sin(escapeAngle) * escapeDistance
    })
  }

  return routes
}

/**
 * Calculate cover quality at position
 */
function calculateCoverQuality(_position: Vector2D): number {
  // Simplified: positions farther from center have better cover
  // In reality, this would check against map geometry
  return 0.5 + Math.random() * 0.5
}

/**
 * Calculate position effectiveness based on win rates
 */
function calculatePositionEffectiveness(
  position: Vector2D,
  scenarios: PostPlantScenario[],
  site: Site
): number {
  const relevantScenarios = scenarios.filter(s => s.site.name === site.name)
  
  if (relevantScenarios.length === 0) return 0.5

  const wins = relevantScenarios.filter(s => s.outcome.winner === 'attackers').length
  const baseEffectiveness = wins / relevantScenarios.length

  // Distance modifier - closer positions slightly better
  const dist = distance(position, site.position)
  const distanceModifier = Math.max(0, 1 - dist / (site.radius * 4)) * 0.2

  return Math.min(1.0, baseEffectiveness + distanceModifier)
}

/**
 * Calculate win rates
 */
function calculateWinRates(
  scenarios: PostPlantScenario[],
  optimalPositions: OptimalPostPlantPosition[]
): PostPlantData['winRates'] {
  const byPosition: Record<string, number> = {}
  const byRole: Record<string, { wins: number; total: number }> = {}
  const byTimeElapsed: Record<number, { wins: number; total: number }> = {}

  // Calculate by position
  for (const pos of optimalPositions) {
    const relevant = scenarios.filter(s => 
      s.site.name === pos.site && 
      distance(pos.position, s.bombPosition) < POSITION_EVAL_RADIUS
    )

    if (relevant.length > 0) {
      const wins = relevant.filter(s => s.outcome.winner === 'attackers').length
      byPosition[`${pos.site}-${pos.role}`] = wins / relevant.length
    }
  }

  // Calculate by role
  for (const scenario of scenarios) {
    // Time bucket (5 second intervals)
    const timeBucket = Math.floor(scenario.outcome.timeElapsed / 5) * 5
    
    if (!byTimeElapsed[timeBucket]) {
      byTimeElapsed[timeBucket] = { wins: 0, total: 0 }
    }
    byTimeElapsed[timeBucket].total++
    if (scenario.outcome.winner === 'attackers') {
      byTimeElapsed[timeBucket].wins++
    }
  }

  // Aggregate roles from optimal positions
  for (const pos of optimalPositions) {
    if (!byRole[pos.role]) {
      byRole[pos.role] = { wins: 0, total: 0 }
    }
    byRole[pos.role].total++
    if (pos.effectiveness > 0.5) {
      byRole[pos.role].wins++
    }
  }

  // Convert to win rates
  const byRoleRate: Record<string, number> = {}
  for (const [role, data] of Object.entries(byRole)) {
    byRoleRate[role] = data.total > 0 ? data.wins / data.total : 0
  }

  const byTimeRate: Record<number, number> = {}
  for (const [time, data] of Object.entries(byTimeElapsed)) {
    byTimeRate[parseInt(time)] = data.total > 0 ? data.wins / data.total : 0
  }

  return {
    byPosition,
    byRole: byRoleRate,
    byTimeElapsed: byTimeRate
  }
}

/**
 * Generate defuse stop predictions
 */
function generateDefusePredictions(
  scenarios: PostPlantScenario[],
  bombTimer: number,
  _defuseTime: number
): DefuseStopPrediction[] {
  const predictions: DefuseStopPrediction[] = []

  for (const scenario of scenarios) {
    // Only predict for scenarios where defuse is possible
    if (scenario.outcome.winner === 'attackers' && scenario.outcome.method === 'explosion') {
      const timeRemaining = bombTimer - scenario.outcome.timeElapsed
      
      // Calculate optimal defuse stop timing
      // Stop when defuse would complete but before actual explosion
      const optimalTiming = Math.max(0, timeRemaining - 2)
      
      // Calculate probability based on position coverage
      const probability = calculateDefuseStopProbability(scenario)

      // Find best position for stopping defuse
      const recommendedPosition = findOptimalStopPosition(scenario)

      // Determine utility to use
      const utilityToUse = determineStopUtility(scenario)

      predictions.push({
        probability,
        optimalTiming,
        recommendedPosition,
        utilityToUse
      })
    }
  }

  return predictions
}

/**
 * Calculate defuse stop probability
 */
function calculateDefuseStopProbability(scenario: PostPlantScenario): number {
  // Base probability
  let probability = 0.4

  // Adjust based on time remaining
  const defuseStarts = scenario.keyEvents.filter(e => e.type === 'defuse_start')
  if (defuseStarts.length > 0) {
    probability += 0.2 * defuseStarts.length
  }

  // Adjust based on attacker positioning
  if (scenario.attackerPositions.length >= 2) {
    probability += 0.2
  }

  return Math.min(1.0, probability)
}

/**
 * Find optimal position for stopping defuse
 */
function findOptimalStopPosition(scenario: PostPlantScenario): Vector2D {
  // Position near bomb but with cover
  const offset = {
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200
  }

  return {
    x: scenario.bombPosition.x + offset.x,
    y: scenario.bombPosition.y + offset.y
  }
}

/**
 * Determine utility for stopping defuse
 */
function determineStopUtility(_scenario: PostPlantScenario): string[] {
  const utility: string[] = []

  // Check if line of sight is blocked
  utility.push('molly_bomb')

  // Add flash for re-peek
  utility.push('flash_defuse')

  return utility
}

/**
 * Calculate confidence score
 */
function calculateConfidence(scenarioCount: number, positionCount: number): number {
  const baseConfidence = 0.5
  const scenarioBonus = Math.min(0.3, scenarioCount * 0.02)
  const positionBonus = Math.min(0.2, positionCount * 0.02)
  return Math.min(1.0, baseConfidence + scenarioBonus + positionBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render post-plant analysis to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<PostPlantData>,
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

  // Render scenarios
  for (const scenario of data.scenarios) {
    renderScenario(ctx, scenario)
  }

  // Render optimal positions
  for (const position of data.optimalPositions) {
    renderOptimalPosition(ctx, position)
  }

  // Render predictions
  for (const prediction of data.predictions) {
    renderPrediction(ctx, prediction)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render a post-plant scenario
 */
function renderScenario(ctx: CanvasRenderingContext2D, scenario: PostPlantScenario): void {
  // Draw bomb position
  const isWin = scenario.outcome.winner === 'attackers'
  
  ctx.beginPath()
  ctx.arc(scenario.bombPosition.x, scenario.bombPosition.y, 15, 0, Math.PI * 2)
  ctx.fillStyle = isWin ? POSTPLANT_COLORS.bomb.planted : POSTPLANT_COLORS.bomb.defusing
  ctx.fill()
  
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw site area
  ctx.beginPath()
  ctx.arc(scenario.site.position.x, scenario.site.position.y, scenario.site.radius, 0, Math.PI * 2)
  ctx.fillStyle = POSTPLANT_COLORS.win.medium
  ctx.fill()

  // Draw time indicator
  ctx.font = '10px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(`${scenario.outcome.timeElapsed.toFixed(0)}s`, scenario.bombPosition.x, scenario.bombPosition.y + 25)
}

/**
 * Render an optimal position
 */
function renderOptimalPosition(
  ctx: CanvasRenderingContext2D,
  position: OptimalPostPlantPosition
): void {
  const color = POSTPLANT_COLORS.position[position.role]
  
  // Draw position
  ctx.beginPath()
  ctx.arc(position.position.x, position.position.y, 12, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  
  // Draw position
  ctx.beginPath()
  ctx.arc(position.position.x, position.position.y, 12, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Draw effectiveness ring
  const ringRadius = 16 + position.effectiveness * 10
  ctx.beginPath()
  ctx.arc(position.position.x, position.position.y, ringRadius, 0, Math.PI * 2)
  ctx.strokeStyle = getWinRateColor(position.effectiveness)
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw line of sight to bomb
  if (position.lineOfSightToBomb) {
    ctx.beginPath()
    ctx.moveTo(position.position.x, position.position.y)
    // Draw line towards site center (bomb position approximation)
    const dx = Math.cos(getAngleToSite(position.position, { position: { x: 0, y: 0 }, radius: 0, name: '', type: 'a' })) * 50
    const dy = Math.sin(getAngleToSite(position.position, { position: { x: 0, y: 0 }, radius: 0, name: '', type: 'a' })) * 50
    ctx.lineTo(position.position.x + dx, position.position.y + dy)
    ctx.strokeStyle = POSTPLANT_COLORS.los
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Draw escape routes
  for (const route of position.escapeRoutes) {
    ctx.beginPath()
    ctx.moveTo(position.position.x, position.position.y)
    ctx.lineTo(route.x, route.y)
    ctx.strokeStyle = POSTPLANT_COLORS.escape
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Role label
  ctx.font = '9px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(position.role.replace('_', '\n'), position.position.x, position.position.y - 20)
}

/**
 * Render a defuse prediction
 */
function renderPrediction(ctx: CanvasRenderingContext2D, prediction: DefuseStopPrediction): void {
  // Draw prediction zone
  ctx.beginPath()
  ctx.arc(prediction.recommendedPosition.x, prediction.recommendedPosition.y, 20, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 200, 50, ${prediction.probability * 0.5})`
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Probability text
  ctx.font = '10px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(`${(prediction.probability * 100).toFixed(0)}%`, prediction.recommendedPosition.x, prediction.recommendedPosition.y)
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: PostPlantData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Scenarios: ${data.scenarios.length}`, 10, y)
  y += 20

  // Calculate overall win rate
  const wins = data.scenarios.filter(s => s.outcome.winner === 'attackers').length
  const winRate = data.scenarios.length > 0 ? wins / data.scenarios.length : 0
  ctx.fillText(`Attacker Win Rate: ${(winRate * 100).toFixed(0)}%`, 10, y)
  y += 20

  ctx.fillText(`Optimal Positions: ${data.optimalPositions.length}`, 10, y)
  y += 20

  // Show best role
  let bestRole = 'None'
  let bestRate = 0
  for (const [role, rate] of Object.entries(data.winRates.byRole)) {
    if (rate > bestRate) {
      bestRate = rate
      bestRole = role
    }
  }
  ctx.fillText(`Best Role: ${bestRole} (${(bestRate * 100).toFixed(0)}%)`, 10, y)
}

/**
 * Get color based on win rate
 */
function getWinRateColor(rate: number): string {
  if (rate > 0.7) return POSTPLANT_COLORS.win.high
  if (rate > 0.5) return POSTPLANT_COLORS.win.medium
  if (rate > 0.3) return POSTPLANT_COLORS.win.low
  return POSTPLANT_COLORS.win.poor
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
 * Get angle from position to site
 */
function getAngleToSite(position: Vector2D, site: { position: Vector2D }): number {
  return Math.atan2(
    site.position.y - position.y,
    site.position.x - position.x
  )
}

/**
 * Calculate time remaining on bomb
 */
export function calculateTimeRemaining(elapsedTime: number): number {
  return Math.max(0, BOMB_TIMER - elapsedTime)
}

/**
 * Check if defuse is possible
 */
export function isDefusePossible(timeRemaining: number): boolean {
  return timeRemaining >= DEFUSE_TIME
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  calculateTimeRemaining,
  isDefusePossible,
  BOMB_TIMER,
  DEFUSE_TIME,
  POSTPLANT_PHASES,
  POSTPLANT_COLORS
}
