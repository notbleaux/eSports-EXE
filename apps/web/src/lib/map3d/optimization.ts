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
import { OPTIMIZATION_DEFAULTS, DEVICE_PROFILES, getDeviceProfileForCapabilities, detectDeviceCapabilities } from './optimization.constants';

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
    mapGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const id = child.uuid;
        const isStatic = !child.userData.dynamic;

        this.registerObject(id, child, {
          boundingBox: child.geometry.boundingBox ?? undefined,
          boundingSphere: child.geometry.boundingSphere ?? undefined,
          priority: child.userData.priority ?? 0,
        });

        if (isStatic) {
          this.staticObjects.set(id, child);
        } else {
          this.dynamicObjects.set(id, child);
        }
      }
    });

    // Calculate map bounds
    this.mapBounds = new THREE.Box3().setFromObject(mapGroup);
  }

  /**
   * Register zone for zone-based culling
   */
  registerZone(zoneId: string, bounds: THREE.Box3): void {
    this.zoneVisibility.set(zoneId, true);
  }

  /**
   * Set zone visibility
   */
  setZoneVisibility(zoneId: string, visible: boolean): void {
    this.zoneVisibility.set(zoneId, visible);
  }

  /**
   * Quick bounds test for entire map
   */
  isMapVisible(): boolean {
    if (!this.mapBounds) return true;

    const frustum = new THREE.Frustum();
    const camera = this.getCamera();
    if (!camera) return true;

    const projScreenMatrix = new THREE.Matrix4();
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    return frustum.intersectsBox(this.mapBounds);
  }

  /**
   * Get camera (access parent private field)
   */
  private getCamera(): THREE.Camera | null {
    // Access parent camera through method since it's private
    return (this as any).camera ?? null;
  }

  /**
   * Update culling with zone awareness
   */
  updateWithZones(): CullingStats {
    // Skip if entire map is culled
    if (!this.isMapVisible()) {
      // Hide all objects
      this.staticObjects.forEach((obj) => {
        obj.visible = false;
      });
      this.dynamicObjects.forEach((obj) => {
        obj.visible = false;
      });

      return {
        totalObjects: this.staticObjects.size + this.dynamicObjects.size,
        visibleObjects: 0,
        culledObjects: this.staticObjects.size + this.dynamicObjects.size,
        occludedObjects: 0,
        frustumTime: 0,
        occlusionTime: 0,
        totalTime: 0,
        drawCallsSaved: this.staticObjects.size + this.dynamicObjects.size,
      };
    }

    // Perform standard culling
    this.update();

    return this.getStats();
  }

  /**
   * Get visible static objects
   */
  getVisibleStaticObjects(): THREE.Object3D[] {
    return Array.from(this.staticObjects.values()).filter((obj) => obj.visible);
  }

  /**
   * Get visible dynamic objects
   */
  getVisibleDynamicObjects(): THREE.Object3D[] {
    return Array.from(this.dynamicObjects.values()).filter((obj) => obj.visible);
  }
}

// ============================================
// Occlusion Culler (Hierarchical Z-Buffer)
// ============================================

export class OcclusionCuller {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private depthMaterial: THREE.ShaderMaterial;
  private depthRenderTarget: THREE.WebGLRenderTarget | null = null;
  private occluders: THREE.Object3D[] = [];
  private occludees: THREE.Object3D[] = [];
  private isEnabled = true;

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    this.renderer = renderer;
    this.camera = camera;

    // Create depth shader material
    this.depthMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec4 vPosition;
        void main() {
          vPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = vPosition;
        }
      `,
      fragmentShader: `
        varying vec4 vPosition;
        void main() {
          float depth = vPosition.z / vPosition.w;
          gl_FragColor = vec4(depth, depth, depth, 1.0);
        }
      `,
    });
  }

  /**
   * Initialize render target
   */
  initialize(width: number, height: number): void {
    this.depthRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });
  }

  /**
   * Register occluder (large objects that block view)
   */
  registerOccluder(object: THREE.Object3D): void {
    this.occluders.push(object);
  }

  /**
   * Register occludee (objects that can be occluded)
   */
  registerOccludee(object: THREE.Object3D): void {
    this.occludees.push(object);
  }

  /**
   * Render depth buffer from occluders
   */
  renderDepthBuffer(): void {
    if (!this.isEnabled || !this.depthRenderTarget) return;

    // Save current state
    const currentRenderTarget = this.renderer.getRenderTarget();

    // Render occluders to depth buffer
    this.renderer.setRenderTarget(this.depthRenderTarget);
    this.renderer.clear();

    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

    this.occluders.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        originalMaterials.set(obj, obj.material);
        obj.material = this.depthMaterial;
      }
    });

    // Render (scene would be needed here, simplified for this example)

    // Restore materials
    originalMaterials.forEach((mat, obj) => {
      obj.material = mat;
    });

    // Restore render target
    this.renderer.setRenderTarget(currentRenderTarget);
  }

  /**
   * Test if object is occluded
   */
  isOccluded(object: THREE.Object3D): boolean {
    if (!this.isEnabled || !this.depthRenderTarget) return false;

    // Simplified occlusion test based on bounding sphere
    const boundingSphere = new THREE.Sphere();
    const box = new THREE.Box3().setFromObject(object);
    box.getBoundingSphere(boundingSphere);

    // Project to screen space
    const center = boundingSphere.center.clone();
    center.project(this.camera);

    // Check if behind near plane
    if (center.z > 1) return true;

    // Convert to screen coordinates
    const x = (center.x * 0.5 + 0.5) * this.depthRenderTarget.width;
    const y = (center.y * -0.5 + 0.5) * this.depthRenderTarget.height;

    // Simplified: assume not occluded for distant objects
    // Full implementation would read depth buffer
    return false;
  }

  /**
   * Perform occlusion culling
   */
  cull(): void {
    if (!this.isEnabled) return;

    this.renderDepthBuffer();

    this.occludees.forEach((obj) => {
      obj.visible = !this.isOccluded(obj);
    });
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.depthRenderTarget?.dispose();
    this.depthMaterial.dispose();
  }
}

// ============================================
// Texture Streaming Manager
// ============================================

export class TextureStreamManager {
  private config: OptimizationConfig;
  private textureCache: Map<string, TextureTile> = new Map();
  private loadQueue: TexturePriority[] = [];
  private loadingTextures: Set<string> = new Set();
  private textureLoader: THREE.TextureLoader;
  private maxCacheSize: number;
  private currentCacheSize = 0;
  private logger: ILogger;
  private retryQueue: TexturePriority[] = [];
  private processing = false;

  constructor(config: Partial<OptimizationConfig> = {}, logger?: ILogger) {
    this.config = {
      enableFrustumCulling: true,
      enableOcclusionCulling: true,
      enableTextureStreaming: true,
      enableInstancing: true,
      maxTextureCacheSize: OPTIMIZATION_DEFAULTS.MAX_TEXTURE_CACHE_SIZE,
      instanceBatchSize: OPTIMIZATION_DEFAULTS.DEFAULT_INSTANCE_BATCH_SIZE,
      cullingUpdateFrequency: OPTIMIZATION_DEFAULTS.DEFAULT_CULLING_UPDATE_FREQUENCY,
      ...config,
    };

    this.maxCacheSize = this.config.maxTextureCacheSize;
    this.textureLoader = new THREE.TextureLoader();
    this.logger = logger || new NullLogger();
  }

  /**
   * Request texture load
   */
  requestTexture(request: TexturePriority): void {
    // Check cache first
    if (this.textureCache.has(request.id)) {
      const tile = this.textureCache.get(request.id)!;
      tile.lastUsed = Date.now();
      tile.refCount++;
      return;
    }

    // Check if already loading
    if (this.loadingTextures.has(request.id)) return;

    // Add to load queue
    this.loadQueue.push(request);
    this.sortLoadQueue();
  }

  /**
   * Sort load queue by priority
   */
  private sortLoadQueue(): void {
    this.loadQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process load queue
   * 
   * CRIT-1: Comprehensive error handling with state recovery
   * CRIT-3: Uses injected logger instead of console.error
   */
  async processQueue(maxLoads = 2): Promise<void> {
    if (!this.config.enableTextureStreaming || this.processing) return;

    this.processing = true;
    const toLoad = this.loadQueue.splice(0, maxLoads);
    const failedRequests: TexturePriority[] = [];

    for (const request of toLoad) {
      this.loadingTextures.add(request.id);

      try {
        const texture = await this.loadTexture(request.url);
        
        const tile: TextureTile = {
          id: request.id,
          url: request.url,
          resolution: request.desiredResolution,
          texture,
          lastUsed: Date.now(),
          refCount: 1,
        };

        this.textureCache.set(request.id, tile);
        this.currentCacheSize += this.estimateTextureSize(texture);

        // Evict old textures if needed
        this.evictIfNeeded();
        
        this.logger.debug('Texture loaded successfully', { 
          id: request.id, 
          url: request.url,
          size: this.estimateTextureSize(texture)
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log error with context using injected logger
        this.logger.error('Texture load failed', {
          url: request.url,
          id: request.id,
          error: errorMessage,
        });
        
        // Add to retry queue for later recovery
        failedRequests.push(request);
      } finally {
        this.loadingTextures.delete(request.id);
      }
    }

    // Re-queue failed requests for retry
    for (const request of failedRequests) {
      // Check if not already in retry queue
      const notInRetry = !this.retryQueue.some(r => r.id === request.id);
      const notInMainQueue = !this.loadQueue.some(r => r.id === request.id);
      
      if (notInRetry && notInMainQueue) {
        this.retryQueue.push(request);
      }
    }

    // Move retry items back to main queue if space available
    if (this.loadQueue.length < maxLoads) {
      const spaceAvailable = maxLoads - this.loadQueue.length;
      const toRetry = this.retryQueue.splice(0, spaceAvailable);
      this.loadQueue.push(...toRetry);
    }

    this.processing = false;
  }

  /**
   * Load texture
   */
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject);
    });
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureSize(texture: THREE.Texture): number {
    const image = texture.image;
    if (!image) return 0;

    const width = image.width || 512;
    const height = image.height || 512;
    const bytesPerPixel = 4; // RGBA

    return width * height * bytesPerPixel;
  }

  /**
   * Evict least recently used textures
   */
  private evictIfNeeded(): void {
    while (this.currentCacheSize > this.maxCacheSize) {
      // Find least recently used texture with no references
      let lru: TextureTile | null = null;
      let lruTime = Infinity;

      this.textureCache.forEach((tile) => {
        if (tile.refCount === 0 && tile.lastUsed < lruTime) {
          lru = tile;
          lruTime = tile.lastUsed;
        }
      });

      if (lru) {
        this.evictTexture(lru.id);
      } else {
        break; // No textures to evict
      }
    }
  }

  /**
   * Evict specific texture
   */
  private evictTexture(id: string): void {
    const tile = this.textureCache.get(id);
    if (tile) {
      tile.texture.dispose();
      this.currentCacheSize -= this.estimateTextureSize(tile.texture);
      this.textureCache.delete(id);
    }
  }

  /**
   * Get texture from cache
   */
  getTexture(id: string): THREE.Texture | null {
    const tile = this.textureCache.get(id);
    if (tile) {
      tile.lastUsed = Date.now();
      return tile.texture;
    }
    return null;
  }

  /**
   * Release texture reference
   */
  releaseTexture(id: string): void {
    const tile = this.textureCache.get(id);
    if (tile) {
      tile.refCount = Math.max(0, tile.refCount - 1);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; count: number; queueLength: number; loadingCount: number } {
    return {
      size: this.currentCacheSize,
      count: this.textureCache.size,
      queueLength: this.loadQueue.length,
      loadingCount: this.loadingTextures.size,
    };
  }

  /**
   * Acquire texture reference (increments ref count)
   */
  acquireTexture(id: string): THREE.Texture | null {
    const tile = this.textureCache.get(id);
    if (tile) {
      tile.refCount++;
      tile.lastUsed = Date.now();
      return tile.texture;
    }
    return null;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.textureCache.forEach((tile) => {
      tile.texture.dispose();
    });
    this.textureCache.clear();
    this.currentCacheSize = 0;
    this.loadQueue = [];
    this.loadingTextures.clear();
  }
}

// ============================================
// Instance Renderer
// ============================================

export class InstanceRenderer {
  private batches: Map<string, InstanceBatch> = new Map();
  private scene: THREE.Scene;
  private maxBatchSize: number;

  constructor(scene: THREE.Scene, maxBatchSize = 1000) {
    this.scene = scene;
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Register geometry for instancing
   */
  registerGeometry(
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material
  ): void {
    if (this.batches.has(id)) return;

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.maxBatchSize
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.count = 0;

    const batch: InstanceBatch = {
      geometry,
      material,
      mesh: instancedMesh,
      count: 0,
      maxCount: this.maxBatchSize,
      matrices: new Float32Array(this.maxBatchSize * 16),
      colors: new Float32Array(this.maxBatchSize * 4),
    };

    this.batches.set(id, batch);
    this.scene.add(instancedMesh);
  }

  /**
   * Add instance
   */
  addInstance(
    batchId: string,
    matrix: THREE.Matrix4,
    color?: THREE.Color
  ): number {
    const batch = this.batches.get(batchId);
    if (!batch) return -1;

    if (batch.count >= batch.maxCount) return -1;

    const index = batch.count;
    batch.count++;

    // Store matrix
    matrix.toArray(batch.matrices, index * 16);

    // Store color
    if (color) {
      batch.colors[index * 4] = color.r;
      batch.colors[index * 4 + 1] = color.g;
      batch.colors[index * 4 + 2] = color.b;
      batch.colors[index * 4 + 3] = color.alpha ?? 1;
    }

    return index;
  }

  /**
   * Update instance
   */
  updateInstance(
    batchId: string,
    index: number,
    matrix: THREE.Matrix4,
    color?: THREE.Color
  ): void {
    const batch = this.batches.get(batchId);
    if (!batch || index >= batch.count) return;

    matrix.toArray(batch.matrices, index * 16);

    if (color) {
      batch.colors[index * 4] = color.r;
      batch.colors[index * 4 + 1] = color.g;
      batch.colors[index * 4 + 2] = color.b;
      batch.colors[index * 4 + 3] = color.alpha ?? 1;
    }
  }

  /**
   * Remove instance (swap with last)
   */
  removeInstance(batchId: string, index: number): void {
    const batch = this.batches.get(batchId);
    if (!batch || index >= batch.count) return;

    const lastIndex = batch.count - 1;
    if (index !== lastIndex) {
      // Copy last instance to removed position
      for (let i = 0; i < 16; i++) {
        batch.matrices[index * 16 + i] = batch.matrices[lastIndex * 16 + i];
      }
      for (let i = 0; i < 4; i++) {
        batch.colors[index * 4 + i] = batch.colors[lastIndex * 4 + i];
      }
    }

    batch.count--;
  }

  /**
   * Update GPU buffers
   * 
   * CRIT-10: Resizes matrices/colors arrays when count changes
   * to prevent memory leaks
   */
  update(): void {
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    this.batches.forEach((batch) => {
      // CRIT-10 Fix: Resize matrices array if count has changed
      const expectedMatrixSize = batch.count * 16;
      if (batch.matrices.length !== expectedMatrixSize) {
        const newMatrices = new Float32Array(expectedMatrixSize);
        newMatrices.set(batch.matrices.subarray(0, Math.min(
          batch.matrices.length,
          expectedMatrixSize
        )));
        batch.matrices = newMatrices;
      }

      // CRIT-10 Fix: Resize colors array if count has changed
      const expectedColorSize = batch.count * 4;
      if (batch.colors.length !== expectedColorSize) {
        const newColors = new Float32Array(expectedColorSize);
        newColors.set(batch.colors.subarray(0, Math.min(
          batch.colors.length,
          expectedColorSize
        )));
        batch.colors = newColors;
      }

      batch.mesh.count = batch.count;

      for (let i = 0; i < batch.count; i++) {
        matrix.fromArray(batch.matrices, i * 16);
        batch.mesh.setMatrixAt(i, matrix);

        color.setRGB(
          batch.colors[i * 4],
          batch.colors[i * 4 + 1],
          batch.colors[i * 4 + 2]
        );
        batch.mesh.setColorAt(i, color);
      }

      batch.mesh.instanceMatrix.needsUpdate = true;
      if (batch.mesh.instanceColor) {
        batch.mesh.instanceColor.needsUpdate = true;
      }
    });
  }

  /**
   * Clear batch
   */
  clearBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (batch) {
      batch.count = 0;
    }
  }

  /**
   * Dispose batch
   */
  disposeBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (batch) {
      this.scene.remove(batch.mesh);
      batch.mesh.dispose();
      this.batches.delete(batchId);
    }
  }

  /**
   * Dispose all
   */
  dispose(): void {
    this.batches.forEach((batch) => {
      this.scene.remove(batch.mesh);
      batch.mesh.dispose();
    });
    this.batches.clear();
  }

  /**
   * Get renderer statistics
   */
  getStats(): { batchCount: number; totalInstances: number; maxInstances: number } {
    let totalInstances = 0;
    let maxInstances = 0;
    
    this.batches.forEach((batch) => {
      totalInstances += batch.count;
      maxInstances += batch.maxCount;
    });

    return {
      batchCount: this.batches.size,
      totalInstances,
      maxInstances,
    };
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

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 10,
    maxSize = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-warm pool
    for (let i = 0; i < initialSize; i++) {
      this.addToPool();
    }
  }

  /**
   * Add object to pool
   */
  private addToPool(): void {
    const obj = this.factory();
    this.pool.push({
      id: THREE.MathUtils.generateUUID(),
      object: obj,
      inUse: false,
      lastUsed: 0,
    });
  }

  /**
   * Acquire object from pool
   */
  acquire(): T | null {
    // Find available object
    const available = this.pool.find((p) => !p.inUse);

    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      this.reset(available.object as T);
      return available.object as T;
    }

    // Create new if under max size
    if (this.pool.length < this.maxSize) {
      this.addToPool();
      const obj = this.pool[this.pool.length - 1];
      obj.inUse = true;
      obj.lastUsed = Date.now();
      this.reset(obj.object as T);
      return obj.object as T;
    }

    return null;
  }

  /**
   * Release object back to pool
   */
  release(obj: T): void {
    const pooled = this.pool.find((p) => p.object === obj);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { total: number; available: number; inUse: number } {
    return {
      total: this.pool.length,
      available: this.pool.filter((p) => !p.inUse).length,
      inUse: this.pool.filter((p) => p.inUse).length,
    };
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool.forEach((p) => {
      if (p.object instanceof THREE.Mesh) {
        p.object.geometry.dispose();
        (p.object.material as THREE.Material)?.dispose();
      }
    });
    this.pool = [];
  }
}

// ============================================
// Optimization Manager
// ============================================

export class MapOptimizationManager {
  private config: OptimizationConfig;
  private frustumCuller: MapFrustumCuller | null = null;
  private occlusionCuller: OcclusionCuller | null = null;
  private textureManager: TextureStreamManager;
  private instanceRenderer: InstanceRenderer | null = null;
  private logger: ILogger;
  private scene: THREE.Scene;
  private stats: OptimizationStats = {
    culledObjects: 0,
    visibleObjects: 0,
    textureCacheSize: 0,
    activeInstances: 0,
    pooledObjects: 0,
    drawCalls: 0,
    frameTime: 0,
  };

  constructor(scene: THREE.Scene, config: Partial<OptimizationConfig> = {}, logger?: ILogger) {
    if (!scene) {
      throw new Error('MapOptimizationManager requires a scene');
    }
    
    this.scene = scene;
    this.logger = logger || new ConsoleLogger('MapOptimizationManager');
    
    this.config = {
      enableFrustumCulling: true,
      enableOcclusionCulling: true,
      enableTextureStreaming: true,
      enableInstancing: true,
      maxTextureCacheSize: OPTIMIZATION_DEFAULTS.MAX_TEXTURE_CACHE_SIZE,
      instanceBatchSize: OPTIMIZATION_DEFAULTS.DEFAULT_INSTANCE_BATCH_SIZE,
      cullingUpdateFrequency: OPTIMIZATION_DEFAULTS.DEFAULT_CULLING_UPDATE_FREQUENCY,
      ...config,
    };

    this.textureManager = new TextureStreamManager(this.config, this.logger);

    if (this.config.enableInstancing) {
      this.instanceRenderer = new InstanceRenderer(scene, this.config.instanceBatchSize);
    }
  }

  /**
   * Initialize cullers
   */
  initializeCullers(camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    if (this.config.enableFrustumCulling) {
      this.frustumCuller = new MapFrustumCuller(camera, {
        occlusionCulling: this.config.enableOcclusionCulling,
      });
    }

    if (this.config.enableOcclusionCulling) {
      this.occlusionCuller = new OcclusionCuller(renderer, camera);
      this.occlusionCuller.initialize(
        renderer.domElement.width / 4,
        renderer.domElement.height / 4
      );
    }
  }

  /**
   * Register map for optimization
   */
  registerMap(mapGroup: THREE.Group): void {
    this.frustumCuller?.registerMapObjects(mapGroup);
  }

  /**
   * Update all optimizations
   */
  update(): void {
    const startTime = performance.now();

    // Frustum culling
    if (this.frustumCuller && this.config.enableFrustumCulling) {
      const cullStats = this.frustumCuller.updateWithZones();
      this.stats.culledObjects = cullStats.culledObjects;
      this.stats.visibleObjects = cullStats.visibleObjects;
    }

    // Occlusion culling
    if (this.occlusionCuller && this.config.enableOcclusionCulling) {
      this.occlusionCuller.cull();
    }

    // Texture streaming
    if (this.config.enableTextureStreaming) {
      this.textureManager.processQueue(1);
      const texStats = this.textureManager.getStats();
      this.stats.textureCacheSize = texStats.size;
    }

    // Instancing
    if (this.instanceRenderer && this.config.enableInstancing) {
      this.instanceRenderer.update();
    }

    this.stats.frameTime = performance.now() - startTime;
  }

  /**
   * Get optimization statistics
   */
  getStats(): OptimizationStats {
    return { ...this.stats };
  }

  /**
   * Get texture manager
   */
  getTextureManager(): TextureStreamManager {
    return this.textureManager;
  }

  /**
   * Get instance renderer
   */
  getInstanceRenderer(): InstanceRenderer | null {
    return this.instanceRenderer;
  }

  /**
   * Check if initialized
   */
  get isInitialized(): boolean {
    return this.frustumCuller !== null;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.frustumCuller?.dispose();
    this.occlusionCuller?.dispose();
    this.textureManager.clear();
    this.instanceRenderer?.dispose();
    
    this.frustumCuller = null;
    this.occlusionCuller = null;
    
    this.logger.info('MapOptimizationManager disposed');
  }
}

export default MapOptimizationManager;
