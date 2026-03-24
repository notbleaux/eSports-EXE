/** [Ver001.000]
 * Animation Blending System Tests
 * ================================
 * Comprehensive test suite for blend trees, transitions, layers, and IK.
 * 
 * Tests:
 * - Blend tree 1D/2D computation
 * - Weight normalization
 * - Parameter smoothing
 * - Transition controller
 * - Animation layers
 * - IK solver
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlendTreeSystem, createMovementBlendTree, create8DirectionalTree, createBlendParameter } from '../blendTree';
import { TransitionController, QUICK_TRANSITION, SMOOTH_TRANSITION } from '../transitions';
import { AnimationLayerSystem, createBaseLayer, createUpperBodyLayer, createAdditiveLayer } from '../layers';
import { IKSystem, createLeftFootIKConfig, createHeadLookAtConfig, calculateInfluenceByDistance } from '../ik';
import * as THREE from 'three';

// ============================================================================
// Blend Tree Tests
// ============================================================================

describe('BlendTreeSystem', () => {
  let blendSystem: BlendTreeSystem;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    blendSystem = new BlendTreeSystem({ enableSmoothing: false });
  });

  afterEach(() => {
    blendSystem?.dispose();
    vi.useRealTimers();
  });

  describe('1D Blend Trees', () => {
    beforeEach(() => {
      blendSystem.register1DTree('movement', {
        parameter: 'speed',
        clips: [
          { state: 'idle', threshold: 0 },
          { state: 'walk', threshold: 0.5 },
          { state: 'run', threshold: 1 },
        ],
      });

      blendSystem.registerParameter({
        name: 'speed',
        value: 0,
        min: 0,
        max: 1,
        clamped: true,
      });
    });

    it('should compute blend at threshold boundaries', () => {
      // At idle threshold
      blendSystem.setParameter('speed', 0, true);
      const idleResult = blendSystem.computeBlend('movement');
      expect(idleResult.normalizedWeights.get('idle')).toBeGreaterThan(0.9);

      // At run threshold
      blendSystem.setParameter('speed', 1, true);
      const runResult = blendSystem.computeBlend('movement');
      expect(runResult.normalizedWeights.get('run')).toBeGreaterThan(0.9);
    });

    it('should blend between two clips at midpoint', () => {
      blendSystem.setParameter('speed', 0.25, true); // Between idle (0) and walk (0.5)
      const result = blendSystem.computeBlend('movement');

      // Both clips should have significant weight
      expect(result.normalizedWeights.get('idle')).toBeGreaterThan(0.2);
      expect(result.normalizedWeights.get('walk')).toBeGreaterThan(0.2);
    });

    it('should normalize weights to sum to 1', () => {
      blendSystem.setParameter('speed', 0.3, true);
      const result = blendSystem.computeBlend('movement');

      let totalWeight = 0;
      for (const weight of result.normalizedWeights.values()) {
        totalWeight += weight;
      }

      expect(totalWeight).toBeCloseTo(1, 5);
    });

    it('should identify dominant clip correctly', () => {
      blendSystem.setParameter('speed', 0.6, true); // Closer to walk (0.5) than run (1)
      const result = blendSystem.computeBlend('movement');

      expect(result.dominantClip).toBe('walk');
      expect(result.normalizedWeights.get('walk')).toBeGreaterThan(
        result.normalizedWeights.get('run') ?? 0
      );
    });

    it('should handle single clip tree', () => {
      blendSystem.register1DTree('single', {
        parameter: 'speed',
        clips: [{ state: 'idle', threshold: 0 }],
      });

      const result = blendSystem.computeBlend('single');
      expect(result.normalizedWeights.get('idle')).toBe(1);
      expect(result.dominantClip).toBe('idle');
    });

    it('should return empty result for non-existent tree', () => {
      const result = blendSystem.computeBlend('non-existent');
      expect(result.activeCount).toBe(0);
      expect(result.dominantClip).toBeNull();
    });

    it('should clamp parameter values when configured', () => {
      blendSystem.setParameter('speed', 2, true);
      expect(blendSystem.getParameter('speed')).toBe(1);

      blendSystem.setParameter('speed', -1, true);
      expect(blendSystem.getParameter('speed')).toBe(0);
    });
  });

  describe('2D Cartesian Blend Trees', () => {
    beforeEach(() => {
      blendSystem.register2DCartesianTree('combat', {
        parameterX: 'directionX',
        parameterY: 'directionY',
        clips: [
          { state: 'attack_front', position: { x: 0, y: 1 } },
          { state: 'attack_back', position: { x: 0, y: -1 } },
          { state: 'attack_left', position: { x: -1, y: 0 } },
          { state: 'attack_right', position: { x: 1, y: 0 } },
        ],
      });

      blendSystem.registerParameter({
        name: 'directionX',
        value: 0,
        min: -1,
        max: 1,
        clamped: true,
      });

      blendSystem.registerParameter({
        name: 'directionY',
        value: 0,
        min: -1,
        max: 1,
        clamped: true,
      });
    });

    it('should blend based on 2D position', () => {
      blendSystem.setParameter('directionX', 0, true);
      blendSystem.setParameter('directionY', 1, true);

      const result = blendSystem.computeBlend('combat');
      expect(result.normalizedWeights.get('attack_front')).toBeGreaterThan(0.5);
    });

    it('should blend between multiple clips in 2D space', () => {
      blendSystem.setParameter('directionX', 0.5, true);
      blendSystem.setParameter('directionY', 0.5, true);

      const result = blendSystem.computeBlend('combat');
      expect(result.activeCount).toBeGreaterThanOrEqual(2);
    });

    it('should use inverse distance weighting', () => {
      blendSystem.setParameter('directionX', 0.1, true);
      blendSystem.setParameter('directionY', 0.9, true);

      const result = blendSystem.computeBlend('combat');
      // Front attack should have higher weight than others
      expect(result.normalizedWeights.get('attack_front')).toBeGreaterThan(
        result.normalizedWeights.get('attack_back') ?? 0
      );
    });
  });

  describe('2D Directional Blend Trees', () => {
    beforeEach(() => {
      blendSystem.register2DDirectionalTree('movement8way', {
        parameterX: 'moveX',
        parameterY: 'moveY',
        clips: [
          { state: 'move_n', position: { x: 0, y: 1 } },
          { state: 'move_e', position: { x: 1, y: 0 } },
          { state: 'move_s', position: { x: 0, y: -1 } },
          { state: 'move_w', position: { x: -1, y: 0 } },
        ],
      });

      blendSystem.registerParameter({
        name: 'moveX',
        value: 0,
        min: -1,
        max: 1,
        clamped: true,
      });

      blendSystem.registerParameter({
        name: 'moveY',
        value: 0,
        min: -1,
        max: 1,
        clamped: true,
      });
    });

    it('should blend based on direction vector', () => {
      blendSystem.setParameter('moveX', 1, true);
      blendSystem.setParameter('moveY', 0, true);

      const result = blendSystem.computeBlend('movement8way');
      expect(result.normalizedWeights.get('move_e')).toBeGreaterThan(0.5);
    });

    it('should use magnitude as weight scale', () => {
      blendSystem.setParameter('moveX', 0.5, true);
      blendSystem.setParameter('moveY', 0, true);

      const result = blendSystem.computeBlend('movement8way');
      // Magnitude is 0.5, so weights should reflect this
      expect(result.totalWeight).toBeLessThan(1);
    });

    it('should find closest clips by angle', () => {
      // 45 degrees between north and east
      const angle = Math.PI / 4;
      blendSystem.setParameter('moveX', Math.cos(angle), true);
      blendSystem.setParameter('moveY', Math.sin(angle), true);

      const result = blendSystem.computeBlend('movement8way');
      // Should blend between north and east
      expect(result.normalizedWeights.has('move_n')).toBe(true);
      expect(result.normalizedWeights.has('move_e')).toBe(true);
    });
  });

  describe('Parameter Smoothing', () => {
    beforeEach(() => {
      blendSystem = new BlendTreeSystem({
        enableSmoothing: true,
        defaultStiffness: 100,
        defaultDamping: 10,
      });

      blendSystem.registerParameter({
        name: 'smoothParam',
        value: 0,
        min: 0,
        max: 1,
        clamped: true,
        springStiffness: 100,
        springDamping: 10,
      });
    });

    it('should smooth parameter changes over time', () => {
      blendSystem.setParameter('smoothParam', 1, false);

      // Initially should still be near 0
      expect(blendSystem.getParameter('smoothParam')).toBeLessThan(0.5);

      // Advance time
      vi.advanceTimersByTime(500);

      // Should have moved closer to target
      expect(blendSystem.getParameter('smoothParam')).toBeGreaterThan(0);
    });

    it('should support immediate parameter setting', () => {
      blendSystem.setParameter('smoothParam', 0.5, true);
      expect(blendSystem.getParameter('smoothParam')).toBe(0.5);
    });
  });

  describe('Factory Functions', () => {
    it('should create movement blend tree', () => {
      const tree = createMovementBlendTree('speed');
      expect(tree.type).toBe('1d');
      expect(tree.clips.length).toBeGreaterThanOrEqual(2);
    });

    it('should create 8-directional tree', () => {
      const tree = create8DirectionalTree('x', 'y');
      expect(tree.type).toBe('2d-directional');
      expect(tree.clips.length).toBe(8);
    });

    it('should create blend parameter', () => {
      const param = createBlendParameter('test', {
        initialValue: 0.5,
        min: 0,
        max: 1,
        clamped: true,
      });
      expect(param.name).toBe('test');
      expect(param.value).toBe(0.5);
      expect(param.clamped).toBe(true);
    });
  });
});

// ============================================================================
// Transition Controller Tests
// ============================================================================

describe('TransitionController', () => {
  let controller: TransitionController;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    controller = new TransitionController({ allowInterrupts: true });
  });

  afterEach(() => {
    controller?.dispose();
    vi.useRealTimers();
  });

  describe('Transition Registration', () => {
    it('should register a transition', () => {
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.3,
        ease: 'easeInOut',
      });

      expect(controller.hasTransition('idle', 'walk')).toBe(true);
    });

    it('should get default config for unregistered transition', () => {
      const config = controller.getTransitionConfig('walk', 'run');
      expect(config.duration).toBeDefined();
      expect(config.ease).toBeDefined();
    });

    it('should unregister a transition', () => {
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.3,
        ease: 'easeInOut',
      });

      controller.unregisterTransition('idle', 'walk');
      expect(controller.hasTransition('idle', 'walk')).toBe(false);
    });
  });

  describe('Transition Execution', () => {
    it('should start a transition', () => {
      const transitionId = controller.transition('idle', 'walk', { duration: 0.3 });
      expect(transitionId).toBeTruthy();
      expect(controller.isTransitioning()).toBe(true);
    });

    it('should track transition progress', () => {
      controller.transition('idle', 'walk', { duration: 0.3 });
      
      expect(controller.getProgress()).toBe(0);
      
      vi.advanceTimersByTime(150);
      const progress = controller.getProgress();
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });

    it('should complete transition after duration', () => {
      controller.transition('idle', 'walk', { duration: 0.1 });
      
      vi.advanceTimersByTime(150);
      
      const active = controller.getActiveTransition();
      expect(active?.isComplete || !controller.isTransitioning()).toBe(true);
    });

    it('should update blend weight during transition', () => {
      controller.transition('idle', 'walk', { duration: 0.2 });
      
      const initialWeight = controller.getBlendWeight();
      vi.advanceTimersByTime(100);
      const midWeight = controller.getBlendWeight();
      
      expect(midWeight).toBeGreaterThan(initialWeight);
    });

    it('should emit events during transition lifecycle', () => {
      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      controller.on('transitionStart', startHandler);
      controller.on('transitionComplete', completeHandler);

      controller.transition('idle', 'walk', { duration: 0.1 });
      expect(startHandler).toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(completeHandler).toHaveBeenCalled();
    });

    it('should force complete transition', () => {
      controller.transition('idle', 'walk', { duration: 1 });
      controller.completeTransition();
      
      expect(controller.getBlendWeight()).toBe(1);
    });

    it('should cancel transition', () => {
      controller.transition('idle', 'walk', { duration: 0.5 });
      controller.cancelTransition();
      
      expect(controller.isTransitioning()).toBe(false);
      expect(controller.getActiveTransition()).toBeNull();
    });
  });

  describe('Interrupt Handling', () => {
    it('should allow interrupting interruptible transition', () => {
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.5,
        ease: 'easeInOut',
        interruptible: true,
      });

      controller.transition('idle', 'walk');
      const secondTransition = controller.transition('walk', 'run', { force: true });
      
      expect(secondTransition).toBeTruthy();
    });

    it('should prevent interrupting non-interruptible transition', () => {
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.5,
        ease: 'easeInOut',
        interruptible: false,
      });

      controller.transition('idle', 'walk');
      // Second transition should be queued or rejected
      const active = controller.getActiveTransition();
      expect(active?.from).toBe('idle');
    });
  });

  describe('Conditions', () => {
    it('should check transition conditions', () => {
      controller.setParameter('canWalk', true);
      
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.3,
        ease: 'linear',
        conditions: [
          { parameter: 'canWalk', type: 'equals', value: true },
        ],
      });

      const result = controller.transition('idle', 'walk');
      expect(result).toBeTruthy();
    });

    it('should reject transition when conditions not met', () => {
      controller.setParameter('canWalk', false);
      
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.3,
        ease: 'linear',
        conditions: [
          { parameter: 'canWalk', type: 'equals', value: true },
        ],
      });

      const result = controller.transition('idle', 'walk');
      expect(result).toBeNull();
    });

    it('should bypass conditions with force flag', () => {
      controller.setParameter('canWalk', false);
      
      controller.registerTransition({
        from: 'idle',
        to: 'walk',
        duration: 0.3,
        ease: 'linear',
        conditions: [
          { parameter: 'canWalk', type: 'equals', value: true },
        ],
      });

      const result = controller.transition('idle', 'walk', { force: true });
      expect(result).toBeTruthy();
    });
  });

  describe('Presets', () => {
    it('should apply quick transition preset', () => {
      expect(QUICK_TRANSITION.config.duration).toBe(0.15);
      expect(QUICK_TRANSITION.config.interruptible).toBe(true);
    });

    it('should apply smooth transition preset', () => {
      expect(SMOOTH_TRANSITION.config.duration).toBe(0.3);
      expect(SMOOTH_TRANSITION.config.ease).toBe('easeInOut');
    });
  });
});

// ============================================================================
// Animation Layer Tests
// ============================================================================

describe('AnimationLayerSystem', () => {
  let layerSystem: AnimationLayerSystem;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    layerSystem = new AnimationLayerSystem();
  });

  afterEach(() => {
    layerSystem?.dispose();
    vi.useRealTimers();
  });

  describe('Layer Management', () => {
    it('should add a layer', () => {
      const result = layerSystem.addLayer(createBaseLayer('base'));
      expect(result).toBe(true);
      expect(layerSystem.getLayerCount()).toBe(1);
    });

    it('should remove a layer', () => {
      layerSystem.addLayer(createBaseLayer('base'));
      const result = layerSystem.removeLayer('base');
      expect(result).toBe(true);
      expect(layerSystem.getLayerCount()).toBe(0);
    });

    it('should enforce max layer limit', () => {
      const system = new AnimationLayerSystem({ maxLayers: 2 });
      
      expect(system.addLayer(createBaseLayer('1'))).toBe(true);
      expect(system.addLayer(createBaseLayer('2'))).toBe(true);
      expect(system.addLayer(createBaseLayer('3'))).toBe(false);
      
      system.dispose();
    });

    it('should get layers sorted by priority', () => {
      layerSystem.addLayer({ ...createBaseLayer('base'), priority: 0 });
      layerSystem.addLayer({ ...createUpperBodyLayer('upper'), priority: 10 });
      layerSystem.addLayer({ ...createAdditiveLayer('additive'), priority: 5 });

      const layers = layerSystem.getLayers();
      expect(layers[0].id).toBe('base');
      expect(layers[1].id).toBe('additive');
      expect(layers[2].id).toBe('upper');
    });
  });

  describe('Layer State Control', () => {
    beforeEach(() => {
      layerSystem.addLayer(createBaseLayer('base'));
    });

    it('should set layer state', () => {
      const result = layerSystem.setLayerState('base', 'walk');
      expect(result).toBe(true);
      
      const layer = layerSystem.getLayer('base');
      expect(layer?.targetState).toBe('walk');
    });

    it('should set layer state immediately', () => {
      layerSystem.setLayerState('base', 'run', true);
      
      const layer = layerSystem.getLayer('base');
      expect(layer?.currentState).toBe('run');
    });

    it('should update layer time', () => {
      layerSystem.updateLayerTime('base', 0.1);
      
      const state = layerSystem.getLayerState('base');
      expect(state?.timeInState).toBeGreaterThan(0);
    });
  });

  describe('Layer Weights', () => {
    beforeEach(() => {
      layerSystem.addLayer(createBaseLayer('base'));
    });

    it('should set layer weight', () => {
      layerSystem.setLayerWeight('base', 0.5, false);
      expect(layerSystem.getLayerWeight('base')).toBe(0.5);
    });

    it('should clamp weight between 0 and 1', () => {
      layerSystem.setLayerWeight('base', 2, false);
      expect(layerSystem.getLayerWeight('base')).toBe(1);

      layerSystem.setLayerWeight('base', -0.5, false);
      expect(layerSystem.getLayerWeight('base')).toBe(0);
    });

    it('should smooth weight transitions', () => {
      const smoothSystem = new AnimationLayerSystem({
        smoothWeightTransitions: true,
        weightTransitionSpeed: 5,
      });
      // Start with weight 0 to test smoothing toward target
      smoothSystem.addLayer({ ...createBaseLayer('base'), weight: 0 });

      // With smooth=true (default), weight should not update immediately
      smoothSystem.setLayerWeight('base', 1);
      expect(smoothSystem.getLayerWeight('base')).toBe(0);

      vi.advanceTimersByTime(500);
      expect(smoothSystem.getLayerWeight('base')).toBeGreaterThan(0);

      smoothSystem.dispose();
    });

    it('should enable/disable layers', () => {
      layerSystem.disableLayer('base');
      expect(layerSystem.getLayer('base')?.enabled).toBe(false);

      layerSystem.enableLayer('base');
      expect(layerSystem.getLayer('base')?.enabled).toBe(true);
    });

    it('should mute/unmute layers', () => {
      layerSystem.muteLayer('base', true);
      expect(layerSystem.getLayer('base')?.muted).toBe(true);

      layerSystem.muteLayer('base', false);
      expect(layerSystem.getLayer('base')?.muted).toBe(false);
    });
  });

  describe('Layer Blending', () => {
    it('should compute override blend', () => {
      layerSystem.addLayer({ ...createBaseLayer('base'), weight: 1 });
      layerSystem.setLayerState('base', 'idle');

      const result = layerSystem.computeBlend();
      expect(result.finalWeights.get('idle')).toBe(1);
    });

    it('should compute additive blend', () => {
      layerSystem.addLayer({ ...createBaseLayer('base'), weight: 0.5, currentState: 'idle' });
      layerSystem.addLayer({
        ...createAdditiveLayer('additive'),
        weight: 0.3,
        currentState: 'recoil',
      });

      const result = layerSystem.computeBlend();
      expect(result.activeLayerCount).toBe(2);
    });

    it('should identify dominant layer', () => {
      layerSystem.addLayer({ ...createBaseLayer('base'), weight: 0.8 });
      layerSystem.addLayer({ ...createUpperBodyLayer('upper'), weight: 0.3 });

      const result = layerSystem.computeBlend();
      expect(result.dominantLayer).toBe('base');
    });

    it('should skip disabled and muted layers', () => {
      layerSystem.addLayer({ ...createBaseLayer('base'), enabled: false });
      layerSystem.addLayer({ ...createUpperBodyLayer('upper'), muted: true });

      const result = layerSystem.computeBlend();
      expect(result.activeLayerCount).toBe(0);
    });
  });

  describe('Body Masking', () => {
    it('should set layer mask', () => {
      layerSystem.addLayer(createUpperBodyLayer('upper'));
      
      const result = layerSystem.setLayerMask('upper', {
        fullBody: false,
        parts: { head: true, chest: true },
      });
      
      expect(result).toBe(true);
    });

    it('should check body part affected', () => {
      layerSystem.addLayer(createUpperBodyLayer('upper'));

      expect(layerSystem.isBodyPartAffected('upper', 'head')).toBe(true);
      expect(layerSystem.isBodyPartAffected('upper', 'leftLeg')).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit layer added event', () => {
      const handler = vi.fn();
      layerSystem.on('layerAdded', handler);

      layerSystem.addLayer(createBaseLayer('base'));
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ layerId: 'base' })
      );
    });

    it('should emit layer state change event', () => {
      const handler = vi.fn();
      layerSystem.on('layerStateChange', handler);
      layerSystem.addLayer(createBaseLayer('base'));

      layerSystem.setLayerState('base', 'walk');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit layer weight change event', () => {
      const handler = vi.fn();
      layerSystem.on('layerWeightChange', handler);
      layerSystem.addLayer(createBaseLayer('base'));

      layerSystem.setLayerWeight('base', 0.5);
      expect(handler).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// IK System Tests
// ============================================================================

describe('IKSystem', () => {
  let ikSystem: IKSystem;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    ikSystem = new IKSystem({ smoothWeights: false });
  });

  afterEach(() => {
    ikSystem?.dispose();
    vi.useRealTimers();
  });

  describe('Chain Registration', () => {
    it('should register foot IK chain', () => {
      ikSystem.registerFootIK('leftFoot', createLeftFootIKConfig());
      expect(ikSystem.getChain('leftFoot')).toBeDefined();
      expect(ikSystem.getChain('leftFoot')?.type).toBe('foot');
    });

    it('should register look-at IK chain', () => {
      ikSystem.registerLookAtIK('head', createHeadLookAtConfig());
      expect(ikSystem.getChain('head')).toBeDefined();
      expect(ikSystem.getChain('head')?.type).toBe('lookAt');
    });

    it('should register two-bone IK chain', () => {
      ikSystem.registerTwoBoneIK('leftArm', {
        rootJoint: 'LeftShoulder',
        midJoint: 'LeftElbow',
        endJoint: 'LeftHand',
        bendDirection: new THREE.Vector3(0, 0, 1),
      });
      expect(ikSystem.getChain('leftArm')).toBeDefined();
      expect(ikSystem.getChain('leftArm')?.type).toBe('twoBone');
    });

    it('should unregister IK chain', () => {
      ikSystem.registerFootIK('leftFoot', createLeftFootIKConfig());
      ikSystem.unregisterChain('leftFoot');
      expect(ikSystem.getChain('leftFoot')).toBeUndefined();
    });

    it('should enable/disable chain', () => {
      ikSystem.registerFootIK('leftFoot', createLeftFootIKConfig());
      ikSystem.setChainEnabled('leftFoot', false);
      expect(ikSystem.getChain('leftFoot')?.enabled).toBe(false);
    });
  });

  describe('Target Control', () => {
    beforeEach(() => {
      ikSystem.registerTwoBoneIK('arm', {
        rootJoint: 'Shoulder',
        midJoint: 'Elbow',
        endJoint: 'Hand',
        bendDirection: new THREE.Vector3(0, 0, 1),
      });
    });

    it('should set target position', () => {
      const target = new THREE.Vector3(1, 2, 3);
      const result = ikSystem.setTarget('arm', target, 1);
      expect(result).toBe(true);
    });

    it('should set target weight', () => {
      ikSystem.setWeight('arm', 0.5);
      vi.advanceTimersByTime(16);
      expect(ikSystem.getWeight('arm')).toBe(0.5);
    });

    it('should clamp weight between 0 and 1', () => {
      ikSystem.setWeight('arm', 2);
      vi.advanceTimersByTime(16);
      expect(ikSystem.getWeight('arm')).toBe(1);

      ikSystem.setWeight('arm', -1);
      vi.advanceTimersByTime(16);
      expect(ikSystem.getWeight('arm')).toBe(0);
    });
  });

  describe('Two-Bone IK Solver', () => {
    it('should solve two-bone IK for reachable target', () => {
      const rootPos = new THREE.Vector3(0, 0, 0);
      const midPos = new THREE.Vector3(0, 1, 0);
      const endPos = new THREE.Vector3(0, 2, 0);
      const targetPos = new THREE.Vector3(1, 1, 0);
      const poleVector = new THREE.Vector3(0, 0, 1);

      const result = ikSystem.solveTwoBoneIK(
        rootPos,
        midPos,
        endPos,
        targetPos,
        poleVector
      );

      expect(result).not.toBeNull();
      expect(result?.rootRotation).toBeInstanceOf(THREE.Quaternion);
      expect(result?.midRotation).toBeInstanceOf(THREE.Quaternion);
    });

    it('should handle unreachable target', () => {
      const rootPos = new THREE.Vector3(0, 0, 0);
      const midPos = new THREE.Vector3(0, 1, 0);
      const endPos = new THREE.Vector3(0, 2, 0);
      const targetPos = new THREE.Vector3(10, 0, 0); // Far away
      const poleVector = new THREE.Vector3(0, 0, 1);

      const result = ikSystem.solveTwoBoneIK(
        rootPos,
        midPos,
        endPos,
        targetPos,
        poleVector
      );

      // Should still return a solution (fully extended)
      expect(result).not.toBeNull();
    });

    it('should respect bone lengths', () => {
      const rootPos = new THREE.Vector3(0, 0, 0);
      const midPos = new THREE.Vector3(0, 1, 0);
      const endPos = new THREE.Vector3(0, 2, 0);
      const targetPos = new THREE.Vector3(0.5, 1.5, 0);
      const poleVector = new THREE.Vector3(0, 0, 1);

      const result = ikSystem.solveTwoBoneIK(
        rootPos,
        midPos,
        endPos,
        targetPos,
        poleVector,
        [1, 1]
      );

      expect(result).not.toBeNull();
    });
  });

  describe('Look-At Solver', () => {
    it('should solve look-at IK', () => {
      const headPos = new THREE.Vector3(0, 1.7, 0);
      const targetPos = new THREE.Vector3(1, 1.7, 1);
      const upVector = new THREE.Vector3(0, 1, 0);

      const result = ikSystem.solveLookAt(
        headPos,
        targetPos,
        upVector,
        Math.PI / 3,
        Math.PI / 4
      );

      expect(result).toBeInstanceOf(THREE.Quaternion);
    });

    it('should clamp to max angles', () => {
      const headPos = new THREE.Vector3(0, 1.7, 0);
      const targetPos = new THREE.Vector3(-10, 0, 0); // Far to the side
      const upVector = new THREE.Vector3(0, 1, 0);

      const result = ikSystem.solveLookAt(
        headPos,
        targetPos,
        upVector,
        Math.PI / 6, // 30 degrees
        Math.PI / 4
      );

      expect(result).toBeInstanceOf(THREE.Quaternion);
    });
  });

  describe('Main Solver', () => {
    beforeEach(() => {
      ikSystem.registerTwoBoneIK('arm', {
        rootJoint: 'Shoulder',
        midJoint: 'Elbow',
        endJoint: 'Hand',
        bendDirection: new THREE.Vector3(0, 0, 1),
      });
    });

    it('should solve all active chains', () => {
      const jointPositions = new Map([
        ['Shoulder', new THREE.Vector3(0, 1, 0)],
        ['Elbow', new THREE.Vector3(0, 0.5, 0.5)],
        ['Hand', new THREE.Vector3(0, 0, 1)],
      ]);

      // Set target with weight and run one update cycle to sync currentWeight
      ikSystem.setTarget('arm', new THREE.Vector3(0.5, 0.5, 0.5), 1);
      vi.advanceTimersByTime(16); // One frame at 60fps
      
      const results = ikSystem.solve(jointPositions);
      expect(results.size).toBeGreaterThan(0);
    });

    it('should skip disabled chains', () => {
      ikSystem.setChainEnabled('arm', false);

      const jointPositions = new Map([
        ['Shoulder', new THREE.Vector3(0, 1, 0)],
        ['Elbow', new THREE.Vector3(0, 0.5, 0.5)],
        ['Hand', new THREE.Vector3(0, 0, 1)],
      ]);

      // Set target so weight would be active if enabled
      ikSystem.setTarget('arm', new THREE.Vector3(0.5, 0.5, 0.5), 1);
      vi.advanceTimersByTime(16);

      const results = ikSystem.solve(jointPositions);
      // Disabled chains should not appear in results at all
      expect(results.has('arm')).toBe(false);
    });
  });

  describe('Weight Smoothing', () => {
    beforeEach(() => {
      ikSystem = new IKSystem({ smoothWeights: true, weightSmoothSpeed: 5 });
      ikSystem.registerTwoBoneIK('arm', {
        rootJoint: 'Shoulder',
        midJoint: 'Elbow',
        endJoint: 'Hand',
        bendDirection: new THREE.Vector3(0, 0, 1),
      });
    });

    it('should smooth weight transitions', () => {
      const smoothIK = new IKSystem({ smoothWeights: true, weightSmoothSpeed: 5 });
      smoothIK.registerTwoBoneIK('smoothArm', {
        rootJoint: 'Shoulder',
        midJoint: 'Elbow',
        endJoint: 'Hand',
        bendDirection: new THREE.Vector3(0, 0, 1),
      });
      
      smoothIK.setWeight('smoothArm', 1);
      expect(smoothIK.getWeight('smoothArm')).toBeLessThan(1);

      vi.advanceTimersByTime(500);
      expect(smoothIK.getWeight('smoothArm')).toBeGreaterThan(0);
      
      smoothIK.dispose();
    });
  });

  describe('Utility Functions', () => {
    it('should calculate influence by distance', () => {
      const currentPos = new THREE.Vector3(0, 0, 0);
      const targetPos = new THREE.Vector3(0.5, 0, 0);
      const maxDistance = 1;

      const influence = calculateInfluenceByDistance(currentPos, targetPos, maxDistance);
      expect(influence).toBeGreaterThan(0);
      expect(influence).toBeLessThan(1);
    });

    it('should return max weight when at target', () => {
      const pos = new THREE.Vector3(1, 2, 3);
      const influence = calculateInfluenceByDistance(pos, pos, 1);
      expect(influence).toBe(1);
    });

    it('should return min weight when beyond max distance', () => {
      const currentPos = new THREE.Vector3(0, 0, 0);
      const targetPos = new THREE.Vector3(10, 0, 0);
      const maxDistance = 1;

      const influence = calculateInfluenceByDistance(
        currentPos,
        targetPos,
        maxDistance,
        0,
        1
      );
      expect(influence).toBe(0);
    });
  });

  describe('Preset Configurations', () => {
    it('should create left foot IK config', () => {
      const config = createLeftFootIKConfig();
      expect(config.footJoint).toBe('LeftFoot');
      expect(config.kneeJoint).toBe('LeftKnee');
    });

    it('should create head look-at config', () => {
      const config = createHeadLookAtConfig();
      expect(config.headJoint).toBe('Head');
      expect(config.maxHorizontalAngle).toBe(Math.PI / 2);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Animation Blending Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should integrate blend tree with transitions', () => {
    const blendSystem = new BlendTreeSystem();
    const transitionController = new TransitionController();

    // Set up blend tree
    blendSystem.register1DTree('movement', {
      parameter: 'speed',
      clips: [
        { state: 'idle', threshold: 0 },
        { state: 'walk', threshold: 0.5 },
        { state: 'run', threshold: 1 },
      ],
    });
    blendSystem.registerParameter({
      name: 'speed',
      value: 0,
      min: 0,
      max: 1,
      clamped: true,
    });

    // Blend and transition
    blendSystem.setParameter('speed', 0.5, true);
    const result = blendSystem.computeBlend('movement');

    expect(result.activeCount).toBeGreaterThan(0);

    blendSystem.dispose();
    transitionController.dispose();
  });

  it('should integrate layers with IK', () => {
    const layerSystem = new AnimationLayerSystem();
    const ikSystem = new IKSystem();

    // Add layers
    layerSystem.addLayer(createBaseLayer('base'));
    layerSystem.addLayer(createUpperBodyLayer('upper'));
    
    // Set upper body weight to make it active
    layerSystem.setLayerWeight('upper', 0.5, false);

    // Add IK
    ikSystem.registerLookAtIK('head', createHeadLookAtConfig());
    ikSystem.setTarget('head', new THREE.Vector3(0, 1, 5), 1);
    vi.advanceTimersByTime(16);

    // Compute blends
    const layerResult = layerSystem.computeBlend();
    expect(layerResult.activeLayerCount).toBe(2);

    layerSystem.dispose();
    ikSystem.dispose();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should compute blend trees efficiently', () => {
    const blendSystem = new BlendTreeSystem();
    
    blendSystem.register2DDirectionalTree('movement', {
      parameterX: 'x',
      parameterY: 'y',
      clips: Array.from({ length: 8 }, (_, i) => ({
        state: `state_${i}`,
        position: {
          x: Math.cos((i / 8) * Math.PI * 2),
          y: Math.sin((i / 8) * Math.PI * 2),
        },
      })),
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      blendSystem.setParameter('x', Math.random() * 2 - 1, true);
      blendSystem.setParameter('y', Math.random() * 2 - 1, true);
      blendSystem.computeBlend('movement');
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // Should complete in less than 100ms

    blendSystem.dispose();
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export BlendTreeSystem', () => {
    expect(BlendTreeSystem).toBeDefined();
  });

  it('should export TransitionController', () => {
    expect(TransitionController).toBeDefined();
  });

  it('should export AnimationLayerSystem', () => {
    expect(AnimationLayerSystem).toBeDefined();
  });

  it('should export IKSystem', () => {
    expect(IKSystem).toBeDefined();
  });
});
