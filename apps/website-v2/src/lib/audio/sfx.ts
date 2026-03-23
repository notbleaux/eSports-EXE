/** [Ver001.000]
 * SFX System
 * ==========
 * Sound effects management for abilities, UI, and events.
 * Provides priority-based playback, spatial audio support,
 * and integration with the animation system.
 * 
 * Features:
 * - Priority queue for sound effects
 * - Ability sound effect mapping
 * - UI sound library
 * - Event-driven sound triggering
 * - Spatial audio positioning
 */

import type { MascotId, MascotElement } from '@/components/mascots/types';
import {
  type SFXEvent,
  type SFXType,
  type AudioPriority,
  type SpatialPosition,
  PRIORITY_WEIGHTS,
} from './types';
import { getAudioManager } from './manager';

// ============================================================================
// SFX Library
// ============================================================================

export interface SFXDefinition {
  id: string;
  type: SFXType;
  category: 'ability' | 'ui' | 'event' | 'sfx';
  displayName: string;
  audioUrl?: string;
  duration: number;
  priority: AudioPriority;
  loop?: boolean;
  volumeModifier?: number;
  element?: MascotElement;
}

export const SFX_LIBRARY: SFXDefinition[] = [
  // Ability SFX - Solar
  {
    id: 'sfx_solar_flare_cast',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Solar Flare Cast',
    duration: 1.5,
    priority: 'high',
    element: 'solar',
    volumeModifier: 0.9,
  },
  {
    id: 'sfx_solar_flare_hit',
    type: 'ability_hit',
    category: 'ability',
    displayName: 'Solar Flare Hit',
    duration: 1.0,
    priority: 'high',
    element: 'solar',
    volumeModifier: 1.0,
  },
  {
    id: 'sfx_phoenix_rise',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Phoenix Rise',
    duration: 2.5,
    priority: 'critical',
    element: 'solar',
    volumeModifier: 1.0,
  },

  // Ability SFX - Lunar
  {
    id: 'sfx_moonbeam_cast',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Moonbeam Cast',
    duration: 1.2,
    priority: 'high',
    element: 'lunar',
    volumeModifier: 0.8,
  },
  {
    id: 'sfx_moonbeam_hit',
    type: 'ability_hit',
    category: 'ability',
    displayName: 'Moonbeam Hit',
    duration: 0.8,
    priority: 'high',
    element: 'lunar',
    volumeModifier: 0.9,
  },
  {
    id: 'sfx_lunar_shroud',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Lunar Shroud',
    duration: 1.5,
    priority: 'high',
    element: 'lunar',
    volumeModifier: 0.7,
  },

  // Ability SFX - Binary
  {
    id: 'sfx_code_injection',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Code Injection',
    duration: 1.0,
    priority: 'high',
    element: 'binary',
    volumeModifier: 0.8,
  },
  {
    id: 'sfx_firewall',
    type: 'ability_block',
    category: 'ability',
    displayName: 'Firewall',
    duration: 1.0,
    priority: 'high',
    element: 'binary',
    volumeModifier: 0.8,
  },
  {
    id: 'sfx_system_override',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'System Override',
    duration: 2.0,
    priority: 'critical',
    element: 'binary',
    volumeModifier: 1.0,
  },

  // Ability SFX - Fire
  {
    id: 'sfx_inferno_cast',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Inferno Cast',
    duration: 2.0,
    priority: 'high',
    element: 'fire',
    volumeModifier: 1.0,
  },
  {
    id: 'sfx_magma_armor',
    type: 'ability_block',
    category: 'ability',
    displayName: 'Magma Armor',
    duration: 1.5,
    priority: 'high',
    element: 'fire',
    volumeModifier: 0.9,
  },
  {
    id: 'sfx_volcanic_eruption',
    type: 'ability_hit',
    category: 'ability',
    displayName: 'Volcanic Eruption',
    duration: 2.5,
    priority: 'critical',
    element: 'fire',
    volumeModifier: 1.0,
  },

  // Ability SFX - Magic
  {
    id: 'sfx_rainbow_blast_cast',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Rainbow Blast Cast',
    duration: 1.5,
    priority: 'high',
    element: 'magic',
    volumeModifier: 0.9,
  },
  {
    id: 'sfx_rainbow_blast_hit',
    type: 'ability_hit',
    category: 'ability',
    displayName: 'Rainbow Blast Hit',
    duration: 1.0,
    priority: 'high',
    element: 'magic',
    volumeModifier: 0.9,
  },
  {
    id: 'sfx_miracle_heal',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Miracle Heal',
    duration: 2.5,
    priority: 'critical',
    element: 'magic',
    volumeModifier: 1.0,
  },
  {
    id: 'sfx_lucky_charm',
    type: 'ability_cast',
    category: 'ability',
    displayName: 'Lucky Charm',
    duration: 1.5,
    priority: 'high',
    element: 'magic',
    volumeModifier: 0.8,
  },

  // UI SFX
  {
    id: 'sfx_ui_click',
    type: 'ui_click',
    category: 'ui',
    displayName: 'UI Click',
    duration: 0.1,
    priority: 'normal',
    volumeModifier: 0.5,
  },
  {
    id: 'sfx_ui_hover',
    type: 'ui_hover',
    category: 'ui',
    displayName: 'UI Hover',
    duration: 0.05,
    priority: 'low',
    volumeModifier: 0.3,
  },
  {
    id: 'sfx_ui_success',
    type: 'ui_success',
    category: 'ui',
    displayName: 'UI Success',
    duration: 0.5,
    priority: 'normal',
    volumeModifier: 0.6,
  },
  {
    id: 'sfx_ui_error',
    type: 'ui_error',
    category: 'ui',
    displayName: 'UI Error',
    duration: 0.3,
    priority: 'normal',
    volumeModifier: 0.6,
  },
  {
    id: 'sfx_ui_transition',
    type: 'ui_transition',
    category: 'ui',
    displayName: 'UI Transition',
    duration: 0.8,
    priority: 'normal',
    volumeModifier: 0.5,
  },

  // Event SFX
  {
    id: 'sfx_event_alert',
    type: 'event_alert',
    category: 'event',
    displayName: 'Event Alert',
    duration: 1.0,
    priority: 'high',
    volumeModifier: 0.8,
  },
  {
    id: 'sfx_event_achievement',
    type: 'event_achievement',
    category: 'event',
    displayName: 'Achievement Unlocked',
    duration: 2.0,
    priority: 'high',
    volumeModifier: 0.9,
  },

  // Ambient SFX
  {
    id: 'sfx_ambient_hub',
    type: 'ambient_hub',
    category: 'sfx',
    displayName: 'Hub Ambience',
    duration: 10.0,
    priority: 'low',
    loop: true,
    volumeModifier: 0.4,
  },
  {
    id: 'sfx_ambient_match',
    type: 'ambient_match',
    category: 'sfx',
    displayName: 'Match Ambience',
    duration: 30.0,
    priority: 'low',
    loop: true,
    volumeModifier: 0.3,
  },
];

// ============================================================================
// Ability to SFX Mapping
// ============================================================================

export interface AbilitySFXMapping {
  abilityId: string;
  mascotId: MascotId;
  castSFX?: string;
  hitSFX?: string;
  blockSFX?: string;
  impactSFX?: string;
}

export const ABILITY_SFX_MAPPINGS: AbilitySFXMapping[] = [
  // Sol
  { abilityId: 'solar_flare', mascotId: 'sol', castSFX: 'sfx_solar_flare_cast', hitSFX: 'sfx_solar_flare_hit' },
  { abilityId: 'phoenix_rise', mascotId: 'sol', castSFX: 'sfx_phoenix_rise' },
  
  // Lun
  { abilityId: 'moonbeam', mascotId: 'lun', castSFX: 'sfx_moonbeam_cast', hitSFX: 'sfx_moonbeam_hit' },
  { abilityId: 'lunar_shroud', mascotId: 'lun', castSFX: 'sfx_lunar_shroud' },
  
  // Bin
  { abilityId: 'code_injection', mascotId: 'bin', castSFX: 'sfx_code_injection' },
  { abilityId: 'firewall', mascotId: 'bin', blockSFX: 'sfx_firewall' },
  { abilityId: 'system_override', mascotId: 'bin', castSFX: 'sfx_system_override' },
  
  // Fat
  { abilityId: 'inferno', mascotId: 'fat', castSFX: 'sfx_inferno_cast' },
  { abilityId: 'magma_armor', mascotId: 'fat', blockSFX: 'sfx_magma_armor' },
  { abilityId: 'volcanic_eruption', mascotId: 'fat', hitSFX: 'sfx_volcanic_eruption' },
  
  // Uni
  { abilityId: 'rainbow_blast', mascotId: 'uni', castSFX: 'sfx_rainbow_blast_cast', hitSFX: 'sfx_rainbow_blast_hit' },
  { abilityId: 'miracle_heal', mascotId: 'uni', castSFX: 'sfx_miracle_heal' },
  { abilityId: 'lucky_charm', mascotId: 'uni', castSFX: 'sfx_lucky_charm' },
];

// ============================================================================
// SFX Queue Management
// ============================================================================

export interface QueuedSFX {
  event: SFXEvent;
  queuedAt: number;
  scheduledTime?: number;
}

export class SFXQueue {
  private queue: QueuedSFX[] = [];
  private maxSize: number;
  private processing: boolean = false;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  enqueue(event: SFXEvent, delay?: number): boolean {
    if (this.queue.length >= this.maxSize) {
      // Remove lowest priority sound
      const lowestIndex = this.findLowestPriorityIndex();
      if (lowestIndex === -1) return false;

      const newPriority = PRIORITY_WEIGHTS[event.priority];
      const lowestPriority = PRIORITY_WEIGHTS[this.queue[lowestIndex].event.priority];

      if (newPriority <= lowestPriority) {
        return false;
      }

      this.queue.splice(lowestIndex, 1);
    }

    const queuedSFX: QueuedSFX = {
      event,
      queuedAt: Date.now(),
      scheduledTime: delay ? Date.now() + delay : undefined,
    };

    this.queue.push(queuedSFX);
    this.sortByPriority();
    return true;
  }

  dequeue(): SFXEvent | null {
    // Check for scheduled sounds that are ready
    const now = Date.now();
    const readyIndex = this.queue.findIndex(
      item => !item.scheduledTime || item.scheduledTime <= now
    );

    if (readyIndex === -1) return null;

    const item = this.queue[readyIndex];
    this.queue.splice(readyIndex, 1);
    return item.event;
  }

  peek(): QueuedSFX | null {
    return this.queue[0] ?? null;
  }

  removeById(id: string): boolean {
    const index = this.queue.findIndex(item => item.event.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }

  clear(): void {
    this.queue = [];
  }

  getLength(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  setProcessing(processing: boolean): void {
    this.processing = processing;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  private findLowestPriorityIndex(): number {
    if (this.queue.length === 0) return -1;

    let lowestIndex = 0;
    let lowestWeight = PRIORITY_WEIGHTS[this.queue[0].event.priority];

    for (let i = 1; i < this.queue.length; i++) {
      const weight = PRIORITY_WEIGHTS[this.queue[i].event.priority];
      if (weight < lowestWeight) {
        lowestWeight = weight;
        lowestIndex = i;
      }
    }

    return lowestIndex;
  }

  private sortByPriority(): void {
    this.queue.sort((a, b) => {
      // First by scheduled time (if scheduled)
      if (a.scheduledTime && b.scheduledTime) {
        const timeDiff = a.scheduledTime - b.scheduledTime;
        if (timeDiff !== 0) return timeDiff;
      } else if (a.scheduledTime) {
        return 1;
      } else if (b.scheduledTime) {
        return -1;
      }

      // Then by priority
      return PRIORITY_WEIGHTS[b.event.priority] - PRIORITY_WEIGHTS[a.event.priority];
    });
  }
}

// ============================================================================
// SFX Controller
// ============================================================================

export interface SFXControllerOptions {
  maxConcurrent?: number;
  maxQueueSize?: number;
  onSFXStart?: (event: SFXEvent, id: string) => void;
  onSFXEnd?: (event: SFXEvent, id: string) => void;
}

export class SFXController {
  private queue: SFXQueue;
  private maxConcurrent: number;
  private onSFXStart?: (event: SFXEvent, id: string) => void;
  private onSFXEnd?: (event: SFXEvent, id: string) => void;
  private activeSounds: Map<string, SFXEvent> = new Map();
  private processInterval: number | null = null;

  constructor(options: SFXControllerOptions = {}) {
    this.queue = new SFXQueue(options.maxQueueSize ?? 20);
    this.maxConcurrent = options.maxConcurrent ?? 8;
    this.onSFXStart = options.onSFXStart;
    this.onSFXEnd = options.onSFXEnd;
  }

  /**
   * Play a sound effect immediately
   */
  async play(definition: SFXDefinition, options?: {
    position?: SpatialPosition;
    delay?: number;
    volumeModifier?: number;
  }): Promise<string | null> {
    const event: SFXEvent = {
      id: `${definition.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category === 'ability' ? 'ability' : 
                definition.category === 'ui' ? 'ui' : 
                definition.category === 'event' ? 'sfx' : 'sfx',
      priority: definition.priority,
      audioUrl: definition.audioUrl,
      duration: definition.duration,
      loop: definition.loop,
      volumeModifier: options?.volumeModifier ?? definition.volumeModifier,
      spatialPosition: options?.position,
      delay: options?.delay,
    };

    return this.playEvent(event);
  }

  /**
   * Play an SFX event
   */
  async playEvent(event: SFXEvent): Promise<string | null> {
    const audioManager = getAudioManager();

    if (!audioManager.isInitialized()) {
      await audioManager.initialize();
    }

    const soundId = await audioManager.playSFX(event);
    
    if (soundId) {
      this.activeSounds.set(soundId, event);
      this.onSFXStart?.(event, soundId);

      // Schedule cleanup
      const duration = (event.duration * 1000) + (event.delay ?? 0);
      setTimeout(() => {
        this.activeSounds.delete(soundId);
        this.onSFXEnd?.(event, soundId);
      }, duration);
    }

    return soundId;
  }

  /**
   * Queue a sound effect
   */
  queue(definition: SFXDefinition, delay?: number): boolean {
    const event: SFXEvent = {
      id: `${definition.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: definition.type,
      category: definition.category === 'ability' ? 'ability' : 
                definition.category === 'ui' ? 'ui' : 
                definition.category === 'event' ? 'sfx' : 'sfx',
      priority: definition.priority,
      audioUrl: definition.audioUrl,
      duration: definition.duration,
      loop: definition.loop,
      volumeModifier: definition.volumeModifier,
    };

    return this.queue.enqueue(event, delay);
  }

  /**
   * Process the SFX queue
   */
  async processQueue(): Promise<void> {
    if (this.queue.isProcessing() || this.queue.isEmpty()) {
      return;
    }

    if (this.activeSounds.size >= this.maxConcurrent) {
      return;
    }

    this.queue.setProcessing(true);

    const event = this.queue.dequeue();
    if (event) {
      await this.playEvent(event);
    }

    this.queue.setProcessing(false);

    // Continue processing if more items and capacity available
    if (!this.queue.isEmpty() && this.activeSounds.size < this.maxConcurrent) {
      // Small delay to prevent flooding
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Start automatic queue processing
   */
  startAutoProcess(intervalMs: number = 50): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }

    this.processInterval = window.setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  /**
   * Stop automatic queue processing
   */
  stopAutoProcess(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Play ability SFX
   */
  async playAbilitySFX(
    abilityId: string,
    phase: 'cast' | 'hit' | 'block' | 'impact',
    options?: { position?: SpatialPosition; delay?: number }
  ): Promise<string | null> {
    const mapping = ABILITY_SFX_MAPPINGS.find(m => m.abilityId === abilityId);
    if (!mapping) return null;

    const sfxId = phase === 'cast' ? mapping.castSFX :
                  phase === 'hit' ? mapping.hitSFX :
                  phase === 'block' ? mapping.blockSFX :
                  phase === 'impact' ? mapping.impactSFX : undefined;

    if (!sfxId) return null;

    const definition = SFX_LIBRARY.find(s => s.id === sfxId);
    if (!definition) return null;

    return this.play(definition, options);
  }

  /**
   * Play UI SFX
   */
  async playUI(type: 'click' | 'hover' | 'success' | 'error' | 'transition'): Promise<string | null> {
    const typeMap: Record<string, SFXType> = {
      click: 'ui_click',
      hover: 'ui_hover',
      success: 'ui_success',
      error: 'ui_error',
      transition: 'ui_transition',
    };

    const definitions = SFX_LIBRARY.filter(s => s.type === typeMap[type]);
    if (definitions.length === 0) return null;

    // Pick random variation if multiple exist
    const definition = definitions[Math.floor(Math.random() * definitions.length)];
    return this.play(definition);
  }

  /**
   * Play event SFX
   */
  async playEventSFX(type: 'alert' | 'achievement'): Promise<string | null> {
    const typeMap: Record<string, SFXType> = {
      alert: 'event_alert',
      achievement: 'event_achievement',
    };

    const definition = SFX_LIBRARY.find(s => s.type === typeMap[type]);
    if (!definition) return null;

    return this.play(definition);
  }

  /**
   * Stop a specific sound
   */
  stop(soundId: string): void {
    const audioManager = getAudioManager();
    audioManager.stopSFX(soundId);
    this.activeSounds.delete(soundId);
  }

  /**
   * Stop all sounds of a specific type
   */
  stopByType(type: SFXType): void {
    this.activeSounds.forEach((event, id) => {
      if (event.type === type) {
        this.stop(id);
      }
    });
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    const audioManager = getAudioManager();
    audioManager.stopAllSFX();
    this.activeSounds.clear();
    this.queue.clear();
  }

  /**
   * Get active sound count
   */
  getActiveCount(): number {
    return this.activeSounds.size;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.getLength();
  }

  /**
   * Get SFX definition by ID
   */
  getDefinition(id: string): SFXDefinition | undefined {
    return SFX_LIBRARY.find(s => s.id === id);
  }

  /**
   * Get SFX definitions by element
   */
  getDefinitionsByElement(element: MascotElement): SFXDefinition[] {
    return SFX_LIBRARY.filter(s => s.element === element);
  }

  /**
   * Preload SFX assets
   */
  async preloadSFX(ids: string[]): Promise<void> {
    const audioManager = getAudioManager();
    
    if (!audioManager.isInitialized()) {
      await audioManager.initialize();
    }

    // Preload would be implemented in audio manager
    console.log(`Preloading ${ids.length} SFX assets`);
  }
}

// ============================================================================
// Animation Sync Helpers
// ============================================================================

export interface SFXAnimationSync {
  /** When to trigger the SFX (as percentage of animation) */
  triggerAt: number;
  /** SFX to play */
  sfxId: string;
  /** Optional delay after trigger point */
  delay?: number;
}

/**
 * Create animation-synced SFX triggers
 */
export function createAnimationSyncedSFX(
  syncPoints: SFXAnimationSync[],
  animationDuration: number,
  onTrigger: (sfxId: string) => void
): () => void {
  const timeouts: number[] = [];

  syncPoints.forEach(point => {
    const triggerTime = (animationDuration * point.triggerAt) + (point.delay ?? 0);
    const timeout = window.setTimeout(() => {
      onTrigger(point.sfxId);
    }, triggerTime * 1000);
    timeouts.push(timeout);
  });

  // Return cleanup function
  return () => {
    timeouts.forEach(id => clearTimeout(id));
  };
}

/**
 * Common sync points for ability animations
 */
export const ABILITY_SYNC_POINTS: Record<string, SFXAnimationSync[]> = {
  solar_flare: [
    { triggerAt: 0.1, sfxId: 'sfx_solar_flare_cast' },
    { triggerAt: 0.5, sfxId: 'sfx_solar_flare_hit' },
  ],
  moonbeam: [
    { triggerAt: 0.15, sfxId: 'sfx_moonbeam_cast' },
    { triggerAt: 0.6, sfxId: 'sfx_moonbeam_hit' },
  ],
  code_injection: [
    { triggerAt: 0.2, sfxId: 'sfx_code_injection' },
  ],
  inferno: [
    { triggerAt: 0.1, sfxId: 'sfx_inferno_cast' },
  ],
  rainbow_blast: [
    { triggerAt: 0.15, sfxId: 'sfx_rainbow_blast_cast' },
    { triggerAt: 0.55, sfxId: 'sfx_rainbow_blast_hit' },
  ],
};

// ============================================================================
// Singleton Instance
// ============================================================================

let globalSFXController: SFXController | null = null;

export function getSFXController(options?: SFXControllerOptions): SFXController {
  if (!globalSFXController) {
    globalSFXController = new SFXController(options);
  }
  return globalSFXController;
}

export function destroySFXController(): void {
  if (globalSFXController) {
    globalSFXController.stopAll();
    globalSFXController.stopAutoProcess();
    globalSFXController = null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  SFXDefinition,
  AbilitySFXMapping,
  QueuedSFX,
  SFXControllerOptions,
  SFXAnimationSync,
};
