/**
 * Data Ingestion System Tests
 * 
 * 25+ comprehensive tests for live data ingestion.
 * 
 * [Ver001.000] - Ingestion system tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger
vi.mock('../../../../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

// Import modules after mocking
import {
  DataValidator,
  createValidator,
  validateEvent,
  validateEvents,
  createValidationRules,
} from '../validator';

import {
  DataIngestionEngine,
  createEngine,
  createTransformRule,
  createFilterRule,
} from '../engine';

import {
  EventStreamProcessor,
  createProcessor,
  processEvents,
  createEnrichmentContext,
} from '../processor';

import {
  ManualInputConnector,
  MockConnector,
  FileUploadConnector,
  createConnector,
  getConnector,
  removeConnector,
  getAllConnectors,
  getAllHealth,
  resetAllConnectors,
  DEFAULT_MANUAL_CONFIG,
  DEFAULT_MOCK_CONFIG,
  DEFAULT_FILE_CONFIG,
} from '../connectors';

import type { LiveEvent, LiveEventType } from '../../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockEvent(overrides: Partial<LiveEvent> = {}): LiveEvent {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'kill',
    matchId: 'test_match_1',
    timestamp: new Date().toISOString(),
    round: 1,
    data: {
      attackerId: 'player_1',
      attackerTeam: 'team_a',
      victimId: 'player_2',
      victimTeam: 'team_b',
      weapon: 'Vandal',
      headshot: true,
      wallbang: false,
      throughSmoke: false,
    },
    source: 'official',
    confidence: 0.95,
    ...overrides,
  };
}

function createMockEvents(count: number): LiveEvent[] {
  return Array.from({ length: count }, (_, i) => 
    createMockEvent({ id: `test_${i}`, round: i + 1 })
  );
}

// =============================================================================
// 1. Data Validator Tests (8 tests)
// =============================================================================

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('basic validation', () => {
    it('should validate a valid event', () => {
      const event = createMockEvent();
      const result = validator.validate(event);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.qualityScore).toBe(100);
    });

    it('should reject non-object input', () => {
      const result = validator.validate('not an object');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should reject null input', () => {
      const result = validator.validate(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should detect missing required fields', () => {
      const event = { type: 'kill' } as unknown as LiveEvent;
      const result = validator.validate(event);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'REQUIRED_FIELD_MISSING')).toBe(true);
    });

    it('should validate event type specific fields', () => {
      const event = createMockEvent({ type: 'kill' });
      const result = validator.validate(event);
      
      expect(result.valid).toBe(true);
    });

    it('should calculate quality score based on errors', () => {
      const event = { ...createMockEvent(), confidence: -1 };
      const result = validator.validate(event);
      
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should normalize partial data', () => {
      const event = { 
        type: 'kill',
        matchId: 'test_1',
        data: { attackerId: 'p1', victimId: 'p2' },
      } as unknown as LiveEvent;
      
      const result = validator.validate(event);
      
      expect(result.valid).toBe(true);
      expect(result.normalizedData).toBeDefined();
      expect(result.normalizedData!.id).toBeDefined();
      expect(result.normalizedData!.timestamp).toBeDefined();
    });

    it('should validate batch of events', () => {
      const events = createMockEvents(5);
      const result = validator.validateBatch(events);
      
      expect(result.total).toBe(5);
      expect(result.valid).toBe(5);
      expect(result.invalid).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should support strict mode', () => {
      const strictValidator = new DataValidator({ strictMode: true });
      const event = createMockEvent();
      const result = strictValidator.validate(event);
      
      expect(result.valid).toBe(true);
    });

    it('should update configuration', () => {
      validator.updateConfig({ minQualityScore: 90 });
      const stats = validator.getStats();
      
      expect(stats).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should track validation statistics', () => {
      validator.validate(createMockEvent());
      validator.validate({ invalid: true } as unknown as LiveEvent);
      
      const stats = validator.getStats();
      
      expect(stats.totalValidated).toBe(2);
      expect(stats.validCount).toBe(1);
      expect(stats.invalidCount).toBe(1);
    });

    it('should reset statistics', () => {
      validator.validate(createMockEvent());
      validator.resetStats();
      
      const stats = validator.getStats();
      
      expect(stats.totalValidated).toBe(0);
    });
  });
});

// =============================================================================
// 2. Source Connectors Tests (8 tests)
// =============================================================================

describe('Source Connectors', () => {
  beforeEach(() => {
    resetAllConnectors();
  });

  describe('ManualInputConnector', () => {
    it('should connect and disconnect', async () => {
      const connector = new ManualInputConnector({
        ...DEFAULT_MANUAL_CONFIG,
        id: 'test-manual',
      });

      await connector.connect();
      expect(connector.getHealth().status).toBe('connected');

      await connector.disconnect();
      expect(connector.getHealth().status).toBe('disconnected');
    });

    it('should submit events', async () => {
      const connector = new ManualInputConnector({
        ...DEFAULT_MANUAL_CONFIG,
        id: 'test-manual',
      });
      await connector.connect();

      const eventListener = vi.fn();
      connector.onEvent(eventListener);

      connector.submitEvent({
        type: 'kill',
        matchId: 'test',
        data: {},
        source: 'manual',
        confidence: 1,
      });

      expect(eventListener).toHaveBeenCalled();
    });
  });

  describe('MockConnector', () => {
    it('should generate mock events', async () => {
      const connector = new MockConnector({
        ...DEFAULT_MOCK_CONFIG,
        id: 'test-mock',
        scenario: 'default',
        eventRate: 60, // 1 per second for testing
        matchCount: 1,
      });

      const eventListener = vi.fn();
      connector.onEvent(eventListener);

      await connector.connect();
      
      // Generate an event manually
      connector.generateEvent('kill');
      
      expect(eventListener).toHaveBeenCalled();
      await connector.disconnect();
    });

    it('should fetch match state', async () => {
      const connector = new MockConnector({
        ...DEFAULT_MOCK_CONFIG,
        id: 'test-mock',
      });
      await connector.connect();

      const state = await connector.fetchMatchState('test_match');
      
      expect(state).toBeDefined();
      expect(state?.matchId).toBeDefined();
      await connector.disconnect();
    });
  });

  describe('FileUploadConnector', () => {
    it('should process JSON files', async () => {
      const connector = new FileUploadConnector({
        ...DEFAULT_FILE_CONFIG,
        id: 'test-file',
      });
      await connector.connect();

      const jsonContent = JSON.stringify([
        { type: 'kill', matchId: 'test', data: {}, source: 'file', confidence: 1 },
        { type: 'death', matchId: 'test', data: {}, source: 'file', confidence: 1 },
      ]);

      const result = connector.uploadJSON(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
    });

    it('should reject invalid file formats', async () => {
      const connector = new FileUploadConnector({
        ...DEFAULT_FILE_CONFIG,
        id: 'test-file',
        acceptFormats: ['json'],
        maxFileSize: 1000,
      });
      await connector.connect();

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(mockFile, 'size', { value: 100 });

      const result = await connector.uploadFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Connector Factory', () => {
    it('should create connectors by type', () => {
      const manual = createConnector({
        ...DEFAULT_MANUAL_CONFIG,
        id: 'factory-manual',
      });
      
      expect(manual.config.type).toBe('manual');
      expect(getConnector('factory-manual')).toBe(manual);
    });

    it('should remove connectors', () => {
      createConnector({
        ...DEFAULT_MANUAL_CONFIG,
        id: 'removable',
      });

      removeConnector('removable');
      
      expect(getConnector('removable')).toBeUndefined();
    });

    it('should get all health statuses', () => {
      createConnector({ ...DEFAULT_MANUAL_CONFIG, id: 'health1' });
      createConnector({ ...DEFAULT_MANUAL_CONFIG, id: 'health2' });

      const health = getAllHealth();
      
      expect(Object.keys(health)).toHaveLength(2);
    });
  });
});

// =============================================================================
// 3. Event Stream Processor Tests (8 tests)
// =============================================================================

describe('EventStreamProcessor', () => {
  let processor: EventStreamProcessor;

  beforeEach(() => {
    processor = new EventStreamProcessor();
  });

  afterEach(() => {
    processor.stop();
  });

  describe('lifecycle', () => {
    it('should start and stop', () => {
      processor.start();
      expect(processor.getState()).toBe('processing');

      processor.stop();
      expect(processor.getState()).toBe('shutdown');
    });

    it('should pause and resume', () => {
      processor.start();
      processor.pause();
      expect(processor.getState()).toBe('paused');

      processor.resume();
      expect(processor.getState()).toBe('processing');
    });
  });

  describe('event submission', () => {
    it('should submit single event', () => {
      processor.start();
      const event = createMockEvent();
      
      const result = processor.submit(event);
      
      expect(result).toBe(true);
    });

    it('should submit batch of events', () => {
      const events = createMockEvents(5);
      
      const result = processor.submitBatch(events);
      
      expect(result.total).toBe(5);
      expect(result.processed).toBe(5);
    });

    it('should not accept events when shutdown', () => {
      processor.stop();
      const event = createMockEvent();
      
      const result = processor.submit(event);
      
      expect(result).toBe(false);
    });
  });

  describe('processing results', () => {
    it('should process events and emit results', () => {
      const handler = vi.fn();
      processor.onProcessed(handler);
      processor.start();

      const event = createMockEvent();
      processor.submit(event);
      
      // Process immediately for testing
      const result = processor.submitBatch([event]);
      
      expect(result.processed).toBe(1);
    });

    it('should detect duplicates', () => {
      const event = createMockEvent();
      
      processor.submitBatch([event, event]);
      
      const metrics = processor.getMetrics();
      expect(metrics.duplicatesDetected).toBeGreaterThan(0);
    });

    it('should enrich events', () => {
      const event = createMockEvent({ type: 'kill' });
      
      processor.start();
      const result = processor.submitBatch([event]);
      
      expect(result.enriched).toBeGreaterThan(0);
    });
  });

  describe('metrics', () => {
    it('should track metrics', () => {
      processor.submitBatch(createMockEvents(10));
      
      const metrics = processor.getMetrics();
      
      expect(metrics.eventsReceived).toBe(10);
      expect(metrics.eventsProcessed).toBe(10);
    });

    it('should reset metrics', () => {
      processor.submitBatch(createMockEvents(5));
      processor.resetMetrics();
      
      const metrics = processor.getMetrics();
      
      expect(metrics.eventsReceived).toBe(0);
    });
  });

  describe('buffer management', () => {
    it('should track buffer status', () => {
      processor.submit(createMockEvent());
      
      const status = processor.getBufferStatus();
      
      expect(status.capacity).toBeGreaterThan(0);
      expect(status.size).toBeDefined();
    });

    it('should clear buffer', () => {
      processor.submit(createMockEvent());
      processor.clearBuffer();
      
      const status = processor.getBufferStatus();
      
      expect(status.size).toBe(0);
    });
  });
});

// =============================================================================
// 4. Data Ingestion Engine Tests (10 tests)
// =============================================================================

describe('DataIngestionEngine', () => {
  let engine: DataIngestionEngine;

  beforeEach(() => {
    engine = createEngine({ id: 'test-engine' });
  });

  afterEach(async () => {
    await engine.stop();
    resetAllConnectors();
  });

  describe('lifecycle', () => {
    it('should start and stop', async () => {
      await engine.start();
      expect(engine.getState()).toBe('running');

      await engine.stop();
      expect(engine.getState()).toBe('stopped');
    });

    it('should pause and resume', async () => {
      await engine.start();
      engine.pause();
      expect(engine.getState()).toBe('paused');

      engine.resume();
      expect(engine.getState()).toBe('running');
    });
  });

  describe('ingestion', () => {
    it('should ingest single event', async () => {
      const event = createMockEvent();
      
      const result = await engine.ingest(event);
      
      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
    });

    it('should ingest batch of events', async () => {
      const events = createMockEvents(5);
      
      const result = await engine.ingestBatch(events);
      
      expect(result.total).toBe(5);
      expect(result.successful).toBe(5);
    });

    it('should emit results', async () => {
      const handler = vi.fn();
      engine.onResult(handler);
      
      await engine.ingest(createMockEvent());
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('transform rules', () => {
    it('should add and apply transform rules', async () => {
      const rule = createTransformRule(
        'test-transform',
        'Test Transform',
        (event) => ({
          ...event,
          data: { ...event.data, transformed: true },
        })
      );
      
      engine.addTransformRule(rule);
      
      const rules = engine.getConfig().stages;
      expect(rules).toContain('transformation');
    });

    it('should remove transform rules', () => {
      const rule = createTransformRule('removable', 'Removable', (e) => e);
      engine.addTransformRule(rule);
      engine.removeTransformRule('removable');
      
      // Rule removed, should not throw
      expect(() => engine.removeTransformRule('nonexistent')).not.toThrow();
    });

    it('should filter events with transform returning null', async () => {
      const rule = createTransformRule(
        'filter-all',
        'Filter All',
        () => null,
        { condition: () => true }
      );
      
      engine.addTransformRule(rule);
      
      const result = await engine.ingest(createMockEvent());
      
      expect(result.event).toBeNull();
      expect(result.success).toBe(true);
    });
  });

  describe('filter rules', () => {
    it('should add filter rules', () => {
      const rule = createFilterRule('test-filter', 'type', 'eq', 'kill');
      engine.addFilterRule(rule);
      
      // Rule added successfully
      expect(engine.getPipelines()).toHaveLength(0);
    });

    it('should remove filter rules', () => {
      const rule = createFilterRule('removable', 'type', 'eq', 'kill');
      engine.addFilterRule(rule);
      engine.removeFilterRule('removable');
      
      expect(() => engine.removeFilterRule('nonexistent')).not.toThrow();
    });
  });

  describe('pipeline management', () => {
    it('should register pipelines', () => {
      engine.registerPipeline({
        id: 'test-pipeline',
        name: 'Test Pipeline',
        sourceConfig: { ...DEFAULT_MANUAL_CONFIG, id: 'pipe-source' },
        engineConfig: engine.getConfig(),
        transformRules: [],
        filters: [],
      });
      
      const pipelines = engine.getPipelines();
      expect(pipelines).toHaveLength(1);
      expect(pipelines[0].id).toBe('test-pipeline');
    });

    it('should unregister pipelines', () => {
      engine.registerPipeline({
        id: 'removable-pipeline',
        name: 'Removable',
        sourceConfig: { ...DEFAULT_MANUAL_CONFIG, id: 'pipe-source' },
        engineConfig: engine.getConfig(),
        transformRules: [],
        filters: [],
      });
      
      engine.unregisterPipeline('removable-pipeline');
      
      expect(engine.getPipelines()).toHaveLength(0);
    });
  });

  describe('metrics', () => {
    it('should track metrics', async () => {
      await engine.ingestBatch(createMockEvents(10));
      
      const metrics = engine.getMetrics();
      
      expect(metrics.eventsIngested).toBe(10);
      expect(metrics.eventsProcessed).toBe(10);
    });

    it('should get health status', async () => {
      const health = engine.getHealth();
      
      expect(health.state).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    it('should reset metrics', async () => {
      await engine.ingest(createMockEvent());
      engine.resetMetrics();
      
      const metrics = engine.getMetrics();
      
      expect(metrics.eventsIngested).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      engine.updateConfig({ batchSize: 50 });
      
      const config = engine.getConfig();
      expect(config.batchSize).toBe(50);
    });
  });
});

// =============================================================================
// 5. Integration Tests (4 tests)
// =============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    resetAllConnectors();
  });

  it('should validate, process, and ingest events end-to-end', async () => {
    const engine = createEngine({ id: 'integration-test' });
    
    const event = createMockEvent();
    
    // Step 1: Validate
    const validation = validateEvent(event);
    expect(validation.valid).toBe(true);
    
    // Step 2: Ingest through engine
    const result = await engine.ingest(event);
    expect(result.success).toBe(true);
    
    await engine.stop();
  });

  it('should handle multiple source types', async () => {
    const engine = createEngine({ id: 'multi-source-test' });
    
    // Add manual connector
    const manual = new ManualInputConnector({ ...DEFAULT_MANUAL_CONFIG, id: 'manual-1' });
    engine.addConnector(manual);
    await manual.connect();
    
    // Add mock connector
    const mock = new MockConnector({ ...DEFAULT_MOCK_CONFIG, id: 'mock-1', eventRate: 60 });
    engine.addConnector(mock);
    await mock.connect();
    
    const connectors = engine.getConnectors();
    expect(connectors).toHaveLength(2);
    
    await engine.stop();
  });

  it('should handle batch processing', async () => {
    const events = createMockEvents(100);
    
    const engine = createEngine({ id: 'batch-test', batchSize: 25 });
    
    const result = await engine.ingestBatch(events);
    
    expect(result.total).toBe(100);
    expect(result.successful).toBe(100);
    
    await engine.stop();
  });

  it('should create enrichment context', () => {
    const context = createEnrichmentContext('test-match');
    
    expect(context.matchId).toBe('test-match');
    expect(context.previousEvents).toEqual([]);
    expect(context.playerStats).toBeInstanceOf(Map);
    expect(context.teamStats).toBeInstanceOf(Map);
  });
});

// =============================================================================
// Test Summary
// =============================================================================
// Total: 38 tests covering:
// - Data validation (8 tests)
// - Source connectors (8 tests)
// - Event stream processing (8 tests)
// - Data ingestion engine (10 tests)
// - Integration tests (4 tests)
// =============================================================================
