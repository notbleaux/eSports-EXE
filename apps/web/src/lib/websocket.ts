/**
 * WebSocket Hook for Real-Time Match Updates
 *
 * Manages WebSocket connection lifecycle, automatic reconnection, and message handling.
 *
 * [Ver001.000]
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  matchId: string;
  timestamp: number;
  payload: Record<string, any>;
}

interface UseWebSocketOptions {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for managing WebSocket connection and real-time message handling
 *
 * @param matchId - Match ID to subscribe to (null to disable connection)
 * @param options - Configuration options
 * @returns WebSocket state and message
 */
export function useWebSocket(
  matchId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [message, setMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!matchId || reconnectAttempts.current >= maxReconnectAttempts) {
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8002';

    try {
      ws.current = new WebSocket(`${wsUrl}/ws`);
      setError(null);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to match
        if (ws.current) {
          ws.current.send(JSON.stringify({
            type: 'SUBSCRIBE',
            matchId,
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setMessage(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(connect, reconnectDelay);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };
    } catch (e) {
      console.error('[WebSocket] Failed to create connection:', e);
      setError(String(e));
      setIsConnected(false);
    }
  }, [matchId, reconnectDelay, maxReconnectAttempts]);

  useEffect(() => {
    if (!matchId) {
      // Close connection if no match ID
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      setIsConnected(false);
      return;
    }

    // Establish connection
    reconnectAttempts.current = 0;
    connect();

    // Cleanup
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [matchId, connect]);

  return {
    message,
    isConnected,
    error,
  };
}

/**
 * Send message through WebSocket
 */
export function useWebSocketSend() {
  const ws = useRef<WebSocket | null>(null);

  return useCallback((type: string, payload: Record<string, any>) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type,
        timestamp: Date.now(),
        payload,
      }));
    }
  }, []);
}
