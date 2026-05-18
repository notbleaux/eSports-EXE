// @ts-nocheck
/** [Ver001.000]
 * Tactical Lens Types for SpecMap V2
 * Type definitions for the 8 tactical analysis lenses
 * 
 * Lenses:
 * 1. Vision Cone - Player FOV visualization
 * 2. Crossfire Analysis - Crossfire setup identification
 * 3. Retake Efficiency - Site retake analysis
 * 4. Entry Fragging - First blood analysis
 * 5. Post-Plant Positioning - Post-plant analysis
 * 6. Fake Detection - Fake execute identification
 * 7. Anchor Performance - Site anchor analysis
 * 8. Lurk Effectiveness - Lurker path analysis
 */

import type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'

// ============================================================================
// Shared Types
// ============================================================================

/** Player reference with position (tactical lens context) */
export interface TacticalLensPlayer {
  id: string
  name: string
  team: 'attackers' | 'defenders'
  agent: string
  position: Vector2D
  rotation: number // degrees, 0 = right/east
  isAlive: boolean
}

/** @deprecated Use TacticalLensPlayer. Kept for backwards compatibility. */
export type Player = TacticalLensPlayer

/** Site location on map */
export interface Site {
  name: string
  position: Vector2D
  radius: number
  type: 'a' | 'b' | 'c' | 'mid'
}

/** Map boundary and metadata */
export interface MapBounds {
  width: number
  height: number
  scale: number // pixels per game unit
  sites: Site[]
}

/** Base lens calculation result */
export interface LensResult<T> {
  data: T
  metadata: {
    calculatedAt: number
    confidence: number // 0.0 to 1.0
    sampleSize: number
  }
}

// ============================================================================
// 1. Vision Cone Lens Types
// ============================================================================

/** Vision cone data for a single player */
export interface VisionCone {
  playerId: string
  position: Vector2D
  rotation: number
  fovAngle: number // degrees, typically 90 for Valorant
  range: number
  cone: {
    apex: Vector2D
    leftEdge: Vector2D
    rightEdge: Vector2D
  }
  visibleArea: Vector2D[] // polygon points
  intersections: VisionIntersection[]
}

/** Intersection with obstacles or other vision cones */
export interface VisionIntersection {
  type: 'wall' | 'smoke' | 'molly' | 'player' | 'cone'
  position: Vector2D
  distance: number
}

/** Vision cone analysis result */
export interface VisionConeData {
  cones: VisionCone[]
  coverage: {
    totalArea: number
    overlappingArea: number
    blindSpots: Vector2D[]
  }
  sightLines: SightLine[]
}

/** Direct line of sight between two points */
export interface SightLine {
  from: Vector2D
  to: Vector2D
  distance: number
  isClear: boolean
  obstructions: string[]
}

// ============================================================================
// 2. Crossfire Analysis Lens Types
// ============================================================================

/** Crossfire setup between two or more players */
export interface CrossfireSetup {
  id: string
  players: string[] // player IDs
  positions: Vector2D[]
  coverageArea: Vector2D[] // polygon
  overlapZone: Vector2D[] // intersection polygon
  angles: number[] // angles between positions
  effectiveness: CrossfireEffectiveness
  type: 'double' | 'triple' | 'nest'
}

/** Effectiveness metrics for crossfire */
export interface CrossfireEffectiveness {
  coverage: number // 0.0 to 1.0
  angleQuality: number // 0.0 to 1.0, optimal ~90 degrees
  escapeDifficulty: number // 0.0 to 1.0
  historicalSuccess: number // 0.0 to 1.0
}

/** Crossfire analysis result */
export interface CrossfireData {
  setups: CrossfireSetup[]
  coverage: {
    total: number
    overlapping: number
    gaps: Vector2D[][]
  }
  recommendations: CrossfireRecommendation[]
}

/** Suggested crossfire improvements */
export interface CrossfireRecommendation {
  type: 'add_position' | 'adjust_angle' | 'remove_overlap'
  priority: 'high' | 'medium' | 'low'
  description: string
  position?: Vector2D
  affectedPlayers?: string[]
}

// ============================================================================
// 3. Retake Efficiency Lens Types
// ============================================================================

/** Retake scenario analysis */
export interface RetakeScenario {
  roundId: string
  site: Site
  attackerPositions: Player[]
  defenderPositions: Player[]
  plantTime: number
  retakeStartTime: number
  retakeEndTime: number
  outcome: 'success' | 'failure' | 'timeout'
  paths: RetakePath[]
}

/** Optimal retake path */
export interface RetakePath {
  id: string
  waypoints: Vector2D[]
  distance: number
  estimatedTime: number
  risk: number // 0.0 to 1.0
  utilityRequired: string[]
  successRate: number // 0.0 to 1.0
}

/** Retake efficiency metrics */
export interface RetakeMetrics {
  overallSuccessRate: number
  averageTime: number
  bySite: Record<string, SiteRetakeMetrics>
  byPlayerCount: Record<number, number>
}

/** Per-site retake metrics */
export interface SiteRetakeMetrics {
  attempts: number
  successes: number
  averageTime: number
  optimalEntry: Vector2D
  bestUtility: string[]
}

/** Retake efficiency result */
export interface RetakeEfficiencyData {
  scenarios: RetakeScenario[]
  metrics: RetakeMetrics
  optimalPaths: RetakePath[]
  recommendations: RetakeRecommendation[]
}

/** Retake strategy recommendations */
export interface RetakeRecommendation {
  site: string
  timing: 'immediate' | 'delayed' | 'coordinated'
  pathId: string
  utilitySequence: string[]
  priorityTargets: Vector2D[]
}

// ============================================================================
// 4. Entry Fragging Lens Types
// ============================================================================

/** Entry attempt analysis */
export interface EntryAttempt {
  id: string
  roundId: string
  site: Site
  entryPoint: Vector2D
  entryTime: number
  attackers: Player[]
  defenders: Player[]
  outcome: EntryOutcome
  firstBlood?: FirstBlood
}

/** Entry outcome details */
export interface EntryOutcome {
  success: boolean
  kills: number
  deaths: number
  trades: number
  siteTaken: boolean
}

/** First blood event */
export interface FirstBlood {
  time: number
  killer: string
  victim: string
  weapon: string
  position: Vector2D
  isEntryKill: boolean
}

/** Entry success by position */
export interface EntryPositionStats {
  position: Vector2D
  attempts: number
  successes: number
  firstBloods: number
  deaths: number
  kdr: number
  successRate: number
  averageTime: number
}

/** Entry fragging analysis result */
export interface EntryFraggingData {
  attempts: EntryAttempt[]
  positionStats: EntryPositionStats[]
  overallStats: {
    totalAttempts: number
    successRate: number
    averageEntryTime: number
    firstBloodRate: number
  }
  recommendations: EntryRecommendation[]
}

/** Entry strategy recommendations */
export interface EntryRecommendation {
  site: string
  entryPoint: Vector2D
  utility: string[]
  coordination: 'solo' | 'double' | 'triple'
  timing: number // seconds into round
  confidence: number
}

// ============================================================================
// 5. Post-Plant Positioning Lens Types
// ============================================================================

/** Post-plant scenario */
export interface PostPlantScenario {
  id: string
  roundId: string
  site: Site
  plantTime: number
  bombPosition: Vector2D
  attackerPositions: Player[]
  defenderPositions: Player[]
  outcome: PostPlantOutcome
  keyEvents: PostPlantEvent[]
}

/** Post-plant outcome */
export interface PostPlantOutcome {
  winner: 'attackers' | 'defenders'
  method: 'explosion' | 'defuse' | 'elimination'
  timeElapsed: number
}

/** Post-plant event */
export interface PostPlantEvent {
  time: number
  type: 'position_change' | 'utility_use' | 'kill' | 'defuse_start' | 'defuse_stop'
  position: Vector2D
  playerId: string
  details: Record<string, unknown>
}

/** Optimal post-plant position */
export interface OptimalPostPlantPosition {
  position: Vector2D
  site: string
  role: 'site_anchor' | 'off_site' | 'lurker' | 'rotator'
  effectiveness: number
  lineOfSightToBomb: boolean
  escapeRoutes: Vector2D[]
  coverQuality: number
}

/** Defuse stop prediction */
export interface DefuseStopPrediction {
  probability: number
  optimalTiming: number
  recommendedPosition: Vector2D
  utilityToUse: string[]
}

/** Post-plant analysis result */
export interface PostPlantData {
  scenarios: PostPlantScenario[]
  optimalPositions: OptimalPostPlantPosition[]
  winRates: {
    byPosition: Record<string, number>
    byRole: Record<string, number>
    byTimeElapsed: Record<number, number>
  }
  predictions: DefuseStopPrediction[]
}

// ============================================================================
// 6. Fake Detection Lens Types
// ============================================================================

/** Fake execute analysis */
export interface FakeExecute {
  id: string
  roundId: string
  targetSite: Site
  fakeIndicators: FakeIndicator[]
  actualSite?: Site
  timing: {
    start: number
    commit: number
    rotation: number
  }
  success: boolean // did fake work?
  defenderReactions: DefenderReaction[]
}

/** Indicators of a fake execute */
export interface FakeIndicator {
  type: 'minimal_utility' | 'late_commit' | 'no_planter' | 'sound_inconsistency' | 'position_gap'
  confidence: number
  timestamp: number
  description: string
}

/** Defender reaction to fake */
export interface DefenderReaction {
  playerId: string
  rotation: boolean
  rotationTime?: number
  wasCorrect: boolean
}

/** Fake detection metrics */
export interface FakeMetrics {
  totalFakes: number
  successfulFakes: number
  detectionRate: number
  averageCommitTime: number
  byMap: Record<string, FakeMapMetrics>
}

/** Per-map fake metrics */
export interface FakeMapMetrics {
  fakeRate: number
  successRate: number
  preferredTarget: string
  averageDuration: number
}

/** Fake detection result */
export interface FakeDetectionData {
  fakes: FakeExecute[]
  metrics: FakeMetrics
  patterns: FakePattern[]
  detectionModel: FakeDetectionModel
}

/** Identified fake patterns */
export interface FakePattern {
  name: string
  description: string
  indicators: string[]
  occurrenceRate: number
  effectiveness: number
}

/** ML-like detection model parameters */
export interface FakeDetectionModel {
  thresholds: {
    utilityCommit: number
    timingWindow: number
    positionSpread: number
  }
  weights: Record<string, number>
  confidence: number
}

// ============================================================================
// 7. Anchor Performance Lens Types
// ============================================================================

/** Site anchor player analysis */
export interface AnchorPerformance {
  playerId: string
  site: string
  rounds: number
  holds: AnchorHold[]
  metrics: AnchorMetrics
  strengths: string[]
  weaknesses: string[]
}

/** Individual hold attempt */
export interface AnchorHold {
  roundId: string
  outcome: 'success' | 'death' | 'rotated' | 'saved'
  kills: number
  damageDealt: number
  utilityUsed: string[]
  callouts: string[]
  survivalTime: number
  supportReceived: number // seconds of teammate support
}

/** Anchor performance metrics */
export interface AnchorMetrics {
  holdSuccessRate: number
  averageKills: number
  kast: number // KAST score
  firstContactSurvival: number
  multiKillRate: number
  delayTime: number // seconds delayed for rotate
  tradeEfficiency: number
}

/** Hold scenario details */
export interface HoldScenario {
  site: Site
  attackers: number
  entryPoint: Vector2D
  utilityIncoming: string[]
  anchorPosition: Vector2D
  recommendedActions: string[]
}

/** Anchor performance result */
export interface AnchorPerformanceData {
  anchors: AnchorPerformance[]
  siteAnalysis: Record<string, SiteAnchorAnalysis>
  bestPractices: AnchorBestPractice[]
}

/** Per-site anchor analysis */
export interface SiteAnchorAnalysis {
  site: string
  preferredAnchor: string
  holdSuccessRate: number
  averageUtilityUsed: number
  weakPoints: Vector2D[]
}

/** Best practice recommendations */
export interface AnchorBestPractice {
  situation: string
  recommendation: string
  successRate: number
  examplePositions: Vector2D[]
}

// ============================================================================
// 8. Lurk Effectiveness Lens Types
// ============================================================================

/** Lurker round analysis */
export interface LurkRound {
  id: string
  playerId: string
  path: TimedPosition[]
  timings: LurkTimings
  impact: LurkImpact
  outcome: LurkOutcome
}

/** Lurker path position with timing */
export interface TimedPosition {
  position: Vector2D
  timestamp: number
  velocity: number
  isHidden: boolean // behind cover
}

/** Key lurk timings */
export interface LurkTimings {
  initialMove: number
  positionReached: number
  firstContact?: number
  backstab?: number
  rotationCall?: number
}

/** Lurk impact metrics */
export interface LurkImpact {
  rotationsForced: number
  informationGathered: number
  backstabKills: number
  distractionTime: number
  sitePressure: number
}

/** Lurk outcome */
export interface LurkOutcome {
  success: boolean
  reason: 'backstab' | 'rotation_force' | 'info' | 'none' | 'caught'
  value: number // calculated impact value
}

/** Optimal lurk path */
export interface OptimalLurkPath {
  id: string
  start: Vector2D
  waypoints: Vector2D[]
  end: Vector2D
  estimatedTime: number
  riskPoints: Vector2D[]
  hidePoints: Vector2D[]
  backstabPositions: Vector2D[]
  successRate: number
}

/** Backstab opportunity */
export interface BackstabOpportunity {
  position: Vector2D
  targetArea: Vector2D
  optimalTiming: number
  expectedValue: number
  escapeRoutes: Vector2D[]
}

/** Lurk effectiveness result */
export interface LurkEffectivenessData {
  rounds: LurkRound[]
  optimalPaths: OptimalLurkPath[]
  opportunities: BackstabOpportunity[]
  metrics: LurkMetrics
  timingGuide: LurkTimingGuide
}

/** Overall lurk metrics */
export interface LurkMetrics {
  successRate: number
  averageImpact: number
  backstabRate: number
  survivalRate: number
  infoValue: number
}

/** Timing recommendations for lurkers */
export interface LurkTimingGuide {
  earlyLurk: { start: number; end: number; useCase: string }
  midLurk: { start: number; end: number; useCase: string }
  lateLurk: { start: number; end: number; useCase: string }
  optimalBackstab: number
}

// ============================================================================
// Tactical Lens Union Types
// ============================================================================

/** All tactical lens data types */
export type TacticalLensData =
  | VisionConeData
  | CrossfireData
  | RetakeEfficiencyData
  | EntryFraggingData
  | PostPlantData
  | FakeDetectionData
  | AnchorPerformanceData
  | LurkEffectivenessData

/** Tactical lens calculation function type */
export type TacticalLensCalculator<T> = (
  players: Player[],
  mapBounds: MapBounds,
  roundData?: unknown
) => LensResult<T>

/** Tactical lens render function type */
export type TacticalLensRenderer<T> = (
  canvas: HTMLCanvasElement,
  data: LensResult<T>,
  options?: Partial<LensRenderOptions>
) => void

/** Lens render options */
export interface LensRenderOptions {
  opacity: number
  scale: number
  offset: Vector2D
  colorScheme: 'default' | 'heatmap' | 'team'
  showLabels: boolean
  animationProgress: number
}
