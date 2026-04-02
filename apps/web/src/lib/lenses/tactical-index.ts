// @ts-nocheck
/** [Ver001.000]
 * Tactical Lens Index - SpecMap V2
 * 
 * Central export file for all 8 Tactical Lenses:
 * 1. Vision Cone Lens - Player FOV visualization
 * 2. Crossfire Analysis Lens - Crossfire setup identification
 * 3. Retake Efficiency Lens - Site retake analysis
 * 4. Entry Fragging Lens - First blood analysis
 * 5. Post-Plant Positioning Lens - Post-plant analysis
 * 6. Fake Detection Lens - Fake execute identification
 * 7. Anchor Performance Lens - Site anchor analysis
 * 8. Lurk Effectiveness Lens - Lurker path analysis
 */

// ============================================================================
// Type Exports
// ============================================================================

export * from './tactical-types'

// ============================================================================
// Lens 1: Vision Cone
// ============================================================================

export {
  calculate as calculateVisionCone,
  render as renderVisionCone,
  isPositionVisible,
  getConeOverlap,
  DEFAULT_FOV,
  DEFAULT_VISION_RANGE,
  VISION_COLORS
} from './vision-cone'

export type {
  VisionConeOptions,
  VisionConeData,
  VisionCone,
  SightLine
} from './vision-cone'

// ============================================================================
// Lens 2: Crossfire Analysis
// ============================================================================

export {
  calculate as calculateCrossfire,
  render as renderCrossfire,
  OPTIMAL_CROSSFIRE_ANGLE,
  ANGLE_TOLERANCE,
  MAX_CROSSFIRE_RANGE,
  MIN_CROSSFIRE_RANGE,
  CROSSFIRE_COLORS
} from './crossfire-analysis'

export type {
  CrossfireOptions,
  CrossfireData,
  CrossfireSetup,
  CrossfireEffectiveness
} from './crossfire-analysis'

// ============================================================================
// Lens 3: Retake Efficiency
// ============================================================================

export {
  calculate as calculateRetakeEfficiency,
  render as renderRetakeEfficiency,
  MOVEMENT_SPEED,
  RETAKE_TIMINGS,
  UTILITY_TYPES,
  RETAKE_COLORS
} from './retake-efficiency'

export type {
  RetakeOptions,
  RetakeEfficiencyData,
  RetakeScenario,
  RetakePath
} from './retake-efficiency'

// ============================================================================
// Lens 4: Entry Fragging
// ============================================================================

export {
  calculate as calculateEntryFragging,
  render as renderEntryFragging,
  getEntryTimingCategory,
  calculateEntryDifficulty,
  ENTRY_TIMINGS,
  ENTRY_RADIUS,
  ENTRY_COLORS
} from './entry-fragging'

export type {
  EntryOptions,
  EntryFraggingData,
  EntryAttempt,
  EntryPositionStats
} from './entry-fragging'

// ============================================================================
// Lens 5: Post-Plant Positioning
// ============================================================================

export {
  calculate as calculatePostPlant,
  render as renderPostPlant,
  calculateTimeRemaining,
  isDefusePossible,
  BOMB_TIMER,
  DEFUSE_TIME,
  POSTPLANT_PHASES,
  POSTPLANT_COLORS
} from './post-plant'

export type {
  PostPlantOptions,
  PostPlantData,
  PostPlantScenario,
  OptimalPostPlantPosition
} from './post-plant'

// ============================================================================
// Lens 6: Fake Detection
// ============================================================================

export {
  calculate as calculateFakeDetection,
  render as renderFakeDetection,
  analyzeCurrentExecute,
  getCommitTimingCategory,
  MIN_COMMIT_TIME,
  FAKE_UTILITY_THRESHOLD,
  TIMING_WINDOWS,
  FAKE_COLORS
} from './fake-detection'

export type {
  FakeDetectionOptions,
  FakeDetectionData,
  FakeExecute,
  FakePattern
} from './fake-detection'

// ============================================================================
// Lens 7: Anchor Performance
// ============================================================================

export {
  calculate as calculateAnchorPerformance,
  render as renderAnchorPerformance,
  calculateHoldQuality,
  getPerformanceTier,
  MIN_HOLDS_FOR_STATS,
  HOLD_TIMES,
  KAST_WEIGHTS,
  ANCHOR_COLORS
} from './anchor-performance'

export type {
  AnchorOptions,
  AnchorPerformanceData,
  AnchorPerformance,
  AnchorMetrics
} from './anchor-performance'

// ============================================================================
// Lens 8: Lurk Effectiveness
// ============================================================================

export {
  calculate as calculateLurkEffectiveness,
  render as renderLurkEffectiveness,
  calculateOptimalLurkTiming,
  evaluateLurkPath,
  getLurkPhase,
  LURK_SPEED,
  MIN_LURK_DISTANCE,
  MAX_LURK_DISTANCE,
  BACKSTAB_WINDOW,
  LURK_COLORS
} from './lurk-effectiveness'

export type {
  LurkOptions,
  LurkEffectivenessData,
  LurkRound,
  OptimalLurkPath
} from './lurk-effectiveness'

// ============================================================================
// Lens Registry for Lazy Loading
// ============================================================================

import type { LazyLensMeta } from './lazyLoader'

/** Registry entry for tactical lenses */
export interface TacticalLensRegistryEntry extends LazyLensMeta {
  lensId: string
  category: 'tactical'
}

/** All 8 tactical lenses registry */
export const TACTICAL_LENS_REGISTRY: Record<string, TacticalLensRegistryEntry> = {
  'vision-cone': {
    name: 'vision-cone',
    displayName: 'Vision Cone',
    description: 'Player field of view visualization and sight line analysis',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 3,
    modulePath: '@/lib/lenses/vision-cone',
    exportName: 'visionConeLens',
    preloadPriority: 8,
    lensId: 'TL-01'
  },
  'crossfire-analysis': {
    name: 'crossfire-analysis',
    displayName: 'Crossfire Analysis',
    description: 'Crossfire setup identification and coverage analysis',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/lib/lenses/crossfire-analysis',
    exportName: 'crossfireLens',
    preloadPriority: 7,
    lensId: 'TL-02'
  },
  'retake-efficiency': {
    name: 'retake-efficiency',
    displayName: 'Retake Efficiency',
    description: 'Site retake success analysis and optimal paths',
    category: 'tactical',
    weight: 'heavy',
    memoryEstimate: 5,
    modulePath: '@/lib/lenses/retake-efficiency',
    exportName: 'retakeLens',
    preloadPriority: 6,
    lensId: 'TL-03'
  },
  'entry-fragging': {
    name: 'entry-fragging',
    displayName: 'Entry Fragging',
    description: 'Entry success rates by position and first blood analysis',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 3,
    modulePath: '@/lib/lenses/entry-fragging',
    exportName: 'entryFraggingLens',
    preloadPriority: 7,
    lensId: 'TL-04'
  },
  'post-plant': {
    name: 'post-plant',
    displayName: 'Post-Plant Positioning',
    description: 'Post-plant positioning analysis and defuse predictions',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/lib/lenses/post-plant',
    exportName: 'postPlantLens',
    preloadPriority: 6,
    lensId: 'TL-05'
  },
  'fake-detection': {
    name: 'fake-detection',
    displayName: 'Fake Detection',
    description: 'Fake execute identification and commit timing analysis',
    category: 'tactical',
    weight: 'heavy',
    memoryEstimate: 6,
    modulePath: '@/lib/lenses/fake-detection',
    exportName: 'fakeDetectionLens',
    preloadPriority: 5,
    lensId: 'TL-06'
  },
  'anchor-performance': {
    name: 'anchor-performance',
    displayName: 'Anchor Performance',
    description: 'Site anchor player analysis and hold success rates',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/lib/lenses/anchor-performance',
    exportName: 'anchorLens',
    preloadPriority: 6,
    lensId: 'TL-07'
  },
  'lurk-effectiveness': {
    name: 'lurk-effectiveness',
    displayName: 'Lurk Effectiveness',
    description: 'Lurker path analysis and backstab timing optimization',
    category: 'tactical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/lib/lenses/lurk-effectiveness',
    exportName: 'lurkLens',
    preloadPriority: 5,
    lensId: 'TL-08'
  }
}

/** Get all tactical lens IDs */
export function getTacticalLensIds(): string[] {
  return Object.keys(TACTICAL_LENS_REGISTRY)
}

/** Get tactical lens metadata by ID */
export function getTacticalLensMeta(id: string): TacticalLensRegistryEntry | undefined {
  return TACTICAL_LENS_REGISTRY[id]
}

/** Get all tactical lens metadata */
export function getAllTacticalLenses(): TacticalLensRegistryEntry[] {
  return Object.values(TACTICAL_LENS_REGISTRY)
}

// ============================================================================
// Unified Lens Interface
// ============================================================================

import type { LensResult, LensRenderOptions, TacticalLensData } from './tactical-types'

/** Unified calculate function for any tactical lens */
export function calculateLens<T extends TacticalLensData>(
  lensId: string,
  ...args: unknown[]
): LensResult<T> {
  switch (lensId) {
    case 'vision-cone':
      return calculateVisionCone(args[0] as Player[], args[1] as MapBounds, args[2]) as LensResult<T>
    case 'crossfire-analysis':
      return calculateCrossfire(args[0] as Player[], args[1] as MapBounds, args[2]) as LensResult<T>
    case 'retake-efficiency':
      return calculateRetakeEfficiency(args[0] as Player[], args[1] as MapBounds, args[2] as Site, args[3]) as LensResult<T>
    case 'entry-fragging':
      return calculateEntryFragging(args[0] as Player[], args[1] as MapBounds, args[2] as unknown[], args[3]) as LensResult<T>
    case 'post-plant':
      return calculatePostPlant(args[0] as Player[], args[1] as MapBounds, args[2] as unknown[], args[3]) as LensResult<T>
    case 'fake-detection':
      return calculateFakeDetection(args[0] as Player[], args[1] as MapBounds, args[2] as unknown[], args[3]) as LensResult<T>
    case 'anchor-performance':
      return calculateAnchorPerformance(args[0] as Player[], args[1] as MapBounds, args[2] as unknown[], args[3]) as LensResult<T>
    case 'lurk-effectiveness':
      return calculateLurkEffectiveness(args[0] as Player[], args[1] as MapBounds, args[2] as unknown[], args[3]) as LensResult<T>
    default:
      throw new Error(`Unknown tactical lens: ${lensId}`)
  }
}

/** Unified render function for any tactical lens */
export function renderLens<T extends TacticalLensData>(
  lensId: string,
  canvas: HTMLCanvasElement,
  result: LensResult<T>,
  options?: Partial<LensRenderOptions>
): void {
  switch (lensId) {
    case 'vision-cone':
      renderVisionCone(canvas, result as LensResult<import('./tactical-types').VisionConeData>, options)
      break
    case 'crossfire-analysis':
      renderCrossfire(canvas, result as LensResult<import('./tactical-types').CrossfireData>, options)
      break
    case 'retake-efficiency':
      renderRetakeEfficiency(canvas, result as LensResult<import('./tactical-types').RetakeEfficiencyData>, options)
      break
    case 'entry-fragging':
      renderEntryFragging(canvas, result as LensResult<import('./tactical-types').EntryFraggingData>, options)
      break
    case 'post-plant':
      renderPostPlant(canvas, result as LensResult<import('./tactical-types').PostPlantData>, options)
      break
    case 'fake-detection':
      renderFakeDetection(canvas, result as LensResult<import('./tactical-types').FakeDetectionData>, options)
      break
    case 'anchor-performance':
      renderAnchorPerformance(canvas, result as LensResult<import('./tactical-types').AnchorPerformanceData>, options)
      break
    case 'lurk-effectiveness':
      renderLurkEffectiveness(canvas, result as LensResult<import('./tactical-types').LurkEffectivenessData>, options)
      break
    default:
      throw new Error(`Unknown tactical lens: ${lensId}`)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Calculate confidence for any lens result */
export function getLensConfidence<T>(result: LensResult<T>): number {
  return result.metadata.confidence
}

/** Check if lens has sufficient sample size */
export function hasSufficientData<T>(result: LensResult<T>, minSampleSize = 5): boolean {
  return result.metadata.sampleSize >= minSampleSize
}

/** Get lens calculation timestamp */
export function getLensCalculationTime<T>(result: LensResult<T>): number {
  return result.metadata.calculatedAt
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  TACTICAL_LENS_REGISTRY,
  getTacticalLensIds,
  getTacticalLensMeta,
  getAllTacticalLenses,
  calculateLens,
  renderLens,
  getLensConfidence,
  hasSufficientData,
  getLensCalculationTime
}
