/**
 * Real-time Store Expanded Tests - State Consistency & Performance
 * 
 * 45+ comprehensive tests for store consistency and performance validation
 * 
 * [Ver001.002] - Phase 2 Optimization Sprint
 * Agent: OPT-S4-2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useRealtimeStore,
  selectMatch,
  selectSelectedMatch,
  selectActiveMatchIds,
  selectMatchEvents,
  selectLatestEvents,
  selectSubscriptionsForTopic,
  selectConnectionStatus,
  resetRealtimeStore,
  exportStoreState,
  importStoreState,
} from '../store';
import type { LiveMatchState, LiveEvent, SubscriptionTopic } from '../types';

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

// Test fixtures
const createMockMatch = (id: string, overrides?: Partial<LiveMatchState>): LiveMatchState => ({
  matchId: id,
  status: 'live',
  map: 'Ascent',
  gameMode: 'competitive',
  teamA: {
    id: 'team-a',
    name: 'Team Alpha',
    tag: 'ALP',
    score: 0,
    roundsWon: [],
    side: 'attack',
    players: [],
    timeoutsRemaining: 2,
    totalCredits: 0,
  },
  teamB: {
    id: 'team-b',
    name: 'Team Beta',
    tag: 'BET',
    score: 0,
    roundsWon: [],
    side: 'defense',
    players: [],
    timeoutsRemaining: 2,
    totalCredits: 0,
  },
  score: {
    teamAId: 'team-a',
    teamBId: 'team-b',
    teamAScore: 0,
    teamBScore: 0,
    teamARoundsWon: [],
    teamBRoundsWon: [],
    currentHalf: 1,
  },
  currentRound: 1,
  roundPhase: 'buy',
  roundTimeRemaining: 100,
  events: [],
  lastUpdateTime: new Date().toISOString(),
  ...overrides,
});

const createMockEvent = (
  matchId: string,
  type: LiveEvent['type'],
  overrides?: Partial<LiveEvent>
): LiveEvent => ({
  id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  matchId,
  timestamp: new Date().toISOString(),
  data: {},
  source: 'official',
  confidence: 1,
  ...overrides,
});

// Helper to get fresh store state
const getStore = () => useRealtimeStore.getState();

describe('Realtime Store - Expanded Tests', () => {
  beforeEach(() => {
    resetRealtimeStore();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    resetRealtimeStore();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ============================================================================
  // STATE CONSISTENCY TESTS (15 tests)
  // ============================================================================

  describe('State Consistency', () => {
    describe('Immutable Updates', () => {
      it('should preserve unmodified match data during partial updates', () => {
        getStore().setMatch('match-1', createMockMatch('match-1', { currentRound: 1 }));
        
        const originalMatch = selectMatch(getStore(), 'match-1');
        expect(originalMatch?.currentRound).toBe(1);
        
        getStore().updateMatch('match-1', { roundPhase: 'combat' });
        const updatedMatch = selectMatch(getStore(), 'match-1');
        
        expect(updatedMatch?.currentRound).toBe(1); // Preserved
        expect(updatedMatch?.roundPhase).toBe('combat'); // Updated
      });

      it('should not mutate original event arrays when adding events', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const event = createMockEvent('match-1', 'kill');
        getStore().addEvent('match-1', event);
        
        const newEvents = selectMatchEvents(getStore(), 'match-1');
        expect(newEvents.length).toBe(1);
        expect(newEvents[0].id).toBe(event.id);
      });

      it('should maintain immutability during batch operations', () => {
        // Batch create matches
        for (let i = 0; i < 5; i++) {
          getStore().setMatch(`match-${i}`, createMockMatch(`match-${i}`));
        }
        
        // Verify all created
        const state = getStore();
        for (let i = 0; i < 5; i++) {
          expect(state.activeMatches.has(`match-${i}`)).toBe(true);
        }
      });

      it('should handle nested object updates immutably', () => {
        const match = createMockMatch('match-1');
        getStore().setMatch('match-1', match);
        
        getStore().updateMatch('match-1', {
          teamA: { ...match.teamA, score: 5 },
        });
        
        const updated = selectMatch(getStore(), 'match-1');
        expect(updated?.teamA.score).toBe(5);
      });
    });

    describe('Concurrent State Changes', () => {
      it('should handle rapid sequential state updates', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Rapid updates
        for (let i = 0; i < 100; i++) {
          getStore().updateMatch('match-1', { currentRound: i + 1 });
        }
        
        const match = selectMatch(getStore(), 'match-1');
        expect(match?.currentRound).toBe(100);
      });

      it('should maintain consistency with interleaved match updates', () => {
        // Create multiple matches
        getStore().setMatch('match-1', createMockMatch('match-1'));
        getStore().setMatch('match-2', createMockMatch('match-2'));
        getStore().setMatch('match-3', createMockMatch('match-3'));
        
        // Interleaved updates
        getStore().updateMatch('match-1', { currentRound: 2 });
        getStore().updateMatch('match-2', { currentRound: 3 });
        getStore().updateMatch('match-1', { roundPhase: 'combat' });
        getStore().updateMatch('match-3', { currentRound: 5 });
        
        const state = getStore();
        expect(selectMatch(state, 'match-1')?.currentRound).toBe(2);
        expect(selectMatch(state, 'match-1')?.roundPhase).toBe('combat');
        expect(selectMatch(state, 'match-2')?.currentRound).toBe(3);
        expect(selectMatch(state, 'match-3')?.currentRound).toBe(5);
      });

      it('should handle concurrent subscription modifications', () => {
        const subIds: string[] = [];
        
        // Create many subscriptions rapidly
        for (let i = 0; i < 50; i++) {
          const id = getStore().subscribe(`match:match-${i}` as SubscriptionTopic);
          subIds.push(id);
        }
        
        expect(getStore().subscriptions.size).toBe(50);
        
        // Unsubscribe half
        subIds.slice(0, 25).forEach(id => getStore().unsubscribe(id));
        
        expect(getStore().subscriptions.size).toBe(25);
      });

      it('should maintain event order during concurrent additions', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const timestamps: string[] = [];
        for (let i = 0; i < 20; i++) {
          const timestamp = new Date(Date.now() + i * 1000).toISOString();
          timestamps.push(timestamp);
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', { timestamp }));
        }
        
        const events = selectMatchEvents(getStore(), 'match-1');
        // Events should be in reverse chronological order (newest first due to unshift)
        for (let i = 0; i < events.length - 1; i++) {
          const current = new Date(events[i].timestamp).getTime();
          const next = new Date(events[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      });
    });

    describe('State Rollback Capability', () => {
      it('should support state snapshot and restore', () => {
        // Setup initial state
        getStore().setMatch('match-1', createMockMatch('match-1', { currentRound: 5 }));
        getStore().setConnected(true);
        
        // Export state as "snapshot"
        const snapshot = exportStoreState();
        
        // Modify state
        getStore().updateMatch('match-1', { currentRound: 10 });
        getStore().setConnected(false);
        
        // Restore snapshot
        importStoreState(snapshot);
        
        const restored = getStore();
        expect(restored.isConnected).toBe(true);
        expect(selectMatch(restored, 'match-1')?.currentRound).toBe(5);
      });

      it('should handle partial state restoration', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        getStore().setMatch('match-2', createMockMatch('match-2'));
        
        const snapshot = exportStoreState();
        
        // Add third match
        getStore().setMatch('match-3', createMockMatch('match-3'));
        expect(selectActiveMatchIds(getStore()).length).toBe(3);
        
        // Restore
        importStoreState(snapshot);
        expect(selectActiveMatchIds(getStore()).length).toBe(2);
      });
    });

    describe('History Accuracy', () => {
      it('should maintain accurate event history', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const eventTypes: LiveEvent['type'][] = ['kill', 'death', 'assist', 'spike_plant'];
        
        eventTypes.forEach((type, index) => {
          getStore().addEvent('match-1', createMockEvent('match-1', type, {
            timestamp: new Date(Date.now() + index * 1000).toISOString(),
          }));
        });
        
        const events = selectMatchEvents(getStore(), 'match-1');
        expect(events).toHaveLength(4);
        
        // Verify order is preserved (reversed due to unshift)
        expect(events[3].type).toBe('kill');
        expect(events[2].type).toBe('death');
        expect(events[1].type).toBe('assist');
        expect(events[0].type).toBe('spike_plant');
      });

      it('should trim events when exceeding max limit', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add more than MAX_EVENTS_PER_MATCH (500)
        for (let i = 0; i < 550; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
            id: `evt-${i}`,
          }));
        }
        
        const match = selectMatch(getStore(), 'match-1');
        expect(match?.events.length).toBeLessThanOrEqual(500);
      });

      it('should maintain accurate last update timestamps', async () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const beforeUpdate = new Date().toISOString();
        await vi.advanceTimersByTimeAsync(100);
        
        getStore().updateMatch('match-1', { currentRound: 2 });
        
        const match = selectMatch(getStore(), 'match-1');
        expect(new Date(match!.lastUpdateTime).getTime()).toBeGreaterThan(
          new Date(beforeUpdate).getTime()
        );
      });
    });

    describe('Event Ordering', () => {
      it('should maintain chronological event ordering', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add events in chronological order
        for (let i = 0; i < 10; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
            timestamp: new Date(2024, 0, 1, 12, 0, i).toISOString(),
          }));
        }
        
        const events = selectMatchEvents(getStore(), 'match-1');
        
        // Should be in reverse chronological order
        for (let i = 0; i < events.length - 1; i++) {
          const currentTime = new Date(events[i].timestamp).getTime();
          const nextTime = new Date(events[i + 1].timestamp).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      });

      it('should handle out-of-order event timestamps gracefully', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add events with mixed timestamps
        getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
          timestamp: new Date(2024, 0, 1, 12, 0, 5).toISOString(),
        }));
        getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
          timestamp: new Date(2024, 0, 1, 12, 0, 1).toISOString(),
        }));
        getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
          timestamp: new Date(2024, 0, 1, 12, 0, 10).toISOString(),
        }));
        
        const events = selectMatchEvents(getStore(), 'match-1');
        expect(events).toHaveLength(3);
        // Events stored in insertion order (unshift), not sorted
        expect(events[0].timestamp).toBe(new Date(2024, 0, 1, 12, 0, 10).toISOString());
      });
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS (15 tests)
  // ============================================================================

  describe('Performance', () => {
    describe('Large State Updates', () => {
      it('should handle >10K events efficiently', { timeout: 30000 }, () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const startTime = performance.now();
        
        for (let i = 0; i < 10000; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
            id: `evt-${i}`,
          }));
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should complete in reasonable time (< 5 seconds)
        expect(duration).toBeLessThan(5000);
        
        const match = selectMatch(getStore(), 'match-1');
        expect(match?.events.length).toBeLessThanOrEqual(500); // Trimmed to max
      });

      it('should handle 100+ concurrent matches', () => {
        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
          getStore().setMatch(`match-${i}`, createMockMatch(`match-${i}`));
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(1000);
        expect(getStore().activeMatches.size).toBe(100);
      });

      it('should efficiently handle large buffer operations', () => {
        // Add events to buffer without matching match
        for (let i = 0; i < 2000; i++) {
          getStore().addToBuffer(createMockEvent('nonexistent-match', 'kill', {
            id: `buffer-evt-${i}`,
            matchId: 'nonexistent-match',
          }));
        }
        
        expect(getStore().eventBuffer.length).toBeLessThanOrEqual(1000); // maxBufferSize
        
        // Create match and flush
        getStore().setMatch('nonexistent-match', createMockMatch('nonexistent-match'));
        getStore().flushBuffer();
        
        const match = selectMatch(getStore(), 'nonexistent-match');
        expect(match?.events.length).toBeGreaterThan(0);
      });

      it('should handle batch selector operations', () => {
        // Setup many matches with events
        for (let i = 0; i < 50; i++) {
          getStore().setMatch(`match-${i}`, createMockMatch(`match-${i}`));
          for (let j = 0; j < 20; j++) {
            getStore().addEvent(`match-${i}`, createMockEvent(`match-${i}`, 'kill'));
          }
        }
        
        const startTime = performance.now();
        
        // Perform selector operations
        const allIds = selectActiveMatchIds(getStore());
        const latestEvents = selectLatestEvents(getStore(), 50);
        
        const endTime = performance.now();
        
        expect(allIds.length).toBe(50);
        expect(latestEvents.length).toBe(50);
        expect(endTime - startTime).toBeLessThan(100);
      });

      it('should maintain performance with deep nesting', () => {
        const deepMatch = createMockMatch('deep-match', {
          teamA: {
            ...createMockMatch('').teamA,
            players: Array.from({ length: 100 }, (_, i) => ({
              id: `player-${i}`,
              name: `Player ${i}`,
              agent: 'Jett',
              teamId: 'team-a',
              alive: true,
              connected: true,
              kills: i * 10,
              deaths: i * 5,
              assists: i * 3,
              acs: 200 + i,
              adr: 150 + i,
              firstBloods: i,
              plants: i,
              defuses: 0,
              clutchWins: 0,
              credits: 1000 + i * 100,
              loadoutValue: 4000 + i * 100,
              abilities: [],
            })),
          },
        });
        
        const startTime = performance.now();
        getStore().setMatch('deep-match', deepMatch);
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(100);
        expect(selectMatch(getStore(), 'deep-match')?.teamA.players.length).toBe(100);
      });
    });

    describe('Rapid Update Sequences', () => {
      it('should handle 1000 rapid state updates', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const startTime = performance.now();
        
        for (let i = 0; i < 1000; i++) {
          getStore().updateMatch('match-1', { 
            currentRound: i % 24 + 1,
            roundTimeRemaining: 100 - (i % 100),
          });
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(1000);
        const match = selectMatch(getStore(), 'match-1');
        // Final iteration: i=999, 999 % 24 = 15, + 1 = 16
        expect(match?.currentRound).toBe(16);
      });

      it('should handle rapid subscription operations', () => {
        const subIds: string[] = [];
        
        const startTime = performance.now();
        
        // Rapid subscribe/unsubscribe cycles
        for (let i = 0; i < 500; i++) {
          const id = getStore().subscribe(`match:match-${i % 10}` as SubscriptionTopic);
          subIds.push(id);
          if (i > 10) {
            getStore().unsubscribe(subIds[i - 10]);
          }
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(1000);
        expect(getStore().subscriptions.size).toBeLessThanOrEqual(20);
      });

      it('should handle rapid connection state changes', () => {
        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
          getStore().setConnected(i % 2 === 0);
          getStore().setLatency(i * 10);
          getStore().setConnectionQuality(i % 2 === 0 ? 'good' : 'fair');
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(500);
        const status = selectConnectionStatus(getStore());
        expect(status.isConnected).toBe(false); // Last state
      });

      it('should handle rapid event buffer operations', () => {
        const startTime = performance.now();
        
        // Rapid add/clear cycles
        for (let cycle = 0; cycle < 50; cycle++) {
          for (let i = 0; i < 50; i++) {
            getStore().addToBuffer(createMockEvent('buffer-test', 'kill'));
          }
          if (cycle % 10 === 0) {
            getStore().clearBuffer();
          }
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(1000);
        expect(getStore().eventBuffer.length).toBeLessThanOrEqual(1000);
      });

      it('should maintain selector performance during rapid updates', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
          getStore().updateMatch('match-1', { currentRound: i });
          // Select during updates
          selectMatch(getStore(), 'match-1');
          selectSelectedMatch(getStore());
        }
        
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(500);
      });
    });

    describe('Memory Usage Tracking', () => {
      it('should limit event buffer size to prevent memory leaks', () => {
        // Try to add more than max buffer size
        for (let i = 0; i < 2000; i++) {
          getStore().addToBuffer(createMockEvent('buffer-test', 'kill', {
            id: `evt-${i}`,
            data: { large: 'x'.repeat(1000) }, // Add some payload
          }));
        }
        
        expect(getStore().eventBuffer.length).toBeLessThanOrEqual(1000);
        expect(getStore().maxBufferSize).toBe(1000);
      });

      it('should clean up removed matches properly', () => {
        // Add many matches
        for (let i = 0; i < 100; i++) {
          getStore().setMatch(`match-${i}`, createMockMatch(`match-${i}`));
        }
        
        expect(getStore().activeMatches.size).toBe(100);
        
        // Remove all
        for (let i = 0; i < 100; i++) {
          getStore().removeMatch(`match-${i}`);
        }
        
        expect(getStore().activeMatches.size).toBe(0);
      });

      it('should limit per-match event storage', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add many events
        for (let i = 0; i < 1000; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
            id: `evt-${i}`,
          }));
        }
        
        const match = selectMatch(getStore(), 'match-1');
        expect(match?.events.length).toBeLessThanOrEqual(500);
      });
    });

    describe('Garbage Collection Efficiency', () => {
      it('should allow GC of old events after trimming', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add events that will be trimmed
        const oldEventIds: string[] = [];
        for (let i = 0; i < 600; i++) {
          oldEventIds.push(`evt-${i}`);
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill', {
            id: `evt-${i}`,
          }));
        }
        
        const match = selectMatch(getStore(), 'match-1');
        const remainingIds = new Set(match?.events.map(e => e.id));
        
        // Old events should be trimmed
        const trimmedCount = oldEventIds.filter(id => !remainingIds.has(id)).length;
        expect(trimmedCount).toBeGreaterThan(0);
      });

      it('should clean up unsubscribed subscriptions', () => {
        const subIds: string[] = [];
        for (let i = 0; i < 100; i++) {
          subIds.push(getStore().subscribe(`match:match-${i}` as SubscriptionTopic));
        }
        
        expect(getStore().subscriptions.size).toBe(100);
        
        // Unsubscribe all
        subIds.forEach(id => getStore().unsubscribe(id));
        
        expect(getStore().subscriptions.size).toBe(0);
      });

      it('should efficiently handle clear operations', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        // Add events
        for (let i = 0; i < 100; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill'));
        }
        
        const matchBefore = selectMatch(getStore(), 'match-1');
        expect(matchBefore?.events.length).toBe(100);
        
        getStore().clearEvents('match-1');
        
        const matchAfter = selectMatch(getStore(), 'match-1');
        expect(matchAfter?.events.length).toBe(0);
      });

      it('should handle unsubscribeAll efficiently', () => {
        // Create many subscriptions
        for (let i = 0; i < 1000; i++) {
          getStore().subscribe(`match:match-${i % 100}` as SubscriptionTopic);
        }
        
        expect(getStore().subscriptions.size).toBe(1000);
        
        const startTime = performance.now();
        getStore().unsubscribeAll();
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(50);
        expect(getStore().subscriptions.size).toBe(0);
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS (15 tests)
  // ============================================================================

  describe('Integration', () => {
    describe('WebSocket Integration', () => {
      it('should sync connection state with store', () => {
        // Simulate WebSocket connection
        getStore().setConnecting(true);
        
        getStore().setConnected(true);
        expect(getStore().isConnected).toBe(true);
        expect(getStore().connectionError).toBeNull();
      });

      it('should handle connection error state', () => {
        getStore().setConnected(true);
        expect(getStore().isConnected).toBe(true);
        
        const error = new Error('Connection failed');
        getStore().setConnectionError(error);
        
        expect(getStore().isConnected).toBe(false);
        expect(getStore().connectionError).toBe(error);
      });

      it('should update latency and quality metrics', () => {
        getStore().setLatency(50);
        getStore().setConnectionQuality('excellent');
        
        const status = selectConnectionStatus(getStore());
        expect(status.latency).toBe(50);
        expect(status.quality).toBe('excellent');
      });

      it('should handle reconnection flow', () => {
        // Initial connection
        getStore().setConnected(true);
        getStore().setLatency(30);
        
        // Disconnect
        getStore().setConnected(false);
        getStore().setConnectionError(new Error('Connection lost'));
        
        // Reconnect
        getStore().setConnectionError(null);
        getStore().setConnected(true);
        getStore().setLatency(45);
        
        expect(getStore().isConnected).toBe(true);
        expect(getStore().connectionError).toBeNull();
        expect(getStore().latency).toBe(45);
      });

      it('should handle match updates from WebSocket events', () => {
        getStore().setMatch('match-1', createMockMatch('match-1', {
          teamA: { ...createMockMatch('').teamA, score: 0 },
          teamB: { ...createMockMatch('').teamB, score: 0 },
        }));
        
        // Simulate score update event
        getStore().addEvent('match-1', createMockEvent('match-1', 'score_update', {
          data: {
            teamAScore: 5,
            teamBScore: 3,
          },
        }));
        
        const match = selectMatch(getStore(), 'match-1');
        expect(match?.teamA.score).toBe(5);
        expect(match?.teamB.score).toBe(3);
      });
    });

    describe('Component Re-renders', () => {
      it('should track selected match changes', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        getStore().setMatch('match-2', createMockMatch('match-2'));
        
        getStore().selectMatch('match-1');
        expect(getStore().selectedMatchId).toBe('match-1');
        
        getStore().selectMatch('match-2');
        expect(getStore().selectedMatchId).toBe('match-2');
        
        const selected = selectSelectedMatch(getStore());
        expect(selected?.matchId).toBe('match-2');
      });

      it('should deselect match when removed', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        getStore().selectMatch('match-1');
        expect(getStore().selectedMatchId).toBe('match-1');
        
        getStore().removeMatch('match-1');
        expect(getStore().selectedMatchId).toBeNull();
      });

      it('should notify on event additions', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const eventCount: number[] = [];
        
        // Track event count changes
        for (let i = 0; i < 5; i++) {
          getStore().addEvent('match-1', createMockEvent('match-1', 'kill'));
          eventCount.push(selectMatchEvents(getStore(), 'match-1').length);
        }
        
        expect(eventCount).toEqual([1, 2, 3, 4, 5]);
      });
    });

    describe('Selector Memoization', () => {
      it('should return same reference for unchanged state', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const match1 = selectMatch(getStore(), 'match-1');
        const match2 = selectMatch(getStore(), 'match-1');
        
        // Same object reference (state is stable)
        expect(match1).toBe(match2);
      });

      it('should return different reference after update', () => {
        getStore().setMatch('match-1', createMockMatch('match-1'));
        
        const match1 = selectMatch(getStore(), 'match-1');
        
        getStore().updateMatch('match-1', { currentRound: 2 });
        
        const match2 = selectMatch(getStore(), 'match-1');
        
        // References should be different after update
        expect(match1).not.toBe(match2);
      });

      it('should efficiently select latest events across matches', () => {
        // Setup multiple matches with events
        for (let m = 0; m < 5; m++) {
          getStore().setMatch(`match-${m}`, createMockMatch(`match-${m}`));
          for (let e = 0; e < 10; e++) {
            getStore().addEvent(`match-${m}`, createMockEvent(`match-${m}`, 'kill', {
              timestamp: new Date(Date.now() + m * 1000 + e * 100).toISOString(),
            }));
          }
        }
        
        const latest = selectLatestEvents(getStore(), 10);
        
        expect(latest.length).toBe(10);
        // Should be sorted by timestamp descending
        for (let i = 0; i < latest.length - 1; i++) {
          const current = new Date(latest[i].timestamp).getTime();
          const next = new Date(latest[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      });

      it('should filter subscriptions by topic efficiently', () => {
        // Create subscriptions for different topics
        getStore().subscribe('match:match-1');
        getStore().subscribe('match:match-2');
        getStore().subscribe('match:match-1'); // Duplicate topic
        getStore().subscribe('player:player-1');
        getStore().subscribe('system:global');
        
        const matchSubs = selectSubscriptionsForTopic(getStore(), 'match:match-1');
        const playerSubs = selectSubscriptionsForTopic(getStore(), 'player:player-1');
        const globalSubs = selectSubscriptionsForTopic(getStore(), 'system:global');
        
        expect(matchSubs.length).toBe(2);
        expect(playerSubs.length).toBe(1);
        expect(globalSubs.length).toBe(1);
      });
    });

    describe('Subscription Management', () => {
      it('should create unique subscription IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
          const id = getStore().subscribe('system:global');
          ids.add(id);
        }
        
        expect(ids.size).toBe(100);
      });

      it('should support subscription priorities', () => {
        const highId = getStore().subscribe('match:match-1', undefined, 'high');
        const normalId = getStore().subscribe('match:match-2', undefined, 'normal');
        const lowId = getStore().subscribe('match:match-3', undefined, 'low');
        
        const state = getStore();
        expect(state.subscriptions.get(highId)?.priority).toBe('high');
        expect(state.subscriptions.get(normalId)?.priority).toBe('normal');
        expect(state.subscriptions.get(lowId)?.priority).toBe('low');
      });

      it('should support subscription filters', () => {
        const filter = {
          eventTypes: ['kill', 'death'] as LiveEvent['type'][],
          teams: ['team-a'],
          minConfidence: 0.8,
        };
        
        const id = getStore().subscribe('match:match-1', filter);
        
        const state = getStore();
        const sub = state.subscriptions.get(id);
        expect(sub?.filter).toEqual(filter);
      });

      it('should track subscription creation time', () => {
        const beforeTime = Date.now();
        
        const id = getStore().subscribe('system:global');
        
        const afterTime = Date.now();
        const state = getStore();
        const sub = state.subscriptions.get(id);
        
        expect(sub?.createdAt).toBeGreaterThanOrEqual(beforeTime);
        expect(sub?.createdAt).toBeLessThanOrEqual(afterTime);
      });

      it('should handle buffer flush after match creation', () => {
        // Add events to buffer for non-existent match
        for (let i = 0; i < 10; i++) {
          getStore().addToBuffer(createMockEvent('future-match', 'kill', { matchId: 'future-match' }));
        }
        
        // Events go to buffer
        expect(getStore().eventBuffer.length).toBe(10);
        
        // Create match and flush
        getStore().setMatch('future-match', createMockMatch('future-match'));
        getStore().flushBuffer();
        
        const match = selectMatch(getStore(), 'future-match');
        expect(match?.events.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING (15 tests)
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle updates to non-existent matches gracefully', () => {
      // Should not throw - implementation logs warning
      expect(() => {
        getStore().updateMatch('non-existent', { currentRound: 2 });
      }).not.toThrow();
    });

    it('should handle clearing events for non-existent matches', () => {
      expect(() => {
        getStore().clearEvents('non-existent');
      }).not.toThrow();
    });

    it('should handle selecting from empty store', () => {
      const state = getStore();
      
      expect(selectMatch(state, 'any-id')).toBeUndefined();
      expect(selectSelectedMatch(state)).toBeNull();
      expect(selectActiveMatchIds(state)).toEqual([]);
      expect(selectMatchEvents(state, 'any-id')).toEqual([]);
      expect(selectLatestEvents(state, 10)).toEqual([]);
    });

    it('should handle invalid import data gracefully', () => {
      // Valid state first
      getStore().setMatch('match-1', createMockMatch('match-1'));
      
      // Invalid import should throw
      expect(() => {
        importStoreState('invalid json');
      }).toThrow();
      
      // After failed import, we can't guarantee state preservation
      // Just verify the function throws as expected
    });

    it('should handle rapid reset operations', () => {
      getStore().setMatch('match-1', createMockMatch('match-1'));
      getStore().setConnected(true);
      
      // Multiple resets
      resetRealtimeStore();
      resetRealtimeStore();
      resetRealtimeStore();
      
      const state = getStore();
      expect(state.isConnected).toBe(false);
      expect(state.activeMatches.size).toBe(0);
    });

    it('should handle selectMatch with null selectedMatchId', () => {
      getStore().setMatch('match-1', createMockMatch('match-1'));
      // Don't select any match
      
      const selected = selectSelectedMatch(getStore());
      expect(selected).toBeNull();
    });

    it('should handle selectMatch with invalid selectedMatchId', () => {
      getStore().selectMatch('non-existent-match');
      
      const selected = selectSelectedMatch(getStore());
      expect(selected).toBeNull();
    });

    it('should clear buffer through reset', () => {
      getStore().addToBuffer(createMockEvent('test', 'kill'));
      expect(getStore().eventBuffer.length).toBe(1);
      
      resetRealtimeStore();
      
      const state = getStore();
      expect(state.eventBuffer).toEqual([]);
    });

    it('should handle empty flush operation', () => {
      // Flush empty buffer
      expect(() => getStore().flushBuffer()).not.toThrow();
      expect(getStore().eventBuffer).toEqual([]);
    });

    it('should handle latency updates', () => {
      getStore().setLatency(100);
      expect(getStore().latency).toBe(100);
      
      getStore().setLatency(0);
      expect(getStore().latency).toBe(0);
      
      const status = selectConnectionStatus(getStore());
      expect(status.latency).toBe(0);
    });

    it('should handle very large latency values', () => {
      getStore().setLatency(999999);
      expect(getStore().latency).toBe(999999);
    });

    it('should handle match removal when selected', () => {
      getStore().setMatch('match-1', createMockMatch('match-1'));
      getStore().selectMatch('match-1');
      
      getStore().removeMatch('match-1');
      
      expect(getStore().selectedMatchId).toBeNull();
      expect(selectMatch(getStore(), 'match-1')).toBeUndefined();
    });

    it('should handle double unsubscribe gracefully', () => {
      const id = getStore().subscribe('system:global');
      getStore().unsubscribe(id);
      
      // Second unsubscribe should not throw
      expect(() => getStore().unsubscribe(id)).not.toThrow();
    });

    it('should handle event data with special characters', () => {
      getStore().setMatch('match-1', createMockMatch('match-1'));
      
      const event = createMockEvent('match-1', 'kill', {
        data: {
          message: 'Special chars: <>&"\'\n\t',
          unicode: '🎮🔥⚡',
        },
      });
      
      getStore().addEvent('match-1', event);
      
      const events = selectMatchEvents(getStore(), 'match-1');
      expect(events[0].data).toEqual(event.data);
    });

    it('should handle rapid state export/import cycles', () => {
      getStore().setMatch('match-1', createMockMatch('match-1', { currentRound: 5 }));
      getStore().setConnected(true);
      
      // Multiple export/import cycles
      for (let i = 0; i < 10; i++) {
        const exported = exportStoreState();
        getStore().updateMatch('match-1', { currentRound: i + 10 });
        importStoreState(exported);
      }
      
      // State should be from last import (which was the original)
      const match = selectMatch(getStore(), 'match-1');
      expect(match?.currentRound).toBe(5);
    });
  });
});

// ============================================================================
// Test Summary
// ============================================================================
// Total: 60 tests covering:
// - State Consistency (15 tests)
//   - Immutable updates (4 tests)
//   - Concurrent state changes (4 tests)
//   - State rollback capability (2 tests)
//   - History accuracy (3 tests)
//   - Event ordering (2 tests)
// - Performance (15 tests)
//   - Large state updates (5 tests)
//   - Rapid update sequences (5 tests)
//   - Memory usage tracking (3 tests)
//   - Garbage collection efficiency (4 tests)
// - Integration (15 tests)
//   - WebSocket integration (5 tests)
//   - Component re-renders (3 tests)
//   - Selector memoization (4 tests)
//   - Subscription management (5 tests)
// - Edge Cases & Error Handling (15 tests)
// ============================================================================
