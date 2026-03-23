/**
 * Memory Leak Tests for Optimization System
 * 
 * [Ver001.000] - CRIT-10 Resolution: Memory leak detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  TextureStreamManager,
  InstanceRenderer,
  MapOptimizationManager,
} from '../optimization';

describe('Memory Leak Prevention', () => {
  describe('InstanceRenderer Matrices Array (CRIT-10)', () => {
    it('should resize matrices array when instance count decreases', () => {
      const scene = new THREE.Scene();
      const renderer = new InstanceRenderer(scene, 100);
      
      renderer.registerGeometry(
        'resize-test',
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      
      // Add 10 instances
      for (let i = 0; i < 10; i++) {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(i, 0, 0);
        renderer.addInstance('resize-test', matrix);
      }
      
      renderer.update();
      
      // Check initial matrices size
      const batch = (renderer as any).batches.get('resize-test');
      const initialSize = batch.matrices.length;
      expect(initialSize).toBe(10 * 16); // 10 instances * 16 floats per matrix
      
      // Remove 5 instances
      for (let i = 0; i < 5; i++) {
        renderer.removeInstance('resize-test', 0);
      }
      
      renderer.update();
      
      // Matrices array should be resized
      const finalSize = batch.matrices.length;
      expect(finalSize).toBe(5 * 16); // 5 instances remaining
    });

    it('should handle count going to zero', () => {
      const scene = new THREE.Scene();
      const renderer = new InstanceRenderer(scene, 100);
      
      renderer.registerGeometry(
        'empty-test',
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      
      // Add instances
      for (let i = 0; i < 5; i++) {
        renderer.addInstance('empty-test', new THREE.Matrix4());
      }
      
      renderer.update();
      
      // Remove all
      for (let i = 0; i < 5; i++) {
        renderer.removeInstance('empty-test', 0);
      }
      
      renderer.update();
      
      const batch = (renderer as any).batches.get('empty-test');
      expect(batch.count).toBe(0);
      expect(batch.matrices.length).toBe(0);
    });

    it('should handle rapid add/remove cycles', () => {
      const scene = new THREE.Scene();
      const renderer = new InstanceRenderer(scene, 100);
      
      renderer.registerGeometry(
        'cycle-test',
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      
      // Rapid cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Add
        for (let i = 0; i < 20; i++) {
          renderer.addInstance('cycle-test', new THREE.Matrix4());
        }
        renderer.update();
        
        // Remove
        for (let i = 0; i < 20; i++) {
          renderer.removeInstance('cycle-test', 0);
        }
        renderer.update();
      }
      
      const batch = (renderer as any).batches.get('cycle-test');
      expect(batch.count).toBe(0);
      expect(batch.matrices.length).toBeLessThanOrEqual(100 * 16);
    });

    it('should not leak memory with growing matrices', () => {
      const scene = new THREE.Scene();
      const renderer = new InstanceRenderer(scene, 50);
      
      renderer.registerGeometry(
        'growth-test',
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      
      const memorySnapshots: number[] = [];
      
      // Simulate many updates
      for (let iteration = 0; iteration < 100; iteration++) {
        // Vary instance count
        const targetCount = iteration % 50;
        const batch = (renderer as any).batches.get('growth-test');
        
        // Adjust to target
        while (batch.count < targetCount) {
          renderer.addInstance('growth-test', new THREE.Matrix4());
        }
        while (batch.count > targetCount) {
          renderer.removeInstance('growth-test', batch.count - 1);
        }
        
        renderer.update();
        memorySnapshots.push(batch.matrices.length);
      }
      
      // Memory should not grow unbounded
      const maxMemory = Math.max(...memorySnapshots);
      expect(maxMemory).toBeLessThanOrEqual(50 * 16);
    });
  });

  describe('Texture Cache Memory', () => {
    it('should properly dispose textures on eviction', () => {
      const manager = new TextureStreamManager({
        maxTextureCacheSize: 1024 * 1024, // 1MB
      });
      
      const disposeSpy = vi.fn();
      
      // Add textures with spy
      for (let i = 0; i < 20; i++) {
        const texture = new THREE.Texture();
        texture.dispose = disposeSpy;
        texture.image = { width: 256, height: 256 };
        
        (manager as any).textureCache.set(`tex-${i}`, {
          id: `tex-${i}`,
          texture,
          lastUsed: Date.now() - i * 1000,
          refCount: 0,
          size: 256 * 256 * 4,
        });
      }
      
      // Trigger eviction
      manager.evictIfNeeded();
      
      // Some textures should have been disposed
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should not leak on rapid clear/evict cycles', () => {
      const manager = new TextureStreamManager();
      
      for (let cycle = 0; cycle < 50; cycle++) {
        // Fill cache
        for (let i = 0; i < 10; i++) {
          const texture = new THREE.Texture();
          (manager as any).textureCache.set(`tex-${cycle}-${i}`, {
            id: `tex-${cycle}-${i}`,
            texture,
            lastUsed: Date.now(),
            refCount: 0,
            size: 1024,
          });
        }
        
        // Clear
        manager.clear();
        
        // Verify empty
        expect(manager.getStats().count).toBe(0);
      }
    });
  });

  describe('MapOptimizationManager Cleanup', () => {
    it('should dispose all subsystems', () => {
      const scene = new THREE.Scene();
      const manager = new MapOptimizationManager(scene);
      
      manager.initializeCullers(
        new THREE.PerspectiveCamera(),
        new THREE.WebGLRenderer()
      );
      
      const textureManager = (manager as any).textureManager;
      const instanceRenderer = (manager as any).instanceRenderer;
      
      const textureDisposeSpy = vi.spyOn(textureManager, 'dispose');
      const instanceDisposeSpy = vi.spyOn(instanceRenderer, 'dispose');
      
      manager.dispose();
      
      expect(textureDisposeSpy).toHaveBeenCalled();
      expect(instanceDisposeSpy).toHaveBeenCalled();
    });

    it('should handle dispose before initialization', () => {
      const scene = new THREE.Scene();
      const manager = new MapOptimizationManager(scene);
      
      // Dispose before initializeCullers
      expect(() => manager.dispose()).not.toThrow();
    });

    it('should handle double dispose', () => {
      const scene = new THREE.Scene();
      const manager = new MapOptimizationManager(scene);
      
      manager.initializeCullers(
        new THREE.PerspectiveCamera(),
        new THREE.WebGLRenderer()
      );
      
      manager.dispose();
      
      // Second dispose should not throw
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  describe('Reference Counting', () => {
    it('should track texture references correctly', () => {
      const manager = new TextureStreamManager();
      
      const texture = new THREE.Texture();
      (manager as any).textureCache.set('ref-test', {
        id: 'ref-test',
        texture,
        lastUsed: Date.now(),
        refCount: 0,
        size: 1024,
      });
      
      // Acquire increases ref count
      manager.acquireTexture('ref-test');
      expect((manager as any).textureCache.get('ref-test').refCount).toBe(1);
      
      // Second acquire
      manager.acquireTexture('ref-test');
      expect((manager as any).textureCache.get('ref-test').refCount).toBe(2);
      
      // Release decreases ref count
      manager.releaseTexture('ref-test');
      expect((manager as any).textureCache.get('ref-test').refCount).toBe(1);
      
      // Final release
      manager.releaseTexture('ref-test');
      expect((manager as any).textureCache.get('ref-test').refCount).toBe(0);
    });

    it('should not evict referenced textures', () => {
      const manager = new TextureStreamManager({
        maxTextureCacheSize: 2048, // Very small
      });
      
      // Add texture and acquire it
      const texture1 = new THREE.Texture();
      texture1.image = { width: 256, height: 256 };
      (manager as any).textureCache.set('protected', {
        id: 'protected',
        texture: texture1,
        lastUsed: Date.now() - 10000,
        refCount: 1, // Protected by reference
        size: 256 * 256 * 4,
      });
      
      // Add another texture
      const texture2 = new THREE.Texture();
      texture2.image = { width: 256, height: 256 };
      (manager as any).textureCache.set('unprotected', {
        id: 'unprotected',
        texture: texture2,
        lastUsed: Date.now() - 10000,
        refCount: 0,
        size: 256 * 256 * 4,
      });
      
      // Eviction should remove unprotected, keep protected
      (manager as any).evictIfNeeded();
      
      expect((manager as any).textureCache.has('protected')).toBe(true);
      expect((manager as any).textureCache.has('unprotected')).toBe(false);
    });
  });
});
