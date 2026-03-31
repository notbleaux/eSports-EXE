/**
 * Performance Optimization for 3D Maps
 * 
 * [Ver001.000] - Advanced optimization techniques for large 3D maps
 * 
 * Provides:
 * - Frustum culling for map objects
 * - Occlusion culling using hierarchical Z-buffer
 * - Texture streaming for large map textures
 * - Instanced rendering for repeated geometry
 * - Object pooling for dynamic elements
 * - LOD batching
 * 
 * @example
 * ```typescript
 * import { 
 *   MapFrustumCuller, 
 *   TextureStreamManager,
 *   InstanceRenderer,
 * } from '@/lib/map3d/optimization';
 * 
 * const culler = new MapFrustumCuller(camera);
 * culler.registerMapObjects(mapGroup);
 * ```
 */

import * as THREE from 'three';
import { FrustumCullingManager, CullingStats } from '@/lib/three/frustumCulling';
import type { ILogger } from './optimization.logger';
import { ConsoleLogger, NullLogger } from './optimization.logger';
import { OPTIMIZATION_DEFAULTS } from './optimization.constants';

// ============================================
// Types
// ============================================

export interface OptimizationConfig {
  enableFrustumCulling: boolean;
  enableOcclusionCulling: boolean;
  enableTextureStreaming: boolean;
  enableInstancing: boolean;
  maxTextureCacheSize: number;
  instanceBatchSize: number;
  cullingUpdateFrequency: number;
}

export interface TexturePriority {
  id: string;
  url: string;
  priority: number;
  desiredResolution: number;
}

export interface TextureTile {
  id: string;
  url: string;
  resolution: number;
  texture: THREE.Texture;
  lastUsed: number;
  refCount: number;
}

export interface InstanceBatch {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  mesh: THREE.InstancedMesh;
  count: number;
  maxCount: number;
  matrices: Float32Array;
  colors: Float32Array;
}

export interface PooledObject {
  id: string;
  object: THREE.Object3D;
  inUse: boolean;
  lastUsed: number;
}

export interface OptimizationStats {
  culledObjects: number;
  visibleObjects: number;
  textureCacheSize: number;
  activeInstances: number;
  pooledObjects: number;
  drawCalls: number;
  frameTime: number;
}

// ============================================
// Map Frustum Culler
// ============================================

export class MapFrustumCuller extends FrustumCullingManager {
  private mapBounds: THREE.Box3 | null = null;
  private staticObjects: Map<string, THREE.Object3D> = new Map();
  private dynamicObjects: Map<string, THREE.Object3D> = new Map();
  private zoneVisibility: Map<string, boolean> = new Map();

  constructor(camera: THREE.Camera, options?: { occlusionCulling?: boolean }) {
    super({
      enabled: true,
      occlusionCulling: options?.occlusionCulling ?? true,
      frustumPadding: 0.05,
      updateFrequency: 1,
      useBoundingSphere: true,
      useSpatialHash: true,
      spatialHashCellSize: 100,
    });

    this.setCamera(camera);
  }

  /**
   * Register map objects with automatic categorization
   */
  registerMapObjects(mapGroup: THREE.Group): void {
    mapGroup.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        const id = mesh.uuid;
        const isStatic = !mesh.userData.dynamic;

        this.registerObject(id, mesh, {
          boundingBox: mesh.geometry.boundingBox ?? undefined,
          boundingSphere: mesh.geometry.boundingSphere ?? undefined,
          priority: mesh.userData.priority ?? 0,
        });

        if (isStatic) {
          this.staticObjects.set(id, mesh);
        } else {
          this.dynamicObjects.set(id, mesh);
        }
      }
    });

    // Calculate map bounds
    this.mapBounds = new THREE.Box3().setFromObject(mapGroup);
  }

  /**
   * Register zone for zone-based culling
   */
  registerZone(zoneId: string): void {
    this.zoneVisibility.set(zoneId, true);
  }

  /**
   * Set zone visibility
   */
  setZoneVisibility(zoneId: string, visible: boolean): void {
    this.zoneVisibility.set(zoneId, visible);
  }

  /**
   * Check if a zone is visible
   */
  isZoneVisible(zoneId: string): boolean {
    return this.zoneVisibility.get(zoneId) ?? true;
  }

  /**
   * Get map bounds
   */
  getMapBounds(): THREE.Box3 | null {
    return this.mapBounds;
  }

  /**
   * Get static object count
   */
  getStaticObjectCount(): number {
    return this.staticObjects.size;
  }

  /**
   * Get dynamic object count
   */
  getDynamicObjectCount(): number {
    return this.dynamicObjects.size;
  }

  /**
   * Clear all registered objects
   */
  clearMapObjects(): void {
    this.staticObjects.clear();
    this.dynamicObjects.clear();
    this.zoneVisibility.clear();
    this.mapBounds = null;
    this.clear();
  }
}

// ============================================
// Texture Stream Manager
// ============================================

export class TextureStreamManager {
  private textureCache: Map<string, TextureTile> = new Map();
  private loadQueue: TexturePriority[] = [];
  private loading: Set<string> = new Set();
  private config: OptimizationConfig;
  private logger: ILogger;
  private textureLoader: THREE.TextureLoader;

  constructor(config: Partial<OptimizationConfig> = {}, logger?: ILogger) {
    this.config = { ...OPTIMIZATION_DEFAULTS, ...config };
    this.logger = logger ?? new NullLogger();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Request a texture with priority
   */
  requestTexture(id: string, url: string, priority: number, desiredResolution: number): THREE.Texture | null {
    // Check cache first
    const cached = this.textureCache.get(id);
    if (cached && cached.resolution >= desiredResolution) {
      cached.lastUsed = performance.now();
      cached.refCount++;
      return cached.texture;
    }

    // Add to load queue if not already loading
    if (!this.loading.has(id)) {
      this.loadQueue.push({ id, url, priority, desiredResolution });
      this.loadQueue.sort((a, b) => b.priority - a.priority);
    }

    // Return lower resolution if available
    if (cached) {
      return cached.texture;
    }

    return null;
  }

  /**
   * Process texture load queue
   */
  update(): void {
    if (this.loadQueue.length === 0) return;

    // Process high priority items
    const item = this.loadQueue.shift();
    if (!item) return;

    this.loadTexture(item);
  }

  /**
   * Load a texture asynchronously
   */
  private loadTexture(item: TexturePriority): void {
    const { id, url, desiredResolution } = item;

    this.loading.add(id);

    this.textureLoader.load(
      url,
      (texture) => {
        texture.userData.resolution = desiredResolution;
        
        const tile: TextureTile = {
          id,
          url,
          resolution: desiredResolution,
          texture,
          lastUsed: performance.now(),
          refCount: 1,
        };

        this.textureCache.set(id, tile);
        this.loading.delete(id);
        this.logger.debug(`Texture loaded: ${id} (${desiredResolution}px)`);
      },
      undefined,
      (error) => {
        this.loading.delete(id);
        this.logger.error(`Failed to load texture: ${id}`, error);
      }
    );
  }

  /**
   * Release texture reference
   */
  releaseTexture(id: string): void {
    const tile = this.textureCache.get(id);
    if (tile) {
      tile.refCount--;
      if (tile.refCount <= 0) {
        tile.lastUsed = performance.now();
      }
    }
  }

  /**
   * Clean up unused textures
   */
  cleanup(maxAgeMs: number = 30000): void {
    const now = performance.now();
    let cleaned = 0;

    this.textureCache.forEach((tile, id) => {
      if (tile.refCount <= 0 && now - tile.lastUsed > maxAgeMs) {
        tile.texture.dispose();
        this.textureCache.delete(id);
        cleaned++;
      }
    });

    // If cache is still too large, evict oldest
    if (this.textureCache.size > this.config.maxTextureCacheSize) {
      const sorted = Array.from(this.textureCache.entries())
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      const toEvict = sorted.slice(0, this.textureCache.size - this.config.maxTextureCacheSize);
      toEvict.forEach(([id, tile]) => {
        tile.texture.dispose();
        this.textureCache.delete(id);
        cleaned++;
      });
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} textures`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { cacheSize: number; loading: number; queueSize: number } {
    return {
      cacheSize: this.textureCache.size,
      loading: this.loading.size,
      queueSize: this.loadQueue.length,
    };
  }

  /**
   * Clear all textures
   */
  clear(): void {
    this.textureCache.forEach(tile => tile.texture.dispose());
    this.textureCache.clear();
    this.loadQueue = [];
    this.loading.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clear();
  }
}

// ============================================
// Instance Renderer
// ============================================

export class InstanceRenderer {
  private batches: Map<string, InstanceBatch> = new Map();
  private scene: THREE.Scene;
  private config: OptimizationConfig;
  private logger: ILogger;

  constructor(scene: THREE.Scene, config: Partial<OptimizationConfig> = {}, logger?: ILogger) {
    this.scene = scene;
    this.config = { ...OPTIMIZATION_DEFAULTS, ...config };
    this.logger = logger ?? new NullLogger();
  }

  /**
   * Register a geometry/material combination for instancing
   */
  registerBatch(
    batchId: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxCount: number = this.config.instanceBatchSize
  ): void {
    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.visible = false; // Hidden until instances are added

    const batch: InstanceBatch = {
      geometry,
      material,
      mesh,
      count: 0,
      maxCount,
      matrices: new Float32Array(maxCount * 16),
      colors: new Float32Array(maxCount * 4),
    };

    this.batches.set(batchId, batch);
    this.scene.add(mesh);

    this.logger.debug(`Registered instance batch: ${batchId} (max: ${maxCount})`);
  }

  /**
   * Add an instance to a batch
   */
  addInstance(
    batchId: string,
    matrix: THREE.Matrix4,
    color?: THREE.Color
  ): number | null {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    if (batch.count >= batch.maxCount) {
      this.logger.warn(`Batch ${batchId} is full`);
      return null;
    }

    const index = batch.count++;

    // Set matrix
    matrix.toArray(batch.matrices, index * 16);

    // Set color (default to white)
    if (color) {
      batch.colors[index * 4] = color.r;
      batch.colors[index * 4 + 1] = color.g;
      batch.colors[index * 4 + 2] = color.b;
      batch.colors[index * 4 + 3] = 1.0;
    } else {
      batch.colors[index * 4] = 1.0;
      batch.colors[index * 4 + 1] = 1.0;
      batch.colors[index * 4 + 2] = 1.0;
      batch.colors[index * 4 + 3] = 1.0;
    }

    // Update mesh
    batch.mesh.instanceMatrix.needsUpdate = true;
    batch.mesh.visible = true;

    return index;
  }

  /**
   * Update an instance's transform
   */
  updateInstance(batchId: string, index: number, matrix: THREE.Matrix4): boolean {
    const batch = this.batches.get(batchId);
    if (!batch || index >= batch.count) return false;

    matrix.toArray(batch.matrices, index * 16);
    batch.mesh.instanceMatrix.needsUpdate = true;

    return true;
  }

  /**
   * Update all instances in a batch
   */
  updateBatch(batchId: string, matrices: THREE.Matrix4[]): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.count = Math.min(matrices.length, batch.maxCount);

    for (let i = 0; i < batch.count; i++) {
      matrices[i].toArray(batch.matrices, i * 16);
    }

    batch.mesh.count = batch.count;
    batch.mesh.instanceMatrix.needsUpdate = true;
    batch.mesh.visible = batch.count > 0;
  }

  /**
   * Clear all instances from a batch
   */
  clearBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.count = 0;
    batch.mesh.count = 0;
    batch.mesh.visible = false;
  }

  /**
   * Get batch statistics
   */
  getBatchStats(batchId: string): { count: number; maxCount: number; utilization: number } | null {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    return {
      count: batch.count,
      maxCount: batch.maxCount,
      utilization: batch.count / batch.maxCount,
    };
  }

  /**
   * Get all batch statistics
   */
  getAllStats(): Array<{ batchId: string; count: number; maxCount: number; utilization: number }> {
    return Array.from(this.batches.entries()).map(([batchId, batch]) => ({
      batchId,
      count: batch.count,
      maxCount: batch.maxCount,
      utilization: batch.count / batch.maxCount,
    }));
  }

  /**
   * Dispose of a batch
   */
  disposeBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    this.scene.remove(batch.mesh);
    batch.mesh.dispose();
    this.batches.delete(batchId);
  }

  /**
   * Dispose of all batches
   */
  dispose(): void {
    this.batches.forEach((_, batchId) => this.disposeBatch(batchId));
    this.batches.clear();
  }
}

// ============================================
// Object Pool
// ============================================

export class ObjectPool<T extends THREE.Object3D> {
  private pool: PooledObject[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  private logger: ILogger;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 100,
    logger?: ILogger
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    this.logger = logger ?? new NullLogger();
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    // Find available object
    const available = this.pool.find(p => !p.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsed = performance.now();
      return available.object as T;
    }

    // Create new if under max size
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      const pooled: PooledObject = {
        id: obj.uuid,
        object: obj,
        inUse: true,
        lastUsed: performance.now(),
      };
      this.pool.push(pooled);
      return obj;
    }

    // Return oldest object if pool is full
    const oldest = this.pool.reduce((oldest, current) =>
      !current.inUse || current.lastUsed < oldest.lastUsed ? current : oldest
    );
    oldest.inUse = true;
    oldest.lastUsed = performance.now();
    this.reset(oldest.object as T);
    return oldest.object as T;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    const pooled = this.pool.find(p => p.object === obj);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = performance.now();
      this.reset(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { total: number; inUse: number; available: number } {
    const inUse = this.pool.filter(p => p.inUse).length;
    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse,
    };
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.pool = [];
  }
}

// ============================================
// Performance Monitor
// ============================================

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fpsUpdateInterval = 500; // ms
  private lastFpsUpdate = performance.now();
  private currentFps = 60;
  private logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger ?? new NullLogger();
  }

  /**
   * Record a frame
   */
  recordFrame(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    this.frameCount++;

    // Update FPS periodically
    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.currentFps = 1000 / avgFrameTime;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.currentFps);
  }

  /**
   * Get average frame time (ms)
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  /**
   * Get 95th percentile frame time
   */
  getP95FrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.frameTimes = [];
    this.frameCount = 0;
    this.currentFps = 60;
  }
}

// ============================================
// Main Optimization Manager
// ============================================

export class MapOptimizationManager {
  private config: OptimizationConfig;
  private logger: ILogger;
  private frustumCuller: MapFrustumCuller | null = null;
  private textureManager: TextureStreamManager | null = null;
  private instanceRenderer: InstanceRenderer | null = null;
  private performanceMonitor: PerformanceMonitor;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<OptimizationConfig> = {},
    logger?: ILogger
  ) {
    this.config = { ...OPTIMIZATION_DEFAULTS, ...config };
    this.logger = logger ?? new ConsoleLogger();
    this.performanceMonitor = new PerformanceMonitor(this.logger);

    if (this.config.enableFrustumCulling) {
      this.frustumCuller = new MapFrustumCuller(camera, {
        occlusionCulling: this.config.enableOcclusionCulling,
      });
    }

    if (this.config.enableTextureStreaming) {
      this.textureManager = new TextureStreamManager(this.config, this.logger);
    }

    if (this.config.enableInstancing) {
      this.instanceRenderer = new InstanceRenderer(scene, this.config, this.logger);
    }
  }

  /**
   * Update all optimization systems
   */
  update(): void {
    const startTime = performance.now();

    // Update frustum culling
    this.frustumCuller?.update();

    // Update texture streaming
    this.textureManager?.update();

    // Record frame
    this.performanceMonitor.recordFrame();

    const frameTime = performance.now() - startTime;
    if (frameTime > 16) {
      this.logger.warn(`Optimization update took ${frameTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get the frustum culler
   */
  getFrustumCuller(): MapFrustumCuller | null {
    return this.frustumCuller;
  }

  /**
   * Get the texture manager
   */
  getTextureManager(): TextureStreamManager | null {
    return this.textureManager;
  }

  /**
   * Get the instance renderer
   */
  getInstanceRenderer(): InstanceRenderer | null {
    return this.instanceRenderer;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    fps: number;
    avgFrameTime: number;
    p95FrameTime: number;
    cullingStats: CullingStats | null;
    textureStats: { cacheSize: number; loading: number; queueSize: number } | null;
    instanceStats: Array<{ batchId: string; count: number; maxCount: number; utilization: number }> | null;
  } {
    return {
      fps: this.performanceMonitor.getFPS(),
      avgFrameTime: this.performanceMonitor.getAverageFrameTime(),
      p95FrameTime: this.performanceMonitor.getP95FrameTime(),
      cullingStats: this.frustumCuller?.getStats() ?? null,
      textureStats: this.textureManager?.getStats() ?? null,
      instanceStats: this.instanceRenderer?.getAllStats() ?? null,
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.frustumCuller?.clearMapObjects();
    this.textureManager?.dispose();
    this.instanceRenderer?.dispose();
    this.performanceMonitor.reset();
  }
}

// ============================================
// Exports
// ============================================

export {
  OPTIMIZATION_DEFAULTS,
};

export type {
  ILogger,
};

export {
  ConsoleLogger,
  NullLogger,
};
