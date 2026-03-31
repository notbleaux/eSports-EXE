/**
 * WebSocket Client for Live Match Updates
 * 
 * Provides real-time connection to match events and predictions.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

import { create } from 'zustand';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// --- Types ---

export interface LivePlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  acs: number;
  adr: number;
}

export interface LiveMatchState {
  current_round: number;
  team1_score: number;
  team2_score: number;
  player_stats: Record<string, LivePlayerStats>;
  win_probability: {
    team1: number;
    team2: number;
  } | null;
}

export interface WebSocketMessage {
  type: string;
  match_id?: number;
  timestamp?: string;
  data?: unknown;
  message?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// --- WebSocket Store ---

interface WebSocketState {
  // Connection state
  status: ConnectionStatus;
  matchId: number | null;
  clientId: string;
  
  // Data
  matchState: LiveMatchState | null;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  
  // Actions
  connect: (matchId: number) => void;
  disconnect: () => void;
  sendMessage: (message: unknown) => void;
  subscribe: (matchId: number) => void;
  unsubscribe: (matchId: number) => void;
  requestState: (matchId?: number) => void;
}

// WebSocket instance (outside store to prevent recreation)
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export const useWebSocket = create<WebSocketState>((set, get) => ({
  status: 'disconnected',
  matchId: null,
  clientId: generateClientId(),
  matchState: null,
  lastMessage: null,
  error: null,
  
  connect: (matchId: number) => {
    // Close existing connection
    if (ws) {
      ws.close();
    }
    
    set({ status: 'connecting', matchId, error: null });
    
    const clientId = get().clientId;
    const wsUrl = `${WS_BASE_URL}/ws/live/${matchId}?client_id=${clientId}`;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`[WebSocket] Connected to match ${matchId}`);
        reconnectAttempts = 0;
        set({ status: 'connected' });
        
        // Send initial heartbeat
        ws?.send(JSON.stringify({ type: 'heartbeat' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message, set, get);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        set({ status: 'error', error: 'WebSocket error occurred' });
      };
      
      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        set({ status: 'disconnected' });
        
        // Attempt reconnect if not manually disconnected
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && get().matchId) {
          set({ status: 'reconnecting' });
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts})`);
            get().connect(get().matchId!);
          }, RECONNECT_DELAY);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      set({ status: 'error', error: 'Failed to connect' });
    }
  },
  
  disconnect: () => {
    // Clear reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    // Close connection
    if (ws) {
      ws.close();
      ws = null;
    }
    
    set({
      status: 'disconnected',
      matchId: null,
      matchState: null,
      error: null,
    });
  },
  
  sendMessage: (message: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  },
  
  subscribe: (matchId: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'subscribe', match_id: matchId }));
    }
  },
  
  unsubscribe: (matchId: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', match_id: matchId }));
    }
  },
  
  requestState: (matchId?: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'get_state',
        match_id: matchId || get().matchId,
      }));
    }
  },
}));

// --- Message Handler ---

function handleMessage(
  message: WebSocketMessage,
  set: (state: Partial<WebSocketState>) => void,
  get: () => WebSocketState
) {
  set({ lastMessage: message });
  
  switch (message.type) {
    case 'initial_state':
    case 'state':
    case 'state_update':
      if (message.data) {
        set({ matchState: message.data as LiveMatchState });
      }
      break;
      
    case 'prediction':
      // Update prediction in match state
      const currentState = get().matchState;
      if (currentState && message.data) {
        set({
          matchState: {
            ...currentState,
            win_probability: (message.data as { win_probability: { team1: number; team2: number } }).win_probability,
          },
        });
      }
      break;
      
    case 'event':
      // Handle specific events (kills, round end, etc.)
      console.log('[WebSocket] Event:', message.data);
      break;
      
    case 'match_ended':
      console.log('[WebSocket] Match ended:', message.match_id);
      set({ matchState: null });
      break;
      
    case 'error':
      console.error('[WebSocket] Server error:', message.message);
      set({ error: message.message || 'Unknown error' });
      break;
      
    case 'heartbeat_ack':
      // Heartbeat acknowledged
      break;
      
    case 'subscribed':
      console.log('[WebSocket] Subscribed to match:', message.match_id);
      break;
      
    case 'unsubscribed':
      console.log('[WebSocket] Unsubscribed from match:', message.match_id);
      break;
      
    default:
      console.log('[WebSocket] Unknown message type:', message.type);
  }
}

// --- Helpers ---

function generateClientId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// --- Hooks for Components ---

/**
 * Hook to get connection status.
 */
export function useConnectionStatus(): ConnectionStatus {
  return useWebSocket((state) => state.status);
}

/**
 * Hook to get live match state.
 */
export function useLiveMatchState(): LiveMatchState | null {
  return useWebSocket((state) => state.matchState);
}

/**
 * Hook to check if connected.
 */
export function useIsConnected(): boolean {
  return useWebSocket((state) => state.status === 'connected');
}

/**
 * Hook to get connection actions.
 */
export function useWebSocketActions() {
  return useWebSocket((state) => ({
    connect: state.connect,
    disconnect: state.disconnect,
    sendMessage: state.sendMessage,
    subscribe: state.subscribe,
    unsubscribe: state.unsubscribe,
    requestState: state.requestState,
  }));
}

// --- Auto Heartbeat ---

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Start auto heartbeat.
 */
export function startHeartbeat(intervalMs = 30000) {
  stopHeartbeat();
  
  heartbeatInterval = setInterval(() => {
    const { sendMessage, status } = useWebSocket.getState();
    if (status === 'connected') {
      sendMessage({ type: 'heartbeat' });
    }
  }, intervalMs);
}

/**
 * Stop auto heartbeat.
 */
export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
