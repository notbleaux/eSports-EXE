/** [Ver001.000] */
/**
 * useWebSocket Hook
 * ================
 * React hook for WebSocket connection management with Zustand integration.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketClient, ConnectionState } from '../services/websocket';
import { useTENETStore } from '../store';
import { WSMessage } from '../types/websocket';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseWebSocketOptions {
  url: string;
  userId?: string;
  autoConnect?: boolean;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseWebSocketReturn {
  /** Current connection state */
  connected: boolean;
  /** Connection state detail */
  connectionState: ConnectionState;
  /** Last received message */
  lastMessage: WSMessage | null;
  /** Connect to WebSocket */
  connect: () => Promise<void>;
  /** Disconnect from WebSocket */
  disconnect: () => Promise<void>;
  /** Subscribe to a channel */
  subscribe: (channel: string, callback?: (message: WSMessage) => void) => Promise<void>;
  /** Unsubscribe from a channel */
  unsubscribe: (channel: string, callback?: (message: WSMessage) => void) => Promise<void>;
  /** Send a message */
  send: (message: WSMessage) => Promise<void>;
  /** Get list of subscribed channels */
  subscribedChannels: string[];
  /** Connection error if any */
  error: Error | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    userId: propUserId,
    autoConnect = false,
    onMessage: propOnMessage,
    onConnect: propOnConnect,
    onDisconnect: propOnDisconnect,
    onError: propOnError,
  } = options;

  // Get user from store
  const storeUser = useTENETStore((state) => state.user);
  const storeSetWebSocketConnected = useTENETStore((state) => state.setWebSocketConnected);
  const storeSetWebSocketError = useTENETStore((state) => state.setWebSocketError);
  const storeAddWebSocketMessage = useTENETStore((state) => state.addWebSocketMessage);
  const storeSubscribeChannel = useTENETStore((state) => state.subscribeChannel);
  const storeUnsubscribeChannel = useTENETStore((state) => state.unsubscribeChannel);

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const clientRef = useRef<WebSocketClient | null>(null);
  const userId = propUserId || storeUser?.id || 'anonymous';

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new WebSocketClient({
        url,
        userId,
        autoReconnect: true,
        onMessage: (message) => {
          setLastMessage(message);
          storeAddWebSocketMessage(message);
          propOnMessage?.(message);
        },
        onConnect: () => {
          setConnectionState('connected');
          storeSetWebSocketConnected(true);
          setError(null);
          propOnConnect?.();
        },
        onDisconnect: () => {
          setConnectionState('disconnected');
          storeSetWebSocketConnected(false);
          propOnDisconnect?.();
        },
        onError: (err) => {
          setError(err);
          storeSetWebSocketError(err.message);
          propOnError?.(err);
        },
      });
    }

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [url, userId]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && clientRef.current && connectionState === 'disconnected') {
      clientRef.current.connect().catch((err) => {
        console.error('[useWebSocket] Auto-connect failed:', err);
      });
    }
  }, [autoConnect, connectionState]);

  // Connection state sync
  useEffect(() => {
    if (clientRef.current) {
      const state = clientRef.current.getConnectionState();
      if (state !== connectionState) {
        setConnectionState(state);
      }
    }
  }, [connectionState]);

  // ============================================================================
  // Actions
  // ============================================================================

  const connect = useCallback(async (): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    await clientRef.current.connect();
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
    }
  }, []);

  const subscribe = useCallback(
    async (channel: string, callback?: (message: WSMessage) => void): Promise<void> => {
      if (!clientRef.current) {
        throw new Error('WebSocket client not initialized');
      }
      await clientRef.current.subscribe(channel, callback);
      storeSubscribeChannel(channel);
    },
    [storeSubscribeChannel]
  );

  const unsubscribe = useCallback(
    async (channel: string, callback?: (message: WSMessage) => void): Promise<void> => {
      if (!clientRef.current) {
        throw new Error('WebSocket client not initialized');
      }
      await clientRef.current.unsubscribe(channel, callback);
      storeUnsubscribeChannel(channel);
    },
    [storeUnsubscribeChannel]
  );

  const send = useCallback(async (message: WSMessage): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }
    await clientRef.current.send(message);
  }, []);

  // ============================================================================
  // Derived State
  // ============================================================================

  const connected = connectionState === 'connected';
  const subscribedChannels = clientRef.current?.getSubscribedChannels() || [];

  return {
    connected,
    connectionState,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    subscribedChannels,
    error,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for simple connection status
 */
export function useWebSocketStatus(): { connected: boolean; connectionState: ConnectionState } {
  const wsConnected = useTENETStore((state) => state.websocket?.connected);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    setConnectionState(wsConnected ? 'connected' : 'disconnected');
  }, [wsConnected]);

  return { connected: wsConnected || false, connectionState };
}

/**
 * Hook for subscribing to a specific channel
 */
export function useChannelSubscription(channel: string): {
  messages: WSMessage[];
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  isSubscribed: boolean;
} {
  const { subscribe, unsubscribe, connected } = useWebSocket({
    url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) || 'ws://localhost:8000/ws/gateway',
    autoConnect: true,
  });

  const messages = useTENETStore((state) => state.websocket?.messages[channel] || []);
  const channels = useTENETStore((state) => state.websocket?.channels || []);
  const isSubscribed = channels.includes(channel);

  useEffect(() => {
    if (connected && !isSubscribed) {
      subscribe(channel);
    }

    return () => {
      if (isSubscribed) {
        unsubscribe(channel);
      }
    };
  }, [connected, isSubscribed, channel, subscribe, unsubscribe]);

  return {
    messages,
    subscribe: () => subscribe(channel),
    unsubscribe: () => unsubscribe(channel),
    isSubscribed,
  };
}

export default useWebSocket;
