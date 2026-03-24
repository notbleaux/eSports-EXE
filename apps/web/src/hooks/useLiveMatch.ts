/**
 * useLiveMatch Hook - React Hook for Live Match Data
 * 
 * Features:
 * - Hook for consuming live match data
 * - Real-time updates via WebSocket
 * - Loading and error states
 * - Event filtering and buffering
 * - Automatic reconnection
 * - Performance metrics
 * 
 * [Ver001.000] - Live match data hook
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '../utils/logger';
import { LiveConnectionManager } from '../lib/realtime/connection';
import { LiveMessageHandler } from '../lib/realtime/messageHandler';
import { SubscriptionManager } from '../lib/realtime/subscriptions';
import { useRealtimeStore } from '../lib/realtime/store';
import type {
  UseLiveMatchOptions,
  UseLiveMatchReturn,
  LiveMatchState,
  LiveEvent,
  LiveEventType,
  ConnectionQuality,
} from '../lib/realtime/types';
import { WS_BASE_URL } from '../config/websocket';

const hookLogger = logger.child('useLiveMatch');

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Partial<UseLiveMatchOptions> = {
  autoConnect: true,
  bufferSize: 100,
};

const EVENTS_PER_MINUTE_WINDOW = 60000; // 1 minute

// =============================================================================
// Hook Implementation
// =============================================================================

export function useLiveMatch(options: UseLiveMatchOptions = {}): UseLiveMatchReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { matchId: initialMatchId, autoConnect, eventTypes, bufferSize, onEvent, onError } = opts;

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [eventsPerMinute, setEventsPerMinute] = useState(0);

  // Refs
  const connectionRef = useRef<LiveConnectionManager | null>(null);
  const messageHandlerRef = useRef<LiveMessageHandler | null>(null);
  const subscriptionManagerRef = useRef<SubscriptionManager | null>(null);
  const eventTimestampsRef = useRef<number[]>([]);
  const isMountedRef = useRef(true);

  // Zustand store
  const store = useRealtimeStore();
  const selectedMatchId = store.selectedMatchId;
  const currentMatchId = initialMatchId || selectedMatchId;
  
  const match = currentMatchId 
    ? store.activeMatches.get(currentMatchId) || null 
    : null;

  const events = useMemo(() => {
    if (!currentMatchId) return [];
    const match = store.activeMatches.get(currentMatchId);
    if (!match) return [];
    
    // Filter by event types if specified
    if (eventTypes && eventTypes.length > 0) {
      return match.events.filter(e => eventTypes.includes(e.type));
    }
    return match.events;
  }, [currentMatchId, store.activeMatches, eventTypes]);

  // Connection state from store
  const isConnected = store.isConnected;
  const isConnecting = store.isConnecting;
  const connectionQuality = store.connectionQuality;
  const latency = store.latency;

  // =============================================================================
  // Initialization
  // =============================================================================

  useEffect(() => {
    isMountedRef.current = true;

    // Initialize managers
    connectionRef.current = new LiveConnectionManager({
      url: WS_BASE_URL,
      autoReconnect: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
    });

    messageHandlerRef.current = new LiveMessageHandler({ enableDeduplication: true });
    subscriptionManagerRef.current = new SubscriptionManager();

    // Setup connection event listeners
    setupConnectionListeners();

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // =============================================================================
  // Connection Management
  // =============================================================================

  const setupConnectionListeners = useCallback(() => {
    const connection = connectionRef.current;
    if (!connection) return;

    // Connection state changes
    connection.on('state-change', ({ current }) => {
      if (!isMountedRef.current) return;

      switch (current) {
        case 'connected':
          store.setConnected(true);
          store.setConnecting(false);
          store.setConnectionError(null);
          setIsLoading(false);
          setError(null);
          break;
        case 'connecting':
        case 'reconnecting':
          store.setConnecting(true);
          break;
        case 'disconnected':
        case 'closed':
          store.setConnected(false);
          store.setConnecting(false);
          break;
        case 'error':
          store.setConnected(false);
          store.setConnecting(false);
          break;
      }
    });

    // Connection established
    connection.on('connected', () => {
      if (!isMountedRef.current) return;
      hookLogger.info('Connected to live data');
      
      // Subscribe to match if specified
      if (currentMatchId) {
        subscribeToMatch(currentMatchId);
      }
    });

    // Message received
    connection.on('message', ({ data }) => {
      if (!isMountedRef.current) return;
      handleIncomingMessage(data);
    });

    // Error handling
    connection.on('error', ({ error: connError, recoverable }) => {
      if (!isMountedRef.current) return;
      
      const err = connError instanceof Error ? connError : new Error(String(connError));
      hookLogger.error('Connection error:', err);
      
      store.setConnectionError(err);
      setError(err);
      onError?.(err);

      if (!recoverable) {
        setIsLoading(false);
      }
    });

    // Heartbeat for quality tracking
    connection.on('heartbeat', ({ latency: lat, quality }) => {
      if (!isMountedRef.current) return;
      store.setLatency(lat);
      store.setConnectionQuality(quality);
    });

    // Quality changes
    connection.on('quality-change', ({ current }) => {
      hookLogger.debug('Connection quality changed:', current);
    });

    // Disconnection
    connection.on('disconnected', ({ code, reason }) => {
      if (!isMountedRef.current) return;
      hookLogger.info('Disconnected:', { code, reason });
      store.setConnected(false);
    });

    // Reconnection
    connection.on('reconnecting', ({ attempt, delay }) => {
      if (!isMountedRef.current) return;
      hookLogger.info(`Reconnecting... (attempt ${attempt}, delay ${delay}ms)`);
    });

    connection.on('reconnected', ({ attempt, totalDuration }) => {
      if (!isMountedRef.current) return;
      hookLogger.info(`Reconnected after ${totalDuration}ms (attempt ${attempt})`);
    });
  }, [currentMatchId, onError, store]);

  const connect = useCallback(() => {
    if (connectionRef.current?.isConnected()) {
      hookLogger.debug('Already connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    connectionRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    store.setConnected(false);
    hookLogger.info('Disconnected manually');
  }, [store]);

  const reconnect = useCallback(() => {
    hookLogger.info('Manual reconnect triggered');
    connectionRef.current?.reconnect();
    setIsLoading(true);
  }, []);

  // =============================================================================
  // Message Handling
  // =============================================================================

  const handleIncomingMessage = useCallback((data: unknown) => {
    const handler = messageHandlerRef.current;
    if (!handler) return;

    try {
      // Parse message
      if (typeof data === 'string') {
        const parsed = handler.parseMessage(data);
        
        if (!parsed.valid) {
          hookLogger.warn('Invalid message received:', parsed.error);
          return;
        }

        if (parsed.event) {
          handleEvent(parsed.event);
        }
      }
    } catch (err) {
      hookLogger.error('Error handling message:', err);
    }
  }, []);

  const handleEvent = useCallback((event: LiveEvent) => {
    // Update event timestamps for EPM calculation
    const now = Date.now();
    eventTimestampsRef.current.push(now);
    
    // Update store
    store.addEvent(event.matchId, event);

    // Notify subscription manager
    subscriptionManagerRef.current?.publish(event);

    // Call event callback
    onEvent?.(event);

    // Update EPM
    updateEventsPerMinute();
  }, [onEvent, store]);

  const updateEventsPerMinute = useCallback(() => {
    const now = Date.now();
    const windowStart = now - EVENTS_PER_MINUTE_WINDOW;
    
    // Remove old timestamps
    eventTimestampsRef.current = eventTimestampsRef.current.filter(t => t > windowStart);
    
    // Calculate EPM
    const epm = eventTimestampsRef.current.length;
    setEventsPerMinute(epm);
  }, []);

  // Update EPM periodically
  useEffect(() => {
    const interval = setInterval(updateEventsPerMinute, 10000);
    return () => clearInterval(interval);
  }, [updateEventsPerMinute]);

  // =============================================================================
  // Subscription Management
  // =============================================================================

  const subscribeToMatch = useCallback((id: string) => {
    if (!connectionRef.current?.isConnected()) return;

    // Subscribe via WebSocket
    connectionRef.current.send({
      action: 'subscribe',
      topic: `match:${id}`,
      filter: eventTypes ? { eventTypes } : undefined,
    });

    // Add to store subscriptions
    store.subscribe(`match:${id}` as `match:${string}`, { eventTypes });

    hookLogger.debug('Subscribed to match', { matchId: id });
  }, [eventTypes, store]);

  const selectMatch = useCallback((id: string | null) => {
    // Unsubscribe from previous match if any
    if (currentMatchId && currentMatchId !== id) {
      connectionRef.current?.send({
        action: 'unsubscribe',
        topic: `match:${currentMatchId}`,
      });
    }

    // Update store selection
    store.selectMatch(id);

    // Subscribe to new match if connected
    if (id && connectionRef.current?.isConnected()) {
      subscribeToMatch(id);
    }
  }, [currentMatchId, store, subscribeToMatch]);

  const clearEvents = useCallback(() => {
    if (currentMatchId) {
      store.clearEvents(currentMatchId);
    }
  }, [currentMatchId, store]);

  // =============================================================================
  // Match Selection Effect
  // =============================================================================

  useEffect(() => {
    if (initialMatchId && initialMatchId !== selectedMatchId) {
      selectMatch(initialMatchId);
    }
  }, [initialMatchId, selectedMatchId, selectMatch]);

  // =============================================================================
  // Cleanup
  // =============================================================================

  const cleanup = useCallback(() => {
    // Unsubscribe from all
    if (currentMatchId) {
      connectionRef.current?.send({
        action: 'unsubscribe',
        topic: `match:${currentMatchId}`,
      });
    }

    // Destroy managers
    connectionRef.current?.destroy();
    messageHandlerRef.current = null;
    subscriptionManagerRef.current = null;

    hookLogger.debug('Hook cleanup complete');
  }, [currentMatchId]);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // State
    match,
    events,
    isLoading,
    isConnected,
    isConnecting,
    error,

    // Metrics
    latency,
    connectionQuality,
    eventsPerMinute,

    // Actions
    connect,
    disconnect,
    reconnect,
    clearEvents,
    selectMatch,
  };
}

// =============================================================================
// Specialized Hooks
// =============================================================================

/**
 * Hook for tracking specific event types
 */
export function useLiveEvents(
  matchId: string | undefined,
  eventTypes: LiveEventType[],
  options: { maxEvents?: number } = {}
): {
  events: LiveEvent[];
  latestEvent: LiveEvent | null;
  eventCount: number;
} {
  const { events } = useLiveMatch({
    matchId,
    eventTypes,
    autoConnect: true,
  });

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => eventTypes.includes(e.type));
    if (options.maxEvents) {
      result = result.slice(0, options.maxEvents);
    }
    return result;
  }, [events, eventTypes, options.maxEvents]);

  const latestEvent = filteredEvents[0] || null;

  return {
    events: filteredEvents,
    latestEvent,
    eventCount: filteredEvents.length,
  };
}

/**
 * Hook for live match score tracking
 */
export function useLiveScore(matchId: string | undefined): {
  teamAScore: number;
  teamBScore: number;
  currentRound: number;
  isLive: boolean;
  lastUpdate: string | null;
} {
  const { match } = useLiveMatch({ matchId, autoConnect: true });

  return {
    teamAScore: match?.teamA.score || 0,
    teamBScore: match?.teamB.score || 0,
    currentRound: match?.currentRound || 0,
    isLive: match?.status === 'live',
    lastUpdate: match?.lastUpdateTime || null,
  };
}

/**
 * Hook for connection status
 */
export function useLiveConnectionStatus(): {
  isConnected: boolean;
  isConnecting: boolean;
  quality: ConnectionQuality;
  latency: number;
  error: Error | null;
} {
  const store = useRealtimeStore();

  return {
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    quality: store.connectionQuality,
    latency: store.latency,
    error: store.connectionError,
  };
}

/**
 * Hook for multiple match subscriptions
 */
export function useLiveMatches(matchIds: string[]): {
  matches: Map<string, LiveMatchState>;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
} {
  const { isConnected, connect, disconnect } = useLiveMatch({ autoConnect: false });
  const store = useRealtimeStore();

  // Subscribe to all matches
  useEffect(() => {
    if (!isConnected) return;

    matchIds.forEach(id => {
      store.subscribe(`match:${id}` as `match:${string}`);
    });

    return () => {
      matchIds.forEach(id => {
        // Unsubscribe handled by store
      });
    };
  }, [matchIds, isConnected, store]);

  const matches = useMemo(() => {
    const result = new Map<string, LiveMatchState>();
    matchIds.forEach(id => {
      const match = store.activeMatches.get(id);
      if (match) {
        result.set(id, match);
      }
    });
    return result;
  }, [matchIds, store.activeMatches]);

  return {
    matches,
    connect,
    disconnect,
    isConnected,
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default useLiveMatch;
