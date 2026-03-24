/**
 * ML Training Pipeline Test Suite
 * 
 * [Ver001.000]
 * 
 * 25+ comprehensive tests for training pipeline:
 * - Orchestrator tests
 * - Hyperparameter tuning tests
 * - Cross-validation tests
 * - Evaluation tests
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import modules to test
import {
  TrainingOrchestrator,
  getTrainingOrchestrator,
  resetTrainingOrchestrator,
  DEFAULT_TRAINING_OPTIONS,
  DEFAULT_ORCHESTRATOR_CONFIG
} from '../orchestrator'

import {
  runGridSearch,
  runRandomSearch,
  runBayesianOptimization,
  generateGrid,
  generateRandomConfig,
  selectBestModel,
  compareConfigs,
  DEFAULT_HYPERPARAMETER_SPACE,
  DEFAULT_SEARCH_CONFIG
} from '../hyperparameters'

import {
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
} from '../validation'

import {
  evaluateModel,
  buildConfusionMatrix,
  calculateROCCurve,
  calculatePrecisionRecallCurve,
  analyzeCalibration,
  analyzeErrors,
  calculatePerClassMetrics,
  generatePerformanceReport,
  compareModels,
  DEFAULT_EVALUATION_CONFIG
} from '../evaluation'

import type { TrainingSample } from '../../pipeline/dataStore'
import type { ValidationPrediction } from '../validation'

// ============================================================================
// Test Data Generators
// ============================================================================

function generateMockSamples(count: number, binary = true): TrainingSample[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sample-${i}`,
    features: Array.from({ length: 48 }, () => Math.random()),
    labels: binary 
      ? { roundOutcome: Math.random() > 0.5 ? 1 as const : 0 as const }
      : { winProbability: Math.random() },
    metadata: {
      matchId: `match-${i}`,
      roundId: `round-${i}`,
      timestamp: Date.now(),
      source: 'test',
      featureVersion: '1.0.0'
    },
    quality: {
      confidence: 0.8 + Math.random() * 0.2,
      isOutlier: false,
      missingValueCount: 0
    }
  }))
}

function generateMockPredictions(count: number, accuracy = 0.8): ValidationPrediction[] {
  return Array.from({ length: count }, (_, i) => {
    const actual = Math.random() > 0.5 ? 1 : 0
    const isCorrect = Math.random() < accuracy
    const predicted = isCorrect ? actual : 1 - actual
    const probability = isCorrect ? 0.5 + Math.random() * 0.5 : Math.random() * 0.5
    
    return {
      sampleId: `sample-${i}`,
      actual,
      predicted,
      probability,
      confidence: probability
    }
  })
}

// ============================================================================
// Orchestrator Tests
// ============================================================================

describe('TrainingOrchestrator', () => {
  beforeEach(() => {
    resetTrainingOrchestrator()
  })

  afterEach(() => {
    resetTrainingOrchestrator()
  })

  it('should create singleton instance', () => {
    const orch1 = getTrainingOrchestrator()
    const orch2 = getTrainingOrchestrator()
    expect(orch1).toBe(orch2)
  })

  it('should submit training job', async () => {
    const orchestrator = getTrainingOrchestrator()
    const samples = generateMockSamples(100)
    
    const job = await orchestrator.submitJob(
      'roundPredictor',
      'Test Job',
      samples,
      { maxEpochs: 10, batchSize: 16 }
    )
    
    expect(job).toBeDefined()
    expect(job.id).toBeDefined()
    expect(job.type).toBe('roundPredictor')
    expect(job.status).toBe('pending')
    expect(job.samples).toHaveLength(100)
  })

  it('should track job status', async () => {
    const orchestrator = getTrainingOrchestrator()
    const samples = generateMockSamples(50)
    
    const job = await orchestrator.submitJob(
      'roundPredictor',
      'Status Test',
      samples
    )
    
    const retrieved = orchestrator.getJob(job.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(job.id)
    expect(retrieved?.status).toBe('pending')
  })

  it('should cancel pending job', async () => {
    const orchestrator = getTrainingOrchestrator()
    const samples = generateMockSamples(50)
    
    const job = await orchestrator.submitJob(
      'roundPredictor',
      'Cancel Test',
      samples
    )
    
    const cancelled = await orchestrator.cancelJob(job.id)
    expect(cancelled).toBe(true)
    
    const retrieved = orchestrator.getJob(job.id)
    expect(retrieved?.status).toBe('cancelled')
  })

  it('should get jobs by status', async () => {
    const orchestrator = getTrainingOrchestrator()
    
    await orchestrator.submitJob('roundPredictor', 'Job 1', generateMockSamples(50))
    await orchestrator.submitJob('roundPredictor', 'Job 2', generateMockSamples(50))
    
    const pendingJobs = orchestrator.getJobsByStatus('pending')
    expect(pendingJobs.length).toBeGreaterThanOrEqual(2)
  })

  it('should get queue statistics', async () => {
    const orchestrator = getTrainingOrchestrator()
    
    await orchestrator.submitJob('roundPredictor', 'Job 1', generateMockSamples(50))
    await orchestrator.submitJob('playerPerformance', 'Job 2', generateMockSamples(50))
    
    const stats = orchestrator.getQueueStats()
    expect(stats.total).toBeGreaterThanOrEqual(2)
    expect(stats.pending).toBeGreaterThanOrEqual(2)
  })

  it('should get resource statistics', () => {
    const orchestrator = getTrainingOrchestrator()
    const stats = orchestrator.getResourceStats()
    
    expect(stats).toHaveProperty('activeWorkers')
    expect(stats).toHaveProperty('availableWorkers')
    expect(stats).toHaveProperty('memoryUsageMB')
  })

  it('should support event listeners', async () => {
    const orchestrator = getTrainingOrchestrator()
    const progressMock = vi.fn()
    const completeMock = vi.fn()
    const errorMock = vi.fn()
    
    const unsubProgress = orchestrator.onProgress(progressMock)
    const unsubComplete = orchestrator.onComplete(completeMock)
    const unsubError = orchestrator.onError(errorMock)
    
    expect(typeof unsubProgress).toBe('function')
    expect(typeof unsubComplete).toBe('function')
    expect(typeof unsubError).toBe('function')
    
    // Cleanup
    unsubProgress()
    unsubComplete()
    unsubError()
  })

  it('should dispose cleanly', () => {
    const orchestrator = getTrainingOrchestrator()
    expect(() => orchestrator.dispose()).not.toThrow()
  })
})

// ============================================================================
// Hyperparameter Tests
// ============================================================================

describe('Hyperparameter Tuning', () => {
  describe('Grid Search', () => {
    it('should generate grid points', () => {
      const space = {
        learningRate: { name: 'lr', type: 'discrete' as const, choices: [0.001, 0.01, 0.1] },
        batchSize: { name: 'bs', type: 'discrete' as const, choices: [16, 32] }
      }
      
      const grid = generateGrid(space, 100)
      
      expect(grid.length).toBe(6) // 3 x 2
      expect(grid[0]).toHaveProperty('learningRate')
      expect(grid[0]).toHaveProperty('batchSize')
    })

    it('should limit grid size', () => {
      const space = {
        a: { name: 'a', type: 'continuous' as const, min: 0, max: 1 },
        b: { name: 'b', type: 'continuous' as const, min: 0, max: 1 },
        c: { name: 'c', type: 'continuous' as const, min: 0, max: 1 }
      }
      
      const grid = generateGrid(space, 10)
      expect(grid.length).toBeLessThanOrEqual(10)
    })

    it('should generate random config', () => {
      const space = DEFAULT_HYPERPARAMETER_SPACE
      const config = generateRandomConfig(space)
      
      expect(config).toHaveProperty('learningRate')
      expect(config).toHaveProperty('batchSize')
      expect(config.learningRate).toBeGreaterThan(0)
      expect(config.batchSize).toBeGreaterThan(0)
    })

    it('should support seeded random generation', () => {
      const space = DEFAULT_HYPERPARAMETER_SPACE
      const config1 = generateRandomConfig(space, () => 0.5)
      const config2 = generateRandomConfig(space, () => 0.5)
      
      expect(config1.learningRate).toBe(config2.learningRate)
      expect(config1.batchSize).toBe(config2.batchSize)
    })

    it('should select best model', () => {
      const results = [
        { config: { lr: 0.01 }, metrics: { accuracy: 0.7, loss: 0.5 } },
        { config: { lr: 0.001 }, metrics: { accuracy: 0.8, loss: 0.4 } },
        { config: { lr: 0.1 }, metrics: { accuracy: 0.6, loss: 0.6 } }
      ]
      
      const best = selectBestModel(results, {
        primaryMetric: 'accuracy',
        direction: 'maximize'
      })
      
      expect(best).not.toBeNull()
      expect(best?.config.lr).toBe(0.001)
      expect(best?.metrics.accuracy).toBe(0.8)
    })

    it('should apply threshold constraints', () => {
      const results = [
        { config: { a: 1 }, metrics: { accuracy: 0.9, precision: 0.4 } },
        { config: { a: 2 }, metrics: { accuracy: 0.7, precision: 0.8 } }
      ]
      
      const best = selectBestModel(results, {
        primaryMetric: 'accuracy',
        direction: 'maximize',
        minThreshold: { precision: 0.5 }
      })
      
      expect(best?.config.a).toBe(2)
    })

    it('should compare configs', () => {
      const config1 = { learningRate: 0.01, batchSize: 32 }
      const config2 = { learningRate: 0.001, batchSize: 32 }
      
      const comparison = compareConfigs(
        config1 as Record<string, number>,
        config2 as Record<string, number>
      )
      
      expect(comparison.differences.length).toBeGreaterThan(0)
      expect(comparison.differences.some(d => d.includes('learningRate'))).toBe(true)
    })
  })

  describe('Search Algorithms', () => {
    it('should run grid search', async () => {
      const space = {
        learningRate: { name: 'lr', type: 'discrete' as const, choices: [0.01, 0.1] },
        batchSize: { name: 'bs', type: 'discrete' as const, choices: [32] }
      }
      
      const mockTrainFn = vi.fn().mockResolvedValue({
        success: true,
        finalMetrics: { accuracy: 0.7 + Math.random() * 0.2 }
      })
      
      const result = await runGridSearch(space, mockTrainFn, {
        maxIterations: 2,
        scoring: 'accuracy',
        direction: 'maximize'
      })
      
      expect(result.trials.length).toBeGreaterThan(0)
      expect(result.bestConfig).toBeDefined()
    })

    it('should run random search', async () => {
      const space = {
        learningRate: { name: 'lr', type: 'continuous' as const, min: 0.001, max: 0.1 },
        batchSize: { name: 'bs', type: 'discrete' as const, choices: [16, 32] }
      }
      
      const mockTrainFn = vi.fn().mockResolvedValue({
        success: true,
        finalMetrics: { accuracy: 0.7 }
      })
      
      const result = await runRandomSearch(space, mockTrainFn, {
        maxIterations: 3,
        scoring: 'accuracy',
        direction: 'maximize'
      })
      
      expect(result.trials.length).toBe(3)
      expect(result.bestScore).toBeGreaterThan(0)
    })

    it('should run Bayesian optimization', async () => {
      const space = {
        learningRate: { name: 'lr', type: 'continuous' as const, min: 0.001, max: 0.1 },
        batchSize: { name: 'bs', type: 'discrete' as const, choices: [16, 32] }
      }
      
      const mockTrainFn = vi.fn().mockResolvedValue({
        success: true,
        finalMetrics: { accuracy: 0.7 }
      })
      
      const result = await runBayesianOptimization(space, mockTrainFn, {
        maxIterations: 3,
        scoring: 'accuracy',
        direction: 'maximize'
      })
      
      expect(result.trials.length).toBeGreaterThan(0)
      expect(result.converged).toBeDefined()
    })
  })
})

// ============================================================================
// Cross-Validation Tests
// ============================================================================

describe('Cross-Validation', () => {
  describe('Folds Creation', () => {
    it('should create k folds', () => {
      const samples = generateMockSamples(100)
      const config = { ...DEFAULT_VALIDATION_CONFIG, k: 5, strategy: 'kfold' as const }
      
      const folds = createFolds(samples, config)
      
      expect(folds).toHaveLength(5)
      
      // Check total samples preserved
      const totalSamples = folds.reduce((sum, f) => sum + f.train.length + f.validation.length, 0)
      expect(totalSamples).toBe(100)
    })

    it('should create stratified folds', () => {
      // Create imbalanced dataset
      const samples = [
        ...generateMockSamples(80, true).map(s => ({ ...s, labels: { roundOutcome: 1 as const } })),
        ...generateMockSamples(20, true).map(s => ({ ...s, labels: { roundOutcome: 0 as const } }))
      ]
      
      const folds = createStratifiedFolds(samples, 5)
      
      expect(folds).toHaveLength(5)
      
      // Check class distribution is maintained in each fold
      for (const { validation } of folds) {
        const posCount = validation.filter(s => s.labels.roundOutcome === 1).length
        const negCount = validation.filter(s => s.labels.roundOutcome === 0).length
        
        // Should have both classes in each fold
        expect(posCount).toBeGreaterThan(0)
        expect(negCount).toBeGreaterThan(0)
      }
    })

    it('should create stratified split', () => {
      const samples = [
        ...generateMockSamples(70, true).map(s => ({ ...s, labels: { roundOutcome: 1 as const } })),
        ...generateMockSamples(30, true).map(s => ({ ...s, labels: { roundOutcome: 0 as const } }))
      ]
      
      const split = createStratifiedSplit(samples, 0.7, 0.15)
      
      expect(split.train.length).toBeGreaterThan(0)
      expect(split.validation.length).toBeGreaterThan(0)
      expect(split.test?.length).toBeGreaterThan(0)
      
      // Check class distribution
      const totalPos = samples.filter(s => s.labels.roundOutcome === 1).length
      const trainPos = split.train.filter(s => s.labels.roundOutcome === 1).length
      const trainRatio = trainPos / split.train.length
      const overallRatio = totalPos / samples.length
      
      expect(Math.abs(trainRatio - overallRatio)).toBeLessThan(0.1)
    })

    it('should shuffle deterministically with seed', () => {
      const samples = generateMockSamples(100)
      const config1 = { ...DEFAULT_VALIDATION_CONFIG, k: 5, shuffle: true, randomSeed: 42 }
      const config2 = { ...DEFAULT_VALIDATION_CONFIG, k: 5, shuffle: true, randomSeed: 42 }
      
      const folds1 = createFolds(samples, config1)
      const folds2 = createFolds(samples, config2)
      
      // Same seed should produce same folds
      expect(folds1[0].validation.map(s => s.id)).toEqual(folds2[0].validation.map(s => s.id))
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate class distribution', () => {
      const samples = [
        ...generateMockSamples(30, true).map(s => ({ ...s, labels: { roundOutcome: 1 as const } })),
        ...generateMockSamples(20, true).map(s => ({ ...s, labels: { roundOutcome: 0 as const } }))
      ]
      
      const distribution = calculateClassDistribution(samples)
      
      expect(distribution['1']).toBe(30)
      expect(distribution['0']).toBe(20)
    })

    it('should calculate classification metrics', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 1, confidence: 0.8 },
        { sampleId: '3', actual: 0, predicted: 0, confidence: 0.9 },
        { sampleId: '4', actual: 0, predicted: 1, confidence: 0.6 }, // FP
        { sampleId: '5', actual: 1, predicted: 0, confidence: 0.4 }  // FN
      ]
      
      const metrics = calculateClassificationMetrics(predictions)
      
      expect(metrics.accuracy).toBe(0.6) // 3/5
      expect(metrics.precision).toBe(2 / 3) // TP / (TP + FP)
      expect(metrics.recall).toBe(0.5) // TP / (TP + FN)
      expect(metrics.f1Score).toBeGreaterThan(0)
    })

    it('should calculate regression metrics', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 10, predicted: 9, confidence: 0.9 },
        { sampleId: '2', actual: 20, predicted: 22, confidence: 0.8 },
        { sampleId: '3', actual: 15, predicted: 15, confidence: 0.95 }
      ]
      
      const metrics = calculateRegressionMetrics(predictions)
      
      expect(metrics.mae).toBe(1) // (1 + 2 + 0) / 3
      expect(metrics.rmse).toBeGreaterThan(0)
      expect(metrics.r2).toBeDefined()
    })

    it('should calculate AUC', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, probability: 0.9, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 1, probability: 0.8, confidence: 0.8 },
        { sampleId: '3', actual: 0, predicted: 0, probability: 0.3, confidence: 0.3 },
        { sampleId: '4', actual: 0, predicted: 0, probability: 0.2, confidence: 0.2 }
      ]
      
      const auc = calculateAUC(predictions)
      
      expect(auc).toBeGreaterThan(0.5)
      expect(auc).toBeLessThanOrEqual(1)
    })

    it('should calculate confusion matrix', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 0, confidence: 0.4 },
        { sampleId: '3', actual: 0, predicted: 0, confidence: 0.9 },
        { sampleId: '4', actual: 0, predicted: 1, confidence: 0.6 }
      ]
      
      const matrix = calculateConfusionMatrix(predictions)
      
      expect(matrix.tp).toBe(1)
      expect(matrix.fp).toBe(1)
      expect(matrix.tn).toBe(1)
      expect(matrix.fn).toBe(1)
    })
  })

  describe('Overfitting Detection', () => {
    it('should detect overfitting by accuracy gap', () => {
      const trainMetrics = { accuracy: 0.95, loss: 0.1 }
      const valMetrics = { accuracy: 0.75, loss: 0.4 }
      
      const analysis = detectOverfitting(trainMetrics, valMetrics, { accuracyGap: 0.15 })
      
      expect(analysis.isOverfitting).toBe(true)
      expect(analysis.overfittingScore).toBeGreaterThan(0)
      expect(analysis.warnings.length).toBeGreaterThan(0)
    })

    it('should not flag good fit as overfitting', () => {
      const trainMetrics = { accuracy: 0.85, loss: 0.2 }
      const valMetrics = { accuracy: 0.82, loss: 0.25 }
      
      const analysis = detectOverfitting(trainMetrics, valMetrics)
      
      expect(analysis.isOverfitting).toBe(false)
    })

    it('should detect underfitting', () => {
      const trainMetrics = { accuracy: 0.5, loss: 0.7 }
      const valMetrics = { accuracy: 0.45, loss: 0.8 }
      
      const analysis = detectOverfitting(trainMetrics, valMetrics, { minTrainAccuracy: 0.6 })
      
      expect(analysis.warnings.some(w => w.includes('Low training accuracy'))).toBe(true)
    })
  })

  describe('Learning Curve', () => {
    it('should analyze learning curve', () => {
      const curve = {
        trainSizes: [100, 200, 300, 400, 500],
        trainScores: [0.95, 0.96, 0.97, 0.97, 0.98],
        validationScores: [0.70, 0.75, 0.78, 0.80, 0.81],
        trainTimes: [100, 200, 300, 400, 500]
      }
      
      const analysis = analyzeLearningCurve(curve)
      
      expect(analysis.highVariance).toBe(true) // Large gap between train and val
      expect(analysis.recommendations.length).toBeGreaterThan(0)
    })

    it('should detect convergence', () => {
      const curve = {
        trainSizes: [100, 200, 300],
        trainScores: [0.80, 0.81, 0.80],
        validationScores: [0.78, 0.79, 0.78],
        trainTimes: [100, 200, 300]
      }
      
      const analysis = analyzeLearningCurve(curve)
      
      expect(analysis.converged).toBe(true)
    })
  })
})

// ============================================================================
// Evaluation Tests
// ============================================================================

describe('Model Evaluation', () => {
  describe('Confusion Matrix', () => {
    it('should build confusion matrix', () => {
      const predictions = generateMockPredictions(100, 0.8)
      
      const matrix = buildConfusionMatrix(predictions)
      
      expect(matrix.labels.length).toBe(2)
      expect(matrix.matrix.length).toBe(2)
      expect(matrix.totalSamples).toBe(100)
      
      // Sum should equal total
      const totalInMatrix = matrix.matrix.flat().reduce((a, b) => a + b, 0)
      expect(totalInMatrix).toBe(100)
    })

    it('should calculate metrics from matrix', () => {
      const matrix = [[40, 10], [15, 35]] // [[TN, FP], [FN, TP]]
      
      const { overall, perClass } = calculateMetricsFromConfusionMatrix(matrix)
      
      expect(overall.accuracy).toBe(0.75) // (40 + 35) / 100
      expect(perClass).toHaveLength(2)
    })
  })

  describe('ROC Curve', () => {
    it('should calculate ROC curve', () => {
      const predictions = generateMockPredictions(100, 0.8)
      
      const roc = calculateROCCurve(predictions)
      
      expect(roc.thresholds.length).toBeGreaterThan(0)
      expect(roc.tpr.length).toBe(roc.thresholds.length)
      expect(roc.fpr.length).toBe(roc.thresholds.length)
      expect(roc.auc).toBeGreaterThan(0.5)
      expect(roc.auc).toBeLessThanOrEqual(1)
    })

    it('should find optimal threshold', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, probability: 0.9, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 1, probability: 0.8, confidence: 0.8 },
        { sampleId: '3', actual: 0, predicted: 0, probability: 0.2, confidence: 0.2 },
        { sampleId: '4', actual: 0, predicted: 0, probability: 0.1, confidence: 0.1 }
      ]
      
      const roc = calculateROCCurve(predictions)
      
      expect(roc.optimalThreshold).toBeGreaterThan(0)
      expect(roc.optimalThreshold).toBeLessThanOrEqual(1)
    })
  })

  describe('Precision-Recall Curve', () => {
    it('should calculate PR curve', () => {
      const predictions = generateMockPredictions(100, 0.8)
      
      const pr = calculatePrecisionRecallCurve(predictions)
      
      expect(pr.thresholds.length).toBeGreaterThan(0)
      expect(pr.precision.length).toBe(pr.thresholds.length)
      expect(pr.recall.length).toBe(pr.thresholds.length)
      expect(pr.averagePrecision).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Calibration', () => {
    it('should analyze calibration', () => {
      // Well-calibrated predictions
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, probability: 0.9, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 1, probability: 0.9, confidence: 0.9 },
        { sampleId: '3', actual: 0, predicted: 0, probability: 0.1, confidence: 0.1 },
        { sampleId: '4', actual: 0, predicted: 0, probability: 0.1, confidence: 0.1 }
      ]
      
      const calibration = analyzeCalibration(predictions, 5)
      
      expect(calibration.binCenters.length).toBe(5)
      expect(calibration.expectedCalibrationError).toBeGreaterThanOrEqual(0)
      expect(calibration.maximumCalibrationError).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Analysis', () => {
    it('should analyze errors', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 0, confidence: 0.4 }, // Error: 1->0
        { sampleId: '3', actual: 0, predicted: 0, confidence: 0.9 },
        { sampleId: '4', actual: 0, predicted: 1, confidence: 0.6 }, // Error: 0->1
        { sampleId: '5', actual: 1, predicted: 0, confidence: 0.3 }  // Error: 1->0
      ]
      
      const analysis = analyzeErrors(predictions)
      
      expect(analysis.totalErrors).toBe(3)
      expect(analysis.errorRate).toBe(0.6)
      expect(analysis.commonErrorPatterns.length).toBeGreaterThan(0)
    })

    it('should identify difficult samples', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, confidence: 0.95 },
        { sampleId: '2', actual: 1, predicted: 0, confidence: 0.3 },
        { sampleId: '3', actual: 0, predicted: 1, confidence: 0.4 }
      ]
      
      const analysis = analyzeErrors(predictions)
      
      expect(analysis.difficultSamples.length).toBeGreaterThan(0)
      expect(analysis.difficultSamples).toContain('2')
      expect(analysis.difficultSamples).toContain('3')
    })
  })

  describe('Per-Class Metrics', () => {
    it('should calculate per-class metrics', () => {
      const predictions: ValidationPrediction[] = [
        { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
        { sampleId: '2', actual: 1, predicted: 1, confidence: 0.8 },
        { sampleId: '3', actual: 0, predicted: 0, confidence: 0.9 },
        { sampleId: '4', actual: 0, predicted: 1, confidence: 0.6 }
      ]
      
      const metrics = calculatePerClassMetrics(predictions)
      
      expect(metrics['1']).toBeDefined()
      expect(metrics['0']).toBeDefined()
      expect(metrics['1'].precision).toBeGreaterThan(0)
      expect(metrics['1'].recall).toBeGreaterThan(0)
    })
  })

  describe('Performance Report', () => {
    it('should generate performance report', () => {
      const evaluation = {
        success: true,
        metrics: { accuracy: 0.85, precision: 0.87, recall: 0.83, f1Score: 0.85 },
        confusionMatrix: {
          labels: ['0', '1'],
          matrix: [[40, 10], [15, 35]],
          normalized: [[0.8, 0.2], [0.3, 0.7]],
          totalSamples: 100
        },
        predictions: [],
        evaluationTimeMs: 1000
      }
      
      const report = generatePerformanceReport('TestModel', evaluation, {
        totalSamples: 1000,
        trainSamples: 800,
        testSamples: 200,
        classDistribution: { '0': 500, '1': 500 }
      })
      
      expect(report.modelName).toBe('TestModel')
      expect(report.overallMetrics.accuracy).toBe(0.85)
      expect(report.recommendations).toBeDefined()
      expect(report.summary).toContain('TestModel')
    })

    it('should provide recommendations based on metrics', () => {
      const lowAccuracyEval = {
        success: true,
        metrics: { accuracy: 0.5 },
        confusionMatrix: { labels: [], matrix: [], normalized: [], totalSamples: 100 },
        predictions: [],
        evaluationTimeMs: 1000
      }
      
      const report = generatePerformanceReport('TestModel', lowAccuracyEval, {
        totalSamples: 100,
        trainSamples: 80,
        testSamples: 20,
        classDistribution: { '0': 50, '1': 50 }
      })
      
      expect(report.recommendations.some(r => r.includes('Low accuracy'))).toBe(true)
    })
  })

  describe('Model Comparison', () => {
    it('should compare multiple models', () => {
      const modelResults = [
        { 
          name: 'ModelA', 
          evaluation: { 
            success: true, 
            metrics: { accuracy: 0.85, precision: 0.84 },
            predictions: [],
            evaluationTimeMs: 1000
          } 
        },
        { 
          name: 'ModelB', 
          evaluation: { 
            success: true, 
            metrics: { accuracy: 0.90, precision: 0.88 },
            predictions: [],
            evaluationTimeMs: 1200
          } 
        },
        { 
          name: 'ModelC', 
          evaluation: { 
            success: true, 
            metrics: { accuracy: 0.82, precision: 0.80 },
            predictions: [],
            evaluationTimeMs: 900
          } 
        }
      ]
      
      const comparison = compareModels(modelResults, 'accuracy')
      
      expect(comparison.models).toEqual(['ModelA', 'ModelB', 'ModelC'])
      expect(comparison.winner).toBe('ModelB')
      expect(comparison.metrics.accuracy).toEqual([0.85, 0.90, 0.82])
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Training Pipeline Integration', () => {
  it('should complete full training workflow', async () => {
    // 1. Create stratified split
    const samples = generateMockSamples(200)
    const split = createStratifiedSplit(samples, 0.7, 0.15)
    
    expect(split.train.length).toBeGreaterThan(0)
    expect(split.validation.length).toBeGreaterThan(0)
    
    // 2. Generate random hyperparameters
    const config = generateRandomConfig(DEFAULT_HYPERPARAMETER_SPACE)
    expect(config.learningRate).toBeGreaterThan(0)
    expect(config.batchSize).toBeGreaterThan(0)
    
    // 3. Create folds for cross-validation
    const folds = createStratifiedFolds(split.train, 5)
    expect(folds).toHaveLength(5)
    
    // 4. Simulate predictions
    const predictions = generateMockPredictions(100, 0.8)
    
    // 5. Calculate metrics
    const metrics = calculateClassificationMetrics(predictions)
    expect(metrics.accuracy).toBeGreaterThan(0)
    
    // 6. Build confusion matrix
    const matrix = buildConfusionMatrix(predictions)
    expect(matrix.totalSamples).toBe(100)
    
    // 7. Calculate ROC
    const roc = calculateROCCurve(predictions)
    expect(roc.auc).toBeGreaterThan(0)
    
    // 8. Detect overfitting
    const analysis = detectOverfitting(
      { accuracy: 0.95, loss: 0.1 },
      { accuracy: 0.80, loss: 0.35 }
    )
    expect(analysis.isOverfitting).toBe(true)
  })

  it('should handle edge cases gracefully', () => {
    // Empty predictions
    const emptyMetrics = calculateClassificationMetrics([])
    expect(emptyMetrics.accuracy).toBeNaN()
    
    // Single class predictions
    const singleClassPreds: ValidationPrediction[] = [
      { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
      { sampleId: '2', actual: 1, predicted: 1, confidence: 0.8 }
    ]
    const singleClassMetrics = calculateClassificationMetrics(singleClassPreds)
    expect(singleClassMetrics.accuracy).toBe(1)
    
    // Perfect predictions
    const perfectPreds: ValidationPrediction[] = [
      { sampleId: '1', actual: 1, predicted: 1, confidence: 0.9 },
      { sampleId: '2', actual: 0, predicted: 0, confidence: 0.9 }
    ]
    const perfectAuc = calculateAUC(perfectPreds)
    expect(perfectAuc).toBe(1)
  })
})

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export all orchestrator functions', () => {
    expect(TrainingOrchestrator).toBeDefined()
    expect(getTrainingOrchestrator).toBeDefined()
    expect(resetTrainingOrchestrator).toBeDefined()
    expect(DEFAULT_TRAINING_OPTIONS).toBeDefined()
    expect(DEFAULT_ORCHESTRATOR_CONFIG).toBeDefined()
  })

  it('should export all hyperparameter functions', () => {
    expect(runGridSearch).toBeDefined()
    expect(runRandomSearch).toBeDefined()
    expect(runBayesianOptimization).toBeDefined()
    expect(generateGrid).toBeDefined()
    expect(generateRandomConfig).toBeDefined()
    expect(selectBestModel).toBeDefined()
    expect(compareConfigs).toBeDefined()
    expect(DEFAULT_HYPERPARAMETER_SPACE).toBeDefined()
    expect(DEFAULT_SEARCH_CONFIG).toBeDefined()
  })

  it('should export all validation functions', () => {
    expect(performKFoldValidation).toBeDefined()
    expect(createFolds).toBeDefined()
    expect(createStratifiedFolds).toBeDefined()
    expect(createStratifiedSplit).toBeDefined()
    expect(calculateClassificationMetrics).toBeDefined()
    expect(calculateRegressionMetrics).toBeDefined()
    expect(calculateAUC).toBeDefined()
    expect(detectOverfitting).toBeDefined()
    expect(analyzeLearningCurve).toBeDefined()
    expect(DEFAULT_VALIDATION_CONFIG).toBeDefined()
  })

  it('should export all evaluation functions', () => {
    expect(evaluateModel).toBeDefined()
    expect(buildConfusionMatrix).toBeDefined()
    expect(calculateROCCurve).toBeDefined()
    expect(calculatePrecisionRecallCurve).toBeDefined()
    expect(analyzeCalibration).toBeDefined()
    expect(analyzeErrors).toBeDefined()
    expect(generatePerformanceReport).toBeDefined()
    expect(compareModels).toBeDefined()
    expect(DEFAULT_EVALUATION_CONFIG).toBeDefined()
  })
})
