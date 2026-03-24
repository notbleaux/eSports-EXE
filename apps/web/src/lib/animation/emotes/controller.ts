/** [Ver001.000]
 * Emote Controller
 * ================
 * Core controller for playing, queueing, and managing emotes.
 * Provides interrupt handling, loop control, and integration with
 * the animation state machine.
 * 
 * Features:
 * - Play emotes with smooth transitions
 * - Emote queueing for sequences
 * - Interrupt handling with priority system
 * - Loop control for continuous emotes
 * - Audio synchronization
 * - Event system for emote lifecycle
 */

import type { AnimationStateMachine } from '@/lib/animation/stateMachine';
import type { AnimationState } from '@/lib/animation/states';
import {
  type EmoteDefinition,
  type EmoteKeyFrame,
  type FacialExpressionType,
  getEmoteById,
  EMOTE_LIBRARY,
} from './library';
import { getSFXController } from '@/lib/audio/sfx';
import type { SFXController } from '@/lib/audio/sfx';

// ============================================================================
// Types
// ============================================================================

export type EmotePlayState = 
  | 'idle' 
  | 'playing' 
  | 'paused' 
  | 'queued'
  | 'interrupted'
  | 'completed';

export type EmoteEventType = 
  | 'emoteStart'
  | 'emoteEnd'
  | 'emoteInterrupt'
  | 'emoteLoop'
  | 'queueStart'
  | 'queueComplete'
  | 'emoteQueued'
  | 'expressionChange';

export interface EmoteEvent {
  type: EmoteEventType;
  emoteId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export type EmoteEventHandler = (event: EmoteEvent) => void;

export interface EmotePlayOptions {
  /** Force play even if another emote is playing */
  force?: boolean;
  /** Priority boost for interrupt handling */
  priorityBoost?: number;
  /** Custom blend duration */
  blendDuration?: number;
  /** Start time offset (0-1) */
  startOffset?: number;
  /** Playback speed multiplier */
  speed?: number;
  /** Loop count (for non-looping emotes, undefined = infinite for looping) */
  loopCount?: number;
  /** Callback when emote completes */
  onComplete?: () => void;
  /** Callback when emote is interrupted */
  onInterrupt?: () => void;
  /** Skip audio */
  skipAudio?: boolean;
  /** Skip particles */
  skipParticles?: boolean;
}

export interface QueuedEmote {
  emote: EmoteDefinition;
  options: EmotePlayOptions;
  queuedAt: number;
  id: string;
}

export interface ActiveEmoteState {
  emote: EmoteDefinition;
  options: EmotePlayOptions;
  state: EmotePlayState;
  startTime: number;
  pausedAt: number | null;
  currentTime: number;
  loopCount: number;
  currentKeyframe: number;
  expression: FacialExpressionType;
}

export interface EmoteControllerOptions {
  /** Maximum queue size */
  maxQueueSize?: number;
  /** Default blend duration */
  defaultBlendDuration?: number;
  /** Auto-process queue */
  autoProcessQueue?: boolean;
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// Emote Controller
// ============================================================================

export class EmoteController {
  private stateMachine: AnimationStateMachine;
  private sfxController: SFXController;
  private emoteQueue: QueuedEmote[] = [];
  private activeEmote: ActiveEmoteState | null = null;
  private listeners: Map<EmoteEventType, Set<EmoteEventHandler>> = new Map();
  private options: Required<EmoteControllerOptions>;
  private animationFrameId: number | null = null;
  private isDisposed = false;
  private currentExpression: FacialExpressionType = 'neutral';
  private expressionTransition: { from: FacialExpressionType; to: FacialExpressionType; progress: number } | null = null;

  constructor(
    stateMachine: AnimationStateMachine,
    options: EmoteControllerOptions = {}
  ) {
    this.stateMachine = stateMachine;
    this.sfxController = getSFXController();
    this.options = {
      maxQueueSize: 20,
      defaultBlendDuration: 0.3,
      autoProcessQueue: true,
      debug: false,
      ...options,
    };

    this.startUpdateLoop();
    this.log('debug', 'Emote controller initialized');
  }

  // ============================================================================
  // Emote Playback
  // ============================================================================

  /**
   * Play an emote by ID
   */
  async play(emoteId: string, options: EmotePlayOptions = {}): Promise<boolean> {
    if (this.isDisposed) {
      this.log('warn', 'Cannot play emote: controller is disposed');
      return false;
    }

    const emote = getEmoteById(emoteId);
    if (!emote) {
      this.log('error', `Emote not found: ${emoteId}`);
      return false;
    }

    return this.playEmote(emote, options);
  }

  /**
   * Play an emote definition directly
   */
  async playEmote(emote: EmoteDefinition, options: EmotePlayOptions = {}): Promise<boolean> {
    if (this.isDisposed) return false;

    const { force = false } = options;

    // Check if we can interrupt current emote
    if (this.activeEmote && !force) {
      const canInterrupt = this.canInterruptCurrent(emote);
      if (!canInterrupt) {
        // Queue instead
        return this.queueEmote(emote, options);
      }
    }

    // Interrupt current emote if playing
    if (this.activeEmote) {
      this.interruptCurrent();
    }

    // Start new emote
    return this.startEmote(emote, options);
  }

  /**
   * Start playing an emote
   */
  private startEmote(emote: EmoteDefinition, options: EmotePlayOptions): boolean {
    const now = performance.now();

    this.activeEmote = {
      emote,
      options,
      state: 'playing',
      startTime: now,
      pausedAt: null,
      currentTime: (options.startOffset ?? 0) * emote.duration * 1000,
      loopCount: 0,
      currentKeyframe: 0,
      expression: emote.keyframes[0]?.expression ?? 'neutral',
    };

    // Set initial animation state
    const firstFrame = emote.keyframes[0];
    if (firstFrame) {
      this.stateMachine.transitionTo(firstFrame.state, {
        blendDuration: options.blendDuration ?? this.options.defaultBlendDuration,
        force: true,
      });
      this.setExpression(firstFrame.expression ?? 'neutral');
    }

    // Trigger audio
    if (!options.skipAudio && emote.audio) {
      this.triggerEmoteAudio(emote);
    }

    // Trigger particles
    if (!options.skipParticles && emote.particleEffects) {
      this.triggerParticleEffects(emote);
    }

    this.emit('emoteStart', emote.id, { loop: emote.loop });
    this.log('debug', `Started emote: ${emote.name}`);

    return true;
  }

  /**
   * Check if we can interrupt the current emote
   */
  private canInterruptCurrent(newEmote: EmoteDefinition): boolean {
    if (!this.activeEmote) return true;

    // Always allow if current emote is interruptible
    if (this.activeEmote.emote.loop) {
      return true;
    }

    // Check if current emote is near completion (> 80% done)
    const progress = this.activeEmote.currentTime / (this.activeEmote.emote.duration * 1000);
    if (progress > 0.8) {
      return true;
    }

    // Priority check - new emote with force option
    if (this.activeEmote.options.force) {
      return false; // Current emote has high priority
    }

    return true;
  }

  /**
   * Interrupt current emote
   */
  private interruptCurrent(): void {
    if (!this.activeEmote) return;

    this.activeEmote.state = 'interrupted';
    this.activeEmote.options.onInterrupt?.();
    this.emit('emoteInterrupt', this.activeEmote.emote.id);
    this.log('debug', `Interrupted emote: ${this.activeEmote.emote.name}`);

    this.activeEmote = null;
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  /**
   * Queue an emote for later playback
   */
  queue(emoteId: string, options: EmotePlayOptions = {}): boolean {
    const emote = getEmoteById(emoteId);
    if (!emote) {
      this.log('error', `Cannot queue: emote not found: ${emoteId}`);
      return false;
    }
    return this.queueEmote(emote, options);
  }

  /**
   * Queue an emote definition
   */
  queueEmote(emote: EmoteDefinition, options: EmotePlayOptions = {}): boolean {
    if (this.emoteQueue.length >= this.options.maxQueueSize) {
      this.log('warn', 'Emote queue is full');
      return false;
    }

    const queuedEmote: QueuedEmote = {
      emote,
      options,
      queuedAt: Date.now(),
      id: `${emote.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.emoteQueue.push(queuedEmote);
    this.emit('emoteQueued', emote.id, { queuePosition: this.emoteQueue.length });
    this.log('debug', `Queued emote: ${emote.name}, position: ${this.emoteQueue.length}`);

    // Start queue processing if auto-process is enabled
    if (this.options.autoProcessQueue && !this.activeEmote) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Process the emote queue
   */
  processQueue(): void {
    if (this.isDisposed) return;
    if (this.activeEmote?.state === 'playing' || this.activeEmote?.state === 'paused') return;
    if (this.emoteQueue.length === 0) return;

    const next = this.emoteQueue.shift();
    if (next) {
      this.emit('queueStart', next.emote.id);
      this.startEmote(next.emote, next.options);
    }
  }

  /**
   * Clear the emote queue
   */
  clearQueue(): void {
    this.emoteQueue = [];
    this.log('debug', 'Emote queue cleared');
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.emoteQueue.length;
  }

  /**
   * View queued emotes
   */
  getQueue(): QueuedEmote[] {
    return [...this.emoteQueue];
  }

  // ============================================================================
  // Playback Control
  // ============================================================================

  /**
   * Pause current emote
   */
  pause(): void {
    if (!this.activeEmote || this.activeEmote.state !== 'playing') return;

    this.activeEmote.state = 'paused';
    this.activeEmote.pausedAt = performance.now();
    this.stateMachine.pause();
    this.log('debug', `Paused emote: ${this.activeEmote.emote.name}`);
  }

  /**
   * Resume current emote
   */
  resume(): void {
    if (!this.activeEmote || this.activeEmote.state !== 'paused') return;

    // Adjust start time to account for pause duration
    if (this.activeEmote.pausedAt) {
      const pauseDuration = performance.now() - this.activeEmote.pausedAt;
      this.activeEmote.startTime += pauseDuration;
      this.activeEmote.pausedAt = null;
    }

    this.activeEmote.state = 'playing';
    this.stateMachine.resume();
    this.log('debug', `Resumed emote: ${this.activeEmote.emote.name}`);
  }

  /**
   * Stop current emote
   */
  stop(): void {
    if (!this.activeEmote) return;

    this.activeEmote.state = 'completed';
    this.activeEmote.options.onComplete?.();
    this.emit('emoteEnd', this.activeEmote.emote.id);
    this.log('debug', `Stopped emote: ${this.activeEmote.emote.name}`);

    this.activeEmote = null;
    this.stateMachine.transitionTo('idle', { force: true });

    // Process next queued emote
    if (this.options.autoProcessQueue) {
      this.processQueue();
    }
  }

  /**
   * Skip to next emote in queue
   */
  skip(): void {
    this.stop();
  }

  /**
   * Get current emote progress (0-1)
   */
  getProgress(): number {
    if (!this.activeEmote) return 0;
    return this.activeEmote.currentTime / (this.activeEmote.emote.duration * 1000);
  }

  /**
   * Get current emote state
   */
  getState(): EmotePlayState {
    return this.activeEmote?.state ?? 'idle';
  }

  /**
   * Get active emote info
   */
  getActiveEmote(): ActiveEmoteState | null {
    return this.activeEmote ? { ...this.activeEmote } : null;
  }

  // ============================================================================
  // Loop Control
  // ============================================================================

  /**
   * Set loop count for current emote
   */
  setLoopCount(count: number): void {
    if (!this.activeEmote) return;
    this.activeEmote.loopCount = count;
    this.log('debug', `Set loop count: ${count}`);
  }

  /**
   * Check if current emote is looping
   */
  isLooping(): boolean {
    return this.activeEmote?.emote.loop ?? false;
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    const update = () => {
      if (this.isDisposed) return;

      if (this.activeEmote?.state === 'playing') {
        this.updateEmote();
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update active emote
   */
  private updateEmote(): void {
    if (!this.activeEmote) return;

    const now = performance.now();
    const speed = this.activeEmote.options.speed ?? 1;
    this.activeEmote.currentTime += (16 * speed); // Approximate 60fps

    const duration = this.activeEmote.emote.duration * 1000;
    const progress = this.activeEmote.currentTime / duration;

    // Handle looping
    if (progress >= 1) {
      if (this.activeEmote.emote.loop) {
        // Check loop count
        const maxLoops = this.activeEmote.options.loopCount;
        if (maxLoops !== undefined && this.activeEmote.loopCount >= maxLoops - 1) {
          this.stop();
          return;
        }

        this.activeEmote.loopCount++;
        this.activeEmote.currentTime = 0;
        this.activeEmote.currentKeyframe = 0;
        this.emit('emoteLoop', this.activeEmote.emote.id, { loopCount: this.activeEmote.loopCount });
      } else {
        this.stop();
        return;
      }
    }

    // Update animation state based on keyframes
    this.updateAnimationState(progress);
  }

  /**
   * Update animation state based on current progress
   */
  private updateAnimationState(progress: number): void {
    if (!this.activeEmote) return;

    const keyframes = this.activeEmote.emote.keyframes;
    const currentKeyframeIndex = this.findCurrentKeyframe(progress);

    if (currentKeyframeIndex !== this.activeEmote.currentKeyframe) {
      this.activeEmote.currentKeyframe = currentKeyframeIndex;
      const keyframe = keyframes[currentKeyframeIndex];

      if (keyframe) {
        this.stateMachine.transitionTo(keyframe.state, {
          blendDuration: 0.15,
          force: true,
        });

        if (keyframe.expression) {
          this.setExpression(keyframe.expression);
        }
      }
    }
  }

  /**
   * Find current keyframe index based on progress
   */
  private findCurrentKeyframe(progress: number): number {
    if (!this.activeEmote) return 0;

    const keyframes = this.activeEmote.emote.keyframes;
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (keyframes[i].time <= progress) {
        return i;
      }
    }
    return 0;
  }

  // ============================================================================
  // Expression Management
  // ============================================================================

  /**
   * Set facial expression
   */
  setExpression(expression: FacialExpressionType, transitionDuration = 0.3): void {
    if (expression === this.currentExpression) return;

    this.expressionTransition = {
      from: this.currentExpression,
      to: expression,
      progress: 0,
    };

    this.currentExpression = expression;

    if (this.activeEmote) {
      this.activeEmote.expression = expression;
    }

    this.emit('expressionChange', expression, { transitionDuration });
  }

  /**
   * Get current expression
   */
  getExpression(): FacialExpressionType {
    return this.currentExpression;
  }

  // ============================================================================
  // Audio Integration
  // ============================================================================

  /**
   * Trigger emote audio
   */
  private async triggerEmoteAudio(emote: EmoteDefinition): Promise<void> {
    if (!emote.audio) return;

    const { voiceContext, sfxId, triggerAt = 0, delay = 0 } = emote.audio;
    const triggerDelay = (emote.duration * triggerAt * 1000) + delay;

    setTimeout(() => {
      if (voiceContext) {
        // Would integrate with voice system
        this.log('debug', `Trigger voice: ${voiceContext}`);
      }
      if (sfxId) {
        const definition = this.sfxController.getDefinition(sfxId);
        if (definition) {
          this.sfxController.play(definition);
        }
      }
    }, triggerDelay);
  }

  /**
   * Trigger particle effects
   */
  private triggerParticleEffects(emote: EmoteDefinition): void {
    if (!emote.particleEffects) return;

    emote.particleEffects.forEach(effect => {
      this.log('debug', `Trigger particle effect: ${effect}`);
      // Would integrate with particle system
    });
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to emote events
   */
  on(event: EmoteEventType, handler: EmoteEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Emit an emote event
   */
  private emit(type: EmoteEventType, emoteId: string, data?: Record<string, unknown>): void {
    const event: EmoteEvent = {
      type,
      emoteId,
      timestamp: performance.now(),
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
  // Batch Operations
  // ============================================================================

  /**
   * Play a sequence of emotes
   */
  async playSequence(emoteIds: string[], options: EmotePlayOptions = {}): Promise<boolean> {
    for (const emoteId of emoteIds) {
      const success = await this.play(emoteId, { ...options, force: false });
      if (!success) {
        this.log('warn', `Failed to queue emote in sequence: ${emoteId}`);
      }
    }
    return true;
  }

  /**
   * Play random emote from category
   */
  playRandomFromCategory(category: string, options: EmotePlayOptions = {}): boolean {
    const emotes = EMOTE_LIBRARY.filter(e => e.category === category);
    if (emotes.length === 0) return false;

    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return this.playEmote(randomEmote, options);
  }

  /**
   * Play random emote compatible with mascot
   */
  playRandomForMascot(mascotId: string, options: EmotePlayOptions = {}): boolean {
    const emotes = EMOTE_LIBRARY.filter(
      e => e.compatibleMascots.length === 0 || e.compatibleMascots.includes(mascotId as any)
    );
    if (emotes.length === 0) return false;

    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    return this.playEmote(randomEmote, options);
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

    this.stop();
    this.clearQueue();
    this.listeners.clear();

    this.log('debug', 'Emote controller disposed');
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

    const prefix = '[EmoteController]';
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
// Factory Functions
// ============================================================================

/**
 * Create an emote controller
 */
export function createEmoteController(
  stateMachine: AnimationStateMachine,
  options?: EmoteControllerOptions
): EmoteController {
  return new EmoteController(stateMachine, options);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EmotePlayOptions,
  EmotePlayState,
  EmoteEvent,
  QueuedEmote,
  ActiveEmoteState,
  EmoteControllerOptions,
};
