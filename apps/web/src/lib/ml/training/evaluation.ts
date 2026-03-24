/**
 * ML Model Evaluation Module
 * 
 * [Ver001.000]
 * 
 * Provides comprehensive model evaluation:
 * - Test set evaluation
 * - Confusion matrix
 * - ROC curves
 * - Performance reports
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import type { TrainingSample } from '../pipeline/dataStore'
import type { ValidationMetrics, ValidationPrediction } from './validation'

// ============================================================================
// Evaluation Types
// ============================================================================

export interface EvaluationConfig {
  batchSize: number
  includePredictions: boolean
  includeFeatureImportance: boolean
  confidenceThreshold: number
  classLabels?: string[]
}

export interface EvaluationResult {
  success: boolean
  metrics: ValidationMetrics
  confusionMatrix?: ConfusionMatrix
  rocCurve?: ROCCurve
  precisionRecallCurve?: PrecisionRecallCurve
  predictions: ValidationPrediction[]
  featureImportance?: FeatureImportance[]
  calibrationData?: CalibrationData
  errorAnalysis?: ErrorAnalysis
  perClassMetrics?: Record<string, ClassMetrics>
  evaluationTimeMs: number
  error?: string
}

export interface ConfusionMatrix {
  labels: string[]
  matrix: number[][] // [actual][predicted]
  normalized: number[][]
  totalSamples: number
}

export interface ROCCurve {
  thresholds: number[]
  tpr: number[] // True Positive Rate
  fpr: number[] // False Positive Rate
  auc: number
  optimalThreshold: number
}

export interface PrecisionRecallCurve {
  thresholds: number[]
  precision: number[]
  recall: number[]
  averagePrecision: number
}

export interface FeatureImportance {
  feature: string
  importance: number
  std?: number
}

export interface CalibrationData {
  binCenters: number[]
  binAccuracies: number[]
  binCounts: number[]
  expectedCalibrationError: number
  maximumCalibrationError: number
}

export interface ErrorAnalysis {
  totalErrors: number
  errorRate: number
  errorByClass: Record<string, number>
  commonErrorPatterns: ErrorPattern[]
  difficultSamples: string[] // Sample IDs
}

export interface ErrorPattern {
  pattern: string
  count: number
  samples: string[]
  description: string
}

export interface ClassMetrics {
  precision: number
  recall: number
  f1Score: number
  support: number
  accuracy?: number
}

export interface PerformanceReport {
  modelName: string
  evaluatedAt: number
  datasetInfo: {
    totalSamples: number
    trainSamples: number
    testSamples: number
    classDistribution: Record<string, number>
  }
  overallMetrics: ValidationMetrics
  perClassMetrics: Record<string, ClassMetrics>
  confusionMatrix: ConfusionMatrix
  rocCurve?: ROCCurve
  calibrationData?: CalibrationData
  recommendations: string[]
  summary: string
}

export interface ModelComparison {
  models: string[]
  metrics: Record<string, number[]>
  winner: string
  statisticalSignificance: Record<string, boolean>
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_EVALUATION_CONFIG: EvaluationConfig = {
  batchSize: 32,
  includePredictions: true,
  includeFeatureImportance: false,
  confidenceThreshold: 0.5
}

// ============================================================================
// Test Set Evaluation
// ============================================================================

/**
 * Evaluate model on test set
 */
export async function evaluateModel(
  model: {
    predict: (features: number[]) => Promise<{ prediction: number; probability?: number }>
    predictBatch?: (features: number[][]) => Promise<Array<{ prediction: number; probability?: number }>>
  },
  testSamples: TrainingSample[],
  config: Partial<EvaluationConfig> = {}
): Promise<EvaluationResult> {
  const evalConfig = { ...DEFAULT_EVALUATION_CONFIG, ...config }
  const startTime = performance.now()

  mlLogger.info('Starting model evaluation', { samples: testSamples.length })

  try {
    // Generate predictions
    const predictions: ValidationPrediction[] = []
    
    if (model.predictBatch) {
      // Batch prediction
      const batchSize = evalConfig.batchSize
      for (let i = 0; i < testSamples.length; i += batchSize) {
        const batch = testSamples.slice(i, i + batchSize)
        const batchPredictions = await model.predictBatch(batch.map(s => s.features))
        
        batch.forEach((sample, idx) => {
          predictions.push({
            sampleId: sample.id,
            actual: sample.labels.roundOutcome ?? sample.labels.winProbability ?? 0,
            predicted: batchPredictions[idx].prediction,
            probability: batchPredictions[idx].probability,
            confidence: batchPredictions[idx].probability ?? 0.5
          })
        })
      }
    } else {
      // Individual predictions
      for (const sample of testSamples) {
        const result = await model.predict(sample.features)
        predictions.push({
          sampleId: sample.id,
          actual: sample.labels.roundOutcome ?? sample.labels.winProbability ?? 0,
          predicted: result.prediction,
          probability: result.probability,
          confidence: result.probability ?? 0.5
        })
      }
    }

    // Calculate metrics
    const metrics = calculateEvaluationMetrics(predictions)
    
    // Build confusion matrix
    const confusionMatrix = buildConfusionMatrix(predictions, evalConfig.classLabels)
    
    // Calculate ROC curve
    const rocCurve = calculateROCCurve(predictions)
    
    // Calculate Precision-Recall curve
    const precisionRecallCurve = calculatePrecisionRecallCurve(predictions)
    
    // Calibration analysis
    const calibrationData = analyzeCalibration(predictions)
    
    // Error analysis
    const errorAnalysis = analyzeErrors(predictions)
    
    // Per-class metrics
    const perClassMetrics = calculatePerClassMetrics(predictions, evalConfig.classLabels)

    const evaluationTime = performance.now() - startTime

    mlLogger.info('Model evaluation completed', {
      accuracy: metrics.accuracy?.toFixed(4),
      f1Score: metrics.f1Score?.toFixed(4),
      auc: metrics.auc?.toFixed(4),
      evaluationTimeMs: evaluationTime
    })

    return {
      success: true,
      metrics,
      confusionMatrix,
      rocCurve,
      precisionRecallCurve,
      predictions: evalConfig.includePredictions ? predictions : [],
      calibrationData,
      errorAnalysis,
      perClassMetrics,
      evaluationTimeMs: evaluationTime
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation failed'
    mlLogger.error('Model evaluation failed', { error: message })
    
    return {
      success: false,
      metrics: {},
      predictions: [],
      evaluationTimeMs: performance.now() - startTime,
      error: message
    }
  }
}

// ============================================================================
// Confusion Matrix
// ============================================================================

/**
 * Build confusion matrix from predictions
 */
export function buildConfusionMatrix(
  predictions: ValidationPrediction[],
  classLabels?: string[]
): ConfusionMatrix {
  // Get unique labels
  const uniqueLabels = new Set<number>()
  predictions.forEach(p => {
    uniqueLabels.add(p.actual as number)
    uniqueLabels.add(p.predicted as number)
  })
  
  const sortedLabels = Array.from(uniqueLabels).sort((a, b) => a - b)
  const labels = classLabels || sortedLabels.map(String)
  
  const n = sortedLabels.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  
  // Fill matrix
  for (const pred of predictions) {
    const actualIdx = sortedLabels.indexOf(pred.actual as number)
    const predIdx = sortedLabels.indexOf(pred.predicted as number)
    if (actualIdx >= 0 && predIdx >= 0) {
      matrix[actualIdx][predIdx]++
    }
  }
  
  // Normalize
  const normalized = matrix.map(row => {
    const sum = row.reduce((a, b) => a + b, 0)
    return sum > 0 ? row.map(v => v / sum) : row
  })

  return {
    labels,
    matrix,
    normalized,
    totalSamples: predictions.length
  }
}

/**
 * Calculate metrics from confusion matrix
 */
export function calculateMetricsFromConfusionMatrix(
  matrix: number[][]
): { perClass: ClassMetrics[]; overall: ValidationMetrics } {
  const n = matrix.length
  const perClass: ClassMetrics[] = []
  
  // Calculate per-class metrics
  for (let i = 0; i < n; i++) {
    const tp = matrix[i][i]
    const fp = matrix.reduce((sum, row, idx) => idx !== i ? sum + row[i] : sum, 0)
    const fn = matrix[i].reduce((sum, v, idx) => idx !== i ? sum + v : sum, 0)
    const support = matrix[i].reduce((a, b) => a + b, 0)
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    
    perClass.push({
      precision,
      recall,
      f1Score,
      support
    })
  }
  
  // Calculate overall metrics (weighted average)
  const totalSupport = perClass.reduce((sum, c) => sum + c.support, 0)
  
  const overall: ValidationMetrics = {
    precision: perClass.reduce((sum, c) => sum + c.precision * c.support, 0) / totalSupport,
    recall: perClass.reduce((sum, c) => sum + c.recall * c.support, 0) / totalSupport,
    f1Score: perClass.reduce((sum, c) => sum + c.f1Score * c.support, 0) / totalSupport,
    accuracy: perClass.reduce((sum, c) => sum + matrix[perClass.indexOf(c)][perClass.indexOf(c)], 0) / totalSupport
  }

  return { perClass, overall }
}

// ============================================================================
// ROC Curve
// ============================================================================

/**
 * Calculate ROC curve from predictions
 */
export function calculateROCCurve(predictions: ValidationPrediction[]): ROCCurve {
  // Sort by probability descending
  const sorted = [...predictions]
    .filter(p => p.probability !== undefined)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
  
  if (sorted.length === 0) {
    return {
      thresholds: [],
      tpr: [],
      fpr: [],
      auc: 0.5,
      optimalThreshold: 0.5
    }
  }

  const positives = sorted.filter(p => p.actual === 1).length
  const negatives = sorted.length - positives
  
  if (positives === 0 || negatives === 0) {
    return {
      thresholds: [],
      tpr: [],
      fpr: [],
      auc: 0.5,
      optimalThreshold: 0.5
    }
  }

  const thresholds: number[] = []
  const tpr: number[] = []
  const fpr: number[] = []
  
  let tp = 0
  let fp = 0
  
  // Generate ROC points
  for (let i = 0; i <= sorted.length; i++) {
    const threshold = i === 0 ? 1 : (i === sorted.length ? 0 : sorted[i - 1].probability!)
    
    thresholds.push(threshold)
    tpr.push(tp / positives)
    fpr.push(fp / negatives)
    
    if (i < sorted.length) {
      if (sorted[i].actual === 1) {
        tp++
      } else {
        fp++
      }
    }
  }

  // Calculate AUC using trapezoidal rule
  let auc = 0
  for (let i = 1; i < fpr.length; i++) {
    auc += (fpr[i] - fpr[i - 1]) * (tpr[i] + tpr[i - 1]) / 2
  }

  // Find optimal threshold (closest to top-left corner)
  let optimalThreshold = 0.5
  let minDistance = Infinity
  
  for (let i = 0; i < thresholds.length; i++) {
    const distance = Math.sqrt(Math.pow(fpr[i], 2) + Math.pow(1 - tpr[i], 2))
    if (distance < minDistance) {
      minDistance = distance
      optimalThreshold = thresholds[i]
    }
  }

  return {
    thresholds,
    tpr,
    fpr,
    auc,
    optimalThreshold
  }
}

// ============================================================================
// Precision-Recall Curve
// ============================================================================

/**
 * Calculate Precision-Recall curve
 */
export function calculatePrecisionRecallCurve(
  predictions: ValidationPrediction[]
): PrecisionRecallCurve {
  // Sort by probability descending
  const sorted = [...predictions]
    .filter(p => p.probability !== undefined)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
  
  if (sorted.length === 0) {
    return {
      thresholds: [],
      precision: [],
      recall: [],
      averagePrecision: 0
    }
  }

  const positives = sorted.filter(p => p.actual === 1).length
  
  if (positives === 0) {
    return {
      thresholds: [],
      precision: [],
      recall: [],
      averagePrecision: 0
    }
  }

  const thresholds: number[] = []
  const precision: number[] = []
  const recall: number[] = []
  
  let tp = 0
  let fp = 0
  
  for (let i = 0; i <= sorted.length; i++) {
    const threshold = i === 0 ? 1 : (i === sorted.length ? 0 : sorted[i - 1].probability!)
    
    const prec = tp + fp > 0 ? tp / (tp + fp) : 0
    const rec = tp / positives
    
    thresholds.push(threshold)
    precision.push(prec)
    recall.push(rec)
    
    if (i < sorted.length) {
      if (sorted[i].actual === 1) {
        tp++
      } else {
        fp++
      }
    }
  }

  // Calculate average precision (area under PR curve)
  let avgPrecision = 0
  let prevRecall = 0
  let prevPrecision = precision[0] || 0
  
  for (let i = 1; i < recall.length; i++) {
    const deltaRecall = recall[i] - prevRecall
    avgPrecision += prevPrecision * deltaRecall
    prevRecall = recall[i]
    prevPrecision = precision[i]
  }

  return {
    thresholds,
    precision,
    recall,
    averagePrecision: avgPrecision
  }
}

// ============================================================================
// Calibration Analysis
// ============================================================================

/**
 * Analyze model calibration
 */
export function analyzeCalibration(
  predictions: ValidationPrediction[],
  numBins = 10
): CalibrationData {
  const bins: { count: number; correct: number; totalProb: number }[] = 
    Array.from({ length: numBins }, () => ({ count: 0, correct: 0, totalProb: 0 }))
  
  for (const pred of predictions) {
    const prob = pred.probability || 0.5
    const binIdx = Math.min(Math.floor(prob * numBins), numBins - 1)
    
    bins[binIdx].count++
    bins[binIdx].totalProb += prob
    if (pred.predicted === pred.actual) {
      bins[binIdx].correct++
    }
  }
  
  const binCenters: number[] = []
  const binAccuracies: number[] = []
  const binCounts: number[] = []
  
  let expectedCalibrationError = 0
  let maximumCalibrationError = 0
  
  for (let i = 0; i < numBins; i++) {
    const bin = bins[i]
    const binCenter = (i + 0.5) / numBins
    const accuracy = bin.count > 0 ? bin.correct / bin.count : 0
    const avgConfidence = bin.count > 0 ? bin.totalProb / bin.count : binCenter
    
    binCenters.push(binCenter)
    binAccuracies.push(accuracy)
    binCounts.push(bin.count)
    
    if (bin.count > 0) {
      const calibrationError = Math.abs(avgConfidence - accuracy)
      expectedCalibrationError += (bin.count / predictions.length) * calibrationError
      maximumCalibrationError = Math.max(maximumCalibrationError, calibrationError)
    }
  }

  return {
    binCenters,
    binAccuracies,
    binCounts,
    expectedCalibrationError,
    maximumCalibrationError
  }
}

// ============================================================================
// Error Analysis
// ============================================================================

/**
 * Analyze prediction errors
 */
export function analyzeErrors(predictions: ValidationPrediction[]): ErrorAnalysis {
  const errors = predictions.filter(p => p.predicted !== p.actual)
  const errorByClass: Record<string, number> = {}
  const patterns = new Map<string, { count: number; samples: string[] }>()
  
  for (const error of errors) {
    const actualClass = String(error.actual)
    errorByClass[actualClass] = (errorByClass[actualClass] || 0) + 1
    
    // Pattern: Predicted vs Actual
    const patternKey = `${error.actual}→${error.predicted}`
    const existing = patterns.get(patternKey) || { count: 0, samples: [] }
    existing.count++
    if (existing.samples.length < 10) {
      existing.samples.push(error.sampleId)
    }
    patterns.set(patternKey, existing)
  }
  
  // Sort patterns by frequency
  const sortedPatterns = Array.from(patterns.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
  
  const commonErrorPatterns: ErrorPattern[] = sortedPatterns.map(([pattern, data]) => ({
    pattern,
    count: data.count,
    samples: data.samples,
    description: `Predicted ${pattern.split('→')[1]} when actual was ${pattern.split('→')[0]}`
  }))

  // Find difficult samples (low confidence correct or wrong predictions)
  const difficultSamples = predictions
    .filter(p => p.predicted !== p.actual || p.confidence < 0.6)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 10)
    .map(p => p.sampleId)

  return {
    totalErrors: errors.length,
    errorRate: errors.length / predictions.length,
    errorByClass,
    commonErrorPatterns,
    difficultSamples
  }
}

// ============================================================================
// Per-Class Metrics
// ============================================================================

/**
 * Calculate per-class metrics
 */
export function calculatePerClassMetrics(
  predictions: ValidationPrediction[],
  classLabels?: string[]
): Record<string, ClassMetrics> {
  const uniqueLabels = new Set<number>()
  predictions.forEach(p => {
    uniqueLabels.add(p.actual as number)
    uniqueLabels.add(p.predicted as number)
  })
  
  const sortedLabels = Array.from(uniqueLabels).sort((a, b) => a - b)
  const perClassMetrics: Record<string, ClassMetrics> = {}
  
  for (const label of sortedLabels) {
    const labelStr = classLabels?.[label] || String(label)
    const tp = predictions.filter(p => p.actual === label && p.predicted === label).length
    const fp = predictions.filter(p => p.actual !== label && p.predicted === label).length
    const fn = predictions.filter(p => p.actual === label && p.predicted !== label).length
    const support = predictions.filter(p => p.actual === label).length
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    
    perClassMetrics[labelStr] = {
      precision,
      recall,
      f1Score,
      support
    }
  }
  
  return perClassMetrics
}

// ============================================================================
// Performance Reports
// ============================================================================

/**
 * Generate comprehensive performance report
 */
export function generatePerformanceReport(
  modelName: string,
  evaluation: EvaluationResult,
  datasetInfo: {
    totalSamples: number
    trainSamples: number
    testSamples: number
    classDistribution: Record<string, number>
  }
): PerformanceReport {
  const recommendations: string[] = []
  
  // Generate recommendations based on metrics
  if (evaluation.metrics.accuracy !== undefined) {
    if (evaluation.metrics.accuracy < 0.6) {
      recommendations.push('Low accuracy detected - consider collecting more training data')
      recommendations.push('Try hyperparameter tuning to improve model performance')
    } else if (evaluation.metrics.accuracy > 0.95) {
      recommendations.push('Very high accuracy - verify no data leakage between train/test')
    }
  }
  
  if (evaluation.rocCurve && evaluation.rocCurve.auc < 0.7) {
    recommendations.push('Low AUC suggests model has difficulty distinguishing classes')
  }
  
  if (evaluation.calibrationData && evaluation.calibrationData.expectedCalibrationError > 0.1) {
    recommendations.push('Model calibration could be improved - consider temperature scaling')
  }
  
  if (evaluation.errorAnalysis && evaluation.errorAnalysis.errorRate > 0.3) {
    recommendations.push('High error rate - review difficult samples for labeling issues')
  }
  
  // Generate summary
  const summaryParts: string[] = [
    `Model ${modelName} evaluated on ${datasetInfo.testSamples} test samples.`,
    `Overall accuracy: ${((evaluation.metrics.accuracy || 0) * 100).toFixed(1)}%.`,
    `F1 Score: ${((evaluation.metrics.f1Score || 0) * 100).toFixed(1)}%.`
  ]
  
  if (evaluation.rocCurve) {
    summaryParts.push(`AUC: ${(evaluation.rocCurve.auc * 100).toFixed(1)}%.`)
  }

  return {
    modelName,
    evaluatedAt: Date.now(),
    datasetInfo,
    overallMetrics: evaluation.metrics,
    perClassMetrics: evaluation.perClassMetrics || {},
    confusionMatrix: evaluation.confusionMatrix || {
      labels: [],
      matrix: [],
      normalized: [],
      totalSamples: 0
    },
    rocCurve: evaluation.rocCurve,
    calibrationData: evaluation.calibrationData,
    recommendations: [...new Set(recommendations)],
    summary: summaryParts.join(' ')
  }
}

/**
 * Compare multiple models
 */
export function compareModels(
  modelResults: Array<{ name: string; evaluation: EvaluationResult }>,
  primaryMetric: keyof ValidationMetrics = 'accuracy'
): ModelComparison {
  const models = modelResults.map(m => m.name)
  const metrics: Record<string, number[]> = {}
  
  // Collect metrics
  for (const { evaluation } of modelResults) {
    for (const [key, value] of Object.entries(evaluation.metrics)) {
      if (value !== undefined) {
        if (!metrics[key]) metrics[key] = []
        metrics[key].push(value)
      }
    }
  }
  
  // Determine winner based on primary metric
  let winner = models[0]
  let bestScore = -Infinity
  
  for (let i = 0; i < modelResults.length; i++) {
    const score = modelResults[i].evaluation.metrics[primaryMetric] || 0
    if (score > bestScore) {
      bestScore = score
      winner = models[i]
    }
  }
  
  // Simple statistical significance (difference > 2x std)
  const statisticalSignificance: Record<string, boolean> = {}
  for (const [metric, values] of Object.entries(metrics)) {
    if (values.length >= 2) {
      const winnerIdx = models.indexOf(winner)
      const winnerValue = values[winnerIdx]
      const otherValues = values.filter((_, i) => i !== winnerIdx)
      const meanOther = otherValues.reduce((a, b) => a + b, 0) / otherValues.length
      const stdOther = Math.sqrt(
        otherValues.reduce((sum, v) => sum + Math.pow(v - meanOther, 2), 0) / otherValues.length
      )
      statisticalSignificance[metric] = Math.abs(winnerValue - meanOther) > 2 * stdOther
    }
  }

  return {
    models,
    metrics,
    winner,
    statisticalSignificance
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateEvaluationMetrics(
  predictions: ValidationPrediction[]
): ValidationMetrics {
  const isClassification = predictions.every(p => 
    p.actual === 0 || p.actual === 1
  )
  
  if (isClassification) {
    const tp = predictions.filter(p => p.actual === 1 && p.predicted === 1).length
    const fp = predictions.filter(p => p.actual === 0 && p.predicted === 1).length
    const tn = predictions.filter(p => p.actual === 0 && p.predicted === 0).length
    const fn = predictions.filter(p => p.actual === 1 && p.predicted === 0).length
    
    const accuracy = (tp + tn) / predictions.length
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    
    return {
      accuracy,
      precision,
      recall,
      f1Score
    }
  } else {
    // Regression metrics
    const mae = predictions.reduce((sum, p) => 
      sum + Math.abs((p.actual as number) - (p.predicted as number)), 0) / predictions.length
    const mse = predictions.reduce((sum, p) => 
      sum + Math.pow((p.actual as number) - (p.predicted as number), 2), 0) / predictions.length
    const rmse = Math.sqrt(mse)
    
    return {
      mae,
      mse,
      rmse
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
}
