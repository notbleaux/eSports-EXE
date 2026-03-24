/**
 * ML Data Pipeline Core
 * 
 * [Ver001.000]
 * 
 * Provides:
 * - Data ingestion from matches
 * - Feature extraction
 * - Data normalization
 * - Train/test split
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

import * as tf from '@tensorflow/tfjs'
import { mlLogger } from '@/utils/logger'
import type { TrainingSample, Dataset } from './dataStore'
import type { ExtractedFeatures } from './features'
import { validateSample, calculateDistributionStats, DistributionStats } from './validation'

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PipelineConfig {
  batchSize: number
  validationSplit: number
  testSplit: number
  shuffleSeed?: number
  normalizeFeatures: boolean
  handleMissingValues: 'drop' | 'impute' | 'ignore'
  outlierStrategy: 'remove' | 'flag' | 'ignore'
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  batchSize: 32,
  validationSplit: 0.15,
  testSplit: 0.15,
  shuffleSeed: undefined,
  normalizeFeatures: true,
  handleMissingValues: 'impute',
  outlierStrategy: 'flag'
}

export interface NormalizationParams {
  means: number[]
  stds: number[]
  mins: number[]
  maxs: number[]
}

export interface DatasetSplit {
  train: TrainingSample[]
  validation: TrainingSample[]
  test: TrainingSample[]
  stats: {
    total: number
    trainCount: number
    validationCount: number
    testCount: number
    classBalance: {
      train: { positive: number; negative: number }
      validation: { positive: number; negative: number }
      test: { positive: number; negative: number }
    }
  }
}

export interface TensorDataset {
  train: {
    xs: tf.Tensor2D
    ys: tf.Tensor2D
  }
  validation: {
    xs: tf.Tensor2D
    ys: tf.Tensor2D
  }
  test: {
    xs: tf.Tensor2D
    ys: tf.Tensor2D
  }
  normalizationParams?: NormalizationParams
}

export interface PipelineResult {
  success: boolean
  datasetId: string
  split: DatasetSplit
  tensorData: TensorDataset
  normalizationParams?: NormalizationParams
  stats: {
    processedSamples: number
    rejectedSamples: number
    normalizationApplied: boolean
    processingTimeMs: number
  }
  error?: string
}

export interface IngestionResult {
  success: boolean
  samples: TrainingSample[]
  errors: string[]
  stats: {
    ingested: number
    skipped: number
    failed: number
  }
}

// ============================================================================
// Data Ingestion
// ============================================================================

export interface MatchData {
  matchId: string
  rounds: RoundData[]
  teams: {
    id: string
    name: string
    players: PlayerData[]
  }[]
  mapName: string
  timestamp: number
}

export interface RoundData {
  roundId: string
  roundNumber: number
  winner: 'attackers' | 'defenders'
  events: GameEvent[]
  finalState: RoundState
}

export interface PlayerData {
  id: string
  name: string
  teamId: string
  agent: string
  stats: PlayerStats
}

export interface PlayerStats {
  kills: number
  deaths: number
  assists: number
  damage: number
}

export interface GameEvent {
  timestamp: number
  type: 'kill' | 'plant' | 'defuse' | 'utility' | 'position'
  playerId?: string
  targetId?: string
  position?: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface RoundState {
  playerPositions: Record<string, { x: number; y: number }>
  bombPlanted: boolean
  bombPosition?: { x: number; y: number }
  plantTime?: number
  alivePlayers: string[]
}

/**
 * Ingest match data and convert to training samples
 */
export async function ingestMatchData(
  match: MatchData,
  extractFeaturesFn: (round: RoundData, playerId: string) => ExtractedFeatures | null
): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: true,
    samples: [],
    errors: [],
    stats: {
      ingested: 0,
      skipped: 0,
      failed: 0
    }
  }

  for (const round of match.rounds) {
    try {
      // Determine round outcome label
      const roundOutcome: 0 | 1 = round.winner === 'attackers' ? 1 : 0

      for (const team of match.teams) {
        for (const player of team.players) {
          // Extract features for this player in this round
          const features = extractFeaturesFn(round, player.id)
          
          if (!features) {
            result.stats.skipped++
            continue
          }

          // Create training sample
          const sample: TrainingSample = {
            id: `${match.matchId}-${round.roundId}-${player.id}`,
            features: features.vector,
            labels: {
              roundOutcome,
              winProbability: roundOutcome // Simplified - would use actual win probability
            },
            metadata: {
              matchId: match.matchId,
              roundId: round.roundId,
              timestamp: match.timestamp,
              source: 'match_ingestion',
              featureVersion: '1.0.0',
              mapName: match.mapName,
              teamId: team.id,
              playerId: player.id
            },
            quality: {
              confidence: 0.8, // Default confidence
              isOutlier: false,
              missingValueCount: 0
            }
          }

          result.samples.push(sample)
          result.stats.ingested++
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Round ${round.roundId}: ${message}`)
      result.stats.failed++
    }
  }

  mlLogger.info('Match ingestion complete', {
    matchId: match.matchId,
    ingested: result.stats.ingested,
    skipped: result.stats.skipped,
    failed: result.stats.failed
  })

  return result
}

/**
 * Ingest data from lens outputs
 */
export async function ingestLensData(
  lensData: ExtractedFeatures[],
  labels: { winProbability?: number; roundOutcome?: 0 | 1 }[],
  metadata: { matchId: string; roundId: string; mapName?: string }[]
): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: true,
    samples: [],
    errors: [],
    stats: { ingested: 0, skipped: 0, failed: 0 }
  }

  for (let i = 0; i < lensData.length; i++) {
    try {
      const features = lensData[i]
      const label = labels[i]
      const meta = metadata[i]

      if (!features || !meta) {
        result.stats.skipped++
        continue
      }

      const sample: TrainingSample = {
        id: `${meta.matchId}-${meta.roundId}-${i}`,
        features: features.vector,
        labels: {
          winProbability: label?.winProbability,
          roundOutcome: label?.roundOutcome
        },
        metadata: {
          matchId: meta.matchId,
          roundId: meta.roundId,
          timestamp: Date.now(),
          source: 'lens_ingestion',
          featureVersion: '1.0.0',
          mapName: meta.mapName
        },
        quality: {
          confidence: 0.9,
          isOutlier: false,
          missingValueCount: 0
        }
      }

      result.samples.push(sample)
      result.stats.ingested++
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Index ${i}: ${message}`)
      result.stats.failed++
    }
  }

  return result
}

// ============================================================================
// Data Normalization
// ============================================================================

/**
 * Calculate normalization parameters from training data
 */
export function calculateNormalizationParams(
  samples: TrainingSample[]
): NormalizationParams {
  const featureCount = samples[0]?.features.length || 0
  
  const means: number[] = []
  const stds: number[] = []
  const mins: number[] = []
  const maxs: number[] = []

  for (let i = 0; i < featureCount; i++) {
    const values = samples.map(s => s.features[i]).filter(v => !isNaN(v))
    
    if (values.length === 0) {
      means.push(0)
      stds.push(1)
      mins.push(0)
      maxs.push(1)
      continue
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const std = Math.sqrt(variance) || 1 // Avoid division by zero

    means.push(mean)
    stds.push(std)
    mins.push(Math.min(...values))
    maxs.push(Math.max(...values))
  }

  return { means, stds, mins, maxs }
}

/**
 * Normalize samples using Z-score normalization
 */
export function normalizeSamples(
  samples: TrainingSample[],
  params: NormalizationParams
): TrainingSample[] {
  return samples.map(sample => ({
    ...sample,
    features: sample.features.map((value, i) => {
      if (isNaN(value)) return 0
      const mean = params.means[i] || 0
      const std = params.stds[i] || 1
      return (value - mean) / std
    })
  }))
}

/**
 * Denormalize values using stored parameters
 */
export function denormalizeValue(
  normalizedValue: number,
  featureIndex: number,
  params: NormalizationParams
): number {
  const mean = params.means[featureIndex] || 0
  const std = params.stds[featureIndex] || 1
  return normalizedValue * std + mean
}

/**
 * Min-max normalize to [0, 1] range
 */
export function minMaxNormalizeSamples(
  samples: TrainingSample[],
  params: NormalizationParams
): TrainingSample[] {
  return samples.map(sample => ({
    ...sample,
    features: sample.features.map((value, i) => {
      if (isNaN(value)) return 0.5
      const min = params.mins[i] || 0
      const max = params.maxs[i] || 1
      const range = max - min || 1
      return (value - min) / range
    })
  }))
}

// ============================================================================
// Train/Test Split
// ============================================================================

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array]
  let rng = seed !== undefined ? mulberry32(seed) : Math.random

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/**
 * Simple seeded random number generator
 */
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Stratified split maintaining class balance
 */
export function stratifiedSplit(
  samples: TrainingSample[],
  config: PipelineConfig
): DatasetSplit {
  // Separate by class
  const positive = samples.filter(s => s.labels.roundOutcome === 1)
  const negative = samples.filter(s => s.labels.roundOutcome === 0)
  const unknown = samples.filter(s => s.labels.roundOutcome === undefined)

  // Shuffle each class
  const shuffledPositive = shuffleArray(positive, config.shuffleSeed)
  const shuffledNegative = shuffleArray(negative, config.shuffleSeed)
  const shuffledUnknown = shuffleArray(unknown, config.shuffleSeed)

  // Calculate split sizes
  const trainRatio = 1 - config.validationSplit - config.testSplit

  // Split each class proportionally
  const splitClass = (arr: TrainingSample[]) => {
    const trainSize = Math.floor(arr.length * trainRatio)
    const valSize = Math.floor(arr.length * config.validationSplit)
    
    return {
      train: arr.slice(0, trainSize),
      validation: arr.slice(trainSize, trainSize + valSize),
      test: arr.slice(trainSize + valSize)
    }
  }

  const posSplit = splitClass(shuffledPositive)
  const negSplit = splitClass(shuffledNegative)
  const unkSplit = splitClass(shuffledUnknown)

  // Combine splits
  const train = [...posSplit.train, ...negSplit.train, ...unkSplit.train]
  const validation = [...posSplit.validation, ...negSplit.validation, ...unkSplit.validation]
  const test = [...posSplit.test, ...negSplit.test, ...unkSplit.test]

  // Shuffle combined splits
  const finalTrain = shuffleArray(train, config.shuffleSeed)
  const finalValidation = shuffleArray(validation, config.shuffleSeed)
  const finalTest = shuffleArray(test, config.shuffleSeed)

  return {
    train: finalTrain,
    validation: finalValidation,
    test: finalTest,
    stats: {
      total: samples.length,
      trainCount: finalTrain.length,
      validationCount: finalValidation.length,
      testCount: finalTest.length,
      classBalance: {
        train: {
          positive: posSplit.train.length,
          negative: negSplit.train.length
        },
        validation: {
          positive: posSplit.validation.length,
          negative: negSplit.validation.length
        },
        test: {
          positive: posSplit.test.length,
          negative: negSplit.test.length
        }
      }
    }
  }
}

/**
 * Random split without stratification
 */
export function randomSplit(
  samples: TrainingSample[],
  config: PipelineConfig
): DatasetSplit {
  const shuffled = shuffleArray(samples, config.shuffleSeed)
  
  const trainRatio = 1 - config.validationSplit - config.testSplit
  const trainSize = Math.floor(samples.length * trainRatio)
  const valSize = Math.floor(samples.length * config.validationSplit)

  const train = shuffled.slice(0, trainSize)
  const validation = shuffled.slice(trainSize, trainSize + valSize)
  const test = shuffled.slice(trainSize + valSize)

  const countByClass = (arr: TrainingSample[]) => ({
    positive: arr.filter(s => s.labels.roundOutcome === 1).length,
    negative: arr.filter(s => s.labels.roundOutcome === 0).length
  })

  return {
    train,
    validation,
    test,
    stats: {
      total: samples.length,
      trainCount: train.length,
      validationCount: validation.length,
      testCount: test.length,
      classBalance: {
        train: countByClass(train),
        validation: countByClass(validation),
        test: countByClass(test)
      }
    }
  }
}

// ============================================================================
// Tensor Conversion
// ============================================================================

/**
 * Convert samples to TensorFlow tensors
 */
export function samplesToTensors(
  samples: TrainingSample[],
  labelKey: 'winProbability' | 'roundOutcome' = 'roundOutcome'
): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
  const featureCount = samples[0]?.features.length || 0
  
  // Extract features and labels
  const features: number[][] = []
  const labels: number[] = []

  for (const sample of samples) {
    features.push(sample.features)
    
    if (labelKey === 'roundOutcome') {
      labels.push(sample.labels.roundOutcome ?? 0.5)
    } else {
      labels.push(sample.labels.winProbability ?? 0.5)
    }
  }

  // Create tensors
  const xs = tf.tensor2d(features, [samples.length, featureCount])
  const ys = labelKey === 'roundOutcome' 
    ? tf.tensor2d(labels.map(l => [l]), [samples.length, 1])
    : tf.tensor2d(labels, [samples.length, 1])

  return { xs, ys }
}

/**
 * Create TensorFlow Dataset from samples
 */
export function createTFDataset(
  samples: TrainingSample[],
  config: { batchSize: number; shuffle?: boolean; shuffleSeed?: number }
): tf.data.Dataset<{ xs: tf.Tensor; ys: tf.Tensor }> {
  const { xs, ys } = samplesToTensors(samples)
  
  let dataset = tf.data.zip({ xs: tf.data.array(xs), ys: tf.data.array(ys) })
  
  if (config.shuffle) {
    dataset = dataset.shuffle(samples.length, config.shuffleSeed)
  }
  
  return dataset.batch(config.batchSize)
}

// ============================================================================
// Main Pipeline
// ============================================================================

/**
 * Run complete data pipeline
 */
export async function runDataPipeline(
  samples: TrainingSample[],
  datasetId: string,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const startTime = performance.now()
  const pipelineConfig = { ...DEFAULT_PIPELINE_CONFIG, ...config }
  let rejectedCount = 0

  try {
    mlLogger.info('Starting data pipeline', { 
      sampleCount: samples.length, 
      datasetId,
      config: pipelineConfig 
    })

    // Step 1: Validation
    const validSamples: TrainingSample[] = []
    rejectedCount = 0

    for (const sample of samples) {
      const validation = await validateSample(sample)
      if (validation.valid) {
        validSamples.push(sample)
      } else {
        rejectedCount++
        mlLogger.debug('Sample rejected', { 
          id: sample.id, 
          errors: validation.errors.map(e => e.message) 
        })
      }
    }

    if (validSamples.length === 0) {
      throw new Error('No valid samples after validation')
    }

    // Step 2: Handle missing values
    let processedSamples = validSamples
    if (pipelineConfig.handleMissingValues === 'drop') {
      processedSamples = validSamples.filter(s => 
        s.features.every(v => typeof v === 'number' && !isNaN(v))
      )
    } else if (pipelineConfig.handleMissingValues === 'impute') {
      // Simple imputation with mean
      const stats = calculateDistributionStats(validSamples)
      processedSamples = validSamples.map(s => ({
        ...s,
        features: s.features.map((v, i) => 
          typeof v === 'number' && !isNaN(v) ? v : stats.means[i] || 0
        )
      }))
    }

    // Step 3: Train/validation/test split
    const split = stratifiedSplit(processedSamples, pipelineConfig)

    // Step 4: Calculate normalization params from training data only
    let normalizationParams: NormalizationParams | undefined
    let normalizedTrain = split.train
    let normalizedValidation = split.validation
    let normalizedTest = split.test

    if (pipelineConfig.normalizeFeatures) {
      normalizationParams = calculateNormalizationParams(split.train)
      normalizedTrain = normalizeSamples(split.train, normalizationParams)
      normalizedValidation = normalizeSamples(split.validation, normalizationParams)
      normalizedTest = normalizeSamples(split.test, normalizationParams)
    }

    // Step 5: Convert to tensors
    const trainTensors = samplesToTensors(normalizedTrain)
    const validationTensors = samplesToTensors(normalizedValidation)
    const testTensors = samplesToTensors(normalizedTest)

    const processingTime = performance.now() - startTime

    mlLogger.info('Data pipeline complete', {
      processedSamples: processedSamples.length,
      rejectedSamples: rejectedCount,
      trainSize: split.stats.trainCount,
      validationSize: split.stats.validationCount,
      testSize: split.stats.testCount,
      processingTimeMs: processingTime
    })

    return {
      success: true,
      datasetId,
      split,
      tensorData: {
        train: trainTensors,
        validation: validationTensors,
        test: testTensors
      },
      normalizationParams,
      stats: {
        processedSamples: processedSamples.length,
        rejectedSamples: rejectedCount,
        normalizationApplied: pipelineConfig.normalizeFeatures,
        processingTimeMs: processingTime
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed'
    mlLogger.error('Data pipeline failed', { error: message })
    
    return {
      success: false,
      datasetId,
      split: {
        train: [],
        validation: [],
        test: [],
        stats: {
          total: 0,
          trainCount: 0,
          validationCount: 0,
          testCount: 0,
          classBalance: {
            train: { positive: 0, negative: 0 },
            validation: { positive: 0, negative: 0 },
            test: { positive: 0, negative: 0 }
          }
        }
      },
      tensorData: {
        train: { xs: tf.tensor2d([[]]), ys: tf.tensor2d([[]]) },
        validation: { xs: tf.tensor2d([[]]), ys: tf.tensor2d([[]]) },
        test: { xs: tf.tensor2d([[]]), ys: tf.tensor2d([[]]) }
      },
      stats: {
        processedSamples: 0,
        rejectedSamples: rejectedCount,
        normalizationApplied: false,
        processingTimeMs: performance.now() - startTime
      },
      error: message
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  runDataPipeline,
  ingestMatchData,
  ingestLensData,
  stratifiedSplit,
  randomSplit,
  normalizeSamples,
  minMaxNormalizeSamples,
  calculateNormalizationParams,
  samplesToTensors,
  createTFDataset,
  DEFAULT_PIPELINE_CONFIG
}
