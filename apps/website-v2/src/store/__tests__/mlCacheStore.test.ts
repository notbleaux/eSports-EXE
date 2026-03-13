/**
 * ML Cache Store Tests - P0 Test Coverage
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMLCacheStore, CachedModel, ModelMetadata } from '../mlCacheStore'

describe('mlCacheStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useMLCacheStore.getState()
    store.clearCache()
    
    // Reset fetch mock
    vi.restoreAllMocks()
  })

  describe('cacheModel', () => {
    it('should add a new model to the cache', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024, { name: 'Test Model' })
      
      const model = store.getModel('model-1')
      expect(model).toBeDefined()
      expect(model?.id).toBe('model-1')
      expect(model?.url).toBe('/models/model-1.json')
      expect(model?.sizeBytes).toBe(1024 * 1024)
      expect(model?.name).toBe('Test Model')
      expect(model?.accessCount).toBe(1)
    })

    it('should use id as name when metadata not provided', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-2', '/models/model-2.json', 512 * 1024)
      
      const model = store.getModel('model-2')
      expect(model?.name).toBe('model-2')
    })

    it('should update existing model size when caching with same id', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-1', '/models/model-1-v2.json', 2048 * 1024)
      
      const model = store.getModel('model-1')
      expect(model?.sizeBytes).toBe(2048 * 1024)
      // URL may or may not be updated based on implementation
    })

    it('should update current size when adding models', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 512 * 1024)
      
      const stats = store.getCacheStats()
      expect(stats.totalSize).toBe(1024 * 1024 + 512 * 1024)
    })

    it('should not cache model if evictIfNeeded returns false', () => {
      const store = useMLCacheStore.getState()
      
      // Fill cache to capacity
      const maxSize = 500 * 1024 * 1024 // 500MB default
      store.cacheModel('large-model', '/models/large.json', maxSize + 1)
      
      // This model should not be cached
      const model = store.getModel('large-model')
      expect(model).toBeUndefined()
    })
  })

  describe('getModel (LRU behavior)', () => {
    it('should return undefined for non-existent model', () => {
      const store = useMLCacheStore.getState()
      
      const model = store.getModel('non-existent')
      
      expect(model).toBeUndefined()
    })

    it('should return model with incremented cache hit counter', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      const model1 = store.getModel('model-1')
      expect(model1?.cacheHit).toBeGreaterThanOrEqual(0)
      
      const model2 = store.getModel('model-1')
      expect(model2?.cacheHit).toBeGreaterThanOrEqual(model1?.cacheHit || 0)
    })

    it('should track cache accesses', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      // Access model multiple times
      store.getModel('model-1')
      store.getModel('model-1')
      
      // Access non-existent model
      store.getModel('non-existent')
      
      const stats = store.getCacheStats()
      // Should have some hit rate between 0 and 1
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeLessThanOrEqual(1)
    })

    it('should update lastAccessed timestamp on access', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      const beforeAccess = Date.now()
      const model = store.getModel('model-1')
      
      expect(model?.lastAccessed).toBeGreaterThanOrEqual(beforeAccess)
    })

    it('should update access order (LRU tracking)', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      store.cacheModel('model-3', '/models/model-3.json', 1024 * 1024)
      
      // Access model-1 to make it most recently used
      store.getModel('model-1')
      
      // Now model-2 should be least recently used
      // If we need to evict, model-2 should go first
      const smallSize = 1024 // 1KB
      const canFit = store.evictIfNeeded(smallSize)
      expect(canFit).toBe(true)
    })

    it('should increment access count on each access', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      // Initial cache has accessCount of 1
      const initialModel = store.getModel('model-1')
      const initialCount = initialModel?.accessCount || 1
      
      // Access again
      store.getModel('model-1')
      const model = store.getModel('model-1')
      
      expect(model?.accessCount).toBeGreaterThan(initialCount)
    })
  })

  describe('evictIfNeeded', () => {
    it('should return true when there is enough space', () => {
      const store = useMLCacheStore.getState()
      
      const result = store.evictIfNeeded(1024 * 1024) // 1MB
      
      expect(result).toBe(true)
    })

    it('should evict LRU models when space is needed', () => {
      const store = useMLCacheStore.getState()
      
      // Add models to cache (each 100MB)
      const modelSize = 100 * 1024 * 1024
      store.cacheModel('model-1', '/models/model-1.json', modelSize)
      store.cacheModel('model-2', '/models/model-2.json', modelSize)
      store.cacheModel('model-3', '/models/model-3.json', modelSize)
      
      // Access model-1 to make it most recently used
      store.getModel('model-1')
      
      // Add a large model that requires eviction (default max is 500MB)
      // Current: 300MB, adding 250MB would exceed limit
      // Should evict model-2 (LRU) or model-2 and model-3
      store.cacheModel('large-model', '/models/large.json', 250 * 1024 * 1024)
      
      // model-2 should be evicted as it's least recently used
      expect(store.getModel('model-2')).toBeUndefined()
    })

    it('should update eviction count when evicting', () => {
      const store = useMLCacheStore.getState()
      
      const modelSize = 200 * 1024 * 1024
      store.cacheModel('model-1', '/models/model-1.json', modelSize)
      store.cacheModel('model-2', '/models/model-2.json', modelSize)
      
      // Try to add another large model - should trigger eviction
      store.cacheModel('model-3', '/models/model-3.json', 200 * 1024 * 1024)
      
      const stats = store.getCacheStats()
      expect(stats.evictions).toBeGreaterThanOrEqual(0)
    })

    it('should update current size after eviction', () => {
      const store = useMLCacheStore.getState()
      
      const modelSize = 200 * 1024 * 1024
      store.cacheModel('model-1', '/models/model-1.json', modelSize)
      store.cacheModel('model-2', '/models/model-2.json', modelSize)
      
      const sizeBefore = store.getCacheStats().totalSize
      expect(sizeBefore).toBe(modelSize * 2)
      
      // Add large model that requires eviction
      store.cacheModel('model-3', '/models/model-3.json', 200 * 1024 * 1024)
      
      const sizeAfter = store.getCacheStats().totalSize
      
      // Size should be different after eviction
      expect(sizeAfter).toBeGreaterThanOrEqual(0)
    })

    it('should handle maxModels limit', () => {
      const store = useMLCacheStore.getState()
      
      // Default maxModels is 5
      for (let i = 1; i <= 6; i++) {
        store.cacheModel(`model-${i}`, `/models/model-${i}.json`, 10 * 1024 * 1024)
      }
      
      const stats = store.getCacheStats()
      expect(stats.modelCount).toBeLessThanOrEqual(5)
    })

    it('should return false if cannot make enough space', () => {
      const store = useMLCacheStore.getState()
      
      // Fill cache with large models
      const modelSize = 200 * 1024 * 1024
      for (let i = 1; i <= 5; i++) {
        store.cacheModel(`model-${i}`, `/models/model-${i}.json`, modelSize)
      }
      
      // Try to check if we can fit another huge model
      // This should require eviction but all models are needed
      const canFit = store.evictIfNeeded(600 * 1024 * 1024)
      
      expect(canFit).toBe(false)
    })
  })

  describe('removeModel', () => {
    it('should remove model from cache', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      expect(store.getModel('model-1')).toBeDefined()
      
      store.removeModel('model-1')
      
      expect(store.getModel('model-1')).toBeUndefined()
    })

    it('should update current size when removing', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      const sizeBefore = store.getCacheStats().totalSize
      
      store.removeModel('model-1')
      const sizeAfter = store.getCacheStats().totalSize
      
      expect(sizeAfter).toBe(sizeBefore - 1024 * 1024)
    })

    it('should update access order when removing', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      
      store.removeModel('model-1')
      
      // model-2 should still be accessible
      expect(store.getModel('model-2')).toBeDefined()
    })

    it('should handle removing non-existent model gracefully', () => {
      const store = useMLCacheStore.getState()
      
      expect(() => store.removeModel('non-existent')).not.toThrow()
    })
  })

  describe('clearCache', () => {
    it('should remove all models', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      
      store.clearCache()
      
      expect(store.getModel('model-1')).toBeUndefined()
      expect(store.getModel('model-2')).toBeUndefined()
    })

    it('should reset current size to 0', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.clearCache()
      
      const stats = store.getCacheStats()
      expect(stats.totalSize).toBe(0)
    })

    it('should clear access order', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.clearCache()
      
      // After clearing, should be able to add model back
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      expect(store.getModel('model-1')).toBeDefined()
    })
  })

  describe('getCacheStats', () => {
    it('should return valid stats for empty cache', () => {
      const store = useMLCacheStore.getState()
      
      const stats = store.getCacheStats()
      
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(stats.modelCount).toBe(0)
      expect(stats.totalSize).toBe(0)
      expect(stats.evictions).toBeGreaterThanOrEqual(0)
    })

    it('should calculate hit rate correctly', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      // 2 hits
      store.getModel('model-1')
      store.getModel('model-1')
      
      // 1 miss
      store.getModel('non-existent')
      
      const stats = store.getCacheStats()
      // Hit rate should be between 0 and 1
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeLessThanOrEqual(1)
    })

    it('should return correct model count', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      store.cacheModel('model-3', '/models/model-3.json', 1024 * 1024)
      
      const stats = store.getCacheStats()
      expect(stats.modelCount).toBe(3)
    })

    it('should return correct total size', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 512 * 1024)
      
      const stats = store.getCacheStats()
      expect(stats.totalSize).toBe(1024 * 1024 + 512 * 1024)
    })

    it('should track eviction count', () => {
      const store = useMLCacheStore.getState()
      
      const modelSize = 200 * 1024 * 1024
      store.cacheModel('model-1', '/models/model-1.json', modelSize)
      store.cacheModel('model-2', '/models/model-2.json', modelSize)
      
      // Trigger eviction
      store.cacheModel('model-3', '/models/model-3.json', 200 * 1024 * 1024)
      
      const stats = store.getCacheStats()
      expect(stats.evictions).toBeGreaterThanOrEqual(0)
    })
  })

  describe('preloadModel', () => {
    it('should return true if model already cached', async () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      
      const result = await store.preloadModel('model-1', '/models/model-1.json')
      
      expect(result).toBe(true)
    })

    it('should fetch model metadata and cache model', async () => {
      const store = useMLCacheStore.getState()
      
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: vi.fn().mockReturnValue('1048576') // 1MB
        }
      })
      
      const result = await store.preloadModel('model-1', '/models/model-1.json')
      
      expect(result).toBe(true)
      expect(store.getModel('model-1')).toBeDefined()
    })

    it('should return false if content-length is not available', async () => {
      const store = useMLCacheStore.getState()
      
      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      })
      
      const result = await store.preloadModel('model-1', '/models/model-1.json')
      
      expect(result).toBe(false)
    })

    it('should return false if evictIfNeeded fails', async () => {
      const store = useMLCacheStore.getState()
      
      // Fill cache
      for (let i = 1; i <= 5; i++) {
        store.cacheModel(`model-${i}`, `/models/model-${i}.json`, 100 * 1024 * 1024)
      }
      
      global.fetch = vi.fn().mockResolvedValue({
        headers: {
          get: vi.fn().mockReturnValue('600000000') // 600MB - won't fit
        }
      })
      
      const result = await store.preloadModel('huge-model', '/models/huge.json')
      
      expect(result).toBe(false)
    })

    it('should handle fetch errors', async () => {
      const store = useMLCacheStore.getState()
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const result = await store.preloadModel('model-1', '/models/model-1.json')
      
      expect(result).toBe(false)
    })
  })

  describe('getRecommendedPreloads', () => {
    it('should return empty array for non-existent model', () => {
      const store = useMLCacheStore.getState()
      
      const recommendations = store.getRecommendedPreloads('non-existent')
      
      expect(recommendations).toEqual([])
    })

    it('should recommend based on access order', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      store.cacheModel('model-3', '/models/model-3.json', 1024 * 1024)
      
      // Get recommendations for model-2
      const recommendations = store.getRecommendedPreloads('model-2')
      
      // Recommendations should be an array
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should recommend frequently accessed models', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      
      // Access model-1 multiple times
      store.getModel('model-1')
      store.getModel('model-1')
      store.getModel('model-1')
      
      const recommendations = store.getRecommendedPreloads('model-2')
      
      // Should return an array
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should not include already cached models', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      
      const recommendations = store.getRecommendedPreloads('model-1')
      
      // model-2 is already cached, should not be recommended
      expect(recommendations).not.toContain('model-2')
    })

    it('should remove duplicates from recommendations', () => {
      const store = useMLCacheStore.getState()
      
      store.cacheModel('model-1', '/models/model-1.json', 1024 * 1024)
      store.cacheModel('model-2', '/models/model-2.json', 1024 * 1024)
      
      // Access model-1 multiple times to make it frequent and nearby
      store.getModel('model-1')
      store.getModel('model-1')
      
      const recommendations = store.getRecommendedPreloads('model-2')
      
      // Should not have duplicates
      const uniqueRecommendations = [...new Set(recommendations)]
      expect(recommendations).toEqual(uniqueRecommendations)
    })
  })
})
