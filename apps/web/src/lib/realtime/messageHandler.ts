// @ts-nocheck
/**
 * Message Handler - Parse and Route Live Match Events
 * 
 * Features:
 * - Parse live match events from WebSocket messages
 * - Route events to subscribers based on topic and filters
 * - Message validation and schema checking
 * - Error recovery for malformed messages
 * - Event deduplication
 * 
 * [Ver001.000] - Message handling and routing
 */

import { logger } from '../../utils/logger';
import type {
  LiveEvent,
  LiveEventType,
  LiveEventData,
  LiveMessage,
  Subscription,
  SubscriptionFilter,
  SubscriptionTopic,
  RealtimeError,
} from './types';

const messageLogger = logger.child('MessageHandler');

// =============================================================================
// Types
// =============================================================================

export interface ParsedMessage {
  valid: boolean;
  event?: LiveEvent;
  error?: string;
  raw: unknown;
}

export interface RouteResult {
  success: boolean;
  matchedSubscriptions: string[];
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type MessageHandlerCallback = (event: LiveEvent) => void;

export interface HandlerRegistry {
  topic: SubscriptionTopic;
  filter?: SubscriptionFilter;
  callback: MessageHandlerCallback;
  priority: number;
  id: string;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
const MAX_EVENT_AGE_MS = 5 * 60 * 1000; // 5 minutes
const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds

const REQUIRED_EVENT_FIELDS: (keyof LiveEvent)[] = ['id', 'type', 'matchId', 'timestamp', 'data'];

const VALID_EVENT_TYPES: LiveEventType[] = [
  'match_start', 'match_end', 'round_start', 'round_end',
  'kill', 'death', 'assist', 'spike_plant', 'spike_defuse', 'spike_explode',
  'economy_update', 'ability_use', 'damage_dealt', 'score_update',
  'player_connect', 'player_disconnect', 'timeout_called', 'timeout_end',
  'pause', 'resume', 'team_switch', 'overtime', 'technical_issue',
];

// =============================================================================
// Message Handler
// =============================================================================

export class LiveMessageHandler {
  private handlers = new Map<string, HandlerRegistry>();
  private recentEventIds = new Map<string, number>(); // eventId -> timestamp
  private stats = {
    messagesReceived: 0,
    messagesValid: 0,
    messagesInvalid: 0,
    eventsRouted: 0,
    eventsDropped: 0,
    errors: 0,
  };

  constructor(private options: { enableDeduplication?: boolean } = {}) {
    this.options = {
      enableDeduplication: true,
      ...options,
    };

    // Start cleanup interval for deduplication cache
    if (this.options.enableDeduplication) {
      setInterval(() => this.cleanupDeduplicationCache(), DEDUPLICATION_WINDOW_MS);
    }
  }

  // =============================================================================
  // Public API
  // =============================================================================

  /**
   * Parse and validate a WebSocket message
   */
  parseMessage(data: string | ArrayBuffer | Blob): ParsedMessage {
    this.stats.messagesReceived++;

    try {
      // Handle different data types
      let raw: unknown;
      if (typeof data === 'string') {
        // Check size
        if (data.length > MAX_MESSAGE_SIZE) {
          throw new Error(`Message exceeds max size: ${data.length} > ${MAX_MESSAGE_SIZE}`);
        }
        raw = JSON.parse(data);
      } else if (data instanceof ArrayBuffer) {
        if (data.byteLength > MAX_MESSAGE_SIZE) {
          throw new Error(`Message exceeds max size: ${data.byteLength} > ${MAX_MESSAGE_SIZE}`);
        }
        raw = JSON.parse(new TextDecoder().decode(data));
      } else if (data instanceof Blob) {
        // Blobs need to be read asynchronously - this shouldn't happen in normal operation
        throw new Error('Blob messages not supported synchronously');
      } else {
        raw = data;
      }

      // Validate message structure
      const validation = this.validateMessage(raw);
      if (!validation.valid) {
        this.stats.messagesInvalid++;
        return {
          valid: false,
          error: validation.errors.join(', '),
          raw,
        };
      }

      const message = raw as LiveMessage;

      // Handle different message types
      if (message.type === 'event') {
        const event = message.payload as LiveEvent;
        
        // Check for duplicates
        if (this.options.enableDeduplication && this.isDuplicate(event)) {
          return {
            valid: true,
            event,
            raw,
          };
        }

        this.stats.messagesValid++;
        return {
          valid: true,
          event,
          raw,
        };
      }

      // Non-event messages (ping/pong/subscribe confirmations)
      return {
        valid: true,
        raw,
      };
    } catch (error) {
      this.stats.messagesInvalid++;
      this.stats.errors++;
      messageLogger.error('Failed to parse message:', error);
      
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown parse error',
        raw: data,
      };
    }
  }

  /**
   * Validate message structure
   */
  validateMessage(message: unknown): ValidationResult {
    const errors: string[] = [];

    if (!message || typeof message !== 'object') {
      return { valid: false, errors: ['Message must be an object'] };
    }

    const msg = message as Record<string, unknown>;

    // Check required fields
    if (!msg.type || typeof msg.type !== 'string') {
      errors.push('Missing or invalid "type" field');
    }

    if (!msg.payload || typeof msg.payload !== 'object') {
      errors.push('Missing or invalid "payload" field');
    }

    // If it's an event message, validate the event payload
    if (msg.type === 'event' && msg.payload) {
      const eventValidation = this.validateEvent(msg.payload as Record<string, unknown>);
      errors.push(...eventValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate event structure
   */
  validateEvent(event: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    for (const field of REQUIRED_EVENT_FIELDS) {
      if (!(field in event)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate event type
    if (event.type && !VALID_EVENT_TYPES.includes(event.type as LiveEventType)) {
      errors.push(`Invalid event type: ${event.type}`);
    }

    // Validate timestamp format
    if (event.timestamp) {
      const timestamp = new Date(event.timestamp as string);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      } else {
        // Check if event is too old
        const age = Date.now() - timestamp.getTime();
        if (age > MAX_EVENT_AGE_MS) {
          errors.push(`Event is too old: ${age}ms`);
        }
        // Check if event is in the future (more than 1 minute)
        if (age < -60000) {
          errors.push('Event timestamp is in the future');
        }
      }
    }

    // Validate confidence
    if (event.confidence !== undefined) {
      const confidence = event.confidence as number;
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        errors.push('Invalid confidence value (must be 0-1)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Register a handler for events
   */
  registerHandler(
    topic: SubscriptionTopic,
    callback: MessageHandlerCallback,
    filter?: SubscriptionFilter,
    priority: number = 0
  ): string {
    const id = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.handlers.set(id, {
      topic,
      filter,
      callback,
      priority,
      id,
    });

    messageLogger.debug('Handler registered', { id, topic, priority });
    return id;
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(handlerId: string): boolean {
    const deleted = this.handlers.delete(handlerId);
    if (deleted) {
      messageLogger.debug('Handler unregistered', { id: handlerId });
    }
    return deleted;
  }

  /**
   * Route an event to matching handlers
   */
  routeEvent(event: LiveEvent): RouteResult {
    const matchedSubscriptions: string[] = [];

    // Sort handlers by priority (higher first)
    const sortedHandlers = Array.from(this.handlers.values())
      .sort((a, b) => b.priority - a.priority);

    for (const handler of sortedHandlers) {
      try {
        if (this.matchesFilter(event, handler.topic, handler.filter)) {
          handler.callback(event);
          matchedSubscriptions.push(handler.id);
          this.stats.eventsRouted++;
        }
      } catch (error) {
        this.stats.errors++;
        messageLogger.error('Handler error:', error);
        // Continue with other handlers
      }
    }

    if (matchedSubscriptions.length === 0) {
      this.stats.eventsDropped++;
    }

    return {
      success: true,
      matchedSubscriptions,
    };
  }

  /**
   * Process a message (parse and route)
   */
  processMessage(data: string | ArrayBuffer | Blob): RouteResult | null {
    const parsed = this.parseMessage(data);

    if (!parsed.valid) {
      messageLogger.warn('Invalid message:', parsed.error);
      return {
        success: false,
        matchedSubscriptions: [],
        error: parsed.error,
      };
    }

    if (parsed.event) {
      return this.routeEvent(parsed.event);
    }

    // Non-event messages don't get routed
    return null;
  }

  /**
   * Get handler statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      messagesReceived: 0,
      messagesValid: 0,
      messagesInvalid: 0,
      eventsRouted: 0,
      eventsDropped: 0,
      errors: 0,
    };
  }

  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
    messageLogger.info('All handlers cleared');
  }

  /**
   * Get number of registered handlers
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private matchesFilter(
    event: LiveEvent,
    topic: SubscriptionTopic,
    filter?: SubscriptionFilter
  ): boolean {
    // Parse topic
    const [topicType, topicId] = topic.split(':') as [string, string];

    // Check topic match
    switch (topicType) {
      case 'match':
        if (event.matchId !== topicId) return false;
        break;
      case 'player':
        // Check if event involves this player
        if (!this.eventInvolvesPlayer(event, topicId)) return false;
        break;
      case 'team':
        // Check if event involves this team
        if (!this.eventInvolvesTeam(event, topicId)) return false;
        break;
      case 'tournament':
        // Would need tournament ID in event - for now, pass through
        break;
      case 'system':
        // System topics pass all events
        break;
      default:
        return false;
    }

    // Apply additional filters
    if (filter) {
      // Event type filter
      if (filter.eventTypes && !filter.eventTypes.includes(event.type)) {
        return false;
      }

      // Confidence filter
      if (filter.minConfidence !== undefined && event.confidence < filter.minConfidence) {
        return false;
      }

      // Team filter
      if (filter.teams && !this.eventInvolvesTeams(event, filter.teams)) {
        return false;
      }

      // Player filter
      if (filter.players && !this.eventInvolvesPlayers(event, filter.players)) {
        return false;
      }
    }

    return true;
  }

  private eventInvolvesPlayer(event: LiveEvent, playerId: string): boolean {
    // Check if player is involved in the event
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      
      // Common player ID fields
      const playerFields = ['playerId', 'attackerId', 'victimId', 'assists'];
      for (const field of playerFields) {
        if (data[field] === playerId) return true;
        if (Array.isArray(data[field]) && (data[field] as string[]).includes(playerId)) {
          return true;
        }
      }
    }
    return false;
  }

  private eventInvolvesPlayers(event: LiveEvent, playerIds: string[]): boolean {
    return playerIds.some(id => this.eventInvolvesPlayer(event, id));
  }

  private eventInvolvesTeam(event: LiveEvent, teamId: string): boolean {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      
      // Common team ID fields
      const teamFields = ['teamId', 'attackerTeam', 'victimTeam', 'winningTeam', 'teamAId', 'teamBId'];
      for (const field of teamFields) {
        if (data[field] === teamId) return true;
      }
    }
    return false;
  }

  private eventInvolvesTeams(event: LiveEvent, teamIds: string[]): boolean {
    return teamIds.some(id => this.eventInvolvesTeam(event, id));
  }

  private isDuplicate(event: LiveEvent): boolean {
    const now = Date.now();
    const existingTimestamp = this.recentEventIds.get(event.id);
    
    if (existingTimestamp && now - existingTimestamp < DEDUPLICATION_WINDOW_MS) {
      return true;
    }

    // Add to cache
    this.recentEventIds.set(event.id, now);
    return false;
  }

  private cleanupDeduplicationCache(): void {
    const now = Date.now();
    for (const [eventId, timestamp] of this.recentEventIds) {
      if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
        this.recentEventIds.delete(eventId);
      }
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a subscription topic string
 */
export function createTopic(
  type: 'match' | 'player' | 'team' | 'tournament' | 'system',
  id: string
): SubscriptionTopic {
  return `${type}:${id}` as SubscriptionTopic;
}

/**
 * Parse a topic string
 */
export function parseTopic(topic: SubscriptionTopic): { type: string; id: string } {
  const [type, ...idParts] = topic.split(':');
  return { type, id: idParts.join(':') };
}

/**
 * Check if an event is a significant game event
 */
export function isSignificantEvent(event: LiveEvent): boolean {
  const significantTypes: LiveEventType[] = [
    'kill', 'spike_plant', 'spike_defuse', 'spike_explode',
    'round_end', 'match_end', 'overtime'
  ];
  return significantTypes.includes(event.type);
}

/**
 * Get event priority for display/notification
 */
export function getEventPriority(event: LiveEvent): 'high' | 'normal' | 'low' {
  switch (event.type) {
    case 'kill':
    case 'spike_plant':
    case 'spike_defuse':
    case 'spike_explode':
    case 'round_end':
      return 'high';
    case 'economy_update':
    case 'ability_use':
    case 'damage_dealt':
      return 'normal';
    default:
      return 'low';
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default LiveMessageHandler;
