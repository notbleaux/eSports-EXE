// @ts-nocheck
/**
 * ML Models - Main Exports
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S3-3-B
 * Team: ML Models (TL-S3)
 */

// Round Predictor
export {
  RoundPredictor,
  createRoundPredictor,
  extractRoundStateFeatures,
  DEFAULT_ROUND_PREDICTOR_CONFIG
} from './roundPredictor'
export type {
  RoundPrediction,
  FeatureImportance,
  RoundPredictorConfig,
  RoundPredictorMetrics,
  RoundState
} from './roundPredictor'

// Player Performance
export {
  PlayerPerformanceModel,
  createPlayerPerformanceModel,
  calculateOverallRating,
  DEFAULT_PLAYER_PERFORMANCE_CONFIG
} from './playerPerformance'
export type {
  SimRatingPrediction,
  SimRatingComponents,
  PerformanceFactors,
  PlayerMatchContext,
  PlayerPerformanceConfig,
  PlayerPerformanceMetrics
} from './playerPerformance'

// Strategy Recommendation
export {
  StrategyModel,
  createStrategyModel,
  getAvailableStrategies,
  STRATEGY_DEFINITIONS,
  DEFAULT_STRATEGY_CONFIG
} from './strategy'
export type {
  StrategyRecommendation,
  RecommendedStrategy,
  StrategyType,
  StrategyRequirement,
  AnalyzedFactor,
  MatchState,
  OpponentTendencies,
  StrategyConfig,
  StrategyMetrics
} from './strategy'

// Model Manager
export {
  ModelManager,
  getModelManager,
  initializeModelManager,
  resetModelManager
} from './manager'
export type {
  ModelType,
  ModelVersion,
  ModelABTest,
  ABTestResults,
  ModelManifest,
  ModelStorageStats,
  LoadModelOptions
} from './manager'

// Training Worker
export { default as TrainingWorker } from './trainingWorker?worker'

// ============================================================================
// Factory Functions
// ============================================================================

import { RoundPredictor } from './roundPredictor'
import { PlayerPerformanceModel } from './playerPerformance'
import { StrategyModel } from './strategy'
import type { ModelType } from './manager'

/**
 * Create a new model instance by type
 */
export function createModel(type: 'roundPredictor'): RoundPredictor
export function createModel(type: 'playerPerformance'): PlayerPerformanceModel
export function createModel(type: 'strategy'): StrategyModel
export function createModel(type: ModelType): RoundPredictor | PlayerPerformanceModel | StrategyModel {
  switch (type) {
    case 'roundPredictor':
      return new RoundPredictor()
    case 'playerPerformance':
      return new PlayerPerformanceModel()
    case 'strategy':
      return new StrategyModel()
    default:
      throw new Error(`Unknown model type: ${type}`)
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  createModel
}
