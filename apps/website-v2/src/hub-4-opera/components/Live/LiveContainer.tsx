/**
 * LiveContainer - Main container integrating all live components
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Radio,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';

import { LiveStreamViewer } from './LiveStreamViewer';
import { LiveMatchTicker } from './LiveMatchTicker';
import { LiveEventList } from './LiveEventList';
import { LiveChat } from './LiveChat';
import { useLiveData } from './hooks/useLiveData';
import { mockLiveData } from './mockData';
import type { LiveContainerProps, LiveMatch, LiveEvent, Stream } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const OPERA_GLOW = colors.hub.opera.glow;

// Convert DetailedLiveMatch to LiveMatch for ticker
const toTickerMatch = (match: { id: string; teamA: { name: string; score: number; logo: string }; teamB: { name: string; score: number; logo: string }; map: string; tournament: string; status: 'live' | 'upcoming' | 'finished'; startTime?: string }): LiveMatch => ({
  id: match.id,
  teamA: match.teamA,
  teamB: match.teamB,
  status: match.status,
  map: match.map,
  tournament: match.tournament,
  eta: match.startTime
    ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : undefined,
});

// Convert DetailedLiveMatch[] to LiveEvent[]
const toLiveEvents = (matches: DetailedLiveMatch[]): LiveEvent[] =>
  matches.map((match) => ({
    id: match.id,
    title: `${match.teamA.name} vs ${match.teamB.name}`,
    tournament: match.tournament,
    startTime: match.startTime || new Date().toISOString(),
    status: match.status,
    thumbnail: `https://via.placeholder.com/320x180?text=${encodeURIComponent(
      match.map
    )}`,
    streamUrl: match.streamUrl,
    teams: [
      { name: match.teamA.name, logo: match.teamA.logo },
      { name: match.teamB.name, logo: match.teamB.logo },
    ],
  }));

export const LiveContainer: React.FC<LiveContainerProps> = ({
  defaultStreamUrl,
}) => {
  const {
    currentStream,
    liveEvents,
    liveMatches,
    chatMessages,
    isLoading,
    error,
    switchStream,
    refreshData,
  } = useLiveData();

  const [showChat, setShowChat] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use mock data if no real data (for demo)
  const displayMatches = liveMatches.length > 0 ? liveMatches : mockLiveData.matches;
  const displayEvents = liveEvents.length > 0 ? liveEvents : toLiveEvents(mockLiveData.matches);
  const displayMessages = chatMessages.length > 0 ? chatMessages : mockLiveData.messages;

  // Current stream to display
  const activeStream: Stream = currentStream || {
    id: 'default',
    url: defaultStreamUrl || 'https://www.twitch.tv/valorant',
    platform: 'twitch',
    title: 'Official VCT Broadcast',
    matchId: displayMatches[0]?.id,
  };

  // Get current match info for overlay
  const currentMatch = displayMatches.find((m) => m.id === activeStream.matchId);

  // Handle match click from ticker
  const handleMatchClick = useCallback(
    (matchId: string) => {
      setSelectedMatchId(matchId);
      const match = displayMatches.find((m) => m.id === matchId);
      if (match?.streamUrl) {
        switchStream(matchId);
      }
    },
    [displayMatches, switchStream]
  );

  // Handle event select from sidebar
  const handleEventSelect = useCallback(
    (eventId: string) => {
      const event = displayEvents.find((e) => e.id === eventId);
      if (event) {
        setSelectedMatchId(eventId);
        // Find matching stream or use default
        const matchingStream = mockLiveData.streams.find(
          (s) => s.title.includes(event.teams[0]?.name) || s.title.includes(event.teams[1]?.name)
        );
        if (matchingStream) {
          switchStream(matchingStream.id);
        }
      }
    },
    [displayEvents, switchStream]
  );

  // Refresh data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${OPERA_COLOR}20` }}
          >
            <Radio className="w-4 h-4" style={{ color: OPERA_COLOR }} />
          </motion.div>
          <div>
            <h2 className="font-semibold text-white">OPERA Live</h2>
            <p className="text-xs text-white/50">
              {displayMatches.filter((m) => m.status === 'live').length} live now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              showChat
                ? 'bg-[#9d4edd]/20 text-[#9d4edd]'
                : 'hover:bg-white/10 text-white/70'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Refresh */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 disabled:opacity-50"
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <ExternalLink className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Stream + Ticker */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Stream Viewer */}
          <div className="flex-1 min-h-0">
            <LiveStreamViewer
              streamUrl={activeStream.url}
              platform={activeStream.platform}
              matchId={activeStream.matchId}
              autoPlay={true}
              onError={(error) => console.error('Stream error:', error)}
              matchInfo={
                currentMatch
                  ? {
                      teamA: currentMatch.teamA,
                      teamB: currentMatch.teamB,
                      map: currentMatch.map,
                      tournament: currentMatch.tournament,
                    }
                  : undefined
              }
            />
          </div>

          {/* Match Ticker */}
          <GlassCard className="p-2 flex-shrink-0">
            <LiveMatchTicker
              matches={displayMatches.map(toTickerMatch)}
              onMatchClick={handleMatchClick}
            />
          </GlassCard>
        </div>

        {/* Right: Sidebar (Events + Chat) */}
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 flex flex-col gap-4"
            >
              {/* Event List */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <LiveEventList
                  events={displayEvents}
                  currentEventId={selectedMatchId || activeStream.matchId}
                  onEventSelect={handleEventSelect}
                />
              </div>

              {/* Chat */}
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 384, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <LiveChat
                      matchId={activeStream.matchId || 'default'}
                      messages={displayMessages}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg"
        style={{ backgroundColor: OPERA_COLOR }}
      >
        {isSidebarCollapsed ? (
          <Maximize2 className="w-5 h-5 text-white" />
        ) : (
          <Minimize2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 lg:right-auto lg:w-96 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200"
        >
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Error loading live data</h4>
              <p className="text-sm opacity-80">{error.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveContainer;
