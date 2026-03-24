/**
 * ML Training Worker
 * 
 * [Ver001.000]
 * 
 * Web Worker for non-blocking model training:
 * - Training in background thread
 * - Progress callbacks
 * - Model serialization
 * - Memory management
 * 
 * Agent: TL-S3-3-B
 * Team: ML Models (TL-S3)
 */

import * as tf from '@tensorflow/tfjs'
import { RoundPredictor, RoundPredictorConfig } from './roundPredictor'
import { PlayerPerformanceModel, PlayerPerformanceConfig } from './playerPerformance'
import { StrategyModel, StrategyConfig } from './strategy'
import type { TrainingSample } from '../pipeline/dataStore'

// ============================================================================
// Worker Types
// ============================================================================

type TrainingTaskType = 'trainRoundPredictor' | 'trainPlayerPerformance' | 'trainStrategy'

interface TrainingTask {
  id: string
  type: TrainingTaskType
  samples: TrainingSample[]
  config?: Partial<RoundPredictorConfig | PlayerPerformanceConfig | StrategyConfig>
  options?: {
    earlyStopping?: boolean
    checkpointInterval?: number
  }
}

interface TrainingProgress {
  epoch: number
  totalEpochs: number
  loss: number
  valLoss?: number
  metrics: Record<string, number>
  elapsedTime: number
  estimatedTimeRemaining: number
}

interface TrainingResult {
  success: boolean
  taskId: string
  metrics: Record<string, number>
  weights?: ArrayBuffer
  error?: string
}

interface WorkerMessage {
  id: string
  action: 'train' | 'cancel' | 'pause' | 'resume' | 'getStatus'
  payload?: TrainingTask
}

interface WorkerResponse {
  id: string
  type: 'progress' | 'complete' | 'error' | 'status'
  data?: TrainingProgress | TrainingResult | WorkerStatus
  error?: string
}

interface WorkerStatus {
  isTraining: boolean
  currentTask?: string
  completedTasks: number
  failedTasks: number
  memoryUsage: {
    used: number
    total: number
  }
}

// ============================================================================
// Worker State
// ============================================================================

let isTraining = false
let currentTask: TrainingTask | null = null
let currentModel: RoundPredictor | PlayerPerformanceModel | StrategyModel | null = null
let abortController: AbortController | null = null
let completedTasks = 0
let failedTasks = 0

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, action, payload } = event.data

  try {
    switch (action) {
      case 'train':
        if (!payload) {
          throw new Error('Training task payload required')
        }
        await handleTrainingTask(id, payload)
        break

      case 'cancel':
        handleCancel()
        break

      case 'pause':
        // Pause not implemented in this version
        sendResponse(id, 'error', undefined, 'Pause not supported')
        break

      case 'resume':
        sendResponse(id, 'error', undefined, 'Resume not supported')
        break

      case 'getStatus':
        sendResponse(id, 'status', getWorkerStatus())
        break

      default:
        sendResponse(id, 'error', undefined, `Unknown action: ${action}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    sendResponse(id, 'error', undefined, message)
  }
}

// ============================================================================
// Training Handlers
// ============================================================================

async function handleTrainingTask(taskId: string, task: TrainingTask): Promise<void> {
  if (isTraining) {
    throw new Error('Already training a model')
  }

  isTraining = true
  currentTask = task
  abortController = new AbortController()

  const startTime = performance.now()

  try {
    let result: TrainingResult

    switch (task.type) {
      case 'trainRoundPredictor':
        result = await trainRoundPredictor(taskId, task, startTime)
        break

      case 'trainPlayerPerformance':
        result = await trainPlayerPerformance(taskId, task, startTime)
        break

      case 'trainStrategy':
        result = await trainStrategy(taskId, task, startTime)
        break

      default:
        throw new Error(`Unknown training task type: ${task.type}`)
    }

    completedTasks++
    sendResponse(taskId, 'complete', result)

  } catch (error) {
    failedTasks++
    const message = error instanceof Error ? error.message : 'Training failed'
    sendResponse(taskId, 'error', undefined, message)
  } finally {
    isTraining = false
    currentTask = null
    currentModel = null
    abortController = null

    // Clean up TensorFlow memory
    tf.engine().startScope()
    tf.engine().endScope()
  }
}

// ============================================================================
// Model Training Functions
// ============================================================================

async function trainRoundPredictor(
  taskId: string,
  task: TrainingTask,
  startTime: number
): Promise<TrainingResult> {
  const config = task.config as Partial<RoundPredictorConfig> | undefined
  const model = new RoundPredictor(config)
  currentModel = model

  // Build model
  model.buildModel()

  // Train with progress callback
  const totalEpochs = config?.epochs || 100
  
  const metrics = await model.train(task.samples, (epoch, logs) => {
    // Check for cancellation
    if (abortController?.signal.aborted) {
      throw new Error('Training cancelled')
    }

    const elapsedTime = performance.now() - startTime
    const progressPerEpoch = elapsedTime / (epoch + 1)
    const estimatedTimeRemaining = progressPerEpoch * (totalEpochs - epoch - 1)

    const progress: TrainingProgress = {
      epoch,
      totalEpochs,
      loss: logs.loss as number,
      valLoss: logs.val_loss as number | undefined,
      metrics: {
        accuracy: logs.acc as number,
        valAccuracy: logs.val_acc as number
      },
      elapsedTime,
      estimatedTimeRemaining
    }

    sendResponse(taskId, 'progress', progress)
  })

  // Extract weights
  const weights = await extractModelWeights(model as unknown as { model: tf.LayersModel })

  return {
    success: true,
    taskId,
    metrics: {
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      auc: metrics.auc
    },
    weights
  }
}

async function trainPlayerPerformance(
  taskId: string,
  task: TrainingTask,
  startTime: number
): Promise<TrainingResult> {
  const config = task.config as Partial<PlayerPerformanceConfig> | undefined
  const model = new PlayerPerformanceModel(config)
  currentModel = model

  // Build model
  model.buildModel()

  // Train with progress callback
  const totalEpochs = config?.epochs || 80

  const metrics = await model.train(task.samples, (epoch, logs) => {
    if (abortController?.signal.aborted) {
      throw new Error('Training cancelled')
    }

    const elapsedTime = performance.now() - startTime
    const progressPerEpoch = elapsedTime / (epoch + 1)
    const estimatedTimeRemaining = progressPerEpoch * (totalEpochs - epoch - 1)

    const progress: TrainingProgress = {
      epoch,
      totalEpochs,
      loss: logs.loss as number,
      valLoss: logs.val_loss as number | undefined,
      metrics: {
        mae: (logs as Record<string, number>)['overall_rating_mae'] || 0,
        valMae: (logs as Record<string, number>)['val_overall_rating_mae'] || 0
      },
      elapsedTime,
      estimatedTimeRemaining
    }

    sendResponse(taskId, 'progress', progress)
  })

  // Extract weights
  const weights = await extractModelWeights(model as unknown as { model: tf.LayersModel })

  return {
    success: true,
    taskId,
    metrics: {
      mae: metrics.mae,
      rmse: metrics.rmse,
      r2: metrics.r2
    },
    weights
  }
}

async function trainStrategy(
  taskId: string,
  task: TrainingTask,
  startTime: number
): Promise<TrainingResult> {
  const config = task.config as Partial<StrategyConfig> | undefined
  const model = new StrategyModel(config)
  currentModel = model

  // Build model
  model.buildModel()

  // Train with progress callback
  const totalEpochs = config?.epochs || 100

  const metrics = await model.train(task.samples, (epoch, logs) => {
    if (abortController?.signal.aborted) {
      throw new Error('Training cancelled')
    }

    const elapsedTime = performance.now() - startTime
    const progressPerEpoch = elapsedTime / (epoch + 1)
    const estimatedTimeRemaining = progressPerEpoch * (totalEpochs - epoch - 1)

    const progress: TrainingProgress = {
      epoch,
      totalEpochs,
      loss: logs.loss as number,
      valLoss: logs.val_loss as number | undefined,
      metrics: {
        accuracy: logs.acc as number,
        top3Accuracy: (logs as Record<string, number>).topKCategoricalAccuracy || 0,
        valAccuracy: logs.val_acc as number
      },
      elapsedTime,
      estimatedTimeRemaining
    }

    sendResponse(taskId, 'progress', progress)
  })

  // Extract weights
  const weights = await extractModelWeights(model as unknown as { model: tf.LayersModel })

  return {
    success: true,
    taskId,
    metrics: {
      top1Accuracy: metrics.top1Accuracy,
      top3Accuracy: metrics.top3Accuracy,
      meanReciprocalRank: metrics.meanReciprocalRank
    },
    weights
  }
}

// ============================================================================
// Model Weight Extraction
// ============================================================================

async function extractModelWeights(
  modelWrapper: { model: tf.LayersModel }
): Promise<ArrayBuffer> {
  const model = modelWrapper.model
  const weightTensors = model.getWeights()
  
  // Get weight data
  const weightData = await Promise.all(weightTensors.map(async (w) => {
    const data = await w.data()
    return {
      shape: w.shape,
      data: Array.from(data as Float32Array)
    }
  }))

  // Serialize to ArrayBuffer
  const json = JSON.stringify(weightData)
  const encoder = new TextEncoder()
  return encoder.encode(json).buffer
}

// ============================================================================
// Cancellation
// ============================================================================

function handleCancel(): void {
  if (abortController) {
    abortController.abort()
  }
}

// ============================================================================
// Status
// ============================================================================

function getWorkerStatus(): WorkerStatus {
  // Get TensorFlow memory info
  const memoryInfo = tf.memory()

  return {
    isTraining,
    currentTask: currentTask?.id,
    completedTasks,
    failedTasks,
    memoryUsage: {
      used: memoryInfo.numBytes,
      total: memoryInfo.numBytesInGPU || memoryInfo.numBytes
    }
  }
}

// ============================================================================
// Response Helper
// ============================================================================

function sendResponse(
  id: string,
  type: WorkerResponse['type'],
  data?: TrainingProgress | TrainingResult | WorkerStatus,
  error?: string
): void {
  const response: WorkerResponse = {
    id,
    type,
    data,
    error
  }

  self.postMessage(response)
}

// ============================================================================
// Memory Management
// ============================================================================

// Clean up memory periodically
setInterval(() => {
  if (!isTraining) {
    tf.engine().startScope()
    tf.engine().endScope()
  }
}, 30000) // Every 30 seconds

// ============================================================================
// Worker Setup
// ============================================================================

// Signal that worker is ready
self.postMessage({ type: 'ready' })
