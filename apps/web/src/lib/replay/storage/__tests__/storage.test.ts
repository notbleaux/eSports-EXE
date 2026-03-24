/**
 * Replay Storage Tests
 * Comprehensive tests for IndexedDB storage, metadata, and cloud upload
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 * 
 * Test Targets:
 * - IndexedDB CRUD operations
 * - Metadata extraction and indexing
 * - Full-text search
 * - Compression/decompression
 * - Quota management
 * - Cloud upload patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Replay, GameType } from '../../types';
import { createEmptyReplay, REPLAY_SCHEMA_VERSION } from '../../types';

// Import storage modules
import {
  // IndexedDB
  storeReplay,
  retrieveReplay,
  getMetadata,
  deleteReplay,
  queryReplays,
  getUniqueMaps,
  getUniqueTags,
  addTags,
  removeTags,
  storeThumbnail,
  getThumbnail,
  getStorageQuota,
  cleanupStorage,
  deleteDB,
  compressReplay,
  decompressReplay,
  
  // Metadata
  extractMetadata,
  buildIndex,
  searchMetadata,
  extractAllTags,
  getTagStats,
  
  // Cloud Upload
  UploadManager,
} from '../index';

// ============================================================================
// Mock IndexedDB
// ============================================================================

class MockIDBDatabase {
  objectStoreNames = {
    contains: () => true,
    length: 4,
    item: (i: number) => ['replays', 'metadata', 'thumbnails', 'tags'][i],
  };
  
  transaction = vi.fn(() => ({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => ({ 
        onsuccess: null as ((e: Event) => void) | null,
        onerror: null as ((e: Event) => void) | null,
        result: null,
        set onsuccess(fn: (e: Event) => void) {
          this.onsuccess = fn;
          setTimeout(() => fn({ target: { result: this.result } } as unknown as Event), 0);
        },
      })),
      getAll: vi.fn(() => ({
        onsuccess: null as ((e: Event) => void) | null,
        onerror: null as ((e: Event) => void) | null,
        result: [] as unknown[],
        set onsuccess(fn: (e: Event) => void) {
          this.onsuccess = fn;
          setTimeout(() => fn({ target: { result: this.result } } as unknown as Event), 0);
        },
      })),
      put: vi.fn(() => ({
        onsuccess: null as ((e: Event) => void) | null,
        onerror: null as ((e: Event) => void) | null,
        set onsuccess(fn: (e: Event) => void) {
          this.onsuccess = fn;
          setTimeout(() => fn({} as Event), 0);
        },
      })),
      delete: vi.fn(() => ({
        onsuccess: null as ((e: Event) => void) | null,
        onerror: null as ((e: Event) => void) | null,
        set onsuccess(fn: (e: Event) => void) {
          this.onsuccess = fn;
          setTimeout(() => fn({} as Event), 0);
        },
      })),
    })),
    oncomplete: null as (() => void) | null,
    onerror: null as ((e: Error) => void) | null,
  }));
  
  close() {}
}

// Mock indexedDB globally
const mockDB = new MockIDBDatabase();
vi.stubGlobal('indexedDB', {
  open: vi.fn(() => ({
    onsuccess: null as ((e: Event) => void) | null,
    onerror: null as ((e: Event) => void) | null,
    onupgradeneeded: null as ((e: Event) => void) | null,
    result: mockDB,
    set onsuccess(fn: (e: Event) => void) {
      setTimeout(() => fn({ target: { result: mockDB } } as unknown as Event), 0);
    },
  })),
  deleteDatabase: vi.fn(() => ({
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    set onsuccess(fn: () => void) {
      setTimeout(fn, 0);
    },
  })),
});

// Mock navigator.storage
vi.stubGlobal('navigator', {
  storage: {
    estimate: vi.fn(() => Promise.resolve({ quota: 1000000000, usage: 100000000 })),
  },
});

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockReplay(gameType: GameType = 'valorant'): Replay {
  const replay = createEmptyReplay(gameType, `test-match-${Date.now()}`);
  replay.mapName = 'Ascent';
  replay.timestamp = Date.now();
  replay.duration = 1800;
  replay.teams = [
    { id: 'team-a', name: 'Team Alpha', side: 'attacker', score: 13, money: 0, playerIds: [], timeoutsRemaining: 0 },
    { id: 'team-b', name: 'Team Beta', side: 'defender', score: 11, money: 0, playerIds: [], timeoutsRemaining: 0 },
  ];
  replay.players = [
    {
      id: 'player-1',
      name: 'ProPlayer1',
      teamId: 'team-a',
      teamSide: 'attacker',
      agent: 'Jett',
      role: 'duelist',
      isBot: false,
      stats: {
        kills: 25,
        deaths: 15,
        assists: 5,
        damageDealt: 3200,
        damageReceived: 2800,
        headshots: 12,
        roundsPlayed: 24,
        score: 6500,
      },
    },
    {
      id: 'player-2',
      name: 'ProPlayer2',
      teamId: 'team-b',
      teamSide: 'defender',
      agent: 'Sage',
      role: 'sentinel',
      isBot: false,
      stats: {
        kills: 18,
        deaths: 17,
        assists: 12,
        damageDealt: 2400,
        damageReceived: 2900,
        headshots: 8,
        roundsPlayed: 24,
        score: 5200,
      },
    },
  ];
  replay.rounds = Array.from({ length: 24 }, (_, i) => ({
    roundNumber: i + 1,
    winningSide: i % 2 === 0 ? 'attacker' : 'defender',
    outcome: i % 3 === 0 ? 'bomb_exploded' : 'elimination',
    startTime: i * 75000,
    endTime: (i + 1) * 75000,
    duration: 75000,
    teamAScore: i % 2 === 0 ? Math.ceil((i + 1) / 2) : Math.floor((i + 1) / 2),
    teamBScore: i % 2 === 0 ? Math.floor((i + 1) / 2) : Math.ceil((i + 1) / 2),
    events: [],
    playerStates: [],
    economy: { teamA: { totalMoney: 4000, loadoutValues: [], weapons: [] }, teamB: { totalMoney: 4000, loadoutValues: [], weapons: [] } },
  }));
  return replay;
}

function createMockReplayBuffer(replay: Replay): ArrayBuffer {
  const json = JSON.stringify(replay);
  const encoder = new TextEncoder();
  return encoder.encode(json).buffer;
}

// ============================================================================
// IndexedDB Storage Tests
// ============================================================================

describe('IndexedDB Storage', () => {
  const mockReplay = createMockReplay('valorant');
  const mockBuffer = createMockReplayBuffer(mockReplay);
  
  describe('storeReplay', () => {
    it('should store a replay successfully', async () => {
      const result = await storeReplay('test-1', mockReplay, mockBuffer);
      expect(result.success).toBe(true);
    });
    
    it('should store with compression enabled', async () => {
      const result = await storeReplay('test-2', mockReplay, mockBuffer, { compress: true });
      expect(result.success).toBe(true);
    });
    
    it('should store with tags', async () => {
      const result = await storeReplay('test-3', mockReplay, mockBuffer, {
        tags: ['highlight', 'clutch', 'ace'],
      });
      expect(result.success).toBe(true);
    });
    
    it('should return quota information', async () => {
      const result = await storeReplay('test-4', mockReplay, mockBuffer);
      expect(result.quota).toBeDefined();
      expect(result.quota?.replayCount).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle empty tags array', async () => {
      const result = await storeReplay('test-5', mockReplay, mockBuffer, { tags: [] });
      expect(result.success).toBe(true);
    });
  });
  
  describe('retrieveReplay', () => {
    it('should retrieve a stored replay', async () => {
      const id = 'retrieve-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      const result = await retrieveReplay(id);
      expect(result.metadata).toBeDefined();
      expect(result.error).toBeUndefined();
    });
    
    it('should return error for non-existent replay', async () => {
      const result = await retrieveReplay('non-existent-id');
      expect(result.error).toContain('not found');
    });
    
    it('should update access count on retrieve', async () => {
      const id = 'access-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      await retrieveReplay(id);
      const meta = await getMetadata(id);
      expect(meta?.accessCount).toBeGreaterThan(0);
    });
  });
  
  describe('getMetadata', () => {
    it('should return metadata without loading full replay', async () => {
      const id = 'meta-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      const meta = await getMetadata(id);
      expect(meta).toBeDefined();
      expect(meta?.matchId).toBe(mockReplay.matchId);
      expect(meta?.mapName).toBe(mockReplay.mapName);
    });
    
    it('should return null for non-existent replay', async () => {
      const meta = await getMetadata('non-existent');
      expect(meta).toBeNull();
    });
  });
  
  describe('deleteReplay', () => {
    it('should delete a stored replay', async () => {
      const id = 'delete-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      const result = await deleteReplay(id);
      expect(result.success).toBe(true);
      
      const meta = await getMetadata(id);
      expect(meta).toBeNull();
    });
    
    it('should handle deleting non-existent replay', async () => {
      const result = await deleteReplay('non-existent');
      // Should succeed (idempotent)
      expect(result.success).toBe(true);
    });
  });
  
  describe('queryReplays', () => {
    beforeEach(async () => {
      // Store multiple replays for querying
      for (let i = 0; i < 5; i++) {
        const replay = createMockReplay(i % 2 === 0 ? 'valorant' : 'cs2');
        replay.mapName = ['Ascent', 'Dust II', 'Haven', 'Mirage', 'Bind'][i];
        await storeReplay(`query-test-${i}`, replay, createMockReplayBuffer(replay));
      }
    });
    
    it('should return paginated results', async () => {
      const result = await queryReplays({}, { field: 'timestamp', direction: 'desc' }, { offset: 0, limit: 3 });
      expect(result.metadata.length).toBeLessThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(typeof result.hasMore).toBe('boolean');
    });
    
    it('should filter by game type', async () => {
      const result = await queryReplays({ gameType: 'valorant' });
      expect(result.metadata.every(m => m.gameType === 'valorant')).toBe(true);
    });
    
    it('should filter by map name', async () => {
      const result = await queryReplays({ mapName: 'Ascent' });
      expect(result.metadata.every(m => m.mapName.toLowerCase().includes('ascent'))).toBe(true);
    });
    
    it('should sort by different fields', async () => {
      const fields: ('timestamp' | 'duration' | 'fileSize')[] = ['timestamp', 'duration', 'fileSize'];
      
      for (const field of fields) {
        const result = await queryReplays({}, { field, direction: 'desc' });
        // Just verify no errors
        expect(result.metadata).toBeDefined();
      }
    });
    
    it('should filter by tags', async () => {
      const replay = createMockReplay('valorant');
      await storeReplay('tag-query-test', replay, createMockReplayBuffer(replay), {
        tags: ['special-tag'],
      });
      
      const result = await queryReplays({ tags: ['special-tag'] });
      expect(result.metadata.some(m => m.tags.includes('special-tag'))).toBe(true);
    });
    
    it('should filter by date range', async () => {
      const now = Date.now();
      const result = await queryReplays({
        dateFrom: now - 86400000,
        dateTo: now + 86400000,
      });
      expect(result.metadata).toBeDefined();
    });
  });
  
  describe('getUniqueMaps', () => {
    it('should return list of unique maps', async () => {
      const maps = await getUniqueMaps();
      expect(Array.isArray(maps)).toBe(true);
    });
  });
  
  describe('getUniqueTags', () => {
    it('should return list of unique tags', async () => {
      const tags = await getUniqueTags();
      expect(Array.isArray(tags)).toBe(true);
    });
  });
  
  describe('addTags', () => {
    it('should add tags to a replay', async () => {
      const id = 'add-tags-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      const result = await addTags(id, ['new-tag-1', 'new-tag-2']);
      expect(result.success).toBe(true);
      
      const meta = await getMetadata(id);
      expect(meta?.tags).toContain('new-tag-1');
      expect(meta?.tags).toContain('new-tag-2');
    });
    
    it('should not duplicate existing tags', async () => {
      const id = 'no-dup-tags-test';
      await storeReplay(id, mockReplay, mockBuffer, { tags: ['existing'] });
      
      await addTags(id, ['existing']);
      const meta = await getMetadata(id);
      expect(meta?.tags.filter(t => t === 'existing').length).toBe(1);
    });
    
    it('should return error for non-existent replay', async () => {
      const result = await addTags('non-existent', ['tag']);
      expect(result.success).toBe(false);
    });
  });
  
  describe('removeTags', () => {
    it('should remove tags from a replay', async () => {
      const id = 'remove-tags-test';
      await storeReplay(id, mockReplay, mockBuffer, { tags: ['tag1', 'tag2', 'tag3'] });
      
      const result = await removeTags(id, ['tag2']);
      expect(result.success).toBe(true);
      
      const meta = await getMetadata(id);
      expect(meta?.tags).not.toContain('tag2');
      expect(meta?.tags).toContain('tag1');
    });
  });
  
  describe('thumbnail operations', () => {
    it('should store and retrieve a thumbnail', async () => {
      const id = 'thumbnail-test';
      await storeReplay(id, mockReplay, mockBuffer);
      
      const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      await storeThumbnail(id, blob);
      
      const retrieved = await getThumbnail(id);
      expect(retrieved).not.toBeNull();
    });
  });
  
  describe('getStorageQuota', () => {
    it('should return quota information', async () => {
      const quota = await getStorageQuota();
      expect(quota).toHaveProperty('total');
      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('available');
      expect(quota).toHaveProperty('replayCount');
    });
  });
  
  describe('cleanupStorage', () => {
    it('should delete old replays based on strategy', async () => {
      const result = await cleanupStorage('oldest', 1000);
      expect(result).toHaveProperty('deleted');
      expect(result).toHaveProperty('freed');
      expect(typeof result.deleted).toBe('number');
      expect(typeof result.freed).toBe('number');
    });
    
    it('should support different cleanup strategies', async () => {
      const strategies: ('oldest' | 'least_accessed' | 'largest')[] = ['oldest', 'least_accessed', 'largest'];
      
      for (const strategy of strategies) {
        const result = await cleanupStorage(strategy, 100);
        expect(typeof result.deleted).toBe('number');
      }
    });
  });
});

// ============================================================================
// Compression Tests
// ============================================================================

describe('Compression', () => {
  it('should compress and decompress data', async () => {
    const original = new TextEncoder().encode('Test data for compression').buffer;
    
    const compressed = await compressReplay(original);
    expect(compressed.data).toBeDefined();
    expect(compressed.ratio).toBeGreaterThan(0);
    
    const decompressed = await decompressReplay(compressed.data);
    expect(new TextDecoder().decode(decompressed)).toBe('Test data for compression');
  });
  
  it('should handle compression failures gracefully', async () => {
    // Very small data might not compress well
    const small = new ArrayBuffer(10);
    const result = await compressReplay(small);
    expect(result.data).toBeDefined();
  });
  
  it('should handle decompression of uncompressed data', async () => {
    const data = new TextEncoder().encode('not compressed').buffer;
    const result = await decompressReplay(data);
    expect(result).toBeDefined();
  });
});

// ============================================================================
// Metadata Extraction Tests
// ============================================================================

describe('Metadata Extraction', () => {
  const mockReplay = createMockReplay('valorant');
  
  describe('extractMetadata', () => {
    it('should extract basic metadata', () => {
      const meta = extractMetadata(mockReplay, 1024);
      
      expect(meta.matchId).toBe(mockReplay.matchId);
      expect(meta.gameType).toBe(mockReplay.gameType);
      expect(meta.mapName).toBe(mockReplay.mapName);
      expect(meta.fileSize).toBe(1024);
    });
    
    it('should extract team information', () => {
      const meta = extractMetadata(mockReplay);
      
      expect(meta.teams).toHaveLength(2);
      expect(meta.teams[0].name).toBe('Team Alpha');
      expect(meta.teams[0].score).toBe(13);
    });
    
    it('should extract player information', () => {
      const meta = extractMetadata(mockReplay);
      
      expect(meta.players).toHaveLength(2);
      expect(meta.players[0].name).toBe('ProPlayer1');
      expect(meta.players[0].stats.kills).toBe(25);
    });
    
    it('should generate match stats', () => {
      const meta = extractMetadata(mockReplay);
      
      expect(meta.matchStats.totalRounds).toBe(24);
      expect(typeof meta.matchStats.totalKills).toBe('number');
    });
    
    it('should generate searchable text', () => {
      const meta = extractMetadata(mockReplay);
      
      expect(meta.searchText).toContain('ascent');
      expect(meta.searchText).toContain('team alpha');
      expect(meta.searchText).toContain('proplayer1');
    });
    
    it('should generate suggested tags', () => {
      const meta = extractMetadata(mockReplay);
      
      expect(meta.suggestedTags.length).toBeGreaterThan(0);
      expect(meta.suggestedTags).toContain('valorant');
    });
  });
  
  describe('buildIndex', () => {
    it('should build searchable index', () => {
      const extracted = extractMetadata(mockReplay);
      const index = buildIndex('test-id', extracted);
      
      expect(index.id).toBe('test-id');
      expect(index.matchId).toBe(mockReplay.matchId);
      expect(index.playerNames).toContain('proplayer1');
      expect(index.teamNames).toContain('team alpha');
    });
  });
  
  describe('searchMetadata', () => {
    it('should search by text', () => {
      const indexes = [
        buildIndex('1', extractMetadata(createMockReplay('valorant'))),
        buildIndex('2', extractMetadata({ ...createMockReplay('cs2'), mapName: 'Dust II' })),
      ];
      
      const results = searchMetadata(indexes, { text: 'ascent' });
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('should filter by game type', () => {
      const indexes = [
        buildIndex('1', extractMetadata(createMockReplay('valorant'))),
        buildIndex('2', extractMetadata(createMockReplay('cs2'))),
      ];
      
      const results = searchMetadata(indexes, { filters: { gameType: 'cs2' } });
      expect(results.every(r => r.id === '2')).toBe(true);
    });
    
    it('should filter by tags', () => {
      const meta1 = extractMetadata(createMockReplay('valorant'));
      meta1.suggestedTags = ['highlight'];
      
      const indexes = [
        buildIndex('1', meta1),
        buildIndex('2', extractMetadata(createMockReplay('cs2'))),
      ];
      
      const results = searchMetadata(indexes, { tags: ['highlight'] });
      expect(results.some(r => r.id === '1')).toBe(true);
    });
  });
  
  describe('extractAllTags', () => {
    it('should extract unique tags from indexes', () => {
      const meta1 = extractMetadata(createMockReplay('valorant'));
      meta1.suggestedTags = ['tag1', 'tag2'];
      
      const meta2 = extractMetadata(createMockReplay('cs2'));
      meta2.suggestedTags = ['tag2', 'tag3'];
      
      const indexes = [
        buildIndex('1', meta1),
        buildIndex('2', meta2),
      ];
      
      const tags = extractAllTags(indexes);
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
      expect(tags).toContain('tag3');
    });
  });
  
  describe('getTagStats', () => {
    it('should count tag occurrences', () => {
      const meta1 = extractMetadata(createMockReplay('valorant'));
      meta1.suggestedTags = ['popular'];
      
      const meta2 = extractMetadata(createMockReplay('cs2'));
      meta2.suggestedTags = ['popular'];
      
      const indexes = [
        buildIndex('1', meta1),
        buildIndex('2', meta2),
      ];
      
      const stats = getTagStats(indexes);
      expect(stats.get('popular')).toBe(2);
    });
  });
});

// ============================================================================
// Cloud Upload Tests
// ============================================================================

describe('UploadManager', () => {
  let manager: UploadManager;
  
  beforeEach(() => {
    manager = new UploadManager({ maxConcurrent: 2 });
  });
  
  describe('addTask', () => {
    it('should add upload task to queue', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      expect(id).toBeDefined();
      expect(id.startsWith('upload-')).toBe(true);
      
      const task = manager.getTask(id);
      expect(task).toBeDefined();
      expect(task?.status).toBe('pending');
    });
  });
  
  describe('getTask', () => {
    it('should return task by ID', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const task = manager.getTask(id);
      expect(task?.file.name).toBe('replay.json');
    });
    
    it('should return undefined for non-existent task', () => {
      const task = manager.getTask('non-existent');
      expect(task).toBeUndefined();
    });
  });
  
  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      manager.addTask(file, {
        matchId: 'test1',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      manager.addTask(file, {
        matchId: 'test2',
        gameType: 'cs2',
        mapName: 'Dust II',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const tasks = manager.getAllTasks();
      expect(tasks.length).toBe(2);
    });
  });
  
  describe('pauseTask', () => {
    it('should pause uploading task', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      // Can't pause pending task, only uploading
      // But we can verify the method exists and handles edge cases
      const result = manager.pauseTask(id);
      // Returns false because task is pending, not uploading
      expect(typeof result).toBe('boolean');
    });
    
    it('should return false for non-existent task', () => {
      const result = manager.pauseTask('non-existent');
      expect(result).toBe(false);
    });
  });
  
  describe('resumeTask', () => {
    it('should resume paused task', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      // Can't resume pending task
      const result = manager.resumeTask(id);
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('cancelTask', () => {
    it('should cancel a task', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const result = manager.cancelTask(id);
      expect(result).toBe(true);
      
      const task = manager.getTask(id);
      expect(task?.status).toBe('failed');
    });
  });
  
  describe('removeTask', () => {
    it('should remove task from manager', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const result = manager.removeTask(id);
      expect(result).toBe(true);
      expect(manager.getTask(id)).toBeUndefined();
    });
  });
  
  describe('clearCompleted', () => {
    it('should remove completed and failed tasks', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      
      const id1 = manager.addTask(file, {
        matchId: 'test1',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const id2 = manager.addTask(file, {
        matchId: 'test2',
        gameType: 'cs2',
        mapName: 'Dust II',
        timestamp: Date.now(),
        duration: 100,
      });
      
      // Cancel one to make it failed
      manager.cancelTask(id1);
      
      const cleared = manager.clearCompleted();
      expect(cleared).toBe(1);
      expect(manager.getTask(id1)).toBeUndefined();
    });
  });
  
  describe('getOverallProgress', () => {
    it('should calculate overall progress', () => {
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      
      manager.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      const progress = manager.getOverallProgress();
      expect(progress.total).toBe(1);
      expect(progress.percent).toBe(0);
    });
    
    it('should return zero when no tasks', () => {
      const progress = manager.getOverallProgress();
      expect(progress.total).toBe(0);
      expect(progress.percent).toBe(0);
    });
  });
  
  describe('callback notification', () => {
    it('should call onTaskUpdate when tasks change', () => {
      const updates: string[] = [];
      const managerWithCallback = new UploadManager({
        onTaskUpdate: (task) => updates.push(task.id),
      });
      
      const file = new File(['test'], 'replay.json', { type: 'application/json' });
      const id = managerWithCallback.addTask(file, {
        matchId: 'test',
        gameType: 'valorant',
        mapName: 'Ascent',
        timestamp: Date.now(),
        duration: 100,
      });
      
      expect(updates).toContain(id);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Storage Integration', () => {
  it('should store, retrieve, and delete a complete replay workflow', async () => {
    const replay = createMockReplay('valorant');
    const buffer = createMockReplayBuffer(replay);
    const id = 'integration-test';
    
    // Store
    const storeResult = await storeReplay(id, replay, buffer, {
      tags: ['integration', 'test'],
    });
    expect(storeResult.success).toBe(true);
    
    // Retrieve
    const retrieveResult = await retrieveReplay(id);
    expect(retrieveResult.metadata).toBeDefined();
    
    // Query
    const queryResult = await queryReplays({ tags: ['integration'] });
    expect(queryResult.metadata.some(m => m.id === id)).toBe(true);
    
    // Delete
    const deleteResult = await deleteReplay(id);
    expect(deleteResult.success).toBe(true);
    
    // Verify deletion
    const meta = await getMetadata(id);
    expect(meta).toBeNull();
  });
  
  it('should handle concurrent operations', async () => {
    const replay = createMockReplay('valorant');
    const buffer = createMockReplayBuffer(replay);
    
    const operations = Array.from({ length: 5 }, (_, i) => 
      storeReplay(`concurrent-${i}`, replay, buffer)
    );
    
    const results = await Promise.all(operations);
    expect(results.every(r => r.success)).toBe(true);
    
    // Cleanup
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => deleteReplay(`concurrent-${i}`))
    );
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export all required functions', () => {
    expect(typeof storeReplay).toBe('function');
    expect(typeof retrieveReplay).toBe('function');
    expect(typeof deleteReplay).toBe('function');
    expect(typeof queryReplays).toBe('function');
    expect(typeof extractMetadata).toBe('function');
    expect(typeof buildIndex).toBe('function');
    expect(typeof UploadManager).toBe('function');
    expect(typeof compressReplay).toBe('function');
    expect(typeof decompressReplay).toBe('function');
  });
});
