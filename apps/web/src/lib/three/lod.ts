// @ts-nocheck
/**
 * Level of Detail (LOD) System for Mascot 3D Scenes
 * 
 * [Ver001.000] - Three.js LOD implementation with smooth transitions
 * 
 * Provides distance-based mesh detail reduction with configurable
 * thresholds and smooth LOD level transitions for mascot models.
 */

import * as THREE from 'three';

/**
 * LOD level configuration
 */
export interface LODLevel {
  /** Level identifier: 0 = high, 1 = medium, 2 = low */
  level: number;
  /** Distance threshold for this LOD level (in world units) */
  distance: number;
  /** Geometry for this LOD level */
  geometry: THREE.BufferGeometry;
  /** Material for this LOD level (optional, defaults to high detail material) */
  material?: THREE.Material | THREE.Material[];
  /** Vertex count for this level (for metrics) */
  vertexCount?: number;
}

/**
 * LOD configuration options
 */
export interface LODOptions {
  /** Distance thresholds for each LOD level [high, medium, low] */
  distanceThresholds?: [number, number, number];
  /** Enable smooth transitions between LOD levels */
  smoothTransitions?: boolean;
  /** Transition duration in seconds */
  transitionDuration?: number;
  /** Easing function for transitions */
  transitionEasing?: (t: number) => number;
  /** Whether to update LOD automatically in the animation loop */
  autoUpdate?: boolean;
  /** Callback when LOD level changes */
  onLevelChange?: (level: number, previousLevel: number) => void;
}

/**
 * Mascot LOD configuration with all 3 detail levels
 */
export interface MascotLODConfig {
  /** Unique identifier for the mascot */
  mascotId: string;
  /** High detail geometry (close up) */
  highDetail: THREE.BufferGeometry;
  /** Medium detail geometry (mid distance) */
  mediumDetail: THREE.BufferGeometry;
  /** Low detail geometry (far distance) */
  lowDetail: THREE.BufferGeometry;
  /** Material(s) - shared across LODs or per-level */
  material?: THREE.Material | THREE.Material[];
  /** Optional per-level materials */
  materials?: {
    high?: THREE.Material | THREE.Material[];
    medium?: THREE.Material | THREE.Material[];
    low?: THREE.Material | THREE.Material[];
  };
  /** LOD options */
  options?: LODOptions;
}

/**
 * Current LOD state
 */
export interface LODState {
  /** Current LOD level (0 = high, 1 = medium, 2 = low) */
  currentLevel: number;
  /** Previous LOD level */
  previousLevel: number;
  /** Transition progress (0-1) */
  transitionProgress: number;
  /** Whether a transition is in progress */
  isTransitioning: boolean;
  /** Distance to camera */
  distance: number;
  /** Timestamp of last level change */
  lastChangeTime: number;
}

/**
 * Performance metrics for LOD system
 */
export interface LODMetrics {
  /** Total draw calls saved */
  drawCallsSaved: number;
  /** Current vertex count */
  currentVertexCount: number;
  /** Maximum vertex count (high detail) */
  maxVertexCount: number;
  /** Percentage of vertices saved */
  vertexReductionPercent: number;
  /** Time spent in LOD calculations (ms) */
  calculationTime: number;
}

// Default distance thresholds for mascot scenes
const DEFAULT_DISTANCE_THRESHOLDS: [number, number, number] = [10, 30, 100];

// Default transition duration
const DEFAULT_TRANSITION_DURATION = 0.3;

// Ease-in-out cubic easing
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * MascotLOD class - Manages LOD levels for a single mascot
 */
export class MascotLOD {
  private config: MascotLODConfig;
  private options: Required<LODOptions>;
  private state: LODState;
  private meshes: THREE.Mesh[] = [];
  private group: THREE.Group;
  private metrics: LODMetrics;
  private vertexCounts: [number, number, number];

  constructor(config: MascotLODConfig) {
    this.config = config;
    this.options = {
      distanceThresholds: config.options?.distanceThresholds ?? DEFAULT_DISTANCE_THRESHOLDS,
      smoothTransitions: config.options?.smoothTransitions ?? true,
      transitionDuration: config.options?.transitionDuration ?? DEFAULT_TRANSITION_DURATION,
      transitionEasing: config.options?.transitionEasing ?? easeInOutCubic,
      autoUpdate: config.options?.autoUpdate ?? true,
      onLevelChange: config.options?.onLevelChange ?? (() => {}),
    };

    // Calculate vertex counts for each level
    this.vertexCounts = [
      this.getVertexCount(config.highDetail),
      this.getVertexCount(config.mediumDetail),
      this.getVertexCount(config.lowDetail),
    ];

    this.state = {
      currentLevel: 0,
      previousLevel: 0,
      transitionProgress: 1,
      isTransitioning: false,
      distance: 0,
      lastChangeTime: 0,
    };

    this.metrics = {
      drawCallsSaved: 0,
      currentVertexCount: this.vertexCounts[0],
      maxVertexCount: this.vertexCounts[0],
      vertexReductionPercent: 0,
      calculationTime: 0,
    };

    this.group = new THREE.Group();
    this.group.name = `mascot-lod-${config.mascotId}`;

    this.createMeshes();
  }

  /**
   * Get vertex count from geometry
   */
  private getVertexCount(geometry: THREE.BufferGeometry): number {
    return geometry.attributes.position?.count ?? 0;
  }

  /**
   * Get material for a specific LOD level
   */
  private getMaterial(level: number): THREE.Material | THREE.Material[] {
    const { material, materials } = this.config;
    
    if (materials) {
      switch (level) {
        case 0:
          return materials.high ?? material ?? new THREE.MeshStandardMaterial();
        case 1:
          return materials.medium ?? material ?? new THREE.MeshStandardMaterial();
        case 2:
          return materials.low ?? material ?? new THREE.MeshStandardMaterial();
        default:
          return material ?? new THREE.MeshStandardMaterial();
      }
    }
    
    return material ?? new THREE.MeshStandardMaterial();
  }

  /**
   * Create mesh for each LOD level
   */
  private createMeshes(): void {
    const geometries = [
      this.config.highDetail,
      this.config.mediumDetail,
      this.config.lowDetail,
    ];

    geometries.forEach((geometry, level) => {
      const material = this.getMaterial(level);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${this.config.mascotId}-lod-${level}`;
      mesh.visible = level === 0;
      mesh.castShadow = level === 0;
      mesh.receiveShadow = level === 0;
      
      // Optimization: Disable raycasting on lower LODs
      mesh.raycast = level === 0 ? THREE.Mesh.prototype.raycast : () => {};
      
      this.meshes.push(mesh);
      this.group.add(mesh);
    });
  }

  /**
   * Get the THREE.Group containing all LOD meshes
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Get current LOD state
   */
  getState(): LODState {
    return { ...this.state };
  }

  /**
   * Get current metrics
   */
  getMetrics(): LODMetrics {
    return { ...this.metrics };
  }

  /**
   * Update LOD based on camera distance
   */
  update(cameraPosition: THREE.Vector3, deltaTime: number): void {
    const startTime = performance.now();

    // Calculate distance to camera
    const distance = this.group.position.distanceTo(cameraPosition);
    this.state.distance = distance;

    // Determine target LOD level
    const targetLevel = this.calculateLODLevel(distance);

    // Handle level change
    if (targetLevel !== this.state.currentLevel && !this.state.isTransitioning) {
      this.startTransition(targetLevel);
    }

    // Update transition
    if (this.state.isTransitioning) {
      this.updateTransition(deltaTime);
    }

    // Update metrics
    this.metrics.calculationTime = performance.now() - startTime;
    this.updateMetrics();
  }

  /**
   * Calculate LOD level based on distance
   */
  private calculateLODLevel(distance: number): number {
    const [high, medium, low] = this.options.distanceThresholds;

    if (distance < high) return 0;
    if (distance < medium) return 1;
    if (distance < low) return 2;
    return 2; // Default to lowest detail beyond max distance
  }

  /**
   * Start LOD level transition
   */
  private startTransition(newLevel: number): void {
    this.state.previousLevel = this.state.currentLevel;
    this.state.currentLevel = newLevel;
    this.state.isTransitioning = this.options.smoothTransitions;
    this.state.transitionProgress = 0;
    this.state.lastChangeTime = performance.now();

    // If smooth transitions disabled, immediately switch
    if (!this.options.smoothTransitions) {
      this.switchMeshes(newLevel);
      this.state.isTransitioning = false;
      this.state.transitionProgress = 1;
    }

    // Trigger callback
    this.options.onLevelChange(newLevel, this.state.previousLevel);
  }

  /**
   * Update transition animation
   */
  private updateTransition(deltaTime: number): void {
    this.state.transitionProgress += deltaTime / this.options.transitionDuration;

    if (this.state.transitionProgress >= 1) {
      this.state.transitionProgress = 1;
      this.state.isTransitioning = false;
      this.switchMeshes(this.state.currentLevel);
    } else {
      // Cross-fade opacity during transition
      const eased = this.options.transitionEasing(this.state.transitionProgress);
      this.updateCrossFade(eased);
    }
  }

  /**
   * Update cross-fade between LOD levels
   */
  private updateCrossFade(progress: number): void {
    const prevMesh = this.meshes[this.state.previousLevel];
    const currMesh = this.meshes[this.state.currentLevel];

    // Make both meshes visible during transition
    prevMesh.visible = true;
    currMesh.visible = true;

    // Update opacity (requires transparent materials)
    const updateOpacity = (mesh: THREE.Mesh, opacity: number) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(mat => {
        if ('opacity' in mat) {
          mat.transparent = true;
          mat.opacity = opacity;
        }
      });
    };

    updateOpacity(prevMesh, 1 - progress);
    updateOpacity(currMesh, progress);
  }

  /**
   * Switch to target LOD level immediately
   */
  private switchMeshes(targetLevel: number): void {
    this.meshes.forEach((mesh, index) => {
      mesh.visible = index === targetLevel;
      
      // Reset opacity
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(mat => {
        if ('opacity' in mat) {
          mat.opacity = 1;
          mat.transparent = false;
        }
      });
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const currentVertices = this.vertexCounts[this.state.currentLevel];
    const maxVertices = this.vertexCounts[0];
    
    this.metrics.currentVertexCount = currentVertices;
    this.metrics.vertexReductionPercent = 
      maxVertices > 0 ? ((maxVertices - currentVertices) / maxVertices) * 100 : 0;
    
    // Estimate draw calls saved (rough approximation)
    this.metrics.drawCallsSaved = this.state.currentLevel * 2; // Simplified estimate
  }

  /**
   * Force LOD level (for debugging or manual override)
   */
  forceLevel(level: number): void {
    if (level < 0 || level > 2) return;
    
    this.state.currentLevel = level;
    this.state.previousLevel = level;
    this.state.isTransitioning = false;
    this.state.transitionProgress = 1;
    this.switchMeshes(level);
    this.updateMetrics();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.meshes.forEach(mesh => {
      this.group.remove(mesh);
      // Note: We don't dispose geometry/material here as they may be shared
    });
    this.meshes = [];
  }
}

/**
 * LODManager - Manages LOD for multiple mascots in a scene
 */
export class LODManager {
  private mascots: Map<string, MascotLOD> = new Map();
  private camera: THREE.Camera | null = null;
  private isRunning = false;

  /**
   * Register a mascot with LOD
   */
  registerMascot(config: MascotLODConfig): MascotLOD {
    const lod = new MascotLOD(config);
    this.mascots.set(config.mascotId, lod);
    return lod;
  }

  /**
   * Unregister a mascot
   */
  unregisterMascot(mascotId: string): void {
    const lod = this.mascots.get(mascotId);
    if (lod) {
      lod.dispose();
      this.mascots.delete(mascotId);
    }
  }

  /**
   * Set the camera for distance calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Update all mascot LODs
   */
  update(deltaTime: number): void {
    if (!this.camera || !this.isRunning) return;

    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);

    this.mascots.forEach(lod => {
      lod.update(cameraPosition, deltaTime);
    });
  }

  /**
   * Start automatic LOD updates
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * Stop automatic LOD updates
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get all registered mascots
   */
  getMascots(): Map<string, MascotLOD> {
    return this.mascots;
  }

  /**
   * Get aggregate metrics for all mascots
   */
  getAggregateMetrics(): {
    totalMascots: number;
    totalVertexCount: number;
    maxVertexCount: number;
    averageReduction: number;
  } {
    let totalVertices = 0;
    let maxVertices = 0;
    let totalReduction = 0;

    this.mascots.forEach(lod => {
      const metrics = lod.getMetrics();
      totalVertices += metrics.currentVertexCount;
      maxVertices += metrics.maxVertexCount;
      totalReduction += metrics.vertexReductionPercent;
    });

    const count = this.mascots.size;
    return {
      totalMascots: count,
      totalVertexCount: totalVertices,
      maxVertexCount: maxVertices,
      averageReduction: count > 0 ? totalReduction / count : 0,
    };
  }

  /**
   * Force all mascots to a specific LOD level
   */
  forceAllLevels(level: number): void {
    this.mascots.forEach(lod => lod.forceLevel(level));
  }

  /**
   * Dispose of all LOD resources
   */
  dispose(): void {
    this.mascots.forEach(lod => lod.dispose());
    this.mascots.clear();
    this.camera = null;
    this.isRunning = false;
  }
}

/**
 * Create standard LOD geometries for a mascot model
 * Reduces vertex count for medium and low detail levels
 */
export function createLODGeometries(
  highDetailGeometry: THREE.BufferGeometry,
  reductionRatios: [number, number] = [0.5, 0.25]
): [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry] {
  // Clone high detail for modifications
  const mediumDetail = highDetailGeometry.clone();
  const lowDetail = highDetailGeometry.clone();

  // Apply reduction (simplified - in practice, use proper decimation)
  // This is a placeholder implementation
  const mediumRatio = reductionRatios[0];
  const lowRatio = reductionRatios[1];

  // Create simplified versions by scaling geometry complexity
  // In production, use libraries like @gltf-transform/core for proper decimation
  
  return [highDetailGeometry, mediumDetail, lowDetail];
}

/**
 * Utility to estimate geometry complexity
 */
export function estimateGeometryComplexity(geometry: THREE.BufferGeometry): {
  vertices: number;
  triangles: number;
  memoryBytes: number;
} {
  const positionAttr = geometry.attributes.position;
  const vertices = positionAttr?.count ?? 0;
  const index = geometry.index;
  const triangles = index ? index.count / 3 : vertices / 3;
  
  // Estimate memory usage
  let memoryBytes = 0;
  for (const key in geometry.attributes) {
    const attr = geometry.attributes[key];
    memoryBytes += attr.array.byteLength;
  }
  if (index) {
    memoryBytes += index.array.byteLength;
  }

  return { vertices, triangles, memoryBytes };
}
