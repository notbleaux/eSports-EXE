// @ts-nocheck
/**
 * Live Connection Manager Tests
 * 
 * 25+ comprehensive tests for WebSocket connection handling
 * 
 * [Ver001.002] - Simplified test mocks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LiveConnectionManager, getConnectionManager, destroyConnectionManager, resetConnectionManagers } from '../connection';

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

// Create a mock WebSocket factory
const mockWebSocketInstances: Array<ReturnType<typeof createMockWebSocket>> = [];

function createMockWebSocket() {
  const handlers: Record<string, ((e: unknown) => void)[]> = {
    open: [],
    close: [],
    message: [],
    error: [],
  };

  const instance = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    readyState: 0,
    url: '',
    
    onopen: null as ((e: Event) => void) | null,
    onclose: null as ((e: CloseEvent) => void) | null,
    onmessage: null as ((e: MessageEvent) => void) | null,
    onerror: null as ((e: Event) => void) | null,

    send: vi.fn(function(this: typeof instance, data: string) {
      if (this.readyState !== 1) {
        throw new Error('WebSocket is not open');
      }
      // Auto-respond to ping with pong
      if (data.includes('"type":"ping"')) {
        setTimeout(() => {
          this.onmessage?.(new MessageEvent('message', { data: 'pong' }));
        }, 5);
      }
    }),
    
    close: vi.fn(function(this: typeof instance, code = 1000, reason = '') {
      this.readyState = 3;
      setTimeout(() => {
        this.onclose?.({
          code,
          reason,
          wasClean: code === 1000,
        } as CloseEvent);
      }, 5);
    }),

    // Test helpers
    simulateOpen: function(this: typeof instance) {
      this.readyState = 1;
      this.onopen?.(new Event('open'));
    },
    
    simulateMessage: function(this: typeof instance, data: string) {
      this.onmessage?.(new MessageEvent('message', { data }));
    },
    
    simulateError: function(this: typeof instance) {
      this.onerror?.(new Event('error'));
    },
    
    simulateDisconnect: function(this: typeof instance, code = 1006, reason = 'Connection lost') {
      this.readyState = 3;
      this.onclose?.({
        code,
        reason,
        wasClean: false,
      } as CloseEvent);
    },
  };

  mockWebSocketInstances.push(instance);
  return instance;
}

// Mock WebSocket
vi.stubGlobal('WebSocket', vi.fn(() => createMockWebSocket()));

// Helper to get the last created mock
function getLastMock() {
  return mockWebSocketInstances[mockWebSocketInstances.length - 1];
}

describe('LiveConnectionManager', () => {
  let connection: LiveConnectionManager;
  const mockUrl = 'ws://localhost:8000/ws';

  beforeEach(() => {
    mockWebSocketInstances.length = 0;
    resetConnectionManagers();
    connection = new LiveConnectionManager({ url: mockUrl });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    connection.destroy();
    vi.useRealTimers();
    vi.clearAllMocks();
    mockWebSocketInstances.length = 0;
  });

  // ============================================================================
  // 1. Connection State Tests (8 tests)
  // ============================================================================

  describe('connection state', () => {
    it('should initialize with idle state', () => {
      expect(connection.getState()).toBe('idle');
    });

    it('should transition to connecting when connect() is called', () => {
      connection.connect();
      expect(connection.getState()).toBe('connecting');
    });

    it('should be connected after successful connection', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);
      expect(connection.getState()).toBe('connected');
    });

    it('should be disconnected after disconnect() is called', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);
      connection.disconnect();
      await vi.advanceTimersByTimeAsync(10);
      expect(connection.getState()).toBe('disconnected');
    });

    it('isConnected() should return true when connected', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);
      expect(connection.isConnected()).toBe(true);
    });

    it('isConnected() should return false when not connected', () => {
      expect(connection.isConnected()).toBe(false);
    });

    it('isConnecting() should return true during connection', () => {
      connection.connect();
      expect(connection.isConnecting()).toBe(true);
    });

    it('isConnecting() should return false after connection established', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);
      expect(connection.isConnecting()).toBe(false);
    });
  });

  // ============================================================================
  // 2. Auto-Reconnect Tests (4 tests)
  // ============================================================================

  describe('auto-reconnect', () => {
    it('should schedule reconnect after unexpected disconnect', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      // Simulate unexpected disconnect
      getLastMock().simulateDisconnect(1006, 'Connection lost');
      await vi.advanceTimersByTimeAsync(10);

      // Should be in reconnecting state
      expect(['reconnecting', 'connecting']).toContain(connection.getState());
    });

    it('should not reconnect after normal disconnect', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.disconnect(1000, 'Normal closure');
      await vi.advanceTimersByTimeAsync(10);

      // Should remain disconnected
      expect(connection.getState()).toBe('disconnected');
    });

    it('should accept maxReconnectAttempts configuration', () => {
      const limitedConnection = new LiveConnectionManager({
        url: mockUrl,
        maxReconnectAttempts: 2,
      });

      const config = limitedConnection.getConfig();
      expect(config.maxReconnectAttempts).toBe(2);

      limitedConnection.destroy();
    });

    it('should support manual reconnect', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.disconnect(1000, 'Manual');
      connection.reconnect();
      
      expect(connection.getState()).toBe('connecting');
    });
  });

  // ============================================================================
  // 3. Message Handling Tests (4 tests)
  // ============================================================================

  describe('message handling', () => {
    it('should receive and emit messages', async () => {
      const messageSpy = vi.fn();
      connection.on('message', messageSpy);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      getLastMock().simulateMessage(JSON.stringify({ type: 'test', data: 'hello' }));
      await vi.advanceTimersByTimeAsync(10);

      expect(messageSpy).toHaveBeenCalled();
    });

    it('should send messages when connected', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      const result = connection.send({ type: 'test', data: 'hello' });
      expect(result).toBe(true);
    });

    it('should not send messages when not connected', () => {
      const result = connection.send({ type: 'test', data: 'hello' });
      expect(result).toBe(false);
    });

    it('should reject messages exceeding max size', async () => {
      const limitedConnection = new LiveConnectionManager({
        url: mockUrl,
        maxMessageSize: 100,
      });

      limitedConnection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      const largeMessage = 'x'.repeat(200);
      const result = limitedConnection.send(largeMessage);
      expect(result).toBe(false);

      limitedConnection.destroy();
    });
  });

  // ============================================================================
  // 4. Event Listener Tests (4 tests)
  // ============================================================================

  describe('event listeners', () => {
    it('should register event listeners', async () => {
      const listener = vi.fn();
      const unsubscribe = connection.on('connected', listener);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should unsubscribe event listeners', async () => {
      const listener = vi.fn();
      const unsubscribe = connection.on('connected', listener);

      unsubscribe();

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit state-change events', async () => {
      const stateSpy = vi.fn();
      connection.on('state-change', stateSpy);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      expect(stateSpy).toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      connection.on('connected', listener1);
      connection.on('connected', listener2);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 5. Connection Quality Tests (2 tests)
  // ============================================================================

  describe('connection quality', () => {
    it('should calculate connection quality', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      const quality = connection.getQuality();
      expect(['excellent', 'good', 'fair', 'poor', 'unknown']).toContain(quality);
    });

    it('should send heartbeat messages', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      // Wait for heartbeat interval (30 seconds)
      await vi.advanceTimersByTimeAsync(30000);
      
      // Heartbeat should have been sent
      expect(getLastMock().send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"')
      );
    });
  });

  // ============================================================================
  // 6. Configuration Tests (2 tests)
  // ============================================================================

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConnection = new LiveConnectionManager({
        url: mockUrl,
        reconnectInterval: 500,
        maxReconnectAttempts: 5,
        heartbeatInterval: 15000,
      });

      const config = customConnection.getConfig();
      expect(config.reconnectInterval).toBe(500);
      expect(config.maxReconnectAttempts).toBe(5);
      expect(config.heartbeatInterval).toBe(15000);

      customConnection.destroy();
    });

    it('should update configuration', () => {
      connection.updateConfig({ reconnectInterval: 2000 });
      const config = connection.getConfig();
      expect(config.reconnectInterval).toBe(2000);
    });
  });

  // ============================================================================
  // 7. Error Handling Tests (2 tests)
  // ============================================================================

  describe('error handling', () => {
    it('should emit error events', async () => {
      const errorSpy = vi.fn();
      connection.on('error', errorSpy);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      getLastMock().simulateError();
      await vi.advanceTimersByTimeAsync(10);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      
      // Simulate error before open
      getLastMock().simulateError();
      
      // Should not throw
      expect(() => connection.getState()).not.toThrow();
    });
  });

  // ============================================================================
  // 8. Metrics Tests (3 tests)
  // ============================================================================

  describe('metrics', () => {
    it('should track message counts', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.send({ type: 'test' });
      connection.send({ type: 'test2' });

      const metrics = connection.getMetrics();
      expect(metrics.messagesSent).toBe(2);
    });

    it('should track bytes sent', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.send({ type: 'test', data: 'hello world' });

      const metrics = connection.getMetrics();
      expect(metrics.bytesSent).toBeGreaterThan(0);
    });

    it('should expose latency tracking', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      const metrics = connection.getMetrics();
      expect(typeof metrics.latency).toBe('number');
    });
  });

  // ============================================================================
  // 9. Lifecycle Tests (4 tests)
  // ============================================================================

  describe('lifecycle', () => {
    it('should clean up on destroy', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.destroy();

      expect(connection.getState()).toBe('disconnected');
      expect(connection.isConnected()).toBe(false);
    });

    it('should handle multiple connect calls gracefully', () => {
      connection.connect();
      connection.connect(); // Second call should be ignored

      expect(connection.getState()).toBe('connecting');
    });

    it('should handle disconnect before connect', () => {
      expect(() => connection.disconnect()).not.toThrow();
      expect(connection.getState()).toBe('disconnected');
    });

    it('should emit disconnected event on manual disconnect', async () => {
      const disconnectedSpy = vi.fn();
      connection.on('disconnected', disconnectedSpy);

      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      connection.disconnect(1000, 'Test disconnect');
      await vi.advanceTimersByTimeAsync(10);

      expect(disconnectedSpy).toHaveBeenCalledWith({
        code: 1000,
        reason: 'Test disconnect',
        wasClean: true,
      });
    });
  });

  // ============================================================================
  // 10. Singleton Factory Tests (4 tests)
  // ============================================================================

  describe('singleton factory', () => {
    it('should return same instance for same ID', () => {
      const conn1 = getConnectionManager('test-id', { url: mockUrl });
      const conn2 = getConnectionManager('test-id', { url: mockUrl });

      expect(conn1).toBe(conn2);

      destroyConnectionManager('test-id');
    });

    it('should return different instances for different IDs', () => {
      const conn1 = getConnectionManager('id-1', { url: mockUrl });
      const conn2 = getConnectionManager('id-2', { url: mockUrl });

      expect(conn1).not.toBe(conn2);

      destroyConnectionManager('id-1');
      destroyConnectionManager('id-2');
    });

    it('should destroy connection manager', () => {
      const conn = getConnectionManager('destroy-test', { url: mockUrl });
      destroyConnectionManager('destroy-test');

      // Should create new instance
      const conn2 = getConnectionManager('destroy-test', { url: mockUrl });
      expect(conn).not.toBe(conn2);

      destroyConnectionManager('destroy-test');
    });

    it('should reset all connection managers', () => {
      getConnectionManager('a', { url: mockUrl });
      getConnectionManager('b', { url: mockUrl });

      resetConnectionManagers();

      // Both should be destroyed and can be recreated
      const connA = getConnectionManager('a', { url: mockUrl });
      const connB = getConnectionManager('b', { url: mockUrl });
      expect(connA).toBeDefined();
      expect(connB).toBeDefined();

      resetConnectionManagers();
    });
  });

  // ============================================================================
  // 11. Performance Tests (1 test)
  // ============================================================================

  describe('performance', () => {
    it('should handle rapid message sending', async () => {
      connection.connect();
      await vi.advanceTimersByTimeAsync(10);
      getLastMock().simulateOpen();
      await vi.advanceTimersByTimeAsync(10);

      // Send many messages quickly
      for (let i = 0; i < 100; i++) {
        connection.send({ type: 'test', index: i });
      }

      const metrics = connection.getMetrics();
      expect(metrics.messagesSent).toBe(100);
    });
  });

  // ============================================================================
  // 12. Security Tests (2 tests)
  // ============================================================================

  describe('security', () => {
    it('should accept token in configuration', () => {
      const authConnection = new LiveConnectionManager({
        url: mockUrl,
        token: 'test-token-123',
      });

      const config = authConnection.getConfig();
      expect(config.token).toBe('test-token-123');

      authConnection.destroy();
    });

    it('should have connection timeout configuration', () => {
      const timeoutConnection = new LiveConnectionManager({
        url: mockUrl,
        connectionTimeout: 5000,
      });

      const config = timeoutConnection.getConfig();
      expect(config.connectionTimeout).toBe(5000);

      timeoutConnection.destroy();
    });
  });
});

// ============================================================================
// Test Summary
// ============================================================================
// Total: 40 tests covering:
// - Connection state management (8 tests)
// - Auto-reconnect functionality (4 tests)
// - Message handling (4 tests)
// - Event listeners (4 tests)
// - Connection quality (2 tests)
// - Configuration (2 tests)
// - Error handling (2 tests)
// - Metrics (3 tests)
// - Lifecycle (4 tests)
// - Singleton factory (4 tests)
// - Performance (1 test)
// - Security (2 tests)
// ============================================================================
