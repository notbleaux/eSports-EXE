/**
 * ML Worker - TensorFlow.js Inference Thread
 * Handles model loading and predictions in dedicated worker
 * 
 * [Ver001.000]
 */

// ============================================================================
// MESSAGE PROTOCOL TYPES
// ============================================================================

export type MLWorkerCommand =
  | { type: 'LOAD_MODEL'; url: string; modelName: string }
  | { type: 'PREDICT'; input: number[]; requestId: string }
  | { type: 'DISPOSE' }

export type MLWorkerResponse =
  | { type: 'MODEL_LOADED'; modelName: string }
  | { type: 'MODEL_LOAD_ERROR'; error: string }
  | { type: 'PREDICTION_RESULT'; result: number[]; requestId: string }
  | { type: 'PREDICTION_ERROR'; error: string; requestId: string }
  | { type: 'DISPOSED' }
  | { type: 'READY'; timestamp: number }

// ============================================================================
// WORKER STATE
// ============================================================================

interface WorkerState {
  tf: typeof import('@tensorflow/tfjs') | null
  model: unknown | null
  modelName: string | null
  isLoading: boolean
  pendingPredictions: Array<{ input: number[]; requestId: string }>
}

const state: WorkerState = {
  tf: null,
  model: null,
  modelName: null,
  isLoading: false,
  pendingPredictions: []
}

// ============================================================================
// TENSORFLOW LOADING
// ============================================================================

async function loadTensorFlow(): Promise<typeof import('@tensorflow/tfjs')> {
  if (state.tf) {
    return state.tf
  }

  try {
    // Dynamic import in worker context
    const tf = await import('@tensorflow/tfjs')
    
    // Use CPU backend for worker (WebGL not available in workers)
    await tf.setBackend('cpu')
    
    state.tf = tf
    console.log('[ML Worker] TensorFlow.js loaded, backend:', tf.getBackend())
    
    return tf
  } catch (err) {
    throw new Error(`Failed to load TensorFlow.js: ${err instanceof Error ? err.message : 'Unknown'}`)
  }
}

// ============================================================================
// MODEL OPERATIONS
// ============================================================================

async function handleLoadModel(url: string, modelName: string): Promise<void> {
  if (state.isLoading) {
    postMessage({ 
      type: 'MODEL_LOAD_ERROR', 
      error: 'Model already loading' 
    } as MLWorkerResponse)
    return
  }

  state.isLoading = true

  try {
    const tf = await loadTensorFlow()
    
    // Try IndexedDB cache first
    let model: unknown
    const cacheKey = `indexeddb://${modelName}`
    
    try {
      model = await tf.loadLayersModel(cacheKey)
      console.log('[ML Worker] Model loaded from cache:', modelName)
    } catch {
      // Load from network
      console.log('[ML Worker] Loading model from:', url)
      model = await tf.loadLayersModel(url)
      
      // Cache for next time
      try {
        await (model as { save: (path: string) => Promise<void> }).save(cacheKey)
        console.log('[ML Worker] Model cached:', modelName)
      } catch (cacheErr) {
        console.warn('[ML Worker] Cache failed:', cacheErr)
      }
    }

    state.model = model
    state.modelName = modelName
    state.isLoading = false

    postMessage({ 
      type: 'MODEL_LOADED', 
      modelName 
    } as MLWorkerResponse)

    // Process any pending predictions
    processPendingPredictions()

  } catch (err) {
    state.isLoading = false
    const error = err instanceof Error ? err.message : 'Model load failed'
    console.error('[ML Worker] Load failed:', error)
    
    postMessage({ 
      type: 'MODEL_LOAD_ERROR', 
      error 
    } as MLWorkerResponse)
  }
}

async function handlePredict(input: number[], requestId: string): Promise<void> {
  // If model not ready, queue the prediction
  if (!state.model || !state.tf) {
    state.pendingPredictions.push({ input, requestId })
    console.log('[ML Worker] Prediction queued:', requestId)
    return
  }

  try {
    const tf = state.tf
    const model = state.model as { predict: (input: unknown) => unknown }

    // Create input tensor
    const inputTensor = tf.tensor2d([input])
    
    // Run prediction
    const outputTensor = model.predict(inputTensor) as { dataSync: () => Float32Array }
    const result = Array.from(outputTensor.dataSync())

    // Cleanup
    inputTensor.dispose()

    postMessage({
      type: 'PREDICTION_RESULT',
      result,
      requestId
    } as MLWorkerResponse)

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Prediction failed'
    console.error('[ML Worker] Prediction error:', error)
    
    postMessage({
      type: 'PREDICTION_ERROR',
      error,
      requestId
    } as MLWorkerResponse)
  }
}

async function processPendingPredictions(): Promise<void> {
  if (!state.model || state.pendingPredictions.length === 0) {
    return
  }

  console.log(`[ML Worker] Processing ${state.pendingPredictions.length} pending predictions`)

  // Process all pending predictions
  const pending = [...state.pendingPredictions]
  state.pendingPredictions = []

  for (const { input, requestId } of pending) {
    await handlePredict(input, requestId)
  }
}

function handleDispose(): void {
  // Cleanup model
  if (state.model) {
    try {
      (state.model as { dispose?: () => void }).dispose?.()
    } catch (err) {
      console.warn('[ML Worker] Dispose error:', err)
    }
  }

  // Cleanup TF
  if (state.tf) {
    try {
      state.tf.dispose()
    } catch (err) {
      console.warn('[ML Worker] TF dispose error:', err)
    }
  }

  // Reset state
  state.tf = null
  state.model = null
  state.modelName = null
  state.pendingPredictions = []

  postMessage({ type: 'DISPOSED' } as MLWorkerResponse)
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = (event: MessageEvent<MLWorkerCommand>) => {
  const command = event.data

  switch (command.type) {
    case 'LOAD_MODEL':
      handleLoadModel(command.url, command.modelName)
      break

    case 'PREDICT':
      handlePredict(command.input, command.requestId)
      break

    case 'DISPOSE':
      handleDispose()
      break

    default:
      console.error('[ML Worker] Unknown command:', command)
  }
}

// ============================================================================
// WORKER READY SIGNAL
// ============================================================================

postMessage({ 
  type: 'READY', 
  timestamp: Date.now() 
} as MLWorkerResponse)

console.log('[ML Worker] Initialized and ready')
