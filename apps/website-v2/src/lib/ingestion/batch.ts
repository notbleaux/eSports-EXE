/**
 * Batch Processor
 * ===============
 * Batch job management, queue processing, error handling, and progress tracking.
 * 
 * [Ver001.000] - Batch processor
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import type {
  BatchJob,
  BatchFilters,
  BatchSchedule,
  BatchProgress,
  BatchResults,
  BatchError,
  StageProgress,
  QueueItem,
  QueueConfig,
  QueueStats,
  IngestionDataType,
  DataSourceConfig,
  RawDataRecord,
  NormalizedRecord,
  DataConnector,
} from './types';

import { DataTransformer } from './transformer';
import { createConnector } from './connectors';

// =============================================================================
// Queue Manager
// =============================================================================

export class IngestionQueue {
  private items: QueueItem[] = [];
  private processing: Set<string> = new Set();
  private config: QueueConfig;
  private processingCallback?: (item: QueueItem) => Promise<void>;
  private intervalId?: ReturnType<typeof setInterval>;
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    avgProcessingTime: 0,
    throughputPerMinute: 0,
  };
  private totalProcessingTime = 0;
  private processedCount = 0;
  private startTime = Date.now();

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrent: 5,
      retryDelay: 5000,
      maxRetries: 3,
      timeout: 30000,
      backoffMultiplier: 2,
      ...config,
    };
  }

  /**
   * Add item to queue
   */
  enqueue(data: unknown, jobId: string, priority = 0): QueueItem {
    const item: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      data,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxRetries + 1,
      createdAt: new Date().toISOString(),
    };

    this.items.push(item);
    this.sortQueue();
    this.updateStats();

    return item;
  }

  /**
   * Add multiple items to queue
   */
  enqueueBatch(items: { data: unknown; priority?: number }[], jobId: string): QueueItem[] {
    return items.map(item => this.enqueue(item.data, jobId, item.priority));
  }

  /**
   * Remove and return next item
   */
  dequeue(): QueueItem | undefined {
    const item = this.items.find(i => i.status === 'pending');
    if (item) {
      item.status = 'processing';
      this.processing.add(item.id);
      this.updateStats();
    }
    return item;
  }

  /**
   * Mark item as completed
   */
  complete(itemId: string, processingTime: number): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.status = 'completed';
      item.processedAt = new Date().toISOString();
      this.processing.delete(itemId);
      
      this.totalProcessingTime += processingTime;
      this.processedCount++;
      this.updateStats();
    }
  }

  /**
   * Mark item as failed
   */
  fail(itemId: string, error: string): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.attempts++;
      item.error = error;
      this.processing.delete(itemId);

      if (item.attempts < item.maxAttempts) {
        // Retry
        item.status = 'pending';
        const delay = this.config.retryDelay * Math.pow(this.config.backoffMultiplier, item.attempts - 1);
        setTimeout(() => {
          this.sortQueue();
        }, delay);
      } else {
        item.status = 'failed';
      }

      this.updateStats();
    }
  }

  /**
   * Start processing queue
   */
  start(callback: (item: QueueItem) => Promise<void>): void {
    this.processingCallback = callback;
    
    this.intervalId = setInterval(() => {
      this.processNext();
    }, 100);
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get all items
   */
  getItems(): QueueItem[] {
    return [...this.items];
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.items = [];
    this.processing.clear();
    this.updateStats();
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.items.filter(i => i.status === 'pending').length;
  }

  /**
   * Pause item
   */
  pause(itemId: string): void {
    const item = this.items.find(i => i.id === itemId);
    if (item && item.status === 'processing') {
      item.status = 'pending';
      this.processing.delete(itemId);
      this.updateStats();
    }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private sortQueue(): void {
    this.items.sort((a, b) => {
      // Priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then creation time
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  private async processNext(): Promise<void> {
    if (!this.processingCallback) return;
    if (this.processing.size >= this.config.maxConcurrent) return;

    const item = this.dequeue();
    if (!item) return;

    const startTime = Date.now();

    try {
      await this.processWithTimeout(item);
      this.complete(item.id, Date.now() - startTime);
    } catch (error) {
      this.fail(item.id, (error as Error).message);
    }
  }

  private async processWithTimeout(item: QueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Processing timeout'));
      }, this.config.timeout);

      this.processingCallback!(item)
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private updateStats(): void {
    const pending = this.items.filter(i => i.status === 'pending').length;
    const processing = this.processing.size;
    const completed = this.items.filter(i => i.status === 'completed').length;
    const failed = this.items.filter(i => i.status === 'failed').length;

    const elapsedMinutes = (Date.now() - this.startTime) / 60000;

    this.stats = {
      pending,
      processing,
      completed,
      failed,
      avgProcessingTime: this.processedCount > 0 ? this.totalProcessingTime / this.processedCount : 0,
      throughputPerMinute: elapsedMinutes > 0 ? (completed + failed) / elapsedMinutes : 0,
    };
  }
}

// =============================================================================
// Batch Job Manager
// =============================================================================

export class BatchJobManager {
  private jobs: Map<string, BatchJob> = new Map();
  private queues: Map<string, IngestionQueue> = new Map();
  private transformer: DataTransformer;
  private onProgressCallback?: (jobId: string, progress: BatchProgress) => void;
  private onCompleteCallback?: (jobId: string, results: BatchResults) => void;
  private onErrorCallback?: (jobId: string, error: BatchError) => void;

  constructor() {
    this.transformer = new DataTransformer();
  }

  /**
   * Create a new batch job
   */
  createJob(
    name: string,
    sourceConfig: DataSourceConfig,
    dataTypes: IngestionDataType[],
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      filters?: BatchFilters;
      schedule?: BatchSchedule;
    } = {}
  ): BatchJob {
    const job: BatchJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'queued',
      priority: options.priority || 'normal',
      sourceConfig,
      dataTypes,
      filters: options.filters,
      schedule: options.schedule,
      progress: {
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        currentStage: 'queued',
        percentComplete: 0,
        stages: [
          { name: 'fetch', status: 'pending', processed: 0, total: 0 },
          { name: 'transform', status: 'pending', processed: 0, total: 0 },
          { name: 'validate', status: 'pending', processed: 0, total: 0 },
          { name: 'store', status: 'pending', processed: 0, total: 0 },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
    this.queues.set(job.id, new IngestionQueue());

    return job;
  }

  /**
   * Start a batch job
   */
  async startJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (job.status !== 'queued') throw new Error(`Job ${jobId} is not queued`);

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.progress.currentStage = 'fetch';

    const queue = this.queues.get(jobId)!;
    const connector = createConnector(job.sourceConfig);

    try {
      await connector.connect();

      // Fetch data for all requested types
      const allRecords: RawDataRecord[] = [];
      for (const dataType of job.dataTypes) {
        const records = await connector.fetchData(dataType, job.filters as Record<string, unknown>);
        allRecords.push(...records);
      }

      await connector.disconnect();

      // Update progress
      job.progress.totalRecords = allRecords.length;
      job.progress.stages[0].total = allRecords.length;
      job.progress.stages[0].status = 'completed';
      job.progress.stages[0].processed = allRecords.length;
      job.progress.currentStage = 'transform';
      job.progress.stages[1].total = allRecords.length;
      job.progress.stages[1].status = 'running';

      this.emitProgress(jobId);

      // Process records through queue
      queue.start(async (item) => {
        await this.processRecord(item, job);
      });

      // Enqueue all records
      queue.enqueueBatch(
        allRecords.map(record => ({ data: record, priority: 0 })),
        jobId
      );

      // Wait for completion
      await this.waitForCompletion(jobId);

    } catch (error) {
      job.status = 'failed';
      job.errorMessage = (error as Error).message;
      this.emitError(jobId, {
        recordId: 'job',
        stage: 'fetch',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        retryable: true,
      });
    }
  }

  /**
   * Pause a batch job
   */
  pauseJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'paused';
      const queue = this.queues.get(jobId);
      queue?.stop();
    }
  }

  /**
   * Resume a batch job
   */
  resumeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'paused') {
      job.status = 'running';
      const queue = this.queues.get(jobId);
      queue?.start(async (item) => {
        await this.processRecord(item, job);
      });
    }
  }

  /**
   * Cancel a batch job
   */
  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && (job.status === 'running' || job.status === 'paused')) {
      job.status = 'cancelled';
      const queue = this.queues.get(jobId);
      queue?.stop();
      queue?.clear();
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): BatchJob | undefined {
    const job = this.jobs.get(jobId);
    if (job) {
      // Update progress with current queue stats
      const queue = this.queues.get(jobId);
      if (queue) {
        const stats = queue.getStats();
        job.progress.processedRecords = stats.completed;
        job.progress.failedRecords = stats.failed;
        job.progress.percentComplete = job.progress.totalRecords > 0
          ? (job.progress.processedRecords / job.progress.totalRecords) * 100
          : 0;
      }
    }
    return job;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: BatchJob['status']): BatchJob[] {
    return this.getAllJobs().filter(job => job.status === status);
  }

  /**
   * Delete a job
   */
  deleteJob(jobId: string): void {
    this.cancelJob(jobId);
    this.jobs.delete(jobId);
    this.queues.delete(jobId);
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (jobId: string, progress: BatchProgress) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Set completion callback
   */
  onComplete(callback: (jobId: string, results: BatchResults) => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (jobId: string, error: BatchError) => void): void {
    this.onErrorCallback = callback;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async processRecord(item: QueueItem, job: BatchJob): Promise<void> {
    const record = item.data as RawDataRecord;

    try {
      // Transform
      if (job.progress.currentStage === 'transform') {
        const normalized = this.transformer.transform(record);
        
        // Validate
        const validation = this.transformer.validate(normalized);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Resolve conflicts if any
        if (normalized.conflicts.length > 0) {
          this.transformer.resolveConflicts(normalized, 'timestamp');
        }

        item.data = { record, normalized };
      }

      // Update stage progress
      this.updateStageProgress(job, item.status === 'completed');

    } catch (error) {
      throw error;
    }
  }

  private updateStageProgress(job: BatchJob, success: boolean): void {
    const stage = job.progress.stages.find(s => s.name === job.progress.currentStage);
    if (stage) {
      stage.processed++;
      if (stage.processed >= stage.total) {
        stage.status = 'completed';
        this.advanceStage(job);
      }
    }

    if (success) {
      job.progress.processedRecords++;
    } else {
      job.progress.failedRecords++;
    }

    job.progress.percentComplete = job.progress.totalRecords > 0
      ? (job.progress.processedRecords / job.progress.totalRecords) * 100
      : 0;

    this.emitProgress(job.id);
  }

  private advanceStage(job: BatchJob): void {
    const stages = ['fetch', 'transform', 'validate', 'store'];
    const currentIndex = stages.indexOf(job.progress.currentStage);
    if (currentIndex < stages.length - 1) {
      job.progress.currentStage = stages[currentIndex + 1];
      job.progress.stages[currentIndex + 1].status = 'running';
      job.progress.stages[currentIndex + 1].total = job.progress.totalRecords;
    }
  }

  private async waitForCompletion(jobId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const queue = this.queues.get(jobId);
        const job = this.jobs.get(jobId);

        if (!queue || !job) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        const stats = queue.getStats();
        
        if (stats.pending === 0 && stats.processing === 0) {
          clearInterval(checkInterval);
          
          job.status = stats.failed > 0 ? 'completed' : 'completed';
          job.completedAt = new Date().toISOString();
          job.results = {
            recordsIngested: stats.completed,
            recordsUpdated: 0,
            recordsSkipped: 0,
            recordsFailed: stats.failed,
            conflictsResolved: 0,
            errors: [],
          };

          this.emitComplete(jobId, job.results);
          resolve();
        }
      }, 500);
    });
  }

  private emitProgress(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && this.onProgressCallback) {
      this.onProgressCallback(jobId, job.progress);
    }
  }

  private emitComplete(jobId: string, results: BatchResults): void {
    if (this.onCompleteCallback) {
      this.onCompleteCallback(jobId, results);
    }
  }

  private emitError(jobId: string, error: BatchError): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(jobId, error);
    }
  }
}

// =============================================================================
// Progress Tracker
// =============================================================================

export class ProgressTracker {
  private progress: BatchProgress;
  private startTime: number;
  private callbacks: Set<(progress: BatchProgress) => void> = new Set();

  constructor(totalRecords: number) {
    this.startTime = Date.now();
    this.progress = {
      totalRecords,
      processedRecords: 0,
      failedRecords: 0,
      skippedRecords: 0,
      currentStage: 'pending',
      percentComplete: 0,
      estimatedTimeRemaining: undefined,
      stages: [],
    };
  }

  /**
   * Update progress
   */
  update(processed: number, failed = 0, skipped = 0): void {
    this.progress.processedRecords = processed;
    this.progress.failedRecords = failed;
    this.progress.skippedRecords = skipped;

    if (this.progress.totalRecords > 0) {
      this.progress.percentComplete = (processed / this.progress.totalRecords) * 100;
    }

    // Calculate estimated time remaining
    if (processed > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = processed / elapsed;
      const remaining = this.progress.totalRecords - processed;
      this.progress.estimatedTimeRemaining = Math.ceil(remaining / rate);
    }

    this.notify();
  }

  /**
   * Set current stage
   */
  setStage(stage: string): void {
    this.progress.currentStage = stage;
    this.notify();
  }

  /**
   * Add stage progress
   */
  addStage(stage: StageProgress): void {
    this.progress.stages.push(stage);
    this.notify();
  }

  /**
   * Update stage
   */
  updateStage(stageName: string, processed: number): void {
    const stage = this.progress.stages.find(s => s.name === stageName);
    if (stage) {
      stage.processed = processed;
      this.notify();
    }
  }

  /**
   * Get current progress
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }

  /**
   * Subscribe to progress updates
   */
  onUpdate(callback: (progress: BatchProgress) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notify(): void {
    this.callbacks.forEach(cb => cb(this.getProgress()));
  }
}

// =============================================================================
// Error Handler
// =============================================================================

export class BatchErrorHandler {
  private errors: BatchError[] = [];
  private retryableErrors: Set<string> = new Set([
    'NETWORK_ERROR',
    'TIMEOUT',
    'RATE_LIMIT',
    'SERVICE_UNAVAILABLE',
  ]);

  /**
   * Handle error
   */
  handleError(
    recordId: string,
    stage: string,
    error: Error,
    retryCount = 0
  ): { retryable: boolean; delay: number } {
    const isRetryable = this.isRetryable(error);
    const delay = this.calculateBackoff(retryCount);

    this.errors.push({
      recordId,
      stage,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryable: isRetryable,
    });

    return { retryable: isRetryable, delay };
  }

  /**
   * Get all errors
   */
  getErrors(): BatchError[] {
    return [...this.errors];
  }

  /**
   * Get errors by stage
   */
  getErrorsByStage(stage: string): BatchError[] {
    return this.errors.filter(e => e.stage === stage);
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get error summary
   */
  getSummary(): { total: number; retryable: number; fatal: number } {
    return {
      total: this.errors.length,
      retryable: this.errors.filter(e => e.retryable).length,
      fatal: this.errors.filter(e => !e.retryable).length,
    };
  }

  private isRetryable(error: Error): boolean {
    const errorCode = (error as { code?: string }).code;
    if (errorCode && this.retryableErrors.has(errorCode)) {
      return true;
    }
    return error.message.includes('timeout') || 
           error.message.includes('rate limit') ||
           error.message.includes('network');
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, maxDelay);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

export function createBatchJobManager(): BatchJobManager {
  return new BatchJobManager();
}

export function createQueue(config?: Partial<QueueConfig>): IngestionQueue {
  return new IngestionQueue(config);
}

export function createProgressTracker(totalRecords: number): ProgressTracker {
  return new ProgressTracker(totalRecords);
}

export function createErrorHandler(): BatchErrorHandler {
  return new BatchErrorHandler();
}

// Default export
export default BatchJobManager;
