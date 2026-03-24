/**
 * useLiveData - Hook for managing live stream data
 * 
 * Features:
 * - WebSocket connection for real-time updates
 * - REST API fallback for initial load
 * - Auto-reconnect with exponential backoff
 * - Error handling and recovery
 * 
 * [Ver002.000] - Replaced mock data with actual API integration
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { streamingLogger } from '@/utils/logger';
import type {
  Stream,
  LiveEvent,
  LiveMatch,
  ChatMessage,
  UseLiveDataReturn,
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/v1/ws';

// Polling intervals
const POLLING_INTERVAL = 30000; // 30 seconds for REST fallback
const WS_RECONNECT_DELAY = 3000; // 3 seconds initial reconnect delay
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds between reconnects

// Fallback mock data for development/demo mode
const MOCK_STREAMS: Stream[] = [
  {
    id: '1',
    url: 'https://www.twitch.tv/valorant',
    platform: 'twitch',
    title: 'VCT 2026 Masters Tokyo - Official Broadcast',
    matchId: 'match-1',
  },
  {
    id: '2',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'youtube',
    title: 'Thinking Man\'s Valorant - Co-stream',
    matchId: 'match-1',
  },
];

/**
 * Hook for managing live stream data with WebSocket and REST API
 */
export const useLiveData = (): UseLiveDataReturn => {
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  /**
   * Fetch live events from API (REST)
   */
  const fetchLiveEvents = useCallback(async (): Promise<LiveEvent[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/opera/live/events`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.events || [];
    } catch (err) {
      console.warn('[useLiveData] Failed to fetch live events:', err);
      // Return empty array on error - component should handle empty state
      return [];
    }
  }, []);

  /**
   * Fetch live matches from API (REST)
   */
  const fetchLiveMatches = useCallback(async (): Promise<LiveMatch[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/opera/live/matches`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.matches || [];
    } catch (err) {
      console.warn('[useLiveData] Failed to fetch live matches:', err);
      return [];
    }
  }, []);

  /**
   * Fetch chat messages from API (REST)
   */
  const fetchChatMessages = useCallback(async (): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/opera/live/chat`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (err) {
      console.warn('[useLiveData] Failed to fetch chat messages:', err);
      return [];
    }
  }, []);

  /**
   * Handle WebSocket messages
   */
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'live_match_update':
          setLiveMatches((prev) => {
            const updated = message.data as LiveMatch;
            const index = prev.findIndex((m) => m.id === updated.id);
            if (index >= 0) {
              const newMatches = [...prev];
              newMatches[index] = updated;
              return newMatches;
            }
            return [...prev, updated];
          });
          break;
          
        case 'live_event_update':
          setLiveEvents((prev) => {
            const updated = message.data as LiveEvent;
            const index = prev.findIndex((e) => e.id === updated.id);
            if (index >= 0) {
              const newEvents = [...prev];
              newEvents[index] = updated;
              return newEvents;
            }
            return [...prev, updated];
          });
          break;
          
        case 'chat_message':
          setChatMessages((prev) => {
            const newMessage = message.data as ChatMessage;
            // Prevent duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            // Keep only last 100 messages
            return [...prev, newMessage].slice(-100);
          });
          break;
          
        case 'ping':
          // Respond to keep-alive ping
          wsRef.current?.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log('[useLiveData] Unknown message type:', message.type);
      }
    } catch (err) {
      streamingLogger.error('Failed to parse WebSocket message', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  /**
   * Connect WebSocket for real-time updates
   */
  const connectWebSocket = useCallback(() => {
    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/opera/live`);
      
      ws.onopen = () => {
        console.log('[useLiveData] WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Subscribe to live data channels
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['live_matches', 'live_events', 'chat'],
        }));
      };
      
      ws.onmessage = handleWebSocketMessage;
      
      ws.onerror = (err) => {
        streamingLogger.error('WebSocket error', {
          error: err instanceof Error ? err.message : String(err),
        });
        setError(new Error('WebSocket connection error'));
      };
      
      ws.onclose = () => {
        console.log('[useLiveData] WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt reconnect with exponential backoff
        const delay = Math.min(
          WS_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          MAX_RECONNECT_DELAY
        );
        
        reconnectAttemptsRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[useLiveData] Attempting reconnect #${reconnectAttemptsRef.current}`);
          connectWebSocket();
        }, delay);
      };
      
      wsRef.current = ws;
    } catch (err) {
      streamingLogger.error('Failed to create WebSocket', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(new Error('Failed to establish real-time connection'));
    }
  }, [handleWebSocketMessage]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  /**
   * Switch to a different stream
   */
  const switchStream = useCallback((streamId: string) => {
    const stream = MOCK_STREAMS.find((s) => s.id === streamId);
    if (stream) {
      setCurrentStream(stream);
      
      // Notify server of stream switch
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'switch_stream',
          streamId,
        }));
      }
    }
  }, []);

  /**
   * Refresh all live data via REST API
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [events, matches, messages] = await Promise.all([
        fetchLiveEvents(),
        fetchLiveMatches(),
        fetchChatMessages(),
      ]);

      setLiveEvents(events);
      setLiveMatches(matches);
      setChatMessages(messages);

      // Set initial stream if none selected
      if (!currentStream && MOCK_STREAMS.length > 0) {
        setCurrentStream(MOCK_STREAMS[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchLiveEvents, fetchLiveMatches, fetchChatMessages, currentStream]);

  /**
   * Start REST polling as fallback
   */
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      // Only poll if WebSocket is not connected
      if (!isConnected) {
        fetchLiveMatches().then(setLiveMatches).catch((err) => {
          streamingLogger.error('Failed to fetch live matches during polling', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
        fetchChatMessages().then(setChatMessages).catch((err) => {
          streamingLogger.error('Failed to fetch chat messages during polling', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    }, POLLING_INTERVAL);
  }, [fetchLiveMatches, fetchChatMessages, isConnected]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Initial load and real-time setup
  useEffect(() => {
    // Load initial data via REST
    refreshData();
    
    // Connect WebSocket for real-time updates
    connectWebSocket();
    
    // Start polling as fallback
    startPolling();

    return () => {
      stopPolling();
      disconnectWebSocket();
    };
  }, [refreshData, connectWebSocket, disconnectWebSocket, startPolling, stopPolling]);

  return {
    currentStream,
    liveEvents,
    liveMatches,
    chatMessages,
    isLoading,
    error,
    isConnected,
    switchStream,
    refreshData,
  };
};

export default useLiveData;
