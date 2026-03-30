/** [Ver001.000]
 * Information Gaps Lens
 * =====================
 * Identifies areas with low information and blind spots analysis.
 * 
 * Features:
 * - Vision cone coverage analysis
 * - Blind spot identification
 * - Information gap scoring
 * - Recommended recon positions
 * - Uncovered area heatmap
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Information gap zone */
export interface InfoGap {
  /** Unique identifier */
  id: string
  /** Zone position */
  position: { x: number; y: number }
  /** Zone radius */
  radius: number
  /** Gap severity (0.0 - 1.0) */
  severity: number
  /** Why this is a gap */
  reason: 'no_vision' | 'smoke_blocked' | 'too_far' | 'angle_limited' | 'never_checked'
  /** Importance of this area */
  importance: 'low' | 'medium' | 'high' | 'critical'
  /** Nearby objectives/sites */
  nearSites: string[]
  /** Common attack paths through this gap */
  attackPaths: string[]
  /** When last checked (ms timestamp) */
  lastChecked?: number
  /** Time since checked */
  timeUnchecked: number
}

/** Vision source (player, camera, ability) */
export interface VisionSource {
  /** Source position */
  position: { x: number; y: number }
  /** Vision direction (angle in radians) */
  direction: number
  /** Field of view (radians) */
  fov: number
  /** Vision range */
  range: number
  /** Source type */
  type: 'player' | 'camera' | 'ability' | 'drone'
  /** Team */
  team: 'allies' | 'enemies'
  /** Is currently active */
  isActive: boolean
  /** When vision started */
  since: number
}

/** Coverage map cell */
export interface CoverageCell {
  /** Grid position */
  gridX: number
  gridY: number
  /** World position */
  position: { x: number; y: number }
  /** Coverage level (0.0 - 1.0) */
  coverage: number
  /** Sources providing coverage */
  sources: string[]
  /** Time since last covered */
  timeSinceCoverage: number
}

/** Input data for info gap calculation */
export interface InfoGapInput {
  /** Vision sources */
  visionSources: VisionSource[]
  /** Map boundaries */
  mapBounds: { minX: number; maxX: number; minY: number; maxY: number }
  /** Important areas to monitor */
  keyAreas: Array<{
    id: string
    x: number
    y: number
    radius: number
    importance: 'low' | 'medium' | 'high' | 'critical'
  }>
  /** Common attack paths */
  attackPaths: Array<{
    id: string
    waypoints: Array<{ x: number; y: number }>
    frequency: number
  }>
  /** Obstacles/walls that block vision */
  obstacles?: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
  /** Grid resolution */
  gridResolution?: number
  /** Current time */
  currentTime: number
}

/** Lens data output */
export interface InfoGapLensData {
  /** Identified gaps */
  gaps: InfoGap[]
  /** Coverage heatmap */
  coverageHeatmap: HeatmapCell[]
  /** Gap heatmap (inverse coverage) */
  gapHeatmap: HeatmapCell[]
  /** Coverage statistics */
  coverageStats: {
    totalCoverage: number
    criticalCoverage: number
    averageCoverage: number
    blindSpots: number
  }
  /** Recommended recon positions */
  reconRecommendations: Array<{
    position: { x: number; y: number }
    coverageGain: number
    priority: 'low' | 'medium' | 'high'
    reasoning: string[]
  }>
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface InfoGapRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: InfoGapLensData
  /** Show vision cones */
  showVisionCones?: boolean
  /** Show gap zones */
  showGaps?: boolean
  /** Show recommendations */
  showRecommendations?: boolean
  /** Minimum severity to show */
  minSeverity?: number
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Severity colors */
export const SEVERITY_COLORS = {
  low: '#64748b',      // Slate
  medium: '#eab308',   // Yellow
  high: '#f97316',     // Orange
  critical: '#ef4444'  // Red
}

/** Coverage level colors */
export const COVERAGE_COLORS = {
  none: '#ef4444',     // Red
  partial: '#eab308',  // Yellow
  full: '#22c55e'      // Green
}

/** Default grid resolution */
export const DEFAULT_GRID_RESOLUTION = 30

/** Default vision settings */
export const DEFAULT_VISION = {
  playerFov: Math.PI / 3,     // 60 degrees
  playerRange: 50,
  cameraFov: Math.PI / 2,     // 90 degrees
  cameraRange: 60
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate information gaps based on input data
 * @param input - Info gap input
 * @returns Info gap lens data
 */
export function calculate(input: InfoGapInput): InfoGapLensData {
  const calculatedAt = Date.now()
  const gridResolution = input.gridResolution || DEFAULT_GRID_RESOLUTION
  
  // Generate coverage grid
  const coverageGrid = generateCoverageGrid(input, gridResolution)
  
  // Identify gaps
  const gaps = identifyGaps(coverageGrid, input)
  
  // Generate heatmaps
  const coverageHeatmap = generateCoverageHeatmap(coverageGrid)
  const gapHeatmap = generateGapHeatmap(coverageGrid)
  
  // Calculate statistics
  const coverageStats = calculateCoverageStats(coverageGrid, input)
  
  // Generate recommendations
  const reconRecommendations = generateReconRecommendations(coverageGrid, gaps, input)
  
  return {
    gaps,
    coverageHeatmap,
    gapHeatmap,
    coverageStats,
    reconRecommendations,
    calculatedAt
  }
}

/**
 * Generate coverage grid
 */
function generateCoverageGrid(
  input: InfoGapInput,
  resolution: number
): CoverageCell[][] {
  const grid: CoverageCell[][] = []
  const { minX, maxX, minY, maxY } = input.mapBounds
  const cellWidth = (maxX - minX) / resolution
  const cellHeight = (maxY - minY) / resolution
  
  for (let gx = 0; gx < resolution; gx++) {
    grid[gx] = []
    for (let gy = 0; gy < resolution; gy++) {
      const x = minX + gx * cellWidth + cellWidth / 2
      const y = minY + gy * cellHeight + cellHeight / 2
      
      // Calculate coverage from each vision source
      let totalCoverage = 0
      const sources: string[] = []
      let lastCovered = 0
      
      input.visionSources.forEach(source => {
        if (!source.isActive) return
        
        const coverage = calculateCellCoverage({ x, y }, source, input.obstacles)
        if (coverage > 0) {
          totalCoverage += coverage
          sources.push(`${source.type}-${source.team}`)
          lastCovered = Math.max(lastCovered, source.since)
        }
      })
      
      grid[gx][gy] = {
        gridX: gx,
        gridY: gy,
        position: { x, y },
        coverage: Math.min(1, totalCoverage),
        sources,
        timeSinceCoverage: input.currentTime - lastCovered
      }
    }
  }
  
  return grid
}

/**
 * Calculate coverage for a single cell from a vision source
 */
function calculateCellCoverage(
  cell: { x: number; y: number },
  source: VisionSource,
  obstacles?: InfoGapInput['obstacles']
): number {
  // Distance check
  const dist = Math.sqrt(
    Math.pow(cell.x - source.position.x, 2) +
    Math.pow(cell.y - source.position.y, 2)
  )
  
  if (dist > source.range) return 0
  
  // FOV check
  const angle = Math.atan2(cell.y - source.position.y, cell.x - source.position.x)
  const angleDiff = normalizeAngle(angle - source.direction)
  
  if (Math.abs(angleDiff) > source.fov / 2) return 0
  
  // Obstacle check (simplified)
  if (obstacles) {
    for (const obs of obstacles) {
      if (lineIntersectsRect(source.position, cell, obs)) {
        return 0
      }
    }
  }
  
  // Calculate coverage intensity
  const distFactor = 1 - dist / source.range
  const angleFactor = 1 - Math.abs(angleDiff) / (source.fov / 2)
  
  return distFactor * angleFactor
}

/**
 * Normalize angle to [-PI, PI]
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI
  while (angle < -Math.PI) angle += 2 * Math.PI
  return angle
}

/**
 * Check if line intersects rectangle
 */
function lineIntersectsRect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // Simplified check - just check if line passes near rect center
  const rectCenter = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  }
  
  const distToLine = pointToLineDistance(rectCenter, p1, p2)
  return distToLine < Math.max(rect.width, rect.height) / 2
}

/**
 * Calculate point to line distance
 */
function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = lineEnd.y - lineStart.y
  const B = lineStart.x - lineEnd.x
  const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y
  
  return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B)
}

/**
 * Identify information gaps
 */
function identifyGaps(
  grid: CoverageCell[][],
  input: InfoGapInput
): InfoGap[] {
  const gaps: InfoGap[] = []
  
  // Check key areas for gaps
  input.keyAreas.forEach(area => {
    // Find cells in this area
    const areaCells: CoverageCell[] = []
    
    for (const row of grid) {
      for (const cell of row) {
        const dist = Math.sqrt(
          Math.pow(cell.position.x - area.x, 2) +
          Math.pow(cell.position.y - area.y, 2)
        )
        if (dist <= area.radius) {
          areaCells.push(cell)
        }
      }
    }
    
    // Calculate average coverage in area
    const avgCoverage = areaCells.reduce((sum, c) => sum + c.coverage, 0) / areaCells.length
    
    // If coverage is low, create gap
    if (avgCoverage < 0.5) {
      const severity = (1 - avgCoverage) * getImportanceMultiplier(area.importance)
      
      gaps.push({
        id: `gap-${area.id}`,
        position: { x: area.x, y: area.y },
        radius: area.radius,
        severity: Math.min(1, severity),
        reason: determineGapReason(areaCells),
        importance: area.importance,
        nearSites: [area.id],
        attackPaths: findAttackPaths(input.attackPaths, area),
        lastChecked: findLastChecked(areaCells),
        timeUnchecked: Math.max(...areaCells.map(c => c.timeSinceCoverage))
      })
    }
  })
  
  // Find additional gaps along attack paths
  input.attackPaths.forEach(path => {
    const pathCells = findPathCells(grid, path.waypoints)
    const uncoveredCells = pathCells.filter(c => c.coverage < 0.2)
    
    if (uncoveredCells.length > pathCells.length * 0.5) {
      // Find center of uncovered section
      const centerX = uncoveredCells.reduce((sum, c) => sum + c.position.x, 0) / uncoveredCells.length
      const centerY = uncoveredCells.reduce((sum, c) => sum + c.position.y, 0) / uncoveredCells.length
      
      const existingGap = gaps.find(g => 
        Math.sqrt(Math.pow(g.position.x - centerX, 2) + Math.pow(g.position.y - centerY, 2)) < 15
      )
      
      if (!existingGap) {
        gaps.push({
          id: `gap-path-${path.id}`,
          position: { x: centerX, y: centerY },
          radius: 10,
          severity: 0.6 * (path.frequency / 10),
          reason: 'never_checked',
          importance: path.frequency > 5 ? 'high' : 'medium',
          nearSites: [],
          attackPaths: [path.id],
          timeUnchecked: Math.max(...uncoveredCells.map(c => c.timeSinceCoverage))
        })
      }
    }
  })
  
  return gaps.sort((a, b) => b.severity - a.severity)
}

/**
 * Get importance multiplier */
function getImportanceMultiplier(importance: InfoGap['importance']): number {
  switch (importance) {
    case 'critical': return 1.5
    case 'high': return 1.2
    case 'medium': return 1.0
    case 'low': return 0.8
  }
}

/**
 * Determine reason for gap */
function determineGapReason(cells: CoverageCell[]): InfoGap['reason'] {
  if (cells.every(c => c.sources.length === 0)) {
    return 'no_vision'
  }
  if (cells.some(c => c.timeSinceCoverage > 30000)) {
    return 'never_checked'
  }
  return 'angle_limited'
}

/**
 * Find attack paths near an area */
function findAttackPaths(
  paths: InfoGapInput['attackPaths'],
  area: InfoGapInput['keyAreas'][0]
): string[] {
  return paths
    .filter(path => {
      return path.waypoints.some(wp => {
        const dist = Math.sqrt(
          Math.pow(wp.x - area.x, 2) + Math.pow(wp.y - area.y, 2)
        )
        return dist < area.radius + 20
      })
    })
    .map(p => p.id)
}

/**
 * Find last time area was checked */
function findLastChecked(cells: CoverageCell[]): number | undefined {
  const covered = cells.filter(c => c.timeSinceCoverage < Infinity)
  if (covered.length === 0) return undefined
  return Math.min(...covered.map(c => Date.now() - c.timeSinceCoverage))
}

/**
 * Find grid cells along a path */
function findPathCells(
  grid: CoverageCell[][],
  waypoints: Array<{ x: number; y: number }>
): CoverageCell[] {
  const cells: CoverageCell[] = []
  
  for (const row of grid) {
    for (const cell of row) {
      // Check if cell is near any waypoint
      const isNear = waypoints.some(wp => {
        const dist = Math.sqrt(
          Math.pow(cell.position.x - wp.x, 2) +
          Math.pow(cell.position.y - wp.y, 2)
        )
        return dist < 10
      })
      
      if (isNear) {
        cells.push(cell)
      }
    }
  }
  
  return cells
}

/**
 * Generate coverage heatmap */
function generateCoverageHeatmap(grid: CoverageCell[][]): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  for (const row of grid) {
    for (const cell of row) {
      if (cell.coverage > 0.1) {
        cells.push({
          x: cell.position.x,
          y: cell.position.y,
          value: cell.coverage,
          intensity: cell.coverage * 0.7
        })
      }
    }
  }
  
  return cells
}

/**
 * Generate gap heatmap (inverse coverage) */
function generateGapHeatmap(grid: CoverageCell[][]): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  for (const row of grid) {
    for (const cell of row) {
      const gapValue = 1 - cell.coverage
      if (gapValue > 0.6) {
        cells.push({
          x: cell.position.x,
          y: cell.position.y,
          value: gapValue,
          intensity: gapValue
        })
      }
    }
  }
  
  return cells
}

/**
 * Calculate coverage statistics */
function calculateCoverageStats(
  grid: CoverageCell[][],
  input: InfoGapInput
): InfoGapLensData['coverageStats'] {
  let totalCoverage = 0
  let criticalCoverage = 0
  let blindSpots = 0
  let cellCount = 0
  
  for (const row of grid) {
    for (const cell of row) {
      totalCoverage += cell.coverage
      cellCount++
      
      if (cell.coverage < 0.1) {
        blindSpots++
      }
    }
  }
  
  // Check critical areas specifically
  input.keyAreas.forEach(area => {
    const areaCells = grid.flat().filter(c => {
      const dist = Math.sqrt(
        Math.pow(c.position.x - area.x, 2) + Math.pow(c.position.y - area.y, 2)
      )
      return dist <= area.radius
    })
    
    if (areaCells.length > 0) {
      const areaCoverage = areaCells.reduce((sum, c) => sum + c.coverage, 0) / areaCells.length
      if (area.importance === 'critical' || area.importance === 'high') {
        criticalCoverage += areaCoverage
      }
    }
  })
  
  return {
    totalCoverage: cellCount > 0 ? totalCoverage / cellCount : 0,
    criticalCoverage,
    averageCoverage: cellCount > 0 ? totalCoverage / cellCount : 0,
    blindSpots
  }
}

/**
 * Generate recon position recommendations */
function generateReconRecommendations(
  _grid: CoverageCell[][],
  gaps: InfoGap[],
  _input: InfoGapInput
): InfoGapLensData['reconRecommendations'] {
  const recommendations: InfoGapLensData['reconRecommendations'] = []
  
  gaps.slice(0, 3).forEach(gap => {
    // Find position that would cover this gap
    // Simplified: position at distance from gap center
    const angle = Math.random() * Math.PI * 2
    const distance = gap.radius * 1.5
    
    const position = {
      x: gap.position.x + Math.cos(angle) * distance,
      y: gap.position.y + Math.sin(angle) * distance
    }
    
    // Calculate potential coverage gain
    const coverageGain = gap.severity * (gap.importance === 'critical' ? 1.5 : 1)
    
    recommendations.push({
      position,
      coverageGain,
      priority: gap.importance === 'critical' ? 'high' : gap.importance === 'high' ? 'high' : 'medium',
      reasoning: [
        `Covers ${gap.nearSites.join(', ')}`,
        `${(gap.severity * 100).toFixed(0)}% severity gap`,
        `Uncovered for ${(gap.timeUnchecked / 1000).toFixed(0)}s`
      ]
    })
  })
  
  return recommendations
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render info gaps to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: InfoGapRenderOptions): boolean {
  const {
    canvas,
    data,
    showVisionCones = true,
    showGaps = true,
    showRecommendations = true,
    minSeverity = 0.2,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Render coverage heatmap
  renderCoverageHeatmap(ctx, data.coverageHeatmap, animationProgress)
  
  // Render vision cones
  if (showVisionCones) {
    // Vision cones would be rendered here from input data
    // (simplified for this implementation)
  }
  
  // Render gaps
  if (showGaps) {
    const visibleGaps = data.gaps.filter(g => g.severity >= minSeverity)
    visibleGaps.forEach(gap => {
      renderGap(ctx, gap, animationProgress)
    })
  }
  
  // Render recommendations
  if (showRecommendations) {
    data.reconRecommendations.forEach((rec, index) => {
      renderRecommendation(ctx, rec, index)
    })
  }
  
  // Render stats
  renderStats(ctx, data.coverageStats)
  
  ctx.restore()
  return true
}

/**
 * Render coverage heatmap
 */
function renderCoverageHeatmap(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapCell[],
  animationProgress: number
): void {
  heatmap.forEach(cell => {
    const intensity = cell.intensity * animationProgress * 0.5
    if (intensity < 0.1) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 3
    )
    gradient.addColorStop(0, `rgba(34, 197, 94, ${intensity})`)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Render a gap
 */
function renderGap(
  ctx: CanvasRenderingContext2D,
  gap: InfoGap,
  animationProgress: number
): void {
  const color = SEVERITY_COLORS[gap.importance]
  const radius = gap.radius * animationProgress
  
  ctx.save()
  
  // Gap zone
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  
  ctx.beginPath()
  ctx.arc(gap.position.x, gap.position.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.setLineDash([])
  
  // Fill with low opacity
  ctx.fillStyle = color + '20'
  ctx.fill()
  
  // Severity indicator
  ctx.fillStyle = color
  ctx.font = 'bold 4px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${(gap.severity * 100).toFixed(0)}%`, gap.position.x, gap.position.y)
  
  // Reason icon
  const reasonIcons: Record<InfoGap['reason'], string> = {
    no_vision: '👁',
    smoke_blocked: '☁',
    too_far: '📏',
    angle_limited: '📐',
    never_checked: '❓'
  }
  
  ctx.font = '4px sans-serif'
  ctx.fillText(reasonIcons[gap.reason], gap.position.x, gap.position.y - radius - 3)
  
  ctx.restore()
}

/**
 * Render recommendation
 */
function renderRecommendation(
  ctx: CanvasRenderingContext2D,
  rec: InfoGapLensData['reconRecommendations'][0],
  index: number
): void {
  ctx.save()
  
  const priorityColors = {
    low: '#64748b',
    medium: '#eab308',
    high: '#ef4444'
  }
  
  // Position marker
  ctx.fillStyle = priorityColors[rec.priority]
  ctx.beginPath()
  ctx.arc(rec.position.x, rec.position.y, 3, 0, Math.PI * 2)
  ctx.fill()
  
  // Label line
  ctx.strokeStyle = priorityColors[rec.priority]
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(rec.position.x, rec.position.y)
  ctx.lineTo(rec.position.x + 10, rec.position.y - 10 - index * 6)
  ctx.stroke()
  
  ctx.restore()
}

/**
 * Render stats overlay
 */
function renderStats(ctx: CanvasRenderingContext2D, stats: InfoGapLensData['coverageStats']): void {
  ctx.save()
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(2, 2, 45, 22)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '3px sans-serif'
  ctx.textAlign = 'left'
  
  ctx.fillText(`Coverage: ${(stats.totalCoverage * 100).toFixed(0)}%`, 4, 6)
  ctx.fillText(`Blind spots: ${stats.blindSpots}`, 4, 12)
  ctx.fillText(`Critical: ${(stats.criticalCoverage * 100).toFixed(0)}%`, 4, 17)
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if position is in blind spot
 * @param position - Position to check
 * @param gaps - Identified gaps
 * @returns True if in blind spot
 */
export function isInBlindSpot(
  position: { x: number; y: number },
  gaps: InfoGap[]
): boolean {
  return gaps.some(gap => {
    const dist = Math.sqrt(
      Math.pow(gap.position.x - position.x, 2) +
      Math.pow(gap.position.y - position.y, 2)
    )
    return dist < gap.radius
  })
}

/**
 * Get highest priority gaps
 * @param gaps - All gaps
 * @param count - Number to return
 * @returns Top priority gaps
 */
export function getPriorityGaps(gaps: InfoGap[], count: number = 3): InfoGap[] {
  return gaps
    .filter(g => g.importance === 'critical' || g.importance === 'high')
    .sort((a, b) => b.severity - a.severity)
    .slice(0, count)
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  isInBlindSpot,
  getPriorityGaps,
  SEVERITY_COLORS,
  COVERAGE_COLORS,
  DEFAULT_GRID_RESOLUTION
}
