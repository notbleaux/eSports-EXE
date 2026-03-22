/** [Ver003.000] - Dynamic TensorFlow.js loading for bundle optimization
 * ML Worker for 4NJZ4 TENET Platform
 * Handles TensorFlow.js model loading and inference with progress tracking
 * 
 * NOTE: TensorFlow.js is loaded dynamically to prevent inclusion in main bundle
 */

/// <reference lib="webworker" />

import type { 
  MLWorkerCommand, 
  MLWorkerResponse, 
  MLPredictionProgress,
  MLBatchResult 
} from '../types/worker'

// TensorFlow types - module loaded dynamically
let tf: typeof import('@tensorflow/tfjs') | null = null
let model: import('@tensorflow/tfjs').LayersModel | null = null
let modelName = ''
let isLoading = false
let isPredicting = false
let totalPredictions = 0
let inferenceTimes: number[] = []
let warmModels: string[] = []
const MAX_INFERENCE_HISTORY = 100
const MAX_QUEUE_SIZE = 100

// Pending requests queue
const pendingQueue: Array<{
  requestId: string
  resolve: () => void
  reject: (error: Error) => void
}> = []

/**
 * Dynamically load TensorFlow.js
 * This ensures TF.js is not included in the main bundle
 */
async function loadTensorFlow(): Promise<typeof import('@tensorflow/tfjs')> {
  if (tf) {
    return tf
  }

  try {
    // Dynamic import - key for bundle optimization
    const tfModule = await import('@tensorflow/tfjs')
    tf = tfModule
    
    // Set backend to WebGL for best performance
    await tf.setBackend('webgl')
    await tf.ready()
    
    return tf
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load TensorFlow.js'
    console.error('[ML Worker] Failed to load TensorFlow.js:', errorMessage)
    throw new Error(`TensorFlow.js load failed: ${errorMessage}`)
  }
}

/**
 * Send response to main thread
 */
function sendResponse(response: MLWorkerResponse): void {
  self.postMessage(response)
}

/**
 * Send progress update
 */
function sendProgress(
  requestId: string, 
  current: number, 
  total: number, 
  stage: MLPredictionProgress['stage']
): void {
  const progress: MLPredictionProgress = {
    requestId,
    current,
    total,
    stage,
    percentComplete: Math.round((current / total) * 100)
  }
  
  sendResponse({
    type: 'PROGRESS',
    requestId,
    current,
    total,
    stage
  } as MLWorkerResponse)
}

/**
 * Update and send queue metrics
 */
function updateQueueMetrics(): void {
  sendResponse({
    type: 'QUEUE_METRICS',
    depth: pendingQueue.length
  } as MLWorkerResponse)
  
  // Check for backpressure
  if (pendingQueue.length > MAX_QUEUE_SIZE * 0.8) {
    sendResponse({
      type: 'BACKPRESSURE',
      queueDepth: pendingQueue.length,
      maxQueueSize: MAX_QUEUE_SIZE
    } as MLWorkerResponse)
  }
}

/**
 * Calculate average inference time
 */
function getAverageInferenceTime(): number {
  if (inferenceTimes.length === 0) return 0
  const sum = inferenceTimes.reduce((a, b) => a + b, 0)
  return sum / inferenceTimes.length
}

/**
 * Load TensorFlow.js model
 */
async function loadModel(
  url: string, 
  name: string, 
  quantization?: 8 | 16 | 32
): Promise<void> {
  if (isLoading) {
    throw new Error('Model already loading')
  }
  
  if (!tf) {
    await loadTensorFlow()
  }
  
  isLoading = true
  
  try {
    // Try loading from IndexedDB cache first
    try {
      model = await tf!.loadLayersModel(`indexeddb://${name}`)
      console.log('[ML Worker] Model loaded from cache:', name)
    } catch {
      // Load from network
      model = await tf!.loadLayersModel(url)
      
      // Cache to IndexedDB
      try {
        await model.save(`indexeddb://${name}`)
        console.log('[ML Worker] Model cached:', name)
      } catch (cacheErr) {
        console.warn('[ML Worker] Failed to cache model:', cacheErr)
      }
    }
    
    modelName = name
    
    sendResponse({
      type: 'MODEL_LOADED',
      modelName: name,
      backend: tf!.getBackend()
    } as MLWorkerResponse)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    sendResponse({
      type: 'MODEL_LOAD_ERROR',
      error: errorMessage
    } as MLWorkerResponse)
    throw error
  } finally {
    isLoading = false
  }
}

/**
 * Run single prediction
 */
async function predict(input: number[], requestId: string): Promise<number[]> {
  if (!model || !tf) {
    throw new Error('Model not loaded')
  }
  
  if (isPredicting) {
    // Queue the request
    return new Promise((resolve, reject) => {
      if (pendingQueue.length >= MAX_QUEUE_SIZE) {
        sendResponse({
          type: 'QUEUE_OVERFLOW',
          dropped: 1
        } as MLWorkerResponse)
        reject(new Error('Queue overflow'))
        return
      }
      
      pendingQueue.push({
        requestId,
        resolve: () => predict(input, requestId).then(resolve).catch(reject),
        reject
      })
      updateQueueMetrics()
    })
  }
  
  isPredicting = true
  const startTime = performance.now()
  
  try {
    sendProgress(requestId, 0, 3, 'preprocessing')
    
    // Create input tensor
    const inputTensor = tf.tensor2d([input])
    
    sendProgress(requestId, 1, 3, 'inference')
    
    // Run prediction
    const outputTensor = model.predict(inputTensor) as import('@tensorflow/tfjs').Tensor
    const result = Array.from(outputTensor.dataSync())
    
    sendProgress(requestId, 2, 3, 'postprocessing')
    
    // Cleanup tensors
    inputTensor.dispose()
    outputTensor.dispose()
    
    // Track metrics
    const latency = performance.now() - startTime
    totalPredictions++
    inferenceTimes.push(latency)
    if (inferenceTimes.length > MAX_INFERENCE_HISTORY) {
      inferenceTimes.shift()
    }
    
    sendProgress(requestId, 3, 3, 'postprocessing')
    
    // Send result
    sendResponse({
      type: 'PREDICTION_RESULT',
      requestId,
      result
    } as MLWorkerResponse)
    
    return result
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Prediction failed'
    sendResponse({
      type: 'PREDICTION_ERROR',
      requestId,
      error: errorMessage
    } as MLWorkerResponse)
    throw error
  } finally {
    isPredicting = false
    
    // Process next queued request
    const next = pendingQueue.shift()
    if (next) {
      updateQueueMetrics()
      next.resolve()
    }
  }
}

/**
 * Run batch prediction with progress tracking
 */
async function predictBatch(
  inputs: number[][], 
  requestId: string
): Promise<MLBatchResult> {
  if (!model || !tf) {
    throw new Error('Model not loaded')
  }
  
  const totalInputs = inputs.length
  const results: number[][] = []
  const batchStartTime = performance.now()
  
  // Process in chunks to allow progress updates
  const CHUNK_SIZE = 10
  
  for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
    const chunk = inputs.slice(i, i + CHUNK_SIZE)
    
    sendProgress(requestId, i, totalInputs, 'inference')
    
    try {
      // Create batch tensor
      const inputTensor = tf.tensor2d(chunk)
      
      // Run batch prediction
      const outputTensor = model.predict(inputTensor) as import('@tensorflow/tfjs').Tensor
      const flatResults = Array.from(outputTensor.dataSync())
      
      // Reshape results
      const outputSize = flatResults.length / chunk.length
      for (let j = 0; j < chunk.length; j++) {
        results.push(flatResults.slice(j * outputSize, (j + 1) * outputSize))
      }
      
      // Cleanup tensors
      inputTensor.dispose()
      outputTensor.dispose()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch prediction failed'
      sendResponse({
        type: 'PREDICTION_ERROR',
        requestId,
        error: errorMessage
      } as MLWorkerResponse)
      throw error
    }
  }
  
  const totalTime = performance.now() - batchStartTime
  
  // Track metrics
  totalPredictions += inputs.length
  inferenceTimes.push(totalTime / inputs.length)
  if (inferenceTimes.length > MAX_INFERENCE_HISTORY) {
    inferenceTimes.shift()
  }
  
  sendProgress(requestId, totalInputs, totalInputs, 'postprocessing')
  
  const batchResult: MLBatchResult = {
    results,
    totalTime,
    throughput: inputs.length / (totalTime / 1000)
  }
  
  sendResponse({
    type: 'BATCH_PREDICTION_RESULT',
    requestId,
    results,
    totalTime
  } as MLWorkerResponse)
  
  return batchResult
}

/**
 * Warm up model with dummy data
 */
async function warmUp(modelType: string, inputShape: number[]): Promise<void> {
  if (!model || !tf) {
    throw new Error('Model not loaded')
  }
  
  // Run a few dummy predictions
  for (let i = 0; i < 3; i++) {
    const dummyInput = new Array(inputShape[0] || 10).fill(0.5)
    const inputTensor = tf.tensor2d([dummyInput])
    const outputTensor = model.predict(inputTensor) as import('@tensorflow/tfjs').Tensor
    
    // Cleanup
    inputTensor.dispose()
    outputTensor.dispose()
  }
  
  warmModels.push(modelType)
  
  sendResponse({
    type: 'WARMUP_COMPLETE'
  } as MLWorkerResponse)
}

/**
 * Initialize TensorFlow.js
 */
async function initialize(): Promise<void> {
  if (!tf) {
    await loadTensorFlow()
  }
  
  sendResponse({
    type: 'INIT_COMPLETE',
    backend: tf!.getBackend()
  } as MLWorkerResponse)
}

/**
 * Get worker statistics
 */
function getStats(): void {
  sendResponse({
    type: 'STATS_RESULT',
    backend: tf?.getBackend() || 'none',
    totalPredictions,
    averageInferenceTime: getAverageInferenceTime(),
    warmModels: [...warmModels],
    cachedModels: model ? [modelName] : []
  } as MLWorkerResponse)
}

/**
 * Dispose model and cleanup
 */
function dispose(): void {
  if (model) {
    model.dispose()
    model = null
  }
  modelName = ''
  warmModels = []
  pendingQueue.length = 0
  
  // Note: We don't dispose tf here as it might be reused
  
  sendResponse({
    type: 'DISPOSED'
  } as MLWorkerResponse)
}

/**
 * Fully reset worker - dispose TF as well
 */
function reset(): void {
  dispose()
  tf = null
  
  sendResponse({
    type: 'RESET_COMPLETE'
  } as MLWorkerResponse)
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<MLWorkerCommand>) => {
  const data = event.data
  
  try {
    switch (data.type) {
      case 'LOAD_MODEL':
        await loadModel(data.url, data.modelName, data.quantization)
        break
        
      case 'PREDICT':
        await predict(data.input, data.requestId)
        break
        
      case 'PREDICT_BATCH':
        await predictBatch(data.inputs, data.requestId)
        break
        
      case 'WARMUP':
        await warmUp(data.modelType, data.inputShape)
        break
        
      case 'INIT':
        await initialize()
        break
        
      case 'STATS':
        getStats()
        break
        
      case 'DISPOSE':
        dispose()
        break
        
      case 'RESET':
        reset()
        break
        
      default:
        throw new Error(`Unknown command type: ${(data as { type: string }).type}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Worker error'
    sendResponse({
      type: 'ERROR',
      error: errorMessage
    } as MLWorkerResponse)
  }
}

// Notify main thread that worker is ready (but TF not loaded yet)
sendResponse({
  type: 'INIT_COMPLETE',
  backend: 'pending'
} as MLWorkerResponse)

export type { MLWorkerCommand, MLWorkerResponse }
