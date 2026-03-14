/**
 * OPERA Simulator Mock Data
 * Sample data for prediction components
 * 
 * [Ver001.000]
 */

import type { 
  TeamPredictionData, 
  PlayerPredictionData, 
  PastPrediction,
  H2HHistory 
} from './types';

// Purple theme colors
export const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

// ============================================================================
// MOCK TEAMS
// ============================================================================

export const mockTeams: TeamPredictionData[] = [
  {
    id: 'sentinels',
    name: 'Sentinels',
    tag: 'SEN',
    avgRating: 1850,
    recentForm: 78,
    winRate: 0.68,
    mapsPlayed: 127,
    mapPool: ['Bind', 'Haven', 'Split', 'Ascent', 'Icebox'],
  },
  {
    id: 'cloud9',
    name: 'Cloud9',
    tag: 'C9',
    avgRating: 1820,
    recentForm: 72,
    winRate: 0.64,
    mapsPlayed: 143,
    mapPool: ['Bind', 'Haven', 'Split', 'Ascent', 'Lotus'],
  },
  {
    id: 'fnatic',
    name: 'Fnatic',
    tag: 'FNC',
    avgRating: 1880,
    recentForm: 85,
    winRate: 0.72,
    mapsPlayed: 156,
    mapPool: ['Bind', 'Haven', 'Split', 'Ascent', 'Sunset'],
  },
  {
    id: 'drx',
    name: 'DRX',
    tag: 'DRX',
    avgRating: 1840,
    recentForm: 80,
    winRate: 0.70,
    mapsPlayed: 134,
    mapPool: ['Bind', 'Haven', 'Split', 'Lotus', 'Icebox'],
  },
  {
    id: 'edg',
    name: 'EDward Gaming',
    tag: 'EDG',
    avgRating: 1860,
    recentForm: 82,
    winRate: 0.71,
    mapsPlayed: 118,
    mapPool: ['Bind', 'Haven', 'Ascent', 'Lotus', 'Sunset'],
  },
  {
    id: 'loud',
    name: 'LOUD',
    tag: 'LOUD',
    avgRating: 1790,
    recentForm: 65,
    winRate: 0.58,
    mapsPlayed: 139,
    mapPool: ['Bind', 'Split', 'Ascent', 'Icebox', 'Breeze'],
  },
  {
    id: 'nrg',
    name: 'NRG',
    tag: 'NRG',
    avgRating: 1750,
    recentForm: 58,
    winRate: 0.52,
    mapsPlayed: 112,
    mapPool: ['Haven', 'Split', 'Ascent', 'Lotus', 'Icebox'],
  },
  {
    id: 'lev',
    name: 'Leviatán',
    tag: 'LEV',
    avgRating: 1810,
    recentForm: 75,
    winRate: 0.63,
    mapsPlayed: 128,
    mapPool: ['Bind', 'Haven', 'Split', 'Ascent', 'Icebox'],
  },
];

// ============================================================================
// MOCK PLAYERS
// ============================================================================

export const mockPlayers: PlayerPredictionData[] = [
  {
    id: 'tenz',
    name: 'TenZ',
    team: 'Sentinels',
    role: 'duelist',
    rating: 1.18,
    acs: 245,
    kdr: 1.22,
    adr: 158,
    fkpr: 0.14,
    fdpr: 0.08,
    clutchRate: 0.18,
    agentPool: ['Jett', 'Reyna', 'Raze'],
    recentForm: [1.12, 1.25, 1.08, 1.31, 1.15],
  },
  {
    id: 'aspas',
    name: 'aspas',
    team: 'Leviatán',
    role: 'duelist',
    rating: 1.25,
    acs: 268,
    kdr: 1.35,
    adr: 172,
    fkpr: 0.16,
    fdpr: 0.07,
    clutchRate: 0.22,
    agentPool: ['Jett', 'Raze', 'Yoru'],
    recentForm: [1.28, 1.31, 1.19, 1.35, 1.22],
  },
  {
    id: 'yay',
    name: 'yay',
    team: 'Cloud9',
    role: 'duelist',
    rating: 1.15,
    acs: 238,
    kdr: 1.18,
    adr: 151,
    fkpr: 0.12,
    fdpr: 0.09,
    clutchRate: 0.15,
    agentPool: ['Jett', 'Chamber'],
    recentForm: [1.08, 1.12, 1.05, 1.18, 1.11],
  },
  {
    id: 'derke',
    name: 'Derke',
    team: 'Fnatic',
    role: 'duelist',
    rating: 1.22,
    acs: 256,
    kdr: 1.28,
    adr: 165,
    fkpr: 0.15,
    fdpr: 0.08,
    clutchRate: 0.20,
    agentPool: ['Jett', 'Raze', 'Sage'],
    recentForm: [1.18, 1.24, 1.15, 1.28, 1.21],
  },
  {
    id: 'something',
    name: 'something',
    team: 'Paper Rex',
    role: 'duelist',
    rating: 1.19,
    acs: 251,
    kdr: 1.24,
    adr: 162,
    fkpr: 0.14,
    fdpr: 0.09,
    clutchRate: 0.17,
    agentPool: ['Jett', 'Raze', 'Neon'],
    recentForm: [1.15, 1.22, 1.08, 1.25, 1.18],
  },
  {
    id: 'boaster',
    name: 'Boaster',
    team: 'Fnatic',
    role: 'controller',
    rating: 1.05,
    acs: 198,
    kdr: 1.02,
    adr: 128,
    fkpr: 0.06,
    fdpr: 0.07,
    clutchRate: 0.12,
    agentPool: ['Omen', 'Brimstone', 'Viper'],
    recentForm: [1.02, 1.08, 0.98, 1.12, 1.05],
  },
  {
    id: 'vanity',
    name: 'vanity',
    team: 'Cloud9',
    role: 'controller',
    rating: 0.98,
    acs: 185,
    kdr: 0.92,
    adr: 118,
    fkpr: 0.05,
    fdpr: 0.08,
    clutchRate: 0.10,
    agentPool: ['Omen', 'Astra', 'Viper'],
    recentForm: [0.95, 1.02, 0.88, 1.05, 0.98],
  },
  {
    id: 'stax',
    name: 'stax',
    team: 'DRX',
    role: 'initiator',
    rating: 1.08,
    acs: 205,
    kdr: 1.05,
    adr: 135,
    fkpr: 0.08,
    fdpr: 0.07,
    clutchRate: 0.14,
    agentPool: ['Breach', 'Skye', 'KAY/O'],
    recentForm: [1.05, 1.12, 1.02, 1.15, 1.08],
  },
  {
    id: 'sacy',
    name: 'Sacy',
    team: 'Sentinels',
    role: 'initiator',
    rating: 1.02,
    acs: 192,
    kdr: 0.98,
    adr: 125,
    fkpr: 0.07,
    fdpr: 0.08,
    clutchRate: 0.11,
    agentPool: ['Sova', 'Fade', 'Gekko'],
    recentForm: [0.98, 1.05, 0.95, 1.08, 1.02],
  },
  {
    id: 'kk',
    name: 'Karon',
    team: 'EDG',
    role: 'sentinel',
    rating: 1.12,
    acs: 215,
    kdr: 1.15,
    adr: 142,
    fkpr: 0.09,
    fdpr: 0.06,
    clutchRate: 0.25,
    agentPool: ['Cypher', 'Killjoy', 'Chamber'],
    recentForm: [1.08, 1.15, 1.05, 1.22, 1.12],
  },
];

// ============================================================================
// MOCK PREDICTIONS
// ============================================================================

export const mockPredictions: PastPrediction[] = [
  {
    id: 'pred-001',
    date: '2026-03-14T18:30:00Z',
    type: 'team',
    teams: ['Sentinels', 'Cloud9'],
    predicted: 'Sentinels',
    predictedProbability: 0.62,
    actual: 'Sentinels',
    confidence: 78,
    wasCorrect: true,
  },
  {
    id: 'pred-002',
    date: '2026-03-13T20:00:00Z',
    type: 'team',
    teams: ['Fnatic', 'DRX'],
    predicted: 'Fnatic',
    predictedProbability: 0.58,
    actual: 'DRX',
    confidence: 65,
    wasCorrect: false,
  },
  {
    id: 'pred-003',
    date: '2026-03-12T16:00:00Z',
    type: 'duel',
    teams: ['TenZ', 'aspas'],
    predicted: 'aspas',
    predictedProbability: 0.55,
    actual: 'aspas',
    confidence: 72,
    wasCorrect: true,
  },
  {
    id: 'pred-004',
    date: '2026-03-11T19:30:00Z',
    type: 'team',
    teams: ['EDG', 'LOUD'],
    predicted: 'EDG',
    predictedProbability: 0.71,
    actual: 'EDG',
    confidence: 85,
    wasCorrect: true,
  },
  {
    id: 'pred-005',
    date: '2026-03-10T21:00:00Z',
    type: 'player',
    teams: ['Derke', 'yay'],
    predicted: 'Derke',
    predictedProbability: 0.64,
    actual: 'Derke',
    confidence: 80,
    wasCorrect: true,
  },
  {
    id: 'pred-006',
    date: '2026-03-09T17:00:00Z',
    type: 'team',
    teams: ['Leviatán', 'NRG'],
    predicted: 'Leviatán',
    predictedProbability: 0.68,
    actual: 'NRG',
    confidence: 70,
    wasCorrect: false,
  },
  {
    id: 'pred-007',
    date: '2026-03-08T22:00:00Z',
    type: 'duel',
    teams: ['something', 'TenZ'],
    predicted: 'something',
    predictedProbability: 0.52,
    confidence: 60,
  },
  {
    id: 'pred-008',
    date: '2026-03-07T15:00:00Z',
    type: 'team',
    teams: ['Cloud9', 'LOUD'],
    predicted: 'Cloud9',
    predictedProbability: 0.59,
    actual: 'Cloud9',
    confidence: 68,
    wasCorrect: true,
  },
];

// ============================================================================
// MOCK H2H HISTORY
// ============================================================================

export const mockH2HHistory: Record<string, H2HHistory[]> = {
  'sentinels-cloud9': [
    { date: '2026-02-15', winner: 'Sentinels', score: '2-1', map: 'Ascent' },
    { date: '2026-01-28', winner: 'Cloud9', score: '2-0', map: 'Bind' },
    { date: '2025-12-10', winner: 'Sentinels', score: '2-1', map: 'Haven' },
    { date: '2025-11-22', winner: 'Sentinels', score: '2-0', map: 'Split' },
  ],
  'fnatic-drx': [
    { date: '2026-02-20', winner: 'Fnatic', score: '2-1', map: 'Sunset' },
    { date: '2026-01-15', winner: 'DRX', score: '2-0', map: 'Lotus' },
    { date: '2025-12-05', winner: 'Fnatic', score: '2-1', map: 'Icebox' },
  ],
  'edg-loud': [
    { date: '2026-02-25', winner: 'EDG', score: '2-0', map: 'Ascent' },
    { date: '2026-01-20', winner: 'EDG', score: '2-1', map: 'Bind' },
  ],
};

// ============================================================================
// WEAPONS AND UTILITIES
// ============================================================================

export const weapons = [
  'Vandal',
  'Phantom',
  'Operator',
  'Sheriff',
  'Ghost',
  'Classic',
  'Spectre',
  'Odin',
  'Judge',
  'Bulldog',
  'Guardian',
  'Marshal',
];

export const abilities = [
  'Flash',
  'Smoke',
  'Molly',
  'Dash',
  'Heal',
  'Recon',
  'Trap',
  'Ultimate',
];

export const maps = [
  'Ascent',
  'Bind',
  'Haven',
  'Split',
  'Icebox',
  'Breeze',
  'Fracture',
  'Pearl',
  'Lotus',
  'Sunset',
];

// ============================================================================
// ROLE COLORS
// ============================================================================

export const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  duelist: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  controller: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  initiator: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  sentinel: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  flex: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};
