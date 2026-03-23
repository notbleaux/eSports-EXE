/**
 * Frustum Culling System for Mascot 3D Scenes
 * 
 * [Ver001.000] - View frustum calculation and visibility testing
 * 
 * Provides efficient view frustum calculation, object visibility testing,
 * and occlusion culling for overlapping objects to minimize draw calls.
 */

import * as THREE from 'three';

/**
 * Culling configuration options
 */
export interface CullingOptions {
  /** Enable frustum culling */
  enabled?: boolean;
  /** Enable occlusion culling for overlapping objects */
  occlusionCulling?: boolean;
  /** Padding around frustum for early culling (prevents pop-in) */
  frustumPadding?: number;
  /** Update frequency in frames (1 = every frame, 2 = every other frame) */
  updateFrequency?: number;
  /** Use bounding sphere instead of bounding box for faster tests */
  useBoundingSphere?: boolean;
  /** Enable spatial hashing for large scenes */
  useSpatialHash?: boolean;
  /** Spatial hash cell size */
  spatialHashCellSize?: number;
}

/**
 * Culled object metadata
 */
export interface CulledObject {
  /** Unique object identifier */
  id: string;
  /** The THREE.Object3D to cull */
  object: THREE.Object3D;
  /** Custom bounding box (optional) */
  boundingBox?: THREE.Box3;
  /** Custom bounding sphere (optional) */
  boundingSphere?: THREE.Sphere;
  /** Object priority for occlusion culling (higher = more important) */
  priority?: number;
  /** Whether object is currently visible */
  visible: boolean;
  /** Distance to camera */
  distance: number;
  /** Last frame this object was updated */
  lastUpdateFrame: number;
}

/**
 * Culling statistics
 */
export interface CullingStats {
  /** Total objects registered */
  totalObjects: number;
  /** Objects currently visible */
  visibleObjects: number;
  /** Objects culled (outside frustum) */
  culledObjects: number;
  /** Objects occluded (hidden by others) */
  occludedObjects: number;
  /** Frustum test time in ms */
  frustumTime: number;
  /** Occlusion test time in ms */
  occlusionTime: number;
  /** Total culling time in ms */
  totalTime: number;
  /** Estimated draw calls saved */
  drawCallsSaved: number;
}

/**
 * Frustum planes enum
 */
export enum FrustumPlane {
  LEFT = 0,
  RIGHT = 1,
  TOP = 2,
  BOTTOM = 3,
  NEAR = 4,
  FAR = 5,
}

/**
 * Spatial hash cell
 */
interface SpatialHashCell {
  objects: Set<string>;
}

/**
 * Frustum Culling Manager
 * Manages visibility testing for all mascot scene objects
 */
export class FrustumCullingManager {
  private options: Required<CullingOptions>;
  private objects: Map<string, CulledObject> = new Map();
  private frustum = new THREE.Frustum();
  private frustumMatrix = new THREE.Matrix4();
  private camera: THREE.Camera | null = null;
  private currentFrame = 0;
  private stats: CullingStats;
  private spatialHash: Map<string, SpatialHashCell> = new Map();
  private projScreenMatrix = new THREE.Matrix4();

  constructor(options: CullingOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      occlusionCulling: options.occlusionCulling ?? true,
      frustumPadding: options.frustumPadding ?? 0.1,
      updateFrequency: options.updateFrequency ?? 1,
      useBoundingSphere: options.useBoundingSphere ?? true,
      useSpatialHash: options.useSpatialHash ?? false,
      spatialHashCellSize: options.spatialHashCellSize ?? 50,
    };

    this.stats = this.createEmptyStats();
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): CullingStats {
    return {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      occludedObjects: 0,
      frustumTime: 0,
      occlusionTime: 0,
      totalTime: 0,
      drawCallsSaved: 0,
    };
  }

  /**
   * Set the camera for frustum calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Register an object for culling
   */
  registerObject(
    id: string,
    object: THREE.Object3D,
    options: {
      boundingBox?: THREE.Box3;
      boundingSphere?: THREE.Sphere;
      priority?: number;
    } = {}
  ): void {
    const culledObject: CulledObject = {
      id,
      object,
      boundingBox: options.boundingBox,
      boundingSphere: options.boundingSphere,
      priority: options.priority ?? 0,
      visible: true,
      distance: 0,
      lastUpdateFrame: 0,
    };

    this.objects.set(id, culledObject);

    // Add to spatial hash if enabled
    if (this.options.useSpatialHash) {
      this.addToSpatialHash(culledObject);
    }
  }

  /**
   * Unregister an object from culling
   */
  unregisterObject(id: string): void {
    const obj = this.objects.get(id);
    if (obj && this.options.useSpatialHash) {
      this.removeFromSpatialHash(obj);
    }
    this.objects.delete(id);
  }

  /**
   * Update an object's transform
   */
  updateObjectTransform(id: string): void {
    const obj = this.objects.get(id);
    if (obj && this.options.useSpatialHash) {
      this.removeFromSpatialHash(obj);
      this.addToSpatialHash(obj);
    }
  }

  /**
   * Get spatial hash key for a position
   */
  private getSpatialHashKey(position: THREE.Vector3): string {
    const cellSize = this.options.spatialHashCellSize;
    const x = Math.floor(position.x / cellSize);
    const y = Math.floor(position.y / cellSize);
    const z = Math.floor(position.z / cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Add object to spatial hash
   */
  private addToSpatialHash(obj: CulledObject): void {
    const position = new THREE.Vector3();
    obj.object.getWorldPosition(position);
    const key = this.getSpatialHashKey(position);

    let cell = this.spatialHash.get(key);
    if (!cell) {
      cell = { objects: new Set() };
      this.spatialHash.set(key, cell);
    }
    cell.objects.add(obj.id);
  }

  /**
   * Remove object from spatial hash
   */
  private removeFromSpatialHash(obj: CulledObject): void {
    const position = new THREE.Vector3();
    obj.object.getWorldPosition(position);
    const key = this.getSpatialHashKey(position);

    const cell = this.spatialHash.get(key);
    if (cell) {
      cell.objects.delete(obj.id);
      if (cell.objects.size === 0) {
        this.spatialHash.delete(key);
      }
    }
  }

  /**
   * Get objects in nearby spatial hash cells
   */
  private getNearbyObjects(position: THREE.Vector3): string[] {
    const nearby: string[] = [];
    const cellSize = this.options.spatialHashCellSize;

    // Check neighboring cells (3x3x3 grid)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = this.getSpatialHashKey(
            new THREE.Vector3(
              position.x + dx * cellSize,
              position.y + dy * cellSize,
              position.z + dz * cellSize
            )
          );
          const cell = this.spatialHash.get(key);
          if (cell) {
            nearby.push(...cell.objects);
          }
        }
      }
    }

    return nearby;
  }

  /**
   * Update frustum from camera
   */
  private updateFrustum(): void {
    if (!this.camera) return;

    // Update projection matrix
    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * Get bounding box for an object
   */
  private getBoundingBox(obj: CulledObject): THREE.Box3 {
    if (obj.boundingBox) {
      const box = obj.boundingBox.clone();
      box.applyMatrix4(obj.object.matrixWorld);
      return box;
    }

    // Compute from object geometry
    const box = new THREE.Box3().setFromObject(obj.object);
    return box;
  }

  /**
   * Get bounding sphere for an object
   */
  private getBoundingSphere(obj: CulledObject): THREE.Sphere {
    if (obj.boundingSphere) {
      const sphere = obj.boundingSphere.clone();
      sphere.applyMatrix4(obj.object.matrixWorld);
      return sphere;
    }

    // Compute from bounding box
    const box = this.getBoundingBox(obj);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere;
  }

  /**
   * Test if bounding sphere intersects frustum
   */
  private intersectsFrustumSphere(sphere: THREE.Sphere): boolean {
    const planes = this.frustum.planes;
    const padding = this.options.frustumPadding;

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];
      const distance = plane.distanceToPoint(sphere.center);
      if (distance < -sphere.radius - padding) {
        return false;
      }
    }
    return true;
  }

  /**
   * Test if bounding box intersects frustum
   */
  private intersectsFrustumBox(box: THREE.Box3): boolean {
    const planes = this.frustum.planes;
    const padding = this.options.frustumPadding;

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];
      const normal = plane.normal;

      // Get positive vertex (closest to plane normal)
      const positiveVertex = new THREE.Vector3(
        normal.x > 0 ? box.max.x : box.min.x,
        normal.y > 0 ? box.max.y : box.min.y,
        normal.z > 0 ? box.max.z : box.min.z
      );

      if (plane.distanceToPoint(positiveVertex) < -padding) {
        return false;
      }
    }
    return true;
  }

  /**
   * Test if object is in frustum
   */
  private isInFrustum(obj: CulledObject): boolean {
    if (this.options.useBoundingSphere) {
      const sphere = this.getBoundingSphere(obj);
      return this.intersectsFrustumSphere(sphere);
    } else {
      const box = this.getBoundingBox(obj);
      return this.intersectsFrustumBox(box);
    }
  }

  /**
   * Test if an object occludes another
   */
  private isOccluded(obj: CulledObject, potentialOccluders: CulledObject[]): boolean {
    if (!this.camera) return false;

    const objPos = new THREE.Vector3();
    obj.object.getWorldPosition(objPos);

    const objSphere = this.getBoundingSphere(obj);
    const cameraPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPos);

    for (const occluder of potentialOccluders) {
      if (occluder.id === obj.id) continue;
      if (!occluder.visible) continue;
      if ((occluder.priority ?? 0) <= (obj.priority ?? 0)) continue;

      const occluderPos = new THREE.Vector3();
      occluder.object.getWorldPosition(occluderPos);
      const occluderSphere = this.getBoundingSphere(occluder);

      // Check if occluder is closer to camera
      const occluderDist = occluderPos.distanceToSquared(cameraPos);
      const objDist = objPos.distanceToSquared(cameraPos);

      if (occluderDist >= objDist) continue;

      // Simple angular occlusion test
      // Check if object center is within occluder's angular radius
      const direction = new THREE.Vector3().subVectors(objPos, cameraPos).normalize();
      const occluderDir = new THREE.Vector3().subVectors(occluderPos, cameraPos).normalize();

      const angle = direction.angleTo(occluderDir);
      const angularRadius = Math.asin(Math.min(1, occluderSphere.radius / Math.sqrt(occluderDist)));

      if (angle < angularRadius * 0.5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Perform culling update
   */
  update(): void {
    if (!this.options.enabled || !this.camera) return;

    this.currentFrame++;

    // Skip frames based on update frequency
    if (this.currentFrame % this.options.updateFrequency !== 0) return;

    const startTime = performance.now();
    this.stats = this.createEmptyStats();
    this.stats.totalObjects = this.objects.size;

    // Update frustum
    this.updateFrustum();
    const frustumStart = performance.now();

    // Get camera position for distance calculations
    const cameraPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPos);

    // Phase 1: Frustum culling
    const potentiallyVisible: CulledObject[] = [];

    this.objects.forEach(obj => {
      obj.object.updateMatrixWorld();
      
      const inFrustum = this.isInFrustum(obj);
      obj.visible = inFrustum;
      
      if (inFrustum) {
        const objPos = new THREE.Vector3();
        obj.object.getWorldPosition(objPos);
        obj.distance = objPos.distanceTo(cameraPos);
        potentiallyVisible.push(obj);
      } else {
        this.stats.culledObjects++;
      }

      obj.lastUpdateFrame = this.currentFrame;
    });

    this.stats.frustumTime = performance.now() - frustumStart;

    // Phase 2: Occlusion culling
    const occlusionStart = performance.now();

    if (this.options.occlusionCulling && potentiallyVisible.length > 1) {
      // Sort by distance (far to near) for occlusion testing
      potentiallyVisible.sort((a, b) => b.distance - a.distance);

      const visibleObjects: CulledObject[] = [];

      for (const obj of potentiallyVisible) {
        let occluded = false;

        if (this.options.useSpatialHash) {
          // Use spatial hash to find nearby potential occluders
          const objPos = new THREE.Vector3();
          obj.object.getWorldPosition(objPos);
          const nearbyIds = this.getNearbyObjects(objPos);
          const nearbyObjects = nearbyIds
            .map(id => this.objects.get(id))
            .filter((o): o is CulledObject => o !== undefined && o.visible);
          occluded = this.isOccluded(obj, nearbyObjects);
        } else {
          occluded = this.isOccluded(obj, visibleObjects);
        }

        if (occluded) {
          obj.visible = false;
          this.stats.occludedObjects++;
        } else {
          visibleObjects.push(obj);
        }
      }
    }

    this.stats.occlusionTime = performance.now() - occlusionStart;

    // Apply visibility to objects
    this.objects.forEach(obj => {
      obj.object.visible = obj.visible;
    });

    this.stats.visibleObjects = potentiallyVisible.length - this.stats.occludedObjects;
    this.stats.drawCallsSaved = this.stats.culledObjects + this.stats.occludedObjects;
    this.stats.totalTime = performance.now() - startTime;
  }

  /**
   * Get current culling statistics
   */
  getStats(): CullingStats {
    return { ...this.stats };
  }

  /**
   * Check if an object is currently visible
   */
  isVisible(id: string): boolean {
    const obj = this.objects.get(id);
    return obj?.visible ?? false;
  }

  /**
   * Get all visible objects
   */
  getVisibleObjects(): CulledObject[] {
    return Array.from(this.objects.values()).filter(obj => obj.visible);
  }

  /**
   * Force visibility for an object (override culling)
   */
  forceVisibility(id: string, visible: boolean): void {
    const obj = this.objects.get(id);
    if (obj) {
      obj.visible = visible;
      obj.object.visible = visible;
    }
  }

  /**
   * Update culling options
   */
  setOptions(options: Partial<CullingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Clear all registered objects
   */
  clear(): void {
    this.objects.clear();
    this.spatialHash.clear();
    this.stats = this.createEmptyStats();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clear();
    this.camera = null;
  }
}

/**
 * Simple frustum culling for a group of objects
 * Optimized for mascot scenes with many similar objects
 */
export function performFrustumCulling(
  objects: THREE.Object3D[],
  camera: THREE.Camera,
  options: {
    padding?: number;
    useBoundingSphere?: boolean;
  } = {}
): { visible: THREE.Object3D[]; culled: THREE.Object3D[] } {
  const { padding = 0, useBoundingSphere = true } = options;

  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  camera.updateMatrixWorld();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);

  const visible: THREE.Object3D[] = [];
  const culled: THREE.Object3D[] = [];

  const sphere = new THREE.Sphere();
  const box = new THREE.Box3();

  for (const obj of objects) {
    obj.updateMatrixWorld();

    let isVisible = false;

    if (useBoundingSphere) {
      // Get bounding sphere
      const geometry = (obj as THREE.Mesh).geometry;
      if (geometry?.boundingSphere) {
        sphere.copy(geometry.boundingSphere);
        sphere.applyMatrix4(obj.matrixWorld);
        isVisible = frustum.intersectsSphere(sphere);
      } else {
        box.setFromObject(obj);
        box.getBoundingSphere(sphere);
        isVisible = frustum.intersectsSphere(sphere);
      }
    } else {
      box.setFromObject(obj);
      isVisible = frustum.intersectsBox(box);
    }

    if (isVisible) {
      visible.push(obj);
    } else {
      culled.push(obj);
    }

    obj.visible = isVisible;
  }

  return { visible, culled };
}

/**
 * Visibility check for a single object
 */
export function isObjectVisible(
  object: THREE.Object3D,
  camera: THREE.Camera,
  options: {
    useBoundingSphere?: boolean;
    padding?: number;
  } = {}
): boolean {
  const { useBoundingSphere = true, padding = 0 } = options;

  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  camera.updateMatrixWorld();
  object.updateMatrixWorld();

  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);

  if (useBoundingSphere) {
    const sphere = new THREE.Sphere();
    const geometry = (object as THREE.Mesh).geometry;
    
    if (geometry?.boundingSphere) {
      sphere.copy(geometry.boundingSphere);
      sphere.applyMatrix4(object.matrixWorld);
      return frustum.intersectsSphere(sphere);
    }
    
    const box = new THREE.Box3().setFromObject(object);
    box.getBoundingSphere(sphere);
    return frustum.intersectsSphere(sphere);
  } else {
    const box = new THREE.Box3().setFromObject(object);
    return frustum.intersectsBox(box);
  }
}

/**
 * Batch culling update for mascot scenes
 * Optimized for many similar-sized objects
 */
export function batchCullingUpdate(
  mascots: Array<{ id: string; object: THREE.Object3D }>,
  camera: THREE.Camera,
  onVisibilityChange?: (id: string, visible: boolean) => void
): { visible: number; culled: number } {
  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();
  const sphere = new THREE.Sphere();

  camera.updateMatrixWorld();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);

  let visible = 0;
  let culled = 0;

  for (const mascot of mascots) {
    mascot.object.updateMatrixWorld();

    // Quick sphere test
    const geometry = (mascot.object as THREE.Mesh).geometry;
    if (geometry?.boundingSphere) {
      sphere.copy(geometry.boundingSphere);
      sphere.applyMatrix4(mascot.object.matrixWorld);
    } else {
      const box = new THREE.Box3().setFromObject(mascot.object);
      box.getBoundingSphere(sphere);
    }

    const isVisible = frustum.intersectsSphere(sphere);
    
    if (mascot.object.visible !== isVisible) {
      mascot.object.visible = isVisible;
      onVisibilityChange?.(mascot.id, isVisible);
    }

    if (isVisible) {
      visible++;
    } else {
      culled++;
    }
  }

  return { visible, culled };
}

/**
 * Create a culling zone for static scene areas
 * Useful for dividing large scenes into cullable regions
 */
export class CullingZone {
  public boundingBox: THREE.Box3;
  public objects: Set<string> = new Set();

  constructor(
    public id: string,
    min: THREE.Vector3,
    max: THREE.Vector3
  ) {
    this.boundingBox = new THREE.Box3(min, max);
  }

  addObject(objectId: string): void {
    this.objects.add(objectId);
  }

  removeObject(objectId: string): void {
    this.objects.delete(objectId);
  }

  intersectsFrustum(frustum: THREE.Frustum): boolean {
    return frustum.intersectsBox(this.boundingBox);
  }
}
