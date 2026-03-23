/** [Ver001.000] */
/**
 * useBroadcast Hook
 * =================
 * WebSocket-powered broadcast management hook with auto-reconnect,
 * message buffering, and connection state tracking.
 * 
 * Features:
 * - WebSocket connection management
 * - Auto-reconnect with exponential backoff
 * - Connection state tracking
 * - Message buffering during disconnect
 * - Priority queue integration
 * - Channel subscription management
 * 
 * Dependencies:
 * - useWebSocket (shared WebSocket infrastructure)
 * - BroadcastQueue (priority queue)
 * - TL-A1-1-B Context Detection Engine
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { getBroadcastQueue, enqueueAsync } from '../lib/broadcast/queue';
import { logger } from '../utils/logger';
import type {
  BroadcastMessage,
  BroadcastConnectionState,
  BroadcastFilter,
  UseBroadcastReturn,
  UseBroadcastOptions,
  BroadcastPriority,
} from '../lib/broadcast/types';

// Logger
const broadcastLogger = logger.child('Broadcast');

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RECONNECT_INTERVAL = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const BUFFER_FLUSH_INTERVAL = 5000; // Try to flush buffer every 5 seconds

// ============================================================================
// Message Buffer
// ============================================================================

interface BufferedMessage {
  message: BroadcastMessage;
  timestamp: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBroadcast(options: UseBroadcastOptions): UseBroadcastReturn {
  const {
    url,
    channels = [],
    filters,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // ============================================================================
  // State
  // ============================================================================

  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [buffer, setBuffer] = useState<BufferedMessage[]>([]);
  
  // Refs for mutable state
  const bufferRef = useRef<BufferedMessage[]>([]);
  const channelsRef = useRef<Set<string>>(new Set(channels));
  const isMountedRef = useRef(true);

  // Get queue instance
  const queue = useMemo(() => getBroadcastQueue(), []);

  // ============================================================================
  // WebSocket Hook
  // ============================================================================

  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage<unknown>) => {
    if (!isMountedRef.current) return;

    // Handle broadcast messages
    if (wsMessage.type === 'broadcast' && wsMessage.channel?.startsWith('broadcast:')) {
      const broadcastMessage = wsMessage.data as BroadcastMessage;
      
      // Apply filters if specified
      if (filters && !messageMatchesFilters(broadcastMessage, filters)) {
        return;
      }

      // Add to queue for priority handling
      enqueueAsync(queue, broadcastMessage).then((queued) => {
        if (queued && isMountedRef.current) {
          setMessages(prev => {
            // Check for duplicates
            if (prev.some(m => m.id === queued.id)) {
              return prev;
            }
            return [queued, ...prev];
          });
          
          // Call user callback
          onMessage?.(queued);
        }
      });
    }
  }, [filters, queue, onMessage]);

  const handleConnect = useCallback(() => {
    broadcastLogger.info('Broadcast connected');
    
    // Subscribe to channels
    channelsRef.current.forEach(channel => {
      ws.subscribe(`broadcast:${channel}`);
    });

    // Flush buffer
    flushBuffer();
    
    onConnect?.();
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    broadcastLogger.info('Broadcast disconnected');
    onDisconnect?.();
  }, [onDisconnect]);

  const handleError = useCallback((error: Error) => {
    broadcastLogger.error('Broadcast error:', error);
    onError?.(error);
  }, [onError]);

  const ws = useWebSocket({
    url,
    onMessage: handleWebSocketMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,
  });

  // ============================================================================
  // Connection State
  // ============================================================================

  const connectionState = useMemo<BroadcastConnectionState>(() => {
    switch (ws.status) {
      case 'connecting':
        return 'connecting';
      case 'connected':
        return 'connected';
      case 'disconnected':
        return buffer.length > 0 ? 'reconnecting' : 'disconnected';
      case 'error':
        return 'error';
      default:
        return 'disconnected';
    }
  }, [ws.status, buffer.length]);

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';

  // ============================================================================
  // Buffer Management
  // ============================================================================

  const addToBuffer = useCallback((message: BroadcastMessage) => {
    const buffered: BufferedMessage = {
      message,
      timestamp: Date.now(),
    };
    
    bufferRef.current = [...bufferRef.current, buffered];
    setBuffer(bufferRef.current);
  }, []);

  const flushBuffer = useCallback(() => {
    if (!isConnected || bufferRef.current.length === 0) return;

    const toFlush = [...bufferRef.current];
    bufferRef.current = [];
    setBuffer([]);

    toFlush.forEach(({ message }) => {
      enqueueAsync(queue, message).then((queued) => {
        if (queued && isMountedRef.current) {
          setMessages(prev => [queued, ...prev]);
          onMessage?.(queued);
        }
      });
    });

    broadcastLogger.info(`Flushed ${toFlush.length} buffered messages`);
  }, [isConnected, queue, onMessage]);

  // ============================================================================
  // Actions
  // ============================================================================

  const dismiss = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    queue.remove(messageId);
  }, [queue]);

  const dismissAll = useCallback(() => {
    setMessages([]);
    queue.clear();
  }, [queue]);

  const markAsRead = useCallback((messageId: string) => {
    setReadMessageIds(prev => new Set([...prev, messageId]));
  }, []);

  const subscribe = useCallback((channel: string, channelFilters?: BroadcastFilter) => {
    channelsRef.current.add(channel);
    
    if (isConnected) {
      ws.subscribe(`broadcast:${channel}`, channelFilters);
      broadcastLogger.info(`Subscribed to broadcast channel: ${channel}`);
    }
  }, [isConnected, ws]);

  const unsubscribe = useCallback((channel: string) => {
    channelsRef.current.delete(channel);
    
    if (isConnected) {
      ws.unsubscribe(`broadcast:${channel}`);
      broadcastLogger.info(`Unsubscribed from broadcast channel: ${channel}`);
    }
  }, [isConnected, ws]);

  const reconnect = useCallback(() => {
    ws.reconnect();
  }, [ws]);

  // ============================================================================
  // Derived State
  // ============================================================================

  const unreadMessages = useMemo(() => 
    messages.filter(m => !readMessageIds.has(m.id)),
    [messages, readMessageIds]
  );

  const unreadCount = unreadMessages.length;

  const isBuffering = buffer.length > 0;

  // ============================================================================
  // Effects
  // ============================================================================

  // Subscribe to initial channels on connect
  useEffect(() => {
    if (isConnected) {
      channels.forEach(channel => {
        ws.subscribe(`broadcast:${channel}`, filters);
      });
    }
  }, [isConnected, channels, filters, ws]);

  // Periodic buffer flush attempt
  useEffect(() => {
    if (!isBuffering) return;

    const interval = setInterval(() => {
      if (isConnected) {
        flushBuffer();
      }
    }, BUFFER_FLUSH_INTERVAL);

    return () => clearInterval(interval);
  }, [isBuffering, isConnected, flushBuffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    connectionState,
    isConnected,
    isReconnecting,
    messages,
    unreadMessages,
    unreadCount,
    dismiss,
    dismissAll,
    markAsRead,
    subscribe,
    unsubscribe,
    reconnect,
    bufferSize: buffer.length,
    isBuffering,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function messageMatchesFilters(
  message: BroadcastMessage, 
  filters: BroadcastFilter
): boolean {
  // Check priority filter
  if (filters.priorities && !filters.priorities.includes(message.priority)) {
    return false;
  }

  // Check type filter
  if (filters.types && !filters.types.includes(message.type)) {
    return false;
  }

  // Check feature filter
  if (filters.features && message.context?.currentFeature) {
    if (!filters.features.includes(message.context.currentFeature)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Convenience Hook for Help Broadcasts
// ============================================================================

export interface UseHelpBroadcastOptions {
  userId?: string;
  expertiseLevel?: string;
  onHelpOffer?: (message: BroadcastMessage) => void;
  onErrorAlert?: (message: BroadcastMessage) => void;
}

/**
 * Specialized hook for help system broadcasts
 */
export function useHelpBroadcast(
  url: string,
  options: UseHelpBroadcastOptions = {}
) {
  const { userId, expertiseLevel, onHelpOffer, onErrorAlert } = options;

  const handleMessage = useCallback((message: BroadcastMessage) => {
    switch (message.type) {
      case 'help_offer':
        onHelpOffer?.(message);
        break;
      case 'error_alert':
        onErrorAlert?.(message);
        break;
    }
  }, [onHelpOffer, onErrorAlert]);

  const broadcast = useBroadcast({
    url,
    channels: ['help', 'system'],
    filters: {
      priorities: ['critical', 'high', 'normal'],
    },
    onMessage: handleMessage,
  });

  // Subscribe to user-specific channel if userId provided
  useEffect(() => {
    if (userId) {
      broadcast.subscribe(`user:${userId}`);
    }
  }, [userId, broadcast]);

  return broadcast;
}

// ============================================================================
// Default Export
// ============================================================================

export default useBroadcast;
