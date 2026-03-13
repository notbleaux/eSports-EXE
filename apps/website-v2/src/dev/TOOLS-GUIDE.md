# Developer Tools Guide

Quick reference for performance testing and debugging.

## Console API Reference

### Benchmark Tool
```javascript
// Run quick benchmark
window.benchmark.run(renderFn, scrollContainer)

// Export results
window.benchmark.export()

// Example:
const renderFn = async (count) => {
  // Your render logic
}
window.benchmark.run(renderFn)
```

**Expected time:** 15-30 seconds  
**Output:** Console table + localStorage

### Memory Monitor
```javascript
// Start monitoring
window.monitor.start(5000)  // 5 second intervals

// Take snapshot
window.monitor.snapshot()

// Get report
window.monitor.report()

// Stop monitoring
window.monitor.stop()

// Reset state
window.monitor.reset()
```

**Expected time:** As long as needed (typically 5 min)  
**Output:** Console logs + leak warnings

### Test Runner
```javascript
// Run all tests
window.testRunner.run({
  includeBenchmark: true,
  includeMemory: true,
  benchmarkRenderFn: yourRenderFn
})

// Load previous reports
window.testRunner.load()

// Compare with baseline
window.testRunner.compare(currentReport, 1)

// Export results
window.testRunner.export()
```

**Expected time:** 30-60 seconds  
**Output:** Full test report + localStorage

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

## Threshold Reference

| Metric | Good | Acceptable | Critical |
|--------|------|------------|----------|
| Render 100 | <50ms | 50-75ms | >100ms |
| Render 1000 | <150ms | 150-225ms | >300ms |
| Render 5000 | <800ms | 800-1200ms | >1500ms |
| Scroll FPS | >45 | 35-45 | <30 |
| Memory | <5MB/min | 5-10MB/min | >10MB/min |

## When to Be Concerned

### Immediate Action Required
- Scroll FPS drops below 30 consistently
- Memory growth exceeds 10MB/min
- Render times 3x over target

### Investigation Needed
- FPS between 30-45
- Memory growth 5-10MB/min
- Render times 1.5-2x target

### Monitor Only
- FPS above 45
- Memory growth under 5MB/min
- Render times at or below target

## Tips

1. **Run benchmarks in Incognito mode** to avoid extension interference
2. **Use Performance tab** in DevTools to visualize alongside our metrics
3. **Close other tabs** for consistent memory readings
4. **Run 3 times** and average results for accuracy
