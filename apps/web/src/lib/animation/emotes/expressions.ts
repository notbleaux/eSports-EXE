// @ts-nocheck
/** [Ver001.000]
 * Facial Expressions System
 * =========================
 * Comprehensive facial expression system for mascots.
 * Provides expression blending, eye/mouth control, and automatic blinking.
 * 
 * Features:
 * - Happy, sad, angry, surprised expressions
 * - Smooth expression blending
 * - Independent eye/mouth control
 * - Automatic blinking system
 * - Expression intensity modulation
 */

import type { FacialExpressionType } from './library';

// ============================================================================
// Types
// ============================================================================

export interface EyeState {
  open: number;        // 0 = closed, 1 = fully open
  lookDirection: { x: number; y: number }; // -1 to 1
  pupilSize: number;   // 0 to 1
  squint: number;      // 0 to 1
}

export interface MouthState {
  open: number;        // 0 = closed, 1 = fully open
  smile: number;       // -1 = frown, 0 = neutral, 1 = smile
  width: number;       // 0 to 1
  teethVisible: boolean;
  tongueVisible: boolean;
}

export interface EyebrowState {
  height: number;      // -1 = lowered, 0 = neutral, 1 = raised
  angle: number;       // -1 = angry (inward), 0 = neutral, 1 = surprised (outward)
  furrow: number;      // 0 to 1
}

export interface CheekState {
  blush: number;       // 0 to 1
  puff: number;        // 0 to 1
}

export interface FacialState {
  expression: FacialExpressionType;
  intensity: number;   // 0 to 1
  eyes: EyeState;
  mouth: MouthState;
  eyebrows: EyebrowState;
  cheeks: CheekState;
}

export interface ExpressionBlend {
  from: FacialExpressionType;
  to: FacialExpressionType;
  progress: number;    // 0 to 1
  duration: number;    // seconds
}

export interface BlinkConfig {
  enabled: boolean;
  minInterval: number; // minimum seconds between blinks
  maxInterval: number; // maximum seconds between blinks
  duration: number;    // blink duration in seconds
  doubleBlinkChance: number; // 0 to 1 chance of double blink
}

export interface ExpressionControllerOptions {
  defaultExpression?: FacialExpressionType;
  defaultIntensity?: number;
  blinkConfig?: Partial<BlinkConfig>;
  blendDuration?: number;
  debug?: boolean;
}

export type ExpressionEventType = 
  | 'expressionChange'
  | 'expressionBlendStart'
  | 'expressionBlendComplete'
  | 'blinkStart'
  | 'blinkEnd';

export interface ExpressionEvent {
  type: ExpressionEventType;
  timestamp: number;
  expression?: FacialExpressionType;
  data?: Record<string, unknown>;
}

export type ExpressionEventHandler = (event: ExpressionEvent) => void;

// ============================================================================
// Expression Presets
// ============================================================================

export const EXPRESSION_PRESETS: Record<FacialExpressionType, FacialState> = {
  neutral: {
    expression: 'neutral',
    intensity: 0,
    eyes: {
      open: 1,
      lookDirection: { x: 0, y: 0 },
      pupilSize: 0.5,
      squint: 0,
    },
    mouth: {
      open: 0,
      smile: 0,
      width: 0.5,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0,
      angle: 0,
      furrow: 0,
    },
    cheeks: {
      blush: 0,
      puff: 0,
    },
  },

  happy: {
    expression: 'happy',
    intensity: 0.8,
    eyes: {
      open: 0.85,
      lookDirection: { x: 0, y: 0 },
      pupilSize: 0.5,
      squint: 0.3,
    },
    mouth: {
      open: 0.2,
      smile: 0.9,
      width: 0.7,
      teethVisible: true,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0.2,
      angle: 0,
      furrow: 0,
    },
    cheeks: {
      blush: 0.1,
      puff: 0.1,
    },
  },

  sad: {
    expression: 'sad',
    intensity: 0.7,
    eyes: {
      open: 0.7,
      lookDirection: { x: 0, y: 0.3 },
      pupilSize: 0.4,
      squint: 0,
    },
    mouth: {
      open: 0,
      smile: -0.6,
      width: 0.4,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: -0.2,
      angle: -0.3,
      furrow: 0.1,
    },
    cheeks: {
      blush: 0,
      puff: 0,
    },
  },

  angry: {
    expression: 'angry',
    intensity: 0.9,
    eyes: {
      open: 0.9,
      lookDirection: { x: 0, y: 0 },
      pupilSize: 0.3,
      squint: 0.5,
    },
    mouth: {
      open: 0.3,
      smile: -0.8,
      width: 0.6,
      teethVisible: true,
      tongueVisible: false,
    },
    eyebrows: {
      height: -0.3,
      angle: -0.8,
      furrow: 0.8,
    },
    cheeks: {
      blush: 0.3,
      puff: 0.2,
    },
  },

  surprised: {
    expression: 'surprised',
    intensity: 0.9,
    eyes: {
      open: 1,
      lookDirection: { x: 0, y: -0.2 },
      pupilSize: 0.6,
      squint: 0,
    },
    mouth: {
      open: 0.8,
      smile: 0,
      width: 0.5,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0.8,
      angle: 0.5,
      furrow: 0,
    },
    cheeks: {
      blush: 0.1,
      puff: 0,
    },
  },

  excited: {
    expression: 'excited',
    intensity: 1,
    eyes: {
      open: 0.95,
      lookDirection: { x: 0, y: -0.1 },
      pupilSize: 0.6,
      squint: 0.1,
    },
    mouth: {
      open: 0.6,
      smile: 1,
      width: 0.8,
      teethVisible: true,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0.5,
      angle: 0.2,
      furrow: 0,
    },
    cheeks: {
      blush: 0.2,
      puff: 0,
    },
  },

  confident: {
    expression: 'confident',
    intensity: 0.7,
    eyes: {
      open: 0.8,
      lookDirection: { x: 0, y: 0.1 },
      pupilSize: 0.4,
      squint: 0.2,
    },
    mouth: {
      open: 0.1,
      smile: 0.5,
      width: 0.6,
      teethVisible: true,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0,
      angle: -0.2,
      furrow: 0.1,
    },
    cheeks: {
      blush: 0,
      puff: 0,
    },
  },

  loving: {
    expression: 'loving',
    intensity: 0.8,
    eyes: {
      open: 0.7,
      lookDirection: { x: 0, y: 0.2 },
      pupilSize: 0.7,
      squint: 0.4,
    },
    mouth: {
      open: 0,
      smile: 0.7,
      width: 0.5,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0.3,
      angle: 0,
      furrow: 0,
    },
    cheeks: {
      blush: 0.6,
      puff: 0.1,
    },
  },

  suspicious: {
    expression: 'suspicious',
    intensity: 0.6,
    eyes: {
      open: 0.75,
      lookDirection: { x: 0.3, y: 0 },
      pupilSize: 0.3,
      squint: 0.4,
    },
    mouth: {
      open: 0,
      smile: -0.2,
      width: 0.5,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: -0.1,
      angle: -0.5,
      furrow: 0.4,
    },
    cheeks: {
      blush: 0,
      puff: 0,
    },
  },

  sleepy: {
    expression: 'sleepy',
    intensity: 0.5,
    eyes: {
      open: 0.4,
      lookDirection: { x: 0, y: 0.5 },
      pupilSize: 0.3,
      squint: 0.2,
    },
    mouth: {
      open: 0.1,
      smile: 0,
      width: 0.5,
      teethVisible: false,
      tongueVisible: false,
    },
    eyebrows: {
      height: 0,
      angle: 0,
      furrow: 0,
    },
    cheeks: {
      blush: 0.1,
      puff: 0.2,
    },
  },
};

// ============================================================================
// Expression Controller
// ============================================================================

export class ExpressionController {
  private currentState: FacialState;
  private targetState: FacialState;
  private blend: ExpressionBlend | null = null;
  private blinkConfig: BlinkConfig;
  private blinkState: {
    isBlinking: boolean;
    blinkProgress: number;
    nextBlinkTime: number;
    blinkStartTime: number;
    isDoubleBlink: boolean;
    doubleBlinkPhase: number;
  };
  private listeners: Map<ExpressionEventType, Set<ExpressionEventHandler>> = new Map();
  private animationFrameId: number | null = null;
  private isDisposed = false;
  private options: Required<ExpressionControllerOptions>;
  private lastUpdateTime = 0;

  constructor(options: ExpressionControllerOptions = {}) {
    this.options = {
      defaultExpression: 'neutral',
      defaultIntensity: 0,
      blinkConfig: {},
      blendDuration: 0.3,
      debug: false,
      ...options,
    };

    this.blinkConfig = {
      enabled: true,
      minInterval: 2,
      maxInterval: 6,
      duration: 0.15,
      doubleBlinkChance: 0.1,
      ...this.options.blinkConfig,
    };

    this.currentState = this.createStateFromPreset(
      this.options.defaultExpression,
      this.options.defaultIntensity
    );
    this.targetState = { ...this.currentState };

    this.blinkState = {
      isBlinking: false,
      blinkProgress: 0,
      nextBlinkTime: this.calculateNextBlinkTime(),
      blinkStartTime: 0,
      isDoubleBlink: false,
      doubleBlinkPhase: 0,
    };

    this.startUpdateLoop();
    this.log('debug', 'Expression controller initialized');
  }

  // ============================================================================
  // Expression Control
  // ============================================================================

  /**
   * Set expression immediately or with blend
   */
  setExpression(expression: FacialExpressionType, intensity?: number, blendDuration?: number): void {
    if (this.isDisposed) return;

    const targetIntensity = intensity ?? EXPRESSION_PRESETS[expression].intensity;
    this.targetState = this.createStateFromPreset(expression, targetIntensity);

    // Start blend
    this.blend = {
      from: this.currentState.expression,
      to: expression,
      progress: 0,
      duration: blendDuration ?? this.options.blendDuration,
    };

    // Update current expression and intensity immediately
    this.currentState.expression = expression;
    this.currentState.intensity = targetIntensity;

    this.emit('expressionChange', expression);
    this.emit('expressionBlendStart', expression);
    this.log('debug', `Starting blend from ${this.blend.from} to ${expression}`);
  }

  /**
   * Get current expression
   */
  getExpression(): FacialExpressionType {
    return this.currentState.expression;
  }

  /**
   * Get current facial state
   */
  getState(): FacialState {
    return { ...this.currentState };
  }

  /**
   * Get target expression
   */
  getTargetExpression(): FacialExpressionType {
    return this.targetState.expression;
  }

  /**
   * Check if currently blending
   */
  isBlending(): boolean {
    return this.blend !== null && this.blend.progress < 1;
  }

  // ============================================================================
  // Eye Control
  // ============================================================================

  /**
   * Set eye openness
   */
  setEyeOpenness(open: number): void {
    this.currentState.eyes.open = Math.max(0, Math.min(1, open));
  }

  /**
   * Set look direction
   */
  setLookDirection(x: number, y: number): void {
    this.currentState.eyes.lookDirection = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }

  /**
   * Set pupil size
   */
  setPupilSize(size: number): void {
    this.currentState.eyes.pupilSize = Math.max(0, Math.min(1, size));
  }

  /**
   * Set eye squint
   */
  setEyeSquint(squint: number): void {
    this.currentState.eyes.squint = Math.max(0, Math.min(1, squint));
  }

  // ============================================================================
  // Mouth Control
  // ============================================================================

  /**
   * Set mouth openness
   */
  setMouthOpenness(open: number): void {
    this.currentState.mouth.open = Math.max(0, Math.min(1, open));
  }

  /**
   * Set smile/frown
   */
  setSmile(amount: number): void {
    this.currentState.mouth.smile = Math.max(-1, Math.min(1, amount));
  }

  /**
   * Set mouth width
   */
  setMouthWidth(width: number): void {
    this.currentState.mouth.width = Math.max(0, Math.min(1, width));
  }

  /**
   * Show/hide teeth
   */
  setTeethVisible(visible: boolean): void {
    this.currentState.mouth.teethVisible = visible;
  }

  /**
   * Show/hide tongue
   */
  setTongueVisible(visible: boolean): void {
    this.currentState.mouth.tongueVisible = visible;
  }

  // ============================================================================
  // Eyebrow Control
  // ============================================================================

  /**
   * Set eyebrow height
   */
  setEyebrowHeight(height: number): void {
    this.currentState.eyebrows.height = Math.max(-1, Math.min(1, height));
  }

  /**
   * Set eyebrow angle
   */
  setEyebrowAngle(angle: number): void {
    this.currentState.eyebrows.angle = Math.max(-1, Math.min(1, angle));
  }

  /**
   * Set eyebrow furrow
   */
  setEyebrowFurrow(furrow: number): void {
    this.currentState.eyebrows.furrow = Math.max(0, Math.min(1, furrow));
  }

  // ============================================================================
  // Cheek Control
  // ============================================================================

  /**
   * Set blush amount
   */
  setBlush(amount: number): void {
    this.currentState.cheeks.blush = Math.max(0, Math.min(1, amount));
  }

  /**
   * Set cheek puff
   */
  setCheekPuff(puff: number): void {
    this.currentState.cheeks.puff = Math.max(0, Math.min(1, puff));
  }

  // ============================================================================
  // Blink System
  // ============================================================================

  /**
   * Configure blinking
   */
  configureBlink(config: Partial<BlinkConfig>): void {
    this.blinkConfig = { ...this.blinkConfig, ...config };
  }

  /**
   * Force a blink
   */
  blink(double = false): void {
    this.blinkState.isBlinking = true;
    this.blinkState.blinkProgress = 0;
    this.blinkState.blinkStartTime = performance.now();
    this.blinkState.isDoubleBlink = double;
    this.blinkState.doubleBlinkPhase = 0;
    this.emit('blinkStart', undefined, { isDouble: double });
  }

  /**
   * Check if currently blinking
   */
  isBlinking(): boolean {
    return this.blinkState.isBlinking;
  }

  /**
   * Calculate next blink time
   */
  private calculateNextBlinkTime(): number {
    const interval = this.blinkConfig.minInterval + 
      Math.random() * (this.blinkConfig.maxInterval - this.blinkConfig.minInterval);
    return performance.now() + (interval * 1000);
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    const update = (time: number) => {
      if (this.isDisposed) return;

      const deltaTime = (time - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = time;

      this.update(deltaTime);
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update expression state
   */
  private update(deltaTime: number): void {
    // Update blend
    if (this.blend) {
      this.blend.progress += deltaTime / this.blend.duration;
      
      if (this.blend.progress >= 1) {
        this.blend.progress = 1;
        this.currentState = { ...this.targetState };
        this.emit('expressionBlendComplete', this.targetState.expression);
        this.blend = null;
      } else {
        this.interpolateState(this.blend.progress);
      }
    }

    // Update blinking
    this.updateBlink(deltaTime);
  }

  /**
   * Update blink state
   */
  private updateBlink(deltaTime: number): void {
    if (!this.blinkConfig.enabled) return;

    const now = performance.now();

    if (this.blinkState.isBlinking) {
      // Update blink progress
      const blinkElapsed = (now - this.blinkState.blinkStartTime) / 1000;
      const halfDuration = this.blinkConfig.duration / 2;

      if (this.blinkState.isDoubleBlink && this.blinkState.doubleBlinkPhase < 2) {
        // Double blink: close, open, close, open
        const phaseDuration = this.blinkConfig.duration;
        const totalElapsed = blinkElapsed;
        
        if (totalElapsed < phaseDuration) {
          this.blinkState.blinkProgress = Math.min(1, totalElapsed / halfDuration);
          if (this.blinkState.blinkProgress >= 1) {
            this.blinkState.doubleBlinkPhase = 1;
          }
        } else if (totalElapsed < phaseDuration * 1.5) {
          this.blinkState.blinkProgress = Math.max(0, 1 - ((totalElapsed - phaseDuration) / (halfDuration * 0.5)));
        } else if (totalElapsed < phaseDuration * 2) {
          this.blinkState.blinkProgress = Math.min(1, (totalElapsed - phaseDuration * 1.5) / (halfDuration * 0.5));
          this.blinkState.doubleBlinkPhase = 2;
        } else {
          this.blinkState.blinkProgress = Math.max(0, 1 - ((totalElapsed - phaseDuration * 2) / halfDuration));
        }
      } else {
        // Single blink
        if (blinkElapsed < halfDuration) {
          // Closing
          this.blinkState.blinkProgress = Math.min(1, blinkElapsed / halfDuration);
        } else {
          // Opening
          this.blinkState.blinkProgress = Math.max(0, 1 - ((blinkElapsed - halfDuration) / halfDuration));
        }
      }

      // Apply blink to eye openness
      this.currentState.eyes.open = 1 - this.blinkState.blinkProgress;

      // End blink
      if (blinkElapsed >= (this.blinkState.isDoubleBlink ? this.blinkConfig.duration * 2.5 : this.blinkConfig.duration)) {
        this.blinkState.isBlinking = false;
        this.blinkState.blinkProgress = 0;
        this.blinkState.nextBlinkTime = this.calculateNextBlinkTime();
        this.emit('blinkEnd', undefined);
      }
    } else {
      // Check if it's time to blink
      if (now >= this.blinkState.nextBlinkTime) {
        const isDouble = Math.random() < this.blinkConfig.doubleBlinkChance;
        this.blink(isDouble);
      }
    }
  }

  /**
   * Interpolate between current and target state
   */
  private interpolateState(progress: number): void {
    const eased = this.easeInOutCubic(progress);

    this.currentState.intensity = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].intensity,
      this.targetState.intensity,
      eased
    );

    // Interpolate eyes
    this.currentState.eyes.open = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyes.open,
      this.targetState.eyes.open,
      eased
    );
    this.currentState.eyes.squint = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyes.squint,
      this.targetState.eyes.squint,
      eased
    );
    this.currentState.eyes.pupilSize = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyes.pupilSize,
      this.targetState.eyes.pupilSize,
      eased
    );

    // Interpolate mouth
    this.currentState.mouth.open = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].mouth.open,
      this.targetState.mouth.open,
      eased
    );
    this.currentState.mouth.smile = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].mouth.smile,
      this.targetState.mouth.smile,
      eased
    );

    // Interpolate eyebrows
    this.currentState.eyebrows.height = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyebrows.height,
      this.targetState.eyebrows.height,
      eased
    );
    this.currentState.eyebrows.angle = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyebrows.angle,
      this.targetState.eyebrows.angle,
      eased
    );
    this.currentState.eyebrows.furrow = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].eyebrows.furrow,
      this.targetState.eyebrows.furrow,
      eased
    );

    // Interpolate cheeks
    this.currentState.cheeks.blush = this.lerp(
      EXPRESSION_PRESETS[this.blend!.from].cheeks.blush,
      this.targetState.cheeks.blush,
      eased
    );
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Create a facial state from a preset
   */
  private createStateFromPreset(expression: FacialExpressionType, intensity: number): FacialState {
    const preset = EXPRESSION_PRESETS[expression];
    return {
      ...preset,
      intensity: intensity * preset.intensity,
      expression,
    };
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ease in-out cubic
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to expression events
   */
  on(event: ExpressionEventType, handler: ExpressionEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Emit an expression event
   */
  private emit(
    type: ExpressionEventType,
    expression?: FacialExpressionType,
    data?: Record<string, unknown>
  ): void {
    const event: ExpressionEvent = {
      type,
      timestamp: performance.now(),
      expression,
      data,
    };

    const handlers = this.listeners.get(type);
    handlers?.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.log('error', 'Event handler threw error', { error });
      }
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose the controller
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.listeners.clear();

    this.log('debug', 'Expression controller disposed');
  }

  // ============================================================================
  // Debug Logging
  // ============================================================================

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[ExpressionController]';
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, data);
        break;
      case 'info':
        console.info(fullMessage, data);
        break;
      case 'warn':
        console.warn(fullMessage, data);
        break;
      case 'error':
        console.error(fullMessage, data);
        break;
    }
  }
}

// ============================================================================
// Expression Blending Utilities
// ============================================================================

/**
 * Blend two facial states
 */
export function blendFacialStates(
  stateA: FacialState,
  stateB: FacialState,
  weight: number
): FacialState {
  const w = Math.max(0, Math.min(1, weight));
  const invW = 1 - w;

  return {
    expression: w > 0.5 ? stateB.expression : stateA.expression,
    intensity: stateA.intensity * invW + stateB.intensity * w,
    eyes: {
      open: stateA.eyes.open * invW + stateB.eyes.open * w,
      lookDirection: {
        x: stateA.eyes.lookDirection.x * invW + stateB.eyes.lookDirection.x * w,
        y: stateA.eyes.lookDirection.y * invW + stateB.eyes.lookDirection.y * w,
      },
      pupilSize: stateA.eyes.pupilSize * invW + stateB.eyes.pupilSize * w,
      squint: stateA.eyes.squint * invW + stateB.eyes.squint * w,
    },
    mouth: {
      open: stateA.mouth.open * invW + stateB.mouth.open * w,
      smile: stateA.mouth.smile * invW + stateB.mouth.smile * w,
      width: stateA.mouth.width * invW + stateB.mouth.width * w,
      teethVisible: w > 0.5 ? stateB.mouth.teethVisible : stateA.mouth.teethVisible,
      tongueVisible: w > 0.5 ? stateB.mouth.tongueVisible : stateA.mouth.tongueVisible,
    },
    eyebrows: {
      height: stateA.eyebrows.height * invW + stateB.eyebrows.height * w,
      angle: stateA.eyebrows.angle * invW + stateB.eyebrows.angle * w,
      furrow: stateA.eyebrows.furrow * invW + stateB.eyebrows.furrow * w,
    },
    cheeks: {
      blush: stateA.cheeks.blush * invW + stateB.cheeks.blush * w,
      puff: stateA.cheeks.puff * invW + stateB.cheeks.puff * w,
    },
  };
}

/**
 * Create a micro-expression (brief flash of emotion)
 */
export function createMicroExpression(
  baseExpression: FacialExpressionType,
  flashExpression: FacialExpressionType,
  duration: number,
  onComplete?: () => void
): { start: () => void; cancel: () => void } {
  let timeoutId: number | null = null;

  const start = () => {
    // Would integrate with expression controller
    timeoutId = window.setTimeout(() => {
      onComplete?.();
    }, duration);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { start, cancel };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EyeState,
  MouthState,
  EyebrowState,
  CheekState,
  FacialState,
  ExpressionBlend,
  BlinkConfig,
  ExpressionControllerOptions,
  ExpressionEvent,
};
