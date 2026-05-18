// @ts-nocheck
/**
 * Texture Atlas System for Mascot 3D Scenes
 * 
 * [Ver001.000] - Texture atlasing and UV remapping for performance
 * 
 * Provides texture atlas generation, UV remapping utilities,
 * and dynamic atlas updates to reduce draw calls in mascot scenes.
 */

import * as THREE from 'three';

/**
 * Atlas item representing a single texture in the atlas
 */
export interface AtlasItem {
  /** Unique identifier */
  id: string;
  /** Source texture */
  texture: THREE.Texture;
  /** Original UV coordinates [u1, v1, u2, v2] */
  originalUVs?: Float32Array;
  /** Atlas UV coordinates (computed) */
  atlasUVs?: Float32Array;
  /** Position in atlas [x, y] */
  position?: { x: number; y: number };
  /** Size in atlas [width, height] */
  size?: { width: number; height: number };
  /** Rotation in atlas (0, 90, 180, 270) */
  rotation?: number;
  /** Priority for packing (higher = packed first) */
  priority?: number;
}

/**
 * Atlas layout configuration
 */
export interface AtlasLayout {
  /** Atlas width in pixels */
  width: number;
  /** Atlas height in pixels */
  height: number;
  /** Item positions */
  items: Map<string, AtlasItemLayout>;
}

/**
 * Layout information for a single item
 */
export interface AtlasItemLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Atlas generation options
 */
export interface AtlasOptions {
  /** Maximum atlas width */
  maxWidth?: number;
  /** Maximum atlas height */
  maxHeight?: number;
  /** Padding between textures in pixels */
  padding?: number;
  /** Force power-of-two dimensions */
  powerOfTwo?: boolean;
  /** Allow texture rotation for better packing */
  allowRotation?: boolean;
  /** Texture format */
  format?: THREE.PixelFormat;
  /** Texture color space */
  colorSpace?: THREE.ColorSpace;
  /** Generate mipmaps */
  generateMipmaps?: boolean;
  /** Mipmap filter */
  minFilter?: THREE.TextureFilter;
  /** Mag filter */
  magFilter?: THREE.TextureFilter;
  /** Atlas background color */
  backgroundColor?: string;
  /** UV coordinate precision */
  uvPrecision?: number;
}

/**
 * Atlas statistics
 */
export interface AtlasStats {
  /** Number of textures packed */
  textureCount: number;
  /** Atlas dimensions */
  width: number;
  height: number;
  /** Utilization percentage */
  utilization: number;
  /** Total source pixels */
  sourcePixels: number;
  /** Atlas pixels */
  atlasPixels: number;
  /** Memory saved vs individual textures */
  memorySaved: number;
}

/**
 * UV remap information for geometry
 */
export interface UVRemapInfo {
  /** Original UV attribute name */
  uvAttribute: string;
  /** Remapped UV array */
  remappedUVs: Float32Array;
  /** Atlas item ID */
  itemId: string;
}

/**
 * Texture Atlas class
 * Manages packing and generation of texture atlases
 */
export class TextureAtlas {
  private options: Required<AtlasOptions>;
  private items: Map<string, AtlasItem> = new Map();
  private layout: AtlasLayout | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private isDirty = true;

  constructor(options: AtlasOptions = {}) {
    this.options = {
      maxWidth: options.maxWidth ?? 4096,
      maxHeight: options.maxHeight ?? 4096,
      padding: options.padding ?? 2,
      powerOfTwo: options.powerOfTwo ?? true,
      allowRotation: options.allowRotation ?? true,
      format: options.format ?? THREE.RGBAFormat,
      colorSpace: options.colorSpace ?? THREE.LinearSRGBColorSpace,
      generateMipmaps: options.generateMipmaps ?? true,
      minFilter: options.minFilter ?? THREE.LinearMipmapLinearFilter,
      magFilter: options.magFilter ?? THREE.LinearFilter,
      backgroundColor: options.backgroundColor ?? 'rgba(0,0,0,0)',
      uvPrecision: options.uvPrecision ?? 4,
    };
  }

  /**
   * Add a texture to the atlas
   */
  addTexture(item: AtlasItem): void {
    this.items.set(item.id, item);
    this.isDirty = true;
  }

  /**
   * Remove a texture from the atlas
   */
  removeTexture(id: string): void {
    this.items.delete(id);
    this.isDirty = true;
  }

  /**
   * Get all items in the atlas
   */
  getItems(): Map<string, AtlasItem> {
    return new Map(this.items);
  }

  /**
   * Check if atlas needs regeneration
   */
  isAtlasDirty(): boolean {
    return this.isDirty;
  }

  /**
   * Pack textures using shelf algorithm
   */
  private packTextures(): AtlasLayout {
    // Sort items by height (descending) for shelf packing
    const sortedItems = Array.from(this.items.values()).sort((a, b) => {
      const aImg = a.texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
      const bImg = b.texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
      const aHeight = aImg?.height ?? 0;
      const bHeight = bImg?.height ?? 0;
      const aPrio = a.priority ?? 0;
      const bPrio = b.priority ?? 0;
      return bPrio - aPrio || bHeight - aHeight;
    });

    const layout = new Map<string, AtlasItemLayout>();
    let currentX = this.options.padding;
    let currentY = this.options.padding;
    let shelfHeight = 0;
    let atlasWidth = this.options.padding;
    let atlasHeight = this.options.padding;

    for (const item of sortedItems) {
      const image = item.texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
      if (!image) continue;

      let itemWidth = image.width ?? 0;
      let itemHeight = image.height ?? 0;
      let rotated = false;

      // Try rotation if it fits better
      if (this.options.allowRotation && itemHeight > itemWidth) {
        if (itemHeight > this.options.maxWidth * 0.5) {
          [itemWidth, itemHeight] = [itemHeight, itemWidth];
          rotated = true;
        }
      }

      // Check if we need a new shelf
      if (currentX + itemWidth + this.options.padding > this.options.maxWidth) {
        currentY += shelfHeight + this.options.padding;
        currentX = this.options.padding;
        shelfHeight = 0;
      }

      // Check if atlas is too tall
      if (currentY + itemHeight + this.options.padding > this.options.maxHeight) {
        console.warn(`TextureAtlas: Item ${item.id} exceeds max atlas size`);
        continue;
      }

      // Place item
      layout.set(item.id, {
        x: currentX,
        y: currentY,
        width: itemWidth,
        height: itemHeight,
        rotated,
        originalWidth: image.width ?? 0,
        originalHeight: image.height ?? 0,
      });

      currentX += itemWidth + this.options.padding;
      shelfHeight = Math.max(shelfHeight, itemHeight);
      atlasWidth = Math.max(atlasWidth, currentX);
      atlasHeight = Math.max(atlasHeight, currentY + shelfHeight + this.options.padding);
    }

    // Adjust to power-of-two if required
    if (this.options.powerOfTwo) {
      atlasWidth = Math.pow(2, Math.ceil(Math.log2(atlasWidth)));
      atlasHeight = Math.pow(2, Math.ceil(Math.log2(atlasHeight)));
    }

    return {
      width: atlasWidth,
      height: atlasHeight,
      items: layout,
    };
  }

  /**
   * Generate the atlas texture
   */
  generate(): THREE.CanvasTexture {
    if (!this.isDirty && this.texture) {
      return this.texture;
    }

    // Pack textures
    this.layout = this.packTextures();

    // Create canvas
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    this.canvas.width = this.layout.width;
    this.canvas.height = this.layout.height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for atlas generation');
    }

    // Clear with background color
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(0, 0, this.layout.width, this.layout.height);

    // Draw each texture
    this.layout.items.forEach((layout, id) => {
      const item = this.items.get(id);
      if (!item) return;
      const img = item.texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
      if (!img) return;

      ctx.save();
      
      if (layout.rotated) {
        ctx.translate(layout.x + layout.width, layout.y);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(
          img,
          0,
          0,
          layout.originalWidth,
          layout.originalHeight
        );
      } else {
        ctx.drawImage(
          img,
          layout.x,
          layout.y,
          layout.width,
          layout.height
        );
      }
      
      ctx.restore();

      // Update item with layout info
      item.position = { x: layout.x, y: layout.y };
      item.size = { width: layout.width, height: layout.height };
      item.rotation = layout.rotated ? 90 : 0;
    });

    // Create Three.js texture
    if (this.texture) {
      this.texture.dispose();
    }

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = this.options.colorSpace;
    
    if (this.options.generateMipmaps) {
      this.texture.generateMipmaps = true;
      this.texture.minFilter = this.options.minFilter;
    } else {
      this.texture.generateMipmaps = false;
      this.texture.minFilter = THREE.LinearFilter;
    }
    
    this.texture.magFilter = this.options.magFilter as THREE.MagnificationTextureFilter;
    this.texture.needsUpdate = true;

    this.isDirty = false;
    return this.texture;
  }

  /**
   * Get the generated atlas texture
   */
  getTexture(): THREE.CanvasTexture | null {
    return this.texture;
  }

  /**
   * Get atlas layout
   */
  getLayout(): AtlasLayout | null {
    return this.layout;
  }

  /**
   * Get atlas statistics
   */
  getStats(): AtlasStats {
    if (!this.layout) {
      return {
        textureCount: 0,
        width: 0,
        height: 0,
        utilization: 0,
        sourcePixels: 0,
        atlasPixels: 0,
        memorySaved: 0,
      };
    }

    let sourcePixels = 0;
    this.items.forEach(item => {
      const image = item.texture.image as HTMLImageElement;
      if (image) {
        sourcePixels += (image.width ?? 0) * (image.height ?? 0);
      }
    });

    const atlasPixels = this.layout.width * this.layout.height;
    const usedPixels = Array.from(this.layout.items.values()).reduce(
      (sum, item) => sum + item.width * item.height,
      0
    );

    // Estimate memory saved (assuming 4 bytes per pixel)
    const overheadPerTexture = 256; // Approximate overhead
    const individualMemory = sourcePixels * 4 + this.items.size * overheadPerTexture;
    const atlasMemory = atlasPixels * 4 + overheadPerTexture;

    return {
      textureCount: this.items.size,
      width: this.layout.width,
      height: this.layout.height,
      utilization: atlasPixels > 0 ? (usedPixels / atlasPixels) * 100 : 0,
      sourcePixels,
      atlasPixels,
      memorySaved: Math.max(0, individualMemory - atlasMemory),
    };
  }

  /**
   * Remap UVs for a geometry to use atlas coordinates
   */
  remapUVs(geometry: THREE.BufferGeometry, itemId: string): UVRemapInfo | null {
    const layout = this.layout?.items.get(itemId);
    const item = this.items.get(itemId);
    
    if (!layout || !this.layout) return null;

    const uvAttribute = geometry.attributes.uv;
    if (!uvAttribute) return null;

    const originalUVs = new Float32Array(uvAttribute.array);
    const remappedUVs = new Float32Array(originalUVs.length);

    const atlasW = this.layout.width;
    const atlasH = this.layout.height;
    const itemX = layout.x;
    const itemY = layout.y;
    const itemW = layout.width;
    const itemH = layout.height;

    for (let i = 0; i < originalUVs.length; i += 2) {
      let u = originalUVs[i];
      let v = originalUVs[i + 1];

      if (layout.rotated) {
        // Handle rotated UVs
        const temp = u;
        u = 1 - v;
        v = temp;
      }

      // Map to atlas coordinates
      remappedUVs[i] = (itemX + u * itemW) / atlasW;
      remappedUVs[i + 1] = (itemY + v * itemH) / atlasH;
    }

    // Update geometry
    geometry.attributes.uv.array.set(remappedUVs);
    geometry.attributes.uv.needsUpdate = true;

    // Store original UVs on item
    if (item) {
      item.originalUVs = originalUVs;
      item.atlasUVs = remappedUVs;
    }

    return {
      uvAttribute: 'uv',
      remappedUVs,
      itemId,
    };
  }

  /**
   * Restore original UVs for a geometry
   */
  restoreOriginalUVs(geometry: THREE.BufferGeometry, itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item?.originalUVs) return false;

    const uvAttribute = geometry.attributes.uv;
    if (!uvAttribute) return false;

    uvAttribute.array.set(item.originalUVs);
    uvAttribute.needsUpdate = true;

    return true;
  }

  /**
   * Dispose of atlas resources
   */
  dispose(): void {
    this.texture?.dispose();
    this.texture = null;
    this.canvas = null;
    this.layout = null;
    this.items.clear();
    this.isDirty = true;
  }
}

/**
 * Multi-atlas manager for large texture collections
 */
export class MultiAtlasManager {
  private atlases: Map<string, TextureAtlas> = new Map();
  private textureToAtlas: Map<string, string> = new Map();
  private options: AtlasOptions;

  constructor(options: AtlasOptions = {}) {
    this.options = options;
  }

  /**
   * Add a texture to the appropriate atlas
   */
  addTexture(item: AtlasItem, atlasId: string = 'default'): void {
    let atlas = this.atlases.get(atlasId);
    
    if (!atlas) {
      atlas = new TextureAtlas(this.options);
      this.atlases.set(atlasId, atlas);
    }

    atlas.addTexture(item);
    this.textureToAtlas.set(item.id, atlasId);
  }

  /**
   * Remove a texture from its atlas
   */
  removeTexture(textureId: string): void {
    const atlasId = this.textureToAtlas.get(textureId);
    if (atlasId) {
      const atlas = this.atlases.get(atlasId);
      atlas?.removeTexture(textureId);
      this.textureToAtlas.delete(textureId);
    }
  }

  /**
   * Generate all atlases
   */
  generateAll(): Map<string, THREE.CanvasTexture> {
    const textures = new Map<string, THREE.CanvasTexture>();

    this.atlases.forEach((atlas, id) => {
      textures.set(id, atlas.generate());
    });

    return textures;
  }

  /**
   * Get an atlas by ID
   */
  getAtlas(id: string): TextureAtlas | undefined {
    return this.atlases.get(id);
  }

  /**
   * Get atlas containing a specific texture
   */
  getAtlasForTexture(textureId: string): TextureAtlas | undefined {
    const atlasId = this.textureToAtlas.get(textureId);
    return atlasId ? this.atlases.get(atlasId) : undefined;
  }

  /**
   * Get all atlas statistics
   */
  getAllStats(): Map<string, AtlasStats> {
    const stats = new Map<string, AtlasStats>();
    
    this.atlases.forEach((atlas, id) => {
      stats.set(id, atlas.getStats());
    });

    return stats;
  }

  /**
   * Dispose of all atlases
   */
  dispose(): void {
    this.atlases.forEach(atlas => atlas.dispose());
    this.atlases.clear();
    this.textureToAtlas.clear();
  }
}

/**
 * Build-time atlas generator
 * Creates atlases without DOM for SSR/build processes
 */
export async function generateAtlasAtBuildTime(
  imagePaths: string[],
  options: AtlasOptions = {}
): Promise<{
  atlasImage: Buffer;
  layout: AtlasLayout;
  stats: AtlasStats;
}> {
  // This would be implemented with node-canvas or sharp in Node.js
  // For now, provide the interface and structure
  throw new Error('Build-time atlas generation requires Node.js canvas library');
}

/**
 * Utility to batch mascot textures for atlasing
 */
export function createMascotTextureAtlas(
  mascots: Array<{
    id: string;
    textures: Array<{
      name: string;
      texture: THREE.Texture;
    }>;
  }>,
  options: AtlasOptions = {}
): TextureAtlas {
  const atlas = new TextureAtlas({
    ...options,
    maxWidth: 2048,
    maxHeight: 2048,
    padding: 4,
  });

  mascots.forEach(mascot => {
    mascot.textures.forEach(({ name, texture }) => {
      atlas.addTexture({
        id: `${mascot.id}_${name}`,
        texture,
        priority: 1,
      });
    });
  });

  return atlas;
}

/**
 * UV mapping helper for atlas coordinates
 */
export function calculateAtlasUVs(
  originalUVs: Float32Array,
  atlasRect: { x: number; y: number; width: number; height: number },
  atlasSize: { width: number; height: number },
  rotated: boolean = false
): Float32Array {
  const remappedUVs = new Float32Array(originalUVs.length);

  for (let i = 0; i < originalUVs.length; i += 2) {
    let u = originalUVs[i];
    let v = originalUVs[i + 1];

    if (rotated) {
      const temp = u;
      u = 1 - v;
      v = temp;
    }

    remappedUVs[i] = (atlasRect.x + u * atlasRect.width) / atlasSize.width;
    remappedUVs[i + 1] = (atlasRect.y + v * atlasRect.height) / atlasSize.height;
  }

  return remappedUVs;
}

/**
 * Create a material using the atlas texture
 */
export function createAtlasMaterial(
  atlasTexture: THREE.Texture,
  options: {
    transparent?: boolean;
    alphaTest?: number;
    side?: THREE.Side;
  } = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: atlasTexture,
    transparent: options.transparent ?? false,
    alphaTest: options.alphaTest ?? 0,
    side: options.side ?? THREE.FrontSide,
  });
}
