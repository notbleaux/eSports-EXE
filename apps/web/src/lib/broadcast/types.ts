/** [Ver001.000] */
/**
 * Broadcast System Types
 * ======================
 * Type definitions for WebSocket-powered live assistance broadcasts.
 * 
 * Dependencies:
 * - TL-A1-1-B Context Detection Engine (HelpContext, HelpLevel)
 * - packages/shared/types/help (shared help types)
 */

import type { HelpContext, HelpLevel } from '@sator/types/help';

// ============================================================================
// Broadcast Priority Levels
// ============================================================================

export type BroadcastPriority = 'critical' | 'high' | 'normal' | 'low';

export const PRIORITY_WEIGHTS: Record<BroadcastPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export const PRIORITY_ORDER: BroadcastPriority[] = ['critical', 'high', 'normal', 'low'];

// ============================================================================
// Broadcast Message Types
// ============================================================================

export type BroadcastMessageType = 
  | 'help_offer'      // Proactive help based on context
  | 'context_update'  // Context has changed significantly
  | 'error_alert'     // Error-related broadcast
  | 'tip'            // General tip/reminder
  | 'system'         // System message (maintenance, etc.)
  | 'announcement';  // General announcements

export interface BroadcastMessage {
  id: string;
  type: BroadcastMessageType;
  priority: BroadcastPriority;
  title: string;
  content: string;
  context?: HelpContext;
  helpLevel?: HelpLevel;
  contentId?: string;       // Reference to help content
  dismissible: boolean;
  duration?: number;        // Auto-dismiss duration in ms (undefined = persistent)
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Broadcast Queue Types
// ============================================================================

export interface QueuedMessage extends BroadcastMessage {
  sequence: number;
  attempts: number;
  lastAttempt?: Date;
}

export interface BroadcastQueueConfig {
  maxSize: number;
  defaultTtl: number;
  deduplicationWindow: number;
  rateLimitMax: number;     // Max messages per second
  rateLimitWindow: number;  // Window in ms
}

export const DEFAULT_QUEUE_CONFIG: BroadcastQueueConfig = {
  maxSize: 100,
  defaultTtl: 300000,       // 5 minutes
  deduplicationWindow: 5000, // 5 seconds
  rateLimitMax: 10,
  rateLimitWindow: 1000,    // 1 second
};

// ============================================================================
// Broadcast State Types
// ============================================================================

export type BroadcastConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface BroadcastState {
  connectionState: BroadcastConnectionState;
  messages: BroadcastMessage[];
  unreadCount: number;
  lastMessageAt?: Date;
  reconnectAttempt: number;
  bufferSize: number;
}

// ============================================================================
// Broadcast Channel Types
// ============================================================================

export interface BroadcastChannel {
  name: string;
  filters?: BroadcastFilter;
}

export interface BroadcastFilter {
  priorities?: BroadcastPriority[];
  types?: BroadcastMessageType[];
  features?: string[];
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseBroadcastReturn {
  // Connection state
  connectionState: BroadcastConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Messages
  messages: BroadcastMessage[];
  unreadMessages: BroadcastMessage[];
  unreadCount: number;
  
  // Actions
  dismiss: (messageId: string) => void;
  dismissAll: () => void;
  markAsRead: (messageId: string) => void;
  subscribe: (channel: string, filters?: BroadcastFilter) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
  
  // Buffer info
  bufferSize: number;
  isBuffering: boolean;
}

export interface UseBroadcastOptions {
  url: string;
  channels?: string[];
  filters?: BroadcastFilter;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: BroadcastMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface LiveBroadcastProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisible?: number;
  showUnreadBadge?: boolean;
  accessibilityAnnouncements?: boolean;
  onMessageDismiss?: (message: BroadcastMessage) => void;
  onMessageClick?: (message: BroadcastMessage) => void;
}

export interface BroadcastNotificationProps {
  message: BroadcastMessage;
  onDismiss: () => void;
  onClick?: () => void;
  index: number;
}

export interface UseLiveBroadcastOptions extends LiveBroadcastProps {
  wsUrl?: string;
  userId?: string;
  channels?: string[];
}
