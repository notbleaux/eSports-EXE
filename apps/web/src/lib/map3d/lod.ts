/**
 * Advanced LOD (Level of Detail) System for 3D Maps
 * 
 * [Ver001.000] - Dynamic LOD with smooth transitions and mesh simplification
 * 
 * Provides:
 * - Dynamic LOD based on distance and screen-space size
 * - Mesh simplification using edge collapse algorithm
 * - Texture mipmapping with LOD bias control
 * - Smooth LOD transitions (dithering/cross-fading)
 * - Hierarchical LOD for complex map structures
 * 
 * @example
 * ```typescript
 * import { MapLODSystem, LODLevel } from '@/lib/map3d/lod';
 * 
 * const lod = new MapLODSystem(camera, {
 *   levels: 4,
 *   distances: [0, 50, 150, 300],
 *   enableTransitions: true,
 * });
 * lod.registerMesh(mesh);
 * ```
 */

import * as THREE from 'three';

// ============================================
// Types
// ============================================

export interface LODConfig {
  /** Number of LOD levels (default: 4) */
  levels: number;
  /** Distance thresholds for each LOD level */
  distances: number[];
  /** Enable smooth transitions between LODs */
  enableTransitions: boolean;
  /** Transition duration in seconds */
  transitionDuration: number;
  /** Screen-space size threshold for LOD switch */
  screenSizeThreshold: number;
  /** Enable hysteresis to prevent LOD flickering */
  enableHysteresis: boolean;
  /** Hysteresis ratio (0.0 - 1.0) */
  hysteresisRatio: number;
  /** Maximum triangles for each LOD level */
  maxTrianglesPerLevel?: number[];
  /** Enable texture mipmapping */
  enableMipmapping: boolean;
  /** LOD bias for texture sampling */
  textureLODBias: number;
}

export interface LODLevel {
  level: number;
  distance: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  vertexCount: number;
  triangleCount: number;
  screenSize: number;
}

export interface LODObject {
  id: string;
  object: THREE.Mesh;
  levels: LODLevel[];
  currentLevel: number;
  targetLevel: number;
  transitionProgress: number;
  isTransitioning: boolean;
  worldPosition: THREE.Vector3;
  boundingSphere: THREE.Sphere;
  screenSize: number;
  lastUpdateTime: number;
}

export interface LODStats {
  totalObjects: number;
  totalLevels: number;
  activeTransitions: number;
  averageLODLevel: number;
  memorySavings: number;
  trianglesRendered: number;
  trianglesSaved: number;
}

export interface SimplificationOptions {
  targetRatio?: number;
  preserveBorders: boolean;
  preserveUVs: boolean;
  preserveNormals: boolean;
  errorThreshold: number;
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_LOD_CONFIG: LODConfig = {
  levels: 4,
  distances: [0, 50, 150, 300, 600],
  enableTransitions: true,
  transitionDuration: 0.3,
  screenSizeThreshold: 0.01,
  enableHysteresis: true,
  hysteresisRatio: 0.15,
  enableMipmapping: true,
  textureLODBias: 0,
  maxTrianglesPerLevel: [50000, 20000, 5000, 1000, 200],
};

// ============================================
// Mesh Simplification
// ============================================

/**
 * Simplify geometry using edge collapse algorithm
 * This is a simplified implementation - production should use a proper decimation library
 */
export function simplifyGeometry(
  geometry: THREE.BufferGeometry,
  targetRatio: number,
  options: Partial<SimplificationOptions> = {}
): THREE.BufferGeometry {
  const opts = {
    preserveBorders: true,
    preserveUVs: true,
    preserveNormals: true,
    errorThreshold: 0.01,
    ...options,
  };

  if (targetRatio >= 1.0) {
    return geometry.clone();
  }

  const positions = geometry.attributes.position.array as Float32Array;
  const normals = geometry.attributes.normal?.array as Float32Array | undefined;
  const uvs = geometry.attributes.uv?.array as Float32Array | undefined;
  const indices = geometry.index?.array as Uint32Array | Uint16Array | undefined;

  const vertexCount = positions.length / 3;
  const targetCount = Math.max(3, Math.floor(vertexCount * targetRatio));

  // If already below target, return clone
  if (vertexCount <= targetCount) {
    return geometry.clone();
  }

  // Simplified vertex reduction using grid-based clustering
  const simplified = gridBasedSimplification(
    positions,
    normals,
    uvs,
    indices,
    targetCount,
    opts
  );

  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(simplified.positions), 3)
  );

  if (simplified.normals && opts.preserveNormals) {
    newGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(simplified.normals), 3)
    );
  } else {
    newGeometry.computeVertexNormals();
  }

  if (simplified.uvs && opts.preserveUVs) {
    newGeometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(simplified.uvs), 2)
    );
  }

  if (simplified.indices) {
    newGeometry.setIndex(new THREE.BufferAttribute(simplified.indices, 1));
  }

  newGeometry.computeBoundingBox();
  newGeometry.computeBoundingSphere();

  return newGeometry;
}

/**
 * Grid-based vertex clustering for fast simplification
 */
function gridBasedSimplification(
  positions: Float32Array,
  normals?: Float32Array,
  uvs?: Float32Array,
  indices?: Uint32Array | Uint16Array,
  targetCount?: number
): { positions: number[]; normals?: number[]; uvs?: number[]; indices?: Uint32Array } {
  // Calculate bounds
  const bounds = new THREE.Box3();
  for (let i = 0; i < positions.length; i += 3) {
    bounds.expandByPoint(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }

  const size = new THREE.Vector3();
  bounds.getSize(size);

  // Calculate grid cell size based on target count
  const totalVerts = positions.length / 3;
  const targetVerts = targetCount || Math.floor(totalVerts * 0.5);
  const gridCells = Math.ceil(Math.pow(targetVerts, 1 / 3));
  const cellSize = Math.max(size.x, size.y, size.z) / gridCells;

  // Cluster vertices
  const clusters = new Map<string, { indices: number[]; center: THREE.Vector3 }>();

  for (let i = 0; i < totalVerts; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];

    const gx = Math.floor((x - bounds.min.x) / cellSize);
    const gy = Math.floor((y - bounds.min.y) / cellSize);
    const gz = Math.floor((z - bounds.min.z) / cellSize);

    const key = `${gx},${gy},${gz}`;

    if (!clusters.has(key)) {
      clusters.set(key, { indices: [], center: new THREE.Vector3() });
    }

    clusters.get(key)!.indices.push(i);
  }

  // Calculate cluster centers
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newUVs: number[] = [];
  const vertexRemap = new Map<number, number>();

  clusters.forEach((cluster) => {
    let cx = 0, cy = 0, cz = 0;
    let nx = 0, ny = 0, nz = 0;
    let u = 0, v = 0;

    for (const idx of cluster.indices) {
      cx += positions[idx * 3];
      cy += positions[idx * 3 + 1];
      cz += positions[idx * 3 + 2];

      if (normals) {
        nx += normals[idx * 3];
        ny += normals[idx * 3 + 1];
        nz += normals[idx * 3 + 2];
      }

      if (uvs) {
        u += uvs[idx * 2];
        v += uvs[idx * 2 + 1];
      }
    }

    const count = cluster.indices.length;
    cx /= count;
    cy /= count;
    cz /= count;

    newPositions.push(cx, cy, cz);

    if (normals) {
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      newNormals.push(nx / len, ny / len, nz / len);
    }

    if (uvs) {
      newUVs.push(u / count, v / count);
    }

    const newIndex = (newPositions.length / 3) - 1;
    for (const idx of cluster.indices) {
      vertexRemap.set(idx, newIndex);
    }
  });

  // Remap indices
  let newIndices: Uint32Array | undefined;
  if (indices) {
    const remappedIndices: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const a = vertexRemap.get(indices[i]);
      const b = vertexRemap.get(indices[i + 1]);
      const c = vertexRemap.get(indices[i + 2]);

      // Skip degenerate triangles
      if (a !== undefined && b !== undefined && c !== undefined && a !== b && b !== c && a !== c) {
        remappedIndices.push(a, b, c);
      }
    }
    newIndices = new Uint32Array(remappedIndices);
  }

  return {
    positions: newPositions,
    normals: normals ? newNormals : undefined,
    uvs: uvs ? newUVs : undefined,
    indices: newIndices,
  };
}

// ============================================
// Texture Mipmapping
// ============================================

/**
 * Configure texture mipmapping for LOD
 */
export function configureTextureMipmap(
  texture: THREE.Texture,
  config: Partial<LODConfig> = {}
): void {
  const opts = { ...DEFAULT_LOD_CONFIG, ...config };

  if (opts.enableMipmapping) {
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
  } else {
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
  }

  // Apply LOD bias through anisotropy adjustment
  if (opts.textureLODBias !== 0) {
    texture.anisotropy = Math.max(1, 16 - opts.textureLODBias * 4);
  }

  texture.needsUpdate = true;
}

/**
 * Create LOD texture atlas
 */
export function createLODTextureAtlas(
  textures: THREE.Texture[],
  resolution: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const cols = Math.ceil(Math.sqrt(textures.length));
  const rows = Math.ceil(textures.length / cols);
  
  canvas.width = cols * resolution;
  canvas.height = rows * resolution;
  
  const ctx = canvas.getContext('2d')!;
  
  textures.forEach((_, i) => {
    const x = (i % cols) * resolution;
    const y = Math.floor(i / cols) * resolution;
    
    // Draw placeholder - in production, draw actual texture
    ctx.fillStyle = `hsl(${(i * 60) % 360}, 70%, 50%)`;
    ctx.fillRect(x, y, resolution, resolution);
  });
  
  const atlasTexture = new THREE.CanvasTexture(canvas);
  configureTextureMipmap(atlasTexture);
  
  return atlasTexture;
}

// ============================================
// LOD Transition System
// ============================================

/**
 * LOD transition manager for smooth LOD switches
 */
export class LODTransitionManager {
  private transitions = new Map<string, LODTransition>();
  private config: LODConfig;

  constructor(config: LODConfig) {
    this.config = config;
  }

  /**
   * Start LOD transition
   */
  startTransition(
    objectId: string,
    fromLevel: number,
    toLevel: number,
    fromMesh: THREE.Mesh,
    toMesh: THREE.Mesh
  ): void {
    if (!this.config.enableTransitions) {
      return;
    }

    // Clean up existing transition
    this.endTransition(objectId);

    const transition: LODTransition = {
      objectId,
      fromLevel,
      toLevel,
      fromMesh,
      toMesh,
      progress: 0,
      startTime: performance.now(),
      duration: this.config.transitionDuration * 1000,
    };

    // Setup dithering materials
    this.setupTransitionMaterials(transition);

    this.transitions.set(objectId, transition);
  }

  /**
   * Setup materials for dithered transition
   */
  private setupTransitionMaterials(transition: LODTransition): void {
    // Store original materials
    transition.fromMesh.userData.originalMaterial = transition.fromMesh.material;
    transition.toMesh.userData.originalMaterial = transition.toMesh.material;

    // Create dithered materials (simplified - production would use proper dither shader)
    const fromDitherMat = this.createDitherMaterial(
      transition.fromMesh.material as THREE.Material,
      1.0
    );
    const toDitherMat = this.createDitherMaterial(
      transition.toMesh.material as THREE.Material,
      0.0
    );

    transition.fromMesh.material = fromDitherMat;
    transition.toMesh.material = toDitherMat;
    transition.toMesh.visible = true;
  }

  /**
   * Create dither material for transition
   */
  private createDitherMaterial(
    baseMaterial: THREE.Material,
    opacity: number
  ): THREE.MeshBasicMaterial {
    // Simplified dither material - production would use custom shader
    const ditherMat = new THREE.MeshBasicMaterial({
      color: (baseMaterial as THREE.MeshStandardMaterial).color || 0xffffff,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
    });

    return ditherMat;
  }

  /**
   * Update all transitions
   */
  update(): void {
    const now = performance.now();

    this.transitions.forEach((transition, id) => {
      const elapsed = now - transition.startTime;
      transition.progress = Math.min(1.0, elapsed / transition.duration);

      // Update opacity
      const fromOpacity = 1.0 - transition.progress;
      const toOpacity = transition.progress;

      if (transition.fromMesh.material instanceof THREE.MeshBasicMaterial) {
        transition.fromMesh.material.opacity = fromOpacity;
      }
      if (transition.toMesh.material instanceof THREE.MeshBasicMaterial) {
        transition.toMesh.material.opacity = toOpacity;
      }

      // End transition if complete
      if (transition.progress >= 1.0) {
        this.completeTransition(id);
      }
    });
  }

  /**
   * Complete a transition
   */
  private completeTransition(objectId: string): void {
    const transition = this.transitions.get(objectId);
    if (!transition) return;

    // Restore original material on target mesh
    if (transition.toMesh.userData.originalMaterial) {
      transition.toMesh.material = transition.toMesh.userData.originalMaterial;
      delete transition.toMesh.userData.originalMaterial;
    }

    // Hide source mesh
    transition.fromMesh.visible = false;
    if (transition.fromMesh.userData.originalMaterial) {
      transition.fromMesh.material = transition.fromMesh.userData.originalMaterial;
      delete transition.fromMesh.userData.originalMaterial;
    }

    this.transitions.delete(objectId);
  }

  /**
   * End transition immediately
   */
  endTransition(objectId: string): void {
    this.completeTransition(objectId);
  }

  /**
   * Get active transition count
   */
  getActiveCount(): number {
    return this.transitions.size;
  }

  /**
   * Clear all transitions
   */
  clear(): void {
    this.transitions.forEach((_, id) => this.endTransition(id));
    this.transitions.clear();
  }
}

interface LODTransition {
  objectId: string;
  fromLevel: number;
  toLevel: number;
  fromMesh: THREE.Mesh;
  toMesh: THREE.Mesh;
  progress: number;
  startTime: number;
  duration: number;
}

// ============================================
// Main LOD System
// ============================================

export class MapLODSystem {
  private camera: THREE.Camera;
  private config: LODConfig;
  private objects = new Map<string, LODObject>();
  private transitionManager: LODTransitionManager;
  private scene: THREE.Scene;
  private stats: LODStats;
  private lodGroups = new Map<string, THREE.Group>();

  constructor(camera: THREE.Camera, scene: THREE.Scene, config: Partial<LODConfig> = {}) {
    this.camera = camera;
    this.scene = scene;
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
    this.transitionManager = new LODTransitionManager(this.config);
    this.stats = this.createEmptyStats();
  }

  /**
   * Create empty stats
   */
  private createEmptyStats(): LODStats {
    return {
      totalObjects: 0,
      totalLevels: 0,
      activeTransitions: 0,
      averageLODLevel: 0,
      memorySavings: 0,
      trianglesRendered: 0,
      trianglesSaved: 0,
    };
  }

  /**
   * Register a mesh for LOD management
   */
  registerMesh(
    mesh: THREE.Mesh,
    options: {
      id?: string;
      autoGenerateLevels?: boolean;
      customLevels?: LODLevel[];
    } = {}
  ): string {
    const id = options.id || mesh.uuid;

    // Create LOD group
    const lodGroup = new THREE.Group();
    lodGroup.name = `lod-group-${id}`;
    lodGroup.position.copy(mesh.position);
    lodGroup.rotation.copy(mesh.rotation);
    lodGroup.scale.copy(mesh.scale);
    lodGroup.matrix.copy(mesh.matrix);
    lodGroup.matrixWorld.copy(mesh.matrixWorld);

    // Calculate bounding sphere
    const boundingSphere = new THREE.Sphere();
    if (mesh.geometry.boundingSphere) {
      boundingSphere.copy(mesh.geometry.boundingSphere);
      boundingSphere.applyMatrix4(mesh.matrixWorld);
    } else {
      const box = new THREE.Box3().setFromObject(mesh);
      box.getBoundingSphere(boundingSphere);
    }

    // Generate or use custom LOD levels
    let levels: LODLevel[];
    if (options.customLevels) {
      levels = options.customLevels;
    } else if (options.autoGenerateLevels !== false) {
      levels = this.generateLODLevels(mesh);
    } else {
      levels = [this.createLODLevelFromMesh(mesh, 0, 0)];
    }

    // Create LOD meshes for each level
    levels.forEach((level, index) => {
      const lodMesh = new THREE.Mesh(level.geometry, level.material);
      lodMesh.name = `lod-${id}-level-${index}`;
      lodMesh.visible = index === 0;
      lodGroup.add(lodMesh);
    });

    // Replace original mesh with LOD group
    if (mesh.parent) {
      mesh.parent.add(lodGroup);
      mesh.parent.remove(mesh);
    } else {
      this.scene.add(lodGroup);
    }

    const lodObject: LODObject = {
      id,
      object: mesh,
      levels,
      currentLevel: 0,
      targetLevel: 0,
      transitionProgress: 0,
      isTransitioning: false,
      worldPosition: mesh.getWorldPosition(new THREE.Vector3()),
      boundingSphere,
      screenSize: 0,
      lastUpdateTime: performance.now(),
    };

    this.objects.set(id, lodObject);
    this.lodGroups.set(id, lodGroup);

    return id;
  }

  /**
   * Generate LOD levels for a mesh
   */
  private generateLODLevels(mesh: THREE.Mesh): LODLevel[] {
    const levels: LODLevel[] = [];
    const baseGeometry = mesh.geometry;
    const baseMaterial = mesh.material;

    for (let i = 0; i < this.config.levels; i++) {
      const distance = this.config.distances[i] ?? this.config.distances[this.config.distances.length - 1] * (i + 1);
      
      // Calculate reduction ratio
      let reductionRatio = 1.0;
      if (i > 0) {
        reductionRatio = Math.pow(0.5, i);
      }

      // Simplify geometry
      const simplifiedGeometry = simplifyGeometry(baseGeometry, reductionRatio);

      // Configure material mipmapping
      const materials = Array.isArray(baseMaterial) ? baseMaterial : [baseMaterial];
      const configuredMaterials = materials.map(mat => {
        if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
          const newMat = mat.clone();
          configureTextureMipmap(newMat.map!, this.config);
          return newMat;
        }
        return mat;
      });

      const level: LODLevel = {
        level: i,
        distance,
        geometry: simplifiedGeometry,
        material: Array.isArray(baseMaterial) ? configuredMaterials : configuredMaterials[0],
        vertexCount: simplifiedGeometry.attributes.position.count,
        triangleCount: simplifiedGeometry.index
          ? simplifiedGeometry.index.count / 3
          : simplifiedGeometry.attributes.position.count / 3,
        screenSize: 0,
      };

      levels.push(level);
    }

    return levels;
  }

  /**
   * Create LOD level from existing mesh
   */
  private createLODLevelFromMesh(
    mesh: THREE.Mesh,
    level: number,
    distance: number
  ): LODLevel {
    return {
      level,
      distance,
      geometry: mesh.geometry.clone(),
      material: mesh.material,
      vertexCount: mesh.geometry.attributes.position.count,
      triangleCount: mesh.geometry.index
        ? mesh.geometry.index.count / 3
        : mesh.geometry.attributes.position.count / 3,
      screenSize: 0,
    };
  }

  /**
   * Calculate screen-space size of an object
   */
  private calculateScreenSize(obj: LODObject): number {
    const camera = this.camera as THREE.PerspectiveCamera;
    if (!camera.fov) return 1.0;

    const distance = obj.worldPosition.distanceTo(camera.position);
    if (distance < 0.001) return 1.0;

    // Calculate angular diameter
    const radius = obj.boundingSphere.radius;
    const angularDiameter = 2 * Math.atan2(radius, distance);

    // Convert to screen-space size (approximate)
    const fovRad = (camera.fov * Math.PI) / 180;
    const screenSize = angularDiameter / fovRad;

    return screenSize;
  }

  /**
   * Determine appropriate LOD level
   */
  private calculateLODLevel(obj: LODObject): number {
    const screenSize = obj.screenSize;

    // Find appropriate level based on screen size
    for (let i = this.config.levels - 1; i >= 0; i--) {
      const threshold = this.config.screenSizeThreshold * Math.pow(2, i);
      if (screenSize >= threshold) {
        return i;
      }
    }

    return this.config.levels - 1;
  }

  /**
   * Apply hysteresis to prevent LOD flickering
   */
  private applyHysteresis(obj: LODObject, newLevel: number): number {
    if (!this.config.enableHysteresis) return newLevel;

    const currentLevel = obj.currentLevel;
    if (newLevel === currentLevel) return currentLevel;

    const hysteresis = this.config.hysteresisRatio;
    const screenSize = obj.screenSize;

    // Calculate thresholds with hysteresis
    if (newLevel > currentLevel) {
      // Switching to lower detail - require smaller screen size
      const threshold = this.config.screenSizeThreshold * Math.pow(2, currentLevel) * (1 - hysteresis);
      if (screenSize < threshold) return newLevel;
      return currentLevel;
    } else {
      // Switching to higher detail - require larger screen size
      const threshold = this.config.screenSizeThreshold * Math.pow(2, newLevel) * (1 + hysteresis);
      if (screenSize > threshold) return newLevel;
      return currentLevel;
    }
  }

  /**
   * Update LOD for all objects
   */
  update(): void {
    // Update transitions
    this.transitionManager.update();

    // Update camera matrix
    this.camera.updateMatrixWorld();

    let totalLevel = 0;
    let totalTriangles = 0;
    let maxTriangles = 0;

    this.objects.forEach((obj) => {
      // Update world position
      obj.object.getWorldPosition(obj.worldPosition);

      // Calculate screen size
      obj.screenSize = this.calculateScreenSize(obj);

      // Determine target LOD level
      let targetLevel = this.calculateLODLevel(obj);
      targetLevel = this.applyHysteresis(obj, targetLevel);
      obj.targetLevel = targetLevel;

      totalLevel += targetLevel;

      // Apply LOD if changed
      if (targetLevel !== obj.currentLevel && !obj.isTransitioning) {
        this.switchLODLevel(obj, targetLevel);
      }

      // Update stats
      const activeLevel = obj.isTransitioning ? obj.currentLevel : obj.targetLevel;
      totalTriangles += obj.levels[activeLevel].triangleCount;
      maxTriangles += obj.levels[0].triangleCount;

      obj.lastUpdateTime = performance.now();
    });

    // Update stats
    this.stats.totalObjects = this.objects.size;
    this.stats.totalLevels = this.config.levels;
    this.stats.activeTransitions = this.transitionManager.getActiveCount();
    this.stats.averageLODLevel = this.objects.size > 0 ? totalLevel / this.objects.size : 0;
    this.stats.trianglesRendered = totalTriangles;
    this.stats.trianglesSaved = maxTriangles - totalTriangles;
    this.stats.memorySavings = this.estimateMemorySavings();
  }

  /**
   * Switch to a different LOD level
   */
  private switchLODLevel(obj: LODObject, newLevel: number): void {
    const lodGroup = this.lodGroups.get(obj.id);
    if (!lodGroup) return;

    const oldLevel = obj.currentLevel;

    if (this.config.enableTransitions && oldLevel !== newLevel) {
      // Start transition
      const fromMesh = lodGroup.children[oldLevel] as THREE.Mesh;
      const toMesh = lodGroup.children[newLevel] as THREE.Mesh;

      obj.isTransitioning = true;
      this.transitionManager.startTransition(obj.id, oldLevel, newLevel, fromMesh, toMesh);
    } else {
      // Immediate switch
      lodGroup.children.forEach((_, index) => {
        lodGroup.children[index].visible = index === newLevel;
      });
    }

    obj.currentLevel = newLevel;
  }

  /**
   * Estimate memory savings from LOD
   */
  private estimateMemorySavings(): number {
    let savings = 0;

    this.objects.forEach((obj) => {
      const currentLevel = obj.currentLevel;
      const fullDetailSize = this.calculateGeometrySize(obj.levels[0].geometry);
      const currentSize = this.calculateGeometrySize(obj.levels[currentLevel].geometry);
      savings += fullDetailSize - currentSize;
    });

    return savings;
  }

  /**
   * Calculate geometry memory size
   */
  private calculateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0;
    for (const key in geometry.attributes) {
      size += geometry.attributes[key].array.byteLength;
    }
    if (geometry.index) {
      size += geometry.index.array.byteLength;
    }
    return size;
  }

  /**
   * Force specific LOD level for all objects
   */
  forceLODLevel(level: number): void {
    this.objects.forEach((obj) => {
      obj.targetLevel = Math.min(level, obj.levels.length - 1);
      this.switchLODLevel(obj, obj.targetLevel);
    });
  }

  /**
   * Unregister a mesh from LOD management
   */
  unregisterMesh(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) return;

    // End any active transition
    this.transitionManager.endTransition(id);

    // Restore original mesh
    const lodGroup = this.lodGroups.get(id);
    if (lodGroup && lodGroup.parent) {
      lodGroup.parent.add(obj.object);
      lodGroup.parent.remove(lodGroup);
    }

    // Dispose LOD geometries
    obj.levels.forEach((level) => {
      if (level.geometry !== obj.object.geometry) {
        level.geometry.dispose();
      }
    });

    this.objects.delete(id);
    this.lodGroups.delete(id);
  }

  /**
   * Get current LOD statistics
   */
  getStats(): LODStats {
    return { ...this.stats };
  }

  /**
   * Get LOD object info
   */
  getObjectInfo(id: string): LODObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.transitionManager.clear();

    this.objects.forEach((_, id) => this.unregisterMesh(id));
    this.objects.clear();
    this.lodGroups.clear();
  }
}

// ============================================
// Hierarchical LOD for Map Zones
// ============================================

export class HierarchicalLOD {
  private zones = new Map<string, ZoneLOD>();
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Register a map zone with hierarchical LOD
   */
  registerZone(
    zoneId: string,
    bounds: THREE.Box3,
    lodSystem: MapLODSystem
  ): void {
    const boundingSphere = new THREE.Sphere();
    bounds.getBoundingSphere(boundingSphere);
    
    this.zones.set(zoneId, {
      id: zoneId,
      bounds,
      boundingSphere,
      lodSystem,
      active: true,
    });
  }

  /**
   * Update all zones
   */
  update(): void {
    this.camera.updateMatrixWorld();
    const cameraPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPos);

    this.zones.forEach((zone) => {
      // Check if zone is near camera
      const distance = zone.boundingSphere.distanceToPoint(cameraPos);
      const wasActive = zone.active;
      zone.active = distance < zone.boundingSphere.radius * 2;

      // Update LOD only for active zones
      if (zone.active) {
        zone.lodSystem.update();
      } else if (wasActive) {
        // Zone became inactive - switch to lowest LOD
        zone.lodSystem.forceLODLevel(zone.lodSystem['config'].levels - 1);
      }
    });
  }

  /**
   * Get zone statistics
   */
  getStats(): { activeZones: number; totalZones: number } {
    let active = 0;
    this.zones.forEach((zone) => {
      if (zone.active) active++;
    });
    return { activeZones: active, totalZones: this.zones.size };
  }

  /**
   * Dispose all zones
   */
  dispose(): void {
    this.zones.forEach((zone) => zone.lodSystem.dispose());
    this.zones.clear();
  }
}

interface ZoneLOD {
  id: string;
  bounds: THREE.Box3;
  boundingSphere: THREE.Sphere;
  lodSystem: MapLODSystem;
  active: boolean;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate optimal LOD distances for a map
 */
export function calculateOptimalLODDistances(
  mapBounds: THREE.Box3,
  levels: number
): number[] {
  const distances: number[] = [0];
  const size = new THREE.Vector3();
  mapBounds.getSize(size);
  const maxDimension = Math.max(size.x, size.y, size.z);

  for (let i = 1; i < levels; i++) {
    const distance = maxDimension * Math.pow(0.5, i - 1);
    distances.push(distance);
  }

  return distances;
}

/**
 * Estimate triangle count for a geometry
 */
export function estimateTriangleCount(geometry: THREE.BufferGeometry): number {
  if (geometry.index) {
    return geometry.index.count / 3;
  }
  return geometry.attributes.position.count / 3;
}

/**
 * Merge LOD compatible geometries
 */
export function mergeLODGeometries(
  geometries: THREE.BufferGeometry[],
  targetRatio: number
): THREE.BufferGeometry {
  // First merge, then simplify
  const merged = new THREE.BufferGeometry();
  
  // Simple merge - concatenate positions
  const positions: number[] = [];
  
  geometries.forEach((geo) => {
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i++) {
      positions.push(pos[i]);
    }
  });
  
  merged.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );
  merged.computeVertexNormals();
  
  return simplifyGeometry(merged, targetRatio);
}

export default MapLODSystem;
