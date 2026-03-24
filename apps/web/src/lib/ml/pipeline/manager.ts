/**
 * ML Pipeline Manager
 * 
 * [Ver001.000]
 * 
 * Provides:
 * - Pipeline orchestration
 * - Step sequencing
 * - Error handling
 * - Progress tracking
 * 
 * Agent: TL-S3-3-A
 * Team: ML Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import { WorkerPool } from '@/lib/worker-utils'
import type { PipelineConfig, PipelineResult, IngestionResult } from './dataPipeline'
import { runDataPipeline, ingestMatchData, ingestLensData } from './dataPipeline'
import type { TrainingSample, Dataset } from './dataStore'
import { 
  storeSample, 
  storeSamples, 
  createDataset, 
  updateDataset,
  getDataset,
  querySamples 
} from './dataStore'
import type { ExtractedFeatures } from './features'
import type { ValidationResult } from './validation'
import { validateDataset } from './validation'

// ============================================================================
// Pipeline Step Types
// ============================================================================

export type PipelineStepType = 
  | 'ingest'
  | 'validate'
  | 'transform'
  | 'normalize'
  | 'split'
  | 'export'
  | 'custom'

export interface PipelineStep {
  id: string
  type: PipelineStepType
  name: string
  config?: Record<string, unknown>
  dependsOn?: string[]
  enabled: boolean
}

export interface PipelineStage {
  id: string
  name: string
  steps: PipelineStep[]
  parallel: boolean
}

export interface PipelineDefinition {
  id: string
  name: string
  description: string
  stages: PipelineStage[]
  config: PipelineConfig
  createdAt: number
  updatedAt: number
}

// ============================================================================
// Progress Tracking
// ============================================================================

export interface ProgressUpdate {
  stageId: string
  stepId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  progress: number // 0-100
  message: string
  timestamp: number
  error?: string
}

export interface PipelineExecution {
  id: string
  pipelineId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
  progress: ProgressUpdate[]
  results: Map<string, unknown>
  errors: PipelineError[]
}

export interface PipelineError {
  stageId: string
  stepId: string
  error: string
  timestamp: number
  recoverable: boolean
}

export type ProgressCallback = (update: ProgressUpdate) => void

// ============================================================================
// Pipeline Manager Class
// ============================================================================

export class PipelineManager {
  private workerPool: WorkerPool | null = null
  private activeExecutions: Map<string, PipelineExecution> = new Map()
  private pipelineDefinitions: Map<string, PipelineDefinition> = new Map()
  private progressListeners: Set<ProgressCallback> = new Set()
  private abortControllers: Map<string, AbortController> = new Map()

  constructor() {
    this.initializeWorkerPool()
    this.loadDefaultPipelines()
  }

  private initializeWorkerPool(): void {
    // WORKER DISABLED FOR VERCEL BUILD - Vite 8 worker bug requires terser
    mlLogger.info('Pipeline manager using main thread (workers disabled for build)')
    /* Original code disabled:
    if (typeof Worker !== 'undefined') {
      try {
        this.workerPool = new WorkerPool(
          'data',
          () => new Worker(new URL('./pipeline.worker.ts', import.meta.url), { type: 'module' }),
          { maxWorkers: 2, idleTimeoutMs: 60000, taskTimeoutMs: 300000 }
        )
        mlLogger.info('Pipeline manager initialized with worker pool')
      } catch (error) {
        mlLogger.warn('Failed to initialize worker pool, using main thread', { error })
      }
    }
    */
  }

  private loadDefaultPipelines(): void {
    // Standard training pipeline
    this.registerPipeline({
      id: 'standard-training',
      name: 'Standard Training Pipeline',
      description: 'Complete pipeline for training data preparation',
      stages: [
        {
          id: 'ingestion',
          name: 'Data Ingestion',
          parallel: false,
          steps: [
            { id: 'ingest', type: 'ingest', name: 'Ingest Raw Data', enabled: true },
            { id: 'validate', type: 'validate', name: 'Validate Samples', enabled: true }
          ]
        },
        {
          id: 'transformation',
          name: 'Data Transformation',
          parallel: false,
          steps: [
            { id: 'transform', type: 'transform', name: 'Feature Engineering', enabled: true },
            { id: 'normalize', type: 'normalize', name: 'Normalize Features', enabled: true }
          ]
        },
        {
          id: 'preparation',
          name: 'Dataset Preparation',
          parallel: false,
          steps: [
            { id: 'split', type: 'split', name: 'Train/Test Split', enabled: true },
            { id: 'export', type: 'export', name: 'Export Tensors', enabled: true }
          ]
        }
      ],
      config: {
        batchSize: 32,
        validationSplit: 0.15,
        testSplit: 0.15,
        normalizeFeatures: true,
        handleMissingValues: 'impute',
        outlierStrategy: 'flag'
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    // Quick validation pipeline
    this.registerPipeline({
      id: 'quick-validate',
      name: 'Quick Validation Pipeline',
      description: 'Fast validation without full processing',
      stages: [
        {
          id: 'validation',
          name: 'Validation Only',
          parallel: true,
          steps: [
            { id: 'validate-schema', type: 'validate', name: 'Schema Check', enabled: true },
            { id: 'validate-quality', type: 'validate', name: 'Quality Check', enabled: true }
          ]
        }
      ],
      config: {
        batchSize: 32,
        validationSplit: 0,
        testSplit: 0,
        normalizeFeatures: false,
        handleMissingValues: 'ignore',
        outlierStrategy: 'flag'
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  // ============================================================================
  // Pipeline Registration
  // ============================================================================

  registerPipeline(definition: PipelineDefinition): void {
    this.pipelineDefinitions.set(definition.id, definition)
    mlLogger.debug('Registered pipeline', { id: definition.id, name: definition.name })
  }

  unregisterPipeline(pipelineId: string): boolean {
    const deleted = this.pipelineDefinitions.delete(pipelineId)
    if (deleted) {
      mlLogger.debug('Unregistered pipeline', { id: pipelineId })
    }
    return deleted
  }

  getPipeline(pipelineId: string): PipelineDefinition | undefined {
    return this.pipelineDefinitions.get(pipelineId)
  }

  listPipelines(): PipelineDefinition[] {
    return Array.from(this.pipelineDefinitions.values())
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  addProgressListener(callback: ProgressCallback): () => void {
    this.progressListeners.add(callback)
    return () => this.progressListeners.delete(callback)
  }

  private notifyProgress(update: ProgressUpdate): void {
    for (const listener of this.progressListeners) {
      try {
        listener(update)
      } catch (error) {
        mlLogger.warn('Progress listener error', { error })
      }
    }
  }

  private createProgressUpdate(
    stageId: string,
    stepId: string,
    status: ProgressUpdate['status'],
    progress: number,
    message: string,
    error?: string
  ): ProgressUpdate {
    return {
      stageId,
      stepId,
      status,
      progress,
      message,
      timestamp: Date.now(),
      error
    }
  }

  // ============================================================================
  // Pipeline Execution
  // ============================================================================

  async executePipeline(
    pipelineId: string,
    inputData: {
      samples?: TrainingSample[]
      datasetId?: string
      rawData?: Parameters<typeof ingestMatchData>[0]
      lensData?: Parameters<typeof ingestLensData>[0]
    },
    options: {
      useWorkers?: boolean
      abortSignal?: AbortSignal
    } = {}
  ): Promise<PipelineExecution> {
    const pipeline = this.pipelineDefinitions.get(pipelineId)
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`)
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const abortController = new AbortController()
    this.abortControllers.set(executionId, abortController)

    if (options.abortSignal) {
      options.abortSignal.addEventListener('abort', () => {
        abortController.abort()
      })
    }

    const execution: PipelineExecution = {
      id: executionId,
      pipelineId,
      status: 'pending',
      startTime: Date.now(),
      progress: [],
      results: new Map(),
      errors: []
    }

    this.activeExecutions.set(executionId, execution)
    mlLogger.info('Starting pipeline execution', { executionId, pipelineId })

    try {
      execution.status = 'running'

      // Execute each stage
      for (const stage of pipeline.stages) {
        await this.executeStage(execution, stage, inputData, abortController.signal, options.useWorkers)
      }

      execution.status = 'completed'
      execution.endTime = Date.now()
      
      mlLogger.info('Pipeline execution completed', { 
        executionId, 
        duration: execution.endTime - execution.startTime 
      })

    } catch (error) {
      execution.status = 'failed'
      execution.endTime = Date.now()
      
      const errorMessage = error instanceof Error ? error.message : 'Pipeline execution failed'
      execution.errors.push({
        stageId: 'pipeline',
        stepId: 'execution',
        error: errorMessage,
        timestamp: Date.now(),
        recoverable: false
      })

      mlLogger.error('Pipeline execution failed', { executionId, error: errorMessage })
    } finally {
      this.abortControllers.delete(executionId)
    }

    return execution
  }

  private async executeStage(
    execution: PipelineExecution,
    stage: PipelineStage,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal,
    useWorkers?: boolean
  ): Promise<void> {
    mlLogger.debug('Executing stage', { executionId: execution.id, stageId: stage.id })

    if (stage.parallel) {
      // Execute steps in parallel
      await Promise.all(
        stage.steps
          .filter(step => step.enabled)
          .map(step => this.executeStep(execution, stage.id, step, inputData, abortSignal, useWorkers))
      )
    } else {
      // Execute steps sequentially
      for (const step of stage.steps) {
        if (!step.enabled) continue
        
        if (abortSignal.aborted) {
          throw new Error('Pipeline execution aborted')
        }

        await this.executeStep(execution, stage.id, step, inputData, abortSignal, useWorkers)
      }
    }
  }

  private async executeStep(
    execution: PipelineExecution,
    stageId: string,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal,
    useWorkers?: boolean
  ): Promise<void> {
    const progress = this.createProgressUpdate(
      stageId,
      step.id,
      'running',
      0,
      `Starting ${step.name}`
    )
    execution.progress.push(progress)
    this.notifyProgress(progress)

    try {
      // Check dependencies
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          const depCompleted = execution.progress.some(
            p => p.stepId === depId && (p.status === 'completed' || p.status === 'skipped')
          )
          if (!depCompleted) {
            throw new Error(`Dependency ${depId} not completed`)
          }
        }
      }

      // Execute based on step type
      switch (step.type) {
        case 'ingest':
          await this.executeIngestStep(execution, step, inputData, abortSignal)
          break
        case 'validate':
          await this.executeValidateStep(execution, step, inputData, abortSignal)
          break
        case 'transform':
          await this.executeTransformStep(execution, step, inputData, abortSignal)
          break
        case 'normalize':
          await this.executeNormalizeStep(execution, step, inputData, abortSignal)
          break
        case 'split':
          await this.executeSplitStep(execution, step, inputData, abortSignal)
          break
        case 'export':
          await this.executeExportStep(execution, step, inputData, abortSignal)
          break
        case 'custom':
          // Custom step logic would be provided via config
          break
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      // Update progress
      const completed = this.createProgressUpdate(
        stageId,
        step.id,
        'completed',
        100,
        `Completed ${step.name}`
      )
      execution.progress.push(completed)
      this.notifyProgress(completed)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step execution failed'
      
      const failed = this.createProgressUpdate(
        stageId,
        step.id,
        'failed',
        0,
        `Failed: ${step.name}`,
        errorMessage
      )
      execution.progress.push(failed)
      this.notifyProgress(failed)

      execution.errors.push({
        stageId,
        stepId: step.id,
        error: errorMessage,
        timestamp: Date.now(),
        recoverable: false
      })

      throw error
    }
  }

  private async executeIngestStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const progress = this.createProgressUpdate(
      'ingestion',
      step.id,
      'running',
      50,
      'Ingesting data...'
    )
    this.notifyProgress(progress)

    let samples: TrainingSample[] = []

    if (inputData.samples) {
      samples = inputData.samples
    } else if (inputData.rawData) {
      // Would need extractFeaturesFn parameter
      mlLogger.warn('Raw data ingestion requires extractFeaturesFn, skipping')
    } else if (inputData.lensData) {
      const result = await ingestLensData(
        inputData.lensData.features || [],
        inputData.lensData.labels || [],
        inputData.lensData.metadata || []
      )
      samples = result.samples
    }

    execution.results.set('samples', samples)
  }

  private async executeValidateStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const samples = execution.results.get('samples') as TrainingSample[] || inputData.samples || []
    
    const progress = this.createProgressUpdate(
      'validation',
      step.id,
      'running',
      50,
      `Validating ${samples.length} samples...`
    )
    this.notifyProgress(progress)

    const validationResult = await validateDataset(samples)
    execution.results.set('validation', validationResult)

    // Store valid samples only
    const validSamples = samples.filter((s, i) => validationResult.sampleResults[i]?.valid)
    execution.results.set('samples', validSamples)
  }

  private async executeTransformStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const progress = this.createProgressUpdate(
      'transformation',
      step.id,
      'running',
      50,
      'Applying feature engineering...'
    )
    this.notifyProgress(progress)

    // Transformation logic would be applied here
    // For now, samples are passed through
  }

  private async executeNormalizeStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const progress = this.createProgressUpdate(
      'transformation',
      step.id,
      'running',
      50,
      'Normalizing features...'
    )
    this.notifyProgress(progress)

    // Normalization is handled in the full pipeline
  }

  private async executeSplitStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const pipeline = this.pipelineDefinitions.get(execution.pipelineId)
    if (!pipeline) return

    const progress = this.createProgressUpdate(
      'preparation',
      step.id,
      'running',
      50,
      'Splitting dataset...'
    )
    this.notifyProgress(progress)

    // Run full pipeline on samples
    const samples = execution.results.get('samples') as TrainingSample[] || []
    const datasetId = inputData.datasetId || `dataset-${Date.now()}`

    const result = await runDataPipeline(samples, datasetId, pipeline.config)
    execution.results.set('pipelineResult', result)
  }

  private async executeExportStep(
    execution: PipelineExecution,
    step: PipelineStep,
    inputData: Parameters<PipelineManager['executePipeline']>[1],
    abortSignal: AbortSignal
  ): Promise<void> {
    const progress = this.createProgressUpdate(
      'preparation',
      step.id,
      'running',
      50,
      'Exporting tensors...'
    )
    this.notifyProgress(progress)

    // Export logic would be applied here
  }

  // ============================================================================
  // Execution Control
  // ============================================================================

  cancelExecution(executionId: string): boolean {
    const controller = this.abortControllers.get(executionId)
    if (controller) {
      controller.abort()
      
      const execution = this.activeExecutions.get(executionId)
      if (execution) {
        execution.status = 'cancelled'
        execution.endTime = Date.now()
      }
      
      mlLogger.info('Pipeline execution cancelled', { executionId })
      return true
    }
    return false
  }

  getExecution(executionId: string): PipelineExecution | undefined {
    return this.activeExecutions.get(executionId)
  }

  listActiveExecutions(): PipelineExecution[] {
    return Array.from(this.activeExecutions.values())
      .filter(e => e.status === 'running')
  }

  cleanupCompletedExecutions(maxAgeMs: number = 3600000): number {
    const now = Date.now()
    let cleaned = 0

    for (const [id, execution] of this.activeExecutions) {
      if (execution.endTime && now - execution.endTime > maxAgeMs) {
        this.activeExecutions.delete(id)
        cleaned++
      }
    }

    return cleaned
  }

  // ============================================================================
  // Worker Delegation
  // ============================================================================

  async executeWithWorker<T, R>(
    action: string,
    payload: T,
    timeout?: number
  ): Promise<R> {
    if (!this.workerPool) {
      throw new Error('Worker pool not available')
    }

    return this.workerPool.execute<T, R>(action, payload)
  }

  // ============================================================================
  // High-Level Operations
  // ============================================================================

  async processDataset(
    samples: TrainingSample[],
    datasetName: string,
    config?: Partial<PipelineConfig>
  ): Promise<{
    execution: PipelineExecution
    dataset?: Dataset
    pipelineResult?: PipelineResult
  }> {
    // Create dataset first
    const datasetResult = await createDataset(
      datasetName,
      `Created via pipeline manager`,
      {},
      ['pipeline']
    )

    if (!datasetResult.success || !datasetResult.dataset) {
      throw new Error('Failed to create dataset')
    }

    // Execute pipeline
    const execution = await this.executePipeline(
      'standard-training',
      {
        samples,
        datasetId: datasetResult.dataset.id
      },
      { useWorkers: true }
    )

    const pipelineResult = execution.results.get('pipelineResult') as PipelineResult | undefined

    // Update dataset with stats if pipeline succeeded
    if (execution.status === 'completed' && pipelineResult?.success) {
      await updateDataset(datasetResult.dataset.id, {
        description: `Processed ${pipelineResult.stats.processedSamples} samples`
      })
    }

    return {
      execution,
      dataset: datasetResult.dataset,
      pipelineResult
    }
  }

  async validateAndStore(
    samples: TrainingSample[],
    options: {
      strictMode?: boolean
      storeInvalid?: boolean
    } = {}
  ): Promise<{
    stored: number
    rejected: number
    validationResults: ValidationResult[]
  }> {
    const { strictMode = false, storeInvalid = false } = options

    // Validate samples
    const validation = await validateDataset(samples)
    
    let stored = 0
    let rejected = 0

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i]
      const result = validation.sampleResults[i]

      const shouldStore = result.valid || (!strictMode && !storeInvalid)

      if (shouldStore) {
        const storeResult = await storeSample(sample)
        if (storeResult.success) {
          stored++
        } else {
          rejected++
        }
      } else {
        rejected++
      }
    }

    return {
      stored,
      rejected,
      validationResults: validation.sampleResults
    }
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(): {
    registeredPipelines: number
    activeExecutions: number
    totalExecutions: number
    workerPoolActive: boolean
  } {
    return {
      registeredPipelines: this.pipelineDefinitions.size,
      activeExecutions: this.listActiveExecutions().length,
      totalExecutions: this.activeExecutions.size,
      workerPoolActive: this.workerPool !== null
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    // Cancel all active executions
    for (const [id] of this.abortControllers) {
      this.cancelExecution(id)
    }

    // Dispose worker pool
    if (this.workerPool) {
      this.workerPool.dispose()
      this.workerPool = null
    }

    // Clear listeners
    this.progressListeners.clear()

    mlLogger.info('Pipeline manager disposed')
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let pipelineManagerInstance: PipelineManager | null = null

export function getPipelineManager(): PipelineManager {
  if (!pipelineManagerInstance) {
    pipelineManagerInstance = new PipelineManager()
  }
  return pipelineManagerInstance
}

export function resetPipelineManager(): void {
  if (pipelineManagerInstance) {
    pipelineManagerInstance.dispose()
    pipelineManagerInstance = null
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  PipelineManager,
  getPipelineManager,
  resetPipelineManager
}
