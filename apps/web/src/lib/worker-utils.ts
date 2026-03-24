/** [Ver001.000]
 * Worker Utilities for 4NJZ4 TENET Platform
 * Worker pool management, message serialization, and cleanup utilities
 */

import type {
  WorkerType,
  WorkerMessage,
  WorkerResponse,
  WorkerPoolConfig,
  WorkerTask,
  WorkerInstance,
  WorkerStatus
} from '../types/worker'

// Default pool configuration
const DEFAULT_POOL_CONFIG: WorkerPoolConfig = {
  maxWorkers: navigator.hardwareConcurrency || 4,
  idleTimeoutMs: 30000,
  taskTimeoutMs: 30000
}

/**
 * Worker Pool Manager
 * Manages a pool of workers for efficient task distribution
 */
export class WorkerPool {
  private workers: Map<string, WorkerInstance> = new Map()
  private taskQueue: WorkerTask<unknown, unknown>[] = []
  private activeTasks: Map<string, WorkerTask<unknown, unknown>> = new Map()
  private config: WorkerPoolConfig
  private workerType: WorkerType
  private workerFactory: () => Worker
  private idleTimer: ReturnType<typeof setInterval> | null = null
  private isDisposed = false

  constructor(
    workerType: WorkerType,
    workerFactory: () => Worker,
    config: Partial<WorkerPoolConfig> = {}
  ) {
    this.workerType = workerType
    this.workerFactory = workerFactory
    this.config = { ...DEFAULT_POOL_CONFIG, ...config }
    this.startIdleCleanup()
  }

  /**
   * Execute a task on an available worker
   */
  async execute<T, R>(action: string, payload: T): Promise<R> {
    if (this.isDisposed) {
      throw new Error('WorkerPool has been disposed')
    }

    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: generateTaskId(),
        type: this.workerType,
        action,
        payload,
        resolve: resolve as (value: unknown) => void,
        reject: reject as (error: Error) => void,
        timestamp: Date.now()
      }

      this.taskQueue.push(task as WorkerTask<unknown, unknown>)
      this.processQueue()
    })
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number
    idleWorkers: number
    busyWorkers: number
    queuedTasks: number
    activeTasks: number
  } {
    let idle = 0
    let busy = 0

    for (const worker of this.workers.values()) {
      if (worker.busy) {
        busy++
      } else {
        idle++
      }
    }

    return {
      totalWorkers: this.workers.size,
      idleWorkers: idle,
      busyWorkers: busy,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size
    }
  }

  /**
   * Get worker statuses
   */
  getWorkerStatuses(): WorkerStatus[] {
    return Array.from(this.workers.entries()).map(([id, worker]) => ({
      type: worker.type,
      id,
      state: worker.busy ? 'busy' : 'idle',
      currentTask: this.activeTasks.get(id)?.action,
      taskCount: worker.taskCount,
      errorCount: 0,
      lastActivity: worker.lastUsed
    }))
  }

  /**
   * Terminate all workers and cleanup
   */
  dispose(): void {
    this.isDisposed = true

    if (this.idleTimer) {
      clearInterval(this.idleTimer)
      this.idleTimer = null
    }

    // Reject pending tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('WorkerPool disposed'))
    }
    this.taskQueue = []

    // Terminate workers
    for (const [id, instance] of this.workers) {
      instance.worker.terminate()
      this.workers.delete(id)
    }

    // Clear active tasks
    for (const [id, task] of this.activeTasks) {
      task.reject(new Error('WorkerPool disposed'))
    }
    this.activeTasks.clear()
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return

    // Find an available worker
    let availableWorker: WorkerInstance | null = null
    for (const worker of this.workers.values()) {
      if (!worker.busy) {
        availableWorker = worker
        break
      }
    }

    // Create a new worker if under limit
    if (!availableWorker && this.workers.size < this.config.maxWorkers) {
      availableWorker = this.createWorker()
    }

    // If no worker available, tasks remain queued
    if (!availableWorker) return

    // Get next task
    const task = this.taskQueue.shift()
    if (!task) return

    // Execute task
    this.executeTask(availableWorker, task)
  }

  /**
   * Create a new worker instance
   */
  private createWorker(): WorkerInstance {
    const worker = this.workerFactory()
    const id = generateWorkerId()

    const instance: WorkerInstance = {
      worker,
      type: this.workerType,
      busy: false,
      lastUsed: Date.now(),
      taskCount: 0
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse<unknown>>) => {
      this.handleWorkerMessage(id, event.data)
    }

    worker.onerror = (error) => {
      this.handleWorkerError(id, error)
    }

    this.workers.set(id, instance)
    return instance
  }

  /**
   * Execute a task on a worker
   */
  private executeTask(
    instance: WorkerInstance,
    task: WorkerTask<unknown, unknown>
  ): void {
    instance.busy = true
    instance.lastUsed = Date.now()
    instance.taskCount++

    this.activeTasks.set(instance.worker as unknown as string, task)

    const message: WorkerMessage<unknown> = {
      id: task.id,
      type: task.type,
      action: task.action,
      payload: task.payload
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(instance, task)
    }, this.config.taskTimeoutMs)

    // Store timeout with task for cleanup
    ;(task as unknown as { timeoutId: ReturnType<typeof setTimeout> }).timeoutId = timeoutId

    instance.worker.postMessage(message)
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(workerId: string, response: WorkerResponse<unknown>): void {
    const instance = this.workers.get(workerId)
    if (!instance) return

    const task = this.activeTasks.get(workerId)
    if (!task) return

    // Clear timeout
    const timeoutId = (task as unknown as { timeoutId?: ReturnType<typeof setTimeout> }).timeoutId
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Clean up
    instance.busy = false
    instance.lastUsed = Date.now()
    this.activeTasks.delete(workerId)

    // Resolve or reject
    if (response.success) {
      task.resolve(response.data as unknown)
    } else {
      task.reject(new Error(response.error || 'Worker task failed'))
    }

    // Process next task
    this.processQueue()
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    const instance = this.workers.get(workerId)
    if (!instance) return

    const task = this.activeTasks.get(workerId)
    if (task) {
      // Clear timeout
      const timeoutId = (task as unknown as { timeoutId?: ReturnType<typeof setTimeout> }).timeoutId
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      task.reject(new Error(error.message || 'Worker error'))
      this.activeTasks.delete(workerId)
    }

    // Terminate and remove the failed worker
    instance.worker.terminate()
    this.workers.delete(workerId)

    // Process queue with remaining workers
    this.processQueue()
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(
    instance: WorkerInstance,
    task: WorkerTask<unknown, unknown>
  ): void {
    task.reject(new Error(`Task timeout after ${this.config.taskTimeoutMs}ms`))
    this.activeTasks.delete(instance.worker as unknown as string)

    // Terminate the slow worker
    instance.worker.terminate()
    this.workers.delete(instance.worker as unknown as string)

    // Process queue
    this.processQueue()
  }

  /**
   * Start idle worker cleanup timer
   */
  private startIdleCleanup(): void {
    this.idleTimer = setInterval(() => {
      const now = Date.now()
      const toRemove: string[] = []

      for (const [id, instance] of this.workers) {
        if (!instance.busy && now - instance.lastUsed > this.config.idleTimeoutMs) {
          toRemove.push(id)
        }
      }

      for (const id of toRemove) {
        const instance = this.workers.get(id)
        if (instance) {
          instance.worker.terminate()
          this.workers.delete(id)
        }
      }
    }, 10000) // Check every 10 seconds
  }
}

/**
 * Generate unique task ID
 */
function generateTaskId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate unique worker ID
 */
function generateWorkerId(): string {
  return `worker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Serialize message payload for structured clone algorithm
 */
export function serializePayload<T>(payload: T): T {
  // Handle special cases
  if (payload instanceof OffscreenCanvas) {
    return payload // OffscreenCanvas is transferable
  }

  if (payload instanceof ArrayBuffer) {
    return payload // ArrayBuffer can be transferred
  }

  if (Array.isArray(payload)) {
    return payload.map(item => serializePayload(item)) as unknown as T
  }

  if (payload && typeof payload === 'object') {
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(payload)) {
      serialized[key] = serializePayload(value)
    }
    return serialized as T
  }

  return payload
}

/**
 * Create transferable objects list for postMessage
 */
export function getTransferables(payload: unknown): Transferable[] {
  const transferables: Transferable[] = []

  if (payload instanceof OffscreenCanvas) {
    transferables.push(payload)
  }

  if (payload instanceof ArrayBuffer) {
    transferables.push(payload)
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      transferables.push(...getTransferables(item))
    }
  }

  if (payload && typeof payload === 'object') {
    for (const value of Object.values(payload)) {
      transferables.push(...getTransferables(value))
    }
  }

  return transferables
}

/**
 * Error handler for worker operations
 */
export function handleWorkerError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message))
  }

  return new Error('Unknown worker error')
}

/**
 * Cleanup utility for worker resources
 */
export function cleanupWorker(worker: Worker): void {
  // Remove event listeners
  worker.onmessage = null
  worker.onerror = null
  worker.onmessageerror = null

  // Terminate the worker
  worker.terminate()
}

/**
 * Create a singleton worker pool for a given worker type
 */
const workerPools = new Map<WorkerType, WorkerPool>()

export function getWorkerPool(
  workerType: WorkerType,
  workerFactory: () => Worker,
  config?: Partial<WorkerPoolConfig>
): WorkerPool {
  if (!workerPools.has(workerType)) {
    workerPools.set(workerType, new WorkerPool(workerType, workerFactory, config))
  }
  return workerPools.get(workerType)!
}

/**
 * Dispose all worker pools
 */
export function disposeAllWorkerPools(): void {
  for (const pool of workerPools.values()) {
    pool.dispose()
  }
  workerPools.clear()
}

/**
 * Check if worker is supported in current environment
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Check if OffscreenCanvas is supported
 */
export function isOffscreenCanvasSupported(): boolean {
  return typeof OffscreenCanvas !== 'undefined'
}

/**
 * Performance monitoring for worker operations
 */
export class WorkerPerformanceMonitor {
  private metrics: Map<string, {
    count: number
    totalTime: number
    avgTime: number
    maxTime: number
    minTime: number
  }> = new Map()

  record(operation: string, duration: number): void {
    const current = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity
    }

    current.count++
    current.totalTime += duration
    current.avgTime = current.totalTime / current.count
    current.maxTime = Math.max(current.maxTime, duration)
    current.minTime = Math.min(current.minTime, duration)

    this.metrics.set(operation, current)
  }

  getMetrics(): Record<string, {
    count: number
    avgTime: number
    maxTime: number
    minTime: number
  }> {
    const result: Record<string, {
      count: number
      avgTime: number
      maxTime: number
      minTime: number
    }> = {}

    for (const [op, data] of this.metrics) {
      result[op] = {
        count: data.count,
        avgTime: Math.round(data.avgTime * 100) / 100,
        maxTime: Math.round(data.maxTime * 100) / 100,
        minTime: Math.round(data.minTime * 100) / 100
      }
    }

    return result
  }

  reset(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const workerPerformance = new WorkerPerformanceMonitor()
