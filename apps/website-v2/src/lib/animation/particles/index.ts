/**
 * Particle Animation System
 * 
 * [Ver001.000] - Particle-based VFX for mascot abilities
 * 
 * Exports:
 * - Particle system core
 * - Effect presets
 * - WebGL renderer
 * - Utility functions
 */

// System core
export {
  ParticleSystem,
  ParticleEmitter,
  ParticlePool,
  DEFAULT_EMITTER_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  Easing,
  createCurve,
  lerpColor,
  randomPointInSphere,
  randomPointOnCircle,
} from './system';

export type {
  Particle,
  EmitterConfig,
  PerformanceConfig,
  ParticleStats,
  QualityLevel,
} from './system';

// Effect presets
export {
  EffectPresets,
  FireBurstPreset,
  StarSparklePreset,
  DigitalRainPreset,
  SolarFlarePreset,
  LunarMistPreset,
  getPreset,
  getPresetForMascot,
  getAllPresetNames,
  getPresetDescriptions,
  createFireBurstConfig,
  createStarSparkleConfig,
  createDigitalRainConfig,
  createSolarFlareConfig,
  createLunarMistConfig,
  createAbilityEffect,
} from './presets';

export type {
  EffectPreset,
  EffectPresetName,
  AbilityEffect,
} from './presets';

// Renderer
export {
  ParticleRenderer,
  ParticleRendererManager,
  TextureAtlas,
  generateDefaultAtlas,
} from './renderer';

export type {
  RendererConfig,
  RenderStats,
} from './renderer';
