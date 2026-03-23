/** [Ver001.000] */
/**
 * Broadcast Priority Queue
 * ========================
 * Priority-based message queue with deduplication and rate limiting.
 * 
 * Features:
 * - Priority levels (critical, high, normal, low)
 * - Message deduplication by content hash
 * - Rate limiting (max 10 msg/sec)
 * - TTL-based expiration
 * - Async-only operations (no blocking)
 */

import {
  BroadcastMessage,
  BroadcastPriority,
  QueuedMessage,
  BroadcastQueueConfig,
  DEFAULT_QUEUE_CONFIG,
  PRIORITY_WEIGHTS,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 1000; // 1 second

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a simple hash for message deduplication
 */
function generateMessageHash(message: Omit<BroadcastMessage, 'id' | 'timestamp'>): string {
  const content = `${message.type}:${message.priority}:${message.title}:${message.content}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Broadcast Queue Class
// ============================================================================

export class BroadcastQueue {
  private config: BroadcastQueueConfig;
  private queue: Map<string, QueuedMessage> = new Map();
  private seenHashes: Map<string, number> = new Map(); // hash -> timestamp
  private rateLimitTimestamps: number[] = [];
  private sequenceCounter = 0;

  constructor(config: Partial<BroadcastQueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Add a message to the queue
   * Returns the queued message or null if deduplicated/rate-limited
   */
  enqueue(message: Omit<BroadcastMessage, 'id' | 'timestamp'>): QueuedMessage | null {
    // Check rate limit
    if (this.isRateLimited()) {
      console.warn('[BroadcastQueue] Rate limit exceeded, message dropped');
      return null;
    }

    // Check deduplication
    const hash = generateMessageHash(message);
    if (this.isDuplicate(hash)) {
      console.debug('[BroadcastQueue] Duplicate message detected, skipping');
      return null;
    }

    // Clean expired entries
    this.cleanup();

    // Check queue size
    if (this.queue.size >= this.config.maxSize) {
      // Remove lowest priority oldest message
      this.removeLowestPriority();
    }

    // Create queued message
    const queuedMessage: QueuedMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
      sequence: ++this.sequenceCounter,
      attempts: 0,
    };

    // Add to queue
    this.queue.set(queuedMessage.id, queuedMessage);
    this.seenHashes.set(hash, Date.now());
    this.recordRateLimit();

    return queuedMessage;
  }

  /**
   * Dequeue the highest priority message
   */
  dequeue(): QueuedMessage | null {
    const sorted = this.getSortedMessages();
    if (sorted.length === 0) return null;

    const message = sorted[0];
    this.queue.delete(message.id);
    return message;
  }

  /**
   * Peek at the highest priority message without removing
   */
  peek(): QueuedMessage | null {
    const sorted = this.getSortedMessages();
    return sorted.length > 0 ? sorted[0] : null;
  }

  /**
   * Get all messages sorted by priority and sequence
   */
  getAll(): QueuedMessage[] {
    return this.getSortedMessages();
  }

  /**
   * Get messages filtered by priority
   */
  getByPriority(priority: BroadcastPriority): QueuedMessage[] {
    return this.getSortedMessages().filter(m => m.priority === priority);
  }

  /**
   * Remove a specific message by ID
   */
  remove(messageId: string): boolean {
    return this.queue.delete(messageId);
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.queue.clear();
    this.seenHashes.clear();
    this.rateLimitTimestamps = [];
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.size === 0;
  }

  /**
   * Update config at runtime
   */
  updateConfig(config: Partial<BroadcastQueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { current: number; max: number; window: number } {
    this.cleanupRateLimit();
    return {
      current: this.rateLimitTimestamps.length,
      max: RATE_LIMIT_MAX,
      window: RATE_LIMIT_WINDOW,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getSortedMessages(): QueuedMessage[] {
    return Array.from(this.queue.values()).sort((a, b) => {
      // First sort by priority (higher weight = higher priority)
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by sequence (older first for same priority)
      return a.sequence - b.sequence;
    });
  }

  private isRateLimited(): boolean {
    this.cleanupRateLimit();
    return this.rateLimitTimestamps.length >= RATE_LIMIT_MAX;
  }

  private recordRateLimit(): void {
    this.rateLimitTimestamps.push(Date.now());
  }

  private cleanupRateLimit(): void {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW;
    this.rateLimitTimestamps = this.rateLimitTimestamps.filter(t => t > cutoff);
  }

  private isDuplicate(hash: string): boolean {
    const lastSeen = this.seenHashes.get(hash);
    if (!lastSeen) return false;

    return Date.now() - lastSeen < this.config.deduplicationWindow;
  }

  private cleanup(): void {
    const now = Date.now();
    const ttlCutoff = now - this.config.defaultTtl;
    const dedupCutoff = now - this.config.deduplicationWindow;

    // Clean expired messages
    for (const [id, message] of this.queue) {
      if (message.timestamp.getTime() < ttlCutoff) {
        this.queue.delete(id);
      }
    }

    // Clean old deduplication hashes
    for (const [hash, timestamp] of this.seenHashes) {
      if (timestamp < dedupCutoff) {
        this.seenHashes.delete(hash);
      }
    }
  }

  private removeLowestPriority(): void {
    const sorted = this.getSortedMessages();
    if (sorted.length === 0) return;

    // Remove the last (lowest priority, oldest) message
    const toRemove = sorted[sorted.length - 1];
    this.queue.delete(toRemove.id);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalQueue: BroadcastQueue | null = null;

/**
 * Get the global broadcast queue instance
 */
export function getBroadcastQueue(config?: Partial<BroadcastQueueConfig>): BroadcastQueue {
  if (!globalQueue) {
    globalQueue = new BroadcastQueue(config);
  }
  return globalQueue;
}

/**
 * Reset the global broadcast queue (useful for testing)
 */
export function resetBroadcastQueue(): void {
  globalQueue = null;
}

// ============================================================================
// Async Queue Operations
// ============================================================================

/**
 * Async enqueue operation (non-blocking)
 */
export async function enqueueAsync(
  queue: BroadcastQueue,
  message: Omit<BroadcastMessage, 'id' | 'timestamp'>
): Promise<QueuedMessage | null> {
  return new Promise((resolve) => {
    // Use setTimeout to ensure async execution
    setTimeout(() => {
      resolve(queue.enqueue(message));
    }, 0);
  });
}

/**
 * Async dequeue operation (non-blocking)
 */
export async function dequeueAsync(queue: BroadcastQueue): Promise<QueuedMessage | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(queue.dequeue());
    }, 0);
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default BroadcastQueue;
