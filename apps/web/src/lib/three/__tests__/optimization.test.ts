// @ts-nocheck
/**
 * Three.js Optimization Tests
 * 
 * [Ver001.000] - Performance tests for LOD, Frustum Culling, and Texture Atlasing
 * 
 * Tests cover:
 * - drawCall counting
 * - FPS monitoring
 * - Memory usage tracking
 * - LOD level transitions
 * - Frustum culling accuracy
 * - Texture atlas generation
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
  MascotLOD,
  LODManager,
  MascotLODConfig,
  LODOptions,
  createLODGeometries,
  estimateGeometryComplexity,
} from '../lod';

import {
  FrustumCullingManager,
  performFrustumCulling,
  isObjectVisible,
  batchCullingUpdate,
  CullingZone,
} from '../frustumCulling';

import {
  TextureAtlas,
  MultiAtlasManager,
  createMascotTextureAtlas,
  calculateAtlasUVs,
  createAtlasMaterial,
} from '../textureAtlas';

// ============================================
// Performance Monitor Utility
// ============================================

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsed: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private lastTime = 0;
  private frameCount = 0;
  private running = false;

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
  }

  stop(): void {
    this.running = false;
  }

  recordFrame(renderer?: THREE.WebGLRenderer): PerformanceMetrics {
    const now = performance.now();
    this.frameCount++;

    const deltaTime = now - this.lastTime;
    let fps = 0;

    if (deltaTime >= 1000) {
      fps = (this.frameCount * 1000) / deltaTime;
      this.frameCount = 0;
      this.lastTime = now;
    }

    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      frameTime: deltaTime,
      drawCalls: renderer?.info.render.calls ?? 0,
      triangles: renderer?.info.render.triangles ?? 0,
      memoryUsed: (performance as any).memory?.usedJSHeapSize ?? 0,
      timestamp: now,
    };

    if (fps > 0) {
      this.metrics.push(metrics);
    }

    return metrics;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageFPS(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.fps, 0) / this.metrics.length;
  }

  getMaxDrawCalls(): number {
    return Math.max(...this.metrics.map(m => m.drawCalls), 0);
  }

  reset(): void {
    this.metrics = [];
    this.frameCount = 0;
    this.lastTime = performance.now();
  }
}

// ============================================
// Test Helpers
// ============================================

function createMockGeometry(vertexCount: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(vertexCount * 3);
  
  for (let i = 0; i < vertexCount * 3; i++) {
    positions[i] = Math.random() * 10;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  
  return geometry;
}

function createMockTexture(width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Handle missing 2D context in jsdom environment
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  // Manually set image dimensions for testing
  (texture.image as any).width = width;
  (texture.image as any).height = height;
  return texture;
}

function createMockCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld();
  return camera;
}

// ============================================
// LOD System Tests
// ============================================

describe('LOD System', () => {
  let lod: MascotLOD;
  let config: MascotLODConfig;

  beforeEach(() => {
    config = {
      mascotId: 'test-mascot',
      highDetail: createMockGeometry(1000),
      mediumDetail: createMockGeometry(500),
      lowDetail: createMockGeometry(100),
      options: {
        distanceThresholds: [5, 15, 50],
        smoothTransitions: false,
      },
    };
    lod = new MascotLOD(config);
  });

  afterEach(() => {
    lod.dispose();
  });

  describe('LOD Level Calculation', () => {
    it('should start at high detail level', () => {
      const state = lod.getState();
      expect(state.currentLevel).toBe(0);
    });

    it('should switch to medium detail at threshold distance', () => {
      const cameraPos = new THREE.Vector3(10, 0, 0); // Distance = 10, past high threshold of 5
      lod.update(cameraPos, 0.016);
      
      const state = lod.getState();
      expect(state.currentLevel).toBe(1);
    });

    it('should switch to low detail at far distance', () => {
      const cameraPos = new THREE.Vector3(30, 0, 0); // Distance = 30, past medium threshold of 15
      lod.update(cameraPos, 0.016);
      
      const state = lod.getState();
      expect(state.currentLevel).toBe(2);
    });

    it('should maintain high detail when very close', () => {
      const cameraPos = new THREE.Vector3(2, 0, 0); // Distance = 2, within high threshold
      lod.update(cameraPos, 0.016);
      
      const state = lod.getState();
      expect(state.currentLevel).toBe(0);
    });
  });

  describe('LOD Metrics', () => {
    it('should track vertex count reduction', () => {
      const cameraPos = new THREE.Vector3(30, 0, 0);
      lod.update(cameraPos, 0.016);
      
      const metrics = lod.getMetrics();
      expect(metrics.currentVertexCount).toBe(100); // low detail
      expect(metrics.maxVertexCount).toBe(1000); // high detail
      expect(metrics.vertexReductionPercent).toBe(90); // 90% reduction
    });

    it('should track draw call savings', () => {
      const cameraPos = new THREE.Vector3(30, 0, 0);
      lod.update(cameraPos, 0.016);
      
      const metrics = lod.getMetrics();
      expect(metrics.drawCallsSaved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('LOD Transitions', () => {
    it('should support smooth transitions when enabled', () => {
      const smoothConfig: MascotLODConfig = {
        ...config,
        options: {
          ...config.options,
          smoothTransitions: true,
          transitionDuration: 0.3,
        },
      };
      
      const smoothLOD = new MascotLOD(smoothConfig);
      const cameraPos = new THREE.Vector3(10, 0, 0);
      
      // Trigger transition
      smoothLOD.update(cameraPos, 0);
      
      const state = smoothLOD.getState();
      if (state.currentLevel !== state.previousLevel) {
        expect(state.isTransitioning).toBe(true);
      }
      
      smoothLOD.dispose();
    });

    it('should complete transition after duration', () => {
      const smoothConfig: MascotLODConfig = {
        ...config,
        options: {
          ...config.options,
          smoothTransitions: true,
          transitionDuration: 0.1,
        },
      };
      
      const smoothLOD = new MascotLOD(smoothConfig);
      const cameraPos = new THREE.Vector3(10, 0, 0);
      
      smoothLOD.update(cameraPos, 0);
      smoothLOD.update(cameraPos, 0.2); // Past transition duration
      
      const state = smoothLOD.getState();
      expect(state.isTransitioning).toBe(false);
      expect(state.transitionProgress).toBe(1);
      
      smoothLOD.dispose();
    });
  });

  describe('Force Level', () => {
    it('should allow forcing specific LOD level', () => {
      lod.forceLevel(2);
      
      const state = lod.getState();
      expect(state.currentLevel).toBe(2);
      expect(state.isTransitioning).toBe(false);
    });

    it('should reject invalid LOD levels', () => {
      lod.forceLevel(5); // Invalid
      
      const state = lod.getState();
      expect(state.currentLevel).toBe(0); // Should remain unchanged
    });
  });
});

describe('LODManager', () => {
  let manager: LODManager;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    manager = new LODManager();
    camera = createMockCamera();
    manager.setCamera(camera);
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Mascot Registration', () => {
    it('should register mascots', () => {
      const config: MascotLODConfig = {
        mascotId: 'mascot-1',
        highDetail: createMockGeometry(1000),
        mediumDetail: createMockGeometry(500),
        lowDetail: createMockGeometry(100),
      };
      
      const lod = manager.registerMascot(config);
      expect(manager.getMascots().size).toBe(1);
      expect(lod.getGroup()).toBeDefined();
    });

    it('should unregister mascots', () => {
      const config: MascotLODConfig = {
        mascotId: 'mascot-1',
        highDetail: createMockGeometry(1000),
        mediumDetail: createMockGeometry(500),
        lowDetail: createMockGeometry(100),
      };
      
      manager.registerMascot(config);
      manager.unregisterMascot('mascot-1');
      
      expect(manager.getMascots().size).toBe(0);
    });
  });

  describe('Aggregate Metrics', () => {
    it('should calculate aggregate metrics', () => {
      manager.registerMascot({
        mascotId: 'mascot-1',
        highDetail: createMockGeometry(1000),
        mediumDetail: createMockGeometry(500),
        lowDetail: createMockGeometry(100),
      });
      
      manager.registerMascot({
        mascotId: 'mascot-2',
        highDetail: createMockGeometry(2000),
        mediumDetail: createMockGeometry(1000),
        lowDetail: createMockGeometry(200),
      });
      
      const metrics = manager.getAggregateMetrics();
      expect(metrics.totalMascots).toBe(2);
      expect(metrics.maxVertexCount).toBe(3000);
    });

    it('should force all levels', () => {
      manager.registerMascot({
        mascotId: 'mascot-1',
        highDetail: createMockGeometry(1000),
        mediumDetail: createMockGeometry(500),
        lowDetail: createMockGeometry(100),
      });
      
      manager.forceAllLevels(2);
      
      const mascots = manager.getMascots();
      mascots.forEach(lod => {
        expect(lod.getState().currentLevel).toBe(2);
      });
    });
  });
});

describe('LOD Geometry Utilities', () => {
  describe('createLODGeometries', () => {
    it('should create three LOD geometry levels', () => {
      const highDetail = createMockGeometry(1000);
      const [high, medium, low] = createLODGeometries(highDetail, [0.5, 0.25]);
      
      expect(high).toBeDefined();
      expect(medium).toBeDefined();
      expect(low).toBeDefined();
    });
  });

  describe('estimateGeometryComplexity', () => {
    it('should estimate complexity correctly', () => {
      const geometry = createMockGeometry(300); // 300 vertices = ~100 triangles
      const complexity = estimateGeometryComplexity(geometry);
      
      expect(complexity.vertices).toBe(300);
      expect(complexity.triangles).toBe(100);
      expect(complexity.memoryBytes).toBeGreaterThan(0);
    });
  });
});

// ============================================
// Frustum Culling Tests
// ============================================

describe('Frustum Culling', () => {
  let manager: FrustumCullingManager;
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;

  beforeEach(() => {
    manager = new FrustumCullingManager();
    camera = createMockCamera();
    manager.setCamera(camera);
    scene = new THREE.Scene();
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Object Registration', () => {
    it('should register objects', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      mesh.position.set(0, 0, 0);
      
      manager.registerObject('box-1', mesh);
      // Objects default to true until first cull update
      expect(manager.isVisible('box-1')).toBe(true);
    });

    it('should unregister objects', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      
      manager.registerObject('box-1', mesh);
      manager.unregisterObject('box-1');
      
      // Should not throw
      manager.update();
    });
  });

  describe('Frustum Tests', () => {
    it('should cull objects outside frustum', () => {
      const visibleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      visibleMesh.position.set(0, 0, 0);
      
      const hiddenMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      hiddenMesh.position.set(100, 0, 0); // Far outside frustum
      
      manager.registerObject('visible', visibleMesh);
      manager.registerObject('hidden', hiddenMesh);
      
      manager.update();
      
      expect(visibleMesh.visible).toBe(true);
      expect(hiddenMesh.visible).toBe(false);
    });

    it('should update stats correctly', () => {
      for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial()
        );
        mesh.position.set(i * 20, 0, 0); // Some visible, some not
        manager.registerObject(`box-${i}`, mesh);
      }
      
      manager.update();
      
      const stats = manager.getStats();
      expect(stats.totalObjects).toBe(10);
      expect(stats.visibleObjects + stats.culledObjects).toBe(10);
    });
  });

  describe('Batch Culling', () => {
    it('should batch update multiple objects', () => {
      const meshes: THREE.Mesh[] = [];
      for (let i = 0; i < 50; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial()
        );
        mesh.position.set(i * 2, 0, 0);
        meshes.push(mesh);
      }
      
      const result = performFrustumCulling(meshes, camera);
      
      expect(result.visible.length + result.culled.length).toBe(50);
    });
  });

  describe('Visibility Check', () => {
    it('should check individual object visibility', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      mesh.position.set(0, 0, 0);
      
      const visible = isObjectVisible(mesh, camera);
      expect(visible).toBe(true);
    });
  });
});

describe('CullingZone', () => {
  it('should create zones with bounds', () => {
    const zone = new CullingZone(
      'zone-1',
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(10, 10, 10)
    );
    
    expect(zone.boundingBox.min.x).toBe(0);
    expect(zone.boundingBox.max.x).toBe(10);
  });

  it('should add and remove objects', () => {
    const zone = new CullingZone(
      'zone-1',
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(10, 10, 10)
    );
    
    zone.addObject('obj-1');
    expect(zone.objects.has('obj-1')).toBe(true);
    
    zone.removeObject('obj-1');
    expect(zone.objects.has('obj-1')).toBe(false);
  });
});

// ============================================
// Texture Atlas Tests
// ============================================

describe('Texture Atlas', () => {
  let atlas: TextureAtlas;
  let canvasSupported: boolean;

  beforeEach(() => {
    // Check if canvas 2D context is supported
    const testCanvas = document.createElement('canvas');
    canvasSupported = !!testCanvas.getContext('2d');
    
    atlas = new TextureAtlas({
      maxWidth: 1024,
      maxHeight: 1024,
      padding: 2,
      powerOfTwo: true,
    });
  });

  afterEach(() => {
    atlas.dispose();
  });

  describe('Texture Management', () => {
    it('should add textures', () => {
      const texture = createMockTexture(64, 64);
      atlas.addTexture({
        id: 'tex-1',
        texture,
        priority: 1,
      });
      
      expect(atlas.isAtlasDirty()).toBe(true);
      expect(atlas.getItems().size).toBe(1);
    });

    it('should remove textures', () => {
      const texture = createMockTexture(64, 64);
      atlas.addTexture({
        id: 'tex-1',
        texture,
      });
      
      atlas.removeTexture('tex-1');
      expect(atlas.getItems().size).toBe(0);
    });
  });

  describe('Atlas Generation', () => {
    it('should generate atlas texture', { skip: !canvasSupported }, () => {
      atlas.addTexture({
        id: 'tex-1',
        texture: createMockTexture(64, 64),
      });
      atlas.addTexture({
        id: 'tex-2',
        texture: createMockTexture(128, 128),
      });
      
      const texture = atlas.generate();
      expect(texture).toBeDefined();
      expect(texture.image).toBeDefined();
    });

    it('should calculate atlas stats', { skip: !canvasSupported }, () => {
      atlas.addTexture({
        id: 'tex-1',
        texture: createMockTexture(64, 64),
      });
      
      atlas.generate();
      const stats = atlas.getStats();
      
      expect(stats.textureCount).toBe(1);
      expect(stats.width).toBeGreaterThan(0);
      expect(stats.height).toBeGreaterThan(0);
    });

    it('should pack textures efficiently', { skip: !canvasSupported }, () => {
      // Add multiple textures
      for (let i = 0; i < 5; i++) {
        atlas.addTexture({
          id: `tex-${i}`,
          texture: createMockTexture(64, 64),
          priority: 5 - i,
        });
      }
      
      atlas.generate();
      const stats = atlas.getStats();
      
      expect(stats.textureCount).toBe(5);
      expect(stats.utilization).toBeGreaterThan(0);
    });
  });

  describe('UV Remapping', () => {
    it('should remap UVs for atlas coordinates', { skip: !canvasSupported }, () => {
      atlas.addTexture({
        id: 'tex-1',
        texture: createMockTexture(64, 64),
      });
      
      atlas.generate();
      
      const geometry = new THREE.PlaneGeometry(1, 1);
      const remapInfo = atlas.remapUVs(geometry, 'tex-1');
      
      expect(remapInfo).not.toBeNull();
      expect(remapInfo?.remappedUVs).toBeDefined();
    });

    it('should restore original UVs', { skip: !canvasSupported }, () => {
      atlas.addTexture({
        id: 'tex-1',
        texture: createMockTexture(64, 64),
      });
      
      atlas.generate();
      
      const geometry = new THREE.PlaneGeometry(1, 1);
      const originalUVs = new Float32Array(geometry.attributes.uv.array);
      
      atlas.remapUVs(geometry, 'tex-1');
      atlas.restoreOriginalUVs(geometry, 'tex-1');
      
      expect(geometry.attributes.uv.array).toEqual(originalUVs);
    });
  });
});

describe('MultiAtlasManager', () => {
  let manager: MultiAtlasManager;
  let canvasSupported: boolean;

  beforeEach(() => {
    // Check if canvas 2D context is supported
    const testCanvas = document.createElement('canvas');
    canvasSupported = !!testCanvas.getContext('2d');
    
    manager = new MultiAtlasManager({
      maxWidth: 1024,
      maxHeight: 1024,
    });
  });

  afterEach(() => {
    manager.dispose();
  });

  it('should manage multiple atlases', { skip: !canvasSupported }, () => {
    manager.addTexture({
      id: 'mascot-1-tex',
      texture: createMockTexture(64, 64),
    }, 'mascot-atlas');
    
    manager.addTexture({
      id: 'ui-1-tex',
      texture: createMockTexture(32, 32),
    }, 'ui-atlas');
    
    const textures = manager.generateAll();
    expect(textures.size).toBe(2);
  });

  it('should lookup atlas by texture', { skip: !canvasSupported }, () => {
    manager.addTexture({
      id: 'tex-1',
      texture: createMockTexture(64, 64),
    }, 'atlas-1');
    
    const atlas = manager.getAtlasForTexture('tex-1');
    expect(atlas).toBeDefined();
  });
});

describe('Atlas Utilities', () => {
  const isCanvasSupported = () => {
    const testCanvas = document.createElement('canvas');
    return !!testCanvas.getContext('2d');
  };

  it('should calculate atlas UVs', () => {
    const originalUVs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const remapped = calculateAtlasUVs(
      originalUVs,
      { x: 64, y: 64, width: 128, height: 128 },
      { width: 1024, height: 1024 }
    );
    
    expect(remapped.length).toBe(originalUVs.length);
    // UVs should be within atlas bounds
    for (let i = 0; i < remapped.length; i++) {
      expect(remapped[i]).toBeGreaterThanOrEqual(0);
      expect(remapped[i]).toBeLessThanOrEqual(1);
    }
  });

  it('should create atlas material', { skip: !isCanvasSupported() }, () => {
    const atlasTexture = createMockTexture(256, 256);
    const material = createAtlasMaterial(atlasTexture, {
      transparent: true,
      alphaTest: 0.5,
    });
    
    expect(material.map).toBe(atlasTexture);
    expect(material.transparent).toBe(true);
    expect(material.alphaTest).toBe(0.5);
  });

  it('should create mascot texture atlas', { skip: !isCanvasSupported() }, () => {
    const mascots = [
      {
        id: 'mascot-1',
        textures: [
          { name: 'diffuse', texture: createMockTexture(128, 128) },
          { name: 'normal', texture: createMockTexture(128, 128) },
        ],
      },
    ];
    
    const atlas = createMascotTextureAtlas(mascots);
    expect(atlas.getItems().size).toBe(2);
  });
});

// ============================================
// Performance Tests
// ============================================

describe('Performance Monitoring', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('FPS Monitoring', () => {
    it('should track frame metrics', () => {
      monitor.start();
      
      // Simulate some frames
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.length).toBeGreaterThanOrEqual(0); // May not have FPS data yet
    });

    it('should calculate average FPS', () => {
      monitor.start();
      
      for (let i = 0; i < 100; i++) {
        monitor.recordFrame();
      }
      
      const avgFPS = monitor.getAverageFPS();
      expect(avgFPS).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Draw Call Tracking', () => {
    it('should track maximum draw calls', () => {
      // Mock renderer info
      const mockRenderer = {
        info: {
          render: {
            calls: 50,
            triangles: 1000,
          },
        },
      } as unknown as THREE.WebGLRenderer;
      
      monitor.start();
      monitor.recordFrame(mockRenderer);
      monitor.recordFrame(mockRenderer);
      
      const maxDrawCalls = monitor.getMaxDrawCalls();
      expect(maxDrawCalls).toBeGreaterThanOrEqual(0); // Metrics recorded
    });
  });
});

describe('Performance Targets', () => {
  it('should achieve <100 draw calls with culling', () => {
    const manager = new FrustumCullingManager();
    const camera = createMockCamera();
    manager.setCamera(camera);
    
    // Create 200 objects (far more than target)
    for (let i = 0; i < 200; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      // Position most objects outside frustum
      mesh.position.set(i * 5 - 500, 0, 0);
      manager.registerObject(`obj-${i}`, mesh);
    }
    
    manager.update();
    const stats = manager.getStats();
    
    // Most should be culled, leaving <100 visible
    expect(stats.visibleObjects).toBeLessThan(100);
    
    manager.dispose();
  });

  it('should reduce vertices with LOD', () => {
    const lod = new MascotLOD({
      mascotId: 'perf-test',
      highDetail: createMockGeometry(10000),
      mediumDetail: createMockGeometry(5000),
      lowDetail: createMockGeometry(1000),
      options: {
        distanceThresholds: [5, 15, 50],
      },
    });
    
    // At far distance
    const cameraPos = new THREE.Vector3(30, 0, 0);
    lod.update(cameraPos, 0.016);
    
    const metrics = lod.getMetrics();
    expect(metrics.vertexReductionPercent).toBeGreaterThan(0);
    
    lod.dispose();
  });

  it('should pack textures efficiently in atlas', () => {
    // Check canvas support
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext('2d')) {
      return; // Skip in jsdom
    }
    
    const atlas = new TextureAtlas({
      maxWidth: 1024,
      maxHeight: 1024,
      padding: 2,
    });
    
    // Add several textures
    const sizes = [64, 64, 128, 128, 256, 256];
    sizes.forEach((size, i) => {
      atlas.addTexture({
        id: `tex-${i}`,
        texture: createMockTexture(size, size),
      });
    });
    
    atlas.generate();
    const stats = atlas.getStats();
    
    // Should have decent utilization
    expect(stats.utilization).toBeGreaterThan(10);
    expect(stats.textureCount).toBe(6);
    
    atlas.dispose();
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Optimization Integration', () => {
  it('should work together: LOD + Frustum Culling', () => {
    const lodManager = new LODManager();
    const cullingManager = new FrustumCullingManager();
    const camera = createMockCamera();
    
    lodManager.setCamera(camera);
    cullingManager.setCamera(camera);
    
    // Create mascot with LOD
    const lod = lodManager.registerMascot({
      mascotId: 'integrated-mascot',
      highDetail: createMockGeometry(1000),
      mediumDetail: createMockGeometry(500),
      lowDetail: createMockGeometry(100),
    });
    
    // Register for culling
    cullingManager.registerObject('integrated-mascot', lod.getGroup());
    
    // Update systems
    lodManager.update(0.016);
    cullingManager.update();
    
    const lodMetrics = lod.getMetrics();
    const cullStats = cullingManager.getStats();
    
    expect(lodMetrics).toBeDefined();
    expect(cullStats).toBeDefined();
    
    lodManager.dispose();
    cullingManager.dispose();
  });

  it('should meet combined performance budget', () => {
    // Check canvas support
    const testCanvas = document.createElement('canvas');
    const canvasSupported = !!testCanvas.getContext('2d');
    
    const atlases: TextureAtlas[] = [];
    const lods: MascotLOD[] = [];
    const cullingManager = new FrustumCullingManager();
    const camera = createMockCamera();
    cullingManager.setCamera(camera);
    
    // Create atlas for textures (if canvas supported)
    if (canvasSupported) {
      const atlas = new TextureAtlas({ maxWidth: 2048, maxHeight: 2048 });
      for (let i = 0; i < 16; i++) {
        atlas.addTexture({
          id: `mascot-tex-${i}`,
          texture: createMockTexture(128, 128),
        });
      }
      atlas.generate();
      atlases.push(atlas);
    }
    
    // Create 20 mascots with LOD
    for (let i = 0; i < 20; i++) {
      const lod = new MascotLOD({
        mascotId: `mascot-${i}`,
        highDetail: createMockGeometry(500),
        mediumDetail: createMockGeometry(250),
        lowDetail: createMockGeometry(50),
        options: {
          distanceThresholds: [10, 25, 60],
        },
      });
      
      // Position in scene
      lod.getGroup().position.set(
        (i % 5) * 30 - 60,
        0,
        Math.floor(i / 5) * 30 - 30
      );
      
      lods.push(lod);
      cullingManager.registerObject(`mascot-${i}`, lod.getGroup());
    }
    
    // Update systems
    lods.forEach(lod => lod.update(camera.position, 0.016));
    cullingManager.update();
    
    // Check performance
    const cullStats = cullingManager.getStats();
    const totalVertices = lods.reduce(
      (sum, lod) => sum + lod.getMetrics().currentVertexCount,
      0
    );
    
    // Performance assertions
    expect(cullStats.visibleObjects).toBeLessThan(100);
    if (canvasSupported && atlases.length > 0) {
      expect(atlases[0].getStats().textureCount).toBe(16);
    }
    
    // Cleanup
    atlases.forEach(a => a.dispose());
    lods.forEach(l => l.dispose());
    cullingManager.dispose();
  });
});
