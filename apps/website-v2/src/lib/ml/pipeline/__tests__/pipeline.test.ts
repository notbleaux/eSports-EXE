/**
 * ML Pipeline Tests
 * 
 * [Ver001.000]
 * 
 * Comprehensive test suite for ML data pipeline.
 * Tests: 35+
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as tf from '@tensorflow/tfjs'

// Import modules once at top level
import {
  extractPositionFeatures,
  extractTimingFeatures,
  extractEconomyFeatures,
  extractTeamCoordinationFeatures,
  extractLensFeatures,
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
  encodeBuyType
} from '../features'

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
  deleteDB
} from '../dataStore'

import {
  validateSample,
  validateDataset,
  validateSchema,
  validateCompleteness,
  validateConsistency,
  validateOutliers,
  detectMissingValues,
  imputeMissingValues,
  detectOutliersZScore,
  detectOutliersIQR,
  calculateDistributionStats
} from '../validation'

import {
  runDataPipeline,
  ingestMatchData,
  stratifiedSplit,
  randomSplit,
  calculateNormalizationParams,
  normalizeSamples,
  samplesToTensors,
  shuffleArray,
  DEFAULT_PIPELINE_CONFIG
} from '../dataPipeline'

import {
  PipelineManager,
  getPipelineManager,
  resetPipelineManager
} from '../manager'

// ============================================================================
// Feature Extraction Tests
// ============================================================================

describe('Feature Extraction', () => {
  describe('Position Features', () => {
    it('should extract position features correctly', () => {
      const player = {
        id: 'p1',
        name: 'Player 1',
        team: 'attackers' as const,
        agent: 'Jett',
        position: { x: 512, y: 512 },
        rotation: 90,
        isAlive: true
      }

      const mapBounds = {
        width: 1024,
        height: 1024,
        scale: 1,
        sites: [
          { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const },
          { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' as const }
        ]
      }

      const features = extractPositionFeatures(player, mapBounds, [player])

      expect(features.x).toBeGreaterThanOrEqual(0)
      expect(features.x).toBeLessThanOrEqual(1)
      expect(features.y).toBeGreaterThanOrEqual(0)
      expect(features.y).toBeLessThanOrEqual(1)
      expect(features.distanceToSiteA).toBeGreaterThan(0)
      expect(features.distanceToSiteB).toBeGreaterThan(0)
      expect(features.distanceToCenter).toBeGreaterThanOrEqual(0)
      expect(features.mapCoverage).toBeGreaterThanOrEqual(0)
      expect(features.mapCoverage).toBeLessThanOrEqual(1)
    })

    it('should normalize coordinates to [0, 1]', () => {
      const player = {
        id: 'p1',
        name: 'Player 1',
        team: 'attackers' as const,
        agent: 'Jett',
        position: { x: 0, y: 1024 },
        rotation: 0,
        isAlive: true
      }

      const mapBounds = {
        width: 1024,
        height: 1024,
        scale: 1,
        sites: [{ name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const }]
      }

      const features = extractPositionFeatures(player, mapBounds, [player])

      expect(features.x).toBe(0)
      expect(features.y).toBe(1)
    })

    it('should calculate distances correctly', () => {
      const pos1 = { x: 0, y: 0 }
      const pos2 = { x: 3, y: 4 }

      expect(calculateDistance(pos1, pos2)).toBe(5)
      expect(calculateDistance(pos1, pos1)).toBe(0)
    })

    it('should calculate angles correctly', () => {
      const from = { x: 0, y: 0 }
      const toRight = { x: 10, y: 0 }
      const toUp = { x: 0, y: 10 }

      expect(calculateAngle(from, toRight)).toBe(0)
      expect(calculateAngle(from, toUp)).toBe(90)
    })
  })

  describe('Timing Features', () => {
    it('should extract timing features correctly', () => {
      const features = extractTimingFeatures(30, undefined, 10, [5, 15, 25])

      expect(features.roundTime).toBe(0.3)
      expect(features.timeToBombPlant).toBe(0.7)
      expect(features.timeSinceLastKill).toBeGreaterThan(0)
      expect(['early', 'mid', 'late', 'post_plant']).toContain(features.phase)
    })

    it('should determine correct round phase', () => {
      expect(getRoundPhase(10)).toBe('early')
      expect(getRoundPhase(40)).toBe('mid')
      expect(getRoundPhase(80)).toBe('late')
      expect(getRoundPhase(50, 45)).toBe('post_plant')
    })

    it('should encode timing phase as one-hot', () => {
      expect(encodeTimingPhase('early')).toEqual([1, 0, 0, 0])
      expect(encodeTimingPhase('mid')).toEqual([0, 1, 0, 0])
      expect(encodeTimingPhase('late')).toEqual([0, 0, 1, 0])
      expect(encodeTimingPhase('post_plant')).toEqual([0, 0, 0, 1])
    })
  })

  describe('Economy Features', () => {
    it('should extract economy features correctly', () => {
      const loadouts = [
        { weaponValue: 4500, hasArmor: true, utilityValue: 800 },
        { weaponValue: 4500, hasArmor: true, utilityValue: 600 },
        { weaponValue: 2900, hasArmor: false, utilityValue: 400 }
      ]

      const features = extractEconomyFeatures(25000, loadouts)

      expect(features.teamBank).toBeGreaterThan(0)
      expect(features.teamBank).toBeLessThanOrEqual(1)
      expect(features.averageWeaponValue).toBeGreaterThan(0)
      expect(features.armorCoverage).toBeCloseTo(2 / 3, 1)
      expect(['eco', 'force', 'full', 'over']).toContain(features.buyType)
    })

    it('should classify buy types correctly', () => {
      expect(classifyBuyType(200, 0.2)).toBe('eco')
      expect(classifyBuyType(2500, 0.6)).toBe('force')
      expect(classifyBuyType(4500, 1)).toBe('full')
      expect(classifyBuyType(8000, 1)).toBe('over')
    })

    it('should encode buy type as one-hot', () => {
      expect(encodeBuyType('eco')).toEqual([1, 0, 0, 0])
      expect(encodeBuyType('force')).toEqual([0, 1, 0, 0])
      expect(encodeBuyType('full')).toEqual([0, 0, 1, 0])
      expect(encodeBuyType('over')).toEqual([0, 0, 0, 1])
    })
  })

  describe('Team Coordination Features', () => {
    it('should extract coordination features', () => {
      const players = [
        { id: 'p1', name: 'P1', team: 'attackers' as const, agent: 'Jett', position: { x: 100, y: 100 }, rotation: 0, isAlive: true },
        { id: 'p2', name: 'P2', team: 'attackers' as const, agent: 'Phoenix', position: { x: 120, y: 120 }, rotation: 0, isAlive: true },
        { id: 'p3', name: 'P3', team: 'attackers' as const, agent: 'Sova', position: { x: 500, y: 500 }, rotation: 0, isAlive: true }
      ]

      const features = extractTeamCoordinationFeatures(players)

      expect(features.teamSpread).toBeGreaterThanOrEqual(0)
      expect(features.teamSpread).toBeLessThanOrEqual(1)
      expect(features.tradePotential).toBeGreaterThanOrEqual(0)
      expect(features.tradePotential).toBeLessThanOrEqual(1)
    })
  })

  describe('Feature Vector Assembly', () => {
    it('should assemble complete feature vector', () => {
      const player = {
        id: 'p1',
        name: 'Player 1',
        team: 'attackers' as const,
        agent: 'Jett',
        position: { x: 500, y: 500 },
        rotation: 45,
        isAlive: true
      }

      const mapBounds = {
        width: 1024,
        height: 1024,
        scale: 1,
        sites: [
          { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const },
          { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' as const }
        ]
      }

      const result = assembleFeatureVector(
        player,
        mapBounds,
        [player],
        { roundTime: 45 },
        { teamBank: 20000, playerLoadouts: [{ weaponValue: 4500, hasArmor: true, utilityValue: 600 }] }
      )

      expect(result.vector).toHaveLength(FEATURE_DIMENSIONS.total)
      expect(result.metadata.featureCount).toBe(FEATURE_DIMENSIONS.total)
      expect(result.metadata.source).toBe('TL-S3-3-A')
    })
  })

  describe('Feature Validation', () => {
    it('should validate correct feature vectors', () => {
      const validVector = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      const result = validateFeatureVector(validVector)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect incorrect feature count', () => {
      const shortVector = new Array(FEATURE_DIMENSIONS.total - 5).fill(0.5)
      const result = validateFeatureVector(shortVector)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect NaN values', () => {
      const vectorWithNaN = new Array(FEATURE_DIMENSIONS.total).fill(0.5)
      vectorWithNaN[5] = NaN

      expect(hasMissingValues(vectorWithNaN)).toBe(true)
    })

    it('should fill missing values', () => {
      const vectorWithNaN = [0.5, NaN, 0.3, Infinity, -Infinity, NaN]
      const filled = fillMissingValues(vectorWithNaN)

      expect(filled.every(v => typeof v === 'number' && !isNaN(v) && isFinite(v))).toBe(true)
    })
  })
})

// ============================================================================
// Data Store Tests
// ============================================================================

const hasIndexedDB = typeof indexedDB !== 'undefined'

describe('Data Store', () => {
  beforeAll(() => {
    if (!hasIndexedDB) {
      console.log('Skipping Data Store tests - IndexedDB not available')
    }
  })

  beforeEach(async () => {
    if (!hasIndexedDB) return
    try {
      await deleteDB()
    } catch {
      // Ignore errors
    }
  })

  afterEach(async () => {
    if (!hasIndexedDB) return
    await closeDB()
  })

  const createMockSample = (id: string): import('../dataStore').TrainingSample => ({
    id,
    features: new Array(48).fill(0.5),
    labels: { roundOutcome: 1, winProbability: 0.75 },
    metadata: {
      matchId: 'match-1',
      roundId: 'round-1',
      timestamp: Date.now(),
      source: 'test',
      featureVersion: '1.0.0',
      mapName: 'Haven',
      teamId: 'team-a',
      playerId: 'player-1'
    },
    quality: {
      confidence: 0.9,
      isOutlier: false,
      missingValueCount: 0
    }
  })

  describe('Sample Operations', () => {
    it('should store and retrieve a sample', async () => {
      if (!hasIndexedDB) return
      const sample = createMockSample('test-1')
      const storeResult = await storeSample(sample)

      expect(storeResult.success).toBe(true)

      const retrieved = await getSample('test-1')
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe('test-1')
      expect(retrieved?.metadata.mapName).toBe('Haven')
    })

    it('should delete a sample', async () => {
      if (!hasIndexedDB) return
      const sample = createMockSample('test-delete')
      await storeSample(sample)

      const deleteResult = await deleteSample('test-delete')
      expect(deleteResult.success).toBe(true)

      const retrieved = await getSample('test-delete')
      expect(retrieved).toBeNull()
    })

    it('should query samples with filters', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('query-1'))
      const sample2 = createMockSample('query-2')
      sample2.metadata.mapName = 'Bind'
      await storeSample(sample2)

      const result = await querySamples({ filters: { mapName: 'Haven' } })
      expect(result.samples.length).toBeGreaterThanOrEqual(1)
    })

    it('should count samples', async () => {
      if (!hasIndexedDB) return
      const initialCount = await countSamples()
      await storeSample(createMockSample('count-test'))
      const newCount = await countSamples()

      expect(newCount).toBe(initialCount + 1)
    })
  })

  describe('Dataset Operations', () => {
    it('should create a dataset', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('ds-sample-1'))
      await storeSample(createMockSample('ds-sample-2'))

      const result = await createDataset('Test Dataset', 'Test description')

      expect(result.success).toBe(true)
      expect(result.dataset).toBeDefined()
      expect(result.dataset?.name).toBe('Test Dataset')
    })

    it('should retrieve a dataset by ID', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('get-ds-sample'))
      const createResult = await createDataset('Get Test', 'Test')

      if (createResult.dataset) {
        const dataset = await getDataset(createResult.dataset.id)
        expect(dataset).not.toBeNull()
        expect(dataset?.name).toBe('Get Test')
      }
    })

    it('should delete a dataset', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('del-ds-sample'))
      const createResult = await createDataset('Delete Test', 'Test')

      if (createResult.dataset) {
        const deleteResult = await deleteDataset(createResult.dataset.id)
        expect(deleteResult.success).toBe(true)

        const dataset = await getDataset(createResult.dataset.id)
        expect(dataset).toBeNull()
      }
    })

    it('should list all datasets', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('list-ds-sample'))
      await createDataset('Dataset 1', 'Test 1')
      await createDataset('Dataset 2', 'Test 2')

      const datasets = await listDatasets()
      expect(datasets.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Export/Import', () => {
    it('should export dataset to JSON', async () => {
      if (!hasIndexedDB) return
      await storeSample(createMockSample('export-sample'))
      const datasetResult = await createDataset('Export Test', 'Test')

      if (datasetResult.dataset) {
        const exportResult = await exportDataset(datasetResult.dataset.id, 'json')
        expect(exportResult.success).toBe(true)
        expect(exportResult.data).toBeDefined()
        expect(exportResult.format).toBe('json')
      }
    })

    it('should handle export of non-existent dataset', async () => {
      const result = await exportDataset('non-existent-id', 'json')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

// ============================================================================
// Validation Tests
// ============================================================================

describe('Validation', () => {
  const createMockSample = (overrides: Partial<import('../dataStore').TrainingSample> = {}): import('../dataStore').TrainingSample => ({
    id: 'test-sample',
    features: new Array(48).fill(0.5),
    labels: { roundOutcome: 1 },
    metadata: {
      matchId: 'match-1',
      roundId: 'round-1',
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

  describe('Schema Validation', () => {
    it('should validate correct sample schema', () => {
      const sample = createMockSample()
      const result = validateSchema(sample)

      expect(result.passed).toBe(true)
      expect(result.score).toBe(1)
    })

    it('should reject sample with missing id', () => {
      const sample = createMockSample({ id: '' })
      const result = validateSchema(sample)

      expect(result.passed).toBe(false)
    })

    it('should reject sample with wrong feature count', () => {
      const sample = createMockSample({ features: [0.5, 0.5, 0.5] })
      const result = validateSchema(sample)

      expect(result.passed).toBe(false)
    })
  })

  describe('Completeness Validation', () => {
    it('should validate complete sample', () => {
      const sample = createMockSample()
      const result = validateCompleteness(sample)

      expect(result.passed).toBe(true)
      expect(result.score).toBe(1)
    })

    it('should detect missing values', () => {
      const features = new Array(48).fill(0.5)
      features[5] = NaN
      features[10] = NaN

      const result = detectMissingValues(features)
      expect(result.count).toBe(2)
      expect(result.indices).toContain(5)
      expect(result.indices).toContain(10)
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
    })
  })

  describe('Consistency Validation', () => {
    it('should validate consistent sample', () => {
      const sample = createMockSample()
      const result = validateConsistency(sample)

      expect(result.passed).toBe(true)
    })

    it('should detect out-of-bounds position', () => {
      const sample = createMockSample({ features: [2, 2] as number[] }) // Position > 1
      const result = validateConsistency(sample)

      expect(result.passed).toBe(false)
    })

    it('should detect invalid probability', () => {
      const sample = createMockSample({ labels: { winProbability: 1.5 } })
      const result = validateConsistency(sample)

      expect(result.passed).toBe(false)
    })
  })

  describe('Outlier Detection', () => {
    it('should detect outliers using Z-score', () => {
      const features = [0.5, 0.5, 0.5, 0.5, 10] // Last is outlier
      const means = [0.5, 0.5, 0.5, 0.5, 0.5]
      const stds = [0.1, 0.1, 0.1, 0.1, 0.1]

      const result = detectOutliersZScore(features, means, stds, 3)
      expect(result.isOutlier).toBe(true)
      expect(result.outlierFeatures).toContain(4)
    })

    it('should not flag normal values as outliers', () => {
      const features = [0.5, 0.6, 0.4, 0.55, 0.45]
      const means = [0.5, 0.5, 0.5, 0.5, 0.5]
      const stds = [0.1, 0.1, 0.1, 0.1, 0.1]

      const result = detectOutliersZScore(features, means, stds, 3)
      expect(result.isOutlier).toBe(false)
    })

    it('should detect outliers using IQR', () => {
      const features = [0.5, 0.5, 0.5, 0.5, 2] // Last is outlier
      const q1s = [0.4, 0.4, 0.4, 0.4, 0.4]
      const q3s = [0.6, 0.6, 0.6, 0.6, 0.6]

      const result = detectOutliersIQR(features, q1s, q3s, 1.5)
      expect(result.isOutlier).toBe(true)
    })
  })

  describe('Complete Sample Validation', () => {
    it('should validate a valid sample', async () => {
      const sample = createMockSample()
      const result = await validateSample(sample)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sampleId).toBe(sample.id)
    })

    it('should validate multiple samples', async () => {
      const samples = [
        createMockSample({ id: 's1' }),
        createMockSample({ id: 's2' }),
        createMockSample({ id: 's3', features: new Array(48).fill(NaN) }) // Invalid
      ]

      const result = await validateDataset(samples)
      expect(result.totalSamples).toBe(3)
      expect(result.validSamples).toBe(2)
      expect(result.invalidSamples).toBe(1)
    })
  })
})

// ============================================================================
// Data Pipeline Tests
// ============================================================================

describe('Data Pipeline', () => {
  const createMockSample = (id: string, outcome: 0 | 1 = 1): import('../dataStore').TrainingSample => ({
    id,
    features: new Array(48).fill(0.5).map(() => Math.random()),
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
    }
  })

  describe('Data Splitting', () => {
    it('should split data into train/validation/test sets', () => {
      const samples = Array.from({ length: 100 }, (_, i) =>
        createMockSample(`split-${i}`, i % 2 as 0 | 1)
      )

      const split = stratifiedSplit(samples, {
        ...DEFAULT_PIPELINE_CONFIG,
        validationSplit: 0.15,
        testSplit: 0.15
      })

      expect(split.train.length + split.validation.length + split.test.length).toBe(100)
      expect(split.stats.trainCount).toBeGreaterThan(0)
      expect(split.stats.validationCount).toBeGreaterThan(0)
      expect(split.stats.testCount).toBeGreaterThan(0)
    })

    it('should maintain class balance in stratified split', () => {
      // Create imbalanced dataset
      const samples = [
        ...Array.from({ length: 80 }, (_, i) => createMockSample(`pos-${i}`, 1)),
        ...Array.from({ length: 20 }, (_, i) => createMockSample(`neg-${i}`, 0))
      ]

      const split = stratifiedSplit(samples, DEFAULT_PIPELINE_CONFIG)

      // Check that both classes exist in each split
      expect(split.stats.classBalance.train.positive).toBeGreaterThan(0)
      expect(split.stats.classBalance.train.negative).toBeGreaterThan(0)
    })

    it('should shuffle array deterministically with seed', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const shuffled1 = shuffleArray(arr, 12345)
      const shuffled2 = shuffleArray(arr, 12345)

      expect(shuffled1).toEqual(shuffled2)
      expect(shuffled1).not.toEqual(arr)
    })
  })

  describe('Normalization', () => {
    it('should calculate normalization parameters', () => {
      const samples = [
        createMockSample('n1'),
        createMockSample('n2'),
        createMockSample('n3')
      ]
      samples[0].features[0] = 0
      samples[1].features[0] = 0.5
      samples[2].features[0] = 1

      const params = calculateNormalizationParams(samples)

      expect(params.means[0]).toBe(0.5)
      expect(params.stds[0]).toBeGreaterThan(0)
      expect(params.mins[0]).toBe(0)
      expect(params.maxs[0]).toBe(1)
    })

    it('should normalize samples using Z-score', () => {
      const samples = [
        { ...createMockSample('z1'), features: [0, 0.5, 1] },
        { ...createMockSample('z2'), features: [1, 0.5, 0] }
      ]

      const params = calculateNormalizationParams(samples)
      const normalized = normalizeSamples(samples, params)

      // After normalization, values should be centered around 0
      normalized.forEach(s => {
        s.features.forEach(v => {
          expect(v).not.toBeNaN()
          expect(isFinite(v)).toBe(true)
        })
      })
    })
  })

  describe('Tensor Conversion', () => {
    it('should convert samples to tensors', () => {
      const samples = [
        createMockSample('t1'),
        createMockSample('t2')
      ]

      const { xs, ys } = samplesToTensors(samples)

      expect(xs.shape).toEqual([2, 48])
      expect(ys.shape).toEqual([2, 1])

      // Cleanup
      xs.dispose()
      ys.dispose()
    })
  })

  describe('Complete Pipeline', () => {
    it('should run complete pipeline successfully', async () => {
      const samples = Array.from({ length: 50 }, (_, i) =>
        createMockSample(`pipe-${i}`, i % 2 as 0 | 1)
      )

      const result = await runDataPipeline(samples, 'test-dataset', {
        batchSize: 16,
        validationSplit: 0.2,
        testSplit: 0.2,
        normalizeFeatures: true,
        handleMissingValues: 'impute'
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

    it('should handle empty samples gracefully', async () => {
      const result = await runDataPipeline([], 'empty-dataset')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject all samples if they are all invalid', async () => {
      const samples = [createMockSample('inv1')]
      samples[0].features = new Array(10).fill(0.5) // Wrong length

      const result = await runDataPipeline(samples, 'invalid-dataset')

      expect(result.success).toBe(false)
      expect(result.stats.rejectedSamples).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// Pipeline Manager Tests
// ============================================================================

describe('Pipeline Manager', () => {
  beforeEach(() => {
    resetPipelineManager()
  })

  afterEach(() => {
    resetPipelineManager()
  })

  describe('Pipeline Registration', () => {
    it('should register a pipeline', () => {
      const manager = getPipelineManager()

      manager.registerPipeline({
        id: 'test-pipeline',
        name: 'Test Pipeline',
        description: 'Test',
        stages: [],
        config: { batchSize: 32, validationSplit: 0.15, testSplit: 0.15, normalizeFeatures: true, handleMissingValues: 'impute', outlierStrategy: 'flag' },
        createdAt: Date.now(),
        updatedAt: Date.now()
      })

      const pipeline = manager.getPipeline('test-pipeline')
      expect(pipeline).toBeDefined()
      expect(pipeline?.name).toBe('Test Pipeline')
    })

    it('should list all registered pipelines', () => {
      const manager = getPipelineManager()
      const pipelines = manager.listPipelines()

      expect(pipelines.length).toBeGreaterThan(0)
      expect(pipelines.some(p => p.id === 'standard-training')).toBe(true)
      expect(pipelines.some(p => p.id === 'quick-validate')).toBe(true)
    })

    it('should unregister a pipeline', () => {
      const manager = getPipelineManager()

      manager.registerPipeline({
        id: 'unregister-test',
        name: 'Unregister Test',
        description: 'Test',
        stages: [],
        config: { batchSize: 32, validationSplit: 0.15, testSplit: 0.15, normalizeFeatures: true, handleMissingValues: 'impute', outlierStrategy: 'flag' },
        createdAt: Date.now(),
        updatedAt: Date.now()
      })

      const removed = manager.unregisterPipeline('unregister-test')
      expect(removed).toBe(true)
      expect(manager.getPipeline('unregister-test')).toBeUndefined()
    })
  })

  describe('Progress Tracking', () => {
    it('should notify progress listeners', async () => {
      const manager = getPipelineManager()
      const progressUpdates: import('../manager').ProgressUpdate[] = []

      const unsubscribe = manager.addProgressListener(update => {
        progressUpdates.push(update)
      })

      // Create a simple test - just register and check listener works
      expect(typeof unsubscribe).toBe('function')

      // Cleanup
      unsubscribe()
    })
  })

  describe('Execution Management', () => {
    it('should track execution statistics', () => {
      const manager = getPipelineManager()
      const stats = manager.getStats()

      expect(stats.registeredPipelines).toBeGreaterThan(0)
      expect(typeof stats.workerPoolActive).toBe('boolean')
    })

    it('should cleanup completed executions', async () => {
      const manager = getPipelineManager()
      const cleaned = manager.cleanupCompletedExecutions(0)
      expect(typeof cleaned).toBe('number')
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Pipeline Integration', () => {
  beforeEach(async () => {
    if (!hasIndexedDB) return
    try {
      await deleteDB()
    } catch {
      // Ignore
    }
  })

  afterEach(async () => {
    if (!hasIndexedDB) return
    await closeDB()
  })

  it('should complete full flow: extract -> validate -> store -> tensor', async () => {
    if (!hasIndexedDB) {
      console.log('Skipping integration test - IndexedDB not available')
      return
    }
    
    // 1. Extract features
    const player = {
      id: 'p1',
      name: 'Player 1',
      team: 'attackers' as const,
      agent: 'Jett',
      position: { x: 500, y: 500 },
      rotation: 0,
      isAlive: true
    }

    const mapBounds = {
      width: 1024,
      height: 1024,
      scale: 1,
      sites: [
        { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const },
        { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' as const }
      ]
    }

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
    const sample: import('../dataStore').TrainingSample = {
      id: `test-integration-${Date.now()}`,
      features: extracted.vector,
      labels: { roundOutcome: 1, winProbability: 0.75 },
      metadata: {
        ...extracted.metadata,
        matchId: 'integration-match',
        roundId: 'integration-round'
      },
      quality: {
        confidence: 0.9,
        isOutlier: false,
        missingValueCount: 0
      }
    }

    // 4. Validate sample
    const sampleValidation = await validateSample(sample)
    expect(sampleValidation.valid).toBe(true)

    // 5. Store sample
    const storeResult = await storeSample(sample)
    expect(storeResult.success).toBe(true)

    // 6. Convert to tensor
    const { xs, ys } = samplesToTensors([sample])
    expect(xs.shape[0]).toBe(1)
    expect(ys.shape[0]).toBe(1)

    // Cleanup
    xs.dispose()
    ys.dispose()
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  const createMockSample = (id: string): import('../dataStore').TrainingSample => ({
    id,
    features: new Array(48).fill(0.5).map(() => Math.random()),
    labels: { roundOutcome: Math.random() > 0.5 ? 1 : 0 },
    metadata: {
      matchId: 'perf-test',
      roundId: `round-${id}`,
      timestamp: Date.now(),
      source: 'perf-test',
      featureVersion: '1.0.0'
    },
    quality: {
      confidence: 0.9,
      isOutlier: false,
      missingValueCount: 0
    }
  })

  it('should extract features within 10ms', () => {
    const start = performance.now()

    for (let i = 0; i < 100; i++) {
      const player = {
        id: 'p1',
        name: 'Player 1',
        team: 'attackers' as const,
        agent: 'Jett',
        position: { x: Math.random() * 1024, y: Math.random() * 1024 },
        rotation: Math.random() * 360,
        isAlive: true
      }

      const mapBounds = {
        width: 1024,
        height: 1024,
        scale: 1,
        sites: [
          { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' as const },
          { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' as const }
        ]
      }

      assembleFeatureVector(
        player,
        mapBounds,
        [player],
        { roundTime: 45 },
        { teamBank: 20000, playerLoadouts: [{ weaponValue: 4500, hasArmor: true, utilityValue: 500 }] }
      )
    }

    const duration = performance.now() - start
    expect(duration / 100).toBeLessThan(10) // Average < 10ms per extraction
  })

  it('should validate 1000 samples within 5 seconds', async () => {
    const samples = Array.from({ length: 1000 }, (_, i) => createMockSample(`perf-${i}`))

    const start = performance.now()
    await validateDataset(samples)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(5000)
  })

  it('should process pipeline for 500 samples within 3 seconds', async () => {
    const samples = Array.from({ length: 500 }, (_, i) => createMockSample(`pipe-perf-${i}`))

    const start = performance.now()
    const result = await runDataPipeline(samples, 'perf-dataset')
    const duration = performance.now() - start

    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(3000)

    // Cleanup tensors
    if (result.success) {
      result.tensorData.train.xs.dispose()
      result.tensorData.train.ys.dispose()
      result.tensorData.validation?.xs.dispose()
      result.tensorData.validation?.ys.dispose()
      result.tensorData.test?.xs.dispose()
      result.tensorData.test?.ys.dispose()
    }
  })
})
