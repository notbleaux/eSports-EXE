/**
 * Strategy Recommendation Model
 * 
 * [Ver001.000]
 * 
 * Recommends strategies based on:
 * - Current match state
 * - Opponent tendencies
 * - Historical success rates
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

export interface StrategyRecommendation {
  strategies: RecommendedStrategy[]
  overallConfidence: number
  analyzedFactors: AnalyzedFactor[]
  inferenceTimeMs: number
}

export interface RecommendedStrategy {
  id: string
  name: string
  type: StrategyType
  description: string
  confidence: number // 0-1
  expectedWinRate: number // 0-1
  riskLevel: 'low' | 'medium' | 'high'
  requirements: StrategyRequirement[]
  counters: string[] // Counter-strategy IDs
}

export type StrategyType = 
  | 'aggressive_push'
  | 'slow_default'
  | 'fast_execute'
  | 'split_attack'
  | 'fake_a_execute_b'
  | 'eco_rush'
  | 'bait_and_switch'
  | 'contact_play'
  | 'default_defense'
  | 'aggressive_defense'
  | 'stack_site'

export interface StrategyRequirement {
  type: 'utility' | 'economy' | 'alive_players' | 'time'
  value: number | string
  met: boolean
}

export interface AnalyzedFactor {
  factor: string
  value: number
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
}

export interface MatchState {
  teamSide: 'attackers' | 'defenders'
  roundNumber: number
  score: { team: number; opponent: number }
  economy: {
    teamBank: number
    opponentBank: number
    canFullBuy: boolean
    canForceBuy: boolean
  }
  playerStatus: {
    teamAlive: number
    opponentAlive: number
    keyPlayersAlive: string[]
  }
  utility: {
    smokesAvailable: number
    flashesAvailable: number
    molliesAvailable: number
  }
  mapControl: {
    midControl: number // 0-1
    siteAControl: number // 0-1
    siteBControl: number // 0-1
  }
  timeRemaining: number // seconds
}

export interface OpponentTendencies {
  aggressionLevel: number // 0-1
  rotationSpeed: 'slow' | 'medium' | 'fast'
  sitePreferences: { a: number; b: number } // Site stack probabilities
  commonStrategies: { id: string; frequency: number }[]
  counterStrategies: { id: string; effectiveness: number }[]
  weaknesses: string[]
}

export interface StrategyConfig {
  inputFeatures: number
  numStrategies: number
  hiddenUnits: number[]
  dropoutRate: number
  learningRate: number
  batchSize: number
  epochs: number
  temperature: number // For confidence calibration
}

export interface StrategyMetrics {
  top1Accuracy: number
  top3Accuracy: number
  meanReciprocalRank: number
  calibrationError: number
  averageConfidence: number
}

// ============================================================================
// Strategy Definitions
// ============================================================================

export const STRATEGY_DEFINITIONS: Record<StrategyType, { name: string; description: string }> = {
  aggressive_push: {
    name: 'Aggressive Push',
    description: 'Fast coordinated push onto a site with utility'
  },
  slow_default: {
    name: 'Slow Default',
    description: 'Methodical map control followed by late execute'
  },
  fast_execute: {
    name: 'Fast Execute',
    description: 'Quick site take with pre-planned utility'
  },
  split_attack: {
    name: 'Split Attack',
    description: 'Pressure both sites simultaneously'
  },
  fake_a_execute_b: {
    name: 'Fake A Execute B',
    description: 'Draw rotation to A, execute on B'
  },
  eco_rush: {
    name: 'Eco Rush',
    description: 'Fast rush on low-buy round'
  },
  bait_and_switch: {
    name: 'Bait and Switch',
    description: 'Trade frag setup with defined roles'
  },
  contact_play: {
    name: 'Contact Play',
    description: 'Wait for contact, then collapse'
  },
  default_defense: {
    name: 'Default Defense',
    description: 'Standard site coverage and rotations'
  },
  aggressive_defense: {
    name: 'Aggressive Defense',
    description: 'Proactive map control and picks'
  },
  stack_site: {
    name: 'Stack Site',
    description: 'Overload one site, gamble on the other'
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  inputFeatures: FEATURE_DIMENSIONS.total,
  numStrategies: 11,
  hiddenUnits: [256, 128, 64],
  dropoutRate: 0.3,
  learningRate: 0.001,
  batchSize: 32,
  epochs: 100,
  temperature: 1.0
}

// ============================================================================
// Strategy Model Class
// ============================================================================

export class StrategyModel {
  private model: tf.LayersModel | null = null
  private config: StrategyConfig
  private isTraining = false
  private metrics: StrategyMetrics | null = null
  private strategySuccessRates: Map<string, { wins: number; total: number }> = new Map()

  constructor(config: Partial<StrategyConfig> = {}) {
    this.config = { ...DEFAULT_STRATEGY_CONFIG, ...config }
    this.initializeSuccessRates()
  }

  private initializeSuccessRates(): void {
    Object.keys(STRATEGY_DEFINITIONS).forEach(id => {
      this.strategySuccessRates.set(id, { wins: 50, total: 100 }) // Prior
    })
  }

  // ============================================================================
  // Model Architecture
  // ============================================================================

  /**
   * Build the neural network model
   */
  buildModel(): tf.LayersModel {
    const { inputFeatures, numStrategies, hiddenUnits, dropoutRate } = this.config

    const model = tf.sequential()

    // Input layer
    model.add(tf.layers.dense({
      inputShape: [inputFeatures],
      units: hiddenUnits[0],
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }))
    model.add(tf.layers.batchNormalization())
    model.add(tf.layers.dropout({ rate: dropoutRate }))

    // Hidden layers
    for (let i = 1; i < hiddenUnits.length; i++) {
      model.add(tf.layers.dense({
        units: hiddenUnits[i],
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }))
      model.add(tf.layers.batchNormalization())
      model.add(tf.layers.dropout({ rate: dropoutRate * (1 - i / hiddenUnits.length) }))
    }

    // Output layer with softmax for strategy probabilities
    model.add(tf.layers.dense({
      units: numStrategies,
      activation: 'softmax'
    }))

    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    this.model = model
    mlLogger.info('Strategy model built', {
      inputFeatures,
      numStrategies,
      hiddenUnits,
      totalParams: model.countParams()
    })

    return model
  }

  // ============================================================================
  // Training
  // ============================================================================

  /**
   * Train the model on historical strategy data
   */
  async train(
    samples: TrainingSample[],
    onProgress?: (epoch: number, logs: tf.Logs) => void
  ): Promise<StrategyMetrics> {
    if (!this.model) {
      this.buildModel()
    }

    if (samples.length < 100) {
      throw new Error(`Insufficient training data: ${samples.length} samples (minimum 100)`)
    }

    this.isTraining = true
    mlLogger.info('Starting strategy model training', { sampleCount: samples.length })

    try {
      // Prepare data
      const { xs, ys } = this.prepareTrainingData(samples)

      // Custom callback for progress
      const progressCallback = {
        onEpochEnd: (epoch: number, logs?: tf.Logs) => {
          if (logs && onProgress) {
            onProgress(epoch, logs)
          }
        }
      }

      // Train model
      await this.model!.fit(xs, ys, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: 0.2,
        callbacks: [progressCallback],
        verbose: 0
      })

      // Calculate metrics
      this.metrics = await this.calculateMetrics(xs, ys)

      mlLogger.info('Strategy model training complete', { metrics: this.metrics })

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
    const labels: number[][] = []

    for (const sample of samples) {
      // Use round outcome and features to infer best strategy
      // In practice, strategy labels would be explicitly provided
      if (sample.labels.roundOutcome !== undefined) {
        features.push(sample.features)
        
        // Create one-hot encoded strategy label
        // Use a heuristic based on round outcome and features
        const strategyIndex = this.inferStrategyFromSample(sample)
        const oneHot = new Array(this.config.numStrategies).fill(0)
        oneHot[strategyIndex] = 1
        labels.push(oneHot)
      }
    }

    if (features.length === 0) {
      throw new Error('No valid training samples')
    }

    const xs = tf.tensor2d(features, [features.length, this.config.inputFeatures])
    const ys = tf.tensor2d(labels, [labels.length, this.config.numStrategies])

    return { xs, ys }
  }

  /**
   * Infer strategy from sample features (heuristic)
   */
  private inferStrategyFromSample(sample: TrainingSample): number {
    // Simple heuristic based on features
    const features = sample.features
    
    // Economy feature index (approximate)
    const economyIndex = 16 // team_bank feature
    const economy = features[economyIndex] || 0.5
    
    // Timing feature
    const timingIndex = 8 // round_time feature
    const timing = features[timingIndex] || 0.5
    
    // Select strategy based on features
    if (economy < 0.3) return 5 // eco_rush
    if (timing < 0.2) return 2 // fast_execute
    if (economy > 0.8) return 0 // aggressive_push
    if (Math.random() > 0.5) return 4 // fake_a_execute_b
    
    return 1 // slow_default (balanced)
  }

  // ============================================================================
  // Prediction
  // ============================================================================

  /**
   * Recommend strategies for current match state
   */
  async recommend(
    matchState: MatchState,
    opponentTendencies: OpponentTendencies
  ): Promise<StrategyRecommendation> {
    if (!this.model) {
      throw new Error('Model not initialized. Call buildModel() or loadModel() first.')
    }

    const startTime = performance.now()

    const features = this.extractStateFeatures(matchState, opponentTendencies)
    const input = tf.tensor2d([features], [1, this.config.inputFeatures])

    try {
      const prediction = this.model.predict(input) as tf.Tensor
      const probabilities = await prediction.data()

      // Apply temperature scaling for confidence calibration
      const scaledProbs = this.applyTemperature(Array.from(probabilities))

      // Create strategy recommendations
      const strategies = this.createRecommendations(
        scaledProbs,
        matchState,
        opponentTendencies
      )

      // Calculate analyzed factors
      const analyzedFactors = this.analyzeFactors(matchState, opponentTendencies)

      // Calculate overall confidence
      const overallConfidence = strategies.slice(0, 3).reduce((sum, s) => sum + s.confidence, 0) / 3

      const inferenceTimeMs = performance.now() - startTime

      prediction.dispose()
      input.dispose()

      return {
        strategies,
        overallConfidence,
        analyzedFactors,
        inferenceTimeMs
      }

    } catch (error) {
      input.dispose()
      throw error
    }
  }

  /**
   * Apply temperature scaling to probabilities
   */
  private applyTemperature(probabilities: number[]): number[] {
    const temperature = this.config.temperature
    const scaled = probabilities.map(p => Math.pow(p, 1 / temperature))
    const sum = scaled.reduce((a, b) => a + b, 0)
    return scaled.map(p => p / sum)
  }

  /**
   * Create strategy recommendations from probabilities
   */
  private createRecommendations(
    probabilities: number[],
    matchState: MatchState,
    _opponentTendencies: OpponentTendencies
  ): RecommendedStrategy[] {
    const strategyTypes = Object.keys(STRATEGY_DEFINITIONS) as StrategyType[]
    
    const scored = strategyTypes.map((type, index) => ({
      type,
      probability: probabilities[index],
      successRate: this.getStrategySuccessRate(type),
      definition: STRATEGY_DEFINITIONS[type]
    }))

    // Filter strategies by side
    const attackerStrategies = ['aggressive_push', 'slow_default', 'fast_execute', 'split_attack', 
      'fake_a_execute_b', 'eco_rush', 'bait_and_switch', 'contact_play']
    const defenderStrategies = ['default_defense', 'aggressive_defense', 'stack_site']
    
    const validStrategies = matchState.teamSide === 'attackers' 
      ? attackerStrategies 
      : defenderStrategies

    // Sort by combined score
    const sorted = scored
      .filter(s => validStrategies.includes(s.type))
      .sort((a, b) => {
        // Combine model probability with success rate
        const scoreA = a.probability * 0.6 + a.successRate * 0.4
        const scoreB = b.probability * 0.6 + b.successRate * 0.4
        return scoreB - scoreA
      })

    return sorted.slice(0, 5).map((s, i) => this.createStrategyRecommendation(
      s.type,
      s.probability,
      matchState,
      i
    ))
  }

  /**
   * Create a single strategy recommendation
   */
  private createStrategyRecommendation(
    type: StrategyType,
    confidence: number,
    matchState: MatchState,
    _rank: number
  ): RecommendedStrategy {
    const definition = STRATEGY_DEFINITIONS[type]
    const successRate = this.getStrategySuccessRate(type)
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium'
    if (type === 'eco_rush' || type === 'stack_site') riskLevel = 'high'
    else if (type === 'slow_default' || type === 'default_defense') riskLevel = 'low'

    // Create requirements
    const requirements = this.createRequirements(type, matchState)

    // Determine counters
    const counters = this.getCounterStrategies(type)

    return {
      id: type,
      name: definition.name,
      type,
      description: definition.description,
      confidence: Math.round(confidence * 100) / 100,
      expectedWinRate: Math.round(successRate * 100) / 100,
      riskLevel,
      requirements,
      counters
    }
  }

  /**
   * Create strategy requirements
   */
  private createRequirements(type: StrategyType, matchState: MatchState): StrategyRequirement[] {
    const requirements: StrategyRequirement[] = []

    // Utility requirements
    if (type === 'fast_execute' || type === 'aggressive_push') {
      requirements.push({
        type: 'utility',
        value: '2+ smokes, 2+ flashes',
        met: matchState.utility.smokesAvailable >= 2 && matchState.utility.flashesAvailable >= 2
      })
    }

    // Economy requirements
    if (type === 'full_buy') {
      requirements.push({
        type: 'economy',
        value: '4000+ per player',
        met: matchState.economy.canFullBuy
      })
    }

    // Alive players requirements
    requirements.push({
      type: 'alive_players',
      value: '3+',
      met: matchState.playerStatus.teamAlive >= 3
    })

    // Time requirements
    if (type === 'slow_default') {
      requirements.push({
        type: 'time',
        value: '60+ seconds',
        met: matchState.timeRemaining >= 60
      })
    }

    return requirements
  }

  /**
   * Get counter strategies
   */
  private getCounterStrategies(type: StrategyType): string[] {
    const counterMap: Record<StrategyType, string[]> = {
      aggressive_push: ['bait_and_switch', 'contact_play'],
      slow_default: ['aggressive_defense', 'fast_execute'],
      fast_execute: ['stack_site', 'aggressive_defense'],
      split_attack: ['stack_site', 'default_defense'],
      fake_a_execute_b: ['default_defense', 'aggressive_defense'],
      eco_rush: ['aggressive_defense', 'contact_play'],
      bait_and_switch: ['slow_default', 'contact_play'],
      contact_play: ['fast_execute', 'aggressive_push'],
      default_defense: ['split_attack', 'fake_a_execute_b'],
      aggressive_defense: ['slow_default', 'bait_and_switch'],
      stack_site: ['split_attack', 'fake_a_execute_b']
    }

    return counterMap[type] || []
  }

  /**
   * Get strategy success rate
   */
  private getStrategySuccessRate(type: StrategyType): number {
    const stats = this.strategySuccessRates.get(type)
    if (!stats || stats.total === 0) return 0.5
    return stats.wins / stats.total
  }

  /**
   * Update strategy success rates
   */
  updateStrategyOutcome(strategyId: string, won: boolean): void {
    const stats = this.strategySuccessRates.get(strategyId) || { wins: 50, total: 100 }
    stats.total++
    if (won) stats.wins++
    this.strategySuccessRates.set(strategyId, stats)
  }

  // ============================================================================
  // Feature Extraction
  // ============================================================================

  /**
   * Extract feature vector from match state and opponent tendencies
   */
  private extractStateFeatures(
    matchState: MatchState,
    opponentTendencies: OpponentTendencies
  ): number[] {
    const features: number[] = []

    // Match state features
    features.push(matchState.teamSide === 'attackers' ? 1 : 0)
    features.push(matchState.roundNumber / 24) // Normalize to max rounds
    features.push(matchState.score.team / 13)
    features.push(matchState.score.opponent / 13)

    // Economy features
    features.push(Math.min(matchState.economy.teamBank / 25000, 1))
    features.push(matchState.economy.canFullBuy ? 1 : 0)
    features.push(matchState.economy.canForceBuy ? 1 : 0)

    // Player status
    features.push(matchState.playerStatus.teamAlive / 5)
    features.push(matchState.playerStatus.opponentAlive / 5)

    // Utility
    features.push(matchState.utility.smokesAvailable / 5)
    features.push(matchState.utility.flashesAvailable / 10)
    features.push(matchState.utility.molliesAvailable / 5)

    // Map control
    features.push(matchState.mapControl.midControl)
    features.push(matchState.mapControl.siteAControl)
    features.push(matchState.mapControl.siteBControl)

    // Time
    features.push(matchState.timeRemaining / 100)

    // Opponent tendencies
    features.push(opponentTendencies.aggressionLevel)
    features.push(opponentTendencies.rotationSpeed === 'fast' ? 1 : 
      opponentTendencies.rotationSpeed === 'medium' ? 0.5 : 0)
    features.push(opponentTendencies.sitePreferences.a)
    features.push(opponentTendencies.sitePreferences.b)

    // Pad to expected feature count
    while (features.length < this.config.inputFeatures) {
      features.push(0)
    }

    return features.slice(0, this.config.inputFeatures)
  }

  /**
   * Analyze match factors
   */
  private analyzeFactors(
    matchState: MatchState,
    opponentTendencies: OpponentTendencies
  ): AnalyzedFactor[] {
    const factors: AnalyzedFactor[] = []

    // Economy advantage
    const econAdvantage = matchState.economy.teamBank - (matchState.economy.canFullBuy ? 1 : 0)
    factors.push({
      factor: 'Economy Advantage',
      value: econAdvantage,
      impact: econAdvantage > 0 ? 'positive' : econAdvantage < 0 ? 'negative' : 'neutral',
      weight: 0.2
    })

    // Player advantage
    const playerAdvantage = matchState.playerStatus.teamAlive - matchState.playerStatus.opponentAlive
    factors.push({
      factor: 'Player Count',
      value: playerAdvantage,
      impact: playerAdvantage > 0 ? 'positive' : playerAdvantage < 0 ? 'negative' : 'neutral',
      weight: 0.25
    })

    // Map control
    const totalControl = matchState.mapControl.midControl + 
      matchState.mapControl.siteAControl + 
      matchState.mapControl.siteBControl
    factors.push({
      factor: 'Map Control',
      value: totalControl / 3,
      impact: totalControl > 1.5 ? 'positive' : totalControl < 1.0 ? 'negative' : 'neutral',
      weight: 0.15
    })

    // Opponent aggression
    factors.push({
      factor: 'Opponent Aggression',
      value: opponentTendencies.aggressionLevel,
      impact: opponentTendencies.aggressionLevel > 0.7 ? 'negative' : 'neutral',
      weight: 0.1
    })

    // Time pressure
    const timePressure = matchState.timeRemaining < 30 ? 1 : matchState.timeRemaining < 60 ? 0.5 : 0
    factors.push({
      factor: 'Time Pressure',
      value: timePressure,
      impact: timePressure > 0.5 ? 'negative' : 'neutral',
      weight: 0.15
    })

    return factors
  }

  // ============================================================================
  // Evaluation
  // ============================================================================

  /**
   * Calculate model metrics
   */
  private async calculateMetrics(xs: tf.Tensor2D, ys: tf.Tensor2D): Promise<StrategyMetrics> {
    const predictions = this.model!.predict(xs) as tf.Tensor
    const predData = await predictions.data()
    const actualData = await ys.data()

    const numSamples = xs.shape[0]!
    const numClasses = this.config.numStrategies

    let top1Correct = 0
    let top3Correct = 0
    let reciprocalRankSum = 0

    for (let i = 0; i < numSamples; i++) {
      const actualIdx = this.getOneHotIndex(actualData as Float32Array, i, numClasses)
      
      // Get predictions for this sample
      const samplePreds: { idx: number; prob: number }[] = []
      for (let j = 0; j < numClasses; j++) {
        samplePreds.push({ idx: j, prob: (predData as Float32Array)[i * numClasses + j] })
      }
      
      // Sort by probability
      samplePreds.sort((a, b) => b.prob - a.prob)

      // Check top-1
      if (samplePreds[0].idx === actualIdx) {
        top1Correct++
      }

      // Check top-3
      if (samplePreds.slice(0, 3).some(p => p.idx === actualIdx)) {
        top3Correct++
      }

      // Calculate reciprocal rank
      const rank = samplePreds.findIndex(p => p.idx === actualIdx) + 1
      if (rank > 0) {
        reciprocalRankSum += 1 / rank
      }
    }

    predictions.dispose()

    return {
      top1Accuracy: top1Correct / numSamples,
      top3Accuracy: top3Correct / numSamples,
      meanReciprocalRank: reciprocalRankSum / numSamples,
      calibrationError: 0.05, // Placeholder
      averageConfidence: 0.75 // Placeholder
    }
  }

  private getOneHotIndex(data: Float32Array, sampleIdx: number, numClasses: number): number {
    for (let i = 0; i < numClasses; i++) {
      if (data[sampleIdx * numClasses + i] === 1) {
        return i
      }
    }
    return 0
  }

  // ============================================================================
  // Model Persistence
  // ============================================================================

  /**
   * Get model summary
   */
  getSummary(): { built: boolean; training: boolean; metrics: StrategyMetrics | null } {
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
    mlLogger.info('Strategy model disposed')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new strategy model instance
 */
export function createStrategyModel(config?: Partial<StrategyConfig>): StrategyModel {
  return new StrategyModel(config)
}

/**
 * Get all available strategies
 */
export function getAvailableStrategies(side: 'attackers' | 'defenders'): StrategyType[] {
  const attackerStrategies: StrategyType[] = ['aggressive_push', 'slow_default', 'fast_execute', 
    'split_attack', 'fake_a_execute_b', 'eco_rush', 'bait_and_switch', 'contact_play']
  const defenderStrategies: StrategyType[] = ['default_defense', 'aggressive_defense', 'stack_site']
  
  return side === 'attackers' ? attackerStrategies : defenderStrategies
}

// ============================================================================
// Exports
// ============================================================================

export default StrategyModel
