/**
 * Data Ingestion Types
 * ====================
 * Type definitions for external esports data ingestion pipeline.
 * 
 * [Ver001.000] - Data ingestion types
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

// =============================================================================
// Data Source Types
// =============================================================================

export type DataSourceType = 'pandascore' | 'liquipedia' | 'hltv' | 'manual' | 'file';

export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'syncing' | 'rate_limited';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  rateLimitPerMinute: number;
  retryAttempts: number;
  timeout: number;
  headers?: Record<string, string>;
  customParams?: Record<string, string>;
}

export interface DataSourceHealth {
  status: DataSourceStatus;
  lastSync?: string;
  lastError?: string;
  errorCount: number;
  requestsMade: number;
  requestsRemaining?: number;
  rateLimitReset?: number;
  avgResponseTime: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

// =============================================================================
// Ingestion Data Types
// =============================================================================

export type IngestionDataType = 
  | 'match'
  | 'player'
  | 'team'
  | 'tournament'
  | 'series'
  | 'statistics'
  | 'event';

export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface RawDataRecord {
  id: string;
  sourceType: DataSourceType;
  sourceId: string;
  dataType: IngestionDataType;
  rawData: unknown;
  fetchedAt: string;
  checksum: string;
  metadata: {
    url?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    responseStatus: number;
    responseTime: number;
  };
}

export interface NormalizedRecord {
  id: string;
  sourceRecordId: string;
  dataType: IngestionDataType;
  normalizedData: unknown;
  schemaVersion: string;
  normalizedAt: string;
  conflicts: DataConflict[];
  enrichments: DataEnrichment[];
}

// =============================================================================
// Schema Mapping Types
// =============================================================================

export interface SchemaMapping {
  id: string;
  sourceType: DataSourceType;
  dataType: IngestionDataType;
  version: string;
  mappings: FieldMapping[];
  transforms: FieldTransform[];
  validations: FieldValidation[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  defaultValue?: unknown;
  converter?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'custom';
  customConverter?: string;
}

export interface FieldTransform {
  field: string;
  operation: 'uppercase' | 'lowercase' | 'trim' | 'split' | 'join' | 'replace' | 'custom';
  params?: Record<string, unknown>;
}

export interface FieldValidation {
  field: string;
  rules: ValidationRule[];
}

export type ValidationRule =
  | { type: 'required' }
  | { type: 'type'; expectedType: string }
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'pattern'; regex: string }
  | { type: 'enum'; values: unknown[] }
  | { type: 'custom'; validator: string };

// =============================================================================
// Conflict Resolution Types
// =============================================================================

export interface DataConflict {
  id: string;
  field: string;
  sourceValue: unknown;
  existingValue: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'source_wins' | 'existing_wins' | 'merge' | 'manual' | 'timestamp';
  resolvedValue: unknown;
  resolvedAt: string;
  resolvedBy?: string;
  notes?: string;
}

export interface DataEnrichment {
  field: string;
  source: string;
  value: unknown;
  confidence: number;
}

// =============================================================================
// Batch Processing Types
// =============================================================================

export interface BatchJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  sourceConfig: DataSourceConfig;
  dataTypes: IngestionDataType[];
  filters?: BatchFilters;
  schedule?: BatchSchedule;
  progress: BatchProgress;
  results?: BatchResults;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BatchFilters {
  dateFrom?: string;
  dateTo?: string;
  tournamentIds?: string[];
  teamIds?: string[];
  playerIds?: string[];
  matchIds?: string[];
}

export interface BatchSchedule {
  type: 'once' | 'hourly' | 'daily' | 'weekly' | 'cron';
  cronExpression?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface BatchProgress {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  skippedRecords: number;
  currentStage: string;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  stages: StageProgress[];
}

export interface StageProgress {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processed: number;
  total: number;
  startedAt?: string;
  completedAt?: string;
}

export interface BatchResults {
  recordsIngested: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  conflictsResolved: number;
  errors: BatchError[];
}

export interface BatchError {
  recordId: string;
  stage: string;
  error: string;
  timestamp: string;
  retryable: boolean;
}

// =============================================================================
// Ingestion Queue Types
// =============================================================================

export interface IngestionQueue {
  id: string;
  name: string;
  items: QueueItem[];
  config: QueueConfig;
  stats: QueueStats;
}

export interface QueueItem {
  id: string;
  jobId: string;
  data: unknown;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export interface QueueConfig {
  maxConcurrent: number;
  retryDelay: number;
  maxRetries: number;
  timeout: number;
  backoffMultiplier: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
  throughputPerMinute: number;
}

// =============================================================================
// API Types
// =============================================================================

export interface IngestionApiConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout: number;
  retries: number;
  retryDelay: number;
  rateLimitPerSecond: number;
}

export interface IngestionApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  cacheHit?: boolean;
  responseTime: number;
}

// =============================================================================
// Ingestion History Types
// =============================================================================

export interface IngestionHistoryEntry {
  id: string;
  jobId?: string;
  sourceType: DataSourceType;
  dataType: IngestionDataType;
  status: IngestionStatus;
  recordsCount: number;
  successCount: number;
  failureCount: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  triggeredBy: 'manual' | 'scheduled' | 'api' | 'webhook';
}

// =============================================================================
// Connector Interface
// =============================================================================

export interface DataConnector {
  id: string;
  config: DataSourceConfig;
  health: DataSourceHealth;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchData(dataType: IngestionDataType, params?: Record<string, unknown>): Promise<RawDataRecord[]>;
  testConnection(): Promise<boolean>;
  getRateLimitStatus(): Promise<{ remaining: number; resetTime: number }>;
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface IngestionDashboardData {
  sources: DataSourceStatus[];
  activeJobs: BatchJob[];
  recentHistory: IngestionHistoryEntry[];
  queueStats: QueueStats;
  errorLogs: ErrorLogEntry[];
  metrics: IngestionMetrics;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  sourceType: DataSourceType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, unknown>;
  stackTrace?: string;
}

export interface IngestionMetrics {
  totalRecordsIngested: number;
  recordsPerMinute: number;
  avgProcessingTime: number;
  successRate: number;
  activeSources: number;
  queuedJobs: number;
}
