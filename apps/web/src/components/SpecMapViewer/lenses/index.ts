// @ts-nocheck
/** [Ver002.000] */
/**
 * SpecMapViewer Lens System
 * =========================
 * Creative visualization overlays for tactical map analysis.
 * 
 * Available Lenses:
 * - Tension: Heatmap showing combat pressure zones
 * - Ripple: Sound propagation visualization  
 * - Blood: Damage and kill stain overlays
 * - Wind: Movement flow vector field
 * - Doors: Rotation pattern indicators
 * - Secured: Site control status visualization
 * 
 * Tactical Lenses (Phase 1):
 * - rotation-predictor: Team rotation predictions
 * - timing-windows: Optimal execute timings
 * - push-probability: Site execute likelihood
 * - clutch-zones: High-success clutch positions
 * - utility-coverage: Smoke/molly/flash coverage
 * - trade-routes: Optimal support paths
 * - info-gaps: Unobserved map areas
 * - eco-pressure: Force buy risk visualization
 */

// Export types
export type {
  Lens,
  GameData,
  LensOptions,
  LensRegistry,
  KillEvent,
  SoundEvent,
  DamageEvent,
  PlayerPosition,
  TimedPosition,
  FlowVector,
  HeatmapCell,
  RenderHelpers
} from './types'

// Export helpers
export {
  renderHelpers,
  renderHeatmap,
  renderRipple,
  renderStain,
  renderVectorField,
  calculateTension,
  calculateMovementFlow
} from './helpers'

// Export individual lenses
export { tensionLens } from './tensionLens'
export { rippleLens } from './rippleLens'
export { bloodTrailLens } from './bloodTrailLens'
export { windFieldLens } from './windFieldLens'
export { doorsLens } from './doorsLens'
export { securedLens } from './securedLens'
export { LensCompositor } from './LensCompositor'

// Export lens compositor types
export type { CompositeConfig, RenderStats } from './LensCompositor'

// Export tactical lenses
export {
  // Individual tactical lenses
  rotationPredictorLens,
  timingWindowsLens,
  pushProbabilityLens,
  clutchZonesLens,
  utilityCoverageLens,
  tradeRoutesLens,
  infoGapsLens,
  ecoPressureLens,

  // Tactical collections
  allTacticalLenses,
  getTacticalLens,
  getTacticalLenses,
  tacticalLensCategories,
  tacticalPresets,

  // Tactical utilities
  UtilityCoverageManager,
  utilityManager,
  createUtility,
  UTILITY_DURATIONS,
  UTILITY_RADII,
  predictionModel,
  toPredictionState,
  HeuristicPredictionModel
} from './tactical'

// Export tactical types
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
  Bombsite,
  UtilityType,
  UtilityInstance,
  CoverageArea,

  // Lens option types
  RotationPredictorLensOptions,
  TimingWindowsLensOptions,
  PushProbabilityLensOptions,
  ClutchZonesLensOptions,
  UtilityCoverageLensOptions,
  TradeRoutesLensOptions,
  InfoGapsLensOptions,
  EcoPressureLensOptions
} from './tactical'

// Default export - all lenses collection
import { tensionLens } from './tensionLens'
import { rippleLens } from './rippleLens'
import { bloodTrailLens } from './bloodTrailLens'
import { windFieldLens } from './windFieldLens'
import { doorsLens } from './doorsLens'
import { securedLens } from './securedLens'
import {
  rotationPredictorLens,
  timingWindowsLens,
  pushProbabilityLens,
  clutchZonesLens,
  utilityCoverageLens,
  tradeRoutesLens,
  infoGapsLens,
  ecoPressureLens,
  allTacticalLenses
} from './tactical'
import type { Lens } from './types'

/** All available lenses (base + tactical) */
export const allLenses: Lens[] = [
  // Base lenses
  tensionLens,
  rippleLens,
  bloodTrailLens,
  windFieldLens,
  doorsLens,
  securedLens,
  // Tactical lenses
  ...allTacticalLenses
]

/** Get lens by name */
export const getLens = (name: string): Lens | undefined => {
  return allLenses.find((lens) => lens.name === name)
}

/** Get multiple lenses by names */
export const getLenses = (names: string[]): Lens[] => {
  return allLenses.filter((lens) => names.includes(lens.name))
}

/** Lens categories */
export const lensCategories = {
  combat: ['tension', 'blood', 'ripple'],
  strategic: ['secured', 'doors', 'wind'],
  tactical: [
    'rotation-predictor',
    'timing-windows',
    'push-probability',
    'clutch-zones',
    'utility-coverage',
    'trade-routes',
    'info-gaps',
    'eco-pressure'
  ],
  predictive: ['rotation-predictor', 'push-probability', 'timing-windows'],
  all: allLenses.map(l => l.name)
}

/** Combined presets including tactical lenses */
export const lensPresets = {
  combat: ['tension', 'blood', 'ripple'],
  strategic: ['secured', 'doors', 'wind'],
  full: allLenses.map(l => l.name),
  minimal: ['tension', 'secured'],
  stealth: ['ripple', 'wind'],
  postplant: ['secured', 'tension', 'doors'],
  tactical: ['push-probability', 'utility-coverage', 'rotation-predictor'],
  analysis: ['tension', 'blood', 'rotation-predictor', 'timing-windows']
}

/** Default export for convenient importing */
export default {
  all: allLenses,
  get: getLens,
  getMultiple: getLenses,
  categories: lensCategories,
  presets: lensPresets,

  // Base lenses
  tension: tensionLens,
  ripple: rippleLens,
  blood: bloodTrailLens,
  wind: windFieldLens,
  doors: doorsLens,
  secured: securedLens,

  // Tactical lenses
  rotationPredictor: rotationPredictorLens,
  timingWindows: timingWindowsLens,
  pushProbability: pushProbabilityLens,
  clutchZones: clutchZonesLens,
  utilityCoverage: utilityCoverageLens,
  tradeRoutes: tradeRoutesLens,
  infoGaps: infoGapsLens,
  ecoPressure: ecoPressureLens
}
