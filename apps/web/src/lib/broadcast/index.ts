/** [Ver001.000] */
/**
 * Broadcast Library
 * =================
 * WebSocket-powered live assistance broadcast system.
 * 
 * Exports:
 * - BroadcastQueue: Priority-based message queue
 * - Types: All broadcast type definitions
 * - Utilities: Helper functions for broadcast operations
 */

// Types
export type {
  BroadcastPriority,
  BroadcastMessageType,
  BroadcastMessage,
  QueuedMessage,
  BroadcastQueueConfig,
  BroadcastConnectionState,
  BroadcastState,
  BroadcastChannel,
  BroadcastFilter,
  UseBroadcastReturn,
  UseBroadcastOptions,
  LiveBroadcastProps,
  BroadcastNotificationProps,
} from './types';

export { 
  PRIORITY_WEIGHTS, 
  PRIORITY_ORDER, 
  DEFAULT_QUEUE_CONFIG 
} from './types';

// Queue
export { 
  BroadcastQueue, 
  getBroadcastQueue, 
  resetBroadcastQueue,
  enqueueAsync,
  dequeueAsync,
} from './queue';

// Re-export default
export { BroadcastQueue as default } from './queue';
