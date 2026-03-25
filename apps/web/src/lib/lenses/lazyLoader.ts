/** [Ver001.000]
 * Lazy Lens Loading System for NJZiteGeisTe Platform
 * Dynamic lens imports with preloading and memory management
 * 
 * Features:
 * - Dynamic import() for lens modules
 * - Preloading strategy based on lens weights
 * - Memory management with LRU eviction
 * - Loading state handling
 * - Performance profiling
 */

import type { Lens } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Lens module type - each lens file exports a lens object */
export interface LensModule {
  default?: Lens
  [key: string]: Lens | undefined
}

/** Lens loading state */
export type LensLoadingState = 'idle' | 'loading' | 'loaded' | 'error'

/** Lens metadata for lazy loading */
export interface LazyLensMeta {
  name: string
  displayName: string
  description: string
  category: 'analytical' | 'tactical' | 'base'
  weight: 'light' | 'medium' | 'heavy'
  /** Estimated memory usage in MB */
  memoryEstimate: number
  /** Module path for dynamic import */
  modulePath: string
  /** Export name in the module */
  exportName: string
  /** Priority for preloading (higher = load first) */
  preloadPriority: number
  /** Dependencies that must be loaded first */
  dependencies?: string[]
}

/** Loaded lens entry */
interface LoadedLensEntry {
  lens: Lens
  meta: LazyLensMeta
  state: LensLoadingState
  loadTime: number
  lastAccessed: number
  accessCount: number
  error?: Error
}

/** Lazy loader configuration */
export interface LazyLoaderConfig {
  /** Maximum number of lenses to keep in memory */
  maxCachedLenses: number
  /** Preload lenses on idle time */
  preloadOnIdle: boolean
  /** Idle timeout before preloading (ms) */
  idleTimeout: number
  /** Maximum memory budget in MB */
  memoryBudgetMB: number
  /** Enable debug logging */
  debug: boolean
}

/** Loading progress callback */
export type LoadingProgressCallback = (progress: {
  lensName: string
  state: LensLoadingState
  loaded: number
  total: number
  percent: number
}) => void

// ============================================================================
// Lens Registry Configuration
// ============================================================================

/** Metadata for all 16 SpecMap lenses */
export const LENS_REGISTRY: Record<string, LazyLensMeta> = {
  // Base lenses (6)
  tension: {
    name: 'tension',
    displayName: 'Tension',
    description: 'Reveals combat pressure zones through heatmap visualization',
    category: 'base',
    weight: 'medium',
    memoryEstimate: 2,
    modulePath: '@/components/SpecMapViewer/lenses/tensionLens',
    exportName: 'tensionLens',
    preloadPriority: 10
  },
  ripple: {
    name: 'ripple',
    displayName: 'Ripple',
    description: 'Sound propagation visualization with expanding rings',
    category: 'base',
    weight: 'light',
    memoryEstimate: 1,
    modulePath: '@/components/SpecMapViewer/lenses/rippleLens',
    exportName: 'rippleLens',
    preloadPriority: 8
  },
  blood: {
    name: 'blood',
    displayName: 'Blood Trail',
    description: 'Damage and kill stain overlays showing combat aftermath',
    category: 'base',
    weight: 'light',
    memoryEstimate: 1.5,
    modulePath: '@/components/SpecMapViewer/lenses/bloodTrailLens',
    exportName: 'bloodTrailLens',
    preloadPriority: 7
  },
  wind: {
    name: 'wind',
    displayName: 'Wind Field',
    description: 'Movement flow vector field showing player rotations',
    category: 'base',
    weight: 'medium',
    memoryEstimate: 3,
    modulePath: '@/components/SpecMapViewer/lenses/windFieldLens',
    exportName: 'windFieldLens',
    preloadPriority: 6
  },
  doors: {
    name: 'doors',
    displayName: 'Doors',
    description: 'Rotation pattern indicators for site movements',
    category: 'base',
    weight: 'light',
    memoryEstimate: 1,
    modulePath: '@/components/SpecMapViewer/lenses/doorsLens',
    exportName: 'doorsLens',
    preloadPriority: 5
  },
  secured: {
    name: 'secured',
    displayName: 'Secured',
    description: 'Site control status visualization',
    category: 'base',
    weight: 'light',
    memoryEstimate: 1,
    modulePath: '@/components/SpecMapViewer/lenses/securedLens',
    exportName: 'securedLens',
    preloadPriority: 9
  },

  // Analytical lenses (8)
  'rotation-predictor': {
    name: 'rotation-predictor',
    displayName: 'Rotation Predictor',
    description: 'AI-powered team rotation predictions',
    category: 'analytical',
    weight: 'heavy',
    memoryEstimate: 8,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/rotationPredictorLens',
    exportName: 'rotationPredictorLens',
    preloadPriority: 4
  },
  'timing-windows': {
    name: 'timing-windows',
    displayName: 'Timing Windows',
    description: 'Optimal execute timing analysis',
    category: 'analytical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/timingWindowsLens',
    exportName: 'timingWindowsLens',
    preloadPriority: 3
  },
  'push-probability': {
    name: 'push-probability',
    displayName: 'Push Probability',
    description: 'Site execute likelihood prediction',
    category: 'analytical',
    weight: 'heavy',
    memoryEstimate: 6,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/pushProbabilityLens',
    exportName: 'pushProbabilityLens',
    preloadPriority: 4
  },
  'clutch-zones': {
    name: 'clutch-zones',
    displayName: 'Clutch Zones',
    description: 'High-success clutch position identification',
    category: 'analytical',
    weight: 'medium',
    memoryEstimate: 3,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/clutchZonesLens',
    exportName: 'clutchZonesLens',
    preloadPriority: 2
  },
  'utility-coverage': {
    name: 'utility-coverage',
    displayName: 'Utility Coverage',
    description: 'Smoke, molly, and flash coverage visualization',
    category: 'analytical',
    weight: 'medium',
    memoryEstimate: 4,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/utilityCoverageLens',
    exportName: 'utilityCoverageLens',
    preloadPriority: 5
  },
  'trade-routes': {
    name: 'trade-routes',
    displayName: 'Trade Routes',
    description: 'Optimal support path visualization',
    category: 'analytical',
    weight: 'light',
    memoryEstimate: 2,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/tradeRoutesLens',
    exportName: 'tradeRoutesLens',
    preloadPriority: 3
  },
  'info-gaps': {
    name: 'info-gaps',
    displayName: 'Info Gaps',
    description: 'Unobserved map area identification',
    category: 'analytical',
    weight: 'light',
    memoryEstimate: 2,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/infoGapsLens',
    exportName: 'infoGapsLens',
    preloadPriority: 2
  },
  'eco-pressure': {
    name: 'eco-pressure',
    displayName: 'Eco Pressure',
    description: 'Force buy risk visualization',
    category: 'analytical',
    weight: 'medium',
    memoryEstimate: 3,
    modulePath: '@/components/SpecMapViewer/lenses/tactical/ecoPressureLens',
    exportName: 'ecoPressureLens',
    preloadPriority: 1
  }
}

/** Default loader configuration */
const DEFAULT_CONFIG: LazyLoaderConfig = {
  maxCachedLenses: 8,
  preloadOnIdle: true,
  idleTimeout: 2000,
  memoryBudgetMB: 50,
  debug: false
}

// ============================================================================
// Lazy Lens Loader Class
// ============================================================================

export class LazyLensLoader {
  private cache: Map<string, LoadedLensEntry> = new Map()
  private loadingPromises: Map<string, Promise<Lens>> = new Map()
  private config: LazyLoaderConfig
  private progressCallbacks: Set<LoadingProgressCallback> = new Set()
  private idleCallbackId: number | null = null
  private preloadQueue: string[] = []
  private isPreloading = false
  private performanceMetrics = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLoadTime: 0,
    evictions: 0
  }

  constructor(config: Partial<LazyLoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    if (this.config.preloadOnIdle) {
      this.setupIdlePreloading()
    }
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Load a lens by name
   */
  async loadLens(name: string): Promise<Lens> {
    // Check cache first
    const cached = this.cache.get(name)
    if (cached && cached.state === 'loaded') {
      cached.lastAccessed = Date.now()
      cached.accessCount++
      this.performanceMetrics.cacheHits++
      this.log('Cache hit for lens:', name)
      return cached.lens
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(name)
    if (existingPromise) {
      this.log('Lens already loading, returning existing promise:', name)
      return existingPromise
    }

    // Check if lens exists in registry
    const meta = LENS_REGISTRY[name]
    if (!meta) {
      throw new Error(`Lens "${name}" not found in registry`)
    }

    // Load the lens
    this.performanceMetrics.cacheMisses++
    const loadPromise = this.performLoad(name, meta)
    this.loadingPromises.set(name, loadPromise)

    return loadPromise
  }

  /**
   * Load multiple lenses
   */
  async loadLenses(names: string[]): Promise<Record<string, Lens>> {
    const results = await Promise.all(
      names.map(async name => {
        try {
          const lens = await this.loadLens(name)
          return { name, lens, error: null }
        } catch (error) {
          return { name, lens: null, error }
        }
      })
    )

    const lenses: Record<string, Lens> = {}
    results.forEach(({ name, lens, error }) => {
      if (lens && !error) {
        lenses[name] = lens
      }
    })

    return lenses
  }

  /**
   * Preload a lens (load without returning)
   */
  async preloadLens(name: string): Promise<void> {
    if (this.cache.has(name)) return
    await this.loadLens(name)
  }

  /**
   * Preload multiple lenses by priority
   */
  async preloadLenses(names?: string[]): Promise<void> {
    const lensesToPreload = names || this.getPreloadPriorityList()
    
    for (const name of lensesToPreload) {
      if (!this.cache.has(name)) {
        await this.preloadLens(name)
        // Small delay between preloads to avoid blocking
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }

  /**
   * Unload a lens from cache
   */
  unloadLens(name: string): boolean {
    const entry = this.cache.get(name)
    if (entry) {
      this.cache.delete(name)
      this.log('Unloaded lens:', name)
      return true
    }
    return false
  }

  /**
   * Get a loaded lens (sync - returns null if not loaded)
   */
  getLens(name: string): Lens | null {
    const entry = this.cache.get(name)
    if (entry && entry.state === 'loaded') {
      entry.lastAccessed = Date.now()
      entry.accessCount++
      return entry.lens
    }
    return null
  }

  /**
   * Check if a lens is loaded
   */
  isLoaded(name: string): boolean {
    const entry = this.cache.get(name)
    return entry?.state === 'loaded'
  }

  /**
   * Get loading state of a lens
   */
  getLoadingState(name: string): LensLoadingState {
    return this.cache.get(name)?.state || 'idle'
  }

  /**
   * Subscribe to loading progress
   */
  onProgress(callback: LoadingProgressCallback): () => void {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cached: number
    loading: number
    maxCache: number
    memoryUsedMB: number
    memoryBudgetMB: number
    hitRate: number
    avgLoadTime: number
    performance: typeof this.performanceMetrics
  } {
    const cached = Array.from(this.cache.values())
    const loaded = cached.filter(e => e.state === 'loaded')
    const memoryUsed = loaded.reduce((sum, e) => sum + e.meta.memoryEstimate, 0)
    
    const totalRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses
    const hitRate = totalRequests > 0 ? this.performanceMetrics.cacheHits / totalRequests : 0
    const avgLoadTime = this.performanceMetrics.totalLoads > 0 
      ? this.performanceMetrics.totalLoadTime / this.performanceMetrics.totalLoads 
      : 0

    return {
      cached: loaded.length,
      loading: cached.filter(e => e.state === 'loading').length,
      maxCache: this.config.maxCachedLenses,
      memoryUsedMB: memoryUsed,
      memoryBudgetMB: this.config.memoryBudget,
      hitRate: Math.round(hitRate * 100) / 100,
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      performance: { ...this.performanceMetrics }
    }
  }

  /**
   * Get list of available lenses
   */
  getAvailableLenses(): LazyLensMeta[] {
    return Object.values(LENS_REGISTRY)
  }

  /**
   * Get lenses by category
   */
  getLensesByCategory(category: LazyLensMeta['category']): LazyLensMeta[] {
    return Object.values(LENS_REGISTRY).filter(l => l.category === category)
  }

  /**
   * Dispose all loaded lenses and cleanup
   */
  dispose(): void {
    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId)
    }
    this.cache.clear()
    this.loadingPromises.clear()
    this.progressCallbacks.clear()
    this.log('LazyLensLoader disposed')
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private async performLoad(name: string, meta: LazyLensMeta): Promise<Lens> {
    const startTime = performance.now()
    
    // Create initial entry
    this.cache.set(name, {
      lens: null as unknown as Lens,
      meta,
      state: 'loading',
      loadTime: 0,
      lastAccessed: Date.now(),
      accessCount: 0
    })

    this.notifyProgress(name, 'loading')

    try {
      // Load dependencies first
      if (meta.dependencies) {
        for (const dep of meta.dependencies) {
          await this.loadLens(dep)
        }
      }

      // Dynamic import
      const module = await import(/* @vite-ignore */ meta.modulePath)
      const lens = module[meta.exportName] as Lens

      if (!lens) {
        throw new Error(`Lens export "${meta.exportName}" not found in module "${meta.modulePath}"`)
      }

      // Update cache entry
      const loadTime = performance.now() - startTime
      const entry: LoadedLensEntry = {
        lens,
        meta,
        state: 'loaded',
        loadTime,
        lastAccessed: Date.now(),
        accessCount: 1
      }

      this.cache.set(name, entry)
      this.performanceMetrics.totalLoads++
      this.performanceMetrics.totalLoadTime += loadTime

      // Check memory budget and evict if needed
      this.enforceMemoryBudget()

      this.log(`Loaded lens "${name}" in ${loadTime.toFixed(2)}ms`)
      this.notifyProgress(name, 'loaded')

      return lens
    } catch (error) {
      const entry = this.cache.get(name)!
      entry.state = 'error'
      entry.error = error instanceof Error ? error : new Error(String(error))
      
      this.loadingPromises.delete(name)
      this.notifyProgress(name, 'error')
      
      throw error
    } finally {
      this.loadingPromises.delete(name)
    }
  }

  private enforceMemoryBudget(): void {
    const entries = Array.from(this.cache.entries())
      .filter(([, e]) => e.state === 'loaded')
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

    let memoryUsed = entries.reduce((sum, [, e]) => sum + e.meta.memoryEstimate, 0)

    // Evict oldest entries if over budget or cache size limit
    while ((memoryUsed > this.config.memoryBudgetMB || entries.length > this.config.maxCachedLenses) 
           && entries.length > 1) {
      const [oldestName] = entries.shift()!
      const entry = this.cache.get(oldestName)
      
      if (entry) {
        memoryUsed -= entry.meta.memoryEstimate
        this.cache.delete(oldestName)
        this.performanceMetrics.evictions++
        this.log('Evicted lens due to memory pressure:', oldestName)
      }
    }
  }

  private setupIdlePreloading(): void {
    const schedulePreload = () => {
      this.idleCallbackId = requestIdleCallback(
        (deadline) => this.handleIdleTime(deadline),
        { timeout: this.config.idleTimeout }
      )
    }

    // Schedule initial preload
    schedulePreload()

    // Reschedule after user activity
    const resetTimer = () => {
      if (this.idleCallbackId !== null) {
        cancelIdleCallback(this.idleCallbackId)
      }
      schedulePreload()
    }

    window.addEventListener('click', resetTimer, { passive: true })
    window.addEventListener('scroll', resetTimer, { passive: true })
    window.addEventListener('keydown', resetTimer, { passive: true })
  }

  private handleIdleTime(deadline: IdleDeadline): void {
    if (this.isPreloading) return

    const preloadList = this.getPreloadPriorityList()
    
    for (const name of preloadList) {
      if (deadline.timeRemaining() <= 0) break
      if (this.cache.has(name)) continue

      this.isPreloading = true
      this.preloadLens(name).finally(() => {
        this.isPreloading = false
      })
    }

    // Reschedule if there are more lenses to preload
    if (preloadList.some(name => !this.cache.has(name))) {
      this.idleCallbackId = requestIdleCallback(
        (d) => this.handleIdleTime(d),
        { timeout: this.config.idleTimeout }
      )
    }
  }

  private getPreloadPriorityList(): string[] {
    return Object.values(LENS_REGISTRY)
      .filter(meta => !this.cache.has(meta.name))
      .sort((a, b) => b.preloadPriority - a.preloadPriority)
      .map(meta => meta.name)
  }

  private notifyProgress(name: string, state: LensLoadingState): void {
    const loaded = Array.from(this.cache.values()).filter(e => e.state === 'loaded').length
    const total = Object.keys(LENS_REGISTRY).length
    
    const progress = {
      lensName: name,
      state,
      loaded,
      total,
      percent: Math.round((loaded / total) * 100)
    }

    this.progressCallbacks.forEach(cb => {
      try {
        cb(progress)
      } catch (e) {
        console.error('Progress callback error:', e)
      }
    })
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[LazyLensLoader]', ...args)
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalLoader: LazyLensLoader | null = null

export function getLazyLensLoader(config?: Partial<LazyLoaderConfig>): LazyLensLoader {
  if (!globalLoader) {
    globalLoader = new LazyLensLoader(config)
  }
  return globalLoader
}

export function disposeLazyLensLoader(): void {
  if (globalLoader) {
    globalLoader.dispose()
    globalLoader = null
  }
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseLazyLensResult {
  lens: Lens | null
  state: LensLoadingState
  error: Error | null
  load: (name: string) => Promise<void>
  isLoaded: boolean
}

export function useLazyLens(initialName?: string): UseLazyLensResult {
  const loader = useRef(getLazyLensLoader())
  const [lens, setLens] = useState<Lens | null>(null)
  const [state, setState] = useState<LensLoadingState>('idle')
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async (name: string) => {
    setState('loading')
    setError(null)

    try {
      const loadedLens = await loader.current.loadLens(name)
      setLens(loadedLens)
      setState('loaded')
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (initialName) {
      load(initialName)
    }
  }, [initialName, load])

  return {
    lens,
    state,
    error,
    load,
    isLoaded: state === 'loaded'
  }
}

export interface UseLazyLensesResult {
  lenses: Record<string, Lens>
  states: Record<string, LensLoadingState>
  errors: Record<string, Error>
  load: (names: string[]) => Promise<void>
  progress: number
  isComplete: boolean
}

export function useLazyLenses(): UseLazyLensesResult {
  const loader = useRef(getLazyLensLoader())
  const [lenses, setLenses] = useState<Record<string, Lens>>({})
  const [states, setStates] = useState<Record<string, LensLoadingState>>({})
  const [errors, setErrors] = useState<Record<string, Error>>({})
  const [progress, setProgress] = useState(0)

  const load = useCallback(async (names: string[]) => {
    // Set all to loading
    const newStates: Record<string, LensLoadingState> = {}
    names.forEach(name => { newStates[name] = 'loading' })
    setStates(prev => ({ ...prev, ...newStates }))

    // Subscribe to progress
    const unsubscribe = loader.current.onProgress((p) => {
      setProgress(p.percent)
      setStates(prev => ({
        ...prev,
        [p.lensName]: p.state
      }))
    })

    try {
      const loaded = await loader.current.loadLenses(names)
      setLenses(prev => ({ ...prev, ...loaded }))
      
      // Mark any missing lenses as error
      names.forEach(name => {
        if (!loaded[name]) {
          setErrors(prev => ({
            ...prev,
            [name]: new Error(`Failed to load lens: ${name}`)
          }))
        }
      })
    } finally {
      unsubscribe()
    }
  }, [])

  return {
    lenses,
    states,
    errors,
    load,
    progress,
    isComplete: progress === 100
  }
}

// ============================================================================
// Performance Profiling
// ============================================================================

export function getLazyLoaderStats() {
  return getLazyLensLoader().getStats()
}

export default {
  LazyLensLoader,
  getLazyLensLoader,
  disposeLazyLensLoader,
  LENS_REGISTRY,
  useLazyLens,
  useLazyLenses,
  getLazyLoaderStats
}
