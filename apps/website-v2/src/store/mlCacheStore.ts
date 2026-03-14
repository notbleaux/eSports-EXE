/**
 * ML Cache Store - Smart Model Caching with LRU Eviction
 * Manages multiple models with predictive preloading
 * 
 * [Ver001.000]
 */

import { create } from 'zustand'

export interface CachedModel {
  id: string
  url: string
  name: string
  sizeBytes: number
  lastAccessed: number
  accessCount: number
  quantization: 'fp32' | 'int16' | 'int8'
  cacheHit: number
  cacheMiss: number
}

export interface ModelMetadata {
  name: string
  description?: string
  tags?: string[]
  priority?: number // 1-10, higher = more important
}

interface MLCacheState {
  // Cache storage
  cachedModels: Map<string, CachedModel>
  accessOrder: string[] // LRU tracking - most recent at end
  
  // Configuration
  maxCacheSize: number // bytes
  maxModels: number
  currentSize: number
  
  // Analytics
  totalHits: number
  totalMisses: number
  evictionCount: number
}

interface MLCacheActions {
  // Core operations
  getModel: (id: string) => CachedModel | undefined
  cacheModel: (id: string, url: string, sizeBytes: number, metadata?: ModelMetadata) => void
  accessModel: (id: string) => void
  removeModel: (id: string) => void
  
  // Cache management
  evictIfNeeded: (requiredSpace: number) => boolean
  preloadModel: (id: string, url: string) => Promise<boolean>
  clearCache: () => void
  
  // Analytics
  getCacheStats: () => {
    hitRate: number
    modelCount: number
    totalSize: number
    evictions: number
  }
  
  // Predictive
  getRecommendedPreloads: (currentModelId: string) => string[]
}

const DEFAULT_MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB
const DEFAULT_MAX_MODELS = 5

export const useMLCacheStore = create<MLCacheState & MLCacheActions>((set, get) => ({
  // Initial state
  cachedModels: new Map(),
  accessOrder: [],
  maxCacheSize: DEFAULT_MAX_CACHE_SIZE,
  maxModels: DEFAULT_MAX_MODELS,
  currentSize: 0,
  totalHits: 0,
  totalMisses: 0,
  evictionCount: 0,

  /**
   * Get model from cache (updates access time)
   */
  getModel: (id: string) => {
    const state = get()
    const model = state.cachedModels.get(id)
    
    if (model) {
      // Update access tracking
      get().accessModel(id)
      
      set(state => ({
        totalHits: state.totalHits + 1
      }))
      
      return { ...model, cacheHit: model.cacheHit + 1 }
    }
    
    set(state => ({
      totalMisses: state.totalMisses + 1
    }))
    
    return undefined
  },

  /**
   * Add model to cache
   */
  cacheModel: (id: string, url: string, sizeBytes: number, metadata?: ModelMetadata) => {
    const state = get()
    
    // Check if already cached
    if (state.cachedModels.has(id)) {
      // Update existing
      const existing = state.cachedModels.get(id)!
      const sizeDiff = sizeBytes - existing.sizeBytes
      
      set(state => ({
        cachedModels: new Map(state.cachedModels).set(id, {
          ...existing,
          sizeBytes,
          lastAccessed: Date.now()
        }),
        currentSize: state.currentSize + sizeDiff
      }))
      return
    }
    
    // Evict if needed
    if (!get().evictIfNeeded(sizeBytes)) {
      // Cannot cache model - not enough space
      return
    }
    
    // Add new model
    const newModel: CachedModel = {
      id,
      url,
      name: metadata?.name || id,
      sizeBytes,
      lastAccessed: Date.now(),
      accessCount: 1,
      quantization: 'fp32',
      cacheHit: 0,
      cacheMiss: 0
    }
    
    set(state => ({
      cachedModels: new Map(state.cachedModels).set(id, newModel),
      accessOrder: [...state.accessOrder, id],
      currentSize: state.currentSize + sizeBytes
    }))
    
    // Model cached successfully
  },

  /**
   * Update access tracking for LRU
   */
  accessModel: (id: string) => {
    set(state => {
      const model = state.cachedModels.get(id)
      if (!model) return state
      
      // Move to end of access order (most recent)
      const newOrder = state.accessOrder.filter(m => m !== id)
      newOrder.push(id)
      
      return {
        accessOrder: newOrder,
        cachedModels: new Map(state.cachedModels).set(id, {
          ...model,
          lastAccessed: Date.now(),
          accessCount: model.accessCount + 1
        })
      }
    })
  },

  /**
   * Remove model from cache
   */
  removeModel: (id: string) => {
    set(state => {
      const model = state.cachedModels.get(id)
      if (!model) return state
      
      const newModels = new Map(state.cachedModels)
      newModels.delete(id)
      
      return {
        cachedModels: newModels,
        accessOrder: state.accessOrder.filter(m => m !== id),
        currentSize: state.currentSize - model.sizeBytes
      }
    })
    
    // Model removed from cache
  },

  /**
   * Evict models to make space (LRU policy)
   */
  evictIfNeeded: (requiredSpace: number) => {
    const state = get()
    
    // Check if we have room
    if (state.currentSize + requiredSpace <= state.maxCacheSize &&
        state.cachedModels.size < state.maxModels) {
      return true
    }
    
    // Evict LRU models until we have space
    let freedSpace = 0
    const modelsToEvict: string[] = []
    
    for (const id of state.accessOrder) {
      const model = state.cachedModels.get(id)
      if (model) {
        modelsToEvict.push(id)
        freedSpace += model.sizeBytes
        
        if (state.currentSize - freedSpace + requiredSpace <= state.maxCacheSize &&
            state.cachedModels.size - modelsToEvict.length < state.maxModels) {
          break
        }
      }
    }
    
    // Perform eviction
    if (modelsToEvict.length > 0) {
      const newModels = new Map(state.cachedModels)
      let totalFreed = 0
      
      for (const id of modelsToEvict) {
        const model = newModels.get(id)
        if (model) {
          totalFreed += model.sizeBytes
          newModels.delete(id)
        }
      }
      
      set(state => ({
        cachedModels: newModels,
        accessOrder: state.accessOrder.filter(id => !modelsToEvict.includes(id)),
        currentSize: state.currentSize - totalFreed,
        evictionCount: state.evictionCount + modelsToEvict.length
      }))
      
      // Models evicted to free space
    }
    
    // Check if we have enough space now
    const newState = get()
    return newState.currentSize + requiredSpace <= newState.maxCacheSize &&
           newState.cachedModels.size < newState.maxModels
  },

  /**
   * Preload model into cache
   */
  preloadModel: async (id: string, url: string) => {
    // Check if already cached
    if (get().cachedModels.has(id)) {
      return true
    }
    
    try {
      // Fetch model metadata (HEAD request)
      const response = await fetch(url, { method: 'HEAD' })
      const sizeBytes = parseInt(response.headers.get('content-length') || '0')
      
      if (sizeBytes === 0) {
        // Cannot determine model size for preloading
        return false
      }
      
      // Check if we can cache it
      if (!get().evictIfNeeded(sizeBytes)) {
        return false
      }
      
      // Cache the model entry (actual loading happens in useMLInference)
      get().cacheModel(id, url, sizeBytes, { name: id })
      
      // Model preloaded successfully
      return true
      
    } catch (err) {
      // Preload failed
      return false
    }
  },

  /**
   * Clear all cached models
   */
  clearCache: () => {
    set({
      cachedModels: new Map(),
      accessOrder: [],
      currentSize: 0
    })
    
    // Cache cleared
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const state = get()
    const total = state.totalHits + state.totalMisses
    
    return {
      hitRate: total > 0 ? state.totalHits / total : 0,
      modelCount: state.cachedModels.size,
      totalSize: state.currentSize,
      evictions: state.evictionCount
    }
  },

  /**
   * Get recommended models to preload based on current context
   */
  getRecommendedPreloads: (currentModelId: string) => {
    const state = get()
    const recommendations: string[] = []
    
    // Find models with similar tags or names
    const currentModel = state.cachedModels.get(currentModelId)
    if (!currentModel) return recommendations
    
    // Simple recommendation: models accessed around the same time
    const currentIndex = state.accessOrder.indexOf(currentModelId)
    
    // Recommend nearby models in access order
    if (currentIndex > 0) {
      recommendations.push(state.accessOrder[currentIndex - 1])
    }
    if (currentIndex < state.accessOrder.length - 1) {
      recommendations.push(state.accessOrder[currentIndex + 1])
    }
    
    // Recommend frequently accessed models
    const frequentModels = Array.from(state.cachedModels.values())
      .filter(m => m.id !== currentModelId)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 2)
      .map(m => m.id)
    
    recommendations.push(...frequentModels)
    
    // Remove duplicates and already cached
    return [...new Set(recommendations)]
      .filter(id => !state.cachedModels.has(id))
  }
}))

export default useMLCacheStore
