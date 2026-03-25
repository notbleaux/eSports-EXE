/**
 * WebSocket Configuration - WebSocket endpoints and settings
 * 
 * [Ver001.000] - Unified WebSocket configuration
 */

import { getEnvironment } from './environment'

const env = getEnvironment()

// Base WebSocket URL
export const WS_BASE_URL = env.VITE_WS_URL || 'wss://api.njzitegeiste.com/v1/ws'

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  /** Main unified WebSocket endpoint */
  unified: WS_BASE_URL,
  
  /** Legacy endpoints (deprecated) */
  legacy: {
    live: (matchId: string) => `${WS_BASE_URL}/live/${matchId}`,
    dashboard: (dashboardId: string) => `${WS_BASE_URL}/dashboard/${dashboardId}`,
    analytics: (channel: string) => `${WS_BASE_URL}/analytics/${channel}`
  }
} as const

// Channel Types
export const WS_CHANNELS = {
  /** Match updates */
  match: (matchId: string) => `match:${matchId}`,
  
  /** Player stats updates */
  player: (playerId: string) => `player:${playerId}`,
  
  /** Analytics updates */
  analytics: (channelId: string) => `analytics:${channelId}`,
  
  /** System notifications */
  system: 'system:global',
  
  /** Tournament updates */
  tournament: (tournamentId: string) => `tournament:${tournamentId}`
} as const

// Message Types
export const WS_MESSAGE_TYPES = {
  // Server → Client
  CONNECTION: 'connection',
  MATCH_UPDATE: 'match_update',
  PLAYER_STATS_UPDATE: 'player_stats_update',
  ANALYTICS_UPDATE: 'analytics_update',
  SYSTEM_NOTIFICATION: 'system_notification',
  SUBSCRIPTION_CONFIRMED: 'subscription_confirmed',
  UNSUBSCRIPTION_CONFIRMED: 'unsubscription_confirmed',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
  PONG: 'pong',
  
  // Client → Server
  PING: 'ping',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  AUTHENTICATE: 'authenticate'
} as const

// WebSocket Configuration
export const WS_CONFIG = {
  /** Reconnect base interval in ms */
  reconnectInterval: 1000,
  
  /** Maximum reconnect interval in ms */
  maxReconnectInterval: 30000,
  
  /** Maximum reconnect attempts (0 = unlimited) */
  maxReconnectAttempts: 10,
  
  /** Reconnect backoff multiplier */
  reconnectBackoffMultiplier: 2,
  
  /** Heartbeat interval in ms */
  heartbeatInterval: 30000,
  
  /** Connection timeout in ms */
  connectionTimeout: 10000,
  
  /** Message size limit in bytes */
  maxMessageSize: 1024 * 1024, // 1MB
  
  /** Default channels to subscribe on connect */
  defaultChannels: [] as string[]
} as const

// Close codes
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014
} as const

// Type exports
export type WebSocketChannel = ReturnType<typeof WS_CHANNELS.match> | 
  ReturnType<typeof WS_CHANNELS.player> | 
  ReturnType<typeof WS_CHANNELS.analytics> | 
  typeof WS_CHANNELS.system |
  ReturnType<typeof WS_CHANNELS.tournament>

export type WebSocketMessageType = typeof WS_MESSAGE_TYPES[keyof typeof WS_MESSAGE_TYPES]
