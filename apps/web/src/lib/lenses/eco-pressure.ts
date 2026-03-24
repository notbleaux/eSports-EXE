/** [Ver001.000]
 * Economy Pressure Lens
 * =====================
 * Economic pressure visualization with buy round predictions.
 * 
 * Features:
 * - Team economy tracking
 * - Buy round prediction
 * - Economic advantage visualization
 * - Force buy risk assessment
 * - Spending pattern analysis
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Team economy state */
export interface TeamEconomy {
  /** Team identifier */
  team: 'attackers' | 'defenders'
  /** Total available money */
  totalMoney: number
  /** Money per player (average) */
  moneyPerPlayer: number
  /** Buy category */
  buyType: 'full' | 'semi' | 'eco' | 'force'
  /** Can afford full buy */
  canFullBuy: boolean
  /** Equipment value on field */
  equipmentValue: number
  /** Expected buy next round */
  predictedBuy: 'full' | 'semi' | 'eco' | 'force'
  /** Confidence in prediction */
  predictionConfidence: number
  /** Win/loss streak */
  streak: { type: 'win' | 'loss'; count: number }
  /** Spending history */
  spendingHistory: number[]
}

/** Economic pressure zone */
export interface EcoPressureZone {
  /** Zone position (typically near team spawn) */
  position: { x: number; y: number }
  /** Zone radius */
  radius: number
  /** Team this zone represents */
  team: 'attackers' | 'defenders'
  /** Pressure level (0.0 - 1.0) */
  pressureLevel: number
  /** Pressure type */
  pressureType: 'advantage' | 'disadvantage' | 'even' | 'desperation'
  /** Visual intensity */
  intensity: number
}

/** Economic forecast */
export interface EcoForecast {
  /** Round number being forecast */
  roundNumber: number
  /** Predicted attacker buy */
  attackerBuy: TeamEconomy['buyType']
  /** Predicted defender buy */
  defenderBuy: TeamEconomy['buyType']
  /** Expected advantage */
  advantage: 'attackers' | 'defenders' | 'even'
  /** Advantage magnitude */
  advantageAmount: number
  /** Confidence in forecast */
  confidence: number
}

/** Input data for economy calculation */
export interface EcoPressureInput {
  /** Current team economies */
  economies: {
    attackers: {
      totalMoney: number
      playerMoney: number[]
      equipmentValue: number
      streak: { type: 'win' | 'loss'; count: number }
      spendingHistory: number[]
    }
    defenders: {
      totalMoney: number
      playerMoney: number[]
      equipmentValue: number
      streak: { type: 'win' | 'loss'; count: number }
      spendingHistory: number[]
    }
  }
  /** Current round number */
  currentRound: number
  /** Round history for patterns */
  roundHistory: Array<{
    round: number
    winner: 'attackers' | 'defenders'
    attackerSpend: number
    defenderSpend: number
  }>
  /** Map positions for visualization */
  teamPositions: {
    attackers: { x: number; y: number }
    defenders: { x: number; y: number }
  }
  /** Full buy threshold */
  fullBuyThreshold?: number
  /** Force buy threshold */
  forceBuyThreshold?: number
}

/** Lens data output */
export interface EcoPressureLensData {
  /** Team economy states */
  teams: TeamEconomy[]
  /** Pressure zones for visualization */
  pressureZones: EcoPressureZone[]
  /** Economic forecast for upcoming rounds */
  forecast: EcoForecast[]
  /** Current economic advantage */
  currentAdvantage: {
    holder: 'attackers' | 'defenders' | 'even'
    amount: number
    description: string
  }
  /** Force buy risk assessment */
  forceBuyRisk: {
    attackers: number
    defenders: number
    likelyTeam?: 'attackers' | 'defenders'
  }
  /** Economic trend */
  trend: 'improving' | 'worsening' | 'stable'
  /** Pressure heatmap */
  pressureHeatmap: HeatmapCell[]
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface EcoPressureRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: EcoPressureLensData
  /** Show team info cards */
  showTeamInfo?: boolean
  /** Show forecast */
  showForecast?: boolean
  /** Show pressure zones */
  showPressureZones?: boolean
  /** Show risk warnings */
  showRiskWarnings?: boolean
  /** Animation progress */
  animationProgress?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Buy type thresholds */
export const BUY_THRESHOLDS = {
  full: 4500,
  semi: 3000,
  force: 2000,
  eco: 0
}

/** Pressure level colors */
export const PRESSURE_COLORS = {
  advantage: '#22c55e',     // Green
  even: '#eab308',          // Yellow
  disadvantage: '#f97316',  // Orange
  desperation: '#ef4444'    // Red
}

/** Team colors */
export const TEAM_COLORS = {
  attackers: '#ef4444',
  defenders: '#3b82f6'
}

/** Default thresholds */
export const DEFAULT_FULL_BUY = 4500
export const DEFAULT_FORCE_BUY = 2000

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate economy pressure based on input data
 * @param input - Economy pressure input
 * @returns Economy pressure lens data
 */
export function calculate(input: EcoPressureInput): EcoPressureLensData {
  const calculatedAt = Date.now()
  const fullBuyThreshold = input.fullBuyThreshold || DEFAULT_FULL_BUY
  const forceBuyThreshold = input.forceBuyThreshold || DEFAULT_FORCE_BUY
  
  // Calculate team economies
  const teams: TeamEconomy[] = [
    calculateTeamEconomy('attackers', input.economies.attackers, fullBuyThreshold, forceBuyThreshold),
    calculateTeamEconomy('defenders', input.economies.defenders, fullBuyThreshold, forceBuyThreshold)
  ]
  
  // Calculate pressure zones
  const pressureZones = calculatePressureZones(teams, input.teamPositions)
  
  // Generate forecast
  const forecast = generateForecast(teams, input)
  
  // Calculate current advantage
  const currentAdvantage = calculateCurrentAdvantage(teams)
  
  // Calculate force buy risk
  const forceBuyRisk = calculateForceBuyRisk(teams)
  
  // Determine trend
  const trend = calculateTrend(teams, input.roundHistory)
  
  // Generate pressure heatmap
  const pressureHeatmap = generatePressureHeatmap(pressureZones)
  
  return {
    teams,
    pressureZones,
    forecast,
    currentAdvantage,
    forceBuyRisk,
    trend,
    pressureHeatmap,
    calculatedAt
  }
}

/**
 * Calculate economy state for a team
 */
function calculateTeamEconomy(
  team: 'attackers' | 'defenders',
  data: EcoPressureInput['economies']['attackers'],
  fullBuyThreshold: number,
  forceBuyThreshold: number
): TeamEconomy {
  const moneyPerPlayer = data.totalMoney / 5 // Assume 5 players
  
  // Determine current buy type
  let buyType: TeamEconomy['buyType']
  if (moneyPerPlayer >= fullBuyThreshold) {
    buyType = 'full'
  } else if (moneyPerPlayer >= fullBuyThreshold * 0.7) {
    buyType = 'semi'
  } else if (moneyPerPlayer >= forceBuyThreshold) {
    buyType = 'force'
  } else {
    buyType = 'eco'
  }
  
  // Predict next round buy
  const predictedBuy = predictNextBuy(data, buyType, fullBuyThreshold, forceBuyThreshold)
  
  // Calculate prediction confidence
  const predictionConfidence = calculatePredictionConfidence(data, predictedBuy)
  
  return {
    team,
    totalMoney: data.totalMoney,
    moneyPerPlayer,
    buyType,
    canFullBuy: moneyPerPlayer >= fullBuyThreshold,
    equipmentValue: data.equipmentValue,
    predictedBuy,
    predictionConfidence,
    streak: data.streak,
    spendingHistory: data.spendingHistory
  }
}

/**
 * Predict next round buy type
 */
function predictNextBuy(
  data: EcoPressureInput['economies']['attackers'],
  currentBuy: TeamEconomy['buyType'],
  fullBuyThreshold: number,
  forceBuyThreshold: number
): TeamEconomy['buyType'] {
  // If on loss streak, likely to save
  if (data.streak.type === 'loss' && data.streak.count >= 2) {
    return 'eco'
  }
  
  // If on win streak with good money, likely full buy
  if (data.streak.type === 'win' && data.totalMoney > fullBuyThreshold * 4) {
    return 'full'
  }
  
  // If desperate and on force buy threshold
  if (data.streak.count >= 2 && data.totalMoney / 5 >= forceBuyThreshold * 0.8) {
    return 'force'
  }
  
  // Predict based on spending pattern
  const avgSpend = data.spendingHistory.reduce((a, b) => a + b, 0) / data.spendingHistory.length || 0
  const projectedMoney = (data.totalMoney / 5) + 3000 - avgSpend // +3000 for round loss/win
  
  if (projectedMoney >= fullBuyThreshold) return 'full'
  if (projectedMoney >= fullBuyThreshold * 0.7) return 'semi'
  if (projectedMoney >= forceBuyThreshold) return 'force'
  return 'eco'
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(
  data: EcoPressureInput['economies']['attackers'],
  predictedBuy: TeamEconomy['buyType']
): number {
  let confidence = 0.6
  
  // Higher confidence with more consistent streak
  confidence += Math.min(0.2, data.streak.count * 0.05)
  
  // Higher confidence with more spending history
  confidence += Math.min(0.1, data.spendingHistory.length * 0.02)
  
  // Lower confidence if on the threshold
  const moneyPerPlayer = data.totalMoney / 5
  const nearThreshold = [2000, 3000, 4500].some(t => Math.abs(moneyPerPlayer - t) < 300)
  if (nearThreshold) confidence -= 0.15
  
  return Math.min(1, Math.max(0.3, confidence))
}

/**
 * Calculate pressure zones
 */
function calculatePressureZones(
  teams: TeamEconomy[],
  positions: EcoPressureInput['teamPositions']
): EcoPressureZone[] {
  const zones: EcoPressureZone[] = []
  
  const attackerTeam = teams.find(t => t.team === 'attackers')!
  const defenderTeam = teams.find(t => t.team === 'defenders')!
  
  // Calculate pressure differential
  const moneyDiff = attackerTeam.moneyPerPlayer - defenderTeam.moneyPerPlayer
  const maxMoney = Math.max(attackerTeam.moneyPerPlayer, defenderTeam.moneyPerPlayer)
  const pressureRatio = maxMoney > 0 ? moneyDiff / maxMoney : 0
  
  // Attacker zone
  const attackerPressure: EcoPressureZone = {
    position: positions.attackers,
    radius: 15 + attackerTeam.moneyPerPlayer / 300,
    team: 'attackers',
    pressureLevel: Math.max(0, pressureRatio),
    pressureType: pressureRatio > 0.3 ? 'advantage' : pressureRatio < -0.3 ? 'disadvantage' : 'even',
    intensity: Math.min(1, attackerTeam.moneyPerPlayer / 5000)
  }
  
  // Defender zone
  const defenderPressure: EcoPressureZone = {
    position: positions.defenders,
    radius: 15 + defenderTeam.moneyPerPlayer / 300,
    team: 'defenders',
    pressureLevel: Math.max(0, -pressureRatio),
    pressureType: pressureRatio < -0.3 ? 'advantage' : pressureRatio > 0.3 ? 'disadvantage' : 'even',
    intensity: Math.min(1, defenderTeam.moneyPerPlayer / 5000)
  }
  
  // Check for desperation
  if (attackerTeam.buyType === 'eco' && attackerTeam.streak.count >= 2) {
    attackerPressure.pressureType = 'desperation'
    attackerPressure.pressureLevel = 1
  }
  
  if (defenderTeam.buyType === 'eco' && defenderTeam.streak.count >= 2) {
    defenderPressure.pressureType = 'desperation'
    defenderPressure.pressureLevel = 1
  }
  
  zones.push(attackerPressure, defenderPressure)
  
  return zones
}

/**
 * Generate economic forecast
 */
function generateForecast(
  teams: TeamEconomy[],
  input: EcoPressureInput
): EcoForecast[] {
  const forecast: EcoForecast[] = []
  const attackerTeam = teams.find(t => t.team === 'attackers')!
  const defenderTeam = teams.find(t => t.team === 'defenders')!
  
  // Forecast next 3 rounds
  for (let i = 1; i <= 3; i++) {
    const roundNum = input.currentRound + i
    
    // Simple projection based on current trends
    const attackerProjected = calculateProjectedBuy(attackerTeam, i)
    const defenderProjected = calculateProjectedBuy(defenderTeam, i)
    
    const advantage = attackerProjected.value > defenderProjected.value
      ? 'attackers'
      : defenderProjected.value > attackerProjected.value
        ? 'defenders'
        : 'even'
    
    forecast.push({
      roundNumber: roundNum,
      attackerBuy: attackerProjected.type,
      defenderBuy: defenderProjected.type,
      advantage,
      advantageAmount: Math.abs(attackerProjected.value - defenderProjected.value),
      confidence: Math.max(attackerProjected.confidence, defenderProjected.confidence)
    })
  }
  
  return forecast
}

/**
 * Calculate projected buy for future round
 */
function calculateProjectedBuy(
  team: TeamEconomy,
  roundsAhead: number
): { type: TeamEconomy['buyType']; value: number; confidence: number } {
  const projectedMoney = team.moneyPerPlayer + (3000 * roundsAhead)
  
  if (projectedMoney >= BUY_THRESHOLDS.full) {
    return { type: 'full', value: 4, confidence: 0.8 - roundsAhead * 0.1 }
  }
  if (projectedMoney >= BUY_THRESHOLDS.semi) {
    return { type: 'semi', value: 3, confidence: 0.7 - roundsAhead * 0.1 }
  }
  if (projectedMoney >= BUY_THRESHOLDS.force) {
    return { type: 'force', value: 2, confidence: 0.6 - roundsAhead * 0.1 }
  }
  return { type: 'eco', value: 1, confidence: 0.9 }
}

/**
 * Calculate current economic advantage
 */
function calculateCurrentAdvantage(teams: TeamEconomy[]): EcoPressureLensData['currentAdvantage'] {
  const attackerTeam = teams.find(t => t.team === 'attackers')!
  const defenderTeam = teams.find(t => t.team === 'defenders')!
  
  const moneyDiff = attackerTeam.moneyPerPlayer - defenderTeam.moneyPerPlayer
  const maxMoney = Math.max(attackerTeam.moneyPerPlayer, defenderTeam.moneyPerPlayer)
  const advantageRatio = maxMoney > 0 ? Math.abs(moneyDiff) / maxMoney : 0
  
  let holder: EcoPressureLensData['currentAdvantage']['holder']
  let description: string
  
  if (Math.abs(moneyDiff) < 500) {
    holder = 'even'
    description = 'Economies are relatively even'
  } else if (moneyDiff > 0) {
    holder = 'attackers'
    description = `Attackers have ${(advantageRatio * 100).toFixed(0)}% economic advantage`
  } else {
    holder = 'defenders'
    description = `Defenders have ${(advantageRatio * 100).toFixed(0)}% economic advantage`
  }
  
  return {
    holder,
    amount: advantageRatio,
    description
  }
}

/**
 * Calculate force buy risk
 */
function calculateForceBuyRisk(teams: TeamEconomy[]): EcoPressureLensData['forceBuyRisk'] {
  const attackerTeam = teams.find(t => t.team === 'attackers')!
  const defenderTeam = teams.find(t => t.team === 'defenders')!
  
  // Calculate risk based on streak and money
  let attackerRisk = 0
  if (attackerTeam.streak.type === 'loss') {
    attackerRisk += attackerTeam.streak.count * 0.15
  }
  if (attackerTeam.moneyPerPlayer < BUY_THRESHOLDS.semi) {
    attackerRisk += 0.2
  }
  
  let defenderRisk = 0
  if (defenderTeam.streak.type === 'loss') {
    defenderRisk += defenderTeam.streak.count * 0.15
  }
  if (defenderTeam.moneyPerPlayer < BUY_THRESHOLDS.semi) {
    defenderRisk += 0.2
  }
  
  const likelyTeam = attackerRisk > defenderRisk + 0.2 
    ? 'attackers' 
    : defenderRisk > attackerRisk + 0.2 
      ? 'defenders' 
      : undefined
  
  return {
    attackers: Math.min(1, attackerRisk),
    defenders: Math.min(1, defenderRisk),
    likelyTeam
  }
}

/**
 * Calculate economic trend
 */
function calculateTrend(
  teams: TeamEconomy[],
  roundHistory: EcoPressureInput['roundHistory']
): EcoPressureLensData['trend'] {
  if (roundHistory.length < 2) return 'stable'
  
  const recent = roundHistory.slice(-3)
  const attackerWins = recent.filter(r => r.winner === 'attackers').length
  const defenderWins = recent.filter(r => r.winner === 'defenders').length
  
  // If one team is winning consistently, their trend is improving
  const attackerTeam = teams.find(t => t.team === 'attackers')!
  if (attackerWins >= 2) {
    return attackerTeam.streak.type === 'win' ? 'improving' : 'worsening'
  }
  if (defenderWins >= 2) {
    return attackerTeam.streak.type === 'loss' ? 'worsening' : 'improving'
  }
  
  return 'stable'
}

/**
 * Generate pressure heatmap
 */
function generatePressureHeatmap(zones: EcoPressureZone[]): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  zones.forEach(zone => {
    // Create gradient around each zone
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const dist = zone.radius * 0.7
      
      cells.push({
        x: zone.position.x + Math.cos(angle) * dist,
        y: zone.position.y + Math.sin(angle) * dist,
        value: zone.intensity,
        intensity: zone.intensity * 0.6
      })
    }
    
    // Center cell
    cells.push({
      x: zone.position.x,
      y: zone.position.y,
      value: zone.intensity * 1.2,
      intensity: zone.intensity
    })
  })
  
  return cells
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render economy pressure to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: EcoPressureRenderOptions): boolean {
  const {
    canvas,
    data,
    showTeamInfo = true,
    showForecast = true,
    showPressureZones = true,
    showRiskWarnings = true,
    animationProgress = 1
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Scale to normalized coordinates
  ctx.scale(canvas.width / 100, canvas.height / 100)
  
  // Render pressure zones
  if (showPressureZones) {
    data.pressureZones.forEach(zone => {
      renderPressureZone(ctx, zone, animationProgress)
    })
  }
  
  // Render team info
  if (showTeamInfo) {
    data.teams.forEach((team, index) => {
      const xPos = index === 0 ? 10 : 90
      renderTeamInfo(ctx, team, xPos, 10)
    })
  }
  
  // Render forecast
  if (showForecast) {
    renderForecast(ctx, data.forecast)
  }
  
  // Render risk warnings
  if (showRiskWarnings && data.forceBuyRisk.likelyTeam) {
    renderRiskWarning(ctx, data.forceBuyRisk)
  }
  
  // Render advantage indicator
  renderAdvantageIndicator(ctx, data.currentAdvantage)
  
  ctx.restore()
  return true
}

/**
 * Render pressure zone
 */
function renderPressureZone(
  ctx: CanvasRenderingContext2D,
  zone: EcoPressureZone,
  animationProgress: number
): void {
  const color = PRESSURE_COLORS[zone.pressureType]
  const radius = zone.radius * animationProgress
  
  ctx.save()
  
  // Zone glow
  const gradient = ctx.createRadialGradient(
    zone.position.x, zone.position.y, 0,
    zone.position.x, zone.position.y, radius
  )
  gradient.addColorStop(0, color + '60')
  gradient.addColorStop(0.7, color + '20')
  gradient.addColorStop(1, 'transparent')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.arc(zone.position.x, zone.position.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  ctx.restore()
}

/**
 * Render team info card
 */
function renderTeamInfo(
  ctx: CanvasRenderingContext2D,
  team: TeamEconomy,
  x: number,
  y: number
): void {
  ctx.save()
  
  const color = TEAM_COLORS[team.team]
  const cardWidth = 28
  const cardHeight = 35
  const xPos = x - cardWidth / 2
  
  // Card background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(xPos, y, cardWidth, cardHeight)
  
  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(xPos, y, cardWidth, cardHeight)
  
  // Team name
  ctx.fillStyle = color
  ctx.font = 'bold 4px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(team.team.toUpperCase(), x, y + 6)
  
  // Money
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '3px sans-serif'
  ctx.fillText(`$${(team.totalMoney / 1000).toFixed(1)}k`, x, y + 12)
  ctx.fillText(`$${Math.round(team.moneyPerPlayer)}/p`, x, y + 16)
  
  // Buy type
  ctx.fillStyle = getBuyTypeColor(team.buyType)
  ctx.fillText(team.buyType.toUpperCase(), x, y + 22)
  
  // Streak
  const streakColor = team.streak.type === 'win' ? '#22c55e' : '#ef4444'
  ctx.fillStyle = streakColor
  ctx.fillText(`${team.streak.type === 'win' ? 'W' : 'L'}${team.streak.count}`, x, y + 27)
  
  // Prediction
  ctx.fillStyle = '#94a3b8'
  ctx.font = '2.5px sans-serif'
  ctx.fillText(`Next: ${team.predictedBuy}`, x, y + 32)
  
  ctx.restore()
}

/**
 * Get color for buy type
 */
function getBuyTypeColor(buyType: TeamEconomy['buyType']): string {
  switch (buyType) {
    case 'full': return '#22c55e'
    case 'semi': return '#3b82f6'
    case 'force': return '#f97316'
    case 'eco': return '#64748b'
  }
}

/**
 * Render forecast
 */
function renderForecast(
  ctx: CanvasRenderingContext2D,
  forecast: EcoForecast[]
): void {
  ctx.save()
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.fillRect(35, 70, 30, 25)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.font = 'bold 3px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('FORECAST', 50, 74)
  
  forecast.forEach((f, i) => {
    const y = 79 + i * 5
    ctx.font = '2.5px sans-serif'
    
    // Round number
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`R${f.roundNumber}`, 38, y)
    
    // Buy types
    const atkColor = getBuyTypeColor(f.attackerBuy)
    const defColor = getBuyTypeColor(f.defenderBuy)
    
    ctx.fillStyle = atkColor
    ctx.fillText(f.attackerBuy.substring(0, 1).toUpperCase(), 45, y)
    
    ctx.fillStyle = '#64748b'
    ctx.fillText('vs', 50, y)
    
    ctx.fillStyle = defColor
    ctx.fillText(f.defenderBuy.substring(0, 1).toUpperCase(), 55, y)
    
    // Advantage indicator
    ctx.fillStyle = f.advantage === 'attackers' ? '#ef4444' : f.advantage === 'defenders' ? '#3b82f6' : '#eab308'
    ctx.fillText(f.advantage === 'attackers' ? 'A' : f.advantage === 'defenders' ? 'D' : '=', 62, y)
  })
  
  ctx.restore()
}

/**
 * Render risk warning
 */
function renderRiskWarning(
  ctx: CanvasRenderingContext2D,
  risk: EcoPressureLensData['forceBuyRisk']
): void {
  ctx.save()
  
  const pulse = (Math.sin(Date.now() / 300) + 1) / 2
  
  ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.5})`
  ctx.font = 'bold 4px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`⚠ FORCE BUY RISK: ${risk.likelyTeam!.toUpperCase()}`, 50, 60)
  
  ctx.restore()
}

/**
 * Render advantage indicator
 */
function renderAdvantageIndicator(
  ctx: CanvasRenderingContext2D,
  advantage: EcoPressureLensData['currentAdvantage']
): void {
  ctx.save()
  
  const color = advantage.holder === 'attackers' 
    ? '#ef4444' 
    : advantage.holder === 'defenders' 
      ? '#3b82f6' 
      : '#eab308'
  
  ctx.fillStyle = color
  ctx.font = '3px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(advantage.description, 50, 97)
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine optimal buy for given money
 * @param moneyPerPlayer - Money per player
 * @returns Optimal buy type
 */
export function determineOptimalBuy(moneyPerPlayer: number): TeamEconomy['buyType'] {
  if (moneyPerPlayer >= BUY_THRESHOLDS.full) return 'full'
  if (moneyPerPlayer >= BUY_THRESHOLDS.semi) return 'semi'
  if (moneyPerPlayer >= BUY_THRESHOLDS.force) return 'force'
  return 'eco'
}

/**
 * Calculate economic pressure score
 * @param economy - Team economy
 * @returns Pressure score (0-1)
 */
export function calculatePressureScore(economy: TeamEconomy): number {
  let score = 0
  
  // Low money = high pressure
  score += Math.max(0, 1 - economy.moneyPerPlayer / 5000)
  
  // Loss streak = high pressure
  if (economy.streak.type === 'loss') {
    score += economy.streak.count * 0.1
  }
  
  // Eco/force buy = high pressure
  if (economy.buyType === 'eco') score += 0.2
  if (economy.buyType === 'force') score += 0.1
  
  return Math.min(1, score)
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  determineOptimalBuy,
  calculatePressureScore,
  BUY_THRESHOLDS,
  PRESSURE_COLORS,
  TEAM_COLORS
}
