// @ts-nocheck
/**
 * ML Training Pipeline - Main Exports
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

// Training Orchestrator
export {
  TrainingOrchestrator,
  getTrainingOrchestrator,
  resetTrainingOrchestrator,
  DEFAULT_TRAINING_OPTIONS,
  DEFAULT_ORCHESTRATOR_CONFIG
} from './orchestrator'
export type {
  TrainingJob,
  JobStatus,
  JobPriority,
  TrainingOptions,
  TrainingProgress,
  TrainingResult,
  MemoryStats,
  ResourceAllocation,
  OrchestratorConfig,
  JobQueueStats,
  ResourceStats
} from './orchestrator'

// Hyperparameter Tuning
export {
  runGridSearch,
  runRandomSearch,
  runBayesianOptimization,
  generateGrid,
  generateRandomConfig,
  selectBestModel,
  compareConfigs,
  DEFAULT_HYPERPARAMETER_SPACE,
  DEFAULT_SEARCH_CONFIG
} from './hyperparameters'
export type {
  HyperparameterType,
  HyperparameterRange,
  HyperparameterSpace,
  HyperparameterConfig,
  SearchConfig,
  Trial,
  SearchResult,
  GridPoint,
  BayesianState
} from './hyperparameters'

// Cross-Validation
export {
  performKFoldValidation,
  createFolds,
  createStratifiedFolds,
  createStratifiedSplit,
  calculateClassDistribution,
  calculateClassificationMetrics,
  calculateRegressionMetrics,
  calculateAUC,
  calculateConfusionMatrix,
  detectOverfitting,
  analyzeCrossValidationOverfitting,
  generateLearningCurve,
  analyzeLearningCurve,
  DEFAULT_VALIDATION_CONFIG
} from './validation'
export type {
  ValidationStrategy,
  ValidationConfig,
  ValidationMetrics,
  ValidationPrediction,
  OverfittingAnalysis,
  StratifiedSplit,
  LearningCurve
} from './validation'

// Model Evaluation
export {
  evaluateModel,
  buildConfusionMatrix,
  calculateMetricsFromConfusionMatrix,
  calculateROCCurve,
  calculatePrecisionRecallCurve,
  analyzeCalibration,
  analyzeErrors,
  calculatePerClassMetrics,
  generatePerformanceReport,
  compareModels,
  DEFAULT_EVALUATION_CONFIG
} from './evaluation'
export type {
  EvaluationConfig,
  EvaluationResult,
  ConfusionMatrix,
  ROCCurve,
  PrecisionRecallCurve,
  FeatureImportance,
  CalibrationData,
  ErrorAnalysis,
  ErrorPattern,
  ClassMetrics,
  PerformanceReport,
  ModelComparison
} from './evaluation'

// Default export
export default {
  // Orchestrator
  getTrainingOrchestrator,
  resetTrainingOrchestrator,
  // Hyperparameters
  runGridSearch,
  runRandomSearch,
  runBayesianOptimization,
  generateRandomConfig,
  selectBestModel,
  // Validation
  performKFoldValidation,
  createStratifiedFolds,
  createStratifiedSplit,
  detectOverfitting,
  generateLearningCurve,
  // Evaluation
  evaluateModel,
  calculateROCCurve,
  generatePerformanceReport,
  compareModels
}

import {
  getTrainingOrchestrator,
  resetTrainingOrchestrator
} from './orchestrator'
import {
  runGridSearch,
  runRandomSearch,
  runBayesianOptimization,
  generateRandomConfig,
  selectBestModel
} from './hyperparameters'
import {
  performKFoldValidation,
  createStratifiedFolds,
  createStratifiedSplit,
  detectOverfitting,
  generateLearningCurve
} from './validation'
import {
  evaluateModel,
  calculateROCCurve,
  generatePerformanceReport,
  compareModels
} from './evaluation'
