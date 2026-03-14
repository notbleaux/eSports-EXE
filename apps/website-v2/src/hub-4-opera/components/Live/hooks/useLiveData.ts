/**
 * useLiveData - Hook for managing live stream data
 * 
 * [Ver001.000]
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Stream,
  LiveEvent,
  LiveMatch,
  ChatMessage,
  UseLiveDataReturn,
} from '../types';

// Simulated API delay
const SIMULATED_DELAY = 500;

// Mock data for initial load
const MOCK_STREAMS: Stream[] = [
  {
    id: '1',
    url: 'https://www.twitch.tv/valorant',
    platform: 'twitch',
    title: 'VCT 2026 Masters Tokyo - Official Broadcast',
    matchId: 'match-1',
  },
  {
    id: '2',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'youtube',
    title: 'Thinking Man\'s Valorant - Co-stream',
    matchId: 'match-1',
  },
  {
    id: '3',
    url: 'https://www.twitch.tv/tarik',
    platform: 'twitch',
    title: 'tarik - VCT Watch Party',
    matchId: 'match-2',
  },
];

const MOCK_MATCHES: LiveMatch[] = [
  {
    id: 'match-1',
    teamA: {
      name: 'Sentinels',
      score: 2,
      logo: 'https://via.placeholder.com/64/ff4655/ffffff?text=SEN',
    },
    teamB: {
      name: 'Fnatic',
      score: 1,
      logo: 'https://via.placeholder.com/64/ff6600/ffffff?text=FNC',
    },
    status: 'live',
    map: 'Ascent',
    tournament: 'VCT 2026 Masters Tokyo',
    eta: 'LIVE',
  },
  {
    id: 'match-2',
    teamA: {
      name: 'Cloud9',
      score: 0,
      logo: 'https://via.placeholder.com/64/00aeff/ffffff?text=C9',
    },
    teamB: {
      name: 'EDward Gaming',
      score: 0,
      logo: 'https://via.placeholder.com/64/990000/ffffff?text=EDG',
    },
    status: 'upcoming',
    map: 'Haven',
    tournament: 'VCT 2026 Masters Tokyo',
    eta: '1h 30m',
  },
  {
    id: 'match-3',
    teamA: {
      name: 'NRG',
      score: 13,
      logo: 'https://via.placeholder.com/64/ccff00/000000?text=NRG',
    },
    teamB: {
      name: '100 Thieves',
      score: 11,
      logo: 'https://via.placeholder.com/64/ff0000/ffffff?text=100T',
    },
    status: 'finished',
    map: 'Bind',
    tournament: 'VCT Americas Stage 1',
  },
];

const MOCK_EVENTS: LiveEvent[] = [
  {
    id: 'event-1',
    title: 'Sentinels vs Fnatic',
    tournament: 'VCT 2026 Masters Tokyo',
    startTime: new Date().toISOString(),
    status: 'live',
    thumbnail: 'https://via.placeholder.com/320x180/9d4edd/ffffff?text=SEN+vs+FNC',
    viewers: 450000,
    teams: [
      { name: 'Sentinels', logo: 'https://via.placeholder.com/64/ff4655/ffffff?text=SEN' },
      { name: 'Fnatic', logo: 'https://via.placeholder.com/64/ff6600/ffffff?text=FNC' },
    ],
  },
  {
    id: 'event-2',
    title: 'Cloud9 vs EDward Gaming',
    tournament: 'VCT 2026 Masters Tokyo',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    status: 'upcoming',
    thumbnail: 'https://via.placeholder.com/320x180/00aeff/ffffff?text=C9+vs+EDG',
    teams: [
      { name: 'Cloud9', logo: 'https://via.placeholder.com/64/00aeff/ffffff?text=C9' },
      { name: 'EDG', logo: 'https://via.placeholder.com/64/990000/ffffff?text=EDG' },
    ],
  },
  {
    id: 'event-3',
    title: 'NRG vs 100 Thieves',
    tournament: 'VCT Americas Stage 1',
    startTime: new Date(Date.now() - 7200000).toISOString(),
    status: 'finished',
    thumbnail: 'https://via.placeholder.com/320x180/ccff00/000000?text=NRG+vs+100T',
    teams: [
      { name: 'NRG', logo: 'https://via.placeholder.com/64/ccff00/000000?text=NRG' },
      { name: '100T', logo: 'https://via.placeholder.com/64/ff0000/ffffff?text=100T' },
    ],
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    user: {
      name: 'ValorantFan123',
      avatar: 'https://via.placeholder.com/32/9d4edd/ffffff?text=V',
      badge: 'sub',
    },
    message: 'What a clutch! 🔥',
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: '2',
    user: {
      name: 'ProGamer_X',
      avatar: 'https://via.placeholder.com/32/ff4655/ffffff?text=P',
    },
    message: 'Sentinels looking strong this series',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: '3',
    user: {
      name: 'VCTModerator',
      avatar: 'https://via.placeholder.com/32/00d4ff/ffffff?text=M',
      badge: 'mod',
    },
    message: 'Remember to keep it civil in chat everyone!',
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
  {
    id: '4',
    user: {
      name: 'TenzFan',
      avatar: 'https://via.placeholder.com/32/ffd700/000000?text=T',
      badge: 'vip',
    },
    message: 'TenZ is on fire today 🎯',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: '5',
    user: {
      name: 'EsportsAnalyst',
      avatar: 'https://via.placeholder.com/32/00ff88/000000?text=E',
      badge: 'verified',
    },
    message: 'Fnatic needs to adapt their strategy on defense',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
];

/**
 * Hook for managing live stream data
 * Features:
 * - Fetches live events, matches, and chat messages
 * - Auto-refresh every 30 seconds
 * - Stream switching capability
 * - Error handling
 */
export const useLiveData = (): UseLiveDataReturn => {
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch live events from API
   */
  const fetchLiveEvents = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/opera/live/events');
      // const data = await response.json();
      
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
      return MOCK_EVENTS;
    } catch (err) {
      throw new Error('Failed to fetch live events');
    }
  }, []);

  /**
   * Fetch live matches from API
   */
  const fetchLiveMatches = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/opera/live/matches');
      // const data = await response.json();
      
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
      return MOCK_MATCHES;
    } catch (err) {
      throw new Error('Failed to fetch live matches');
    }
  }, []);

  /**
   * Fetch chat messages from API
   */
  const fetchChatMessages = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/opera/live/chat');
      // const data = await response.json();
      
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY / 2));
      return MOCK_MESSAGES;
    } catch (err) {
      throw new Error('Failed to fetch chat messages');
    }
  }, []);

  /**
   * Switch to a different stream
   */
  const switchStream = useCallback((streamId: string) => {
    const stream = MOCK_STREAMS.find((s) => s.id === streamId);
    if (stream) {
      setCurrentStream(stream);
    }
  }, []);

  /**
   * Refresh all live data
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [events, matches, messages] = await Promise.all([
        fetchLiveEvents(),
        fetchLiveMatches(),
        fetchChatMessages(),
      ]);

      setLiveEvents(events);
      setLiveMatches(matches);
      setChatMessages(messages);

      // Set initial stream if none selected
      if (!currentStream && MOCK_STREAMS.length > 0) {
        setCurrentStream(MOCK_STREAMS[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchLiveEvents, fetchLiveMatches, fetchChatMessages, currentStream]);

  /**
   * Start polling for live data
   */
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      fetchLiveMatches().then(setLiveMatches).catch(console.error);
      fetchChatMessages().then(setChatMessages).catch(console.error);
    }, 30000); // Poll every 30 seconds
  }, [fetchLiveMatches, fetchChatMessages]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Initial load and polling setup
  useEffect(() => {
    refreshData();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [refreshData, startPolling, stopPolling]);

  return {
    currentStream,
    liveEvents,
    liveMatches,
    chatMessages,
    isLoading,
    error,
    switchStream,
    refreshData,
  };
};

export default useLiveData;
