// @ts-nocheck
/**
 * Subscription Manager - Manage Live Event Subscriptions
 * 
 * Features:
 * - Subscribe to match events with topic-based routing
 * - Filter events by type, team, player
 * - Unsubscribe handling
 * - Subscription persistence
 * - Priority-based delivery
 * 
 * [Ver001.000] - Subscription management
 */

import { logger } from '../../utils/logger';
import type {
  Subscription,
  SubscriptionTopic,
  SubscriptionFilter,
  LiveEvent,
  LiveEventType,
} from './types';

const subscriptionLogger = logger.child('SubscriptionManager');

// =============================================================================
// Types
// =============================================================================

export interface SubscriptionCallback {
  (event: LiveEvent): void;
}

export interface SubscriptionRegistration {
  id: string;
  topic: SubscriptionTopic;
  filter?: SubscriptionFilter;
  callback: SubscriptionCallback;
  priority: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeTopics: number;
  eventsDelivered: number;
  eventsFiltered: number;
  averageDeliveryTime: number;
}

export interface SubscriptionOptions {
  priority?: number;
  metadata?: Record<string, unknown>;
  once?: boolean;
}

// =============================================================================
// Subscription Manager
// =============================================================================

export class SubscriptionManager {
  private subscriptions = new Map<string, SubscriptionRegistration>();
  private topicIndex = new Map<SubscriptionTopic, Set<string>>();
  private stats: SubscriptionStats = {
    totalSubscriptions: 0,
    activeTopics: 0,
    eventsDelivered: 0,
    eventsFiltered: 0,
    averageDeliveryTime: 0,
  };
  private deliveryTimes: number[] = [];

  constructor(private options: { maxSubscriptions?: number } = {}) {
    this.options = {
      maxSubscriptions: 1000,
      ...options,
    };
  }

  // =============================================================================
  // Public API
  // =============================================================================

  /**
   * Subscribe to a topic
   */
  subscribe(
    topic: SubscriptionTopic,
    callback: SubscriptionCallback,
    filter?: SubscriptionFilter,
    options: SubscriptionOptions = {}
  ): string {
    // Check max subscriptions
    if (this.subscriptions.size >= (this.options.maxSubscriptions || 1000)) {
      throw new Error('Maximum number of subscriptions reached');
    }

    const id = this.generateSubscriptionId();
    const registration: SubscriptionRegistration = {
      id,
      topic,
      filter,
      callback,
      priority: options.priority || 0,
      createdAt: Date.now(),
      metadata: options.metadata,
    };

    // Store subscription
    this.subscriptions.set(id, registration);

    // Index by topic
    if (!this.topicIndex.has(topic)) {
      this.topicIndex.set(topic, new Set());
    }
    this.topicIndex.get(topic)!.add(id);

    this.stats.totalSubscriptions++;
    this.updateActiveTopicsCount();

    subscriptionLogger.debug('Subscription added', { id, topic, priority: registration.priority });

    return id;
  }

  /**
   * Unsubscribe by ID
   */
  unsubscribe(id: string): boolean {
    const registration = this.subscriptions.get(id);
    if (!registration) {
      return false;
    }

    // Remove from topic index
    const topicSet = this.topicIndex.get(registration.topic);
    if (topicSet) {
      topicSet.delete(id);
      if (topicSet.size === 0) {
        this.topicIndex.delete(registration.topic);
      }
    }

    // Remove subscription
    this.subscriptions.delete(id);
    this.stats.totalSubscriptions--;
    this.updateActiveTopicsCount();

    subscriptionLogger.debug('Subscription removed', { id });
    return true;
  }

  /**
   * Unsubscribe all from a topic
   */
  unsubscribeAll(topic: SubscriptionTopic): number {
    const ids = this.topicIndex.get(topic);
    if (!ids) return 0;

    let count = 0;
    ids.forEach((id) => {
      if (this.unsubscribe(id)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Unsubscribe all from all topics
   */
  unsubscribeAllTopics(): void {
    this.subscriptions.clear();
    this.topicIndex.clear();
    this.stats.totalSubscriptions = 0;
    this.stats.activeTopics = 0;
    subscriptionLogger.info('All subscriptions cleared');
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id);
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string): SubscriptionRegistration | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * Get all subscriptions for a topic
   */
  getSubscriptionsForTopic(topic: SubscriptionTopic): SubscriptionRegistration[] {
    const ids = this.topicIndex.get(topic);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.subscriptions.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): SubscriptionRegistration[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get all unique topics
   */
  getTopics(): SubscriptionTopic[] {
    return Array.from(this.topicIndex.keys());
  }

  /**
   * Publish an event to matching subscribers
   */
  publish(event: LiveEvent): RouteResult {
    const startTime = performance.now();
    const matchingSubscriptions = this.findMatchingSubscriptions(event);

    if (matchingSubscriptions.length === 0) {
      this.stats.eventsFiltered++;
      return {
        delivered: 0,
        failed: 0,
        filtered: true,
      };
    }

    // Sort by priority (higher first)
    matchingSubscriptions.sort((a, b) => b.priority - a.priority);

    let delivered = 0;
    let failed = 0;

    for (const sub of matchingSubscriptions) {
      try {
        sub.callback(event);
        delivered++;

        // Handle once subscriptions
        if (sub.metadata?.once) {
          this.unsubscribe(sub.id);
        }
      } catch (error) {
        subscriptionLogger.error('Subscription callback error:', error);
        failed++;
      }
    }

    // Update stats
    this.stats.eventsDelivered += delivered;
    this.recordDeliveryTime(performance.now() - startTime);

    return {
      delivered,
      failed,
      filtered: false,
    };
  }

  /**
   * Publish to a specific topic only
   */
  publishToTopic(topic: SubscriptionTopic, event: LiveEvent): RouteResult {
    const subscriptions = this.getSubscriptionsForTopic(topic);
    
    let delivered = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        if (this.matchesFilter(event, sub.filter)) {
          sub.callback(event);
          delivered++;
        }
      } catch (error) {
        subscriptionLogger.error('Subscription callback error:', error);
        failed++;
      }
    }

    return {
      delivered,
      failed,
      filtered: delivered === 0 && subscriptions.length > 0,
    };
  }

  /**
   * Get subscription statistics
   */
  getStats(): SubscriptionStats {
    return {
      ...this.stats,
      averageDeliveryTime: this.calculateAverageDeliveryTime(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalSubscriptions: 0,
      activeTopics: 0,
      eventsDelivered: 0,
      eventsFiltered: 0,
      averageDeliveryTime: 0,
    };
    this.deliveryTimes = [];
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get topic count
   */
  getTopicCount(): number {
    return this.topicIndex.size;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findMatchingSubscriptions(event: LiveEvent): SubscriptionRegistration[] {
    const matching: SubscriptionRegistration[] = [];

    // Determine relevant topics for this event
    const relevantTopics = this.getRelevantTopics(event);

    for (const topic of relevantTopics) {
      const subs = this.getSubscriptionsForTopic(topic);
      for (const sub of subs) {
        if (this.matchesFilter(event, sub.filter)) {
          matching.push(sub);
        }
      }
    }

    return matching;
  }

  private getRelevantTopics(event: LiveEvent): SubscriptionTopic[] {
    const topics: SubscriptionTopic[] = ['system:global'];

    // Match-specific topic
    topics.push(`match:${event.matchId}` as SubscriptionTopic);

    // Add topics based on event data
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;

      // Team topics
      if (data.teamId) {
        topics.push(`team:${data.teamId}` as SubscriptionTopic);
      }
      if (data.attackerTeam) {
        topics.push(`team:${data.attackerTeam}` as SubscriptionTopic);
      }
      if (data.victimTeam) {
        topics.push(`team:${data.victimTeam}` as SubscriptionTopic);
      }

      // Player topics
      if (data.playerId) {
        topics.push(`player:${data.playerId}` as SubscriptionTopic);
      }
      if (data.attackerId) {
        topics.push(`player:${data.attackerId}` as SubscriptionTopic);
      }
      if (data.victimId) {
        topics.push(`player:${data.victimId}` as SubscriptionTopic);
      }
    }

    return topics;
  }

  private matchesFilter(event: LiveEvent, filter?: SubscriptionFilter): boolean {
    if (!filter) return true;

    // Event type filter
    if (filter.eventTypes && !filter.eventTypes.includes(event.type)) {
      return false;
    }

    // Confidence filter
    if (filter.minConfidence !== undefined && event.confidence < filter.minConfidence) {
      return false;
    }

    // Team filter
    if (filter.teams && filter.teams.length > 0) {
      const involvesTeam = this.eventInvolvesTeams(event, filter.teams);
      if (!involvesTeam) return false;
    }

    // Player filter
    if (filter.players && filter.players.length > 0) {
      const involvesPlayer = this.eventInvolvesPlayers(event, filter.players);
      if (!involvesPlayer) return false;
    }

    return true;
  }

  private eventInvolvesTeams(event: LiveEvent, teams: string[]): boolean {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      const teamFields = ['teamId', 'attackerTeam', 'victimTeam', 'winningTeam'];
      
      for (const field of teamFields) {
        if (teams.includes(data[field] as string)) return true;
      }
    }
    return false;
  }

  private eventInvolvesPlayers(event: LiveEvent, players: string[]): boolean {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      const playerFields = ['playerId', 'attackerId', 'victimId'];
      
      for (const field of playerFields) {
        if (players.includes(data[field] as string)) return true;
      }

      // Check assists array
      if (Array.isArray(data.assists)) {
        if ((data.assists as string[]).some(id => players.includes(id))) return true;
      }
    }
    return false;
  }

  private updateActiveTopicsCount(): void {
    this.stats.activeTopics = this.topicIndex.size;
  }

  private recordDeliveryTime(duration: number): void {
    this.deliveryTimes.push(duration);
    
    // Keep only last 100 measurements
    if (this.deliveryTimes.length > 100) {
      this.deliveryTimes.shift();
    }
  }

  private calculateAverageDeliveryTime(): number {
    if (this.deliveryTimes.length === 0) return 0;
    const sum = this.deliveryTimes.reduce((a, b) => a + b, 0);
    return sum / this.deliveryTimes.length;
  }
}

// =============================================================================
// Types
// =============================================================================

export interface RouteResult {
  delivered: number;
  failed: number;
  filtered?: boolean;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a subscription filter
 */
export function createFilter(
  options: {
    eventTypes?: LiveEventType[];
    teams?: string[];
    players?: string[];
    minConfidence?: number;
  }
): SubscriptionFilter {
  return {
    eventTypes: options.eventTypes,
    teams: options.teams,
    players: options.players,
    minConfidence: options.minConfidence,
  };
}

/**
 * Create a topic string
 */
export function createTopic(
  type: 'match' | 'player' | 'team' | 'tournament' | 'system',
  id: string
): SubscriptionTopic {
  return `${type}:${id}` as SubscriptionTopic;
}

/**
 * Combine multiple filters (AND logic)
 */
export function combineFilters(...filters: SubscriptionFilter[]): SubscriptionFilter {
  return filters.reduce((combined, filter) => ({
    eventTypes: filter.eventTypes || combined.eventTypes,
    teams: filter.teams || combined.teams,
    players: filter.players || combined.players,
    minConfidence: filter.minConfidence ?? combined.minConfidence,
  }));
}

/**
 * Merge filters (OR logic for arrays)
 */
export function mergeFilters(...filters: SubscriptionFilter[]): SubscriptionFilter {
  const eventTypes = new Set<LiveEventType>();
  const teams = new Set<string>();
  const players = new Set<string>();
  let minConfidence: number | undefined;

  for (const filter of filters) {
    filter.eventTypes?.forEach(t => eventTypes.add(t));
    filter.teams?.forEach(t => teams.add(t));
    filter.players?.forEach(p => players.add(p));
    if (filter.minConfidence !== undefined) {
      minConfidence = Math.max(minConfidence || 0, filter.minConfidence);
    }
  }

  return {
    eventTypes: eventTypes.size > 0 ? Array.from(eventTypes) : undefined,
    teams: teams.size > 0 ? Array.from(teams) : undefined,
    players: players.size > 0 ? Array.from(players) : undefined,
    minConfidence,
  };
}

// =============================================================================
// Singleton Instance
// =============================================================================

let globalSubscriptionManager: SubscriptionManager | null = null;

/**
 * Get global subscription manager instance
 */
export function getSubscriptionManager(): SubscriptionManager {
  if (!globalSubscriptionManager) {
    globalSubscriptionManager = new SubscriptionManager();
  }
  return globalSubscriptionManager;
}

/**
 * Reset global subscription manager
 */
export function resetSubscriptionManager(): void {
  if (globalSubscriptionManager) {
    globalSubscriptionManager.unsubscribeAllTopics();
    globalSubscriptionManager = null;
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default SubscriptionManager;
