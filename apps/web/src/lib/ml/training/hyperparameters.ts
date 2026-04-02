// @ts-nocheck
/**
 * ML Hyperparameter Tuning
 * 
 * [Ver001.000]
 * 
 * Provides hyperparameter optimization:
 * - Grid Search
 * - Random Search
 * - Bayesian Optimization
 * - Best Model Selection
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import type { TrainingResult } from './orchestrator'

// ============================================================================
// Hyperparameter Types
// ============================================================================

export type HyperparameterType = 'continuous' | 'discrete' | 'categorical' | 'log'

export interface HyperparameterRange {
  name: string
  type: HyperparameterType
  min?: number
  max?: number
  choices?: (string | number | boolean)[]
  logBase?: number // For log scale parameters
}

export interface HyperparameterSpace {
  learningRate: HyperparameterRange
  batchSize: HyperparameterRange
  epochs: HyperparameterRange
  dropoutRate?: HyperparameterRange
  hiddenUnits?: HyperparameterRange
  activation?: HyperparameterRange
  optimizer?: HyperparameterRange
  l2Regularization?: HyperparameterRange
  [key: string]: HyperparameterRange | undefined
}

export interface HyperparameterConfig {
  learningRate: number
  batchSize: number
  epochs: number
  dropoutRate?: number
  hiddenUnits?: number
  activation?: string
  optimizer?: 'adam' | 'sgd' | 'rmsprop' | 'adagrad'
  l2Regularization?: number
  [key: string]: unknown
}

export interface SearchConfig {
  strategy: 'grid' | 'random' | 'bayesian'
  maxIterations: number
  parallelJobs: number
  cv: number
  scoring: string
  direction: 'minimize' | 'maximize'
  randomSeed?: number
  earlyStopping?: {
    enabled: boolean
    patience: number
    minImprovement: number
  }
}

export interface Trial {
  id: number
  config: HyperparameterConfig
  status: 'pending' | 'running' | 'completed' | 'failed'
  metrics?: Record<string, number>
  score?: number
  duration?: number
  error?: string
}

export interface SearchResult {
  bestConfig: HyperparameterConfig
  bestScore: number
  bestTrialId: number
  trials: Trial[]
  searchTimeMs: number
  totalIterations: number
  converged: boolean
  improvementHistory: { iteration: number; score: number }[]
}

export interface GridPoint {
  [key: string]: number | string | boolean
}

export interface BayesianState {
  observations: Array<{ config: number[]; score: number }>
  surrogateModel?: unknown // Would use Gaussian Process in full implementation
  acquisitionFunction: 'ei' | 'ucb' | 'poi'
  explorationFactor: number
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_HYPERPARAMETER_SPACE: HyperparameterSpace = {
  learningRate: {
    name: 'learningRate',
    type: 'log',
    min: 1e-5,
    max: 1e-1,
    logBase: 10
  },
  batchSize: {
    name: 'batchSize',
    type: 'discrete',
    choices: [16, 32, 64, 128]
  },
  epochs: {
    name: 'epochs',
    type: 'discrete',
    choices: [50, 100, 150, 200]
  },
  dropoutRate: {
    name: 'dropoutRate',
    type: 'continuous',
    min: 0.0,
    max: 0.5
  },
  hiddenUnits: {
    name: 'hiddenUnits',
    type: 'discrete',
    choices: [64, 128, 256, 512]
  },
  activation: {
    name: 'activation',
    type: 'categorical',
    choices: ['relu', 'leaky_relu', 'elu', 'swish']
  },
  optimizer: {
    name: 'optimizer',
    type: 'categorical',
    choices: ['adam', 'sgd', 'rmsprop']
  },
  l2Regularization: {
    name: 'l2Regularization',
    type: 'log',
    min: 1e-6,
    max: 1e-2,
    logBase: 10
  }
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  strategy: 'random',
  maxIterations: 20,
  parallelJobs: 2,
  cv: 3,
  scoring: 'val_accuracy',
  direction: 'maximize',
  earlyStopping: {
    enabled: true,
    patience: 5,
    minImprovement: 0.001
  }
}

// ============================================================================
// Grid Search
// ============================================================================

/**
 * Generate grid points for exhaustive search
 */
export function generateGrid(
  space: HyperparameterSpace,
  maxPoints: number = 1000
): GridPoint[] {
  const paramNames = Object.keys(space)
  const paramValues: (number | string | boolean)[][] = []

  for (const name of paramNames) {
    const range = space[name]
    if (!range) continue

    let values: (number | string | boolean)[] = []

    switch (range.type) {
      case 'discrete':
      case 'categorical':
        values = range.choices || []
        break
      case 'continuous':
        // Sample 3-5 points evenly
        const steps = Math.min(5, Math.ceil(Math.pow(maxPoints, 1 / paramNames.length)))
        for (let i = 0; i < steps; i++) {
          const value = (range.min || 0) + i * ((range.max || 1) - (range.min || 0)) / (steps - 1 || 1)
          values.push(Math.round(value * 1000) / 1000)
        }
        break
      case 'log':
        // Sample 3-5 points on log scale
        const logSteps = Math.min(5, Math.ceil(Math.pow(maxPoints, 1 / paramNames.length)))
        const logMin = Math.log(range.min || 1e-5) / Math.log(range.logBase || 10)
        const logMax = Math.log(range.max || 1) / Math.log(range.logBase || 10)
        for (let i = 0; i < logSteps; i++) {
          const logValue = logMin + i * (logMax - logMin) / (logSteps - 1 || 1)
          values.push(Math.pow(range.logBase || 10, logValue))
        }
        break
    }

    paramValues.push(values)
  }

  // Generate cartesian product
  const grid: GridPoint[] = []
  
  function cartesianProduct(
    arr: (number | string | boolean)[][], 
    index: number, 
    current: GridPoint
  ): void {
    if (index === arr.length) {
      grid.push({ ...current })
      return
    }
    
    for (const value of arr[index]) {
      current[paramNames[index]] = value
      cartesianProduct(arr, index + 1, current)
    }
  }

  cartesianProduct(paramValues, 0, {})

  // Limit to max points
  if (grid.length > maxPoints) {
    // Sample evenly from grid
    const step = Math.floor(grid.length / maxPoints)
    return grid.filter((_, i) => i % step === 0).slice(0, maxPoints)
  }

  return grid
}

/**
 * Run grid search hyperparameter optimization
 */
export async function runGridSearch(
  space: HyperparameterSpace,
  trainFn: (config: HyperparameterConfig) => Promise<TrainingResult>,
  config: Partial<SearchConfig> = {}
): Promise<SearchResult> {
  const searchConfig = { ...DEFAULT_SEARCH_CONFIG, ...config, strategy: 'grid' as const }
  const startTime = performance.now()
  
  mlLogger.info('Starting grid search', { maxPoints: searchConfig.maxIterations })

  const grid = generateGrid(space, searchConfig.maxIterations)
  const trials: Trial[] = []
  let bestTrial: Trial | undefined
  const improvementHistory: { iteration: number; score: number }[] = []

  for (let i = 0; i < grid.length; i++) {
    const trial: Trial = {
      id: i,
      config: gridToConfig(grid[i]),
      status: 'running'
    }

    try {
      const startTrial = performance.now()
      const result = await trainFn(trial.config)
      trial.duration = performance.now() - startTrial
      
      if (result.success) {
        trial.status = 'completed'
        trial.metrics = result.finalMetrics
        trial.score = calculateScore(result.finalMetrics, searchConfig.scoring, searchConfig.direction)
        
        improvementHistory.push({ iteration: i, score: trial.score })

        if (!bestTrial || isBetterScore(trial.score, bestTrial.score, searchConfig.direction)) {
          bestTrial = trial
          mlLogger.debug('New best configuration found', { 
            trial: i, 
            score: trial.score,
            config: trial.config 
          })
        }

        // Early stopping check
        if (searchConfig.earlyStopping?.enabled && shouldStopEarly(improvementHistory, searchConfig)) {
          mlLogger.info('Early stopping triggered', { iteration: i })
          break
        }
      } else {
        trial.status = 'failed'
        trial.error = result.error
      }
    } catch (error) {
      trial.status = 'failed'
      trial.error = error instanceof Error ? error.message : 'Unknown error'
    }

    trials.push(trial)
  }

  const searchTime = performance.now() - startTime

  mlLogger.info('Grid search completed', { 
    totalTrials: trials.length,
    bestScore: bestTrial?.score,
    searchTimeMs: searchTime
  })

  return {
    bestConfig: bestTrial?.config || trials[0]?.config || {} as HyperparameterConfig,
    bestScore: bestTrial?.score || 0,
    bestTrialId: bestTrial?.id || 0,
    trials,
    searchTimeMs: searchTime,
    totalIterations: trials.length,
    converged: improvementHistory.length > 5,
    improvementHistory
  }
}

// ============================================================================
// Random Search
// ============================================================================

/**
 * Generate random configuration from space
 */
export function generateRandomConfig(
  space: HyperparameterSpace,
  rng: () => number = Math.random
): HyperparameterConfig {
  const config: Partial<HyperparameterConfig> = {}

  for (const [name, range] of Object.entries(space)) {
    if (!range) continue

    switch (range.type) {
      case 'continuous':
        config[name as keyof HyperparameterConfig] = 
          (range.min || 0) + rng() * ((range.max || 1) - (range.min || 0))
        break
      case 'discrete':
      case 'categorical':
        const choices = range.choices || []
        config[name as keyof HyperparameterConfig] = 
          choices[Math.floor(rng() * choices.length)] as never
        break
      case 'log':
        const logMin = Math.log(range.min || 1e-5) / Math.log(range.logBase || 10)
        const logMax = Math.log(range.max || 1) / Math.log(range.logBase || 10)
        const logValue = logMin + rng() * (logMax - logMin)
        config[name as keyof HyperparameterConfig] = Math.pow(range.logBase || 10, logValue)
        break
    }
  }

  return config as HyperparameterConfig
}

/**
 * Run random search hyperparameter optimization
 */
export async function runRandomSearch(
  space: HyperparameterSpace,
  trainFn: (config: HyperparameterConfig) => Promise<TrainingResult>,
  config: Partial<SearchConfig> = {}
): Promise<SearchResult> {
  const searchConfig = { ...DEFAULT_SEARCH_CONFIG, ...config, strategy: 'random' as const }
  const startTime = performance.now()
  
  // Seeded random number generator
  const rng = createSeededRNG(searchConfig.randomSeed)
  
  mlLogger.info('Starting random search', { iterations: searchConfig.maxIterations })

  const trials: Trial[] = []
  let bestTrial: Trial | undefined
  const improvementHistory: { iteration: number; score: number }[] = []

  for (let i = 0; i < searchConfig.maxIterations; i++) {
    const trial: Trial = {
      id: i,
      config: generateRandomConfig(space, rng),
      status: 'running'
    }

    try {
      const startTrial = performance.now()
      const result = await trainFn(trial.config)
      trial.duration = performance.now() - startTrial
      
      if (result.success) {
        trial.status = 'completed'
        trial.metrics = result.finalMetrics
        trial.score = calculateScore(result.finalMetrics, searchConfig.scoring, searchConfig.direction)
        
        improvementHistory.push({ iteration: i, score: trial.score })

        if (!bestTrial || isBetterScore(trial.score, bestTrial.score, searchConfig.direction)) {
          bestTrial = trial
          mlLogger.debug('New best configuration found', { 
            trial: i, 
            score: trial.score 
          })
        }

        // Early stopping check
        if (searchConfig.earlyStopping?.enabled && shouldStopEarly(improvementHistory, searchConfig)) {
          mlLogger.info('Early stopping triggered', { iteration: i })
          break
        }
      } else {
        trial.status = 'failed'
        trial.error = result.error
      }
    } catch (error) {
      trial.status = 'failed'
      trial.error = error instanceof Error ? error.message : 'Unknown error'
    }

    trials.push(trial)
  }

  const searchTime = performance.now() - startTime

  mlLogger.info('Random search completed', { 
    totalTrials: trials.length,
    bestScore: bestTrial?.score,
    searchTimeMs: searchTime
  })

  return {
    bestConfig: bestTrial?.config || trials[0]?.config || {} as HyperparameterConfig,
    bestScore: bestTrial?.score || 0,
    bestTrialId: bestTrial?.id || 0,
    trials,
    searchTimeMs: searchTime,
    totalIterations: trials.length,
    converged: improvementHistory.length > 5,
    improvementHistory
  }
}

// ============================================================================
// Bayesian Optimization
// ============================================================================

/**
 * Run Bayesian optimization for hyperparameter tuning
 * 
 * This is a simplified implementation. Full Bayesian optimization would use
 * Gaussian Processes with proper acquisition functions.
 */
export async function runBayesianOptimization(
  space: HyperparameterSpace,
  trainFn: (config: HyperparameterConfig) => Promise<TrainingResult>,
  config: Partial<SearchConfig> = {}
): Promise<SearchResult> {
  const searchConfig = { ...DEFAULT_SEARCH_CONFIG, ...config, strategy: 'bayesian' as const }
  const startTime = performance.now()
  
  mlLogger.info('Starting Bayesian optimization', { iterations: searchConfig.maxIterations })

  const trials: Trial[] = []
  const state: BayesianState = {
    observations: [],
    acquisitionFunction: 'ei',
    explorationFactor: 0.1
  }

  // Warmup with random samples
  const warmupIterations = Math.min(5, Math.floor(searchConfig.maxIterations * 0.25))
  const rng = createSeededRNG(searchConfig.randomSeed)

  let bestTrial: Trial | undefined
  const improvementHistory: { iteration: number; score: number }[] = []

  for (let i = 0; i < searchConfig.maxIterations; i++) {
    let trialConfig: HyperparameterConfig

    if (i < warmupIterations) {
      // Random sampling during warmup
      trialConfig = generateRandomConfig(space, rng)
    } else {
      // Use acquisition function to suggest next point
      trialConfig = suggestNextPoint(space, state, rng)
    }

    const trial: Trial = {
      id: i,
      config: trialConfig,
      status: 'running'
    }

    try {
      const startTrial = performance.now()
      const result = await trainFn(trial.config)
      trial.duration = performance.now() - startTrial
      
      if (result.success) {
        trial.status = 'completed'
        trial.metrics = result.finalMetrics
        trial.score = calculateScore(result.finalMetrics, searchConfig.scoring, searchConfig.direction)
        
        // Update Bayesian state
        updateBayesianState(state, trialConfig, trial.score, space)
        
        improvementHistory.push({ iteration: i, score: trial.score })

        if (!bestTrial || isBetterScore(trial.score, bestTrial.score, searchConfig.direction)) {
          bestTrial = trial
        }

        // Early stopping
        if (searchConfig.earlyStopping?.enabled && shouldStopEarly(improvementHistory, searchConfig)) {
          mlLogger.info('Early stopping triggered', { iteration: i })
          break
        }
      } else {
        trial.status = 'failed'
        trial.error = result.error
      }
    } catch (error) {
      trial.status = 'failed'
      trial.error = error instanceof Error ? error.message : 'Unknown error'
    }

    trials.push(trial)
  }

  const searchTime = performance.now() - startTime

  mlLogger.info('Bayesian optimization completed', { 
    totalTrials: trials.length,
    bestScore: bestTrial?.score,
    searchTimeMs: searchTime
  })

  return {
    bestConfig: bestTrial?.config || trials[0]?.config || {} as HyperparameterConfig,
    bestScore: bestTrial?.score || 0,
    bestTrialId: bestTrial?.id || 0,
    trials,
    searchTimeMs: searchTime,
    totalIterations: trials.length,
    converged: improvementHistory.length > 10,
    improvementHistory
  }
}

/**
 * Suggest next point using acquisition function
 */
function suggestNextPoint(
  space: HyperparameterSpace,
  state: BayesianState,
  rng: () => number
): HyperparameterConfig {
  // Simplified: Use expected improvement around best observed point
  // In a full implementation, this would use a Gaussian Process surrogate
  
  if (state.observations.length === 0) {
    return generateRandomConfig(space, rng)
  }

  // Find best observed point
  const bestObs = state.observations.reduce((best, obs) => 
    obs.score > best.score ? obs : best
  )

  // Sample around best point with decreasing variance
  const bestConfig = configToVector(bestObs.config, space)
  const variance = 1 / Math.sqrt(state.observations.length)

  const newConfig: number[] = bestConfig.map((val) => {
    const noise = (rng() - 0.5) * 2 * variance
    return Math.max(0, Math.min(1, val + noise))
  })

  return vectorToConfig(newConfig, space)
}

/**
 * Update Bayesian state with new observation
 */
function updateBayesianState(
  state: BayesianState,
  config: HyperparameterConfig,
  score: number,
  space: HyperparameterSpace
): void {
  state.observations.push({
    config: configToVector(config, space),
    score
  })
}

// ============================================================================
// Best Model Selection
// ============================================================================

/**
 * Select best model from multiple candidates
 */
export function selectBestModel(
  results: Array<{ config: HyperparameterConfig; metrics: Record<string, number> }>,
  criteria: {
    primaryMetric: string
    secondaryMetric?: string
    direction: 'minimize' | 'maximize'
    minThreshold?: Record<string, number>
  }
): { config: HyperparameterConfig; metrics: Record<string, number>; rank: number } | null {
  
  // Filter by threshold constraints
  let validResults = results
  if (criteria.minThreshold) {
    validResults = results.filter(r => {
      return Object.entries(criteria.minThreshold!).every(
        ([metric, threshold]) => r.metrics[metric] >= threshold
      )
    })
  }

  if (validResults.length === 0) {
    mlLogger.warn('No models meet threshold constraints')
    return null
  }

  // Sort by primary metric
  validResults.sort((a, b) => {
    const aVal = a.metrics[criteria.primaryMetric] ?? (criteria.direction === 'minimize' ? Infinity : -Infinity)
    const bVal = b.metrics[criteria.primaryMetric] ?? (criteria.direction === 'minimize' ? Infinity : -Infinity)
    return criteria.direction === 'minimize' ? aVal - bVal : bVal - aVal
  })

  // Use secondary metric for ties
  if (criteria.secondaryMetric) {
    const primaryVal = validResults[0].metrics[criteria.primaryMetric]
    const tied = validResults.filter(r => 
      Math.abs((r.metrics[criteria.primaryMetric] ?? 0) - (primaryVal ?? 0)) < 0.001
    )
    
    if (tied.length > 1) {
      tied.sort((a, b) => {
        const aVal = a.metrics[criteria.secondaryMetric!] ?? 0
        const bVal = b.metrics[criteria.secondaryMetric!] ?? 0
        return criteria.direction === 'minimize' ? aVal - bVal : bVal - aVal
      })
    }
  }

  const best = validResults[0]
  const rank = results.findIndex(r => r === best) + 1

  mlLogger.info('Best model selected', { 
    primaryMetric: best.metrics[criteria.primaryMetric],
    rank 
  })

  return { ...best, rank }
}

/**
 * Compare two hyperparameter configurations
 */
export function compareConfigs(
  config1: HyperparameterConfig,
  config2: HyperparameterConfig
): { differences: string[]; distance: number } {
  const differences: string[] = []
  let squaredDistance = 0
  let count = 0

  const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)])

  for (const key of allKeys) {
    const val1 = config1[key]
    const val2 = config2[key]

    if (typeof val1 === 'number' && typeof val2 === 'number') {
      if (Math.abs(val1 - val2) > 1e-6) {
        differences.push(`${key}: ${val1.toFixed(6)} → ${val2.toFixed(6)}`)
      }
      squaredDistance += Math.pow(val1 - val2, 2)
      count++
    } else if (val1 !== val2) {
      differences.push(`${key}: ${val1} → ${val2}`)
      count++
    }
  }

  return {
    differences,
    distance: count > 0 ? Math.sqrt(squaredDistance / count) : 0
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function gridToConfig(gridPoint: GridPoint): HyperparameterConfig {
  return gridPoint as unknown as HyperparameterConfig
}

function configToVector(config: HyperparameterConfig, space: HyperparameterSpace): number[] {
  const vector: number[] = []
  
  for (const [name, range] of Object.entries(space)) {
    if (!range) continue
    const value = config[name]

    switch (range.type) {
      case 'continuous':
        vector.push((value as number - (range.min || 0)) / ((range.max || 1) - (range.min || 0)))
        break
      case 'discrete':
      case 'categorical':
        const choices = range.choices || []
        const index = choices.indexOf(value as string | number | boolean)
        vector.push(index / Math.max(choices.length - 1, 1))
        break
      case 'log':
        const logVal = Math.log(value as number) / Math.log(range.logBase || 10)
        const logMin = Math.log(range.min || 1e-5) / Math.log(range.logBase || 10)
        const logMax = Math.log(range.max || 1) / Math.log(range.logBase || 10)
        vector.push((logVal - logMin) / (logMax - logMin))
        break
    }
  }

  return vector
}

function vectorToConfig(vector: number[], space: HyperparameterSpace): HyperparameterConfig {
  const config: Partial<HyperparameterConfig> = {}
  let i = 0

  for (const [name, range] of Object.entries(space)) {
    if (!range || i >= vector.length) continue
    const normalized = Math.max(0, Math.min(1, vector[i]))

    switch (range.type) {
      case 'continuous':
        config[name as keyof HyperparameterConfig] = 
          (range.min || 0) + normalized * ((range.max || 1) - (range.min || 0))
        break
      case 'discrete':
      case 'categorical':
        const choices = range.choices || []
        const index = Math.round(normalized * (choices.length - 1))
        config[name as keyof HyperparameterConfig] = choices[index] as never
        break
      case 'log':
        const logMin = Math.log(range.min || 1e-5) / Math.log(range.logBase || 10)
        const logMax = Math.log(range.max || 1) / Math.log(range.logBase || 10)
        const logVal = logMin + normalized * (logMax - logMin)
        config[name as keyof HyperparameterConfig] = Math.pow(range.logBase || 10, logVal)
        break
    }

    i++
  }

  return config as HyperparameterConfig
}

function calculateScore(
  metrics: Record<string, number>,
  scoring: string,
  direction: 'minimize' | 'maximize'
): number {
  const value = metrics[scoring] ?? 0
  return direction === 'minimize' ? -value : value
}

function isBetterScore(score1: number | undefined, score2: number | undefined, direction: 'minimize' | 'maximize'): boolean {
  if (score1 === undefined) return false
  if (score2 === undefined) return true
  return direction === 'minimize' ? score1 < score2 : score1 > score2
}

function shouldStopEarly(
  history: { iteration: number; score: number }[],
  config: SearchConfig
): boolean {
  if (!config.earlyStopping?.enabled || history.length < config.earlyStopping.patience) {
    return false
  }

  const recent = history.slice(-config.earlyStopping.patience)
  const bestInWindow = Math.max(...recent.map(h => h.score))
  const bestOverall = Math.max(...history.map(h => h.score))

  return bestOverall - bestInWindow > config.earlyStopping.minImprovement
}

function createSeededRNG(seed?: number): () => number {
  if (seed === undefined) return Math.random

  // Simple seeded RNG (Mulberry32)
  let t = seed
  return function() {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  runGridSearch,
  runRandomSearch,
  runBayesianOptimization,
  generateGrid,
  generateRandomConfig,
  selectBestModel,
  compareConfigs,
  DEFAULT_HYPERPARAMETER_SPACE,
  DEFAULT_SEARCH_CONFIG
}
