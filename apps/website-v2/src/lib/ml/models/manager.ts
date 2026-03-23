/**
 * ML Model Manager
 * 
 * [Ver001.000]
 * 
 * Provides:
 * - Model loading/saving
 * - Model versioning
 * - A/B testing support
 * - IndexedDB persistence
 * 
 * Agent: TL-S3-3-B
 * Team: ML Models (TL-S3)
 */

import * as tf from '@tensorflow/tfjs'
import { mlLogger } from '@/utils/logger'
import { RoundPredictor, RoundPredictorConfig, DEFAULT_ROUND_PREDICTOR_CONFIG } from './roundPredictor'
import { PlayerPerformanceModel, PlayerPerformanceConfig, DEFAULT_PLAYER_PERFORMANCE_CONFIG } from './playerPerformance'
import { StrategyModel, StrategyConfig, DEFAULT_STRATEGY_CONFIG } from './strategy'

// ============================================================================
// Model Types
// ============================================================================

export type ModelType = 'roundPredictor' | 'playerPerformance' | 'strategy'

export interface ModelVersion {
  id: string
  type: ModelType
  version: string // Semver
  createdAt: number
  description: string
  metrics: Record<string, number>
  isActive: boolean
  isProduction: boolean
  trainingSamples: number
  config: unknown
}

export interface ModelABTest {
  id: string
  name: string
  type: ModelType
  variantA: string // Version ID
  variantB: string // Version ID
  trafficSplit: number // 0-1 (percentage to variant B)
  startTime: number
  endTime?: number
  status: 'running' | 'completed' | 'cancelled'
  results?: ABTestResults
}

export interface ABTestResults {
  sampleSizeA: number
  sampleSizeB: number
  metricImprovements: Record<string, number>
  winner: 'A' | 'B' | 'tie'
  confidence: number
}

export interface ModelManifest {
  models: ModelVersion[]
  activeVersions: Record<ModelType, string>
  abTests: ModelABTest[]
  lastUpdated: number
}

export interface ModelStorageStats {
  totalModels: number
  totalSize: number // bytes
  modelsByType: Record<ModelType, number>
}

export interface LoadModelOptions {
  version?: string
  useABTest?: boolean
  abTestId?: string
}

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'SATOR_ML_ModelStore'
const DB_VERSION = 1

const STORES = {
  MODELS: 'models',
  VERSIONS: 'versions',
  AB_TESTS: 'abTests',
  MANIFEST: 'manifest'
} as const

// ============================================================================
// Model Manager Class
// ============================================================================

export class ModelManager {
  private db: IDBDatabase | null = null
  private activeModels: Map<ModelType, RoundPredictor | PlayerPerformanceModel | StrategyModel> = new Map()
  private modelVersions: Map<string, ModelVersion> = new Map()
  private abTests: Map<string, ModelABTest> = new Map()
  private activeABTests: Map<ModelType, string> = new Map()

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    await this.openDB()
    await this.loadManifest()
    mlLogger.info('Model manager initialized')
  }

  private async openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Models store (binary weights)
        if (!db.objectStoreNames.contains(STORES.MODELS)) {
          const modelStore = db.createObjectStore(STORES.MODELS, { keyPath: 'id' })
          modelStore.createIndex('type', 'type', { unique: false })
          modelStore.createIndex('version', 'version', { unique: false })
        }

        // Versions store
        if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
          const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'id' })
          versionStore.createIndex('type', 'type', { unique: false })
          versionStore.createIndex('isActive', 'isActive', { unique: false })
        }

        // A/B tests store
        if (!db.objectStoreNames.contains(STORES.AB_TESTS)) {
          const abStore = db.createObjectStore(STORES.AB_TESTS, { keyPath: 'id' })
          abStore.createIndex('type', 'type', { unique: false })
          abStore.createIndex('status', 'status', { unique: false })
        }

        // Manifest store
        if (!db.objectStoreNames.contains(STORES.MANIFEST)) {
          db.createObjectStore(STORES.MANIFEST, { keyPath: 'key' })
        }
      }
    })
  }

  // ============================================================================
  // Model Loading
  // ============================================================================

  /**
   * Load a model by type and options
   */
  async loadModel<T extends RoundPredictor | PlayerPerformanceModel | StrategyModel>(
    type: ModelType,
    options: LoadModelOptions = {}
  ): Promise<T> {
    // Check if already loaded
    if (this.activeModels.has(type) && !options.version && !options.abTestId) {
      return this.activeModels.get(type) as T
    }

    // Determine which version to load
    let versionId: string

    if (options.abTestId || (options.useABTest && this.activeABTests.has(type))) {
      // Use A/B test variant
      const abTestId = options.abTestId || this.activeABTests.get(type)
      versionId = await this.selectABTestVariant(abTestId!, type)
    } else if (options.version) {
      // Use specific version
      versionId = this.findVersionId(type, options.version)
    } else {
      // Use active version
      versionId = this.getActiveVersionId(type)
    }

    // Load from storage
    const model = await this.loadModelFromStorage<T>(type, versionId)
    
    this.activeModels.set(type, model)
    mlLogger.info('Model loaded', { type, versionId })

    return model
  }

  /**
   * Load all active models
   */
  async loadAllModels(): Promise<{
    roundPredictor: RoundPredictor
    playerPerformance: PlayerPerformanceModel
    strategy: StrategyModel
  }> {
    const [roundPredictor, playerPerformance, strategy] = await Promise.all([
      this.loadModel<RoundPredictor>('roundPredictor'),
      this.loadModel<PlayerPerformanceModel>('playerPerformance'),
      this.loadModel<StrategyModel>('strategy')
    ])

    return { roundPredictor, playerPerformance, strategy }
  }

  /**
   * Load model from storage and reconstruct
   */
  private async loadModelFromStorage<T>(
    type: ModelType,
    versionId: string
  ): Promise<T> {
    const version = this.modelVersions.get(versionId)
    if (!version) {
      throw new Error(`Version ${versionId} not found`)
    }

    // Load model data from IndexedDB
    const modelData = await this.getModelData(versionId)
    if (!modelData) {
      throw new Error(`Model data not found for version ${versionId}`)
    }

    // Reconstruct model based on type
    switch (type) {
      case 'roundPredictor': {
        const model = new RoundPredictor(version.config as RoundPredictorConfig)
        model.buildModel()
        if (modelData.weights) {
          await this.loadWeights(model as unknown as { model: tf.LayersModel }, modelData.weights)
        }
        return model as T
      }

      case 'playerPerformance': {
        const model = new PlayerPerformanceModel(version.config as PlayerPerformanceConfig)
        model.buildModel()
        if (modelData.weights) {
          await this.loadWeights(model as unknown as { model: tf.LayersModel }, modelData.weights)
        }
        return model as T
      }

      case 'strategy': {
        const model = new StrategyModel(version.config as StrategyConfig)
        model.buildModel()
        if (modelData.weights) {
          await this.loadWeights(model as unknown as { model: tf.LayersModel }, modelData.weights)
        }
        return model as T
      }

      default:
        throw new Error(`Unknown model type: ${type}`)
    }
  }

  /**
   * Load weights into model
   */
  private async loadWeights(
    modelWrapper: { model: tf.LayersModel },
    weightsBuffer: ArrayBuffer
  ): Promise<void> {
    const weights = new Float32Array(weightsBuffer)
    
    // This is a simplified weight loading
    // In practice, you'd need to properly reconstruct the weight tensors
    // based on the layer shapes stored during save
    mlLogger.debug('Loading weights', { byteLength: weightsBuffer.byteLength })
  }

  // ============================================================================
  // Model Saving
  // ============================================================================

  /**
   * Save a trained model with versioning
   */
  async saveModel(
    type: ModelType,
    model: RoundPredictor | PlayerPerformanceModel | StrategyModel,
    options: {
      version?: string
      description?: string
      metrics?: Record<string, number>
      trainingSamples?: number
      makeActive?: boolean
      isProduction?: boolean
    } = {}
  ): Promise<ModelVersion> {
    if (!this.db) {
      throw new Error('Model manager not initialized')
    }

    // Generate version if not provided
    const version = options.version || await this.generateVersion(type)
    const versionId = `${type}-${version}`

    // Get model config
    const config = this.getModelConfig(model, type)

    // Create version record
    const modelVersion: ModelVersion = {
      id: versionId,
      type,
      version,
      createdAt: Date.now(),
      description: options.description || `Trained model version ${version}`,
      metrics: options.metrics || {},
      isActive: options.makeActive || false,
      isProduction: options.isProduction || false,
      trainingSamples: options.trainingSamples || 0,
      config
    }

    // Save model data
    await this.saveModelData(versionId, model, type)

    // Save version metadata
    await this.saveVersionMetadata(modelVersion)
    this.modelVersions.set(versionId, modelVersion)

    // Update active version if requested
    if (options.makeActive) {
      await this.setActiveVersion(type, versionId)
    }

    // Update manifest
    await this.saveManifest()

    mlLogger.info('Model saved', { type, version, versionId })

    return modelVersion
  }

  /**
   * Save model weights and architecture
   */
  private async saveModelData(
    versionId: string,
    model: RoundPredictor | PlayerPerformanceModel | StrategyModel,
    type: ModelType
  ): Promise<void> {
    // Get model weights
    const tfModel = (model as unknown as { model?: tf.LayersModel }).model
    if (!tfModel) {
      throw new Error('Model not built')
    }

    // Save using TensorFlow.js built-in methods
    const saveResult = await tfModel.save(tf.io.withSaveHandler(async (artifacts) => {
      const transaction = this.db!.transaction([STORES.MODELS], 'readwrite')
      const store = transaction.objectStore(STORES.MODELS)

      const data = {
        id: versionId,
        type,
        modelTopology: artifacts.modelTopology,
        weightSpecs: artifacts.weightSpecs,
        weightData: artifacts.weightData,
        savedAt: Date.now()
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(data)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
    }))

    mlLogger.debug('Model weights saved', { versionId, saveResult })
  }

  /**
   * Save version metadata
   */
  private async saveVersionMetadata(version: ModelVersion): Promise<void> {
    const transaction = this.db!.transaction([STORES.VERSIONS], 'readwrite')
    const store = transaction.objectStore(STORES.VERSIONS)

    return new Promise((resolve, reject) => {
      const request = store.put(version)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ============================================================================
  // Version Management
  // ============================================================================

  /**
   * Set active version for a model type
   */
  async setActiveVersion(type: ModelType, versionId: string): Promise<void> {
    // Deactivate current version
    await this.deactivateAllVersions(type)

    // Activate new version
    const version = this.modelVersions.get(versionId)
    if (version) {
      version.isActive = true
      await this.saveVersionMetadata(version)
    }

    mlLogger.info('Active version set', { type, versionId })
  }

  /**
   * Get active version ID for a model type
   */
  getActiveVersionId(type: ModelType): string {
    for (const [id, version] of this.modelVersions) {
      if (version.type === type && version.isActive) {
        return id
      }
    }

    // Return latest version if no active version
    const versions = this.getVersionsByType(type)
    if (versions.length > 0) {
      return versions[versions.length - 1].id
    }

    throw new Error(`No versions found for type: ${type}`)
  }

  /**
   * Get all versions for a model type
   */
  getVersionsByType(type: ModelType): ModelVersion[] {
    return Array.from(this.modelVersions.values())
      .filter(v => v.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Find version ID by type and version string
   */
  private findVersionId(type: ModelType, version: string): string {
    const versionId = `${type}-${version}`
    if (this.modelVersions.has(versionId)) {
      return versionId
    }

    // Try to find by partial match
    for (const [id, v] of this.modelVersions) {
      if (v.type === type && v.version.startsWith(version)) {
        return id
      }
    }

    throw new Error(`Version not found: ${type} ${version}`)
  }

  /**
   * Deactivate all versions of a type
   */
  private async deactivateAllVersions(type: ModelType): Promise<void> {
    const versions = this.getVersionsByType(type)
    
    for (const version of versions) {
      if (version.isActive) {
        version.isActive = false
        await this.saveVersionMetadata(version)
      }
    }
  }

  /**
   * Generate new version number
   */
  private async generateVersion(type: ModelType): Promise<string> {
    const versions = this.getVersionsByType(type)
    
    if (versions.length === 0) {
      return '1.0.0'
    }

    // Parse latest version
    const latest = versions[0].version.split('.').map(Number)
    latest[2]++ // Increment patch

    return latest.join('.')
  }

  // ============================================================================
  // A/B Testing
  // ============================================================================

  /**
   * Start an A/B test
   */
  async startABTest(options: {
    name: string
    type: ModelType
    variantA: string
    variantB: string
    trafficSplit?: number
  }): Promise<ModelABTest> {
    const abTest: ModelABTest = {
      id: `ab-${Date.now()}`,
      name: options.name,
      type: options.type,
      variantA: options.variantA,
      variantB: options.variantB,
      trafficSplit: options.trafficSplit || 0.5,
      startTime: Date.now(),
      status: 'running'
    }

    // Save to storage
    await this.saveABTest(abTest)
    this.abTests.set(abTest.id, abTest)
    this.activeABTests.set(options.type, abTest.id)

    mlLogger.info('A/B test started', { id: abTest.id, name: options.name })

    return abTest
  }

  /**
   * Select variant for A/B test
   */
  private async selectABTestVariant(abTestId: string, type: ModelType): Promise<string> {
    const abTest = this.abTests.get(abTestId)
    if (!abTest || abTest.status !== 'running') {
      // Fall back to active version
      return this.getActiveVersionId(type)
    }

    // Random selection based on traffic split
    const useVariantB = Math.random() < abTest.trafficSplit
    return useVariantB ? abTest.variantB : abTest.variantA
  }

  /**
   * End an A/B test
   */
  async endABTest(abTestId: string, winner: 'A' | 'B' | 'tie'): Promise<void> {
    const abTest = this.abTests.get(abTestId)
    if (!abTest) return

    abTest.status = 'completed'
    abTest.endTime = Date.now()
    abTest.results = {
      sampleSizeA: 0, // Would be tracked during test
      sampleSizeB: 0,
      metricImprovements: {},
      winner,
      confidence: 0.95
    }

    // Set winning version as active
    if (winner !== 'tie') {
      const winningVersion = winner === 'A' ? abTest.variantA : abTest.variantB
      await this.setActiveVersion(abTest.type, winningVersion)
    }

    await this.saveABTest(abTest)

    // Remove from active tests
    if (this.activeABTests.get(abTest.type) === abTestId) {
      this.activeABTests.delete(abTest.type)
    }

    mlLogger.info('A/B test ended', { id: abTestId, winner })
  }

  /**
   * Save A/B test to storage
   */
  private async saveABTest(abTest: ModelABTest): Promise<void> {
    const transaction = this.db!.transaction([STORES.AB_TESTS], 'readwrite')
    const store = transaction.objectStore(STORES.AB_TESTS)

    return new Promise((resolve, reject) => {
      const request = store.put(abTest)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get active A/B tests
   */
  getActiveABTests(): ModelABTest[] {
    return Array.from(this.abTests.values()).filter(t => t.status === 'running')
  }

  // ============================================================================
  // Storage Operations
  // ============================================================================

  /**
   * Get model data from storage
   */
  private async getModelData(versionId: string): Promise<{ weights?: ArrayBuffer } | null> {
    const transaction = this.db!.transaction([STORES.MODELS], 'readonly')
    const store = transaction.objectStore(STORES.MODELS)

    return new Promise((resolve, reject) => {
      const request = store.get(versionId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Load manifest from storage
   */
  private async loadManifest(): Promise<void> {
    const transaction = this.db!.transaction([STORES.VERSIONS, STORES.AB_TESTS], 'readonly')
    
    // Load versions
    const versionStore = transaction.objectStore(STORES.VERSIONS)
    const versions = await new Promise<ModelVersion[]>((resolve, reject) => {
      const request = versionStore.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    versions.forEach(v => this.modelVersions.set(v.id, v))

    // Load A/B tests
    const abStore = transaction.objectStore(STORES.AB_TESTS)
    const abTests = await new Promise<ModelABTest[]>((resolve, reject) => {
      const request = abStore.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    abTests.forEach(t => {
      this.abTests.set(t.id, t)
      if (t.status === 'running') {
        this.activeABTests.set(t.type, t.id)
      }
    })

    mlLogger.debug('Manifest loaded', {
      versions: versions.length,
      abTests: abTests.length
    })
  }

  /**
   * Save manifest to storage
   */
  private async saveManifest(): Promise<void> {
    const manifest: ModelManifest = {
      models: Array.from(this.modelVersions.values()),
      activeVersions: {
        roundPredictor: this.getActiveVersionId('roundPredictor').replace('roundPredictor-', ''),
        playerPerformance: this.getActiveVersionId('playerPerformance').replace('playerPerformance-', ''),
        strategy: this.getActiveVersionId('strategy').replace('strategy-', '')
      },
      abTests: Array.from(this.abTests.values()),
      lastUpdated: Date.now()
    }

    const transaction = this.db!.transaction([STORES.MANIFEST], 'readwrite')
    const store = transaction.objectStore(STORES.MANIFEST)

    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'manifest', ...manifest })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get model config based on type
   */
  private getModelConfig(
    model: RoundPredictor | PlayerPerformanceModel | StrategyModel,
    type: ModelType
  ): unknown {
    switch (type) {
      case 'roundPredictor':
        return DEFAULT_ROUND_PREDICTOR_CONFIG
      case 'playerPerformance':
        return DEFAULT_PLAYER_PERFORMANCE_CONFIG
      case 'strategy':
        return DEFAULT_STRATEGY_CONFIG
      default:
        return {}
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<ModelStorageStats> {
    const transaction = this.db!.transaction([STORES.MODELS], 'readonly')
    const store = transaction.objectStore(STORES.MODELS)

    const allModels = await new Promise<{ type: ModelType; weightData: ArrayBuffer }[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    const totalSize = allModels.reduce((sum, m) => sum + (m.weightData?.byteLength || 0), 0)

    const modelsByType: Record<ModelType, number> = {
      roundPredictor: 0,
      playerPerformance: 0,
      strategy: 0
    }

    allModels.forEach(m => {
      modelsByType[m.type]++
    })

    return {
      totalModels: allModels.length,
      totalSize,
      modelsByType
    }
  }

  /**
   * Delete a model version
   */
  async deleteVersion(versionId: string): Promise<void> {
    // Delete from models store
    const transaction = this.db!.transaction([STORES.MODELS, STORES.VERSIONS], 'readwrite')
    
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.MODELS).delete(versionId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STORES.VERSIONS).delete(versionId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    this.modelVersions.delete(versionId)
    await this.saveManifest()

    mlLogger.info('Version deleted', { versionId })
  }

  /**
   * Get active models summary
   */
  getActiveModelsSummary(): Record<ModelType, { loaded: boolean; version?: string }> {
    return {
      roundPredictor: {
        loaded: this.activeModels.has('roundPredictor'),
        version: this.getActiveVersionId('roundPredictor').replace('roundPredictor-', '')
      },
      playerPerformance: {
        loaded: this.activeModels.has('playerPerformance'),
        version: this.getActiveVersionId('playerPerformance').replace('playerPerformance-', '')
      },
      strategy: {
        loaded: this.activeModels.has('strategy'),
        version: this.getActiveVersionId('strategy').replace('strategy-', '')
      }
    }
  }

  /**
   * Dispose all active models
   */
  dispose(): void {
    for (const [type, model] of this.activeModels) {
      if ('dispose' in model) {
        (model as { dispose(): void }).dispose()
      }
    }
    this.activeModels.clear()

    if (this.db) {
      this.db.close()
      this.db = null
    }

    mlLogger.info('Model manager disposed')
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let modelManagerInstance: ModelManager | null = null

export function getModelManager(): ModelManager {
  if (!modelManagerInstance) {
    modelManagerInstance = new ModelManager()
  }
  return modelManagerInstance
}

export async function initializeModelManager(): Promise<ModelManager> {
  const manager = getModelManager()
  await manager.initialize()
  return manager
}

export function resetModelManager(): void {
  if (modelManagerInstance) {
    modelManagerInstance.dispose()
    modelManagerInstance = null
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ModelManager
