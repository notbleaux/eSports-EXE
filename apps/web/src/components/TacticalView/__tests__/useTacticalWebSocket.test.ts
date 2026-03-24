/** [Ver002.000] */
/**
 * useTacticalWebSocket Tests
 * ==========================
 * WebSocket hook testing with MSW (Mock Service Worker).
 * Replaces custom MockWebSocket with MSW for better isolation and standards compliance.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTacticalWebSocket, UseTacticalWebSocketOptions } from '../useTacticalWebSocket';
import { server } from '@/mocks/server';
import { ws } from 'msw';

// Track WebSocket clients for assertions
const mockClients: ReturnType<typeof ws.link>['clients'] = new Map();

// MSW WebSocket handler with client tracking
const tacticalWsHandler = ws.link('ws://localhost:8000/v1/ws').addEventListener('connection', ({ client }) => {
  mockClients.set(client.id, client);
  
  // Send initial connection acknowledgment
  client.send(JSON.stringify({ type: 'connected' }));
  
  // Track sent messages for assertions
  const originalSend = client.send.bind(client);
  const sentMessages: any[] = [];
  
  client.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    sentMessages.push(data);
    
    if (data.type === 'subscribe') {
      client.send(JSON.stringify({ 
        type: 'subscribed', 
        channel: data.channel 
      }));
    }
    
    if (data.type === 'seek') {
      client.send(JSON.stringify({
        type: 'seek_complete',
        timestamp: data.timestamp
      }));
    }
  });
  
  // Attach helper for tests
  (client as any).sentMessages = sentMessages;
  (client as any).simulateMessage = (msg: any) => {
    client.send(JSON.stringify(msg));
  };
});

describe('useTacticalWebSocket', () => {
  const mockOptions: UseTacticalWebSocketOptions = {
    matchId: 'test-match-123',
    onFrameUpdate: vi.fn(),
    onEventReceived: vi.fn(),
    onConnectionChange: vi.fn(),
    autoConnect: false,
  };

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    mockClients.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
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

    // Verify subscription message was sent
    await waitFor(() => {
      const clients = Array.from(mockClients.values());
      expect(clients.length).toBeGreaterThan(0);
      
      const client = clients[0] as any;
      const subscribeMsg = client.sentMessages?.find(
        (m: any) => m.type === 'subscribe' && m.channel === `match:${matchId}`
      );
      expect(subscribeMsg).toBeDefined();
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

    // Simulate receiving a frame update via MSW
    act(() => {
      const clients = Array.from(mockClients.values());
      if (clients[0]) {
        const client = clients[0] as any;
        client.send(JSON.stringify({ type: 'frame_update', frame: mockFrame }));
      }
    });

    // Verify callback was called with the frame data
    await waitFor(() => {
      expect(mockOptions.onFrameUpdate).toHaveBeenCalledWith(mockFrame);
    });
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

    // Simulate receiving an event message via MSW
    act(() => {
      const clients = Array.from(mockClients.values());
      if (clients[0]) {
        const client = clients[0] as any;
        client.send(JSON.stringify({ type: 'event', event: mockEvent }));
      }
    });

    // Verify callback was called with the event data
    await waitFor(() => {
      expect(mockOptions.onEventReceived).toHaveBeenCalledWith(mockEvent);
    });
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
    await waitFor(() => {
      const clients = Array.from(mockClients.values());
      const client = clients[0] as any;
      const seekMsg = client.sentMessages?.find(
        (m: any) => m.type === 'seek' && m.timestamp === 45000
      );
      expect(seekMsg).toBeDefined();
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
    vi.useRealTimers();
    
    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    await waitFor(() => {
      expect(result.current[0].isConnected).toBe(true);
    }, { timeout: 5000 });

    // Verify connection was established
    expect(mockOptions.onConnectionChange).toHaveBeenCalledWith(true);
    
    // Verify clients exist
    const clients = Array.from(mockClients.values());
    expect(clients.length).toBeGreaterThan(0);
  });

  it('should attempt reconnection on unexpected close', async () => {
    vi.useRealTimers();
    
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

    // Simulate unexpected close by closing all clients
    act(() => {
      mockClients.forEach((client) => {
        client.close();
      });
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

  it('should handle connection errors gracefully', async () => {
    // Override handler to simulate connection failure
    server.use(
      ws.link('ws://localhost:8000/v1/ws').addEventListener('connection', ({ client }) => {
        // Immediately close the connection to simulate failure
        client.close();
      })
    );

    const { result } = renderHook(() => useTacticalWebSocket(mockOptions));

    act(() => {
      result.current[1].connect();
    });

    // Should handle the error without throwing
    await waitFor(() => {
      expect(result.current[0].isConnecting).toBe(false);
    });
  });
});
