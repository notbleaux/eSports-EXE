[Ver001.000]

# Developer Tools Guide

Quick reference for performance testing, debugging, and ML inference.

## Console API Reference

### Test Runner (Primary Entry Point)
```javascript
// Run all tests
window.testRunner.runAll()

// Run specific test suites
window.testRunner.runTests(['benchmark', 'memory'], {
  benchmarkRenderFn: yourRenderFn
})

// Load previous reports
window.testRunner.loadReports()

// Compare with baseline
window.testRunner.compareWithBaseline()

// Export results
window.testRunner.exportReport()
window.testRunner.exportAll()
```

**Expected time:** 30-60 seconds  
**Output:** Full test report + localStorage

### Benchmark Tool (via Test Runner)
```javascript
// Run benchmark through test runner
window.testRunner.runTests(['benchmark'], {
  benchmarkRenderFn: async (count) => {
    // Your render logic here
    console.log(`Rendering ${count} panels`)
  }
})

// Access raw benchmark module (ESM import only)
import { runBenchmark, exportBenchmarks } from './dev/grid-benchmark'
```

**Expected time:** 15-30 seconds  
**Output:** Console table + localStorage

### Memory Monitor
```javascript
// Start monitoring
window.monitor.start({ interval: 5000 })  // 5 second intervals

// Take snapshot
window.monitor.snapshot()

// Get report
window.monitor.getReport()

// Stop monitoring
window.monitor.stop()

// Reset state
window.monitor.reset()
```

**Expected time:** As long as needed (typically 5 min)  
**Output:** Console logs + leak warnings

### Stress Test (Component)
```jsx
import { StressTest } from './dev/stress-test'

// In your component:
<StressTest
  rowCount={10000}
  scrollEventsPerSecond={100}
  onComplete={(results) => console.log(results)}
/>
```

**Expected time:** 5 seconds  
**Output:** FPS metrics + pass/fail status

### ML Inference (Week 3)

#### Basic Usage
```javascript
// ML inference is available via React hook
import { useMLInference } from '@/hooks/useMLInference'
import { ModelLoadingIndicator } from '@/components/ui/ModelLoadingIndicator'

// In component:
const { 
  loadModel, 
  predict, 
  warmUp,
  getModelInfo,
  isModelReady, 
  isModelLoading, 
  isWarmedUp,
  progress,
  error 
} = useMLInference({
  useWorker: true  // Use Web Worker for inference
})

// Load model with progress tracking
await loadModel('/models/model.json')

// Warm up for faster first prediction
if (isModelReady && !isWarmedUp) {
  await warmUp()
}

// Run prediction
const result = await predict([0.1, 0.2, 0.3])
console.log('Prediction:', result)

// Get model info
const info = getModelInfo()
console.log('Model backend:', info?.backend)
```

#### With Loading UI
```jsx
{isModelLoading && (
  <ModelLoadingIndicator 
    progress={progress}
    isLoading={isModelLoading}
    error={error}
    modelName="ML Model"
  />
)}

{isModelReady && (
  <button onClick={() => predict([0.1, 0.2, 0.3])}>
    Predict
  </button>
)}
```

**Expected time:** 
- Model load (cached): ~0.8s
- Model load (network): 4-6s
- First prediction: 15-25ms
- Warmed up prediction: 5-10ms

**Output:** Prediction array + confidence scores

## Threshold Reference

| Metric | Good | Acceptable | Critical |
|--------|------|------------|----------|
| Render 100 | <50ms | 50-75ms | >100ms |
| Render 1000 | <150ms | 150-225ms | >300ms |
| Render 5000 | <800ms | 800-1200ms | >1500ms |
| Scroll FPS | >45 | 35-45 | <30 |
| Memory | <5MB/min | 5-10MB/min | >10MB/min |
| ML Prediction | <50ms | 50-100ms | >100ms |

## When to Be Concerned

### Immediate Action Required
- Scroll FPS drops below 30 consistently
- Memory growth exceeds 10MB/min
- Render times 3x over target
- ML predictions >100ms consistently

### Investigation Needed
- FPS between 30-45
- Memory growth 5-10MB/min
- Render times 1.5-2x target
- ML predictions 50-100ms

### Monitor Only
- FPS above 45
- Memory growth under 5MB/min
- Render times at or below target
- ML predictions under 50ms

## Tips

1. **Run benchmarks in Incognito mode** to avoid extension interference
2. **Use Performance tab** in DevTools to visualize alongside our metrics
3. **Close other tabs** for consistent memory readings
4. **Run 3 times** and average results for accuracy
5. **For ML testing:** First load will download model, subsequent loads use IndexedDB cache
