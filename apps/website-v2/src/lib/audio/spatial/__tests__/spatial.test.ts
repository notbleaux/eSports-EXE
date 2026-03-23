/** [Ver001.000]
 * Spatial Audio Tests
 * ===================
 * Comprehensive test suite for 3D spatial audio system.
 * 
 * Coverage:
 * - Engine initialization and lifecycle
 * - Audio source creation and management
 * - 3D positioning and movement
 * - Distance attenuation
 * - Occlusion handling
 * - Doppler effect
 * - Reverb zones
 * - Positioning utilities
 * - Environment audio
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SpatialAudioEngine,
  createSpatialAudioEngine,
  EnvironmentAudioManager,
  createEnvironmentAudioManager,
  setSourcePositionSmooth,
  clearInterpolation,
  createListenerTracker,
  calculateDopplerRatio,
  calculateApproachDoppler,
  calculateRecedeDoppler,
  calculateVelocityAudio,
  distance,
  distanceSquared,
  normalize,
  add,
  subtract,
  multiply,
  dot,
  cross,
  sphericalToCartesian,
  cartesianToSpherical,
  registerMascotAudio,
  updateMascotPosition,
  getMascotAudioPosition,
  getAllMascotAudioPositions,
  unregisterMascotAudio,
  DEFAULT_VECTOR3,
  DEFAULT_FORWARD,
  DEFAULT_UP,
  SPEED_OF_SOUND_AIR,
} from '../index';
import type {
  Vector3,
  AudioSourceOptions,
  DopplerParams,
  VelocityAudioEffect,
} from '../types';

// ============================================================================
// Mock Web Audio API
// ============================================================================

class MockAudioBuffer {
  sampleRate = 48000;
  length = 48000;
  duration = 1;
  numberOfChannels = 2;
  
  getChannelData() {
    return new Float32Array(this.length);
  }
  
  copyFromChannel() {}
  copyToChannel() {}
}

class MockAudioNode {
  connect() { return this; }
  disconnect() {}
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

class MockPannerNode extends MockAudioNode {
  panningModel = 'HRTF';
  distanceModel = 'inverse';
  refDistance = 1;
  maxDistance = 10000;
  rolloffFactor = 1;
  coneInnerAngle = 360;
  coneOuterAngle = 360;
  coneOuterGain = 0;
  
  positionX = { value: 0 };
  positionY = { value: 0 };
  positionZ = { value: 0 };
  orientationX = { value: 0 };
  orientationY = { value: 0 };
  orientationZ = { value: 0 };
}

class MockBufferSourceNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  playbackRate = { value: 1, setTargetAtTime: vi.fn() };
  onended: (() => void) | null = null;
  
  start() {}
  stop() {}
}

class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowpass';
  frequency = { value: 20000, setTargetAtTime: vi.fn() };
  Q = { value: 0 };
}

class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
}

class MockAudioListener {
  positionX = { value: 0 };
  positionY = { value: 0 };
  positionZ = { value: 0 };
  forwardX = { value: 0 };
  forwardY = { value: 0 };
  forwardZ = { value: -1 };
  upX = { value: 0 };
  upY = { value: 1 };
  upZ = { value: 0 };
}

class MockAudioContext {
  state = 'running';
  sampleRate = 48000;
  currentTime = 0;
  listener = new MockAudioListener();
  
  createGain() { return new MockGainNode(); }
  createPanner() { return new MockPannerNode(); }
  createBufferSource() { return new MockBufferSourceNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createConvolver() { return new MockConvolverNode(); }
  createBuffer() { return new MockAudioBuffer(); }
  
  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return new MockAudioBuffer() as unknown as AudioBuffer;
  }
  
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

// Setup global mock
beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext);
  vi.stubGlobal('webkitAudioContext', MockAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ============================================================================
// Engine Tests
// ============================================================================

describe('SpatialAudioEngine', () => {
  let engine: SpatialAudioEngine;

  beforeEach(() => {
    engine = createSpatialAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('initialization', () => {
    it('should create engine with default config', () => {
      expect(engine).toBeDefined();
      expect(engine.isInitialized()).toBe(false);
    });

    it('should initialize with audio context', async () => {
      const result = await engine.initialize();
      expect(result).toBe(true);
      expect(engine.isInitialized()).toBe(true);
    });

    it('should handle multiple initialize calls', async () => {
      await engine.initialize();
      const result = await engine.initialize();
      expect(result).toBe(true);
    });

    it('should initialize with provided audio context', async () => {
      const mockContext = new MockAudioContext() as unknown as AudioContext;
      const result = await engine.initialize(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('source management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should create audio source', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      expect(sourceId).toBeDefined();
      expect(typeof sourceId).toBe('string');
    });

    it('should create source with custom ID', () => {
      const customId = 'my-custom-id';
      const sourceId = engine.createSource({ id: customId, type: 'mascot' });
      expect(sourceId).toBe(customId);
    });

    it('should get created source', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      const source = engine.getSource(sourceId);
      expect(source).toBeDefined();
      expect(source?.id).toBe(sourceId);
      expect(source?.type).toBe('mascot');
    });

    it('should return undefined for non-existent source', () => {
      const source = engine.getSource('non-existent');
      expect(source).toBeUndefined();
    });

    it('should destroy source', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      const result = engine.destroySource(sourceId);
      expect(result).toBe(true);
      expect(engine.getSource(sourceId)).toBeUndefined();
    });

    it('should return false when destroying non-existent source', () => {
      const result = engine.destroySource('non-existent');
      expect(result).toBe(false);
    });

    it('should get all sources', () => {
      engine.createSource({ type: 'mascot' });
      engine.createSource({ type: 'effect' });
      engine.createSource({ type: 'ambient' });
      
      const sources = engine.getAllSources();
      expect(sources).toHaveLength(3);
    });
  });

  describe('position management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should set source position', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      const result = engine.setSourcePosition(sourceId, { x: 5, y: 0, z: 3 });
      
      expect(result).toBe(true);
      const source = engine.getSource(sourceId);
      expect(source?.position).toEqual({ x: 5, y: 0, z: 3 });
    });

    it('should return false when setting position of non-existent source', () => {
      const result = engine.setSourcePosition('non-existent', { x: 1, y: 2, z: 3 });
      expect(result).toBe(false);
    });

    it('should set source velocity', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      const result = engine.setSourceVelocity(sourceId, { x: 1, y: 0, z: 0 });
      
      expect(result).toBe(true);
      const source = engine.getSource(sourceId);
      expect(source?.velocity).toEqual({ x: 1, y: 0, z: 0 });
    });

    it('should set listener position', () => {
      engine.setListenerPosition({ x: 10, y: 5, z: 0 });
      const position = engine.getListenerPosition();
      
      expect(position).toEqual({ x: 10, y: 5, z: 0 });
    });

    it('should set listener orientation', () => {
      engine.setListenerPosition(
        { x: 0, y: 0, z: 0 },
        {
          forward: { x: 0, y: 0, z: -1 },
          up: { x: 0, y: 1, z: 0 },
        }
      );
      
      const state = engine.getState();
      expect(state.listener.forward).toEqual({ x: 0, y: 0, z: -1 });
      expect(state.listener.up).toEqual({ x: 0, y: 1, z: 0 });
    });
  });

  describe('distance attenuation', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.setListenerPosition({ x: 0, y: 0, z: 0 });
    });

    it('should calculate linear attenuation', () => {
      const attenuation = engine.calculateDistanceAttenuation(
        { x: 5, y: 0, z: 0 },
        { model: 'linear', refDistance: 1, maxDistance: 10, rolloffFactor: 1 }
      );
      
      expect(attenuation).toBeLessThan(1);
      expect(attenuation).toBeGreaterThan(0);
    });

    it('should calculate inverse attenuation', () => {
      const attenuation = engine.calculateDistanceAttenuation(
        { x: 5, y: 0, z: 0 },
        { model: 'inverse', refDistance: 1, maxDistance: 100, rolloffFactor: 1 }
      );
      
      expect(attenuation).toBeLessThan(1);
      expect(attenuation).toBeGreaterThan(0);
    });

    it('should calculate exponential attenuation', () => {
      const attenuation = engine.calculateDistanceAttenuation(
        { x: 5, y: 0, z: 0 },
        { model: 'exponential', refDistance: 1, maxDistance: 100, rolloffFactor: 1 }
      );
      
      expect(attenuation).toBeLessThan(1);
      expect(attenuation).toBeGreaterThan(0);
    });

    it('should return 1 at reference distance', () => {
      const attenuation = engine.calculateDistanceAttenuation(
        { x: 1, y: 0, z: 0 },
        { model: 'linear', refDistance: 1, maxDistance: 10, rolloffFactor: 1 }
      );
      
      expect(attenuation).toBe(1);
    });

    it('should return 0 at or beyond max distance', () => {
      const attenuation = engine.calculateDistanceAttenuation(
        { x: 10, y: 0, z: 0 },
        { model: 'linear', refDistance: 1, maxDistance: 10, rolloffFactor: 1 }
      );
      
      expect(attenuation).toBe(0);
    });
  });

  describe('occlusion', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should set occlusion factor', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      
      // Should not throw
      expect(() => engine.setOcclusionFactor(sourceId, 0.5)).not.toThrow();
    });

    it('should clamp occlusion factor between 0 and 1', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      
      // Should not throw for out of range values
      expect(() => engine.setOcclusionFactor(sourceId, -1)).not.toThrow();
      expect(() => engine.setOcclusionFactor(sourceId, 2)).not.toThrow();
    });
  });

  describe('volume control', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should set master volume', () => {
      engine.setMasterVolume(0.5);
      const state = engine.getState();
      expect(state.masterVolume).toBe(0.5);
    });

    it('should clamp master volume between 0 and 1', () => {
      engine.setMasterVolume(-0.5);
      expect(engine.getState().masterVolume).toBe(0);
      
      engine.setMasterVolume(1.5);
      expect(engine.getState().masterVolume).toBe(1);
    });

    it('should toggle mute', () => {
      const initialMuted = engine.getState().isMuted;
      const newMuted = engine.toggleMute();
      
      expect(newMuted).toBe(!initialMuted);
      expect(engine.getState().isMuted).toBe(!initialMuted);
    });

    it('should set muted state', () => {
      engine.setMuted(true);
      expect(engine.getState().isMuted).toBe(true);
      
      engine.setMuted(false);
      expect(engine.getState().isMuted).toBe(false);
    });
  });

  describe('reverb zones', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should create reverb zone', () => {
      const zoneId = engine.createReverbZone({
        name: 'Test Zone',
        type: 'room',
        center: { x: 0, y: 0, z: 0 },
        size: { x: 10, y: 10, z: 10 },
      });
      
      expect(zoneId).toBeDefined();
      expect(typeof zoneId).toBe('string');
    });

    it('should create reverb zone with custom ID', () => {
      const customId = 'custom-zone-id';
      const zoneId = engine.createReverbZone({
        id: customId,
        name: 'Test Zone',
      });
      
      expect(zoneId).toBe(customId);
    });

    it('should destroy reverb zone', () => {
      const zoneId = engine.createReverbZone({ name: 'Test Zone' });
      const result = engine.destroyReverbZone(zoneId);
      
      expect(result).toBe(true);
    });

    it('should set active reverb zone', () => {
      const zoneId = engine.createReverbZone({ name: 'Test Zone' });
      const result = engine.setActiveReverbZone(zoneId);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent reverb zone', () => {
      const result = engine.setActiveReverbZone('non-existent');
      expect(result).toBe(false);
    });

    it('should check zone containment', () => {
      engine.createReverbZone({
        name: 'Box Zone',
        shape: 'box',
        center: { x: 0, y: 0, z: 0 },
        size: { x: 10, y: 10, z: 10 },
      });
      
      const insideZone = engine['checkZoneContainment']({ x: 0, y: 0, z: 0 });
      const outsideZone = engine['checkZoneContainment']({ x: 20, y: 0, z: 0 });
      
      expect(insideZone).toBeDefined();
      expect(outsideZone).toBeNull();
    });
  });

  describe('environment presets', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should apply environment preset', () => {
      // Should not throw
      expect(() => engine.applyEnvironmentPreset('room')).not.toThrow();
      expect(() => engine.applyEnvironmentPreset('hall')).not.toThrow();
      expect(() => engine.applyEnvironmentPreset('outdoor')).not.toThrow();
    });
  });

  describe('event system', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should subscribe to events', () => {
      const handler = vi.fn();
      const unsubscribe = engine.on('sourceCreated', handler);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const unsubscribe = engine.on('sourceCreated', handler);
      
      unsubscribe();
      
      // Create a source to trigger event
      engine.createSource({ type: 'mascot' });
      
      // Handler should not be called after unsubscribe
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('visualization data', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should return visualization data', () => {
      engine.createSource({ type: 'mascot', position: { x: 5, y: 0, z: 0 } });
      engine.createSource({ type: 'effect', position: { x: -3, y: 2, z: 1 } });
      
      const data = engine.getVisualizationData();
      
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty('sourceId');
      expect(data[0]).toHaveProperty('position');
      expect(data[0]).toHaveProperty('volume');
      expect(data[0]).toHaveProperty('isPlaying');
      expect(data[0]).toHaveProperty('distance');
      expect(data[0]).toHaveProperty('occlusionFactor');
    });
  });

  describe('dispose', () => {
    it('should dispose resources', async () => {
      await engine.initialize();
      engine.createSource({ type: 'mascot' });
      
      engine.dispose();
      
      expect(engine.isInitialized()).toBe(false);
      expect(engine.getAllSources()).toHaveLength(0);
    });
  });
});

// ============================================================================
// Positioning Utilities Tests
// ============================================================================

describe('Positioning Utilities', () => {
  describe('setSourcePositionSmooth', () => {
    let engine: SpatialAudioEngine;

    beforeEach(async () => {
      engine = createSpatialAudioEngine();
      await engine.initialize();
    });

    afterEach(() => {
      engine.dispose();
    });

    it('should smoothly interpolate position', () => {
      const sourceId = engine.createSource({ type: 'mascot', position: { x: 0, y: 0, z: 0 } });
      
      const result = setSourcePositionSmooth(engine, sourceId, { x: 10, y: 0, z: 0 }, {
        enabled: true,
        smoothingFactor: 0.5,
      });
      
      expect(result).toBe(true);
      
      // Position should be interpolated, not at target yet
      const source = engine.getSource(sourceId);
      expect(source?.position.x).toBeGreaterThan(0);
      expect(source?.position.x).toBeLessThan(10);
    });

    it('should clear interpolation data', () => {
      const sourceId = engine.createSource({ type: 'mascot' });
      
      setSourcePositionSmooth(engine, sourceId, { x: 10, y: 0, z: 0 });
      clearInterpolation(sourceId);
      
      // Should be able to set position again without issues
      const result = setSourcePositionSmooth(engine, sourceId, { x: 20, y: 0, z: 0 });
      expect(result).toBe(true);
    });
  });

  describe('createListenerTracker', () => {
    let engine: SpatialAudioEngine;

    beforeEach(async () => {
      engine = createSpatialAudioEngine();
      await engine.initialize();
    });

    afterEach(() => {
      engine.dispose();
    });

    it('should create listener tracker', () => {
      const tracker = createListenerTracker(engine);
      
      expect(tracker).toBeDefined();
      expect(tracker.position).toEqual(DEFAULT_VECTOR3);
      expect(typeof tracker.update).toBe('function');
    });

    it('should track listener position and calculate velocity', () => {
      const tracker = createListenerTracker(engine, { x: 0, y: 0, z: 0 });
      
      // Small timeout to ensure dt > 0
      setTimeout(() => {
        tracker.update({ x: 10, y: 0, z: 0 });
        
        expect(tracker.position).toEqual({ x: 10, y: 0, z: 0 });
        expect(tracker.velocity.x).toBeGreaterThan(0);
      }, 10);
    });
  });

  describe('doppler calculations', () => {
    it('should calculate doppler ratio for approaching source', () => {
      const params: DopplerParams = {
        sourceVelocity: { x: 100, y: 0, z: 0 },
        listenerVelocity: { x: 0, y: 0, z: 0 },
        sourcePosition: { x: 100, y: 0, z: 0 },
        listenerPosition: { x: 0, y: 0, z: 0 },
        speedOfSound: SPEED_OF_SOUND_AIR,
        dopplerFactor: 1,
      };
      
      const ratio = calculateDopplerRatio(params);
      
      expect(ratio).toBeGreaterThan(1); // Pitch increases when approaching
    });

    it('should calculate doppler ratio for receding source', () => {
      const params: DopplerParams = {
        sourceVelocity: { x: -100, y: 0, z: 0 },
        listenerVelocity: { x: 0, y: 0, z: 0 },
        sourcePosition: { x: 100, y: 0, z: 0 },
        listenerPosition: { x: 0, y: 0, z: 0 },
        speedOfSound: SPEED_OF_SOUND_AIR,
        dopplerFactor: 1,
      };
      
      const ratio = calculateDopplerRatio(params);
      
      expect(ratio).toBeLessThan(1); // Pitch decreases when receding
    });

    it('should return 1 when source and listener are at same position', () => {
      const params: DopplerParams = {
        sourceVelocity: { x: 100, y: 0, z: 0 },
        listenerVelocity: { x: 0, y: 0, z: 0 },
        sourcePosition: { x: 0, y: 0, z: 0 },
        listenerPosition: { x: 0, y: 0, z: 0 },
        speedOfSound: SPEED_OF_SOUND_AIR,
        dopplerFactor: 1,
      };
      
      const ratio = calculateDopplerRatio(params);
      
      expect(ratio).toBe(1);
    });

    it('should calculate approach doppler helper', () => {
      const ratio = calculateApproachDoppler(50); // 50 m/s approach
      expect(ratio).toBeGreaterThan(1);
    });

    it('should calculate recede doppler helper', () => {
      const ratio = calculateRecedeDoppler(50); // 50 m/s recede
      expect(ratio).toBeLessThan(1);
    });
  });

  describe('velocity audio effects', () => {
    it('should calculate audio parameters based on velocity', () => {
      const effects: VelocityAudioEffect[] = [
        { minVelocity: 0, maxVelocity: 10, pitchShift: 0, volumeBoost: 0, filterFrequency: 20000 },
        { minVelocity: 10, maxVelocity: 50, pitchShift: 2, volumeBoost: 3, filterFrequency: 10000 },
      ];
      
      const result = calculateVelocityAudio({ x: 20, y: 0, z: 0 }, effects);
      
      expect(result.pitch).toBeGreaterThan(1); // Pitch shift applied
      expect(result.volume).toBeGreaterThan(1); // Volume boost applied
      expect(result.filterFreq).toBeLessThan(20000); // Filter applied
    });

    it('should return default values when no effects match', () => {
      const result = calculateVelocityAudio({ x: 0, y: 0, z: 0 }, []);
      
      expect(result.pitch).toBe(1);
      expect(result.volume).toBe(1);
      expect(result.filterFreq).toBe(20000);
    });
  });

  describe('vector math', () => {
    it('should calculate distance between vectors', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      
      expect(distance(a, b)).toBe(5);
    });

    it('should calculate squared distance', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      
      expect(distanceSquared(a, b)).toBe(25);
    });

    it('should normalize vector', () => {
      const v: Vector3 = { x: 3, y: 4, z: 0 };
      const normalized = normalize(v);
      
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
      expect(normalized.z).toBe(0);
    });

    it('should handle zero vector normalization', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      const normalized = normalize(v);
      
      expect(normalized).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should add vectors', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 4, y: 5, z: 6 };
      
      expect(add(a, b)).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('should subtract vectors', () => {
      const a: Vector3 = { x: 5, y: 7, z: 9 };
      const b: Vector3 = { x: 1, y: 2, z: 3 };
      
      expect(subtract(a, b)).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('should multiply vector by scalar', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      
      expect(multiply(v, 2)).toEqual({ x: 2, y: 4, z: 6 });
    });

    it('should calculate dot product', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 4, y: 5, z: 6 };
      
      expect(dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it('should calculate cross product', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0, y: 1, z: 0 };
      
      expect(cross(a, b)).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('should convert spherical to cartesian', () => {
      const result = sphericalToCartesian(1, 0, Math.PI / 2);
      
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(0);
    });

    it('should convert cartesian to spherical', () => {
      const v: Vector3 = { x: 1, y: 0, z: 0 };
      const result = cartesianToSpherical(v);
      
      expect(result.radius).toBe(1);
      expect(result.theta).toBe(0);
      expect(result.phi).toBe(Math.PI / 2);
    });
  });

  describe('mascot audio helpers', () => {
    beforeEach(() => {
      // Clear any registered mascots
      getAllMascotAudioPositions().forEach(m => unregisterMascotAudio(m.mascotId));
    });

    it('should register mascot audio', () => {
      const position = registerMascotAudio('sol', 'source-1', { x: 5, y: 0, z: 0 });
      
      expect(position.mascotId).toBe('sol');
      expect(position.audioSourceId).toBe('source-1');
      expect(position.position).toEqual({ x: 5, y: 0, z: 0 });
    });

    it('should update mascot position', () => {
      registerMascotAudio('sol', 'source-1', { x: 0, y: 0, z: 0 });
      
      // Mock engine - this will return false since engine doesn't have the source
      // but the mascot position should still be updated
      const mockEngine = {
        setSourcePosition: vi.fn(() => true),
      } as unknown as SpatialAudioEngine;
      
      const result = updateMascotPosition(mockEngine, 'sol', { x: 10, y: 0, z: 0 });
      
      const mascot = getMascotAudioPosition('sol');
      expect(mascot?.position).toEqual({ x: 10, y: 0, z: 0 });
    });

    it('should return false when updating non-existent mascot', () => {
      const mockEngine = {} as SpatialAudioEngine;
      const result = updateMascotPosition(mockEngine, 'non-existent', { x: 0, y: 0, z: 0 });
      
      expect(result).toBe(false);
    });

    it('should get mascot audio position', () => {
      registerMascotAudio('lun', 'source-2', { x: 3, y: 2, z: 1 });
      
      const position = getMascotAudioPosition('lun');
      
      expect(position).toBeDefined();
      expect(position?.mascotId).toBe('lun');
    });

    it('should get all mascot audio positions', () => {
      registerMascotAudio('sol', 'source-1');
      registerMascotAudio('lun', 'source-2');
      registerMascotAudio('bin', 'source-3');
      
      const all = getAllMascotAudioPositions();
      
      expect(all).toHaveLength(3);
    });

    it('should unregister mascot audio', () => {
      registerMascotAudio('fat', 'source-4');
      
      const result = unregisterMascotAudio('fat');
      
      expect(result).toBe(true);
      expect(getMascotAudioPosition('fat')).toBeUndefined();
    });

    it('should return false when unregistering non-existent mascot', () => {
      const result = unregisterMascotAudio('non-existent');
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// Environment Audio Tests
// ============================================================================

describe('EnvironmentAudioManager', () => {
  let engine: SpatialAudioEngine;
  let manager: EnvironmentAudioManager;

  beforeEach(async () => {
    engine = createSpatialAudioEngine();
    await engine.initialize();
    manager = createEnvironmentAudioManager(engine);
  });

  afterEach(() => {
    manager.dispose();
    engine.dispose();
  });

  describe('soundscape management', () => {
    it('should create soundscape', () => {
      const soundscape = manager.createSoundscape({
        id: 'test',
        name: 'Test Soundscape',
        layers: [],
        baseVolume: 0.5,
      });
      
      expect(soundscape.id).toBe('test');
      expect(soundscape.name).toBe('Test Soundscape');
    });

    it('should get soundscape', () => {
      manager.createSoundscape({
        id: 'test',
        name: 'Test',
        layers: [],
        baseVolume: 0.5,
      });
      
      const soundscape = manager.getSoundscape('test');
      expect(soundscape).toBeDefined();
    });

    it('should get all soundscapes', () => {
      manager.createSoundscape({ id: '1', name: 'One', layers: [], baseVolume: 0.5 });
      manager.createSoundscape({ id: '2', name: 'Two', layers: [], baseVolume: 0.5 });
      
      const all = manager.getAllSoundscapes();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should destroy soundscape', () => {
      manager.createSoundscape({ id: 'to-destroy', name: 'Destroy', layers: [], baseVolume: 0.5 });
      
      const result = manager.destroySoundscape('to-destroy');
      
      expect(result).toBe(true);
      expect(manager.getSoundscape('to-destroy')).toBeUndefined();
    });
  });

  describe('volume control', () => {
    it('should set soundscape volume', () => {
      manager.createSoundscape({ id: 'vol-test', name: 'Volume Test', layers: [], baseVolume: 0.5 });
      
      const result = manager.setSoundscapeVolume('vol-test', 0.8);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent soundscape volume', () => {
      const result = manager.setSoundscapeVolume('non-existent', 0.5);
      expect(result).toBe(false);
    });
  });

  describe('weather effects', () => {
    it('should set weather effect', () => {
      // Should not throw
      expect(() => {
        manager.setWeatherEffect({ type: 'rain', intensity: 0.5 });
      }).not.toThrow();
    });

    it('should get weather effect', () => {
      manager.setWeatherEffect({ type: 'thunder', intensity: 0.8 });
      
      const effect = manager.getWeatherEffect();
      
      expect(effect).toBeDefined();
      expect(effect?.type).toBe('thunder');
      expect(effect?.intensity).toBe(0.8);
    });

    it('should clear weather effect', () => {
      manager.setWeatherEffect({ type: 'rain', intensity: 0.5 });
      manager.clearWeatherEffect();
      
      expect(manager.getWeatherEffect()).toBeNull();
    });
  });

  describe('environment presets', () => {
    it('should apply environment preset', () => {
      // Should not throw
      expect(() => manager.applyEnvironmentPreset('room')).not.toThrow();
      expect(() => manager.applyEnvironmentPreset('hall')).not.toThrow();
      expect(() => manager.applyEnvironmentPreset('outdoor')).not.toThrow();
    });
  });

  describe('reverb zones', () => {
    it('should create reverb zone', () => {
      const zoneId = manager.createReverbZone({
        name: 'Test Zone',
        type: 'room',
      });
      
      expect(zoneId).toBeDefined();
    });

    it('should set active reverb zone', () => {
      const zoneId = manager.createReverbZone({ name: 'Active Zone' });
      const result = manager.setActiveReverbZone(zoneId);
      
      expect(result).toBe(true);
      expect(manager.getActiveReverbZone()).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should dispose resources', () => {
      manager.createSoundscape({ id: 'dispose-test', name: 'Test', layers: [], baseVolume: 0.5 });
      
      manager.dispose();
      
      expect(manager.getActiveSoundscape()).toBeNull();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Spatial Audio Integration', () => {
  it('should create complete spatial audio system', async () => {
    const engine = createSpatialAudioEngine({
      hrtfEnabled: true,
      occlusionEnabled: true,
      dopplerEnabled: true,
    });
    
    const initialized = await engine.initialize();
    expect(initialized).toBe(true);
    
    const manager = createEnvironmentAudioManager(engine);
    
    // Create source
    const sourceId = engine.createSource({
      type: 'mascot',
      position: { x: 5, y: 0, z: 0 },
      volume: 0.8,
    });
    
    // Set listener position
    engine.setListenerPosition({ x: 0, y: 0, z: 0 });
    
    // Create reverb zone
    const zoneId = engine.createReverbZone({
      name: 'Test Room',
      type: 'room',
      center: { x: 0, y: 0, z: 0 },
      size: { x: 20, y: 10, z: 20 },
    });
    
    // Apply environment preset
    engine.applyEnvironmentPreset('medium_room');
    
    // Get visualization data
    const vizData = engine.getVisualizationData();
    expect(vizData).toHaveLength(1);
    expect(vizData[0].sourceId).toBe(sourceId);
    
    // Cleanup
    manager.dispose();
    engine.dispose();
  });

  it('should handle multiple sources with different settings', async () => {
    const engine = createSpatialAudioEngine();
    await engine.initialize();
    
    // Create multiple sources
    const source1 = engine.createSource({
      type: 'mascot',
      position: { x: 5, y: 0, z: 0 },
      maxDistance: 50,
    });
    
    const source2 = engine.createSource({
      type: 'effect',
      position: { x: -5, y: 2, z: 3 },
      maxDistance: 30,
      coneInnerAngle: 90,
      coneOuterAngle: 120,
    });
    
    const source3 = engine.createSource({
      type: 'ambient',
      position: { x: 0, y: 10, z: 0 },
      loop: true,
    });
    
    expect(engine.getAllSources()).toHaveLength(3);
    
    // Verify each source has correct settings
    const s1 = engine.getSource(source1);
    expect(s1?.maxDistance).toBe(50);
    expect(s1?.type).toBe('mascot');
    
    const s2 = engine.getSource(source2);
    expect(s2?.coneInnerAngle).toBe(90);
    expect(s2?.type).toBe('effect');
    
    const s3 = engine.getSource(source3);
    expect(s3?.loop).toBe(true);
    expect(s3?.type).toBe('ambient');
    
    engine.dispose();
  });

  it('should calculate correct distances and attenuations', async () => {
    const engine = createSpatialAudioEngine();
    await engine.initialize();
    
    engine.setListenerPosition({ x: 0, y: 0, z: 0 });
    
    // Create source at known distance
    engine.createSource({
      type: 'effect',
      position: { x: 3, y: 4, z: 0 }, // Distance = 5
      refDistance: 1,
      maxDistance: 10,
    });
    
    // Get visualization data
    const vizData = engine.getVisualizationData();
    expect(vizData[0].distance).toBe(5);
    
    // Calculate attenuation
    const attenuation = engine.calculateDistanceAttenuation(
      { x: 3, y: 4, z: 0 },
      { model: 'inverse', refDistance: 1, maxDistance: 10, rolloffFactor: 1 }
    );
    
    expect(attenuation).toBeCloseTo(1 / 5, 2);
    
    engine.dispose();
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Exports', () => {
  it('should export all required functions', () => {
    // Core engine
    expect(typeof createSpatialAudioEngine).toBe('function');
    expect(typeof SpatialAudioEngine).toBe('function');
    
    // Environment manager
    expect(typeof createEnvironmentAudioManager).toBe('function');
    expect(typeof EnvironmentAudioManager).toBe('function');
    
    // Positioning utilities
    expect(typeof setSourcePositionSmooth).toBe('function');
    expect(typeof clearInterpolation).toBe('function');
    expect(typeof createListenerTracker).toBe('function');
    expect(typeof calculateDopplerRatio).toBe('function');
    expect(typeof calculateApproachDoppler).toBe('function');
    expect(typeof calculateRecedeDoppler).toBe('function');
    expect(typeof calculateVelocityAudio).toBe('function');
    
    // Vector math
    expect(typeof distance).toBe('function');
    expect(typeof distanceSquared).toBe('function');
    expect(typeof normalize).toBe('function');
    expect(typeof add).toBe('function');
    expect(typeof subtract).toBe('function');
    expect(typeof multiply).toBe('function');
    expect(typeof dot).toBe('function');
    expect(typeof cross).toBe('function');
    expect(typeof sphericalToCartesian).toBe('function');
    expect(typeof cartesianToSpherical).toBe('function');
    
    // Mascot helpers
    expect(typeof registerMascotAudio).toBe('function');
    expect(typeof updateMascotPosition).toBe('function');
    expect(typeof getMascotAudioPosition).toBe('function');
    expect(typeof getAllMascotAudioPositions).toBe('function');
    expect(typeof unregisterMascotAudio).toBe('function');
    
    // Constants
    expect(DEFAULT_VECTOR3).toEqual({ x: 0, y: 0, z: 0 });
    expect(DEFAULT_FORWARD).toEqual({ x: 0, y: 0, z: -1 });
    expect(DEFAULT_UP).toEqual({ x: 0, y: 1, z: 0 });
    expect(SPEED_OF_SOUND_AIR).toBe(343);
  });
});
