/**
 * useRankingsData Hook
 * Data fetching and management for OPERA Rankings
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useRef } from 'react';
import type {
  Organization,
  TeamRanking,
  PlayerRanking,
  PlayerRole,
  UseRankingsDataReturn,
  RankingsFilters,
} from '../types';

// OPERA purple theme
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

// ============================================================================
// MOCK DATA - Organizations
// ============================================================================

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'sentinels',
    name: 'Sentinels',
    logo: 'https://via.placeholder.com/100?text=SEN',
    region: 'Americas',
    teams: [
      { id: 'sen-val', name: 'Sentinels', tag: 'SEN', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 2500000,
      tournamentWins: 8,
      matchesWon: 156,
      matchesLost: 89,
      investmentTier: 'S',
      longevityScore: 95,
    },
    rank: 1,
    rankChange: 0,
  },
  {
    id: 'cloud9',
    name: 'Cloud9',
    logo: 'https://via.placeholder.com/100?text=C9',
    region: 'Americas',
    teams: [
      { id: 'c9-val', name: 'Cloud9', tag: 'C9', game: 'Valorant' },
      { id: 'c9-cs', name: 'Cloud9 CS', tag: 'C9', game: 'CS2' },
    ],
    stats: {
      totalPrizeWinnings: 1800000,
      tournamentWins: 6,
      matchesWon: 134,
      matchesLost: 78,
      investmentTier: 'S',
      longevityScore: 92,
    },
    rank: 2,
    rankChange: 2,
  },
  {
    id: 'fnatic',
    name: 'Fnatic',
    logo: 'https://via.placeholder.com/100?text=FNC',
    region: 'EMEA',
    teams: [
      { id: 'fnc-val', name: 'Fnatic', tag: 'FNC', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 2200000,
      tournamentWins: 10,
      matchesWon: 178,
      matchesLost: 67,
      investmentTier: 'S',
      longevityScore: 98,
    },
    rank: 3,
    rankChange: -1,
  },
  {
    id: 'drx',
    name: 'DRX',
    logo: 'https://via.placeholder.com/100?text=DRX',
    region: 'Pacific',
    teams: [
      { id: 'drx-val', name: 'DRX', tag: 'DRX', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 1500000,
      tournamentWins: 5,
      matchesWon: 145,
      matchesLost: 56,
      investmentTier: 'A',
      longevityScore: 88,
    },
    rank: 4,
    rankChange: 3,
  },
  {
    id: 'edg',
    name: 'EDward Gaming',
    logo: 'https://via.placeholder.com/100?text=EDG',
    region: 'China',
    teams: [
      { id: 'edg-val', name: 'EDG', tag: 'EDG', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 1200000,
      tournamentWins: 4,
      matchesWon: 112,
      matchesLost: 45,
      investmentTier: 'A',
      longevityScore: 85,
    },
    rank: 5,
    rankChange: -2,
  },
  {
    id: 'navi',
    name: 'NAVI',
    logo: 'https://via.placeholder.com/100?text=NAVI',
    region: 'EMEA',
    teams: [
      { id: 'navi-val', name: 'NAVI', tag: 'NAVI', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 900000,
      tournamentWins: 3,
      matchesWon: 98,
      matchesLost: 67,
      investmentTier: 'A',
      longevityScore: 90,
    },
    rank: 6,
    rankChange: 1,
  },
  {
    id: 'loud',
    name: 'LOUD',
    logo: 'https://via.placeholder.com/100?text=LOUD',
    region: 'Americas',
    teams: [
      { id: 'loud-val', name: 'LOUD', tag: 'LOUD', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 1100000,
      tournamentWins: 4,
      matchesWon: 134,
      matchesLost: 78,
      investmentTier: 'A',
      longevityScore: 82,
    },
    rank: 7,
    rankChange: -2,
  },
  {
    id: 'prx',
    name: 'Paper Rex',
    logo: 'https://via.placeholder.com/100?text=PRX',
    region: 'Pacific',
    teams: [
      { id: 'prx-val', name: 'Paper Rex', tag: 'PRX', game: 'Valorant' },
    ],
    stats: {
      totalPrizeWinnings: 800000,
      tournamentWins: 3,
      matchesWon: 89,
      matchesLost: 45,
      investmentTier: 'B',
      longevityScore: 78,
    },
    rank: 8,
    rankChange: 5,
  },
];

// ============================================================================
// MOCK DATA - Teams
// ============================================================================

const MOCK_TEAMS: TeamRanking[] = [
  {
    id: 'fnatic-val',
    name: 'Fnatic',
    tag: 'FNC',
    logo: 'https://via.placeholder.com/100?text=FNC',
    organization: 'Fnatic',
    region: 'EMEA',
    tier: 'S',
    stats: {
      rating: 2850,
      wins: 45,
      losses: 12,
      winRate: 78.9,
      avgRoundDiff: 2.3,
      recentForm: ['W', 'W', 'W', 'L', 'W'],
    },
    rank: 1,
    rankChange: 1,
  },
  {
    id: 'sen-val',
    name: 'Sentinels',
    tag: 'SEN',
    logo: 'https://via.placeholder.com/100?text=SEN',
    organization: 'Sentinels',
    region: 'Americas',
    tier: 'S',
    stats: {
      rating: 2820,
      wins: 42,
      losses: 15,
      winRate: 73.7,
      avgRoundDiff: 1.8,
      recentForm: ['W', 'L', 'W', 'W', 'W'],
    },
    rank: 2,
    rankChange: -1,
  },
  {
    id: 'drx-val',
    name: 'DRX',
    tag: 'DRX',
    logo: 'https://via.placeholder.com/100?text=DRX',
    organization: 'DRX',
    region: 'Pacific',
    tier: 'A',
    stats: {
      rating: 2750,
      wins: 38,
      losses: 18,
      winRate: 67.9,
      avgRoundDiff: 1.2,
      recentForm: ['W', 'W', 'L', 'W', 'L'],
    },
    rank: 3,
    rankChange: 2,
  },
  {
    id: 'c9-val',
    name: 'Cloud9',
    tag: 'C9',
    logo: 'https://via.placeholder.com/100?text=C9',
    organization: 'Cloud9',
    region: 'Americas',
    tier: 'A',
    stats: {
      rating: 2680,
      wins: 35,
      losses: 22,
      winRate: 61.4,
      avgRoundDiff: 0.8,
      recentForm: ['L', 'W', 'W', 'L', 'W'],
    },
    rank: 4,
    rankChange: 0,
  },
  {
    id: 'loud-val',
    name: 'LOUD',
    tag: 'LOUD',
    logo: 'https://via.placeholder.com/100?text=LOUD',
    organization: 'LOUD',
    region: 'Americas',
    tier: 'A',
    stats: {
      rating: 2650,
      wins: 33,
      losses: 24,
      winRate: 57.9,
      avgRoundDiff: 0.5,
      recentForm: ['W', 'L', 'L', 'W', 'W'],
    },
    rank: 5,
    rankChange: -2,
  },
  {
    id: 'navi-val',
    name: 'NAVI',
    tag: 'NAVI',
    logo: 'https://via.placeholder.com/100?text=NAVI',
    organization: 'NAVI',
    region: 'EMEA',
    tier: 'B',
    stats: {
      rating: 2580,
      wins: 30,
      losses: 28,
      winRate: 51.7,
      avgRoundDiff: -0.2,
      recentForm: ['L', 'W', 'L', 'W', 'L'],
    },
    rank: 6,
    rankChange: 1,
  },
  {
    id: 'prx-val',
    name: 'Paper Rex',
    tag: 'PRX',
    logo: 'https://via.placeholder.com/100?text=PRX',
    organization: 'Paper Rex',
    region: 'Pacific',
    tier: 'B',
    stats: {
      rating: 2520,
      wins: 28,
      losses: 30,
      winRate: 48.3,
      avgRoundDiff: -0.5,
      recentForm: ['W', 'W', 'L', 'L', 'W'],
    },
    rank: 7,
    rankChange: 3,
  },
  {
    id: 'edg-val',
    name: 'EDG',
    tag: 'EDG',
    logo: 'https://via.placeholder.com/100?text=EDG',
    organization: 'EDward Gaming',
    region: 'China',
    tier: 'B',
    stats: {
      rating: 2480,
      wins: 26,
      losses: 32,
      winRate: 44.8,
      avgRoundDiff: -0.8,
      recentForm: ['L', 'L', 'W', 'W', 'L'],
    },
    rank: 8,
    rankChange: -2,
  },
  {
    id: 'ts-val',
    name: 'Team Secret',
    tag: 'TS',
    logo: 'https://via.placeholder.com/100?text=TS',
    organization: 'Team Secret',
    region: 'Pacific',
    tier: 'C',
    stats: {
      rating: 2350,
      wins: 22,
      losses: 36,
      winRate: 37.9,
      avgRoundDiff: -1.2,
      recentForm: ['L', 'W', 'L', 'L', 'W'],
    },
    rank: 9,
    rankChange: 0,
  },
  {
    id: 'tl-val',
    name: 'Team Liquid',
    tag: 'TL',
    logo: 'https://via.placeholder.com/100?text=TL',
    organization: 'Team Liquid',
    region: 'EMEA',
    tier: 'C',
    stats: {
      rating: 2280,
      wins: 20,
      losses: 38,
      winRate: 34.5,
      avgRoundDiff: -1.5,
      recentForm: ['L', 'L', 'L', 'W', 'L'],
    },
    rank: 10,
    rankChange: -2,
  },
];

// ============================================================================
// MOCK DATA - Players
// ============================================================================

const MOCK_PLAYERS: PlayerRanking[] = [
  {
    id: 'tenz',
    name: 'Tyson Ngo',
    tag: 'TenZ',
    avatar: 'https://via.placeholder.com/100?text=TenZ',
    team: 'Sentinels',
    region: 'Americas',
    role: 'Duelist',
    agents: ['Jett', 'Reyna', 'Raze'],
    stats: {
      elo: 2850,
      rating: 2850,
      acs: 245.5,
      kd: 1.32,
      adr: 156.8,
      kast: 76.5,
      matchesPlayed: 156,
    },
    rank: 1,
    rankChange: 1,
  },
  {
    id: 'derke',
    name: 'Nikita Sirmitev',
    tag: 'Derke',
    avatar: 'https://via.placeholder.com/100?text=Derke',
    team: 'Fnatic',
    region: 'EMEA',
    role: 'Duelist',
    agents: ['Raze', 'Jett'],
    stats: {
      elo: 2830,
      rating: 2830,
      acs: 241.2,
      kd: 1.28,
      adr: 152.3,
      kast: 74.8,
      matchesPlayed: 167,
    },
    rank: 2,
    rankChange: -1,
  },
  {
    id: 'aspas',
    name: 'Erick Santos',
    tag: 'aspas',
    avatar: 'https://via.placeholder.com/100?text=aspas',
    team: 'Leviatán',
    region: 'Americas',
    role: 'Duelist',
    agents: ['Jett', 'Raze'],
    stats: {
      elo: 2790,
      rating: 2790,
      acs: 238.7,
      kd: 1.35,
      adr: 148.9,
      kast: 72.3,
      matchesPlayed: 142,
    },
    rank: 3,
    rankChange: 2,
  },
  {
    id: 'alfajer',
    name: 'Emir Beder',
    tag: 'Alfajer',
    avatar: 'https://via.placeholder.com/100?text=Alfajer',
    team: 'Fnatic',
    region: 'EMEA',
    role: 'Sentinel',
    agents: ['Killjoy', 'Cypher'],
    stats: {
      elo: 2750,
      rating: 2750,
      acs: 212.4,
      kd: 1.18,
      adr: 138.5,
      kast: 78.2,
      matchesPlayed: 134,
    },
    rank: 4,
    rankChange: 0,
  },
  {
    id: 'less',
    name: 'Felipe Basso',
    tag: 'Less',
    avatar: 'https://via.placeholder.com/100?text=Less',
    team: 'LOUD',
    region: 'Americas',
    role: 'Sentinel',
    agents: ['Killjoy', 'Viper'],
    stats: {
      elo: 2720,
      rating: 2720,
      acs: 198.6,
      kd: 1.12,
      adr: 128.4,
      kast: 81.5,
      matchesPlayed: 145,
    },
    rank: 5,
    rankChange: -2,
  },
  {
    id: 'buzz',
    name: 'Yu Byung-chul',
    tag: 'BuZz',
    avatar: 'https://via.placeholder.com/100?text=BuZz',
    team: 'DRX',
    region: 'Pacific',
    role: 'Duelist',
    agents: ['Jett', 'Raze'],
    stats: {
      elo: 2680,
      rating: 2680,
      acs: 234.5,
      kd: 1.25,
      adr: 145.2,
      kast: 73.8,
      matchesPlayed: 128,
    },
    rank: 6,
    rankChange: 3,
  },
  {
    id: 'suygetsu',
    name: 'Dmitry Ilyushin',
    tag: 'Suygetsu',
    avatar: 'https://via.placeholder.com/100?text=Suygetsu',
    team: 'NAVI',
    region: 'EMEA',
    role: 'Controller',
    agents: ['Viper', 'Omen'],
    stats: {
      elo: 2650,
      rating: 2650,
      acs: 205.3,
      kd: 1.15,
      adr: 132.1,
      kast: 79.4,
      matchesPlayed: 118,
    },
    rank: 7,
    rankChange: 1,
  },
  {
    id: 'jinggg',
    name: 'Wang Jing Jie',
    tag: 'Jinggg',
    avatar: 'https://via.placeholder.com/100?text=Jinggg',
    team: 'Paper Rex',
    region: 'Pacific',
    role: 'Duelist',
    agents: ['Raze', 'Phoenix'],
    stats: {
      elo: 2620,
      rating: 2620,
      acs: 228.9,
      kd: 1.22,
      adr: 142.7,
      kast: 71.5,
      matchesPlayed: 134,
    },
    rank: 8,
    rankChange: -2,
  },
  {
    id: 'chronicle',
    name: 'Timofey Khromov',
    tag: 'Chronicle',
    avatar: 'https://via.placeholder.com/100?text=Chronicle',
    team: 'Fnatic',
    region: 'EMEA',
    role: 'Controller',
    agents: ['Viper', 'Omen', 'Brimstone'],
    stats: {
      elo: 2580,
      rating: 2580,
      acs: 195.7,
      kd: 1.08,
      adr: 124.3,
      kast: 82.1,
      matchesPlayed: 156,
    },
    rank: 9,
    rankChange: 0,
  },
  {
    id: 'something',
    name: 'Ilya Petrov',
    tag: 'something',
    avatar: 'https://via.placeholder.com/100?text=something',
    team: 'Paper Rex',
    region: 'Pacific',
    role: 'Initiator',
    agents: ['Fade', 'Sova'],
    stats: {
      elo: 2550,
      rating: 2550,
      acs: 208.4,
      kd: 1.14,
      adr: 135.8,
      kast: 77.3,
      matchesPlayed: 112,
    },
    rank: 10,
    rankChange: 4,
  },
  {
    id: 'smoggy',
    name: 'Liu Qing',
    tag: 'Smoggy',
    avatar: 'https://via.placeholder.com/100?text=Smoggy',
    team: 'EDG',
    region: 'China',
    role: 'Initiator',
    agents: ['Sova', 'Fade'],
    stats: {
      elo: 2480,
      rating: 2480,
      acs: 198.2,
      kd: 1.09,
      adr: 128.5,
      kast: 75.8,
      matchesPlayed: 98,
    },
    rank: 11,
    rankChange: -1,
  },
  {
    id: 'nobody',
    name: 'Wang Senxu',
    tag: 'nobody',
    avatar: 'https://via.placeholder.com/100?text=nobody',
    team: 'EDG',
    region: 'China',
    role: 'Duelist',
    agents: ['Jett', 'Neon'],
    stats: {
      elo: 2450,
      rating: 2450,
      acs: 225.6,
      kd: 1.18,
      adr: 140.2,
      kast: 70.5,
      matchesPlayed: 87,
    },
    rank: 12,
    rankChange: 2,
  },
];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRankingsData(): UseRankingsDataReturn {
  const [orgRankings, setOrgRankings] = useState<Organization[]>(MOCK_ORGANIZATIONS);
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>(MOCK_TEAMS);
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>(MOCK_PLAYERS);
  const [loading, setLoading] = useState({
    organizations: false,
    teams: false,
    players: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Simulate API delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchOrgRankings = useCallback(async (filters?: RankingsFilters) => {
    setLoading(prev => ({ ...prev, organizations: true }));
    setError(null);

    try {
      // Simulate API call
      await delay(500);

      let data = [...MOCK_ORGANIZATIONS];

      // Apply filters
      if (filters?.region) {
        data = data.filter(org => org.region === filters.region);
      }
      if (filters?.tier) {
        data = data.filter(org => org.stats.investmentTier === filters.tier);
      }

      setOrgRankings(data);
    } catch (err) {
      setError('Failed to fetch organization rankings');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, organizations: false }));
    }
  }, []);

  const fetchTeamRankings = useCallback(async (filters?: RankingsFilters) => {
    setLoading(prev => ({ ...prev, teams: true }));
    setError(null);

    try {
      await delay(500);

      let data = [...MOCK_TEAMS];

      if (filters?.region) {
        data = data.filter(team => team.region === filters.region);
      }
      if (filters?.tier) {
        data = data.filter(team => team.tier === filters.tier);
      }

      setTeamRankings(data);
    } catch (err) {
      setError('Failed to fetch team rankings');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, teams: false }));
    }
  }, []);

  const fetchPlayerRankings = useCallback(async (filters?: RankingsFilters) => {
    setLoading(prev => ({ ...prev, players: true }));
    setError(null);

    try {
      await delay(600);

      let data = [...MOCK_PLAYERS];

      if (filters?.region) {
        data = data.filter(player => player.region === filters.region);
      }
      if (filters?.role) {
        data = data.filter(player => player.role === filters.role);
      }

      setPlayerRankings(data);
    } catch (err) {
      setError('Failed to fetch player rankings');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, players: false }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchOrgRankings(),
      fetchTeamRankings(),
      fetchPlayerRankings(),
    ]);
  }, [fetchOrgRankings, fetchTeamRankings, fetchPlayerRankings]);

  return {
    orgRankings,
    teamRankings,
    playerRankings,
    loading,
    error,
    fetchOrgRankings,
    fetchTeamRankings,
    fetchPlayerRankings,
    refreshAll,
  };
}

export default useRankingsData;
