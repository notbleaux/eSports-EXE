/**
 * ML Loader Utility - Dynamic TensorFlow.js Loading with Progress Tracking
 * 
 * [Ver001.000] - Lazy loading for ML models to reduce initial bundle
 * 
 * This module provides:
 * - Dynamic import of TensorFlow.js (not in initial bundle)
 * - Model loading on demand with progress callbacks
 * - Global model cache to avoid redundant loads
 * - Memory management and cleanup
 * - Feature flag integration
 */

import type { ModelInfo, LoadOptions, WarmUpOptions } from '../types/ml'
import { mlLogger } from '../utils/logger'

// ============================================================================
// Types
// ============================================================================

export type TFModule = typeof import('@tensorflow/tfjs')
export type TFBackend = 'webgl' | 'cpu' | 'wasm' | 'webgpu'

export interface MLLoadProgress {
  stage: 'initializing' | 'loading' | 'downloading' | 'caching' | 'complete'
  percent: number
  bytesLoaded?: number
  bytesTotal?: number
  message: string
}

export interface MLModelEntry {
  id: string
  url: string
  model: import('@tensorflow/tfjs').LayersModel | null
  info: ModelInfo
  loadedAt: number
  lastUsed: number
  useCount: number
  sizeBytes?: number
}

export interface MLFeatureConfig {
  enabled: boolean
  autoLoadOnRoutes: string[]
  preferredBackend: TFBackend
  fallbackBackend: TFBackend
  maxModelsInMemory: number
  enableCache: boolean
}

export type MLProgressCallback = (progress: MLLoadProgress) => void

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: MLFeatureConfig = {
  enabled: false, // ML disabled by default
  autoLoadOnRoutes: ['/hub-1-sator', '/analytics', '/predictions'],
  preferredBackend: 'webgl',
  fallbackBackend: 'cpu',
  maxModelsInMemory: 3,
  enableCache: true
}

// Model storage keys
const CACHE_PREFIX = 'sator:ml:model:'
const CONFIG_KEY = 'sator:ml:config'

// ============================================================================
// State
// ============================================================================

let tfModule: TFModule | null = null
let isLoadingTF = false
let tfLoadPromise: Promise<TFModule> | null = null
let currentBackend: TFBackend | null = null
let config: MLFeatureConfig = { ...DEFAULT_CONFIG }

// Global model cache
const modelCache = new Map<string, MLModelEntry>()

// Track loaded models for LRU eviction
const accessOrder: string[] = []

// ============================================================================
// Feature Flag Management
// ============================================================================

/**
 * Check if ML features are enabled
 */
export function isMLEnabled(): boolean {
  // Check localStorage override first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.enabled ?? false
      } catch {
        // Invalid config, ignore
      }
    }
  }
  return config.enabled
}

/**
 * Enable/disable ML features
 */
export function setMLEnabled(enabled: boolean): void {
  config.enabled = enabled
  saveConfig()
  mlLogger.info(`[ML Loader] ML features ${enabled ? 'enabled' : 'disabled'}`)
}

/**
 * Check if current route should auto-load ML
 */
export function shouldAutoLoadML(currentPath: string): boolean {
  if (!isMLEnabled()) return false
  
  return config.autoLoadOnRoutes.some(route => 
    currentPath.startsWith(route)
  )
}

/**
 * Update ML configuration
 */
export function updateMLConfig(updates: Partial<MLFeatureConfig>): void {
  config = { ...config, ...updates }
  saveConfig()
}

/**
 * Get current ML configuration
 */
export function getMLConfig(): MLFeatureConfig {
  return { ...config }
}

function saveConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }
}

function loadConfig(): void {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        config = { ...DEFAULT_CONFIG, ...parsed }
      } catch {
        // Invalid config, use defaults
      }
    }
  }
}

// Load config on module init
loadConfig()

// ============================================================================
// TensorFlow.js Dynamic Loading
// ============================================================================

/**
 * Dynamically load TensorFlow.js module
 * This is the key function that prevents TF.js from being in the initial bundle
 */
export async function loadTensorFlow(
  backend: TFBackend = config.preferredBackend,
  onProgress?: MLProgressCallback
): Promise<TFModule> {
  // Return cached module if available
  if (tfModule) {
    if (currentBackend === backend) {
      return tfModule
    }
    // Need to switch backend
    await setBackend(backend)
    return tfModule
  }

  // Return existing promise if already loading
  if (tfLoadPromise) {
    return tfLoadPromise
  }

  // Start loading
  isLoadingTF = true
  onProgress?.({
    stage: 'initializing',
    percent: 0,
    message: 'Initializing ML engine...'
  })

  tfLoadPromise = (async (): Promise<TFModule> => {
    try {
      onProgress?.({
        stage: 'loading',
        percent: 10,
        message: 'Loading TensorFlow.js...'
      })

      // Dynamic import - this is the key line that keeps TF.js out of the initial bundle
      const tf = await import('@tensorflow/tfjs')
      tfModule = tf

      onProgress?.({
        stage: 'initializing',
        percent: 30,
        message: 'Setting up backend...'
      })

      // Set backend
      await setBackend(backend)

      onProgress?.({
        stage: 'complete',
        percent: 100,
        message: 'ML engine ready'
      })

      mlLogger.info('[ML Loader] TensorFlow.js loaded successfully')
      return tf
    } catch (error) {
      mlLogger.error('[ML Loader] Failed to load TensorFlow.js:', error)
      throw new Error(`Failed to load TensorFlow.js: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      isLoadingTF = false
      tfLoadPromise = null
    }
  })()

  return tfLoadPromise
}

/**
 * Set TensorFlow.js backend
 */
export async function setBackend(backend: TFBackend): Promise<void> {
  if (!tfModule) {
    throw new Error('TensorFlow.js not loaded')
  }

  try {
    await tfModule.setBackend(backend)
    await tfModule.ready()
    currentBackend = backend
    mlLogger.info(`[ML Loader] Backend set to: ${backend}`)
  } catch (error) {
    mlLogger.warn(`[ML Loader] Failed to set ${backend} backend, trying fallback...`)
    
    if (backend !== config.fallbackBackend) {
      await tfModule.setBackend(config.fallbackBackend)
      await tfModule.ready()
      currentBackend = config.fallbackBackend
      mlLogger.info(`[ML Loader] Fallback backend set to: ${config.fallbackBackend}`)
    } else {
      throw error
    }
  }
}

/**
 * Get current backend
 */
export function getCurrentBackend(): TFBackend | null {
  return currentBackend
}

/**
 * Check if TensorFlow.js is loaded
 */
export function isTensorFlowLoaded(): boolean {
  return tfModule !== null
}

// ============================================================================
// Model Loading with Caching
// ============================================================================

/**
 * Load a model with caching and progress tracking
 */
export async function loadModel(
  url: string,
  options: LoadOptions = {},
  onProgress?: MLProgressCallback
): Promise<import('@tensorflow/tfjs').LayersModel> {
  const { name = extractModelName(url), quantization } = options
  const cacheKey = `${name}:${quantization || 'fp32'}`

  // Check cache first
  const cached = modelCache.get(cacheKey)
  if (cached && cached.model) {
    cached.lastUsed = Date.now()
    cached.useCount++
    updateAccessOrder(cacheKey)
    mlLogger.debug(`[ML Loader] Model loaded from memory cache: ${name}`)
    return cached.model
  }

  // Ensure TF is loaded
  const tf = await loadTensorFlow(config.preferredBackend, onProgress)

  onProgress?.({
    stage: 'loading',
    percent: 40,
    message: `Loading model: ${name}...`
  })

  // Try IndexedDB cache first
  let model: import('@tensorflow/tfjs').LayersModel
  const indexedDbKey = `${CACHE_PREFIX}${cacheKey}`

  try {
    if (config.enableCache) {
      model = await tf.loadLayersModel(`indexeddb://${indexedDbKey}`)
      mlLogger.debug(`[ML Loader] Model loaded from IndexedDB: ${name}`)
    } else {
      throw new Error('Cache disabled')
    }
  } catch {
    // Load from network
    onProgress?.({
      stage: 'downloading',
      percent: 50,
      message: `Downloading model from ${url}...`
    })

    model = await tf.loadLayersModel(url, {
      onProgress: (fraction: number) => {
        onProgress?.({
          stage: 'downloading',
          percent: 50 + Math.floor(fraction * 40),
          message: `Downloading model: ${Math.round(fraction * 100)}%`
        })
      }
    })

    // Cache to IndexedDB
    if (config.enableCache) {
      onProgress?.({
        stage: 'caching',
        percent: 90,
        message: 'Caching model for future use...'
      })

      try {
        await model.save(`indexeddb://${indexedDbKey}`)
        mlLogger.debug(`[ML Loader] Model cached to IndexedDB: ${name}`)
      } catch (cacheErr) {
        mlLogger.warn(`[ML Loader] Failed to cache model: ${cacheErr}`)
      }
    }
  }

  onProgress?.({
    stage: 'complete',
    percent: 100,
    message: 'Model ready'
  })

  // Store in memory cache
  const modelInfo: ModelInfo = {
    name,
    url,
    lastLoaded: new Date(),
    quantization: detectQuantization(url),
    backend: currentBackend || 'webgl'
  }

  const entry: MLModelEntry = {
    id: cacheKey,
    url,
    model,
    info: modelInfo,
    loadedAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 1
  }

  // Evict if needed before adding
  evictIfNeeded()

  modelCache.set(cacheKey, entry)
  accessOrder.push(cacheKey)

  mlLogger.info(`[ML Loader] Model loaded: ${name}`)
  return model
}

/**
 * Unload a model from memory (keeps IndexedDB cache)
 */
export function unloadModel(modelId: string): void {
  const entry = modelCache.get(modelId)
  if (entry) {
    entry.model?.dispose()
    modelCache.delete(modelId)
    const index = accessOrder.indexOf(modelId)
    if (index > -1) {
      accessOrder.splice(index, 1)
    }
    mlLogger.debug(`[ML Loader] Model unloaded: ${modelId}`)
  }
}

/**
 * Get a cached model without loading
 */
export function getCachedModel(modelId: string): MLModelEntry | undefined {
  const entry = modelCache.get(modelId)
  if (entry) {
    entry.lastUsed = Date.now()
    updateAccessOrder(modelId)
  }
  return entry
}

/**
 * Check if model is in cache
 */
export function isModelCached(modelId: string): boolean {
  return modelCache.has(modelId)
}

/**
 * Preload a model in the background
 */
export async function preloadModel(
  url: string,
  options: LoadOptions = {}
): Promise<void> {
  if (!isMLEnabled()) return

  try {
    await loadModel(url, options)
    mlLogger.debug(`[ML Loader] Model preloaded: ${options.name || extractModelName(url)}`)
  } catch (error) {
    mlLogger.warn(`[ML Loader] Preload failed:`, error)
  }
}

// ============================================================================
// Cache Management
// ============================================================================

function updateAccessOrder(modelId: string): void {
  const index = accessOrder.indexOf(modelId)
  if (index > -1) {
    accessOrder.splice(index, 1)
  }
  accessOrder.push(modelId)
}

function evictIfNeeded(): void {
  while (modelCache.size >= config.maxModelsInMemory && accessOrder.length > 0) {
    const oldest = accessOrder.shift()
    if (oldest) {
      const entry = modelCache.get(oldest)
      if (entry) {
        entry.model?.dispose()
        modelCache.delete(oldest)
        mlLogger.debug(`[ML Loader] Evicted model from memory: ${oldest}`)
      }
    }
  }
}

/**
 * Clear all models from memory cache
 */
export function clearMemoryCache(): void {
  modelCache.forEach(entry => {
    entry.model?.dispose()
  })
  modelCache.clear()
  accessOrder.length = 0
  mlLogger.info('[ML Loader] Memory cache cleared')
}

/**
 * Clear IndexedDB cache
 */
export async function clearIndexedDBCache(): Promise<void> {
  if (!tfModule) return

  // List all cached models in IndexedDB
  const databases = await indexedDB.databases()
  const modelDbs = databases.filter(db => db.name?.startsWith('tensorflowjs'))
  
  for (const db of modelDbs) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name)
    }
  }

  mlLogger.info('[ML Loader] IndexedDB cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryModels: number
  memorySizeMB: number
  avgModelAge: number
  totalLoads: number
} {
  let totalLoads = 0
  let totalAge = 0
  const now = Date.now()

  modelCache.forEach(entry => {
    totalLoads += entry.useCount
    totalAge += now - entry.loadedAt
  })

  return {
    memoryModels: modelCache.size,
    memorySizeMB: 0, // Would need actual model size tracking
    avgModelAge: modelCache.size > 0 ? totalAge / modelCache.size : 0,
    totalLoads
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Dispose all resources and unload TensorFlow.js
 */
export function dispose(): void {
  clearMemoryCache()
  
  tfModule = null
  currentBackend = null
  tfLoadPromise = null
  
  mlLogger.info('[ML Loader] All ML resources disposed')
}

/**
 * Warm up model with dummy inference
 */
export async function warmUpModel(
  model: import('@tensorflow/tfjs').LayersModel,
  options: WarmUpOptions = {}
): Promise<void> {
  const { iterations = 3, verbose = false, progressive = true } = options
  
  if (!tfModule) {
    throw new Error('TensorFlow.js not loaded')
  }

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    const size = progressive ? Math.pow(2, i + 4) : 16
    const dummyInput = new Array(size).fill(0.5)
    
    if (verbose) {
      mlLogger.debug(`[ML Loader] Warm-up iteration ${i + 1}/${iterations} (size: ${size})`)
    }

    const inputTensor = tfModule.tensor2d([dummyInput])
    const outputTensor = model.predict(inputTensor) as import('@tensorflow/tfjs').Tensor
    
    // Cleanup
    inputTensor.dispose()
    outputTensor.dispose()
  }

  const duration = performance.now() - startTime
  mlLogger.debug(`[ML Loader] Model warmed up in ${duration.toFixed(1)}ms`)
}

// ============================================================================
// Helpers
// ============================================================================

function extractModelName(url: string): string {
  return url.split('/').pop()?.replace('.json', '') || 'unknown-model'
}

function detectQuantization(url: string): 'fp32' | 'int16' | 'int8' | 'unknown' {
  if (url.includes('int8')) return 'int8'
  if (url.includes('int16')) return 'int16'
  if (url.includes('fp32') || url.includes('float32')) return 'fp32'
  return 'unknown'
}

// ============================================================================
// React Hook Integration
// ============================================================================

/**
 * Hook-compatible wrapper for loading with progress
 */
export function createMLLoader() {
  return {
    loadTensorFlow,
    loadModel,
    unloadModel,
    isTensorFlowLoaded,
    isModelCached,
    getCacheStats,
    dispose
  }
}

export default createMLLoader
