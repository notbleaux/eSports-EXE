/**
 * ML Feature Extractors for Esports Analytics
 * 
 * [Ver001.000]
 * 
 * Provides feature extraction for:
 * - Player position features
 * - Timing features
 * - Economy features
 * - Team coordination features
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

// Vector2D type definition (local to avoid circular dependency)
interface Vector2D {
  x: number
  y: number
}

import type { 
  Player, 
  MapBounds,
  VisionConeData,
  CrossfireData,
  EntryFraggingData,
  RetakeEfficiencyData,
  PostPlantData,
  FakeDetectionData,
  AnchorPerformanceData,
  LurkEffectivenessData
} from '@/lib/lenses/tactical-types'
import { mlLogger } from '@/utils/logger'

// ============================================================================
// Feature Vector Types
// ============================================================================

export interface PositionFeatures {
  x: number
  y: number
  distanceToSiteA: number
  distanceToSiteB: number
  distanceToCenter: number
  angleToSiteA: number
  angleToSiteB: number
  mapCoverage: number
}

export interface TimingFeatures {
  roundTime: number
  timeToBombPlant: number
  timeSinceLastKill: number
  utilityUsageTiming: number
  rotationTime: number
  phase: 'early' | 'mid' | 'late' | 'post_plant'
}

export interface EconomyFeatures {
  teamBank: number
  averageWeaponValue: number
  armorCoverage: number
  utilityInvestment: number
  economicAdvantage: number
  buyType: 'eco' | 'force' | 'full' | 'over'
}

export interface TeamCoordinationFeatures {
  teamSpread: number
  crossfirePotential: number
  tradePotential: number
  utilityCoordination: number
  communicationScore: number
  formationCompactness: number
}

export interface MatchFeatures {
  position: PositionFeatures
  timing: TimingFeatures
  economy: EconomyFeatures
  coordination: TeamCoordinationFeatures
  labels?: {
    winProbability?: number
    roundOutcome?: 0 | 1
    clutchSuccess?: 0 | 1
  }
}

export interface ExtractedFeatures {
  vector: number[]
  metadata: {
    matchId: string
    roundId: string
    timestamp: number
    featureCount: number
    source: string
  }
}

// ============================================================================
// Position Feature Extraction
// ============================================================================

// const MAP_SIZE = 1024 // Standard map size in game units

/**
 * Extract position-based features from player and map data
 */
export function extractPositionFeatures(
  player: Player,
  mapBounds: MapBounds,
  _allPlayers: Player[]
): PositionFeatures {
  const sites = mapBounds.sites
  const siteA = sites.find(s => s.type === 'a') || sites[0]
  const siteB = sites.find(s => s.type === 'b') || sites[1] || siteA
  const center: Vector2D = { x: mapBounds.width / 2, y: mapBounds.height / 2 }

  const distanceToSiteA = calculateDistance(player.position, siteA.position)
  const distanceToSiteB = siteB ? calculateDistance(player.position, siteB.position) : distanceToSiteA
  const distanceToCenter = calculateDistance(player.position, center)

  const angleToSiteA = calculateAngle(player.position, siteA.position)
  const angleToSiteB = calculateAngle(player.position, siteB.position)

  // Map coverage based on distance from spawn (furthest point estimation)
  const maxDistance = Math.sqrt(mapBounds.width ** 2 + mapBounds.height ** 2) / 2
  const mapCoverage = Math.min(distanceToCenter / maxDistance, 1)

  return {
    x: normalizeCoordinate(player.position.x, mapBounds.width),
    y: normalizeCoordinate(player.position.y, mapBounds.height),
    distanceToSiteA: normalizeDistance(distanceToSiteA, maxDistance),
    distanceToSiteB: normalizeDistance(distanceToSiteB, maxDistance),
    distanceToCenter: normalizeDistance(distanceToCenter, maxDistance),
    angleToSiteA: normalizeAngle(angleToSiteA),
    angleToSiteB: normalizeAngle(angleToSiteB),
    mapCoverage
  }
}

/**
 * Extract position features from vision cone data
 */
export function extractVisionFeatures(visionData: VisionConeData): number[] {
  const cones = visionData.cones
  
  return [
    // Average vision range
    cones.reduce((sum, c) => sum + c.range, 0) / Math.max(cones.length, 1) / 1000,
    
    // Total visible area (normalized)
    Math.min(visionData.coverage.totalArea / 100000, 1),
    
    // Overlap ratio
    visionData.coverage.totalArea > 0 
      ? visionData.coverage.overlappingArea / visionData.coverage.totalArea 
      : 0,
    
    // Number of blind spots (capped)
    Math.min(visionData.coverage.blindSpots.length, 10) / 10,
    
    // Sight line coverage
    Math.min(visionData.sightLines.filter(sl => sl.isClear).length / Math.max(visionData.sightLines.length, 1), 1),
    
    // Average FOV utilization
    cones.reduce((sum, c) => sum + c.fovAngle, 0) / Math.max(cones.length, 1) / 360
  ]
}

// ============================================================================
// Timing Feature Extraction
// ============================================================================

const ROUND_DURATION = 100 // seconds (Valorant round duration)
const BOMB_TIMER = 45 // seconds

/**
 * Extract timing features from round state
 */
export function extractTimingFeatures(
  roundTime: number,
  bombPlantedAt?: number,
  lastKillAt?: number,
  utilityUsedAt?: number[]
): TimingFeatures {
  const timeToBombPlant = bombPlantedAt !== undefined
    ? Math.max(0, bombPlantedAt - roundTime)
    : ROUND_DURATION - roundTime

  const timeSinceLastKill = lastKillAt !== undefined
    ? Math.max(0, roundTime - lastKillAt)
    : roundTime

  const utilityUsageTiming = utilityUsedAt && utilityUsedAt.length > 0
    ? utilityUsedAt.reduce((sum, t) => sum + t, 0) / utilityUsedAt.length / ROUND_DURATION
    : 0.5

  const rotationTime = bombPlantedAt !== undefined
    ? Math.max(0, roundTime - bombPlantedAt)
    : 0

  const phase = getRoundPhase(roundTime, bombPlantedAt)

  return {
    roundTime: roundTime / ROUND_DURATION,
    timeToBombPlant: timeToBombPlant / ROUND_DURATION,
    timeSinceLastKill: Math.min(timeSinceLastKill / 30, 1), // Cap at 30 seconds
    utilityUsageTiming,
    rotationTime: rotationTime / BOMB_TIMER,
    phase
  }
}

/**
 * Get round phase from timing
 */
export function getRoundPhase(
  roundTime: number, 
  bombPlantedAt?: number
): 'early' | 'mid' | 'late' | 'post_plant' {
  if (bombPlantedAt !== undefined && roundTime >= bombPlantedAt) {
    return 'post_plant'
  }
  if (roundTime < 20) return 'early'
  if (roundTime < 70) return 'mid'
  return 'late'
}

/**
 * Encode timing phase as one-hot vector
 */
export function encodeTimingPhase(phase: TimingFeatures['phase']): number[] {
  switch (phase) {
    case 'early': return [1, 0, 0, 0]
    case 'mid': return [0, 1, 0, 0]
    case 'late': return [0, 0, 1, 0]
    case 'post_plant': return [0, 0, 0, 1]
    default: return [0, 0, 0, 0]
  }
}

// ============================================================================
// Economy Feature Extraction
// ============================================================================

const MAX_BANK = 50000
const FULL_BUY_THRESHOLD = 4000
// const FORCE_BUY_THRESHOLD = 2000

/**
 * Extract economy features from team loadout
 */
export function extractEconomyFeatures(
  teamBank: number,
  playerLoadouts: { weaponValue: number; hasArmor: boolean; utilityValue: number }[]
): EconomyFeatures {
  const averageWeaponValue = playerLoadouts.reduce((sum, p) => sum + p.weaponValue, 0) 
    / Math.max(playerLoadouts.length, 1)
  
  const armorCoverage = playerLoadouts.filter(p => p.hasArmor).length 
    / Math.max(playerLoadouts.length, 1)
  
  const utilityInvestment = playerLoadouts.reduce((sum, p) => sum + p.utilityValue, 0)
    / Math.max(playerLoadouts.length, 1) / 1000

  const economicAdvantage = Math.tanh(teamBank / 10000) // Normalize to [-1, 1]

  const buyType = classifyBuyType(averageWeaponValue, armorCoverage)

  return {
    teamBank: Math.min(teamBank / MAX_BANK, 1),
    averageWeaponValue: Math.min(averageWeaponValue / 5000, 1),
    armorCoverage,
    utilityInvestment,
    economicAdvantage: (economicAdvantage + 1) / 2, // Normalize to [0, 1]
    buyType
  }
}

/**
 * Classify buy type based on loadout values
 */
export function classifyBuyType(
  avgWeaponValue: number,
  armorCoverage: number
): EconomyFeatures['buyType'] {
  if (avgWeaponValue < 500 && armorCoverage < 0.4) return 'eco'
  if (avgWeaponValue < FULL_BUY_THRESHOLD || armorCoverage < 0.8) return 'force'
  if (avgWeaponValue > 7000) return 'over'
  return 'full'
}

/**
 * Encode buy type as one-hot vector
 */
export function encodeBuyType(buyType: EconomyFeatures['buyType']): number[] {
  switch (buyType) {
    case 'eco': return [1, 0, 0, 0]
    case 'force': return [0, 1, 0, 0]
    case 'full': return [0, 0, 1, 0]
    case 'over': return [0, 0, 0, 1]
    default: return [0, 0, 0, 0]
  }
}

// ============================================================================
// Team Coordination Feature Extraction
// ============================================================================

/**
 * Extract team coordination features
 */
export function extractTeamCoordinationFeatures(
  players: Player[],
  crossfireData?: CrossfireData,
  _visionData?: VisionConeData
): TeamCoordinationFeatures {
  const teamPositions = players.filter(p => p.team === players[0]?.team).map(p => p.position)
  
  // Team spread (standard deviation of positions)
  const teamSpread = calculateTeamSpread(teamPositions)
  
  // Crossfire potential from lens data
  const crossfirePotential = crossfireData 
    ? crossfireData.setups.reduce((sum, s) => sum + s.effectiveness.coverage, 0) 
      / Math.max(crossfireData.setups.length, 1)
    : 0.5

  // Trade potential based on proximity
  const tradePotential = calculateTradePotential(teamPositions)

  // Utility coordination (placeholder - would need actual utility data)
  const utilityCoordination = 0.5

  // Communication score based on formation
  const communicationScore = 1 - Math.min(teamSpread * 2, 1)

  // Formation compactness
  const formationCompactness = 1 - teamSpread

  return {
    teamSpread,
    crossfirePotential,
    tradePotential,
    utilityCoordination,
    communicationScore,
    formationCompactness
  }
}

/**
 * Calculate trade potential from team positions
 */
export function calculateTradePotential(positions: Vector2D[]): number {
  if (positions.length < 2) return 0

  let tradePairs = 0
  const maxTradeDistance = 500 // units

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = calculateDistance(positions[i], positions[j])
      if (dist < maxTradeDistance) {
        tradePairs++
      }
    }
  }

  const maxPairs = (positions.length * (positions.length - 1)) / 2
  return Math.min(tradePairs / maxPairs, 1)
}

// ============================================================================
// Lens-Based Feature Extraction
// ============================================================================

/**
 * Extract features from tactical lens data
 */
export function extractLensFeatures(lensData: {
  vision?: VisionConeData
  crossfire?: CrossfireData
  entry?: EntryFraggingData
  retake?: RetakeEfficiencyData
  postPlant?: PostPlantData
  fake?: FakeDetectionData
  anchor?: AnchorPerformanceData
  lurk?: LurkEffectivenessData
}): number[] {
  const features: number[] = []

  // Entry fragging features
  if (lensData.entry) {
    features.push(
      lensData.entry.overallStats.successRate,
      Math.min(lensData.entry.overallStats.totalAttempts / 100, 1),
      lensData.entry.overallStats.firstBloodRate,
      Math.min(lensData.entry.overallStats.averageEntryTime / 60, 1)
    )
  } else {
    features.push(0.5, 0, 0.1, 0.5)
  }

  // Retake efficiency features
  if (lensData.retake) {
    features.push(
      lensData.retake.metrics.overallSuccessRate,
      Math.min(lensData.retake.metrics.averageTime / 60, 1),
      Math.min(lensData.retake.optimalPaths.length / 5, 1)
    )
  } else {
    features.push(0.5, 0.5, 0)
  }

  // Post-plant features
  if (lensData.postPlant) {
    const roles = Object.keys(lensData.postPlant.winRates.byRole)
    features.push(
      roles.length > 0 
        ? Object.values(lensData.postPlant.winRates.byRole).reduce((a, b) => a + b, 0) / roles.length 
        : 0.5,
      Math.min(lensData.postPlant.optimalPositions.length / 10, 1)
    )
  } else {
    features.push(0.5, 0)
  }

  // Fake detection features
  if (lensData.fake) {
    features.push(
      lensData.fake.metrics.detectionRate,
      lensData.fake.metrics.successfulFakes / Math.max(lensData.fake.metrics.totalFakes, 1),
      Math.min(lensData.fake.metrics.averageCommitTime / 60, 1)
    )
  } else {
    features.push(0.5, 0.5, 0.5)
  }

  // Lurk effectiveness features
  if (lensData.lurk) {
    features.push(
      lensData.lurk.metrics.successRate,
      lensData.lurk.metrics.backstabRate,
      lensData.lurk.metrics.survivalRate,
      Math.min(lensData.lurk.metrics.averageImpact / 100, 1)
    )
  } else {
    features.push(0, 0, 0, 0)
  }

  return features
}

// ============================================================================
// Complete Feature Vector Assembly
// ============================================================================

/**
 * Assemble complete feature vector from all sources
 */
export function assembleFeatureVector(
  player: Player,
  mapBounds: MapBounds,
  allPlayers: Player[],
  timing: { roundTime: number; bombPlantedAt?: number; lastKillAt?: number },
  economy: { teamBank: number; playerLoadouts: Parameters<typeof extractEconomyFeatures>[1] },
  lensData?: Parameters<typeof extractLensFeatures>[0]
): ExtractedFeatures {
  const positionFeatures = extractPositionFeatures(player, mapBounds, allPlayers)
  const timingFeatures = extractTimingFeatures(
    timing.roundTime,
    timing.bombPlantedAt,
    timing.lastKillAt
  )
  const economyFeatures = extractEconomyFeatures(
    economy.teamBank,
    economy.playerLoadouts
  )
  const coordinationFeatures = extractTeamCoordinationFeatures(allPlayers)
  const lensFeatures = lensData ? extractLensFeatures(lensData) : new Array(16).fill(0.5)

  // Assemble vector
  const vector = [
    // Position features (8)
    positionFeatures.x,
    positionFeatures.y,
    positionFeatures.distanceToSiteA,
    positionFeatures.distanceToSiteB,
    positionFeatures.distanceToCenter,
    positionFeatures.angleToSiteA,
    positionFeatures.angleToSiteB,
    positionFeatures.mapCoverage,

    // Timing features (6) - including one-hot phase
    timingFeatures.roundTime,
    timingFeatures.timeToBombPlant,
    timingFeatures.timeSinceLastKill,
    timingFeatures.utilityUsageTiming,
    timingFeatures.rotationTime,
    ...encodeTimingPhase(timingFeatures.phase),

    // Economy features (10) - including one-hot buy type
    economyFeatures.teamBank,
    economyFeatures.averageWeaponValue,
    economyFeatures.armorCoverage,
    economyFeatures.utilityInvestment,
    economyFeatures.economicAdvantage,
    ...encodeBuyType(economyFeatures.buyType),

    // Coordination features (6)
    coordinationFeatures.teamSpread,
    coordinationFeatures.crossfirePotential,
    coordinationFeatures.tradePotential,
    coordinationFeatures.utilityCoordination,
    coordinationFeatures.communicationScore,
    coordinationFeatures.formationCompactness,

    // Lens-based features (16)
    ...lensFeatures
  ]

  mlLogger.debug('Assembled feature vector', { 
    featureCount: vector.length,
    playerId: player.id 
  })

  return {
    vector,
    metadata: {
      matchId: '', // To be filled by caller
      roundId: '',
      timestamp: Date.now(),
      featureCount: vector.length,
      source: 'TL-S3-3-A'
    }
  }
}

// ============================================================================
// Feature Normalization Utilities
// ============================================================================

/**
 * Normalize coordinate to [0, 1] range
 */
function normalizeCoordinate(value: number, max: number): number {
  return Math.max(0, Math.min(value / max, 1))
}

/**
 * Normalize distance to [0, 1] range
 */
function normalizeDistance(value: number, max: number): number {
  return Math.min(value / max, 1)
}

/**
 * Normalize angle to [-1, 1] range (cosine)
 */
function normalizeAngle(angle: number): number {
  return Math.cos(angle * Math.PI / 180)
}

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * Calculate angle from point a to point b in degrees
 */
export function calculateAngle(from: Vector2D, to: Vector2D): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
}

/**
 * Calculate team spread (average distance from centroid)
 */
function calculateTeamSpread(positions: Vector2D[]): number {
  if (positions.length === 0) return 0

  const centroid = {
    x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
    y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
  }

  const avgDistance = positions.reduce((sum, p) => 
    sum + calculateDistance(p, centroid), 0) / positions.length

  return Math.min(avgDistance / 500, 1) // Normalize to [0, 1]
}

// ============================================================================
// Feature Metadata
// ============================================================================

export const FEATURE_DIMENSIONS = {
  position: 8,
  timing: 9, // 5 continuous + 4 one-hot
  economy: 9, // 5 continuous + 4 one-hot
  coordination: 6,
  lens: 16,
  total: 48
}

export const FEATURE_NAMES = [
  // Position
  'pos_x', 'pos_y', 'dist_site_a', 'dist_site_b', 'dist_center',
  'angle_site_a', 'angle_site_b', 'map_coverage',
  
  // Timing
  'round_time', 'time_to_plant', 'time_since_kill', 'utility_timing',
  'rotation_time', 'phase_early', 'phase_mid', 'phase_late', 'phase_post',
  
  // Economy
  'team_bank', 'weapon_value', 'armor_coverage', 'utility_invest',
  'econ_advantage', 'buy_eco', 'buy_force', 'buy_full', 'buy_over',
  
  // Coordination
  'team_spread', 'crossfire_potential', 'trade_potential', 'utility_coord',
  'comm_score', 'formation_compact',
  
  // Lens features
  'entry_success_rate', 'entry_attempts', 'first_blood_rate', 'avg_entry_time',
  'retake_success_rate', 'retake_avg_time', 'retake_paths',
  'postplant_winrate', 'postplant_positions',
  'fake_detection_rate', 'fake_success_rate', 'fake_commit_time',
  'lurk_success', 'lurk_backstab', 'lurk_survival', 'lurk_impact'
]

// ============================================================================
// Feature Validation
// ============================================================================

/**
 * Validate feature vector integrity
 */
export function validateFeatureVector(vector: number[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (vector.length !== FEATURE_DIMENSIONS.total) {
    errors.push(`Expected ${FEATURE_DIMENSIONS.total} features, got ${vector.length}`)
  }

  for (let i = 0; i < vector.length; i++) {
    const value = vector[i]
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`Feature ${i} (${FEATURE_NAMES[i]}) is not a valid number: ${value}`)
    } else if (!isFinite(value)) {
      errors.push(`Feature ${i} (${FEATURE_NAMES[i]}) is infinite`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Check if features contain missing values (NaN)
 */
export function hasMissingValues(vector: number[]): boolean {
  return vector.some(v => typeof v !== 'number' || isNaN(v))
}

/**
 * Fill missing values with defaults
 */
export function fillMissingValues(vector: number[]): number[] {
  return vector.map((v, i) => {
    if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) {
      // Return appropriate default based on feature type
      if (i >= 13 && i <= 16) return 0 // Phase one-hot defaults
      if (i >= 21 && i <= 24) return 0 // Buy type one-hot defaults
      return 0.5 // Default for continuous features
    }
    return v
  })
}
