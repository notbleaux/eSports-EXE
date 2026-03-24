/**
 * ML Data Store - IndexedDB for Training Data
 * 
 * [Ver001.000]
 * 
 * Provides:
 * - IndexedDB storage for training data
 * - Data versioning
 * - Export/import functionality
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import type { ExtractedFeatures } from './features'

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'SATOR_ML_DataStore'
const DB_VERSION = 1

const STORES = {
  TRAINING_DATA: 'trainingData',
  DATASETS: 'datasets',
  VERSIONS: 'versions',
  METADATA: 'metadata',
  EXPORT_LOGS: 'exportLogs'
} as const

// ============================================================================
// Type Definitions
// ============================================================================

export interface TrainingSample {
  id: string
  features: number[]
  labels: {
    winProbability?: number
    roundOutcome?: 0 | 1
    clutchSuccess?: 0 | 1
    playerPerformance?: number
  }
  metadata: {
    matchId: string
    roundId: string
    timestamp: number
    source: string
    featureVersion: string
    mapName?: string
    teamId?: string
    playerId?: string
  }
  quality: {
    confidence: number
    isOutlier: boolean
    missingValueCount: number
  }
}

export interface Dataset {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  sampleIds: string[]
  filters: DatasetFilters
  version: string
  tags: string[]
  stats: {
    totalSamples: number
    positiveLabels: number
    negativeLabels: number
    avgConfidence: number
    outlierCount: number
  }
}

export interface DatasetFilters {
  mapName?: string
  teamId?: string
  playerId?: string
  dateFrom?: number
  dateTo?: number
  minConfidence?: number
  excludeOutliers?: boolean
  tags?: string[]
}

export interface DataVersion {
  version: string
  createdAt: number
  description: string
  featureCount: number
  sampleCount: number
  checksum: string
  isActive: boolean
  schema: {
    featureNames: string[]
    labelNames: string[]
    featureVersion: string
  }
}

export interface StorageStats {
  totalSamples: number
  totalDatasets: number
  storageUsed: number
  storageAvailable: number
  versionCount: number
  lastUpdated: number
}

export interface ExportResult {
  success: boolean
  data?: Blob
  format: 'json' | 'csv' | 'tfrecord'
  sampleCount: number
  error?: string
  exportedAt: number
  checksum: string
}

export interface ImportResult {
  success: boolean
  importedCount: number
  skippedCount: number
  errorCount: number
  errors: string[]
  datasetId?: string
}

// ============================================================================
// Database Connection
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Training data store
      if (!db.objectStoreNames.contains(STORES.TRAINING_DATA)) {
        const trainingStore = db.createObjectStore(STORES.TRAINING_DATA, { keyPath: 'id' })
        trainingStore.createIndex('matchId', 'metadata.matchId', { unique: false })
        trainingStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
        trainingStore.createIndex('mapName', 'metadata.mapName', { unique: false })
        trainingStore.createIndex('playerId', 'metadata.playerId', { unique: false })
        trainingStore.createIndex('teamId', 'metadata.teamId', { unique: false })
        trainingStore.createIndex('confidence', 'quality.confidence', { unique: false })
        trainingStore.createIndex('isOutlier', 'quality.isOutlier', { unique: false })
      }

      // Datasets store
      if (!db.objectStoreNames.contains(STORES.DATASETS)) {
        const datasetStore = db.createObjectStore(STORES.DATASETS, { keyPath: 'id' })
        datasetStore.createIndex('name', 'name', { unique: false })
        datasetStore.createIndex('createdAt', 'createdAt', { unique: false })
        datasetStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
      }

      // Versions store
      if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
        const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'version' })
        versionStore.createIndex('isActive', 'isActive', { unique: false })
        versionStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Metadata store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
      }

      // Export logs store
      if (!db.objectStoreNames.contains(STORES.EXPORT_LOGS)) {
        const exportStore = db.createObjectStore(STORES.EXPORT_LOGS, { keyPath: 'id', autoIncrement: true })
        exportStore.createIndex('timestamp', 'exportedAt', { unique: false })
        exportStore.createIndex('format', 'format', { unique: false })
      }
    }
  })

  return dbPromise
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}

/**
 * Delete entire database
 */
export async function deleteDB(): Promise<void> {
  await closeDB()
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ============================================================================
// Training Sample Operations
// ============================================================================

/**
 * Store a single training sample
 */
export async function storeSample(
  sample: TrainingSample
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readwrite')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(sample)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    mlLogger.debug('Stored training sample', { id: sample.id })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Store failed'
    mlLogger.error('Failed to store training sample', { error: message })
    return { success: false, error: message }
  }
}

/**
 * Store multiple training samples in batch
 */
export async function storeSamples(
  samples: TrainingSample[]
): Promise<{ success: boolean; stored: number; error?: string }> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readwrite')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    let stored = 0
    for (const sample of samples) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(sample)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      stored++
    }

    mlLogger.info('Batch stored training samples', { count: stored })
    return { success: true, stored }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Batch store failed'
    mlLogger.error('Failed to batch store samples', { error: message })
    return { success: false, stored: 0, error: message }
  }
}

/**
 * Retrieve a single sample by ID
 */
export async function getSample(id: string): Promise<TrainingSample | null> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readonly')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    return await new Promise<TrainingSample>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    mlLogger.error('Failed to get sample', { id, error })
    return null
  }
}

/**
 * Delete a sample by ID
 */
export async function deleteSample(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readwrite')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    mlLogger.debug('Deleted training sample', { id })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return { success: false, error: message }
  }
}

// ============================================================================
// Query Operations
// ============================================================================

export interface QueryOptions {
  filters?: {
    mapName?: string
    teamId?: string
    playerId?: string
    dateFrom?: number
    dateTo?: number
    minConfidence?: number
    excludeOutliers?: boolean
  }
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'confidence' | 'random'
}

/**
 * Query training samples with filters
 */
export async function querySamples(
  options: QueryOptions = {}
): Promise<{ samples: TrainingSample[]; total: number }> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readonly')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    // Get all samples (in production, use indexes for better performance)
    const allSamples = await new Promise<TrainingSample[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    // Apply filters
    let filtered = allSamples
    if (options.filters) {
      const f = options.filters
      filtered = allSamples.filter(s => {
        if (f.mapName && s.metadata.mapName !== f.mapName) return false
        if (f.teamId && s.metadata.teamId !== f.teamId) return false
        if (f.playerId && s.metadata.playerId !== f.playerId) return false
        if (f.dateFrom && s.metadata.timestamp < f.dateFrom) return false
        if (f.dateTo && s.metadata.timestamp > f.dateTo) return false
        if (f.minConfidence !== undefined && s.quality.confidence < f.minConfidence) return false
        if (f.excludeOutliers && s.quality.isOutlier) return false
        return true
      })
    }

    const total = filtered.length

    // Sort
    if (options.sortBy === 'timestamp') {
      filtered.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp)
    } else if (options.sortBy === 'confidence') {
      filtered.sort((a, b) => b.quality.confidence - a.quality.confidence)
    } else if (options.sortBy === 'random') {
      filtered.sort(() => Math.random() - 0.5)
    }

    // Paginate
    const offset = options.offset || 0
    const limit = options.limit || filtered.length
    const samples = filtered.slice(offset, offset + limit)

    return { samples, total }
  } catch (error) {
    mlLogger.error('Failed to query samples', { error })
    return { samples: [], total: 0 }
  }
}

/**
 * Count total samples
 */
export async function countSamples(): Promise<number> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.TRAINING_DATA], 'readonly')
    const store = transaction.objectStore(STORES.TRAINING_DATA)

    return await new Promise<number>((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    return 0
  }
}

// ============================================================================
// Dataset Operations
// ============================================================================

/**
 * Create a new dataset
 */
export async function createDataset(
  name: string,
  description: string,
  filters: DatasetFilters = {},
  tags: string[] = []
): Promise<{ success: boolean; dataset?: Dataset; error?: string }> {
  try {
    const dataset: Dataset = {
      id: `dataset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sampleIds: [],
      filters,
      version: '1.0.0',
      tags,
      stats: {
        totalSamples: 0,
        positiveLabels: 0,
        negativeLabels: 0,
        avgConfidence: 0,
        outlierCount: 0
      }
    }

    // Populate dataset with matching samples
    const { samples } = await querySamples({ filters })
    dataset.sampleIds = samples.map(s => s.id)
    dataset.stats = calculateDatasetStats(samples)

    const db = await getDB()
    const transaction = db.transaction([STORES.DATASETS], 'readwrite')
    const store = transaction.objectStore(STORES.DATASETS)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(dataset)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    mlLogger.info('Created dataset', { 
      id: dataset.id, 
      name, 
      sampleCount: dataset.sampleIds.length 
    })

    return { success: true, dataset }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create dataset failed'
    return { success: false, error: message }
  }
}

/**
 * Get dataset by ID
 */
export async function getDataset(id: string): Promise<Dataset | null> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.DATASETS], 'readonly')
    const store = transaction.objectStore(STORES.DATASETS)

    return await new Promise<Dataset>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    return null
  }
}

/**
 * Update dataset
 */
export async function updateDataset(
  id: string,
  updates: Partial<Pick<Dataset, 'name' | 'description' | 'tags'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const dataset = await getDataset(id)
    if (!dataset) {
      return { success: false, error: 'Dataset not found' }
    }

    const updated = { ...dataset, ...updates, updatedAt: Date.now() }

    const db = await getDB()
    const transaction = db.transaction([STORES.DATASETS], 'readwrite')
    const store = transaction.objectStore(STORES.DATASETS)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(updated)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return { success: false, error: message }
  }
}

/**
 * Delete dataset
 */
export async function deleteDataset(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.DATASETS], 'readwrite')
    const store = transaction.objectStore(STORES.DATASETS)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    mlLogger.info('Deleted dataset', { id })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return { success: false, error: message }
  }
}

/**
 * List all datasets
 */
export async function listDatasets(): Promise<Dataset[]> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.DATASETS], 'readonly')
    const store = transaction.objectStore(STORES.DATASETS)

    return await new Promise<Dataset[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    return []
  }
}

// ============================================================================
// Version Management
// ============================================================================

const CURRENT_FEATURE_VERSION = '1.0.0'

/**
 * Create a new data version
 */
export async function createVersion(
  description: string,
  schema: DataVersion['schema']
): Promise<{ success: boolean; version?: DataVersion; error?: string }> {
  try {
    const sampleCount = await countSamples()
    
    const version: DataVersion = {
      version: `${Date.now()}`,
      createdAt: Date.now(),
      description,
      featureCount: schema.featureNames.length,
      sampleCount,
      checksum: await calculateChecksum(schema),
      isActive: true,
      schema
    }

    // Deactivate previous versions
    await deactivateAllVersions()

    const db = await getDB()
    const transaction = db.transaction([STORES.VERSIONS], 'readwrite')
    const store = transaction.objectStore(STORES.VERSIONS)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(version)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    mlLogger.info('Created data version', { version: version.version, sampleCount })
    return { success: true, version }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create version failed'
    return { success: false, error: message }
  }
}

/**
 * Get active version
 */
export async function getActiveVersion(): Promise<DataVersion | null> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.VERSIONS], 'readonly')
    const store = transaction.objectStore(STORES.VERSIONS)
    const index = store.index('isActive')

    const versions = await new Promise<DataVersion[]>((resolve, reject) => {
      const request = index.getAll(true)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    return versions[0] || null
  } catch (error) {
    return null
  }
}

/**
 * List all versions
 */
export async function listVersions(): Promise<DataVersion[]> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.VERSIONS], 'readonly')
    const store = transaction.objectStore(STORES.VERSIONS)

    return await new Promise<DataVersion[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    return []
  }
}

async function deactivateAllVersions(): Promise<void> {
  const versions = await listVersions()
  const db = await getDB()
  const transaction = db.transaction([STORES.VERSIONS], 'readwrite')
  const store = transaction.objectStore(STORES.VERSIONS)

  for (const version of versions) {
    if (version.isActive) {
      version.isActive = false
      await new Promise<void>((resolve, reject) => {
        const request = store.put(version)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }
}

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export dataset to various formats
 */
export async function exportDataset(
  datasetId: string,
  format: 'json' | 'csv' | 'tfrecord' = 'json'
): Promise<ExportResult> {
  const startTime = Date.now()
  
  try {
    const dataset = await getDataset(datasetId)
    if (!dataset) {
      return {
        success: false,
        format,
        sampleCount: 0,
        error: 'Dataset not found',
        exportedAt: Date.now(),
        checksum: ''
      }
    }

    // Get all samples in dataset
    const samples: TrainingSample[] = []
    for (const sampleId of dataset.sampleIds) {
      const sample = await getSample(sampleId)
      if (sample) samples.push(sample)
    }

    let data: Blob
    let content: string

    switch (format) {
      case 'json':
        content = JSON.stringify({
          dataset,
          samples,
          exportedAt: new Date().toISOString(),
          version: CURRENT_FEATURE_VERSION
        }, null, 2)
        data = new Blob([content], { type: 'application/json' })
        break

      case 'csv':
        content = convertToCSV(samples)
        data = new Blob([content], { type: 'text/csv' })
        break

      case 'tfrecord':
        // TFRecord format would require a library like tfjs-data
        content = JSON.stringify(samples)
        data = new Blob([content], { type: 'application/octet-stream' })
        break

      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    const checksum = await calculateChecksum(content)

    // Log export
    await logExport(datasetId, format, samples.length, checksum)

    mlLogger.info('Exported dataset', { 
      datasetId, 
      format, 
      sampleCount: samples.length,
      duration: Date.now() - startTime
    })

    return {
      success: true,
      data,
      format,
      sampleCount: samples.length,
      exportedAt: Date.now(),
      checksum
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed'
    mlLogger.error('Export failed', { datasetId, format, error: message })
    
    return {
      success: false,
      format,
      sampleCount: 0,
      error: message,
      exportedAt: Date.now(),
      checksum: ''
    }
  }
}

/**
 * Import samples from file
 */
export async function importSamples(
  file: File,
  datasetName?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  }

  try {
    const content = await file.text()
    let data: unknown

    if (file.name.endsWith('.json')) {
      data = JSON.parse(content)
    } else if (file.name.endsWith('.csv')) {
      data = parseCSV(content)
    } else {
      throw new Error('Unsupported file format')
    }

    // Validate and import samples
    const samples = extractSamplesFromImport(data)
    
    for (const sample of samples) {
      try {
        // Check if sample already exists
        const existing = await getSample(sample.id)
        if (existing) {
          result.skippedCount++
          continue
        }

        const storeResult = await storeSample(sample)
        if (storeResult.success) {
          result.importedCount++
        } else {
          result.errorCount++
          result.errors.push(`Failed to store sample ${sample.id}: ${storeResult.error}`)
        }
      } catch (error) {
        result.errorCount++
        result.errors.push(`Error importing sample ${sample.id}: ${error}`)
      }
    }

    // Create dataset if name provided
    if (datasetName && result.importedCount > 0) {
      const datasetResult = await createDataset(
        datasetName,
        `Imported from ${file.name}`,
        {},
        ['imported']
      )
      if (datasetResult.success && datasetResult.dataset) {
        result.datasetId = datasetResult.dataset.id
      }
    }

    result.success = result.errorCount === 0 || result.importedCount > 0
    
    mlLogger.info('Import completed', {
      imported: result.importedCount,
      skipped: result.skippedCount,
      errors: result.errorCount
    })

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed'
    result.errors.push(message)
    return result
  }
}

// ============================================================================
// Storage Statistics
// ============================================================================

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    const [totalSamples, totalDatasets, versions] = await Promise.all([
      countSamples(),
      listDatasets().then(ds => ds.length),
      listVersions()
    ])

    let storageUsed = 0
    let storageAvailable = 0

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      storageUsed = estimate.usage || 0
      storageAvailable = estimate.quota || 0
    }

    return {
      totalSamples,
      totalDatasets,
      storageUsed,
      storageAvailable,
      versionCount: versions.length,
      lastUpdated: Date.now()
    }
  } catch (error) {
    return {
      totalSamples: 0,
      totalDatasets: 0,
      storageUsed: 0,
      storageAvailable: 0,
      versionCount: 0,
      lastUpdated: Date.now()
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateDatasetStats(samples: TrainingSample[]): Dataset['stats'] {
  const positiveLabels = samples.filter(s => s.labels.roundOutcome === 1).length
  const negativeLabels = samples.filter(s => s.labels.roundOutcome === 0).length
  const avgConfidence = samples.reduce((sum, s) => sum + s.quality.confidence, 0) 
    / Math.max(samples.length, 1)
  const outlierCount = samples.filter(s => s.quality.isOutlier).length

  return {
    totalSamples: samples.length,
    positiveLabels,
    negativeLabels,
    avgConfidence,
    outlierCount
  }
}

async function calculateChecksum(data: unknown): Promise<string> {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  const encoder = new TextEncoder()
  const buffer = encoder.encode(str)
  
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback for environments without crypto.subtle
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}

function convertToCSV(samples: TrainingSample[]): string {
  if (samples.length === 0) return ''

  const headers = ['id', 'features', 'winProbability', 'roundOutcome', 'timestamp']
  const rows = samples.map(s => [
    s.id,
    s.features.join('|'),
    s.labels.winProbability ?? '',
    s.labels.roundOutcome ?? '',
    s.metadata.timestamp
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

function parseCSV(content: string): unknown[] {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = values[i]
    })
    return obj
  })
}

function extractSamplesFromImport(data: unknown): TrainingSample[] {
  if (Array.isArray(data)) {
    return data.filter(isValidSample)
  }
  
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.samples)) {
      return obj.samples.filter(isValidSample)
    }
  }

  return []
}

function isValidSample(data: unknown): data is TrainingSample {
  if (!data || typeof data !== 'object') return false
  const s = data as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    Array.isArray(s.features) &&
    s.metadata && typeof s.metadata === 'object'
  )
}

async function logExport(
  datasetId: string,
  format: string,
  sampleCount: number,
  checksum: string
): Promise<void> {
  try {
    const db = await getDB()
    const transaction = db.transaction([STORES.EXPORT_LOGS], 'readwrite')
    const store = transaction.objectStore(STORES.EXPORT_LOGS)

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        datasetId,
        format,
        sampleCount,
        checksum,
        exportedAt: Date.now()
      })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    // Non-critical, don't throw
    mlLogger.warn('Failed to log export', { error })
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  storeSample,
  storeSamples,
  getSample,
  deleteSample,
  querySamples,
  countSamples,
  createDataset,
  getDataset,
  updateDataset,
  deleteDataset,
  listDatasets,
  createVersion,
  getActiveVersion,
  listVersions,
  exportDataset,
  importSamples,
  getStorageStats,
  closeDB,
  deleteDB
}
