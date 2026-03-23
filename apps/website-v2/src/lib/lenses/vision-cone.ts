/** [Ver001.000]
 * Vision Cone Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes and visualizes player field of view and sight lines.
 * Reveals vision coverage, blind spots, and sight line obstructions.
 * 
 * Features:
 * - FOV cone calculation for each player
 * - Sight line analysis between positions
 * - Coverage overlap detection
 * - Blind spot identification
 * - Smoke/molly obstruction handling
 */

import type {
  VisionConeData,
  VisionCone,
  SightLine,
  VisionIntersection,
  Player,
  MapBounds,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Default field of view in degrees (Valorant typical) */
export const DEFAULT_FOV = 90

/** Default vision range in game units */
export const DEFAULT_VISION_RANGE = 4000

/** Cone segment count for polygon approximation */
const CONE_SEGMENTS = 30

/** Colors for vision cone visualization */
export const VISION_COLORS = {
  friendly: 'rgba(0, 200, 255, 0.3)',
  friendlyBorder: 'rgba(0, 200, 255, 0.8)',
  enemy: 'rgba(255, 80, 80, 0.3)',
  enemyBorder: 'rgba(255, 80, 80, 0.8)',
  overlap: 'rgba(255, 200, 0, 0.4)',
  sightLine: 'rgba(255, 255, 255, 0.6)',
  blindSpot: 'rgba(150, 50, 50, 0.5)'
}

// ============================================================================
// Types
// ============================================================================

/** Obstacle for vision raycasting */
export interface Obstacle {
  type: 'wall' | 'smoke' | 'molly' | 'box'
  polygon: Vector2D[]
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Vision cone calculation options */
export interface VisionConeOptions {
  fovAngle?: number
  range?: number
  obstacles?: Obstacle[]
  checkTeam?: boolean
  resolution?: number
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate vision cones for all players
 * @param players - Array of player positions and rotations
 * @param mapBounds - Map boundary information
 * @param options - Calculation options
 * @returns Vision cone analysis data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  options: VisionConeOptions = {}
): LensResult<VisionConeData> {
  const {
    fovAngle = DEFAULT_FOV,
    range = DEFAULT_VISION_RANGE,
    obstacles = []
  } = options

  const cones: VisionCone[] = []
  const sightLines: SightLine[] = []

  // Calculate vision cone for each player
  for (const player of players) {
    if (!player.isAlive) continue

    const cone = calculateVisionCone(player, fovAngle, range, obstacles, mapBounds)
    cones.push(cone)
  }

  // Calculate sight lines between all player pairs
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i]
      const p2 = players[j]
      
      if (!p1.isAlive || !p2.isAlive) continue

      const sightLine = calculateSightLine(p1, p2, obstacles)
      sightLines.push(sightLine)
    }
  }

  // Calculate coverage metrics
  const coverage = calculateCoverage(cones, mapBounds)

  const data: VisionConeData = {
    cones,
    coverage,
    sightLines
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(cones.length, sightLines.length),
      sampleSize: players.length
    }
  }
}

/**
 * Calculate vision cone for a single player
 */
function calculateVisionCone(
  player: Player,
  fovAngle: number,
  range: number,
  obstacles: Obstacle[],
  mapBounds: MapBounds
): VisionCone {
  const radFov = (fovAngle * Math.PI) / 180
  const halfFov = radFov / 2
  const rotationRad = (player.rotation * Math.PI) / 180

  // Calculate cone edges
  const leftAngle = rotationRad - halfFov
  const rightAngle = rotationRad + halfFov

  const leftEdge = {
    x: player.position.x + Math.cos(leftAngle) * range,
    y: player.position.y + Math.sin(leftAngle) * range
  }

  const rightEdge = {
    x: player.position.x + Math.cos(rightAngle) * range,
    y: player.position.y + Math.sin(rightAngle) * range
  }

  // Calculate visible polygon with raycasting
  const visibleArea = calculateVisiblePolygon(
    player.position,
    rotationRad,
    radFov,
    range,
    obstacles,
    mapBounds
  )

  // Find intersections
  const intersections = findIntersections(
    player.position,
    rotationRad,
    radFov,
    range,
    obstacles
  )

  return {
    playerId: player.id,
    position: player.position,
    rotation: player.rotation,
    fovAngle,
    range,
    cone: {
      apex: player.position,
      leftEdge,
      rightEdge
    },
    visibleArea,
    intersections
  }
}

/**
 * Calculate visible polygon using raycasting
 */
function calculateVisiblePolygon(
  origin: Vector2D,
  rotation: number,
  fov: number,
  range: number,
  obstacles: Obstacle[],
  mapBounds: MapBounds
): Vector2D[] {
  const points: Vector2D[] = [origin]
  const halfFov = fov / 2
  const startAngle = rotation - halfFov
  const endAngle = rotation + halfFov

  // Cast rays at regular intervals
  const angleStep = fov / CONE_SEGMENTS

  for (let i = 0; i <= CONE_SEGMENTS; i++) {
    const angle = startAngle + angleStep * i
    const endPoint = {
      x: origin.x + Math.cos(angle) * range,
      y: origin.y + Math.sin(angle) * range
    }

    // Check for intersections with obstacles
    const intersection = raycast(origin, endPoint, obstacles, mapBounds)
    points.push(intersection)
  }

  return points
}

/**
 * Raycast from origin to target, finding first intersection
 */
function raycast(
  origin: Vector2D,
  target: Vector2D,
  obstacles: Obstacle[],
  mapBounds: MapBounds
): Vector2D {
  let closestIntersection: Vector2D | null = null
  let minDistance = Infinity

  // Check map boundaries
  const mapIntersection = getMapBoundaryIntersection(origin, target, mapBounds)
  if (mapIntersection) {
    closestIntersection = mapIntersection.point
    minDistance = mapIntersection.distance
  }

  // Check obstacles
  for (const obstacle of obstacles) {
    const intersection = getPolygonIntersection(origin, target, obstacle.polygon)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < minDistance) {
        minDistance = dist
        closestIntersection = intersection
      }
    }
  }

  return closestIntersection || target
}

/**
 * Get intersection with map boundaries
 */
function getMapBoundaryIntersection(
  origin: Vector2D,
  target: Vector2D,
  bounds: MapBounds
): { point: Vector2D; distance: number } | null {
  const boundaries = [
    { p1: { x: 0, y: 0 }, p2: { x: bounds.width, y: 0 } }, // top
    { p1: { x: bounds.width, y: 0 }, p2: { x: bounds.width, y: bounds.height } }, // right
    { p1: { x: bounds.width, y: bounds.height }, p2: { x: 0, y: bounds.height } }, // bottom
    { p1: { x: 0, y: bounds.height }, p2: { x: 0, y: 0 } } // left
  ]

  let closest: { point: Vector2D; distance: number } | null = null

  for (const boundary of boundaries) {
    const intersection = getLineIntersection(origin, target, boundary.p1, boundary.p2)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (!closest || dist < closest.distance) {
        closest = { point: intersection, distance: dist }
      }
    }
  }

  return closest
}

/**
 * Get intersection with a polygon
 */
function getPolygonIntersection(
  origin: Vector2D,
  target: Vector2D,
  polygon: Vector2D[]
): Vector2D | null {
  let closest: Vector2D | null = null
  let minDistance = Infinity

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    
    const intersection = getLineIntersection(origin, target, p1, p2)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < minDistance) {
        minDistance = dist
        closest = intersection
      }
    }
  }

  return closest
}

/**
 * Calculate line intersection
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

/**
 * Calculate distance between two points
 */
function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Find all intersections with obstacles
 */
function findIntersections(
  origin: Vector2D,
  rotation: number,
  fov: number,
  range: number,
  obstacles: Obstacle[]
): VisionIntersection[] {
  const intersections: VisionIntersection[] = []
  const halfFov = fov / 2
  const startAngle = rotation - halfFov
  const angleStep = fov / 10

  for (let i = 0; i <= 10; i++) {
    const angle = startAngle + angleStep * i
    const target = {
      x: origin.x + Math.cos(angle) * range,
      y: origin.y + Math.sin(angle) * range
    }

    for (const obstacle of obstacles) {
      const intersection = getPolygonIntersection(origin, target, obstacle.polygon)
      if (intersection) {
        intersections.push({
          type: obstacle.type,
          position: intersection,
          distance: distance(origin, intersection)
        })
      }
    }
  }

  return intersections
}

/**
 * Calculate sight line between two players
 */
function calculateSightLine(
  p1: Player,
  p2: Player,
  obstacles: Obstacle[]
): SightLine {
  const dist = distance(p1.position, p2.position)
  
  // Check if line is clear
  const obstruction = findLineObstructions(p1.position, p2.position, obstacles)

  return {
    from: p1.position,
    to: p2.position,
    distance: dist,
    isClear: obstruction.length === 0,
    obstructions: obstruction.map(o => o.type)
  }
}

/**
 * Find obstructions along a line
 */
function findLineObstructions(
  start: Vector2D,
  end: Vector2D,
  obstacles: Obstacle[]
): Obstacle[] {
  const obstructions: Obstacle[] = []

  for (const obstacle of obstacles) {
    if (lineIntersectsPolygon(start, end, obstacle.polygon)) {
      obstructions.push(obstacle)
    }
  }

  return obstructions
}

/**
 * Check if line intersects with polygon
 */
function lineIntersectsPolygon(
  start: Vector2D,
  end: Vector2D,
  polygon: Vector2D[]
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    if (getLineIntersection(start, end, p1, p2)) {
      return true
    }
  }
  return false
}

/**
 * Calculate coverage metrics
 */
function calculateCoverage(
  cones: VisionCone[],
  mapBounds: MapBounds
): { totalArea: number; overlappingArea: number; blindSpots: Vector2D[] } {
  // Simplified coverage calculation using grid sampling
  const gridSize = 50
  const cellWidth = mapBounds.width / gridSize
  const cellHeight = mapBounds.height / gridSize
  
  let coveredCells = 0
  let overlappingCells = 0
  const blindSpots: Vector2D[] = []

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const point = {
        x: gx * cellWidth + cellWidth / 2,
        y: gy * cellHeight + cellHeight / 2
      }

      let coveringCones = 0
      for (const cone of cones) {
        if (pointInPolygon(point, cone.visibleArea)) {
          coveringCones++
        }
      }

      if (coveringCones > 0) {
        coveredCells++
        if (coveringCones > 1) {
          overlappingCells++
        }
      } else {
        blindSpots.push(point)
      }
    }
  }

  const totalArea = mapBounds.width * mapBounds.height
  const cellArea = cellWidth * cellHeight

  return {
    totalArea: coveredCells * cellArea,
    overlappingArea: overlappingCells * cellArea,
    blindSpots: blindSpots.slice(0, 20) // Limit blind spots
  }
}

/**
 * Check if point is inside polygon using ray casting
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
 * Calculate confidence based on data quality
 */
function calculateConfidence(coneCount: number, sightLineCount: number): number {
  const baseConfidence = 0.7
  const coneBonus = Math.min(0.2, coneCount * 0.02)
  const lineBonus = Math.min(0.1, sightLineCount * 0.01)
  return Math.min(1.0, baseConfidence + coneBonus + lineBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render vision cones to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<VisionConeData>,
  options: Partial<LensRenderOptions> = {}
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const {
    opacity = 0.7,
    scale = 1,
    offset = { x: 0, y: 0 },
    showLabels = true,
    colorScheme = 'default'
  } = options

  const { data } = result

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.scale(scale, scale)
  ctx.translate(offset.x, offset.y)

  // Render vision cones
  for (const cone of data.cones) {
    renderVisionCone(ctx, cone, colorScheme)
  }

  // Render sight lines
  for (const sightLine of data.sightLines) {
    renderSightLine(ctx, sightLine)
  }

  // Render blind spots
  if (data.coverage.blindSpots.length > 0) {
    renderBlindSpots(ctx, data.coverage.blindSpots)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render a single vision cone
 */
function renderVisionCone(
  ctx: CanvasRenderingContext2D,
  cone: VisionCone,
  colorScheme: string
): void {
  const isEnemy = colorScheme === 'team' // Simplified check
  const fillColor = isEnemy ? VISION_COLORS.enemy : VISION_COLORS.friendly
  const borderColor = isEnemy ? VISION_COLORS.enemyBorder : VISION_COLORS.friendlyBorder

  // Draw filled cone
  ctx.beginPath()
  ctx.moveTo(cone.visibleArea[0]?.x || cone.position.x, cone.visibleArea[0]?.y || cone.position.y)
  
  for (let i = 1; i < cone.visibleArea.length; i++) {
    ctx.lineTo(cone.visibleArea[i].x, cone.visibleArea[i].y)
  }
  
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()

  // Draw cone border
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Draw player position marker
  ctx.beginPath()
  ctx.arc(cone.position.x, cone.position.y, 8, 0, Math.PI * 2)
  ctx.fillStyle = borderColor
  ctx.fill()

  // Draw direction indicator
  const dirX = cone.position.x + Math.cos((cone.rotation * Math.PI) / 180) * 15
  const dirY = cone.position.y + Math.sin((cone.rotation * Math.PI) / 180) * 15
  ctx.beginPath()
  ctx.moveTo(cone.position.x, cone.position.y)
  ctx.lineTo(dirX, dirY)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.stroke()
}

/**
 * Render a sight line
 */
function renderSightLine(
  ctx: CanvasRenderingContext2D,
  sightLine: SightLine
): void {
  ctx.beginPath()
  ctx.moveTo(sightLine.from.x, sightLine.from.y)
  ctx.lineTo(sightLine.to.x, sightLine.to.y)
  
  ctx.strokeStyle = sightLine.isClear 
    ? VISION_COLORS.sightLine 
    : 'rgba(255, 100, 100, 0.3)'
  ctx.lineWidth = sightLine.isClear ? 1 : 0.5
  ctx.setLineDash(sightLine.isClear ? [] : [5, 5])
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Render blind spots
 */
function renderBlindSpots(
  ctx: CanvasRenderingContext2D,
  blindSpots: Vector2D[]
): void {
  ctx.fillStyle = VISION_COLORS.blindSpot
  
  for (const spot of blindSpots) {
    ctx.beginPath()
    ctx.arc(spot.x, spot.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Render labels and metrics
 */
function renderLabels(
  ctx: CanvasRenderingContext2D,
  data: VisionConeData
): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Vision Cones: ${data.cones.length}`, 10, y)
  y += 20
  ctx.fillText(`Coverage: ${(data.coverage.totalArea / 1000000).toFixed(1)}M sq units`, 10, y)
  y += 20
  ctx.fillText(`Blind Spots: ${data.coverage.blindSpots.length}`, 10, y)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a position is visible from a player's perspective
 */
export function isPositionVisible(
  viewerPosition: Vector2D,
  viewerRotation: number,
  fovAngle: number,
  targetPosition: Vector2D,
  obstacles?: Obstacle[]
): boolean {
  const dx = targetPosition.x - viewerPosition.x
  const dy = targetPosition.y - viewerPosition.y
  const angle = Math.atan2(dy, dx)
  
  // Normalize angle to 0-2π
  const normalizedRotation = ((viewerRotation * Math.PI) / 180 + Math.PI * 2) % (Math.PI * 2)
  const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2)
  
  // Check if within FOV
  const halfFov = (fovAngle * Math.PI) / 360
  const angleDiff = Math.abs(normalizedAngle - normalizedRotation)
  const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff)
  
  if (wrappedDiff > halfFov) return false

  // Check for obstacles
  if (obstacles && obstacles.length > 0) {
    return !lineIntersectsPolygon(viewerPosition, targetPosition, obstacles.flatMap(o => o.polygon))
  }

  return true
}

/**
 * Get the overlap area between two vision cones
 */
export function getConeOverlap(cone1: VisionCone, cone2: VisionCone): number {
  // Simplified overlap calculation using polygon intersection
  const intersection = intersectPolygons(cone1.visibleArea, cone2.visibleArea)
  if (intersection.length < 3) return 0
  
  return calculatePolygonArea(intersection)
}

/**
 * Calculate polygon intersection (simplified)
 */
function intersectPolygons(poly1: Vector2D[], poly2: Vector2D[]): Vector2D[] {
  // Sutherland-Hodgman clipping algorithm
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
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(polygon: Vector2D[]): number {
  let area = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    area += polygon[i].x * polygon[j].y
    area -= polygon[j].x * polygon[i].y
  }
  return Math.abs(area) / 2
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  isPositionVisible,
  getConeOverlap,
  DEFAULT_FOV,
  DEFAULT_VISION_RANGE,
  VISION_COLORS
}
