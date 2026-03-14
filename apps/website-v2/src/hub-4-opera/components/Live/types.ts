/**
 * OPERA Live Stream Types
 * TypeScript interfaces and types for live streaming components
 * 
 * [Ver001.000]
 */

import type { ReactNode } from 'react';

// ============================================================================
// STREAM TYPES
// ============================================================================

export type StreamPlatform = 'twitch' | 'youtube';

export interface Stream {
  id: string;
  url: string;
  platform: StreamPlatform;
  title: string;
  matchId?: string;
}

export interface Streamer {
  name: string;
  avatar: string;
}

export interface StreamInfo {
  id: string;
  title: string;
  thumbnail: string;
  platform: StreamPlatform;
  viewers: number;
  isLive: boolean;
  streamer: Streamer;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface Team {
  name: string;
  score: number;
  logo: string;
}

export interface SimpleTeam {
  name: string;
  logo: string;
}

// ============================================================================
// MATCH TYPES
// ============================================================================

export type MatchStatus = 'live' | 'upcoming' | 'finished';

export interface LiveMatch {
  id: string;
  teamA: Team;
  teamB: Team;
  status: MatchStatus;
  map: string;
  tournament: string;
  eta?: string;
}

export interface DetailedLiveMatch {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  map: string;
  tournament: string;
  status: MatchStatus;
  streamUrl?: string;
  startTime?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventStatus = 'live' | 'upcoming' | 'finished';

export interface LiveEvent {
  id: string;
  title: string;
  tournament: string;
  startTime: string;
  status: EventStatus;
  thumbnail: string;
  viewers?: number;
  teams: SimpleTeam[];
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export type UserBadge = 'vip' | 'mod' | 'sub' | 'founder' | 'verified';

export interface ChatUser {
  name: string;
  avatar: string;
  badge?: UserBadge;
}

export interface ChatMessage {
  id: string;
  user: ChatUser;
  message: string;
  timestamp: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface LiveStreamViewerProps {
  streamUrl: string;
  platform: StreamPlatform;
  matchId?: string;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
}

export interface LiveMatchTickerProps {
  matches: LiveMatch[];
  onMatchClick: (matchId: string) => void;
}

export interface LiveEventListProps {
  events: LiveEvent[];
  currentEventId?: string;
  onEventSelect: (eventId: string) => void;
}

export interface LiveChatProps {
  matchId: string;
  messages: ChatMessage[];
}

export interface LiveStreamCardProps {
  stream: StreamInfo;
  onClick: () => void;
}

export interface LiveContainerProps {
  defaultStreamUrl?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseLiveDataReturn {
  currentStream: Stream | null;
  liveEvents: LiveEvent[];
  liveMatches: DetailedLiveMatch[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  switchStream: (streamId: string) => void;
  refreshData: () => Promise<void>;
}

// ============================================================================
// VIEWER STATE
// ============================================================================

export interface ViewerState {
  isTheaterMode: boolean;
  isFullscreen: boolean;
  volume: number;
  isMuted: boolean;
  showControls: boolean;
}

export type ViewerAction =
  | { type: 'TOGGLE_THEATER' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SHOW_CONTROLS' }
  | { type: 'HIDE_CONTROLS' };

// ============================================================================
// MOCK DATA TYPES
// ============================================================================

export interface MockStreamData {
  streams: StreamInfo[];
  events: LiveEvent[];
  matches: DetailedLiveMatch[];
  messages: ChatMessage[];
}
