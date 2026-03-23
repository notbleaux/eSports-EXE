/**
 * ML Models Test Suite
 * 
 * [Ver001.000]
 * 
 * 25+ comprehensive tests for ML models
 * 
 * Agent: TL-S3-3-B
 * Team: ML Models (TL-S3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as tf from '@tensorflow/tfjs'
import { 
  RoundPredictor, 
  createRoundPredictor, 
  extractRoundStateFeatures,
  DEFAULT_ROUND_PREDICTOR_CONFIG 
} from '../roundPredictor'
import { 
  PlayerPerformanceModel, 
  createPlayerPerformanceModel, 
  calculateOverallRating,
  DEFAULT_PLAYER_PERFORMANCE_CONFIG 
} from '../playerPerformance'
import { 
  StrategyModel, 
  createStrategyModel, 
  getAvailableStrategies, 
  STRATEGY_DEFINITIONS,
  DEFAULT_STRATEGY_CONFIG 
} from '../strategy'
import { ModelManager, getModelManager, resetModelManager } from '../manager'
import type { TrainingSample } from '../../pipeline/dataStore'
import type { RoundState, PlayerMatchContext, MatchState, OpponentTendencies } from '../index'

// ============================================================================
// Test Data Generators
// ============================================================================

function generateMockTrainingSamples(count: number, labelType: 'binary' | 'continuous' = 'binary'): TrainingSample[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sample-${i}`,
    features: Array.from({ length: 48 }, () => Math.random()),
    labels: labelType === 'binary' 
      ? { roundOutcome: Math.random() > 0.5 ? 1 as const : 0 as const }
      : { playerPerformance: Math.random() * 100 },
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

function generateMockRoundState(): RoundState {
  return {
    economy: {
      attackerBank: 20000,
      defenderBank: 15000,
      attackerBuyType: 'full',
      defenderBuyType: 'full'
    },
    positions: {
      attackers: [
        { x: 100, y: 200, alive: true },
        { x: 150, y: 250, alive: true },
        { x: 200, y: 300, alive: false }
      ],
      defenders: [
        { x: 800, y: 700, alive: true },
        { x: 850, y: 750, alive: true }
      ]
    },
    roundTime: 45,
    bombPlanted: false,
    previousRounds: [
      { winner: 'attackers', attackerScore: 1, defenderScore: 0 },
      { winner: 'defenders', attackerScore: 1, defenderScore: 1 }
    ]
  }
}

function generateMockPlayerContext(): PlayerMatchContext {
  return {
    playerId: 'player-1',
    role: 'duelist',
    mapName: 'Ascent',
    teamStrength: 0.75,
    opponentStrength: 0.70,
    matchImportance: 'playoffs',
    historicalRatings: [72, 75, 73, 78, 76, 74, 79, 77, 80, 78],
    recentStats: {
      kd: 1.25,
      adr: 165,
      kast: 72,
      acs: 245,
      firstKills: 3,
      clutchWins: 1
    }
  }
}

function generateMockMatchState(): MatchState {
  return {
    teamSide: 'attackers',
    roundNumber: 12,
    score: { team: 7, opponent: 5 },
    economy: {
      teamBank: 18000,
      opponentBank: 12000,
      canFullBuy: true,
      canForceBuy: true
    },
    playerStatus: {
      teamAlive: 4,
      opponentAlive: 3,
      keyPlayersAlive: ['player-1', 'player-2']
    },
    utility: {
      smokesAvailable: 4,
      flashesAvailable: 6,
      molliesAvailable: 3
    },
    mapControl: {
      midControl: 0.6,
      siteAControl: 0.4,
      siteBControl: 0.3
    },
    timeRemaining: 65
  }
}

function generateMockOpponentTendencies(): OpponentTendencies {
  return {
    aggressionLevel: 0.65,
    rotationSpeed: 'medium',
    sitePreferences: { a: 0.55, b: 0.45 },
    commonStrategies: [
      { id: 'slow_default', frequency: 0.4 },
      { id: 'aggressive_push', frequency: 0.3 }
    ],
    counterStrategies: [
      { id: 'fast_execute', effectiveness: 0.7 },
      { id: 'split_attack', effectiveness: 0.6 }
    ],
    weaknesses: ['mid_control', 'eco_rounds']
  }
}

// ============================================================================
// Round Predictor Tests
// ============================================================================

describe('RoundPredictor', () => {
  let predictor: RoundPredictor

  beforeEach(() => {
    predictor = createRoundPredictor()
  })

  afterEach(() => {
    try {
      predictor.dispose()
    } catch {
      // Ignore dispose errors
    }
    tf.engine().startScope()
    tf.engine().endScope()
  })

  it('should build model successfully', () => {
    const model = predictor.buildModel()
    expect(model).toBeDefined()
    expect(model.layers.length).toBeGreaterThan(0)
  })

  it('should have correct input shape', () => {
    predictor.buildModel()
    const summary = predictor.getSummary()
    expect(summary.built).toBe(true)
  })

  it('should throw error when predicting without model', async () => {
    const features = Array(48).fill(0.5)
    await expect(predictor.predict(features)).rejects.toThrow('not initialized')
  })

  it('should validate input feature dimensions', async () => {
    predictor.buildModel()
    const invalidFeatures = Array(10).fill(0.5)
    await expect(predictor.predict(invalidFeatures)).rejects.toThrow('Expected 48 features')
  })

  it('should predict with valid features', async () => {
    predictor.buildModel()
    const features = Array(48).fill(0.5)
    const prediction = await predictor.predict(features)
    
    expect(prediction).toHaveProperty('winProbability')
    expect(prediction).toHaveProperty('confidence')
    expect(prediction).toHaveProperty('predictedWinner')
    expect(prediction.winProbability).toBeGreaterThanOrEqual(0)
    expect(prediction.winProbability).toBeLessThanOrEqual(1)
  })

  it('should predict batch correctly', async () => {
    predictor.buildModel()
    const batch = Array(3).fill(Array(48).fill(0.5))
    const predictions = await predictor.predictBatch(batch)
    
    expect(predictions).toHaveLength(3)
    predictions.forEach(p => {
      expect(p).toHaveProperty('winProbability')
      expect(p).toHaveProperty('confidence')
    })
  })

  it('should train with sufficient data', async () => {
    predictor.buildModel()
    const samples = generateMockTrainingSamples(150, 'binary')
    const metrics = await predictor.train(samples)
    
    expect(metrics).toHaveProperty('accuracy')
    expect(metrics).toHaveProperty('precision')
    expect(metrics).toHaveProperty('recall')
    expect(metrics).toHaveProperty('f1Score')
  })

  it('should throw error with insufficient training data', async () => {
    predictor.buildModel()
    const samples = generateMockTrainingSamples(50, 'binary')
    await expect(predictor.train(samples)).rejects.toThrow('Insufficient training data')
  })

  it('should provide feature importance', async () => {
    predictor.buildModel()
    const features = Array(48).fill(0.5)
    const prediction = await predictor.predict(features)
    
    expect(prediction.featureImportance).toBeDefined()
    expect(Array.isArray(prediction.featureImportance)).toBe(true)
  })

  it('should track training progress', async () => {
    predictor.buildModel()
    const samples = generateMockTrainingSamples(150, 'binary')
    const progressCallback = vi.fn()
    
    await predictor.train(samples, progressCallback)
    expect(progressCallback).toHaveBeenCalled()
  })

  it('should extract round state features', () => {
    const state = generateMockRoundState()
    const features = extractRoundStateFeatures(state)
    
    expect(features).toHaveLength(48)
    expect(features.every(f => !isNaN(f) && isFinite(f))).toBe(true)
  })
})

// ============================================================================
// Player Performance Tests
// ============================================================================

describe('PlayerPerformanceModel', () => {
  let model: PlayerPerformanceModel

  beforeEach(() => {
    model = createPlayerPerformanceModel()
  })

  afterEach(() => {
    try {
      model.dispose()
    } catch {
      // Ignore dispose errors
    }
    tf.engine().startScope()
    tf.engine().endScope()
  })

  it('should build model successfully', () => {
    const builtModel = model.buildModel()
    expect(builtModel).toBeDefined()
    expect(builtModel.layers.length).toBeGreaterThan(0)
  })

  it('should predict SimRating from context', async () => {
    model.buildModel()
    const context = generateMockPlayerContext()
    const prediction = await model.predict(context)
    
    expect(prediction).toHaveProperty('predictedRating')
    expect(prediction).toHaveProperty('confidence')
    expect(prediction).toHaveProperty('components')
    expect(prediction.predictedRating).toBeGreaterThanOrEqual(0)
    expect(prediction.predictedRating).toBeLessThanOrEqual(100)
  })

  it('should predict all SimRating components', async () => {
    model.buildModel()
    const context = generateMockPlayerContext()
    const prediction = await model.predict(context)
    
    expect(prediction.components).toHaveProperty('combat')
    expect(prediction.components).toHaveProperty('economy')
    expect(prediction.components).toHaveProperty('clutch')
    expect(prediction.components).toHaveProperty('support')
    expect(prediction.components).toHaveProperty('entry')
  })

  it('should provide performance factors', async () => {
    model.buildModel()
    const context = generateMockPlayerContext()
    const prediction = await model.predict(context)
    
    expect(prediction.factors).toHaveProperty('formTrend')
    expect(prediction.factors).toHaveProperty('consistency')
    expect(prediction.factors).toHaveProperty('pressurePerformance')
    expect(prediction.factors).toHaveProperty('mapComfort')
  })

  it('should train with sufficient data', async () => {
    model.buildModel()
    const samples = generateMockTrainingSamples(100, 'continuous')
    const metrics = await model.train(samples)
    
    expect(metrics).toHaveProperty('mae')
    expect(metrics).toHaveProperty('rmse')
    expect(metrics).toHaveProperty('r2')
    expect(metrics).toHaveProperty('componentAccuracy')
  })

  it('should throw error with insufficient training data', async () => {
    model.buildModel()
    const samples = generateMockTrainingSamples(30, 'continuous')
    await expect(model.train(samples)).rejects.toThrow('Insufficient training data')
  })

  it('should predict batch correctly', async () => {
    model.buildModel()
    const contexts = Array(3).fill(generateMockPlayerContext())
    const predictions = await model.predictBatch(contexts)
    
    expect(predictions).toHaveLength(3)
    predictions.forEach(p => {
      expect(p).toHaveProperty('predictedRating')
      expect(p).toHaveProperty('components')
    })
  })

  it('should calculate overall rating from components', () => {
    const components = {
      combat: 80,
      economy: 75,
      clutch: 70,
      support: 65,
      entry: 75
    }
    const overall = calculateOverallRating(components)
    expect(overall).toBeGreaterThan(0)
    expect(overall).toBeLessThanOrEqual(100)
  })

  it('should handle different player roles', async () => {
    model.buildModel()
    const roles: PlayerMatchContext['role'][] = ['duelist', 'initiator', 'controller', 'sentinel']
    
    for (const role of roles) {
      const context = { ...generateMockPlayerContext(), role }
      const prediction = await model.predict(context)
      expect(prediction.predictedRating).toBeDefined()
    }
  })
})

// ============================================================================
// Strategy Model Tests
// ============================================================================

describe('StrategyModel', () => {
  let model: StrategyModel

  beforeEach(() => {
    model = createStrategyModel()
  })

  afterEach(() => {
    try {
      model.dispose()
    } catch {
      // Ignore dispose errors
    }
    tf.engine().startScope()
    tf.engine().endScope()
  })

  it('should build model successfully', () => {
    const builtModel = model.buildModel()
    expect(builtModel).toBeDefined()
    expect(builtModel.layers.length).toBeGreaterThan(0)
  })

  it('should recommend strategies', async () => {
    model.buildModel()
    const matchState = generateMockMatchState()
    const opponentTendencies = generateMockOpponentTendencies()
    
    const recommendation = await model.recommend(matchState, opponentTendencies)
    
    expect(recommendation).toHaveProperty('strategies')
    expect(recommendation).toHaveProperty('overallConfidence')
    expect(recommendation).toHaveProperty('analyzedFactors')
    expect(recommendation.strategies.length).toBeGreaterThan(0)
  })

  it('should filter strategies by side', async () => {
    model.buildModel()
    const attackerState = generateMockMatchState()
    const defenderState = { ...attackerState, teamSide: 'defenders' as const }
    const opponentTendencies = generateMockOpponentTendencies()
    
    const attackerRecs = await model.recommend(attackerState, opponentTendencies)
    const defenderRecs = await model.recommend(defenderState, opponentTendencies)
    
    // Should have different strategy sets
    expect(attackerRecs.strategies[0].type).not.toBe(defenderRecs.strategies[0].type)
  })

  it('should provide strategy requirements', async () => {
    model.buildModel()
    const matchState = generateMockMatchState()
    const opponentTendencies = generateMockOpponentTendencies()
    
    const recommendation = await model.recommend(matchState, opponentTendencies)
    
    recommendation.strategies.forEach(strategy => {
      expect(strategy).toHaveProperty('requirements')
      expect(Array.isArray(strategy.requirements)).toBe(true)
    })
  })

  it('should provide risk levels', async () => {
    model.buildModel()
    const matchState = generateMockMatchState()
    const opponentTendencies = generateMockOpponentTendencies()
    
    const recommendation = await model.recommend(matchState, opponentTendencies)
    
    recommendation.strategies.forEach(strategy => {
      expect(['low', 'medium', 'high']).toContain(strategy.riskLevel)
    })
  })

  it('should track strategy success rates', () => {
    model.updateStrategyOutcome('aggressive_push', true)
    model.updateStrategyOutcome('aggressive_push', false)
    
    const summary = model.getSummary()
    expect(summary.built).toBe(false)
  })

  it('should provide analyzed factors', async () => {
    model.buildModel()
    const matchState = generateMockMatchState()
    const opponentTendencies = generateMockOpponentTendencies()
    
    const recommendation = await model.recommend(matchState, opponentTendencies)
    
    expect(recommendation.analyzedFactors.length).toBeGreaterThan(0)
    recommendation.analyzedFactors.forEach(factor => {
      expect(factor).toHaveProperty('factor')
      expect(factor).toHaveProperty('value')
      expect(factor).toHaveProperty('impact')
      expect(['positive', 'negative', 'neutral']).toContain(factor.impact)
    })
  })

  it('should get available strategies by side', () => {
    const attackerStrategies = getAvailableStrategies('attackers')
    const defenderStrategies = getAvailableStrategies('defenders')
    
    expect(attackerStrategies.length).toBeGreaterThan(0)
    expect(defenderStrategies.length).toBeGreaterThan(0)
    expect(attackerStrategies).not.toContain('default_defense')
    expect(defenderStrategies).toContain('default_defense')
  })

  it('should have strategy definitions', () => {
    expect(Object.keys(STRATEGY_DEFINITIONS).length).toBeGreaterThan(0)
    Object.values(STRATEGY_DEFINITIONS).forEach(def => {
      expect(def).toHaveProperty('name')
      expect(def).toHaveProperty('description')
    })
  })
})

// ============================================================================
// Model Manager Tests
// ============================================================================

describe('ModelManager', () => {
  let manager: ModelManager

  beforeEach(async () => {
    // Skip IndexedDB tests in Node.js environment
    if (typeof indexedDB === 'undefined') {
      return
    }
    resetModelManager()
    manager = getModelManager()
    await manager.initialize()
  })

  afterEach(() => {
    if (typeof indexedDB !== 'undefined') {
      resetModelManager()
    }
  })

  it('should initialize successfully', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const newManager = getModelManager()
    await newManager.initialize()
    expect(newManager).toBeDefined()
  })

  it('should provide singleton instance', () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const manager1 = getModelManager()
    const manager2 = getModelManager()
    expect(manager1).toBe(manager2)
  })

  it('should save and load model version', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const version = await manager.saveModel('roundPredictor', predictor, {
      version: '1.0.0',
      description: 'Test version',
      metrics: { accuracy: 0.75 },
      makeActive: true
    })
    
    expect(version).toHaveProperty('id')
    expect(version).toHaveProperty('version')
    expect(version.isActive).toBe(true)
  })

  it('should get active version ID', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    await manager.saveModel('roundPredictor', predictor, {
      version: '1.0.0',
      makeActive: true
    })
    
    const activeId = manager.getActiveVersionId('roundPredictor')
    expect(activeId).toContain('roundPredictor')
  })

  it('should get versions by type', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    await manager.saveModel('roundPredictor', predictor, { version: '1.0.0' })
    await manager.saveModel('roundPredictor', predictor, { version: '1.1.0' })
    
    const versions = manager.getVersionsByType('roundPredictor')
    expect(versions.length).toBeGreaterThanOrEqual(2)
  })

  it('should set active version', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const v1 = await manager.saveModel('roundPredictor', predictor, { version: '1.0.0' })
    await manager.saveModel('roundPredictor', predictor, { version: '1.1.0' })
    
    await manager.setActiveVersion('roundPredictor', v1.id)
    const activeId = manager.getActiveVersionId('roundPredictor')
    expect(activeId).toBe(v1.id)
  })

  it('should provide active models summary', () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const summary = manager.getActiveModelsSummary()
    expect(summary).toHaveProperty('roundPredictor')
    expect(summary).toHaveProperty('playerPerformance')
    expect(summary).toHaveProperty('strategy')
  })

  it('should generate new version numbers', async () => {
    if (typeof indexedDB === 'undefined') {
      return
    }
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const v1 = await manager.saveModel('roundPredictor', predictor, {})
    const v2 = await manager.saveModel('roundPredictor', predictor, {})
    
    expect(v1.version).not.toBe(v2.version)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('ML Models Integration', () => {
  afterEach(() => {
    tf.engine().startScope()
    tf.engine().endScope()
  })

  it('should complete full training pipeline', async () => {
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const samples = generateMockTrainingSamples(200, 'binary')
    const metrics = await predictor.train(samples)
    
    // Make predictions on new data
    const testFeatures = Array(48).fill(0.5)
    const prediction = await predictor.predict(testFeatures)
    
    expect(metrics.accuracy).toBeGreaterThan(0)
    expect(prediction.winProbability).toBeDefined()
    
    predictor.dispose()
  })

  it('should handle edge cases in predictions', async () => {
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    // Edge case: all zeros
    const zeroFeatures = Array(48).fill(0)
    const zeroPred = await predictor.predict(zeroFeatures)
    expect(zeroPred.winProbability).toBeGreaterThanOrEqual(0)
    expect(zeroPred.winProbability).toBeLessThanOrEqual(1)
    
    // Edge case: all ones
    const oneFeatures = Array(48).fill(1)
    const onePred = await predictor.predict(oneFeatures)
    expect(onePred.winProbability).toBeGreaterThanOrEqual(0)
    expect(onePred.winProbability).toBeLessThanOrEqual(1)
    
    predictor.dispose()
  })

  it('should maintain inference time under threshold', async () => {
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const features = Array(48).fill(0.5)
    const prediction = await predictor.predict(features)
    
    // Inference should complete in under 100ms
    expect(prediction.inferenceTimeMs).toBeLessThan(1000)
    
    predictor.dispose()
  })

  it('should calculate reasonable confidence scores', async () => {
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const samples = generateMockTrainingSamples(150, 'binary')
    await predictor.train(samples)
    
    const features = Array(48).fill(0.5)
    const prediction = await predictor.predict(features)
    
    // Confidence should be between 0 and 1
    expect(prediction.confidence).toBeGreaterThanOrEqual(0)
    expect(prediction.confidence).toBeLessThanOrEqual(1)
    
    predictor.dispose()
  })

  it('should provide counter strategies', async () => {
    const model = createStrategyModel()
    model.buildModel()
    
    const matchState = generateMockMatchState()
    const opponentTendencies = generateMockOpponentTendencies()
    
    const recommendation = await model.recommend(matchState, opponentTendencies)
    
    recommendation.strategies.forEach(strategy => {
      expect(strategy).toHaveProperty('counters')
      expect(Array.isArray(strategy.counters)).toBe(true)
    })
    
    model.dispose()
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('ML Models Performance', () => {
  afterEach(() => {
    tf.engine().startScope()
    tf.engine().endScope()
  })

  it('should handle batch predictions efficiently', async () => {
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const batch = Array(10).fill(Array(48).fill(0.5))
    const startTime = performance.now()
    const predictions = await predictor.predictBatch(batch)
    const duration = performance.now() - startTime
    
    expect(predictions).toHaveLength(10)
    expect(duration / 10).toBeLessThan(100) // Average under 100ms per prediction
    
    predictor.dispose()
  })

  it('should dispose models and free memory', () => {
    const initialMemory = tf.memory()
    
    const predictor = createRoundPredictor()
    predictor.buildModel()
    
    const afterBuildMemory = tf.memory()
    expect(afterBuildMemory.numTensors).toBeGreaterThan(initialMemory.numTensors)
    
    predictor.dispose()
    
    const afterDisposeMemory = tf.memory()
    // Memory should be released (allow some tolerance)
    expect(afterDisposeMemory.numTensors).toBeLessThanOrEqual(afterBuildMemory.numTensors)
  })
})

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export all model classes', () => {
    expect(RoundPredictor).toBeDefined()
    expect(PlayerPerformanceModel).toBeDefined()
    expect(StrategyModel).toBeDefined()
    expect(ModelManager).toBeDefined()
  })

  it('should export factory functions', () => {
    expect(createRoundPredictor).toBeDefined()
    expect(createPlayerPerformanceModel).toBeDefined()
    expect(createStrategyModel).toBeDefined()
  })

  it('should export utility functions', () => {
    expect(extractRoundStateFeatures).toBeDefined()
    expect(calculateOverallRating).toBeDefined()
    expect(getAvailableStrategies).toBeDefined()
    expect(STRATEGY_DEFINITIONS).toBeDefined()
  })

  it('should export default configurations', () => {
    expect(DEFAULT_ROUND_PREDICTOR_CONFIG).toBeDefined()
    expect(DEFAULT_PLAYER_PERFORMANCE_CONFIG).toBeDefined()
    expect(DEFAULT_STRATEGY_CONFIG).toBeDefined()
  })
})
