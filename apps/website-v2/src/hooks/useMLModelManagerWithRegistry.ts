/**
 * useMLModelManagerWithRegistry - Enhanced ML Model Management with Registry Integration
 * Extends useMLModelManager with registry sync capabilities
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useMLModelManager, type LoadOptions, type LoadedModel } from './useMLModelManager'
import { mlRegistry } from '../api/mlRegistry'
import type { MLModel, ModelStatus } from '../types/mlRegistry'
import { mlLogger } from '../utils/logger'

export interface RegistrySyncOptions {
  /** Auto-sync with registry on mount */
  autoSync?: boolean
  /** Sync interval in ms (0 to disable) */
  syncInterval?: number
  /** Filter models by status */
  statusFilter?: ModelStatus[]
  /** Filter models by tags */
  tagFilter?: string[]
}

export interface MLModelManagerWithRegistryState {
  // Original manager state
  models: Map<string, LoadedModel>
  activeModelId: string | null
  isSwitching: boolean
  totalMemoryUsage: number
  
  // Registry state
  registryModels: MLModel[]
  selectedRegistryModel: MLModel | null
  isSyncing: boolean
  lastSyncAt: Date | null
  syncError: string | null
}

export interface MLModelManagerWithRegistryActions {
  // Original manager actions
  loadModel: (id: string, url: string, options?: LoadOptions) => Promise<void>
  switchModel: (id: string) => Promise<void>
  unloadModel: (id: string) => void
  unloadAll: () => void
  compareModels: (idA: string, idB: string) => import('./useMLModelManager').ModelComparison | null
  getLoadedModelCount: () => number
  getMemoryUsage: () => number
  getActiveModel: () => LoadedModel | null
  preloadModels: (configs: Array<{ id: string; url: string; options?: LoadOptions }>) => Promise<void>
  
  // Registry actions
  syncWithRegistry: () => Promise<void>
  loadFromRegistry: (modelId: string, options?: LoadOptions) => Promise<void>
  selectRegistryModel: (model: MLModel | null) => void
  deployModel: (modelId: string, environment: string) => Promise<void>
  recordMetric: (modelId: string, metricName: string, value: number) => Promise<void>
}

const DEFAULT_SYNC_OPTIONS: RegistrySyncOptions = {
  autoSync: true,
  syncInterval: 0, // Disabled by default
  statusFilter: ['production', 'staging']
}

/**
 * Enhanced ML Model Manager with Registry Integration
 * 
 * This hook extends the base useMLModelManager with automatic synchronization
 * with the ML Model Registry backend. It allows loading models directly from
 * the registry and keeps track of deployment status.
 * 
 * @example
 * ```tsx
 * const { 
 *   models, 
 *   registryModels, 
 *   loadFromRegistry, 
 *   syncWithRegistry 
 * } = useMLModelManagerWithRegistry({
 *   autoSync: true,
 *   syncInterval: 30000 // Sync every 30 seconds
 * })
 * 
 * // Load a model from registry
 * await loadFromRegistry('model-uuid', { quantization: 8 })
 * ```
 */
export function useMLModelManagerWithRegistry(
  options: RegistrySyncOptions = {}
): MLModelManagerWithRegistryState & MLModelManagerWithRegistryActions {
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options }
  
  // Base manager
  const baseManager = useMLModelManager()
  
  // Registry state
  const [registryModels, setRegistryModels] = useState<MLModel[]>([])
  const [selectedRegistryModel, setSelectedRegistryModel] = useState<MLModel | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  
  // Interval ref for cleanup
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Sync models from registry
   */
  const syncWithRegistry = useCallback(async () => {
    setIsSyncing(true)
    setSyncError(null)
    
    try {
      const params: Record<string, string> = {}
      
      if (opts.statusFilter && opts.statusFilter.length > 0) {
        // Fetch models for each status and merge
        const allModels: MLModel[] = []
        for (const status of opts.statusFilter) {
          try {
            const response = await mlRegistry.getModels({ status, limit: 200 })
            allModels.push(...response.models)
          } catch (err) {
            mlLogger.warn(`[ML Registry] Failed to fetch models with status ${status}:`, err)
          }
        }
        
        // Remove duplicates by ID
        const uniqueModels = Array.from(
          new Map(allModels.map(m => [m.id, m])).values()
        )
        
        setRegistryModels(uniqueModels)
      } else {
        const response = await mlRegistry.getModels({ limit: 200 })
        setRegistryModels(response.models)
      }
      
      setLastSyncAt(new Date())
      mlLogger.info('[ML Registry] Sync completed successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed'
      setSyncError(errorMsg)
      mlLogger.error('[ML Registry] Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [opts.statusFilter])
  
  /**
   * Load a model from registry by ID
   */
  const loadFromRegistry = useCallback(async (
    modelId: string,
    loadOptions?: LoadOptions
  ): Promise<void> => {
    // Find model in registry
    const registryModel = registryModels.find(m => m.id === modelId)
    
    if (!registryModel) {
      // Try to fetch directly
      try {
        const model = await mlRegistry.getModel(modelId)
        if (!model.artifact_url) {
          throw new Error('Model has no artifact URL')
        }
        
        await baseManager.loadModel(modelId, model.artifact_url, {
          name: `${model.name} v${model.version}`,
          quantization: model.quantization === 'int8' ? 8 : model.quantization === 'int16' ? 16 : 32,
          ...loadOptions
        })
        
        // Record load metric
        await mlRegistry.recordMetric(modelId, {
          metric_name: 'model_load',
          metric_value: 1,
          metric_unit: 'count',
          environment: 'production'
        }).catch(() => {}) // Non-blocking
        
      } catch (err) {
        mlLogger.error(`[ML Registry] Failed to load model ${modelId}:`, err)
        throw err
      }
      return
    }
    
    if (!registryModel.artifact_url) {
      throw new Error('Model has no artifact URL')
    }
    
    await baseManager.loadModel(modelId, registryModel.artifact_url, {
      name: `${registryModel.name} v${registryModel.version}`,
      quantization: registryModel.quantization === 'int8' ? 8 : 
                    registryModel.quantization === 'int16' ? 16 : 32,
      ...loadOptions
    })
    
    // Record load metric
    await mlRegistry.recordMetric(modelId, {
      metric_name: 'model_load',
      metric_value: 1,
      metric_unit: 'count',
      environment: 'production'
    }).catch(() => {}) // Non-blocking
  }, [registryModels, baseManager])
  
  /**
   * Deploy a model to an environment
   */
  const deployModel = useCallback(async (
    modelId: string,
    environment: string
  ): Promise<void> => {
    try {
      await mlRegistry.deployModel(modelId, {
        environment: environment as any,
        deployment_type: 'full',
        traffic_percentage: 100
      })
      
      // Refresh registry after deployment
      await syncWithRegistry()
      
      mlLogger.info(`[ML Registry] Deployed model ${modelId} to ${environment}`)
    } catch (err) {
      mlLogger.error(`[ML Registry] Deployment failed:`, err)
      throw err
    }
  }, [syncWithRegistry])
  
  /**
   * Record a metric for a model
   */
  const recordMetric = useCallback(async (
    modelId: string,
    metricName: string,
    value: number,
    unit?: string
  ): Promise<void> => {
    try {
      await mlRegistry.recordMetric(modelId, {
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit,
        environment: 'production'
      })
    } catch (err) {
      mlLogger.warn(`[ML Registry] Failed to record metric:`, err)
    }
  }, [])
  
  /**
   * Select a registry model
   */
  const selectRegistryModel = useCallback((model: MLModel | null) => {
    setSelectedRegistryModel(model)
  }, [])
  
  // Auto-sync on mount
  useEffect(() => {
    if (opts.autoSync) {
      syncWithRegistry()
    }
  }, [opts.autoSync, syncWithRegistry])
  
  // Setup sync interval
  useEffect(() => {
    if (opts.syncInterval && opts.syncInterval > 0) {
      syncIntervalRef.current = setInterval(syncWithRegistry, opts.syncInterval)
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current)
        }
      }
    }
  }, [opts.syncInterval, syncWithRegistry])
  
  return {
    // Base manager state
    models: baseManager.models,
    activeModelId: baseManager.activeModelId,
    isSwitching: baseManager.isSwitching,
    totalMemoryUsage: baseManager.totalMemoryUsage,
    
    // Registry state
    registryModels,
    selectedRegistryModel,
    isSyncing,
    lastSyncAt,
    syncError,
    
    // Base manager actions
    loadModel: baseManager.loadModel,
    switchModel: baseManager.switchModel,
    unloadModel: baseManager.unloadModel,
    unloadAll: baseManager.unloadAll,
    compareModels: baseManager.compareModels,
    getLoadedModelCount: baseManager.getLoadedModelCount,
    getMemoryUsage: baseManager.getMemoryUsage,
    getActiveModel: baseManager.getActiveModel,
    preloadModels: baseManager.preloadModels,
    
    // Registry actions
    syncWithRegistry,
    loadFromRegistry,
    selectRegistryModel,
    deployModel,
    recordMetric
  }
}

export default useMLModelManagerWithRegistry
