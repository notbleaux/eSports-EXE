# ML Bundle Optimization

**[Ver001.000]** - TensorFlow.js Dynamic Loading Implementation

## Overview

This document describes the bundle optimization strategy for ML features in the 4NJZ4 TENET Platform. TensorFlow.js is now loaded dynamically on-demand, reducing the initial bundle size by approximately **2.2MB**.

## Problem Statement

- TensorFlow.js adds ~2MB+ to the initial bundle
- ML models are loaded but not always used
- Users visiting non-ML routes pay the download cost unnecessarily

## Solution Architecture

### 1. Dynamic Import Strategy

```
Initial Bundle (without ML)
├── React Core (~150KB)
├── Animation (~100KB)
├── UI Components (~200KB)
├── Main App Logic (~300KB)
└── Total: ~750KB ✅

ML Vendor (loaded on demand)
├── TensorFlow.js (~2.2MB)
├── ML Worker (~50KB)
└── Models (varies)
```

### 2. Key Components

#### `ml-loader.ts` - Core Loading Utility

```typescript
// Dynamic TensorFlow.js import - NOT in initial bundle
const tf = await import('@tensorflow/tfjs')
```

**Features:**
- Lazy loads TensorFlow.js only when needed
- Progress tracking for loading feedback
- Global model cache with LRU eviction
- IndexedDB persistence for models
- Backend management (WebGL → CPU fallback)

#### `ml-feature-flags.ts` - Feature Toggle System

```typescript
// Route-based ML activation
export interface MLRouteConfig {
  path: string
  features: ('mlPredictions' | 'mlAnalytics')[]
  preloadModels: string[]
}
```

**Features:**
- All ML features disabled by default
- Route-based auto-activation
- User preference persistence
- Bundle size estimation

#### `useMLInference.ts` - React Hook

Updated to integrate with lazy loading:
- Checks feature flags before loading
- Shows loading progress
- Auto-unload after inactivity
- Worker integration for off-thread inference

### 3. Web Worker Optimization

The ML Worker (`ml.worker.ts`) now also loads TensorFlow.js dynamically:

```typescript
// Worker loads TF.js on first model load, not at startup
async function loadTensorFlow(): Promise<typeof import('@tensorflow/tfjs')> {
  if (!tf) {
    tf = await import('@tensorflow/tfjs')
  }
  return tf
}
```

## Usage Examples

### Basic Lazy Loading

```typescript
import { useMLInference } from '@/hooks'

function PredictionComponent() {
  const { loadModel, predict, isModelReady, progress } = useMLInference()

  useEffect(() => {
    // TF.js loads here, not on component mount
    loadModel('/models/win-probability.json')
  }, [])

  if (!isModelReady) {
    return <div>Loading ML Model... {progress}%</div>
  }

  return <button onClick={() => predict(input)}>Predict</button>
}
```

### With Feature Flags

```typescript
import { useMLFeatureFlags } from '@/hooks'

function AnalyticsPage() {
  const { shouldLoadML, enableFeature } = useMLFeatureFlags()

  useEffect(() => {
    if (shouldLoadML) {
      enableFeature('mlAnalytics')
    }
  }, [shouldLoadML])

  return (
    <div>
      {shouldLoadML && <MLPredictionPanel />}
    </div>
  )
}
```

### Manual ML Loading

```typescript
import { loadTensorFlow, loadModel } from '@/lib/ml-loader'

async function manualMLLoad() {
  // Load TF.js with progress
  const tf = await loadTensorFlow('webgl', (progress) => {
    console.log(`${progress.stage}: ${progress.percent}%`)
  })

  // Load specific model
  const model = await loadModel('/models/my-model.json', {
    name: 'my-model',
    quantization: 8 // Use int8 for smaller size
  })

  // Use model
  const result = model.predict(tf.tensor2d([[0.5, 0.5]]))
}
```

## Configuration

### Enabling ML Features

```typescript
// Enable specific feature
import { setMLFeature } from '@/lib/ml-loader'
setMLFeature('mlPredictions', true)

// Enable all features
import { enableAllMLFeatures } from '@/lib/ml-loader'
enableAllMLFeatures()

// Reset to defaults
import { resetMLFeatures } from '@/lib/ml-loader'
resetMLFeatures()
```

### Route Configuration

```typescript
import { addRouteConfig } from '@/lib/ml-loader'

addRouteConfig({
  path: '/my-custom-route',
  features: ['mlPredictions', 'mlAnalytics'],
  preloadModels: ['my-model-v1'],
  priority: 'high'
})
```

### Vite Config

The Vite configuration already separates ML into its own chunk:

```javascript
// vite.config.js
manualChunks: (id) => {
  if (id.includes('node_modules/@tensorflow')) {
    return 'ml-vendor' // Separate chunk
  }
  // ... other chunks
}
```

## Performance Metrics

### Bundle Size

| Configuration | Initial Bundle | ML Chunk | Total |
|---------------|----------------|----------|-------|
| Without ML    | ~750KB        | 0KB      | ~750KB |
| With ML       | ~750KB        | ~2.2MB   | ~2.95MB |
| Savings       | -             | -        | **2.2MB** |

### Load Times (Typical)

| Operation | Time |
|-----------|------|
| Initial page load | ~1.5s |
| TF.js load (on demand) | ~2-4s |
| Model load (cached) | ~500ms |
| Model load (network) | ~3-8s |

### Memory Usage

| State | Memory |
|-------|--------|
| Without ML | ~50MB |
| With TF.js loaded | ~150MB |
| With model loaded | ~200MB |

## Testing

### Bundle Tests

```typescript
import { runBundleTests, printTestResults } from '@/dev/ml-bundle-test'

// Run all tests
const results = await runBundleTests()
printTestResults(results)
```

### Manual Testing

In development console:

```javascript
// Check if TF.js is in bundle (should be false initially)
window.ML_BUNDLE_TEST.isTFInBundle()

// Measure TF.js load time
const metrics = await window.ML_BUNDLE_TEST.measureTFLoad()
console.log(`Loaded in ${metrics.loadTimeMs}ms`)

// Run full benchmark
const benchmark = await window.ML_BUNDLE_TEST.runBenchmark('/models/test.json')
console.log(benchmark)
```

### Unit Tests

```bash
npm test -- ml-loader.test.ts
npm test -- ml-feature-flags.test.ts
npm test -- useMLInference.lazy.test.ts
```

## Best Practices

### 1. Lazy Load at Component Level

```typescript
// ✅ Good - ML loaded when component mounts
const MLPredictionPanel = lazy(() => import('./MLPredictionPanel'))

// ❌ Bad - ML in main bundle
import { MLPredictionPanel } from './MLPredictionPanel'
```

### 2. Check Feature Flags First

```typescript
// ✅ Good - Check before loading
if (isMLFeatureEnabled('mlPredictions')) {
  await loadModel(url)
}

// ❌ Bad - Always load
await loadModel(url)
```

### 3. Use Progress Indicators

```typescript
// ✅ Good - Show loading progress
const { progress } = useMLInference()
return <ProgressBar value={progress} />

// ❌ Bad - No feedback during long load
```

### 4. Implement Error Boundaries

```typescript
// ✅ Good - Handle ML errors gracefully
<MLInferenceErrorBoundary>
  <MLPredictionPanel />
</MLInferenceErrorBoundary>
```

### 5. Auto-Cleanup

```typescript
// ✅ Good - Auto-unload after inactivity
useMLInference({ autoUnloadTimeout: 5 * 60 * 1000 }) // 5 minutes

// Manual cleanup when done
const { unloadModel } = useMLInference()
unloadModel()
```

## Troubleshooting

### TensorFlow.js Not Loading

1. Check network tab for failed requests
2. Verify feature flag is enabled: `isMLEnabled()`
3. Check console for TF.js errors

### Model Loading Fails

1. Verify model URL is accessible
2. Check IndexedDB permissions
3. Try clearing cache: `clearIndexedDBCache()`

### Worker Errors

1. Check browser supports Web Workers
2. Verify worker file is served correctly
3. Fallback to main thread is automatic

## Future Enhancements

1. **WebGPU Backend** - Experimental, faster inference
2. **Model Quantization** - Reduce model size by 50-75%
3. **Service Worker Caching** - Cache models for offline use
4. **Predictive Preloading** - Load models before user needs them
5. **ML Model Registry** - Centralized model management

## References

- [TensorFlow.js Performance Guide](https://www.tensorflow.org/js/guide/platform_environment)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#code-splitting)
- [Dynamic Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
