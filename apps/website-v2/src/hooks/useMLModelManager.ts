/**
 * useMLModelManager - Multi-Model Management Hook
 * Manages 3+ models simultaneously with <50ms switching
 * Integrates with mlCacheStore for LRU eviction
 * 
 * [Ver001.001] - Migrated to centralized logger
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useMLCacheStore, type CachedModel } from '../store/mlCacheStore'
import { useMLInference, type ModelInfo } from './useMLInference'
import { mlLogger } from '../utils/logger'

export interface LoadedModel {
  id: string
  url: string
  name: string
  info: ModelInfo | null
  isLoading: boolean
  isReady: boolean
  loadedAt: number
  error: Error | null
  sizeBytes: number
  quantization: 'fp32' | 'int16' | 'int8'
}

export interface ModelComparison {
  modelA: LoadedModel
  modelB: LoadedModel
  sizeDiff: number // bytes
  sizeDiffPercent: number
  latencyDiff?: number // ms
  memoryDiff?: number // bytes
  recommendation: 'A' | 'B' | 'equivalent'
}

export interface LoadOptions {
  name?: string
  quantization?: 8 | 16 | 32
  priority?: number // 1-10, higher = keep longer
  preload?: boolean // Load immediately vs lazy
}

export interface ModelManagerState {
  models: Map<string, LoadedModel>
  activeModelId: string | null
  isSwitching: boolean
  totalMemoryUsage: number
}

export interface ModelManagerActions {
  loadModel: (id: string, url: string, options?: LoadOptions) => Promise<void>
  switchModel: (id: string) => Promise<void>
  unloadModel: (id: string) => void
  unloadAll: () => void
  compareModels: (idA: string, idB: string) => ModelComparison | null
  getLoadedModelCount: () => number
  getMemoryUsage: () => number
  getActiveModel: () => LoadedModel | null
  preloadModels: (configs: Array<{ id: string; url: string; options?: LoadOptions }>) => Promise<void>
}

const STORAGE_KEY = 'ml-model-manager-preferences'
const SWITCH_TIMEOUT = 50 // ms target

interface StoredPreferences {
  activeModelId: string | null
  lastUsed: Record<string, number> // modelId -> timestamp
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(): StoredPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore storage errors
  }
  return { activeModelId: null, lastUsed: {} }
}

/**
 * Save preferences to localStorage
 */
function savePreferences(prefs: StoredPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

export function useMLModelManager(): ModelManagerState & ModelManagerActions {
  const [models, setModels] = useState<Map<string, LoadedModel>>(new Map())
  const [activeModelId, setActiveModelId] = useState<string | null>(null)
  const [isSwitching, setIsSwitching] = useState(false)
  
  const mlInference = useMLInference()
  const cacheStore = useMLCacheStore()
  
  // Refs for tracking load operations
  const loadPromisesRef = useRef<Map<string, Promise<void>>>(new Map())
  const preferencesRef = useRef<StoredPreferences>(loadPreferences())
  
  // Load saved preference on mount
  useEffect(() => {
    const prefs = preferencesRef.current
    if (prefs.activeModelId && !activeModelId) {
      // Don't auto-switch, just restore the preference
      setActiveModelId(prefs.activeModelId)
    }
  }, [])
  
  // Save preference when active model changes
  useEffect(() => {
    if (activeModelId) {
      preferencesRef.current.activeModelId = activeModelId
      preferencesRef.current.lastUsed[activeModelId] = Date.now()
      savePreferences(preferencesRef.current)
    }
  }, [activeModelId])

  /**
   * Load a model by ID
   */
  const loadModel = useCallback(async (
    id: string,
    url: string,
    options: LoadOptions = {}
  ): Promise<void> => {
    const { name = id, quantization = 8, priority = 5, preload = true } = options
    
    // Check if already loading
    if (loadPromisesRef.current.has(id)) {
      return loadPromisesRef.current.get(id)!
    }
    
    // Check if already loaded
    const existing = models.get(id)
    if (existing?.isReady) {
      return
    }
    
    // Create load promise
    const loadPromise = (async () => {
      // Update state to loading
      setModels(prev => {
        const next = new Map(prev)
        next.set(id, {
          id,
          url,
          name,
          info: null,
          isLoading: true,
          isReady: false,
          loadedAt: 0,
          error: null,
          sizeBytes: 0,
          quantization: quantization === 8 ? 'int8' : quantization === 16 ? 'int16' : 'fp32'
        })
        return next
      })
      
      try {
        // Load via useMLInference
        await mlInference.loadModel(url, quantization)
        
        // Get model info
        const info = mlInference.getModelInfo()
        
        // Update cache store
        cacheStore.cacheModel(id, url, info?.sizeBytes || 0, { 
          name, 
          priority,
          tags: [quantization === 8 ? 'int8' : quantization === 16 ? 'int16' : 'fp32']
        })
        
        // Update state to ready
        setModels(prev => {
          const next = new Map(prev)
          const model = next.get(id)
          if (model) {
            model.isLoading = false
            model.isReady = true
            model.loadedAt = Date.now()
            model.info = info
            model.sizeBytes = info?.sizeBytes || 0
          }
          return next
        })
        
        mlLogger.info(`[ML Model Manager] Loaded model "${name}" (${id})`)
        
      } catch (err) {
        // Update state to error
        setModels(prev => {
          const next = new Map(prev)
          const model = next.get(id)
          if (model) {
            model.isLoading = false
            model.error = err instanceof Error ? err : new Error('Load failed')
          }
          return next
        })
        
        mlLogger.error(`[ML Model Manager] Failed to load model "${name}":`, err)
        throw err
      }
    })()
    
    loadPromisesRef.current.set(id, loadPromise)
    
    try {
      await loadPromise
    } finally {
      loadPromisesRef.current.delete(id)
    }
  }, [models, mlInference, cacheStore])

  /**
   * Switch to a different model (<50ms target)
   */
  const switchModel = useCallback(async (id: string): Promise<void> => {
    const startTime = performance.now()
    
    // Check if model exists
    const model = models.get(id)
    if (!model) {
      throw new Error(`Model "${id}" not found. Load it first.`)
    }
    
    // Already active
    if (activeModelId === id) {
      return
    }
    
    setIsSwitching(true)
    
    try {
      // If model is not ready, wait for it
      if (!model.isReady) {
        if (model.isLoading) {
          // Wait for existing load
          const loadPromise = loadPromisesRef.current.get(id)
          if (loadPromise) {
            await loadPromise
          }
        } else {
          throw new Error(`Model "${id}" is not loaded`)
        }
      }
      
      // Perform switch
      setActiveModelId(id)
      
      // Update access tracking
      cacheStore.accessModel(id)
      
      const switchTime = performance.now() - startTime
      mlLogger.info(`[ML Model Manager] Switched to "${model.name}" in ${switchTime.toFixed(1)}ms`)
      
      if (switchTime > SWITCH_TIMEOUT) {
        mlLogger.warn(`[ML Model Manager] Switch time exceeded target: ${switchTime.toFixed(1)}ms > ${SWITCH_TIMEOUT}ms`)
      }
      
    } finally {
      setIsSwitching(false)
    }
  }, [models, activeModelId, cacheStore])

  /**
   * Unload a model and free memory
   */
  const unloadModel = useCallback((id: string): void => {
    const model = models.get(id)
    if (!model) return
    
    // Remove from state
    setModels(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    
    // Remove from cache store
    cacheStore.removeModel(id)
    
    // If this was the active model, clear active
    if (activeModelId === id) {
      setActiveModelId(null)
    }
    
    mlLogger.info(`[ML Model Manager] Unloaded model "${model.name}" (${id})`)
  }, [models, activeModelId, cacheStore])

  /**
   * Unload all models
   */
  const unloadAll = useCallback((): void => {
    // Clear all models
    setModels(new Map())
    setActiveModelId(null)
    
    // Clear cache
    cacheStore.clearCache()
    
    mlLogger.info('[ML Model Manager] Unloaded all models')
  }, [cacheStore])

  /**
   * Compare two models
   */
  const compareModels = useCallback((idA: string, idB: string): ModelComparison | null => {
    const modelA = models.get(idA)
    const modelB = models.get(idB)
    
    if (!modelA || !modelB) {
      return null
    }
    
    const sizeDiff = modelA.sizeBytes - modelB.sizeBytes
    const sizeDiffPercent = modelB.sizeBytes > 0 
      ? (sizeDiff / modelB.sizeBytes) * 100 
      : 0
    
    // Determine recommendation
    let recommendation: 'A' | 'B' | 'equivalent' = 'equivalent'
    
    if (modelA.quantization === 'int8' && modelB.quantization !== 'int8') {
      // A is more quantized (smaller), B is larger - recommend A for most cases
      recommendation = sizeDiff < 0 ? 'A' : 'equivalent'
    } else if (modelB.quantization === 'int8' && modelA.quantization !== 'int8') {
      // B is more quantized
      recommendation = sizeDiff > 0 ? 'B' : 'equivalent'
    }
    
    return {
      modelA,
      modelB,
      sizeDiff,
      sizeDiffPercent,
      recommendation
    }
  }, [models])

  /**
   * Get count of loaded models
   */
  const getLoadedModelCount = useCallback((): number => {
    return Array.from(models.values()).filter(m => m.isReady).length
  }, [models])

  /**
   * Get total memory usage
   */
  const getMemoryUsage = useCallback((): number => {
    return Array.from(models.values())
      .filter(m => m.isReady)
      .reduce((sum, m) => sum + m.sizeBytes, 0)
  }, [models])

  /**
   * Get currently active model
   */
  const getActiveModel = useCallback((): LoadedModel | null => {
    return activeModelId ? models.get(activeModelId) || null : null
  }, [models, activeModelId])

  /**
   * Preload multiple models in parallel
   */
  const preloadModels = useCallback(async (
    configs: Array<{ id: string; url: string; options?: LoadOptions }>
  ): Promise<void> => {
    mlLogger.info(`[ML Model Manager] Preloading ${configs.length} models...`)
    
    const startTime = performance.now()
    
    // Load all in parallel
    await Promise.all(
      configs.map(({ id, url, options }) => 
        loadModel(id, url, { preload: true, ...options })
          .catch(err => {
            mlLogger.warn(`[ML Model Manager] Failed to preload model "${id}":`, err)
          })
      )
    )
    
    const duration = performance.now() - startTime
    const loadedCount = getLoadedModelCount()
    
    mlLogger.info(`[ML Model Manager] Preloaded ${loadedCount}/${configs.length} models in ${duration.toFixed(0)}ms`)
  }, [loadModel, getLoadedModelCount])

  // Calculate total memory usage
  const totalMemoryUsage = getMemoryUsage()

  // Memoize return object to prevent re-renders of consuming components
  return useMemo(() => ({
    // State
    models,
    activeModelId,
    isSwitching,
    totalMemoryUsage,
    
    // Actions
    loadModel,
    switchModel,
    unloadModel,
    unloadAll,
    compareModels,
    getLoadedModelCount,
    getMemoryUsage,
    getActiveModel,
    preloadModels
  }), [
    models,
    activeModelId,
    isSwitching,
    totalMemoryUsage,
    loadModel,
    switchModel,
    unloadModel,
    unloadAll,
    compareModels,
    getLoadedModelCount,
    getMemoryUsage,
    getActiveModel,
    preloadModels
  ])
}

export default useMLModelManager
