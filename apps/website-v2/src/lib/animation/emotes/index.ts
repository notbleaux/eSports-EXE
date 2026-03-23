/** [Ver001.000]
 * Emotes Module Index
 * ===================
 * Central export point for the emote and expression system.
 * Provides comprehensive emote functionality for mascot characters.
 */

// ============================================================================
// Library Exports
// ============================================================================

export {
  // Constants
  EMOTE_LIBRARY,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  
  // Query functions
  getEmoteById,
  getEmotesByCategory,
  getEmotesByRarity,
  getEmotesForMascot,
  getUnlockedEmotes,
  getDefaultEmotes,
  getFavoriteEmotes,
  getQuickSlots,
  searchEmotes,
  
  // Utility functions
  isEmoteUnlocked,
  calculateUnlockCost,
  getTotalEmoteCount,
  getEmoteCountByCategory,
  getEmoteCountByRarity,
} from './library';

export type {
  EmoteDefinition,
  EmoteKeyFrame,
  EmoteCategory,
  EmoteRarity,
  EmoteAudioConfig,
  EmoteTrigger,
  FacialExpressionType,
  UnlockRequirements,
  PlayerEmoteProgress,
  RarityConfig,
  CategoryConfig,
} from './library';

// ============================================================================
// Controller Exports
// ============================================================================

export {
  EmoteController,
  createEmoteController,
} from './controller';

export type {
  EmotePlayOptions,
  EmotePlayState,
  EmoteEvent,
  EmoteEventHandler,
  EmoteEventType,
  QueuedEmote,
  ActiveEmoteState,
  EmoteControllerOptions,
} from './controller';

// ============================================================================
// Expression Exports
// ============================================================================

export {
  ExpressionController,
  EXPRESSION_PRESETS,
  blendFacialStates,
  createMicroExpression,
} from './expressions';

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
  ExpressionEventType,
  ExpressionEventHandler,
} from './expressions';

// ============================================================================
// Synchronization Exports
// ============================================================================

export {
  SyncedEmoteController,
  TimeSync,
  SyncCoordinator,
} from './sync';

export type {
  SyncRole,
  SyncState,
  SyncEventType,
  SyncEvent,
  SyncEventHandler,
  SyncMember,
  SyncSession,
  SyncOptions,
  CrowdEmoteConfig,
  NetworkLatencyInfo,
} from './sync';

// ============================================================================
// Factory Functions
// ============================================================================

import type { AnimationStateMachine } from '@/lib/animation/stateMachine';
import { EmoteController } from './controller';
import { ExpressionController } from './expressions';
import { SyncedEmoteController } from './sync';

/**
 * Create a complete emote system with all components
 */
export function createEmoteSystem(
  stateMachine: AnimationStateMachine,
  localId: string,
  options?: {
    controller?: Parameters<typeof createEmoteController>[1];
    expression?: ConstructorParameters<typeof ExpressionController>[0];
    sync?: ConstructorParameters<typeof SyncedEmoteController>[2];
  }
) {
  const controller = new EmoteController(stateMachine, options?.controller);
  const expressions = new ExpressionController(options?.expression);
  const sync = new SyncedEmoteController(controller, localId, options?.sync);

  return {
    controller,
    expressions,
    sync,
    dispose: () => {
      controller.dispose();
      expressions.dispose();
      sync.dispose();
    },
  };
}

// ============================================================================
// Version
// ============================================================================

export const EMOTES_VERSION = '1.0.0';
