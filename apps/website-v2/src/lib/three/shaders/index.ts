/**
 * Shader Library Index
 * 
 * [Ver001.000] - Mascot VFX Shader Pipeline
 * 
 * Provides:
 * - Shader library core with caching and uniform management
 * - Solar Glow for Sol mascot
 * - Lunar Glow for Lun mascot  
 * - Binary Code for Bin mascot
 * - Fire VFX for Fat mascot
 * - Magic Sparkle for Uni mascot
 */

// Core library
export {
  BaseShader,
  ShaderCache,
  UniformManager,
  ShaderErrorHandler,
  GLSL_UTILS,
  globalShaderCache,
} from './shaderLib';

export type {
  ShaderCompilationResult,
  ShaderError,
  UniformDefinition,
  UniformType,
  ShaderMetrics,
  BaseShaderConfig,
} from './shaderLib';

// Solar Glow Shader
export {
  SolarGlowShader,
  createSolarGlow,
  createSolarGlowMaterial,
} from './solarGlow';
export type { SolarGlowConfig } from './solarGlow';

// Lunar Glow Shader
export {
  LunarGlowShader,
  createLunarGlow,
  createLunarGlowMaterial,
} from './lunarGlow';
export type { LunarGlowConfig } from './lunarGlow';

// Binary Code Shader
export {
  BinaryCodeShader,
  createBinaryCode,
  createBinaryCodeMaterial,
} from './binaryCode';
export type { BinaryCodeConfig } from './binaryCode';

// Fire VFX Shader
export {
  FireVFXShader,
  createFireVFX,
  createFireVFXMaterial,
} from './fireVFX';
export type { FireVFXConfig } from './fireVFX';

// Magic Sparkle Shader
export {
  MagicSparkleShader,
  createMagicSparkle,
  createMagicSparkleMaterial,
} from './magicSparkle';
export type { MagicSparkleConfig } from './magicSparkle';

// ============================================
// Mascot Shader Mapping
// ============================================

/** Mascot IDs that have custom shaders */
export type MascotId = 'sol' | 'lun' | 'bin' | 'fat' | 'uni';

/** Get the default shader for a mascot */
export function getDefaultShaderForMascot(mascotId: MascotId) {
  switch (mascotId) {
    case 'sol':
      return { create: createSolarGlow, name: 'Solar Glow' };
    case 'lun':
      return { create: createLunarGlow, name: 'Lunar Glow' };
    case 'bin':
      return { create: createBinaryCode, name: 'Binary Code' };
    case 'fat':
      return { create: createFireVFX, name: 'Fire VFX' };
    case 'uni':
      return { create: createMagicSparkle, name: 'Magic Sparkle' };
    default:
      throw new Error(`Unknown mascot ID: ${mascotId}`);
  }
}

/** Get preset configs for a mascot */
export function getPresetsForMascot(mascotId: MascotId) {
  switch (mascotId) {
    case 'sol':
      return {
        default: {},
        sunSurface: SolarGlowShader.createSunSurfacePreset(),
        goldenHalo: SolarGlowShader.createGoldenHaloPreset(),
        corona: SolarGlowShader.createCoronaPreset(),
      };
    case 'lun':
      return {
        default: {},
        fullMoon: LunarGlowShader.createFullMoonPreset(),
        crescent: LunarGlowShader.createCrescentPreset(),
        bloodMoon: LunarGlowShader.createBloodMoonPreset(),
      };
    case 'bin':
      return {
        default: {},
        matrix: BinaryCodeShader.createMatrixPreset(),
        cyberpunk: BinaryCodeShader.createCyberpunkPreset(),
        dataStream: BinaryCodeShader.createDataStreamPreset(),
      };
    case 'fat':
      return {
        default: {},
        campfire: FireVFXShader.createCampfirePreset(),
        torch: FireVFXShader.createTorchPreset(),
        inferno: FireVFXShader.createInfernoPreset(),
        magicFire: FireVFXShader.createMagicFirePreset(),
      };
    case 'uni':
      return {
        default: {},
        rainbow: MagicSparkleShader.createRainbowPreset(),
        starlight: MagicSparkleShader.createStarlightPreset(),
        fairyDust: MagicSparkleShader.createFairyDustPreset(),
        cosmic: MagicSparkleShader.createCosmicPreset(),
      };
    default:
      return { default: {} };
  }
}

// ============================================
// Performance Constants
// ============================================

/** Target performance metrics */
export const SHADER_PERFORMANCE_TARGETS = {
  /** Target frame rate */
  targetFPS: 60,
  /** Maximum acceptable compile time in ms */
  maxCompileTime: 100,
  /** Maximum uniforms per shader */
  maxUniforms: 32,
  /** Texture cache size */
  maxCacheSize: 50,
} as const;

// ============================================
// Shader Statistics
// ============================================

/** Get current shader statistics */
export function getShaderStats() {
  const cacheStats = globalShaderCache.getStats();
  
  return {
    cacheSize: cacheStats.size,
    cacheHitRate: cacheStats.hitRate,
    maxCacheSize: cacheStats.maxSize,
    availableShaders: 5,
    totalPresets: 17,
  };
}
