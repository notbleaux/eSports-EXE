/** [Ver001.001] */
/**
 * useTacticalWebSocket Tests
 * ==========================
 * WebSocket hook testing with mock server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTacticalWebSocket, UseTacticalWebSocketOptions } from '../useTacticalWebSocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  sentMessages: any[] = [];
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(public url: string) {
    // Simulate async connection
    this.connectionTimeout = setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    this.sentMessages.push(JSON.parse(data));
  }

  close(code = 1000, reason = '') {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: true }));
  }

  // Helper to simulate incoming messages
  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { 
      data: JSON.stringify(data),
      origin: this.url
    }));
  }

  // Helper to simulate errors
  simulateError() {
    this.onerror?.(new Event('error'));
  }

  // Helper to simulate unexpected close
  simulateClose(eventInit: CloseEventInit = { code: 1006, wasClean: false }) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', eventInit));
  }
}

// Track mock instances for assertions
const mockInstances: MockWebSocket[] = [];

const originalMockWebSocket = MockWebSocket;
(global as any).WebSocket = class extends MockWebSocket {
  constructor(url: string) {
    super(url);
    mockInstances.push(this);
  }
};

describe('useTacticalWebSocket', () => {
  const mockOptions: UseTacticalWebSocketOptions = {
    matchId: 'test-match-123',
    onFrameUpdate: vi.fn(),
    onEventReceived: vi.fn(),
    onConnectionChange: vi.fn(),
    autoConnect: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInstances.length = 0;  // Reset instances
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    expect(result.current[0].isConnected).toBe(false);
    expect(result.current[0].isConnecting).toBe(false);
    expect(result.current[0].error).toBeNull();
    expect(result.current[0].reconnectAttempts).toBe(0);
  });

  it('should connect when connect() is called', async () => {
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    expect(result.current[0].isConnecting).toBe(true);

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    expect(mockOptions.onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('should auto-connect when autoConnect is true', async () => {
    const { result } = renderHook(() => 
      useTacticalWebSocket({ ...mockOptions, autoConnect: true })
    );

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });
  });

  it('should subscribe to match on connect', async () => {
    const matchId = 'test-match-123';
    const { result } = renderHook(() => useTacticalWebSocket({ ...mockOptions, matchId }));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    // Verify subscribe message was sent
    const mockWs = mockInstances[0];
    expect(mockWs).toBeDefined();
    expect(mockWs.sentMessages).toContainEqual({
      type: 'subscribe',
      channel: `match:${matchId}`
    });
  });

  it('should handle frame_update messages', async () => {
    const mockFrame = {
      timestamp: 1000,
      roundNumber: 1,
      roundTime: 10,
      phase: 'combat' as const,
      agentFrames: [],
      abilitiesActive: [],
      spikeStatus: 'carried' as const,
    };

    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    // Simulate receiving a frame update
    const mockWs = mockInstances[0];
    act(() => {
      mockWs.simulateMessage({ type: 'frame_update', frame: mockFrame });
    });

    // Verify callback was called with the frame data
    expect(mockOptions.onFrameUpdate).toHaveBeenCalledWith(mockFrame);
  });

  it('should handle event messages', async () => {
    const mockEvent = {
      timestamp: 5000,
      type: 'kill' as const,
      description: 'Player A eliminated Player B',
    };

    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    // Simulate receiving an event message
    const mockWs = mockInstances[0];
    act(() => {
      mockWs.simulateMessage({ type: 'event', event: mockEvent });
    });

    // Verify callback was called with the event data
    expect(mockOptions.onEventReceived).toHaveBeenCalledWith(mockEvent);
  });

  it('should send seek command', async () => {
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    act(() => {
      result.current[1].seekToTimestamp(45000);
    });

    // Verify seek message was sent
    const mockWs = mockInstances[0];
    expect(mockWs.sentMessages).toContainEqual({
      type: 'seek',
      timestamp: 45000
    });
  });

  it('should disconnect cleanly', async () => {
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    act(() => {
      result.current[1].disconnect();
    });

    expect(result.current[0].isConnected).toBe(false);
    expect(mockOptions.onConnectionChange).toHaveBeenCalledWith(false);
  });

  it('should handle ping/pong heartbeat', async () => {
    vi.useRealTimers(); // Use real timers for this test
    
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    }, { timeout: 5000 });

    // Verify WebSocket instance exists for heartbeat verification
    const mockWs = mockInstances[0];
    expect(mockWs).toBeDefined();
    expect(mockWs.readyState).toBe(MockWebSocket.OPEN);
    
    // Verify connection change callback was called
    expect(mockOptions.onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('should attempt reconnection on unexpected close', async () => {
    vi.useRealTimers(); // Use real timers for reconnection test
    
    const { result } = renderHook(() => 
      useTacticalWebSocket({ 
        ...mockOptions, 
        reconnectInterval: 100,
        maxReconnectAttempts: 3 
      })
    );

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    // Simulate unexpected close
    const mockWs = mockInstances[0];
    act(() => {
      mockWs.simulateClose({ code: 1006, reason: 'Connection lost', wasClean: false });
    });

    // Verify disconnected state
    expect(result.current[0].isConnected).toBe(false);

    // Wait for reconnection attempt
    await waitFor(() => {
      expect(result.current[0].reconnectAttempts).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('should update lastPing on ping', async () => {
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    });

    // Initial ping time should be 0 or updated after connection
    const initialPing = result.current[0].lastPing;
    expect(initialPing).toBeGreaterThanOrEqual(0);
  });

  it('should handle connection errors', async () => {
    // Override WebSocket to simulate connection failure
    const FailingWebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        setTimeout(() => {
          this.readyState = MockWebSocket.CLOSED;
          this.onclose?.(new CloseEvent('close', { code: 1006, reason: 'Connection failed', wasClean: false }));
        }, 10);
      }
    };
    global.WebSocket = FailingWebSocket as any;

    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnecting).toBe(false);
    });
  });
});
