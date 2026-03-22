/**
 * ML Features - Feature Store Infrastructure for ML Models
 * 
 * [Ver001.000] - MVP Feature Store
 * 
 * Provides:
 * - Feature definitions for all ML models
 * - Feature versioning and metadata
 * - Win probability features
 * - Player performance features
 * - Team synergy features
 */

import { mlLogger } from '../utils/logger'

// ============================================================================
// Feature Versioning
// ============================================================================

export const FEATURE_STORE_VERSION = '1.0.0'

export interface FeatureVersion {
  major: number
  minor: number
  patch: number
}

export function parseVersion(version: string): FeatureVersion {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

export function isCompatibleVersion(
  modelVersion: string, 
  storeVersion: string = FEATURE_STORE_VERSION
): boolean {
  const model = parseVersion(modelVersion)
  const store = parseVersion(storeVersion)
  
  // Major version must match
  if (model.major !== store.major) return false
  
  // Model minor can be <= store minor
  return model.minor <= store.minor
}

// ============================================================================
// Feature Types
// ============================================================================

export type FeatureType = 'numeric' | 'categorical' | 'boolean' | 'embedding'
export type FeatureDomain = 'player' | 'team' | 'match' | 'map' | 'meta'

export interface FeatureDefinition {
  name: string
  type: FeatureType
  domain: FeatureDomain
  description: string
  defaultValue: number
  min?: number
  max?: number
  version: string // When this feature was added
  deprecated?: boolean
  normalization?: 'minmax' | 'zscore' | 'log' | 'none'
}

// ============================================================================
// Win Probability Features
// ============================================================================

export interface WinProbabilityFeatures {
  // Team composition (0-10 players, 5 per team)
  'team_a_rating_avg': number
  'team_a_rating_std': number
  'team_b_rating_avg': number
  'team_b_rating_std': number
  
  // Rating differences
  'rating_diff_avg': number
  'rating_diff_max': number
  'rating_diff_min': number
  
  // Recent form (last 5 matches)
  'team_a_win_rate_5': number
  'team_b_win_rate_5': number
  'team_a_avg_round_diff_5': number
  'team_b_avg_round_diff_5': number
  
  // Map specific
  'team_a_map_win_rate': number
  'team_b_map_win_rate': number
  'map_picked_by': number // 0 = team_a, 1 = team_b, -1 = decider
  
  // Tournament context
  'is_lan': number
  'tournament_tier': number // 1-5 (S, A, B, C, Qualifier)
  'elimination_match': number
  
  // Head to head
  'h2h_wins_a': number
  'h2h_wins_b': number
  'h2h_total': number
  
  // Momentum
  'team_a_streak': number // positive = win streak, negative = loss streak
  'team_b_streak': number
}

export const WIN_PROBABILITY_FEATURE_DEFINITIONS: Record<keyof WinProbabilityFeatures, FeatureDefinition> = {
  'team_a_rating_avg': {
    name: 'team_a_rating_avg',
    type: 'numeric',
    domain: 'team',
    description: 'Average player rating for team A',
    defaultValue: 1.0,
    min: 0,
    max: 3,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_a_rating_std': {
    name: 'team_a_rating_std',
    type: 'numeric',
    domain: 'team',
    description: 'Standard deviation of ratings for team A',
    defaultValue: 0.2,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_b_rating_avg': {
    name: 'team_b_rating_avg',
    type: 'numeric',
    domain: 'team',
    description: 'Average player rating for team B',
    defaultValue: 1.0,
    min: 0,
    max: 3,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_b_rating_std': {
    name: 'team_b_rating_std',
    type: 'numeric',
    domain: 'team',
    description: 'Standard deviation of ratings for team B',
    defaultValue: 0.2,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'rating_diff_avg': {
    name: 'rating_diff_avg',
    type: 'numeric',
    domain: 'team',
    description: 'Difference in average ratings (A - B)',
    defaultValue: 0,
    min: -2,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'rating_diff_max': {
    name: 'rating_diff_max',
    type: 'numeric',
    domain: 'player',
    description: 'Maximum rating difference between any pair',
    defaultValue: 0,
    min: -2,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'rating_diff_min': {
    name: 'rating_diff_min',
    type: 'numeric',
    domain: 'player',
    description: 'Minimum rating difference between any pair',
    defaultValue: 0,
    min: -2,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_a_win_rate_5': {
    name: 'team_a_win_rate_5',
    type: 'numeric',
    domain: 'team',
    description: 'Team A win rate in last 5 matches',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'team_b_win_rate_5': {
    name: 'team_b_win_rate_5',
    type: 'numeric',
    domain: 'team',
    description: 'Team B win rate in last 5 matches',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'team_a_avg_round_diff_5': {
    name: 'team_a_avg_round_diff_5',
    type: 'numeric',
    domain: 'team',
    description: 'Average round differential for team A (last 5)',
    defaultValue: 0,
    min: -13,
    max: 13,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_b_avg_round_diff_5': {
    name: 'team_b_avg_round_diff_5',
    type: 'numeric',
    domain: 'team',
    description: 'Average round differential for team B (last 5)',
    defaultValue: 0,
    min: -13,
    max: 13,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_a_map_win_rate': {
    name: 'team_a_map_win_rate',
    type: 'numeric',
    domain: 'map',
    description: 'Team A win rate on current map (last 10)',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'team_b_map_win_rate': {
    name: 'team_b_map_win_rate',
    type: 'numeric',
    domain: 'map',
    description: 'Team B win rate on current map (last 10)',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'map_picked_by': {
    name: 'map_picked_by',
    type: 'numeric',
    domain: 'map',
    description: 'Which team picked the map (-1 = decider)',
    defaultValue: -1,
    min: -1,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'is_lan': {
    name: 'is_lan',
    type: 'boolean',
    domain: 'meta',
    description: 'Is this a LAN event',
    defaultValue: 0,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'tournament_tier': {
    name: 'tournament_tier',
    type: 'numeric',
    domain: 'meta',
    description: 'Tournament tier (1=S, 2=A, 3=B, 4=C, 5=Qualifier)',
    defaultValue: 3,
    min: 1,
    max: 5,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'elimination_match': {
    name: 'elimination_match',
    type: 'boolean',
    domain: 'meta',
    description: 'Is this an elimination match',
    defaultValue: 0,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'h2h_wins_a': {
    name: 'h2h_wins_a',
    type: 'numeric',
    domain: 'team',
    description: 'Team A wins in head-to-head history',
    defaultValue: 0,
    min: 0,
    max: 20,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'h2h_wins_b': {
    name: 'h2h_wins_b',
    type: 'numeric',
    domain: 'team',
    description: 'Team B wins in head-to-head history',
    defaultValue: 0,
    min: 0,
    max: 20,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'h2h_total': {
    name: 'h2h_total',
    type: 'numeric',
    domain: 'team',
    description: 'Total head-to-head matches',
    defaultValue: 0,
    min: 0,
    max: 30,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_a_streak': {
    name: 'team_a_streak',
    type: 'numeric',
    domain: 'team',
    description: 'Team A current streak (positive = wins)',
    defaultValue: 0,
    min: -5,
    max: 5,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'team_b_streak': {
    name: 'team_b_streak',
    type: 'numeric',
    domain: 'team',
    description: 'Team B current streak (positive = wins)',
    defaultValue: 0,
    min: -5,
    max: 5,
    version: '1.0.0',
    normalization: 'minmax'
  }
}

export const WIN_PROBABILITY_FEATURE_COUNT = Object.keys(WIN_PROBABILITY_FEATURE_DEFINITIONS).length

// ============================================================================
// Player Performance Features
// ============================================================================

export interface PlayerPerformanceFeatures {
  // Core stats
  'kills_per_round': number
  'deaths_per_round': number
  'assists_per_round': number
  'adr': number // Average damage per round
  'kast': number // Kills, assists, survived, traded
  'headshot_percentage': number
  'first_blood_rate': number
  'clutch_win_rate': number
  
  // Consistency
  'rating_consistency': number // std dev of ratings
  'impact_consistency': number
  
  // Role-specific
  'entry_success_rate': number
  'trade_efficiency': number
  'survival_rate': number
  
  // Agent specific (if known)
  'agent_familiarity': number
  'role_alignment': number
  
  // Context
  'pressure_rating': number // Performance in elimination rounds
  'eco_performance': number // Performance in low-buy rounds
}

export const PLAYER_PERFORMANCE_FEATURE_DEFINITIONS: Record<keyof PlayerPerformanceFeatures, FeatureDefinition> = {
  'kills_per_round': {
    name: 'kills_per_round',
    type: 'numeric',
    domain: 'player',
    description: 'Average kills per round',
    defaultValue: 0.7,
    min: 0,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'deaths_per_round': {
    name: 'deaths_per_round',
    type: 'numeric',
    domain: 'player',
    description: 'Average deaths per round',
    defaultValue: 0.7,
    min: 0,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'assists_per_round': {
    name: 'assists_per_round',
    type: 'numeric',
    domain: 'player',
    description: 'Average assists per round',
    defaultValue: 0.3,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'adr': {
    name: 'adr',
    type: 'numeric',
    domain: 'player',
    description: 'Average damage per round',
    defaultValue: 150,
    min: 0,
    max: 300,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'kast': {
    name: 'kast',
    type: 'numeric',
    domain: 'player',
    description: 'KAST percentage',
    defaultValue: 0.7,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'headshot_percentage': {
    name: 'headshot_percentage',
    type: 'numeric',
    domain: 'player',
    description: 'Percentage of kills that are headshots',
    defaultValue: 0.25,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'first_blood_rate': {
    name: 'first_blood_rate',
    type: 'numeric',
    domain: 'player',
    description: 'Rate of getting first blood',
    defaultValue: 0.1,
    min: 0,
    max: 0.5,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'clutch_win_rate': {
    name: 'clutch_win_rate',
    type: 'numeric',
    domain: 'player',
    description: 'Win rate in clutch situations',
    defaultValue: 0.15,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'rating_consistency': {
    name: 'rating_consistency',
    type: 'numeric',
    domain: 'player',
    description: 'Consistency of ratings (inverse of std dev)',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'impact_consistency': {
    name: 'impact_consistency',
    type: 'numeric',
    domain: 'player',
    description: 'Consistency of impact rating',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'entry_success_rate': {
    name: 'entry_success_rate',
    type: 'numeric',
    domain: 'player',
    description: 'Success rate when entering sites',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'trade_efficiency': {
    name: 'trade_efficiency',
    type: 'numeric',
    domain: 'player',
    description: 'Efficiency at trading kills',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'survival_rate': {
    name: 'survival_rate',
    type: 'numeric',
    domain: 'player',
    description: 'Round survival rate',
    defaultValue: 0.3,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'agent_familiarity': {
    name: 'agent_familiarity',
    type: 'numeric',
    domain: 'player',
    description: 'Familiarity with current agent (0-1)',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'role_alignment': {
    name: 'role_alignment',
    type: 'numeric',
    domain: 'player',
    description: 'Alignment with assigned role',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'pressure_rating': {
    name: 'pressure_rating',
    type: 'numeric',
    domain: 'player',
    description: 'Performance under pressure',
    defaultValue: 1.0,
    min: 0,
    max: 3,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'eco_performance': {
    name: 'eco_performance',
    type: 'numeric',
    domain: 'player',
    description: 'Performance in eco rounds',
    defaultValue: 0.8,
    min: 0,
    max: 2,
    version: '1.0.0',
    normalization: 'minmax'
  }
}

export const PLAYER_PERFORMANCE_FEATURE_COUNT = Object.keys(PLAYER_PERFORMANCE_FEATURE_DEFINITIONS).length

// ============================================================================
// Team Synergy Features
// ============================================================================

export interface TeamSynergyFeatures {
  // Communication/coordination proxies
  'trade_success_rate': number
  'flash_assist_rate': number
  'retake_coordination': number
  'site_hold_efficiency': number
  
  // Role balance
  'role_coverage_score': number
  'experience_balance': number
  'rating_balance': number
  
  // Team dynamics
  'roster_stability': number // How long team has played together
  'coach_impact': number
  
  // Tactical
  'pistol_round_win_rate': number
  'conversion_rate': number // Win rounds after first blood
  'force_buy_success': number
  'eco_round_success': number
}

export const TEAM_SYNERGY_FEATURE_DEFINITIONS: Record<keyof TeamSynergyFeatures, FeatureDefinition> = {
  'trade_success_rate': {
    name: 'trade_success_rate',
    type: 'numeric',
    domain: 'team',
    description: 'Successful trade kill rate',
    defaultValue: 0.6,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'flash_assist_rate': {
    name: 'flash_assist_rate',
    type: 'numeric',
    domain: 'team',
    description: 'Kills with flash assist',
    defaultValue: 0.15,
    min: 0,
    max: 0.5,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'retake_coordination': {
    name: 'retake_coordination',
    type: 'numeric',
    domain: 'team',
    description: 'Success rate in retake situations',
    defaultValue: 0.4,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'site_hold_efficiency': {
    name: 'site_hold_efficiency',
    type: 'numeric',
    domain: 'team',
    description: 'Efficiency at holding sites',
    defaultValue: 0.6,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'role_coverage_score': {
    name: 'role_coverage_score',
    type: 'numeric',
    domain: 'team',
    description: 'Coverage of all necessary roles',
    defaultValue: 0.8,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'experience_balance': {
    name: 'experience_balance',
    type: 'numeric',
    domain: 'team',
    description: 'Balance of experience across players',
    defaultValue: 0.7,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'rating_balance': {
    name: 'rating_balance',
    type: 'numeric',
    domain: 'team',
    description: 'Balance of ratings across players',
    defaultValue: 0.7,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'roster_stability': {
    name: 'roster_stability',
    type: 'numeric',
    domain: 'team',
    description: 'Days since roster change (normalized)',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'coach_impact': {
    name: 'coach_impact',
    type: 'numeric',
    domain: 'team',
    description: 'Estimated coach impact factor',
    defaultValue: 1.0,
    min: 0.5,
    max: 1.5,
    version: '1.0.0',
    normalization: 'minmax'
  },
  'pistol_round_win_rate': {
    name: 'pistol_round_win_rate',
    type: 'numeric',
    domain: 'team',
    description: 'Pistol round win rate',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'conversion_rate': {
    name: 'conversion_rate',
    type: 'numeric',
    domain: 'team',
    description: 'Round win rate after first blood',
    defaultValue: 0.65,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'force_buy_success': {
    name: 'force_buy_success',
    type: 'numeric',
    domain: 'team',
    description: 'Success rate in force buy rounds',
    defaultValue: 0.3,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  },
  'eco_round_success': {
    name: 'eco_round_success',
    type: 'numeric',
    domain: 'team',
    description: 'Success rate in eco rounds',
    defaultValue: 0.1,
    min: 0,
    max: 1,
    version: '1.0.0',
    normalization: 'none'
  }
}

export const TEAM_SYNERGY_FEATURE_COUNT = Object.keys(TEAM_SYNERGY_FEATURE_DEFINITIONS).length

// ============================================================================
// Combined Feature Store
// ============================================================================

export type MLModelType = 'win_probability' | 'player_performance' | 'team_synergy'

export interface FeatureStore {
  version: string
  features: {
    win_probability: typeof WIN_PROBABILITY_FEATURE_DEFINITIONS
    player_performance: typeof PLAYER_PERFORMANCE_FEATURE_DEFINITIONS
    team_synergy: typeof TEAM_SYNERGY_FEATURE_DEFINITIONS
  }
}

export const FEATURE_STORE: FeatureStore = {
  version: FEATURE_STORE_VERSION,
  features: {
    win_probability: WIN_PROBABILITY_FEATURE_DEFINITIONS,
    player_performance: PLAYER_PERFORMANCE_FEATURE_DEFINITIONS,
    team_synergy: TEAM_SYNERGY_FEATURE_DEFINITIONS
  }
}

// ============================================================================
// Feature Metadata & Validation
// ============================================================================

export interface FeatureMetadata {
  name: string
  description: string
  featureCount: number
  version: string
  domains: FeatureDomain[]
}

export function getFeatureMetadata(modelType: MLModelType): FeatureMetadata {
  const definitions = FEATURE_STORE.features[modelType]
  const features = Object.values(definitions)
  
  const domains = [...new Set(features.map(f => f.domain))]
  
  return {
    name: modelType,
    description: getModelDescription(modelType),
    featureCount: features.length,
    version: FEATURE_STORE_VERSION,
    domains
  }
}

function getModelDescription(modelType: MLModelType): string {
  switch (modelType) {
    case 'win_probability':
      return 'Predicts match win probability based on team ratings, form, and context'
    case 'player_performance':
      return 'Predicts individual player performance metrics'
    case 'team_synergy':
      return 'Measures team coordination and tactical effectiveness'
    default:
      return 'Unknown model type'
  }
}

export function getFeatureDefinition(
  modelType: MLModelType, 
  featureName: string
): FeatureDefinition | undefined {
  const definitions = FEATURE_STORE.features[modelType]
  return definitions[featureName as keyof typeof definitions]
}

export function getAllFeatureNames(modelType: MLModelType): string[] {
  return Object.keys(FEATURE_STORE.features[modelType])
}

export function validateFeatureValue(
  definition: FeatureDefinition, 
  value: number
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `Value must be a number, got ${typeof value}` }
  }
  
  if (definition.min !== undefined && value < definition.min) {
    return { valid: false, error: `Value ${value} below minimum ${definition.min}` }
  }
  
  if (definition.max !== undefined && value > definition.max) {
    return { valid: false, error: `Value ${value} above maximum ${definition.max}` }
  }
  
  return { valid: true }
}

// ============================================================================
// Feature Vector Helpers
// ============================================================================

export function createDefaultFeatureVector(modelType: MLModelType): number[] {
  const definitions = Object.values(FEATURE_STORE.features[modelType])
  return definitions.map(def => def.defaultValue)
}

export function getFeatureNames(modelType: MLModelType): string[] {
  return Object.keys(FEATURE_STORE.features[modelType])
}

export function featureVectorToObject(
  modelType: MLModelType,
  vector: number[]
): Record<string, number> {
  const names = getFeatureNames(modelType)
  const result: Record<string, number> = {}
  
  names.forEach((name, index) => {
    result[name] = vector[index] ?? 0
  })
  
  return result
}

export function objectToFeatureVector(
  modelType: MLModelType,
  obj: Record<string, number>
): number[] {
  const names = getFeatureNames(modelType)
  const definitions = FEATURE_STORE.features[modelType]
  
  return names.map(name => {
    if (name in obj) {
      return obj[name]
    }
    return definitions[name as keyof typeof definitions].defaultValue
  })
}

// ============================================================================
// Logging
// ============================================================================

export function logFeatureStoreInfo(): void {
  mlLogger.info('[Feature Store] Initialized v' + FEATURE_STORE_VERSION)
  
  Object.entries(FEATURE_STORE.features).forEach(([modelType, definitions]) => {
    const count = Object.keys(definitions).length
    mlLogger.info(`[Feature Store] ${modelType}: ${count} features`)
  })
}

export default FEATURE_STORE
