// @ts-nocheck
/**
 * Sync Manager
 *
 * Manages synchronization between WebSocket real-time data and TanStack Query cache.
 * Ensures UI stays in sync with server state without unnecessary refetches.
 *
 * [Ver001.000]
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './cache-manager';

export interface SyncMessage {
  type: string;
  matchId?: string;
  payload: any;
}

/**
 * Handles WebSocket message synchronization with cache
 */
export class SyncManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Handle live match update from WebSocket
   */
  handleMatchUpdate(message: SyncMessage) {
    if (!message.matchId) return;

    // Update the specific match in cache
    this.queryClient.setQueryData(
      queryKeys.matches.detail(message.matchId),
      (prev: any) => ({
        ...prev,
        ...message.payload,
        updated_at: Date.now() / 1000,
      })
    );

    // Update in live matches list
    const liveKey = queryKeys.matches.live();
    this.queryClient.setQueryData(liveKey, (prev: any) => {
      if (!prev?.matches) return prev;

      const updated = prev.matches.map((m: any) =>
        m.match_id === message.matchId ? { ...m, ...message.payload } : m
      );

      return { ...prev, matches: updated };
    });
  }

  /**
   * Handle review queue update
   */
  handleReviewQueueUpdate(message: SyncMessage) {
    const queueKey = queryKeys.review.queue();

    // Invalidate review queue to force refetch
    this.queryClient.invalidateQueries({ queryKey: queueKey });
  }

  /**
   * Handle batch updates for multiple matches
   */
  handleBatchUpdate(matches: Array<{ match_id: string; [key: string]: any }>) {
    matches.forEach((match) => {
      this.handleMatchUpdate({
        type: 'match_update',
        matchId: match.match_id,
        payload: match,
      });
    });
  }

  /**
   * Handle score update specifically
   */
  handleScoreUpdate(
    matchId: string,
    team1Score: number,
    team2Score: number,
    timestamp: number
  ) {
    this.handleMatchUpdate({
      type: 'score_update',
      matchId,
      payload: {
        team1_score: team1Score,
        team2_score: team2Score,
        updated_at: timestamp / 1000,
      },
    });
  }

  /**
   * Handle match status change
   */
  handleStatusChange(matchId: string, status: 'upcoming' | 'live' | 'finished') {
    this.handleMatchUpdate({
      type: 'status_change',
      matchId,
      payload: { status },
    });
  }

  /**
   * Handle connection status change - invalidate relevant caches
   */
  handleConnectionStatusChange(isConnected: boolean) {
    if (!isConnected) {
      // On disconnect, mark live data as stale
      this.queryClient.setQueryDefaults(
        { queryKey: [queryKeys.matches.live()] },
        { staleTime: 0 }
      );
    } else {
      // On reconnect, invalidate realtime data
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.realtime.all,
      });
    }
  }

  /**
   * Process generic WebSocket message with type routing
   */
  processMessage(message: SyncMessage) {
    switch (message.type) {
      case 'match_update':
        this.handleMatchUpdate(message);
        break;

      case 'score_update':
        if (message.matchId && message.payload) {
          this.handleScoreUpdate(
            message.matchId,
            message.payload.team1_score,
            message.payload.team2_score,
            message.payload.updated_at * 1000
          );
        }
        break;

      case 'status_change':
        if (message.matchId && message.payload.status) {
          this.handleStatusChange(message.matchId, message.payload.status);
        }
        break;

      case 'batch_update':
        if (Array.isArray(message.payload)) {
          this.handleBatchUpdate(message.payload);
        }
        break;

      case 'review_queue_update':
        this.handleReviewQueueUpdate(message);
        break;

      case 'connection_status':
        this.handleConnectionStatusChange(message.payload.isConnected);
        break;

      default:
        console.log('[SyncManager] Unknown message type:', message.type);
    }
  }

  /**
   * Batch process multiple messages (useful for high-frequency updates)
   */
  processBatch(messages: SyncMessage[]) {
    // Group messages by type for efficiency
    const grouped = new Map<string, SyncMessage[]>();

    messages.forEach((msg) => {
      if (!grouped.has(msg.type)) {
        grouped.set(msg.type, []);
      }
      grouped.get(msg.type)!.push(msg);
    });

    // Process groups
    grouped.forEach((msgs, type) => {
      if (type === 'match_update' || type === 'score_update') {
        // For match updates, process individually for precise control
        msgs.forEach((msg) => this.processMessage(msg));
      } else {
        // For other types, process sequentially
        msgs.forEach((msg) => this.processMessage(msg));
      }
    });
  }

  /**
   * Create a function that can be passed to useWebSocket for handling messages
   */
  createMessageHandler() {
    return (message: SyncMessage) => {
      try {
        this.processMessage(message);
      } catch (error) {
        console.error('[SyncManager] Error processing message:', error);
      }
    };
  }
}

/**
 * Create a sync manager instance
 */
export function createSyncManager(queryClient: QueryClient) {
  return new SyncManager(queryClient);
}

/**
 * Hook for using sync manager in components
 */
export function useSyncManager(queryClient: QueryClient) {
  return new SyncManager(queryClient);
}
