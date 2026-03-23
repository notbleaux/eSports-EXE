/** [Ver001.000] */
/**
 * Tactical Lenses Index
 * =====================
 * Exports all 8 tactical lenses and related utilities for SpecMap tactical analysis.
 *
 * Available Tactical Lenses:
 * 1. rotation-predictor — Predict team rotations with confidence indicators
 * 2. timing-windows — Optimal execute timing windows
 * 3. push-probability — Site execute likelihood visualization
 * 4. clutch-zones — High-success clutch positions
 * 5. utility-coverage — Smoke/molly/flash coverage tracking
 * 6. trade-routes — Optimal support paths
 * 7. info-gaps — Unobserved map areas
 * 8. eco-pressure — Force buy risk visualization
 */

// Export prediction interface and model
export {
  PredictionModel,
  HeuristicPredictionModel,
  predictionModel,
  toPredictionState
} from './predictionInterface'

export type {
  RotationPrediction,
  OutcomePrediction,
  TimingWindow,
  PushProbability,
  ClutchZone,
  UtilityCoverage,
  TradeRoute,
  InfoGap,
  EcoPressure,
  PredictionGameState,
  TeamSide,
  Bombsite
} from './predictionInterface'

// Export utility coverage system
export {
  UtilityCoverageManager,
  utilityManager,
  createUtility,
  UTILITY_DURATIONS,
  UTILITY_RADII
} from './utilityCoverage'

export type {
  UtilityType,
  UtilityInstance,
  CoverageArea
} from './utilityCoverage'

// Export individual lenses
export { rotationPredictorLens } from './rotationPredictorLens'
export { timingWindowsLens } from './timingWindowsLens'
export { pushProbabilityLens } from './pushProbabilityLens'
export { clutchZonesLens } from './clutchZonesLens'
export { utilityCoverageLens } from './utilityCoverageLens'
export { tradeRoutesLens } from './tradeRoutesLens'
export { infoGapsLens } from './infoGapsLens'
export { ecoPressureLens } from './ecoPressureLens'

// Export lens option types
export type { RotationPredictorLensOptions } from './rotationPredictorLens'
export type { TimingWindowsLensOptions } from './timingWindowsLens'
export type { PushProbabilityLensOptions } from './pushProbabilityLens'
export type { ClutchZonesLensOptions } from './clutchZonesLens'
export type { UtilityCoverageLensOptions } from './utilityCoverageLens'
export type { TradeRoutesLensOptions } from './tradeRoutesLens'
export type { InfoGapsLensOptions } from './infoGapsLens'
export type { EcoPressureLensOptions } from './ecoPressureLens'

// Lens registry for easy access
import type { Lens } from '../types'
import { rotationPredictorLens } from './rotationPredictorLens'
import { timingWindowsLens } from './timingWindowsLens'
import { pushProbabilityLens } from './pushProbabilityLens'
import { clutchZonesLens } from './clutchZonesLens'
import { utilityCoverageLens } from './utilityCoverageLens'
import { tradeRoutesLens } from './tradeRoutesLens'
import { infoGapsLens } from './infoGapsLens'
import { ecoPressureLens } from './ecoPressureLens'

/** All tactical lenses collection */
export const allTacticalLenses: Lens[] = [
  rotationPredictorLens,
  timingWindowsLens,
  pushProbabilityLens,
  clutchZonesLens,
  utilityCoverageLens,
  tradeRoutesLens,
  infoGapsLens,
  ecoPressureLens
]

/** Get tactical lens by name */
export function getTacticalLens(name: string): Lens | undefined {
  return allTacticalLenses.find(lens => lens.name === name)
}

/** Get multiple tactical lenses by names */
export function getTacticalLenses(names: string[]): Lens[] {
  return allTacticalLenses.filter(lens => names.includes(lens.name))
}

/** Tactical lens categories */
export const tacticalLensCategories = {
  predictive: ['rotation-predictor', 'push-probability', 'timing-windows'],
  positional: ['clutch-zones', 'trade-routes', 'info-gaps'],
  status: ['utility-coverage', 'eco-pressure'],
  all: allTacticalLenses.map(l => l.name)
}

/** Preset combinations */
export const tacticalPresets = {
  /** Full tactical overlay */
  full: allTacticalLenses.map(l => l.name),

  /** Attack-focused lenses */
  attack: ['rotation-predictor', 'timing-windows', 'push-probability', 'trade-routes'],

  /** Defense-focused lenses */
  defense: ['clutch-zones', 'utility-coverage', 'info-gaps', 'eco-pressure'],

  /** Pre-round planning */
  preRound: ['push-probability', 'timing-windows', 'eco-pressure', 'trade-routes'],

  /** Post-plant situation */
  postPlant: ['clutch-zones', 'utility-coverage', 'rotation-predictor', 'info-gaps'],

  /** Minimal tactical info */
  minimal: ['push-probability', 'utility-coverage']
}

/** Default export with all tactical components */
export default {
  lenses: allTacticalLenses,
  get: getTacticalLens,
  getMultiple: getTacticalLenses,
  categories: tacticalLensCategories,
  presets: tacticalPresets,

  // Individual lens exports
  rotationPredictor: rotationPredictorLens,
  timingWindows: timingWindowsLens,
  pushProbability: pushProbabilityLens,
  clutchZones: clutchZonesLens,
  utilityCoverage: utilityCoverageLens,
  tradeRoutes: tradeRoutesLens,
  infoGaps: infoGapsLens,
  ecoPressure: ecoPressureLens,

  // Utilities
  manager: utilityManager
}
