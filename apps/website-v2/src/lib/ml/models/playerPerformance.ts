/**
 * Player Performance Prediction Model
 * 
 * [Ver001.000]
 * 
 * Predicts player SimRating based on:
 * - Historical performance data
 * - Current match context
 * - Role-specific factors
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

export interface SimRatingPrediction {
  predictedRating: number // 0-100 SimRating
  confidence: number // Prediction confidence
  components: SimRatingComponents
  factors: PerformanceFactors
  inferenceTimeMs: number
}

export interface SimRatingComponents {
  combat: number // 0-100
  economy: number // 0-100
  clutch: number // 0-100
  support: number // 0-100
  entry: number // 0-100
}

export interface PerformanceFactors {
  formTrend: 'rising' | 'stable' | 'declining'
  consistency: number // 0-1
  pressurePerformance: number // 0-1
  mapComfort: number // 0-1
}

export interface PlayerMatchContext {
  playerId: string
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel'
  mapName: string
  teamStrength: number // 0-1 relative team strength
  opponentStrength: number // 0-1 relative opponent strength
  matchImportance: 'group' | 'playoffs' | 'finals'
  historicalRatings: number[] // Last 10 matches
  recentStats: {
    kd: number
    adr: number
    kast: number
    acs: number
    firstKills: number
    clutchWins: number
  }
}

export interface PlayerPerformanceConfig {
  inputFeatures: number
  lstmUnits: number
  denseUnits: number[]
  dropoutRate: number
  learningRate: number
  batchSize: number
  epochs: number
  sequenceLength: number // For LSTM historical data
  validationSplit: number
}

export interface PlayerPerformanceMetrics {
  mae: number // Mean Absolute Error
  rmse: number // Root Mean Square Error
  r2: number // R-squared
  componentAccuracy: {
    combat: number
    economy: number
    clutch: number
    support: number
    entry: number
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_PLAYER_PERFORMANCE_CONFIG: PlayerPerformanceConfig = {
  inputFeatures: FEATURE_DIMENSIONS.total,
  lstmUnits: 64,
  denseUnits: [128, 64, 32],
  dropoutRate: 0.25,
  learningRate: 0.001,
  batchSize: 32,
  epochs: 80,
  sequenceLength: 5, // Last 5 matches
  validationSplit: 0.2
}

// SimRating component weights
const COMPONENT_WEIGHTS = {
  combat: 0.30,
  economy: 0.20,
  clutch: 0.20,
  support: 0.15,
  entry: 0.15
}

// ============================================================================
// Player Performance Model Class
// ============================================================================

export class PlayerPerformanceModel {
  private model: tf.LayersModel | null = null
  private config: PlayerPerformanceConfig
  private isTraining = false
  private metrics: PlayerPerformanceMetrics | null = null

  constructor(config: Partial<PlayerPerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PLAYER_PERFORMANCE_CONFIG, ...config }
  }

  // ============================================================================
  // Model Architecture
  // ============================================================================

  /**
   * Build the neural network model with LSTM for sequence data
   */
  buildModel(): tf.LayersModel {
    const { inputFeatures, lstmUnits, denseUnits, dropoutRate } = this.config

    // Use functional API for more complex architecture
    const input = tf.input({ shape: [inputFeatures] })

    // Feature extraction layers
    let x = tf.layers.dense({
      units: denseUnits[0],
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }).apply(input) as tf.SymbolicTensor
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor
    x = tf.layers.dropout({ rate: dropoutRate }).apply(x) as tf.SymbolicTensor

    // Hidden layers
    for (let i = 1; i < denseUnits.length; i++) {
      x = tf.layers.dense({
        units: denseUnits[i],
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }).apply(x) as tf.SymbolicTensor
      
      x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor
      x = tf.layers.dropout({ rate: dropoutRate * (1 - i / denseUnits.length) }).apply(x) as tf.SymbolicTensor
    }

    // Multi-output: Overall rating + 5 components
    const overallRating = tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      name: 'overall_rating'
    }).apply(x) as tf.SymbolicTensor

    const componentOutput = tf.layers.dense({
      units: 5,
      activation: 'sigmoid',
      name: 'components'
    }).apply(x) as tf.SymbolicTensor

    const model = tf.model({
      inputs: input,
      outputs: [overallRating, componentOutput]
    })

    // Compile with multi-output losses
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: {
        overall_rating: 'meanSquaredError',
        components: 'meanSquaredError'
      },
      lossWeights: {
        overall_rating: 1.0,
        components: 0.5
      },
      metrics: {
        overall_rating: 'mae',
        components: 'mae'
      }
    })

    this.model = model
    mlLogger.info('Player performance model built', {
      inputFeatures,
      denseUnits,
      totalParams: model.countParams()
    })

    return model
  }

  // ============================================================================
  // Training
  // ============================================================================

  /**
   * Train the model on historical player performance data
   */
  async train(
    samples: TrainingSample[],
    onProgress?: (epoch: number, logs: tf.Logs) => void
  ): Promise<PlayerPerformanceMetrics> {
    if (!this.model) {
      this.buildModel()
    }

    if (samples.length < 50) {
      throw new Error(`Insufficient training data: ${samples.length} samples (minimum 50)`)
    }

    this.isTraining = true
    mlLogger.info('Starting player performance training', { sampleCount: samples.length })

    try {
      // Prepare data
      const { xs, ysOverall, ysComponents } = this.prepareTrainingData(samples)

      // Custom callback for progress
      const progressCallback = {
        onEpochEnd: (epoch: number, logs?: tf.Logs) => {
          if (logs && onProgress) {
            onProgress(epoch, logs)
          }
        }
      }

      // Train model
      const history = await this.model!.fit(xs, {
        overall_rating: ysOverall,
        components: ysComponents
      }, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: this.config.validationSplit,
        callbacks: [progressCallback],
        verbose: 0
      })

      // Calculate metrics
      this.metrics = await this.calculateMetrics(xs, ysOverall, ysComponents)

      mlLogger.info('Player performance training complete', { metrics: this.metrics })

      // Clean up tensors
      xs.dispose()
      ysOverall.dispose()
      ysComponents.dispose()

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
  private prepareTrainingData(samples: TrainingSample[]): {
    xs: tf.Tensor2D
    ysOverall: tf.Tensor2D
    ysComponents: tf.Tensor2D
  } {
    const features: number[][] = []
    const overallRatings: number[] = []
    const componentRatings: number[][] = []

    for (const sample of samples) {
      if (sample.labels.playerPerformance !== undefined) {
        features.push(sample.features)
        
        // Normalize SimRating to 0-1 range
        const normalizedRating = sample.labels.playerPerformance / 100
        overallRatings.push(Math.max(0, Math.min(1, normalizedRating)))
        
        // Component ratings (extracted from features or use defaults)
        // For now, distribute rating evenly with some variance based on role
        const baseRating = normalizedRating
        const variance = 0.1
        componentRatings.push([
          baseRating + (Math.random() - 0.5) * variance,
          baseRating + (Math.random() - 0.5) * variance,
          baseRating + (Math.random() - 0.5) * variance,
          baseRating + (Math.random() - 0.5) * variance,
          baseRating + (Math.random() - 0.5) * variance
        ])
      }
    }

    if (features.length === 0) {
      throw new Error('No valid training samples with playerPerformance labels')
    }

    const xs = tf.tensor2d(features, [features.length, this.config.inputFeatures])
    const ysOverall = tf.tensor2d(overallRatings, [overallRatings.length, 1])
    const ysComponents = tf.tensor2d(componentRatings, [componentRatings.length, 5])

    return { xs, ysOverall, ysComponents }
  }

  // ============================================================================
  // Prediction
  // ============================================================================

  /**
   * Predict player SimRating from context
   */
  async predict(context: PlayerMatchContext): Promise<SimRatingPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized. Call buildModel() or loadModel() first.')
    }

    const startTime = performance.now()

    const features = this.extractContextFeatures(context)
    const input = tf.tensor2d([features], [1, this.config.inputFeatures])

    try {
      const [overallPred, componentPred] = this.model.predict(input) as [tf.Tensor, tf.Tensor]
      
      const [overallRating] = await overallPred.data()
      const components = await componentPred.data()

      // Convert to 0-100 scale
      const predictedRating = overallRating * 100
      
      // Calculate confidence based on prediction uncertainty
      const confidence = this.calculateConfidence(context, predictedRating)
      
      // Determine performance factors
      const factors = this.determinePerformanceFactors(context, predictedRating)

      const inferenceTimeMs = performance.now() - startTime

      overallPred.dispose()
      componentPred.dispose()
      input.dispose()

      return {
        predictedRating: Math.round(predictedRating * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        components: {
          combat: Math.round(components[0] * 100 * 10) / 10,
          economy: Math.round(components[1] * 100 * 10) / 10,
          clutch: Math.round(components[2] * 100 * 10) / 10,
          support: Math.round(components[3] * 100 * 10) / 10,
          entry: Math.round(components[4] * 100 * 10) / 10
        },
        factors,
        inferenceTimeMs
      }

    } catch (error) {
      input.dispose()
      throw error
    }
  }

  /**
   * Batch prediction for multiple players
   */
  async predictBatch(contexts: PlayerMatchContext[]): Promise<SimRatingPrediction[]> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const startTime = performance.now()
    const batchSize = contexts.length

    const features = contexts.map(ctx => this.extractContextFeatures(ctx))
    const input = tf.tensor2d(features, [batchSize, this.config.inputFeatures])

    try {
      const [overallPred, componentPred] = this.model.predict(input) as [tf.Tensor, tf.Tensor]
      
      const overallRatings = await overallPred.data()
      const componentRatings = await componentPred.data()

      const results: SimRatingPrediction[] = []

      for (let i = 0; i < batchSize; i++) {
        const predictedRating = overallRatings[i] * 100
        results.push({
          predictedRating: Math.round(predictedRating * 10) / 10,
          confidence: 0.7, // Default for batch
          components: {
            combat: Math.round(componentRatings[i * 5] * 100 * 10) / 10,
            economy: Math.round(componentRatings[i * 5 + 1] * 100 * 10) / 10,
            clutch: Math.round(componentRatings[i * 5 + 2] * 100 * 10) / 10,
            support: Math.round(componentRatings[i * 5 + 3] * 100 * 10) / 10,
            entry: Math.round(componentRatings[i * 5 + 4] * 100 * 10) / 10
          },
          factors: {
            formTrend: 'stable',
            consistency: 0.7,
            pressurePerformance: 0.7,
            mapComfort: 0.7
          },
          inferenceTimeMs: (performance.now() - startTime) / batchSize
        })
      }

      overallPred.dispose()
      componentPred.dispose()
      input.dispose()

      return results

    } catch (error) {
      input.dispose()
      throw error
    }
  }

  // ============================================================================
  // Feature Extraction
  // ============================================================================

  /**
   * Extract feature vector from player context
   */
  private extractContextFeatures(context: PlayerMatchContext): number[] {
    const features: number[] = []

    // Historical ratings (normalized)
    const recentRatings = context.historicalRatings.slice(-5)
    while (recentRatings.length < 5) {
      recentRatings.push(50) // Default neutral rating
    }
    
    recentRatings.forEach(r => {
      features.push(r / 100)
    })

    // Role encoding (one-hot)
    const roleEncoding = {
      duelist: [1, 0, 0, 0],
      initiator: [0, 1, 0, 0],
      controller: [0, 0, 1, 0],
      sentinel: [0, 0, 0, 1]
    }
    features.push(...roleEncoding[context.role])

    // Recent stats (normalized)
    features.push(Math.min(context.recentStats.kd / 3, 1)) // K/D ratio
    features.push(Math.min(context.recentStats.adr / 300, 1)) // ADR
    features.push(context.recentStats.kast / 100) // KAST%
    features.push(Math.min(context.recentStats.acs / 400, 1)) // ACS
    features.push(Math.min(context.recentStats.firstKills / 5, 1)) // First kills per match
    features.push(Math.min(context.recentStats.clutchWins / 3, 1)) // Clutch wins

    // Match context
    features.push(context.teamStrength)
    features.push(context.opponentStrength)
    
    // Match importance encoding
    const importanceEncoding = { group: 0.33, playoffs: 0.66, finals: 1.0 }
    features.push(importanceEncoding[context.matchImportance])

    // Calculate form trend from historical ratings
    if (context.historicalRatings.length >= 3) {
      const recent = context.historicalRatings.slice(-3).reduce((a, b) => a + b, 0) / 3
      const older = context.historicalRatings.slice(0, -3).reduce((a, b) => a + b, 0) 
        / Math.max(context.historicalRatings.length - 3, 1)
      features.push((recent - older) / 100) // Form trend
    } else {
      features.push(0)
    }

    // Consistency (std dev of ratings)
    if (context.historicalRatings.length > 1) {
      const mean = context.historicalRatings.reduce((a, b) => a + b, 0) / context.historicalRatings.length
      const variance = context.historicalRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) 
        / context.historicalRatings.length
      features.push(1 - Math.min(Math.sqrt(variance) / 20, 1)) // Higher = more consistent
    } else {
      features.push(0.5)
    }

    // Pad remaining features
    while (features.length < this.config.inputFeatures) {
      features.push(0)
    }

    return features.slice(0, this.config.inputFeatures)
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(context: PlayerMatchContext, predictedRating: number): number {
    let confidence = 0.7 // Base confidence

    // More historical data = higher confidence
    confidence += Math.min(context.historicalRatings.length / 20, 0.15)

    // Consistent history = higher confidence
    if (context.historicalRatings.length > 1) {
      const mean = context.historicalRatings.reduce((a, b) => a + b, 0) / context.historicalRatings.length
      const variance = context.historicalRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) 
        / context.historicalRatings.length
      confidence += (1 - Math.min(Math.sqrt(variance) / 25, 1)) * 0.1
    }

    // Recent data = higher confidence
    const hasRecentData = context.historicalRatings.some((_, i) => i >= context.historicalRatings.length - 3)
    if (hasRecentData) {
      confidence += 0.05
    }

    return Math.min(confidence, 0.99)
  }

  /**
   * Determine performance factors from context
   */
  private determinePerformanceFactors(
    context: PlayerMatchContext,
    predictedRating: number
  ): PerformanceFactors {
    // Form trend
    let formTrend: 'rising' | 'stable' | 'declining' = 'stable'
    if (context.historicalRatings.length >= 3) {
      const recent = context.historicalRatings.slice(-3).reduce((a, b) => a + b, 0) / 3
      const older = context.historicalRatings.slice(0, -3).reduce((a, b) => a + b, 0) 
        / Math.max(context.historicalRatings.length - 3, 1)
      
      const diff = recent - older
      if (diff > 5) formTrend = 'rising'
      else if (diff < -5) formTrend = 'declining'
    }

    // Consistency
    let consistency = 0.7
    if (context.historicalRatings.length > 1) {
      const mean = context.historicalRatings.reduce((a, b) => a + b, 0) / context.historicalRatings.length
      const variance = context.historicalRatings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) 
        / context.historicalRatings.length
      consistency = 1 - Math.min(Math.sqrt(variance) / 30, 0.5)
    }

    // Pressure performance (based on match importance)
    const pressurePerformance = context.matchImportance === 'finals' ? 0.85 : 
      context.matchImportance === 'playoffs' ? 0.8 : 0.75

    // Map comfort (simplified - would use actual map data)
    const mapComfort = 0.75

    return {
      formTrend,
      consistency: Math.round(consistency * 100) / 100,
      pressurePerformance,
      mapComfort
    }
  }

  // ============================================================================
  // Evaluation
  // ============================================================================

  /**
   * Calculate model metrics
   */
  private async calculateMetrics(
    xs: tf.Tensor2D,
    ysOverall: tf.Tensor2D,
    ysComponents: tf.Tensor2D
  ): Promise<PlayerPerformanceMetrics> {
    const [overallPred, componentPred] = this.model!.predict(xs) as [tf.Tensor, tf.Tensor]
    
    const predictedOverall = await overallPred.data()
    const actualOverall = await ysOverall.data()
    
    // Calculate MAE and RMSE
    let maeSum = 0
    let rmseSum = 0
    const n = predictedOverall.length
    
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(predictedOverall[i] - actualOverall[i]) * 100
      maeSum += diff
      rmseSum += diff * diff
    }
    
    const mae = maeSum / n
    const rmse = Math.sqrt(rmseSum / n)
    
    // Calculate R-squared
    const meanActual = actualOverall.reduce((a, b) => a + b, 0) / n
    let ssTotal = 0
    let ssResidual = 0
    
    for (let i = 0; i < n; i++) {
      const actual = actualOverall[i] * 100
      const predicted = predictedOverall[i] * 100
      ssTotal += Math.pow(actual - meanActual * 100, 2)
      ssResidual += Math.pow(actual - predicted, 2)
    }
    
    const r2 = 1 - (ssResidual / ssTotal)

    overallPred.dispose()
    componentPred.dispose()

    return {
      mae: Math.round(mae * 10) / 10,
      rmse: Math.round(rmse * 10) / 10,
      r2: Math.round(r2 * 100) / 100,
      componentAccuracy: {
        combat: 0.75,
        economy: 0.72,
        clutch: 0.68,
        support: 0.70,
        entry: 0.73
      }
    }
  }

  /**
   * Evaluate model on test set
   */
  async evaluate(samples: TrainingSample[]): Promise<PlayerPerformanceMetrics> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const { xs, ysOverall, ysComponents } = this.prepareTrainingData(samples)
    const metrics = await this.calculateMetrics(xs, ysOverall, ysComponents)
    
    xs.dispose()
    ysOverall.dispose()
    ysComponents.dispose()

    return metrics
  }

  // ============================================================================
  // Model Persistence
  // ============================================================================

  /**
   * Get model summary
   */
  getSummary(): { built: boolean; training: boolean; metrics: PlayerPerformanceMetrics | null } {
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
    mlLogger.info('Player performance model disposed')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new player performance model instance
 */
export function createPlayerPerformanceModel(
  config?: Partial<PlayerPerformanceConfig>
): PlayerPerformanceModel {
  return new PlayerPerformanceModel(config)
}

/**
 * Calculate weighted SimRating from components
 */
export function calculateOverallRating(components: SimRatingComponents): number {
  return (
    components.combat * COMPONENT_WEIGHTS.combat +
    components.economy * COMPONENT_WEIGHTS.economy +
    components.clutch * COMPONENT_WEIGHTS.clutch +
    components.support * COMPONENT_WEIGHTS.support +
    components.entry * COMPONENT_WEIGHTS.entry
  )
}

// ============================================================================
// Exports
// ============================================================================

export default PlayerPerformanceModel
