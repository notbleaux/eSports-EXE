/** [Ver001.000]
 * Anchor Performance Lens - SpecMap V2 Tactical Lens
 * 
 * Analyzes site anchor player performance and hold success rates.
 * Reveals optimal anchor positions, strengths, and improvement areas.
 * 
 * Features:
 * - Site anchor player analysis
 * - Hold success rate tracking
 * - Multi-kill and KAST metrics
 * - Position-specific recommendations
 * - Best practice identification
 */

import type {
  AnchorPerformanceData,
  AnchorPerformance,
  AnchorHold,
  AnchorMetrics,
  AnchorBestPractice,
  SiteAnchorAnalysis,
  Player,
  MapBounds,
  Site,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Minimum holds for reliable statistics */
export const MIN_HOLDS_FOR_STATS = 5

/** Position evaluation radius */
export const ANCHOR_POSITION_RADIUS = 250

/** Hold success time thresholds (seconds) */
export const HOLD_TIMES = {
  instant: 5,    // Died immediately
  short: 15,     // Brief hold
  standard: 30,  // Normal hold
  extended: 45   // Long hold
}

/** KAST calculation weights */
export const KAST_WEIGHTS = {
  kill: 1.0,
  assist: 0.75,
  survival: 1.0,
  traded: 0.5
}

/** Colors for anchor visualization */
export const ANCHOR_COLORS = {
  performance: {
    excellent: 'rgba(0, 255, 100, 0.8)',
    good: 'rgba(150, 255, 100, 0.7)',
    average: 'rgba(255, 255, 100, 0.6)',
    poor: 'rgba(255, 150, 100, 0.6)',
    bad: 'rgba(255, 80, 80, 0.7)'
  },
  site: {
    a: 'rgba(255, 100, 100, 0.4)',
    b: 'rgba(100, 150, 255, 0.4)',
    c: 'rgba(100, 255, 150, 0.4)',
    mid: 'rgba(255, 200, 100, 0.4)'
  },
  hold: {
    success: 'rgba(0, 200, 100, 0.6)',
    death: 'rgba(255, 80, 80, 0.6)',
    rotated: 'rgba(200, 200, 100, 0.6)',
    saved: 'rgba(100, 200, 255, 0.6)'
  },
  support: 'rgba(200, 150, 255, 0.4)',
  utility: 'rgba(255, 200, 100, 0.5)'
}

// ============================================================================
// Types
// ============================================================================

/** Anchor calculation options */
export interface AnchorOptions {
  minHolds?: number
  considerSupport?: boolean
  considerUtility?: boolean
  siteFocus?: string
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Raw anchor hold data from match */
export interface RawHoldData {
  roundId: string
  playerId: string
  playerName: string
  site: string
  position: Vector2D
  outcome: 'success' | 'death' | 'rotated' | 'saved'
  kills: number
  damageDealt: number
  utilityUsed: string[]
  survivalTime: number
  supportTime: number
  callouts: string[]
  assistedKills: number
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate anchor performance analysis
 * @param players - Array of player data
 * @param mapBounds - Map boundary information
 * @param rawHolds - Raw hold data from matches
 * @param options - Calculation options
 * @returns Anchor performance data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  rawHolds: RawHoldData[] = [],
  options: AnchorOptions = {}
): LensResult<AnchorPerformanceData> {
  const {
    minHolds = MIN_HOLDS_FOR_STATS,
    considerSupport = true,
    considerUtility = true,
    siteFocus
  } = options

  const defenders = players.filter(p => p.team === 'defenders')
  const sites = siteFocus
    ? mapBounds.sites.filter(s => s.name.toLowerCase() === siteFocus.toLowerCase())
    : mapBounds.sites

  // Process hold data
  const holds = rawHolds.length > 0
    ? processRawHolds(rawHolds)
    : generateSyntheticHolds(defenders, sites)

  // Calculate anchor performance
  const anchors = calculateAnchorPerformance(holds, minHolds, considerSupport, considerUtility)

  // Calculate site analysis
  const siteAnalysis = calculateSiteAnalysis(holds, sites, anchors)

  // Generate best practices
  const bestPractices = generateBestPractices(anchors, siteAnalysis, sites)

  const data: AnchorPerformanceData = {
    anchors,
    siteAnalysis,
    bestPractices
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(anchors.length, holds.length),
      sampleSize: holds.length
    }
  }
}

/**
 * Process raw hold data
 */
function processRawHolds(rawHolds: RawHoldData[]): AnchorHold[] {
  return rawHolds.map(raw => ({
    roundId: raw.roundId,
    outcome: raw.outcome,
    kills: raw.kills,
    damageDealt: raw.damageDealt,
    utilityUsed: raw.utilityUsed,
    callouts: raw.callouts,
    survivalTime: raw.survivalTime,
    supportReceived: raw.supportTime
  }))
}

/**
 * Generate synthetic hold data
 */
function generateSyntheticHolds(
  defenders: Player[],
  sites: Site[]
): AnchorHold[] {
  const holds: AnchorHold[] = []

  for (const site of sites) {
    for (const defender of defenders.slice(0, 3)) {
      for (let i = 0; i < 8; i++) {
        const outcomes: AnchorHold['outcome'][] = ['success', 'death', 'rotated', 'saved']
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]

        holds.push({
          roundId: `round-${site.name}-${defender.id}-${i}`,
          outcome,
          kills: outcome === 'success' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
          damageDealt: Math.floor(Math.random() * 200) + 50,
          utilityUsed: Math.random() > 0.5 ? ['smoke', 'molly'] : ['flash'],
          callouts: Math.random() > 0.7 ? ['enemy_count', 'utility_used'] : [],
          survivalTime: outcome === 'death' ? Math.random() * 20 : Math.random() * 40 + 10,
          supportReceived: Math.random() * 15
        })
      }
    }
  }

  return holds
}

/**
 * Calculate anchor performance metrics
 */
function calculateAnchorPerformance(
  holds: AnchorHold[],
  minHolds: number,
  considerSupport: boolean,
  considerUtility: boolean
): AnchorPerformance[] {
  // Group holds by player (using synthetic grouping for demo)
  const playerHolds = new Map<string, AnchorHold[]>()
  
  for (let i = 0; i < holds.length; i++) {
    const playerId = `player-${(i % 5) + 1}`
    if (!playerHolds.has(playerId)) {
      playerHolds.set(playerId, [])
    }
    playerHolds.get(playerId)!.push(holds[i])
  }

  const anchors: AnchorPerformance[] = []

  for (const [playerId, playerHoldList] of playerHolds) {
    if (playerHoldList.length < minHolds) continue

    // Calculate site (simplified - would come from hold data)
    const site = playerId.includes('1') || playerId.includes('2') ? 'A' : 'B'

    // Calculate metrics
    const metrics = calculateAnchorMetrics(playerHoldList, considerSupport, considerUtility)

    // Identify strengths
    const strengths = identifyStrengths(metrics, playerHoldList)

    // Identify weaknesses
    const weaknesses = identifyWeaknesses(metrics, playerHoldList)

    anchors.push({
      playerId,
      site,
      rounds: playerHoldList.length,
      holds: playerHoldList,
      metrics,
      strengths,
      weaknesses
    })
  }

  return anchors.sort((a, b) => b.metrics.holdSuccessRate - a.metrics.holdSuccessRate)
}

/**
 * Calculate anchor metrics
 */
function calculateAnchorMetrics(
  holds: AnchorHold[],
  considerSupport: boolean,
  considerUtility: boolean
): AnchorMetrics {
  const successes = holds.filter(h => h.outcome === 'success').length
  const totalKills = holds.reduce((sum, h) => sum + h.kills, 0)
  const deaths = holds.filter(h => h.outcome === 'death').length

  // Calculate KAST
  const kastEntries = holds.filter(h => 
    h.kills > 0 || 
    h.damageDealt > 100 || 
    h.outcome === 'success' || 
    h.outcome === 'saved'
  ).length
  const kast = holds.length > 0 ? kastEntries / holds.length : 0

  // Calculate first contact survival
  const survivedFirstContact = holds.filter(h => 
    h.survivalTime > 5 || h.outcome === 'success'
  ).length
  const firstContactSurvival = holds.length > 0 ? survivedFirstContact / holds.length : 0

  // Calculate multi-kill rate
  const multiKills = holds.filter(h => h.kills >= 2).length
  const multiKillRate = holds.length > 0 ? multiKills / holds.length : 0

  // Calculate average delay time
  const delayTime = holds.reduce((sum, h) => sum + h.survivalTime, 0) / holds.length

  // Calculate trade efficiency
  const traded = holds.filter(h => h.outcome === 'saved').length
  const tradeEfficiency = deaths > 0 ? traded / deaths : 0

  // Support modifier
  const supportBonus = considerSupport 
    ? holds.reduce((sum, h) => sum + h.supportReceived, 0) / (holds.length * 100)
    : 0

  // Utility modifier
  const utilityBonus = considerUtility
    ? holds.reduce((sum, h) => sum + h.utilityUsed.length, 0) / (holds.length * 4)
    : 0

  return {
    holdSuccessRate: successes / holds.length,
    averageKills: totalKills / holds.length,
    kast: Math.min(1, kast + supportBonus * 0.1),
    firstContactSurvival,
    multiKillRate,
    delayTime,
    tradeEfficiency: Math.min(1, tradeEfficiency + utilityBonus * 0.1)
  }
}

/**
 * Identify player strengths
 */
function identifyStrengths(metrics: AnchorMetrics, holds: AnchorHold[]): string[] {
  const strengths: string[] = []

  if (metrics.multiKillRate > 0.3) {
    strengths.push('multi_kill_potential')
  }
  if (metrics.firstContactSurvival > 0.7) {
    strengths.push('first_contact_survival')
  }
  if (metrics.delayTime > 25) {
    strengths.push('extended_holds')
  }
  if (metrics.tradeEfficiency > 0.5) {
    strengths.push('trading_efficiency')
  }
  if (metrics.kast > 0.8) {
    strengths.push('high_kast')
  }

  // Check utility usage
  const avgUtility = holds.reduce((sum, h) => sum + h.utilityUsed.length, 0) / holds.length
  if (avgUtility > 1.5) {
    strengths.push('utility_usage')
  }

  return strengths
}

/**
 * Identify player weaknesses
 */
function identifyWeaknesses(metrics: AnchorMetrics, holds: AnchorHold[]): string[] {
  const weaknesses: string[] = []

  if (metrics.holdSuccessRate < 0.4) {
    weaknesses.push('low_hold_success')
  }
  if (metrics.firstContactSurvival < 0.4) {
    weaknesses.push('first_contact_deaths')
  }
  if (metrics.multiKillRate < 0.1) {
    weaknesses.push('limited_multi_kills')
  }
  if (metrics.tradeEfficiency < 0.3) {
    weaknesses.push('poor_trading')
  }

  // Check for early deaths
  const earlyDeaths = holds.filter(h => h.outcome === 'death' && h.survivalTime < 10).length
  if (earlyDeaths > holds.length * 0.4) {
    weaknesses.push('early_deaths')
  }

  return weaknesses
}

/**
 * Calculate site analysis
 */
function calculateSiteAnalysis(
  holds: AnchorHold[],
  sites: Site[],
  anchors: AnchorPerformance[]
): Record<string, SiteAnchorAnalysis> {
  const analysis: Record<string, SiteAnchorAnalysis> = {}

  for (const site of sites) {
    // Group holds by site (simplified)
    const siteHolds = holds.filter((_, i) => i % sites.length === sites.indexOf(site))
    const siteAnchors = anchors.filter(a => a.site === site.name)

    if (siteHolds.length === 0) continue

    const successes = siteHolds.filter(h => h.outcome === 'success').length
    const avgUtility = siteHolds.reduce((sum, h) => sum + h.utilityUsed.length, 0) / siteHolds.length

    // Find preferred anchor
    const preferredAnchor = siteAnchors.length > 0
      ? siteAnchors.reduce((best, current) => 
          current.metrics.holdSuccessRate > best.metrics.holdSuccessRate ? current : best
        ).playerId
      : 'Unknown'

    // Identify weak points (simplified - would use actual position data)
    const weakPoints: Vector2D[] = []
    if (successes / siteHolds.length < 0.5) {
      // Add weak points around site
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2
        weakPoints.push({
          x: site.position.x + Math.cos(angle) * site.radius * 1.5,
          y: site.position.y + Math.sin(angle) * site.radius * 1.5
        })
      }
    }

    analysis[site.name] = {
      site: site.name,
      preferredAnchor,
      holdSuccessRate: successes / siteHolds.length,
      averageUtilityUsed: avgUtility,
      weakPoints
    }
  }

  return analysis
}

/**
 * Generate best practices
 */
function generateBestPractices(
  anchors: AnchorPerformance[],
  siteAnalysis: Record<string, SiteAnchorAnalysis>,
  sites: Site[]
): AnchorBestPractice[] {
  const practices: AnchorBestPractice[] = []

  // Practice 1: Based on best anchor
  const bestAnchor = anchors[0]
  if (bestAnchor) {
    practices.push({
      situation: `Holding ${bestAnchor.site} site`,
      recommendation: 'Use utility early to delay, reposition after first contact',
      successRate: bestAnchor.metrics.holdSuccessRate,
      examplePositions: sites.find(s => s.name === bestAnchor.site) 
        ? [{ x: 0, y: 0 }, { x: 100, y: 100 }] 
        : []
    })
  }

  // Practice 2: Multi-kill positioning
  const multiKillAnchor = anchors.find(a => a.strengths.includes('multi_kill_potential'))
  if (multiKillAnchor) {
    practices.push({
      situation: 'Multi-kill opportunities',
      recommendation: 'Position for crossfire angles, use first kill to set up second',
      successRate: multiKillAnchor.metrics.multiKillRate,
      examplePositions: []
    })
  }

  // Practice 3: Delay tactics
  const delayAnchor = anchors.find(a => a.strengths.includes('extended_holds'))
  if (delayAnchor) {
    practices.push({
      situation: 'Buying time for rotations',
      recommendation: 'Use all utility for delay, prioritize survival over kills',
      successRate: delayAnchor.metrics.holdSuccessRate,
      examplePositions: []
    })
  }

  // Practice 4: Site-specific advice
  for (const [siteName, siteData] of Object.entries(siteAnalysis)) {
    if (siteData.weakPoints.length > 0) {
      practices.push({
        situation: `${siteName} site weak points`,
        recommendation: 'Focus on weak angles, request teammate coverage',
        successRate: siteData.holdSuccessRate,
        examplePositions: siteData.weakPoints
      })
    }
  }

  return practices
}

/**
 * Calculate confidence score
 */
function calculateConfidence(anchorCount: number, holdCount: number): number {
  const baseConfidence = 0.6
  const anchorBonus = Math.min(0.2, anchorCount * 0.04)
  const holdBonus = Math.min(0.2, holdCount * 0.01)
  return Math.min(1.0, baseConfidence + anchorBonus + holdBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render anchor performance to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<AnchorPerformanceData>,
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

  // Render sites
  renderSites(ctx, data.siteAnalysis)

  // Render anchor performances
  for (const anchor of data.anchors) {
    renderAnchor(ctx, anchor, data.siteAnalysis[anchor.site])
  }

  // Render weak points
  for (const analysis of Object.values(data.siteAnalysis)) {
    renderWeakPoints(ctx, analysis)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render sites
 */
function renderSites(
  ctx: CanvasRenderingContext2D,
  siteAnalysis: Record<string, SiteAnchorAnalysis>
): void {
  for (const [siteName, analysis] of Object.entries(siteAnalysis)) {
    // Get site color based on success rate
    let color = ANCHOR_COLORS.performance.poor
    if (analysis.holdSuccessRate > 0.7) {
      color = ANCHOR_COLORS.performance.excellent
    } else if (analysis.holdSuccessRate > 0.5) {
      color = ANCHOR_COLORS.performance.good
    } else if (analysis.holdSuccessRate > 0.35) {
      color = ANCHOR_COLORS.performance.average
    }

    // Draw site area
    ctx.beginPath()
    ctx.arc(100, 100 + Object.keys(siteAnalysis).indexOf(siteName) * 200, 80, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Site label
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(siteName.toUpperCase(), 100, 95 + Object.keys(siteAnalysis).indexOf(siteName) * 200)
  }
}

/**
 * Render anchor performance
 */
function renderAnchor(
  ctx: CanvasRenderingContext2D,
  anchor: AnchorPerformance,
  siteData: SiteAnchorAnalysis
): void {
  const siteIndex = Object.keys(siteData || {}).length || 0
  const baseX = 200 + (parseInt(anchor.playerId.split('-')[1] || '0') * 80)
  const baseY = 100 + siteIndex * 200

  // Determine color based on metrics
  let color = ANCHOR_COLORS.performance.poor
  if (anchor.metrics.holdSuccessRate > 0.7) {
    color = ANCHOR_COLORS.performance.excellent
  } else if (anchor.metrics.holdSuccessRate > 0.5) {
    color = ANCHOR_COLORS.performance.good
  } else if (anchor.metrics.holdSuccessRate > 0.35) {
    color = ANCHOR_COLORS.performance.average
  }

  // Draw anchor indicator
  ctx.beginPath()
  ctx.arc(baseX, baseY, 25, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  
  ctx.strokeStyle = anchor.playerId === siteData?.preferredAnchor 
    ? 'rgba(255, 215, 0, 1)' // Gold for preferred
    : 'white'
  ctx.lineWidth = anchor.playerId === siteData?.preferredAnchor ? 3 : 2
  ctx.stroke()

  // Player ID
  ctx.font = 'bold 10px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(anchor.playerId.split('-')[1] || 'P', baseX, baseY)

  // Stats
  ctx.font = '9px sans-serif'
  ctx.fillText(`${(anchor.metrics.holdSuccessRate * 100).toFixed(0)}%`, baseX, baseY + 35)
  ctx.fillText(`${anchor.metrics.averageKills.toFixed(1)}K`, baseX, baseY + 45)
}

/**
 * Render weak points
 */
function renderWeakPoints(
  ctx: CanvasRenderingContext2D,
  analysis: SiteAnchorAnalysis
): void {
  for (const point of analysis.weakPoints) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 15, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Warning icon
    ctx.font = '12px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText('!', point.x, point.y + 4)
  }
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: AnchorPerformanceData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Anchors Analyzed: ${data.anchors.length}`, 10, y)
  y += 20

  // Calculate average metrics
  const avgSuccess = data.anchors.length > 0
    ? data.anchors.reduce((sum, a) => sum + a.metrics.holdSuccessRate, 0) / data.anchors.length
    : 0
  ctx.fillText(`Avg Hold Success: ${(avgSuccess * 100).toFixed(0)}%`, 10, y)
  y += 20

  const avgKast = data.anchors.length > 0
    ? data.anchors.reduce((sum, a) => sum + a.metrics.kast, 0) / data.anchors.length
    : 0
  ctx.fillText(`Avg KAST: ${(avgKast * 100).toFixed(0)}%`, 10, y)
  y += 25

  // Best practices
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Best Practices:', 10, y)
  y += 18

  ctx.font = '10px sans-serif'
  for (const practice of data.bestPractices.slice(0, 3)) {
    const shortRec = practice.recommendation.length > 35
      ? practice.recommendation.substring(0, 35) + '...'
      : practice.recommendation
    ctx.fillText(`• ${shortRec}`, 10, y)
    y += 14
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate hold quality rating
 */
export function calculateHoldQuality(hold: AnchorHold): number {
  let score = 0

  // Kills
  score += hold.kills * 0.25

  // Survival time
  score += Math.min(1, hold.survivalTime / 30) * 0.3

  // Outcome
  switch (hold.outcome) {
    case 'success':
      score += 0.4
      break
    case 'saved':
      score += 0.2
      break
    case 'rotated':
      score += 0.15
      break
    case 'death':
      score += hold.kills > 0 ? 0.1 : 0
      break
  }

  // Utility usage
  score += hold.utilityUsed.length * 0.05

  return Math.min(1, score)
}

/**
 * Get performance tier
 */
export function getPerformanceTier(metrics: AnchorMetrics): string {
  const overall = (
    metrics.holdSuccessRate * 0.3 +
    metrics.kast * 0.25 +
    metrics.multiKillRate * 0.2 +
    metrics.firstContactSurvival * 0.15 +
    metrics.tradeEfficiency * 0.1
  )

  if (overall > 0.8) return 'Excellent'
  if (overall > 0.65) return 'Good'
  if (overall > 0.5) return 'Average'
  if (overall > 0.35) return 'Below Average'
  return 'Poor'
}

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
  calculateHoldQuality,
  getPerformanceTier,
  MIN_HOLDS_FOR_STATS,
  HOLD_TIMES,
  KAST_WEIGHTS,
  ANCHOR_COLORS
}
