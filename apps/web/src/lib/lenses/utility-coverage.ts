/** [Ver001.000]
 * Utility Coverage Lens
 * =====================
 * Shows smoke/flash/molly coverage with overlap analysis.
 * 
 * Features:
 * - Real-time utility visualization
 * - Coverage overlap detection
 * - Effective duration tracking
 * - Team utility comparison
 * - Coverage gap identification
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Utility instance */
export interface UtilityInstance {
  /** Unique identifier */
  id: string
  /** Utility type */
  type: 'smoke' | 'flash' | 'molly' | 'decoy' | 'recon'
  /** Team side */
  team: 'attackers' | 'defenders'
  /** Current position */
  position: { x: number; y: number }
  /** Effective radius */
  radius: number
  /** When utility was deployed */
  deployedAt: number
  /** When utility expires */
  expiresAt: number
  /** Who deployed it */
  deployedBy: string
  /** Agent used */
  agent: string
  /** Current status */
  status: 'active' | 'fading' | 'expired'
  /** Coverage intensity (0.0 - 1.0) */
  intensity: number
}

/** Coverage zone */
export interface CoverageZone {
  /** Zone position */
  position: { x: number; y: number }
  /** Zone radius */
  radius: number
  /** Coverage type */
  type: UtilityInstance['type']
  /** Primary team covering */
  primaryTeam: 'attackers' | 'defenders'
  /** Coverage intensity */
  intensity: number
  /** Overlapping utilities */
  overlaps: Array<{ id: string; type: UtilityInstance['type'] }>
  /** Is this a gap (no coverage)? */
  isGap: boolean
}

/** Coverage statistics */
export interface CoverageStats {
  /** Total attacker coverage area */
  attackerCoverage: number
  /** Total defender coverage area */
  defenderCoverage: number
  /** Overlap area between teams */
  overlapArea: number
  /** Coverage by type */
  byType: Record<UtilityInstance['type'], {
    count: number
    coverage: number
    avgDuration: number
  }>
  /** Efficiency rating (0.0 - 1.0) */
  efficiency: number
}

/** Coverage gap */
export interface CoverageGap {
  /** Gap position */
  position: { x: number; y: number }
  /** Gap size/radius */
  radius: number
  /** Importance level */
  importance: 'low' | 'medium' | 'high' | 'critical'
  /** Nearby sites */
  nearSites: string[]
  /** Suggested utility to fill */
  suggestedUtility?: UtilityInstance['type']
}

/** Input data for utility coverage calculation */
export interface UtilityCoverageInput {
  /** Active utilities on map */
  utilities: UtilityInstance[]
  /** Current time */
  currentTime: number
  /** Map sites for gap analysis */
  sites?: Array<{ id: string; x: number; y: number; importance: number }>
  /** Map bounds */
  mapBounds?: { width: number; height: number }
  /** Grid resolution */
  gridResolution?: number
}

/** Lens data output */
export interface UtilityCoverageLensData {
  /** Active utilities (updated status) */
  utilities: UtilityInstance[]
  /** Coverage heatmap */
  coverageHeatmap: HeatmapCell[]
  /** Coverage zones */
  zones: CoverageZone[]
  /** Coverage statistics */
  stats: CoverageStats
  /** Coverage gaps */
  gaps: CoverageGap[]
  /** Overlap analysis */
  overlaps: Array<{
    position: { x: number; y: number }
    radius: number
    utilities: string[]
    isWasteful: boolean
  }>
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface UtilityCoverageRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: UtilityCoverageLensData
  /** Show utility labels */
  showLabels?: boolean
  /** Show coverage areas */
  showCoverage?: boolean
  /** Show overlaps */
  showOverlaps?: boolean
  /** Show gaps */
  showGaps?: boolean
  /** Team filter (null = both) */
  teamFilter?: 'attackers' | 'defenders' | null
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Utility type colors */
export const UTILITY_COLORS: Record<UtilityInstance['type'], string> = {
  smoke: '#64748b',   // Slate 500
  flash: '#facc15',   // Yellow 400
  molly: '#f97316',   // Orange 500
  decoy: '#a8a29e',   // Stone 400
  recon: '#06b6d4'    // Cyan 500
}

/** Team colors */
export const TEAM_COLORS = {
  attackers: 'rgba(239, 68, 68, 0.4)',   // Red
  defenders: 'rgba(59, 130, 246, 0.4)'   // Blue
}

/** Default grid resolution */
export const DEFAULT_GRID_RESOLUTION = 25

/** Utility default radii */
export const UTILITY_RADII: Record<UtilityInstance['type'], number> = {
  smoke: 15,
  flash: 12,
  molly: 8,
  decoy: 5,
  recon: 20
}

/** Utility durations (ms) */
export const UTILITY_DURATIONS: Record<UtilityInstance['type'], number> = {
  smoke: 18000,
  flash: 2000,
  molly: 7000,
  decoy: 15000,
  recon: 6000
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate utility coverage based on input data
 * @param input - Utility coverage input
 * @returns Utility coverage lens data
 */
export function calculate(input: UtilityCoverageInput): UtilityCoverageLensData {
  const calculatedAt = Date.now()
  const currentTime = input.currentTime
  
  // Update utility statuses
  const utilities = updateUtilityStatuses(input.utilities, currentTime)
  
  // Generate coverage heatmap
  const coverageHeatmap = generateCoverageHeatmap(utilities, input.gridResolution)
  
  // Identify coverage zones
  const zones = identifyCoverageZones(utilities)
  
  // Calculate statistics
  const stats = calculateCoverageStats(utilities, zones, input.mapBounds)
  
  // Find gaps
  const gaps = identifyCoverageGaps(utilities, input.sites, input.mapBounds)
  
  // Analyze overlaps
  const overlaps = analyzeOverlaps(utilities)
  
  return {
    utilities,
    coverageHeatmap,
    zones,
    stats,
    gaps,
    overlaps,
    calculatedAt
  }
}

/**
 * Update utility statuses based on current time
 */
function updateUtilityStatuses(
  utilities: UtilityInstance[],
  currentTime: number
): UtilityInstance[] {
  return utilities.map(u => {
    const timeRemaining = u.expiresAt - currentTime
    
    let status: UtilityInstance['status']
    if (timeRemaining <= 0) {
      status = 'expired'
    } else if (timeRemaining < 3000) {
      status = 'fading'
    } else {
      status = 'active'
    }
    
    // Calculate intensity based on remaining time
    const totalDuration = u.expiresAt - u.deployedAt
    const elapsed = currentTime - u.deployedAt
    const intensity = Math.max(0.3, 1 - (elapsed / totalDuration) * 0.5)
    
    return { ...u, status, intensity }
  }).filter(u => u.status !== 'expired')
}

/**
 * Generate coverage heatmap
 */
function generateCoverageHeatmap(
  utilities: UtilityInstance[],
  gridResolution: number = DEFAULT_GRID_RESOLUTION
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  for (let x = 0; x < gridResolution; x++) {
    for (let y = 0; y < gridResolution; y++) {
      const posX = (x / gridResolution) * 100
      const posY = (y / gridResolution) * 100
      
      let totalIntensity = 0
      
      utilities.forEach(u => {
        const dist = Math.sqrt(
          Math.pow(u.position.x - posX, 2) + 
          Math.pow(u.position.y - posY, 2)
        )
        
        if (dist < u.radius) {
          const influence = (1 - dist / u.radius) * u.intensity
          totalIntensity += influence * 0.5
        }
      })
      
      if (totalIntensity > 0.1) {
        cells.push({
          x: posX,
          y: posY,
          value: totalIntensity,
          intensity: Math.min(1, totalIntensity)
        })
      }
    }
  }
  
  return cells
}

/**
 * Identify distinct coverage zones
 */
function identifyCoverageZones(utilities: UtilityInstance[]): CoverageZone[] {
  const zones: CoverageZone[] = []
  
  utilities.forEach(u => {
    // Check if this utility overlaps with existing zones
    let addedToZone = false
    
    for (const zone of zones) {
      const dist = Math.sqrt(
        Math.pow(zone.position.x - u.position.x, 2) + 
        Math.pow(zone.position.y - u.position.y, 2)
      )
      
      if (dist < (zone.radius + u.radius) / 2) {
        // Add to existing zone
        zone.overlaps.push({ id: u.id, type: u.type })
        zone.intensity = Math.min(1, zone.intensity + u.intensity * 0.3)
        addedToZone = true
        break
      }
    }
    
    if (!addedToZone) {
      zones.push({
        position: u.position,
        radius: u.radius,
        type: u.type,
        primaryTeam: u.team,
        intensity: u.intensity,
        overlaps: [{ id: u.id, type: u.type }],
        isGap: false
      })
    }
  })
  
  return zones
}

/**
 * Calculate coverage statistics
 */
function calculateCoverageStats(
  utilities: UtilityInstance[],
  zones: CoverageZone[],
  mapBounds?: UtilityCoverageInput['mapBounds']
): CoverageStats {
  const mapArea = mapBounds ? mapBounds.width * mapBounds.height : 10000
  
  // Calculate coverage by team
  const attackerUtils = utilities.filter(u => u.team === 'attackers')
  const defenderUtils = utilities.filter(u => u.team === 'defenders')
  
  const attackerCoverage = calculateTeamCoverage(attackerUtils)
  const defenderCoverage = calculateTeamCoverage(defenderUtils)
  
  // Calculate overlap
  const overlapArea = calculateOverlapArea(attackerUtils, defenderUtils)
  
  // Calculate by type
  const byType: CoverageStats['byType'] = {
    smoke: { count: 0, coverage: 0, avgDuration: 0 },
    flash: { count: 0, coverage: 0, avgDuration: 0 },
    molly: { count: 0, coverage: 0, avgDuration: 0 },
    decoy: { count: 0, coverage: 0, avgDuration: 0 },
    recon: { count: 0, coverage: 0, avgDuration: 0 }
  }
  
  utilities.forEach(u => {
    const type = u.type
    byType[type].count++
    byType[type].coverage += Math.PI * u.radius * u.radius
    byType[type].avgDuration += (u.expiresAt - u.deployedAt)
  })
  
  Object.keys(byType).forEach(type => {
    const t = type as UtilityInstance['type']
    if (byType[t].count > 0) {
      byType[t].avgDuration /= byType[t].count
    }
  })
  
  // Calculate efficiency
  const totalCoverage = attackerCoverage + defenderCoverage - overlapArea
  const efficiency = Math.min(1, totalCoverage / (mapArea * 0.5))
  
  return {
    attackerCoverage,
    defenderCoverage,
    overlapArea,
    byType,
    efficiency
  }
}

/**
 * Calculate coverage area for a team
 */
function calculateTeamCoverage(utilities: UtilityInstance[]): number {
  // Simplified: sum of circle areas minus overlaps
  let total = 0
  const processed = new Set<string>()
  
  utilities.forEach(u1 => {
    let area = Math.PI * u1.radius * u1.radius
    
    utilities.forEach(u2 => {
      if (u1.id === u2.id || processed.has(u2.id)) return
      
      const dist = Math.sqrt(
        Math.pow(u1.position.x - u2.position.x, 2) + 
        Math.pow(u1.position.y - u2.position.y, 2)
      )
      
      if (dist < u1.radius + u2.radius) {
        // Subtract overlap area
        const overlap = calculateCircleOverlap(u1.radius, u2.radius, dist)
        area -= overlap * 0.5
      }
    })
    
    total += Math.max(0, area)
    processed.add(u1.id)
  })
  
  return total
}

/**
 * Calculate overlap area between two circles
 */
function calculateCircleOverlap(r1: number, r2: number, dist: number): number {
  if (dist >= r1 + r2) return 0
  if (dist <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2
  
  const d = dist
  const r1Sq = r1 * r1
  const r2Sq = r2 * r2
  
  const alpha = Math.acos((d * d + r1Sq - r2Sq) / (2 * d * r1))
  const beta = Math.acos((d * d + r2Sq - r1Sq) / (2 * d * r2))
  
  const area1 = r1Sq * alpha
  const area2 = r2Sq * beta
  const triangle = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2))
  
  return area1 + area2 - triangle
}

/**
 * Calculate overlap area between teams
 */
function calculateOverlapArea(
  attackerUtils: UtilityInstance[],
  defenderUtils: UtilityInstance[]
): number {
  let overlap = 0
  
  attackerUtils.forEach(a => {
    defenderUtils.forEach(d => {
      const dist = Math.sqrt(
        Math.pow(a.position.x - d.position.x, 2) + 
        Math.pow(a.position.y - d.position.y, 2)
      )
      overlap += calculateCircleOverlap(a.radius, d.radius, dist)
    })
  })
  
  return overlap
}

/**
 * Identify coverage gaps
 */
function identifyCoverageGaps(
  utilities: UtilityInstance[],
  sites?: UtilityCoverageInput['sites'],
  mapBounds?: UtilityCoverageInput['mapBounds']
): CoverageGap[] {
  const gaps: CoverageGap[] = []
  
  if (!sites) return gaps
  
  sites.forEach(site => {
    // Check coverage near site
    const coverageNearSite = utilities.filter(u => {
      const dist = Math.sqrt(
        Math.pow(u.position.x - site.x, 2) + 
        Math.pow(u.position.y - site.y, 2)
      )
      return dist < 30
    })
    
    if (coverageNearSite.length === 0) {
      gaps.push({
        position: { x: site.x, y: site.y },
        radius: 20,
        importance: site.importance > 0.7 ? 'critical' : site.importance > 0.4 ? 'high' : 'medium',
        nearSites: [site.id],
        suggestedUtility: 'smoke'
      })
    }
  })
  
  return gaps
}

/**
 * Analyze utility overlaps
 */
function analyzeOverlaps(utilities: UtilityInstance[]): UtilityCoverageLensData['overlaps'] {
  const overlaps: UtilityCoverageLensData['overlaps'] = []
  
  for (let i = 0; i < utilities.length; i++) {
    for (let j = i + 1; j < utilities.length; j++) {
      const u1 = utilities[i]
      const u2 = utilities[j]
      
      const dist = Math.sqrt(
        Math.pow(u1.position.x - u2.position.x, 2) + 
        Math.pow(u1.position.y - u2.position.y, 2)
      )
      
      if (dist < (u1.radius + u2.radius) / 2) {
        // Significant overlap
        const isWasteful = u1.team === u2.team && u1.type === u2.type
        
        overlaps.push({
          position: {
            x: (u1.position.x + u2.position.x) / 2,
            y: (u1.position.y + u2.position.y) / 2
          },
          radius: Math.min(u1.radius, u2.radius) * 0.5,
          utilities: [u1.id, u2.id],
          isWasteful
        })
      }
    }
  }
  
  return overlaps
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render utility coverage to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: UtilityCoverageRenderOptions): boolean {
  const {
    canvas,
    data,
    showLabels = true,
    showCoverage = true,
    showOverlaps = true,
    showGaps = true,
    teamFilter = null,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Filter utilities by team if needed
  const visibleUtilities = teamFilter 
    ? data.utilities.filter(u => u.team === teamFilter)
    : data.utilities
  
  // Render coverage heatmap
  if (showCoverage) {
    renderCoverageHeatmap(ctx, data.coverageHeatmap, animationProgress)
  }
  
  // Render utilities
  visibleUtilities.forEach(u => {
    renderUtility(ctx, u, showLabels, animationProgress)
  })
  
  // Render overlaps
  if (showOverlaps) {
    data.overlaps.forEach(overlap => {
      renderOverlap(ctx, overlap)
    })
  }
  
  // Render gaps
  if (showGaps) {
    data.gaps.forEach(gap => {
      renderGap(ctx, gap)
    })
  }
  
  // Render stats overlay
  renderStatsOverlay(ctx, data.stats)
  
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
    const intensity = cell.intensity * animationProgress * 0.4
    if (intensity < 0.05) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 4
    )
    gradient.addColorStop(0, `rgba(100, 116, 139, ${intensity})`)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Render a utility
 */
function renderUtility(
  ctx: CanvasRenderingContext2D,
  utility: UtilityInstance,
  showLabels: boolean,
  animationProgress: number
): void {
  const color = UTILITY_COLORS[utility.type]
  const teamColor = utility.team === 'attackers' 
    ? 'rgba(239, 68, 68, 0.3)' 
    : 'rgba(59, 130, 246, 0.3)'
  const radius = utility.radius * animationProgress
  
  ctx.save()
  
  // Coverage area
  const gradient = ctx.createRadialGradient(
    utility.position.x, utility.position.y, 0,
    utility.position.x, utility.position.y, radius
  )
  gradient.addColorStop(0, teamColor)
  gradient.addColorStop(0.7, teamColor.replace('0.3', '0.1'))
  gradient.addColorStop(1, 'transparent')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.globalAlpha = utility.status === 'fading' ? 0.5 : 0.8
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // Center marker
  ctx.fillStyle = color
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.arc(utility.position.x, utility.position.y, 2, 0, Math.PI * 2)
  ctx.fill()
  
  // Type icon
  if (showLabels) {
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '3px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icon = getUtilityIcon(utility.type)
    ctx.fillText(icon, utility.position.x, utility.position.y)
  }
  
  ctx.restore()
}

/**
 * Get icon character for utility type
 */
function getUtilityIcon(type: UtilityInstance['type']): string {
  switch (type) {
    case 'smoke': return 'S'
    case 'flash': return 'F'
    case 'molly': return 'M'
    case 'decoy': return 'D'
    case 'recon': return 'R'
    default: return '?'
  }
}

/**
 * Render overlap indicator
 */
function renderOverlap(
  ctx: CanvasRenderingContext2D,
  overlap: UtilityCoverageLensData['overlaps'][0]
): void {
  ctx.save()
  
  ctx.strokeStyle = overlap.isWasteful ? '#ef4444' : '#eab308'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  
  ctx.beginPath()
  ctx.arc(overlap.position.x, overlap.position.y, overlap.radius, 0, Math.PI * 2)
  ctx.stroke()
  
  if (overlap.isWasteful) {
    ctx.fillStyle = '#ef4444'
    ctx.font = '3px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('!', overlap.position.x, overlap.position.y)
  }
  
  ctx.restore()
}

/**
 * Render coverage gap
 */
function renderGap(ctx: CanvasRenderingContext2D, gap: CoverageGap): void {
  ctx.save()
  
  const importanceColors = {
    low: '#64748b',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444'
  }
  
  ctx.strokeStyle = importanceColors[gap.importance]
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  
  ctx.beginPath()
  ctx.arc(gap.position.x, gap.position.y, gap.radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // Gap marker
  ctx.fillStyle = importanceColors[gap.importance]
  ctx.beginPath()
  ctx.moveTo(gap.position.x, gap.position.y - 3)
  ctx.lineTo(gap.position.x + 3, gap.position.y + 3)
  ctx.lineTo(gap.position.x - 3, gap.position.y + 3)
  ctx.closePath()
  ctx.fill()
  
  ctx.restore()
}

/**
 * Render statistics overlay
 */
function renderStatsOverlay(ctx: CanvasRenderingContext2D, stats: CoverageStats): void {
  ctx.save()
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(2, 2, 40, 30)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '3px sans-serif'
  ctx.textAlign = 'left'
  
  ctx.fillText('Coverage Stats', 4, 5)
  ctx.fillText(`ATK: ${(stats.attackerCoverage / 100).toFixed(0)}u²`, 4, 11)
  ctx.fillText(`DEF: ${(stats.defenderCoverage / 100).toFixed(0)}u²`, 4, 16)
  ctx.fillText(`Overlap: ${(stats.overlapArea / 100).toFixed(0)}u²`, 4, 21)
  ctx.fillText(`Eff: ${(stats.efficiency * 100).toFixed(0)}%`, 4, 26)
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if position is covered by utility
 * @param position - Position to check
 * @param utilities - Active utilities
 * @returns True if covered
 */
export function isPositionCovered(
  position: { x: number; y: number },
  utilities: UtilityInstance[]
): boolean {
  return utilities.some(u => {
    const dist = Math.sqrt(
      Math.pow(u.position.x - position.x, 2) + 
      Math.pow(u.position.y - position.y, 2)
    )
    return dist < u.radius
  })
}

/**
 * Get utilities covering a position
 * @param position - Position to check
 * @param utilities - Active utilities
 * @returns Covering utilities
 */
export function getCoveringUtilities(
  position: { x: number; y: number },
  utilities: UtilityInstance[]
): UtilityInstance[] {
  return utilities.filter(u => {
    const dist = Math.sqrt(
      Math.pow(u.position.x - position.x, 2) + 
      Math.pow(u.position.y - position.y, 2)
    )
    return dist < u.radius
  })
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  isPositionCovered,
  getCoveringUtilities,
  UTILITY_COLORS,
  TEAM_COLORS,
  UTILITY_RADII,
  UTILITY_DURATIONS,
  DEFAULT_GRID_RESOLUTION
}
