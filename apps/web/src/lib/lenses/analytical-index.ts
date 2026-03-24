/** [Ver001.000]
 * Analytical Lenses Index
 * =======================
 * Central export module for all 8 SpecMap V2 Analytical Lenses.
 * 
 * Lenses:
 * 1. Rotation Predictor - Predicts team rotations based on timing
 * 2. Timing Windows - Shows optimal execute timings
 * 3. Push Probability - Probability heatmap for site pushes
 * 4. Clutch Zones - Highlights areas where clutches occur
 * 5. Utility Coverage - Shows smoke/flash/molly coverage
 * 6. Trade Routes - Common rotation paths with frequency
 * 7. Information Gaps - Areas with low information/blind spots
 * 8. Economy Pressure - Economic pressure visualization
 * 
 * @module AnalyticalLenses
 */

// ============================================================================
// Lens Exports
// ============================================================================

export { calculate as calculateRotationPredictor, render as renderRotationPredictor } from './rotation-predictor'
export { calculate as calculateTimingWindows, render as renderTimingWindows } from './timing-windows'
export { calculate as calculatePushProbability, render as renderPushProbability } from './push-probability'
export { calculate as calculateClutchZones, render as renderClutchZones } from './clutch-zones'
export { calculate as calculateUtilityCoverage, render as renderUtilityCoverage } from './utility-coverage'
export { calculate as calculateTradeRoutes, render as renderTradeRoutes } from './trade-routes'
export { calculate as calculateInfoGaps, render as renderInfoGaps } from './info-gaps'
export { calculate as calculateEcoPressure, render as renderEcoPressure } from './eco-pressure'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  RotationPrediction,
  RotationInput,
  RotationLensData,
  RotationRenderOptions,
  HistoricalRotationPattern
} from './rotation-predictor'

export type {
  TimingWindow,
  TimingInput,
  TimingLensData,
  TimingRenderOptions,
  RoundPhase
} from './timing-windows'

export type {
  PushProbability,
  PushFactor,
  PushProbabilityInput,
  PushProbabilityLensData,
  PushProbabilityRenderOptions
} from './push-probability'

export type {
  ClutchZone,
  ClutchEvent,
  ClutchZoneInput,
  ClutchZoneLensData,
  ClutchZoneRenderOptions
} from './clutch-zones'

export type {
  UtilityInstance,
  CoverageZone,
  UtilityCoverageInput,
  UtilityCoverageLensData,
  UtilityCoverageRenderOptions
} from './utility-coverage'

export type {
  TradeRoute,
  RouteEvent,
  TradeRouteInput,
  TradeRouteLensData,
  TradeRouteRenderOptions
} from './trade-routes'

export type {
  InfoGap,
  VisionSource,
  InfoGapInput,
  InfoGapLensData,
  InfoGapRenderOptions
} from './info-gaps'

export type {
  TeamEconomy,
  EcoPressureZone,
  EcoForecast,
  EcoPressureInput,
  EcoPressureLensData,
  EcoPressureRenderOptions
} from './eco-pressure'

// ============================================================================
// Constants Exports
// ============================================================================

export { DEFAULT_SITES, ROTATION_SPEEDS, RISK_THRESHOLDS } from './rotation-predictor'
export { DEFAULT_PHASES, WINDOW_COLORS, DEFAULT_ROUND_DURATION } from './timing-windows'
export { FACTOR_WEIGHTS as PUSH_FACTOR_WEIGHTS, PROBABILITY_COLORS } from './push-probability'
export { TIER_THRESHOLDS, TIER_COLORS, DEFAULT_GRID_SIZE as CLUTCH_GRID_SIZE } from './clutch-zones'
export { UTILITY_COLORS, TEAM_COLORS, UTILITY_RADII, UTILITY_DURATIONS } from './utility-coverage'
export { STATUS_COLORS as ROUTE_STATUS_COLORS, DEFAULT_TIME_WINDOW } from './trade-routes'
export { SEVERITY_COLORS, COVERAGE_COLORS, DEFAULT_GRID_RESOLUTION as INFO_GAP_GRID_RES } from './info-gaps'
export { BUY_THRESHOLDS, PRESSURE_COLORS } from './eco-pressure'

// ============================================================================
// Lens Registry
// ============================================================================

/** Lens metadata for registration */
export interface LensMetadata {
  /** Lens identifier */
  id: string
  /** Display name */
  name: string
  /** Lens description */
  description: string
  /** Lens category */
  category: 'predictive' | 'positional' | 'strategic' | 'economic'
  /** Default opacity */
  defaultOpacity: number
  /** Supported game modes */
  supportedModes: string[]
  /** Required data inputs */
  requiredInputs: string[]
}

/** All 8 analytical lenses metadata */
export const ANALYTICAL_LENS_REGISTRY: Record<string, LensMetadata> = {
  'rotation-predictor': {
    id: 'rotation-predictor',
    name: 'Rotation Predictor',
    description: 'Predicts team rotations based on timing and generates heatmap of likely positions',
    category: 'predictive',
    defaultOpacity: 0.75,
    supportedModes: ['competitive', 'casual', 'custom'],
    requiredInputs: ['playerPositions', 'roundTime', 'sites']
  },
  'timing-windows': {
    id: 'timing-windows',
    name: 'Timing Windows',
    description: 'Shows optimal execute timings with visual timeline and windows',
    category: 'strategic',
    defaultOpacity: 0.7,
    supportedModes: ['competitive', 'casual', 'custom'],
    requiredInputs: ['currentTime', 'roundDuration', 'economy']
  },
  'push-probability': {
    id: 'push-probability',
    name: 'Push Probability',
    description: 'Probability heatmap for site pushes based on player positions and utility',
    category: 'predictive',
    defaultOpacity: 0.65,
    supportedModes: ['competitive', 'casual'],
    requiredInputs: ['playerPositions', 'activeUtility', 'sites']
  },
  'clutch-zones': {
    id: 'clutch-zones',
    name: 'Clutch Zones',
    description: 'Highlights areas where clutches occur with success rate by position',
    category: 'positional',
    defaultOpacity: 0.6,
    supportedModes: ['competitive', 'casual', 'custom'],
    requiredInputs: ['events', 'mapBounds']
  },
  'utility-coverage': {
    id: 'utility-coverage',
    name: 'Utility Coverage',
    description: 'Shows smoke/flash/molly coverage with overlap analysis',
    category: 'strategic',
    defaultOpacity: 0.5,
    supportedModes: ['competitive', 'casual', 'custom'],
    requiredInputs: ['utilities', 'currentTime']
  },
  'trade-routes': {
    id: 'trade-routes',
    name: 'Trade Routes',
    description: 'Common rotation paths with frequency and timing analysis',
    category: 'positional',
    defaultOpacity: 0.7,
    supportedModes: ['competitive', 'custom'],
    requiredInputs: ['events', 'routes']
  },
  'info-gaps': {
    id: 'info-gaps',
    name: 'Information Gaps',
    description: 'Identifies areas with low information and blind spots',
    category: 'strategic',
    defaultOpacity: 0.6,
    supportedModes: ['competitive', 'casual'],
    requiredInputs: ['visionSources', 'mapBounds', 'keyAreas']
  },
  'eco-pressure': {
    id: 'eco-pressure',
    name: 'Economy Pressure',
    description: 'Economic pressure visualization with buy round predictions',
    category: 'economic',
    defaultOpacity: 0.8,
    supportedModes: ['competitive'],
    requiredInputs: ['economies', 'currentRound', 'roundHistory']
  }
}

/** Get all lens metadata */
export const getAllLensMetadata = (): LensMetadata[] => {
  return Object.values(ANALYTICAL_LENS_REGISTRY)
}

/** Get lens metadata by ID */
export const getLensMetadata = (id: string): LensMetadata | undefined => {
  return ANALYTICAL_LENS_REGISTRY[id]
}

/** Get lenses by category */
export const getLensesByCategory = (category: LensMetadata['category']): LensMetadata[] => {
  return getAllLensMetadata().filter(lens => lens.category === category)
}

// ============================================================================
// Lens Calculator Registry
// ============================================================================

/** Calculate function type */
export type LensCalculateFunction = (input: unknown) => unknown

/** Render function type */
export type LensRenderFunction = (options: unknown) => boolean

/** Lens calculator entry */
export interface LensCalculator {
  calculate: LensCalculateFunction
  render: LensRenderFunction
  metadata: LensMetadata
}

/** All lens calculators */
export const LENS_CALCULATORS: Record<string, LensCalculator> = {
  'rotation-predictor': {
    calculate: calculateRotationPredictor,
    render: renderRotationPredictor,
    metadata: ANALYTICAL_LENS_REGISTRY['rotation-predictor']
  },
  'timing-windows': {
    calculate: calculateTimingWindows,
    render: renderTimingWindows,
    metadata: ANALYTICAL_LENS_REGISTRY['timing-windows']
  },
  'push-probability': {
    calculate: calculatePushProbability,
    render: renderPushProbability,
    metadata: ANALYTICAL_LENS_REGISTRY['push-probability']
  },
  'clutch-zones': {
    calculate: calculateClutchZones,
    render: renderClutchZones,
    metadata: ANALYTICAL_LENS_REGISTRY['clutch-zones']
  },
  'utility-coverage': {
    calculate: calculateUtilityCoverage,
    render: renderUtilityCoverage,
    metadata: ANALYTICAL_LENS_REGISTRY['utility-coverage']
  },
  'trade-routes': {
    calculate: calculateTradeRoutes,
    render: renderTradeRoutes,
    metadata: ANALYTICAL_LENS_REGISTRY['trade-routes']
  },
  'info-gaps': {
    calculate: calculateInfoGaps,
    render: renderInfoGaps,
    metadata: ANALYTICAL_LENS_REGISTRY['info-gaps']
  },
  'eco-pressure': {
    calculate: calculateEcoPressure,
    render: renderEcoPressure,
    metadata: ANALYTICAL_LENS_REGISTRY['eco-pressure']
  }
}

// Import calculate/render functions for registry
import { calculate as calculateRotationPredictor, render as renderRotationPredictor } from './rotation-predictor'
import { calculate as calculateTimingWindows, render as renderTimingWindows } from './timing-windows'
import { calculate as calculatePushProbability, render as renderPushProbability } from './push-probability'
import { calculate as calculateClutchZones, render as renderClutchZones } from './clutch-zones'
import { calculate as calculateUtilityCoverage, render as renderUtilityCoverage } from './utility-coverage'
import { calculate as calculateTradeRoutes, render as renderTradeRoutes } from './trade-routes'
import { calculate as calculateInfoGaps, render as renderInfoGaps } from './info-gaps'
import { calculate as calculateEcoPressure, render as renderEcoPressure } from './eco-pressure'

// ============================================================================
// Preset Configurations
// ============================================================================

/** Preset lens combinations */
export const LENS_PRESETS = {
  /** All analytical lenses */
  all: Object.keys(ANALYTICAL_LENS_REGISTRY),
  
  /** Predictive lenses only */
  predictive: ['rotation-predictor', 'push-probability'],
  
  /** Strategic lenses */
  strategic: ['timing-windows', 'utility-coverage', 'info-gaps'],
  
  /** Positional/Map awareness */
  positional: ['clutch-zones', 'trade-routes'],
  
  /** Economic focus */
  economic: ['eco-pressure'],
  
  /** Attack-focused set */
  attack: ['push-probability', 'timing-windows', 'trade-routes', 'eco-pressure'],
  
  /** Defense-focused set */
  defense: ['clutch-zones', 'utility-coverage', 'info-gaps', 'rotation-predictor'],
  
  /** Pre-round planning */
  preRound: ['push-probability', 'timing-windows', 'eco-pressure', 'info-gaps'],
  
  /** Post-plant situation */
  postPlant: ['clutch-zones', 'utility-coverage', 'rotation-predictor'],
  
  /** Minimal essential */
  minimal: ['push-probability', 'eco-pressure']
}

/** Get preset lens IDs */
export const getPresetLenses = (preset: keyof typeof LENS_PRESETS): string[] => {
  return LENS_PRESETS[preset] || LENS_PRESETS.all
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if all required inputs are available for a lens
 * @param lensId - Lens identifier
 * @param availableInputs - Available input keys
 * @returns True if all required inputs are present
 */
export const validateLensInputs = (
  lensId: string,
  availableInputs: string[]
): boolean => {
  const metadata = getLensMetadata(lensId)
  if (!metadata) return false
  
  return metadata.requiredInputs.every(input => availableInputs.includes(input))
}

/**
 * Get missing inputs for a lens
 * @param lensId - Lens identifier
 * @param availableInputs - Available input keys
 * @returns Array of missing input names
 */
export const getMissingInputs = (
  lensId: string,
  availableInputs: string[]
): string[] => {
  const metadata = getLensMetadata(lensId)
  if (!metadata) return []
  
  return metadata.requiredInputs.filter(input => !availableInputs.includes(input))
}

/**
 * Batch calculate multiple lenses
 * @param lensIds - Array of lens identifiers
 * @param inputs - Input data keyed by lens ID
 * @returns Results keyed by lens ID
 */
export const batchCalculate = (
  lensIds: string[],
  inputs: Record<string, unknown>
): Record<string, { success: boolean; data?: unknown; error?: string }> => {
  const results: Record<string, { success: boolean; data?: unknown; error?: string }> = {}
  
  lensIds.forEach(id => {
    const calculator = LENS_CALCULATORS[id]
    if (!calculator) {
      results[id] = { success: false, error: `Lens ${id} not found` }
      return
    }
    
    const input = inputs[id]
    if (input === undefined) {
      results[id] = { success: false, error: `No input provided for lens ${id}` }
      return
    }
    
    try {
      const data = calculator.calculate(input)
      results[id] = { success: true, data }
    } catch (error) {
      results[id] = { success: false, error: String(error) }
    }
  })
  
  return results
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  registry: ANALYTICAL_LENS_REGISTRY,
  calculators: LENS_CALCULATORS,
  presets: LENS_PRESETS,
  getAllLensMetadata,
  getLensMetadata,
  getLensesByCategory,
  getPresetLenses,
  validateLensInputs,
  getMissingInputs,
  batchCalculate
}
