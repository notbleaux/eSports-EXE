/**
 * useLiveData Hook Tests
 * 
 * [Ver001.000]
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLiveData } from '../useLiveData';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
})) as unknown as typeof WebSocket;

// Mock fetch
global.fetch = vi.fn();

describe('useLiveData', () => {
  const mockFetch = vi.mocked(global.fetch);
  const mockWebSocket = vi.mocked(global.WebSocket);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useLiveData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.liveEvents).toEqual([]);
    expect(result.current.liveMatches).toEqual([]);
    expect(result.current.chatMessages).toEqual([]);
  });

  it('should fetch live events on mount', async () => {
    const mockEvents = [
      { id: '1', title: 'Test Event', tournament: 'Test', status: 'live', teams: [] },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: mockEvents }),
    } as Response);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ matches: [] }),
    } as Response);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ messages: [] }),
    } as Response);

    const { result } = renderHook(() => useLiveData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.liveEvents).toEqual(mockEvents);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLiveData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.liveEvents).toEqual([]);
  });

  it('should establish WebSocket connection', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [], matches: [], messages: [] }),
    } as Response);

    renderHook(() => useLiveData());

    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalled();
    });
  });

  it('should switch streams', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [], matches: [], messages: [] }),
    } as Response);

    const { result } = renderHook(() => useLiveData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.switchStream('1');

    expect(result.current.currentStream).not.toBeNull();
  });

  it('should refresh data when called', async () => {
    const mockEvents = [{ id: '1', title: 'Event 1', tournament: 'Test', status: 'live', teams: [] }];
    const mockEvents2 = [{ id: '2', title: 'Event 2', tournament: 'Test', status: 'live', teams: [] }];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ matches: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ messages: [] }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents2 }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ matches: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ messages: [] }) } as Response);

    const { result } = renderHook(() => useLiveData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.liveEvents).toEqual(mockEvents);

    await result.current.refreshData();

    expect(result.current.liveEvents).toEqual(mockEvents2);
  });

  it('should handle WebSocket messages', async () => {
    let messageHandler: ((event: MessageEvent) => void) | null = null;

    mockWebSocket.mockImplementation(() => ({
      send: vi.fn(),
      close: vi.fn(),
      set onmessage(handler: (event: MessageEvent) => void) {
        messageHandler = handler;
      },
      set onopen(_handler: () => void) {
        // Trigger open immediately
      },
      set onclose(_handler: () => void) {},
      set onerror(_handler: () => void) {},
    }) as unknown as WebSocket);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [], matches: [], messages: [] }),
    } as Response);

    const { result } = renderHook(() => useLiveData());

    await waitFor(() => {
      expect(mockWebSocket).toHaveBeenCalled();
    });

    // Simulate WebSocket message
    const mockMatch = {
      id: 'match-1',
      teamA: { name: 'Team A', score: 1, logo: '' },
      teamB: { name: 'Team B', score: 0, logo: '' },
      status: 'live',
      map: 'Ascent',
      tournament: 'Test',
    };

    if (messageHandler) {
      messageHandler(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'live_match_update',
            data: mockMatch,
          }),
        })
      );
    }

    await waitFor(() => {
      expect(result.current.liveMatches).toContainEqual(mockMatch);
    });
  });
});
