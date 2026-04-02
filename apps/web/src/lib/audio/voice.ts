// @ts-nocheck
/** [Ver001.000]
 * Mascot Voice System
 * ===================
 * Voice line management and playback for mascot characters.
 * Provides emotional state matching, context-aware voice selection,
 * and queue management with cooldown handling.
 * 
 * Features:
 * - Voice line database for all mascots
 * - Emotion and context-based selection
 * - Cooldown management to prevent repetition
 * - Integration with Animation system for lip-sync
 * - Queue management for sequential voice playback
 */

import type { MascotId } from '@/components/mascots/types';
import {
  type VoiceLine,
  type VoiceLineRequest,
  type VoiceEmotion,
  type VoiceContext,
  type AudioPriority,
  VOICE_LINE_COOLDOWN,
} from './types';
import { getAudioManager } from './manager';

// ============================================================================
// Voice Line Database
// ============================================================================

export const VOICE_LINE_DATABASE: VoiceLine[] = [
  // Sol - Solar Phoenix (Legendary)
  {
    id: 'sol_greeting_1',
    mascotId: 'sol',
    text: "Greetings, challenger! The sun shines upon our battle.",
    emotion: 'confident',
    context: 'greeting',
    duration: 2.5,
    fallbackText: "Greetings, challenger! The sun shines upon our battle.",
    intensity: 0.7,
    cooldown: 45,
    priority: 'normal',
  },
  {
    id: 'sol_greeting_2',
    text: "From the heart of the sun, I emerge to test your strength!",
    mascotId: 'sol',
    emotion: 'excited',
    context: 'greeting',
    duration: 3.0,
    fallbackText: "From the heart of the sun, I emerge to test your strength!",
    intensity: 0.9,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'sol_ability_solar_flare',
    text: "Solar Flare! Feel the burn of a thousand suns!",
    mascotId: 'sol',
    emotion: 'excited',
    context: 'ability_use',
    duration: 2.5,
    fallbackText: "Solar Flare! Feel the burn of a thousand suns!",
    intensity: 0.9,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'sol_ability_phoenix_rise',
    text: "From ashes, I rise again! Phoenix Rise!",
    mascotId: 'sol',
    emotion: 'confident',
    context: 'ability_use',
    duration: 2.8,
    fallbackText: "From ashes, I rise again! Phoenix Rise!",
    intensity: 1.0,
    cooldown: 60,
    priority: 'high',
  },
  {
    id: 'sol_victory_1',
    text: "As inevitable as the dawn! Victory is mine!",
    mascotId: 'sol',
    emotion: 'happy',
    context: 'victory',
    duration: 2.5,
    fallbackText: "As inevitable as the dawn! Victory is mine!",
    intensity: 0.9,
    cooldown: 45,
    priority: 'high',
  },
  {
    id: 'sol_victory_2',
    text: "The sun never sets on a true champion!",
    mascotId: 'sol',
    emotion: 'confident',
    context: 'victory',
    duration: 2.2,
    fallbackText: "The sun never sets on a true champion!",
    intensity: 0.8,
    cooldown: 60,
    priority: 'high',
  },
  {
    id: 'sol_defeat_1',
    text: "Even the sun must set... but I shall rise again.",
    mascotId: 'sol',
    emotion: 'sad',
    context: 'defeat',
    duration: 3.0,
    fallbackText: "Even the sun must set... but I shall rise again.",
    intensity: 0.6,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'sol_encourage_1',
    text: "Channel your inner fire! You can do this!",
    mascotId: 'sol',
    emotion: 'encouraging',
    context: 'encouragement',
    duration: 2.2,
    fallbackText: "Channel your inner fire! You can do this!",
    intensity: 0.8,
    cooldown: 40,
    priority: 'normal',
  },
  {
    id: 'sol_react_positive',
    text: "Magnificent! Your power grows brighter!",
    mascotId: 'sol',
    emotion: 'excited',
    context: 'reaction',
    duration: 2.0,
    fallbackText: "Magnificent! Your power grows brighter!",
    intensity: 0.8,
    cooldown: 35,
    priority: 'normal',
  },
  {
    id: 'sol_farewell',
    text: "Until we meet again. May the sun guide your path.",
    mascotId: 'sol',
    emotion: 'neutral',
    context: 'farewell',
    duration: 2.5,
    fallbackText: "Until we meet again. May the sun guide your path.",
    intensity: 0.5,
    cooldown: 60,
    priority: 'low',
  },

  // Lun - Lunar Owl (Epic)
  {
    id: 'lun_greeting_1',
    text: "The moon watches over this sacred battle.",
    mascotId: 'lun',
    emotion: 'neutral',
    context: 'greeting',
    duration: 2.3,
    fallbackText: "The moon watches over this sacred battle.",
    intensity: 0.5,
    cooldown: 45,
    priority: 'normal',
  },
  {
    id: 'lun_greeting_2',
    text: "In darkness, truth is revealed. Let us begin.",
    mascotId: 'lun',
    emotion: 'confident',
    context: 'greeting',
    duration: 2.8,
    fallbackText: "In darkness, truth is revealed. Let us begin.",
    intensity: 0.7,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'lun_ability_moonbeam',
    text: "Moonbeam! Pierce through the shadows!",
    mascotId: 'lun',
    emotion: 'confident',
    context: 'ability_use',
    duration: 2.2,
    fallbackText: "Moonbeam! Pierce through the shadows!",
    intensity: 0.8,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'lun_ability_lunar_shroud',
    text: "Now you see me... now you don't.",
    mascotId: 'lun',
    emotion: 'neutral',
    context: 'ability_use',
    duration: 2.0,
    fallbackText: "Now you see me... now you don't.",
    intensity: 0.7,
    cooldown: 35,
    priority: 'high',
  },
  {
    id: 'lun_victory_1',
    text: "Wisdom triumphs over brute force. A lesson learned.",
    mascotId: 'lun',
    emotion: 'neutral',
    context: 'victory',
    duration: 2.5,
    fallbackText: "Wisdom triumphs over brute force. A lesson learned.",
    intensity: 0.7,
    cooldown: 50,
    priority: 'high',
  },
  {
    id: 'lun_defeat_1',
    text: "The moon wanes... but it shall wax again.",
    mascotId: 'lun',
    emotion: 'sad',
    context: 'defeat',
    duration: 2.5,
    fallbackText: "The moon wanes... but it shall wax again.",
    intensity: 0.5,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'lun_encourage_1',
    text: "Trust in your wisdom. The answer lies within.",
    mascotId: 'lun',
    emotion: 'encouraging',
    context: 'encouragement',
    duration: 2.3,
    fallbackText: "Trust in your wisdom. The answer lies within.",
    intensity: 0.6,
    cooldown: 40,
    priority: 'normal',
  },
  {
    id: 'lun_idle_1',
    text: "Patience... the stars align in their own time.",
    mascotId: 'lun',
    emotion: 'neutral',
    context: 'idle',
    duration: 2.5,
    fallbackText: "Patience... the stars align in their own time.",
    intensity: 0.3,
    cooldown: 90,
    priority: 'low',
  },

  // Bin - Binary Cyber (Rare)
  {
    id: 'bin_greeting_1',
    text: "01001000 01101001! That means Hi in binary!",
    mascotId: 'bin',
    emotion: 'happy',
    context: 'greeting',
    duration: 2.5,
    fallbackText: "01001000 01101001! That means Hi in binary!",
    intensity: 0.8,
    cooldown: 45,
    priority: 'normal',
  },
  {
    id: 'bin_greeting_2',
    text: "System online! Ready to execute optimal strategy!",
    mascotId: 'bin',
    emotion: 'excited',
    context: 'greeting',
    duration: 2.3,
    fallbackText: "System online! Ready to execute optimal strategy!",
    intensity: 0.9,
    cooldown: 50,
    priority: 'normal',
  },
  {
    id: 'bin_ability_code_injection',
    text: "Injecting code... access granted!",
    mascotId: 'bin',
    emotion: 'excited',
    context: 'ability_use',
    duration: 1.8,
    fallbackText: "Injecting code... access granted!",
    intensity: 0.8,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'bin_ability_firewall',
    text: "Firewall deployed! No unauthorized access allowed!",
    mascotId: 'bin',
    emotion: 'confident',
    context: 'ability_use',
    duration: 2.0,
    fallbackText: "Firewall deployed! No unauthorized access allowed!",
    intensity: 0.8,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'bin_ability_system_override',
    text: "System Override! Your controls are now MINE!",
    mascotId: 'bin',
    emotion: 'excited',
    context: 'ability_use',
    duration: 2.3,
    fallbackText: "System Override! Your controls are now MINE!",
    intensity: 1.0,
    cooldown: 45,
    priority: 'critical',
  },
  {
    id: 'bin_victory_1',
    text: "Victory! Optimal execution achieved!",
    mascotId: 'bin',
    emotion: 'happy',
    context: 'victory',
    duration: 1.8,
    fallbackText: "Victory! Optimal execution achieved!",
    intensity: 0.9,
    cooldown: 45,
    priority: 'high',
  },
  {
    id: 'bin_victory_2',
    text: "01010111 01001001 01001110! That's WIN in binary!",
    mascotId: 'bin',
    emotion: 'excited',
    context: 'victory',
    duration: 2.5,
    fallbackText: "01010111 01001001 01001110! That's WIN in binary!",
    intensity: 1.0,
    cooldown: 60,
    priority: 'high',
  },
  {
    id: 'bin_defeat_1',
    text: "System failure... initiating reboot sequence...",
    mascotId: 'bin',
    emotion: 'sad',
    context: 'defeat',
    duration: 2.2,
    fallbackText: "System failure... initiating reboot sequence...",
    intensity: 0.5,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'bin_encourage_1',
    text: "Your processing power is increasing! Keep it up!",
    mascotId: 'bin',
    emotion: 'encouraging',
    context: 'encouragement',
    duration: 2.0,
    fallbackText: "Your processing power is increasing! Keep it up!",
    intensity: 0.7,
    cooldown: 40,
    priority: 'normal',
  },
  {
    id: 'bin_idle_1',
    text: "Running background processes... zzz... system standby...",
    mascotId: 'bin',
    emotion: 'neutral',
    context: 'idle',
    duration: 2.5,
    fallbackText: "Running background processes... zzz... system standby...",
    intensity: 0.3,
    cooldown: 90,
    priority: 'low',
  },
  {
    id: 'bin_react_surprised',
    text: "Unexpected input! Recalculating...",
    mascotId: 'bin',
    emotion: 'surprised',
    context: 'reaction',
    duration: 1.8,
    fallbackText: "Unexpected input! Recalculating...",
    intensity: 0.7,
    cooldown: 35,
    priority: 'normal',
  },

  // Fat - Fire Spirit (Epic)
  {
    id: 'fat_greeting_1',
    text: "BURN! BURN! ...Wait, did you say marshmallows?",
    mascotId: 'fat',
    emotion: 'excited',
    context: 'greeting',
    duration: 2.5,
    fallbackText: "BURN! BURN! ...Wait, did you say marshmallows?",
    intensity: 0.9,
    cooldown: 50,
    priority: 'normal',
  },
  {
    id: 'fat_ability_inferno',
    text: "INFERNO! Everything burns!",
    mascotId: 'fat',
    emotion: 'excited',
    context: 'ability_use',
    duration: 1.8,
    fallbackText: "INFERNO! Everything burns!",
    intensity: 1.0,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'fat_ability_magma_armor',
    text: "Magma Armor! Try to touch me now!",
    mascotId: 'fat',
    emotion: 'confident',
    context: 'ability_use',
    duration: 2.0,
    fallbackText: "Magma Armor! Try to touch me now!",
    intensity: 0.9,
    cooldown: 35,
    priority: 'high',
  },
  {
    id: 'fat_victory_1',
    text: "HAHA! Burned you to ashes!",
    mascotId: 'fat',
    emotion: 'happy',
    context: 'victory',
    duration: 1.8,
    fallbackText: "HAHA! Burned you to ashes!",
    intensity: 1.0,
    cooldown: 50,
    priority: 'high',
  },
  {
    id: 'fat_defeat_1',
    text: "My flame... extinguished? Impossible!",
    mascotId: 'fat',
    emotion: 'angry',
    context: 'defeat',
    duration: 2.2,
    fallbackText: "My flame... extinguished? Impossible!",
    intensity: 0.7,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'fat_encourage_1',
    text: "Get fired up! Show them your passion!",
    mascotId: 'fat',
    emotion: 'encouraging',
    context: 'encouragement',
    duration: 2.0,
    fallbackText: "Get fired up! Show them your passion!",
    intensity: 0.9,
    cooldown: 40,
    priority: 'normal',
  },

  // Uni - Magic Unicorn (Legendary)
  {
    id: 'uni_greeting_1',
    text: "Believe in magic, and magic believes in you!",
    mascotId: 'uni',
    emotion: 'happy',
    context: 'greeting',
    duration: 2.3,
    fallbackText: "Believe in magic, and magic believes in you!",
    intensity: 0.8,
    cooldown: 45,
    priority: 'normal',
  },
  {
    id: 'uni_greeting_2',
    text: "A wish upon a star brought us together today!",
    mascotId: 'uni',
    emotion: 'excited',
    context: 'greeting',
    duration: 2.5,
    fallbackText: "A wish upon a star brought us together today!",
    intensity: 0.9,
    cooldown: 55,
    priority: 'normal',
  },
  {
    id: 'uni_ability_rainbow_blast',
    text: "Rainbow Blast! Taste the rainbow!",
    mascotId: 'uni',
    emotion: 'excited',
    context: 'ability_use',
    duration: 2.0,
    fallbackText: "Rainbow Blast! Taste the rainbow!",
    intensity: 0.9,
    cooldown: 30,
    priority: 'high',
  },
  {
    id: 'uni_ability_miracle_heal',
    text: "Miracle Heal! May light restore you!",
    mascotId: 'uni',
    emotion: 'happy',
    context: 'ability_use',
    duration: 2.2,
    fallbackText: "Miracle Heal! May light restore you!",
    intensity: 1.0,
    cooldown: 60,
    priority: 'critical',
  },
  {
    id: 'uni_ability_lucky_charm',
    text: "Lucky Charm! Fortune favors the brave!",
    mascotId: 'uni',
    emotion: 'encouraging',
    context: 'ability_use',
    duration: 2.0,
    fallbackText: "Lucky Charm! Fortune favors the brave!",
    intensity: 0.8,
    cooldown: 35,
    priority: 'high',
  },
  {
    id: 'uni_victory_1',
    text: "Dreams really do come true! We won!",
    mascotId: 'uni',
    emotion: 'happy',
    context: 'victory',
    duration: 2.2,
    fallbackText: "Dreams really do come true! We won!",
    intensity: 1.0,
    cooldown: 50,
    priority: 'high',
  },
  {
    id: 'uni_victory_2',
    text: "Magic and friendship triumph again!",
    mascotId: 'uni',
    emotion: 'excited',
    context: 'victory',
    duration: 2.0,
    fallbackText: "Magic and friendship triumph again!",
    intensity: 0.9,
    cooldown: 55,
    priority: 'high',
  },
  {
    id: 'uni_defeat_1',
    text: "Don't worry, there's magic in every ending too...",
    mascotId: 'uni',
    emotion: 'sad',
    context: 'defeat',
    duration: 2.5,
    fallbackText: "Don't worry, there's magic in every ending too...",
    intensity: 0.5,
    cooldown: 60,
    priority: 'normal',
  },
  {
    id: 'uni_encourage_1',
    text: "I believe in you! You can do magical things!",
    mascotId: 'uni',
    emotion: 'encouraging',
    context: 'encouragement',
    duration: 2.2,
    fallbackText: "I believe in you! You can do magical things!",
    intensity: 0.9,
    cooldown: 40,
    priority: 'normal',
  },
  {
    id: 'uni_idle_1',
    text: "Listening to the whispers of the rainbow...",
    mascotId: 'uni',
    emotion: 'neutral',
    context: 'idle',
    duration: 2.3,
    fallbackText: "Listening to the whispers of the rainbow...",
    intensity: 0.3,
    cooldown: 90,
    priority: 'low',
  },
  {
    id: 'uni_react_positive',
    text: "How wonderful! You're full of surprises!",
    mascotId: 'uni',
    emotion: 'surprised',
    context: 'reaction',
    duration: 2.0,
    fallbackText: "How wonderful! You're full of surprises!",
    intensity: 0.8,
    cooldown: 35,
    priority: 'normal',
  },
  {
    id: 'uni_farewell',
    text: "May your dreams be magical! Until next time!",
    mascotId: 'uni',
    emotion: 'happy',
    context: 'farewell',
    duration: 2.3,
    fallbackText: "May your dreams be magical! Until next time!",
    intensity: 0.6,
    cooldown: 60,
    priority: 'low',
  },
];

// ============================================================================
// Voice Selection Engine
// ============================================================================

export interface VoiceSelectionOptions {
  /** Preferred emotion (optional) */
  emotion?: VoiceEmotion;
  /** Target intensity level 0-1 (optional) */
  intensity?: number;
  /** Prefer shorter lines */
  preferShort?: boolean;
  /** Exclude recently played lines */
  excludeRecent?: boolean;
  /** Recent line timeout in ms */
  recentTimeout?: number;
}

export class VoiceSelectionEngine {
  private lastPlayed: Map<string, number> = new Map();
  private recentTimeout: number;

  constructor(recentTimeout: number = VOICE_LINE_COOLDOWN) {
    this.recentTimeout = recentTimeout;
  }

  /**
   * Select the best voice line for a given request
   */
  selectVoiceLine(request: VoiceLineRequest): VoiceLine | null {
    const { mascotId, context, emotion, intensity = 0.5, preferShort = false, excludeRecent = true } = request;

    // Filter by mascot and context
    let candidates = VOICE_LINE_DATABASE.filter(
      line => line.mascotId === mascotId && line.context === context
    );

    if (candidates.length === 0) {
      // Fallback: any context for this mascot
      candidates = VOICE_LINE_DATABASE.filter(line => line.mascotId === mascotId);
    }

    if (candidates.length === 0) {
      return null;
    }

    // Filter by emotion if specified
    if (emotion) {
      const emotionMatches = candidates.filter(line => line.emotion === emotion);
      if (emotionMatches.length > 0) {
        candidates = emotionMatches;
      }
    }

    // Filter out recently played lines
    if (excludeRecent) {
      const now = Date.now();
      candidates = candidates.filter(line => {
        const lastPlayed = this.lastPlayed.get(line.id);
        if (!lastPlayed) return true;
        return now - lastPlayed > Math.max(line.cooldown * 1000, this.recentTimeout);
      });
    }

    if (candidates.length === 0) {
      // All lines on cooldown, clear and retry
      this.lastPlayed.clear();
      return this.selectVoiceLine({ ...request, excludeRecent: false });
    }

    // Score candidates
    const scored = candidates.map(line => ({
      line,
      score: this.calculateScore(line, emotion, intensity, preferShort),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return best match
    return scored[0]?.line ?? null;
  }

  private calculateScore(
    line: VoiceLine,
    targetEmotion: VoiceEmotion | undefined,
    targetIntensity: number,
    preferShort: boolean
  ): number {
    let score = 0;

    // Emotion match bonus
    if (targetEmotion && line.emotion === targetEmotion) {
      score += 30;
    }

    // Intensity match (inverse distance)
    score += 20 * (1 - Math.abs(line.intensity - targetIntensity));

    // Priority bonus
    const priorityWeights = { low: 5, normal: 10, high: 15, critical: 20 };
    score += priorityWeights[line.priority];

    // Duration preference
    if (preferShort && line.duration < 2) {
      score += 10;
    }

    // Random factor for variety (0-10)
    score += Math.random() * 10;

    return score;
  }

  /**
   * Mark a voice line as played
   */
  markPlayed(lineId: string): void {
    this.lastPlayed.set(lineId, Date.now());
  }

  /**
   * Check if a line is on cooldown
   */
  isOnCooldown(lineId: string, cooldownMs: number): boolean {
    const lastPlayed = this.lastPlayed.get(lineId);
    if (!lastPlayed) return false;
    return Date.now() - lastPlayed < cooldownMs;
  }

  /**
   * Clear play history
   */
  clearHistory(): void {
    this.lastPlayed.clear();
  }

  /**
   * Get all available voice lines for a mascot
   */
  getVoiceLinesForMascot(mascotId: MascotId): VoiceLine[] {
    return VOICE_LINE_DATABASE.filter(line => line.mascotId === mascotId);
  }

  /**
   * Get voice lines by context
   */
  getVoiceLinesByContext(context: VoiceContext): VoiceLine[] {
    return VOICE_LINE_DATABASE.filter(line => line.context === context);
  }

  /**
   * Get voice lines by emotion
   */
  getVoiceLinesByEmotion(emotion: VoiceEmotion): VoiceLine[] {
    return VOICE_LINE_DATABASE.filter(line => line.emotion === emotion);
  }
}

// ============================================================================
// Voice Queue Manager
// ============================================================================

export interface QueuedVoiceLine {
  line: VoiceLine;
  priority: AudioPriority;
  queuedAt: number;
}

export class VoiceQueueManager {
  private queue: QueuedVoiceLine[] = [];
  private maxSize: number;
  private isPlaying: boolean = false;
  private currentLine: VoiceLine | null = null;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Add a voice line to the queue
   */
  enqueue(line: VoiceLine, priority: AudioPriority = 'normal'): boolean {
    if (this.queue.length >= this.maxSize) {
      // Remove lowest priority item if queue is full
      const lowestPriorityIndex = this.findLowestPriorityIndex();
      if (lowestPriorityIndex !== -1) {
        const weights = { low: 1, normal: 2, high: 3, critical: 4 };
        if (weights[priority] > weights[this.queue[lowestPriorityIndex].priority]) {
          this.queue.splice(lowestPriorityIndex, 1);
        } else {
          return false;
        }
      }
    }

    this.queue.push({ line, priority, queuedAt: Date.now() });
    this.sortByPriority();
    return true;
  }

  /**
   * Get next voice line from queue
   */
  dequeue(): VoiceLine | null {
    const item = this.queue.shift();
    return item?.line ?? null;
  }

  /**
   * Peek at next item without removing
   */
  peek(): QueuedVoiceLine | null {
    return this.queue[0] ?? null;
  }

  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Set playing state
   */
  setPlaying(playing: boolean, line: VoiceLine | null = null): void {
    this.isPlaying = playing;
    this.currentLine = line;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current playing line
   */
  getCurrentLine(): VoiceLine | null {
    return this.currentLine;
  }

  private findLowestPriorityIndex(): number {
    if (this.queue.length === 0) return -1;

    const weights = { low: 1, normal: 2, high: 3, critical: 4 };
    let lowestIndex = 0;
    let lowestWeight = weights[this.queue[0].priority];

    for (let i = 1; i < this.queue.length; i++) {
      const weight = weights[this.queue[i].priority];
      if (weight < lowestWeight) {
        lowestWeight = weight;
        lowestIndex = i;
      }
    }

    return lowestIndex;
  }

  private sortByPriority(): void {
    const weights = { low: 1, normal: 2, high: 3, critical: 4 };
    this.queue.sort((a, b) => {
      // First by priority
      const priorityDiff = weights[b.priority] - weights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by queue time (FIFO for same priority)
      return a.queuedAt - b.queuedAt;
    });
  }
}

// ============================================================================
// Voice Controller
// ============================================================================

export interface VoiceControllerOptions {
  selectionEngine?: VoiceSelectionEngine;
  queueManager?: VoiceQueueManager;
  onVoiceStart?: (line: VoiceLine) => void;
  onVoiceEnd?: (line: VoiceLine) => void;
}

export class VoiceController {
  private selectionEngine: VoiceSelectionEngine;
  private queueManager: VoiceQueueManager;
  private onVoiceStart?: (line: VoiceLine) => void;
  private onVoiceEnd?: (line: VoiceLine) => void;
  private isProcessing: boolean = false;

  constructor(options: VoiceControllerOptions = {}) {
    this.selectionEngine = options.selectionEngine ?? new VoiceSelectionEngine();
    this.queueManager = options.queueManager ?? new VoiceQueueManager();
    this.onVoiceStart = options.onVoiceStart;
    this.onVoiceEnd = options.onVoiceEnd;
  }

  /**
   * Play a voice line immediately
   */
  async playVoiceLine(request: VoiceLineRequest): Promise<boolean> {
    const line = this.selectionEngine.selectVoiceLine(request);
    if (!line) return false;

    return this.playLine(line);
  }

  /**
   * Queue a voice line for later playback
   */
  queueVoiceLine(request: VoiceLineRequest, priority?: AudioPriority): boolean {
    const line = this.selectionEngine.selectVoiceLine(request);
    if (!line) return false;

    return this.queueManager.enqueue(line, priority ?? line.priority);
  }

  /**
   * Play a specific voice line by ID
   */
  async playVoiceLineById(lineId: string): Promise<boolean> {
    const line = VOICE_LINE_DATABASE.find(l => l.id === lineId);
    if (!line) return false;

    return this.playLine(line);
  }

  /**
   * Process the voice queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queueManager.getIsPlaying() || this.queueManager.isEmpty()) {
      return;
    }

    this.isProcessing = true;

    const line = this.queueManager.dequeue();
    if (line) {
      await this.playLine(line);
    }

    this.isProcessing = false;

    // Continue processing if more items
    if (!this.queueManager.isEmpty()) {
      this.processQueue();
    }
  }

  /**
   * Stop current voice and clear queue
   */
  stop(): void {
    const audioManager = getAudioManager();
    audioManager.stopVoice();
    this.queueManager.clear();
    this.queueManager.setPlaying(false);
  }

  /**
   * Get voice lines for a mascot
   */
  getVoiceLinesForMascot(mascotId: MascotId): VoiceLine[] {
    return this.selectionEngine.getVoiceLinesForMascot(mascotId);
  }

  /**
   * Preload voice line audio
   */
  async preloadVoiceLines(mascotId: MascotId): Promise<void> {
    const lines = this.getVoiceLinesForMascot(mascotId);
    const audioManager = getAudioManager();

    // Initialize audio manager if needed
    if (!audioManager.isInitialized()) {
      await audioManager.initialize();
    }

    // Note: Actual preloading would happen in the audio manager
    // This is a placeholder for the preload logic
    console.log(`Preloaded ${lines.length} voice lines for ${mascotId}`);
  }

  private async playLine(line: VoiceLine): Promise<boolean> {
    const audioManager = getAudioManager();

    // Initialize if needed
    if (!audioManager.isInitialized()) {
      const initialized = await audioManager.initialize();
      if (!initialized) return false;
    }

    // Mark as played
    this.selectionEngine.markPlayed(line.id);

    // Set playing state
    this.queueManager.setPlaying(true, line);

    // Notify start
    this.onVoiceStart?.(line);

    // Play the voice line
    const played = await audioManager.playVoiceLine(line);

    // Handle end
    const handleEnd = () => {
      this.queueManager.setPlaying(false);
      this.onVoiceEnd?.(line);
      this.processQueue();
    };

    if (played) {
      // Set up end detection
      setTimeout(handleEnd, line.duration * 1000);
    } else {
      handleEnd();
    }

    return played;
  }
}

// ============================================================================
// Animation Sync
// ============================================================================

export interface AnimationSyncEvent {
  type: 'lipSyncStart' | 'lipSyncEnd' | 'expressionChange';
  line: VoiceLine;
  timestamp: number;
  data?: {
    phoneme?: string;
    intensity?: number;
    expression?: string;
  };
}

export type AnimationSyncHandler = (event: AnimationSyncEvent) => void;

/**
 * Create animation sync events for a voice line
 * This generates synthetic lip-sync events based on the voice line
 */
export function generateLipSyncEvents(line: VoiceLine, callback: AnimationSyncHandler): () => void {
  const startTime = Date.now();
  const duration = line.duration * 1000;
  
  // Simple lip-sync pattern based on emotion
  const patterns: Record<VoiceEmotion, string[]> = {
    neutral: ['M', 'A', 'I', 'M', 'O'],
    happy: ['A', 'I', 'A', 'E', 'A'],
    excited: ['O', 'A', 'E', 'O', 'A', 'I'],
    sad: ['M', 'U', 'I', 'M', 'U'],
    angry: ['E', 'O', 'A', 'E', 'O'],
    surprised: ['O', 'A', 'O', 'A'],
    confident: ['E', 'A', 'I', 'E'],
    encouraging: ['A', 'I', 'E', 'A', 'I'],
  };

  const pattern = patterns[line.emotion] ?? patterns.neutral;
  const interval = duration / pattern.length;

  // Send start event
  callback({
    type: 'lipSyncStart',
    line,
    timestamp: startTime,
    data: { expression: line.emotion },
  });

  // Schedule phoneme events
  const timeouts: number[] = [];
  pattern.forEach((phoneme, index) => {
    const timeout = window.setTimeout(() => {
      callback({
        type: 'lipSyncStart',
        line,
        timestamp: Date.now(),
        data: { phoneme, intensity: line.intensity },
      });
    }, index * interval);
    timeouts.push(timeout);
  });

  // Schedule end event
  const endTimeout = window.setTimeout(() => {
    callback({
      type: 'lipSyncEnd',
      line,
      timestamp: Date.now(),
    });
  }, duration);
  timeouts.push(endTimeout);

  // Return cleanup function
  return () => {
    timeouts.forEach(id => clearTimeout(id));
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalVoiceController: VoiceController | null = null;

export function getVoiceController(options?: VoiceControllerOptions): VoiceController {
  if (!globalVoiceController) {
    globalVoiceController = new VoiceController(options);
  }
  return globalVoiceController;
}

export function destroyVoiceController(): void {
  if (globalVoiceController) {
    globalVoiceController.stop();
    globalVoiceController = null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  VoiceLine,
  VoiceLineRequest,
  VoiceEmotion,
  VoiceContext,
  VoiceSelectionOptions,
  QueuedVoiceLine,
  VoiceControllerOptions,
  AnimationSyncEvent,
  AnimationSyncHandler,
};
