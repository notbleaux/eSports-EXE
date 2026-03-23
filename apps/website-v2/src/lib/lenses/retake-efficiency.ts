/** [Ver001.000]
 * Retake Efficiency Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes site retake scenarios for optimal paths and success rates.
 * Reveals timing windows, utility requirements, and strategic recommendations.
 * 
 * Features:
 * - Retake scenario analysis
 * - Optimal path calculation
 * - Success rate by site and player count
 * - Utility requirement mapping
 * - Timing recommendations
 */

import type {
  RetakeEfficiencyData,
  RetakeScenario,
  RetakePath,
  RetakeMetrics,
  SiteRetakeMetrics,
  RetakeRecommendation,
  Player,
  MapBounds,
  Site,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Average player movement speed (units/second) */
export const MOVEMENT_SPEED = 240

/** Sprint speed multiplier */
export const SPRINT_MULTIPLIER = 1.5

/** Retake time thresholds in seconds */
export const RETAKE_TIMINGS = {
  immediate: 5,    // First 5 seconds after plant
  early: 15,       // 5-15 seconds
  mid: 30,         // 15-30 seconds
  late: 45         // 30+ seconds
}

/** Utility types for retakes */
export const UTILITY_TYPES = {
  flash: { duration: 2, effectiveness: 0.7 },
  smoke: { duration: 15, effectiveness: 0.5 },
  molly: { duration: 7, effectiveness: 0.8 },
  recon: { duration: 3, effectiveness: 0.6 }
}

/** Colors for retake visualization */
export const RETAKE_COLORS = {
  success: 'rgba(0, 200, 100, 0.6)',
  successBorder: 'rgba(0, 200, 100, 1)',
  failure: 'rgba(255, 80, 80, 0.6)',
  failureBorder: 'rgba(255, 80, 80, 1)',
  path: {
    optimal: 'rgba(0, 255, 150, 0.8)',
    good: 'rgba(200, 255, 100, 0.7)',
    risky: 'rgba(255, 200, 100, 0.7)',
    dangerous: 'rgba(255, 100, 100, 0.7)'
  },
  utility: {
    flash: 'rgba(255, 255, 200, 0.5)',
    smoke: 'rgba(150, 150, 150, 0.5)',
    molly: 'rgba(255, 150, 50, 0.5)',
    recon: 'rgba(100, 200, 255, 0.5)'
  },
  site: 'rgba(255, 200, 100, 0.4)',
  siteBorder: 'rgba(255, 200, 100, 0.9)'
}

// ============================================================================
// Types
// ============================================================================

/** Retake calculation options */
export interface RetakeOptions {
  movementSpeed?: number
  considerUtility?: boolean
  maxPaths?: number
  riskTolerance?: 'low' | 'medium' | 'high'
}

/** Path node for A* algorithm */
interface PathNode {
  position: Vector2D
  g: number // cost from start
  h: number // heuristic to goal
  f: number // total cost
  parent?: PathNode
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate retake efficiency analysis
 * @param players - Array of defender positions
 * @param mapBounds - Map boundary information
 * @param site - Target site to retake
 * @param options - Calculation options
 * @returns Retake efficiency data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  site?: Site,
  options: RetakeOptions = {}
): LensResult<RetakeEfficiencyData> {
  const {
    movementSpeed = MOVEMENT_SPEED,
    considerUtility = true,
    maxPaths = 5,
    riskTolerance = 'medium'
  } = options

  const targetSite = site || mapBounds.sites[0]
  if (!targetSite) {
    throw new Error('No target site specified')
  }

  const defenders = players.filter(p => p.team === 'defenders' && p.isAlive)
  
  // Calculate optimal retake paths
  const optimalPaths = calculateOptimalPaths(
    defenders,
    targetSite,
    mapBounds,
    maxPaths,
    riskTolerance,
    movementSpeed
  )

  // Generate scenarios based on player positions
  const scenarios = generateRetakeScenarios(defenders, targetSite, optimalPaths)

  // Calculate metrics
  const metrics = calculateRetakeMetrics(scenarios, targetSite, optimalPaths)

  // Generate recommendations
  const recommendations = generateRetakeRecommendations(
    scenarios,
    optimalPaths,
    metrics,
    targetSite
  )

  const data: RetakeEfficiencyData = {
    scenarios,
    metrics,
    optimalPaths,
    recommendations
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(optimalPaths.length, scenarios.length),
      sampleSize: defenders.length
    }
  }
}

/**
 * Calculate optimal retake paths using A* algorithm
 */
function calculateOptimalPaths(
  defenders: Player[],
  site: Site,
  mapBounds: MapBounds,
  maxPaths: number,
  riskTolerance: string,
  movementSpeed: number
): RetakePath[] {
  const paths: RetakePath[] = []
  
  // Generate paths from each defender position
  for (const defender of defenders.slice(0, maxPaths)) {
    const path = findOptimalPath(defender.position, site.position, mapBounds, riskTolerance)
    
    if (path.length > 0) {
      const distance = calculatePathDistance(path)
      const estimatedTime = distance / movementSpeed
      const risk = calculatePathRisk(path, mapBounds)
      
      // Determine utility requirements based on risk
      const utilityRequired = determineUtilityRequirements(risk, path)
      
      // Calculate success rate based on multiple factors
      const successRate = calculateSuccessRate(risk, estimatedTime, utilityRequired)

      paths.push({
        id: `path-${defender.id}`,
        waypoints: path,
        distance,
        estimatedTime,
        risk,
        utilityRequired,
        successRate
      })
    }
  }

  // Sort by success rate
  return paths.sort((a, b) => b.successRate - a.successRate)
}

/**
 * Find optimal path using A* algorithm
 */
function findOptimalPath(
  start: Vector2D,
  goal: Vector2D,
  mapBounds: MapBounds,
  riskTolerance: string
): Vector2D[] {
  const openSet: PathNode[] = []
  const closedSet = new Set<string>()
  
  const startNode: PathNode = {
    position: start,
    g: 0,
    h: heuristic(start, goal),
    f: 0
  }
  startNode.f = startNode.g + startNode.h
  openSet.push(startNode)

  while (openSet.length > 0) {
    // Get node with lowest f score
    let current = openSet[0]
    let currentIndex = 0
    
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < current.f) {
        current = openSet[i]
        currentIndex = i
      }
    }

    openSet.splice(currentIndex, 1)
    const key = `${current.position.x.toFixed(0)},${current.position.y.toFixed(0)}`
    closedSet.add(key)

    // Check if reached goal
    if (distance(current.position, goal) < 50) {
      return reconstructPath(current)
    }

    // Generate neighbors
    const neighbors = generateNeighbors(current.position, mapBounds)
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x.toFixed(0)},${neighbor.y.toFixed(0)}`
      if (closedSet.has(neighborKey)) continue

      const tentativeG = current.g + distance(current.position, neighbor)
      
      // Apply risk modifier
      const riskModifier = getRiskModifier(neighbor, mapBounds, riskTolerance)
      const adjustedG = tentativeG * riskModifier

      const existingNode = openSet.find(n => 
        Math.abs(n.position.x - neighbor.x) < 1 && 
        Math.abs(n.position.y - neighbor.y) < 1
      )

      if (!existingNode || adjustedG < existingNode.g) {
        const newNode: PathNode = {
          position: neighbor,
          g: adjustedG,
          h: heuristic(neighbor, goal),
          f: adjustedG + heuristic(neighbor, goal),
          parent: current
        }

        if (!existingNode) {
          openSet.push(newNode)
        } else {
          existingNode.g = adjustedG
          existingNode.f = adjustedG + existingNode.h
          existingNode.parent = current
        }
      }
    }
  }

  return []
}

/**
 * Generate neighbor positions for pathfinding
 */
function generateNeighbors(position: Vector2D, mapBounds: MapBounds): Vector2D[] {
  const neighbors: Vector2D[] = []
  const step = 100 // Grid step size

  const directions = [
    { x: 0, y: -step }, { x: step, y: -step },
    { x: step, y: 0 }, { x: step, y: step },
    { x: 0, y: step }, { x: -step, y: step },
    { x: -step, y: 0 }, { x: -step, y: -step }
  ]

  for (const dir of directions) {
    const neighbor = {
      x: position.x + dir.x,
      y: position.y + dir.y
    }

    // Check bounds
    if (neighbor.x >= 0 && neighbor.x <= mapBounds.width &&
        neighbor.y >= 0 && neighbor.y <= mapBounds.height) {
      neighbors.push(neighbor)
    }
  }

  return neighbors
}

/**
 * Get risk modifier for a position
 */
function getRiskModifier(position: Vector2D, mapBounds: MapBounds, tolerance: string): number {
  // Base modifier
  let modifier = 1.0

  // Check if position is in open area (higher risk)
  const isOpenArea = checkIfOpenArea(position, mapBounds)
  if (isOpenArea) {
    modifier *= tolerance === 'low' ? 2.0 : 1.3
  }

  // Check proximity to common angles
  const nearCommonAngle = checkNearCommonAngle(position, mapBounds)
  if (nearCommonAngle) {
    modifier *= tolerance === 'low' ? 1.5 : 1.2
  }

  return modifier
}

/**
 * Check if position is in open area
 */
function checkIfOpenArea(position: Vector2D, mapBounds: MapBounds): boolean {
  // Simplified check - positions far from walls are open
  const margin = 200
  return (
    position.x > margin &&
    position.x < mapBounds.width - margin &&
    position.y > margin &&
    position.y < mapBounds.height - margin
  )
}

/**
 * Check if position is near common angles
 */
function checkNearCommonAngle(position: Vector2D, mapBounds: MapBounds): boolean {
  // Check distance to sites
  for (const site of mapBounds.sites) {
    if (distance(position, site.position) < site.radius * 2) {
      return true
    }
  }
  return false
}

/**
 * Calculate heuristic (Euclidean distance)
 */
function heuristic(a: Vector2D, b: Vector2D): number {
  return distance(a, b)
}

/**
 * Reconstruct path from A* node
 */
function reconstructPath(node: PathNode): Vector2D[] {
  const path: Vector2D[] = []
  let current: PathNode | undefined = node

  while (current) {
    path.unshift(current.position)
    current = current.parent
  }

  return path
}

/**
 * Calculate path distance
 */
function calculatePathDistance(path: Vector2D[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1], path[i])
  }
  return total
}

/**
 * Calculate path risk score
 */
function calculatePathRisk(path: Vector2D[], mapBounds: MapBounds): number {
  let risk = 0
  
  for (const point of path) {
    // Higher risk near sites
    for (const site of mapBounds.sites) {
      const dist = distance(point, site.position)
      if (dist < site.radius * 2) {
        risk += 0.3 * (1 - dist / (site.radius * 2))
      }
    }

    // Higher risk in open areas
    if (checkIfOpenArea(point, mapBounds)) {
      risk += 0.2
    }
  }

  return Math.min(1.0, risk / path.length)
}

/**
 * Determine utility requirements based on risk
 */
function determineUtilityRequirements(risk: number, path: Vector2D[]): string[] {
  const utility: string[] = []

  if (risk > 0.3) {
    utility.push('smoke')
  }
  if (risk > 0.5) {
    utility.push('flash')
  }
  if (risk > 0.7) {
    utility.push('molly')
  }
  
  // Always include recon if path is long
  if (path.length > 10) {
    utility.push('recon')
  }

  return utility
}

/**
 * Calculate success rate for a path
 */
function calculateSuccessRate(risk: number, time: number, utility: string[]): number {
  // Base success rate
  let rate = 0.7

  // Risk penalty
  rate -= risk * 0.3

  // Time penalty (longer = worse)
  if (time > RETAKE_TIMINGS.mid) {
    rate -= 0.1
  }
  if (time > RETAKE_TIMINGS.late) {
    rate -= 0.15
  }

  // Utility bonus
  rate += utility.length * 0.05

  return Math.max(0.1, Math.min(0.95, rate))
}

/**
 * Generate retake scenarios
 */
function generateRetakeScenarios(
  defenders: Player[],
  site: Site,
  paths: RetakePath[]
): RetakeScenario[] {
  const scenarios: RetakeScenario[] = []

  // Create scenarios based on defender positions
  for (let i = 0; i < Math.min(defenders.length, 3); i++) {
    const path = paths[i] || paths[0]
    if (!path) continue

    const scenario: RetakeScenario = {
      roundId: `scenario-${i}`,
      site,
      attackerPositions: [], // Would be populated from actual data
      defenderPositions: defenders,
      plantTime: 45, // Example timing
      retakeStartTime: 50,
      retakeEndTime: 50 + path.estimatedTime,
      outcome: path.successRate > 0.6 ? 'success' : 'failure',
      paths: [path]
    }

    scenarios.push(scenario)
  }

  return scenarios
}

/**
 * Calculate retake metrics
 */
function calculateRetakeMetrics(
  scenarios: RetakeScenario[],
  site: Site,
  paths: RetakePath[]
): RetakeMetrics {
  const successes = scenarios.filter(s => s.outcome === 'success').length
  const totalTime = scenarios.reduce((sum, s) => sum + (s.retakeEndTime - s.retakeStartTime), 0)

  const siteMetrics: Record<string, SiteRetakeMetrics> = {
    [site.name]: {
      attempts: scenarios.length,
      successes,
      averageTime: scenarios.length > 0 ? totalTime / scenarios.length : 0,
      optimalEntry: paths[0]?.waypoints[0] || { x: 0, y: 0 },
      bestUtility: paths[0]?.utilityRequired || []
    }
  }

  const byPlayerCount: Record<number, number> = {}
  for (const scenario of scenarios) {
    const count = scenario.defenderPositions.length
    byPlayerCount[count] = (byPlayerCount[count] || 0) + (scenario.outcome === 'success' ? 1 : 0)
  }

  return {
    overallSuccessRate: scenarios.length > 0 ? successes / scenarios.length : 0,
    averageTime: scenarios.length > 0 ? totalTime / scenarios.length : 0,
    bySite: siteMetrics,
    byPlayerCount
  }
}

/**
 * Generate retake recommendations
 */
function generateRetakeRecommendations(
  scenarios: RetakeScenario[],
  paths: RetakePath[],
  metrics: RetakeMetrics,
  site: Site
): RetakeRecommendation[] {
  const recommendations: RetakeRecommendation[] = []

  if (paths.length === 0) return recommendations

  const bestPath = paths[0]
  
  // Timing recommendation
  let timing: 'immediate' | 'delayed' | 'coordinated' = 'immediate'
  if (bestPath.risk > 0.5) {
    timing = 'coordinated'
  } else if (bestPath.estimatedTime > 10) {
    timing = 'delayed'
  }

  // Utility sequence
  const utilitySequence: string[] = []
  for (const utility of bestPath.utilityRequired) {
    if (utility === 'smoke') utilitySequence.push('smoke_entry')
    if (utility === 'flash') utilitySequence.push('flash_peek')
    if (utility === 'molly') utilitySequence.push('molly_clear')
  }

  recommendations.push({
    site: site.name,
    timing,
    pathId: bestPath.id,
    utilitySequence,
    priorityTargets: bestPath.waypoints.slice(-3) // Last 3 waypoints
  })

  return recommendations
}

/**
 * Calculate confidence score
 */
function calculateConfidence(pathCount: number, scenarioCount: number): number {
  const baseConfidence = 0.6
  const pathBonus = Math.min(0.2, pathCount * 0.04)
  const scenarioBonus = Math.min(0.15, scenarioCount * 0.05)
  return Math.min(1.0, baseConfidence + pathBonus + scenarioBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render retake analysis to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<RetakeEfficiencyData>,
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

  // Render site area
  renderSiteArea(ctx, data.metrics.bySite)

  // Render paths
  for (const path of data.optimalPaths) {
    renderPath(ctx, path)
  }

  // Render scenarios
  for (const scenario of data.scenarios) {
    renderScenario(ctx, scenario)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render site area
 */
function renderSiteArea(ctx: CanvasRenderingContext2D, bySite: Record<string, SiteRetakeMetrics>): void {
  for (const siteName in bySite) {
    const site = bySite[siteName]
    
    // Draw site zone
    ctx.beginPath()
    ctx.arc(site.optimalEntry.x, site.optimalEntry.y, 150, 0, Math.PI * 2)
    ctx.fillStyle = RETAKE_COLORS.site
    ctx.fill()
    ctx.strokeStyle = RETAKE_COLORS.siteBorder
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw site label
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(siteName.toUpperCase(), site.optimalEntry.x, site.optimalEntry.y - 160)
  }
}

/**
 * Render a path
 */
function renderPath(ctx: CanvasRenderingContext2D, path: RetakePath): void {
  if (path.waypoints.length < 2) return

  // Determine path color based on success rate
  let color = RETAKE_COLORS.path.dangerous
  if (path.successRate > 0.8) {
    color = RETAKE_COLORS.path.optimal
  } else if (path.successRate > 0.6) {
    color = RETAKE_COLORS.path.good
  } else if (path.successRate > 0.4) {
    color = RETAKE_COLORS.path.risky
  }

  // Draw path line
  ctx.beginPath()
  ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y)
  
  for (let i = 1; i < path.waypoints.length; i++) {
    ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y)
  }
  
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()

  // Draw waypoints
  for (let i = 0; i < path.waypoints.length; i++) {
    const waypoint = path.waypoints[i]
    const isStart = i === 0
    const isEnd = i === path.waypoints.length - 1

    ctx.beginPath()
    ctx.arc(waypoint.x, waypoint.y, isStart ? 8 : isEnd ? 10 : 4, 0, Math.PI * 2)
    ctx.fillStyle = isStart ? 'white' : isEnd ? color : 'rgba(255,255,255,0.5)'
    ctx.fill()
  }

  // Draw estimated time label
  const midIndex = Math.floor(path.waypoints.length / 2)
  const midPoint = path.waypoints[midIndex]
  
  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(`${path.estimatedTime.toFixed(1)}s`, midPoint.x, midPoint.y - 10)
}

/**
 * Render scenario outcome
 */
function renderScenario(ctx: CanvasRenderingContext2D, scenario: RetakeScenario): void {
  const isSuccess = scenario.outcome === 'success'
  
  // Draw outcome indicator at retake end position
  if (scenario.paths.length > 0) {
    const endPoint = scenario.paths[0].waypoints[scenario.paths[0].waypoints.length - 1]
    
    ctx.beginPath()
    ctx.arc(endPoint.x, endPoint.y + 20, 6, 0, Math.PI * 2)
    ctx.fillStyle = isSuccess ? RETAKE_COLORS.success : RETAKE_COLORS.failure
    ctx.fill()
    
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: RetakeEfficiencyData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Retake Scenarios: ${data.scenarios.length}`, 10, y)
  y += 20
  
  ctx.fillText(`Success Rate: ${(data.metrics.overallSuccessRate * 100).toFixed(0)}%`, 10, y)
  y += 20
  
  ctx.fillText(`Avg Time: ${data.metrics.averageTime.toFixed(1)}s`, 10, y)
  y += 20
  
  ctx.fillText(`Optimal Paths: ${data.optimalPaths.length}`, 10, y)
  y += 20

  // Show utility requirements for best path
  if (data.optimalPaths.length > 0) {
    const bestPath = data.optimalPaths[0]
    ctx.fillText(`Recommended: ${bestPath.utilityRequired.join(', ') || 'None'}`, 10, y)
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

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  MOVEMENT_SPEED,
  RETAKE_TIMINGS,
  UTILITY_TYPES,
  RETAKE_COLORS
}
