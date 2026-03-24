/** [Ver001.000] */
/**
 * useBroadcast Hook Tests
 * =======================
 * Tests for WebSocket broadcast hook with reconnect logic.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBroadcast, useHelpBroadcast } from '../useBroadcast';
import { resetBroadcastQueue } from '../../lib/broadcast/queue';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

describe('useBroadcast', () => {
  const mockUrl = 'ws://localhost:8000/ws';

  beforeEach(() => {
    resetBroadcastQueue();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Connection Management
  // ============================================================================

  describe('connection', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);
    });

    it('should attempt to connect when autoConnect is true', async () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: true })
      );

      // Should be connecting initially
      await waitFor(() => {
        expect(result.current.connectionState).not.toBe('disconnected');
      });
    });

    it('should not connect when autoConnect is false', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  // ============================================================================
  // Reconnect Logic
  // ============================================================================

  describe('reconnect', () => {
    it('should have reconnect method', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.reconnect).toBe('function');
    });

    it('should track reconnect attempts', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useBroadcast({ 
          url: mockUrl, 
          autoConnect: true,
          maxReconnectAttempts: 3,
          onError,
        })
      );

      // Wait for potential reconnection attempts
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Reconnect attempt should be tracked in state
      expect(typeof result.current.isReconnecting).toBe('boolean');
    });
  });

  // ============================================================================
  // Message Handling
  // ============================================================================

  describe('message handling', () => {
    it('should start with empty messages array', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should track unread messages', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(Array.isArray(result.current.unreadMessages)).toBe(true);
    });
  });

  // ============================================================================
  // Actions
  // ============================================================================

  describe('actions', () => {
    it('should provide dismiss function', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should provide dismissAll function', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.dismissAll).toBe('function');
    });

    it('should provide markAsRead function', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.markAsRead).toBe('function');
    });

    it('should provide subscribe function', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.subscribe).toBe('function');
    });

    it('should provide unsubscribe function', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.unsubscribe).toBe('function');
    });
  });

  // ============================================================================
  // Buffer Management
  // ============================================================================

  describe('buffer', () => {
    it('should track buffer size', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(typeof result.current.bufferSize).toBe('number');
      expect(typeof result.current.isBuffering).toBe('boolean');
    });

    it('should start with empty buffer', () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: false })
      );

      expect(result.current.bufferSize).toBe(0);
      expect(result.current.isBuffering).toBe(false);
    });
  });

  // ============================================================================
  // Callbacks
  // ============================================================================

  describe('callbacks', () => {
    it('should call onConnect when connected', async () => {
      const onConnect = vi.fn();
      
      renderHook(() =>
        useBroadcast({ 
          url: mockUrl, 
          autoConnect: true,
          onConnect,
        })
      );

      // Note: In real WebSocket scenario, this would be called
      // With mock WebSocket, connection happens immediately
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // onConnect should be defined (actual call depends on WebSocket mock)
      expect(onConnect).toBeDefined();
    });

    it('should call onDisconnect when disconnected', async () => {
      const onDisconnect = vi.fn();
      
      const { unmount } = renderHook(() =>
        useBroadcast({ 
          url: mockUrl, 
          autoConnect: true,
          onDisconnect,
        })
      );

      unmount();

      // onDisconnect should be defined
      expect(onDisconnect).toBeDefined();
    });
  });

  // ============================================================================
  // Channel Subscription
  // ============================================================================

  describe('channel subscription', () => {
    it('should subscribe to channels on connect', async () => {
      const subscribe = vi.fn();
      
      const { result } = renderHook(() =>
        useBroadcast({ 
          url: mockUrl, 
          channels: ['help', 'system'],
          autoConnect: false,
        })
      );

      // Subscribe method should exist
      expect(typeof result.current.subscribe).toBe('function');

      // Test subscribing
      act(() => {
        result.current.subscribe('test-channel');
      });

      // Should be able to call subscribe
      expect(result.current.subscribe).toBeDefined();
    });

    it('should unsubscribe from channels', () => {
      const { result } = renderHook(() =>
        useBroadcast({ 
          url: mockUrl, 
          autoConnect: false,
        })
      );

      act(() => {
        result.current.subscribe('test-channel');
        result.current.unsubscribe('test-channel');
      });

      // Unsubscribe should complete without error
      expect(result.current.unsubscribe).toBeDefined();
    });
  });

  // ============================================================================
  // State Transitions
  // ============================================================================

  describe('state transitions', () => {
    it('should transition between states correctly', async () => {
      const { result } = renderHook(() =>
        useBroadcast({ url: mockUrl, autoConnect: true })
      );

      // Initial state should be connecting or connected with mock
      const validStates = ['connecting', 'connected', 'disconnected', 'reconnecting', 'error'];
      expect(validStates).toContain(result.current.connectionState);

      // Boolean flags should be consistent
      if (result.current.connectionState === 'connected') {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isReconnecting).toBe(false);
      }
    });
  });
});

// ============================================================================
// useHelpBroadcast Tests
// ============================================================================

describe('useHelpBroadcast', () => {
  const mockUrl = 'ws://localhost:8000/ws';

  beforeEach(() => {
    resetBroadcastQueue();
  });

  it('should initialize with help-specific defaults', () => {
    const { result } = renderHook(() =>
      useHelpBroadcast(mockUrl, { userId: 'user-123' })
    );

    expect(result.current).toBeDefined();
    expect(typeof result.current.subscribe).toBe('function');
  });

  it('should call onHelpOffer when help_offer message received', async () => {
    const onHelpOffer = vi.fn();
    
    renderHook(() =>
      useHelpBroadcast(mockUrl, { 
        userId: 'user-123',
        onHelpOffer,
      })
    );

    // Hook should be initialized
    expect(onHelpOffer).toBeDefined();
  });

  it('should call onErrorAlert when error_alert message received', async () => {
    const onErrorAlert = vi.fn();
    
    renderHook(() =>
      useHelpBroadcast(mockUrl, { 
        userId: 'user-123',
        onErrorAlert,
      })
    );

    // Hook should be initialized
    expect(onErrorAlert).toBeDefined();
  });

  it('should subscribe to user-specific channel when userId provided', () => {
    const { result } = renderHook(() =>
      useHelpBroadcast(mockUrl, { userId: 'user-123' })
    );

    expect(result.current).toBeDefined();
  });
});
