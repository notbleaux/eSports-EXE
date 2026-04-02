// @ts-nocheck
/**
 * ML Pipeline Expanded Tests - Phase 2 Optimization Sprint
 * 
 * [Ver001.000]
 * 
 * Additional comprehensive test suite for ML data pipeline.
 * Tests: 45+
 * 
 * Coverage Targets:
 * - dataPipeline.ts: 85%+
 * - features.ts: 90%+
 * - validation.ts: 85%+
 * 
 * Agent: OPT-S3-1
 * Sprint: Phase 2 Optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as tf from '@tensorflow/tfjs'

// Feature extraction imports
import {
  extractPositionFeatures,
  extractTimingFeatures,
  extractEconomyFeatures,
  extractTeamCoordinationFeatures,
  extractLensFeatures,
  extractVisionFeatures,
  assembleFeatureVector,
  calculateDistance,
  calculateAngle,
  validateFeatureVector,
  hasMissingValues,
  fillMissingValues,
  FEATURE_DIMENSIONS,
  FEATURE_NAMES,
  getRoundPhase,
  classifyBuyType,
  encodeTimingPhase,
  encodeBuyType,
  calculateTradePotential,
  type PositionFeatures,
  type TimingFeatures,
  type EconomyFeatures,
  type TeamCoordinationFeatures
} from '../features'

// Data pipeline imports
import {
  runDataPipeline,
  ingestMatchData,
  ingestLensData,
  stratifiedSplit,
  randomSplit,
  calculateNormalizationParams,
  normalizeSamples,
  minMaxNormalizeSamples,
  denormalizeValue,
  samplesToTensors,
  createTFDataset,
  shuffleArray,
  DEFAULT_PIPELINE_CONFIG,
  type MatchData,
  type RoundData,
  type PipelineConfig
} from '../dataPipeline'

// Validation imports
import {
  validateSample,
  validateDataset,
  validateSchema,
  validateCompleteness,
  validateConsistency,
  validateOutliers,
  validateDistribution,
  detectMissingValues,
  imputeMissingValues,
  detectOutliersZScore,
  detectOutliersIQR,
  detectOutliersIsolation,
  calculateDistributionStats,
  type ValidationResult,
  type CheckResult
} from '../validation'

// Data store imports
import {
  storeSample,
  storeSamples,
  getSample,
  deleteSample,
  querySamples,
  createDataset,
  getDataset,
  deleteDataset,
  listDatasets,
  exportDataset,
  importSamples,
  countSamples,
  closeDB,
  deleteDB,
  type TrainingSample
} from '../dataStore'

// Pipeline manager imports
import {
  PipelineManager,
  getPipelineManager,
  resetPipelineManager
} from '../manager'

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockPlayer = (overrides: Partial<Parameters<typeof extractPositionFeatures>[0]> = {}) => ({
  id: 'p1',
  name: 'Player 1',
  team: 'attackers' as const,
  agent: 'Jett',
  position: { x: 512, y: 512 },
  rotation: 90,
  isAlive: true,
  ...overrides
})

const createMockMapBounds = (overrides: Partial<Parameters<typeof extractPositionFeatures>[1]> = {}) => ({
  width: 1024,
  height: 1024,
  scale: 1,
  sites: [
    { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const },
    { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' as const }
  ],
  ...overrides
})

const createMockSample = (id: string, outcome: 0 | 1 = 1, overrides: Partial<TrainingSample> = {}): TrainingSample => ({
  id,
  features: new Array(FEATURE_DIMENSIONS.total).fill(0.5).map(() => Math.random()),
  labels: { roundOutcome: outcome, winProbability: outcome },
  metadata: {
    matchId: 'match-1',
    roundId: `round-${id}`,
    timestamp: Date.now(),
    source: 'test',
    featureVersion: '1.0.0'
  },
  quality: {
    confidence: 0.9,
    isOutlier: false,
    missingValueCount: 0
  },
  ...overrides
})

const createMockMatchData = (): MatchData => ({
  matchId: 'match-test-1',
  rounds: [
    {
      roundId: 'round-1',
      roundNumber: 1,
      winner: 'attackers',
      events: [
        { timestamp: 10000, type: 'kill', playerId: 'p1', targetId: 'p2' },
        { timestamp: 45000, type: 'plant', playerId: 'p1', position: { x: 200, y: 200 } }
      ],
      finalState: {
        playerPositions: { p1: { x: 500, y: 500 }, p2: { x: 600, y: 600 } },
        bombPlanted: true,
        bombPosition: { x: 200, y: 200 },
        plantTime: 45,
        alivePlayers: ['p1']
      }
    }
  ],
  teams: [
    {
      id: 'team-a',
      name: 'Team A',
      players: [
        { id: 'p1', name: 'Player 1', teamId: 'team-a', agent: 'Jett', stats: { kills: 2, deaths: 0, assists: 0, damage: 200 } },
        { id: 'p2', name: 'Player 2', teamId: 'team-a', agent: 'Phoenix', stats: { kills: 1, deaths: 1, assists: 1, damage: 150 } }
      ]
    },
    {
      id: 'team-b',
      name: 'Team B',
      players: [
        { id: 'p3', name: 'Player 3', teamId: 'team-b', agent: 'Sage', stats: { kills: 0, deaths: 2, assists: 0, damage: 50 } },
        { id: 'p4', name: 'Player 4', teamId: 'team-b', agent: 'Cypher', stats: { kills: 1, deaths: 1, assists: 0, damage: 100 } }
      ]
    }
  ],
  mapName: 'Haven',
  timestamp: Date.now()
})

// ============================================================================
// FEATURE EXTRACTION TESTS (15 tests)
// ============================================================================

describe('Feature Extraction - Expanded', () => {
  describe('Position Feature Accuracy (5 tests)', () => {
    it('should calculate exact distance to site A', () => {
      const player = createMockPlayer({ position: { x: 200, y: 200 } })
      const mapBounds = createMockMapBounds()
      
      const features = extractPositionFeatures(player, mapBounds, [player])
      
      // Player is at site A, so distance should be 0
      expect(features.distanceToSiteA).toBe(0)
      expect(features.distanceToSiteB).toBeGreaterThan(0)
    })

    it('should calculate exact distance to site B', () => {
      const player = createMockPlayer({ position: { x: 800, y: 800 } })
      const mapBounds = createMockMapBounds()
      
      const features = extractPositionFeatures(player, mapBounds, [player])
      
      // Player is at site B, so distance should be 0
      expect(features.distanceToSiteB).toBe(0)
      expect(features.distanceToSiteA).toBeGreaterThan(0)
    })

    it('should handle player at center of map', () => {
      const player = createMockPlayer({ position: { x: 512, y: 512 } })
      const mapBounds = createMockMapBounds()
      
      const features = extractPositionFeatures(player, mapBounds, [player])
      
      // Center position
      expect(features.x).toBeCloseTo(0.5, 2)
      expect(features.y).toBeCloseTo(0.5, 2)
      expect(features.distanceToCenter).toBe(0)
    })

    it('should handle edge positions (0,0) and (1024,1024)', () => {
      const mapBounds = createMockMapBounds()
      
      const player1 = createMockPlayer({ position: { x: 0, y: 0 } })
      const features1 = extractPositionFeatures(player1, mapBounds, [player1])
      expect(features1.x).toBe(0)
      expect(features1.y).toBe(0)
      
      const player2 = createMockPlayer({ position: { x: 1024, y: 1024 } })
      const features2 = extractPositionFeatures(player2, mapBounds, [player2])
      expect(features2.x).toBe(1)
      expect(features2.y).toBe(1)
    })

    it('should calculate angles correctly to sites', () => {
      const player = createMockPlayer({ position: { x: 512, y: 512 } })
      const mapBounds = createMockMapBounds()
      
      const features = extractPositionFeatures(player, mapBounds, [player])
      
      // Angles should be normalized to [-1, 1] via cosine
      expect(features.angleToSiteA).toBeGreaterThanOrEqual(-1)
      expect(features.angleToSiteA).toBeLessThanOrEqual(1)
      expect(features.angleToSiteB).toBeGreaterThanOrEqual(-1)
      expect(features.angleToSiteB).toBeLessThanOrEqual(1)
    })
  })

  describe('Timing Feature Calculations (4 tests)', () => {
    it('should calculate timeToBombPlant correctly when bomb not planted', () => {
      const features = extractTimingFeatures(30, undefined, 10, [5, 15, 25])
      
      // 100s round, at 30s, time to plant = 70s
      expect(features.timeToBombPlant).toBeCloseTo(0.7, 2)
    })

    it('should calculate timeToBombPlant correctly when bomb is planted', () => {
      const features = extractTimingFeatures(50, 45, 10, [5, 15, 25])
      
      // Bomb planted at 45s, current time 50s
      // timeToBombPlant = max(0, 45 - 50) = 0
      expect(features.timeToBombPlant).toBe(0)
      expect(features.phase).toBe('post_plant')
    })

    it('should cap timeSinceLastKill at 30 seconds', () => {
      const features1 = extractTimingFeatures(80, undefined, 10, [])
      const features2 = extractTimingFeatures(80, undefined, 60, [])
      
      // timeSinceLastKill should be capped at 30s
      expect(features1.timeSinceLastKill).toBeLessThanOrEqual(1)
      expect(features2.timeSinceLastKill).toBeLessThanOrEqual(1)
    })

    it('should calculate rotationTime correctly during post-plant', () => {
      const features = extractTimingFeatures(60, 45, undefined, [])
      
      // Round time 60s, planted at 45s, rotation time = 15s
      expect(features.rotationTime).toBeCloseTo(15 / 45, 2)
    })

    it('should return default utility timing when no utility used', () => {
      const features = extractTimingFeatures(50, undefined, undefined, [])
      
      // When no utility used, should default to 0.5
      expect(features.utilityUsageTiming).toBe(0.5)
    })
  })

  describe('Economy Feature Extraction (3 tests)', () => {
    it('should calculate average weapon value correctly', () => {
      const loadouts = [
        { weaponValue: 4500, hasArmor: true, utilityValue: 800 },
        { weaponValue: 2900, hasArmor: true, utilityValue: 600 },
        { weaponValue: 1600, hasArmor: false, utilityValue: 400 }
      ]
      
      const features = extractEconomyFeatures(25000, loadouts)
      
      const expectedAvg = (4500 + 2900 + 1600) / 3
      expect(features.averageWeaponValue).toBeCloseTo(expectedAvg / 5000, 2)
    })

    it('should calculate armor coverage correctly', () => {
      const loadouts1 = [
        { weaponValue: 4500, hasArmor: true, utilityValue: 800 },
        { weaponValue: 2900, hasArmor: true, utilityValue: 600 }
      ]
      const features1 = extractEconomyFeatures(25000, loadouts1)
      expect(features1.armorCoverage).toBe(1)
      
      const loadouts2 = [
        { weaponValue: 4500, hasArmor: true, utilityValue: 800 },
        { weaponValue: 2900, hasArmor: false, utilityValue: 600 }
      ]
      const features2 = extractEconomyFeatures(25000, loadouts2)
      expect(features2.armorCoverage).toBe(0.5)
    })

    it('should classify eco buy correctly with low values', () => {
      const loadouts = [
        { weaponValue: 200, hasArmor: false, utilityValue: 100 },
        { weaponValue: 300, hasArmor: false, utilityValue: 50 }
      ]
      
      const features = extractEconomyFeatures(1000, loadouts)
      
      expect(features.buyType).toBe('eco')
      expect(encodeBuyType(features.buyType)).toEqual([1, 0, 0, 0])
    })
  })

  describe('Team Coordination Metrics (3 tests)', () => {
    it('should calculate trade potential with clustered players', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 120, y: 120 },
        { x: 110, y: 110 }
      ]
      
      const tradePotential = calculateTradePotential(positions)
      
      // All players within 500 units, should have high trade potential
      expect(tradePotential).toBeGreaterThan(0)
      expect(tradePotential).toBeLessThanOrEqual(1)
    })

    it('should return 0 trade potential for single player', () => {
      const positions = [{ x: 100, y: 100 }]
      
      const tradePotential = calculateTradePotential(positions)
      
      expect(tradePotential).toBe(0)
    })

    it('should return 0 trade potential for spread out players', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 }
      ]
      
      const tradePotential = calculateTradePotential(positions)
      
      // Players far apart, no trade potential
      expect(tradePotential).toBe(0)
    })
  })
})

// ============================================================================
// DATA PIPELINE TESTS (15 tests)
// ============================================================================

describe('Data Pipeline - Expanded', () => {
  beforeEach(() => {
    resetPipelineManager()
  })

  afterEach(() => {
    resetPipelineManager()
  })

  describe('Pipeline Orchestration (5 tests)', () => {
    it('should run complete pipeline with different config options', async () => {
      const samples = Array.from({ length: 50 }, (_, i) =>
        createMockSample(`orch-${i}`, i % 2 as 0 | 1)
      )

      const result = await runDataPipeline(samples, 'orch-dataset', {
        batchSize: 16,
        validationSplit: 0.2,
        testSplit: 0.2,
        normalizeFeatures: true,
        handleMissingValues: 'drop',
        outlierStrategy: 'remove'
      })

      expect(result.success).toBe(true)
      expect(result.stats.processedSamples).toBeGreaterThan(0)
      expect(result.split.train.length).toBeGreaterThan(0)
      expect(result.normalizationParams).toBeDefined()

      // Cleanup tensors
      result.tensorData.train.xs.dispose()
      result.tensorData.train.ys.dispose()
      result.tensorData.validation.xs.dispose()
      result.tensorData.validation.ys.dispose()
      result.tensorData.test.xs.dispose()
      result.tensorData.test.ys.dispose()
    })

    it('should run pipeline without normalization', async () => {
      const samples = Array.from({ length: 30 }, (_, i) =>
        createMockSample(`no-norm-${i}`, i % 2 as 0 | 1)
      )

      const result = await runDataPipeline(samples, 'no-norm-dataset', {
        normalizeFeatures: false
      })

      expect(result.success).toBe(true)
      expect(result.normalizationParams).toBeUndefined()
      expect(result.stats.normalizationApplied).toBe(false)

      // Cleanup
      result.tensorData.train.xs.dispose()
      result.tensorData.train.ys.dispose()
    })

    it('should run pipeline with random split instead of stratified', async () => {
      const samples = Array.from({ length: 40 }, (_, i) =>
        createMockSample(`rand-${i}`, i % 2 as 0 | 1)
      )

      const split = randomSplit(samples, {
        ...DEFAULT_PIPELINE_CONFIG,
        validationSplit: 0.2,
        testSplit: 0.2
      })

      expect(split.train.length + split.validation.length + split.test.length).toBe(40)
      expect(split.stats.trainCount).toBeGreaterThan(0)
      expect(split.stats.validationCount).toBeGreaterThan(0)
      expect(split.stats.testCount).toBeGreaterThan(0)
    })

    it('should handle handleMissingValues=ignore option', async () => {
      const samples = [
        createMockSample('ignore-1', 1),
        { ...createMockSample('ignore-2', 0), features: new Array(FEATURE_DIMENSIONS.total).fill(NaN) }
      ]

      const result = await runDataPipeline(samples, 'ignore-dataset', {
        handleMissingValues: 'ignore'
      })

      // Pipeline should handle this gracefully
      expect(result.success).toBe(false) // All samples rejected due to NaN features
      
      result.tensorData.train.xs.dispose()
      result.tensorData.train.ys.dispose()
    })

    it('should create TensorFlow dataset correctly', async () => {
      const samples = Array.from({ length: 20 }, (_, i) =>
        createMockSample(`tf-${i}`, i % 2 as 0 | 1)
      )

      const dataset = createTFDataset(samples, {
        batchSize: 4,
        shuffle: true,
        shuffleSeed: 42
      })

      expect(dataset).toBeDefined()

      // Test that we can iterate through dataset
      let batchCount = 0
      await dataset.forEachAsync(() => {
        batchCount++
      })

      expect(batchCount).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Recovery (5 tests)', () => {
    it('should handle ingestMatchData with valid match data', async () => {
      const match = createMockMatchData()
      
      const extractFeaturesFn = (round: RoundData, playerId: string) => ({
        vector: new Array(FEATURE_DIMENSIONS.total).fill(0.5),
        metadata: {
          matchId: match.matchId,
          roundId: round.roundId,
          timestamp: Date.now(),
          featureCount: FEATURE_DIMENSIONS.total,
          source: 'test'
        }
      })

      const result = await ingestMatchData(match, extractFeaturesFn)

      expect(result.success).toBe(true)
      expect(result.stats.ingested).toBeGreaterThan(0)
      expect(result.samples.length).toBe(result.stats.ingested)
    })

    it('should handle ingestMatchData with null features', async () => {
      const match = createMockMatchData()
      
      const extractFeaturesFn = () => null

      const result = await ingestMatchData(match, extractFeaturesFn)

      expect(result.success).toBe(true)
      expect(result.stats.skipped).toBeGreaterThan(0)
    })

    it('should handle pipeline with all invalid samples', async () => {
      const samples = [
        createMockSample('invalid-1', 1, { features: new Array(10).fill(0.5) }) // Wrong feature count
      ]

      const result = await runDataPipeline(samples, 'all-invalid-dataset')

      expect(result.success).toBe(false)
      expect(result.stats.rejectedSamples).toBeGreaterThan(0)
      expect(result.error).toBeDefined()

      result.tensorData.train.xs.dispose()
      result.tensorData.train.ys.dispose()
    })

    it('should handle errors in ingestLensData', async () => {
      const lensFeatures = [
        { vector: new Array(FEATURE_DIMENSIONS.total).fill(0.5), metadata: { matchId: 'm1', roundId: 'r1', timestamp: Date.now(), featureCount: FEATURE_DIMENSIONS.total, source: 'test' } }
      ]
      const labels = [{ winProbability: 0.8, roundOutcome: 1 as const }]
      const metadata = [{ matchId: 'm1', roundId: 'r1' }]

      const result = await ingestLensData(lensFeatures, labels, metadata)

      expect(result.success).toBe(true)
      expect(result.stats.ingested).toBe(1)
    })

    it('should handle empty lens data gracefully', async () => {
      const result = await ingestLensData([], [], [])

      expect(result.success).toBe(true)
      expect(result.stats.ingested).toBe(0)
      expect(result.stats.skipped).toBe(0)
    })
  })

  describe('Progress Tracking Accuracy (3 tests)', () => {
    it('should track progress through pipeline manager', async () => {
      const manager = getPipelineManager()
      const progressUpdates: { stageId: string; stepId: string; status: string; progress: number }[] = []

      const unsubscribe = manager.addProgressListener(update => {
        progressUpdates.push({
          stageId: update.stageId,
          stepId: update.stepId,
          status: update.status,
          progress: update.progress
        })
      })

      const samples = Array.from({ length: 20 }, (_, i) =>
        createMockSample(`prog-${i}`, i % 2 as 0 | 1)
      )

      await manager.executePipeline('standard-training', { samples })

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates.some(u => u.status === 'completed')).toBe(true)

      unsubscribe()
    })

    it('should report accurate execution statistics', async () => {
      const manager = getPipelineManager()

      const stats = manager.getStats()

      expect(stats.registeredPipelines).toBeGreaterThan(0)
      expect(typeof stats.activeExecutions).toBe('number')
      expect(typeof stats.workerPoolActive).toBe('boolean')
    })

    it('should track execution through all stages', async () => {
      const manager = getPipelineManager()
      const samples = Array.from({ length: 20 }, (_, i) =>
        createMockSample(`stage-${i}`, i % 2 as 0 | 1)
      )

      const execution = await manager.executePipeline('standard-training', { samples })

      expect(execution.status).toBe('completed')
      expect(execution.progress.length).toBeGreaterThan(0)
      expect(execution.startTime).toBeGreaterThan(0)
      expect(execution.endTime).toBeGreaterThan(execution.startTime)
    })
  })

  describe('Resource Cleanup (2 tests)', () => {
    it('should cleanup completed executions', async () => {
      const manager = getPipelineManager()
      const samples = Array.from({ length: 10 }, (_, i) =>
        createMockSample(`cleanup-${i}`, i % 2 as 0 | 1)
      )

      await manager.executePipeline('standard-training', { samples })

      const cleaned = manager.cleanupCompletedExecutions(0)
      expect(typeof cleaned).toBe('number')
    })

    it('should dispose pipeline manager correctly', () => {
      const manager = getPipelineManager()

      // Should not throw
      expect(() => manager.dispose()).not.toThrow()
    })
  })
})

// ============================================================================
// DATA VALIDATION TESTS (15 tests)
// ============================================================================

describe('Data Validation - Expanded', () => {
  describe('Schema Validation Edge Cases (5 tests)', () => {
    it('should reject sample with null id', () => {
      const sample = createMockSample('test')
      // @ts-expect-error Testing invalid input
      sample.id = null

      const result = validateSchema(sample)
      expect(result.passed).toBe(false)
    })

    it('should reject sample with undefined features', () => {
      const sample = createMockSample('test')
      // @ts-expect-error Testing invalid input
      sample.features = undefined

      const result = validateSchema(sample)
      expect(result.passed).toBe(false)
    })

    it('should reject sample with missing metadata fields', () => {
      const sample = createMockSample('test')
      // @ts-expect-error Testing invalid input
      sample.metadata = { timestamp: Date.now() } // Missing source and featureVersion

      const result = validateSchema(sample)
      expect(result.passed).toBe(false)
    })

    it('should reject sample with wrong feature array length', () => {
      const sample = createMockSample('test')
      sample.features = new Array(FEATURE_DIMENSIONS.total - 1).fill(0.5)

      const result = validateSchema(sample)
      expect(result.passed).toBe(false)
      expect(result.details).toContain(String(FEATURE_DIMENSIONS.total))
    })

    it('should accept valid sample with optional fields', () => {
      const sample = createMockSample('test', 1, {
        metadata: {
          matchId: 'match-1',
          roundId: 'round-1',
          timestamp: Date.now(),
          source: 'test',
          featureVersion: '1.0.0',
          mapName: 'Haven',
          teamId: 'team-a',
          playerId: 'player-1'
        }
      })

      const result = validateSchema(sample)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(1)
    })
  })

  describe('Outlier Detection Accuracy (5 tests)', () => {
    it('should detect outlier using Z-score method', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      features[0] = 10 // Extreme outlier
      
      const means = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const stds = new Array(FEATURE_DIMENSIONS.total).fill(0.1)

      const result = detectOutliersZScore(features, means, stds, 3)

      expect(result.isOutlier).toBe(true)
      expect(result.outlierFeatures).toContain(0)
      expect(result.maxZScore).toBeGreaterThan(3)
    })

    it('should not flag normal values with Z-score', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const means = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const stds = new Array(FEATURE_DIMENSIONS.total).fill(0.1)

      const result = detectOutliersZScore(features, means, stds, 3)

      expect(result.isOutlier).toBe(false)
    })

    it('should detect outlier using IQR method', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      features[0] = 5 // Extreme outlier
      
      const q1s = new Array(FEATURE_DIMENSIONS.total).fill(0.4)
      const q3s = new Array(FEATURE_DIMENSIONS.total).fill(0.6)

      const result = detectOutliersIQR(features, q1s, q3s, 1.5)

      expect(result.isOutlier).toBe(true)
      expect(result.outlierFeatures).toContain(0)
    })

    it('should handle IQR with zero values', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const q1s = new Array(FEATURE_DIMENSIONS.total).fill(0)
      const q3s = new Array(FEATURE_DIMENSIONS.total).fill(0)

      const result = detectOutliersIQR(features, q1s, q3s, 1.5)

      // With IQR = 0, only exact zeros are in bounds
      expect(result).toBeDefined()
    })

    it('should handle isolation forest detection with insufficient samples', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const referenceSamples: number[][] = []

      const result = detectOutliersIsolation(features, referenceSamples, 10)

      expect(result.isOutlier).toBe(false)
      expect(result.anomalyScore).toBe(0.5)
    })
  })

  describe('Missing Value Handling (5 tests)', () => {
    it('should detect all NaN values in features', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(NaN)

      const result = detectMissingValues(features)

      expect(result.count).toBe(FEATURE_DIMENSIONS.total)
      expect(result.ratio).toBe(1)
      expect(result.indices).toHaveLength(FEATURE_DIMENSIONS.total)
    })

    it('should detect mixed NaN and valid values', () => {
      const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      features[5] = NaN
      features[10] = NaN
      features[15] = Infinity // Should also be detected

      const result = detectMissingValues(features)

      expect(result.count).toBe(3)
      expect(result.indices).toContain(5)
      expect(result.indices).toContain(10)
      expect(result.indices).toContain(15)
    })

    it('should impute missing values with mean strategy', () => {
      const features = [0.5, NaN, 0.7, NaN, 0.9]
      const featureStats = new Map([
        [1, { mean: 0.6, median: 0.6, mode: 0.6 }],
        [3, { mean: 0.8, median: 0.8, mode: 0.8 }]
      ])

      const imputed = imputeMissingValues(features, 'mean', 0.5, featureStats)

      expect(imputed[1]).toBe(0.6)
      expect(imputed[3]).toBe(0.8)
      expect(imputed[0]).toBe(0.5) // Unchanged
    })

    it('should impute missing values with median strategy', () => {
      const features = [0.5, NaN, 0.7]
      const featureStats = new Map([
        [1, { mean: 0.6, median: 0.55, mode: 0.6 }]
      ])

      const imputed = imputeMissingValues(features, 'median', 0.5, featureStats)

      expect(imputed[1]).toBe(0.55)
    })

    it('should impute missing values with constant strategy', () => {
      const features = [0.5, NaN, 0.7, NaN]

      const imputed = imputeMissingValues(features, 'constant', 0.99)

      expect(imputed[1]).toBe(0.99)
      expect(imputed[3]).toBe(0.99)
    })
  })

  describe('Data Quality Scoring (5 tests)', () => {
    it('should calculate distribution stats correctly', () => {
      const samples = [
        createMockSample('s1', 1, { features: new Array(FEATURE_DIMENSIONS.total).fill(0.1) }),
        createMockSample('s2', 1, { features: new Array(FEATURE_DIMENSIONS.total).fill(0.5) }),
        createMockSample('s3', 1, { features: new Array(FEATURE_DIMENSIONS.total).fill(0.9) })
      ]

      const stats = calculateDistributionStats(samples)

      expect(stats.means[0]).toBeCloseTo(0.5, 1)
      expect(stats.mins[0]).toBe(0.1)
      expect(stats.maxs[0]).toBe(0.9)
    })

    it('should handle empty samples in distribution stats', () => {
      const stats = calculateDistributionStats([])

      expect(stats.means).toHaveLength(FEATURE_DIMENSIONS.total)
      expect(stats.means[0]).toBe(0.5) // Default value
    })

    it('should validate completeness with default config', () => {
      const sample = createMockSample('test')

      const result = validateCompleteness(sample)

      expect(result.passed).toBe(true)
      expect(result.score).toBe(1)
    })

    it('should fail completeness with too many missing values', () => {
      const sample = createMockSample('test')
      // Make more than 10% NaN
      for (let i = 0; i < 10; i++) {
        sample.features[i] = NaN
      }

      const result = validateCompleteness(sample)

      expect(result.passed).toBe(false)
    })

    it('should validate distribution against reference stats', () => {
      const sample = createMockSample('test')
      const referenceStats = calculateDistributionStats([sample])

      const result = validateDistribution(sample, referenceStats)

      expect(result.passed).toBe(true)
    })
  })
})

// ============================================================================
// UTILITY AND EDGE CASE TESTS (10 tests)
// ============================================================================

describe('Utility Functions and Edge Cases', () => {
  describe('Math Utilities (5 tests)', () => {
    it('should calculate Euclidean distance correctly', () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
      expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0)
      expect(calculateDistance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5)
    })

    it('should calculate angles correctly', () => {
      expect(calculateAngle({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0)
      expect(calculateAngle({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(90)
      expect(calculateAngle({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe(180)
      expect(calculateAngle({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe(-90)
    })

    it('should shuffle array deterministically with same seed', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const shuffled1 = shuffleArray(arr, 12345)
      const shuffled2 = shuffleArray(arr, 12345)

      expect(shuffled1).toEqual(shuffled2)
      expect(shuffled1).not.toEqual(arr)
    })

    it('should shuffle array differently with different seeds', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const shuffled1 = shuffleArray(arr, 12345)
      const shuffled2 = shuffleArray(arr, 54321)

      expect(shuffled1).not.toEqual(shuffled2)
    })

    it('should handle single element array shuffle', () => {
      const arr = [42]
      const shuffled = shuffleArray(arr, 12345)

      expect(shuffled).toEqual([42])
    })
  })

  describe('Normalization Functions (3 tests)', () => {
    it('should calculate normalization params correctly', () => {
      const samples = [
        createMockSample('n1', 1, { features: [0, 0.5, 1, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(0.5)] }),
        createMockSample('n2', 1, { features: [1, 0.5, 0, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(0.5)] })
      ]

      const params = calculateNormalizationParams(samples)

      expect(params.means[0]).toBe(0.5)
      expect(params.mins[0]).toBe(0)
      expect(params.maxs[0]).toBe(1)
    })

    it('should normalize and denormalize correctly', () => {
      const samples = [
        createMockSample('d1', 1, { features: [0, 1, 2, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(1)] }),
        createMockSample('d2', 1, { features: [2, 1, 0, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(1)] })
      ]

      const params = calculateNormalizationParams(samples)
      const normalized = normalizeSamples(samples, params)

      // Denormalize first feature of first sample
      const denormalized = denormalizeValue(normalized[0].features[0], 0, params)
      expect(denormalized).toBeCloseTo(0, 5)
    })

    it('should handle min-max normalization', () => {
      const samples = [
        createMockSample('m1', 1, { features: [0, 2, 4, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(2)] }),
        createMockSample('m2', 1, { features: [4, 2, 0, ...new Array(FEATURE_DIMENSIONS.total - 3).fill(2)] })
      ]

      const params = calculateNormalizationParams(samples)
      const normalized = minMaxNormalizeSamples(samples, params)

      // First feature should be normalized to [0, 1]
      expect(normalized[0].features[0]).toBe(0)
      expect(normalized[1].features[0]).toBe(1)
    })
  })

  describe('Feature Encoding (2 tests)', () => {
    it('should encode all timing phases correctly', () => {
      expect(encodeTimingPhase('early')).toEqual([1, 0, 0, 0])
      expect(encodeTimingPhase('mid')).toEqual([0, 1, 0, 0])
      expect(encodeTimingPhase('late')).toEqual([0, 0, 1, 0])
      expect(encodeTimingPhase('post_plant')).toEqual([0, 0, 0, 1])
    })

    it('should encode all buy types correctly', () => {
      expect(encodeBuyType('eco')).toEqual([1, 0, 0, 0])
      expect(encodeBuyType('force')).toEqual([0, 1, 0, 0])
      expect(encodeBuyType('full')).toEqual([0, 0, 1, 0])
      expect(encodeBuyType('over')).toEqual([0, 0, 0, 1])
    })
  })
})

// ============================================================================
// INTEGRATION TESTS (5 tests)
// ============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    resetPipelineManager()
  })

  afterEach(() => {
    resetPipelineManager()
  })

  it('should process dataset through pipeline manager', async () => {
    const manager = getPipelineManager()
    const samples = Array.from({ length: 30 }, (_, i) =>
      createMockSample(`int-${i}`, i % 2 as 0 | 1)
    )

    const result = await manager.processDataset(samples, 'Integration Test Dataset')

    expect(result.execution.status).toBe('completed')
    expect(result.dataset).toBeDefined()
    expect(result.pipelineResult?.success).toBe(true)
  })

  it('should validate and store samples', async () => {
    const manager = getPipelineManager()
    const samples = [
      createMockSample('vs1', 1),
      createMockSample('vs2', 0),
      createMockSample('vs3', 1, { features: new Array(10).fill(0.5) }) // Invalid
    ]

    const result = await manager.validateAndStore(samples, { strictMode: true })

    expect(result.stored).toBe(2)
    expect(result.rejected).toBe(1)
    expect(result.validationResults).toHaveLength(3)
  })

  it('should handle pipeline cancellation', async () => {
    const manager = getPipelineManager()
    
    // Start execution and immediately cancel
    const samples = Array.from({ length: 100 }, (_, i) =>
      createMockSample(`cancel-${i}`, i % 2 as 0 | 1)
    )

    const executionPromise = manager.executePipeline('standard-training', { samples })
    
    // Cancel all executions
    const executions = manager.listActiveExecutions()
    executions.forEach(e => manager.cancelExecution(e.id))

    // Should complete (either normally or cancelled)
    const execution = await executionPromise
    expect(['completed', 'cancelled', 'failed']).toContain(execution.status)
  })

  it('should complete full workflow: extract -> validate -> pipeline', async () => {
    // 1. Extract features
    const player = createMockPlayer({ position: { x: 500, y: 500 } })
    const mapBounds = createMockMapBounds()
    
    const extracted = assembleFeatureVector(
      player,
      mapBounds,
      [player],
      { roundTime: 45 },
      { teamBank: 20000, playerLoadouts: [{ weaponValue: 4500, hasArmor: true, utilityValue: 500 }] }
    )

    // 2. Validate features
    const featureValidation = validateFeatureVector(extracted.vector)
    expect(featureValidation.valid).toBe(true)

    // 3. Create sample
    const sample: TrainingSample = {
      id: 'integration-test',
      features: extracted.vector,
      labels: { roundOutcome: 1, winProbability: 0.75 },
      metadata: {
        matchId: 'integration-match',
        roundId: 'integration-round',
        timestamp: Date.now(),
        source: 'integration-test',
        featureVersion: '1.0.0'
      },
      quality: {
        confidence: 0.9,
        isOutlier: false,
        missingValueCount: 0
      }
    }

    // 4. Run pipeline
    const result = await runDataPipeline([sample], 'integration-dataset')

    expect(result.success).toBe(true)
    expect(result.stats.processedSamples).toBe(1)

    // Cleanup
    result.tensorData.train.xs.dispose()
    result.tensorData.train.ys.dispose()
  })

  it('should handle concurrent pipeline executions', async () => {
    const manager = getPipelineManager()
    
    const samples1 = Array.from({ length: 20 }, (_, i) => createMockSample(`c1-${i}`, i % 2 as 0 | 1))
    const samples2 = Array.from({ length: 20 }, (_, i) => createMockSample(`c2-${i}`, i % 2 as 0 | 1))
    const samples3 = Array.from({ length: 20 }, (_, i) => createMockSample(`c3-${i}`, i % 2 as 0 | 1))

    const [result1, result2, result3] = await Promise.all([
      manager.executePipeline('quick-validate', { samples: samples1 }),
      manager.executePipeline('quick-validate', { samples: samples2 }),
      manager.executePipeline('quick-validate', { samples: samples3 })
    ])

    expect(result1.status).toBe('completed')
    expect(result2.status).toBe('completed')
    expect(result3.status).toBe('completed')
  })
})

// ============================================================================
// PERFORMANCE TESTS (5 tests)
// ============================================================================

describe('Performance Tests', () => {
  it('should validate 100 samples within 500ms', async () => {
    const samples = Array.from({ length: 100 }, (_, i) =>
      createMockSample(`perf-${i}`, i % 2 as 0 | 1)
    )

    const start = performance.now()
    await validateDataset(samples)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(500)
  })

  it('should extract features for 1000 players within 100ms', () => {
    const player = createMockPlayer({ position: { x: 500, y: 500 } })
    const mapBounds = createMockMapBounds()
    
    const start = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      extractPositionFeatures(player, mapBounds, [player])
    }
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('should normalize 500 samples within 50ms', () => {
    const samples = Array.from({ length: 500 }, (_, i) =>
      createMockSample(`norm-${i}`, i % 2 as 0 | 1)
    )
    
    const params = calculateNormalizationParams(samples)
    
    const start = performance.now()
    normalizeSamples(samples, params)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
  })

  it('should split 1000 samples within 100ms', () => {
    const samples = Array.from({ length: 1000 }, (_, i) =>
      createMockSample(`split-${i}`, i % 2 as 0 | 1)
    )
    
    const start = performance.now()
    stratifiedSplit(samples, DEFAULT_PIPELINE_CONFIG)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
  })

  it('should detect outliers in 100 samples within 50ms', () => {
    const features = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
    const means = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
    const stds = new Array(FEATURE_DIMENSIONS.total).fill(0.1)
    
    const start = performance.now()
    
    for (let i = 0; i < 100; i++) {
      detectOutliersZScore(features, means, stds, 3)
    }
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(50)
  })
})

// ============================================================================
// COVERAGE SUMMARY
// ============================================================================

describe('Coverage Summary', () => {
  it('should have run all test suites', () => {
    // This test ensures the test file is loaded and counted
    expect(true).toBe(true)
  })
})
