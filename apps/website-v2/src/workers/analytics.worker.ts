/** [Ver002.000]
 * Analytics Worker for 4NJZ4 TENET Platform
 * Handles SimRating calculations, RAR decomposition, and statistical aggregations
 * 
 * Implements the SATOR Analytics algorithms from the skill specification:
 * - 5-component SimRating (combat, economy, clutch, support, entry)
 * - RAR (Role-Adjusted Replacement) calculation
 * - Investment grading (A+ to D)
 */

/// <reference lib="webworker" />

import type {
  WorkerMessage,
  WorkerResponse,
  SimRatingPayload,
  SimRatingResult,
  SimRatingComponents,
  RARPayload,
  RARResult,
  AggregationPayload,
  BatchSimRatingPayload
} from '../types/worker'

const ctx: Worker = self as unknown as Worker

// ===== Role Configuration =====
const ROLE_MULTIPLIERS: Record<string, number> = {
  duelist: 1.2,
  initiator: 1.0,
  controller: 0.8,
  sentinel: 0.7,
}

const ROLE_BASELINES: Record<string, number> = {
  duelist: 0.8,
  initiator: 0.7,
  controller: 0.6,
  sentinel: 0.65,
}

const ROLE_SCARCITY: Record<string, number> = {
  duelist: 1.0,
  sentinel: 1.1,
  controller: 1.2,
  initiator: 1.15,
}

// ===== Analytics calculation state =====
const state = {
  calculationsCompleted: 0,
  cache: new Map<string, unknown>(),
  stats: {
    totalCalculations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalCalculationTime: 0
  }
}

// ===== Message Handler =====
ctx.onmessage = async (event: MessageEvent<WorkerMessage<unknown>>) => {
  const { id, action, payload } = event.data
  const startTime = performance.now()

  try {
    let result: unknown

    switch (action) {
      case 'simrating':
        result = calculateSimRating(payload as SimRatingPayload)
        break

      case 'rar':
        result = calculateRAR(payload as RARPayload)
        break

      case 'batchSimrating':
        result = calculateBatchSimRatings(payload as BatchSimRatingPayload)
        break

      case 'aggregate':
        result = performAggregation(payload as AggregationPayload)
        break

      case 'clearCache':
        state.cache.clear()
        result = { cleared: true, size: 0 }
        break

      case 'stats':
        result = {
          calculationsCompleted: state.calculationsCompleted,
          cacheSize: state.cache.size,
          ...state.stats,
          averageCalculationTime: state.stats.totalCalculations > 0 
            ? state.stats.totalCalculationTime / state.stats.totalCalculations 
            : 0
        }
        break

      default:
        throw new Error(`Unknown analytics action: ${action}`)
    }

    const duration = performance.now() - startTime
    state.stats.totalCalculations++
    state.stats.totalCalculationTime += duration
    state.calculationsCompleted++

    sendResponse(id, 'analytics', true, result)
  } catch (error) {
    sendResponse(id, 'analytics', false, undefined, 
      error instanceof Error ? error.message : 'Unknown error')
  }
}

// ===== SimRating Calculation =====

function calculateSimRating(payload: SimRatingPayload): SimRatingResult {
  const { playerId, playerStats, role, confidence = 1.0 } = payload

  // Check cache first
  const cacheKey = `simrating:${playerId}:${role}:${JSON.stringify(playerStats)}`
  if (state.cache.has(cacheKey)) {
    state.stats.cacheHits++
    return state.cache.get(cacheKey) as SimRatingResult
  }
  state.stats.cacheMisses++

  // Confidence floor check
  const CONFIDENCE_FLOOR = 0.5
  if (confidence < CONFIDENCE_FLOOR) {
    return {
      playerId,
      rating: 0,
      components: {
        combat: 0,
        economy: 0,
        clutch: 0,
        support: 0,
        entry: 0,
        overall: 0
      },
      confidence,
      grade: 'N/A',
      factors: ['Insufficient data confidence'],
      timestamp: Date.now()
    }
  }

  // Calculate components
  const components: SimRatingComponents = {
    combat: calculateCombatComponent(playerStats),
    economy: calculateEconomyComponent(playerStats),
    clutch: calculateClutchComponent(playerStats),
    support: calculateSupportComponent(playerStats),
    entry: calculateEntryComponent(playerStats, role)
  }

  // Weighted overall score
  const weights = [0.30, 0.20, 0.20, 0.15, 0.15]
  const componentValues = [components.combat, components.economy, components.clutch, components.support, components.entry]
  components.overall = Math.round(
    weights.reduce((sum, weight, i) => sum + weight * componentValues[i], 0) * 100
  ) / 100

  // Determine grade
  const grade = scoreToGrade(components.overall)

  // Identify key factors
  const factors = identifyKeyFactors(components, playerStats)

  const result: SimRatingResult = {
    playerId,
    rating: components.overall,
    components,
    confidence,
    grade,
    factors,
    timestamp: Date.now()
  }

  // Cache result
  state.cache.set(cacheKey, result)
  if (state.cache.size > 1000) {
    // LRU: remove oldest entries
    const firstKey = state.cache.keys().next().value
    state.cache.delete(firstKey)
  }

  return result
}

function calculateCombatComponent(stats: Record<string, number>): number {
  const kd = stats.kd_ratio ?? stats.kills / Math.max(stats.deaths ?? 1, 1) ?? 1.0
  const adr = stats.adr ?? (stats.damage ?? 0) / Math.max(stats.roundsPlayed ?? 1, 1) * 10 ?? 150
  const fk = stats.first_kills_per_round ?? (stats.firstKills ?? 0) / Math.max(stats.roundsPlayed ?? 1, 1) ?? 0.1

  // Normalize to 0-100 scale
  return Math.min(100, Math.round((kd * 25 + adr / 3 + fk * 200) * 100) / 100)
}

function calculateEconomyComponent(stats: Record<string, number>): number {
  const buyEfficiency = stats.buy_efficiency ?? 0.5
  const saveRate = stats.save_rate ?? 0.2

  return Math.min(100, Math.round((buyEfficiency * 100 + saveRate * 50) * 100) / 100)
}

function calculateClutchComponent(stats: Record<string, number>): number {
  const clutchSuccess = stats.clutch_success_rate ?? 
    (stats.clutchesWon ?? 0) / Math.max(stats.clutchOpportunities ?? 1, 1) ?? 0.2
  const clutchesWon = stats.clutches_won ?? stats.clutchesWon ?? 0

  return Math.min(100, Math.round((clutchSuccess * 100 + Math.min(clutchesWon, 20)) * 100) / 100)
}

function calculateSupportComponent(stats: Record<string, number>): number {
  const assists = stats.assists_per_round ?? (stats.assists ?? 0) / Math.max(stats.roundsPlayed ?? 1, 1) ?? 0.2
  const utilityUsage = stats.utility_usage ?? 0.5

  return Math.min(100, Math.round((assists * 100 + utilityUsage * 50) * 100) / 100)
}

function calculateEntryComponent(stats: Record<string, number>, role: string): number {
  const entrySuccess = stats.entry_success_rate ?? 
    (stats.entryWins ?? 0) / Math.max(stats.entryAttempts ?? 1, 1) ?? 0.5

  const multiplier = ROLE_MULTIPLIERS[role.toLowerCase()] ?? 1.0
  return Math.min(100, Math.round(entrySuccess * 100 * multiplier * 100) / 100)
}

function scoreToGrade(score: number): string {
  if (score >= 85) return 'A+'
  if (score >= 75) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

function identifyKeyFactors(components: SimRatingComponents, stats: Record<string, number>): string[] {
  const factors: string[] = []
  
  // Identify strongest and weakest components
  const componentEntries = [
    ['combat', components.combat],
    ['economy', components.economy],
    ['clutch', components.clutch],
    ['support', components.support],
    ['entry', components.entry]
  ] as const

  const maxComponent = componentEntries.reduce((a, b) => a[1] > b[1] ? a : b)
  const minComponent = componentEntries.reduce((a, b) => a[1] < b[1] ? a : b)

  if (maxComponent[1] > 70) {
    factors.push(`Strong ${maxComponent[0]} performance`)
  }
  if (minComponent[1] < 40) {
    factors.push(`${minComponent[0]} needs improvement`)
  }

  // Sample size indicator
  const sampleSize = stats.matchesPlayed ?? stats.sample_size ?? 0
  if (sampleSize < 10) {
    factors.push('Limited sample size')
  } else if (sampleSize > 50) {
    factors.push('Large sample size')
  }

  return factors.length > 0 ? factors : ['Balanced performance profile']
}

// ===== Batch Calculation =====

function calculateBatchSimRatings(payload: BatchSimRatingPayload): { results: SimRatingResult[]; errors: Array<{ id: string; error: string }> } {
  const results: SimRatingResult[] = []
  const errors: Array<{ id: string; error: string }> = []

  for (const player of payload.players) {
    try {
      const result = calculateSimRating(player.payload)
      results.push(result)
    } catch (error) {
      errors.push({
        id: player.id,
        error: error instanceof Error ? error.message : 'Calculation failed'
      })
    }
  }

  return { results, errors }
}

// ===== RAR Calculation =====

function calculateRAR(payload: RARPayload): RARResult {
  const { playerId, playerStats, role, simrating, confidence = 1.0 } = payload

  const baseline = ROLE_BASELINES[role.toLowerCase()] ?? 0.5
  
  // Normalize SimRating to WAR-like scale (0-2)
  const warEquivalent = (simrating / 100) * 2.0
  
  // Calculate replacement value
  const replacementValue = warEquivalent - baseline
  
  // Role adjustment (scarcity factor)
  const roleFactor = ROLE_SCARCITY[role.toLowerCase()] ?? 1.0
  const roleAdjusted = replacementValue * roleFactor
  
  // Normalize to 0-100 scale for display
  const rarNormalized = Math.max(0, Math.min(100, (roleAdjusted + 1) * 33.33))

  // Calculate components
  const components = {
    impact: Math.round(warEquivalent * 50 * 100) / 100,
    consistency: Math.round((stats.stdDev ?? 0.2) * 100 * 100) / 100,
    clutch: Math.round((stats.clutch_success_rate ?? 0.2) * 100 * 100) / 100
  }

  // Investment grade based on RAR
  const investmentGrade = calculateInvestmentGrade(roleAdjusted, simrating)
  
  // Risk level
  const riskLevel = calculateRiskLevel(roleAdjusted, components.consistency)

  return {
    playerId,
    rar: Math.round(roleAdjusted * 100) / 100,
    rarNormalized: Math.round(rarNormalized * 100) / 100,
    components,
    investmentGrade,
    riskLevel,
    confidence
  }
}

// Reference to stats for RAR calculation (would come from worker state or payload)
const stats: Record<string, number> = {}

function calculateInvestmentGrade(rar: number, simrating: number): string {
  // Combined score weighting RAR more heavily
  const combinedScore = (rar * 0.6 + (simrating / 100) * 0.4)
  
  if (combinedScore >= 2.5) return 'A+'
  if (combinedScore >= 2.0) return 'A'
  if (combinedScore >= 1.5) return 'B'
  if (combinedScore >= 1.0) return 'C'
  return 'D'
}

function calculateRiskLevel(rar: number, consistency: number): 'low' | 'medium' | 'high' {
  // Lower consistency = higher risk
  if (rar > 1.5 && consistency > 70) return 'low'
  if (rar > 0.5 && consistency > 50) return 'medium'
  return 'high'
}

// ===== Aggregation Functions =====

function performAggregation(payload: AggregationPayload): number {
  const { data, operation, options } = payload
  
  if (data.length === 0) return 0

  switch (operation) {
    case 'sum':
      return data.reduce((a, b) => a + b, 0)
    
    case 'avg':
      if (options?.weights && options.weights.length === data.length) {
        const sumWeights = options.weights.reduce((a, b) => a + b, 0)
        return data.reduce((sum, val, i) => sum + val * options.weights![i], 0) / sumWeights
      }
      return data.reduce((a, b) => a + b, 0) / data.length
    
    case 'median':
      const sorted = [...data].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid]
    
    case 'std':
      const mean = data.reduce((a, b) => a + b, 0) / data.length
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
      return Math.sqrt(variance)
    
    case 'min':
      return Math.min(...data)
    
    case 'max':
      return Math.max(...data)
    
    case 'percentile':
      const p = options?.percentile ?? 50
      const sortedP = [...data].sort((a, b) => a - b)
      const index = Math.ceil((p / 100) * sortedP.length) - 1
      return sortedP[Math.max(0, index)]
    
    default:
      throw new Error(`Unknown aggregation operation: ${operation}`)
  }
}

// ===== Helper Functions =====

function sendResponse(
  id: string, 
  type: WorkerType, 
  success: boolean, 
  data?: unknown, 
  error?: string
): void {
  const response: WorkerResponse = {
    id,
    type,
    success,
    data,
    error,
    timestamp: Date.now()
  }
  ctx.postMessage(response)
}

// Signal ready
ctx.postMessage({ type: 'ready', workerType: 'analytics' })

export type { WorkerMessage, WorkerResponse }
