/** [Ver001.000]
 * Push Probability Lens
 * =====================
 * Probability heatmap for site pushes based on player positions, utility, and timing.
 * 
 * Features:
 * - Multi-factor probability calculation
 * - Position-based likelihood scoring
 * - Utility availability impact
 * - Timing context integration
 * - Animated probability visualization
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Push probability data for a site */
export interface PushProbability {
  /** Site identifier */
  site: string
  /** Overall push probability (0.0 - 1.0) */
  probability: number
  /** Confidence in prediction (0.0 - 1.0) */
  confidence: number
  /** Contributing factors */
  factors: PushFactor[]
  /** Heatmap cells for this site */
  heatmapCells: HeatmapCell[]
  /** Recommended approach path */
  recommendedPath: Array<{ x: number; y: number }>
  /** Risk assessment */
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'extreme'
    factors: string[]
  }
}

/** Individual factor contributing to probability */
export interface PushFactor {
  /** Factor name */
  name: string
  /** Weight contribution (-1.0 to 1.0) */
  weight: number
  /** Factor description */
  description: string
  /** Category */
  category: 'position' | 'utility' | 'timing' | 'economy' | 'history'
}

/** Input data for push probability calculation */
export interface PushProbabilityInput {
  /** Current player positions */
  playerPositions: Array<{
    playerId: string
    team: 'attackers' | 'defenders'
    x: number
    y: number
    agent?: string
    health?: number
    hasUtility?: boolean
  }>
  /** Active utility on map */
  activeUtility: Array<{
    type: 'smoke' | 'flash' | 'molly' | 'trap'
    x: number
    y: number
    radius: number
    team: 'attackers' | 'defenders'
    expiresAt?: number
  }>
  /** Round timing info */
  roundTime: number
  /** Team economy */
  economy: {
    attackers: { totalMoney: number; canFullBuy: boolean }
    defenders: { totalMoney: number; canFullBuy: boolean }
  }
  /** Site configurations */
  sites: Array<{
    id: string
    x: number
    y: number
    entryPoints: Array<{ x: number; y: number; name: string }>
  }>
  /** Historical success rates */
  history?: Array<{
    site: string
    roundNumber: number
    wasSuccessful: boolean
    timeOfPush: number
  }>
}

/** Lens data output */
export interface PushProbabilityLensData {
  /** Probability data per site */
  sites: PushProbability[]
  /** Combined heatmap for all sites */
  combinedHeatmap: HeatmapCell[]
  /** Highest probability site */
  highestProbabilitySite?: string
  /** Overall recommendation */
  recommendation: {
    action: 'push' | 'fake' | 'rotate' | 'wait'
    target?: string
    confidence: number
    reasoning: string[]
  }
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface PushProbabilityRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: PushProbabilityLensData
  /** Show probability numbers */
  showNumbers?: boolean
  /** Show entry path recommendations */
  showPaths?: boolean
  /** Show risk indicators */
  showRisk?: boolean
  /** Minimum probability to display */
  probabilityThreshold?: number
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Factor weights for probability calculation */
export const FACTOR_WEIGHTS = {
  position: 0.35,
  utility: 0.25,
  timing: 0.20,
  economy: 0.15,
  history: 0.05
}

/** Risk thresholds */
export const RISK_THRESHOLDS = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
  extreme: 0.85
}

/** Color scale for probabilities */
export const PROBABILITY_COLORS = {
  veryLow: '#475569',   // Slate 600
  low: '#64748b',       // Slate 500
  medium: '#eab308',    // Yellow 500
  high: '#f97316',      // Orange 500
  veryHigh: '#ef4444'   // Red 500
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate push probabilities for all sites
 * @param input - Push probability input data
 * @returns Push probability lens data
 */
export function calculate(input: PushProbabilityInput): PushProbabilityLensData {
  const calculatedAt = Date.now()
  const sites: PushProbability[] = []
  
  // Calculate probability for each site
  input.sites.forEach(site => {
    const probability = calculateSiteProbability(site, input)
    sites.push(probability)
  })
  
  // Generate combined heatmap
  const combinedHeatmap = generateCombinedHeatmap(sites)
  
  // Find highest probability site
  const highestProbabilitySite = sites
    .sort((a, b) => b.probability - a.probability)[0]?.site
  
  // Generate recommendation
  const recommendation = generateRecommendation(sites, input)
  
  return {
    sites,
    combinedHeatmap,
    highestProbabilitySite,
    recommendation,
    calculatedAt
  }
}

/**
 * Calculate probability for a single site
 */
function calculateSiteProbability(
  site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushProbability {
  const factors: PushFactor[] = []
  
  // Position factor
  const positionFactor = calculatePositionFactor(site, input)
  factors.push(positionFactor)
  
  // Utility factor
  const utilityFactor = calculateUtilityFactor(site, input)
  factors.push(utilityFactor)
  
  // Timing factor
  const timingFactor = calculateTimingFactor(site, input)
  factors.push(timingFactor)
  
  // Economy factor
  const economyFactor = calculateEconomyFactor(site, input)
  factors.push(economyFactor)
  
  // History factor
  const historyFactor = calculateHistoryFactor(site, input)
  factors.push(historyFactor)
  
  // Calculate weighted probability
  let probability = 0.5 // Base probability
  factors.forEach(factor => {
    const weight = FACTOR_WEIGHTS[factor.category]
    probability += factor.weight * weight
  })
  
  // Clamp to valid range
  probability = Math.max(0, Math.min(1, probability))
  
  // Calculate confidence based on data quality
  const confidence = calculateConfidence(factors, input)
  
  // Generate heatmap cells
  const heatmapCells = generateSiteHeatmap(site, probability, factors)
  
  // Calculate recommended path
  const recommendedPath = calculateRecommendedPath(site, input)
  
  // Risk assessment
  const riskAssessment = calculateRiskAssessment(probability, factors, site, input)
  
  return {
    site: site.id,
    probability,
    confidence,
    factors,
    heatmapCells,
    recommendedPath,
    riskAssessment
  }
}

/**
 * Calculate position-based factor
 */
function calculatePositionFactor(
  site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushFactor {
  const attackers = input.playerPositions.filter(p => p.team === 'attackers')
  const defenders = input.playerPositions.filter(p => p.team === 'defenders')
  
  // Calculate proximity to site
  let attackerProximity = 0
  attackers.forEach(p => {
    const dist = Math.sqrt(Math.pow(p.x - site.x, 2) + Math.pow(p.y - site.y, 2))
    attackerProximity += Math.max(0, 1 - dist / 50)
  })
  attackerProximity = Math.min(1, attackerProximity / 3) // Normalize
  
  // Calculate defender presence
  let defenderPresence = 0
  defenders.forEach(p => {
    const dist = Math.sqrt(Math.pow(p.x - site.x, 2) + Math.pow(p.y - site.y, 2))
    defenderPresence += Math.max(0, 1 - dist / 40)
  })
  defenderPresence = Math.min(1, defenderPresence / 2)
  
  // Weight: more attackers nearby = higher push probability
  // More defenders = lower probability
  const weight = attackerProximity * 0.6 - defenderPresence * 0.4
  
  return {
    name: 'Player Positioning',
    weight,
    description: `Attacker proximity: ${(attackerProximity * 100).toFixed(0)}%, Defender presence: ${(defenderPresence * 100).toFixed(0)}%`,
    category: 'position'
  }
}

/**
 * Calculate utility-based factor
 */
function calculateUtilityFactor(
  site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushFactor {
  const attackerUtility = input.activeUtility.filter(u => u.team === 'attackers')
  const defenderUtility = input.activeUtility.filter(u => u.team === 'defenders')
  
  // Check utility near site
  let attackerCoverage = 0
  attackerUtility.forEach(u => {
    const dist = Math.sqrt(Math.pow(u.x - site.x, 2) + Math.pow(u.y - site.y, 2))
    if (dist < u.radius + 20) {
      attackerCoverage += u.type === 'smoke' ? 0.3 : u.type === 'flash' ? 0.2 : 0.1
    }
  })
  attackerCoverage = Math.min(1, attackerCoverage)
  
  let defenderCoverage = 0
  defenderUtility.forEach(u => {
    const dist = Math.sqrt(Math.pow(u.x - site.x, 2) + Math.pow(u.y - site.y, 2))
    if (dist < u.radius + 15) {
      defenderCoverage += u.type === 'smoke' ? 0.25 : u.type === 'molly' ? 0.3 : 0.15
    }
  })
  defenderCoverage = Math.min(1, defenderCoverage)
  
  const weight = attackerCoverage * 0.5 - defenderCoverage * 0.3
  
  return {
    name: 'Utility Control',
    weight,
    description: `Attack utility: ${(attackerCoverage * 100).toFixed(0)}%, Defense utility: ${(defenderCoverage * 100).toFixed(0)}%`,
    category: 'utility'
  }
}

/**
 * Calculate timing-based factor
 */
function calculateTimingFactor(
  _site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushFactor {
  const time = input.roundTime
  
  // Optimal execute window: 25-55 seconds
  let timeScore = 0
  if (time >= 20000 && time <= 60000) {
    timeScore = 0.5 // Good window
    if (time >= 30000 && time <= 50000) {
      timeScore = 1.0 // Optimal window
    }
  } else if (time < 20000) {
    timeScore = time / 40000 // Early round, lower probability
  } else {
    timeScore = Math.max(0, 1 - (time - 60000) / 40000) // Late round
  }
  
  return {
    name: 'Round Timing',
    weight: timeScore - 0.5, // Center around 0
    description: `Time score: ${(timeScore * 100).toFixed(0)}% (${(time / 1000).toFixed(1)}s)`,
    category: 'timing'
  }
}

/**
 * Calculate economy-based factor
 */
function calculateEconomyFactor(
  _site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushFactor {
  const attackBuy = input.economy.attackers.canFullBuy ? 1 : 0.5
  const defenseBuy = input.economy.defenders.canFullBuy ? 1 : 0.5
  
  // Advantage if attackers have full buy and defenders don't
  const weight = (attackBuy - defenseBuy) * 0.3
  
  return {
    name: 'Economy Status',
    weight,
    description: `Attack buy: ${(attackBuy * 100).toFixed(0)}%, Defense buy: ${(defenseBuy * 100).toFixed(0)}%`,
    category: 'economy'
  }
}

/**
 * Calculate history-based factor
 */
function calculateHistoryFactor(
  site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): PushFactor {
  if (!input.history || input.history.length === 0) {
    return {
      name: 'Historical Success',
      weight: 0,
      description: 'No historical data available',
      category: 'history'
    }
  }
  
  const siteHistory = input.history.filter(h => h.site === site.id)
  if (siteHistory.length === 0) {
    return {
      name: 'Historical Success',
      weight: 0,
      description: 'No data for this site',
      category: 'history'
    }
  }
  
  const successRate = siteHistory.filter(h => h.wasSuccessful).length / siteHistory.length
  const weight = (successRate - 0.5) * 0.4 // ±0.2 range
  
  return {
    name: 'Historical Success',
    weight,
    description: `Success rate: ${(successRate * 100).toFixed(0)}% (${siteHistory.length} attempts)`,
    category: 'history'
  }
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  factors: PushFactor[],
  input: PushProbabilityInput
): number {
  // Higher confidence with more data points
  let confidence = 0.5
  
  // More players visible = higher confidence
  confidence += Math.min(0.2, input.playerPositions.length * 0.02)
  
  // History available = higher confidence
  if (input.history && input.history.length > 0) {
    confidence += 0.1
  }
  
  // Consistent factor weights = higher confidence
  const significantFactors = factors.filter(f => Math.abs(f.weight) > 0.1).length
  confidence += significantFactors * 0.05
  
  return Math.min(1, confidence)
}

/**
 * Generate heatmap cells for a site
 */
function generateSiteHeatmap(
  site: PushProbabilityInput['sites'][0],
  probability: number,
  _factors: PushFactor[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const gridSize = 15
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = site.x - 30 + (i / gridSize) * 60
      const y = site.y - 30 + (j / gridSize) * 60
      
      // Distance falloff from site center
      const distFromCenter = Math.sqrt(Math.pow(x - site.x, 2) + Math.pow(y - site.y, 2))
      const centerInfluence = Math.max(0, 1 - distFromCenter / 30)
      
      // Entry point boost
      let entryBoost = 0
      site.entryPoints.forEach(entry => {
        const distToEntry = Math.sqrt(Math.pow(x - entry.x, 2) + Math.pow(y - entry.y, 2))
        entryBoost += Math.max(0, 1 - distToEntry / 15) * 0.3
      })
      
      const intensity = (probability * 0.6 + centerInfluence * 0.3 + entryBoost) * 0.8
      
      if (intensity > 0.1) {
        cells.push({ x, y, value: intensity, intensity: Math.min(1, intensity) })
      }
    }
  }
  
  return cells
}

/**
 * Calculate recommended entry path
 */
function calculateRecommendedPath(
  site: PushProbabilityInput['sites'][0],
  input: PushProbabilityInput
): Array<{ x: number; y: number }> {
  // Find best entry point based on attacker positions
  const attackers = input.playerPositions.filter(p => p.team === 'attackers')
  
  if (attackers.length === 0 || site.entryPoints.length === 0) {
    return [{ x: site.x, y: site.y }]
  }
  
  // Calculate average attacker position
  const avgX = attackers.reduce((sum, p) => sum + p.x, 0) / attackers.length
  const avgY = attackers.reduce((sum, p) => sum + p.y, 0) / attackers.length
  
  // Find closest entry point
  let bestEntry = site.entryPoints[0]
  let bestDist = Infinity
  
  site.entryPoints.forEach(entry => {
    const dist = Math.sqrt(Math.pow(entry.x - avgX, 2) + Math.pow(entry.y - avgY, 2))
    if (dist < bestDist) {
      bestDist = dist
      bestEntry = entry
    }
  })
  
  // Return path from entry to site center
  return [
    { x: bestEntry.x, y: bestEntry.y },
    { x: site.x, y: site.y }
  ]
}

/**
 * Calculate risk assessment
 */
function calculateRiskAssessment(
  probability: number,
  factors: PushFactor[],
  _site: PushProbabilityInput['sites'][0],
  _input: PushProbabilityInput
): PushProbability['riskAssessment'] {
  const riskFactors: string[] = []
  let riskScore = 0.5
  
  // High defender presence = high risk
  const positionFactor = factors.find(f => f.category === 'position')
  if (positionFactor && positionFactor.weight < -0.2) {
    riskScore += 0.2
    riskFactors.push('High defender presence')
  }
  
  // Poor timing = higher risk
  const timingFactor = factors.find(f => f.category === 'timing')
  if (timingFactor && timingFactor.weight < -0.1) {
    riskScore += 0.15
    riskFactors.push('Suboptimal timing')
  }
  
  // Defender utility = higher risk
  const utilityFactor = factors.find(f => f.category === 'utility')
  if (utilityFactor && utilityFactor.weight < -0.1) {
    riskScore += 0.15
    riskFactors.push('Defensive utility deployed')
  }
  
  // Low probability = high risk (it's risky because it might fail)
  if (probability < 0.3) {
    riskScore += 0.2
    riskFactors.push('Low success probability')
  }
  
  const level: PushProbability['riskAssessment']['level'] =
    riskScore < RISK_THRESHOLDS.low ? 'low' :
    riskScore < RISK_THRESHOLDS.medium ? 'medium' :
    riskScore < RISK_THRESHOLDS.high ? 'high' : 'extreme'
  
  return { level, factors: riskFactors }
}

/**
 * Generate combined heatmap from all sites
 */
function generateCombinedHeatmap(sites: PushProbability[]): HeatmapCell[] {
  const cellMap = new Map<string, HeatmapCell>()
  
  sites.forEach(site => {
    site.heatmapCells.forEach(cell => {
      const key = `${cell.x.toFixed(1)},${cell.y.toFixed(1)}`
      const existing = cellMap.get(key)
      
      if (existing) {
        existing.intensity = Math.max(existing.intensity, cell.intensity)
        existing.value = Math.max(existing.value, cell.value)
      } else {
        cellMap.set(key, { ...cell })
      }
    })
  })
  
  return Array.from(cellMap.values())
}

/**
 * Generate recommendation based on probabilities
 */
function generateRecommendation(
  sites: PushProbability[],
  _input: PushProbabilityInput
): PushProbabilityLensData['recommendation'] {
  const sorted = [...sites].sort((a, b) => b.probability - a.probability)
  const best = sorted[0]
  
  if (!best || best.probability < 0.3) {
    return {
      action: 'wait',
      confidence: 0.6,
      reasoning: ['No favorable push conditions detected', 'Consider gathering more information']
    }
  }
  
  if (best.probability > 0.7) {
    return {
      action: 'push',
      target: best.site,
      confidence: best.confidence,
      reasoning: [
        `High probability (${(best.probability * 100).toFixed(0)}%) for ${best.site}`,
        ...best.factors.filter(f => f.weight > 0).map(f => f.description)
      ]
    }
  }
  
  if (best.probability > 0.5) {
    return {
      action: 'fake',
      target: sorted[1]?.site,
      confidence: best.confidence * 0.8,
      reasoning: [
        `Moderate probability for ${best.site}`,
        'Consider faking then rotating',
        ...best.riskAssessment.factors.slice(0, 2)
      ]
    }
  }
  
  return {
    action: 'rotate',
    target: sorted[1]?.site,
    confidence: 0.5,
    reasoning: [
      `Low probability for ${best.site}`,
      `Consider ${sorted[1]?.site || 'alternative'} site`,
      ...best.riskAssessment.factors.slice(0, 2)
    ]
  }
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render push probability visualization
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: PushProbabilityRenderOptions): boolean {
  const {
    canvas,
    data,
    showNumbers = true,
    showPaths = true,
    showRisk = true,
    probabilityThreshold = 0.1,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Filter sites by threshold
  const visibleSites = data.sites.filter(s => s.probability >= probabilityThreshold)
  
  // Render heatmap for each site
  visibleSites.forEach(site => {
    renderSiteHeatmap(ctx, site, animationProgress)
  })
  
  // Render entry paths
  if (showPaths) {
    visibleSites.forEach(site => {
      renderEntryPath(ctx, site)
    })
  }
  
  // Render probability numbers
  if (showNumbers) {
    visibleSites.forEach(site => {
      renderProbabilityLabel(ctx, site)
    })
  }
  
  // Render risk indicators
  if (showRisk) {
    visibleSites.forEach(site => {
      renderRiskIndicator(ctx, site)
    })
  }
  
  // Render recommendation
  renderRecommendation(ctx, data.recommendation)
  
  ctx.restore()
  return true
}

/**
 * Render site heatmap
 */
function renderSiteHeatmap(
  ctx: CanvasRenderingContext2D,
  site: PushProbability,
  animationProgress: number
): void {
  const color = getProbabilityColor(site.probability)
  
  site.heatmapCells.forEach(cell => {
    const intensity = cell.intensity * animationProgress
    if (intensity < 0.05) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 5
    )
    gradient.addColorStop(0, color + Math.floor(intensity * 128).toString(16).padStart(2, '0'))
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 5, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Get color for probability value
 */
function getProbabilityColor(probability: number): string {
  if (probability < 0.2) return '#64748b' // Slate
  if (probability < 0.4) return '#eab308' // Yellow
  if (probability < 0.6) return '#f97316' // Orange
  if (probability < 0.8) return '#ef4444' // Red
  return '#dc2626' // Dark red
}

/**
 * Render entry path
 */
function renderEntryPath(ctx: CanvasRenderingContext2D, site: PushProbability): void {
  if (site.recommendedPath.length < 2) return
  
  ctx.strokeStyle = getProbabilityColor(site.probability)
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.6
  ctx.setLineDash([3, 3])
  
  ctx.beginPath()
  ctx.moveTo(site.recommendedPath[0].x, site.recommendedPath[0].y)
  for (let i = 1; i < site.recommendedPath.length; i++) {
    ctx.lineTo(site.recommendedPath[i].x, site.recommendedPath[i].y)
  }
  ctx.stroke()
  
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/**
 * Render probability label
 */
function renderProbabilityLabel(ctx: CanvasRenderingContext2D, site: PushProbability): void {
  // Calculate center of heatmap
  let centerX = 0, centerY = 0
  site.heatmapCells.forEach(c => {
    centerX += c.x
    centerY += c.y
  })
  centerX /= site.heatmapCells.length || 1
  centerY /= site.heatmapCells.length || 1
  
  const text = `${(site.probability * 100).toFixed(0)}%`
  ctx.font = 'bold 5px sans-serif'
  const metrics = ctx.measureText(text)
  
  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(centerX - metrics.width / 2 - 2, centerY - 4, metrics.width + 4, 8)
  
  // Text
  ctx.fillStyle = site.probability > 0.5 ? '#22c55e' : '#fbbf24'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, centerX, centerY)
}

/**
 * Render risk indicator
 */
function renderRiskIndicator(ctx: CanvasRenderingContext2D, site: PushProbability): void {
  const riskColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    extreme: '#ef4444'
  }
  
  const color = riskColors[site.riskAssessment.level]
  const x = site.heatmapCells[0]?.x || 50
  const y = (site.heatmapCells[0]?.y || 50) - 8
  
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 2, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Render recommendation
 */
function renderRecommendation(
  ctx: CanvasRenderingContext2D,
  recommendation: PushProbabilityLensData['recommendation']
): void {
  const actionColors = {
    push: '#22c55e',
    fake: '#eab308',
    rotate: '#3b82f6',
    wait: '#64748b'
  }
  
  const text = `${recommendation.action.toUpperCase()}${recommendation.target ? ` ${recommendation.target}` : ''}`
  ctx.font = 'bold 4px sans-serif'
  
  ctx.fillStyle = actionColors[recommendation.action]
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(text, 95, 5)
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  getProbabilityColor,
  FACTOR_WEIGHTS,
  RISK_THRESHOLDS,
  PROBABILITY_COLORS
}
