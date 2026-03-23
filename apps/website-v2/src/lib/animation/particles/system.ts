/**
 * Particle System Core
 * 
 * [Ver001.000] - Particle-based VFX system for mascot abilities
 * 
 * Provides:
 * - Particle emitter management
 * - Particle lifecycle (spawn, update, die)
 * - Performance optimization with object pooling
 * - LOD (Level of Detail) management
 */

import * as THREE from 'three';

// ============================================
// Types and Interfaces
// ============================================

/** Particle data structure */
export interface Particle {
  /** Unique particle ID */
  id: number;
  /** Current position */
  position: THREE.Vector3;
  /** Current velocity */
  velocity: THREE.Vector3;
  /** Acceleration */
  acceleration: THREE.Vector3;
  /** Current color */
  color: THREE.Color;
  /** Current size */
  size: number;
  /** Current opacity */
  opacity: number;
  /** Rotation in radians */
  rotation: number;
  /** Rotation speed */
  rotationSpeed: number;
  /** Age in seconds */
  age: number;
  /** Maximum lifetime in seconds */
  lifetime: number;
  /** Whether particle is alive */
  alive: boolean;
  /** Particle texture index (for atlasing) */
  textureIndex: number;
  /** Custom data for effects */
  customData: Record<string, number>;
}

/** Particle emitter configuration */
export interface EmitterConfig {
  /** Emission rate (particles per second) */
  emissionRate: number;
  /** Maximum number of particles */
  maxParticles: number;
  /** Particle lifetime range */
  lifetime: { min: number; max: number };
  /** Initial position offset */
  positionOffset: { x: number; y: number; z: number };
  /** Position spread */
  positionSpread: { x: number; y: number; z: number };
  /** Initial velocity */
  velocity: { x: number; y: number; z: number };
  /** Velocity spread */
  velocitySpread: { x: number; y: number; z: number };
  /** Initial size range */
  size: { min: number; max: number };
  /** Size over lifetime curve (0-1) */
  sizeOverLifetime: number[];
  /** Initial color */
  color: THREE.Color;
  /** Color variation */
  colorVariation: number;
  /** Opacity over lifetime curve (0-1) */
  opacityOverLifetime: number[];
  /** Gravity effect */
  gravity: number;
  /** Drag/air resistance */
  drag: number;
  /** Blend mode */
  blending: THREE.Blending;
  /** Whether particles face camera */
  billboard: boolean;
  /** Texture atlas configuration */
  textureAtlas?: {
    columns: number;
    rows: number;
    frameCount: number;
    animationSpeed: number;
  };
  /** Custom update function */
  customUpdate?: (particle: Particle, deltaTime: number) => void;
}

/** System performance configuration */
export interface PerformanceConfig {
  /** Target FPS */
  targetFPS: number;
  /** Enable automatic LOD */
  enableLOD: boolean;
  /** Maximum particles at high quality */
  maxParticlesHigh: number;
  /** Maximum particles at medium quality */
  maxParticlesMedium: number;
  /** Maximum particles at low quality */
  maxParticlesLow: number;
  /** Distance thresholds for LOD */
  lodDistances: { high: number; medium: number; low: number };
  /** Enable frustum culling */
  enableFrustumCulling: boolean;
  /** Cull distance */
  cullDistance: number;
}

/** Particle system statistics */
export interface ParticleStats {
  /** Total particles allocated */
  totalAllocated: number;
  /** Currently active particles */
  activeCount: number;
  /** Particles emitted this second */
  emissionRate: number;
  /** Current FPS */
  currentFPS: number;
  /** Current LOD level */
  lodLevel: 'high' | 'medium' | 'low';
  /** Update time in ms */
  updateTime: number;
  /** Pool hit rate */
  poolHitRate: number;
}

/** Quality level for LOD */
export type QualityLevel = 'high' | 'medium' | 'low';

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_EMITTER_CONFIG: EmitterConfig = {
  emissionRate: 100,
  maxParticles: 1000,
  lifetime: { min: 1, max: 3 },
  positionOffset: { x: 0, y: 0, z: 0 },
  positionSpread: { x: 1, y: 1, z: 1 },
  velocity: { x: 0, y: 1, z: 0 },
  velocitySpread: { x: 0.5, y: 0.5, z: 0.5 },
  size: { min: 0.1, max: 0.5 },
  sizeOverLifetime: [1, 1, 1, 0.8, 0.5, 0.2, 0],
  color: new THREE.Color(1, 1, 1),
  colorVariation: 0.1,
  opacityOverLifetime: [0, 1, 1, 1, 0.8, 0.3, 0],
  gravity: -9.8,
  drag: 0.1,
  blending: THREE.AdditiveBlending,
  billboard: true,
};

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  enableLOD: true,
  maxParticlesHigh: 2000,
  maxParticlesMedium: 1000,
  maxParticlesLow: 500,
  lodDistances: { high: 10, medium: 30, low: 100 },
  enableFrustumCulling: true,
  cullDistance: 200,
};

// ============================================
// Object Pool for Particles
// ============================================

export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];
  private maxSize: number;
  private nextId = 0;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.preallocate(Math.min(maxSize, 100));
  }

  /** Preallocate particles to reduce runtime allocation */
  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createParticle());
    }
  }

  /** Create a new particle instance */
  private createParticle(): Particle {
    return {
      id: this.nextId++,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      color: new THREE.Color(),
      size: 1,
      opacity: 1,
      rotation: 0,
      rotationSpeed: 0,
      age: 0,
      lifetime: 1,
      alive: false,
      textureIndex: 0,
      customData: {},
    };
  }

  /** Acquire a particle from the pool */
  acquire(): Particle {
    let particle: Particle;

    if (this.pool.length > 0) {
      particle = this.pool.pop()!;
      this.hits++;
    } else if (this.active.length < this.maxSize) {
      particle = this.createParticle();
      this.misses++;
    } else {
      // Pool exhausted, recycle oldest active particle
      particle = this.active.shift()!;
      this.misses++;
    }

    particle.alive = true;
    particle.age = 0;
    particle.customData = {};
    this.active.push(particle);

    return particle;
  }

  /** Release a particle back to the pool */
  release(particle: Particle): void {
    particle.alive = false;
    const index = this.active.indexOf(particle);
    if (index > -1) {
      this.active.splice(index, 1);
    }
    
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }

  /** Get all active particles */
  getActive(): Particle[] {
    return this.active;
  }

  /** Get pool statistics */
  getStats(): { hitRate: number; poolSize: number; activeCount: number } {
    const total = this.hits + this.misses;
    return {
      hitRate: total > 0 ? this.hits / total : 0,
      poolSize: this.pool.length,
      activeCount: this.active.length,
    };
  }

  /** Clear all particles */
  clear(): void {
    this.active.forEach(p => p.alive = false);
    this.active = [];
  }

  /** Resize the pool */
  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    // Trim excess pooled particles
    while (this.pool.length > this.maxSize) {
      this.pool.pop();
    }
  }
}

// ============================================
// Particle Emitter
// ============================================

export class ParticleEmitter {
  private config: EmitterConfig;
  private pool: ParticlePool;
  private emissionAccumulator = 0;
  private position: THREE.Vector3;
  private frustum: THREE.Frustum;
  private projScreenMatrix: THREE.Matrix4;
  private _enabled = true;
  private _paused = false;

  constructor(config: Partial<EmitterConfig> = {}, position?: THREE.Vector3) {
    this.config = { ...DEFAULT_EMITTER_CONFIG, ...config };
    this.pool = new ParticlePool(this.config.maxParticles);
    this.position = position?.clone() || new THREE.Vector3();
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
  }

  /** Update emitter state */
  update(deltaTime: number, camera?: THREE.Camera): void {
    if (!this._enabled || this._paused) return;

    // Update frustum for culling
    if (camera && this.config.maxParticles > 0) {
      this.projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    // Emit new particles
    this.emissionAccumulator += this.config.emissionRate * deltaTime;
    
    while (this.emissionAccumulator >= 1) {
      this.emit();
      this.emissionAccumulator -= 1;
    }

    // Update existing particles
    const particles = this.pool.getActive();
    for (const particle of particles) {
      this.updateParticle(particle, deltaTime);
    }
  }

  /** Emit a single particle */
  emit(): Particle | null {
    const particle = this.pool.acquire();
    if (!particle) return null;

    // Initialize position with spread
    particle.position.set(
      this.position.x + this.config.positionOffset.x + (Math.random() - 0.5) * this.config.positionSpread.x,
      this.position.y + this.config.positionOffset.y + (Math.random() - 0.5) * this.config.positionSpread.y,
      this.position.z + this.config.positionOffset.z + (Math.random() - 0.5) * this.config.positionSpread.z
    );

    // Initialize velocity with spread
    particle.velocity.set(
      this.config.velocity.x + (Math.random() - 0.5) * this.config.velocitySpread.x,
      this.config.velocity.y + (Math.random() - 0.5) * this.config.velocitySpread.y,
      this.config.velocity.z + (Math.random() - 0.5) * this.config.velocitySpread.z
    );

    particle.acceleration.set(0, this.config.gravity, 0);

    // Initialize appearance
    particle.size = this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min);
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * 2;
    particle.lifetime = this.config.lifetime.min + Math.random() * (this.config.lifetime.max - this.config.lifetime.min);
    
    // Color with variation
    const variation = this.config.colorVariation;
    particle.color.setRGB(
      Math.max(0, Math.min(1, this.config.color.r + (Math.random() - 0.5) * variation)),
      Math.max(0, Math.min(1, this.config.color.g + (Math.random() - 0.5) * variation)),
      Math.max(0, Math.min(1, this.config.color.b + (Math.random() - 0.5) * variation))
    );

    particle.textureIndex = this.config.textureAtlas 
      ? Math.floor(Math.random() * this.config.textureAtlas.frameCount)
      : 0;

    return particle;
  }

  /** Update a single particle */
  private updateParticle(particle: Particle, deltaTime: number): void {
    particle.age += deltaTime;

    // Check lifetime
    if (particle.age >= particle.lifetime) {
      this.pool.release(particle);
      return;
    }

    // Apply physics
    particle.velocity.addScaledVector(particle.acceleration, deltaTime);
    particle.velocity.multiplyScalar(1 - this.config.drag * deltaTime);
    particle.position.addScaledVector(particle.velocity, deltaTime);

    // Update rotation
    particle.rotation += particle.rotationSpeed * deltaTime;

    // Apply custom update if provided
    if (this.config.customUpdate) {
      this.config.customUpdate(particle, deltaTime);
    }
  }

  /** Get value from curve at normalized time */
  private getCurveValue(curve: number[], normalizedTime: number): number {
    const index = normalizedTime * (curve.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const t = index - lower;
    
    const a = curve[Math.min(lower, curve.length - 1)];
    const b = curve[Math.min(upper, curve.length - 1)];
    
    return a + (b - a) * t;
  }

  /** Set emitter position */
  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
  }

  /** Get emitter position */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /** Get all active particles */
  getActiveParticles(): Particle[] {
    return this.pool.getActive();
  }

  /** Get emitter configuration */
  getConfig(): EmitterConfig {
    return this.config;
  }

  /** Update emitter configuration */
  updateConfig(config: Partial<EmitterConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.maxParticles && config.maxParticles !== this.pool.getStats().poolSize) {
      this.pool.resize(config.maxParticles);
    }
  }

  /** Enable/disable emitter */
  set enabled(value: boolean) {
    this._enabled = value;
    if (!value) {
      this.pool.clear();
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  /** Pause/resume emitter */
  set paused(value: boolean) {
    this._paused = value;
  }

  get paused(): boolean {
    return this._paused;
  }

  /** Burst emit multiple particles at once */
  burst(count: number): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const particle = this.emit();
      if (particle) particles.push(particle);
    }
    return particles;
  }

  /** Clear all particles */
  clear(): void {
    this.pool.clear();
    this.emissionAccumulator = 0;
  }

  /** Dispose of resources */
  dispose(): void {
    this.pool.clear();
  }
}

// ============================================
// Particle System Manager
// ============================================

export class ParticleSystem {
  private emitters: Map<string, ParticleEmitter> = new Map();
  private performanceConfig: PerformanceConfig;
  private camera?: THREE.Camera;
  private lastUpdateTime = performance.now();
  private fpsHistory: number[] = [];
  private currentLOD: QualityLevel = 'high';
  private stats: ParticleStats = {
    totalAllocated: 0,
    activeCount: 0,
    emissionRate: 0,
    currentFPS: 60,
    lodLevel: 'high',
    updateTime: 0,
    poolHitRate: 0,
  };

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.performanceConfig = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
  }

  /** Register a camera for LOD and culling */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /** Create a new emitter */
  createEmitter(
    id: string, 
    config: Partial<EmitterConfig> = {}, 
    position?: THREE.Vector3
  ): ParticleEmitter {
    const emitter = new ParticleEmitter(config, position);
    this.emitters.set(id, emitter);
    return emitter;
  }

  /** Get an existing emitter */
  getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }

  /** Remove an emitter */
  removeEmitter(id: string): boolean {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.dispose();
      this.emitters.delete(id);
      return true;
    }
    return false;
  }

  /** Update all emitters */
  update(): void {
    const updateStart = performance.now();
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
    this.lastUpdateTime = now;

    // Calculate FPS
    const fps = 1 / deltaTime;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    // Update LOD based on performance
    this.updateLOD(avgFPS);

    // Update all emitters
    let totalActive = 0;
    let totalPoolHits = 0;
    let totalPoolMisses = 0;

    this.emitters.forEach(emitter => {
      emitter.update(deltaTime, this.camera);
      const poolStats = (emitter as unknown as { pool: ParticlePool }).pool.getStats();
      totalActive += poolStats.activeCount;
      totalPoolHits += poolStats.hitRate * poolStats.activeCount;
      totalPoolMisses += (1 - poolStats.hitRate) * poolStats.activeCount;
    });

    // Update stats
    this.stats.currentFPS = Math.round(avgFPS);
    this.stats.activeCount = totalActive;
    this.stats.lodLevel = this.currentLOD;
    this.stats.updateTime = performance.now() - updateStart;
    this.stats.poolHitRate = totalActive > 0 ? totalPoolHits / totalActive : 0;
  }

  /** Update LOD level based on performance */
  private updateLOD(fps: number): void {
    if (!this.performanceConfig.enableLOD) return;

    const targetFPS = this.performanceConfig.targetFPS;
    
    if (fps < targetFPS * 0.7 && this.currentLOD !== 'low') {
      this.currentLOD = 'low';
      this.applyLOD();
    } else if (fps < targetFPS * 0.85 && this.currentLOD !== 'medium') {
      this.currentLOD = 'medium';
      this.applyLOD();
    } else if (fps >= targetFPS * 0.9 && this.currentLOD !== 'high') {
      this.currentLOD = 'high';
      this.applyLOD();
    }
  }

  /** Apply LOD settings to all emitters */
  private applyLOD(): void {
    let maxParticles: number;
    
    switch (this.currentLOD) {
      case 'high':
        maxParticles = this.performanceConfig.maxParticlesHigh;
        break;
      case 'medium':
        maxParticles = this.performanceConfig.maxParticlesMedium;
        break;
      case 'low':
        maxParticles = this.performanceConfig.maxParticlesLow;
        break;
    }

    this.emitters.forEach(emitter => {
      const config = emitter.getConfig();
      if (config.maxParticles > maxParticles) {
        emitter.updateConfig({ maxParticles });
      }
    });
  }

  /** Get all active particles from all emitters */
  getAllParticles(): Particle[] {
    const allParticles: Particle[] = [];
    this.emitters.forEach(emitter => {
      allParticles.push(...emitter.getActiveParticles());
    });
    return allParticles;
  }

  /** Get current statistics */
  getStats(): ParticleStats {
    return { ...this.stats };
  }

  /** Get current LOD level */
  getLOD(): QualityLevel {
    return this.currentLOD;
  }

  /** Set LOD manually */
  setLOD(level: QualityLevel): void {
    this.currentLOD = level;
    this.applyLOD();
  }

  /** Get all emitter IDs */
  getEmitterIds(): string[] {
    return Array.from(this.emitters.keys());
  }

  /** Clear all emitters and particles */
  clear(): void {
    this.emitters.forEach(emitter => emitter.clear());
  }

  /** Dispose of all resources */
  dispose(): void {
    this.emitters.forEach(emitter => emitter.dispose());
    this.emitters.clear();
  }

  /** Burst emit from a specific emitter */
  burst(emitterId: string, count: number): Particle[] {
    const emitter = this.emitters.get(emitterId);
    return emitter ? emitter.burst(count) : [];
  }
}

// ============================================
// Utility Functions
// ============================================

/** Easing functions for particle animations */
export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/** Create a smooth curve from control points */
export function createCurve(points: number[], segments: number = 10): number[] {
  const curve: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const index = t * (points.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const localT = index - lower;
    
    const a = points[Math.min(lower, points.length - 1)];
    const b = points[Math.min(upper, points.length - 1)];
    
    // Smoothstep interpolation
    const smoothT = localT * localT * (3 - 2 * localT);
    curve.push(a + (b - a) * smoothT);
  }
  return curve;
}

/** Color interpolation */
export function lerpColor(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color): void {
  out.r = a.r + (b.r - a.r) * t;
  out.g = a.g + (b.g - a.g) * t;
  out.b = a.b + (b.b - a.b) * t;
}

/** Generate random point in sphere */
export function randomPointInSphere(radius: number, out: THREE.Vector3): void {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  out.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

/** Generate random point on circle */
export function randomPointOnCircle(radius: number, out: THREE.Vector3): void {
  const angle = Math.random() * Math.PI * 2;
  out.set(
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius
  );
}

// ============================================
// Export singleton instance
// ============================================

export const globalParticleSystem = new ParticleSystem();
