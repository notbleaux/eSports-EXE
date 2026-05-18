// @ts-nocheck
/** [Ver001.000] */
/**
 * Analytical Lenses Index
 * =======================
 * Export all 8 analytical lenses for SpecMapViewer.
 * 
 * Lenses:
 * 1. performance-heatmap - Kill/death density visualization
 * 2. ability-efficiency - Utility usage vs impact
 * 3. duel-history - 1v1 win/loss locations
 * 4. site-control - Ownership over time
 * 5. player-trajectories - Movement patterns
 * 6. damage-dealt - Damage distribution
 * 7. flash-assists - Flash → kill correlation
 * 8. entry-success - First contact outcomes
 */

// Export all analytical lenses
export { performanceHeatmapLens } from './performance-heatmap'
export { abilityEfficiencyLens } from './ability-efficiency'
export { duelHistoryLens } from './duel-history'
export { siteControlLens } from './site-control'
export { playerTrajectoriesLens } from './player-trajectories'
export { damageDealtLens } from './damage-dealt'
export { flashAssistsLens } from './flash-assists'
export { entrySuccessLens } from './entry-success'

// Export lens types
export type { PerformanceHeatmapOptions } from './performance-heatmap'
export type { AbilityEfficiencyOptions } from './ability-efficiency'
export type { DuelHistoryOptions } from './duel-history'
export type { SiteControlOptions } from './site-control'
export type { PlayerTrajectoriesOptions } from './player-trajectories'
export type { DamageDealtOptions } from './damage-dealt'
export type { FlashAssistsOptions } from './flash-assists'
export type { EntrySuccessOptions } from './entry-success'

// Export utility functions
export {
  defaultHeatmapGradient,
  defaultHeatmapOptions,
  generateHeatmap,
  createPerformanceHeatmap,
  applyGaussianSmoothing,
  calculateTemporalDecay,
  TemporalHeatmapAnimator
} from '../utils/heatmap'

export {
  defaultTrajectoryOptions,
  defaultLODConfig,
  renderTrajectory,
  renderTrajectories,
  simplifyPath,
  applyLOD,
  generatePredictiveTrajectory,
  calculateTrajectoryStats,
  AnimatedTrajectoryRenderer
} from '../utils/trajectory'

// All analytical lenses collection
import { performanceHeatmapLens } from './performance-heatmap'
import { abilityEfficiencyLens } from './ability-efficiency'
import { duelHistoryLens } from './duel-history'
import { siteControlLens } from './site-control'
import { playerTrajectoriesLens } from './player-trajectories'
import { damageDealtLens } from './damage-dealt'
import { flashAssistsLens } from './flash-assists'
import { entrySuccessLens } from './entry-success'

import type { Lens } from '../types'

/** All analytical lenses */
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

/** Analytical lens categories */
export const analyticalCategories = {
  combat: ['performance-heatmap', 'duel-history', 'damage-dealt', 'entry-success'],
  strategic: ['site-control', 'player-trajectories'],
  utility: ['ability-efficiency', 'flash-assists']
}

/** Get analytical lens by name */
export const getAnalyticalLens = (name: string): Lens | undefined => {
  return analyticalLenses.find(lens => lens.name === name)
}

/** Get multiple analytical lenses by names */
export const getAnalyticalLenses = (names: string[]): Lens[] => {
  return analyticalLenses.filter(lens => names.includes(lens.name))
}

/** Lens descriptions for UI */
export const lensDescriptions: Record<string, string> = {
  'performance-heatmap': 'Kill/death density across the map',
  'ability-efficiency': 'Utility usage vs impact correlation',
  'duel-history': '1v1 win/loss locations and patterns',
  'site-control': 'Site ownership over time',
  'player-trajectories': 'Player movement patterns with prediction',
  'damage-dealt': 'Damage distribution and severity',
  'flash-assists': 'Flash → kill correlation visualization',
  'entry-success': 'First contact outcomes analysis'
}

/** Lens metadata for configuration UI */
export const lensMetadata = analyticalLenses.map(lens => ({
  name: lens.name,
  displayName: lens.displayName,
  description: lens.description,
  defaultOpacity: lens.opacity,
  category: analyticalCategories.combat.includes(lens.name)
    ? 'combat'
    : analyticalCategories.strategic.includes(lens.name)
      ? 'strategic'
      : 'utility'
}))

export default {
  all: analyticalLenses,
  get: getAnalyticalLens,
  getMultiple: getAnalyticalLenses,
  categories: analyticalCategories,
  descriptions: lensDescriptions,
  metadata: lensMetadata,
  
  // Individual lens exports
  performanceHeatmap: performanceHeatmapLens,
  abilityEfficiency: abilityEfficiencyLens,
  duelHistory: duelHistoryLens,
  siteControl: siteControlLens,
  playerTrajectories: playerTrajectoriesLens,
  damageDealt: damageDealtLens,
  flashAssists: flashAssistsLens,
  entrySuccess: entrySuccessLens
}
