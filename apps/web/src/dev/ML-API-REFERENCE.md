# ML API Reference

[Ver001.000]

## useMLInference

Core ML inference hook with TensorFlow.js.

```typescript
import { useMLInference } from './hooks/useMLInference'

function MyComponent() {
  const {
    isModelLoading,
    isModelReady,
    isWarmedUp,
    loadModel,
    predict,
    predictBatch,
    warmUp,
    error,
    progress
  } = useMLInference({
    useWorker: true,
    maxRetries: 3,
    timeout: 10000
  })
  
  useEffect(() => {
    loadModel('/models/sator-v1.json', 8) // 8-bit quantization
  }, [])
  
  const handlePredict = async () => {
    const result = await predict([0.5, 0.3, 0.2])
    console.log(result) // [0.95]
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useWorker` | boolean | true | Use Web Worker for inference |
| `maxRetries` | number | 3 | Retry attempts for failed predictions |
| `timeout` | number | 10000 | Prediction timeout in ms |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isModelLoading` | boolean | Model download in progress |
| `isModelReady` | boolean | Model loaded and ready |
| `isWarmedUp` | boolean | Warm-up complete (first prediction fast) |
| `loadModel(url, quantization?)` | Promise<void> | Load model from URL |
| `predict(input)` | Promise<number[]> | Run single prediction |
| `predictBatch(inputs)` | Promise<BatchResult> | Batch predictions (faster) |
| `warmUp(options?)` | Promise<void> | Warm up model |
| `error` | Error \| null | Any error that occurred |
| `progress` | number | Download progress (0-100) |

## useStreamingInference

Real-time streaming predictions via WebSocket.

```typescript
import { useStreamingInference } from './hooks/useStreamingInference'

function MyComponent() {
  const {
    predictions,
    isStreaming,
    lag,
    throughput,
    start,
    stop,
    pause,
    resume
  } = useStreamingInference({
    wsUrl: 'ws://localhost:8080/stream',
    maxPredictionsPerSecond: 10
  })
  
  return (
    <div>
      <p>Lag: {lag}ms</p>
      <p>Throughput: {throughput}/sec</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  )
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsUrl` | string | ws://localhost:8080/stream | WebSocket endpoint |
| `maxPredictionsPerSecond` | number | 10 | Rate limit predictions |
| `modelUrl` | string | - | Model URL (uses loaded model if omitted) |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `predictions` | PredictionResult[] | Last 10 predictions |
| `isStreaming` | boolean | Connection active |
| `isPaused` | boolean | Processing paused |
| `lag` | number | Current lag in ms |
| `throughput` | number | Predictions per second |
| `bufferSize` | number | Current buffer size |
| `error` | Error \| null | Any error |
| `start()` | Promise<void> | Start streaming |
| `stop()` | void | Stop streaming |
| `pause()` | void | Pause processing |
| `resume()` | void | Resume processing |

## usePredictionHistoryStore

Zustand store for prediction history.

```typescript
import { usePredictionHistoryStore } from './store/predictionHistoryStore'

function MyComponent() {
  // Subscribe to store
  const predictions = usePredictionHistoryStore(state => state.predictions)
  const addPrediction = usePredictionHistoryStore(state => state.addPrediction)
  
  // Or use getState for non-reactive access
  const store = usePredictionHistoryStore.getState()
  const stats = store.getStats()
}
```

### State

| Property | Type | Description |
|----------|------|-------------|
| `predictions` | PredictionResult[] | All predictions (max 1000) |
| `isLoading` | boolean | Loading from localStorage |
| `error` | string \| null | Any error |

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `addPrediction` | (prediction: PredictionResult) => void | Add prediction to history |
| `getPredictions` | (range?: DateRange) => PredictionResult[] | Get predictions by date range |
| `getPredictionsByModel` | (modelId: string) => PredictionResult[] | Filter by model |
| `getPredictionsByConfidence` | (minConfidence: number) => PredictionResult[] | Filter by confidence |
| `searchPredictions` | (query: string) => PredictionResult[] | Search by input features |
| `filterPredictions` | (filters: FilterOptions) => PredictionResult[] | Complex filtering |
| `clearHistory` | () => void | Clear all predictions |
| `getStats` | () => Statistics | Get aggregate statistics |
| `exportToCSV` | () => string | Export as CSV |
| `exportToJSON` | () => string | Export as JSON |

### Statistics

```typescript
interface Statistics {
  totalPredictions: number
  averageLatency: number
  averageConfidence: number
  errorRate: number
  uniqueModels: number
  timeRange: { earliest: Date; latest: Date }
}
```

## useMLModelManager

Multi-model management for loading and switching models.

```typescript
import { useMLModelManager } from './hooks/useMLModelManager'

function MyComponent() {
  const {
    models,
    activeModelId,
    loadModel,
    switchModel,
    unloadModel,
    compareModels
  } = useMLModelManager()
  
  // Load multiple models
  useEffect(() => {
    loadModel('model-a', '/models/a.json', { quantization: 8 })
    loadModel('model-b', '/models/b.json', { quantization: 16 })
  }, [])
  
  // Switch between models (<50ms)
  const handleSwitch = () => {
    switchModel('model-b')
  }
  
  // Compare models
  const comparison = compareModels('model-a', 'model-b')
}
```

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `loadModel` | (id, url, options?) => Promise<void> | Load a model |
| `switchModel` | (id) => Promise<void> | Switch active model (<50ms) |
| `unloadModel` | (id) => void | Unload and free memory |
| `unloadAll` | () => void | Unload all models |
| `compareModels` | (idA, idB) => ModelComparison \| null | Compare two models |
| `getMemoryUsage` | () => number | Get total memory used |
| `preloadModels` | (configs) => Promise<void> | Load multiple in parallel |

## Type Definitions

### PredictionResult

```typescript
interface PredictionResult {
  id: string           // Unique prediction ID
  input: number[]      // Input features
  output: number[]     // Model output
  confidence: number   // 0-1 confidence score
  modelId: string      // Model identifier
  timestamp: Date      // When prediction was made
  latencyMs: number    // Prediction latency
}
```

### ModelMetadata

```typescript
interface ModelMetadata {
  id: string           // Model ID
  version: string      // Semantic version
  url: string          // Model URL
  checksum: string     // SHA256 hash
  accuracy: number     // Model accuracy (0-1)
  size: number         // Size in bytes
  deployedAt: Date     // Deployment timestamp
}
```

### StreamData

```typescript
interface StreamData {
  id: string           // Unique message ID
  features: number[]   // Input features
  timestamp: number    // Original timestamp
}
```

## Error Types

### MLValidationError

Invalid input data.

```typescript
try {
  await predict([invalid, data])
} catch (err) {
  if (err instanceof MLValidationError) {
    console.log('Invalid input:', err.message)
  }
}
```

### MLTimeoutError

Prediction exceeded timeout.

```typescript
try {
  await predict(input)
} catch (err) {
  if (err instanceof MLTimeoutError) {
    console.log('Prediction timed out')
  }
}
```

### MLCircuitBreakerError

Circuit breaker is open (too many failures).

```typescript
try {
  await predict(input)
} catch (err) {
  if (err instanceof MLCircuitBreakerError) {
    console.log('Circuit breaker open - service degraded')
    // Wait 30s for reset
  }
}
```

## Global Access

For debugging in browser console:

```javascript
// Analytics
window.mlAnalytics.getReport()
window.mlAnalytics.trackPrediction(50, true)

// A/B Testing
window.mlABTesting.listTests()
window.mlABTesting.getTest('my-test').getStats()

// Prediction History
const store = await import('./store/predictionHistoryStore')
store.usePredictionHistoryStore.getState().getStats()
```
