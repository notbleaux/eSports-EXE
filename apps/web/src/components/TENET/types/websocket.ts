/** [Ver001.000] */
/**
 * WebSocket Type Definitions
 * ==========================
 * Shared types for WebSocket communication.
 */

// ============================================================================
// Message Types
// ============================================================================

export enum MessageType {
  // Data updates
  DATA_UPDATE = 'data_update',
  ODDS_UPDATE = 'odds_update',
  MATCH_EVENT = 'match_event',

  // Chat
  CHAT_MESSAGE = 'chat_message',
  CHAT_HISTORY = 'chat_history',
  USER_PRESENCE = 'user_presence',

  // System
  AUTH = 'auth',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
}

// ============================================================================
// Channel Types
// ============================================================================

export enum Channel {
  GLOBAL = 'global',
  MATCH_PREFIX = 'match:',
  LOBBY_PREFIX = 'lobby:',
  TEAM_PREFIX = 'team:',
  HUB_PREFIX = 'hub:',
}

export type ChannelType = 'global' | `match:${string}` | `lobby:${string}` | `team:${string}` | `hub:${string}`;

// ============================================================================
// Message Interfaces
// ============================================================================

export interface WSMessage {
  type: string;
  channel: string;
  payload: Record<string, unknown>;
  timestamp: string;
  sender_id?: string;
  message_id?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: string;
  reply_to?: string;
  reactions?: Record<string, number>;
  edited?: boolean;
}

export interface PresenceUpdate {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  channels: string[];
  last_seen: string;
}

export interface DataUpdatePayload {
  entity_type: 'player' | 'team' | 'match' | 'tournament';
  entity_id: string;
  field: string;
  old_value: unknown;
  new_value: unknown;
  timestamp: string;
}

export interface MatchEventPayload {
  match_id: string;
  event_type: 'kill' | 'death' | 'round_end' | 'match_start' | 'match_end' | 'score_update';
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// Gateway API Types
// ============================================================================

export interface GatewayStatus {
  status: string;
  connected_users: number;
  active_channels: number;
  timestamp: string;
}

export interface ChannelInfo {
  name: string;
  subscriber_count: number;
  type: string;
}

export interface ChannelsResponse {
  channels: ChannelInfo[];
  total_subscribers: number;
}

export interface BroadcastRequest {
  type: string;
  channel: string;
  payload: Record<string, unknown>;
  sender_id?: string;
}

export interface BroadcastResponse {
  success: boolean;
  recipients: number;
  timestamp: string;
}

export interface UserPresence {
  user_id: string;
  status: string;
  channels: string[];
  last_seen: string;
}

export interface PresenceResponse {
  users: UserPresence[];
  total_online: number;
}

// ============================================================================
// Store Types
// ============================================================================

export interface WebSocketState {
  connected: boolean;
  error: string | null;
  channels: string[];
  messages: Record<string, WSMessage[]>;
  lastMessage: WSMessage | null;
}

export interface WebSocketActions {
  setWebSocketConnected: (connected: boolean) => void;
  setWebSocketError: (error: string | null) => void;
  subscribeChannel: (channel: string) => void;
  unsubscribeChannel: (channel: string) => void;
  addWebSocketMessage: (message: WSMessage) => void;
  clearWebSocketMessages: (channel?: string) => void;
}

export type WebSocketSlice = WebSocketState & WebSocketActions;
