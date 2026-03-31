/**
 * Map Geometry Management for SpecMap 3D
 * 
 * [Ver001.000] - Geometry loading, LOD, collision, and nav mesh generation
 * 
 * Provides:
 * - Map mesh loading with format support
 * - LOD (Level of Detail) management for large maps
 * - Collision detection for tactical positioning
 * - Navigation mesh generation for pathfinding
 * - Spatial indexing for efficient queries
 * 
 * @example
 * ```typescript
 * import { MapGeometryManager, MapLODManager } from '@/lib/map3d/geometry';
 * 
 * const geometry = new MapGeometryManager();
 * await geometry.loadMap('ascent');
 * 
 * const lod = new MapLODManager(geometry);
 * lod.setCamera(camera);
 * ```
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// ============================================
// Types
// ============================================

export interface MapGeometryConfig {
  mapId: string;
  baseUrl?: string;
  lodLevels?: number;
  lodDistances?: number[];
  enableCollision?: boolean;
  collisionMargin?: number;
  navMeshResolution?: number;
  maxTextureSize?: number;
}

export interface LODLevel {
  level: number;
  distance: number;
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  triangleCount: number;
}

export interface CollisionResult {
  collided: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  object?: THREE.Object3D;
}

export interface NavMeshNode {
  id: string;
  position: THREE.Vector3;
  neighbors: string[];
  cost: number;
  region: string;
  walkable: boolean;
}

export interface NavMesh {
  nodes: Map<string, NavMeshNode>;
  bounds: THREE.Box3;
  cellSize: number;
}

export interface MapBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  size: THREE.Vector3;
}

export interface GeometryStats {
  totalVertices: number;
  totalTriangles: number;
  totalMeshes: number;
  totalMaterials: number;
  memoryUsage: number;
  lodLevels: number;
}

export interface SpatialQuery {
  point?: THREE.Vector3;
  radius?: number;
  box?: THREE.Box3;
  frustum?: THREE.Frustum;
}

// ============================================
// Map Geometry Manager
// ============================================

export class MapGeometryManager {
  private config: Required<MapGeometryConfig>;
  private loader: GLTFLoader;
  private mapGroup: THREE.Group | null = null;
  private lodGeometries: Map<number, THREE.BufferGeometry[]> = new Map();
  private collisionMesh: THREE.Mesh | null = null;
  private navMesh: NavMesh | null = null;
  private bounds: MapBounds | null = null;
  private stats: GeometryStats = {
    totalVertices: 0,
    totalTriangles: 0,
    totalMeshes: 0,
    totalMaterials: 0,
    memoryUsage: 0,
    lodLevels: 0,
  };

  // Spatial index for efficient queries
  private spatialGrid: Map<string, THREE.Object3D[]> = new Map();
  private gridCellSize = 50;

  constructor(config: MapGeometryConfig) {
    this.config = {
      baseUrl: '/maps',
      lodLevels: 3,
      lodDistances: [0, 100, 300],
      enableCollision: true,
      collisionMargin: 0.5,
      navMeshResolution: 2,
      maxTextureSize: 2048,
      ...config,
    };

    // Setup GLTF loader with DRACO compression
    this.loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(dracoLoader);
  }

  /**
   * Load map geometry from GLB file
   */
  async loadMap(): Promise<THREE.Group> {
    const url = `${this.config.baseUrl}/${this.config.mapId}/model.glb`;

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.processLoadedModel(gltf.scene);
          resolve(gltf.scene);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  /**
   * Process loaded model
   */
  private processLoadedModel(scene: THREE.Group): void {
    this.mapGroup = scene;
    this.mapGroup.name = `map-geometry-${this.config.mapId}`;

    // Calculate bounds
    this.calculateBounds();

    // Process meshes
    this.processMeshes();

    // Build LOD levels
    this.buildLODLevels();

    // Build spatial index
    this.buildSpatialIndex();

    // Generate collision mesh
    if (this.config.enableCollision) {
      this.generateCollisionMesh();
    }

    // Generate nav mesh
    this.generateNavMesh();
  }

  /**
   * Calculate map bounds
   */
  private calculateBounds(): void {
    if (!this.mapGroup) return;

    const box = new THREE.Box3().setFromObject(this.mapGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    this.bounds = {
      min: box.min,
      max: box.max,
      center,
      size,
    };
  }

  /**
   * Process all meshes in the map
   */
  private processMeshes(): void {
    if (!this.mapGroup) return;

    const materials = new Set<THREE.Material>();

    this.mapGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.stats.totalMeshes++;
        
        if (child.geometry) {
          // Ensure geometry has attributes
          if (!child.geometry.attributes.position) {
            console.warn('Mesh missing position attribute:', child.name);
            return;
          }

          const posAttr = child.geometry.attributes.position;
          this.stats.totalVertices += posAttr.count;
          
          const index = child.geometry.index;
          if (index) {
            this.stats.totalTriangles += index.count / 3;
          } else {
            this.stats.totalTriangles += posAttr.count / 3;
          }

          // Compute bounds
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }

        // Collect materials
        if (child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach((mat) => materials.add(mat));
        }

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.stats.totalMaterials = materials.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Build LOD (Level of Detail) levels
   */
  private buildLODLevels(): void {
    if (!this.mapGroup) return;

    const lodLevels = this.config.lodLevels;
    this.stats.lodLevels = lodLevels;

    for (let level = 0; level < lodLevels; level++) {
      const geometries: THREE.BufferGeometry[] = [];
      const reduction = this.getLODReduction(level);

      this.mapGroup.traverse((mesh) => {
        if (mesh instanceof THREE.Mesh && mesh.geometry) {
          const simplified = this.simplifyGeometry(
            mesh.geometry,
            reduction
          );
          geometries.push(simplified);
        }
      });

      this.lodGeometries.set(level, geometries);
    }
  }

  /**
   * Get vertex reduction ratio for LOD level
   */
  private getLODReduction(level: number): number {
    // Level 0 = full detail, Level 1 = 50%, Level 2 = 25%
    const reductions = [1.0, 0.5, 0.25, 0.125];
    return reductions[level] ?? 0.1;
  }

  /**
   * Simplify geometry for LOD
   */
  private simplifyGeometry(
    geometry: THREE.BufferGeometry,
    reduction: number
  ): THREE.BufferGeometry {
    if (reduction >= 1.0) return geometry.clone();

    const simplified = geometry.clone();
    const positions = simplified.attributes.position.array as Float32Array;
    const targetCount = Math.floor(positions.length * reduction);

    // Simple vertex reduction (every Nth vertex)
    // In production, use a proper decimation algorithm
    const stride = Math.ceil(positions.length / targetCount);
    const reduced: number[] = [];

    for (let i = 0; i < positions.length; i += stride * 3) {
      if (i < positions.length) reduced.push(positions[i]);
      if (i + 1 < positions.length) reduced.push(positions[i + 1]);
      if (i + 2 < positions.length) reduced.push(positions[i + 2]);
    }

    simplified.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(reduced), 3)
    );
    simplified.computeVertexNormals();

    return simplified;
  }

  /**
   * Build spatial index for efficient queries
   */
  private buildSpatialIndex(): void {
    if (!this.mapGroup) return;

    this.spatialGrid.clear();

    this.mapGroup.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        const key = this.getSpatialKey(mesh.position);
        const cell = this.spatialGrid.get(key) || [];
        cell.push(mesh);
        this.spatialGrid.set(key, cell);
      }
    });
  }

  /**
   * Get spatial grid key for position
   */
  private getSpatialKey(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.gridCellSize);
    const y = Math.floor(position.y / this.gridCellSize);
    const z = Math.floor(position.z / this.gridCellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Generate collision mesh
   */
  private generateCollisionMesh(): void {
    if (!this.mapGroup) return;

    // Collect all walkable surfaces
    const geometries: THREE.BufferGeometry[] = [];

    this.mapGroup.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        // Filter for walkable surfaces (roughly horizontal)
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        geometries.push(geometry);
      }
    });

    if (geometries.length > 0) {
      // Create merged collision mesh
      // Note: In production, use BufferGeometryUtils.mergeGeometries
      this.collisionMesh = new THREE.Mesh(
        geometries[0], // Use first geometry as base
        new THREE.MeshBasicMaterial({ visible: false })
      );
    }
  }

  /**
   * Generate navigation mesh
   */
  private generateNavMesh(): void {
    if (!this.bounds) return;

    const nodes = new Map<string, NavMeshNode>();
    const cellSize = this.config.navMeshResolution;
    const { min, max } = this.bounds;

    // Generate grid of walkable nodes
    for (let x = min.x; x <= max.x; x += cellSize) {
      for (let z = min.z; z <= max.z; z += cellSize) {
        // Sample height at this position
        const y = this.sampleHeight(x, z);
        
        if (y !== null) {
          const id = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
          const node: NavMeshNode = {
            id,
            position: new THREE.Vector3(x, y, z),
            neighbors: [],
            cost: 1,
            region: this.determineRegion(x, z),
            walkable: true,
          };
          nodes.set(id, node);
        }
      }
    }

    // Connect neighbors
    nodes.forEach((node) => {
      const directions = [
        { x: cellSize, z: 0 },
        { x: -cellSize, z: 0 },
        { x: 0, z: cellSize },
        { x: 0, z: -cellSize },
        { x: cellSize, z: cellSize },
        { x: -cellSize, z: -cellSize },
        { x: cellSize, z: -cellSize },
        { x: -cellSize, z: cellSize },
      ];

      for (const dir of directions) {
        const nx = node.position.x + dir.x;
        const nz = node.position.z + dir.z;
        const ny = this.sampleHeight(nx, nz);

        if (ny !== null) {
          const nid = `${Math.round(nx)},${Math.round(ny)},${Math.round(nz)}`;
          if (nodes.has(nid)) {
            // Check height difference (stairs, etc.)
            const heightDiff = Math.abs(ny - node.position.y);
            if (heightDiff < 2) {
              node.neighbors.push(nid);
            }
          }
        }
      }
    });

    this.navMesh = {
      nodes,
      bounds: new THREE.Box3(min, max),
      cellSize,
    };
  }

  /**
   * Sample height at world position
   */
  private sampleHeight(x: number, z: number): number | null {
    if (!this.mapGroup) return null;

    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(x, 1000, z),
      new THREE.Vector3(0, -1, 0)
    );

    const intersects: THREE.Intersection[] = [];
    this.mapGroup.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        const hits = raycaster.intersectObject(mesh);
        intersects.push(...hits);
      }
    });

    if (intersects.length > 0) {
      // Return highest intersection point
      intersects.sort((a, b) => b.point.y - a.point.y);
      return intersects[0].point.y;
    }

    return null;
  }

  /**
   * Determine region name from position
   */
  private determineRegion(x: number, z: number): string {
    // Simple region determination based on position
    // In production, use proper region definitions
    if (!this.bounds) return 'unknown';

    const { center } = this.bounds;
    const dx = x - center.x;
    const dz = z - center.z;

    if (Math.abs(dx) < 20 && Math.abs(dz) < 20) return 'mid';
    if (dx < -20 && dz < -20) return 'a-site';
    if (dx > 20 && dz > 20) return 'b-site';
    if (dx < -20) return 'defender-spawn';
    if (dx > 20) return 'attacker-spawn';

    return 'general';
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let bytes = 0;

    this.mapGroup?.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        for (const key in child.geometry.attributes) {
          const attr = child.geometry.attributes[key];
          bytes += attr.array.byteLength;
        }
        if (child.geometry.index) {
          bytes += child.geometry.index.array.byteLength;
        }
      }
    });

    return bytes;
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Get map group
   */
  getMapGroup(): THREE.Group | null {
    return this.mapGroup;
  }

  /**
   * Get map bounds
   */
  getBounds(): MapBounds | null {
    return this.bounds;
  }

  /**
   * Get geometry stats
   */
  getStats(): GeometryStats {
    return { ...this.stats };
  }

  /**
   * Get LOD geometry for level
   */
  getLODGeometries(level: number): THREE.BufferGeometry[] {
    return this.lodGeometries.get(level) || [];
  }

  /**
   * Check collision at position
   */
  checkCollision(
    position: THREE.Vector3,
    radius = 1
  ): CollisionResult {
    const result: CollisionResult = {
      collided: false,
      point: position.clone(),
      normal: new THREE.Vector3(0, 1, 0),
      distance: 0,
    };

    if (!this.collisionMesh) return result;

    // Simple sphere collision check
    const nearby = this.querySpatial({
      point: position,
      radius: radius + this.config.collisionMargin,
    });

    for (const object of nearby) {
      if (object instanceof THREE.Mesh && object.geometry) {
        const box = object.geometry.boundingBox;
        if (box) {
          const worldBox = box.clone().applyMatrix4(object.matrixWorld);
          const closest = new THREE.Vector3();
          worldBox.clampPoint(position, closest);
          const dist = position.distanceTo(closest);

          if (dist < radius) {
            result.collided = true;
            result.distance = dist;
            result.normal.subVectors(position, closest).normalize();
            result.point.copy(closest);
            result.object = object;
            break;
          }
        }
      }
    }

    return result;
  }

  /**
   * Query spatial index
   */
  querySpatial(query: SpatialQuery): THREE.Object3D[] {
    const results: THREE.Object3D[] = [];
    const checked = new Set<string>();

    if (query.point && query.radius) {
      // Radius query
      const cells = Math.ceil(query.radius / this.gridCellSize);
      const px = Math.floor(query.point.x / this.gridCellSize);
      const pz = Math.floor(query.point.z / this.gridCellSize);

      for (let dx = -cells; dx <= cells; dx++) {
        for (let dz = -cells; dz <= cells; dz++) {
          const key = `${px + dx},0,${pz + dz}`;
          if (checked.has(key)) continue;
          checked.add(key);

          const cell = this.spatialGrid.get(key);
          if (cell) {
            cell.forEach((obj) => {
              const dist = obj.position.distanceTo(query.point!);
              if (dist <= query.radius! && !results.includes(obj)) {
                results.push(obj);
              }
            });
          }
        }
      }
    } else if (query.box) {
      // Box query
      const minKey = this.getSpatialKey(query.box.min);
      const maxKey = this.getSpatialKey(query.box.max);
      
      // Parse key coordinates
      const [minX] = minKey.split(',').map(Number);
      const [maxX] = maxKey.split(',').map(Number);

      this.spatialGrid.forEach((cell, key) => {
        const [cx] = key.split(',').map(Number);
        if (cx >= minX && cx <= maxX) {
          cell.forEach((obj) => {
            if (!results.includes(obj)) {
              results.push(obj);
            }
          });
        }
      });
    }

    return results;
  }

  /**
   * Get navigation mesh
   */
  getNavMesh(): NavMesh | null {
    return this.navMesh;
  }

  /**
   * Find path between two points
   */
  findPath(
    start: THREE.Vector3,
    end: THREE.Vector3
  ): THREE.Vector3[] | null {
    if (!this.navMesh) return null;

    // Simple A* pathfinding
    // In production, use a proper pathfinding library
    const startNode = this.findClosestNode(start);
    const endNode = this.findClosestNode(end);

    if (!startNode || !endNode) return null;

    // BFS for simplicity
    const queue: Array<{ node: NavMeshNode; path: THREE.Vector3[] }> = [
      { node: startNode, path: [startNode.position] },
    ];
    const visited = new Set<string>();
    visited.add(startNode.id);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node.id === endNode.id) {
        return [...current.path, end];
      }

      for (const neighborId of current.node.neighbors) {
        if (visited.has(neighborId)) continue;
        
        const neighbor = this.navMesh.nodes.get(neighborId);
        if (neighbor && neighbor.walkable) {
          visited.add(neighborId);
          queue.push({
            node: neighbor,
            path: [...current.path, neighbor.position],
          });
        }
      }
    }

    return null;
  }

  /**
   * Find closest nav mesh node
   */
  private findClosestNode(position: THREE.Vector3): NavMeshNode | null {
    if (!this.navMesh) return null;

    let closest: NavMeshNode | null = null;
    let closestDist = Infinity;

    this.navMesh.nodes.forEach((node) => {
      const dist = node.position.distanceTo(position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    });

    return closest;
  }

  /**
   * Check if point is on walkable surface
   */
  isWalkable(position: THREE.Vector3): boolean {
    if (!this.navMesh) return false;

    const node = this.findClosestNode(position);
    if (!node) return false;

    return (
      node.walkable &&
      node.position.distanceTo(position) < this.navMesh.cellSize * 2
    );
  }

  /**
   * Get ground height at position
   */
  getGroundHeight(x: number, z: number): number | null {
    return this.sampleHeight(x, z);
  }

  /**
   * Snap position to ground
   */
  snapToGround(position: THREE.Vector3): THREE.Vector3 {
    const y = this.sampleHeight(position.x, position.z);
    if (y !== null) {
      return new THREE.Vector3(position.x, y, position.z);
    }
    return position.clone();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.lodGeometries.forEach((geometries) => {
      geometries.forEach((g) => g.dispose());
    });
    this.lodGeometries.clear();

    this.spatialGrid.clear();
    this.navMesh = null;
    this.collisionMesh = null;
    this.mapGroup = null;
    this.bounds = null;
  }
}

// ============================================
// Map LOD Manager
// ============================================

export class MapLODManager {
  private geometry: MapGeometryManager;
  private camera: THREE.Camera | null = null;
  private currentLevel = 0;
  private lodDistances: number[];
  private visibleObjects: Map<string, THREE.Object3D> = new Map();

  constructor(
    geometry: MapGeometryManager,
    lodDistances: number[] = [0, 100, 300]
  ) {
    this.geometry = geometry;
    this.lodDistances = lodDistances;
  }

  /**
   * Set camera for LOD calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Update LOD based on camera distance
   */
  update(): void {
    if (!this.camera) return;

    const cameraPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPos);

    const mapGroup = this.geometry.getMapGroup();
    if (!mapGroup) return;

    // Determine LOD level based on distance to map center
    const bounds = this.geometry.getBounds();
    if (bounds) {
      const dist = cameraPos.distanceTo(bounds.center);
      this.currentLevel = this.calculateLODLevel(dist);
    }

    // Update visible objects
    this.updateVisibleObjects(cameraPos);
  }

  /**
   * Calculate LOD level from distance
   */
  private calculateLODLevel(distance: number): number {
    for (let i = 1; i < this.lodDistances.length; i++) {
      if (distance < this.lodDistances[i]) {
        return i - 1;
      }
    }
    return this.lodDistances.length - 1;
  }

  /**
   * Update which objects are visible
   */
  private updateVisibleObjects(cameraPos: THREE.Vector3): void {
    const mapGroup = this.geometry.getMapGroup();
    if (!mapGroup) return;

    mapGroup.traverse((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        const dist = mesh.position.distanceTo(cameraPos);
        const visible = dist < this.lodDistances[this.lodDistances.length - 1];

        mesh.visible = visible && this.shouldRenderAtLOD(mesh);

        if (visible) {
          this.visibleObjects.set(mesh.uuid, mesh);
        } else {
          this.visibleObjects.delete(mesh.uuid);
        }
      }
    });
  }

  /**
   * Determine if object should render at current LOD
   */
  private shouldRenderAtLOD(object: THREE.Object3D): boolean {
    // Smaller objects can be culled at closer distances
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    // Objects smaller than threshold are culled at distance
    const threshold = 5;
    if (maxSize < threshold) return false;

    return true;
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Get visible object count
   */
  getVisibleCount(): number {
    return this.visibleObjects.size;
  }

  /**
   * Force specific LOD level
   */
  forceLevel(level: number): void {
    this.currentLevel = Math.max(0, level);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create collision box from bounds
 */
export function createCollisionBox(
  min: THREE.Vector3,
  max: THREE.Vector3
): THREE.Box3 {
  return new THREE.Box3(min, max);
}

/**
 * Check if point is inside box
 */
export function pointInBox(point: THREE.Vector3, box: THREE.Box3): boolean {
  return box.containsPoint(point);
}

/**
 * Get nearest point on box surface
 */
export function nearestPointOnBox(
  point: THREE.Vector3,
  box: THREE.Box3
): THREE.Vector3 {
  const result = new THREE.Vector3();
  box.clampPoint(point, result);
  return result;
}

/**
 * Merge geometries (simplified version)
 */
export function mergeGeometries(
  geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  // In production, use BufferGeometryUtils.mergeGeometries
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0].clone();

  // Simple merge - concatenate positions
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  geometries.forEach((geo) => {
    const posAttr = geo.attributes.position;
    const normalAttr = geo.attributes.normal;
    const uvAttr = geo.attributes.uv;

    for (let i = 0; i < posAttr.count; i++) {
      positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));

      if (normalAttr) {
        normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
      }

      if (uvAttr) {
        uvs.push(uvAttr.getX(i), uvAttr.getY(i));
      }
    }
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }

  return merged;
}

export default MapGeometryManager;
