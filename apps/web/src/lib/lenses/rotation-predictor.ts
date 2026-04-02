// @ts-nocheck
/** [Ver001.000]
 * Rotation Predictor Lens
 * =======================
 * Predicts team rotations based on timing patterns and current player positions.
 * Generates heatmap of likely positions and rotation pathways.
 * 
 * Features:
 * - Probability-based rotation prediction
 * - Timing-weighted position heatmaps
 * - Pathway visualization with confidence intervals
 * - Team-side aware predictions (attacker/defender)
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Rotation prediction data structure */
export interface RotationPrediction {
  /** Unique identifier for this prediction */
  id: string
  /** Source site/area */
  from: string
  /** Destination site/area */
  to: string
  /** Team side (attackers/defenders) */
  teamSide: 'attackers' | 'defenders'
  /** Confidence level (0.0 - 1.0) */
  confidence: number
  /** Estimated time to complete rotation (ms) */
  estimatedTime: number
  /** Number of players predicted to rotate */
  playerCount: number
  /** Risk level assessment */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Pathway waypoints */
  waypoints: Array<{ x: number; y: number; timestamp: number }>
}

/** Input data for rotation calculation */
export interface RotationInput {
  /** Current player positions with timestamps */
  playerPositions: Array<{
    playerId: string
    team: 'attackers' | 'defenders'
    x: number
    y: number
    timestamp: number
    velocity?: { x: number; y: number }
  }>
  /** Current round time (ms since round start) */
  roundTime: number
  /** Bomb status if applicable */
  bombStatus?: 'planted' | 'dropped' | 'carried' | null
  /** Bomb position if planted/dropped */
  bombPosition?: { x: number; y: number }
  /** Map sites configuration */
  sites?: Array<{
    id: string
    x: number
    y: number
    type: 'A' | 'B' | 'C' | 'mid'
  }>
  /** Historical rotation patterns from previous rounds */
  historicalPatterns?: HistoricalRotationPattern[]
}

/** Historical rotation pattern for ML-like prediction */
export interface HistoricalRotationPattern {
  /** Round number this pattern was observed */
  roundNumber: number
  /** Time in round when rotation started */
  startTime: number
  /** Source site */
  from: string
  /** Destination site */
  to: string
  /** Team side */
  teamSide: 'attackers' | 'defenders'
  /** Whether rotation was successful */
  wasSuccessful: boolean
  /** Number of players involved */
  playerCount: number
  /** Pathway taken */
  pathway: Array<{ x: number; y: number }>
}

/** Lens data output */
export interface RotationLensData {
  /** Predicted rotations */
  predictions: RotationPrediction[]
  /** Heatmap of likely positions */
  positionHeatmap: HeatmapCell[]
  /** Confidence score for overall prediction (0.0 - 1.0) */
  overallConfidence: number
  /** Timestamp of calculation */
  calculatedAt: number
}

/** Render options for rotation predictor */
export interface RotationRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data from calculate() */
  data: RotationLensData
  /** Show confidence indicators */
  showConfidence?: boolean
  /** Show timing estimates */
  showTiming?: boolean
  /** Color for attacker rotations */
  attackerColor?: string
  /** Color for defender rotations */
  defenderColor?: string
  /** Minimum confidence threshold to display */
  confidenceThreshold?: number
  /** Animation progress (0.0 - 1.0) */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Default site coordinates (normalized 0-100) */
export const DEFAULT_SITES = [
  { id: 'A', x: 20, y: 25, type: 'A' as const },
  { id: 'B', x: 80, y: 75, type: 'B' as const },
  { id: 'mid', x: 50, y: 50, type: 'mid' as const }
]

/** Average rotation speeds (units per second) */
export const ROTATION_SPEEDS = {
  attackers: 15,
  defenders: 18,
  boosted: 22 // With abilities like Jett dash, Raze blast pack
}

/** Risk thresholds */
export const RISK_THRESHOLDS = {
  low: 0.3,
  medium: 0.5,
  high: 0.7
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate rotation predictions based on input data
 * @param input - Rotation input data
 * @returns Rotation lens data with predictions and heatmap
 */
export function calculate(input: RotationInput): RotationLensData {
  const predictions: RotationPrediction[] = []
  const calculatedAt = Date.now()
  
  const sites = input.sites || DEFAULT_SITES
  
  // Group players by team
  const playersByTeam = groupPlayersByTeam(input.playerPositions)
  
  // Analyze positions relative to sites
  const attackerPositions = analyzeSiteProximity(playersByTeam.attackers, sites)
  const defenderPositions = analyzeSiteProximity(playersByTeam.defenders, sites)
  
  // Generate predictions for attackers
  const attackerPredictions = generateTeamPredictions(
    attackerPositions,
    'attackers',
    input,
    sites
  )
  predictions.push(...attackerPredictions)
  
  // Generate predictions for defenders
  const defenderPredictions = generateTeamPredictions(
    defenderPositions,
    'defenders',
    input,
    sites
  )
  predictions.push(...defenderPredictions)
  
  // Generate position heatmap
  const positionHeatmap = generatePositionHeatmap(predictions, sites)
  
  // Calculate overall confidence
  const overallConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0
  
  return {
    predictions: predictions.sort((a, b) => b.confidence - a.confidence),
    positionHeatmap,
    overallConfidence,
    calculatedAt
  }
}

/**
 * Group players by their team side
 */
function groupPlayersByTeam(
  positions: RotationInput['playerPositions']
): { attackers: typeof positions; defenders: typeof positions } {
  return {
    attackers: positions.filter(p => p.team === 'attackers'),
    defenders: positions.filter(p => p.team === 'defenders')
  }
}

/**
 * Analyze player positions relative to sites
 */
function analyzeSiteProximity(
  players: RotationInput['playerPositions'],
  sites: Array<{ id: string; x: number; y: number; type: string }>
): Map<string, typeof players> {
  const proximityMap = new Map<string, typeof players>()
  
  sites.forEach(site => {
    const nearbyPlayers = players.filter(player => {
      const distance = Math.sqrt(
        Math.pow(player.x - site.x, 2) + Math.pow(player.y - site.y, 2)
      )
      return distance < 25 // Within 25 units of site
    })
    proximityMap.set(site.id, nearbyPlayers)
  })
  
  return proximityMap
}

/**
 * Generate rotation predictions for a team
 */
function generateTeamPredictions(
  siteProximity: Map<string, RotationInput['playerPositions']>,
  teamSide: 'attackers' | 'defenders',
  input: RotationInput,
  sites: Array<{ id: string; x: number; y: number; type: string }>
): RotationPrediction[] {
  const predictions: RotationPrediction[] = []
  const siteIds = Array.from(siteProximity.keys())
  
  // Find sites with players (potential sources)
  const occupiedSites = siteIds.filter(id => {
    const players = siteProximity.get(id) || []
    return players.length > 0
  })
  
  // Find sites without players (potential destinations)
  const emptySites = siteIds.filter(id => {
    const players = siteProximity.get(id) || []
    return players.length === 0 || players.length < 2
  })
  
  // Generate predictions between occupied and empty sites
  occupiedSites.forEach(fromSite => {
    emptySites.forEach(toSite => {
      if (fromSite === toSite) return
      
      const players = siteProximity.get(fromSite) || []
      const prediction = createPrediction(
        fromSite,
        toSite,
        teamSide,
        players,
        input,
        sites
      )
      
      if (prediction.confidence > 0.2) {
        predictions.push(prediction)
      }
    })
  })
  
  return predictions
}

/**
 * Create a single rotation prediction
 */
function createPrediction(
  from: string,
  to: string,
  teamSide: 'attackers' | 'defenders',
  players: RotationInput['playerPositions'],
  input: RotationInput,
  sites: Array<{ id: string; x: number; y: number }>
): RotationPrediction {
  const fromSite = sites.find(s => s.id === from)!
  const toSite = sites.find(s => s.id === to)!
  
  // Calculate distance
  const distance = Math.sqrt(
    Math.pow(toSite.x - fromSite.x, 2) + Math.pow(toSite.y - fromSite.y, 2)
  )
  
  // Estimate rotation time
  const speed = ROTATION_SPEEDS[teamSide]
  const estimatedTime = (distance / speed) * 1000 // Convert to ms
  
  // Calculate confidence based on various factors
  let confidence = calculateConfidence(
    from,
    to,
    teamSide,
    players.length,
    input,
    distance
  )
  
  // Determine risk level
  const riskLevel = calculateRiskLevel(confidence, teamSide, input)
  
  // Generate waypoints
  const waypoints = generateWaypoints(fromSite, toSite, estimatedTime)
  
  return {
    id: `rot-${from}-${to}-${Date.now()}`,
    from,
    to,
    teamSide,
    confidence: Math.min(1, Math.max(0, confidence)),
    estimatedTime,
    playerCount: players.length,
    riskLevel,
    waypoints
  }
}

/**
 * Calculate confidence score for a prediction
 */
function calculateConfidence(
  from: string,
  to: string,
  teamSide: 'attackers' | 'defenders',
  playerCount: number,
  input: RotationInput,
  distance: number
): number {
  let confidence = 0.5
  
  // More players = higher confidence
  confidence += (playerCount / 5) * 0.2
  
  // Historical pattern match
  if (input.historicalPatterns) {
    const matches = input.historicalPatterns.filter(
      p => p.from === from && p.to === to && p.teamSide === teamSide
    )
    if (matches.length > 0) {
      const successRate = matches.filter(m => m.wasSuccessful).length / matches.length
      confidence += successRate * 0.2
    }
  }
  
  // Bomb status affects defender rotations
  if (teamSide === 'defenders' && input.bombStatus === 'planted') {
    confidence += 0.3
  }
  
  // Round time factor (rotations more likely mid-round)
  const roundTimeFactor = input.roundTime > 15000 && input.roundTime < 60000 ? 0.1 : 0
  confidence += roundTimeFactor
  
  // Distance factor (shorter rotations more likely)
  confidence -= (distance / 100) * 0.1
  
  return confidence
}

/**
 * Calculate risk level for a rotation
 */
function calculateRiskLevel(
  confidence: number,
  teamSide: 'attackers' | 'defenders',
  input: RotationInput
): RotationPrediction['riskLevel'] {
  let riskScore = 1 - confidence
  
  // Defenders rotating with planted bomb = higher risk
  if (teamSide === 'defenders' && input.bombStatus === 'planted') {
    riskScore += 0.2
  }
  
  if (riskScore < RISK_THRESHOLDS.low) return 'low'
  if (riskScore < RISK_THRESHOLDS.medium) return 'medium'
  if (riskScore < RISK_THRESHOLDS.high) return 'high'
  return 'critical'
}

/**
 * Generate waypoint path between sites
 */
function generateWaypoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
  totalTime: number,
  numWaypoints: number = 5
): Array<{ x: number; y: number; timestamp: number }> {
  const waypoints: Array<{ x: number; y: number; timestamp: number }> = []
  
  for (let i = 0; i <= numWaypoints; i++) {
    const progress = i / numWaypoints
    const timestamp = progress * totalTime
    
    // Linear interpolation with slight curve
    const x = from.x + (to.x - from.x) * progress
    const y = from.y + (to.y - from.y) * progress + Math.sin(progress * Math.PI) * 5
    
    waypoints.push({ x, y, timestamp })
  }
  
  return waypoints
}

/**
 * Generate position heatmap from predictions
 */
function generatePositionHeatmap(
  predictions: RotationPrediction[],
  sites: Array<{ id: string; x: number; y: number }>
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const gridSize = 20
  
  // Create grid cells
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellX = (x / gridSize) * 100
      const cellY = (y / gridSize) * 100
      
      // Calculate intensity based on prediction waypoints
      let intensity = 0
      
      predictions.forEach(pred => {
        pred.waypoints.forEach(wp => {
          const distance = Math.sqrt(
            Math.pow(wp.x - cellX, 2) + Math.pow(wp.y - cellY, 2)
          )
          if (distance < 15) {
            intensity += (1 - distance / 15) * pred.confidence * 0.5
          }
        })
      })
      
      // Add site influence
      sites.forEach(site => {
        const distance = Math.sqrt(
          Math.pow(site.x - cellX, 2) + Math.pow(site.y - cellY, 2)
        )
        if (distance < 20) {
          intensity += (1 - distance / 20) * 0.3
        }
      })
      
      if (intensity > 0.05) {
        cells.push({
          x: cellX,
          y: cellY,
          value: intensity,
          intensity: Math.min(1, intensity)
        })
      }
    }
  }
  
  return cells
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render rotation predictions to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: RotationRenderOptions): boolean {
  const {
    canvas,
    data,
    showConfidence = true,
    showTiming = true,
    attackerColor = 'rgb(239, 68, 68)',
    defenderColor = 'rgb(59, 130, 246)',
    confidenceThreshold = 0.3,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates (0-100)
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Filter predictions by confidence
  const visiblePredictions = data.predictions.filter(
    p => p.confidence >= confidenceThreshold
  )
  
  // Render each prediction
  visiblePredictions.forEach((prediction, index) => {
    const color = prediction.teamSide === 'attackers' ? attackerColor : defenderColor
    renderPrediction(ctx, prediction, color, showConfidence, showTiming, index, animationProgress)
  })
  
  // Render heatmap overlay
  renderHeatmapOverlay(ctx, data.positionHeatmap)
  
  ctx.restore()
  return true
}

/**
 * Render a single prediction
 */
function renderPrediction(
  ctx: CanvasRenderingContext2D,
  prediction: RotationPrediction,
  color: string,
  showConfidence: boolean,
  showTiming: boolean,
  _index: number,
  animationProgress: number
): void {
  const waypoints = prediction.waypoints
  if (waypoints.length < 2) return
  
  ctx.save()
  
  // Animate path drawing
  const drawProgress = animationProgress
  const visibleWaypoints = Math.max(2, Math.floor(waypoints.length * drawProgress))
  const visiblePath = waypoints.slice(0, visibleWaypoints)
  
  // Draw path
  ctx.strokeStyle = color
  ctx.lineWidth = 2 + prediction.playerCount * 0.5
  ctx.globalAlpha = 0.6 * prediction.confidence
  ctx.setLineDash([4, 4])
  
  ctx.beginPath()
  ctx.moveTo(visiblePath[0].x, visiblePath[0].y)
  for (let i = 1; i < visiblePath.length; i++) {
    ctx.lineTo(visiblePath[i].x, visiblePath[i].y)
  }
  ctx.stroke()
  
  // Draw arrow at destination
  const dest = waypoints[waypoints.length - 1]
  const prev = waypoints[waypoints.length - 2]
  const angle = Math.atan2(dest.y - prev.y, dest.x - prev.x)
  
  ctx.setLineDash([])
  ctx.globalAlpha = 0.8
  ctx.fillStyle = color
  
  ctx.save()
  ctx.translate(dest.x, dest.y)
  ctx.rotate(angle)
  
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-4, -2)
  ctx.lineTo(-4, 2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  
  // Draw confidence indicator
  if (showConfidence) {
    const midPoint = waypoints[Math.floor(waypoints.length / 2)]
    renderConfidenceIndicator(ctx, midPoint.x, midPoint.y, prediction.confidence)
  }
  
  // Draw timing label
  if (showTiming) {
    const labelPoint = waypoints[Math.floor(waypoints.length * 0.3)]
    renderTimingLabel(ctx, labelPoint.x, labelPoint.y - 3, prediction.estimatedTime, prediction.playerCount)
  }
  
  // Draw risk warning
  if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
    const warnPoint = waypoints[Math.floor(waypoints.length * 0.5)]
    renderRiskWarning(ctx, warnPoint.x, warnPoint.y - 5)
  }
  
  ctx.restore()
}

/**
 * Render confidence indicator
 */
function renderConfidenceIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  confidence: number
): void {
  const radius = 3
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Confidence arc
  const color = confidence > 0.7 ? '#22c55e' : confidence > 0.5 ? '#eab308' : '#ef4444'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, radius - 0.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * confidence)
  ctx.stroke()
}

/**
 * Render timing label
 */
function renderTimingLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  estimatedTime: number,
  playerCount: number
): void {
  const timeSeconds = Math.round(estimatedTime / 1000)
  const text = `${timeSeconds}s • ${playerCount}p`
  
  ctx.font = '3px sans-serif'
  const metrics = ctx.measureText(text)
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x - metrics.width / 2 - 1, y - 2.5, metrics.width + 2, 5)
  
  // Text
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

/**
 * Render risk warning
 */
function renderRiskWarning(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const pulse = (Math.sin(Date.now() / 200) + 1) / 2
  
  ctx.fillStyle = `rgba(234, 179, 8, ${0.5 + pulse * 0.5})`
  ctx.beginPath()
  ctx.moveTo(x, y - 2)
  ctx.lineTo(x + 2, y + 2)
  ctx.lineTo(x - 2, y + 2)
  ctx.closePath()
  ctx.fill()
  
  ctx.fillStyle = '#000'
  ctx.font = 'bold 3px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', x, y + 1)
}

/**
 * Render heatmap overlay
 */
function renderHeatmapOverlay(
  ctx: CanvasRenderingContext2D,
  cells: HeatmapCell[]
): void {
  cells.forEach(cell => {
    if (cell.intensity < 0.1) return
    
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, 4
    )
    gradient.addColorStop(0, `rgba(139, 92, 246, ${cell.intensity * 0.4})`)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  DEFAULT_SITES,
  ROTATION_SPEEDS,
  RISK_THRESHOLDS
}
