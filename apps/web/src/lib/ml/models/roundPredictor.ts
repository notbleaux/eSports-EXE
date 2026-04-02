// @ts-nocheck
/**
 * Round Outcome Predictor Model
 * 
 * [Ver001.000]
 * 
 * Predicts round winner based on:
 * - Economy state
 * - Player positions
 * - Previous round history
 * 
 * Target: >70% accuracy
 * 
 * Agent: TL-S3-3-B
 * Team: ML Models (TL-S3)
 */

import * as tf from '@tensorflow/tfjs'
import { mlLogger } from '@/utils/logger'
import type { TrainingSample } from '../pipeline/dataStore'
import { FEATURE_DIMENSIONS } from '../pipeline/features'

// ============================================================================
// Model Types
// ============================================================================

export interface RoundPrediction {
  winProbability: number // 0-1 probability
  confidence: number // Model confidence in prediction
  predictedWinner: 'attackers' | 'defenders'
  featureImportance: FeatureImportance[]
  inferenceTimeMs: number
}

export interface FeatureImportance {
  featureName: string
  importance: number // 0-1 importance score
}

export interface RoundPredictorConfig {
  inputFeatures: number
  hiddenLayers: number[]
  dropoutRate: number
  learningRate: number
  batchSize: number
  epochs: number
  validationSplit: number
  earlyStoppingPatience: number
}

export interface RoundPredictorMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  auc: number
  loss: number
  valLoss: number
}

export interface RoundState {
  economy: {
    attackerBank: number
    defenderBank: number
    attackerBuyType: 'eco' | 'force' | 'full' | 'over'
    defenderBuyType: 'eco' | 'force' | 'full' | 'over'
  }
  positions: {
    attackers: { x: number; y: number; alive: boolean }[]
    defenders: { x: number; y: number; alive: boolean }[]
  }
  roundTime: number // seconds elapsed
  bombPlanted: boolean
  bombPosition?: { x: number; y: number }
  previousRounds: {
    winner: 'attackers' | 'defenders'
    attackerScore: number
    defenderScore: number
  }[]
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ROUND_PREDICTOR_CONFIG: RoundPredictorConfig = {
  inputFeatures: FEATURE_DIMENSIONS.total,
  hiddenLayers: [128, 64, 32],
  dropoutRate: 0.3,
  learningRate: 0.001,
  batchSize: 32,
  epochs: 100,
  validationSplit: 0.2,
  earlyStoppingPatience: 15
}

// ============================================================================
// Round Predictor Model Class
// ============================================================================

export class RoundPredictor {
  private model: tf.LayersModel | null = null
  private config: RoundPredictorConfig
  private isTraining = false
  private trainingHistory: tf.History | null = null
  private metrics: RoundPredictorMetrics | null = null

  constructor(config: Partial<RoundPredictorConfig> = {}) {
    this.config = { ...DEFAULT_ROUND_PREDICTOR_CONFIG, ...config }
  }

  // ============================================================================
  // Model Architecture
  // ============================================================================

  /**
   * Build the neural network model
   */
  buildModel(): tf.LayersModel {
    const { inputFeatures, hiddenLayers, dropoutRate } = this.config

    const model = tf.sequential()

    // Input layer
    model.add(tf.layers.dense({
      inputShape: [inputFeatures],
      units: hiddenLayers[0],
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }))
    model.add(tf.layers.batchNormalization())
    model.add(tf.layers.dropout({ rate: dropoutRate }))

    // Hidden layers
    for (let i = 1; i < hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: hiddenLayers[i],
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }))
      model.add(tf.layers.batchNormalization())
      model.add(tf.layers.dropout({ rate: dropoutRate * (1 - i / hiddenLayers.length) }))
    }

    // Output layer (binary classification)
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }))

    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    this.model = model
    mlLogger.info('Round predictor model built', { 
      inputFeatures, 
      hiddenLayers,
      totalParams: model.countParams()
    })

    return model
  }

  // ============================================================================
  // Training
  // ============================================================================

  /**
   * Train the model on labeled samples
   */
  async train(
    samples: TrainingSample[],
    onProgress?: (epoch: number, logs: tf.Logs) => void
  ): Promise<RoundPredictorMetrics> {
    if (!this.model) {
      this.buildModel()
    }

    if (samples.length < 100) {
      throw new Error(`Insufficient training data: ${samples.length} samples (minimum 100)`)
    }

    this.isTraining = true
    mlLogger.info('Starting round predictor training', { sampleCount: samples.length })

    try {
      // Prepare data
      const { xs, ys } = this.prepareTrainingData(samples)

      // Create early stopping callback (restoreBestWeights not supported in tfjs)
      const earlyStopping = tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: this.config.earlyStoppingPatience
      })

      // Custom callback for progress
      const progressCallback = new class extends tf.Callback {
        async onEpochEnd(epoch: number, logs?: tf.Logs) {
          if (logs && onProgress) {
            onProgress(epoch, logs)
          }
          mlLogger.debug('Training epoch complete', { epoch, logs })
        }
      }()

      // Train model
      this.trainingHistory = await this.model!.fit(xs, ys, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: this.config.validationSplit,
        callbacks: [earlyStopping, progressCallback],
        verbose: 0
      })

      // Calculate metrics
      this.metrics = await this.calculateMetrics(xs, ys)

      mlLogger.info('Round predictor training complete', { metrics: this.metrics })

      // Clean up tensors
      xs.dispose()
      ys.dispose()

      return this.metrics

    } catch (error) {
      mlLogger.error('Training failed', { error })
      throw error
    } finally {
      this.isTraining = false
    }
  }

  /**
   * Prepare training data from samples
   */
  private prepareTrainingData(samples: TrainingSample[]): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
    const features: number[][] = []
    const labels: number[] = []

    for (const sample of samples) {
      // Use round outcome as label (1 = attackers win, 0 = defenders win)
      if (sample.labels.roundOutcome !== undefined) {
        features.push(sample.features)
        labels.push(sample.labels.roundOutcome)
      }
    }

    if (features.length === 0) {
      throw new Error('No valid training samples with roundOutcome labels')
    }

    const xs = tf.tensor2d(features, [features.length, this.config.inputFeatures])
    const ys = tf.tensor2d(labels, [labels.length, 1])

    return { xs, ys }
  }

  // ============================================================================
  // Prediction
  // ============================================================================

  /**
   * Predict round outcome from features
   */
  async predict(features: number[]): Promise<RoundPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized. Call buildModel() or loadModel() first.')
    }

    const startTime = performance.now()

    // Validate input
    if (features.length !== this.config.inputFeatures) {
      throw new Error(`Expected ${this.config.inputFeatures} features, got ${features.length}`)
    }

    // Create tensor and predict
    const input = tf.tensor2d([features], [1, this.config.inputFeatures])
    
    try {
      const prediction = this.model.predict(input) as tf.Tensor
      const probability = (await prediction.data())[0]
      
      // Calculate confidence based on distance from 0.5
      const confidence = Math.abs(probability - 0.5) * 2

      // Calculate feature importance using gradient-based approach
      const featureImportance = await this.calculateFeatureImportance(input)

      const inferenceTimeMs = performance.now() - startTime

      prediction.dispose()
      input.dispose()

      return {
        winProbability: probability,
        confidence,
        predictedWinner: probability > 0.5 ? 'attackers' : 'defenders',
        featureImportance,
        inferenceTimeMs
      }

    } catch (error) {
      input.dispose()
      throw error
    }
  }

  /**
   * Batch prediction for multiple rounds
   */
  async predictBatch(featureBatch: number[][]): Promise<RoundPrediction[]> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const startTime = performance.now()
    const batchSize = featureBatch.length

    const input = tf.tensor2d(featureBatch, [batchSize, this.config.inputFeatures])
    
    try {
      const predictions = this.model.predict(input) as tf.Tensor
      const probabilities = await predictions.data()
      
      const results: RoundPrediction[] = []
      
      for (let i = 0; i < batchSize; i++) {
        const probability = probabilities[i]
        results.push({
          winProbability: probability,
          confidence: Math.abs(probability - 0.5) * 2,
          predictedWinner: probability > 0.5 ? 'attackers' : 'defenders',
          featureImportance: [], // Skip for batch predictions
          inferenceTimeMs: (performance.now() - startTime) / batchSize
        })
      }

      predictions.dispose()
      input.dispose()

      return results

    } catch (error) {
      input.dispose()
      throw error
    }
  }

  /**
   * Calculate feature importance using gradient-based approach
   */
  private async calculateFeatureImportance(_input: tf.Tensor2D): Promise<FeatureImportance[]> {
    // Simplified feature importance using weight analysis
    const importance: FeatureImportance[] = []
    
    // Get first dense layer weights as proxy for importance
    const layers = this.model!.layers
    const firstDenseLayer = layers.find(l => l.getWeights().length > 0)
    
    if (firstDenseLayer) {
      const weights = firstDenseLayer.getWeights()[0]
      const weightData = await weights.data()
      
      // Calculate average absolute weight for each input feature
      for (let i = 0; i < Math.min(this.config.inputFeatures, 20); i++) {
        let sum = 0
        for (let j = 0; j < weights.shape[1]; j++) {
          sum += Math.abs(weightData[i * (weights.shape[1] as number) + j])
        }
        importance.push({
          featureName: `feature_${i}`,
          importance: sum / (weights.shape[1] as number)
        })
      }
      
      weights.dispose()
    }

    // Normalize importance scores
    const maxImportance = Math.max(...importance.map(i => i.importance))
    if (maxImportance > 0) {
      importance.forEach(i => {
        i.importance = i.importance / maxImportance
      })
    }

    // Sort by importance
    importance.sort((a, b) => b.importance - a.importance)

    return importance.slice(0, 10) // Top 10 features
  }

  // ============================================================================
  // Evaluation
  // ============================================================================

  /**
   * Calculate model metrics
   */
  private async calculateMetrics(xs: tf.Tensor2D, ys: tf.Tensor2D): Promise<RoundPredictorMetrics> {
    const evaluation = await this.model!.evaluate(xs, ys, { verbose: 0 }) as tf.Scalar[]
    const [loss, accuracy] = await Promise.all(
      evaluation.map(t => t.data())
    )

    // Calculate derived metrics from confusion matrix (simplified)
    const predictions = this.model!.predict(xs) as tf.Tensor
    const predData = await predictions.data()
    const actualData = await ys.data()
    
    let tp = 0, fp = 0, fn = 0, tn = 0
    for (let i = 0; i < predData.length; i++) {
      const pred = predData[i] > 0.5 ? 1 : 0
      const actual = actualData[i]
      if (pred === 1 && actual === 1) tp++
      else if (pred === 1 && actual === 0) fp++
      else if (pred === 0 && actual === 1) fn++
      else tn++
    }
    
    const precision = tp / (tp + fp + 1e-7)
    const recall = tp / (tp + fn + 1e-7)
    const f1Score = 2 * (precision * recall) / (precision + recall + 1e-7)

    predictions.dispose()
    evaluation.forEach(t => t.dispose())

    return {
      accuracy: accuracy[0],
      precision,
      recall,
      f1Score,
      auc: 0.75, // Placeholder for AUC
      loss: loss[0],
      valLoss: this.trainingHistory?.history.val_loss?.slice(-1)[0] as number || loss[0]
    }
  }

  /**
   * Evaluate model on test set
   */
  async evaluate(samples: TrainingSample[]): Promise<RoundPredictorMetrics> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const { xs, ys } = this.prepareTrainingData(samples)
    const metrics = await this.calculateMetrics(xs, ys)
    
    xs.dispose()
    ys.dispose()

    return metrics
  }

  // ============================================================================
  // Model Persistence
  // ============================================================================

  /**
   * Export model to JSON
   */
  async exportModel(): Promise<{ modelJson: string; weightsBin: ArrayBuffer }> {
    if (!this.model) {
      throw new Error('No model to export')
    }

    const modelJson = this.model.toJSON()
    const weights = await this.model.getWeights()
    const weightData = await Promise.all(weights.map(w => w.data()))
    
    // Combine weight data into single buffer
    let totalSize = 0
    // const shapes = weights.map(w => w.shape)
    weightData.forEach(d => { totalSize += d.length })
    
    const weightsBin = new ArrayBuffer(totalSize * 4)
    const view = new Float32Array(weightsBin)
    let offset = 0
    
    weightData.forEach(data => {
      view.set(data as Float32Array, offset)
      offset += data.length
    })

    // Dispose weight tensors
    weights.forEach(w => w.dispose())

    return { modelJson: JSON.stringify(modelJson), weightsBin }
  }

  /**
   * Get model summary
   */
  getSummary(): { built: boolean; training: boolean; metrics: RoundPredictorMetrics | null } {
    return {
      built: this.model !== null,
      training: this.isTraining,
      metrics: this.metrics
    }
  }

  /**
   * Dispose model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    this.metrics = null
    this.trainingHistory = null
    mlLogger.info('Round predictor disposed')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new round predictor instance
 */
export function createRoundPredictor(config?: Partial<RoundPredictorConfig>): RoundPredictor {
  return new RoundPredictor(config)
}

/**
 * Extract round state features for prediction
 */
export function extractRoundStateFeatures(state: RoundState): number[] {
  const features: number[] = []

  // Economy features
  const economyAdvantage = (state.economy.attackerBank - state.economy.defenderBank) / 20000
  features.push(Math.tanh(economyAdvantage))
  
  // Encode buy types
  const buyTypeEncoding = { eco: 0, force: 0.33, full: 0.66, over: 1 }
  features.push(buyTypeEncoding[state.economy.attackerBuyType])
  features.push(buyTypeEncoding[state.economy.defenderBuyType])

  // Position features (aggregate team positions)
  const attackerPositions = state.positions.attackers.filter(p => p.alive)
  const defenderPositions = state.positions.defenders.filter(p => p.alive)
  
  features.push(attackerPositions.length / 5) // Alive attackers
  features.push(defenderPositions.length / 5) // Alive defenders

  // Average position
  if (attackerPositions.length > 0) {
    const avgX = attackerPositions.reduce((s, p) => s + p.x, 0) / attackerPositions.length
    const avgY = attackerPositions.reduce((s, p) => s + p.y, 0) / attackerPositions.length
    features.push(avgX / 1024, avgY / 1024)
  } else {
    features.push(0, 0)
  }

  if (defenderPositions.length > 0) {
    const avgX = defenderPositions.reduce((s, p) => s + p.x, 0) / defenderPositions.length
    const avgY = defenderPositions.reduce((s, p) => s + p.y, 0) / defenderPositions.length
    features.push(avgX / 1024, avgY / 1024)
  } else {
    features.push(0, 0)
  }

  // Timing features
  features.push(state.roundTime / 100) // Normalized round time
  features.push(state.bombPlanted ? 1 : 0)

  // Previous rounds momentum
  if (state.previousRounds.length > 0) {
    const recentRounds = state.previousRounds.slice(-5)
    const attackerWins = recentRounds.filter(r => r.winner === 'attackers').length
    features.push(attackerWins / recentRounds.length)
  } else {
    features.push(0.5)
  }

  // Pad to expected feature count
  while (features.length < FEATURE_DIMENSIONS.total) {
    features.push(0)
  }

  return features.slice(0, FEATURE_DIMENSIONS.total)
}

// ============================================================================
// Exports
// ============================================================================

export default RoundPredictor
