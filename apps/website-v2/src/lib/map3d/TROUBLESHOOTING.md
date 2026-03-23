# Map3D Optimization Troubleshooting Guide

[Ver001.000]

Common issues and solutions for the Map3D optimization system.

---

## Quick Diagnostics

Run this checklist first:

```typescript
import { detectDeviceCapabilities } from './optimization.constants';

// 1. Check device capabilities
console.log('Device:', detectDeviceCapabilities());

// 2. Check optimization stats
console.log('Stats:', optimization.getStats());

// 3. Verify initialization
console.log('Initialized:', optimization.isInitialized);
```

---

## Common Issues

### 1. Low Frame Rate (< 30 FPS)

**Symptoms**: Choppy animation, high frame times

**Check**:
```typescript
const stats = optimization.getStats();
console.log(`Frame time: ${stats.frameTime.toFixed(2)}ms`);
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`GPU Memory: ${(stats.gpuMemory / 1024 / 1024).toFixed(1)}MB`);
```

**Solutions**:

| Cause | Solution |
|-------|----------|
| Too many draw calls | Enable instancing, reduce batch size |
| High GPU memory | Lower texture quality, enable streaming |
| Occlusion culling overhead | Disable on low-end devices |
| Too many LOD updates | Increase cullingUpdateFrequency |

```typescript
// Reduce quality for better performance
optimization.setQuality('medium');

// Or manually adjust
const optimization = new MapOptimizationManager(scene, {
  enableOcclusionCulling: false, // Disable expensive feature
  instanceBatchSize: 500,        // Smaller batches
  maxTextureCacheSize: 128 * 1024 * 1024, // 128MB limit
});
```

---

### 2. Texture Loading Failures

**Symptoms**: Missing textures, "Failed to load texture" errors

**Check Network**:
```typescript
textureManager.requestTexture({
  id: 'test',
  url: 'https://example.com/texture.png',
  priority: 1,
  desiredResolution: 1024,
});

// Check load queue
textureManager.processQueue(1).then(() => {
  console.log('Queue processed');
});
```

**Solutions**:

1. **CORS Issues**:
```typescript
// Ensure proper CORS headers on server
// Access-Control-Allow-Origin: *
// Or use same-origin textures
```

2. **Network Timeouts**:
```typescript
// Implement retry logic
class RetryTextureManager extends TextureStreamManager {
  private retryCounts = new Map<string, number>();
  
  async processQueue(maxLoads = 2): Promise<void> {
    try {
      await super.processQueue(maxLoads);
    } catch (error) {
      // Re-queue failed textures with backoff
      for (const request of this['loadQueue']) {
        const count = this.retryCounts.get(request.id) || 0;
        if (count < 3) {
          this.retryCounts.set(request.id, count + 1);
          // Delay and retry
          setTimeout(() => {
            this.requestTexture(request);
          }, Math.pow(2, count) * 1000);
        }
      }
    }
  }
}
```

3. **Invalid URLs**:
```typescript
// Validate URLs before requesting
function isValidTextureUrl(url: string): boolean {
  try {
    new URL(url);
    return /\.(png|jpg|webp|ktx2)$/i.test(url);
  } catch {
    return false;
  }
}
```

---

### 3. Memory Leaks

**Symptoms**: Increasing memory usage, browser crashes

**Detect**:
```typescript
// Monitor memory over time
setInterval(() => {
  const stats = optimization.getStats();
  console.log(`Memory: ${(stats.gpuMemory / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Textures: ${stats.textureCount}`);
  console.log(`Batches: ${stats.batchCount}`);
}, 5000);
```

**Solutions**:

1. **Proper Disposal**:
```typescript
// Always dispose when component unmounts
useEffect(() => {
  const optimization = new MapOptimizationManager(scene, config);
  
  return () => {
    optimization.dispose(); // Critical!
  };
}, []);
```

2. **Texture Release**:
```typescript
// Always release acquired textures
const texture = textureManager.acquireTexture('myTexture');
try {
  // Use texture
} finally {
  textureManager.releaseTexture('myTexture');
}
```

3. **Instance Cleanup**:
```typescript
// Clear instances when removing objects
instanceRenderer.clearBatch('oldBatch');
```

---

### 4. Culling Not Working

**Symptoms**: Objects visible when they shouldn't be, excessive draw calls

**Debug Visualization**:
```typescript
// Add debug helpers
const helper = new THREE.CameraHelper(frustumCuller['camera']);
scene.add(helper);

// Log culling results
console.log('Visible count:', culler.getVisibleObjects().length);
console.log('Total objects:', scene.children.length);
```

**Solutions**:

1. **Check Initialization**:
```typescript
// Ensure cullers are initialized
if (!frustumCuller['isInitialized']) {
  console.warn('Culler not initialized!');
  optimization.initializeCullers(camera, renderer);
}
```

2. **Update Frequency**:
```typescript
// Increase update frequency for moving camera
const optimization = new MapOptimizationManager(scene, {
  cullingUpdateFrequency: 1, // Every frame
});
```

3. **Bounding Boxes**:
```typescript
// Ensure objects have proper bounding boxes
object.geometry.computeBoundingBox();
object.geometry.computeBoundingSphere();
```

---

### 5. Instancing Performance Issues

**Symptoms**: Poor performance with many repeated objects

**Check**:
```typescript
const stats = instanceRenderer.getStats();
console.log(`Batches: ${stats.batchCount}`);
console.log(`Instances: ${stats.totalInstances}`);
console.log(`Matrices buffer size: ${stats.matricesSize}`);
```

**Solutions**:

1. **Batch Consolidation**:
```typescript
// Combine similar materials
const mergedMaterial = new THREE.MeshStandardMaterial({
  map: atlasTexture, // Use texture atlas
});

instanceRenderer.registerGeometry('merged', mergedGeometry, mergedMaterial);
```

2. **Dynamic Resize** (CRIT-10 fix):
```typescript
// Ensure matrices array resizes properly
class FixedInstanceRenderer extends InstanceRenderer {
  update(): void {
    // Resize matrices if count changed
    for (const [id, batch] of this['batches']) {
      const expectedSize = batch.count * 16;
      if (batch.matrices.length !== expectedSize) {
        const newMatrices = new Float32Array(expectedSize);
        newMatrices.set(batch.matrices.slice(0, Math.min(
          batch.matrices.length, 
          expectedSize
        )));
        batch.matrices = newMatrices;
      }
    }
    super.update();
  }
}
```

---

## Error Codes Reference

| Code | Description | Solution |
|------|-------------|----------|
| `TEXTURE_LOAD_FAILED` | Texture failed to load | Check URL, CORS, network |
| `CACHE_OVERFLOW` | Cache size exceeded | Reduce cache size, enable eviction |
| `OOM` | Out of memory | Dispose unused resources |
| `INVALID_CONFIG` | Configuration error | Validate config with `validateConfig()` |
| `NOT_INITIALIZED` | System not initialized | Call `initializeCullers()` |
| `BATCH_FULL` | Instance batch full | Increase batch size or split |
| `DUPLICATE_ID` | ID already exists | Use unique IDs for each resource |

---

## Debug Mode

Enable comprehensive logging:

```typescript
const logger = createLogger({ 
  type: 'console', 
  enabled: true 
});

const optimization = new MapOptimizationManager(scene, config, logger);

// Enable THREE.js debugging
renderer.debug.checkShaderErrors = true;
```

---

## Performance Profiling

### Chrome DevTools

1. Open Performance tab
2. Record during animation
3. Look for:
   - Long JavaScript execution
   - GPU-bound operations
   - Texture upload spikes

### Custom Profiler

```typescript
class OptimizationProfiler {
  private frames: number[] = [];
  
  start(): void {
    this.frames = [];
  }
  
  frame(time: number): void {
    this.frames.push(time);
  }
  
  report(): void {
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    const max = Math.max(...this.frames);
    const min = Math.min(...this.frames);
    
    console.log(`Avg: ${avg.toFixed(2)}ms | Max: ${max.toFixed(2)}ms | Min: ${min.toFixed(2)}ms`);
    console.log(`FPS: ${(1000 / avg).toFixed(1)}`);
  }
}
```

---

## Support

For issues not covered here:

1. Check [API Documentation](./API_DOCUMENTATION.md)
2. Run `detectDeviceCapabilities()` and report output
3. Include `optimization.getStats()` in bug reports
4. Provide minimal reproduction case

---

*Generated for Libre-X-eSport 4NJZ4 TENET Platform*
