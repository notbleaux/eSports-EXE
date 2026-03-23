/**
 * ML Training Orchestrator
 * 
 * [Ver001.000]
 * 
 * Coordinates training jobs with Web Workers:
 * - Job scheduling and queue management
 * - Resource allocation and monitoring
 * - Progress tracking and callbacks
 * - Concurrent training management
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import { mlLogger } from '@/utils/logger'
import type { TrainingSample } from '../pipeline/dataStore'
import type { ModelType } from '../models/manager'
import type { HyperparameterConfig, HyperparameterSpace } from './hyperparameters'

// ============================================================================
// Orchestrator Types
// ============================================================================

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type JobPriority = 'low' | 'normal' | 'high' | 'critical'

export interface TrainingJob {
  id: string
  type: ModelType
  name: string
  description: string
  status: JobStatus
  priority: JobPriority
  createdAt: number
  startedAt?: number
  completedAt?: number
  samples: TrainingSample[]
  config: Partial<HyperparameterConfig>
  hyperparameterSpace?: HyperparameterSpace
  options: TrainingOptions
  progress?: TrainingProgress
  result?: TrainingResult
  error?: string
  resources: ResourceAllocation
}

export interface TrainingOptions {
  earlyStopping?: {
    enabled: boolean
    patience: number
    minDelta: number
    monitor: 'loss' | 'val_loss' | 'accuracy' | 'val_accuracy'
  }
  checkpointInterval?: number // epochs
  saveBestOnly?: boolean
  maxEpochs: number
  batchSize: number
  validationSplit: number
  crossValidation?: {
    enabled: boolean
    k: number
    stratified: boolean
  }
  resourceLimits?: {
    maxMemoryMB: number
    maxTimeMs: number
    maxWorkers: number
  }
}

export interface TrainingProgress {
  epoch: number
  totalEpochs: number
  batch: number
  totalBatches: number
  loss: number
  valLoss?: number
  metrics: Record<string, number>
  valMetrics: Record<string, number>
  learningRate: number
  elapsedTime: number
  estimatedTimeRemaining: number
  samplesPerSecond: number
  memoryUsage: MemoryStats
  fold?: number // For cross-validation
  totalFolds?: number
}

export interface TrainingResult {
  success: boolean
  jobId: string
  finalMetrics: Record<string, number>
  bestEpoch: number
  totalEpochs: number
  trainingTimeMs: number
  modelWeights?: ArrayBuffer
  hyperparameters?: Record<string, unknown>
  crossValidationResults?: CrossValidationResult
  error?: string
}

export interface CrossValidationResult {
  foldResults: FoldResult[]
  meanMetrics: Record<string, number>
  stdMetrics: Record<string, number>
  bestFold: number
}

export interface FoldResult {
  fold: number
  metrics: Record<string, number>
  trainingTimeMs: number
}

export interface MemoryStats {
  usedMB: number
  totalMB: number
  gpuUsedMB?: number
  gpuTotalMB?: number
}

export interface ResourceAllocation {
  workerId?: string
  memoryMB: number
  cpuPercent?: number
  gpuMemoryMB?: number
}

export interface OrchestratorConfig {
  maxConcurrentJobs: number
  maxWorkers: number
  defaultJobTimeout: number
  enableGpu: boolean
  workerPoolSize: number
  resourceCheckInterval: number
}

export interface JobQueueStats {
  pending: number
  running: number
  completed: number
  failed: number
  cancelled: number
  total: number
  estimatedWaitTime: number
}

export interface ResourceStats {
  activeWorkers: number
  availableWorkers: number
  memoryUsageMB: number
  memoryLimitMB: number
  cpuUsage: number
  gpuUsage?: number
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_TRAINING_OPTIONS: TrainingOptions = {
  earlyStopping: {
    enabled: true,
    patience: 10,
    minDelta: 0.001,
    monitor: 'val_loss'
  },
  checkpointInterval: 5,
  saveBestOnly: true,
  maxEpochs: 100,
  batchSize: 32,
  validationSplit: 0.15,
  crossValidation: {
    enabled: false,
    k: 5,
    stratified: true
  },
  resourceLimits: {
    maxMemoryMB: 2048,
    maxTimeMs: 3600000, // 1 hour
    maxWorkers: 2
  }
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxConcurrentJobs: 2,
  maxWorkers: 4,
  defaultJobTimeout: 3600000, // 1 hour
  enableGpu: false,
  workerPoolSize: 4,
  resourceCheckInterval: 5000 // 5 seconds
}

// ============================================================================
// Worker Management
// ============================================================================

type WorkerStatus = 'idle' | 'busy' | 'error'

interface WorkerInfo {
  id: string
  worker: Worker
  status: WorkerStatus
  currentJob?: string
  memoryUsage: number
  startTime?: number
}

// ============================================================================
// Training Orchestrator Class
// ============================================================================

export class TrainingOrchestrator {
  private config: OrchestratorConfig
  private jobs: Map<string, TrainingJob> = new Map()
  private jobQueue: string[] = []
  private workers: Map<string, WorkerInfo> = new Map()
  private workerPool: Worker[] = []
  private progressListeners: Set<(jobId: string, progress: TrainingProgress) => void> = new Set()
  private completionListeners: Set<(jobId: string, result: TrainingResult) => void> = new Set()
  private errorListeners: Set<(jobId: string, error: string) => void> = new Set()
  private resourceInterval?: number
  private isRunning = false

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config }
    this.initializeWorkerPool()
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeWorkerPool(): void {
    // Create workers lazily when needed
    mlLogger.info('Training orchestrator initialized', { config: this.config })
  }

  private async getWorker(): Promise<Worker> {
    // Look for available worker
    for (const [id, info] of this.workers) {
      if (info.status === 'idle') {
        info.status = 'busy'
        return info.worker
      }
    }

    // Create new worker if under limit
    if (this.workers.size < this.config.maxWorkers) {
      const worker = await this.createWorker()
      const id = `worker-${this.workers.size + 1}`
      this.workers.set(id, {
        id,
        worker,
        status: 'busy',
        memoryUsage: 0
      })
      return worker
    }

    throw new Error('No available workers')
  }

  private async createWorker(): Promise<Worker> {
    // Dynamic import of training worker
    const TrainingWorker = await import('../models/trainingWorker?worker')
    const worker = new TrainingWorker.default()
    
    worker.onmessage = (event) => this.handleWorkerMessage(event)
    worker.onerror = (error) => this.handleWorkerError(error)
    
    return worker
  }

  // ============================================================================
  // Job Management
  // ============================================================================

  /**
   * Submit a new training job
   */
  async submitJob(
    type: ModelType,
    name: string,
    samples: TrainingSample[],
    options: Partial<TrainingOptions> = {},
    hyperparameterSpace?: HyperparameterSpace,
    priority: JobPriority = 'normal'
  ): Promise<TrainingJob> {
    const job: TrainingJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      name,
      description: `Training ${type} model with ${samples.length} samples`,
      status: 'pending',
      priority,
      createdAt: Date.now(),
      samples,
      config: {},
      hyperparameterSpace,
      options: { ...DEFAULT_TRAINING_OPTIONS, ...options },
      resources: {
        memoryMB: 512
      }
    }

    this.jobs.set(job.id, job)
    this.enqueueJob(job.id)
    
    mlLogger.info('Training job submitted', { 
      jobId: job.id, 
      type, 
      samples: samples.length,
      priority 
    })

    // Start processing if not already running
    if (!this.isRunning) {
      this.start()
    }

    return job
  }

  /**
   * Submit multiple jobs as a batch
   */
  async submitBatch(
    jobs: Array<{
      type: ModelType
      name: string
      samples: TrainingSample[]
      options?: Partial<TrainingOptions>
      hyperparameterSpace?: HyperparameterSpace
      priority?: JobPriority
    }>
  ): Promise<TrainingJob[]> {
    const submitted: TrainingJob[] = []
    
    for (const jobConfig of jobs) {
      const job = await this.submitJob(
        jobConfig.type,
        jobConfig.name,
        jobConfig.samples,
        jobConfig.options,
        jobConfig.hyperparameterSpace,
        jobConfig.priority
      )
      submitted.push(job)
    }

    return submitted
  }

  /**
   * Cancel a running or pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === 'pending') {
      // Remove from queue
      const queueIndex = this.jobQueue.indexOf(jobId)
      if (queueIndex > -1) {
        this.jobQueue.splice(queueIndex, 1)
      }
      job.status = 'cancelled'
      job.completedAt = Date.now()
      return true
    }

    if (job.status === 'running') {
      // Send cancel to worker
      const workerInfo = Array.from(this.workers.values()).find(w => w.currentJob === jobId)
      if (workerInfo) {
        workerInfo.worker.postMessage({ id: jobId, action: 'cancel' })
      }
      job.status = 'cancelled'
      job.completedAt = Date.now()
      return true
    }

    return false
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): TrainingJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all jobs
   */
  getAllJobs(): TrainingJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): TrainingJob[] {
    return Array.from(this.jobs.values()).filter(j => j.status === status)
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  private enqueueJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    // Insert based on priority
    const priorityOrder: JobPriority[] = ['critical', 'high', 'normal', 'low']
    const jobPriority = priorityOrder.indexOf(job.priority)

    let insertIndex = this.jobQueue.length
    for (let i = 0; i < this.jobQueue.length; i++) {
      const queuedJob = this.jobs.get(this.jobQueue[i])
      if (queuedJob) {
        const queuedPriority = priorityOrder.indexOf(queuedJob.priority)
        if (jobPriority < queuedPriority) {
          insertIndex = i
          break
        }
      }
    }

    this.jobQueue.splice(insertIndex, 0, jobId)
  }

  private dequeueJob(): string | undefined {
    return this.jobQueue.shift()
  }

  // ============================================================================
  // Job Processing
  // ============================================================================

  /**
   * Start the orchestrator
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.processQueue()
    
    // Start resource monitoring
    this.resourceInterval = window.setInterval(
      () => this.monitorResources(),
      this.config.resourceCheckInterval
    )

    mlLogger.info('Training orchestrator started')
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    this.isRunning = false
    
    if (this.resourceInterval) {
      clearInterval(this.resourceInterval)
      this.resourceInterval = undefined
    }

    // Cancel running jobs
    for (const job of this.jobs.values()) {
      if (job.status === 'running') {
        this.cancelJob(job.id)
      }
    }

    mlLogger.info('Training orchestrator stopped')
  }

  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      const runningCount = this.getJobsByStatus('running').length
      
      if (runningCount >= this.config.maxConcurrentJobs) {
        await this.sleep(100)
        continue
      }

      const jobId = this.dequeueJob()
      if (!jobId) {
        await this.sleep(100)
        continue
      }

      const job = this.jobs.get(jobId)
      if (!job || job.status !== 'pending') {
        continue
      }

      try {
        await this.executeJob(job)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Execution failed'
        this.handleJobError(job.id, message)
      }
    }
  }

  private async executeJob(job: TrainingJob): Promise<void> {
    job.status = 'running'
    job.startedAt = Date.now()

    mlLogger.info('Starting training job', { jobId: job.id, type: job.type })

    try {
      const worker = await this.getWorker()
      const workerInfo = Array.from(this.workers.values()).find(w => w.worker === worker)
      
      if (workerInfo) {
        workerInfo.currentJob = job.id
        workerInfo.startTime = Date.now()
      }

      // Determine task type
      const taskType = this.getTaskType(job.type)

      // Send training task to worker
      worker.postMessage({
        id: job.id,
        action: 'train',
        payload: {
          id: job.id,
          type: taskType,
          samples: job.samples,
          config: job.config,
          options: job.options
        }
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start job'
      this.handleJobError(job.id, message)
    }
  }

  private getTaskType(modelType: ModelType): string {
    switch (modelType) {
      case 'roundPredictor':
        return 'trainRoundPredictor'
      case 'playerPerformance':
        return 'trainPlayerPerformance'
      case 'strategy':
        return 'trainStrategy'
      default:
        throw new Error(`Unknown model type: ${modelType}`)
    }
  }

  // ============================================================================
  // Worker Message Handling
  // ============================================================================

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, type, data, error } = event.data
    
    if (!id) return

    switch (type) {
      case 'progress':
        this.handleProgressUpdate(id, data as TrainingProgress)
        break
      case 'complete':
        this.handleJobComplete(id, data as TrainingResult)
        break
      case 'error':
        this.handleJobError(id, error)
        break
      case 'status':
        // Worker status update, handle if needed
        break
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    mlLogger.error('Worker error', { error: error.message })
    
    // Find worker that errored
    for (const [workerId, info] of this.workers) {
      if (info.currentJob) {
        this.handleJobError(info.currentJob, error.message)
        info.status = 'error'
        info.currentJob = undefined
      }
    }
  }

  private handleProgressUpdate(jobId: string, progress: TrainingProgress): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.progress = progress

    // Notify listeners
    for (const listener of this.progressListeners) {
      try {
        listener(jobId, progress)
      } catch (e) {
        mlLogger.error('Progress listener error', { error: e })
      }
    }
  }

  private handleJobComplete(jobId: string, result: TrainingResult): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = 'completed'
    job.completedAt = Date.now()
    job.result = result

    // Release worker
    for (const [id, info] of this.workers) {
      if (info.currentJob === jobId) {
        info.status = 'idle'
        info.currentJob = undefined
        info.memoryUsage = 0
        break
      }
    }

    mlLogger.info('Training job completed', { 
      jobId, 
      duration: job.completedAt - (job.startedAt || job.createdAt),
      metrics: result.finalMetrics 
    })

    // Notify listeners
    for (const listener of this.completionListeners) {
      try {
        listener(jobId, result)
      } catch (e) {
        mlLogger.error('Completion listener error', { error: e })
      }
    }
  }

  private handleJobError(jobId: string, error: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = 'failed'
    job.completedAt = Date.now()
    job.error = error

    // Release worker
    for (const [id, info] of this.workers) {
      if (info.currentJob === jobId) {
        info.status = 'idle'
        info.currentJob = undefined
        break
      }
    }

    mlLogger.error('Training job failed', { jobId, error })

    // Notify listeners
    for (const listener of this.errorListeners) {
      try {
        listener(jobId, error)
      } catch (e) {
        mlLogger.error('Error listener error', { error: e })
      }
    }
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  onProgress(callback: (jobId: string, progress: TrainingProgress) => void): () => void {
    this.progressListeners.add(callback)
    return () => this.progressListeners.delete(callback)
  }

  onComplete(callback: (jobId: string, result: TrainingResult) => void): () => void {
    this.completionListeners.add(callback)
    return () => this.completionListeners.delete(callback)
  }

  onError(callback: (jobId: string, error: string) => void): () => void {
    this.errorListeners.add(callback)
    return () => this.errorListeners.delete(callback)
  }

  // ============================================================================
  // Resource Management
  // ============================================================================

  private monitorResources(): void {
    // Check memory usage
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
      if (memory && memory.usedJSHeapSize > this.config.maxWorkers * 500 * 1024 * 1024) {
        mlLogger.warn('High memory usage detected', { 
          usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024) 
        })
      }
    }

    // Check for timed out jobs
    const now = Date.now()
    for (const job of this.jobs.values()) {
      if (job.status === 'running' && job.startedAt) {
        const elapsed = now - job.startedAt
        const maxTime = job.options.resourceLimits?.maxTimeMs || this.config.defaultJobTimeout
        
        if (elapsed > maxTime) {
          this.handleJobError(job.id, 'Job timeout exceeded')
        }
      }
    }
  }

  getResourceStats(): ResourceStats {
    const activeWorkers = Array.from(this.workers.values()).filter(w => w.status === 'busy').length
    
    let memoryUsageMB = 0
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
      if (memory) {
        memoryUsageMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      }
    }

    return {
      activeWorkers,
      availableWorkers: this.config.maxWorkers - activeWorkers,
      memoryUsageMB,
      memoryLimitMB: this.config.maxWorkers * 512,
      cpuUsage: 0 // Would need more sophisticated measurement
    }
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getQueueStats(): JobQueueStats {
    const jobs = Array.from(this.jobs.values())
    const pending = jobs.filter(j => j.status === 'pending').length
    const running = jobs.filter(j => j.status === 'running').length
    const completed = jobs.filter(j => j.status === 'completed').length
    const failed = jobs.filter(j => j.status === 'failed').length
    const cancelled = jobs.filter(j => j.status === 'cancelled').length

    // Estimate wait time based on average job duration
    let estimatedWaitTime = 0
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.completedAt && j.startedAt)
    if (completedJobs.length > 0) {
      const avgDuration = completedJobs.reduce((sum, j) => 
        sum + (j.completedAt! - j.startedAt!), 0) / completedJobs.length
      estimatedWaitTime = pending * (avgDuration / Math.min(running + 1, this.config.maxConcurrentJobs))
    }

    return {
      pending,
      running,
      completed,
      failed,
      cancelled,
      total: jobs.length,
      estimatedWaitTime
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    this.stop()
    
    // Terminate all workers
    for (const [id, info] of this.workers) {
      info.worker.terminate()
    }
    this.workers.clear()

    this.jobs.clear()
    this.jobQueue = []
    this.progressListeners.clear()
    this.completionListeners.clear()
    this.errorListeners.clear()

    mlLogger.info('Training orchestrator disposed')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let orchestratorInstance: TrainingOrchestrator | null = null

export function getTrainingOrchestrator(config?: Partial<OrchestratorConfig>): TrainingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new TrainingOrchestrator(config)
  }
  return orchestratorInstance
}

export function resetTrainingOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}

// ============================================================================
// Exports
// ============================================================================

export default TrainingOrchestrator
