/**
 * Data Ingestion Engine - Live Match Data Ingestion System
 * 
 * Features:
 * - Ingest from multiple sources
 * - Data transformation
 * - Normalization
 * - Error handling
 * - Pipeline orchestration
 * - Configurable ingestion flows
 * 
 * [Ver001.000] - Data ingestion engine
 */

import { logger } from '../../../utils/logger';
import type { LiveEvent, LiveMatchState, LiveEventType } from '../types';
import type { SourceConnector, SourceConfig, SourceHealth } from './connectors';
import type { ValidationResult } from './validator';
import type { ProcessingResult } from './processor';

const engineLogger = logger.child('IngestionEngine');

// =============================================================================
// Engine Types
// =============================================================================

export type EngineState = 'stopped' | 'starting' | 'running' | 'paused' | 'error' | 'stopping';

export type IngestionStage = 
  | 'source'
  | 'validation'
  | 'transformation'
  | 'enrichment'
  | 'processing'
  | 'storage'
  | 'distribution';

export interface EngineConfig {
  id: string;
  name: string;
  autoStart: boolean;
  maxConcurrentSources: number;
  batchSize: number;
  processingInterval: number;
  retryAttempts: number;
  retryDelay: number;
  enableMetrics: boolean;
  stages: IngestionStage[];
}

export interface IngestionPipeline {
  id: string;
  name: string;
  sourceConfig: SourceConfig;
  engineConfig: EngineConfig;
  transformRules: TransformRule[];
  filters: FilterRule[];
}

export interface TransformRule {
  id: string;
  name: string;
  stage: IngestionStage;
  condition?: (event: LiveEvent) => boolean;
  transform: (event: LiveEvent) => LiveEvent | null;
  priority: number;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';
  value: unknown;
}

export interface IngestionResult {
  success: boolean;
  event: LiveEvent | null;
  sourceId: string;
  pipelineId: string;
  stagesCompleted: IngestionStage[];
  stagesFailed: IngestionStage[];
  processingTimeMs: number;
  timestamp: string;
  errors: string[];
  warnings: string[];
}

export interface BatchIngestionResult {
  total: number;
  successful: number;
  failed: number;
  filtered: number;
  transformed: number;
  results: IngestionResult[];
  processingTimeMs: number;
  timestamp: string;
}

export interface EngineMetrics {
  eventsIngested: number;
  eventsProcessed: number;
  eventsFailed: number;
  eventsFiltered: number;
  eventsTransformed: number;
  averageProcessingTime: number;
  sourcesConnected: number;
  sourcesTotal: number;
  throughputPerSecond: number;
  errorRate: number;
  uptime: number; // seconds
}

export interface EngineHealth {
  state: EngineState;
  sourcesHealth: Record<string, SourceHealth>;
  metrics: EngineMetrics;
  lastError?: string;
  lastErrorTime?: string;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  id: 'default-engine',
  name: 'Default Ingestion Engine',
  autoStart: false,
  maxConcurrentSources: 10,
  batchSize: 100,
  processingInterval: 1000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableMetrics: true,
  stages: ['source', 'validation', 'transformation', 'processing', 'distribution'],
};

// =============================================================================
// Data Ingestion Engine
// =============================================================================

export class DataIngestionEngine {
  private config: EngineConfig;
  private state: EngineState = 'stopped';
  private pipelines = new Map<string, IngestionPipeline>();
  private connectors = new Map<string, SourceConnector>();
  private transformRules: TransformRule[] = [];
  private filterRules: FilterRule[] = [];
  
  // Processing
  private processingQueue: LiveEvent[] = [];
  private processingTimer: ReturnType<typeof setInterval> | null = null;
  private batchBuffer: LiveEvent[] = [];
  
  // Metrics
  private metrics: EngineMetrics = {
    eventsIngested: 0,
    eventsProcessed: 0,
    eventsFailed: 0,
    eventsFiltered: 0,
    eventsTransformed: 0,
    averageProcessingTime: 0,
    sourcesConnected: 0,
    sourcesTotal: 0,
    throughputPerSecond: 0,
    errorRate: 0,
    uptime: 0,
  };
  
  private startTime = 0;
  private errorHistory: { timestamp: number; message: string }[] = [];
  
  // Event handlers
  private resultHandlers: Set<(result: IngestionResult) => void> = new Set();
  private errorHandlers: Set<(error: Error, context?: Record<string, unknown>) => void> = new Set();

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    engineLogger.info('DataIngestionEngine initialized', { config: this.config });
  }

  // =============================================================================
  // Public API - Lifecycle
  // =============================================================================

  /**
   * Start the ingestion engine
   */
  async start(): Promise<void> {
    if (this.state === 'running' || this.state === 'starting') {
      engineLogger.warn('Engine already running or starting');
      return;
    }

    this.state = 'starting';
    engineLogger.info('Starting ingestion engine', { engineId: this.config.id });

    try {
      // Connect all pipelines
      await this.connectAllPipelines();
      
      // Start processing loop
      this.startProcessingLoop();
      
      this.state = 'running';
      this.startTime = Date.now();
      
      engineLogger.info('Ingestion engine started', { engineId: this.config.id });
    } catch (error) {
      this.state = 'error';
      this.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Stop the ingestion engine
   */
  async stop(): Promise<void> {
    if (this.state === 'stopped' || this.state === 'stopping') {
      return;
    }

    this.state = 'stopping';
    engineLogger.info('Stopping ingestion engine', { engineId: this.config.id });

    // Stop processing loop
    this.stopProcessingLoop();

    // Disconnect all pipelines
    await this.disconnectAllPipelines();

    // Process remaining batch
    await this.flushBatchBuffer();

    this.state = 'stopped';
    engineLogger.info('Ingestion engine stopped', { engineId: this.config.id });
  }

  /**
   * Pause the ingestion engine
   */
  pause(): void {
    if (this.state !== 'running') {
      return;
    }

    this.state = 'paused';
    this.stopProcessingLoop();
    engineLogger.info('Ingestion engine paused', { engineId: this.config.id });
  }

  /**
   * Resume the ingestion engine
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    this.state = 'running';
    this.startProcessingLoop();
    engineLogger.info('Ingestion engine resumed', { engineId: this.config.id });
  }

  // =============================================================================
  // Public API - Pipeline Management
  // =============================================================================

  /**
   * Register a pipeline
   */
  registerPipeline(pipeline: IngestionPipeline): void {
    this.pipelines.set(pipeline.id, pipeline);
    this.metrics.sourcesTotal = this.pipelines.size;
    engineLogger.info('Pipeline registered', { pipelineId: pipeline.id, name: pipeline.name });
  }

  /**
   * Unregister a pipeline
   */
  unregisterPipeline(pipelineId: string): void {
    const pipeline = this.pipelines.get(pipelineId);
    if (pipeline) {
      this.disconnectPipeline(pipeline);
      this.pipelines.delete(pipelineId);
      this.metrics.sourcesTotal = this.pipelines.size;
      engineLogger.info('Pipeline unregistered', { pipelineId });
    }
  }

  /**
   * Add a source connector
   */
  addConnector(connector: SourceConnector): void {
    this.connectors.set(connector.id, connector);
    
    // Set up event listeners
    connector.onEvent(event => this.handleSourceEvent(connector.id, event));
    connector.onError(error => this.handleSourceError(connector.id, error));
    
    engineLogger.info('Connector added', { connectorId: connector.id, type: connector.config.type });
  }

  /**
   * Remove a source connector
   */
  removeConnector(connectorId: string): void {
    const connector = this.connectors.get(connectorId);
    if (connector) {
      connector.disconnect();
      this.connectors.delete(connectorId);
      engineLogger.info('Connector removed', { connectorId });
    }
  }

  // =============================================================================
  // Public API - Transform & Filter Rules
  // =============================================================================

  /**
   * Add a transform rule
   */
  addTransformRule(rule: TransformRule): void {
    this.transformRules.push(rule);
    this.transformRules.sort((a, b) => a.priority - b.priority);
    engineLogger.info('Transform rule added', { ruleId: rule.id, name: rule.name });
  }

  /**
   * Remove a transform rule
   */
  removeTransformRule(ruleId: string): void {
    this.transformRules = this.transformRules.filter(r => r.id !== ruleId);
    engineLogger.info('Transform rule removed', { ruleId });
  }

  /**
   * Add a filter rule
   */
  addFilterRule(rule: FilterRule): void {
    this.filterRules.push(rule);
    engineLogger.info('Filter rule added', { ruleId: rule.id, field: rule.field });
  }

  /**
   * Remove a filter rule
   */
  removeFilterRule(ruleId: string): void {
    this.filterRules = this.filterRules.filter(r => r.id !== ruleId);
    engineLogger.info('Filter rule removed', { ruleId });
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.transformRules = [];
    this.filterRules = [];
    engineLogger.info('All rules cleared');
  }

  // =============================================================================
  // Public API - Manual Ingestion
  // =============================================================================

  /**
   * Ingest a single event
   */
  async ingest(event: LiveEvent, sourceId = 'manual'): Promise<IngestionResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.processEvent(event, sourceId);
      return result;
    } catch (error) {
      return {
        success: false,
        event: null,
        sourceId,
        pipelineId: this.config.id,
        stagesCompleted: [],
        stagesFailed: ['source'],
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        errors: [(error as Error).message],
        warnings: [],
      };
    }
  }

  /**
   * Ingest multiple events
   */
  async ingestBatch(events: LiveEvent[], sourceId = 'manual'): Promise<BatchIngestionResult> {
    const startTime = Date.now();
    const results: IngestionResult[] = [];

    for (const event of events) {
      const result = await this.ingest(event, sourceId);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const filtered = results.filter(r => r.event === null && r.success).length;
    const transformed = results.filter(r => r.stagesCompleted.includes('transformation')).length;

    return {
      total: events.length,
      successful,
      failed: events.length - successful,
      filtered,
      transformed,
      results,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  // =============================================================================
  // Public API - Queries
  // =============================================================================

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * Get engine configuration
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * Get current metrics
   */
  getMetrics(): EngineMetrics {
    return {
      ...this.metrics,
      uptime: this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
    };
  }

  /**
   * Get engine health
   */
  getHealth(): EngineHealth {
    const sourcesHealth: Record<string, SourceHealth> = {};
    this.connectors.forEach((connector, id) => {
      sourcesHealth[id] = connector.getHealth();
    });

    return {
      state: this.state,
      sourcesHealth,
      metrics: this.getMetrics(),
      lastError: this.errorHistory.length > 0 ? this.errorHistory[this.errorHistory.length - 1].message : undefined,
      lastErrorTime: this.errorHistory.length > 0 ? new Date(this.errorHistory[this.errorHistory.length - 1].timestamp).toISOString() : undefined,
    };
  }

  /**
   * Get all registered pipelines
   */
  getPipelines(): IngestionPipeline[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Get all connectors
   */
  getConnectors(): SourceConnector[] {
    return Array.from(this.connectors.values());
  }

  // =============================================================================
  // Public API - Event Handlers
  // =============================================================================

  /**
   * Register result handler
   */
  onResult(handler: (result: IngestionResult) => void): () => void {
    this.resultHandlers.add(handler);
    return () => this.resultHandlers.delete(handler);
  }

  /**
   * Register error handler
   */
  onError(handler: (error: Error, context?: Record<string, unknown>) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // =============================================================================
  // Public API - Utilities
  // =============================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    engineLogger.info('Engine configuration updated', { config: this.config });
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      eventsIngested: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      eventsFiltered: 0,
      eventsTransformed: 0,
      averageProcessingTime: 0,
      sourcesConnected: this.metrics.sourcesConnected,
      sourcesTotal: this.metrics.sourcesTotal,
      throughputPerSecond: 0,
      errorRate: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
    this.errorHistory = [];
    engineLogger.info('Engine metrics reset');
  }

  // =============================================================================
  // Private Methods - Pipeline Management
  // =============================================================================

  private async connectAllPipelines(): Promise<void> {
    for (const [id, pipeline] of this.pipelines) {
      await this.connectPipeline(pipeline);
    }
  }

  private async connectPipeline(pipeline: IngestionPipeline): Promise<void> {
    try {
      // Import connector dynamically to avoid circular dependency
      const { createConnector } = await import('./connectors');
      const connector = createConnector(pipeline.sourceConfig);
      
      this.addConnector(connector);
      await connector.connect();
      
      this.metrics.sourcesConnected++;
      engineLogger.info('Pipeline connected', { pipelineId: pipeline.id });
    } catch (error) {
      engineLogger.error('Failed to connect pipeline', { pipelineId: pipeline.id, error });
      throw error;
    }
  }

  private async disconnectAllPipelines(): Promise<void> {
    for (const connector of this.connectors.values()) {
      await connector.disconnect();
    }
    this.connectors.clear();
    this.metrics.sourcesConnected = 0;
  }

  private disconnectPipeline(pipeline: IngestionPipeline): void {
    // Find and remove connector for this pipeline
    for (const [id, connector] of this.connectors) {
      if (connector.config.id === pipeline.sourceConfig.id) {
        connector.disconnect();
        this.connectors.delete(id);
        this.metrics.sourcesConnected--;
        break;
      }
    }
  }

  // =============================================================================
  // Private Methods - Event Processing
  // =============================================================================

  private handleSourceEvent(sourceId: string, event: LiveEvent): void {
    this.metrics.eventsIngested++;
    this.batchBuffer.push(event);

    // Process immediately if batch is full
    if (this.batchBuffer.length >= this.config.batchSize) {
      this.processBatchBuffer();
    }
  }

  private handleSourceError(sourceId: string, error: Error): void {
    engineLogger.error('Source error', { sourceId, error: error.message });
    this.recordError(error, { sourceId });
  }

  private startProcessingLoop(): void {
    if (this.processingTimer) {
      return;
    }

    this.processingTimer = setInterval(() => {
      this.processBatchBuffer();
    }, this.config.processingInterval);
  }

  private stopProcessingLoop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  private async processBatchBuffer(): Promise<void> {
    if (this.batchBuffer.length === 0) {
      return;
    }

    const batch = [...this.batchBuffer];
    this.batchBuffer = [];

    for (const event of batch) {
      await this.processEvent(event, 'batch');
    }
  }

  private async flushBatchBuffer(): Promise<void> {
    await this.processBatchBuffer();
  }

  private async processEvent(event: LiveEvent, sourceId: string): Promise<IngestionResult> {
    const startTime = Date.now();
    const stagesCompleted: IngestionStage[] = [];
    const stagesFailed: IngestionStage[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let currentEvent: LiveEvent | null = event;

    try {
      // Stage 1: Source (already done, just track)
      stagesCompleted.push('source');

      // Stage 2: Validation
      if (this.config.stages.includes('validation')) {
        try {
          const { validateEvent } = await import('./validator');
          const validationResult = validateEvent(currentEvent);
          
          if (!validationResult.valid) {
            stagesFailed.push('validation');
            errors.push(...validationResult.errors.map(e => e.message));
            throw new Error(`Validation failed: ${validationResult.errors[0]?.message}`);
          }
          
          if (validationResult.normalizedData) {
            currentEvent = validationResult.normalizedData;
          }
          
          stagesCompleted.push('validation');
        } catch (error) {
          stagesFailed.push('validation');
          throw error;
        }
      }

      // Stage 3: Transformation
      if (this.config.stages.includes('transformation') && currentEvent) {
        try {
          const transformed = this.applyTransformations(currentEvent);
          if (transformed === null) {
            this.metrics.eventsFiltered++;
            return {
              success: true,
              event: null,
              sourceId,
              pipelineId: this.config.id,
              stagesCompleted,
              stagesFailed,
              processingTimeMs: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              errors,
              warnings,
            };
          }
          currentEvent = transformed;
          this.metrics.eventsTransformed++;
          stagesCompleted.push('transformation');
        } catch (error) {
          stagesFailed.push('transformation');
          throw error;
        }
      }

      // Stage 4: Processing (enrichment, dedup, etc.)
      if (this.config.stages.includes('processing') && currentEvent) {
        try {
          const { createProcessor } = await import('./processor');
          const processor = createProcessor();
          const result = processor.processValidated({
            valid: true,
            errors: [],
            warnings: [],
            qualityScore: 100,
            normalizedData: currentEvent,
          });

          if (result) {
            currentEvent = result.event;
          }
          
          stagesCompleted.push('processing');
        } catch (error) {
          stagesFailed.push('processing');
          throw error;
        }
      }

      // Stage 5: Distribution
      if (this.config.stages.includes('distribution') && currentEvent) {
        try {
          // Emit to real-time store and WebSocket
          this.distributeEvent(currentEvent);
          stagesCompleted.push('distribution');
        } catch (error) {
          stagesFailed.push('distribution');
          throw error;
        }
      }

      // Update metrics
      this.metrics.eventsProcessed++;
      this.updateProcessingTime(Date.now() - startTime);

      const result: IngestionResult = {
        success: true,
        event: currentEvent,
        sourceId,
        pipelineId: this.config.id,
        stagesCompleted,
        stagesFailed,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        errors,
        warnings,
      };

      this.emitResult(result);
      return result;

    } catch (error) {
      this.metrics.eventsFailed++;
      this.recordError(error as Error, { sourceId, eventId: event.id });

      const result: IngestionResult = {
        success: false,
        event: null,
        sourceId,
        pipelineId: this.config.id,
        stagesCompleted,
        stagesFailed,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        errors: [...errors, (error as Error).message],
        warnings,
      };

      this.emitResult(result);
      return result;
    }
  }

  private applyTransformations(event: LiveEvent): LiveEvent | null {
    let transformed = { ...event };

    for (const rule of this.transformRules) {
      // Check if rule applies to this stage
      if (rule.stage !== 'transformation') continue;

      // Check condition
      if (rule.condition && !rule.condition(transformed)) continue;

      // Apply transformation
      const result = rule.transform(transformed);
      
      // If transformation returns null, filter out the event
      if (result === null) {
        return null;
      }

      transformed = result;
    }

    return transformed;
  }

  private applyFilters(event: LiveEvent): boolean {
    for (const rule of this.filterRules) {
      const value = this.getFieldValue(event, rule.field);
      
      if (!this.evaluateFilter(value, rule.operator, rule.value)) {
        return false;
      }
    }
    return true;
  }

  private evaluateFilter(value: unknown, operator: FilterRule['operator'], compareValue: unknown): boolean {
    switch (operator) {
      case 'eq':
        return value === compareValue;
      case 'ne':
        return value !== compareValue;
      case 'gt':
        return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue;
      case 'gte':
        return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue;
      case 'lt':
        return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue;
      case 'lte':
        return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue;
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);
      case 'contains':
        return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue);
      case 'regex':
        return typeof value === 'string' && compareValue instanceof RegExp && compareValue.test(value);
      default:
        return true;
    }
  }

  private getFieldValue(obj: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let current: unknown = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    
    return current;
  }

  private distributeEvent(event: LiveEvent): void {
    // Import store and update it
    // This connects to TL-S4-3-A WebSocket system and TL-S1 lenses
    const { useRealtimeStore } = require('../store');
    const store = useRealtimeStore.getState();
    store.addEvent(event.matchId, event);
  }

  // =============================================================================
  // Private Methods - Metrics & Events
  // =============================================================================

  private updateProcessingTime(time: number): void {
    const n = this.metrics.eventsProcessed;
    this.metrics.averageProcessingTime = 
      ((this.metrics.averageProcessingTime * (n - 1)) + time) / n;
    
    // Calculate throughput
    const uptime = (Date.now() - this.startTime) / 1000;
    this.metrics.throughputPerSecond = uptime > 0 ? this.metrics.eventsProcessed / uptime : 0;
  }

  private recordError(error: Error, context?: Record<string, unknown>): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      message: error.message,
    });

    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }

    // Calculate error rate (errors per minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp > oneMinuteAgo).length;
    this.metrics.errorRate = recentErrors;

    // Emit to handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (e) {
        engineLogger.error('Error in error handler:', e);
      }
    });
  }

  private emitResult(result: IngestionResult): void {
    this.resultHandlers.forEach(handler => {
      try {
        handler(result);
      } catch (error) {
        engineLogger.error('Error in result handler:', error);
      }
    });
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create an ingestion engine
 */
export function createEngine(config?: Partial<EngineConfig>): DataIngestionEngine {
  return new DataIngestionEngine(config);
}

/**
 * Create a transform rule
 */
export function createTransformRule(
  id: string,
  name: string,
  transform: TransformRule['transform'],
  options?: Partial<Omit<TransformRule, 'id' | 'name' | 'transform'>>
): TransformRule {
  return {
    id,
    name,
    stage: 'transformation',
    transform,
    priority: 0,
    ...options,
  };
}

/**
 * Create a filter rule
 */
export function createFilterRule(
  id: string,
  field: string,
  operator: FilterRule['operator'],
  value: unknown
): FilterRule {
  return { id, field, operator, value };
}

// =============================================================================
// Singleton Instance
// =============================================================================

let defaultEngine: DataIngestionEngine | null = null;

export function getDefaultEngine(): DataIngestionEngine {
  if (!defaultEngine) {
    defaultEngine = new DataIngestionEngine();
  }
  return defaultEngine;
}

export function resetDefaultEngine(): void {
  defaultEngine?.stop();
  defaultEngine = null;
}

// =============================================================================
// Default Export
// =============================================================================

export default DataIngestionEngine;
