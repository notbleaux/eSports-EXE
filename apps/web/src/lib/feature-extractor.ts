/**
 * Feature Extractor - Extract and Normalize Features for ML Models
 * 
 * [Ver001.000] - MVP Feature Extraction
 * 
 * Provides:
 * - Feature extraction from player/match data
 * - Feature normalization
 * - Cached computed features
 * - Missing value handling
 */

import { mlLogger } from '../utils/logger'
import type { Player as BasePlayer, Team as BaseTeam, Match as BaseMatch } from '@sator/types'

// ============================================================================
// Local Type Extensions (augmenting base types with stats/match data)
// ============================================================================

interface PlayerStats {
  rating?: number
  kills?: number
  deaths?: number
  assists?: number
  roundsPlayed?: number
  killsPerRound?: number
  deathsPerRound?: number
  assistsPerRound?: number
  adr?: number
  kast?: number
  headshotPercentage?: number
  firstBloodRate?: number
  clutchWinRate?: number
}

interface Player extends BasePlayer {
  name: string
  stats?: PlayerStats
}

interface Team extends BaseTeam {
  players?: Player[]
  recentMatches?: Match[]
}

interface Match extends BaseMatch {
  winnerId: string
  loserId?: string
  scoreWinner?: number
  scoreLoser?: number
  mapName?: string
  date?: string
}

interface MapResult {
  mapName: string
  winnerId: string
  scoreA: number
  scoreB: number
}
import {
  FEATURE_STORE,
  FEATURE_STORE_VERSION,
  type MLModelType,
  type WinProbabilityFeatures,
  type PlayerPerformanceFeatures,
  type TeamSynergyFeatures,
  type FeatureDefinition,
  getFeatureNames,
  getFeatureDefinition,
  validateFeatureValue,
  createDefaultFeatureVector
} from './ml-features'

// ============================================================================
// Types
// ============================================================================

export interface FeatureExtractionOptions {
  useCache?: boolean
  fillMissing?: boolean
  normalize?: boolean
  context?: {
    tournamentTier?: number
    isLan?: boolean
    isElimination?: boolean
    mapName?: string
  }
}

export interface ExtractedFeatures {
  modelType: MLModelType
  version: string
  vector: number[]
  names: string[]
  metadata: {
    extractedAt: number
    sourceCount: number
    missingFeatures: string[]
    normalized: boolean
  }
}

export interface FeatureCacheEntry {
  key: string
  features: ExtractedFeatures
  timestamp: number
  ttl: number
}

// ============================================================================
// Cache
// ============================================================================

const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

class FeatureCache {
  private cache = new Map<string, FeatureCacheEntry>()
  private accessOrder: string[] = []

  get(key: string): ExtractedFeatures | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return null
    }
    
    // Update access order
    this.updateAccessOrder(key)
    
    return entry.features
  }

  set(key: string, features: ExtractedFeatures, ttl = DEFAULT_CACHE_TTL): void {
    // Evict if needed
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      key,
      features,
      timestamp: Date.now(),
      ttl
    })
    
    this.updateAccessOrder(key)
  }

  invalidate(key: string): void {
    this.cache.delete(key)
    this.removeFromAccessOrder(key)
  }

  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits/misses
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private evictLRU(): void {
    const oldest = this.accessOrder.shift()
    if (oldest) {
      this.cache.delete(oldest)
    }
  }
}

// Global cache instance
const featureCache = new FeatureCache()

// ============================================================================
// Normalization Functions
// ============================================================================

function normalizeMinMax(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

function normalizeZScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0
  return (value - mean) / std
}

function normalizeLog(value: number): number {
  return Math.log1p(Math.max(0, value))
}

export function normalizeFeature(
  value: number, 
  definition: FeatureDefinition
): number {
  if (definition.normalization === 'minmax' && definition.min !== undefined && definition.max !== undefined) {
    return normalizeMinMax(value, definition.min, definition.max)
  }
  
  if (definition.normalization === 'zscore') {
    // Use definition bounds as proxy for mean/std if not specified
    const mean = (definition.min ?? 0 + (definition.max ?? 1)) / 2
    const std = ((definition.max ?? 1) - (definition.min ?? 0)) / 4
    return normalizeZScore(value, mean, std)
  }
  
  if (definition.normalization === 'log') {
    return normalizeLog(value)
  }
  
  return value
}

export function denormalizeFeature(
  normalizedValue: number,
  definition: FeatureDefinition
): number {
  if (definition.normalization === 'minmax' && definition.min !== undefined && definition.max !== undefined) {
    return normalizedValue * (definition.max - definition.min) + definition.min
  }
  
  return normalizedValue
}

// ============================================================================
// Win Probability Feature Extraction
// ============================================================================

export interface WinProbabilityInput {
  teamA: Team
  teamB: Team
  mapName?: string
  tournamentTier?: number
  isLan?: boolean
  isElimination?: boolean
  headToHeadHistory?: Array<{ winnerId: string; date: string }>
}

export function extractWinProbabilityFeatures(
  input: WinProbabilityInput,
  options: FeatureExtractionOptions = {}
): ExtractedFeatures {
  const { useCache = true, normalize = true, context = {} } = options
  
  // Generate cache key
  const cacheKey = `wp:${input.teamA.id}:${input.teamB.id}:${input.mapName || 'any'}:${input.tournamentTier || '0'}`
  
  // Check cache
  if (useCache) {
    const cached = featureCache.get(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  const features: Partial<WinProbabilityFeatures> = {}
  const missingFeatures: string[] = []
  
  // Team ratings
  const teamARatings = input.teamA.players?.map(p => p.stats?.rating ?? 1.0) || [1.0]
  const teamBRatings = input.teamB.players?.map(p => p.stats?.rating ?? 1.0) || [1.0]
  
  features['team_a_rating_avg'] = average(teamARatings)
  features['team_a_rating_std'] = stdDev(teamARatings)
  features['team_b_rating_avg'] = average(teamBRatings)
  features['team_b_rating_std'] = stdDev(teamBRatings)
  
  // Rating differences
  features['rating_diff_avg'] = features['team_a_rating_avg']! - features['team_b_rating_avg']!
  features['rating_diff_max'] = Math.max(...teamARatings) - Math.max(...teamBRatings)
  features['rating_diff_min'] = Math.min(...teamARatings) - Math.min(...teamBRatings)
  
  // Recent form (mock data - would come from match history)
  const teamARecent = input.teamA.recentMatches || []
  const teamBRecent = input.teamB.recentMatches || []
  
  features['team_a_win_rate_5'] = calculateWinRate(teamARecent, input.teamA.id, 5)
  features['team_b_win_rate_5'] = calculateWinRate(teamBRecent, input.teamB.id, 5)
  features['team_a_avg_round_diff_5'] = calculateAvgRoundDiff(teamARecent, input.teamA.id, 5)
  features['team_b_avg_round_diff_5'] = calculateAvgRoundDiff(teamBRecent, input.teamB.id, 5)
  
  // Map specific
  const mapName = input.mapName || context.mapName
  features['team_a_map_win_rate'] = calculateMapWinRate(teamARecent, input.teamA.id, mapName)
  features['team_b_map_win_rate'] = calculateMapWinRate(teamBRecent, input.teamB.id, mapName)
  features['map_picked_by'] = mapName ? 0 : -1 // Simplified - would need actual pick data
  
  // Tournament context
  features['is_lan'] = input.isLan ?? context.isLan ?? false ? 1 : 0
  features['tournament_tier'] = input.tournamentTier ?? context.tournamentTier ?? 3
  features['elimination_match'] = input.isElimination ?? context.isElimination ?? false ? 1 : 0
  
  // Head to head
  const h2h = input.headToHeadHistory || []
  features['h2h_wins_a'] = h2h.filter(m => m.winnerId === input.teamA.id).length
  features['h2h_wins_b'] = h2h.filter(m => m.winnerId === input.teamB.id).length
  features['h2h_total'] = h2h.length
  
  // Momentum (streak calculation)
  features['team_a_streak'] = calculateStreak(teamARecent, input.teamA.id)
  features['team_b_streak'] = calculateStreak(teamBRecent, input.teamB.id)
  
  // Build feature vector
  const result = buildFeatureVector(
    'win_probability',
    features,
    missingFeatures,
    normalize
  )
  
  // Cache result
  if (useCache) {
    featureCache.set(cacheKey, result)
  }
  
  return result
}

// ============================================================================
// Player Performance Feature Extraction
// ============================================================================

export function extractPlayerPerformanceFeatures(
  player: Player,
  recentStats?: PlayerStats[],
  options: FeatureExtractionOptions = {}
): ExtractedFeatures {
  const { useCache = true, normalize = true } = options
  
  const cacheKey = `pp:${player.id}:${Date.now() / (60 * 60 * 1000)}` // Hourly cache
  
  if (useCache) {
    const cached = featureCache.get(cacheKey)
    if (cached) return cached
  }
  
  const features: Partial<PlayerPerformanceFeatures> = {}
  const missingFeatures: string[] = []
  
  // Use recent stats if available, otherwise use player.stats
  const stats = recentStats?.length ? recentStats[recentStats.length - 1] : player.stats
  
  if (stats) {
    features['kills_per_round'] = stats.killsPerRound ?? stats.kills / (stats.roundsPlayed || 1)
    features['deaths_per_round'] = stats.deathsPerRound ?? stats.deaths / (stats.roundsPlayed || 1)
    features['assists_per_round'] = stats.assistsPerRound ?? stats.assists / (stats.roundsPlayed || 1)
    features['adr'] = stats.adr ?? 150
    features['kast'] = stats.kast ?? 0.7
    features['headshot_percentage'] = stats.headshotPercentage ?? 0.25
    features['first_blood_rate'] = stats.firstBloodRate ?? 0.1
    features['clutch_win_rate'] = stats.clutchWinRate ?? 0.15
  } else {
    // Mark all as missing
    missingFeatures.push(
      'kills_per_round', 'deaths_per_round', 'assists_per_round',
      'adr', 'kast', 'headshot_percentage', 'first_blood_rate', 'clutch_win_rate'
    )
  }
  
  // Consistency metrics (would come from historical data)
  features['rating_consistency'] = 0.7
  features['impact_consistency'] = 0.7
  
  // Role-specific (would need role data)
  features['entry_success_rate'] = 0.5
  features['trade_efficiency'] = 0.5
  features['survival_rate'] = 0.3
  
  // Agent/role context
  features['agent_familiarity'] = 0.7
  features['role_alignment'] = 0.7
  
  // Context
  features['pressure_rating'] = stats?.rating ?? 1.0
  features['eco_performance'] = 0.8
  
  const result = buildFeatureVector(
    'player_performance',
    features,
    missingFeatures,
    normalize
  )
  
  if (useCache) {
    featureCache.set(cacheKey, result)
  }
  
  return result
}

// ============================================================================
// Team Synergy Feature Extraction
// ============================================================================

export function extractTeamSynergyFeatures(
  team: Team,
  options: FeatureExtractionOptions = {}
): ExtractedFeatures {
  const { useCache = true, normalize = true } = options
  
  const cacheKey = `ts:${team.id}:${Date.now() / (60 * 60 * 1000)}`
  
  if (useCache) {
    const cached = featureCache.get(cacheKey)
    if (cached) return cached
  }
  
  const features: Partial<TeamSynergyFeatures> = {}
  const missingFeatures: string[] = []
  
  // Team stats would come from match data
  features['trade_success_rate'] = 0.6
  features['flash_assist_rate'] = 0.15
  features['retake_coordination'] = 0.4
  features['site_hold_efficiency'] = 0.6
  
  // Role balance
  const players = team.players || []
  const ratings = players.map(p => p.stats?.rating ?? 1.0)
  features['role_coverage_score'] = 0.8
  features['experience_balance'] = 0.7
  features['rating_balance'] = ratings.length > 1 ? 1 - stdDev(ratings) : 0.5
  
  // Team dynamics
  features['roster_stability'] = 0.5
  features['coach_impact'] = 1.0
  
  // Tactical
  features['pistol_round_win_rate'] = 0.5
  features['conversion_rate'] = 0.65
  features['force_buy_success'] = 0.3
  features['eco_round_success'] = 0.1
  
  const result = buildFeatureVector(
    'team_synergy',
    features,
    missingFeatures,
    normalize
  )
  
  if (useCache) {
    featureCache.set(cacheKey, result)
  }
  
  return result
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildFeatureVector(
  modelType: MLModelType,
  features: Record<string, number | undefined>,
  missingFeatures: string[],
  normalize: boolean
): ExtractedFeatures {
  const names = getFeatureNames(modelType)
  const vector: number[] = []
  
  names.forEach(name => {
    const definition = getFeatureDefinition(modelType, name)!
    let value = features[name]
    
    // Use default if missing
    if (value === undefined) {
      value = definition.defaultValue
      if (!missingFeatures.includes(name)) {
        missingFeatures.push(name)
      }
    }
    
    // Validate
    const validation = validateFeatureValue(definition, value)
    if (!validation.valid) {
      mlLogger.warn(`[Feature Extractor] ${name}: ${validation.error}`)
      value = definition.defaultValue
    }
    
    // Normalize
    if (normalize) {
      value = normalizeFeature(value, definition)
    }
    
    vector.push(value)
  })
  
  return {
    modelType,
    version: FEATURE_STORE_VERSION,
    vector,
    names,
    metadata: {
      extractedAt: Date.now(),
      sourceCount: Object.keys(features).length,
      missingFeatures,
      normalized
    }
  }
}

// Statistical helpers
function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const avg = average(values)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

// Match calculation helpers
function calculateWinRate(
  matches: Match[], 
  teamId: string, 
  limit: number
): number {
  if (!matches.length) return 0.5
  
  const recent = matches.slice(0, limit)
  const wins = recent.filter(m => m.winnerId === teamId).length
  return wins / recent.length
}

function calculateAvgRoundDiff(
  matches: Match[], 
  teamId: string, 
  limit: number
): number {
  if (!matches.length) return 0
  
  const recent = matches.slice(0, limit)
  const diffs = recent.map(m => {
    if (m.winnerId === teamId) {
      return (m.scoreWinner || 13) - (m.scoreLoser || 0)
    } else {
      return (m.scoreLoser || 0) - (m.scoreWinner || 13)
    }
  })
  
  return average(diffs)
}

function calculateMapWinRate(
  matches: Match[],
  teamId: string,
  mapName?: string
): number {
  if (!matches.length || !mapName) return 0.5
  
  const mapMatches = matches.filter(m => m.mapName === mapName)
  if (!mapMatches.length) return 0.5
  
  const wins = mapMatches.filter(m => m.winnerId === teamId).length
  return wins / mapMatches.length
}

function calculateStreak(matches: Match[], teamId: string): number {
  if (!matches.length) return 0
  
  let streak = 0
  for (const match of matches) {
    if (match.winnerId === teamId) {
      if (streak >= 0) streak++
      else break
    } else {
      if (streak <= 0) streak--
      else break
    }
  }
  
  return Math.max(-5, Math.min(5, streak))
}

// ============================================================================
// Batch Extraction
// ============================================================================

export function extractBatchFeatures<T>(
  items: T[],
  extractor: (item: T) => ExtractedFeatures,
  options: { parallel?: boolean } = {}
): ExtractedFeatures[] {
  return items.map(extractor)
}

// ============================================================================
// Cache Management
// ============================================================================

export function invalidateFeatureCache(pattern?: string): void {
  if (pattern) {
    featureCache.invalidateByPattern(pattern)
    mlLogger.info(`[Feature Extractor] Invalidated cache pattern: ${pattern}`)
  } else {
    featureCache.clear()
    mlLogger.info('[Feature Extractor] Cache cleared')
  }
}

export function getFeatureCacheStats(): { size: number; hitRate: number } {
  return featureCache.getStats()
}

// ============================================================================
// Main Export
// ============================================================================

export const featureExtractor = {
  // Single extraction
  extractWinProbability: extractWinProbabilityFeatures,
  extractPlayerPerformance: extractPlayerPerformanceFeatures,
  extractTeamSynergy: extractTeamSynergyFeatures,
  
  // Batch extraction
  extractBatch: extractBatchFeatures,
  
  // Normalization
  normalize: normalizeFeature,
  denormalize: denormalizeFeature,
  
  // Cache management
  invalidateCache: invalidateFeatureCache,
  getCacheStats: getFeatureCacheStats,
  
  // Utilities
  createDefaultVector: createDefaultFeatureVector,
  getFeatureNames
}

export default featureExtractor
