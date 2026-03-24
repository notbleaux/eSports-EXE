/**
 * Data Ingestion Pipeline Tests
 * =============================
 * Comprehensive test suite for the data ingestion pipeline.
 * 
 * Tests:
 * - API client (rate limiting, retry logic, auth)
 * - Connectors (Pandascore, Liquipedia, HLTV, Manual)
 * - Transformer (normalization, schema mapping, conflicts)
 * - Batch processor (jobs, queue, progress, errors)
 * - Integration tests
 * 
 * Total: 35+ tests
 * 
 * [Ver001.000] - Ingestion pipeline tests
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// Module Imports (after mocks)
// =============================================================================

import {
  IngestionApiClient,
  IngestionApi,
  createIngestionApi,
  createApiClient,
} from '../api';

import {
  BaseDataConnector,
  PandascoreConnector,
  LiquipediaConnector,
  HLTVConnector,
  ManualUploadConnector,
  createConnector,
  getConnector,
  removeConnector,
  getAllConnectors,
  getAllHealth,
  resetAllConnectors,
  DEFAULT_PANDASCORE_CONFIG,
  DEFAULT_MANUAL_CONFIG,
} from '../connectors';

import {
  DataTransformer,
  createTransformer,
  createSchemaMapping,
} from '../transformer';

import {
  IngestionQueue,
  BatchJobManager,
  ProgressTracker,
  BatchErrorHandler,
  createBatchJobManager,
  createQueue,
  createProgressTracker,
  createErrorHandler,
} from '../batch';

import type {
  RawDataRecord,
  DataSourceConfig,
  PandascoreConfig,
  LiquipediaConfig,
  HLTVConfig,
  ManualUploadConfig,
  IngestionDataType,
  BatchJob,
  QueueItem,
} from '../types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockRawRecord(overrides: Partial<RawDataRecord> = {}): RawDataRecord {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sourceType: 'pandascore',
    sourceId: 'test-source',
    dataType: 'match',
    rawData: {
      id: 12345,
      name: 'Test Match',
      status: 'running',
    },
    fetchedAt: new Date().toISOString(),
    checksum: 'abc123',
    metadata: {
      url: 'https://api.test.com/match/12345',
      responseStatus: 200,
      responseTime: 150,
    },
    ...overrides,
  };
}

function createMockPandascoreConfig(overrides: Partial<PandascoreConfig> = {}): PandascoreConfig {
  return {
    id: `pandascore_${Date.now()}`,
    type: 'pandascore',
    name: 'Test Pandascore',
    enabled: true,
    baseUrl: 'https://api.pandascore.co',
    rateLimitPerMinute: 1000,
    retryAttempts: 3,
    timeout: 30000,
    apiKey: 'test-api-key',
    game: 'valorant',
    ...overrides,
  };
}

function createMockLiquipediaConfig(overrides: Partial<LiquipediaConfig> = {}): LiquipediaConfig {
  return {
    id: `liquipedia_${Date.now()}`,
    type: 'liquipedia',
    name: 'Test Liquipedia',
    enabled: true,
    baseUrl: 'https://api.liquipedia.net/v1',
    rateLimitPerMinute: 60,
    retryAttempts: 3,
    timeout: 30000,
    apiKey: 'test-api-key',
    game: 'valorant',
    ...overrides,
  };
}

function createMockHLTVConfig(overrides: Partial<HLTVConfig> = {}): HLTVConfig {
  return {
    id: `hltv_${Date.now()}`,
    type: 'hltv',
    name: 'Test HLTV',
    enabled: true,
    baseUrl: 'https://www.hltv.org',
    rateLimitPerMinute: 30,
    retryAttempts: 2,
    timeout: 30000,
    ...overrides,
  };
}

function createMockManualConfig(overrides: Partial<ManualUploadConfig> = {}): ManualUploadConfig {
  return {
    id: `manual_${Date.now()}`,
    type: 'manual',
    name: 'Test Manual',
    enabled: true,
    baseUrl: '',
    rateLimitPerMinute: 1000,
    retryAttempts: 0,
    timeout: 60000,
    acceptFormats: ['json', 'csv', 'xml'],
    maxFileSize: 50 * 1024 * 1024,
    ...overrides,
  };
}

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// =============================================================================
// 1. API Client Tests (8 tests)
// =============================================================================

describe('IngestionApiClient', () => {
  let client: IngestionApiClient;

  beforeEach(() => {
    client = new IngestionApiClient({
      baseUrl: 'https://api.test.com',
      apiKey: 'test-key',
      rateLimitPerSecond: 10,
      retries: 2,
      retryDelay: 100,
    });
    mockFetch.mockClear();
  });

  describe('basic requests', () => {
    it('should make GET request with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ data: 'test' }),
      });

      const response = await client.get('/test');

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });

    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ id: '123' }),
      });

      const body = { name: 'Test' };
      await client.post('/test', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({}),
      });

      await client.get('/test', { page: '1', limit: '10' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should include response metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '100'],
          ['X-Request-ID', 'req-123'],
        ]),
        json: async () => ({ data: 'test' }),
      });

      const response = await client.get('/test');

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.rateLimitRemaining).toBe(100);
      expect(response.metadata?.requestId).toBe('req-123');
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ code: 'NOT_FOUND', message: 'Resource not found' }),
      });

      const response = await client.get('/test');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const response = await client.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      }));

      const response = await client.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
          json: async () => ({ data: 'test' }),
        });

      const response = await client.get('/test');

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map(),
        json: async () => ({ code: 'BAD_REQUEST' }),
      });

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limits', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({}),
      });

      const start = Date.now();
      await Promise.all([client.get('/test1'), client.get('/test2')]);
      const elapsed = Date.now() - start;

      // With 10 req/sec limit, 2 requests should take at least 100ms
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});

// =============================================================================
// 2. Connector Tests (10 tests)
// =============================================================================

describe('Data Connectors', () => {
  beforeEach(() => {
    resetAllConnectors();
    mockFetch.mockClear();
  });

  describe('BaseDataConnector', () => {
    it('should track request metrics', async () => {
      const config = createMockPandascoreConfig();
      const connector = new PandascoreConnector(config);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ status: 'ok' }),
      });

      await connector.connect();

      const health = connector.getHealth();
      expect(health.requestsMade).toBeGreaterThan(0);
      expect(health.avgResponseTime).toBeGreaterThan(0);
    });

    it('should calculate checksums', () => {
      const config = createMockPandascoreConfig();
      const connector = new PandascoreConnector(config);

      const checksum1 = (connector as unknown as { calculateChecksum(data: unknown): string }).calculateChecksum({ test: 'data' });
      const checksum2 = (connector as unknown as { calculateChecksum(data: unknown): string }).calculateChecksum({ test: 'data' });
      const checksum3 = (connector as unknown as { calculateChecksum(data: unknown): string }).calculateChecksum({ test: 'different' });

      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
    });
  });

  describe('PandascoreConnector', () => {
    it('should connect successfully', async () => {
      const config = createMockPandascoreConfig();
      const connector = createConnector(config) as PandascoreConnector;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ status: 'ok' }),
      });

      await connector.connect();

      expect(connector.getHealth().status).toBe('active');
    });

    it('should fetch match data', async () => {
      const config = createMockPandascoreConfig();
      const connector = new PandascoreConnector(config);

      const mockMatches = [
        { id: 1, name: 'Match 1', status: 'running' },
        { id: 2, name: 'Match 2', status: 'finished' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => mockMatches,
      });

      const records = await connector.fetchData('match');

      expect(records).toHaveLength(2);
      expect(records[0].dataType).toBe('match');
      expect(records[0].sourceType).toBe('pandascore');
    });

    it('should handle rate limiting', async () => {
      const config = createMockPandascoreConfig();
      const connector = new PandascoreConnector(config);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60)],
        ]),
        json: async () => ({ error: 'Rate limited' }),
      });

      try {
        await connector.fetchData('match');
      } catch {
        // Expected
      }

      expect(connector.getHealth().status).toBe('rate_limited');
    });
  });

  describe('LiquipediaConnector', () => {
    it('should fetch player data', async () => {
      const config = createMockLiquipediaConfig();
      const connector = new LiquipediaConnector(config);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({
          data: [
            { id: 'player1', name: 'Player One' },
            { id: 'player2', name: 'Player Two' },
          ],
        }),
      });

      const records = await connector.fetchData('player');

      expect(records).toHaveLength(2);
      expect(records[0].dataType).toBe('player');
    });
  });

  describe('ManualUploadConnector', () => {
    it('should upload and parse JSON file', async () => {
      const config = createMockManualConfig();
      const connector = new ManualUploadConnector(config);

      const mockFile = new File(
        [JSON.stringify([{ id: 1, name: 'Test' }, { id: 2, name: 'Test 2' }])],
        'test.json',
        { type: 'application/json' }
      );

      Object.defineProperty(mockFile, 'size', { value: 100 });

      await connector.connect();
      const result = await connector.uploadFile(mockFile, 'match');

      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files exceeding max size', async () => {
      const config = createMockManualConfig({ maxFileSize: 100 });
      const connector = new ManualUploadConnector(config);

      const mockFile = new File(['x'.repeat(200)], 'test.json', { type: 'application/json' });
      Object.defineProperty(mockFile, 'size', { value: 200 });

      await connector.connect();
      const result = await connector.uploadFile(mockFile, 'match');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should parse CSV content', async () => {
      const config = createMockManualConfig();
      const connector = new ManualUploadConnector(config);

      const csvContent = `id,name,score
1,Team A,10
2,Team B,5`;

      await connector.connect();
      const result = connector.uploadJSON(csvContent, 'team');

      expect(result.success).toBe(true);
      expect(result.records.length).toBeGreaterThan(0);
    });
  });

  describe('Connector Factory', () => {
    it('should create connectors by type', () => {
      const pandascore = createConnector(createMockPandascoreConfig());
      const liquipedia = createConnector(createMockLiquipediaConfig());
      const hltv = createConnector(createMockHLTVConfig());

      expect(pandascore.config.type).toBe('pandascore');
      expect(liquipedia.config.type).toBe('liquipedia');
      expect(hltv.config.type).toBe('hltv');
    });

    it('should register connectors for lookup', () => {
      const config = createMockPandascoreConfig();
      const connector = createConnector(config);

      const found = getConnector(config.id);
      expect(found).toBe(connector);
    });

    it('should remove connectors', () => {
      const config = createMockPandascoreConfig();
      createConnector(config);

      removeConnector(config.id);

      expect(getConnector(config.id)).toBeUndefined();
    });

    it('should get all health statuses', () => {
      createConnector(createMockPandascoreConfig());
      createConnector(createMockLiquipediaConfig());

      const health = getAllHealth();
      expect(Object.keys(health)).toHaveLength(2);
    });
  });
});

// =============================================================================
// 3. Transformer Tests (8 tests)
// =============================================================================

describe('DataTransformer', () => {
  let transformer: DataTransformer;

  beforeEach(() => {
    transformer = new DataTransformer();
  });

  describe('data normalization', () => {
    it('should transform raw record to normalized format', () => {
      const rawRecord = createMockRawRecord({
        sourceType: 'pandascore',
        dataType: 'match',
        rawData: {
          id: 123,
          opponents: [
            { opponent: { id: 1, name: 'Team A' } },
            { opponent: { id: 2, name: 'Team B' } },
          ],
          results: [
            { team_id: 1, score: 13 },
            { team_id: 2, score: 10 },
          ],
          status: 'finished',
          scheduled_at: '2024-01-15T10:00:00Z',
        },
      });

      const normalized = transformer.transform(rawRecord);

      expect(normalized.id).toBeDefined();
      expect(normalized.sourceRecordId).toBe(rawRecord.id);
      expect(normalized.dataType).toBe('match');
      expect(normalized.normalizedData).toBeDefined();
    });

    it('should apply field mappings', () => {
      const rawRecord = createMockRawRecord({
        sourceType: 'pandascore',
        dataType: 'match',
        rawData: {
          id: 123,
          opponents: [
            { opponent: { id: 1, name: 'Team A' } },
            { opponent: { id: 2, name: 'Team B' } },
          ],
        },
      });

      const normalized = transformer.transform(rawRecord);
      const data = normalized.normalizedData as Record<string, unknown>;

      expect(data.teamAId).toBe(1);
      expect(data.teamBId).toBe(2);
      expect(data.teamAName).toBe('Team A');
      expect(data.teamBName).toBe('Team B');
    });

    it('should apply field transforms', () => {
      const rawRecord = createMockRawRecord({
        sourceType: 'pandascore',
        dataType: 'match',
        rawData: {
          id: 123,
          status: 'RUNNING',
          opponents: [
            { opponent: { id: 1, name: '  Team A  ' } },
          ],
        },
      });

      const normalized = transformer.transform(rawRecord);
      const data = normalized.normalizedData as Record<string, unknown>;

      expect(data.status).toBe('running'); // lowercase transform
      expect(data.teamAName).toBe('Team A'); // trim transform
    });

    it('should add computed fields', () => {
      const rawRecord = createMockRawRecord({
        sourceType: 'pandascore',
        dataType: 'match',
        rawData: {
          id: 123,
          opponents: [
            { opponent: { id: 1, name: 'Team A' } },
            { opponent: { id: 2, name: 'Team B' } },
          ],
          results: [
            { team_id: 1, score: 13 },
            { team_id: 2, score: 10 },
          ],
        },
      });

      const normalized = transformer.transform(rawRecord);
      const data = normalized.normalizedData as Record<string, unknown>;

      expect(data.totalRounds).toBe(23);
      expect(data.winnerId).toBe(1);
      expect(data.winnerName).toBe('Team A');
    });
  });

  describe('validation', () => {
    it('should validate against schema', () => {
      const normalized = {
        id: 'norm_123',
        sourceRecordId: 'raw_123',
        dataType: 'match' as IngestionDataType,
        normalizedData: {
          id: '123',
          sourceId: '123',
          sourceType: 'pandascore',
          teamAId: 'team1',
          teamBId: 'team2',
          status: 'running',
          game: 'valorant',
        },
        schemaVersion: '1.0.0',
        normalizedAt: new Date().toISOString(),
        conflicts: [],
        enrichments: [],
      };

      const result = transformer.validate(normalized);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const normalized = {
        id: 'norm_123',
        sourceRecordId: 'raw_123',
        dataType: 'match' as IngestionDataType,
        normalizedData: {
          id: '123',
          // Missing required fields
        },
        schemaVersion: '1.0.0',
        normalizedAt: new Date().toISOString(),
        conflicts: [],
        enrichments: [],
      };

      const result = transformer.validate(normalized);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('conflict resolution', () => {
    it('should detect conflicts with existing data', () => {
      const rawRecord = createMockRawRecord({
        dataType: 'match',
        rawData: {
          id: 123,
          teamAScore: 15,
          opponents: [{ opponent: { id: 1 } }, { opponent: { id: 2 } }],
        },
      });

      const existingData = {
        id: '123',
        teamAScore: 13,
      };

      const normalized = transformer.transform(rawRecord, existingData);

      expect(normalized.conflicts.length).toBeGreaterThan(0);
      expect(normalized.conflicts[0].field).toBe('teamAScore');
    });

    it('should resolve conflicts with source wins strategy', () => {
      const rawRecord = createMockRawRecord({
        dataType: 'match',
        rawData: {
          id: 123,
          teamAScore: 15,
          opponents: [{ opponent: { id: 1 } }, { opponent: { id: 2 } }],
        },
      });

      const existingData = { id: '123', teamAScore: 13 };
      let normalized = transformer.transform(rawRecord, existingData);
      normalized = transformer.resolveConflicts(normalized, 'source_wins');

      const data = normalized.normalizedData as Record<string, unknown>;
      expect(data.teamAScore).toBe(15);
      expect(normalized.conflicts[0].resolution).toBeDefined();
    });
  });

  describe('batch transformation', () => {
    it('should transform multiple records', () => {
      const records = [
        createMockRawRecord({ dataType: 'match', rawData: { id: 1 } }),
        createMockRawRecord({ dataType: 'match', rawData: { id: 2 } }),
        createMockRawRecord({ dataType: 'match', rawData: { id: 3 } }),
      ];

      const normalized = transformer.transformBatch(records);

      expect(normalized).toHaveLength(3);
      normalized.forEach((n, i) => {
        expect(n.sourceRecordId).toBe(records[i].id);
      });
    });
  });
});

// =============================================================================
// 4. Batch Processor Tests (8 tests)
// =============================================================================

describe('Batch Processor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('IngestionQueue', () => {
    it('should enqueue and dequeue items', () => {
      const queue = createQueue();

      const item = queue.enqueue({ test: 'data' }, 'job-1');

      expect(item.status).toBe('pending');
      expect(queue.getPendingCount()).toBe(1);

      const dequeued = queue.dequeue();

      expect(dequeued?.id).toBe(item.id);
      expect(dequeued?.status).toBe('processing');
    });

    it('should respect priority ordering', () => {
      const queue = createQueue();

      queue.enqueue({ id: 1 }, 'job-1', 1);
      queue.enqueue({ id: 2 }, 'job-1', 5);
      queue.enqueue({ id: 3 }, 'job-1', 3);

      const item1 = queue.dequeue();
      expect((item1?.data as { id: number }).id).toBe(2); // Highest priority

      const item2 = queue.dequeue();
      expect((item2?.data as { id: number }).id).toBe(3);
    });

    it('should track queue statistics', () => {
      const queue = createQueue();

      queue.enqueue({ id: 1 }, 'job-1');
      queue.enqueue({ id: 2 }, 'job-1');
      queue.dequeue();

      const stats = queue.getStats();

      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(1);
    });

    it('should retry failed items', async () => {
      const queue = createQueue({ maxRetries: 2, retryDelay: 1000 });

      const item = queue.enqueue({ test: 'data' }, 'job-1');
      queue.dequeue();

      queue.fail(item.id, 'Test error');

      expect(item.status).toBe('pending'); // Should be pending for retry
      expect(item.attempts).toBe(1);
    });
  });

  describe('BatchJobManager', () => {
    it('should create batch jobs', () => {
      const manager = createBatchJobManager();
      const config = createMockPandascoreConfig();

      const job = manager.createJob('Test Job', config, ['match', 'player']);

      expect(job.name).toBe('Test Job');
      expect(job.dataTypes).toEqual(['match', 'player']);
      expect(job.status).toBe('queued');
    });

    it('should track job progress', () => {
      const manager = createBatchJobManager();
      const config = createMockPandascoreConfig();

      const job = manager.createJob('Test Job', config, ['match']);

      expect(job.progress.totalRecords).toBe(0);
      expect(job.progress.stages).toHaveLength(4);
    });

    it('should get jobs by status', () => {
      const manager = createBatchJobManager();
      const config = createMockPandascoreConfig();

      manager.createJob('Job 1', config, ['match']);
      manager.createJob('Job 2', config, ['player']);

      const queuedJobs = manager.getJobsByStatus('queued');

      expect(queuedJobs).toHaveLength(2);
    });
  });

  describe('ProgressTracker', () => {
    it('should track progress', () => {
      const tracker = createProgressTracker(100);

      tracker.update(25);

      const progress = tracker.getProgress();
      expect(progress.processedRecords).toBe(25);
      expect(progress.percentComplete).toBe(25);
    });

    it('should calculate estimated time remaining', () => {
      const tracker = createProgressTracker(100);

      tracker.update(50);

      const progress = tracker.getProgress();
      expect(progress.estimatedTimeRemaining).toBeDefined();
    });

    it('should notify on progress updates', () => {
      const tracker = createProgressTracker(100);
      const callback = vi.fn();

      tracker.onUpdate(callback);
      tracker.update(10);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('BatchErrorHandler', () => {
    it('should classify errors as retryable', () => {
      const handler = createErrorHandler();

      const result = handler.handleError('rec-1', 'fetch', new Error('Network timeout'));

      expect(result.retryable).toBe(true);
      expect(result.delay).toBeGreaterThan(0);
    });

    it('should track errors', () => {
      const handler = createErrorHandler();

      handler.handleError('rec-1', 'fetch', new Error('Error 1'));
      handler.handleError('rec-2', 'transform', new Error('Error 2'));

      expect(handler.getErrors()).toHaveLength(2);
      expect(handler.getErrorsByStage('fetch')).toHaveLength(1);
    });

    it('should provide error summary', () => {
      const handler = createErrorHandler();

      handler.handleError('rec-1', 'fetch', new Error('Network error'));
      handler.handleError('rec-2', 'fetch', new Error('Client error'));

      const summary = handler.getSummary();

      expect(summary.total).toBe(2);
    });
  });
});

// =============================================================================
// 5. Integration Tests (5 tests)
// =============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    resetAllConnectors();
    mockFetch.mockClear();
  });

  it('should complete full ingestion pipeline', async () => {
    // Setup
    const api = createIngestionApi({ baseUrl: 'https://api.test.com' });
    const manager = createBatchJobManager();
    const transformer = createTransformer();

    // Mock API responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => [{ id: 1, name: 'Match 1', status: 'running' }],
    });

    // Create and start job
    const config = createMockPandascoreConfig();
    const connector = createConnector(config);
    await connector.connect();

    const records = await connector.fetchData('match');
    expect(records).toHaveLength(1);

    // Transform
    const normalized = transformer.transformBatch(records);
    expect(normalized).toHaveLength(1);

    // Validate
    const validation = transformer.validate(normalized[0]);
    expect(validation.valid).toBe(true);
  });

  it('should handle multiple data sources', async () => {
    const configs = [
      createMockPandascoreConfig(),
      createMockLiquipediaConfig(),
    ];

    const connectors = configs.map(config => createConnector(config));

    expect(connectors).toHaveLength(2);
    expect(getAllConnectors()).toHaveLength(2);
  });

  it('should handle manual file upload pipeline', async () => {
    const config = createMockManualConfig();
    const connector = new ManualUploadConnector(config);
    const transformer = createTransformer();

    await connector.connect();

    const jsonContent = JSON.stringify([
      { id: 1, teamA: 'Team 1', teamB: 'Team 2', scoreA: 13, scoreB: 10 },
      { id: 2, teamA: 'Team 3', teamB: 'Team 4', scoreA: 8, scoreB: 13 },
    ]);

    const result = connector.uploadJSON(jsonContent, 'match');

    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(2);

    const normalized = transformer.transformBatch(result.records);
    expect(normalized).toHaveLength(2);
  });

  it('should handle conflict resolution across sources', async () => {
    const transformer = createTransformer();

    // Data from source 1
    const record1 = createMockRawRecord({
      sourceType: 'pandascore',
      rawData: { id: 1, teamAScore: 13, opponents: [{ opponent: { id: 1 } }, { opponent: { id: 2 } }] },
    });

    // Data from source 2 (conflicting)
    const record2 = createMockRawRecord({
      sourceType: 'liquipedia',
      rawData: { id: 1, teamAScore: 15, opponents: [{ opponent: { id: 1 } }, { opponent: { id: 2 } }] },
    });

    // Transform first
    const normalized1 = transformer.transform(record1);

    // Transform second with existing data
    const normalized2 = transformer.transform(record2, normalized1.normalizedData as Record<string, unknown>);

    expect(normalized2.conflicts.length).toBeGreaterThan(0);

    // Resolve
    const resolved = transformer.resolveConflicts(normalized2, 'timestamp');
    expect(resolved.conflicts[0].resolution).toBeDefined();
  });

  it('should recover from errors and continue processing', async () => {
    const queue = createQueue({ maxRetries: 1, retryDelay: 100 });
    const processed: string[] = [];
    const failed: string[] = [];

    queue.start(async (item) => {
      if (item.data === 'fail') {
        throw new Error('Intentional failure');
      }
      processed.push(item.id);
    });

    queue.enqueue('success-1', 'job-1');
    queue.enqueue('fail', 'job-1');
    queue.enqueue('success-2', 'job-1');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(processed).toContain(queue.getItems()[0].id);
    expect(processed).toContain(queue.getItems()[2].id);
  });
});

// =============================================================================
// Test Summary
// =============================================================================
// Total: 39 tests covering:
// - API Client (8 tests)
// - Connectors (10 tests)
// - Transformer (8 tests)
// - Batch Processor (8 tests)
// - Integration Tests (5 tests)
// =============================================================================
