/**
 * Generic Cache Utility with TTL support
 * Provides consistent caching behavior across all hub hooks
 * [Ver001.000]
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL?: number;
  /** Maximum number of entries for LRU eviction (default: unlimited) */
  maxEntries?: number;
}

/**
 * Generic Cache class with TTL and optional LRU eviction
 * @template T The type of data stored in the cache
 */
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxEntries?: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.defaultTTL ?? 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = options.maxEntries;
  }

  /**
   * Get data from cache if it exists and hasn't expired
   * @param key Cache key
   * @returns The cached data or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    // Move to end for LRU (if maxEntries is set)
    if (this.maxEntries) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }

    return entry.data;
  }

  /**
   * Store data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Optional custom TTL for this entry
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if at capacity
    if (this.maxEntries && this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get the timestamp when a key was cached
   * @param key Cache key
   * @returns Timestamp or null if not found
   */
  getTimestamp(key: string): number | null {
    const entry = this.cache.get(key);
    return entry ? entry.timestamp : null;
  }

  /**
   * Get all valid (non-expired) keys
   */
  keys(): string[] {
    const validKeys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp <= this.defaultTTL) {
        validKeys.push(key);
      } else {
        this.cache.delete(key);
      }
    }
    return validKeys;
  }

  /**
   * Get cache size (number of entries)
   */
  size(): number {
    // Clean up expired entries first
    this.keys();
    return this.cache.size;
  }
}

/**
 * Create a cache instance with default 5-minute TTL
 * Pre-configured for hub data caching
 */
export function createHubCache<T>() {
  return new Cache<T>({ defaultTTL: 5 * 60 * 1000 });
}

export default Cache;
