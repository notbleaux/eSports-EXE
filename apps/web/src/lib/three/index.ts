// @ts-nocheck
/**
 * Three.js Optimization Library
 * 
 * [Ver002.000] - WebGL/Three.js optimization modules for mascot 3D scenes
 * 
 * Provides:
 * - LOD (Level of Detail) system with smooth transitions
 * - Frustum culling with occlusion detection
 * - Texture atlasing for draw call reduction
 * - Shader pipeline for mascot VFX
 * - Performance monitoring utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   LODManager, 
 *   FrustumCullingManager, 
 *   TextureAtlas,
 *   SolarGlowShader,
 *   MagicSparkleShader,
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
 * const cullingManager.setCamera(camera);
 * cullingManager.registerObject('mascot', mascotLOD.getGroup());
 * 
 * // Add shader effect to mascot
 * const solarShader = new SolarGlowShader({
 *   glowIntensity: 2.0,
 *   pulseSpeed: 1.5,
 * });
 * const result = solarShader.compile();
 * if (result.material) {
 *   mascotMesh.material = result.material;
 * }
 * 
 * // Animation loop
 * function animate(deltaTime: number) {
 *   lodManager.update(deltaTime);
 *   cullingManager.update();
 *   solarShader.update(deltaTime);
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

// Shader Pipeline
export {
  // Core
  BaseShader,
  ShaderCache,
  UniformManager,
  ShaderErrorHandler,
  GLSL_UTILS,
  globalShaderCache,
  // Shaders
  SolarGlowShader,
  LunarGlowShader,
  BinaryCodeShader,
  FireVFXShader,
  MagicSparkleShader,
  // Factories
  createSolarGlow,
  createLunarGlow,
  createBinaryCode,
  createFireVFX,
  createMagicSparkle,
  createSolarGlowMaterial,
  createLunarGlowMaterial,
  createBinaryCodeMaterial,
  createFireVFXMaterial,
  createMagicSparkleMaterial,
  // Utilities
  getDefaultShaderForMascot,
  getPresetsForMascot,
  getShaderStats,
  SHADER_PERFORMANCE_TARGETS,
} from './shaders';

export type {
  // Core types
  ShaderCompilationResult,
  ShaderError,
  UniformDefinition,
  UniformType,
  ShaderMetrics,
  BaseShaderConfig,
  // Shader configs
  SolarGlowConfig,
  LunarGlowConfig,
  BinaryCodeConfig,
  FireVFXConfig,
  MagicSparkleConfig,
  // Mascot types
  MascotId,
} from './shaders';
