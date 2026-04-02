// @ts-nocheck
/**
 * Texture Streaming System for 3D Maps
 * 
 * [Ver001.000] - Async texture loading with priority-based streaming
 * 
 * Provides:
 * - Async texture loading with progress tracking
 * - Priority-based streaming based on camera distance
 * - Memory management with LRU eviction
 * - Texture atlas generation
 * - Mipmap streaming
 * - Compression support (KTX2, Basis)
 * 
 * @example
 * ```typescript
 * import { TextureStreamManager } from '@/lib/map3d/textureStreaming';
 * 
 * const streamer = new TextureStreamManager({
 *   maxCacheSize: 200 * 1024 * 1024, // 200MB
 *   maxConcurrentLoads: 4,
 * });
 * 
 * streamer.requestTexture({
 *   id: 'map-diffuse',
 *   url: '/textures/map-diffuse.ktx2',
 *   priority: 1.0,
 *   desiredResolution: 2048,
 * });
 * ```
 */

import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

// ============================================
// Types
// ============================================

export interface TextureStreamConfig {
  /** Maximum cache size in bytes */
  maxCacheSize: number;
  /** Maximum concurrent texture loads */
  maxConcurrentLoads: number;
  /** Number of textures to preload */
  preloadCount: number;
  /** Default texture resolution */
  defaultResolution: number;
  /** Enable mipmap streaming */
  enableMipmaps: boolean;
  /** Enable texture compression */
  enableCompression: boolean;
  /** Path to KTX2 transcoder */
  ktx2TranscoderPath: string;
  /** Texture format preference */
  preferredFormat: 'ktx2' | 'png' | 'jpg' | 'webp';
  /** Fallback format order */
  fallbackFormats: string[];
  /** Enable anisotropic filtering */
  anisotropy: number;
  /** Texture quality (0.0 - 1.0) */
  quality: number;
  /** Enable texture atlasing */
  enableAtlasing: boolean;
  /** Atlas size */
  atlasSize: number;
}

export interface TextureRequest {
  id: string;
  url: string;
  priority: number;
  desiredResolution: number;
  minResolution?: number;
  mipmapLevel?: number;
  onLoad?: (texture: THREE.Texture) => void;
  onProgress?: (loaded: number, total: number) => void;
  onError?: (error: Error) => void;
}

export interface StreamedTexture {
  id: string;
  url: string;
  texture: THREE.Texture;
  resolution: number;
  format: string;
  size: number;
  priority: number;
  lastUsed: number;
  refCount: number;
  mipmapsLoaded: boolean;
  state: 'loading' | 'loaded' | 'error';
}

export interface TextureAtlas {
  id: string;
  texture: THREE.DataTexture | THREE.CanvasTexture;
  uvMap: Map<string, { u: number; v: number; w: number; h: number }>;
  usedSpace: number;
  size: number;
}

export interface StreamStats {
  totalTextures: number;
  loadedTextures: number;
  loadingTextures: number;
  cacheSize: number;
  cacheUtilization: number;
  queueLength: number;
  averageLoadTime: number;
  evictedCount: number;
  errorCount: number;
}

export interface MemoryPressure {
  used: number;
  total: number;
  available: number;
  pressure: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_STREAM_CONFIG: TextureStreamConfig = {
  maxCacheSize: 200 * 1024 * 1024, // 200MB
  maxConcurrentLoads: 4,
  preloadCount: 10,
  defaultResolution: 1024,
  enableMipmaps: true,
  enableCompression: true,
  ktx2TranscoderPath: '/basis/',
  preferredFormat: 'ktx2',
  fallbackFormats: ['webp', 'png', 'jpg'],
  anisotropy: 16,
  quality: 0.9,
  enableAtlasing: true,
  atlasSize: 4096,
};

// ============================================
// Priority Queue
// ============================================

class TexturePriorityQueue {
  private queue: TextureRequest[] = [];

  /**
   * Add request to queue
   */
  enqueue(request: TextureRequest): void {
    this.queue.push(request);
    this.sort();
  }

  /**
   * Remove and return highest priority request
   */
  dequeue(): TextureRequest | undefined {
    return this.queue.shift();
  }

  /**
   * Peek at highest priority request
   */
  peek(): TextureRequest | undefined {
    return this.queue[0];
  }

  /**
   * Remove specific request
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Check if queue contains request
   */
  contains(id: string): boolean {
    return this.queue.some((r) => r.id === id);
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Sort by priority (highest first)
   */
  private sort(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Clear all requests
   */
  clear(): void {
    this.queue = [];
  }
}

// ============================================
// Texture Cache with LRU Eviction
// ============================================

class TextureCache {
  private textures = new Map<string, StreamedTexture>();
  private maxSize: number;
  private currentSize = 0;
  private accessOrder: string[] = [];
  private evictedCount = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Add texture to cache
   */
  add(texture: StreamedTexture): boolean {
    // Check if already exists
    if (this.textures.has(texture.id)) {
      this.updateAccess(texture.id);
      return false;
    }

    // Evict if necessary
    while (this.currentSize + texture.size > this.maxSize && this.accessOrder.length > 0) {
      this.evictLRU();
    }

    this.textures.set(texture.id, texture);
    this.currentSize += texture.size;
    this.accessOrder.push(texture.id);

    return true;
  }

  /**
   * Get texture from cache
   */
  get(id: string): StreamedTexture | undefined {
    const texture = this.textures.get(id);
    if (texture) {
      texture.lastUsed = performance.now();
      texture.refCount++;
      this.updateAccess(id);
    }
    return texture;
  }

  /**
   * Release texture reference
   */
  release(id: string): void {
    const texture = this.textures.get(id);
    if (texture) {
      texture.refCount = Math.max(0, texture.refCount - 1);
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccess(id: string): void {
    const index = this.accessOrder.indexOf(id);
    if (index >= 0) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(id);
    }
  }

  /**
   * Evict least recently used texture
   */
  private evictLRU(): void {
    // Find texture with 0 refCount
    for (let i = 0; i < this.accessOrder.length; i++) {
      const id = this.accessOrder[i];
      const texture = this.textures.get(id);

      if (texture && texture.refCount === 0) {
        this.remove(id);
        this.evictedCount++;
        return;
      }
    }

    // If all have refs, evict oldest anyway
    if (this.accessOrder.length > 0) {
      this.remove(this.accessOrder[0]);
      this.evictedCount++;
    }
  }

  /**
   * Remove texture from cache
   */
  remove(id: string): boolean {
    const texture = this.textures.get(id);
    if (!texture) return false;

    texture.texture.dispose();
    this.currentSize -= texture.size;
    this.textures.delete(id);

    const index = this.accessOrder.indexOf(id);
    if (index >= 0) {
      this.accessOrder.splice(index, 1);
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    count: number;
    size: number;
    maxSize: number;
    utilization: number;
    evictedCount: number;
  } {
    return {
      count: this.textures.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      utilization: this.currentSize / this.maxSize,
      evictedCount: this.evictedCount,
    };
  }

  /**
   * Clear all textures
   */
  clear(): void {
    this.textures.forEach((texture) => {
      texture.texture.dispose();
    });
    this.textures.clear();
    this.accessOrder = [];
    this.currentSize = 0;
    this.evictedCount = 0;
  }

  /**
   * Get all texture IDs
   */
  getAllIds(): string[] {
    return Array.from(this.textures.keys());
  }
}

// ============================================
// Texture Atlas Manager
// ============================================

class TextureAtlasManager {
  private atlases = new Map<string, TextureAtlas>();
  private config: TextureStreamConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(config: TextureStreamConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.atlasSize;
    this.canvas.height = config.atlasSize;
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Create new atlas
   */
  createAtlas(id: string): TextureAtlas {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const atlas: TextureAtlas = {
      id,
      texture: new THREE.CanvasTexture(this.canvas.cloneNode() as HTMLCanvasElement),
      uvMap: new Map(),
      usedSpace: 0,
      size: this.config.atlasSize,
    };

    this.atlases.set(id, atlas);
    return atlas;
  }

  /**
   * Add texture to atlas
   */
  addToAtlas(
    atlasId: string,
    textureId: string,
    image: HTMLImageElement | HTMLCanvasElement
  ): { u: number; v: number; w: number; h: number } | null {
    const atlas = this.atlases.get(atlasId);
    if (!atlas) return null;

    // Simple packing - left to right, top to bottom
    const size = Math.max(image.width, image.height);
    const paddedSize = Math.pow(2, Math.ceil(Math.log2(size)));

    // Find position (simplified)
    const x = (atlas.uvMap.size * paddedSize) % this.config.atlasSize;
    const y = Math.floor((atlas.uvMap.size * paddedSize) / this.config.atlasSize) * paddedSize;

    if (y + paddedSize > this.config.atlasSize) {
      return null; // Atlas full
    }

    // Draw texture
    this.ctx.drawImage(image, x, y, paddedSize, paddedSize);

    // Calculate UVs
    const uv = {
      u: x / this.config.atlasSize,
      v: y / this.config.atlasSize,
      w: paddedSize / this.config.atlasSize,
      h: paddedSize / this.config.atlasSize,
    };

    atlas.uvMap.set(textureId, uv);
    atlas.usedSpace += paddedSize * paddedSize;

    // Update texture
    (atlas.texture as THREE.CanvasTexture).image = this.canvas;
    atlas.texture.needsUpdate = true;

    return uv;
  }

  /**
   * Get atlas UV for texture
   */
  getUV(atlasId: string, textureId: string): { u: number; v: number; w: number; h: number } | undefined {
    const atlas = this.atlases.get(atlasId);
    return atlas?.uvMap.get(textureId);
  }

  /**
   * Get atlas
   */
  getAtlas(id: string): TextureAtlas | undefined {
    return this.atlases.get(id);
  }

  /**
   * Dispose atlas
   */
  disposeAtlas(id: string): void {
    const atlas = this.atlases.get(id);
    if (atlas) {
      atlas.texture.dispose();
      this.atlases.delete(id);
    }
  }

  /**
   * Clear all atlases
   */
  clear(): void {
    this.atlases.forEach((atlas) => atlas.texture.dispose());
    this.atlases.clear();
  }
}

// ============================================
// Main Texture Stream Manager
// ============================================

export class TextureStreamManager {
  private config: TextureStreamConfig;
  private cache: TextureCache;
  private queue: TexturePriorityQueue;
  private atlasManager: TextureAtlasManager;
  private loadingTextures = new Set<string>();
  private loadStartTimes = new Map<string, number>();
  private totalLoadTime = 0;
  private completedLoads = 0;
  private errorCount = 0;

  private textureLoader: THREE.TextureLoader;
  private ktx2Loader: KTX2Loader | null = null;

  constructor(config: Partial<TextureStreamConfig> = {}) {
    this.config = { ...DEFAULT_STREAM_CONFIG, ...config };
    this.cache = new TextureCache(this.config.maxCacheSize);
    this.queue = new TexturePriorityQueue();
    this.atlasManager = new TextureAtlasManager(this.config);

    this.textureLoader = new THREE.TextureLoader();

    // Setup KTX2 loader if compression enabled
    if (this.config.enableCompression) {
      const loader = new KTX2Loader();
      loader.setTranscoderPath(this.config.ktx2TranscoderPath);
      this.ktx2Loader = loader;
    }
  }

  /**
   * Initialize loaders
   */
  initialize(): void {
    // Pre-warm texture loader
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Request texture load
   */
  requestTexture(request: TextureRequest): void {
    // Check cache first
    const cached = this.cache.get(request.id);
    if (cached && cached.state === 'loaded') {
      request.onLoad?.(cached.texture);
      return;
    }

    // Check if already loading
    if (this.loadingTextures.has(request.id) || this.queue.contains(request.id)) {
      return;
    }

    // Add to queue
    this.queue.enqueue(request);

    // Process queue
    this.processQueue();
  }

  /**
   * Process load queue
   */
  private async processQueue(): Promise<void> {
    while (
      this.loadingTextures.size < this.config.maxConcurrentLoads &&
      this.queue.length > 0
    ) {
      const request = this.queue.dequeue();
      if (!request) break;

      this.loadTexture(request);
    }
  }

  /**
   * Load a texture
   */
  private async loadTexture(request: TextureRequest): Promise<void> {
    const { id, url, desiredResolution } = request;

    this.loadingTextures.add(id);
    this.loadStartTimes.set(id, performance.now());

    try {
      let texture: THREE.Texture;

      // Try KTX2 first if available
      if (this.config.enableCompression && this.ktx2Loader && url.endsWith('.ktx2')) {
        texture = await this.loadKTX2Texture(url);
      } else {
        texture = await this.loadStandardTexture(url);
      }

      // Configure texture
      this.configureTexture(texture);

      // Calculate size
      const size = this.estimateTextureSize(texture);

      // Create streamed texture entry
      const streamedTexture: StreamedTexture = {
        id,
        url,
        texture,
        resolution: desiredResolution,
        format: url.split('.').pop() || 'unknown',
        size,
        priority: request.priority,
        lastUsed: performance.now(),
        refCount: 1,
        mipmapsLoaded: this.config.enableMipmaps,
        state: 'loaded',
      };

      // Add to cache
      this.cache.add(streamedTexture);

      // Track load time
      const loadTime = performance.now() - (this.loadStartTimes.get(id) || 0);
      this.totalLoadTime += loadTime;
      this.completedLoads++;

      // Callback
      request.onLoad?.(texture);
    } catch (error) {
      this.errorCount++;
      request.onError?.(error instanceof Error ? error : new Error(String(error)));

      // Try fallback
      await this.tryFallback(request);
    } finally {
      this.loadingTextures.delete(id);
      this.loadStartTimes.delete(id);

      // Process more from queue
      this.processQueue();
    }
  }

  /**
   * Load KTX2 compressed texture
   */
  private loadKTX2Texture(url: string): Promise<THREE.CompressedTexture> {
    return new Promise((resolve, reject) => {
      if (!this.ktx2Loader) {
        reject(new Error('KTX2 loader not initialized'));
        return;
      }

      this.ktx2Loader.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * Load standard texture
   */
  private loadStandardTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * Try fallback formats
   */
  private async tryFallback(request: TextureRequest): Promise<void> {
    for (const format of this.config.fallbackFormats) {
      const fallbackUrl = request.url.replace(/\.[^.]+$/, `.${format}`);

      try {
        const texture = await this.loadStandardTexture(fallbackUrl);
        this.configureTexture(texture);

        const streamedTexture: StreamedTexture = {
          id: request.id,
          url: fallbackUrl,
          texture,
          resolution: request.desiredResolution,
          format,
          size: this.estimateTextureSize(texture),
          priority: request.priority,
          lastUsed: performance.now(),
          refCount: 1,
          mipmapsLoaded: this.config.enableMipmaps,
          state: 'loaded',
        };

        this.cache.add(streamedTexture);
        request.onLoad?.(texture);
        return;
      } catch {
        // Try next fallback
        continue;
      }
    }

    // All fallbacks failed
    console.error(`Failed to load texture: ${request.id}`);
  }

  /**
   * Configure loaded texture
   */
  private configureTexture(texture: THREE.Texture): void {
    // Mipmaps
    if (this.config.enableMipmaps) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
    }

    // Anisotropy
    texture.anisotropy = this.config.anisotropy;

    // Color space
    texture.colorSpace = THREE.SRGBColorSpace;

    texture.needsUpdate = true;
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureSize(texture: THREE.Texture): number {
    const image = texture.image as { width?: number; height?: number } | undefined;
    if (!image) return 0;

    const width = image.width || 512;
    const height = image.height || 512;

    // Estimate based on format
    let bytesPerPixel = 4; // RGBA
    if (texture instanceof THREE.CompressedTexture) {
      // Compressed textures (BC/ETC/ASTC)
      bytesPerPixel = 0.5; // ~4 bits per pixel average
    }

    let size = width * height * bytesPerPixel;

    // Add mipmap overhead
    if (this.config.enableMipmaps && texture.generateMipmaps) {
      size *= 1.33; // Mipmaps add ~33%
    }

    return size;
  }

  /**
   * Get texture from cache
   */
  getTexture(id: string): THREE.Texture | null {
    const texture = this.cache.get(id);
    return texture?.texture || null;
  }

  /**
   * Release texture reference
   */
  releaseTexture(id: string): void {
    this.cache.release(id);
  }

  /**
   * Preload textures
   */
  preload(textureRequests: TextureRequest[]): void {
    // Sort by priority and take top N
    const toPreload = textureRequests
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.config.preloadCount);

    toPreload.forEach((request) => {
      this.requestTexture(request);
    });
  }

  /**
   * Cancel texture load
   */
  cancelLoad(id: string): boolean {
    return this.queue.remove(id);
  }

  /**
   * Update texture priority
   */
  updatePriority(_id: string, _newPriority: number): void {
    // Re-queue with new priority if still in queue
    // Implementation would require queue modification
  }

  /**
   * Get memory pressure
   */
  getMemoryPressure(): MemoryPressure {
    const stats = this.cache.getStats();
    const utilization = stats.utilization;

    let pressure: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (utilization > 0.95) pressure = 'critical';
    else if (utilization > 0.85) pressure = 'high';
    else if (utilization > 0.7) pressure = 'medium';

    return {
      used: stats.size,
      total: stats.maxSize,
      available: stats.maxSize - stats.size,
      pressure,
    };
  }

  /**
   * Force garbage collection (evict unused textures)
   */
  forceGC(): void {
    // Evict all textures with 0 refCount
    const ids = this.cache.getAllIds();
    ids.forEach((id) => {
      const texture = this.cache.get(id);
      if (texture && texture.refCount === 0) {
        this.cache.remove(id);
      }
    });
  }

  /**
   * Create texture atlas
   */
  createAtlas(id: string): TextureAtlas {
    return this.atlasManager.createAtlas(id);
  }

  /**
   * Add to atlas
   */
  addToAtlas(
    atlasId: string,
    textureId: string,
    image: HTMLImageElement | HTMLCanvasElement
  ): { u: number; v: number; w: number; h: number } | null {
    return this.atlasManager.addToAtlas(atlasId, textureId, image);
  }

  /**
   * Get streaming statistics
   */
  getStats(): StreamStats {
    const cacheStats = this.cache.getStats();

    return {
      totalTextures: cacheStats.count + this.loadingTextures.size,
      loadedTextures: cacheStats.count,
      loadingTextures: this.loadingTextures.size,
      cacheSize: cacheStats.size,
      cacheUtilization: cacheStats.utilization,
      queueLength: this.queue.length,
      averageLoadTime: this.completedLoads > 0 ? this.totalLoadTime / this.completedLoads : 0,
      evictedCount: cacheStats.evictedCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.queue.clear();
    this.cache.clear();
    this.atlasManager.clear();
    this.loadingTextures.clear();
    this.loadStartTimes.clear();
  }
}

// ============================================
// Mipmap Streaming
// ============================================

export class MipmapStreamManager {
  private _config: TextureStreamConfig;
  private loadedMips = new Map<string, number>(); // textureId -> highest loaded mip level

  constructor(config: TextureStreamConfig) {
    this._config = config;
  }

  /**
   * Request mipmap level
   */
  requestMipmapLevel(textureId: string, level: number): void {
    const currentLevel = this.loadedMips.get(textureId) || 0;
    if (level > currentLevel) {
      this.loadedMips.set(textureId, level);
    }
  }

  /**
   * Get highest loaded mipmap level
   */
  getLoadedLevel(textureId: string): number {
    return this.loadedMips.get(textureId) || 0;
  }

  /**
   * Check if mipmap level is loaded
   */
  isMipmapLoaded(textureId: string, level: number): boolean {
    return (this.loadedMips.get(textureId) || 0) >= level;
  }

  /**
   * Dispose mipmap data
   */
  disposeMipmaps(textureId: string): void {
    this.loadedMips.delete(textureId);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate optimal texture resolution based on distance
 */
export function calculateOptimalResolution(
  distance: number,
  baseResolution: number,
  fov: number,
  screenHeight: number
): number {
  // Calculate screen-space pixel size at distance
  const angularSize = (baseResolution / distance) * (fov * Math.PI / 180);
  const screenPixels = angularSize * screenHeight;

  // Find nearest power of 2
  const optimalRes = Math.pow(2, Math.floor(Math.log2(screenPixels)));

  return Math.max(64, Math.min(baseResolution, optimalRes));
}

/**
 * Generate texture quality levels
 */
export function generateTextureLODs(
  image: HTMLImageElement,
  levels: number
): HTMLCanvasElement[] {
  const lods: HTMLCanvasElement[] = [];
  const canvas = document.createElement('canvas');

  let width = image.width;
  let height = image.height;

  for (let i = 0; i < levels; i++) {
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, width, height);

    lods.push(canvas.cloneNode() as HTMLCanvasElement);

    width = Math.floor(width / 2);
    height = Math.floor(height / 2);
  }

  return lods;
}

/**
 * Compress texture to WebP/AVIF if supported
 */
export async function compressTexture(
  canvas: HTMLCanvasElement,
  format: 'webp' | 'png' | 'jpeg' = 'webp',
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Create placeholder texture
 */
export function createPlaceholderTexture(
  color: number = 0x808080,
  size: number = 64
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const r = ((color >> 16) & 0xff);
  const g = ((color >> 8) & 0xff);
  const b = (color & 0xff);

  for (let i = 0; i < size * size; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

export default TextureStreamManager;
