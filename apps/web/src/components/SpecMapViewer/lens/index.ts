/** [Ver001.002] - Added Vector2D export
 * SpecMapViewer Lens System
 * =========================
 * Complete lens system including creative and analytical lenses.
 * 
 * Creative Lenses (Original):
 * - Tension: Heatmap showing combat pressure zones
 * - Ripple: Sound propagation visualization  
 * - Blood: Damage and kill stain overlays
 * - Wind: Movement flow vector field
 * - Doors: Rotation pattern indicators
 * - Secured: Site control status visualization
 * 
 * Analytical Lenses (New):
 * - Performance Heatmap: Kill/death density
 * - Ability Efficiency: Utility usage vs impact
 * - Duel History: 1v1 win/loss locations
 * - Site Control: Ownership over time
 * - Player Trajectories: Movement patterns
 * - Damage Dealt: Damage distribution
 * - Flash Assists: Flash → kill correlation
 * - Entry Success: First contact outcomes
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
} from '../lenses/types'

// Re-export Vector2D from TacticalMap types
export type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'

// Export original creative lenses
export { tensionLens } from '../lenses/tensionLens'
export { rippleLens } from '../lenses/rippleLens'
export { bloodTrailLens } from '../lenses/bloodTrailLens'
export { windFieldLens } from '../lenses/windFieldLens'
export { doorsLens } from '../lenses/doorsLens'
export { securedLens } from '../lenses/securedLens'

// Export new analytical lenses
export {
  performanceHeatmapLens,
  abilityEfficiencyLens,
  duelHistoryLens,
  siteControlLens,
  playerTrajectoriesLens,
  damageDealtLens,
  flashAssistsLens,
  entrySuccessLens
} from './analytical'

// Export utilities
export {
  renderHelpers,
  renderHeatmap,
  renderRipple,
  renderStain,
  renderVectorField,
  calculateTension,
  calculateMovementFlow
} from '../lenses/helpers'

// Export analytical utilities
export {
  generateHeatmap,
  createPerformanceHeatmap,
  applyGaussianSmoothing,
  calculateTemporalDecay,
  TemporalHeatmapAnimator,
  renderTrajectory,
  renderTrajectories,
  simplifyPath,
  applyLOD,
  generatePredictiveTrajectory,
  calculateTrajectoryStats,
  AnimatedTrajectoryRenderer
} from './analytical'

// Export registry and compositor
export { createLensRegistry, getGlobalLensRegistry, resetGlobalLensRegistry } from '../lenses/registry'
export { LensCompositor } from '../lenses/LensCompositor'

// Export compositor types
export type { CompositeConfig, RenderStats } from '../lenses/LensCompositor'

// Import all lenses for collections
import { tensionLens } from '../lenses/tensionLens'
import { rippleLens } from '../lenses/rippleLens'
import { bloodTrailLens } from '../lenses/bloodTrailLens'
import { windFieldLens } from '../lenses/windFieldLens'
import { doorsLens } from '../lenses/doorsLens'
import { securedLens } from '../lenses/securedLens'

import {
  performanceHeatmapLens,
  abilityEfficiencyLens,
  duelHistoryLens,
  siteControlLens,
  playerTrajectoriesLens,
  damageDealtLens,
  flashAssistsLens,
  entrySuccessLens
} from './analytical'

import type { Lens } from '../lenses/types'

/** Creative/Atmospheric lenses */
export const creativeLenses: Lens[] = [
  tensionLens,
  rippleLens,
  bloodTrailLens,
  windFieldLens,
  doorsLens,
  securedLens
]

/** Analytical/Statistical lenses */
export const analyticalLenses: Lens[] = [
  performanceHeatmapLens,
  abilityEfficiencyLens,
  duelHistoryLens,
  siteControlLens,
  playerTrajectoriesLens,
  damageDealtLens,
  flashAssistsLens,
  entrySuccessLens
]

/** All available lenses (creative + analytical) */
export const allLenses: Lens[] = [...creativeLenses, ...analyticalLenses]

/** Get lens by name */
export const getLens = (name: string): Lens | undefined => {
  return allLenses.find(lens => lens.name === name)
}

/** Get multiple lenses by names */
export const getLenses = (names: string[]): Lens[] => {
  return allLenses.filter(lens => names.includes(lens.name))
}

/** Lens categories for UI organization */
export const lensCategories = {
  creative: {
    combat: ['tension', 'blood', 'ripple'],
    strategic: ['secured', 'doors', 'wind']
  },
  analytical: {
    combat: ['performance-heatmap', 'duel-history', 'damage-dealt', 'entry-success'],
    strategic: ['site-control', 'player-trajectories'],
    utility: ['ability-efficiency', 'flash-assists']
  },
  all: allLenses.map(l => l.name)
}

/** Default lens presets for common scenarios */
export const lensPresets = {
  // Creative presets
  'creative-combat': ['tension', 'blood', 'ripple'],
  'creative-strategic': ['secured', 'doors', 'wind'],
  'creative-full': ['secured', 'wind', 'doors', 'tension', 'blood', 'ripple'],
  
  // Analytical presets
  'analytical-combat': ['performance-heatmap', 'duel-history', 'damage-dealt', 'entry-success'],
  'analytical-strategic': ['site-control', 'player-trajectories', 'ability-efficiency'],
  'analytical-utility': ['ability-efficiency', 'flash-assists'],
  
  // Combined presets
  'full-analysis': [
    'performance-heatmap',
    'player-trajectories',
    'site-control',
    'ability-efficiency',
    'flash-assists'
  ],
  'entry-analysis': ['entry-success', 'flash-assists', 'player-trajectories'],
  'post-plant': ['site-control', 'damage-dealt', 'duel-history'],
  
  // Minimal presets
  'minimal': ['performance-heatmap', 'site-control'],
  'stealth': ['ripple', 'wind', 'player-trajectories']
}

/** Default export - all lens system exports */
export default {
  all: allLenses,
  creative: creativeLenses,
  analytical: analyticalLenses,
  get: getLens,
  getMultiple: getLenses,
  categories: lensCategories,
  presets: lensPresets,
  
  // Creative lenses
  tension: tensionLens,
  ripple: rippleLens,
  blood: bloodTrailLens,
  wind: windFieldLens,
  doors: doorsLens,
  secured: securedLens,
  
  // Analytical lenses
  performanceHeatmap: performanceHeatmapLens,
  abilityEfficiency: abilityEfficiencyLens,
  duelHistory: duelHistoryLens,
  siteControl: siteControlLens,
  playerTrajectories: playerTrajectoriesLens,
  damageDealt: damageDealtLens,
  flashAssists: flashAssistsLens,
  entrySuccess: entrySuccessLens
}
