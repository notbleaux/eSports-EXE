// @ts-nocheck
/**
 * Shader Library Core
 * 
 * [Ver001.000] - Base shader infrastructure for mascot VFX
 * 
 * Provides:
 * - Base shader classes with lifecycle management
 * - Uniform management with type safety
 * - Shader compilation caching for performance
 * - Error handling with detailed diagnostics
 * - GLSL utility functions and common uniforms
 */

import * as THREE from 'three';

// ============================================
// Types and Interfaces
// ============================================

/** Shader compilation result */
export interface ShaderCompilationResult {
  success: boolean;
  material?: THREE.ShaderMaterial;
  error?: ShaderError;
  compileTime: number;
  cached: boolean;
}

/** Shader error details */
export interface ShaderError {
  message: string;
  type: 'vertex' | 'fragment' | 'link' | 'uniform' | 'syntax';
  line?: number;
  column?: number;
  source?: string;
}

/** Uniform definition with type and default value */
export interface UniformDefinition<T = unknown> {
  type: UniformType;
  value: T;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

/** Supported uniform types */
export type UniformType = 
  | 'float' 
  | 'int' 
  | 'vec2' 
  | 'vec3' 
  | 'vec4' 
  | 'mat2' 
  | 'mat3' 
  | 'mat4' 
  | 'sampler2D' 
  | 'samplerCube' 
  | 'bool';

/** Shader cache entry */
interface CacheEntry {
  material: THREE.ShaderMaterial;
  timestamp: number;
  useCount: number;
  uniforms: Map<string, unknown>;
}

/** Shader performance metrics */
export interface ShaderMetrics {
  compileTime: number;
  lastFrameTime: number;
  averageFrameTime: number;
  frameCount: number;
  uniformUpdateCount: number;
}

/** Base shader configuration */
export interface BaseShaderConfig {
  name: string;
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: Record<string, UniformDefinition>;
  defines?: Record<string, string | number | boolean>;
  transparent?: boolean;
  depthWrite?: boolean;
  depthTest?: boolean;
  blending?: THREE.Blending;
  side?: THREE.Side;
  wireframe?: boolean;
}

// ============================================
// Shader Cache Manager
// ============================================

export class ShaderCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize = 50, maxAgeMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAgeMs;
  }

  /** Generate cache key from shader source */
  private generateKey(
    vertexShader: string, 
    fragmentShader: string, 
    defines: Record<string, unknown> = {}
  ): string {
    const definesKey = Object.entries(defines)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    // Simple hash combining vertex and fragment shaders
    const combined = `${vertexShader}|${fragmentShader}|${definesKey}`;
    return this.simpleHash(combined);
  }

  /** Simple string hash function */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /** Get cached material or undefined */
  get(
    vertexShader: string, 
    fragmentShader: string, 
    defines?: Record<string, unknown>
  ): CacheEntry | undefined {
    const key = this.generateKey(vertexShader, fragmentShader, defines);
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    entry.useCount++;
    return entry;
  }

  /** Store material in cache */
  set(
    vertexShader: string, 
    fragmentShader: string,
    material: THREE.ShaderMaterial,
    defines?: Record<string, unknown>
  ): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(vertexShader, fragmentShader, defines);
    this.cache.set(key, {
      material,
      timestamp: Date.now(),
      useCount: 1,
      uniforms: new Map(),
    });
  }

  /** Evict least recently used entry */
  private evictLRU(): void {
    let oldest: [string, CacheEntry] | undefined;
    
    for (const entry of this.cache.entries()) {
      if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
        oldest = entry;
      }
    }

    if (oldest) {
      oldest[1].material.dispose();
      this.cache.delete(oldest[0]);
    }
  }

  /** Clear all cached materials */
  clear(): void {
    this.cache.forEach(entry => entry.material.dispose());
    this.cache.clear();
  }

  /** Get cache statistics */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    const totalUses = Array.from(this.cache.values())
      .reduce((sum, e) => sum + e.useCount, 0);
    const hitRate = totalUses > 0 
      ? (totalUses - this.cache.size) / totalUses 
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
    };
  }
}

// ============================================
// Uniform Manager
// ============================================

export class UniformManager {
  private definitions: Map<string, UniformDefinition> = new Map();
  private values: Map<string, unknown> = new Map();
  private callbacks: Map<string, Set<(value: unknown) => void>> = new Map();

  /** Register a uniform definition */
  register<T>(name: string, definition: UniformDefinition<T>): void {
    this.definitions.set(name, definition);
    this.values.set(name, definition.value);
    this.callbacks.set(name, new Set());
  }

  /** Register multiple uniforms at once */
  registerAll(uniforms: Record<string, UniformDefinition>): void {
    Object.entries(uniforms).forEach(([name, def]) => {
      this.register(name, def);
    });
  }

  /** Get uniform value */
  get<T>(name: string): T | undefined {
    return this.values.get(name) as T | undefined;
  }

  /** Set uniform value */
  set<T>(name: string, value: T): boolean {
    const def = this.definitions.get(name);
    if (!def) {
      console.warn(`Uniform '${name}' not registered`);
      return false;
    }

    // Validate value type
    if (!this.validateValue(value, def.type)) {
      console.warn(`Invalid value type for uniform '${name}' (expected ${def.type})`);
      return false;
    }

    // Clamp numeric values if min/max defined
    let finalValue = value;
    if (typeof value === 'number' && (def.min !== undefined || def.max !== undefined)) {
      finalValue = this.clamp(value, def.min, def.max) as unknown as T;
    }

    this.values.set(name, finalValue);
    
    // Notify callbacks
    this.callbacks.get(name)?.forEach(cb => cb(finalValue));
    
    return true;
  }

  /** Subscribe to uniform changes */
  subscribe(name: string, callback: (value: unknown) => void): () => void {
    const callbacks = this.callbacks.get(name);
    if (!callbacks) {
      return () => {};
    }

    callbacks.add(callback);
    return () => callbacks.delete(callback);
  }

  /** Get all uniforms as Three.js uniform format */
  getThreeUniforms(): Record<string, THREE.IUniform> {
    const result: Record<string, THREE.IUniform> = {};
    
    this.values.forEach((value, name) => {
      result[name] = { value };
    });

    return result;
  }

  /** Get uniform definitions for UI generation */
  getDefinitions(): Record<string, UniformDefinition> {
    return Object.fromEntries(this.definitions);
  }

  /** Reset all uniforms to defaults */
  reset(): void {
    this.definitions.forEach((def, name) => {
      this.values.set(name, def.value);
    });
  }

  /** Update multiple uniforms at once */
  updateBatch(updates: Record<string, unknown>): void {
    Object.entries(updates).forEach(([name, value]) => {
      this.set(name, value);
    });
  }

  /** Validate value against uniform type */
  private validateValue(value: unknown, type: UniformType): boolean {
    switch (type) {
      case 'float':
      case 'int':
        return typeof value === 'number';
      case 'vec2':
        return value instanceof THREE.Vector2 || 
               (Array.isArray(value) && value.length === 2);
      case 'vec3':
        return value instanceof THREE.Vector3 || 
               (Array.isArray(value) && value.length === 3);
      case 'vec4':
        return value instanceof THREE.Vector4 || 
               (Array.isArray(value) && value.length === 4) ||
               value instanceof THREE.Color;
      case 'mat2':
      case 'mat3':
      case 'mat4':
        return value instanceof THREE.Matrix2 ||
               value instanceof THREE.Matrix3 ||
               value instanceof THREE.Matrix4;
      case 'sampler2D':
      case 'samplerCube':
        return value instanceof THREE.Texture;
      case 'bool':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }

  /** Clamp value between min and max */
  private clamp(value: number, min?: number, max?: number): number {
    let result = value;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }
}

// ============================================
// Base Shader Class
// ============================================

export abstract class BaseShader {
  protected config: BaseShaderConfig;
  protected material?: THREE.ShaderMaterial;
  protected uniformManager: UniformManager;
  protected metrics: ShaderMetrics;
  protected disposed = false;
  protected startTime: number;

  // Shared cache instance
  protected static cache = new ShaderCache();

  constructor(config: BaseShaderConfig) {
    this.config = {
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      wireframe: false,
      ...config,
    };

    this.uniformManager = new UniformManager();
    this.startTime = performance.now();
    this.metrics = {
      compileTime: 0,
      lastFrameTime: 0,
      averageFrameTime: 0,
      frameCount: 0,
      uniformUpdateCount: 0,
    };

    // Register built-in uniforms
    this.registerBuiltinUniforms();
    
    // Register custom uniforms
    if (config.uniforms) {
      this.uniformManager.registerAll(config.uniforms);
    }
  }

  /** Register built-in time and resolution uniforms */
  private registerBuiltinUniforms(): void {
    this.uniformManager.register('uTime', {
      type: 'float',
      value: 0,
      description: 'Elapsed time in seconds',
    });

    this.uniformManager.register('uResolution', {
      type: 'vec2',
      value: new THREE.Vector2(1, 1),
      description: 'Screen resolution',
    });

    this.uniformManager.register('uMouse', {
      type: 'vec2',
      value: new THREE.Vector2(0.5, 0.5),
      description: 'Normalized mouse position',
    });
  }

  /** Compile the shader and create material */
  compile(): ShaderCompilationResult {
    const compileStart = performance.now();

    try {
      // Check cache first
      const cached = BaseShader.cache.get(
        this.getVertexShader(),
        this.getFragmentShader(),
        this.config.defines
      );

      if (cached) {
        this.material = cached.material.clone();
        this.material.uniforms = {
          ...this.material.uniforms,
          ...this.uniformManager.getThreeUniforms(),
        };
        
        this.metrics.compileTime = performance.now() - compileStart;
        
        return {
          success: true,
          material: this.material,
          compileTime: this.metrics.compileTime,
          cached: true,
        };
      }

      // Create new material
      this.material = new THREE.ShaderMaterial({
        uniforms: this.uniformManager.getThreeUniforms(),
        vertexShader: this.getVertexShader(),
        fragmentShader: this.getFragmentShader(),
        defines: this.config.defines,
        transparent: this.config.transparent,
        depthWrite: this.config.depthWrite,
        depthTest: this.config.depthTest,
        blending: this.config.blending,
        side: this.config.side,
        wireframe: this.config.wireframe,
      });

      // Cache the material
      BaseShader.cache.set(
        this.getVertexShader(),
        this.getFragmentShader(),
        this.material,
        this.config.defines
      );

      this.metrics.compileTime = performance.now() - compileStart;

      return {
        success: true,
        material: this.material,
        compileTime: this.metrics.compileTime,
        cached: false,
      };

    } catch (error) {
      this.metrics.compileTime = performance.now() - compileStart;
      
      const shaderError: ShaderError = {
        message: error instanceof Error ? error.message : 'Unknown compilation error',
        type: 'link',
      };

      return {
        success: false,
        error: shaderError,
        compileTime: this.metrics.compileTime,
        cached: false,
      };
    }
  }

  /** Update time-based uniforms - call in animation loop */
  update(deltaTime: number): void {
    if (this.disposed) return;

    const frameStart = performance.now();

    // Update time uniform
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.uniformManager.set('uTime', elapsed);

    // Update material uniforms
    if (this.material) {
      const uniforms = this.uniformManager.getThreeUniforms();
      Object.entries(uniforms).forEach(([name, uniform]) => {
        if (this.material!.uniforms[name]) {
          this.material!.uniforms[name].value = uniform.value;
        }
      });
    }

    // Update metrics
    this.metrics.lastFrameTime = performance.now() - frameStart;
    this.metrics.frameCount++;
    this.metrics.averageFrameTime = 
      (this.metrics.averageFrameTime * (this.metrics.frameCount - 1) + this.metrics.lastFrameTime) 
      / this.metrics.frameCount;
  }

  /** Set uniform value */
  setUniform<T>(name: string, value: T): boolean {
    this.metrics.uniformUpdateCount++;
    return this.uniformManager.set(name, value);
  }

  /** Get uniform value */
  getUniform<T>(name: string): T | undefined {
    return this.uniformManager.get<T>(name);
  }

  /** Get the compiled material */
  getMaterial(): THREE.ShaderMaterial | undefined {
    return this.material;
  }

  /** Get current metrics */
  getMetrics(): ShaderMetrics {
    return { ...this.metrics };
  }

  /** Dispose of resources */
  dispose(): void {
    if (this.disposed) return;
    
    this.material?.dispose();
    this.material = undefined;
    this.disposed = true;
  }

  /** Abstract methods to be implemented by subclasses */
  protected abstract getVertexShader(): string;
  protected abstract getFragmentShader(): string;
}

// ============================================
// GLSL Utility Functions
// ============================================

export const GLSL_UTILS = {
  // Noise functions
  noise3D: `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `,

  // Simplex noise (2D)
  noise2D: `
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
  `,

  // Fractional Brownian Motion
  fbm: `
    float fbm(vec2 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
  `,

  // HSV to RGB conversion
  hsv2rgb: `
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
  `,

  // RGB to HSV conversion
  rgb2hsv: `
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
  `,

  // Rotations
  rotate2D: `
    mat2 rotate2D(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat2(c, -s, s, c);
    }
  `,

  rotate3D: `
    mat3 rotate3D(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
      );
    }
  `,

  // Common uniforms
  uniforms: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
  `,

  // Varying for fragment shader
  varyings: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
  `,

  // Vertex shader header - use GLSL_UTILS reference instead of this
  vertexHeader: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;

    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat3 normalMatrix;
  `,

  // Fragment shader header - use GLSL_UTILS reference instead of this
  fragmentHeader: `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
  `,
};

// ============================================
// Error Handler
// ============================================

export class ShaderErrorHandler {
  /** Parse GLSL compilation error and extract details */
  static parseError(error: string, vertexSource?: string, fragmentSource?: string): ShaderError {
    // Try to extract line number from common error formats
    const lineMatch = error.match(/(\d+):(\d+)/) || error.match(/line\s+(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    const column = lineMatch && lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined;

    // Determine error type
    let type: ShaderError['type'] = 'link';
    if (error.includes('vertex')) type = 'vertex';
    else if (error.includes('fragment')) type = 'fragment';
    else if (error.includes('uniform')) type = 'uniform';
    else if (error.includes('syntax')) type = 'syntax';

    return {
      message: error,
      type,
      line,
      column,
      source: type === 'vertex' ? vertexSource : fragmentSource,
    };
  }

  /** Format error for display */
  static formatError(error: ShaderError): string {
    let formatted = `[${error.type.toUpperCase()} ERROR]`;
    if (error.line) formatted += ` Line ${error.line}`;
    if (error.column) formatted += `:${error.column}`;
    formatted += `: ${error.message}`;
    return formatted;
  }
}

// ============================================
// Export cache for external access
// ============================================

export const globalShaderCache = BaseShader.cache;
