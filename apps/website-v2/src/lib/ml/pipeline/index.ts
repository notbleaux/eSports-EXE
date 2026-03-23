/**
 * ML Data Pipeline - Main Exports
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

// Feature Extraction
export {
  // Core extraction functions
  extractPositionFeatures,
  extractTimingFeatures,
  extractEconomyFeatures,
  extractTeamCoordinationFeatures,
  extractLensFeatures,
  assembleFeatureVector,
  
  // Utility functions
  calculateDistance,
  calculateAngle,
  getRoundPhase,
  classifyBuyType,
  encodeTimingPhase,
  encodeBuyType,
  
  // Validation
  validateFeatureVector,
  hasMissingValues,
  fillMissingValues,
  
  // Constants
  FEATURE_DIMENSIONS,
  FEATURE_NAMES
} from './features'

export type {
  PositionFeatures,
  TimingFeatures,
  EconomyFeatures,
  TeamCoordinationFeatures,
  MatchFeatures,
  ExtractedFeatures
} from './features'

// Data Store
export {
  // Sample operations
  storeSample,
  storeSamples,
  getSample,
  deleteSample,
  querySamples,
  countSamples,
  
  // Dataset operations
  createDataset,
  getDataset,
  updateDataset,
  deleteDataset,
  listDatasets,
  
  // Version management
  createVersion,
  getActiveVersion,
  listVersions,
  
  // Export/Import
  exportDataset,
  importSamples,
  
  // Statistics
  getStorageStats,
  
  // Database
  closeDB,
  deleteDB
} from './dataStore'

export type {
  TrainingSample,
  Dataset,
  DatasetFilters,
  DataVersion,
  StorageStats,
  ExportResult,
  ImportResult,
  QueryOptions
} from './dataStore'

// Validation
export {
  // Main validation
  validateSample,
  validateDataset,
  
  // Individual checks
  validateSchema,
  validateCompleteness,
  validateConsistency,
  validateOutliers,
  validateDistribution,
  
  // Missing value handling
  detectMissingValues,
  imputeMissingValues,
  
  // Outlier detection
  detectOutliersZScore,
  detectOutliersIQR,
  detectOutliersIsolation,
  
  // Statistics
  calculateDistributionStats
} from './validation'

export type {
  ValidationResult,
  CheckResult,
  ValidationError,
  ValidationWarning,
  DatasetValidationResult,
  CompletenessConfig,
  ConsistencyRule,
  OutlierConfig,
  DistributionStats
} from './validation'

// Data Pipeline
export {
  // Main pipeline
  runDataPipeline,
  
  // Data ingestion
  ingestMatchData,
  ingestLensData,
  
  // Data splitting
  stratifiedSplit,
  randomSplit,
  shuffleArray,
  
  // Normalization
  calculateNormalizationParams,
  normalizeSamples,
  minMaxNormalizeSamples,
  denormalizeValue,
  
  // Tensor conversion
  samplesToTensors,
  createTFDataset,
  
  // Constants
  DEFAULT_PIPELINE_CONFIG
} from './dataPipeline'

export type {
  PipelineConfig,
  NormalizationParams,
  DatasetSplit,
  TensorDataset,
  PipelineResult,
  IngestionResult,
  MatchData,
  RoundData,
  PlayerData,
  GameEvent
} from './dataPipeline'

// Pipeline Manager
export {
  PipelineManager,
  getPipelineManager,
  resetPipelineManager
} from './manager'

export type {
  PipelineStep,
  PipelineStage,
  PipelineDefinition,
  PipelineExecution,
  ProgressUpdate,
  PipelineError,
  ProgressCallback
} from './manager'
