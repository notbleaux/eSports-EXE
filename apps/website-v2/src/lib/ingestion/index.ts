/**
 * Data Ingestion Pipeline
 * =======================
 * External esports data ingestion system for Libre-X-eSport.
 * 
 * Features:
 * - RESTful API client with auth, rate limiting, and retry logic
 * - Multiple data source connectors (Pandascore, Liquipedia, HLTV, Manual)
 * - Data transformation and normalization
 * - Schema mapping and conflict resolution
 * - Batch job management and queue processing
 * - Progress tracking and error handling
 * 
 * [Ver001.000] - Data ingestion pipeline exports
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Data Source Types
  DataSourceType,
  DataSourceStatus,
  DataSourceConfig,
  DataSourceHealth,
  DataConnector,
  
  // Ingestion Types
  IngestionDataType,
  IngestionStatus,
  RawDataRecord,
  NormalizedRecord,
  
  // Schema Types
  SchemaMapping,
  FieldMapping,
  FieldTransform,
  FieldValidation,
  ValidationRule,
  
  // Conflict Types
  DataConflict,
  ConflictResolution,
  DataEnrichment,
  
  // Batch Types
  BatchJob,
  BatchFilters,
  BatchSchedule,
  BatchProgress,
  BatchResults,
  BatchError,
  StageProgress,
  QueueItem,
  QueueConfig,
  QueueStats,
  
  // API Types
  IngestionApiConfig,
  IngestionApiResponse,
  ApiError,
  ResponseMetadata,
  
  // History Types
  IngestionHistoryEntry,
  
  // Dashboard Types
  IngestionDashboardData,
  ErrorLogEntry,
  IngestionMetrics,
} from './types';

// =============================================================================
// API Client
// =============================================================================
export {
  IngestionApiClient,
  IngestionApi,
  DataSourceApi,
  BatchJobApi,
  DataApi,
  HistoryApi,
  createIngestionApi,
  createApiClient,
} from './api';

// =============================================================================
// Connectors
// =============================================================================
export {
  BaseDataConnector,
  PandascoreConnector,
  LiquipediaConnector,
  HLTVConnector,
  ManualUploadConnector,
  createConnector,
  getConnector,
  removeConnector,
  getAllConnectors,
  getConnectorsByType,
  getAllHealth,
  resetAllConnectors,
  DEFAULT_PANDASCORE_CONFIG,
  DEFAULT_LIQUIPEDIA_CONFIG,
  DEFAULT_HLTV_CONFIG,
  DEFAULT_MANUAL_CONFIG,
} from './connectors';

// =============================================================================
// Transformer
// =============================================================================
export {
  DataTransformer,
  createTransformer,
  createSchemaMapping,
} from './transformer';

// =============================================================================
// Batch Processor
// =============================================================================
export {
  IngestionQueue,
  BatchJobManager,
  ProgressTracker,
  BatchErrorHandler,
  createBatchJobManager,
  createQueue,
  createProgressTracker,
  createErrorHandler,
} from './batch';

// =============================================================================
// Default Export
// =============================================================================
export { default } from './api';
