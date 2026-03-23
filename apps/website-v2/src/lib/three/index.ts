/**
 * Three.js Optimization Library
 * 
 * [Ver001.000] - WebGL/Three.js optimization modules for mascot 3D scenes
 * 
 * Provides:
 * - LOD (Level of Detail) system with smooth transitions
 * - Frustum culling with occlusion detection
 * - Texture atlasing for draw call reduction
 * - Performance monitoring utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   LODManager, 
 *   FrustumCullingManager, 
 *   TextureAtlas 
 * } from '@/lib/three';
 * 
 * // Setup LOD
 * const lodManager = new LODManager();
 * lodManager.setCamera(camera);
 * const mascotLOD = lodManager.registerMascot({
 *   mascotId: 'sol',
 *   highDetail: highResGeometry,
 *   mediumDetail: medResGeometry,
 *   lowDetail: lowResGeometry,
 * });
 * 
 * // Setup frustum culling
 * const cullingManager = new FrustumCullingManager();
 * cullingManager.setCamera(camera);
 * cullingManager.registerObject('mascot', mascotLOD.getGroup());
 * 
 * // Animation loop
 * function animate(deltaTime: number) {
 *   lodManager.update(deltaTime);
 *   cullingManager.update();
 *   renderer.render(scene, camera);
 * }
 * ```
 */

// LOD System
export {
  MascotLOD,
  LODManager,
  createLODGeometries,
  estimateGeometryComplexity,
} from './lod';

export type {
  LODLevel,
  LODOptions,
  MascotLODConfig,
  LODState,
  LODMetrics,
} from './lod';

// Frustum Culling
export {
  FrustumCullingManager,
  performFrustumCulling,
  isObjectVisible,
  batchCullingUpdate,
  CullingZone,
  FrustumPlane,
} from './frustumCulling';

export type {
  CullingOptions,
  CulledObject,
  CullingStats,
} from './frustumCulling';

// Texture Atlasing
export {
  TextureAtlas,
  MultiAtlasManager,
  createMascotTextureAtlas,
  calculateAtlasUVs,
  createAtlasMaterial,
} from './textureAtlas';

export type {
  AtlasItem,
  AtlasLayout,
  AtlasItemLayout,
  AtlasOptions,
  AtlasStats,
  UVRemapInfo,
} from './textureAtlas';
