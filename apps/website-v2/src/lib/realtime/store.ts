/**
 * Live Data Store - Zustand Store for Real-time Data
 * 
 * Features:
 * - Zustand store for live match data
 * - Real-time state updates
 * - Historical buffer management
 * - Data synchronization
 * - Optimistic updates
 * 
 * [Ver001.000] - Real-time data store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { logger } from '../../utils/logger';

// Enable Immer plugin for Map and Set support
enableMapSet();
import type {
  RealtimeStore,
  RealtimeStoreState,
  LiveMatchState,
  LiveEvent,
  SubscriptionTopic,
  SubscriptionFilter,
  Subscription,
} from './types';

const storeLogger = logger.child('LiveDataStore');

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_STATE: RealtimeStoreState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  connectionQuality: 'unknown',
  latency: 0,
  activeMatches: new Map(),
  selectedMatchId: null,
  subscriptions: new Map(),
  eventBuffer: [],
  maxBufferSize: 1000,
};

const MAX_EVENTS_PER_MATCH = 500;
const BUFFER_FLUSH_SIZE = 100;

// =============================================================================
// Store Creation
// =============================================================================

export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    immer((set, get) => ({
      ...DEFAULT_STATE,

      // =========================================================================
      // Connection Actions
      // =========================================================================

      setConnected: (connected: boolean) => {
        set((state) => {
          state.isConnected = connected;
          if (connected) {
            state.connectionError = null;
            state.isConnecting = false;
          }
        });
        storeLogger.debug('Connection state updated', { connected });
      },

      setConnecting: (connecting: boolean) => {
        set((state) => {
          state.isConnecting = connecting;
        });
      },

      setConnectionError: (error: Error | null) => {
        set((state) => {
          state.connectionError = error;
          if (error) {
            state.isConnected = false;
            state.isConnecting = false;
          }
        });
        if (error) {
          storeLogger.error('Connection error:', error);
        }
      },

      setConnectionQuality: (quality) => {
        set((state) => {
          state.connectionQuality = quality;
        });
      },

      setLatency: (latency: number) => {
        set((state) => {
          state.latency = latency;
        });
      },

      // =========================================================================
      // Match Actions
      // =========================================================================

      updateMatch: (matchId: string, updates: Partial<LiveMatchState>) => {
        set((state) => {
          const existing = state.activeMatches.get(matchId);
          if (existing) {
            state.activeMatches.set(matchId, {
              ...existing,
              ...updates,
              lastUpdateTime: new Date().toISOString(),
            });
          } else {
            storeLogger.warn('Attempted to update non-existent match', { matchId });
          }
        });
      },

      setMatch: (matchId: string, matchState: LiveMatchState) => {
        set((state) => {
          state.activeMatches.set(matchId, {
            ...matchState,
            lastUpdateTime: new Date().toISOString(),
          });
        });
        storeLogger.debug('Match state set', { matchId });
      },

      removeMatch: (matchId: string) => {
        set((state) => {
          state.activeMatches.delete(matchId);
          if (state.selectedMatchId === matchId) {
            state.selectedMatchId = null;
          }
        });
        storeLogger.debug('Match removed', { matchId });
      },

      selectMatch: (matchId: string | null) => {
        set((state) => {
          state.selectedMatchId = matchId;
        });
        storeLogger.debug('Match selected', { matchId });
      },

      // =========================================================================
      // Event Actions
      // =========================================================================

      addEvent: (matchId: string, event: LiveEvent) => {
        set((state) => {
          const match = state.activeMatches.get(matchId);
          if (match) {
            // Add event to match
            match.events.unshift(event);
            
            // Trim events if too many
            if (match.events.length > MAX_EVENTS_PER_MATCH) {
              match.events = match.events.slice(0, MAX_EVENTS_PER_MATCH);
            }

            // Update last update time
            match.lastUpdateTime = new Date().toISOString();

            // Update match state based on event type
            updateMatchFromEvent(match, event);
          } else {
            // Add to buffer for later
            state.eventBuffer.push(event);
            
            // Trim buffer if too large
            if (state.eventBuffer.length > state.maxBufferSize) {
              state.eventBuffer = state.eventBuffer.slice(-state.maxBufferSize);
            }
          }
        });
      },

      clearEvents: (matchId: string) => {
        set((state) => {
          const match = state.activeMatches.get(matchId);
          if (match) {
            match.events = [];
          }
        });
      },

      // =========================================================================
      // Subscription Actions
      // =========================================================================

      subscribe: (
        topic: SubscriptionTopic,
        filter?: SubscriptionFilter,
        priority: Subscription['priority'] = 'normal'
      ): string => {
        const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => {
          state.subscriptions.set(id, {
            id,
            topic,
            filter,
            createdAt: Date.now(),
            priority,
          });
        });

        storeLogger.debug('Subscription added', { id, topic, priority });
        return id;
      },

      unsubscribe: (subscriptionId: string) => {
        set((state) => {
          state.subscriptions.delete(subscriptionId);
        });
        storeLogger.debug('Subscription removed', { id: subscriptionId });
      },

      unsubscribeAll: () => {
        set((state) => {
          state.subscriptions.clear();
        });
        storeLogger.debug('All subscriptions cleared');
      },

      // =========================================================================
      // Buffer Actions
      // =========================================================================

      addToBuffer: (event: LiveEvent) => {
        set((state) => {
          state.eventBuffer.push(event);
          
          if (state.eventBuffer.length > state.maxBufferSize) {
            state.eventBuffer = state.eventBuffer.slice(-state.maxBufferSize);
          }
        });
      },

      flushBuffer: () => {
        const state = get();
        const eventsToProcess = [...state.eventBuffer];
        
        if (eventsToProcess.length === 0) return;

        set((draft) => {
          draft.eventBuffer = [];
        });

        // Process buffered events
        eventsToProcess.forEach((event) => {
          const match = state.activeMatches.get(event.matchId);
          if (match) {
            get().addEvent(event.matchId, event);
          }
        });

        storeLogger.debug('Buffer flushed', { count: eventsToProcess.length });
      },

      clearBuffer: () => {
        set((state) => {
          state.eventBuffer = [];
        });
        storeLogger.debug('Buffer cleared');
      },
    })),
    {
      name: 'realtime-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Update match state based on event
 */
function updateMatchFromEvent(match: LiveMatchState, event: LiveEvent): void {
  switch (event.type) {
    case 'score_update':
      if (event.data && typeof event.data === 'object') {
        const data = event.data as LiveMatchState['score'];
        match.score = { ...match.score, ...data };
        match.teamA.score = data.teamAScore;
        match.teamB.score = data.teamBScore;
      }
      break;

    case 'round_end':
      if (event.data && typeof event.data === 'object') {
        const data = event.data as { roundNumber: number; winningTeam: string; teamAScore: number; teamBScore: number };
        match.currentRound = data.roundNumber + 1;
        match.teamA.score = data.teamAScore;
        match.teamB.score = data.teamBScore;
        match.roundPhase = 'buy';
      }
      break;

    case 'match_end':
      match.status = 'completed';
      match.endTime = event.timestamp;
      break;

    case 'match_start':
      match.status = 'live';
      match.startTime = event.timestamp;
      break;

    case 'pause':
      match.status = 'paused';
      break;

    case 'resume':
      match.status = 'live';
      break;

    case 'round_start':
      match.roundPhase = 'combat';
      if (event.data && typeof event.data === 'object') {
        const data = event.data as { roundNumber: number };
        match.currentRound = data.roundNumber;
      }
      break;
  }
}

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get active match by ID
 */
export function selectMatch(state: RealtimeStore, matchId: string): LiveMatchState | undefined {
  return state.activeMatches.get(matchId);
}

/**
 * Get selected match
 */
export function selectSelectedMatch(state: RealtimeStore): LiveMatchState | null {
  if (!state.selectedMatchId) return null;
  return state.activeMatches.get(state.selectedMatchId) || null;
}

/**
 * Get all active match IDs
 */
export function selectActiveMatchIds(state: RealtimeStore): string[] {
  return Array.from(state.activeMatches.keys());
}

/**
 * Get events for a match
 */
export function selectMatchEvents(state: RealtimeStore, matchId: string): LiveEvent[] {
  const match = state.activeMatches.get(matchId);
  return match?.events || [];
}

/**
 * Get latest events across all matches
 */
export function selectLatestEvents(state: RealtimeStore, count: number = 10): LiveEvent[] {
  const allEvents: LiveEvent[] = [];
  
  state.activeMatches.forEach((match) => {
    allEvents.push(...match.events);
  });

  return allEvents
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, count);
}

/**
 * Get subscriptions for a topic
 */
export function selectSubscriptionsForTopic(
  state: RealtimeStore,
  topic: SubscriptionTopic
): Subscription[] {
  return Array.from(state.subscriptions.values()).filter((sub) => sub.topic === topic);
}

/**
 * Get connection status summary
 */
export function selectConnectionStatus(state: RealtimeStore) {
  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    hasError: state.connectionError !== null,
    quality: state.connectionQuality,
    latency: state.latency,
  };
}

// =============================================================================
// Store Utilities
// =============================================================================

/**
 * Reset the store to initial state
 */
export function resetRealtimeStore(): void {
  useRealtimeStore.setState(DEFAULT_STATE);
  storeLogger.info('Store reset to initial state');
}

/**
 * Export store state (for debugging/persistence)
 */
export function exportStoreState(): string {
  const state = useRealtimeStore.getState();
  return JSON.stringify({
    ...state,
    activeMatches: Array.from(state.activeMatches.entries()),
    subscriptions: Array.from(state.subscriptions.entries()),
  });
}

/**
 * Import store state
 */
export function importStoreState(json: string): void {
  try {
    const parsed = JSON.parse(json);
    useRealtimeStore.setState({
      ...parsed,
      activeMatches: new Map(parsed.activeMatches || []),
      subscriptions: new Map(parsed.subscriptions || []),
    });
    storeLogger.info('Store state imported');
  } catch (error) {
    storeLogger.error('Failed to import store state:', error);
    throw error;
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default useRealtimeStore;
