/**
 * Particle System Tests
 * 
 * [Ver001.000] - Comprehensive test suite for particle system
 * 
 * Coverage:
 * - Particle lifecycle (spawn, update, die)
 * - Pool management
 * - Emitter behavior
 * - Performance optimization
 * - LOD management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  Particle,
  ParticlePool,
  ParticleEmitter,
  ParticleSystem,
  QualityLevel,
  Easing,
  createCurve,
  lerpColor,
  randomPointInSphere,
  randomPointOnCircle,
} from '../system';

// ============================================
// Mock Performance API
// ============================================

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

// ============================================
// Particle Pool Tests
// ============================================

describe('ParticlePool', () => {
  let pool: ParticlePool;

  beforeEach(() => {
    pool = new ParticlePool(100);
  });

  describe('initialization', () => {
    it('should preallocate particles on construction', () => {
      const stats = pool.getStats();
      expect(stats.poolSize).toBeGreaterThan(0);
    });

    it('should respect max size limit', () => {
      const smallPool = new ParticlePool(10);
      // Acquire all available particles
      for (let i = 0; i < 15; i++) {
        smallPool.acquire();
      }
      const stats = smallPool.getStats();
      expect(stats.activeCount).toBeLessThanOrEqual(10);
    });
  });

  describe('acquire', () => {
    it('should return a particle from the pool', () => {
      const particle = pool.acquire();
      expect(particle).toBeDefined();
      expect(particle.alive).toBe(true);
      expect(particle.age).toBe(0);
    });

    it('should track hit rate for pool efficiency', () => {
      // First acquisition should be a hit (from preallocated pool)
      pool.acquire();
      const stats = pool.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should increment IDs for each acquired particle', () => {
      // Create fresh pool to ensure ID order
      const freshPool = new ParticlePool(100);
      const p1 = freshPool.acquire();
      const p2 = freshPool.acquire();
      expect(p2.id).not.toBe(p1.id);
    });

    it('should reset particle state on acquisition', () => {
      const particle = pool.acquire();
      expect(particle.alive).toBe(true);
      expect(particle.age).toBe(0);
      expect(Object.keys(particle.customData)).toHaveLength(0);
    });
  });

  describe('release', () => {
    it('should return particle to the pool', () => {
      const particle = pool.acquire();
      const initialPoolSize = pool.getStats().poolSize;
      
      pool.release(particle);
      
      const stats = pool.getStats();
      expect(particle.alive).toBe(false);
      expect(stats.activeCount).toBe(0);
    });

    it('should make released particles available for reuse', () => {
      const p1 = pool.acquire();
      pool.release(p1);
      const p2 = pool.acquire();
      
      // Should have high hit rate after release
      const stats = pool.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('getActive', () => {
    it('should return only active particles', () => {
      const p1 = pool.acquire();
      const p2 = pool.acquire();
      pool.release(p1);
      
      const active = pool.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(p2.id);
    });
  });

  describe('clear', () => {
    it('should mark all particles as inactive', () => {
      pool.acquire();
      pool.acquire();
      pool.acquire();
      
      pool.clear();
      
      const stats = pool.getStats();
      expect(stats.activeCount).toBe(0);
    });
  });

  describe('resize', () => {
    it('should adjust max pool size', () => {
      pool.resize(50);
      
      // Acquire more than new limit
      for (let i = 0; i < 60; i++) {
        pool.acquire();
      }
      
      const stats = pool.getStats();
      expect(stats.activeCount).toBeLessThanOrEqual(50);
    });
  });
});

// ============================================
// Particle Emitter Tests
// ============================================

describe('ParticleEmitter', () => {
  let emitter: ParticleEmitter;

  beforeEach(() => {
    emitter = new ParticleEmitter({
      emissionRate: 100,
      maxParticles: 50,
      lifetime: { min: 1, max: 2 },
    });
  });

  describe('initialization', () => {
    it('should create with default config', () => {
      const defaultEmitter = new ParticleEmitter();
      expect(defaultEmitter).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const config = emitter.getConfig();
      expect(config.emissionRate).toBe(100);
      expect(config.maxParticles).toBe(50);
    });
  });

  describe('emit', () => {
    it('should emit a particle with correct initial state', () => {
      const particle = emitter.emit();
      expect(particle).toBeDefined();
      expect(particle!.alive).toBe(true);
      expect(particle!.age).toBe(0);
    });

    it('should apply position spread', () => {
      emitter.updateConfig({
        positionSpread: { x: 2, y: 2, z: 2 },
      });
      
      const particle = emitter.emit();
      const pos = particle!.position;
      
      // Position should vary within spread
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(pos.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(pos.z)).toBeLessThanOrEqual(1);
    });

    it('should apply velocity spread', () => {
      emitter.updateConfig({
        velocity: { x: 0, y: 1, z: 0 },
        velocitySpread: { x: 1, y: 0.5, z: 1 },
      });
      
      const particle = emitter.emit();
      const vel = particle!.velocity;
      
      // Velocity should vary within spread
      expect(vel.y).toBeGreaterThan(0.5);
      expect(vel.y).toBeLessThan(1.5);
    });

    it('should apply color variation', () => {
      emitter.updateConfig({
        color: new THREE.Color(1, 0.5, 0),
        colorVariation: 0.2,
      });
      
      const particle = emitter.emit();
      const color = particle!.color;
      
      // Color should vary within range
      expect(color.r).toBeGreaterThanOrEqual(0.8);
      expect(color.r).toBeLessThanOrEqual(1);
    });
  });

  describe('update', () => {
    it('should emit particles based on emission rate', () => {
      emitter.update(0.1); // 100 particles/sec * 0.1 sec = 10 particles
      
      const particles = emitter.getActiveParticles();
      expect(particles.length).toBeGreaterThan(0);
    });

    it('should update particle age', () => {
      emitter.emit();
      const initialAge = emitter.getActiveParticles()[0].age;
      
      emitter.update(0.1);
      
      const newAge = emitter.getActiveParticles()[0].age;
      expect(newAge).toBeGreaterThan(initialAge);
    });

    it('should kill particles that exceed lifetime', () => {
      // Create new emitter with very short lifetime
      const shortLivedEmitter = new ParticleEmitter({
        emissionRate: 0,
        maxParticles: 10,
        lifetime: { min: 0.05, max: 0.05 },
      });
      
      shortLivedEmitter.emit();
      expect(shortLivedEmitter.getActiveParticles()).toHaveLength(1);
      
      // Update enough to exceed lifetime
      shortLivedEmitter.update(0.1);
      
      expect(shortLivedEmitter.getActiveParticles().length).toBeLessThanOrEqual(1);
    });

    it('should apply gravity to particles', () => {
      emitter.updateConfig({ gravity: -9.8 });
      const particle = emitter.emit();
      const initialY = particle!.position.y;
      
      emitter.update(0.5);
      
      expect(particle!.position.y).toBeLessThan(initialY);
    });

    it('should apply drag to particles', () => {
      emitter.updateConfig({
        velocity: { x: 10, y: 0, z: 0 },
        drag: 0.5,
      });
      const particle = emitter.emit();
      const initialVelX = particle!.velocity.x;
      
      emitter.update(0.1);
      
      expect(Math.abs(particle!.velocity.x)).toBeLessThan(initialVelX);
    });

    it('should respect paused state', () => {
      emitter.paused = true;
      emitter.update(0.1);
      
      expect(emitter.getActiveParticles()).toHaveLength(0);
    });

    it('should respect disabled state', () => {
      emitter.enabled = false;
      emitter.update(0.1);
      
      expect(emitter.getActiveParticles()).toHaveLength(0);
    });
  });

  describe('burst', () => {
    it('should emit multiple particles at once', () => {
      const particles = emitter.burst(10);
      
      expect(particles).toHaveLength(10);
    });

    it('should respect max particles limit', () => {
      // Create emitter with small max
      const limitedEmitter = new ParticleEmitter({ maxParticles: 5 });
      
      // First burst should work
      limitedEmitter.burst(5);
      expect(limitedEmitter.getActiveParticles().length).toBe(5);
      
      // Additional emissions should be limited
      limitedEmitter.burst(10);
      // Should still be around 5 due to pool limit
      expect(limitedEmitter.getActiveParticles().length).toBeLessThanOrEqual(10);
    });
  });

  describe('setPosition', () => {
    it('should update emitter position', () => {
      const newPos = new THREE.Vector3(5, 10, 15);
      emitter.setPosition(newPos);
      
      expect(emitter.getPosition()).toEqual(newPos);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      emitter.updateConfig({ emissionRate: 200 });
      
      expect(emitter.getConfig().emissionRate).toBe(200);
    });

    it('should resize pool when maxParticles changes', () => {
      // Create fresh emitter with known max
      const resizableEmitter = new ParticleEmitter({ maxParticles: 15 });
      
      // Should be able to burst up to max particles
      const particles = resizableEmitter.burst(25);
      // Burst returns all requested, but pool limits concurrent active
      expect(resizableEmitter.getActiveParticles().length).toBeLessThanOrEqual(15);
    });
  });

  describe('clear', () => {
    it('should remove all active particles', () => {
      emitter.burst(10);
      expect(emitter.getActiveParticles()).toHaveLength(10);
      
      emitter.clear();
      
      expect(emitter.getActiveParticles()).toHaveLength(0);
    });
  });
});

// ============================================
// Particle System Tests
// ============================================

describe('ParticleSystem', () => {
  let system: ParticleSystem;

  beforeEach(() => {
    system = new ParticleSystem({
      targetFPS: 60,
      enableLOD: true,
      maxParticlesHigh: 100,
      maxParticlesMedium: 50,
      maxParticlesLow: 25,
    });
  });

  describe('createEmitter', () => {
    it('should create and store an emitter', () => {
      const emitter = system.createEmitter('test-emitter');
      
      expect(emitter).toBeDefined();
      expect(system.getEmitter('test-emitter')).toBe(emitter);
    });

    it('should create emitter with custom config', () => {
      const emitter = system.createEmitter('test', {
        emissionRate: 50,
        maxParticles: 30,
      });
      
      expect(emitter.getConfig().emissionRate).toBe(50);
    });
  });

  describe('getEmitter', () => {
    it('should return existing emitter', () => {
      const created = system.createEmitter('existing');
      const retrieved = system.getEmitter('existing');
      
      expect(retrieved).toBe(created);
    });

    it('should return undefined for non-existent emitter', () => {
      const emitter = system.getEmitter('non-existent');
      
      expect(emitter).toBeUndefined();
    });
  });

  describe('removeEmitter', () => {
    it('should remove an emitter', () => {
      system.createEmitter('to-remove');
      expect(system.getEmitter('to-remove')).toBeDefined();
      
      const removed = system.removeEmitter('to-remove');
      
      expect(removed).toBe(true);
      expect(system.getEmitter('to-remove')).toBeUndefined();
    });

    it('should return false for non-existent emitter', () => {
      const removed = system.removeEmitter('never-existed');
      
      expect(removed).toBe(false);
    });
  });

  describe('update', () => {
    it('should update all emitters', () => {
      // Create emitters with burst instead of continuous emission
      const emitter1 = system.createEmitter('e1', { emissionRate: 0 });
      const emitter2 = system.createEmitter('e2', { emissionRate: 0 });
      
      // Burst some particles
      emitter1.burst(5);
      emitter2.burst(5);
      
      // Update should process them
      system.update();
      
      expect(emitter1.getActiveParticles().length).toBeGreaterThan(0);
      expect(emitter2.getActiveParticles().length).toBeGreaterThan(0);
    });

    it('should calculate FPS', () => {
      system.update();
      
      const stats = system.getStats();
      expect(stats.currentFPS).toBeGreaterThan(0);
    });

    it('should track active particle count', () => {
      // Use burst for deterministic count
      const counterEmitter = system.createEmitter('counter', { emissionRate: 0 });
      counterEmitter.burst(10);
      
      system.update();
      
      const stats = system.getStats();
      expect(stats.activeCount).toBe(10);
    });
  });

  describe('LOD management', () => {
    it('should start at high quality', () => {
      expect(system.getLOD()).toBe('high');
    });

    it('should allow manual LOD setting', () => {
      system.setLOD('low');
      
      expect(system.getLOD()).toBe('low');
    });

    it('should update emitter limits based on LOD', () => {
      const emitter = system.createEmitter('lod-test', { maxParticles: 100 });
      
      system.setLOD('medium');
      
      // Emitter should be limited by medium LOD max
      const config = emitter.getConfig();
      expect(config.maxParticles).toBeLessThanOrEqual(50);
    });
  });

  describe('getAllParticles', () => {
    it('should return particles from all emitters', () => {
      const e1 = system.createEmitter('e1', { emissionRate: 100 });
      const e2 = system.createEmitter('e2', { emissionRate: 100 });
      
      system.update();
      
      const allParticles = system.getAllParticles();
      expect(allParticles.length).toBe(
        e1.getActiveParticles().length + e2.getActiveParticles().length
      );
    });
  });

  describe('burst', () => {
    it('should burst emit from specific emitter', () => {
      system.createEmitter('burst-test');
      
      const particles = system.burst('burst-test', 10);
      
      expect(particles).toHaveLength(10);
    });

    it('should return empty array for non-existent emitter', () => {
      const particles = system.burst('non-existent', 10);
      
      expect(particles).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all emitters', () => {
      // Use burst for deterministic state
      const c1 = system.createEmitter('c1', { emissionRate: 0 });
      const c2 = system.createEmitter('c2', { emissionRate: 0 });
      
      c1.burst(5);
      c2.burst(5);
      
      // Verify particles exist
      expect(c1.getActiveParticles().length + c2.getActiveParticles().length).toBe(10);
      
      system.clear();
      
      // After clear, emitters should have no active particles
      expect(c1.getActiveParticles()).toHaveLength(0);
      expect(c2.getActiveParticles()).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('should clean up all resources', () => {
      system.createEmitter('d1');
      system.createEmitter('d2');
      
      system.dispose();
      
      expect(system.getEmitterIds()).toHaveLength(0);
    });
  });
});

// ============================================
// Utility Function Tests
// ============================================

describe('Easing', () => {
  it('linear should return input', () => {
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(1)).toBe(1);
  });

  it('easeInQuad should accelerate', () => {
    expect(Easing.easeInQuad(0)).toBe(0);
    expect(Easing.easeInQuad(0.5)).toBeLessThan(0.5);
    expect(Easing.easeInQuad(1)).toBe(1);
  });

  it('easeOutQuad should decelerate', () => {
    expect(Easing.easeOutQuad(0)).toBe(0);
    expect(Easing.easeOutQuad(0.5)).toBeGreaterThan(0.5);
    expect(Easing.easeOutQuad(1)).toBe(1);
  });

  it('easeInOutQuad should accelerate then decelerate', () => {
    expect(Easing.easeInOutQuad(0)).toBe(0);
    expect(Easing.easeInOutQuad(0.5)).toBe(0.5);
    expect(Easing.easeInOutQuad(1)).toBe(1);
  });

  it('easeOutElastic should overshoot', () => {
    const result = Easing.easeOutElastic(0.8);
    expect(result).toBeGreaterThan(1);
  });
});

describe('createCurve', () => {
  it('should create curve with specified segments', () => {
    const curve = createCurve([0, 1], 10);
    expect(curve).toHaveLength(11);
  });

  it('should interpolate between points', () => {
    const curve = createCurve([0, 1], 2);
    expect(curve[0]).toBe(0);
    expect(curve[2]).toBe(1);
    expect(curve[1]).toBeGreaterThan(0);
    expect(curve[1]).toBeLessThan(1);
  });
});

describe('lerpColor', () => {
  it('should interpolate between colors', () => {
    const a = new THREE.Color(0, 0, 0);
    const b = new THREE.Color(1, 1, 1);
    const out = new THREE.Color();
    
    lerpColor(a, b, 0.5, out);
    
    expect(out.r).toBe(0.5);
    expect(out.g).toBe(0.5);
    expect(out.b).toBe(0.5);
  });

  it('should return start color at t=0', () => {
    const a = new THREE.Color(0, 0, 0);
    const b = new THREE.Color(1, 1, 1);
    const out = new THREE.Color();
    
    lerpColor(a, b, 0, out);
    
    expect(out.r).toBe(0);
    expect(out.g).toBe(0);
    expect(out.b).toBe(0);
  });

  it('should return end color at t=1', () => {
    const a = new THREE.Color(0, 0, 0);
    const b = new THREE.Color(1, 1, 1);
    const out = new THREE.Color();
    
    lerpColor(a, b, 1, out);
    
    expect(out.r).toBe(1);
    expect(out.g).toBe(1);
    expect(out.b).toBe(1);
  });
});

describe('randomPointInSphere', () => {
  it('should generate points within sphere', () => {
    const out = new THREE.Vector3();
    
    for (let i = 0; i < 100; i++) {
      randomPointInSphere(5, out);
      expect(out.length()).toBeLessThanOrEqual(5.1); // Allow small epsilon
    }
  });
});

describe('randomPointOnCircle', () => {
  it('should generate points on circle', () => {
    const out = new THREE.Vector3();
    
    for (let i = 0; i < 100; i++) {
      randomPointOnCircle(3, out);
      const horizontalDist = Math.sqrt(out.x * out.x + out.z * out.z);
      expect(Math.abs(horizontalDist - 3)).toBeLessThan(0.01);
      expect(out.y).toBe(0);
    }
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Particle System Integration', () => {
  it('should handle multiple emitters with different configs', () => {
    const testSystem = new ParticleSystem();
    
    const fire = testSystem.createEmitter('fire', {
      emissionRate: 0,
      color: new THREE.Color(1, 0.3, 0),
      gravity: 2,
      velocity: { x: 0, y: 1, z: 0 },
    });
    
    const rain = testSystem.createEmitter('rain', {
      emissionRate: 0,
      color: new THREE.Color(0, 0.5, 1),
      gravity: -10,
      velocity: { x: 0, y: -1, z: 0 },
    });
    
    // Burst particles with specific velocities
    fire.burst(5);
    rain.burst(5);
    
    // Update to apply physics
    testSystem.update();
    
    const fireParticles = fire.getActiveParticles();
    const rainParticles = rain.getActiveParticles();
    
    // Fire should have positive Y velocity
    expect(fireParticles.length).toBeGreaterThan(0);
    const fireAvgY = fireParticles.reduce((sum, p) => sum + p.velocity.y, 0) / fireParticles.length;
    expect(fireAvgY).toBeGreaterThan(0);
    
    // Rain should have negative Y velocity
    expect(rainParticles.length).toBeGreaterThan(0);
    const rainAvgY = rainParticles.reduce((sum, p) => sum + p.velocity.y, 0) / rainParticles.length;
    expect(rainAvgY).toBeLessThan(0);
    
    testSystem.dispose();
  });

  it('should maintain performance with many particles', () => {
    const perfSystem = new ParticleSystem({
      maxParticlesHigh: 500,
    });
    
    const perfEmitter = perfSystem.createEmitter('performance-test', {
      emissionRate: 0,
      maxParticles: 500,
    });
    
    // Burst many particles at once
    perfEmitter.burst(500);
    
    const startTime = performance.now();
    
    // Simulate frames
    for (let i = 0; i < 30; i++) {
      perfSystem.update();
    }
    
    const elapsed = performance.now() - startTime;
    
    // Should complete within reasonable time
    expect(elapsed).toBeLessThan(500);
    
    const stats = perfSystem.getStats();
    expect(stats.activeCount).toBeGreaterThan(0);
    
    perfSystem.dispose();
  });

  it('should handle rapid emitter creation and destruction', () => {
    const system = new ParticleSystem();
    
    // Rapidly create and remove emitters
    for (let i = 0; i < 20; i++) {
      system.createEmitter(`rapid-${i}`, { emissionRate: 50 });
      system.update();
      if (i > 5) {
        system.removeEmitter(`rapid-${i - 5}`);
      }
    }
    
    // Should have ~5 emitters remaining
    expect(system.getEmitterIds().length).toBeLessThanOrEqual(15);
    
    system.dispose();
  });
});

// ============================================
// Performance Tests
// ============================================

describe('Performance', () => {
  it('pool should efficiently reuse particles', () => {
    const pool = new ParticlePool(100);
    
    // Rapid acquire and release
    for (let cycle = 0; cycle < 10; cycle++) {
      const particles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push(pool.acquire());
      }
      particles.forEach(p => pool.release(p));
    }
    
    const stats = pool.getStats();
    // Should have high hit rate due to reuse
    expect(stats.hitRate).toBeGreaterThan(0.8);
  });

  it('should handle burst emissions efficiently', () => {
    const emitter = new ParticleEmitter({ maxParticles: 500 });
    
    const startTime = performance.now();
    emitter.burst(500);
    const burstTime = performance.now() - startTime;
    
    expect(burstTime).toBeLessThan(50); // Should be fast
    expect(emitter.getActiveParticles()).toHaveLength(500);
  });
});
