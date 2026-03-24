/**
 * Animation Bridge
 * 
 * [Ver001.000] - Framer Motion to Three.js animation bridge
 * 
 * Features:
 * - Shared animation state between React and Three.js
 * - Framer Motion integration for coordinated animations
 * - Transition coordination
 * - Animation synchronization
 */

import { useRef, useCallback, useSyncExternalStore } from 'react';
import type { SpringOptions, Transition } from 'framer-motion';
import * as THREE from 'three';

// ============================================
// Types
// ============================================

export interface AnimationBridgeState {
  /** Whether an animation is currently playing */
  isAnimating: boolean;
  /** Current animation progress (0-1) */
  progress: number;
  /** Animation name/identifier */
  animationName: string;
  /** Animation value (for spring physics) */
  value: number;
  /** Timestamp of animation start */
  startTime: number;
  /** Timestamp of last update */
  lastUpdateTime: number;
  /** Target value for spring animations */
  targetValue: number;
  /** Whether animation is paused */
  isPaused: boolean;
}

export interface BridgeTransition {
  /** Duration in seconds */
  duration: number;
  /** Easing function or bezier */
  ease: [number, number, number, number] | ((t: number) => number);
  /** Delay before start */
  delay?: number;
  /** Repeat count */
  repeat?: number;
  /** Repeat type */
  repeatType?: 'loop' | 'reverse' | 'mirror';
}

export interface SpringConfig extends SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
  restDelta?: number;
  restSpeed?: number;
}

export interface AnimationBridgeOptions {
  /** Initial value */
  initial?: number;
  /** Spring configuration */
  spring?: SpringConfig;
  /** Transition configuration */
  transition?: BridgeTransition;
  /** Sync interval in ms */
  syncInterval?: number;
}

export type AnimationBridgeListener = (state: AnimationBridgeState) => void;

export interface AnimationBridgeAPI {
  /** Get current state */
  getState: () => AnimationBridgeState;
  /** Set animation target */
  setTarget: (target: number, transition?: BridgeTransition) => void;
  /** Start animation */
  start: (name: string, from?: number, to?: number) => void;
  /** Pause animation */
  pause: () => void;
  /** Resume animation */
  resume: () => void;
  /** Stop animation */
  stop: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Subscribe to state changes */
  subscribe: (listener: AnimationBridgeListener) => () => void;
  /** Get value for Three.js */
  getThreeValue: () => number;
  /** Get interpolated vector */
  getLerpVector: (from: THREE.Vector3, to: THREE.Vector3) => THREE.Vector3;
  /** Get interpolated scale */
  getLerpScale: (from: number, to: number) => number;
  /** Check if animation is complete */
  isComplete: () => boolean;
}

// ============================================
// Easing Functions
// ============================================

const EASINGS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: (t: number) => {
    // Simplified spring approximation
    const damping = 0.8;
    const frequency = 10;
    return 1 - Math.exp(-damping * t) * Math.cos(frequency * t);
  },
};

// ============================================
// Spring Physics
// ============================================

class SpringPhysics {
  private currentValue: number;
  private targetValue: number;
  private velocity: number;
  private stiffness: number;
  private damping: number;
  private mass: number;
  private restDelta: number;
  private restSpeed: number;

  constructor(config: SpringConfig = {}) {
    this.currentValue = 0;
    this.targetValue = 0;
    this.velocity = config.velocity ?? 0;
    this.stiffness = config.stiffness ?? 100;
    this.damping = config.damping ?? 10;
    this.mass = config.mass ?? 1;
    this.restDelta = config.restDelta ?? 0.01;
    this.restSpeed = config.restSpeed ?? 0.01;
  }

  setTarget(target: number): void {
    this.targetValue = target;
  }

  update(deltaTime: number): boolean {
    // Spring force: F = -k * x
    const displacement = this.currentValue - this.targetValue;
    const springForce = -this.stiffness * displacement;
    
    // Damping force: F = -c * v
    const dampingForce = -this.damping * this.velocity;
    
    // Acceleration: a = F / m
    const acceleration = (springForce + dampingForce) / this.mass;
    
    // Update velocity and position
    this.velocity += acceleration * deltaTime;
    this.currentValue += this.velocity * deltaTime;
    
    // Check if at rest
    const isAtRest = 
      Math.abs(displacement) < this.restDelta &&
      Math.abs(this.velocity) < this.restSpeed;
    
    return isAtRest;
  }

  getValue(): number {
    return this.currentValue;
  }

  reset(value: number = 0): void {
    this.currentValue = value;
    this.targetValue = value;
    this.velocity = 0;
  }
}

// ============================================
// Animation Bridge Implementation
// ============================================

class AnimationBridge implements AnimationBridgeAPI {
  private state: AnimationBridgeState;
  private listeners: Set<AnimationBridgeListener>;
  private spring: SpringPhysics;
  private transition: BridgeTransition | null;
  private initialValue: number;
  private animationFrameId: number | null;
  private lastTime: number;

  constructor(options: AnimationBridgeOptions = {}) {
    this.initialValue = options.initial ?? 0;
    this.state = {
      isAnimating: false,
      progress: 0,
      animationName: '',
      value: this.initialValue,
      startTime: 0,
      lastUpdateTime: 0,
      targetValue: this.initialValue,
      isPaused: false,
    };
    this.listeners = new Set();
    this.spring = new SpringPhysics(options.spring);
    this.transition = options.transition ?? null;
    this.lastTime = 0;
    this.animationFrameId = null;

    // Start animation loop
    this.startLoop();
  }

  private startLoop(): void {
    const loop = (time: number) => {
      const deltaTime = (time - this.lastTime) / 1000;
      this.lastTime = time;

      if (this.state.isAnimating && !this.state.isPaused) {
        this.update(deltaTime);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private update(deltaTime: number): void {
    const now = performance.now();
    this.state.lastUpdateTime = now;

    if (this.transition) {
      // Transition-based animation
      const elapsed = (now - this.state.startTime) / 1000;
      const progress = Math.min(elapsed / this.transition.duration, 1);
      
      let easedProgress: number;
      if (Array.isArray(this.transition.ease)) {
        // Bezier easing
        easedProgress = this.cubicBezier(this.transition.ease, progress);
      } else {
        easedProgress = this.transition.ease(progress);
      }

      this.state.progress = progress;
      this.state.value = this.lerp(
        this.initialValue,
        this.state.targetValue,
        easedProgress
      );

      if (progress >= 1) {
        this.state.isAnimating = false;
        this.state.value = this.state.targetValue;
        this.notifyListeners();
        return;
      }
    } else {
      // Spring-based animation
      const isAtRest = this.spring.update(deltaTime);
      this.state.value = this.spring.getValue();
      this.state.progress = this.state.value;

      if (isAtRest) {
        this.state.isAnimating = false;
        this.notifyListeners();
        return;
      }
    }

    this.notifyListeners();
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private cubicBezier([p0, p1, p2, p3]: [number, number, number, number], t: number): number {
    // Simplified cubic bezier
    const cx = 3 * p0;
    const bx = 3 * (p2 - p0) - cx;
    const ax = 1 - cx - bx;
    
    return ((ax * t + bx) * t + cx) * t;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  getState(): AnimationBridgeState {
    return { ...this.state };
  }

  setTarget(target: number, transition?: BridgeTransition): void {
    this.state.targetValue = target;
    this.state.startTime = performance.now();
    this.state.isAnimating = true;
    this.state.isPaused = false;
    this.initialValue = this.state.value;

    if (transition) {
      this.transition = transition;
      this.spring.setTarget(target);
    } else {
      this.transition = null;
      this.spring.setTarget(target);
      this.spring.reset(this.state.value);
    }

    this.notifyListeners();
  }

  start(name: string, from: number = this.state.value, to: number = this.state.targetValue): void {
    this.state.animationName = name;
    this.state.value = from;
    this.initialValue = from;
    this.state.targetValue = to;
    this.state.startTime = performance.now();
    this.state.isAnimating = true;
    this.state.isPaused = false;
    this.state.progress = 0;

    this.spring.reset(from);
    this.spring.setTarget(to);

    this.notifyListeners();
  }

  pause(): void {
    this.state.isPaused = true;
    this.notifyListeners();
  }

  resume(): void {
    if (this.state.isAnimating) {
      this.state.isPaused = false;
      this.state.startTime = performance.now() - this.state.progress * (this.transition?.duration ?? 1) * 1000;
      this.notifyListeners();
    }
  }

  stop(): void {
    this.state.isAnimating = false;
    this.state.isPaused = false;
    this.state.progress = 1;
    this.state.value = this.state.targetValue;
    this.notifyListeners();
  }

  reset(): void {
    this.state.isAnimating = false;
    this.state.isPaused = false;
    this.state.progress = 0;
    this.state.value = this.initialValue;
    this.state.targetValue = this.initialValue;
    this.spring.reset(this.initialValue);
    this.notifyListeners();
  }

  subscribe(listener: AnimationBridgeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getThreeValue(): number {
    return this.state.value;
  }

  getLerpVector(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
    const t = this.state.value;
    return new THREE.Vector3(
      this.lerp(from.x, to.x, t),
      this.lerp(from.y, to.y, t),
      this.lerp(from.z, to.z, t)
    );
  }

  getLerpScale(from: number, to: number): number {
    return this.lerp(from, to, this.state.value);
  }

  isComplete(): boolean {
    return !this.state.isAnimating || this.state.progress >= 1;
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.listeners.clear();
  }
}

// ============================================
// React Hooks
// ============================================

// Global bridge instance (can be shared across components)
let globalBridge: AnimationBridge | null = null;

export function getGlobalAnimationBridge(): AnimationBridgeAPI {
  if (!globalBridge) {
    globalBridge = new AnimationBridge();
  }
  return globalBridge;
}

export function createAnimationBridge(options?: AnimationBridgeOptions): AnimationBridgeAPI {
  return new AnimationBridge(options);
}

/**
 * Hook to use the animation bridge in React components
 */
export function useAnimationBridge(options?: AnimationBridgeOptions): AnimationBridgeAPI {
  const bridgeRef = useRef<AnimationBridgeAPI | null>(null);

  if (!bridgeRef.current) {
    bridgeRef.current = options ? createAnimationBridge(options) : getGlobalAnimationBridge();
  }

  return bridgeRef.current;
}

/**
 * Hook to subscribe to animation state in React components
 */
export function useAnimationState(bridge?: AnimationBridgeAPI): AnimationBridgeState {
  const targetBridge = bridge || getGlobalAnimationBridge();
  
  return useSyncExternalStore(
    (callback) => targetBridge.subscribe(callback),
    () => targetBridge.getState()
  );
}

/**
 * Hook to coordinate Framer Motion with Three.js
 */
export function useCoordinatedAnimation(
  framerMotionValue: { get: () => number },
  bridge?: AnimationBridgeAPI
): number {
  const targetBridge = bridge || getGlobalAnimationBridge();
  
  // Sync Framer Motion value to bridge
  const syncValue = useCallback(() => {
    const value = framerMotionValue.get();
    targetBridge.setTarget(value, { duration: 0.016, ease: EASINGS.linear });
  }, [framerMotionValue, targetBridge]);

  // Return the bridge value (which is optimized for Three.js)
  return useAnimationState(targetBridge).value;
}

// ============================================
// Utility Functions
// ============================================

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVector(v1: THREE.Vector3, v2: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(
    lerp(v1.x, v2.x, t),
    lerp(v1.y, v2.y, t),
    lerp(v1.z, v2.z, t)
  );
}

export function lerpColor(c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Export easing functions
export { EASINGS };
export type { AnimationBridge };
export default AnimationBridge;
