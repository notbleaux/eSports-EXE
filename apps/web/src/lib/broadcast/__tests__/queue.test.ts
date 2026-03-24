/** [Ver001.000] */
/**
 * Broadcast Queue Tests
 * =====================
 * Tests for priority queue, deduplication, and rate limiting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  BroadcastQueue, 
  getBroadcastQueue, 
  resetBroadcastQueue,
  enqueueAsync,
  dequeueAsync,
} from '../queue';
import { BroadcastPriority, BroadcastMessage } from '../types';

// Mock console methods
const originalConsoleWarn = console.warn;
const originalConsoleDebug = console.debug;

describe('BroadcastQueue', () => {
  let queue: BroadcastQueue;

  beforeEach(() => {
    resetBroadcastQueue();
    queue = new BroadcastQueue();
    console.warn = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.debug = originalConsoleDebug;
  });

  // ============================================================================
  // Basic Operations
  // ============================================================================

  describe('enqueue', () => {
    it('should add a message to the queue', () => {
      const message = createMessage({ priority: 'normal' });
      const result = queue.enqueue(message);

      expect(result).not.toBeNull();
      expect(result?.title).toBe(message.title);
      expect(queue.size()).toBe(1);
    });

    it('should generate unique IDs for messages', () => {
      const msg1 = createMessage({ title: 'Message 1' });
      const msg2 = createMessage({ title: 'Message 2' });

      const result1 = queue.enqueue(msg1);
      const result2 = queue.enqueue(msg2);

      expect(result1?.id).not.toBe(result2?.id);
    });

    it('should assign sequence numbers in order', () => {
      queue.enqueue(createMessage({ title: 'First' }));
      queue.enqueue(createMessage({ title: 'Second' }));
      queue.enqueue(createMessage({ title: 'Third' }));

      const messages = queue.getAll();
      expect(messages[0].sequence).toBeLessThan(messages[1].sequence);
      expect(messages[1].sequence).toBeLessThan(messages[2].sequence);
    });

    it('should initialize attempts to 0', () => {
      const result = queue.enqueue(createMessage());
      expect(result?.attempts).toBe(0);
    });
  });

  describe('dequeue', () => {
    it('should return null when queue is empty', () => {
      const result = queue.dequeue();
      expect(result).toBeNull();
    });

    it('should return the highest priority message', () => {
      queue.enqueue(createMessage({ priority: 'low', title: 'Low' }));
      queue.enqueue(createMessage({ priority: 'critical', title: 'Critical' }));
      queue.enqueue(createMessage({ priority: 'high', title: 'High' }));

      const result = queue.dequeue();
      expect(result?.priority).toBe('critical');
      expect(result?.title).toBe('Critical');
    });

    it('should remove the message from the queue', () => {
      queue.enqueue(createMessage());
      expect(queue.size()).toBe(1);

      queue.dequeue();
      expect(queue.size()).toBe(0);
    });

    it('should return messages in priority order, then FIFO', () => {
      queue.enqueue(createMessage({ priority: 'normal', title: 'Normal 1' }));
      queue.enqueue(createMessage({ priority: 'normal', title: 'Normal 2' }));
      queue.enqueue(createMessage({ priority: 'high', title: 'High' }));

      const first = queue.dequeue();
      const second = queue.dequeue();
      const third = queue.dequeue();

      expect(first?.title).toBe('High');
      expect(second?.title).toBe('Normal 1');
      expect(third?.title).toBe('Normal 2');
    });
  });

  describe('peek', () => {
    it('should return null when queue is empty', () => {
      expect(queue.peek()).toBeNull();
    });

    it('should return highest priority message without removing', () => {
      queue.enqueue(createMessage({ priority: 'high' }));
      queue.enqueue(createMessage({ priority: 'low' }));

      const peeked = queue.peek();
      expect(peeked?.priority).toBe('high');
      expect(queue.size()).toBe(2);
    });
  });

  describe('remove', () => {
    it('should remove a specific message by ID', () => {
      const result = queue.enqueue(createMessage({ title: 'To Remove' }));
      queue.enqueue(createMessage({ title: 'Keep' }));

      const removed = queue.remove(result!.id);
      expect(removed).toBe(true);
      expect(queue.size()).toBe(1);
      expect(queue.getAll()[0].title).toBe('Keep');
    });

    it('should return false for non-existent ID', () => {
      const removed = queue.remove('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all messages', () => {
      queue.enqueue(createMessage());
      queue.enqueue(createMessage());
      queue.enqueue(createMessage());

      queue.clear();
      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });
  });

  // ============================================================================
  // Priority Ordering
  // ============================================================================

  describe('priority ordering', () => {
    it('should order critical > high > normal > low', () => {
      const priorities: BroadcastPriority[] = ['low', 'normal', 'critical', 'high'];
      
      priorities.forEach((priority) => {
        queue.enqueue(createMessage({ priority, title: `${priority}` }));
      });

      const messages = queue.getAll();
      expect(messages[0].priority).toBe('critical');
      expect(messages[1].priority).toBe('high');
      expect(messages[2].priority).toBe('normal');
      expect(messages[3].priority).toBe('low');
    });
  });

  // ============================================================================
  // Deduplication
  // ============================================================================

  describe('deduplication', () => {
    it('should reject duplicate messages within window', () => {
      const message = createMessage({ title: 'Duplicate', content: 'Same content' });
      
      const first = queue.enqueue(message);
      const second = queue.enqueue(message);

      expect(first).not.toBeNull();
      expect(second).toBeNull();
      expect(queue.size()).toBe(1);
    });

    it('should accept messages with different content', () => {
      queue.enqueue(createMessage({ title: 'First' }));
      queue.enqueue(createMessage({ title: 'Second' }));

      expect(queue.size()).toBe(2);
    });

    it('should accept duplicates after dedup window expires', async () => {
      const queueWithShortWindow = new BroadcastQueue({ 
        deduplicationWindow: 50 
      });
      const message = createMessage();

      queueWithShortWindow.enqueue(message);
      await new Promise(resolve => setTimeout(resolve, 60));
      const second = queueWithShortWindow.enqueue(message);

      expect(second).not.toBeNull();
    });
  });

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  describe('rate limiting', () => {
    it('should limit to 10 messages per second', () => {
      // Add 10 messages (should succeed)
      for (let i = 0; i < 10; i++) {
        const result = queue.enqueue(createMessage({ title: `Msg ${i}` }));
        expect(result).not.toBeNull();
      }

      // 11th message should be rejected
      const result = queue.enqueue(createMessage({ title: 'Over limit' }));
      expect(result).toBeNull();
    });

    it('should provide rate limit status', () => {
      queue.enqueue(createMessage());
      queue.enqueue(createMessage());

      const status = queue.getRateLimitStatus();
      expect(status.current).toBe(2);
      expect(status.max).toBe(10);
      expect(status.window).toBe(1000);
    });
  });

  // ============================================================================
  // Max Size
  // ============================================================================

  describe('max size', () => {
    it('should remove lowest priority when exceeding max size', () => {
      const smallQueue = new BroadcastQueue({ maxSize: 3 });

      smallQueue.enqueue(createMessage({ priority: 'low', title: 'Low 1' }));
      smallQueue.enqueue(createMessage({ priority: 'normal', title: 'Normal' }));
      smallQueue.enqueue(createMessage({ priority: 'low', title: 'Low 2' }));
      smallQueue.enqueue(createMessage({ priority: 'high', title: 'High' }));

      expect(smallQueue.size()).toBe(3);
      const messages = smallQueue.getAll();
      expect(messages.some(m => m.title === 'Low 1')).toBe(false);
      expect(messages.some(m => m.title === 'High')).toBe(true);
    });
  });

  // ============================================================================
  // Async Operations
  // ============================================================================

  describe('async operations', () => {
    it('should enqueue asynchronously', async () => {
      const message = createMessage();
      const result = await enqueueAsync(queue, message);

      expect(result).not.toBeNull();
      expect(queue.size()).toBe(1);
    });

    it('should dequeue asynchronously', async () => {
      queue.enqueue(createMessage({ title: 'Test' }));
      const result = await dequeueAsync(queue);

      expect(result?.title).toBe('Test');
      expect(queue.size()).toBe(0);
    });

    it('should not block on async operations', async () => {
      const startTime = Date.now();
      
      await enqueueAsync(queue, createMessage());
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100); // Should complete quickly
    });
  });

  // ============================================================================
  // Singleton
  // ============================================================================

  describe('singleton', () => {
    it('should return same instance for getBroadcastQueue', () => {
      const q1 = getBroadcastQueue();
      const q2 = getBroadcastQueue();

      expect(q1).toBe(q2);
    });

    it('should create new instance after reset', () => {
      const q1 = getBroadcastQueue();
      resetBroadcastQueue();
      const q2 = getBroadcastQueue();

      expect(q1).not.toBe(q2);
    });
  });

  // ============================================================================
  // TTL Expiration
  // ============================================================================

  describe('TTL expiration', () => {
    it('should remove expired messages on cleanup', async () => {
      const shortTtlQueue = new BroadcastQueue({ 
        defaultTtl: 50,
        deduplicationWindow: 10
      });

      shortTtlQueue.enqueue(createMessage({ title: 'Expires' }));
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Add another message to trigger cleanup
      shortTtlQueue.enqueue(createMessage({ title: 'New' }));

      const messages = shortTtlQueue.getAll();
      expect(messages.some(m => m.title === 'Expires')).toBe(false);
      expect(messages.some(m => m.title === 'New')).toBe(true);
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMessage(overrides: Partial<BroadcastMessage> = {}): Omit<BroadcastMessage, 'id' | 'timestamp'> {
  return {
    type: 'help_offer',
    priority: 'normal',
    title: 'Test Message',
    content: 'Test content',
    dismissible: true,
    ...overrides,
  };
}
