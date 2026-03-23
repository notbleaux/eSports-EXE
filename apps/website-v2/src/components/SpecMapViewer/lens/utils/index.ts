/** [Ver001.000] */
/**
 * Lens Utilities Index
 * ====================
 * Export all lens utility functions.
 */

// Heatmap utilities
export {
  generateHeatmap,
  createPerformanceHeatmap,
  generateHeatmapData,
  applyGaussianSmoothing,
  calculateTemporalDecay,
  TemporalHeatmapAnimator,
  defaultHeatmapOptions,
  defaultHeatmapGradient
} from './heatmap'

export type {
  HeatmapPoint,
  HeatmapOptions,
  HeatmapGradient
} from './heatmap'

// Trajectory utilities
export {
  renderTrajectory,
  renderTrajectories,
  simplifyPath,
  applyLOD,
  generatePredictiveTrajectory,
  calculateTrajectoryStats,
  AnimatedTrajectoryRenderer,
  defaultTrajectoryOptions,
  defaultLODConfig
} from './trajectory'

export type {
  TrajectoryPoint,
  TrajectorySegment,
  TrajectoryOptions,
  LODConfig
} from './trajectory'
