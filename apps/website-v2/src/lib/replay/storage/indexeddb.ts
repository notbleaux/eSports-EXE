/**
 * IndexedDB Replay Storage
 * Local persistence for replay files with metadata indexing
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Replay, GameType } from '../types';

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'SATOR_ReplayStorage';
const DB_VERSION = 1;

const STORES = {
  REPLAYS: 'replays',
  METADATA: 'metadata',
  THUMBNAILS: 'thumbnails',
  TAGS: 'tags',
} as const;

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredReplay {
  id: string;
  matchId: string;
  gameType: GameType;
  mapName: string;
  timestamp: number;
  duration: number;
  fileSize: number;
  compressed: boolean;
  data: ArrayBuffer;
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ReplayMetadata {
  id: string;
  matchId: string;
  gameType: GameType;
  mapName: string;
  timestamp: number;
  duration: number;
  fileSize: number;
  compressedSize?: number;
  teams: { name: string; score: number }[];
  players: { id: string; name: string; teamId: string }[];
  tags: string[];
  thumbnailId?: string;
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ReplayThumbnail {
  id: string;
  replayId: string;
  data: Blob;
  width: number;
  height: number;
  createdAt: number;
}

export interface TagIndex {
  tag: string;
  replayIds: string[];
  count: number;
}

export interface StorageQuota {
  total: number;
  used: number;
  available: number;
  replayCount: number;
}

export interface StorageFilters {
  gameType?: GameType;
  mapName?: string;
  playerName?: string;
  teamName?: string;
  tags?: string[];
  dateFrom?: number;
  dateTo?: number;
  durationMin?: number;
  durationMax?: number;
}

export interface StorageSortOptions {
  field: 'timestamp' | 'duration' | 'fileSize' | 'accessCount' | 'lastAccessed';
  direction: 'asc' | 'desc';
}

export interface StorageQueryResult {
  metadata: ReplayMetadata[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Compression Utilities
// ============================================================================

/**
 * Compress replay data using CompressionStream API
 */
export async function compressReplay(data: ArrayBuffer): Promise<{ data: ArrayBuffer; ratio: number }> {
  try {
    const stream = new Blob([data]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const compressed = await new Response(compressedStream).arrayBuffer();
    
    const ratio = compressed.byteLength / data.byteLength;
    return { data: compressed, ratio };
  } catch (error) {
    console.warn('[IndexedDB] Compression failed, storing uncompressed:', error);
    return { data, ratio: 1 };
  }
}

/**
 * Decompress replay data
 */
export async function decompressReplay(data: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const stream = new Blob([data]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    return await new Response(decompressedStream).arrayBuffer();
  } catch (error) {
    // If decompression fails, assume data was stored uncompressed
    console.warn('[IndexedDB] Decompression failed, returning as-is:', error);
    return data;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Replays store - holds the actual replay data
      if (!db.objectStoreNames.contains(STORES.REPLAYS)) {
        const replayStore = db.createObjectStore(STORES.REPLAYS, { keyPath: 'id' });
        replayStore.createIndex('matchId', 'matchId', { unique: false });
        replayStore.createIndex('timestamp', 'timestamp', { unique: false });
        replayStore.createIndex('gameType', 'gameType', { unique: false });
        replayStore.createIndex('mapName', 'mapName', { unique: false });
        replayStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }
      
      // Metadata store - indexed for fast searching
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        const metaStore = db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
        metaStore.createIndex('matchId', 'matchId', { unique: false });
        metaStore.createIndex('timestamp', 'timestamp', { unique: false });
        metaStore.createIndex('gameType', 'gameType', { unique: false });
        metaStore.createIndex('mapName', 'mapName', { unique: false });
        metaStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        metaStore.createIndex('accessCount', 'accessCount', { unique: false });
        metaStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }
      
      // Thumbnails store
      if (!db.objectStoreNames.contains(STORES.THUMBNAILS)) {
        const thumbStore = db.createObjectStore(STORES.THUMBNAILS, { keyPath: 'id' });
        thumbStore.createIndex('replayId', 'replayId', { unique: true });
      }
      
      // Tags index store
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: 'tag' });
      }
    };
  });
  
  return dbPromise;
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

/**
 * Delete entire database (use with caution)
 */
export async function deleteDB(): Promise<void> {
  await closeDB();
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Core Storage Operations
// ============================================================================

/**
 * Store a replay with optional compression
 */
export async function storeReplay(
  id: string,
  replay: Replay,
  rawData: ArrayBuffer,
  options: {
    compress?: boolean;
    thumbnail?: Blob;
    tags?: string[];
  } = {}
): Promise<{ success: boolean; error?: string; quota?: StorageQuota }> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.REPLAYS, STORES.METADATA, STORES.TAGS], 'readwrite');
    
    const now = Date.now();
    let storedData = rawData;
    let compressed = false;
    let compressedSize: number | undefined;
    
    // Compress if enabled and beneficial
    if (options.compress && rawData.byteLength > 1024) {
      const { data: compressedData, ratio } = await compressReplay(rawData);
      if (ratio < 0.9) {
        storedData = compressedData;
        compressed = true;
        compressedSize = compressedData.byteLength;
      }
    }
    
    // Prepare stored replay
    const storedReplay: StoredReplay = {
      id,
      matchId: replay.matchId,
      gameType: replay.gameType,
      mapName: replay.mapName,
      timestamp: replay.timestamp,
      duration: replay.duration,
      fileSize: rawData.byteLength,
      compressed,
      data: storedData,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };
    
    // Prepare metadata
    const metadata: ReplayMetadata = {
      id,
      matchId: replay.matchId,
      gameType: replay.gameType,
      mapName: replay.mapName,
      timestamp: replay.timestamp,
      duration: replay.duration,
      fileSize: rawData.byteLength,
      compressedSize,
      teams: replay.teams.map(t => ({ name: t.name, score: t.score })),
      players: replay.players.map(p => ({ id: p.id, name: p.name, teamId: p.teamId })),
      tags: options.tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessed: now,
    };
    
    // Store replay data
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.REPLAYS).put(storedReplay);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Store metadata
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Update tag index
    if (options.tags && options.tags.length > 0) {
      await updateTagIndex(transaction, id, options.tags);
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    // Store thumbnail if provided
    if (options.thumbnail) {
      await storeThumbnail(id, options.thumbnail);
    }
    
    const quota = await getStorageQuota();
    return { success: true, quota };
  } catch (error) {
    console.error('[IndexedDB] Store failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Storage failed' 
    };
  }
}

/**
 * Retrieve a replay by ID
 */
export async function retrieveReplay(id: string): Promise<{ 
  replay?: Replay; 
  metadata: ReplayMetadata;
  error?: string;
}> {
  try {
    const db = await getDB();
    
    // Get metadata first
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = db.transaction(STORES.METADATA).objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!metadata) {
      return { error: 'Replay not found', metadata: null as unknown as ReplayMetadata };
    }
    
    // Get replay data
    const stored = await new Promise<StoredReplay>((resolve, reject) => {
      const request = db.transaction(STORES.REPLAYS).objectStore(STORES.REPLAYS).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!stored) {
      return { error: 'Replay data not found', metadata };
    }
    
    // Update access stats
    await updateAccessStats(id);
    
    // Decompress if needed
    const data = stored.compressed ? await decompressReplay(stored.data) : stored.data;
    
    // Parse replay
    const replay = JSON.parse(new TextDecoder().decode(data)) as Replay;
    
    return { replay, metadata };
  } catch (error) {
    console.error('[IndexedDB] Retrieve failed:', error);
    return { 
      error: error instanceof Error ? error.message : 'Retrieval failed',
      metadata: null as unknown as ReplayMetadata
    };
  }
}

/**
 * Get only metadata without loading full replay data
 */
export async function getMetadata(id: string): Promise<ReplayMetadata | null> {
  try {
    const db = await getDB();
    return await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = db.transaction(STORES.METADATA).objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Get metadata failed:', error);
    return null;
  }
}

/**
 * Delete a replay
 */
export async function deleteReplay(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.REPLAYS, STORES.METADATA, STORES.THUMBNAILS, STORES.TAGS], 'readwrite');
    
    // Get metadata to find tags
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Delete replay data
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.REPLAYS).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Delete metadata
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Delete thumbnail
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.THUMBNAILS).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Update tag index
    if (metadata?.tags?.length) {
      await removeFromTagIndex(transaction, id, metadata.tags);
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    return { success: true };
  } catch (error) {
    console.error('[IndexedDB] Delete failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Query replays with filters, sorting, and pagination
 */
export async function queryReplays(
  filters: StorageFilters = {},
  sort: StorageSortOptions = { field: 'timestamp', direction: 'desc' },
  pagination: { offset: number; limit: number } = { offset: 0, limit: 20 }
): Promise<StorageQueryResult> {
  try {
    const db = await getDB();
    const store = db.transaction(STORES.METADATA).objectStore(STORES.METADATA);
    
    // Get all metadata entries
    const allMetadata = await new Promise<ReplayMetadata[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Apply filters
    let filtered = allMetadata.filter(meta => {
      if (filters.gameType && meta.gameType !== filters.gameType) return false;
      if (filters.mapName && !meta.mapName.toLowerCase().includes(filters.mapName.toLowerCase())) return false;
      if (filters.playerName) {
        const hasPlayer = meta.players.some(p => 
          p.name.toLowerCase().includes(filters.playerName!.toLowerCase())
        );
        if (!hasPlayer) return false;
      }
      if (filters.teamName) {
        const hasTeam = meta.teams.some(t => 
          t.name.toLowerCase().includes(filters.teamName!.toLowerCase())
        );
        if (!hasTeam) return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasTags = filters.tags.every(tag => meta.tags.includes(tag));
        if (!hasTags) return false;
      }
      if (filters.dateFrom && meta.timestamp < filters.dateFrom) return false;
      if (filters.dateTo && meta.timestamp > filters.dateTo) return false;
      if (filters.durationMin && meta.duration < filters.durationMin) return false;
      if (filters.durationMax && meta.duration > filters.durationMax) return false;
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
    
    const total = filtered.length;
    const hasMore = pagination.offset + pagination.limit < total;
    
    // Paginate
    const metadata = filtered.slice(pagination.offset, pagination.offset + pagination.limit);
    
    return { metadata, total, hasMore };
  } catch (error) {
    console.error('[IndexedDB] Query failed:', error);
    return { metadata: [], total: 0, hasMore: false };
  }
}

/**
 * Get all unique map names
 */
export async function getUniqueMaps(): Promise<string[]> {
  try {
    const db = await getDB();
    const store = db.transaction(STORES.METADATA).objectStore(STORES.METADATA);
    
    const all = await new Promise<ReplayMetadata[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const maps = new Set(all.map(m => m.mapName));
    return Array.from(maps).sort();
  } catch (error) {
    console.error('[IndexedDB] Get maps failed:', error);
    return [];
  }
}

/**
 * Get all unique tags
 */
export async function getUniqueTags(): Promise<string[]> {
  try {
    const db = await getDB();
    const store = db.transaction(STORES.TAGS).objectStore(STORES.TAGS);
    
    const allTags = await new Promise<TagIndex[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return allTags.map(t => t.tag).sort();
  } catch (error) {
    console.error('[IndexedDB] Get tags failed:', error);
    return [];
  }
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Add tags to a replay
 */
export async function addTags(id: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.METADATA, STORES.TAGS], 'readwrite');
    
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!metadata) {
      return { success: false, error: 'Replay not found' };
    }
    
    const newTags = [...new Set([...metadata.tags, ...tags])];
    metadata.tags = newTags;
    metadata.updatedAt = Date.now();
    
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    await updateTagIndex(transaction, id, tags);
    
    return { success: true };
  } catch (error) {
    console.error('[IndexedDB] Add tags failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Add tags failed' 
    };
  }
}

/**
 * Remove tags from a replay
 */
export async function removeTags(id: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.METADATA, STORES.TAGS], 'readwrite');
    
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!metadata) {
      return { success: false, error: 'Replay not found' };
    }
    
    metadata.tags = metadata.tags.filter(t => !tags.includes(t));
    metadata.updatedAt = Date.now();
    
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    await removeFromTagIndex(transaction, id, tags);
    
    return { success: true };
  } catch (error) {
    console.error('[IndexedDB] Remove tags failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Remove tags failed' 
    };
  }
}

async function updateTagIndex(transaction: IDBTransaction, replayId: string, tags: string[]): Promise<void> {
  const store = transaction.objectStore(STORES.TAGS);
  
  for (const tag of tags) {
    const index = await new Promise<TagIndex | undefined>((resolve, reject) => {
      const request = store.get(tag);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (index) {
      if (!index.replayIds.includes(replayId)) {
        index.replayIds.push(replayId);
        index.count = index.replayIds.length;
        await new Promise<void>((resolve, reject) => {
          const request = store.put(index);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } else {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ tag, replayIds: [replayId], count: 1 });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

async function removeFromTagIndex(transaction: IDBTransaction, replayId: string, tags: string[]): Promise<void> {
  const store = transaction.objectStore(STORES.TAGS);
  
  for (const tag of tags) {
    const index = await new Promise<TagIndex | undefined>((resolve, reject) => {
      const request = store.get(tag);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (index) {
      index.replayIds = index.replayIds.filter(id => id !== replayId);
      index.count = index.replayIds.length;
      
      if (index.count === 0) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(tag);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(index);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }
  }
}

// ============================================================================
// Thumbnail Operations
// ============================================================================

/**
 * Store a thumbnail for a replay
 */
export async function storeThumbnail(replayId: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    
    const thumbnail: ReplayThumbnail = {
      id: replayId,
      replayId,
      data: blob,
      width: 320,
      height: 180,
      createdAt: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORES.THUMBNAILS, 'readwrite')
        .objectStore(STORES.THUMBNAILS)
        .put(thumbnail);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Update metadata with thumbnail ID
    const transaction = db.transaction(STORES.METADATA, 'readwrite');
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).get(replayId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (metadata) {
      metadata.thumbnailId = replayId;
      metadata.updatedAt = Date.now();
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORES.METADATA).put(metadata);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error('[IndexedDB] Store thumbnail failed:', error);
  }
}

/**
 * Get thumbnail for a replay
 */
export async function getThumbnail(replayId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    
    const thumbnail = await new Promise<ReplayThumbnail | undefined>((resolve, reject) => {
      const request = db.transaction(STORES.THUMBNAILS)
        .objectStore(STORES.THUMBNAILS)
        .get(replayId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return thumbnail?.data || null;
  } catch (error) {
    console.error('[IndexedDB] Get thumbnail failed:', error);
    return null;
  }
}

// ============================================================================
// Quota Management
// ============================================================================

/**
 * Get current storage quota information
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  try {
    // Try to get actual storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const total = estimate.quota || 0;
      const used = estimate.usage || 0;
      
      const db = await getDB();
      const allMetadata = await new Promise<ReplayMetadata[]>((resolve, reject) => {
        const request = db.transaction(STORES.METADATA)
          .objectStore(STORES.METADATA)
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      return {
        total,
        used,
        available: total - used,
        replayCount: allMetadata.length,
      };
    }
    
    // Fallback: calculate from metadata
    const db = await getDB();
    const allMetadata = await new Promise<ReplayMetadata[]>((resolve, reject) => {
      const request = db.transaction(STORES.METADATA)
        .objectStore(STORES.METADATA)
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const used = allMetadata.reduce((sum, m) => sum + (m.compressedSize || m.fileSize), 0);
    
    return {
      total: 0,
      used,
      available: 0,
      replayCount: allMetadata.length,
    };
  } catch (error) {
    console.error('[IndexedDB] Get quota failed:', error);
    return { total: 0, used: 0, available: 0, replayCount: 0 };
  }
}

/**
 * Clean up old replays to free space
 */
export async function cleanupStorage(
  strategy: 'oldest' | 'least_accessed' | 'largest' = 'oldest',
  targetBytes: number = 100 * 1024 * 1024 // 100MB
): Promise<{ deleted: number; freed: number }> {
  try {
    const db = await getDB();
    const allMetadata = await new Promise<ReplayMetadata[]>((resolve, reject) => {
      const request = db.transaction(STORES.METADATA)
        .objectStore(STORES.METADATA)
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Sort based on strategy
    let sorted = [...allMetadata];
    switch (strategy) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'least_accessed':
        sorted.sort((a, b) => a.accessCount - b.accessCount);
        break;
      case 'largest':
        sorted.sort((a, b) => (b.compressedSize || b.fileSize) - (a.compressedSize || a.fileSize));
        break;
    }
    
    let freed = 0;
    let deleted = 0;
    
    for (const meta of sorted) {
      if (freed >= targetBytes) break;
      
      const result = await deleteReplay(meta.id);
      if (result.success) {
        freed += meta.compressedSize || meta.fileSize;
        deleted++;
      }
    }
    
    return { deleted, freed };
  } catch (error) {
    console.error('[IndexedDB] Cleanup failed:', error);
    return { deleted: 0, freed: 0 };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateAccessStats(id: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.REPLAYS, STORES.METADATA], 'readwrite');
    
    const now = Date.now();
    
    // Update replay stats
    const stored = await new Promise<StoredReplay>((resolve, reject) => {
      const request = transaction.objectStore(STORES.REPLAYS).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (stored) {
      stored.accessCount++;
      stored.lastAccessed = now;
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORES.REPLAYS).put(stored);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    // Update metadata stats
    const metadata = await new Promise<ReplayMetadata>((resolve, reject) => {
      const request = transaction.objectStore(STORES.METADATA).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (metadata) {
      metadata.accessCount++;
      metadata.lastAccessed = now;
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORES.METADATA).put(metadata);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.warn('[IndexedDB] Update access stats failed:', error);
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
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
  closeDB,
  deleteDB,
};
