// @ts-nocheck
/** [Ver001.000]
 * Emote Library
 * ============
 * Comprehensive emote collection for mascot characters.
 * Provides pre-defined emotes, categories, unlock system, and rarity levels.
 * 
 * Features:
 * - Pre-defined emotes (wave, dance, cheer, etc.)
 * - Emote categories for organization
 * - Unlock system with progression tracking
 * - Rarity levels for collection value
 * - Integration with animation state machine
 * - Audio trigger support
 */

import type { MascotId } from '@/components/mascots/types';
import type { AnimationState } from '@/lib/animation/states';

// ============================================================================
// Emote Types
// ============================================================================

export type EmoteRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EmoteCategory = 
  | 'greeting'    // Wave, hello, welcome
  | 'reaction'    // Cheer, clap, shock
  | 'dance'       // Dance moves
  | 'combat'      // Attack, defend, taunt
  | 'emotional'   // Happy, sad, angry, surprised
  | 'special'     // Unique mascot-specific emotes
  | 'team'        // Team celebration, group emotes
  | 'idle';       // Idle variations

export type EmoteTrigger = 'manual' | 'auto' | 'event' | 'achievement';

export interface EmoteKeyFrame {
  time: number;      // 0-1 normalized time
  state: AnimationState;
  expression?: FacialExpressionType;
  intensity?: number; // 0-1
}

export type FacialExpressionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'excited'
  | 'confident'
  | 'loving'
  | 'suspicious'
  | 'sleepy';

export interface EmoteAudioConfig {
  /** Voice line context to trigger */
  voiceContext?: string;
  /** SFX to play */
  sfxId?: string;
  /** When to trigger audio (0-1) */
  triggerAt?: number;
  /** Audio delay in ms */
  delay?: number;
}

export interface EmoteDefinition {
  id: string;
  name: string;
  description: string;
  category: EmoteCategory;
  rarity: EmoteRarity;
  duration: number;          // seconds
  loop: boolean;
  /** Compatible mascot IDs (empty = all) */
  compatibleMascots: MascotId[];
  /** Animation keyframes */
  keyframes: EmoteKeyFrame[];
  /** Audio configuration */
  audio?: EmoteAudioConfig;
  /** Particle effects to trigger */
  particleEffects?: string[];
  /** Unlock requirements */
  unlockRequirements?: UnlockRequirements;
  /** Icon for UI */
  icon: string;
  /** Preview color */
  color: string;
}

export interface UnlockRequirements {
  /** Player level required */
  level?: number;
  /** Achievement ID required */
  achievement?: string;
  /** Cost in in-game currency */
  cost?: number;
  /** Special condition */
  specialCondition?: string;
  /** Is unlocked by default */
  default?: boolean;
}

export interface PlayerEmoteProgress {
  emoteId: string;
  unlocked: boolean;
  unlockedAt?: string;  // ISO date
  timesUsed: number;
  favorite: boolean;
  quickSlot?: number;   // 1-8 for quick select
}

// ============================================================================
// Rarity Configuration
// ============================================================================

export interface RarityConfig {
  name: EmoteRarity;
  displayName: string;
  color: string;
  glowColor: string;
  borderColor: string;
  particleIntensity: number;
  unlockMultiplier: number;  // Cost multiplier
}

export const RARITY_CONFIG: Record<EmoteRarity, RarityConfig> = {
  common: {
    name: 'common',
    displayName: 'Common',
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.3)',
    borderColor: 'border-gray-400',
    particleIntensity: 0.3,
    unlockMultiplier: 1,
  },
  uncommon: {
    name: 'uncommon',
    displayName: 'Uncommon',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    borderColor: 'border-green-500',
    particleIntensity: 0.5,
    unlockMultiplier: 1.5,
  },
  rare: {
    name: 'rare',
    displayName: 'Rare',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'border-blue-500',
    particleIntensity: 0.7,
    unlockMultiplier: 2.5,
  },
  epic: {
    name: 'epic',
    displayName: 'Epic',
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    borderColor: 'border-purple-500',
    particleIntensity: 0.85,
    unlockMultiplier: 5,
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    borderColor: 'border-amber-500',
    particleIntensity: 1,
    unlockMultiplier: 10,
  },
};

// ============================================================================
// Category Configuration
// ============================================================================

export interface CategoryConfig {
  name: EmoteCategory;
  displayName: string;
  icon: string;
  description: string;
  color: string;
}

export const CATEGORY_CONFIG: Record<EmoteCategory, CategoryConfig> = {
  greeting: {
    name: 'greeting',
    displayName: 'Greetings',
    icon: '👋',
    description: 'Say hello to friends and rivals',
    color: '#22C55E',
  },
  reaction: {
    name: 'reaction',
    displayName: 'Reactions',
    icon: '🎉',
    description: 'React to game events',
    color: '#3B82F6',
  },
  dance: {
    name: 'dance',
    displayName: 'Dances',
    icon: '💃',
    description: 'Show off your moves',
    color: '#EC4899',
  },
  combat: {
    name: 'combat',
    displayName: 'Combat',
    icon: '⚔️',
    description: 'Battle expressions and taunts',
    color: '#EF4444',
  },
  emotional: {
    name: 'emotional',
    displayName: 'Emotions',
    icon: '😊',
    description: 'Express how you feel',
    color: '#F59E0B',
  },
  special: {
    name: 'special',
    displayName: 'Special',
    icon: '✨',
    description: 'Mascot-specific unique emotes',
    color: '#8B5CF6',
  },
  team: {
    name: 'team',
    displayName: 'Team',
    icon: '🤝',
    description: 'Coordinate with your team',
    color: '#06B6D4',
  },
  idle: {
    name: 'idle',
    displayName: 'Idle',
    icon: '💤',
    description: 'Idle animation variations',
    color: '#6B7280',
  },
};

// ============================================================================
// Emote Library
// ============================================================================

export const EMOTE_LIBRARY: EmoteDefinition[] = [
  // ========================= GREETING EMOTES =========================
  {
    id: 'wave',
    name: 'Wave',
    description: 'A friendly wave to greet others',
    category: 'greeting',
    rarity: 'common',
    duration: 1.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.2, state: 'celebrate', expression: 'happy', intensity: 0.3 },
      { time: 0.8, state: 'celebrate', expression: 'happy', intensity: 0.3 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'greeting', triggerAt: 0.1 },
    unlockRequirements: { default: true },
    icon: '👋',
    color: '#22C55E',
  },
  {
    id: 'salute',
    name: 'Salute',
    description: 'A respectful military salute',
    category: 'greeting',
    rarity: 'uncommon',
    duration: 1.2,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.3, state: 'celebrate', expression: 'confident', intensity: 0.5 },
      { time: 0.7, state: 'celebrate', expression: 'confident', intensity: 0.5 },
      { time: 1, state: 'idle', expression: 'neutral' },
    ],
    unlockRequirements: { level: 5 },
    icon: '🫡',
    color: '#3B82F6',
  },
  {
    id: 'bow',
    name: 'Bow',
    description: 'A graceful bow to show respect',
    category: 'greeting',
    rarity: 'rare',
    duration: 2.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.3, state: 'defeat', expression: 'happy', intensity: 0.3 },
      { time: 0.5, state: 'defeat', expression: 'happy', intensity: 0.5 },
      { time: 0.7, state: 'defeat', expression: 'happy', intensity: 0.3 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    unlockRequirements: { level: 10 },
    icon: '🙇',
    color: '#A855F7',
  },
  {
    id: 'highfive',
    name: 'High Five',
    description: 'Ready for a high five!',
    category: 'greeting',
    rarity: 'common',
    duration: 1.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'excited' },
      { time: 0.3, state: 'celebrate', expression: 'excited', intensity: 0.7 },
      { time: 0.8, state: 'idle', expression: 'happy' },
    ],
    unlockRequirements: { default: true },
    icon: '🙌',
    color: '#F59E0B',
  },

  // ========================= REACTION EMOTES =========================
  {
    id: 'cheer',
    name: 'Cheer',
    description: 'Cheer with excitement',
    category: 'reaction',
    rarity: 'common',
    duration: 2.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'excited' },
      { time: 0.2, state: 'celebrate', expression: 'excited', intensity: 0.8 },
      { time: 0.5, state: 'celebrate', expression: 'excited', intensity: 1.0 },
      { time: 0.8, state: 'celebrate', expression: 'excited', intensity: 0.8 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'encouragement', triggerAt: 0.1 },
    particleEffects: ['sparkles'],
    unlockRequirements: { default: true },
    icon: '🎉',
    color: '#EC4899',
  },
  {
    id: 'clap',
    name: 'Clap',
    description: 'Applaud something great',
    category: 'reaction',
    rarity: 'common',
    duration: 1.8,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.15, state: 'celebrate', expression: 'happy', intensity: 0.4 },
      { time: 0.3, state: 'idle', expression: 'happy' },
      { time: 0.45, state: 'celebrate', expression: 'happy', intensity: 0.4 },
      { time: 0.6, state: 'idle', expression: 'happy' },
      { time: 0.75, state: 'celebrate', expression: 'happy', intensity: 0.4 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    sfx: 'clap',
    unlockRequirements: { default: true },
    icon: '👏',
    color: '#22C55E',
  },
  {
    id: 'facepalm',
    name: 'Facepalm',
    description: 'When things go wrong',
    category: 'reaction',
    rarity: 'uncommon',
    duration: 1.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'sad' },
      { time: 0.3, state: 'defeat', expression: 'sad', intensity: 0.5 },
      { time: 0.7, state: 'defeat', expression: 'sad', intensity: 0.7 },
      { time: 1, state: 'idle', expression: 'sad' },
    ],
    unlockRequirements: { level: 3 },
    icon: '🤦',
    color: '#6B7280',
  },
  {
    id: 'shock',
    name: 'Shock',
    description: 'Surprised reaction',
    category: 'reaction',
    rarity: 'common',
    duration: 1.2,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'surprised' },
      { time: 0.3, state: 'celebrate', expression: 'surprised', intensity: 0.8 },
      { time: 0.8, state: 'idle', expression: 'neutral' },
    ],
    unlockRequirements: { default: true },
    icon: '😲',
    color: '#F59E0B',
  },
  {
    id: 'laugh',
    name: 'Laugh',
    description: 'Burst into laughter',
    category: 'reaction',
    rarity: 'common',
    duration: 2.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.2, state: 'celebrate', expression: 'happy', intensity: 0.8 },
      { time: 0.4, state: 'celebrate', expression: 'happy', intensity: 0.6 },
      { time: 0.6, state: 'celebrate', expression: 'happy', intensity: 0.9 },
      { time: 0.8, state: 'celebrate', expression: 'happy', intensity: 0.7 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'reaction', triggerAt: 0.1 },
    unlockRequirements: { default: true },
    icon: '😂',
    color: '#EC4899',
  },

  // ========================= DANCE EMOTES =========================
  {
    id: 'dance_simple',
    name: 'Simple Dance',
    description: 'Basic dance moves',
    category: 'dance',
    rarity: 'common',
    duration: 4.0,
    loop: true,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'celebrate', expression: 'happy', intensity: 0.5 },
      { time: 0.25, state: 'celebrate', expression: 'happy', intensity: 0.7 },
      { time: 0.5, state: 'celebrate', expression: 'happy', intensity: 0.5 },
      { time: 0.75, state: 'celebrate', expression: 'happy', intensity: 0.7 },
      { time: 1, state: 'celebrate', expression: 'happy', intensity: 0.5 },
    ],
    audio: { sfxId: 'dance_beat', triggerAt: 0 },
    unlockRequirements: { level: 2 },
    icon: '💃',
    color: '#EC4899',
  },
  {
    id: 'dance_floss',
    name: 'The Floss',
    description: 'Popular floss dance',
    category: 'dance',
    rarity: 'rare',
    duration: 3.0,
    loop: true,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'celebrate', expression: 'confident', intensity: 0.6 },
      { time: 0.2, state: 'attack', expression: 'confident', intensity: 0.4 },
      { time: 0.4, state: 'celebrate', expression: 'confident', intensity: 0.6 },
      { time: 0.6, state: 'attack', expression: 'confident', intensity: 0.4 },
      { time: 0.8, state: 'celebrate', expression: 'confident', intensity: 0.6 },
      { time: 1, state: 'celebrate', expression: 'confident', intensity: 0.6 },
    ],
    unlockRequirements: { level: 15 },
    icon: '🕺',
    color: '#A855F7',
  },
  {
    id: 'dance_victory',
    name: 'Victory Dance',
    description: 'Epic victory celebration dance',
    category: 'dance',
    rarity: 'epic',
    duration: 5.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'celebrate', expression: 'excited', intensity: 0.5 },
      { time: 0.2, state: 'jump', expression: 'excited', intensity: 0.8 },
      { time: 0.4, state: 'celebrate', expression: 'excited', intensity: 1.0 },
      { time: 0.6, state: 'jump', expression: 'excited', intensity: 0.9 },
      { time: 0.8, state: 'celebrate', expression: 'excited', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'victory', triggerAt: 0.2 },
    particleEffects: ['confetti', 'sparkles'],
    unlockRequirements: { level: 25 },
    icon: '🏆',
    color: '#F59E0B',
  },
  {
    id: 'dance_robot',
    name: 'Robot Dance',
    description: 'Mechanical dance moves',
    category: 'dance',
    rarity: 'rare',
    duration: 3.5,
    loop: true,
    compatibleMascots: ['bin'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'neutral', intensity: 0.3 },
      { time: 0.25, state: 'attack', expression: 'neutral', intensity: 0.3 },
      { time: 0.5, state: 'idle', expression: 'neutral', intensity: 0.3 },
      { time: 0.75, state: 'attack', expression: 'neutral', intensity: 0.3 },
      { time: 1, state: 'idle', expression: 'neutral', intensity: 0.3 },
    ],
    unlockRequirements: { level: 20 },
    icon: '🤖',
    color: '#00C48C',
  },

  // ========================= COMBAT EMOTES =========================
  {
    id: 'taunt',
    name: 'Taunt',
    description: 'Taunt your opponents',
    category: 'combat',
    rarity: 'common',
    duration: 1.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.3, state: 'attack', expression: 'angry', intensity: 0.5 },
      { time: 0.6, state: 'attack', expression: 'confident', intensity: 0.6 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    audio: { voiceContext: 'reaction', triggerAt: 0.2 },
    unlockRequirements: { level: 5 },
    icon: '😤',
    color: '#EF4444',
  },
  {
    id: 'powerup_pose',
    name: 'Power Up',
    description: 'Channel your inner power',
    category: 'combat',
    rarity: 'rare',
    duration: 3.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.3, state: 'celebrate', expression: 'confident', intensity: 0.5 },
      { time: 0.6, state: 'celebrate', expression: 'angry', intensity: 0.8 },
      { time: 0.9, state: 'celebrate', expression: 'confident', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    particleEffects: ['aura'],
    unlockRequirements: { level: 18 },
    icon: '⚡',
    color: '#F59E0B',
  },
  {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: 'Intimidate with a fierce cry',
    category: 'combat',
    rarity: 'epic',
    duration: 2.0,
    loop: false,
    compatibleMascots: ['sol', 'fat'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'angry' },
      { time: 0.2, state: 'attack', expression: 'angry', intensity: 0.7 },
      { time: 0.5, state: 'celebrate', expression: 'angry', intensity: 1.0 },
      { time: 0.8, state: 'attack', expression: 'angry', intensity: 0.8 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    audio: { voiceContext: 'ability_use', triggerAt: 0.2 },
    unlockRequirements: { level: 30 },
    icon: '🦁',
    color: '#DC2626',
  },
  {
    id: 'defensive_stance',
    name: 'Defensive Stance',
    description: 'Take a defensive position',
    category: 'combat',
    rarity: 'uncommon',
    duration: 2.0,
    loop: true,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'suspicious', intensity: 0.5 },
      { time: 0.5, state: 'idle', expression: 'suspicious', intensity: 0.7 },
      { time: 1, state: 'idle', expression: 'suspicious', intensity: 0.5 },
    ],
    unlockRequirements: { level: 8 },
    icon: '🛡️',
    color: '#3B82F6',
  },

  // ========================= EMOTIONAL EMOTES =========================
  {
    id: 'happy',
    name: 'Happy',
    description: 'Show pure happiness',
    category: 'emotional',
    rarity: 'common',
    duration: 2.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.3, state: 'celebrate', expression: 'happy', intensity: 0.7 },
      { time: 0.7, state: 'celebrate', expression: 'happy', intensity: 0.9 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    unlockRequirements: { default: true },
    icon: '😊',
    color: '#F59E0B',
  },
  {
    id: 'sad',
    name: 'Sad',
    description: 'Express disappointment',
    category: 'emotional',
    rarity: 'common',
    duration: 2.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'sad' },
      { time: 0.3, state: 'defeat', expression: 'sad', intensity: 0.6 },
      { time: 0.8, state: 'defeat', expression: 'sad', intensity: 0.8 },
      { time: 1, state: 'idle', expression: 'neutral' },
    ],
    unlockRequirements: { default: true },
    icon: '😢',
    color: '#3B82F6',
  },
  {
    id: 'angry',
    name: 'Angry',
    description: 'Show frustration',
    category: 'emotional',
    rarity: 'uncommon',
    duration: 1.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'angry' },
      { time: 0.4, state: 'attack', expression: 'angry', intensity: 0.8 },
      { time: 0.8, state: 'attack', expression: 'angry', intensity: 0.6 },
      { time: 1, state: 'idle', expression: 'neutral' },
    ],
    unlockRequirements: { level: 5 },
    icon: '😠',
    color: '#EF4444',
  },
  {
    id: 'surprised',
    name: 'Surprised',
    description: 'Show amazement',
    category: 'emotional',
    rarity: 'common',
    duration: 1.2,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'surprised' },
      { time: 0.3, state: 'celebrate', expression: 'surprised', intensity: 0.9 },
      { time: 0.8, state: 'idle', expression: 'surprised' },
      { time: 1, state: 'idle', expression: 'neutral' },
    ],
    unlockRequirements: { default: true },
    icon: '😮',
    color: '#A855F7',
  },
  {
    id: 'love',
    name: 'Love',
    description: 'Show affection',
    category: 'emotional',
    rarity: 'rare',
    duration: 2.5,
    loop: false,
    compatibleMascots: ['uni'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'loving' },
      { time: 0.3, state: 'celebrate', expression: 'loving', intensity: 0.8 },
      { time: 0.6, state: 'celebrate', expression: 'happy', intensity: 0.9 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    particleEffects: ['hearts'],
    unlockRequirements: { level: 12 },
    icon: '🥰',
    color: '#EC4899',
  },
  {
    id: 'sleepy',
    name: 'Sleepy',
    description: 'Feeling drowsy',
    category: 'emotional',
    rarity: 'uncommon',
    duration: 3.0,
    loop: true,
    compatibleMascots: ['lun'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'sleepy', intensity: 0.5 },
      { time: 0.5, state: 'idle', expression: 'sleepy', intensity: 0.7 },
      { time: 1, state: 'idle', expression: 'sleepy', intensity: 0.5 },
    ],
    unlockRequirements: { level: 8 },
    icon: '😴',
    color: '#6366F1',
  },

  // ========================= SPECIAL EMOTES =========================
  {
    id: 'sol_flare',
    name: 'Solar Flare',
    description: 'Sol unleashes solar energy',
    category: 'special',
    rarity: 'legendary',
    duration: 3.5,
    loop: false,
    compatibleMascots: ['sol'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.2, state: 'celebrate', expression: 'confident', intensity: 0.6 },
      { time: 0.5, state: 'attack', expression: 'angry', intensity: 0.9 },
      { time: 0.8, state: 'celebrate', expression: 'confident', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'ability_use', triggerAt: 0.3 },
    particleEffects: ['solar_flare', 'sparks'],
    unlockRequirements: { level: 50 },
    icon: '☀️',
    color: '#F59E0B',
  },
  {
    id: 'lun_moonbeam',
    name: 'Moonbeam Focus',
    description: 'Lun channels lunar energy',
    category: 'special',
    rarity: 'legendary',
    duration: 3.0,
    loop: false,
    compatibleMascots: ['lun'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'neutral' },
      { time: 0.3, state: 'celebrate', expression: 'confident', intensity: 0.5 },
      { time: 0.6, state: 'celebrate', expression: 'confident', intensity: 0.9 },
      { time: 0.9, state: 'celebrate', expression: 'confident', intensity: 0.7 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'ability_use', triggerAt: 0.4 },
    particleEffects: ['moonlight', 'sparkles'],
    unlockRequirements: { level: 50 },
    icon: '🌙',
    color: '#6366F1',
  },
  {
    id: 'bin_hack',
    name: 'System Hack',
    description: 'Bin hacks the system',
    category: 'special',
    rarity: 'legendary',
    duration: 2.5,
    loop: false,
    compatibleMascots: ['bin'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'suspicious' },
      { time: 0.2, state: 'attack', expression: 'confident', intensity: 0.6 },
      { time: 0.5, state: 'celebrate', expression: 'happy', intensity: 0.8 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    audio: { sfxId: 'code_injection', triggerAt: 0.2 },
    particleEffects: ['binary_code', 'glitch'],
    unlockRequirements: { level: 50 },
    icon: '💻',
    color: '#00C48C',
  },
  {
    id: 'fat_inferno',
    name: 'Inferno Rage',
    description: 'Fat unleashes fiery rage',
    category: 'special',
    rarity: 'legendary',
    duration: 3.0,
    loop: false,
    compatibleMascots: ['fat'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'angry' },
      { time: 0.2, state: 'attack', expression: 'angry', intensity: 0.7 },
      { time: 0.5, state: 'celebrate', expression: 'angry', intensity: 1.0 },
      { time: 0.8, state: 'attack', expression: 'angry', intensity: 0.9 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    audio: { voiceContext: 'ability_use', triggerAt: 0.2 },
    particleEffects: ['fire', 'sparks', 'smoke'],
    unlockRequirements: { level: 50 },
    icon: '🔥',
    color: '#EF4444',
  },
  {
    id: 'uni_rainbow',
    name: 'Rainbow Magic',
    description: 'Uni creates a magical rainbow',
    category: 'special',
    rarity: 'legendary',
    duration: 3.5,
    loop: false,
    compatibleMascots: ['uni'],
    keyframes: [
      { time: 0, state: 'idle', expression: 'happy' },
      { time: 0.2, state: 'celebrate', expression: 'happy', intensity: 0.6 },
      { time: 0.5, state: 'celebrate', expression: 'loving', intensity: 0.9 },
      { time: 0.8, state: 'celebrate', expression: 'happy', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'ability_use', triggerAt: 0.3 },
    particleEffects: ['rainbow', 'sparkles', 'hearts'],
    unlockRequirements: { level: 50 },
    icon: '🌈',
    color: '#A855F7',
  },

  // ========================= TEAM EMOTES =========================
  {
    id: 'team_cheer',
    name: 'Team Cheer',
    description: 'Cheer with your team',
    category: 'team',
    rarity: 'uncommon',
    duration: 2.5,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'excited' },
      { time: 0.2, state: 'celebrate', expression: 'excited', intensity: 0.7 },
      { time: 0.6, state: 'celebrate', expression: 'excited', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'encouragement', triggerAt: 0.2 },
    unlockRequirements: { level: 10 },
    icon: '📣',
    color: '#22C55E',
  },
  {
    id: 'group_huddle',
    name: 'Group Huddle',
    description: 'Team huddle formation',
    category: 'team',
    rarity: 'rare',
    duration: 3.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.3, state: 'celebrate', expression: 'confident', intensity: 0.5 },
      { time: 0.6, state: 'celebrate', expression: 'happy', intensity: 0.8 },
      { time: 1, state: 'idle', expression: 'confident' },
    ],
    unlockRequirements: { level: 20 },
    icon: '🤝',
    color: '#06B6D4',
  },
  {
    id: 'victory_formation',
    name: 'Victory Formation',
    description: 'Epic team victory pose',
    category: 'team',
    rarity: 'epic',
    duration: 4.0,
    loop: false,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'confident' },
      { time: 0.2, state: 'celebrate', expression: 'excited', intensity: 0.6 },
      { time: 0.5, state: 'jump', expression: 'excited', intensity: 0.9 },
      { time: 0.8, state: 'celebrate', expression: 'happy', intensity: 1.0 },
      { time: 1, state: 'idle', expression: 'happy' },
    ],
    audio: { voiceContext: 'victory', triggerAt: 0.3 },
    particleEffects: ['confetti', 'sparkles'],
    unlockRequirements: { level: 35 },
    icon: '🏆',
    color: '#F59E0B',
  },

  // ========================= IDLE EMOTES =========================
  {
    id: 'idle_breathe',
    name: 'Breathe',
    description: 'Calm breathing idle',
    category: 'idle',
    rarity: 'common',
    duration: 3.0,
    loop: true,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'neutral', intensity: 0.3 },
      { time: 0.5, state: 'idle', expression: 'neutral', intensity: 0.5 },
      { time: 1, state: 'idle', expression: 'neutral', intensity: 0.3 },
    ],
    unlockRequirements: { default: true },
    icon: '🌬️',
    color: '#6B7280',
  },
  {
    id: 'idle_look',
    name: 'Look Around',
    description: 'Curiously look around',
    category: 'idle',
    rarity: 'common',
    duration: 4.0,
    loop: true,
    compatibleMascots: [],
    keyframes: [
      { time: 0, state: 'idle', expression: 'neutral', intensity: 0.3 },
      { time: 0.25, state: 'idle', expression: 'suspicious', intensity: 0.4 },
      { time: 0.5, state: 'idle', expression: 'neutral', intensity: 0.3 },
      { time: 0.75, state: 'idle', expression: 'suspicious', intensity: 0.4 },
      { time: 1, state: 'idle', expression: 'neutral', intensity: 0.3 },
    ],
    unlockRequirements: { default: true },
    icon: '👀',
    color: '#6B7280',
  },
];

// ============================================================================
// Library Functions
// ============================================================================

/**
 * Get emote by ID
 */
export function getEmoteById(id: string): EmoteDefinition | undefined {
  return EMOTE_LIBRARY.find(e => e.id === id);
}

/**
 * Get all emotes by category
 */
export function getEmotesByCategory(category: EmoteCategory): EmoteDefinition[] {
  return EMOTE_LIBRARY.filter(e => e.category === category);
}

/**
 * Get all emotes by rarity
 */
export function getEmotesByRarity(rarity: EmoteRarity): EmoteDefinition[] {
  return EMOTE_LIBRARY.filter(e => e.rarity === rarity);
}

/**
 * Get emotes compatible with a mascot
 */
export function getEmotesForMascot(mascotId: MascotId): EmoteDefinition[] {
  return EMOTE_LIBRARY.filter(
    e => e.compatibleMascots.length === 0 || e.compatibleMascots.includes(mascotId)
  );
}

/**
 * Get unlocked emotes based on player progress
 */
export function getUnlockedEmotes(progress: PlayerEmoteProgress[]): EmoteDefinition[] {
  const unlockedIds = new Set(progress.filter(p => p.unlocked).map(p => p.emoteId));
  return EMOTE_LIBRARY.filter(e => unlockedIds.has(e.id));
}

/**
 * Get default unlocked emotes
 */
export function getDefaultEmotes(): EmoteDefinition[] {
  return EMOTE_LIBRARY.filter(e => e.unlockRequirements?.default);
}

/**
 * Check if an emote is unlocked for a player
 */
export function isEmoteUnlocked(
  emoteId: string,
  playerLevel: number,
  achievements: string[],
  progress: PlayerEmoteProgress[]
): boolean {
  // Check player progress first
  const playerProgress = progress.find(p => p.emoteId === emoteId);
  if (playerProgress?.unlocked) return true;

  const emote = getEmoteById(emoteId);
  if (!emote) return false;

  const req = emote.unlockRequirements;
  if (!req) return false;

  if (req.default) return true;
  if (req.level && playerLevel >= req.level) return true;
  if (req.achievement && achievements.includes(req.achievement)) return true;

  return false;
}

/**
 * Calculate unlock cost for an emote
 */
export function calculateUnlockCost(emote: EmoteDefinition): number {
  const baseCost = emote.unlockRequirements?.cost ?? 100;
  const multiplier = RARITY_CONFIG[emote.rarity].unlockMultiplier;
  return Math.round(baseCost * multiplier);
}

/**
 * Search emotes by name or description
 */
export function searchEmotes(query: string): EmoteDefinition[] {
  const lowerQuery = query.toLowerCase();
  return EMOTE_LIBRARY.filter(
    e =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get favorite emotes
 */
export function getFavoriteEmotes(progress: PlayerEmoteProgress[]): EmoteDefinition[] {
  const favoriteIds = new Set(progress.filter(p => p.favorite).map(p => p.emoteId));
  return EMOTE_LIBRARY.filter(e => favoriteIds.has(e.id));
}

/**
 * Get quick slot assignments
 */
export function getQuickSlots(progress: PlayerEmoteProgress[]): Map<number, EmoteDefinition> {
  const slots = new Map<number, EmoteDefinition>();
  progress
    .filter(p => p.quickSlot !== undefined && p.unlocked)
    .forEach(p => {
      const emote = getEmoteById(p.emoteId);
      if (emote && p.quickSlot) {
        slots.set(p.quickSlot, emote);
      }
    });
  return slots;
}

/**
 * Get total emote count
 */
export function getTotalEmoteCount(): number {
  return EMOTE_LIBRARY.length;
}

/**
 * Get emote count by category
 */
export function getEmoteCountByCategory(): Record<EmoteCategory, number> {
  const counts = {} as Record<EmoteCategory, number>;
  Object.keys(CATEGORY_CONFIG).forEach(key => {
    counts[key as EmoteCategory] = EMOTE_LIBRARY.filter(e => e.category === key).length;
  });
  return counts;
}

/**
 * Get emote count by rarity
 */
export function getEmoteCountByRarity(): Record<EmoteRarity, number> {
  const counts = {} as Record<EmoteRarity, number>;
  Object.keys(RARITY_CONFIG).forEach(key => {
    counts[key as EmoteRarity] = EMOTE_LIBRARY.filter(e => e.rarity === key).length;
  });
  return counts;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EmoteDefinition,
  EmoteKeyFrame,
  EmoteAudioConfig,
  UnlockRequirements,
  PlayerEmoteProgress,
  RarityConfig,
  CategoryConfig,
};
