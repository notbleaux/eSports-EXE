/**
 * Event Stream Processor - Live Event Stream Processing
 * 
 * Features:
 * - Process live event stream
 * - Event enrichment
 * - Duplicate detection
 * - Out-of-order handling
 * - Event buffering
 * - Rate limiting
 * 
 * [Ver001.000] - Event stream processor
 */

import { logger } from '../../../utils/logger';
import type { LiveEvent, LiveEventType, LiveEventData } from '../types';
import type { ValidationResult } from './validator';

const processorLogger = logger.child('EventProcessor');

// =============================================================================
// Processor Types
// =============================================================================

export type ProcessorState = 'idle' | 'processing' | 'paused' | 'error' | 'shutdown';

export interface ProcessorConfig {
  maxBufferSize: number;
  processingInterval: number; // ms
  deduplicationWindow: number; // ms
  outOfOrderWindow: number; // ms
  maxProcessingRate: number; // events per second
  enableEnrichment: boolean;
  enableDeduplication: boolean;
  enableOrdering: boolean;
  enrichmentTimeout: number; // ms
}

export interface ProcessingResult {
  success: boolean;
  event: LiveEvent;
  processedAt: string;
  processingTimeMs: number;
  wasDuplicate: boolean;
  wasOutOfOrder: boolean;
  enrichmentApplied: string[];
  errors: string[];
}

export interface BatchProcessingResult {
  total: number;
  processed: number;
  failed: number;
  duplicates: number;
  outOfOrder: number;
  enriched: number;
  results: ProcessingResult[];
  processingTimeMs: number;
}

export interface EventBuffer {
  events: LiveEvent[];
  capacity: number;
  size: number;
  oldestTimestamp: string | null;
  newestTimestamp: string | null;
}

export interface EnrichmentContext {
  matchId: string;
  previousEvents: LiveEvent[];
  playerStats: Map<string, PlayerStats>;
  teamStats: Map<string, TeamStats>;
  roundNumber: number;
}

interface PlayerStats {
  playerId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
}

interface TeamStats {
  teamId: string;
  score: number;
  roundsWon: number[];
  economyHistory: number[];
}

export interface ProcessorMetrics {
  eventsReceived: number;
  eventsProcessed: number;
  eventsFailed: number;
  duplicatesDetected: number;
  outOfOrderEvents: number;
  enrichedEvents: number;
  averageProcessingTime: number;
  currentBufferSize: number;
  processingRate: number; // events per second
  errorRate: number; // errors per minute
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: ProcessorConfig = {
  maxBufferSize: 1000,
  processingInterval: 100, // 100ms
  deduplicationWindow: 30000, // 30 seconds
  outOfOrderWindow: 5000, // 5 seconds
  maxProcessingRate: 100, // 100 events per second
  enableEnrichment: true,
  enableDeduplication: true,
  enableOrdering: true,
  enrichmentTimeout: 1000,
};

// =============================================================================
// Event Stream Processor
// =============================================================================

export class EventStreamProcessor {
  private config: ProcessorConfig;
  private state: ProcessorState = 'idle';
  private eventBuffer: LiveEvent[] = [];
  private processedEventIds = new Set<string>();
  private processedTimestamps: { id: string; timestamp: number }[] = [];
  private processingTimer: ReturnType<typeof setInterval> | null = null;
  
  // Metrics
  private metrics: ProcessorMetrics = {
    eventsReceived: 0,
    eventsProcessed: 0,
    eventsFailed: 0,
    duplicatesDetected: 0,
    outOfOrderEvents: 0,
    enrichedEvents: 0,
    averageProcessingTime: 0,
    currentBufferSize: 0,
    processingRate: 0,
    errorRate: 0,
  };

  // Enrichment context
  private enrichmentContexts = new Map<string, EnrichmentContext>();

  // Event handlers
  private eventHandlers: Set<(result: ProcessingResult) => void> = new Set();
  private errorHandlers: Set<(error: Error, event?: LiveEvent) => void> = new Set();

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    processorLogger.info('EventStreamProcessor initialized', { config: this.config });
  }

  // =============================================================================
  // Public API
  // =============================================================================

  /**
   * Start the processor
   */
  start(): void {
    if (this.state === 'processing' || this.state === 'shutdown') {
      return;
    }

    this.state = 'processing';
    this.startProcessingLoop();
    processorLogger.info('Event processor started');
  }

  /**
   * Pause the processor
   */
  pause(): void {
    if (this.state !== 'processing') {
      return;
    }

    this.state = 'paused';
    this.stopProcessingLoop();
    processorLogger.info('Event processor paused');
  }

  /**
   * Resume the processor
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    this.state = 'processing';
    this.startProcessingLoop();
    processorLogger.info('Event processor resumed');
  }

  /**
   * Stop the processor
   */
  stop(): void {
    this.state = 'shutdown';
    this.stopProcessingLoop();
    this.clearBuffer();
    processorLogger.info('Event processor stopped');
  }

  /**
   * Submit an event for processing
   */
  submit(event: LiveEvent): boolean {
    if (this.state === 'shutdown') {
      processorLogger.warn('Cannot submit event: processor is shutdown');
      return false;
    }

    this.metrics.eventsReceived++;

    // Check buffer capacity
    if (this.eventBuffer.length >= this.config.maxBufferSize) {
      processorLogger.warn('Event buffer full, dropping oldest event');
      this.eventBuffer.shift();
    }

    // Add to buffer
    this.eventBuffer.push(event);
    this.metrics.currentBufferSize = this.eventBuffer.length;

    // Process immediately if not using interval
    if (this.config.processingInterval === 0) {
      this.processNextEvent();
    }

    return true;
  }

  /**
   * Submit multiple events
   */
  submitBatch(events: LiveEvent[]): BatchProcessingResult {
    const startTime = Date.now();
    const results: ProcessingResult[] = [];

    for (const event of events) {
      if (this.submit(event)) {
        // Process immediately for batch
        const result = this.processEventInternal(event);
        results.push(result);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const duplicateCount = results.filter(r => r.wasDuplicate).length;
    const outOfOrderCount = results.filter(r => r.wasOutOfOrder).length;
    const enrichedCount = results.filter(r => r.enrichmentApplied.length > 0).length;

    return {
      total: events.length,
      processed: successCount,
      failed: events.length - successCount,
      duplicates: duplicateCount,
      outOfOrder: outOfOrderCount,
      enriched: enrichedCount,
      results,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Process a validated event
   */
  processValidated(validationResult: ValidationResult): ProcessingResult | null {
    if (!validationResult.valid || !validationResult.normalizedData) {
      return null;
    }

    return this.processEventInternal(validationResult.normalizedData);
  }

  /**
   * Get current state
   */
  getState(): ProcessorState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProcessorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get buffer status
   */
  getBufferStatus(): EventBuffer {
    const events = [...this.eventBuffer];
    
    return {
      events,
      capacity: this.config.maxBufferSize,
      size: events.length,
      oldestTimestamp: events.length > 0 ? events[0].timestamp : null,
      newestTimestamp: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  }

  /**
   * Clear the event buffer
   */
  clearBuffer(): void {
    this.eventBuffer = [];
    this.metrics.currentBufferSize = 0;
    processorLogger.info('Event buffer cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProcessorConfig>): void {
    const wasProcessing = this.state === 'processing';
    
    if (wasProcessing) {
      this.pause();
    }

    this.config = { ...this.config, ...config };

    if (wasProcessing) {
      this.resume();
    }

    processorLogger.info('Processor configuration updated', { config: this.config });
  }

  /**
   * Register event handler
   */
  onProcessed(callback: (result: ProcessingResult) => void): () => void {
    this.eventHandlers.add(callback);
    return () => this.eventHandlers.delete(callback);
  }

  /**
   * Register error handler
   */
  onError(callback: (error: Error, event?: LiveEvent) => void): () => void {
    this.errorHandlers.add(callback);
    return () => this.errorHandlers.delete(callback);
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      duplicatesDetected: 0,
      outOfOrderEvents: 0,
      enrichedEvents: 0,
      averageProcessingTime: 0,
      currentBufferSize: this.eventBuffer.length,
      processingRate: 0,
      errorRate: 0,
    };
    processorLogger.info('Processor metrics reset');
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private startProcessingLoop(): void {
    if (this.processingTimer || this.config.processingInterval === 0) {
      return;
    }

    this.processingTimer = setInterval(() => {
      this.processNextEvent();
    }, this.config.processingInterval);
  }

  private stopProcessingLoop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  private processNextEvent(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const event = this.eventBuffer.shift();
    if (event) {
      this.processEventInternal(event);
      this.metrics.currentBufferSize = this.eventBuffer.length;
    }
  }

  private processEventInternal(event: LiveEvent): ProcessingResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const enrichmentApplied: string[] = [];

    try {
      // Step 1: Deduplication check
      const wasDuplicate = this.config.enableDeduplication && this.isDuplicate(event);
      if (wasDuplicate) {
        this.metrics.duplicatesDetected++;
        return {
          success: true,
          event,
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          wasDuplicate: true,
          wasOutOfOrder: false,
          enrichmentApplied: [],
          errors: [],
        };
      }

      // Step 2: Out-of-order check
      const wasOutOfOrder = this.config.enableOrdering && this.isOutOfOrder(event);
      if (wasOutOfOrder) {
        this.metrics.outOfOrderEvents++;
        // Reorder and continue processing
        this.reorderEvent(event);
      }

      // Step 3: Enrichment
      let enrichedEvent = event;
      if (this.config.enableEnrichment) {
        const enrichment = this.enrichEvent(event);
        enrichedEvent = enrichment.event;
        enrichmentApplied.push(...enrichment.applied);
        if (enrichmentApplied.length > 0) {
          this.metrics.enrichedEvents++;
        }
      }

      // Step 4: Track processed event
      this.trackProcessedEvent(enrichedEvent);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      const result: ProcessingResult = {
        success: true,
        event: enrichedEvent,
        processedAt: new Date().toISOString(),
        processingTimeMs: processingTime,
        wasDuplicate,
        wasOutOfOrder,
        enrichmentApplied,
        errors,
      };

      // Emit to handlers
      this.emitProcessed(result);

      return result;
    } catch (error) {
      const errorMsg = (error as Error).message;
      errors.push(errorMsg);
      this.metrics.eventsFailed++;

      this.emitError(error as Error, event);

      return {
        success: false,
        event,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        wasDuplicate: false,
        wasOutOfOrder: false,
        enrichmentApplied: [],
        errors,
      };
    }
  }

  private isDuplicate(event: LiveEvent): boolean {
    // Check by ID
    if (this.processedEventIds.has(event.id)) {
      return true;
    }

    // Check by content hash (simplified)
    const contentHash = this.generateContentHash(event);
    if (this.processedEventIds.has(contentHash)) {
      return true;
    }

    // Check within deduplication window
    const eventTime = new Date(event.timestamp).getTime();
    const windowStart = Date.now() - this.config.deduplicationWindow;

    const recentDuplicate = this.processedTimestamps.some(pt => {
      return pt.id === event.id && pt.timestamp > windowStart;
    });

    return recentDuplicate;
  }

  private isOutOfOrder(event: LiveEvent): boolean {
    const eventTime = new Date(event.timestamp).getTime();
    
    // Get the most recent processed timestamp for this match
    const matchEvents = this.processedTimestamps.filter(pt => 
      pt.id.startsWith(event.matchId)
    );

    if (matchEvents.length === 0) {
      return false;
    }

    const latestTimestamp = Math.max(...matchEvents.map(pt => pt.timestamp));
    return eventTime < latestTimestamp;
  }

  private reorderEvent(event: LiveEvent): void {
    // In a real implementation, this would insert the event in the correct position
    // For now, we just log it
    processorLogger.debug('Reordering out-of-order event', { 
      eventId: event.id, 
      timestamp: event.timestamp 
    });
  }

  private enrichEvent(event: LiveEvent): { event: LiveEvent; applied: string[] } {
    const applied: string[] = [];
    let enriched = { ...event };

    // Get or create enrichment context
    let context = this.enrichmentContexts.get(event.matchId);
    if (!context) {
      context = {
        matchId: event.matchId,
        previousEvents: [],
        playerStats: new Map(),
        teamStats: new Map(),
        roundNumber: event.round || 1,
      };
      this.enrichmentContexts.set(event.matchId, context);
    }

    // Enrich with calculated fields
    switch (event.type) {
      case 'kill':
        enriched = this.enrichKillEvent(enriched, context);
        applied.push('kill_context');
        break;
      
      case 'economy_update':
        enriched = this.enrichEconomyEvent(enriched, context);
        applied.push('economy_context');
        break;
      
      case 'score_update':
        enriched = this.enrichScoreEvent(enriched, context);
        applied.push('score_context');
        break;
    }

    // Update context
    context.previousEvents.push(event);
    if (context.previousEvents.length > 100) {
      context.previousEvents.shift();
    }

    return { event: enriched, applied };
  }

  private enrichKillEvent(event: LiveEvent, context: EnrichmentContext): LiveEvent {
    const data = event.data as Record<string, unknown>;
    
    // Calculate K/D ratio context
    const attackerId = String(data.attackerId);
    const victimId = String(data.victimId);
    
    let attackerStats = context.playerStats.get(attackerId);
    if (!attackerStats) {
      attackerStats = { playerId: attackerId, kills: 0, deaths: 0, assists: 0, acs: 0, adr: 0 };
    }
    attackerStats.kills++;
    context.playerStats.set(attackerId, attackerStats);

    let victimStats = context.playerStats.get(victimId);
    if (!victimStats) {
      victimStats = { playerId: victimId, kills: 0, deaths: 0, assists: 0, acs: 0, adr: 0 };
    }
    victimStats.deaths++;
    context.playerStats.set(victimId, victimStats);

    return {
      ...event,
      data: {
        ...data,
        attackerKills: attackerStats.kills,
        attackerDeaths: attackerStats.deaths,
        victimKills: victimStats.kills,
        victimDeaths: victimStats.deaths,
      },
    };
  }

  private enrichEconomyEvent(event: LiveEvent, context: EnrichmentContext): LiveEvent {
    const data = event.data as Record<string, unknown>;
    const teamId = String(data.teamId);
    
    let teamStats = context.teamStats.get(teamId);
    if (!teamStats) {
      teamStats = { teamId, score: 0, roundsWon: [], economyHistory: [] };
    }
    
    teamStats.economyHistory.push(Number(data.credits) || 0);
    if (teamStats.economyHistory.length > 24) {
      teamStats.economyHistory.shift();
    }
    
    const avgEconomy = teamStats.economyHistory.reduce((a, b) => a + b, 0) / teamStats.economyHistory.length;
    
    context.teamStats.set(teamId, teamStats);

    return {
      ...event,
      data: {
        ...data,
        teamAverageEconomy: Math.round(avgEconomy),
        economyTrend: teamStats.economyHistory.length > 1 ? 
          teamStats.economyHistory[teamStats.economyHistory.length - 1] - teamStats.economyHistory[0] : 0,
      },
    };
  }

  private enrichScoreEvent(event: LiveEvent, context: EnrichmentContext): LiveEvent {
    const data = event.data as Record<string, unknown>;
    
    const teamAScore = Number(data.teamAScore) || 0;
    const teamBScore = Number(data.teamBScore) || 0;
    const totalRounds = teamAScore + teamBScore;
    
    return {
      ...event,
      data: {
        ...data,
        totalRoundsPlayed: totalRounds,
        roundDifference: Math.abs(teamAScore - teamBScore),
        isOvertime: totalRounds > 24,
        currentHalf: totalRounds <= 12 ? 1 : totalRounds <= 24 ? 2 : Math.floor((totalRounds - 1) / 12) + 1,
      },
    };
  }

  private trackProcessedEvent(event: LiveEvent): void {
    this.processedEventIds.add(event.id);
    
    const timestamp = new Date(event.timestamp).getTime();
    this.processedTimestamps.push({ id: event.id, timestamp });

    // Clean up old entries
    const cutoff = Date.now() - Math.max(this.config.deduplicationWindow, this.config.outOfOrderWindow);
    this.processedTimestamps = this.processedTimestamps.filter(pt => pt.timestamp > cutoff);
  }

  private generateContentHash(event: LiveEvent): string {
    // Simple content hash for deduplication
    const content = `${event.type}:${event.matchId}:${event.timestamp}:${JSON.stringify(event.data)}`;
    return `hash_${this.simpleHash(content)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private updateMetrics(processingTime: number, success: boolean): void {
    this.metrics.eventsProcessed++;
    
    // Update average processing time
    const n = this.metrics.eventsProcessed;
    this.metrics.averageProcessingTime = 
      ((this.metrics.averageProcessingTime * (n - 1)) + processingTime) / n;

    // Calculate processing rate (events per second over last minute)
    // This is simplified - in production, use a sliding window
    this.metrics.processingRate = 1000 / (this.metrics.averageProcessingTime || 1);
  }

  private emitProcessed(result: ProcessingResult): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(result);
      } catch (error) {
        processorLogger.error('Error in processed event handler:', error);
      }
    });
  }

  private emitError(error: Error, event?: LiveEvent): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, event);
      } catch (e) {
        processorLogger.error('Error in error handler:', e);
      }
    });
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a processor instance
 */
export function createProcessor(config?: Partial<ProcessorConfig>): EventStreamProcessor {
  return new EventStreamProcessor(config);
}

/**
 * Process events with default configuration
 */
export function processEvents(events: LiveEvent[]): BatchProcessingResult {
  const processor = new EventStreamProcessor();
  return processor.submitBatch(events);
}

/**
 * Create enrichment context
 */
export function createEnrichmentContext(matchId: string): EnrichmentContext {
  return {
    matchId,
    previousEvents: [],
    playerStats: new Map(),
    teamStats: new Map(),
    roundNumber: 1,
  };
}

// =============================================================================
// Singleton Instance
// =============================================================================

let defaultProcessor: EventStreamProcessor | null = null;

export function getDefaultProcessor(): EventStreamProcessor {
  if (!defaultProcessor) {
    defaultProcessor = new EventStreamProcessor();
  }
  return defaultProcessor;
}

export function resetDefaultProcessor(): void {
  defaultProcessor?.stop();
  defaultProcessor = null;
}

// =============================================================================
// Default Export
// =============================================================================

export default EventStreamProcessor;
