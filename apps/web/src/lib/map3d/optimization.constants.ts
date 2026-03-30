/**
 * Optimization Constants and Device Profiles
 * 
 * [Ver001.000] - CRIT-2 Resolution: Extracted magic numbers to constants
 */

// ============================================
// Default Configuration Values
// ============================================

export const OPTIMIZATION_DEFAULTS = {
  // Memory limits
  MAX_TEXTURE_CACHE_SIZE: 256 * 1024 * 1024, // 256MB
  MIN_TEXTURE_CACHE_SIZE: 32 * 1024 * 1024,  // 32MB
  
  // Batch sizes
  DEFAULT_INSTANCE_BATCH_SIZE: 1000,
  MAX_INSTANCE_BATCH_SIZE: 10000,
  MIN_INSTANCE_BATCH_SIZE: 100,
  
  // Culling parameters
  DEFAULT_FRUSTUM_PADDING: 0.05,
  MAX_FRUSTUM_PADDING: 0.2,
  MIN_FRUSTUM_PADDING: 0.0,
  
  // Spatial hash
  DEFAULT_SPATIAL_HASH_CELL_SIZE: 100,
  MIN_SPATIAL_HASH_CELL_SIZE: 10,
  MAX_SPATIAL_HASH_CELL_SIZE: 1000,
  
  // Update frequencies
  DEFAULT_CULLING_UPDATE_FREQUENCY: 1,
  MIN_CULLING_UPDATE_FREQUENCY: 1,
  MAX_CULLING_UPDATE_FREQUENCY: 10,
  
  // LOD parameters
  DEFAULT_LOD_DISTANCE_MULTIPLIER: 1.0,
  DEFAULT_LOD_HYSTERESIS: 0.15,
  
  // Texture parameters
  DEFAULT_TEXTURE_ANISOTROPY: 16,
  MAX_TEXTURE_RESOLUTION: 4096,
  MIN_TEXTURE_RESOLUTION: 64,
  
  // Performance budgets
  TARGET_FRAME_TIME_MS: 16.67, // 60fps
  FRAME_TIME_BUDGET_MS: 20.0,  // 50fps minimum
  MAX_FRAME_TIME_MS: 33.33,    // 30fps acceptable
  
  // Draw call budgets
  TARGET_DRAW_CALLS: 100,
  MAX_DRAW_CALLS: 500,
  
  // Memory budgets
  TARGET_GPU_MEMORY_MB: 200,
  MAX_GPU_MEMORY_MB: 500,
} as const;

// ============================================
// Device Profiles
// ============================================

export interface DeviceProfile {
  name: string;
  maxTextureCacheSize: number;
  instanceBatchSize: number;
  enableOcclusionCulling: boolean;
  enableInstancing: boolean;
  enableTextureStreaming: boolean;
  targetFrameTime: number;
  maxDrawCalls: number;
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  lodDistanceMultiplier: number;
}

export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  mobile: {
    name: 'Mobile',
    maxTextureCacheSize: 128 * 1024 * 1024, // 128MB
    instanceBatchSize: 500,
    enableOcclusionCulling: false, // Too expensive on mobile
    enableInstancing: true,
    enableTextureStreaming: true,
    targetFrameTime: 33.33, // 30fps target for mobile
    maxDrawCalls: 200,
    textureQuality: 'medium',
    lodDistanceMultiplier: 0.7, // Lower quality at distance
  },
  
  tablet: {
    name: 'Tablet',
    maxTextureCacheSize: 192 * 1024 * 1024, // 192MB
    instanceBatchSize: 750,
    enableOcclusionCulling: false,
    enableInstancing: true,
    enableTextureStreaming: true,
    targetFrameTime: 20.0, // 50fps
    maxDrawCalls: 300,
    textureQuality: 'medium',
    lodDistanceMultiplier: 0.85,
  },
  
  desktop: {
    name: 'Desktop',
    maxTextureCacheSize: 512 * 1024 * 1024, // 512MB
    instanceBatchSize: 2000,
    enableOcclusionCulling: true,
    enableInstancing: true,
    enableTextureStreaming: true,
    targetFrameTime: 16.67, // 60fps
    maxDrawCalls: 1000,
    textureQuality: 'high',
    lodDistanceMultiplier: 1.0,
  },
  
  highEnd: {
    name: 'High-End',
    maxTextureCacheSize: 1024 * 1024 * 1024, // 1GB
    instanceBatchSize: 5000,
    enableOcclusionCulling: true,
    enableInstancing: true,
    enableTextureStreaming: true,
    targetFrameTime: 11.11, // 90fps
    maxDrawCalls: 2000,
    textureQuality: 'ultra',
    lodDistanceMultiplier: 1.5, // Higher quality at distance
  },
  
  lowEnd: {
    name: 'Low-End',
    maxTextureCacheSize: 64 * 1024 * 1024, // 64MB
    instanceBatchSize: 250,
    enableOcclusionCulling: false,
    enableInstancing: false, // Disable on very low end
    enableTextureStreaming: false,
    targetFrameTime: 33.33, // 30fps
    maxDrawCalls: 100,
    textureQuality: 'low',
    lodDistanceMultiplier: 0.5,
  },
} as const;

// ============================================
// Quality Presets
// ============================================

export const QUALITY_PRESETS = {
  low: {
    textureResolution: 512,
    enableShadows: false,
    enableAntialiasing: false,
    anisotropy: 1,
    lodBias: 2,
    particleDensity: 0.25,
  },
  
  medium: {
    textureResolution: 1024,
    enableShadows: true,
    enableAntialiasing: false,
    anisotropy: 4,
    lodBias: 1,
    particleDensity: 0.5,
  },
  
  high: {
    textureResolution: 2048,
    enableShadows: true,
    enableAntialiasing: true,
    anisotropy: 8,
    lodBias: 0,
    particleDensity: 0.75,
  },
  
  ultra: {
    textureResolution: 4096,
    enableShadows: true,
    enableAntialiasing: true,
    anisotropy: 16,
    lodBias: -1,
    particleDensity: 1.0,
  },
} as const;

// ============================================
// Device Detection
// ============================================

export interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  gpuTier: 'low' | 'medium' | 'high';
  isMobile: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;
  
  // Detect WebGL2 support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  const supportsWebGL2 = gl !== null;
  
  // Get max texture size
  const maxTextureSize = gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
  
  // Determine GPU tier
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  if (maxTextureSize >= 8192) {
    gpuTier = 'high';
  } else if (maxTextureSize <= 2048) {
    gpuTier = 'low';
  }
  
  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return {
    memory,
    cores,
    gpuTier,
    isMobile,
    supportsWebGL2,
    maxTextureSize,
  };
}

export function getDeviceProfileForCapabilities(
  caps: DeviceCapabilities
): DeviceProfile {
  if (caps.isMobile) {
    if (caps.memory <= 2) {
      return DEVICE_PROFILES.lowEnd;
    }
    return caps.memory >= 6 ? DEVICE_PROFILES.tablet : DEVICE_PROFILES.mobile;
  }
  
  if (caps.memory >= 16 && caps.gpuTier === 'high') {
    return DEVICE_PROFILES.highEnd;
  }
  
  if (caps.memory <= 4 || caps.gpuTier === 'low') {
    return DEVICE_PROFILES.lowEnd;
  }
  
  return DEVICE_PROFILES.desktop;
}

export function getRecommendedCacheSize(caps: DeviceCapabilities): number {
  const profile = getDeviceProfileForCapabilities(caps);
  return profile.maxTextureCacheSize;
}

// ============================================
// Validation Helpers
// ============================================

export interface ValidationConfig {
  maxTextureCacheSize?: number;
  instanceBatchSize?: number;
}

export function validateConfig(config: ValidationConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (config.maxTextureCacheSize !== undefined) {
    if (config.maxTextureCacheSize < OPTIMIZATION_DEFAULTS.MIN_TEXTURE_CACHE_SIZE) {
      errors.push(`maxTextureCacheSize below minimum (${OPTIMIZATION_DEFAULTS.MIN_TEXTURE_CACHE_SIZE})`);
    }
    if (config.maxTextureCacheSize > OPTIMIZATION_DEFAULTS.MAX_TEXTURE_CACHE_SIZE * 4) {
      warnings.push('maxTextureCacheSize unusually high, may cause memory issues');
    }
  }
  
  if (config.instanceBatchSize !== undefined) {
    if (config.instanceBatchSize < OPTIMIZATION_DEFAULTS.MIN_INSTANCE_BATCH_SIZE) {
      errors.push(`instanceBatchSize below minimum (${OPTIMIZATION_DEFAULTS.MIN_INSTANCE_BATCH_SIZE})`);
    }
    if (config.instanceBatchSize > OPTIMIZATION_DEFAULTS.MAX_INSTANCE_BATCH_SIZE) {
      errors.push(`instanceBatchSize above maximum (${OPTIMIZATION_DEFAULTS.MAX_INSTANCE_BATCH_SIZE})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// Export Default
// ============================================

export default {
  defaults: OPTIMIZATION_DEFAULTS,
  profiles: DEVICE_PROFILES,
  quality: QUALITY_PRESETS,
  detectDeviceCapabilities,
  getDeviceProfileForCapabilities,
  getRecommendedCacheSize,
  validateConfig,
};
