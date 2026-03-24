/**
 * OPERA Live Stream Mock Data
 * Mock data for development and demonstration
 * 
 * [Ver001.000]
 */
import type {
  Stream,
  LiveEvent,
  LiveMatch,
  ChatMessage,
  MockStreamData,
} from './types';

// ============================================================================
// STREAMS
// ============================================================================

export const mockStreams: Stream[] = [
  {
    id: 'stream-1',
    url: 'https://www.twitch.tv/valorant',
    platform: 'twitch',
    title: 'VCT 2026 Masters Tokyo - Official Broadcast',
    matchId: 'match-1',
  },
  {
    id: 'stream-2',
    url: 'https://www.youtube.com/watch?v=thinkingmansvalorant',
    platform: 'youtube',
    title: "Thinking Man's Valorant - VCT Co-stream",
    matchId: 'match-1',
  },
  {
    id: 'stream-3',
    url: 'https://www.twitch.tv/tarik',
    platform: 'twitch',
    title: 'tarik - VCT Watch Party & Analysis',
    matchId: 'match-2',
  },
  {
    id: 'stream-4',
    url: 'https://www.twitch.tv/shroud',
    platform: 'twitch',
    title: 'shroud - VCT Masters Tokyo Reactions',
    matchId: 'match-1',
  },
  {
    id: 'stream-5',
    url: 'https://www.youtube.com/watch?v=plat chat',
    platform: 'youtube',
    title: 'Plat Chat Valorant - Live Analysis',
    matchId: 'match-2',
  },
];

// ============================================================================
// MATCHES
// ============================================================================

export const mockMatches: LiveMatch[] = [
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
  {
    id: 'match-4',
    teamA: {
      name: 'Leviatán',
      score: 0,
      logo: 'https://via.placeholder.com/64/00ff88/000000?text=LEV',
    },
    teamB: {
      name: 'LOUD',
      score: 0,
      logo: 'https://via.placeholder.com/64/00ff00/000000?text=LOUD',
    },
    status: 'upcoming',
    map: 'Icebox',
    tournament: 'VCT Americas Stage 1',
    eta: '3h 45m',
  },
  {
    id: 'match-5',
    teamA: {
      name: 'Team Liquid',
      score: 1,
      logo: 'https://via.placeholder.com/64/0f2044/ffffff?text=TL',
    },
    teamB: {
      name: 'NAVI',
      score: 2,
      logo: 'https://via.placeholder.com/64/ffd700/000000?text=NAVI',
    },
    status: 'finished',
    map: 'Split',
    tournament: 'VCT EMEA Stage 1',
  },
  {
    id: 'match-6',
    teamA: {
      name: 'Gen.G',
      score: 0,
      logo: 'https://via.placeholder.com/64/aa8a00/ffffff?text=GG',
    },
    teamB: {
      name: 'DRX',
      score: 0,
      logo: 'https://via.placeholder.com/64/0066cc/ffffff?text=DRX',
    },
    status: 'upcoming',
    map: 'Lotus',
    tournament: 'VCT Pacific Stage 1',
    eta: '5h 20m',
  },
];

// ============================================================================
// EVENTS
// ============================================================================

export const mockEvents: LiveEvent[] = [
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
  {
    id: 'event-4',
    title: 'Leviatán vs LOUD',
    tournament: 'VCT Americas Stage 1',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'upcoming',
    thumbnail: 'https://via.placeholder.com/320x180/00ff88/000000?text=LEV+vs+LOUD',
    teams: [
      { name: 'Leviatán', logo: 'https://via.placeholder.com/64/00ff88/000000?text=LEV' },
      { name: 'LOUD', logo: 'https://via.placeholder.com/64/00ff00/000000?text=LOUD' },
    ],
  },
  {
    id: 'event-5',
    title: 'Team Liquid vs NAVI',
    tournament: 'VCT EMEA Stage 1',
    startTime: new Date(Date.now() - 10800000).toISOString(),
    status: 'finished',
    thumbnail: 'https://via.placeholder.com/320x180/0f2044/ffffff?text=TL+vs+NAVI',
    teams: [
      { name: 'Team Liquid', logo: 'https://via.placeholder.com/64/0f2044/ffffff?text=TL' },
      { name: 'NAVI', logo: 'https://via.placeholder.com/64/ffd700/000000?text=NAVI' },
    ],
  },
  {
    id: 'event-6',
    title: 'Gen.G vs DRX',
    tournament: 'VCT Pacific Stage 1',
    startTime: new Date(Date.now() + 18000000).toISOString(),
    status: 'upcoming',
    thumbnail: 'https://via.placeholder.com/320x180/aa8a00/ffffff?text=GG+vs+DRX',
    teams: [
      { name: 'Gen.G', logo: 'https://via.placeholder.com/64/aa8a00/ffffff?text=GG' },
      { name: 'DRX', logo: 'https://via.placeholder.com/64/0066cc/ffffff?text=DRX' },
    ],
  },
];

// ============================================================================
// CHAT MESSAGES
// ============================================================================

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    user: {
      name: 'ValorantFan123',
      avatar: 'https://via.placeholder.com/32/9d4edd/ffffff?text=V',
      badge: 'sub',
    },
    message: 'What a clutch from TenZ! 🔥',
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'msg-2',
    user: {
      name: 'ProGamer_X',
      avatar: 'https://via.placeholder.com/32/ff4655/ffffff?text=P',
    },
    message: 'Sentinels looking strong this series',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'msg-3',
    user: {
      name: 'VCTModerator',
      avatar: 'https://via.placeholder.com/32/00d4ff/ffffff?text=M',
      badge: 'mod',
    },
    message: 'Remember to keep it civil in chat everyone!',
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
  {
    id: 'msg-4',
    user: {
      name: 'TenzFan',
      avatar: 'https://via.placeholder.com/32/ffd700/000000?text=T',
      badge: 'vip',
    },
    message: 'TenZ is on fire today 🎯',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'msg-5',
    user: {
      name: 'EsportsAnalyst',
      avatar: 'https://via.placeholder.com/32/00ff88/000000?text=E',
      badge: 'verified',
    },
    message: 'Fnatic needs to adapt their strategy on defense',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: 'msg-6',
    user: {
      name: 'SentinelsSucks',
      avatar: 'https://via.placeholder.com/32/ff0000/ffffff?text=S',
    },
    message: 'that play was insane',
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: 'msg-7',
    user: {
      name: 'ProduerDerrek',
      avatar: 'https://via.placeholder.com/32/0000ff/ffffff?text=D',
      badge: 'founder',
    },
    message: 'Been watching since beta days! Great match so far',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'msg-8',
    user: {
      name: 'VLR_GG',
      avatar: 'https://via.placeholder.com/32/ffffff/000000?text=V',
    },
    message: 'What do you all think about the new agent changes?',
    timestamp: new Date(Date.now() - 360000).toISOString(),
  },
  {
    id: 'msg-9',
    user: {
      name: 'SacyEnjoyer',
      avatar: 'https://via.placeholder.com/32/00ff00/000000?text=S',
      badge: 'sub',
    },
    message: 'Sacy\'s reads are godlike 👏',
    timestamp: new Date(Date.now() - 420000).toISOString(),
  },
  {
    id: 'msg-10',
    user: {
      name: 'FPS_Veteran',
      avatar: 'https://via.placeholder.com/32/800080/ffffff?text=F',
    },
    message: 'This match is going to game 5, calling it now',
    timestamp: new Date(Date.now() - 480000).toISOString(),
  },
];

// ============================================================================
// STREAM INFO (for Stream Cards)
// ============================================================================

export const mockStreamInfo = [
  {
    id: 'stream-card-1',
    title: 'VCT 2026 Masters Tokyo - Official Broadcast',
    thumbnail: 'https://via.placeholder.com/640x360/9d4edd/ffffff?text=VCT+Masters+Tokyo',
    platform: 'twitch' as const,
    viewers: 450000,
    isLive: true,
    streamer: {
      name: 'VALORANT',
      avatar: 'https://via.placeholder.com/64/ff4655/ffffff?text=V',
    },
  },
  {
    id: 'stream-card-2',
    title: 'VCT Watch Party - Sentinels vs Fnatic Analysis',
    thumbnail: 'https://via.placeholder.com/640x360/9146ff/ffffff?text=Watch+Party',
    platform: 'twitch' as const,
    viewers: 85000,
    isLive: true,
    streamer: {
      name: 'tarik',
      avatar: 'https://via.placeholder.com/64/00ff88/000000?text=T',
    },
  },
  {
    id: 'stream-card-3',
    title: "Thinking Man's Valorant - Masters Tokyo Co-stream",
    thumbnail: 'https://via.placeholder.com/640x360/ff0000/ffffff?text=TMV',
    platform: 'youtube' as const,
    viewers: 42000,
    isLive: true,
    streamer: {
      name: 'Thinking Man\'s Valorant',
      avatar: 'https://via.placeholder.com/64/ffd700/000000?text=TMV',
    },
  },
  {
    id: 'stream-card-4',
    title: 'VCT Masters Tokyo - VOD Review',
    thumbnail: 'https://via.placeholder.com/640x360/9146ff/ffffff?text=Review',
    platform: 'twitch' as const,
    viewers: 28000,
    isLive: true,
    streamer: {
      name: 'shroud',
      avatar: 'https://via.placeholder.com/64/ffffff/000000?text=S',
    },
  },
];

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================

export const mockLiveData: MockStreamData = {
  streams: mockStreamInfo,
  events: mockEvents,
  matches: mockMatches,
  messages: mockMessages,
};

export default mockLiveData;
