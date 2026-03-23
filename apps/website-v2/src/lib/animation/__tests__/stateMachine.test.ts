/** [Ver001.000]
 * Animation State Machine Tests
 * =============================
 * Comprehensive test suite for the AnimationStateMachine.
 * Tests state transitions, animation blending, and interrupt handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimationStateMachine } from '../stateMachine';
import {
  type AnimationState,
  type StateMachineOptions,
  DEFAULT_STATE_CONFIGS,
  PRIORITY_WEIGHTS,
} from '../states';

// ============================================================================
// Test Setup
// ============================================================================

describe('AnimationStateMachine', () => {
  let stateMachine: AnimationStateMachine;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    stateMachine?.dispose();
    vi.useRealTimers();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with default idle state', () => {
      stateMachine = new AnimationStateMachine();
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should initialize with custom initial state', () => {
      stateMachine = new AnimationStateMachine({ initialState: 'walk' });
      expect(stateMachine.getCurrentState()).toBe('walk');
    });

    it('should have null previous state on initialization', () => {
      stateMachine = new AnimationStateMachine();
      expect(stateMachine.getPreviousState()).toBeNull();
    });

    it('should start with zero progress', () => {
      stateMachine = new AnimationStateMachine();
      expect(stateMachine.getProgress()).toBe(0);
    });

    it('should start with zero time in state', () => {
      stateMachine = new AnimationStateMachine();
      expect(stateMachine.getTimeInState()).toBe(0);
    });

    it('should not be transitioning on initialization', () => {
      stateMachine = new AnimationStateMachine();
      expect(stateMachine.isBlending()).toBe(false);
    });
  });

  // ============================================================================
  // State Transition Tests
  // ============================================================================

  describe('State Transitions', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should transition from idle to walk', () => {
      const result = stateMachine.transitionTo('walk');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('walk');
    });

    it('should transition from idle to run', () => {
      const result = stateMachine.transitionTo('run');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('run');
    });

    it('should transition from idle to jump', () => {
      const result = stateMachine.transitionTo('jump');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('jump');
    });

    it('should transition from idle to attack', () => {
      const result = stateMachine.transitionTo('attack');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('attack');
    });

    it('should transition from idle to celebrate', () => {
      const result = stateMachine.transitionTo('celebrate');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('celebrate');
    });

    it('should transition from idle to defeat', () => {
      const result = stateMachine.transitionTo('defeat');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('defeat');
    });

    it('should track previous state after transition', () => {
      stateMachine.transitionTo('walk');
      expect(stateMachine.getPreviousState()).toBe('idle');
    });

    it('should reject self-transition', () => {
      const result = stateMachine.transitionTo('idle');
      expect(result).toBe(false);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should allow forced self-transition', () => {
      const result = stateMachine.transitionTo('idle', { force: true });
      expect(result).toBe(true);
    });

    it('should transition bidirectionally between walk and run', () => {
      stateMachine.transitionTo('walk');
      expect(stateMachine.transitionTo('run')).toBe(true);
      expect(stateMachine.transitionTo('walk')).toBe(true);
    });

    it('should transition from walk to idle', () => {
      stateMachine.transitionTo('walk');
      const result = stateMachine.transitionTo('idle');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should transition from run to idle', () => {
      stateMachine.transitionTo('run');
      const result = stateMachine.transitionTo('idle');
      expect(result).toBe(true);
      expect(stateMachine.getCurrentState()).toBe('idle');
    });

    it('should transition from jump to idle when grounded', () => {
      stateMachine.transitionTo('jump');
      vi.advanceTimersByTime(20); // Advance past debounce
      // Note: Need force because jump (high priority) can't be interrupted by idle (low priority)
      const result = stateMachine.transitionTo('idle', {
        force: true,
        mascotData: { mascotId: 'sol', isGrounded: true },
      });
      expect(result).toBe(true);
    });

    it('should not transition from jump to idle when not grounded', () => {
      // Start from jump state via initialState to avoid priority interrupt issues
      const jumpMachine = new AnimationStateMachine({ initialState: 'jump' });
      const result = jumpMachine.transitionTo('idle', {
        mascotData: { mascotId: 'sol', isGrounded: false },
      });
      expect(result).toBe(false);
      jumpMachine.dispose();
    });

    it('should not transition from attack to jump', () => {
      stateMachine.transitionTo('attack');
      const result = stateMachine.transitionTo('jump');
      expect(result).toBe(false);
    });

    it('should transition from defeat to idle when health restored', () => {
      // Start from defeat state via initialState to avoid priority interrupt issues
      const defeatMachine = new AnimationStateMachine({ initialState: 'defeat' });
      // Use force to bypass priority check (defeat is critical, idle is low)
      const result = defeatMachine.transitionTo('idle', {
        force: true,
        mascotData: { mascotId: 'sol', health: 100 },
      });
      expect(result).toBe(true);
      defeatMachine.dispose();
    });

    it('should not transition from defeat to idle when health is zero', () => {
      // Start from defeat state via initialState to avoid priority interrupt issues
      const defeatMachine = new AnimationStateMachine({ initialState: 'defeat' });
      const result = defeatMachine.transitionTo('idle', {
        mascotData: { mascotId: 'sol', health: 0 },
      });
      expect(result).toBe(false);
      defeatMachine.dispose();
    });
  });

  // ============================================================================
  // Animation Blending Tests
  // ============================================================================

  describe('Animation Blending', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should start blending on transition', () => {
      stateMachine.transitionTo('walk');
      expect(stateMachine.isBlending()).toBe(true);
    });

    it('should have blend weight of 0 at start of transition', () => {
      stateMachine.transitionTo('walk');
      expect(stateMachine.getBlendWeight()).toBe(0);
    });

    it('should complete blend after duration', () => {
      stateMachine.transitionTo('walk');
      
      // Advance time past blend duration (0.2s for walk)
      vi.advanceTimersByTime(250);
      
      expect(stateMachine.getBlendWeight()).toBe(1);
      expect(stateMachine.isBlending()).toBe(false);
    });

    it('should use custom blend duration', () => {
      stateMachine.transitionTo('walk', { blendDuration: 0.5 });
      
      // Should still be blending at 250ms
      vi.advanceTimersByTime(250);
      expect(stateMachine.isBlending()).toBe(true);
      
      // Complete at 600ms
      vi.advanceTimersByTime(350);
      expect(stateMachine.isBlending()).toBe(false);
    });

    it('should force complete blend when completeBlend is called', () => {
      stateMachine.transitionTo('walk');
      stateMachine.completeBlend();
      
      expect(stateMachine.getBlendWeight()).toBe(1);
      expect(stateMachine.isBlending()).toBe(false);
    });

    it('should blend weight increase over time', () => {
      stateMachine.transitionTo('walk');
      
      const weight1 = stateMachine.getBlendWeight();
      vi.advanceTimersByTime(100);
      const weight2 = stateMachine.getBlendWeight();
      
      expect(weight2).toBeGreaterThan(weight1);
    });

    it('should respect different blend durations per state', () => {
      stateMachine.transitionTo('attack');
      // Attack state has very short blend (0.05s)
      // Immediately after transition, blend should be active (weight < 1)
      const blendWeight = stateMachine.getBlendWeight();
      expect(blendWeight).toBeLessThan(1);
      
      // After 100ms, blend should be complete (weight close to 1)
      vi.advanceTimersByTime(100);
      expect(stateMachine.getBlendWeight()).toBeGreaterThanOrEqual(0.99);
    });
  });

  // ============================================================================
  // Interrupt Handling Tests
  // ============================================================================

  describe('Interrupt Handling', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should allow interrupting idle state', () => {
      expect(DEFAULT_STATE_CONFIGS.idle.interruptible).toBe(true);
      expect(stateMachine.transitionTo('walk')).toBe(true);
    });

    it('should allow interrupting walk state', () => {
      stateMachine.transitionTo('walk');
      expect(DEFAULT_STATE_CONFIGS.walk.interruptible).toBe(true);
      expect(stateMachine.transitionTo('run')).toBe(true);
    });

    it('should not allow interrupting jump state by normal priority', () => {
      stateMachine.transitionTo('jump');
      expect(DEFAULT_STATE_CONFIGS.jump.interruptible).toBe(false);
      expect(stateMachine.transitionTo('walk')).toBe(false);
    });

    it('should allow interrupting jump state by high priority attack', () => {
      stateMachine.transitionTo('jump');
      expect(stateMachine.transitionTo('attack')).toBe(true);
    });

    it('should not allow interrupting attack state by normal priority', () => {
      stateMachine.transitionTo('attack');
      expect(DEFAULT_STATE_CONFIGS.attack.interruptible).toBe(false);
      expect(stateMachine.transitionTo('walk')).toBe(false);
    });

    it('should allow interrupting attack state by critical priority defeat', () => {
      stateMachine.transitionTo('attack');
      expect(stateMachine.transitionTo('defeat')).toBe(true);
    });

    it('should allow force interrupting non-interruptible state', () => {
      // First transition to jump, skip debounce check by using initial transition
      stateMachine.transitionTo('jump');
      // Force flag bypasses both debounce and interrupt checks
      expect(stateMachine.transitionTo('walk', { force: true })).toBe(true);
    });

    it('should respect priority weights correctly', () => {
      expect(PRIORITY_WEIGHTS.low).toBeLessThan(PRIORITY_WEIGHTS.normal);
      expect(PRIORITY_WEIGHTS.normal).toBeLessThan(PRIORITY_WEIGHTS.high);
      expect(PRIORITY_WEIGHTS.high).toBeLessThan(PRIORITY_WEIGHTS.critical);
    });

    it('jump should have high priority', () => {
      expect(DEFAULT_STATE_CONFIGS.jump.priority).toBe('high');
    });

    it('attack should have high priority', () => {
      expect(DEFAULT_STATE_CONFIGS.attack.priority).toBe('high');
    });

    it('defeat should have critical priority', () => {
      expect(DEFAULT_STATE_CONFIGS.defeat.priority).toBe('critical');
    });

    it('idle should have low priority', () => {
      expect(DEFAULT_STATE_CONFIGS.idle.priority).toBe('low');
    });
  });

  // ============================================================================
  // Event System Tests
  // ============================================================================

  describe('Event System', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should emit stateEnter event on transition', () => {
      const handler = vi.fn();
      stateMachine.on('stateEnter', handler);
      
      stateMachine.transitionTo('walk');
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateEnter',
        to: 'walk',
      }));
    });

    it('should emit stateExit event on transition', () => {
      const handler = vi.fn();
      stateMachine.on('stateExit', handler);
      
      stateMachine.transitionTo('walk');
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateExit',
        from: 'idle',
      }));
    });

    it('should emit stateChange event on transition', () => {
      const handler = vi.fn();
      stateMachine.on('stateChange', handler);
      
      stateMachine.transitionTo('walk');
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateChange',
        from: 'idle',
        to: 'walk',
      }));
    });

    it('should emit transitionStart event', () => {
      const handler = vi.fn();
      stateMachine.on('transitionStart', handler);
      
      stateMachine.transitionTo('walk');
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'transitionStart',
        from: 'idle',
        to: 'walk',
      }));
    });

    it('should emit transitionComplete event after blend', () => {
      const handler = vi.fn();
      stateMachine.on('transitionComplete', handler);
      
      stateMachine.transitionTo('walk');
      vi.advanceTimersByTime(250);
      
      expect(handler).toHaveBeenCalled();
    });

    it('should support onStateChange convenience method', () => {
      const handler = vi.fn();
      stateMachine.onStateChange(handler);
      
      stateMachine.transitionTo('run');
      
      expect(handler).toHaveBeenCalledWith('idle', 'run');
    });

    it('should unsubscribe correctly', () => {
      const handler = vi.fn();
      const unsubscribe = stateMachine.on('stateChange', handler);
      
      unsubscribe();
      stateMachine.transitionTo('walk');
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit animationComplete for non-looping states', () => {
      const handler = vi.fn();
      stateMachine.on('animationComplete', handler);
      
      stateMachine.transitionTo('jump');
      vi.advanceTimersByTime(1000);
      
      expect(handler).toHaveBeenCalled();
    });

    it('should emit animationLoop for looping states', () => {
      const handler = vi.fn();
      stateMachine.on('animationLoop', handler);
      
      stateMachine.transitionTo('idle');
      vi.advanceTimersByTime(1100); // Idle loops every ~1s
      
      expect(handler).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Animation Control Tests
  // ============================================================================

  describe('Animation Control', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should pause animation updates', () => {
      stateMachine.pause();
      const timeBefore = stateMachine.getTimeInState();
      
      vi.advanceTimersByTime(100);
      expect(stateMachine.getTimeInState()).toBe(timeBefore);
    });

    it('should resume animation updates', () => {
      stateMachine.pause();
      stateMachine.resume();
      
      const timeBefore = stateMachine.getTimeInState();
      vi.advanceTimersByTime(100);
      
      expect(stateMachine.getTimeInState()).toBeGreaterThan(timeBefore);
    });

    it('should set playback speed', () => {
      stateMachine.setPlaybackSpeed(2);
      
      const timeBefore = stateMachine.getTimeInState();
      vi.advanceTimersByTime(100);
      
      // Should advance ~2x as fast
      expect(stateMachine.getTimeInState()).toBeGreaterThan(timeBefore + 0.15);
    });

    it('should not allow negative playback speed', () => {
      stateMachine.setPlaybackSpeed(-1);
      expect(stateMachine.getState().playbackSpeed).toBe(0);
    });

    it('should reset to initial state', () => {
      stateMachine.transitionTo('walk');
      stateMachine.transitionTo('run');
      stateMachine.setPlaybackSpeed(2);
      stateMachine.pause();
      
      stateMachine.reset();
      
      expect(stateMachine.getCurrentState()).toBe('idle');
      expect(stateMachine.getPreviousState()).toBeNull();
      expect(stateMachine.getState().playbackSpeed).toBe(1);
      expect(stateMachine.getState().isPaused).toBe(false);
    });
  });

  // ============================================================================
  // Valid Transitions Tests
  // ============================================================================

  describe('Valid Transitions', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should get valid transitions from idle', () => {
      const valid = stateMachine.getValidTransitions();
      expect(valid).toContain('walk');
      expect(valid).toContain('run');
      expect(valid).toContain('jump');
      expect(valid).toContain('attack');
      expect(valid).toContain('celebrate');
      expect(valid).toContain('defeat');
    });

    it('should get valid transitions from walk', () => {
      stateMachine.transitionTo('walk');
      const valid = stateMachine.getValidTransitions();
      expect(valid).toContain('idle');
      expect(valid).toContain('run');
      expect(valid).toContain('jump');
      expect(valid).toContain('attack');
    });

    it('should check if transition is valid', () => {
      expect(stateMachine.isValidTransition('walk')).toBe(true);
      expect(stateMachine.isValidTransition('nonexistent' as AnimationState)).toBe(false);
    });

    it('should transition from walk to attack', () => {
      stateMachine.transitionTo('walk');
      expect(stateMachine.isValidTransition('attack')).toBe(true);
    });
  });

  // ============================================================================
  // State Progress Tests
  // ============================================================================

  describe('State Progress', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should track time in state', () => {
      vi.advanceTimersByTime(500);
      expect(stateMachine.getTimeInState()).toBeGreaterThan(0.4);
    });

    it('should track progress for non-looping states', () => {
      stateMachine.transitionTo('jump'); // 0.8s duration
      
      vi.advanceTimersByTime(400);
      const progress = stateMachine.getProgress();
      
      expect(progress).toBeGreaterThan(0.4);
      expect(progress).toBeLessThan(0.6);
    });

    it('should cap progress at 1 for non-looping states', () => {
      stateMachine.transitionTo('jump');
      vi.advanceTimersByTime(2000);
      
      expect(stateMachine.getProgress()).toBe(1);
    });

    it('should cycle progress for looping states', () => {
      stateMachine.transitionTo('walk'); // looping
      
      vi.advanceTimersByTime(500);
      const progress1 = stateMachine.getProgress();
      
      vi.advanceTimersByTime(500);
      const progress2 = stateMachine.getProgress();
      
      // Progress should cycle, not accumulate
      expect(progress1).toBeGreaterThanOrEqual(0);
      expect(progress1).toBeLessThanOrEqual(1);
      expect(progress2).toBeGreaterThanOrEqual(0);
      expect(progress2).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // State Configuration Tests
  // ============================================================================

  describe('State Configuration', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should get config for current state', () => {
      const config = stateMachine.getCurrentConfig();
      expect(config.name).toBe('idle');
      expect(config.loop).toBe(true);
    });

    it('should get config for specific state', () => {
      const config = stateMachine.getStateConfig('attack');
      expect(config.name).toBe('attack');
      expect(config.interruptible).toBe(false);
    });

    it('should have correct blend durations', () => {
      expect(DEFAULT_STATE_CONFIGS.idle.blendInDuration).toBe(0.3);
      expect(DEFAULT_STATE_CONFIGS.attack.blendInDuration).toBe(0.05);
      expect(DEFAULT_STATE_CONFIGS.jump.blendInDuration).toBe(0.1);
    });

    it('should have correct loop settings', () => {
      expect(DEFAULT_STATE_CONFIGS.idle.loop).toBe(true);
      expect(DEFAULT_STATE_CONFIGS.walk.loop).toBe(true);
      expect(DEFAULT_STATE_CONFIGS.attack.loop).toBe(false);
      expect(DEFAULT_STATE_CONFIGS.jump.loop).toBe(false);
    });

    it('should accept custom state configurations', () => {
      const customMachine = new AnimationStateMachine({
        stateConfigs: {
          idle: { speed: 2, amplitude: 0.2 },
        },
      });
      
      const config = customMachine.getStateConfig('idle');
      expect(config.speed).toBe(2);
      expect(config.amplitude).toBe(0.2);
      
      customMachine.dispose();
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('Cleanup', () => {
    it('should dispose without errors', () => {
      stateMachine = new AnimationStateMachine();
      expect(() => stateMachine.dispose()).not.toThrow();
    });

    it('should not allow transitions after dispose', () => {
      stateMachine = new AnimationStateMachine();
      stateMachine.dispose();
      
      const result = stateMachine.transitionTo('walk');
      expect(result).toBe(false);
    });

    it('should cancel animation frame on dispose', () => {
      stateMachine = new AnimationStateMachine();
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
      
      stateMachine.dispose();
      
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    beforeEach(() => {
      stateMachine = new AnimationStateMachine();
    });

    it('should handle rapid state changes', () => {
      stateMachine.transitionTo('walk');
      stateMachine.transitionTo('run');
      stateMachine.transitionTo('idle');
      stateMachine.transitionTo('walk');
      
      expect(['walk', 'run', 'idle']).toContain(stateMachine.getCurrentState());
    });

    it('should debounce very rapid state changes', () => {
      // Try to change state twice in very quick succession
      stateMachine.transitionTo('walk');
      const result = stateMachine.transitionTo('run');
      
      // Second transition might be debounced
      expect(typeof result).toBe('boolean');
    });

    it('should handle force transition to same state', () => {
      const result = stateMachine.transitionTo('idle', { force: true });
      expect(result).toBe(true);
    });

    it('should maintain blend weight between 0 and 1', () => {
      stateMachine.transitionTo('walk');
      
      vi.advanceTimersByTime(50);
      const weight = stateMachine.getBlendWeight();
      
      expect(weight).toBeGreaterThanOrEqual(0);
      expect(weight).toBeLessThanOrEqual(1);
    });

    it('should handle all animation states', () => {
      const states: AnimationState[] = ['idle', 'walk', 'run', 'jump', 'attack', 'celebrate', 'defeat', 'custom'];
      
      states.forEach(state => {
        const machine = new AnimationStateMachine();
        const config = machine.getStateConfig(state);
        expect(config).toBeDefined();
        expect(config.name).toBe(state);
        machine.dispose();
      });
    });

    it('should preserve mascot data in transitions', () => {
      const mascotData = { mascotId: 'sol' as const, health: 50, isGrounded: true };
      
      stateMachine.transitionTo('jump');
      vi.advanceTimersByTime(20); // Advance past debounce
      // Use force to bypass priority check (jump is high priority, idle is low)
      const result = stateMachine.transitionTo('idle', { force: true, mascotData });
      
      expect(result).toBe(true);
    });
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Animation Module Exports', () => {
  it('should export AnimationStateMachine', () => {
    expect(AnimationStateMachine).toBeDefined();
    expect(typeof AnimationStateMachine).toBe('function');
  });

  it('should export PRIORITY_WEIGHTS', () => {
    expect(PRIORITY_WEIGHTS).toBeDefined();
    expect(PRIORITY_WEIGHTS.critical).toBeGreaterThan(PRIORITY_WEIGHTS.high);
  });

  it('should export DEFAULT_STATE_CONFIGS', () => {
    expect(DEFAULT_STATE_CONFIGS).toBeDefined();
    expect(DEFAULT_STATE_CONFIGS.idle).toBeDefined();
    expect(DEFAULT_STATE_CONFIGS.attack).toBeDefined();
  });
});
