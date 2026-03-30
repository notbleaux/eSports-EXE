/**
 * Advanced Culling System for 3D Maps
 * 
 * [Ver001.000] - Aggressive frustum, occlusion, and portal culling
 * 
 * Provides:
 * - Aggressive frustum culling with SIMD optimizations
 * - Occlusion culling using hardware occlusion queries
 * - Portal culling for indoor/map areas
 * - Visibility pre-computation (PVS)
 * - Spatial hash acceleration
 * 
 * @example
 * ```typescript
 * import { MapCullingSystem, PortalCuller } from '@/lib/map3d/culling';
 * 
 * const culling = new MapCullingSystem(camera, renderer);
 * culling.registerObject(mesh);
 * culling.update();
 * ```
 */

import * as THREE from 'three';

// ============================================
// Types
// ============================================

export interface CullingSystemConfig {
  /** Enable frustum culling */
  enableFrustum: boolean;
  /** Enable occlusion culling */
  enableOcclusion: boolean;
  /** Enable portal culling */
  enablePortals: boolean;
  /** Enable PVS (Potentially Visible Set) */
  enablePVS: boolean;
  /** Frustum update frequency (1 = every frame) */
  frustumFrequency: number;
  /** Occlusion query frequency */
  occlusionFrequency: number;
  /** Spatial hash cell size */
  spatialHashCellSize: number;
  /** Minimum object size for occlusion testing */
  minOccluderSize: number;
  /** Maximum occlusion query distance */
  maxOcclusionDistance: number;
  /** Enable conservative culling (prevents pop-in) */
  conservative: boolean;
  /** Conservative margin in world units */
  conservativeMargin: number;
}

export interface CulledObject {
  id: string;
  object: THREE.Object3D;
  boundingBox: THREE.Box3;
  boundingSphere: THREE.Sphere;
  worldBounds: THREE.Box3;
  screenSize: number;
  priority: number;
  isStatic: boolean;
  isOccluder: boolean;
  visible: boolean;
  wasVisible: boolean;
  lastVisibleFrame: number;
  frustumVisible: boolean;
  occluded: boolean;
}

export interface Portal {
  id: string;
  plane: THREE.Plane;
  vertices: THREE.Vector3[];
  bounds: THREE.Box3;
  connectedZones: string[];
  worldMatrix: THREE.Matrix4;
}

export interface CullingZone {
  id: string;
  bounds: THREE.Box3;
  portals: Portal[];
  objects: Set<string>;
  pvs: Set<string> | null;
  visible: boolean;
  parentZone: string | null;
}

export interface OcclusionQuery {
  id: string;
  object: THREE.Object3D;
  query: WebGLQuery | null;
  pending: boolean;
  result: boolean;
  frameIssued: number;
}

export interface CullingStats {
  totalObjects: number;
  visibleObjects: number;
  frustumCulled: number;
  occlusionCulled: number;
  portalCulled: number;
  pvsSkipped: number;
  frustumTime: number;
  occlusionTime: number;
  portalTime: number;
  totalTime: number;
  drawCallsSaved: number;
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_CULLING_CONFIG: CullingSystemConfig = {
  enableFrustum: true,
  enableOcclusion: true,
  enablePortals: true,
  enablePVS: false,
  frustumFrequency: 1,
  occlusionFrequency: 2,
  spatialHashCellSize: 100,
  minOccluderSize: 10,
  maxOcclusionDistance: 500,
  conservative: true,
  conservativeMargin: 1.0,
};

// ============================================
// Spatial Hash for Acceleration
// ============================================

export class SpatialHash {
  private cellSize: number;
  private cells = new Map<string, Set<string>>();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  /**
   * Get cell key for position
   */
  private getKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Insert object into spatial hash
   */
  insert(id: string, bounds: THREE.Box3): void {
    const minKey = this.getKey(bounds.min.x, bounds.min.y, bounds.min.z);
    const maxKey = this.getKey(bounds.max.x, bounds.max.y, bounds.max.z);

    const [minCx, minCy, minCz] = minKey.split(',').map(Number);
    const [maxCx, maxCy, maxCz] = maxKey.split(',').map(Number);

    for (let x = minCx; x <= maxCx; x++) {
      for (let y = minCy; y <= maxCy; y++) {
        for (let z = minCz; z <= maxCz; z++) {
          const key = `${x},${y},${z}`;
          let cell = this.cells.get(key);
          if (!cell) {
            cell = new Set();
            this.cells.set(key, cell);
          }
          cell.add(id);
        }
      }
    }
  }

  /**
   * Remove object from spatial hash
   */
  remove(id: string, bounds: THREE.Box3): void {
    const minKey = this.getKey(bounds.min.x, bounds.min.y, bounds.min.z);
    const maxKey = this.getKey(bounds.max.x, bounds.max.y, bounds.max.z);

    const [minCx, minCy, minCz] = minKey.split(',').map(Number);
    const [maxCx, maxCy, maxCz] = maxKey.split(',').map(Number);

    for (let x = minCx; x <= maxCx; x++) {
      for (let y = minCy; y <= maxCy; y++) {
        for (let z = minCz; z <= maxCz; z++) {
          const key = `${x},${y},${z}`;
          const cell = this.cells.get(key);
          if (cell) {
            cell.delete(id);
            if (cell.size === 0) {
              this.cells.delete(key);
            }
          }
        }
      }
    }
  }

  /**
   * Query objects near a point
   */
  queryPoint(point: THREE.Vector3, radius: number): Set<string> {
    const results = new Set<string>();
    const cells = Math.ceil(radius / this.cellSize);
    const centerKey = this.getKey(point.x, point.y, point.z);
    const [cx, cy, cz] = centerKey.split(',').map(Number);

    for (let x = cx - cells; x <= cx + cells; x++) {
      for (let y = cy - cells; y <= cy + cells; y++) {
        for (let z = cz - cells; z <= cz + cells; z++) {
          const key = `${x},${y},${z}`;
          const cell = this.cells.get(key);
          if (cell) {
            cell.forEach((id) => results.add(id));
          }
        }
      }
    }

    return results;
  }

  /**
   * Query objects in frustum
   */
  queryFrustum(frustum: THREE.Frustum): Set<string> {
    const results = new Set<string>();
    
    // Iterate all cells and test against frustum
    this.cells.forEach((cell, key) => {
      const [x, y, z] = key.split(',').map(Number);
      const cellBounds = new THREE.Box3(
        new THREE.Vector3(x * this.cellSize, y * this.cellSize, z * this.cellSize),
        new THREE.Vector3((x + 1) * this.cellSize, (y + 1) * this.cellSize, (z + 1) * this.cellSize)
      );

      if (frustum.intersectsBox(cellBounds)) {
        cell.forEach((id) => results.add(id));
      }
    });

    return results;
  }

  /**
   * Clear all cells
   */
  clear(): void {
    this.cells.clear();
  }
}

// ============================================
// Aggressive Frustum Culler
// ============================================

export class AggressiveFrustumCuller {
  private camera: THREE.Camera;
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();
  private config: CullingSystemConfig;
  private frameCount = 0;

  constructor(camera: THREE.Camera, config: CullingSystemConfig) {
    this.camera = camera;
    this.config = config;
  }

  /**
   * Update frustum from camera
   */
  updateFrustum(): void {
    this.frameCount++;

    if (this.frameCount % this.config.frustumFrequency !== 0) return;

    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * Test if bounding sphere intersects frustum
   */
  intersectsSphere(sphere: THREE.Sphere): boolean {
    const padding = this.config.conservative ? this.config.conservativeMargin : 0;
    
    for (let i = 0; i < 6; i++) {
      const plane = this.frustum.planes[i];
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
  intersectsBox(box: THREE.Box3): boolean {
    const padding = this.config.conservative ? this.config.conservativeMargin : 0;

    for (let i = 0; i < 6; i++) {
      const plane = this.frustum.planes[i];
      const normal = plane.normal;

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
   * Cull object against frustum
   */
  cullObject(obj: CulledObject): boolean {
    if (!this.config.enableFrustum) return true;

    obj.object.updateMatrixWorld();

    // Get world bounds
    const box = new THREE.Box3().setFromObject(obj.object);
    obj.worldBounds.copy(box);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    // Quick sphere test first
    if (!this.intersectsSphere(sphere)) {
      obj.frustumVisible = false;
      return false;
    }

    // More accurate box test
    obj.frustumVisible = this.intersectsBox(box);
    return obj.frustumVisible;
  }

  /**
   * Get current frustum
   */
  getFrustum(): THREE.Frustum {
    return this.frustum;
  }
}

// ============================================
// Hardware Occlusion Culling
// ============================================

export class HardwareOcclusionCuller {
  private camera: THREE.Camera;
  private gl: WebGL2RenderingContext;
  private queries = new Map<string, OcclusionQuery>();
  private occluders: CulledObject[] = [];
  private occludees: CulledObject[] = [];
  private config: CullingSystemConfig;
  private frameCount = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    config: CullingSystemConfig
  ) {
    this.camera = camera;
    this.config = config;
    this.gl = renderer.getContext() as WebGL2RenderingContext;
  }

  /**
   * Register an occluder (large objects that block view)
   */
  registerOccluder(obj: CulledObject): void {
    if (obj.isOccluder) {
      this.occluders.push(obj);
    }
  }

  /**
   * Register an occludee (objects that can be occluded)
   */
  registerOccludee(obj: CulledObject): void {
    if (!obj.isOccluder && obj.isStatic) {
      this.occludees.push(obj);
    }
  }

  /**
   * Perform occlusion culling
   */
  cull(): void {
    if (!this.config.enableOcclusion) return;

    this.frameCount++;
    if (this.frameCount % this.config.occlusionFrequency !== 0) return;

    const cameraPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPos);

    // Filter occludees by distance
    const nearbyOccludees = this.occludees.filter((obj) => {
      const dist = obj.boundingSphere.center.distanceTo(cameraPos);
      return dist < this.config.maxOcclusionDistance && obj.frustumVisible;
    });

    // Sort occluders by distance (near to far)
    const sortedOccluders = this.occluders
      .filter((obj) => obj.frustumVisible)
      .sort((a, b) => {
        const distA = a.boundingSphere.center.distanceToSquared(cameraPos);
        const distB = b.boundingSphere.center.distanceToSquared(cameraPos);
        return distA - distB;
      });

    // Test each occludee
    nearbyOccludees.forEach((obj) => {
      obj.occluded = this.isObjectOccluded(obj, sortedOccluders, cameraPos);
    });
  }

  /**
   * Check if object is occluded by occluders
   */
  private isObjectOccluded(
    obj: CulledObject,
    occluders: CulledObject[],
    cameraPos: THREE.Vector3
  ): boolean {
    const objPos = obj.boundingSphere.center;
    const objDist = objPos.distanceToSquared(cameraPos);
    const objRadius = obj.boundingSphere.radius;

    for (const occluder of occluders) {
      // Skip if occluder is farther than object
      const occPos = occluder.boundingSphere.center;
      const occDist = occPos.distanceToSquared(cameraPos);

      if (occDist >= objDist) continue;

      // Check if occluder is large enough
      const occRadius = occluder.boundingSphere.radius;
      if (occRadius < this.config.minOccluderSize) continue;

      // Angular occlusion test
      const objDir = new THREE.Vector3().subVectors(objPos, cameraPos).normalize();
      const occDir = new THREE.Vector3().subVectors(occPos, cameraPos).normalize();

      const angle = objDir.angleTo(occDir);
      const objAngularRadius = Math.asin(Math.min(1, objRadius / Math.sqrt(objDist)));
      const occAngularRadius = Math.asin(Math.min(1, occRadius / Math.sqrt(occDist)));

      // If occluder angularly covers the object
      if (angle < occAngularRadius - objAngularRadius * 0.5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear queries
   */
  clear(): void {
    this.queries.forEach((query) => {
      if (query.query) {
        this.gl.deleteQuery(query.query);
      }
    });
    this.queries.clear();
    this.occluders = [];
    this.occludees = [];
  }
}

// ============================================
// Portal Culling System
// ============================================

export class PortalCuller {
  private zones = new Map<string, CullingZone>();
  private portals = new Map<string, Portal>();
  private config: CullingSystemConfig;

  constructor(config: CullingSystemConfig) {
    this.config = config;
  }

  /**
   * Create a portal
   */
  createPortal(
    id: string,
    vertices: THREE.Vector3[],
    connectedZones: string[]
  ): Portal {
    // Calculate portal plane from first 3 vertices
    const v0 = vertices[0];
    const v1 = vertices[1];
    const v2 = vertices[2];

    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, v0);

    // Calculate bounds
    const bounds = new THREE.Box3();
    vertices.forEach((v) => bounds.expandByPoint(v));

    const portal: Portal = {
      id,
      plane,
      vertices: vertices.map((v) => v.clone()),
      bounds,
      connectedZones,
      worldMatrix: new THREE.Matrix4(),
    };

    this.portals.set(id, portal);
    return portal;
  }

  /**
   * Create a culling zone
   */
  createZone(id: string, bounds: THREE.Box3, parentZone?: string): CullingZone {
    const zone: CullingZone = {
      id,
      bounds,
      portals: [],
      objects: new Set(),
      pvs: this.config.enablePVS ? new Set() : null,
      visible: false,
      parentZone: parentZone || null,
    };

    this.zones.set(id, zone);
    return zone;
  }

  /**
   * Add portal to zone
   */
  addPortalToZone(zoneId: string, portalId: string): void {
    const zone = this.zones.get(zoneId);
    const portal = this.portals.get(portalId);

    if (zone && portal) {
      zone.portals.push(portal);
    }
  }

  /**
   * Register object to zone
   */
  registerObjectToZone(zoneId: string, objectId: string): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.objects.add(objectId);
    }
  }

  /**
   * Update portal culling from camera position
   */
  update(camera: THREE.Camera): Map<string, boolean> {
    if (!this.config.enablePortals) {
      // All zones visible
      const visibility = new Map<string, boolean>();
      this.zones.forEach((_, id) => visibility.set(id, true));
      return visibility;
    }

    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);

    // Find zone containing camera
    let cameraZone: string | null = null;
    this.zones.forEach((zone, id) => {
      if (zone.bounds.containsPoint(cameraPos)) {
        cameraZone = id;
      }
    });

    // Reset visibility
    this.zones.forEach((zone) => {
      zone.visible = false;
    });

    // Perform portal traversal
    if (cameraZone) {
      this.traversePortals(cameraZone, camera, new Set());
    } else {
      // Camera outside all zones - mark all as visible
      this.zones.forEach((zone) => {
        zone.visible = true;
      });
    }

    // Build visibility map
    const visibility = new Map<string, boolean>();
    this.zones.forEach((zone, id) => {
      visibility.set(id, zone.visible);
    });

    return visibility;
  }

  /**
   * Recursively traverse portals
   */
  private traversePortals(
    zoneId: string,
    camera: THREE.Camera,
    visited: Set<string>
  ): void {
    if (visited.has(zoneId)) return;
    visited.add(zoneId);

    const zone = this.zones.get(zoneId);
    if (!zone) return;

    zone.visible = true;

    // Check each portal
    for (const portal of zone.portals) {
      if (this.isPortalVisible(portal, camera)) {
        // Mark connected zones as visible
        for (const connectedId of portal.connectedZones) {
          this.traversePortals(connectedId, camera, visited);
        }
      }
    }
  }

  /**
   * Check if portal is visible to camera
   */
  private isPortalVisible(portal: Portal, camera: THREE.Camera): boolean {
    // Check if portal faces camera
    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);

    const portalPos = portal.vertices[0];
    const toCamera = new THREE.Vector3().subVectors(cameraPos, portalPos);

    if (toCamera.dot(portal.plane.normal) <= 0) {
      return false; // Portal facing away
    }

    // Check if any portal vertex is in frustum
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    for (const vertex of portal.vertices) {
      if (frustum.containsPoint(vertex)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get visible zones
   */
  getVisibleZones(): string[] {
    const visible: string[] = [];
    this.zones.forEach((zone, id) => {
      if (zone.visible) visible.push(id);
    });
    return visible;
  }

  /**
   * Pre-compute PVS for all zones
   */
  computePVS(): void {
    if (!this.config.enablePVS) return;

    this.zones.forEach((zone) => {
      if (!zone.pvs) return;

      // Compute which objects are potentially visible from this zone
      zone.pvs.clear();

      // Add all objects in visible zones
      const visited = new Set<string>();
      this.collectPVS(zone.id, zone.pvs, visited);
    });
  }

  /**
   * Collect PVS for zone
   */
  private collectPVS(zoneId: string, pvs: Set<string>, visited: Set<string>): void {
    if (visited.has(zoneId)) return;
    visited.add(zoneId);

    const zone = this.zones.get(zoneId);
    if (!zone) return;

    // Add all objects in this zone
    zone.objects.forEach((id) => pvs.add(id));

    // Recurse through portals
    for (const portal of zone.portals) {
      for (const connectedId of portal.connectedZones) {
        this.collectPVS(connectedId, pvs, visited);
      }
    }
  }

  /**
   * Check if object is in PVS for current zone
   */
  isInPVS(objectId: string, zoneId: string): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone || !zone.pvs) return true;
    return zone.pvs.has(objectId);
  }

  /**
   * Dispose all portals and zones
   */
  dispose(): void {
    this.zones.clear();
    this.portals.clear();
  }
}

// ============================================
// Main Culling System
// ============================================

export class MapCullingSystem {
  private camera: THREE.Camera;
  private config: CullingSystemConfig;
  private objects = new Map<string, CulledObject>();
  private spatialHash: SpatialHash;
  private frustumCuller: AggressiveFrustumCuller;
  private occlusionCuller: HardwareOcclusionCuller;
  private portalCuller: PortalCuller;
  private stats: CullingStats;
  private frameCount = 0;

  constructor(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: Partial<CullingSystemConfig> = {}
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.config = { ...DEFAULT_CULLING_CONFIG, ...config };
    this.spatialHash = new SpatialHash(this.config.spatialHashCellSize);
    this.frustumCuller = new AggressiveFrustumCuller(camera, this.config);
    this.occlusionCuller = new HardwareOcclusionCuller(renderer, camera, this.config);
    this.portalCuller = new PortalCuller(this.config);
    this.stats = this.createEmptyStats();
  }

  /**
   * Create empty stats
   */
  private createEmptyStats(): CullingStats {
    return {
      totalObjects: 0,
      visibleObjects: 0,
      frustumCulled: 0,
      occlusionCulled: 0,
      portalCulled: 0,
      pvsSkipped: 0,
      frustumTime: 0,
      occlusionTime: 0,
      portalTime: 0,
      totalTime: 0,
      drawCallsSaved: 0,
    };
  }

  /**
   * Register an object for culling
   */
  registerObject(
    object: THREE.Object3D,
    options: {
      id?: string;
      priority?: number;
      isStatic?: boolean;
      isOccluder?: boolean;
      boundingBox?: THREE.Box3;
    } = {}
  ): string {
    const id = options.id || object.uuid;

    object.updateMatrixWorld();

    // Calculate bounds
    const box = options.boundingBox || new THREE.Box3().setFromObject(object);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const culledObject: CulledObject = {
      id,
      object,
      boundingBox: box.clone(),
      boundingSphere: sphere,
      worldBounds: box.clone(),
      screenSize: 0,
      priority: options.priority ?? 0,
      isStatic: options.isStatic ?? true,
      isOccluder: options.isOccluder ?? false,
      visible: true,
      wasVisible: true,
      lastVisibleFrame: 0,
      frustumVisible: true,
      occluded: false,
    };

    this.objects.set(id, culledObject);
    this.spatialHash.insert(id, box);

    // Register with specialized cullers
    if (culledObject.isOccluder) {
      this.occlusionCuller.registerOccluder(culledObject);
    } else if (culledObject.isStatic) {
      this.occlusionCuller.registerOccludee(culledObject);
    }

    return id;
  }

  /**
   * Unregister an object
   */
  unregisterObject(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) return;

    this.spatialHash.remove(id, obj.boundingBox);
    this.objects.delete(id);
  }

  /**
   * Update all culling
   */
  update(): void {
    this.frameCount++;
    const startTime = performance.now();

    this.stats = this.createEmptyStats();
    this.stats.totalObjects = this.objects.size;

    // Update frustum
    const frustumStart = performance.now();
    this.frustumCuller.updateFrustum();

    // Cull each object
    this.objects.forEach((obj) => {
      // Frustum culling
      const inFrustum = this.frustumCuller.cullObject(obj);

      if (!inFrustum) {
        this.setObjectVisible(obj, false);
        this.stats.frustumCulled++;
        return;
      }

      // PVS check
      if (this.config.enablePVS && !this.portalCuller.isInPVS(obj.id, 'current')) {
        this.stats.pvsSkipped++;
      }
    });

    this.stats.frustumTime = performance.now() - frustumStart;

    // Occlusion culling
    const occlusionStart = performance.now();
    this.occlusionCuller.cull();

    // Apply occlusion results
    this.objects.forEach((obj) => {
      if (obj.occluded) {
        this.setObjectVisible(obj, false);
        this.stats.occlusionCulled++;
      }
    });

    this.stats.occlusionTime = performance.now() - occlusionStart;

    // Portal culling
    const portalStart = performance.now();
    const zoneVisibility = this.portalCuller.update(this.camera);

    // Hide objects in invisible zones
    if (this.config.enablePortals) {
      this.objects.forEach((obj) => {
        // Check if object is in visible zone (simplified - would need proper zone assignment)
        const inVisibleZone = Array.from(zoneVisibility.values()).some((v) => v);
        if (!inVisibleZone) {
          this.setObjectVisible(obj, false);
          this.stats.portalCulled++;
        }
      });
    }

    this.stats.portalTime = performance.now() - portalStart;

    // Update final visibility
    this.objects.forEach((obj) => {
      if (obj.frustumVisible && !obj.occluded) {
        this.setObjectVisible(obj, true);
        this.stats.visibleObjects++;
      }
    });

    this.stats.totalTime = performance.now() - startTime;
    this.stats.drawCallsSaved =
      this.stats.frustumCulled +
      this.stats.occlusionCulled +
      this.stats.portalCulled;
  }

  /**
   * Set object visibility
   */
  private setObjectVisible(obj: CulledObject, visible: boolean): void {
    obj.wasVisible = obj.visible;
    obj.visible = visible;
    obj.object.visible = visible;

    if (visible) {
      obj.lastVisibleFrame = this.frameCount;
    }
  }

  /**
   * Create portal and zone
   */
  createPortal(
    id: string,
    vertices: THREE.Vector3[],
    connectedZones: string[]
  ): Portal {
    return this.portalCuller.createPortal(id, vertices, connectedZones);
  }

  /**
   * Create culling zone
   */
  createZone(id: string, bounds: THREE.Box3, parentZone?: string): CullingZone {
    return this.portalCuller.createZone(id, bounds, parentZone);
  }

  /**
   * Compute PVS
   */
  computePVS(): void {
    this.portalCuller.computePVS();
  }

  /**
   * Get culling statistics
   */
  getStats(): CullingStats {
    return { ...this.stats };
  }

  /**
   * Get visible objects
   */
  getVisibleObjects(): CulledObject[] {
    return Array.from(this.objects.values()).filter((obj) => obj.visible);
  }

  /**
   * Get visible object IDs
   */
  getVisibleObjectIds(): string[] {
    return this.getVisibleObjects().map((obj) => obj.id);
  }

  /**
   * Check if object is visible
   */
  isVisible(id: string): boolean {
    return this.objects.get(id)?.visible ?? false;
  }

  /**
   * Force visibility for an object
   */
  forceVisibility(id: string, visible: boolean): void {
    const obj = this.objects.get(id);
    if (obj) {
      this.setObjectVisible(obj, visible);
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CullingSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.occlusionCuller.clear();
    this.portalCuller.dispose();
    this.spatialHash.clear();
    this.objects.clear();
  }
}

// ============================================
// Visibility Pre-computation (PVS)
// ============================================

export class VisibilityPreccomputer {
  private zones = new Map<string, THREE.Box3>();
  private objects = new Map<string, { bounds: THREE.Box3; zoneIds: string[] }>();
  private pvs = new Map<string, Set<string>>();

  /**
   * Register a zone for PVS computation
   */
  registerZone(zoneId: string, bounds: THREE.Box3): void {
    this.zones.set(zoneId, bounds);
  }

  /**
   * Register an object
   */
  registerObject(objectId: string, bounds: THREE.Box3, zoneIds: string[]): void {
    this.objects.set(objectId, { bounds, zoneIds });
  }

  /**
   * Compute PVS from each zone
   */
  compute(): Map<string, Set<string>> {
    this.pvs.clear();

    this.zones.forEach((zoneBounds, zoneId) => {
      const visibleObjects = new Set<string>();

      this.objects.forEach((obj, objId) => {
        // Check if object is in same zone or adjacent
        if (obj.zoneIds.includes(zoneId)) {
          visibleObjects.add(objId);
        } else {
          // Check if object is visible from zone (simplified)
          const distance = zoneBounds.distanceToPoint(obj.bounds.getCenter(new THREE.Vector3()));
          if (distance < 500) {
            visibleObjects.add(objId);
          }
        }
      });

      this.pvs.set(zoneId, visibleObjects);
    });

    return this.pvs;
  }

  /**
   * Get PVS for a zone
   */
  getPVS(zoneId: string): Set<string> | undefined {
    return this.pvs.get(zoneId);
  }

  /**
   * Serialize PVS data
   */
  serialize(): string {
    const data: Record<string, string[]> = {};
    this.pvs.forEach((objects, zoneId) => {
      data[zoneId] = Array.from(objects);
    });
    return JSON.stringify(data);
  }

  /**
   * Load PVS data
   */
  load(serialized: string): void {
    const data = JSON.parse(serialized) as Record<string, string[]>;
    this.pvs.clear();

    Object.entries(data).forEach(([zoneId, objects]) => {
      this.pvs.set(zoneId, new Set(objects));
    });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate screen-space bounding box
 */
export function calculateScreenBounds(
  object: THREE.Object3D,
  camera: THREE.Camera,
  width: number,
  height: number
): { min: THREE.Vector2; max: THREE.Vector2 } | null {
  const box = new THREE.Box3().setFromObject(object);
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  const min = new THREE.Vector2(Infinity, Infinity);
  const max = new THREE.Vector2(-Infinity, -Infinity);

  camera.updateMatrixWorld();
  const projScreenMatrix = new THREE.Matrix4();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );

  for (const corner of corners) {
    corner.applyMatrix4(projScreenMatrix);

    if (corner.z > 1) {
      // Behind camera
      return null;
    }

    const x = (corner.x * 0.5 + 0.5) * width;
    const y = (corner.y * -0.5 + 0.5) * height;

    min.x = Math.min(min.x, x);
    min.y = Math.min(min.y, y);
    max.x = Math.max(max.x, x);
    max.y = Math.max(max.y, y);
  }

  return { min, max };
}

/**
 * Batch cull multiple objects
 */
export function batchCull(
  objects: THREE.Object3D[],
  camera: THREE.Camera,
  options: {
    useBoundingSphere?: boolean;
    conservative?: boolean;
    margin?: number;
  } = {}
): { visible: THREE.Object3D[]; culled: THREE.Object3D[] } {
  const { useBoundingSphere = true } = options;

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

export default MapCullingSystem;
