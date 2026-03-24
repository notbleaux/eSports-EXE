/**
 * Data Validation and Cleaning System
 * 
 * Comprehensive data validation and cleaning for Libre-X-eSport 4NJZ4 TENET Platform.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

// Schema Validation
export {
  validateSchema,
  createValidator,
  schemaRegistry,
  mergeSchemas,
  pickSchema,
  omitSchema,
  PlayerSchema,
  TeamSchema,
  MatchSchema,
  PlayerStatsSchema,
  isString,
  isNumber,
  isInteger,
  isBoolean,
  isObject,
  isArray,
  isDate,
  isDateString,
} from './schema';

export type {
  SchemaType,
  SchemaField,
  ConditionalRule,
  CustomValidator,
  ValidationSchema,
  ValidationError,
  ValidationResult,
  TypeGuard,
} from './schema';

// Data Cleaner
export {
  cleanData,
  cleanPlayerData,
  cleanMatchData,
  cleanStatsData,
  removeDuplicates,
  findDuplicates,
  fillMissingValues,
  normalizeFormats,
  detectOutliers,
  normalizeRegionCode,
  normalizeAgentName,
} from './cleaner';

export type {
  CleanOptions,
  CleanResult,
  DuplicateOptions,
  MissingValueOptions,
  NormalizationOptions,
  OutlierOptions,
  OutlierResult,
} from './cleaner';

// Quality Scorer
export {
  calculateQualityScore,
  calculateCompletenessMetrics,
  calculateAccuracyMetrics,
  calculateConsistencyMetrics,
  generateDatasetQualityReport,
  getQualityBadge,
  scoreToGrade,
} from './quality';

export type {
  QualityGrade,
  QualityScore,
  QualityIssue,
  CompletenessMetrics,
  AccuracyMetrics,
  ConsistencyMetrics,
  DatasetQualityReport,
  FieldQualityMetrics,
  QualityTrend,
  ScoringConfig,
} from './quality';

// Validation Pipeline
export {
  ValidationPipeline,
  runBatchValidation,
  runParallelValidation,
  createPipeline,
  quickValidate,
  commonBusinessRules,
} from './pipeline';

export type {
  ValidationStage,
  PipelineStage,
  PipelineConfig,
  PipelineError,
  RepairSuggestion,
  PipelineResult,
  StageResult,
  PipelineStats,
  ValidationReport,
  StageReport,
  BatchResult,
  BusinessRule,
} from './pipeline';
