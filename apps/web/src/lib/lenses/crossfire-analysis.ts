/** [Ver001.000]
 * Crossfire Analysis Lens - SpecMap V2 Tactical Lens
 * 
 * Identifies and analyzes crossfire setups between players.
 * Reveals coverage overlaps, optimal angles, and setup effectiveness.
 * 
 * Features:
 * - Crossfire setup detection
 * - Coverage overlap visualization
 * - Angle quality assessment
 * - Historical success tracking
 * - Setup recommendations
 */

import type {
  CrossfireData,
  CrossfireSetup,
  CrossfireEffectiveness,
  CrossfireRecommendation,
  Player,
  MapBounds,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Optimal crossfire angle in degrees */
export const OPTIMAL_CROSSFIRE_ANGLE = 90

/** Acceptable angle tolerance in degrees */
export const ANGLE_TOLERANCE = 30

/** Maximum crossfire range in game units */
export const MAX_CROSSFIRE_RANGE = 3000

/** Minimum crossfire range in game units */
export const MIN_CROSSFIRE_RANGE = 500

/** Colors for crossfire visualization */
export const CROSSFIRE_COLORS = {
  double: 'rgba(0, 200, 150, 0.6)',
  doubleBorder: 'rgba(0, 200, 150, 1)',
  triple: 'rgba(200, 150, 0, 0.6)',
  tripleBorder: 'rgba(200, 150, 0, 1)',
  nest: 'rgba(200, 50, 200, 0.6)',
  nestBorder: 'rgba(200, 50, 200, 1)',
  overlap: 'rgba(255, 255, 100, 0.5)',
  gap: 'rgba(255, 80, 80, 0.4)',
  optimalAngle: 'rgba(100, 255, 100, 0.8)',
  suboptimalAngle: 'rgba(255, 200, 100, 0.8)'
}

// ============================================================================
// Types
// ============================================================================

/** Crossfire calculation options */
export interface CrossfireOptions {
  optimalAngle?: number
  angleTolerance?: number
  maxRange?: number
  minRange?: number
  considerHistory?: boolean
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
 * Calculate crossfire setups for all player combinations
 * @param players - Array of player positions
 * @param mapBounds - Map boundary information
 * @param options - Calculation options
 * @returns Crossfire analysis data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  options: CrossfireOptions = {}
): LensResult<CrossfireData> {
  const {
    optimalAngle = OPTIMAL_CROSSFIRE_ANGLE,
    angleTolerance = ANGLE_TOLERANCE,
    maxRange = MAX_CROSSFIRE_RANGE,
    minRange = MIN_CROSSFIRE_RANGE
  } = options

  const setups: CrossfireSetup[] = []
  const processedPairs = new Set<string>()

  // Find all valid crossfire combinations
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i]
      const p2 = players[j]

      if (!p1.isAlive || !p2.isAlive) continue
      if (p1.team !== p2.team) continue

      const pairKey = `${p1.id}-${p2.id}`
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      const setup = analyzePairCrossfire(p1, p2, optimalAngle, angleTolerance, minRange, maxRange)
      if (setup) {
        setups.push(setup)
      }
    }
  }

  // Find triple crossfires
  const tripleSetups = findTripleCrossfires(players, setups, optimalAngle, angleTolerance)
  setups.push(...tripleSetups)

  // Calculate coverage metrics
  const coverage = calculateCoverageMetrics(setups, mapBounds)

  // Generate recommendations
  const recommendations = generateRecommendations(setups, coverage, mapBounds)

  const data: CrossfireData = {
    setups,
    coverage,
    recommendations
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(setups.length),
      sampleSize: players.length
    }
  }
}

/**
 * Analyze crossfire potential between two players
 */
function analyzePairCrossfire(
  p1: Player,
  p2: Player,
  optimalAngle: number,
  angleTolerance: number,
  minRange: number,
  maxRange: number
): CrossfireSetup | null {
  const dist = distance(p1.position, p2.position)
  
  // Check range constraints
  if (dist < minRange || dist > maxRange) return null

  // Calculate crossfire angle
  const angle = calculateCrossfireAngle(p1.position, p2.position)
  const angleQuality = calculateAngleQuality(angle, optimalAngle, angleTolerance)
  
  // Calculate coverage areas
  const coverageArea = calculateCoveragePolygon(p1.position, p2.position, maxRange)
  const overlapZone = calculateOverlapZone(p1.position, p2.position, maxRange)

  // Calculate effectiveness
  const effectiveness: CrossfireEffectiveness = {
    coverage: calculateCoverageValue(coverageArea, dist),
    angleQuality,
    escapeDifficulty: calculateEscapeDifficulty(p1.position, p2.position, angle),
    historicalSuccess: 0.7 // Placeholder for historical data
  }

  return {
    id: `cf-${p1.id}-${p2.id}`,
    players: [p1.id, p2.id],
    positions: [p1.position, p2.position],
    coverageArea,
    overlapZone,
    angles: [angle],
    effectiveness,
    type: 'double'
  }
}

/**
 * Find triple crossfire setups
 */
function findTripleCrossfires(
  players: Player[],
  _existingSetups: CrossfireSetup[],
  optimalAngle: number,
  angleTolerance: number
): CrossfireSetup[] {
  const triples: CrossfireSetup[] = []
  const sameTeam = players.filter(p => p.team === players[0]?.team && p.isAlive)

  if (sameTeam.length < 3) return triples

  for (let i = 0; i < sameTeam.length; i++) {
    for (let j = i + 1; j < sameTeam.length; j++) {
      for (let k = j + 1; k < sameTeam.length; k++) {
        const p1 = sameTeam[i]
        const p2 = sameTeam[j]
        const p3 = sameTeam[k]

        const setup = analyzeTripleCrossfire(p1, p2, p3, optimalAngle, angleTolerance)
        if (setup) {
          triples.push(setup)
        }
      }
    }
  }

  return triples
}

/**
 * Analyze triple crossfire setup
 */
function analyzeTripleCrossfire(
  p1: Player,
  p2: Player,
  p3: Player,
  optimalAngle: number,
  angleTolerance: number
): CrossfireSetup | null {
  const positions = [p1.position, p2.position, p3.position]
  
  // Check if positions form a good triangle
  const d12 = distance(p1.position, p2.position)
  const d23 = distance(p2.position, p3.position)
  const d31 = distance(p3.position, p1.position)

  const avgDist = (d12 + d23 + d31) / 3
  if (avgDist < MIN_CROSSFIRE_RANGE || avgDist > MAX_CROSSFIRE_RANGE) return null

  // Calculate angles between all pairs
  const angles = [
    calculateCrossfireAngle(p1.position, p2.position),
    calculateCrossfireAngle(p2.position, p3.position),
    calculateCrossfireAngle(p3.position, p1.position)
  ]

  // Calculate combined coverage
  const coverageArea = calculateTripleCoverage(p1.position, p2.position, p3.position)
  const overlapZone = calculateTripleOverlap(p1.position, p2.position, p3.position)

  // Calculate average angle quality
  const avgAngleQuality = angles.reduce((sum, angle) => 
    sum + calculateAngleQuality(angle, optimalAngle, angleTolerance), 0) / 3

  const effectiveness: CrossfireEffectiveness = {
    coverage: calculateTripleCoverageValue(coverageArea),
    angleQuality: avgAngleQuality,
    escapeDifficulty: 0.9, // Triple crossfires are hard to escape
    historicalSuccess: 0.8
  }

  return {
    id: `cf-triple-${p1.id}-${p2.id}-${p3.id}`,
    players: [p1.id, p2.id, p3.id],
    positions,
    coverageArea,
    overlapZone,
    angles,
    effectiveness,
    type: 'triple'
  }
}

/**
 * Calculate crossfire angle between two positions
 */
function calculateCrossfireAngle(p1: Vector2D, p2: Vector2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return ((angle % 180) + 180) % 180
}

/**
 * Calculate angle quality score
 */
function calculateAngleQuality(angle: number, optimal: number, tolerance: number): number {
  const diff = Math.abs(angle - optimal)
  const wrappedDiff = Math.min(diff, 180 - diff)
  
  if (wrappedDiff <= tolerance) {
    return 1.0 - (wrappedDiff / tolerance) * 0.3
  }
  return Math.max(0, 0.7 - (wrappedDiff - tolerance) / 90 * 0.7)
}

/**
 * Calculate coverage polygon for a pair
 */
function calculateCoveragePolygon(p1: Vector2D, p2: Vector2D, range: number): Vector2D[] {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  
  // Create an elliptical coverage area
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)
  
  const polygon: Vector2D[] = []
  const segments = 20
  
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    const a = range // semi-major axis
    const b = Math.max(dist / 2, range * 0.3) // semi-minor axis
    
    const x = midX + a * Math.cos(theta) * Math.cos(angle) - b * Math.sin(theta) * Math.sin(angle)
    const y = midY + a * Math.cos(theta) * Math.sin(angle) + b * Math.sin(theta) * Math.cos(angle)
    
    polygon.push({ x, y })
  }
  
  return polygon
}

/**
 * Calculate overlap zone between two positions
 */
function calculateOverlapZone(p1: Vector2D, p2: Vector2D, range: number): Vector2D[] {
  const dist = distance(p1, p2)
  const overlapRadius = Math.max(0, range - dist / 2)
  
  if (overlapRadius <= 0) return []
  
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  
  const polygon: Vector2D[] = []
  const segments = 12
  
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    polygon.push({
      x: midX + overlapRadius * 0.5 * Math.cos(theta),
      y: midY + overlapRadius * 0.5 * Math.sin(theta)
    })
  }
  
  return polygon
}

/**
 * Calculate coverage for triple crossfire
 */
function calculateTripleCoverage(p1: Vector2D, p2: Vector2D, p3: Vector2D): Vector2D[] {
  const centerX = (p1.x + p2.x + p3.x) / 3
  const centerY = (p1.y + p2.y + p3.y) / 3
  
  const maxDist = Math.max(
    distance({ x: centerX, y: centerY }, p1),
    distance({ x: centerX, y: centerY }, p2),
    distance({ x: centerX, y: centerY }, p3)
  )
  
  const polygon: Vector2D[] = []
  const segments = 20
  
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    polygon.push({
      x: centerX + maxDist * 1.5 * Math.cos(theta),
      y: centerY + maxDist * 1.5 * Math.sin(theta)
    })
  }
  
  return polygon
}

/**
 * Calculate overlap zone for triple crossfire
 */
function calculateTripleOverlap(p1: Vector2D, p2: Vector2D, p3: Vector2D): Vector2D[] {
  // Create triangle connecting the three positions
  return [p1, p2, p3]
}

/**
 * Calculate coverage value
 */
function calculateCoverageValue(area: Vector2D[], _dist: number): number {
  const areaSize = calculatePolygonArea(area)
  const idealArea = Math.PI * MAX_CROSSFIRE_RANGE * MAX_CROSSFIRE_RANGE * 0.5
  return Math.min(1.0, areaSize / idealArea)
}

/**
 * Calculate triple coverage value
 */
function calculateTripleCoverageValue(area: Vector2D[]): number {
  const areaSize = calculatePolygonArea(area)
  const idealArea = Math.PI * MAX_CROSSFIRE_RANGE * MAX_CROSSFIRE_RANGE
  return Math.min(1.0, areaSize / idealArea)
}

/**
 * Calculate escape difficulty
 */
function calculateEscapeDifficulty(p1: Vector2D, p2: Vector2D, angle: number): number {
  const dist = distance(p1, p2)
  const distScore = Math.min(1.0, dist / MAX_CROSSFIRE_RANGE)
  const angleScore = calculateAngleQuality(angle, OPTIMAL_CROSSFIRE_ANGLE, ANGLE_TOLERANCE)
  return (distScore * 0.4 + angleScore * 0.6)
}

/**
 * Calculate coverage metrics
 */
function calculateCoverageMetrics(
  setups: CrossfireSetup[],
  mapBounds: MapBounds
): { total: number; overlapping: number; gaps: Vector2D[][] } {
  if (setups.length === 0) {
    return { total: 0, overlapping: 0, gaps: [] }
  }

  // Calculate total unique coverage
  let totalArea = 0
  const processedAreas = new Set<string>()
  
  for (const setup of setups) {
    const areaKey = setup.positions.map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join('-')
    if (!processedAreas.has(areaKey)) {
      totalArea += calculatePolygonArea(setup.coverageArea)
      processedAreas.add(areaKey)
    }
  }

  // Calculate overlapping area
  let overlapArea = 0
  for (let i = 0; i < setups.length; i++) {
    for (let j = i + 1; j < setups.length; j++) {
      const intersection = intersectPolygons(setups[i].coverageArea, setups[j].coverageArea)
      if (intersection.length > 2) {
        overlapArea += calculatePolygonArea(intersection)
      }
    }
  }

  // Identify gaps (simplified)
  const gaps: Vector2D[][] = findCoverageGaps(setups, mapBounds)

  return {
    total: totalArea,
    overlapping: overlapArea,
    gaps
  }
}

/**
 * Find coverage gaps
 */
function findCoverageGaps(setups: CrossfireSetup[], mapBounds: MapBounds): Vector2D[][] {
  // Sample points across the map
  const gaps: Vector2D[] = []
  const gridSize = 10
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const point = {
        x: (x / gridSize) * mapBounds.width,
        y: (y / gridSize) * mapBounds.height
      }
      
      let covered = false
      for (const setup of setups) {
        if (pointInPolygon(point, setup.coverageArea)) {
          covered = true
          break
        }
      }
      
      if (!covered) {
        gaps.push(point)
      }
    }
  }

  // Group nearby gaps
  return clusterPoints(gaps, 200)
}

/**
 * Cluster nearby points
 */
function clusterPoints(points: Vector2D[], threshold: number): Vector2D[][] {
  const clusters: Vector2D[][] = []
  const visited = new Set<number>()

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue

    const cluster: Vector2D[] = [points[i]]
    visited.add(i)

    for (let j = i + 1; j < points.length; j++) {
      if (visited.has(j)) continue
      
      if (distance(points[i], points[j]) < threshold) {
        cluster.push(points[j])
        visited.add(j)
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster)
    }
  }

  return clusters
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  setups: CrossfireSetup[],
  coverage: { total: number; overlapping: number; gaps: Vector2D[][] },
  _mapBounds: MapBounds
): CrossfireRecommendation[] {
  const recommendations: CrossfireRecommendation[] = []

  // Recommend filling gaps
  for (const gap of coverage.gaps) {
    if (gap.length > 0) {
      const center = {
        x: gap.reduce((sum, p) => sum + p.x, 0) / gap.length,
        y: gap.reduce((sum, p) => sum + p.y, 0) / gap.length
      }
      
      recommendations.push({
        type: 'add_position',
        priority: 'medium',
        description: `Add player to cover gap with ${gap.length} blind spots`,
        position: center
      })
    }
  }

  // Recommend angle adjustments
  for (const setup of setups) {
    if (setup.effectiveness.angleQuality < 0.7) {
      recommendations.push({
        type: 'adjust_angle',
        priority: 'high',
        description: `Adjust crossfire angle for ${setup.type} setup`,
        affectedPlayers: setup.players
      })
    }
  }

  // Recommend reducing overlaps
  if (coverage.overlapping > coverage.total * 0.3) {
    recommendations.push({
      type: 'remove_overlap',
      priority: 'low',
      description: 'Consider spreading positions to reduce redundant coverage'
    })
  }

  return recommendations
}

/**
 * Calculate confidence score
 */
function calculateConfidence(setupCount: number): number {
  const baseConfidence = 0.6
  const setupBonus = Math.min(0.35, setupCount * 0.05)
  return Math.min(1.0, baseConfidence + setupBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render crossfire analysis to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<CrossfireData>,
  options: Partial<LensRenderOptions> = {}
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const {
    opacity = 0.7,
    scale = 1,
    offset = { x: 0, y: 0 },
    showLabels = true
  } = options

  const { data } = result

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.scale(scale, scale)
  ctx.translate(offset.x, offset.y)

  // Render coverage areas
  for (const setup of data.setups) {
    renderCrossfireSetup(ctx, setup)
  }

  // Render gaps
  for (const gap of data.coverage.gaps) {
    renderGap(ctx, gap)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render a crossfire setup
 */
function renderCrossfireSetup(
  ctx: CanvasRenderingContext2D,
  setup: CrossfireSetup
): void {
  const colors = getSetupColors(setup.type)
  
  // Draw coverage area
  ctx.beginPath()
  ctx.moveTo(setup.coverageArea[0]?.x || 0, setup.coverageArea[0]?.y || 0)
  
  for (let i = 1; i < setup.coverageArea.length; i++) {
    ctx.lineTo(setup.coverageArea[i].x, setup.coverageArea[i].y)
  }
  
  ctx.closePath()
  ctx.fillStyle = colors.fill
  ctx.fill()
  ctx.strokeStyle = colors.border
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw overlap zone if significant
  if (setup.overlapZone.length > 2) {
    ctx.beginPath()
    ctx.moveTo(setup.overlapZone[0].x, setup.overlapZone[0].y)
    
    for (let i = 1; i < setup.overlapZone.length; i++) {
      ctx.lineTo(setup.overlapZone[i].x, setup.overlapZone[i].y)
    }
    
    ctx.closePath()
    ctx.fillStyle = CROSSFIRE_COLORS.overlap
    ctx.fill()
  }

  // Draw player positions
  for (const pos of setup.positions) {
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2)
    ctx.fillStyle = colors.border
    ctx.fill()
    
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Draw connecting lines
  for (let i = 0; i < setup.positions.length; i++) {
    for (let j = i + 1; j < setup.positions.length; j++) {
      const p1 = setup.positions[i]
      const p2 = setup.positions[j]
      
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.strokeStyle = setup.effectiveness.angleQuality > 0.8 
        ? CROSSFIRE_COLORS.optimalAngle 
        : CROSSFIRE_COLORS.suboptimalAngle
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}

/**
 * Get colors for setup type
 */
function getSetupColors(type: CrossfireSetup['type']): { fill: string; border: string } {
  switch (type) {
    case 'double':
      return { fill: CROSSFIRE_COLORS.double, border: CROSSFIRE_COLORS.doubleBorder }
    case 'triple':
      return { fill: CROSSFIRE_COLORS.triple, border: CROSSFIRE_COLORS.tripleBorder }
    case 'nest':
      return { fill: CROSSFIRE_COLORS.nest, border: CROSSFIRE_COLORS.nestBorder }
    default:
      return { fill: CROSSFIRE_COLORS.double, border: CROSSFIRE_COLORS.doubleBorder }
  }
}

/**
 * Render a coverage gap
 */
function renderGap(ctx: CanvasRenderingContext2D, gap: Vector2D[]): void {
  if (gap.length === 0) return

  const center = {
    x: gap.reduce((sum, p) => sum + p.x, 0) / gap.length,
    y: gap.reduce((sum, p) => sum + p.y, 0) / gap.length
  }

  const radius = Math.sqrt(gap.length) * 50

  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = CROSSFIRE_COLORS.gap
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: CrossfireData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Crossfire Setups: ${data.setups.length}`, 10, y)
  y += 20
  
  const doubleCount = data.setups.filter(s => s.type === 'double').length
  const tripleCount = data.setups.filter(s => s.type === 'triple').length
  ctx.fillText(`Double: ${doubleCount} | Triple: ${tripleCount}`, 10, y)
  y += 20
  
  ctx.fillText(`Coverage Gaps: ${data.coverage.gaps.length}`, 10, y)
  y += 20
  
  // Show average effectiveness
  const avgEffectiveness = data.setups.length > 0
    ? data.setups.reduce((sum, s) => sum + s.effectiveness.coverage, 0) / data.setups.length
    : 0
  ctx.fillText(`Avg Effectiveness: ${(avgEffectiveness * 100).toFixed(0)}%`, 10, y)
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
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(polygon: Vector2D[]): number {
  if (polygon.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    area += polygon[i].x * polygon[j].y
    area -= polygon[j].x * polygon[i].y
  }
  return Math.abs(area) / 2
}

/**
 * Check if point is inside polygon
 */
function pointInPolygon(point: Vector2D, polygon: Vector2D[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Intersect two polygons
 */
function intersectPolygons(poly1: Vector2D[], poly2: Vector2D[]): Vector2D[] {
  // Simplified Sutherland-Hodgman
  let output = [...poly1]
  
  for (let i = 0; i < poly2.length; i++) {
    const p1 = poly2[i]
    const p2 = poly2[(i + 1) % poly2.length]
    const input = output
    output = []
    
    for (let j = 0; j < input.length; j++) {
      const current = input[j]
      const prev = input[(j - 1 + input.length) % input.length]
      
      if (isInside(current, p1, p2)) {
        if (!isInside(prev, p1, p2)) {
          const intersection = getLineIntersection(prev, current, p1, p2)
          if (intersection) output.push(intersection)
        }
        output.push(current)
      } else if (isInside(prev, p1, p2)) {
        const intersection = getLineIntersection(prev, current, p1, p2)
        if (intersection) output.push(intersection)
      }
    }
  }
  
  return output
}

/**
 * Check if point is inside edge
 */
function isInside(point: Vector2D, edgeStart: Vector2D, edgeEnd: Vector2D): boolean {
  return (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) > 
         (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x)
}

/**
 * Get line intersection
 */
function getLineIntersection(
  a1: Vector2D,
  a2: Vector2D,
  b1: Vector2D,
  b2: Vector2D
): Vector2D | null {
  const denominator = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)
  
  if (denominator === 0) return null

  const ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denominator
  const ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denominator

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null

  return {
    x: a1.x + ua * (a2.x - a1.x),
    y: a1.y + ua * (a2.y - a1.y)
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  OPTIMAL_CROSSFIRE_ANGLE,
  ANGLE_TOLERANCE,
  MAX_CROSSFIRE_RANGE,
  MIN_CROSSFIRE_RANGE,
  CROSSFIRE_COLORS
}
