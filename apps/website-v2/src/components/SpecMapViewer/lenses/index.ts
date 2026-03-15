/** [Ver001.000] */
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

// Default export - all lenses collection
import { tensionLens } from './tensionLens'
import { rippleLens } from './rippleLens'
import { bloodTrailLens } from './bloodTrailLens'
import { windFieldLens } from './windFieldLens'
import { doorsLens } from './doorsLens'
import { securedLens } from './securedLens'
import type { Lens } from './types'

/** All available lenses */
export const allLenses: Lens[] = [
  tensionLens,
  rippleLens,
  bloodTrailLens,
  windFieldLens,
  doorsLens,
  securedLens
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
  all: allLenses.map(l => l.name)
}

/** Default export for convenient importing */
export default {
  all: allLenses,
  get: getLens,
  getMultiple: getLenses,
  categories: lensCategories,
  tension: tensionLens,
  ripple: rippleLens,
  blood: bloodTrailLens,
  wind: windFieldLens,
  doors: doorsLens,
  secured: securedLens
}
