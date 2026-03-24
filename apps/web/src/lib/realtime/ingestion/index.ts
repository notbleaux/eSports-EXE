/**
 * Real-time Data Ingestion System
 * 
 * Live match data ingestion from multiple sources.
 * 
 * [Ver001.000] - Data ingestion exports
 */

// =============================================================================
// Engine
// =============================================================================
export {
  DataIngestionEngine,
  createEngine,
  createTransformRule,
  createFilterRule,
  getDefaultEngine,
  resetDefaultEngine,
} from './engine';

export type {
  EngineState,
  IngestionStage,
  EngineConfig,
  IngestionPipeline,
  TransformRule,
  FilterRule,
  IngestionResult,
  BatchIngestionResult,
  EngineMetrics,
  EngineHealth,
} from './engine';

// =============================================================================
// Connectors
// =============================================================================
export {
  // Connector classes
  PandascoreConnector,
  ManualInputConnector,
  FileUploadConnector,
  MockConnector,
  BaseConnector,
  
  // Factory functions
  createConnector,
  getConnector,
  removeConnector,
  getAllConnectors,
  getConnectorsByType,
  getAllHealth,
  resetAllConnectors,
  
  // Default configs
  DEFAULT_PANDASCORE_CONFIG,
  DEFAULT_MANUAL_CONFIG,
  DEFAULT_FILE_CONFIG,
  DEFAULT_MOCK_CONFIG,
} from './connectors';

export type {
  SourceType,
  SourceStatus,
  SourceConfig,
  SourceHealth,
  SourceConnector,
  PandascoreConfig,
  FileUploadConfig,
  MockConfig,
} from './connectors';

// =============================================================================
// Processor
// =============================================================================
export {
  EventStreamProcessor,
  createProcessor,
  processEvents,
  createEnrichmentContext,
  getDefaultProcessor,
  resetDefaultProcessor,
} from './processor';

export type {
  ProcessorState,
  ProcessorConfig,
  ProcessingResult,
  BatchProcessingResult,
  EventBuffer,
  EnrichmentContext,
  ProcessorMetrics,
} from './processor';

// =============================================================================
// Validator
// =============================================================================
export {
  DataValidator,
  createValidator,
  validateEvent,
  validateEvents,
  createValidationRules,
  getDefaultValidator,
  resetDefaultValidator,
} from './validator';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRule,
  ValidationConfig,
  BatchValidationResult,
} from './validator';

// =============================================================================
// Default Export
// =============================================================================
export { default } from './engine';
