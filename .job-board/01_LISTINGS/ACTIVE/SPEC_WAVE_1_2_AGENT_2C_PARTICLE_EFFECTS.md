[Ver001.000]

# WAVE 1.2 — AGENT 2-C TASK: Particle Effects Engine
**Priority:** P1  
**Estimated:** 10 hours  
**Due:** +48 hours from Wave 1.1 completion  
**Stream:** Advanced Lens System  
**Dependencies:** Agent 1-A Lens Framework, Agent 2-A WebGL Shaders

---

## ASSIGNMENT

Build a high-performance particle effects engine for atmospheric and event-based visualizations (smoke, sparks, muzzle flashes, etc.).

---

## DELIVERABLES

### 1. Particle System Core (lens/particles/engine.ts)

```typescript
export interface ParticleConfig {
  maxParticles: number;
  emissionRate: number;      // Particles per second
  lifetime: { min: number; max: number };
  position: {
    type: 'point' | 'circle' | 'box';
    params: unknown;
  };
  velocity: {
    type: 'cone' | 'sphere' | 'custom';
    params: unknown;
  };
  size: { start: number; end: number };
  color: { start: Color; end: Color };
  opacity: { start: number; end: number };
}

export class ParticleEngine {
  private gl: WebGL2RenderingContext;
  private maxParticles: number;
  
  // GPU buffers
  private positionBuffer: WebGLBuffer;
  private velocityBuffer: WebGLBuffer;
  private lifeBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;
  
  // Particle state (managed on GPU via transform feedback)
  private particles: GPUParticleState;
  
  constructor(gl: WebGL2RenderingContext, maxParticles: number = 10000) {
    this.gl = gl;
    this.maxParticles = maxParticles;
    this.initializeBuffers();
    this.createTransformFeedback();
  }
  
  // Emit new particles
  emit(count: number, config: ParticleConfig): void {
    // Generate particles on CPU, upload to GPU
    // Or use compute shader for GPU-side emission
  }
  
  // Update all particles (GPU-side)
  update(deltaTime: number): void {
    // Use transform feedback to update positions
    // Apply forces: gravity, wind, turbulence
    // Update lifetime, kill dead particles
  }
  
  // Render particles
  render(camera: CameraState): void {
    // Sort by depth (for transparency)
    // Use instancing for performance
    // Apply soft particles (depth-based fading)
  }
}

interface GPUParticleState {
  positions: Float32Array;  // xyz
  velocities: Float32Array; // xyz
  lifetimes: Float32Array;  // current, max
  sizes: Float32Array;      // current, target
  colors: Float32Array;     // rgba
}
```

### 2. Preset Effect Systems

```typescript
export class EffectPresets {
  // Smoke from grenades/abilities
  static smoke(config: { duration: number; radius: number }): ParticleConfig {
    return {
      maxParticles: 500,
      emissionRate: 50,
      lifetime: { min: 3000, max: 5000 },
      position: { type: 'circle', params: { radius: config.radius } },
      velocity: { 
        type: 'cone', 
        params: { angle: 30, speed: { min: 0.5, max: 1.5 } }
      },
      size: { start: 10, end: 50 },
      color: { 
        start: [0.7, 0.7, 0.7], 
        end: [0.5, 0.5, 0.5] 
      },
      opacity: { start: 0.6, end: 0 }
    };
  }
  
  // Sparks from bullet impacts
  static sparks(): ParticleConfig {
    return {
      maxParticles: 20,
      emissionRate: 0, // Burst only
      lifetime: { min: 100, max: 300 },
      position: { type: 'point', params: {} },
      velocity: { 
        type: 'sphere', 
        params: { speed: { min: 5, max: 10 } }
      },
      size: { start: 2, end: 0 },
      color: { 
        start: [1, 0.8, 0.2], 
        end: [0.8, 0.3, 0.1] 
      },
      opacity: { start: 1, end: 0 }
    };
  }
  
  // Muzzle flash
  static muzzleFlash(): ParticleConfig {
    return {
      maxParticles: 10,
      emissionRate: 0,
      lifetime: { min: 20, max: 40 },
      position: { type: 'point', params: {} },
      velocity: { type: 'cone', params: { angle: 15, speed: { min: 2, max: 4 } } },
      size: { start: 15, end: 5 },
      color: { start: [1, 0.9, 0.5], end: [1, 0.3, 0.1] },
      opacity: { start: 1, end: 0 }
    };
  }
  
  // Blood spray
  static bloodSpray(direction: Vector3D): ParticleConfig {
    return {
      maxParticles: 30,
      emissionRate: 0,
      lifetime: { min: 500, max: 1000 },
      position: { type: 'point', params: {} },
      velocity: { 
        type: 'cone', 
        params: { 
          direction, 
          angle: 45, 
          speed: { min: 3, max: 8 } 
        }
      },
      size: { start: 3, end: 1 },
      color: { start: [0.8, 0.1, 0.1], end: [0.5, 0.05, 0.05] },
      opacity: { start: 1, end: 0.3 }
    };
  }
  
  // Clutch glow (hero moment)
  static clutchGlow(): ParticleConfig {
    return {
      maxParticles: 100,
      emissionRate: 20,
      lifetime: { min: 1000, max: 2000 },
      position: { type: 'circle', params: { radius: 30 } },
      velocity: { type: 'sphere', params: { speed: { min: 0.5, max: 1 } } },
      size: { start: 5, end: 0 },
      color: { start: [1, 0.8, 0], end: [1, 0.4, 0] },
      opacity: { start: 0.8, end: 0 }
    };
  }
}
```

### 3. Event-Driven Effects

```typescript
export class EventEffects {
  private engine: ParticleEngine;
  
  onMatchEvent(event: MatchEvent): void {
    switch (event.type) {
      case 'kill':
        this.spawnBloodSpray(event.position, event.direction);
        break;
      case 'ability_used':
        this.spawnAbilityEffect(event.abilityType, event.position);
        break;
      case 'bomb_exploded':
        this.spawnExplosion(event.position);
        break;
      case 'weapon_fired':
        this.spawnMuzzleFlash(event.position, event.direction);
        break;
    }
  }
  
  private spawnExplosion(position: Vector3D): void {
    // Flash
    // Shockwave ring
    // Debris particles
    // Smoke bloom
  }
  
  private spawnAbilityEffect(type: string, position: Vector3D): void {
    const effects: Record<string, () => void> = {
      'smoke_grenade': () => this.engine.emit(500, EffectPresets.smoke({ duration: 5000, radius: 20 })),
      'flashbang': () => this.spawnFlashEffect(position),
      'molly': () => this.spawnFireEffect(position),
      'he_grenade': () => this.spawnExplosion(position)
    };
    
    effects[type]?.();
  }
}
```

### 4. Performance Management

```typescript
export class ParticleLOD {
  // Adjust particle count based on performance
  adjustQuality(targetFps: number, currentFps: number): void {
    if (currentFps < targetFps * 0.9) {
      this.reduceParticleCount(0.8);
      this.disableEffects(['smoke_detail', 'spark_trails']);
    } else if (currentFps > targetFps * 1.1) {
      this.increaseParticleCount(1.2);
      this.enableEffects(['smoke_detail', 'spark_trails']);
    }
  }
  
  // Distance-based culling
  cullByDistance(particles: Particle[], cameraPos: Vector3D, maxDistance: number): Particle[] {
    return particles.filter(p => 
      distance(p.position, cameraPos) < maxDistance
    );
  }
}
```

---

## ACCEPTANCE CRITERIA

- [ ] 10,000 particles at 60fps
- [ ] All 5 preset effects working
- [ ] Event-driven spawning responsive
- [ ] LOD system maintains performance
- [ ] Soft particles (no hard edges)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
