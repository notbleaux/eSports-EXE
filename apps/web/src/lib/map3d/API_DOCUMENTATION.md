# Map3D Optimization API Documentation

[Ver001.000]

Comprehensive API documentation for the Map3D optimization system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Class Reference](#class-reference)
4. [Configuration](#configuration)
5. [Device Profiles](#device-profiles)
6. [Error Handling](#error-handling)
7. [Performance Tuning](#performance-tuning)

---

## Quick Start

```typescript
import { MapOptimizationManager } from './optimization';
import { createLogger } from './optimization.logger';

// Create optimization manager
const scene = new THREE.Scene();
const logger = createLogger({ type: 'console', prefix: 'Map3D' });

const optimization = new MapOptimizationManager(scene, {
  enableOcclusionCulling: true,
  maxTextureCacheSize: 256 * 1024 * 1024, // 256MB
}, logger);

// Initialize with camera and renderer
optimization.initializeCullers(camera, renderer);

// Update in render loop
function animate() {
  optimization.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

---

## Architecture Overview

### Component Hierarchy

```
MapOptimizationManager (Coordinator)
├── FrustumCuller
│   └── SpatialHashIndex
├── OcclusionCuller
│   └── HierarchicalZBuffer
├── TextureStreamManager
│   └── LRUCache + LoadQueue
└── InstanceRenderer
    └── BatchManager
```

### Data Flow

1. **Culling Phase**: Frustum → Occlusion → Visibility Set
2. **LOD Phase**: Distance-based level selection
3. **Streaming Phase**: Priority-based texture loading
4. **Rendering Phase**: Instanced draw calls

---

## Class Reference

### MapOptimizationManager

Main coordinator class managing all optimization systems.

#### Constructor

```typescript
constructor(
  scene: THREE.Scene,
  config?: Partial<OptimizationConfig>,
  logger?: ILogger
)
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `initializeCullers` | `(camera: Camera, renderer: Renderer) => void` | Set up culling systems |
| `update` | `() => void` | Process one optimization frame |
| `getStats` | `() => PerformanceMetrics` | Get current performance stats |
| `setQuality` | `(level: 'low' | 'medium' | 'high') => void` | Adjust quality preset |
| `dispose` | `() => void` | Clean up resources |

#### Configuration Interface

```typescript
interface OptimizationConfig {
  // Culling
  enableFrustumCulling: boolean;
  enableOcclusionCulling: boolean;
  frustumPadding: number;
  cullingUpdateFrequency: number;
  
  // Instancing
  enableInstancing: boolean;
  instanceBatchSize: number;
  
  // Texture streaming
  enableTextureStreaming: boolean;
  maxTextureCacheSize: number;
  
  // LOD
  lodDistanceMultiplier: number;
  lodHysteresis: number;
}
```

---

### TextureStreamManager

LRU-based texture cache with priority-based loading queue.

#### Constructor

```typescript
constructor(
  config?: Partial<TextureConfig>,
  logger?: ILogger
)
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `requestTexture` | `(request: TextureRequest) => void` | Queue texture for loading |
| `acquireTexture` | `(id: string) => Texture \| null` | Get loaded texture |
| `releaseTexture` | `(id: string) => void` | Decrement reference count |
| `processQueue` | `(maxLoads?: number) => Promise<void>` | Process load queue |
| `evictIfNeeded` | `() => void` | Clear cache to free memory |
| `clear` | `() => void` | Remove all textures |
| `dispose` | `() => void` | Clean up all resources |

#### TextureRequest

```typescript
interface TextureRequest {
  id: string;           // Unique identifier
  url: string;          // Texture URL
  priority: number;     // 0-10 (0 = highest)
  desiredResolution: number; // Target resolution
}
```

---

### InstanceRenderer

GPU instancing for repeated geometry with matrix batching.

#### Constructor

```typescript
constructor(
  scene: THREE.Scene,
  maxInstances?: number
)
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerGeometry` | `(id: string, geo: Geometry, mat: Material) => void` | Register batch template |
| `addInstance` | `(batchId: string, matrix: Matrix4, color?: Color) => void` | Add instance |
| `removeInstance` | `(batchId: string, index: number) => void` | Remove instance |
| `update` | `() => void` | Update instance matrices |
| `dispose` | `() => void` | Clean up resources |

---

## Configuration

### Device-Specific Settings

```typescript
import { 
  detectDeviceCapabilities, 
  getDeviceProfileForCapabilities,
  DEVICE_PROFILES 
} from './optimization.constants';

// Auto-detect optimal settings
const caps = detectDeviceCapabilities();
const profile = getDeviceProfileForCapabilities(caps);

const optimization = new MapOptimizationManager(scene, {
  maxTextureCacheSize: profile.maxTextureCacheSize,
  instanceBatchSize: profile.instanceBatchSize,
  enableOcclusionCulling: profile.enableOcclusionCulling,
});
```

### Quality Presets

| Preset | Textures | Shadows | AA | Particles |
|--------|----------|---------|----|-----------|
| low    | 512px    | Off     | Off | 25%       |
| medium | 1024px   | On      | Off | 50%       |
| high   | 2048px   | On      | On  | 75%       |
| ultra  | 4096px   | On      | On  | 100%      |

---

## Device Profiles

### Mobile Profile

```typescript
{
  maxTextureCacheSize: 128 * 1024 * 1024, // 128MB
  instanceBatchSize: 500,
  enableOcclusionCulling: false,
  targetFrameTime: 33.33, // 30fps
  textureQuality: 'medium',
}
```

### Desktop Profile

```typescript
{
  maxTextureCacheSize: 512 * 1024 * 1024, // 512MB
  instanceBatchSize: 2000,
  enableOcclusionCulling: true,
  targetFrameTime: 16.67, // 60fps
  textureQuality: 'high',
}
```

### High-End Profile

```typescript
{
  maxTextureCacheSize: 1024 * 1024 * 1024, // 1GB
  instanceBatchSize: 5000,
  enableOcclusionCulling: true,
  targetFrameTime: 11.11, // 90fps
  textureQuality: 'ultra',
}
```

---

## Error Handling

### Texture Loading Errors

```typescript
try {
  await textureManager.processQueue(2);
} catch (error) {
  if (error.code === 'NETWORK_TIMEOUT') {
    // Retry with backoff
  } else if (error.code === 'CORS_ERROR') {
    // Log and skip
  }
}
```

### Memory Errors

```typescript
// Monitor memory pressure
const stats = optimization.getStats();
if (stats.gpuMemory > GPU_MEMORY_THRESHOLD) {
  textureManager.evictIfNeeded();
  instanceRenderer.reduceDrawCalls();
}
```

### Logger Integration

```typescript
const logger = createLogger({ 
  type: 'performance', 
  baseLogger: consoleLogger 
});

// All errors automatically logged with context
logger.error('Texture load failed', {
  url: textureUrl,
  error: errorMessage,
  attemptCount: retries,
});
```

---

## Performance Tuning

### Target Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Frame Time | < 16.67ms | < 33.33ms | > 33.33ms |
| Draw Calls | < 100 | < 500 | > 500 |
| GPU Memory | < 200MB | < 500MB | > 500MB |
| Texture Loads/frame | < 2 | < 5 | > 5 |

### Profiling

```typescript
const perfLogger = new PerformanceLogger(consoleLogger);
const manager = new MapOptimizationManager(scene, config, perfLogger);

// After some frames
const metrics = perfLogger.getMetrics();
metrics.forEach(m => {
  console.log(`${m.operation}: ${m.durationMs.toFixed(2)}ms`);
});
```

### Optimization Checklist

- [ ] Use appropriate device profile
- [ ] Enable instancing for repeated geometry
- [ ] Tune batch sizes for target device
- [ ] Monitor texture cache hit rate
- [ ] Test on target hardware
- [ ] Verify memory usage patterns
- [ ] Check frame time consistency

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 001.000 | 2026-03-23 | Initial documentation |

---

*Generated for Libre-X-eSport 4NJZ4 TENET Platform*
