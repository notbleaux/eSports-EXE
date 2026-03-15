/** [Ver001.000] */
/**
 * useTacticalWebSocket Hook
 * =========================
 * Manages WebSocket connection for real-time tactical view updates.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MatchFrame, KeyEvent, Player } from './types';
import { logger } from '@/utils/logger';

export interface TacticalWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastPing: number;
  reconnectAttempts: number;
}

export interface TacticalWebSocketActions {
  connect: () => void;
  disconnect: () => void;
  subscribeToMatch: (matchId: string) => void;
  unsubscribeFromMatch: () => void;
  seekToTimestamp: (timestamp: number) => void;
}

export interface UseTacticalWebSocketOptions {
  matchId: string;
  onFrameUpdate?: (frame: MatchFrame) => void;
  onEventReceived?: (event: KeyEvent) => void;
  onPlayerUpdate?: (player: Player) => void;
  onConnectionChange?: (connected: boolean) => void;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/v1/ws';
const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;

export const useTacticalWebSocket = (
  options: UseTacticalWebSocketOptions
): [TacticalWebSocketState, TacticalWebSocketActions] => {
  const {
    matchId,
    onFrameUpdate,
    onEventReceived,
    onPlayerUpdate,
    onConnectionChange,
    autoConnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [state, setState] = useState<TacticalWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastPing: 0,
    reconnectAttempts: 0,
  });

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Start ping/pong heartbeat
  const startHeartbeat = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        setState(prev => ({ ...prev, lastPing: Date.now() }));
        
        // Set pong timeout
        pongTimeoutRef.current = setTimeout(() => {
          logger.warn('[useTacticalWebSocket] Pong timeout, closing connection');
          wsRef.current?.close();
        }, PONG_TIMEOUT);
      }
    }, PING_INTERVAL);
  }, []);

  // Handle WebSocket message
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'pong':
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          break;

        case 'frame_update':
          if (onFrameUpdate && data.frame) {
            onFrameUpdate(data.frame as MatchFrame);
          }
          break;

        case 'event':
          if (onEventReceived && data.event) {
            onEventReceived(data.event as KeyEvent);
          }
          break;

        case 'player_update':
          if (onPlayerUpdate && data.player) {
            onPlayerUpdate(data.player as Player);
          }
          break;

        case 'error':
          logger.error('[useTacticalWebSocket] Server error:', data.message);
          setState(prev => ({ ...prev, error: data.message }));
          break;

        default:
          logger.debug('[useTacticalWebSocket] Unknown message type:', data.type);
      }
    } catch (err) {
      logger.error('[useTacticalWebSocket] Failed to parse message:', err);
    }
  }, [onFrameUpdate, onEventReceived, onPlayerUpdate]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        logger.info('[useTacticalWebSocket] Connected');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
        }));
        onConnectionChange?.(true);
        startHeartbeat();

        // Subscribe to match if specified
        if (matchId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: `match:${matchId}`,
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        logger.error('[useTacticalWebSocket] Connection error:', error);
        setState(prev => ({
          ...prev,
          error: 'Connection error occurred',
        }));
      };

      ws.onclose = (event) => {
        logger.info('[useTacticalWebSocket] Closed:', event.code, event.reason);
        clearTimers();
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
        onConnectionChange?.(false);

        // Attempt reconnection if not closed cleanly
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
          logger.info(`[useTacticalWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          setState(prev => {
            reconnectAttemptsRef.current = prev.reconnectAttempts + 1;
            return { ...prev, reconnectAttempts: prev.reconnectAttempts + 1 };
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      logger.error('[useTacticalWebSocket] Failed to create connection:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Failed to connect',
      }));
    }
  }, [matchId, handleMessage, onConnectionChange, startHeartbeat, clearTimers, reconnectInterval, maxReconnectAttempts]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    }));
  }, [clearTimers]);

  // Subscribe to a match
  const subscribeToMatch = useCallback((newMatchId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        channel: `match:${newMatchId}`,
      }));
    }
  }, []);

  // Unsubscribe from current match
  const unsubscribeFromMatch = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && matchId) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        channel: `match:${matchId}`,
      }));
    }
  }, [matchId]);

  // Seek to a specific timestamp
  const seekToTimestamp = useCallback((timestamp: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'seek',
        timestamp,
      }));
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Re-subscribe when matchId changes
  useEffect(() => {
    if (state.isConnected && matchId) {
      subscribeToMatch(matchId);
    }
  }, [matchId, state.isConnected, subscribeToMatch]);

  const actions: TacticalWebSocketActions = {
    connect,
    disconnect,
    subscribeToMatch,
    unsubscribeFromMatch,
    seekToTimestamp,
  };

  return [state, actions];
};

export default useTacticalWebSocket;
