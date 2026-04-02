// @ts-nocheck
/**
 * ML Cross-Validation Module
 * 
 * [Ver001.000]
 * 
 * Provides cross-validation capabilities:
 * - K-fold cross-validation
 * - Stratified sampling
 * - Performance metrics calculation
 * - Overfitting detection
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import type { TrainingSample } from '../pipeline/dataStore'

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationStrategy = 'kfold' | 'stratified_kfold' | 'shuffle_split' | 'time_series'

export interface ValidationConfig {
  strategy: ValidationStrategy
  k: number
  shuffle: boolean
  randomSeed?: number
  stratify?: boolean
  testSize?: number // For shuffle_split
  gap?: number // For time series
}

export interface FoldResult {
  fold: number
  trainSize: number
  validationSize: number
  metrics: ValidationMetrics
  trainingTimeMs: number
  predictions: ValidationPrediction[]
}

export interface ValidationMetrics {
  // Classification metrics
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  auc?: number
  logLoss?: number
  
  // Regression metrics
  mae?: number
  mse?: number
  rmse?: number
  r2?: number
  mape?: number
  
  // Custom metrics
  [key: string]: number | undefined
}

export interface ValidationPrediction {
  sampleId: string
  actual: number | number[]
  predicted: number | number[]
  probability?: number
  confidence: number
}

export interface CrossValidationResult {
  folds: FoldResult[]
  meanMetrics: ValidationMetrics
  stdMetrics: ValidationMetrics
  minMetrics: ValidationMetrics
  maxMetrics: ValidationMetrics
  overallMetrics: ValidationMetrics
  totalTrainingTimeMs: number
  convergenceScore: number
  stabilityScore: number
}

export interface OverfittingAnalysis {
  isOverfitting: boolean
  overfittingScore: number // 0-1, higher = more overfitting
  trainValGap: Record<string, number>
  warnings: string[]
  recommendations: string[]
}

export interface StratifiedSplit {
  train: TrainingSample[]
  validation: TrainingSample[]
  test?: TrainingSample[]
  classDistribution: {
    train: Record<string, number>
    validation: Record<string, number>
    test?: Record<string, number>
  }
}

export interface LearningCurve {
  trainSizes: number[]
  trainScores: number[]
  validationScores: number[]
  trainTimes: number[]
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  strategy: 'stratified_kfold',
  k: 5,
  shuffle: true,
  stratify: true,
  testSize: 0.2
}

// ============================================================================
// K-Fold Cross-Validation
// ============================================================================

/**
 * Perform k-fold cross-validation
 */
export async function performKFoldValidation(
  samples: TrainingSample[],
  trainFn: (trainData: TrainingSample[], valData: TrainingSample[]) => Promise<FoldResult>,
  config: Partial<ValidationConfig> = {}
): Promise<CrossValidationResult> {
  const validationConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config }
  const startTime = performance.now()

  mlLogger.info('Starting k-fold cross-validation', { 
    k: validationConfig.k, 
    strategy: validationConfig.strategy,
    samples: samples.length 
  })

  const folds = createFolds(samples, validationConfig)
  const foldResults: FoldResult[] = []

  for (let i = 0; i < folds.length; i++) {
    const { train, validation } = folds[i]
    
    mlLogger.debug(`Training fold ${i + 1}/${folds.length}`, {
      trainSize: train.length,
      valSize: validation.length
    })

    try {
      const result = await trainFn(train, validation)
      result.fold = i + 1
      foldResults.push(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fold training failed'
      mlLogger.error(`Fold ${i + 1} failed`, { error: message })
      throw error
    }
  }

  const totalTrainingTime = performance.now() - startTime

  const result = compileCrossValidationResults(foldResults, totalTrainingTime)
  
  mlLogger.info('Cross-validation completed', {
    totalTimeMs: totalTrainingTime,
    meanAccuracy: result.meanMetrics.accuracy?.toFixed(4),
    stdAccuracy: result.stdMetrics.accuracy?.toFixed(4)
  })

  return result
}

/**
 * Create k folds from samples
 */
export function createFolds(
  samples: TrainingSample[],
  config: ValidationConfig
): Array<{ train: TrainingSample[]; validation: TrainingSample[] }> {
  // Shuffle if needed
  let shuffled = [...samples]
  if (config.shuffle) {
    shuffled = shuffleArray(shuffled, config.randomSeed)
  }

  // Stratify if needed
  if (config.stratify || config.strategy === 'stratified_kfold') {
    return createStratifiedFolds(shuffled, config.k, config.randomSeed)
  }

  // Regular k-fold
  const foldSize = Math.floor(samples.length / config.k)
  const folds: Array<{ train: TrainingSample[]; validation: TrainingSample[] }> = []

  for (let i = 0; i < config.k; i++) {
    const startIdx = i * foldSize
    const endIdx = i === config.k - 1 ? samples.length : (i + 1) * foldSize
    
    const validation = shuffled.slice(startIdx, endIdx)
    const train = [...shuffled.slice(0, startIdx), ...shuffled.slice(endIdx)]
    
    folds.push({ train, validation })
  }

  return folds
}

// ============================================================================
// Stratified Sampling
// ============================================================================

/**
 * Create stratified k folds maintaining class distribution
 */
export function createStratifiedFolds(
  samples: TrainingSample[],
  k: number,
  seed?: number
): Array<{ train: TrainingSample[]; validation: TrainingSample[] }> {
  // Group by class (using roundOutcome as class)
  const classGroups = new Map<number | undefined, TrainingSample[]>()
  
  for (const sample of samples) {
    const label = sample.labels.roundOutcome
    if (!classGroups.has(label)) {
      classGroups.set(label, [])
    }
    classGroups.get(label)!.push(sample)
  }

  // Shuffle each class group
  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  for (const [, group] of classGroups) {
    shuffleInPlace(group, rng)
  }

  // Create k stratified folds
  const folds: Array<TrainingSample[]> = Array.from({ length: k }, () => [])
  
  for (const [, group] of classGroups) {
    const foldSize = Math.floor(group.length / k)
    
    for (let i = 0; i < k; i++) {
      const startIdx = i * foldSize
      const endIdx = i === k - 1 ? group.length : (i + 1) * foldSize
      folds[i].push(...group.slice(startIdx, endIdx))
    }
  }

  // Shuffle each fold
  for (const fold of folds) {
    shuffleInPlace(fold, rng)
  }

  // Create train/validation splits
  return folds.map((validationFold, i) => {
    const train = folds.filter((_, idx) => idx !== i).flat()
    return { train, validation: validationFold }
  })
}

/**
 * Create a stratified train/validation/test split
 */
export function createStratifiedSplit(
  samples: TrainingSample[],
  trainRatio = 0.7,
  valRatio = 0.15,
  seed?: number
): StratifiedSplit {
  // Group by class
  const classGroups = new Map<number | undefined, TrainingSample[]>()
  
  for (const sample of samples) {
    const label = sample.labels.roundOutcome
    if (!classGroups.has(label)) {
      classGroups.set(label, [])
    }
    classGroups.get(label)!.push(sample)
  }

  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  const train: TrainingSample[] = []
  const validation: TrainingSample[] = []
  const test: TrainingSample[] = []
  
  const classDistribution = {
    train: {} as Record<string, number>,
    validation: {} as Record<string, number>,
    test: {} as Record<string, number>
  }

  for (const [label, group] of classGroups) {
    shuffleInPlace(group, rng)
    
    const trainSize = Math.floor(group.length * trainRatio)
    const valSize = Math.floor(group.length * valRatio)
    
    train.push(...group.slice(0, trainSize))
    validation.push(...group.slice(trainSize, trainSize + valSize))
    test.push(...group.slice(trainSize + valSize))
    
    const labelStr = String(label)
    classDistribution.train[labelStr] = trainSize
    classDistribution.validation[labelStr] = valSize
    classDistribution.test[labelStr] = group.length - trainSize - valSize
  }

  // Shuffle combined sets
  shuffleInPlace(train, rng)
  shuffleInPlace(validation, rng)
  shuffleInPlace(test, rng)

  return {
    train,
    validation,
    test,
    classDistribution
  }
}

/**
 * Calculate class distribution in samples
 */
export function calculateClassDistribution(
  samples: TrainingSample[]
): Record<string, number> {
  const distribution: Record<string, number> = {}
  
  for (const sample of samples) {
    const label = String(sample.labels.roundOutcome ?? 'unknown')
    distribution[label] = (distribution[label] || 0) + 1
  }
  
  return distribution
}

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Calculate classification metrics from predictions
 */
export function calculateClassificationMetrics(
  predictions: ValidationPrediction[]
): ValidationMetrics {
  const tp = predictions.filter(p => p.actual === 1 && p.predicted === 1).length
  const fp = predictions.filter(p => p.actual === 0 && p.predicted === 1).length
  const tn = predictions.filter(p => p.actual === 0 && p.predicted === 0).length
  const fn = predictions.filter(p => p.actual === 1 && p.predicted === 0).length

  const accuracy = (tp + tn) / predictions.length
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0

  // Calculate AUC
  const auc = calculateAUC(predictions)

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    auc
  }
}

/**
 * Calculate regression metrics from predictions
 */
export function calculateRegressionMetrics(
  predictions: ValidationPrediction[]
): ValidationMetrics {
  const actuals = predictions.map(p => p.actual as number)
  const predicted = predictions.map(p => p.predicted as number)

  const n = predictions.length
  
  // MAE
  const mae = actuals.reduce((sum, a, i) => sum + Math.abs(a - predicted[i]), 0) / n
  
  // MSE and RMSE
  const mse = actuals.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0) / n
  const rmse = Math.sqrt(mse)
  
  // R²
  const meanActual = actuals.reduce((a, b) => a + b, 0) / n
  const ssTotal = actuals.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0)
  const ssResidual = actuals.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0)
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
  
  // MAPE
  const mape = actuals.reduce((sum, a, i) => 
    sum + (a !== 0 ? Math.abs((a - predicted[i]) / a) : 0), 0) / n * 100

  return {
    mae,
    mse,
    rmse,
    r2,
    mape
  }
}

/**
 * Calculate AUC (Area Under ROC Curve)
 */
export function calculateAUC(predictions: ValidationPrediction[]): number {
  // Sort by predicted probability
  const sorted = [...predictions].sort((a, b) => (b.probability || 0) - (a.probability || 0))
  
  const positives = sorted.filter(p => p.actual === 1).length
  const negatives = sorted.filter(p => p.actual === 0).length
  
  if (positives === 0 || negatives === 0) return 0.5

  let auc = 0
  let cumNegatives = 0

  for (const pred of sorted) {
    if (pred.actual === 1) {
      auc += cumNegatives
    } else {
      cumNegatives++
    }
  }

  return auc / (positives * negatives)
}

/**
 * Calculate confusion matrix
 */
export function calculateConfusionMatrix(
  predictions: ValidationPrediction[]
): { tp: number; fp: number; tn: number; fn: number } {
  return {
    tp: predictions.filter(p => p.actual === 1 && p.predicted === 1).length,
    fp: predictions.filter(p => p.actual === 0 && p.predicted === 1).length,
    tn: predictions.filter(p => p.actual === 0 && p.predicted === 0).length,
    fn: predictions.filter(p => p.actual === 1 && p.predicted === 0).length
  }
}

// ============================================================================
// Overfitting Detection
// ============================================================================

/**
 * Analyze for overfitting based on train/validation metrics
 */
export function detectOverfitting(
  trainMetrics: ValidationMetrics,
  validationMetrics: ValidationMetrics,
  thresholds: {
    accuracyGap?: number
    lossGap?: number
    minTrainAccuracy?: number
  } = {}
): OverfittingAnalysis {
  const {
    accuracyGap: accGapThreshold = 0.1,
    lossGap: lossGapThreshold = 0.5,
    minTrainAccuracy: minTrainAcc = 0.5
  } = thresholds

  const warnings: string[] = []
  const recommendations: string[] = []
  const trainValGap: Record<string, number> = {}

  // Calculate gaps
  if (trainMetrics.accuracy !== undefined && validationMetrics.accuracy !== undefined) {
    trainValGap.accuracy = trainMetrics.accuracy - validationMetrics.accuracy
  }
  if (trainMetrics.loss !== undefined && validationMetrics.loss !== undefined) {
    trainValGap.loss = validationMetrics.loss - trainMetrics.loss
  }

  let overfittingScore = 0
  let isOverfitting = false

  // Check accuracy gap
  if (trainValGap.accuracy !== undefined && trainValGap.accuracy > accGapThreshold) {
    isOverfitting = true
    overfittingScore += trainValGap.accuracy
    warnings.push(`Large accuracy gap: ${(trainValGap.accuracy * 100).toFixed(1)}%`)
    recommendations.push('Consider increasing regularization (dropout, L2)')
    recommendations.push('Collect more training data or use data augmentation')
  }

  // Check loss gap
  if (trainValGap.loss !== undefined && trainValGap.loss > lossGapThreshold) {
    isOverfitting = true
    overfittingScore += Math.min(trainValGap.loss, 1)
    warnings.push(`Validation loss significantly higher than training loss`)
    recommendations.push('Reduce model complexity (fewer layers/units)')
    recommendations.push('Implement early stopping')
  }

  // Check if model is underfitting
  if ((trainMetrics.accuracy ?? 0) < minTrainAcc) {
    warnings.push(`Low training accuracy: ${(trainMetrics.accuracy! * 100).toFixed(1)}%`)
    recommendations.push('Model may be underfitting - increase model capacity')
    recommendations.push('Train for more epochs')
  }

  // Normalize score to 0-1
  overfittingScore = Math.min(overfittingScore, 1)

  return {
    isOverfitting,
    overfittingScore,
    trainValGap,
    warnings,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  }
}

/**
 * Analyze cross-validation results for overfitting patterns
 */
export function analyzeCrossValidationOverfitting(
  result: CrossValidationResult
): OverfittingAnalysis {
  const accuracyStd = result.stdMetrics.accuracy || 0
  const highVariance = accuracyStd > 0.05

  const warnings: string[] = []
  const recommendations: string[] = []

  if (highVariance) {
    warnings.push(`High variance across folds (std: ${(accuracyStd * 100).toFixed(2)}%)`)
    recommendations.push('Model may be overfitting to specific folds')
    recommendations.push('Consider increasing regularization')
  }

  const minAcc = result.minMetrics.accuracy || 0
  const maxAcc = result.maxMetrics.accuracy || 0
  const range = maxAcc - minAcc

  if (range > 0.15) {
    warnings.push(`Large performance range across folds (${(range * 100).toFixed(1)}%)`)
    recommendations.push('Dataset may have distribution shift between folds')
    recommendations.push('Consider stratified sampling or data balancing')
  }

  const isOverfitting = highVariance || range > 0.15
  const overfittingScore = Math.min((accuracyStd * 5) + (range * 3), 1)

  return {
    isOverfitting,
    overfittingScore,
    trainValGap: {},
    warnings,
    recommendations
  }
}

// ============================================================================
// Learning Curve Analysis
// ============================================================================

/**
 * Generate learning curve by training with increasing data sizes
 */
export async function generateLearningCurve(
  samples: TrainingSample[],
  trainFn: (trainData: TrainingSample[]) => Promise<{ trainScore: number; valScore: number; trainTimeMs: number }>,
  config: { trainSizes: number[]; randomSeed?: number }
): Promise<LearningCurve> {
  const curve: LearningCurve = {
    trainSizes: [],
    trainScores: [],
    validationScores: [],
    trainTimes: []
  }

  const _rng = config.randomSeed !== undefined ? mulberry32(config.randomSeed) : Math.random

  for (const size of config.trainSizes) {
    if (size > samples.length) continue

    // Sample subset
    const subset = shuffleArray([...samples], config.randomSeed).slice(0, size)
    
    try {
      const result = await trainFn(subset)
      
      curve.trainSizes.push(size)
      curve.trainScores.push(result.trainScore)
      curve.validationScores.push(result.valScore)
      curve.trainTimes.push(result.trainTimeMs)
    } catch (error) {
      mlLogger.error('Learning curve point failed', { size, error })
    }
  }

  return curve
}

/**
 * Analyze learning curve for insights
 */
export function analyzeLearningCurve(curve: LearningCurve): {
  converged: boolean
  highVariance: boolean
  highBias: boolean
  recommendations: string[]
} {
  const recommendations: string[] = []
  
  if (curve.trainSizes.length < 2) {
    return { converged: false, highVariance: false, highBias: false, recommendations }
  }

  const lastTrainScore = curve.trainScores[curve.trainScores.length - 1]
  const lastValScore = curve.validationScores[curve.validationScores.length - 1]
  const gap = lastTrainScore - lastValScore

  // High variance (overfitting)
  const highVariance = gap > 0.1
  
  // High bias (underfitting)
  const highBias = lastTrainScore < 0.8 && lastValScore < 0.8

  // Convergence
  const scoreChange = Math.abs(
    curve.validationScores[curve.validationScores.length - 1] - 
    curve.validationScores[0]
  )
  const converged = scoreChange < 0.02

  if (highVariance) {
    recommendations.push('High variance detected - model is overfitting')
    recommendations.push('Add regularization or reduce model complexity')
    recommendations.push('Collect more training data')
  }

  if (highBias) {
    recommendations.push('High bias detected - model is underfitting')
    recommendations.push('Increase model capacity (more layers/units)')
    recommendations.push('Train for more epochs')
  }

  if (converged && !highVariance && !highBias) {
    recommendations.push('Model has converged with good fit')
  }

  return { converged, highVariance, highBias, recommendations }
}

// ============================================================================
// Utility Functions
// ============================================================================

function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array]
  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

function shuffleInPlace<T>(array: T[], rng: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}

function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function compileCrossValidationResults(
  foldResults: FoldResult[],
  totalTimeMs: number
): CrossValidationResult {
  const metrics = ['accuracy', 'precision', 'recall', 'f1Score', 'auc', 'mae', 'rmse', 'r2']
  
  const meanMetrics: ValidationMetrics = {}
  const stdMetrics: ValidationMetrics = {}
  const minMetrics: ValidationMetrics = {}
  const maxMetrics: ValidationMetrics = {}
  const overallMetrics: ValidationMetrics = {}

  for (const metric of metrics) {
    const values = foldResults
      .map(f => f.metrics[metric])
      .filter((v): v is number => v !== undefined)
    
    if (values.length > 0) {
      meanMetrics[metric] = values.reduce((a, b) => a + b, 0) / values.length
      stdMetrics[metric] = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - meanMetrics[metric]!, 2), 0) / values.length
      )
      minMetrics[metric] = Math.min(...values)
      maxMetrics[metric] = Math.max(...values)
    }
  }

  // Calculate overall metrics from all predictions
  const allPredictions = foldResults.flatMap(f => f.predictions)
  if (allPredictions.length > 0) {
    const isClassification = typeof allPredictions[0].actual === 'number' && 
      (allPredictions[0].actual === 0 || allPredictions[0].actual === 1)
    
    if (isClassification) {
      Object.assign(overallMetrics, calculateClassificationMetrics(allPredictions))
    } else {
      Object.assign(overallMetrics, calculateRegressionMetrics(allPredictions))
    }
  }

  // Calculate stability score (inverse of std)
  const meanAcc = meanMetrics.accuracy || meanMetrics.r2 || 0
  const stdAcc = stdMetrics.accuracy || stdMetrics.r2 || 0
  const stabilityScore = meanAcc > 0 ? Math.max(0, 1 - (stdAcc / meanAcc)) : 0

  // Calculate convergence score
  const scores = foldResults.map(f => f.metrics.accuracy || f.metrics.r2 || 0)
  const scoreVariance = scores.length > 1 
    ? scores.reduce((sum, s, i) => i > 0 ? sum + Math.abs(s - scores[i-1]) : 0, 0) / (scores.length - 1)
    : 0
  const convergenceScore = Math.max(0, 1 - scoreVariance)

  return {
    folds: foldResults,
    meanMetrics,
    stdMetrics,
    minMetrics,
    maxMetrics,
    overallMetrics,
    totalTrainingTimeMs: totalTimeMs,
    convergenceScore,
    stabilityScore
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
}
