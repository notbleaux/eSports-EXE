/**
 * ML Data Validation
 * 
 * [Ver001.000]
 * 
 * Provides:
 * - Data quality checks
 * - Missing value handling
 * - Outlier detection
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import { FEATURE_DIMENSIONS } from './features'
import type { TrainingSample } from './dataStore'

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  sampleId: string
  checks: {
    schema: CheckResult
    completeness: CheckResult
    consistency: CheckResult
    outliers: CheckResult
    distribution: CheckResult
  }
  errors: ValidationError[]
  warnings: ValidationWarning[]
  metadata: {
    validatedAt: number
    validatorVersion: string
    processingTimeMs: number
  }
}

export interface CheckResult {
  passed: boolean
  score: number // 0-1
  details?: string
}

export interface ValidationError {
  type: 'schema' | 'completeness' | 'consistency' | 'outliers' | 'distribution'
  field?: string
  message: string
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  type: 'schema' | 'completeness' | 'consistency' | 'outliers' | 'distribution'
  field?: string
  message: string
  suggestion?: string
}

export interface DatasetValidationResult {
  valid: boolean
  totalSamples: number
  validSamples: number
  invalidSamples: number
  sampleResults: ValidationResult[]
  summary: {
    schemaErrors: number
    completenessIssues: number
    consistencyIssues: number
    outlierCount: number
    distributionIssues: number
  }
}

// ============================================================================
// Schema Validation
// ============================================================================

/**
 * Validate sample against schema
 */
export function validateSchema(sample: TrainingSample): CheckResult {
  const errors: string[] = []
  
  // Check required fields
  if (!sample.id || typeof sample.id !== 'string') {
    errors.push('Missing or invalid id')
  }

  // Check features array
  if (!Array.isArray(sample.features)) {
    errors.push('Features must be an array')
  } else if (sample.features.length !== FEATURE_DIMENSIONS.total) {
    errors.push(`Expected ${FEATURE_DIMENSIONS.total} features, got ${sample.features.length}`)
  }

  // Check labels
  if (!sample.labels || typeof sample.labels !== 'object') {
    errors.push('Missing labels object')
  }

  // Check metadata
  if (!sample.metadata || typeof sample.metadata !== 'object') {
    errors.push('Missing metadata object')
  } else {
    if (!sample.metadata.timestamp) errors.push('Missing metadata.timestamp')
    if (!sample.metadata.source) errors.push('Missing metadata.source')
    if (!sample.metadata.featureVersion) errors.push('Missing metadata.featureVersion')
  }

  // Check quality
  if (!sample.quality || typeof sample.quality !== 'object') {
    errors.push('Missing quality object')
  }

  const passed = errors.length === 0
  return {
    passed,
    score: passed ? 1 : Math.max(0, 1 - errors.length * 0.1),
    details: errors.join('; ') || undefined
  }
}

// ============================================================================
// Completeness Validation
// ============================================================================

export interface CompletenessConfig {
  maxMissingRatio: number
  criticalFeatures: number[] // Indices of features that must not be missing
  minConfidence: number
}

const DEFAULT_COMPLETENESS_CONFIG: CompletenessConfig = {
  maxMissingRatio: 0.1, // 10% of features can be missing
  criticalFeatures: [0, 1], // Position features are critical
  minConfidence: 0.5
}

/**
 * Validate data completeness
 */
export function validateCompleteness(
  sample: TrainingSample,
  config: Partial<CompletenessConfig> = {}
): CheckResult {
  const cfg = { ...DEFAULT_COMPLETENESS_CONFIG, ...config }
  const errors: string[] = []
  let missingCount = 0

  // Check for missing feature values
  for (let i = 0; i < sample.features.length; i++) {
    const value = sample.features[i]
    if (typeof value !== 'number' || isNaN(value)) {
      missingCount++
      if (cfg.criticalFeatures.includes(i)) {
        errors.push(`Critical feature ${i} is missing`)
      }
    }
  }

  const missingRatio = missingCount / sample.features.length
  if (missingRatio > cfg.maxMissingRatio) {
    errors.push(`Too many missing values: ${(missingRatio * 100).toFixed(1)}%`)
  }

  // Check confidence
  if (sample.quality.confidence < cfg.minConfidence) {
    errors.push(`Confidence below threshold: ${sample.quality.confidence}`)
  }

  const passed = errors.length === 0
  return {
    passed,
    score: 1 - missingRatio,
    details: errors.join('; ') || `Missing: ${missingCount}/${sample.features.length}`
  }
}

/**
 * Detect missing values in feature vector
 */
export function detectMissingValues(features: number[]): {
  indices: number[]
  count: number
  ratio: number
} {
  const indices: number[] = []
  
  for (let i = 0; i < features.length; i++) {
    const value = features[i]
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      indices.push(i)
    }
  }

  return {
    indices,
    count: indices.length,
    ratio: indices.length / features.length
  }
}

/**
 * Impute missing values using various strategies
 */
export function imputeMissingValues(
  features: number[],
  strategy: 'mean' | 'median' | 'mode' | 'constant' = 'mean',
  constantValue: number = 0.5,
  featureStats?: Map<number, { mean: number; median: number; mode: number }>
): number[] {
  return features.map((value, index) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      switch (strategy) {
        case 'mean':
          return featureStats?.get(index)?.mean ?? constantValue
        case 'median':
          return featureStats?.get(index)?.median ?? constantValue
        case 'mode':
          return featureStats?.get(index)?.mode ?? constantValue
        case 'constant':
        default:
          return constantValue
      }
    }
    return value
  })
}

// ============================================================================
// Consistency Validation
// ============================================================================

export interface ConsistencyRule {
  name: string
  check: (sample: TrainingSample) => boolean
  message: string
}

const DEFAULT_CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    name: 'position_bounds',
    check: (s) => s.features[0] >= 0 && s.features[0] <= 1 && s.features[1] >= 0 && s.features[1] <= 1,
    message: 'Position coordinates must be normalized to [0, 1]'
  },
  {
    name: 'probability_bounds',
    check: (s) => {
      if (s.labels.winProbability !== undefined) {
        return s.labels.winProbability >= 0 && s.labels.winProbability <= 1
      }
      return true
    },
    message: 'Win probability must be in [0, 1]'
  },
  {
    name: 'timestamp_valid',
    check: (s) => s.metadata.timestamp > 0 && s.metadata.timestamp < Date.now() + 86400000,
    message: 'Timestamp must be valid and not in the future'
  },
  {
    name: 'feature_version_valid',
    check: (s) => /^\d+\.\d+\.\d+$/.test(s.metadata.featureVersion),
    message: 'Feature version must follow semver format'
  },
  {
    name: 'confidence_bounds',
    check: (s) => s.quality.confidence >= 0 && s.quality.confidence <= 1,
    message: 'Confidence must be in [0, 1]'
  },
  {
    name: 'outlier_flag_consistent',
    check: (s) => typeof s.quality.isOutlier === 'boolean',
    message: 'isOutlier must be a boolean'
  }
]

/**
 * Validate data consistency
 */
export function validateConsistency(
  sample: TrainingSample,
  rules: ConsistencyRule[] = DEFAULT_CONSISTENCY_RULES
): CheckResult {
  const violations: string[] = []

  for (const rule of rules) {
    try {
      if (!rule.check(sample)) {
        violations.push(rule.message)
      }
    } catch (error) {
      violations.push(`Error checking ${rule.name}: ${error}`)
    }
  }

  const passed = violations.length === 0
  return {
    passed,
    score: passed ? 1 : Math.max(0, 1 - violations.length * 0.2),
    details: violations.join('; ') || undefined
  }
}

// ============================================================================
// Outlier Detection
// ============================================================================

export interface OutlierConfig {
  method: 'iqr' | 'zscore' | 'isolation_forest'
  zscoreThreshold: number
  iqrMultiplier: number
}

const DEFAULT_OUTLIER_CONFIG: OutlierConfig = {
  method: 'zscore',
  zscoreThreshold: 3,
  iqrMultiplier: 1.5
}

/**
 * Detect outliers using Z-score method
 */
export function detectOutliersZScore(
  features: number[],
  means: number[],
  stds: number[],
  threshold: number = 3
): {
  isOutlier: boolean
  outlierFeatures: number[]
  maxZScore: number
} {
  const outlierFeatures: number[] = []
  let maxZScore = 0

  for (let i = 0; i < features.length; i++) {
    const mean = means[i] ?? 0.5
    const std = stds[i] ?? 0.2
    
    if (std === 0) continue

    const zscore = Math.abs((features[i] - mean) / std)
    maxZScore = Math.max(maxZScore, zscore)

    if (zscore > threshold) {
      outlierFeatures.push(i)
    }
  }

  return {
    isOutlier: outlierFeatures.length > 0,
    outlierFeatures,
    maxZScore
  }
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(
  features: number[],
  q1s: number[],
  q3s: number[],
  multiplier: number = 1.5
): {
  isOutlier: boolean
  outlierFeatures: number[]
} {
  const outlierFeatures: number[] = []

  for (let i = 0; i < features.length; i++) {
    const q1 = q1s[i] ?? 0.25
    const q3 = q3s[i] ?? 0.75
    const iqr = q3 - q1
    const lower = q1 - multiplier * iqr
    const upper = q3 + multiplier * iqr

    if (features[i] < lower || features[i] > upper) {
      outlierFeatures.push(i)
    }
  }

  return {
    isOutlier: outlierFeatures.length > 0,
    outlierFeatures
  }
}

/**
 * Simple isolation forest-like outlier detection
 * Uses random subspace projections
 */
export function detectOutliersIsolation(
  features: number[],
  referenceSamples: number[][],
  numTrees: number = 10
): {
  isOutlier: boolean
  anomalyScore: number
} {
  if (referenceSamples.length < 10) {
    return { isOutlier: false, anomalyScore: 0.5 }
  }

  let totalPathLength = 0

  for (let tree = 0; tree < numTrees; tree++) {
    // Random feature subset
    const featureSubset = selectRandomFeatures(features.length, Math.floor(features.length / 2))
    
    // Project samples
    const projected = referenceSamples.map(s => 
      featureSubset.reduce((sum, idx) => sum + s[idx], 0) / featureSubset.length
    )
    const projectedQuery = featureSubset.reduce((sum, idx) => sum + features[idx], 0) 
      / featureSubset.length

    // Sort and find position
    projected.sort((a, b) => a - b)
    const position = findInsertPosition(projected, projectedQuery)
    
    // Path length approximation
    const pathLength = Math.log2(position + 1) + 0.5772156649 // Euler's constant
    totalPathLength += pathLength
  }

  const avgPathLength = totalPathLength / numTrees
  const expectedPathLength = 2 * Math.log2(referenceSamples.length - 1) - (2 * (referenceSamples.length - 1) / referenceSamples.length)
  const anomalyScore = Math.pow(2, -avgPathLength / expectedPathLength)

  return {
    isOutlier: anomalyScore > 0.6,
    anomalyScore
  }
}

function selectRandomFeatures(total: number, count: number): number[] {
  const indices = Array.from({ length: total }, (_, i) => i)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, count)
}

function findInsertPosition(sorted: number[], value: number): number {
  let left = 0
  let right = sorted.length
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (sorted[mid] < value) {
      left = mid + 1
    } else {
      right = mid
    }
  }
  
  return left
}

/**
 * Validate sample for outliers
 */
export function validateOutliers(
  sample: TrainingSample,
  referenceStats?: {
    means: number[]
    stds: number[]
    q1s: number[]
    q3s: number[]
  },
  config: Partial<OutlierConfig> = {}
): CheckResult {
  const cfg = { ...DEFAULT_OUTLIER_CONFIG, ...config }

  let isOutlier = false
  let details = ''

  switch (cfg.method) {
    case 'zscore':
      if (referenceStats) {
        const result = detectOutliersZScore(
          sample.features,
          referenceStats.means,
          referenceStats.stds,
          cfg.zscoreThreshold
        )
        isOutlier = result.isOutlier
        details = result.outlierFeatures.length > 0 
          ? `Outlier features: ${result.outlierFeatures.join(', ')}` 
          : ''
      }
      break

    case 'iqr':
      if (referenceStats) {
        const result = detectOutliersIQR(
          sample.features,
          referenceStats.q1s,
          referenceStats.q3s,
          cfg.iqrMultiplier
        )
        isOutlier = result.isOutlier
        details = result.outlierFeatures.length > 0 
          ? `Outlier features: ${result.outlierFeatures.join(', ')}` 
          : ''
      }
      break
  }

  return {
    passed: !isOutlier,
    score: isOutlier ? 0.5 : 1,
    details: details || undefined
  }
}

// ============================================================================
// Distribution Validation
// ============================================================================

export interface DistributionStats {
  means: number[]
  stds: number[]
  mins: number[]
  maxs: number[]
  q1s: number[]
  q3s: number[]
}

/**
 * Calculate distribution statistics from samples
 */
export function calculateDistributionStats(samples: TrainingSample[]): DistributionStats {
  if (samples.length === 0) {
    return {
      means: new Array(FEATURE_DIMENSIONS.total).fill(0.5),
      stds: new Array(FEATURE_DIMENSIONS.total).fill(0.2),
      mins: new Array(FEATURE_DIMENSIONS.total).fill(0),
      maxs: new Array(FEATURE_DIMENSIONS.total).fill(1),
      q1s: new Array(FEATURE_DIMENSIONS.total).fill(0.25),
      q3s: new Array(FEATURE_DIMENSIONS.total).fill(0.75)
    }
  }

  const featureCount = samples[0].features.length
  const stats: DistributionStats = {
    means: [],
    stds: [],
    mins: [],
    maxs: [],
    q1s: [],
    q3s: []
  }

  for (let i = 0; i < featureCount; i++) {
    const values = samples.map(s => s.features[i]).filter(v => !isNaN(v))
    
    if (values.length === 0) {
      stats.means.push(0.5)
      stats.stds.push(0.2)
      stats.mins.push(0)
      stats.maxs.push(1)
      stats.q1s.push(0.25)
      stats.q3s.push(0.75)
      continue
    }

    values.sort((a, b) => a - b)
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const std = Math.sqrt(variance)
    
    stats.means.push(mean)
    stats.stds.push(std)
    stats.mins.push(values[0])
    stats.maxs.push(values[values.length - 1])
    stats.q1s.push(values[Math.floor(values.length * 0.25)])
    stats.q3s.push(values[Math.floor(values.length * 0.75)])
  }

  return stats
}

/**
 * Validate distribution of sample against reference
 */
export function validateDistribution(
  sample: TrainingSample,
  referenceStats: DistributionStats
): CheckResult {
  const violations: string[] = []
  let totalDeviation = 0

  for (let i = 0; i < sample.features.length; i++) {
    const value = sample.features[i]
    const mean = referenceStats.means[i]
    const std = referenceStats.stds[i]

    if (std === 0) continue

    const zscore = Math.abs((value - mean) / std)
    totalDeviation += zscore

    // Check if outside reasonable bounds
    if (value < referenceStats.mins[i] - 3 * std || value > referenceStats.maxs[i] + 3 * std) {
      violations.push(`Feature ${i} (${value}) outside expected range`)
    }
  }

  const avgDeviation = totalDeviation / sample.features.length
  const passed = violations.length === 0 && avgDeviation < 2

  return {
    passed,
    score: Math.max(0, 1 - avgDeviation / 3),
    details: violations.join('; ') || `Avg deviation: ${avgDeviation.toFixed(2)}`
  }
}

// ============================================================================
// Complete Validation
// ============================================================================

/**
 * Validate a single sample comprehensively
 */
export async function validateSample(
  sample: TrainingSample,
  referenceStats?: DistributionStats,
  config: {
    completeness?: Partial<CompletenessConfig>
    outlier?: Partial<OutlierConfig>
  } = {}
): Promise<ValidationResult> {
  const startTime = performance.now()

  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Schema validation
  const schemaResult = validateSchema(sample)
  if (!schemaResult.passed) {
    errors.push({
      type: 'schema',
      message: schemaResult.details || 'Schema validation failed',
      severity: 'critical'
    })
  }

  // Completeness validation
  const completenessResult = validateCompleteness(sample, config.completeness)
  if (!completenessResult.passed) {
    errors.push({
      type: 'completeness',
      message: completenessResult.details || 'Completeness check failed',
      severity: 'error'
    })
  }

  // Consistency validation
  const consistencyResult = validateConsistency(sample)
  if (!consistencyResult.passed) {
    errors.push({
      type: 'consistency',
      message: consistencyResult.details || 'Consistency check failed',
      severity: 'error'
    })
  }

  // Outlier validation
  const outlierResult = validateOutliers(sample, referenceStats, config.outlier)
  if (!outlierResult.passed) {
    warnings.push({
      type: 'outliers',
      message: outlierResult.details || 'Potential outlier detected',
      suggestion: 'Review sample for data entry errors'
    })
  }

  // Distribution validation (only if reference stats available)
  let distributionResult: CheckResult = { passed: true, score: 1 }
  if (referenceStats) {
    distributionResult = validateDistribution(sample, referenceStats)
    if (!distributionResult.passed) {
      warnings.push({
        type: 'distribution',
        message: distributionResult.details || 'Distribution anomaly detected'
      })
    }
  }

  const valid = errors.length === 0
  const processingTime = performance.now() - startTime

  return {
    valid,
    sampleId: sample.id,
    checks: {
      schema: schemaResult,
      completeness: completenessResult,
      consistency: consistencyResult,
      outliers: outlierResult,
      distribution: distributionResult
    },
    errors,
    warnings,
    metadata: {
      validatedAt: Date.now(),
      validatorVersion: '1.0.0',
      processingTimeMs: processingTime
    }
  }
}

/**
 * Validate multiple samples
 */
export async function validateDataset(
  samples: TrainingSample[],
  config?: Parameters<typeof validateSample>[2]
): Promise<DatasetValidationResult> {
  const referenceStats = calculateDistributionStats(samples)
  const results: ValidationResult[] = []

  let validCount = 0
  let invalidCount = 0
  const summary = {
    schemaErrors: 0,
    completenessIssues: 0,
    consistencyIssues: 0,
    outlierCount: 0,
    distributionIssues: 0
  }

  for (const sample of samples) {
    const result = await validateSample(sample, referenceStats, config)
    results.push(result)

    if (result.valid) {
      validCount++
    } else {
      invalidCount++
    }

    // Count issues
    if (!result.checks.schema.passed) summary.schemaErrors++
    if (!result.checks.completeness.passed) summary.completenessIssues++
    if (!result.checks.consistency.passed) summary.consistencyIssues++
    if (!result.checks.outliers.passed) summary.outlierCount++
    if (!result.checks.distribution.passed) summary.distributionIssues++
  }

  mlLogger.info('Dataset validation complete', {
    total: samples.length,
    valid: validCount,
    invalid: invalidCount,
    ...summary
  })

  return {
    valid: invalidCount === 0,
    totalSamples: samples.length,
    validSamples: validCount,
    invalidSamples: invalidCount,
    sampleResults: results,
    summary
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  validateSample,
  validateDataset,
  validateSchema,
  validateCompleteness,
  validateConsistency,
  validateOutliers,
  validateDistribution,
  detectMissingValues,
  imputeMissingValues,
  calculateDistributionStats,
  detectOutliersZScore,
  detectOutliersIQR,
  detectOutliersIsolation
}
