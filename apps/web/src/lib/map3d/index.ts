// @ts-nocheck
/**
 * Map3D Optimization Module
 * 
 * [Ver001.000] - CRIT Resolution Exports
 * 
 * Provides optimized 3D map rendering with:
 * - Frustum culling
 * - Occlusion culling
 * - Texture streaming
 * - GPU instancing
 * - Object pooling
 */

// Main optimization classes
export {
  MapFrustumCuller,
  OcclusionCuller,
  TextureStreamManager,
  InstanceRenderer,
  ObjectPool,
  MapOptimizationManager,
} from './optimization';

// Types
export type {
  OptimizationConfig,
  TexturePriority,
  TextureTile,
  InstanceBatch,
  PooledObject,
  OptimizationStats,
} from './optimization';

// Logger interface and implementations (CRIT-3)
export type { ILogger } from './optimization.logger';
export {
  ConsoleLogger,
  NullLogger,
  AggregatedLogger,
  PerformanceLogger,
  createLogger,
} from './optimization.logger';

// Constants and device profiles (CRIT-2, CRIT-8)
export {
  OPTIMIZATION_DEFAULTS,
  DEVICE_PROFILES,
  QUALITY_PRESETS,
  detectDeviceCapabilities,
  getDeviceProfileForCapabilities,
  getRecommendedCacheSize,
  validateConfig,
} from './optimization.constants';

export type {
  DeviceProfile,
  DeviceCapabilities,
} from './optimization.constants';

export type { LoggerOptions } from './optimization.logger';

// Default export
export { default } from './optimization';
