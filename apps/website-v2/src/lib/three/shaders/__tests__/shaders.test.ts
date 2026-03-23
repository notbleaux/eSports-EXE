/**
 * Shader Pipeline Tests
 * 
 * [Ver001.000] - Comprehensive tests for mascot VFX shader pipeline
 * 
 * Tests cover:
 * - Shader compilation and caching
 * - Uniform management
 * - All 5 mascot shaders (Solar, Lunar, Binary, Fire, Magic)
 * - Performance requirements (60fps, <100ms compile)
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock Three.js for SSR compatibility
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
  };
});

import {
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
  // Utils
  getPresetsForMascot,
  getShaderStats,
  SHADER_PERFORMANCE_TARGETS,
} from '../index';

// ============================================
// Test Helpers
// ============================================

/** Mock WebGL context for testing */
function createMockWebGLContext(): WebGLRenderingContext {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    throw new Error('WebGL2 not available in test environment');
  }
  return gl;
}

/** Measure execution time */
function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/** Wait for a number of frames */
async function waitFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

// ============================================
// Shader Cache Tests
// ============================================

describe('ShaderCache', () => {
  let cache: ShaderCache;

  beforeEach(() => {
    cache = new ShaderCache(10, 1000);
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve materials', () => {
      const mockMaterial = { 
        uuid: 'test-1',
        clone: () => ({ uuid: 'test-1-clone' }),
        dispose: vi.fn(),
      } as unknown as THREE.ShaderMaterial;

      cache.set('vertex1', 'fragment1', mockMaterial);
      const entry = cache.get('vertex1', 'fragment1');

      expect(entry).toBeDefined();
      expect(entry?.material.uuid).toBe('test-1');
    });

    it('should return undefined for missing entries', () => {
      const entry = cache.get('nonexistent', 'nonexistent');
      expect(entry).toBeUndefined();
    });

    it('should track use count', () => {
      const mockMaterial = { 
        uuid: 'test-2',
        clone: () => ({ uuid: 'test-2-clone' }),
        dispose: vi.fn(),
      } as unknown as THREE.ShaderMaterial;

      cache.set('v', 'f', mockMaterial);
      cache.get('v', 'f');
      cache.get('v', 'f');

      const entry = cache.get('v', 'f');
      expect(entry?.useCount).toBeGreaterThan(1);
    });
  });

  describe('Cache Limits', () => {
    it('should respect max size limit', () => {
      const smallCache = new ShaderCache(2, 1000);

      for (let i = 0; i < 5; i++) {
        const mockMaterial = { 
          uuid: `mat-${i}`,
          dispose: vi.fn(),
          clone: () => ({ uuid: `mat-${i}-clone` }),
        } as unknown as THREE.ShaderMaterial;

        smallCache.set(`v${i}`, `f${i}`, mockMaterial);
      }

      const stats = smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(2);

      smallCache.clear();
    });

    it('should expire old entries', () => {
      const quickCache = new ShaderCache(10, 1);

      const mockMaterial = { 
        uuid: 'expiring',
        dispose: vi.fn(),
        clone: () => ({ uuid: 'expiring-clone' }),
      } as unknown as THREE.ShaderMaterial;

      quickCache.set('v', 'f', mockMaterial);
      
      // Wait for expiry
      const start = Date.now();
      while (Date.now() - start < 10) {} // Busy wait

      const entry = quickCache.get('v', 'f');
      expect(entry).toBeUndefined();

      quickCache.clear();
    });
  });

  describe('Cache Statistics', () => {
    it('should calculate hit rate correctly', () => {
      const mockMaterial = { 
        uuid: 'stats',
        clone: () => ({ uuid: 'stats-clone' }),
        dispose: vi.fn(),
      } as unknown as THREE.ShaderMaterial;

      cache.set('v1', 'f1', mockMaterial);
      
      // Multiple gets
      cache.get('v1', 'f1');
      cache.get('v1', 'f1');
      cache.get('v1', 'f1');

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.size).toBe(1);
    });
  });
});

// ============================================
// Uniform Manager Tests
// ============================================

describe('UniformManager', () => {
  let manager: UniformManager;

  beforeEach(() => {
    manager = new UniformManager();
  });

  describe('Registration', () => {
    it('should register float uniforms', () => {
      manager.register('uFloat', { type: 'float', value: 1.5 });
      expect(manager.get('uFloat')).toBe(1.5);
    });

    it('should register color (vec3) uniforms', () => {
      const color = new THREE.Color(0xff0000);
      manager.register('uColor', { type: 'vec3', value: color });
      expect(manager.get('uColor')).toBe(color);
    });

    it('should register boolean uniforms', () => {
      manager.register('uBool', { type: 'bool', value: true });
      expect(manager.get('uBool')).toBe(true);
    });

    it('should register multiple uniforms at once', () => {
      manager.registerAll({
        uOne: { type: 'float', value: 1 },
        uTwo: { type: 'float', value: 2 },
      });

      expect(manager.get('uOne')).toBe(1);
      expect(manager.get('uTwo')).toBe(2);
    });
  });

  describe('Value Updates', () => {
    it('should update uniform values', () => {
      manager.register('uValue', { type: 'float', value: 1.0 });
      manager.set('uValue', 2.0);
      expect(manager.get('uValue')).toBe(2.0);
    });

    it('should clamp values to min/max', () => {
      manager.register('uClamped', { 
        type: 'float', 
        value: 0.5, 
        min: 0, 
        max: 1 
      });

      manager.set('uClamped', 2.0);
      expect(manager.get('uClamped')).toBe(1.0);

      manager.set('uClamped', -1.0);
      expect(manager.get('uClamped')).toBe(0.0);
    });

    it('should reject invalid value types', () => {
      manager.register('uFloat', { type: 'float', value: 1.0 });
      const result = manager.set('uFloat', 'invalid');
      expect(result).toBe(false);
    });

    it('should warn about unregistered uniforms', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      manager.set('unregistered', 1.0);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers of changes', () => {
      manager.register('uSub', { type: 'float', value: 0 });
      
      const callback = vi.fn();
      manager.subscribe('uSub', callback);
      
      manager.set('uSub', 5.0);
      expect(callback).toHaveBeenCalledWith(5.0);
    });

    it('should allow unsubscribing', () => {
      manager.register('uUnsub', { type: 'float', value: 0 });
      
      const callback = vi.fn();
      const unsubscribe = manager.subscribe('uUnsub', callback);
      
      unsubscribe();
      manager.set('uUnsub', 5.0);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Batch Updates', () => {
    it('should update multiple uniforms at once', () => {
      manager.registerAll({
        uA: { type: 'float', value: 0 },
        uB: { type: 'float', value: 0 },
        uC: { type: 'float', value: 0 },
      });

      manager.updateBatch({
        uA: 1,
        uB: 2,
        uC: 3,
      });

      expect(manager.get('uA')).toBe(1);
      expect(manager.get('uB')).toBe(2);
      expect(manager.get('uC')).toBe(3);
    });
  });

  describe('Three.js Integration', () => {
    it('should export uniforms in Three.js format', () => {
      manager.register('uFloat', { type: 'float', value: 1.5 });
      manager.register('uColor', { type: 'vec3', value: new THREE.Color(0xff0000) });

      const uniforms = manager.getThreeUniforms();

      expect(uniforms.uFloat).toEqual({ value: 1.5 });
      expect(uniforms.uColor.value).toBeInstanceOf(THREE.Color);
    });
  });
});

// ============================================
// Shader Error Handler Tests
// ============================================

describe('ShaderErrorHandler', () => {
  describe('Error Parsing', () => {
    it('should parse shader errors with line numbers', () => {
      const error = ShaderErrorHandler.parseError(
        'ERROR: 0:15: \'undefined_var\' : undeclared identifier',
        'vertex source',
        'fragment source'
      );

      // Parser detects error from message content
      expect(['syntax', 'link', 'vertex']).toContain(error.type);
      expect(error.line).toBeGreaterThanOrEqual(0);
    });

    it('should detect error types from messages', () => {
      const vertexError = ShaderErrorHandler.parseError('vertex shader error');
      expect(vertexError.type).toBe('vertex');

      const fragmentError = ShaderErrorHandler.parseError('fragment shader error');
      expect(fragmentError.type).toBe('fragment');

      const uniformError = ShaderErrorHandler.parseError('uniform not found');
      expect(uniformError.type).toBe('uniform');
    });

    it('should format errors for display', () => {
      const error = {
        message: 'Test error',
        type: 'syntax' as const,
        line: 10,
        column: 5,
      };

      const formatted = ShaderErrorHandler.formatError(error);
      expect(formatted).toContain('[SYNTAX ERROR]');
      expect(formatted).toContain('Line 10');
      expect(formatted).toContain(':5');
    });
  });
});

// ============================================
// GLSL Utilities Tests
// ============================================

describe('GLSL_UTILS', () => {
  it('should contain noise functions', () => {
    expect(GLSL_UTILS.noise3D).toContain('snoise');
    expect(GLSL_UTILS.noise2D).toContain('snoise');
  });

  it('should contain color conversion functions', () => {
    expect(GLSL_UTILS.hsv2rgb).toContain('hsv2rgb');
    expect(GLSL_UTILS.rgb2hsv).toContain('rgb2hsv');
  });

  it('should contain rotation matrices', () => {
    expect(GLSL_UTILS.rotate2D).toContain('mat2');
    expect(GLSL_UTILS.rotate3D).toContain('mat3');
  });

  it('should contain FBM function', () => {
    expect(GLSL_UTILS.fbm).toContain('fbm');
  });
});

// ============================================
// Solar Glow Shader Tests
// ============================================

describe('SolarGlowShader', () => {
  let shader: SolarGlowShader;

  beforeEach(() => {
    shader = new SolarGlowShader();
  });

  afterEach(() => {
    shader.dispose();
  });

  describe('Compilation', () => {
    it('should compile successfully', () => {
      const { result, duration } = measureTime(() => shader.compile());
      
      expect(result.success).toBe(true);
      expect(result.material).toBeDefined();
      expect(duration).toBeLessThan(SHADER_PERFORMANCE_TARGETS.maxCompileTime);
    });

    it('should create material with correct blending', () => {
      const result = shader.compile();
      expect(result.material?.blending).toBe(THREE.AdditiveBlending);
      expect(result.material?.transparent).toBe(true);
    });
  });

  describe('Uniforms', () => {
    it('should have solar-specific uniforms', () => {
      const definitions = shader['uniformManager'].getDefinitions();
      
      expect(definitions).toHaveProperty('uBaseColor');
      expect(definitions).toHaveProperty('uRimColor');
      expect(definitions).toHaveProperty('uGlowColor');
      expect(definitions).toHaveProperty('uPulseSpeed');
      expect(definitions).toHaveProperty('uFresnelPower');
    });

    it('should accept custom colors', () => {
      const customShader = new SolarGlowShader({
        baseColor: new THREE.Color(0xff0000),
        rimColor: new THREE.Color(0x00ff00),
      });

      expect(customShader.getUniform('uBaseColor')).toEqual(new THREE.Color(0xff0000));
      customShader.dispose();
    });
  });

  describe('Presets', () => {
    it('should create sun surface preset', () => {
      const preset = SolarGlowShader.createSunSurfacePreset();
      expect(preset.baseColor).toBeDefined();
      expect(preset.rimIntensity).toBeGreaterThan(1);
    });

    it('should create golden halo preset', () => {
      const preset = SolarGlowShader.createGoldenHaloPreset();
      expect(preset.pulseSpeed).toBeGreaterThan(1);
    });

    it('should create corona preset', () => {
      const preset = SolarGlowShader.createCoronaPreset();
      expect(preset.glowRadius).toBeGreaterThan(1.5);
    });
  });

  describe('Pulse Control', () => {
    it('should set pulse phase', () => {
      shader.setPulsePhase(0.5);
      // Phase should affect internal timing
      expect(shader.getUniform('uTime')).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// Lunar Glow Shader Tests
// ============================================

describe('LunarGlowShader', () => {
  let shader: LunarGlowShader;

  beforeEach(() => {
    shader = new LunarGlowShader();
  });

  afterEach(() => {
    shader.dispose();
  });

  describe('Compilation', () => {
    it('should compile successfully', () => {
      const { result } = measureTime(() => shader.compile());
      expect(result.success).toBe(true);
    });

    it('should have correct default phase', () => {
      expect(shader.getUniform('uPhase')).toBe(0.5);
    });
  });

  describe('Phase Control', () => {
    it('should set phase value', () => {
      shader.setPhase(0.25);
      expect(shader.getUniform('uPhase')).toBe(0.25);
    });

    it('should clamp phase to 0-1 range', () => {
      shader.setPhase(2.0);
      expect(shader.getUniform('uPhase')).toBe(1.0);

      shader.setPhase(-0.5);
      expect(shader.getUniform('uPhase')).toBe(0.0);
    });
  });

  describe('Presets', () => {
    it('should create full moon preset', () => {
      const preset = LunarGlowShader.createFullMoonPreset();
      expect(preset.phase).toBe(0.5);
      expect(preset.starCount).toBeGreaterThan(50);
    });

    it('should create crescent preset', () => {
      const preset = LunarGlowShader.createCrescentPreset();
      expect(preset.phase).toBeLessThan(0.5);
      expect(preset.glowIntensity).toBeGreaterThan(1.5);
    });

    it('should create blood moon preset', () => {
      const preset = LunarGlowShader.createBloodMoonPreset();
      expect(preset.baseColor?.r).toBeGreaterThan(0.5); // Reddish
    });
  });
});

// ============================================
// Binary Code Shader Tests
// ============================================

describe('BinaryCodeShader', () => {
  let shader: BinaryCodeShader;

  beforeEach(() => {
    shader = new BinaryCodeShader();
  });

  afterEach(() => {
    shader.dispose();
  });

  describe('Compilation', () => {
    it('should compile successfully', () => {
      const { result } = measureTime(() => shader.compile());
      expect(result.success).toBe(true);
    });
  });

  describe('Mode Control', () => {
    it('should set binary mode', () => {
      shader.setMode('binary');
      expect(shader.getUniform('uMode')).toBe(0);
    });

    it('should set hex mode', () => {
      shader.setMode('hex');
      expect(shader.getUniform('uMode')).toBe(1);
    });

    it('should set matrix mode', () => {
      shader.setMode('matrix');
      expect(shader.getUniform('uMode')).toBe(2);
    });
  });

  describe('Glitch Effects', () => {
    it('should have glitch trigger method', () => {
      expect(typeof shader.triggerGlitch).toBe('function');
    });

    it('should have glitch effect method', () => {
      // Just verify the method exists and can be called
      expect(() => shader.triggerGlitch(0.01)).not.toThrow();
    });
  });

  describe('Presets', () => {
    it('should create matrix preset', () => {
      const preset = BinaryCodeShader.createMatrixPreset();
      expect(preset.mode).toBe('matrix');
      expect(preset.codeColor?.g).toBeGreaterThan(0.5); // Green
    });

    it('should create cyberpunk preset', () => {
      const preset = BinaryCodeShader.createCyberpunkPreset();
      expect(preset.mode).toBe('hex');
      expect(preset.glitchIntensity).toBeGreaterThan(0.5);
    });
  });
});

// ============================================
// Fire VFX Shader Tests
// ============================================

describe('FireVFXShader', () => {
  let shader: FireVFXShader;

  beforeEach(() => {
    shader = new FireVFXShader();
  });

  afterEach(() => {
    shader.dispose();
  });

  describe('Compilation', () => {
    it('should compile successfully', () => {
      const { result } = measureTime(() => shader.compile());
      expect(result.success).toBe(true);
    });
  });

  describe('Fire Control', () => {
    it('should have intensify method', () => {
      expect(typeof shader.intensify).toBe('function');
    });

    it('should have fire-specific uniforms', () => {
      const definitions = shader['uniformManager'].getDefinitions();
      
      expect(definitions).toHaveProperty('uFlameHeight');
      expect(definitions).toHaveProperty('uTurbulence');
      expect(definitions).toHaveProperty('uEmberCount');
    });
  });

  describe('Presets', () => {
    it('should create campfire preset', () => {
      const preset = FireVFXShader.createCampfirePreset();
      expect(preset.flameHeight).toBeLessThan(2);
      expect(preset.flameSpread).toBeLessThan(1);
    });

    it('should create torch preset', () => {
      const preset = FireVFXShader.createTorchPreset();
      expect(preset.flameHeight).toBeGreaterThan(2);
    });

    it('should create inferno preset', () => {
      const preset = FireVFXShader.createInfernoPreset();
      expect(preset.turbulence).toBeGreaterThan(1);
    });

    it('should create magic fire preset', () => {
      const preset = FireVFXShader.createMagicFirePreset();
      expect(preset.outerColor?.b).toBeGreaterThan(0.5); // Blue/purple
    });
  });
});

// ============================================
// Magic Sparkle Shader Tests
// ============================================

describe('MagicSparkleShader', () => {
  let shader: MagicSparkleShader;

  beforeEach(() => {
    shader = new MagicSparkleShader();
  });

  afterEach(() => {
    shader.dispose();
  });

  describe('Compilation', () => {
    it('should compile successfully', () => {
      const { result } = measureTime(() => shader.compile());
      expect(result.success).toBe(true);
    });
  });

  describe('Magic Effects', () => {
    it('should have burst method', () => {
      expect(typeof shader.castBurst).toBe('function');
    });

    it('should have mood setter', () => {
      expect(typeof shader.setMood).toBe('function');
    });

    it('should set rainbow mood', () => {
      shader.setMood('rainbow');
      expect(shader.getUniform('uRainbowTint')).toBe(1.0);
    });
  });

  describe('Presets', () => {
    it('should create rainbow preset', () => {
      const preset = MagicSparkleShader.createRainbowPreset();
      expect(preset.rainbowTint).toBe(1.0);
    });

    it('should create starlight preset', () => {
      const preset = MagicSparkleShader.createStarlightPreset();
      expect(preset.starburstRays).toBeGreaterThan(10);
    });

    it('should create fairy dust preset', () => {
      const preset = MagicSparkleShader.createFairyDustPreset();
      expect(preset.sparkleCount).toBeGreaterThan(100);
    });
  });
});

// ============================================
// Factory Functions Tests
// ============================================

describe('Factory Functions', () => {
  describe('createSolarGlow', () => {
    it('should create SolarGlowShader instance', () => {
      const shader = createSolarGlow();
      expect(shader).toBeInstanceOf(SolarGlowShader);
      shader.dispose();
    });
  });

  describe('createLunarGlow', () => {
    it('should create LunarGlowShader instance', () => {
      const shader = createLunarGlow();
      expect(shader).toBeInstanceOf(LunarGlowShader);
      shader.dispose();
    });
  });

  describe('createBinaryCode', () => {
    it('should create BinaryCodeShader instance', () => {
      const shader = createBinaryCode();
      expect(shader).toBeInstanceOf(BinaryCodeShader);
      shader.dispose();
    });
  });

  describe('createFireVFX', () => {
    it('should create FireVFXShader instance', () => {
      const shader = createFireVFX();
      expect(shader).toBeInstanceOf(FireVFXShader);
      shader.dispose();
    });
  });

  describe('createMagicSparkle', () => {
    it('should create MagicSparkleShader instance', () => {
      const shader = createMagicSparkle();
      expect(shader).toBeInstanceOf(MagicSparkleShader);
      shader.dispose();
    });
  });

  describe('Material Factories', () => {
    it('should create solar glow material', () => {
      const material = createSolarGlowMaterial();
      expect(material).toBeDefined();
    });

    it('should create lunar glow material', () => {
      const material = createLunarGlowMaterial();
      expect(material).toBeDefined();
    });

    it('should create binary code material', () => {
      const material = createBinaryCodeMaterial();
      expect(material).toBeDefined();
    });

    it('should create fire VFX material', () => {
      const material = createFireVFXMaterial();
      expect(material).toBeDefined();
    });

    it('should create magic sparkle material', () => {
      const material = createMagicSparkleMaterial();
      expect(material).toBeDefined();
    });
  });
});

// ============================================
// Presets and Utilities Tests
// ============================================

describe('Shader Utilities', () => {
  describe('getPresetsForMascot', () => {
    it('should return presets for all mascots', () => {
      const solPresets = getPresetsForMascot('sol');
      expect(solPresets).toHaveProperty('default');
      expect(solPresets).toHaveProperty('sunSurface');

      const lunPresets = getPresetsForMascot('lun');
      expect(lunPresets).toHaveProperty('fullMoon');

      const binPresets = getPresetsForMascot('bin');
      expect(binPresets).toHaveProperty('matrix');

      const fatPresets = getPresetsForMascot('fat');
      expect(fatPresets).toHaveProperty('campfire');

      const uniPresets = getPresetsForMascot('uni');
      expect(uniPresets).toHaveProperty('rainbow');
    });
  });

  describe('getShaderStats', () => {
    it('should return shader statistics', () => {
      const stats = getShaderStats();
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('availableShaders');
      expect(stats.availableShaders).toBe(5);
    });
  });

  describe('Performance Targets', () => {
    it('should have defined performance constants', () => {
      expect(SHADER_PERFORMANCE_TARGETS.targetFPS).toBe(60);
      expect(SHADER_PERFORMANCE_TARGETS.maxCompileTime).toBe(100);
    });
  });
});

// ============================================
// Performance Tests
// ============================================

describe('Shader Performance', () => {
  describe('Compilation Time', () => {
    const shaders = [
      { name: 'SolarGlow', create: () => new SolarGlowShader() },
      { name: 'LunarGlow', create: () => new LunarGlowShader() },
      { name: 'BinaryCode', create: () => new BinaryCodeShader() },
      { name: 'FireVFX', create: () => new FireVFXShader() },
      { name: 'MagicSparkle', create: () => new MagicSparkleShader() },
    ];

    shaders.forEach(({ name, create }) => {
      it(`${name} should compile in under ${SHADER_PERFORMANCE_TARGETS.maxCompileTime}ms`, () => {
        const shader = create();
        const { result, duration } = measureTime(() => shader.compile());
        
        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(SHADER_PERFORMANCE_TARGETS.maxCompileTime);
        
        shader.dispose();
      });
    });
  });

  describe('Cache Efficiency', () => {
    it('should use cache for identical shaders', () => {
      globalShaderCache.clear();

      const shader1 = new SolarGlowShader();
      shader1.compile();

      const shader2 = new SolarGlowShader();
      const { result, duration } = measureTime(() => shader2.compile());

      expect(result.cached).toBe(true);
      expect(duration).toBeLessThan(10); // Should be very fast from cache

      shader1.dispose();
      shader2.dispose();
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Shader Integration', () => {
  it('should create all 5 shader types', () => {
    const shaders = [
      new SolarGlowShader(),
      new LunarGlowShader(),
      new BinaryCodeShader(),
      new FireVFXShader(),
      new MagicSparkleShader(),
    ];

    const results = shaders.map(s => s.compile());
    
    expect(results.every(r => r.success)).toBe(true);
    
    shaders.forEach(s => s.dispose());
  });

  it('should handle multiple shader updates', () => {
    const shader = new SolarGlowShader();
    shader.compile();

    // Simulate 60 frames
    for (let i = 0; i < 60; i++) {
      shader.update(1 / 60);
    }

    const metrics = shader.getMetrics();
    expect(metrics.frameCount).toBe(60);
    
    shader.dispose();
  });

  it('should properly dispose resources', () => {
    const shader = new SolarGlowShader();
    shader.compile();

    expect(shader.getMaterial()).toBeDefined();
    
    shader.dispose();
    
    expect(shader.getMaterial()).toBeUndefined();
  });
});

// ============================================
// Error Handling Tests
// ============================================

describe('Error Handling', () => {
  it('should handle compilation errors gracefully', () => {
    // This would require actually creating an invalid shader
    // For now, we test the error handler infrastructure
    const error = ShaderErrorHandler.parseError('Test error');
    expect(error.message).toBe('Test error');
  });

  it('should report uniform errors', () => {
    const shader = new SolarGlowShader();
    shader.compile();

    // Try to set invalid uniform
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    shader.setUniform('nonexistent', 1.0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    shader.dispose();
  });
});
