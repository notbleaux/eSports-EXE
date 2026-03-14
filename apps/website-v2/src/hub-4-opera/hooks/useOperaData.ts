/**
 * useOperaData Hook - eSports Hub
 * Data fetching and management for OPERA Hub with TiDB integration
 * [Ver004.000] - Refactored: Tournament, schedule, patch, and standings data
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';
import type {
  Tournament,
  MatchSchedule,
  Patch,
  CircuitStanding,
  CircuitRegion,
  TournamentFilters,
  CacheEntry,
  PurpleTheme,
  UseOperaDataReturn,
} from '../types';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Purple theme colors (exact values)
const PURPLE: PurpleTheme = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

const operaLogger = logger.child('useOperaData');

// Mock data for development/fallback
const MOCK_TOURNAMENTS: Tournament[] = [
  {
    tournament_id: 1,
    name: 'VCT 2026 Masters Tokyo',
    tier: 'Masters',
    game: 'Valorant',
    region: 'International',
    circuit: 'International',
    organizer: 'Riot Games',
    prize_pool_usd: 1000000,
    start_date: '2026-06-01',
    end_date: '2026-06-14',
    status: 'upcoming',
    season: '2026',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    tournament_id: 2,
    name: 'VCT 2026 Americas Stage 1',
    tier: 'Challenger',
    game: 'Valorant',
    region: 'Americas',
    circuit: 'Americas',
    organizer: 'Riot Games',
    prize_pool_usd: 250000,
    start_date: '2026-02-15',
    end_date: '2026-03-30',
    status: 'ongoing',
    season: '2026',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    tournament_id: 3,
    name: 'VCT 2026 EMEA Stage 1',
    tier: 'Challenger',
    game: 'Valorant',
    region: 'EMEA',
    circuit: 'EMEA',
    organizer: 'Riot Games',
    prize_pool_usd: 250000,
    start_date: '2026-02-15',
    end_date: '2026-03-30',
    status: 'ongoing',
    season: '2026',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    tournament_id: 4,
    name: 'VCT 2026 Pacific Stage 1',
    tier: 'Challenger',
    game: 'Valorant',
    region: 'Pacific',
    circuit: 'Pacific',
    organizer: 'Riot Games',
    prize_pool_usd: 250000,
    start_date: '2026-02-20',
    end_date: '2026-04-05',
    status: 'upcoming',
    season: '2026',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    tournament_id: 5,
    name: 'VCT 2026 China Stage 1',
    tier: 'Challenger',
    game: 'Valorant',
    region: 'China',
    circuit: 'China',
    organizer: 'Riot Games',
    prize_pool_usd: 250000,
    start_date: '2026-02-25',
    end_date: '2026-04-10',
    status: 'upcoming',
    season: '2026',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const MOCK_SCHEDULES: MatchSchedule[] = [
  {
    schedule_id: 1,
    tournament_id: 2,
    match_id: 'VCT-AM-001',
    round_name: 'Group A',
    stage: 'Groups',
    team_a_id: 1,
    team_b_id: 2,
    team_a_name: 'Sentinels',
    team_b_name: 'Cloud9',
    scheduled_at: '2026-02-15T20:00:00Z',
    stream_url: 'https://twitch.tv/valorant',
    status: 'completed',
    team_a_score: 2,
    team_b_score: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    schedule_id: 2,
    tournament_id: 2,
    match_id: 'VCT-AM-002',
    round_name: 'Group A',
    stage: 'Groups',
    team_a_id: 3,
    team_b_id: 4,
    team_a_name: 'NRG',
    team_b_name: 'G2 Esports',
    scheduled_at: '2026-02-16T20:00:00Z',
    stream_url: 'https://twitch.tv/valorant',
    status: 'live',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    schedule_id: 3,
    tournament_id: 2,
    match_id: 'VCT-AM-003',
    round_name: 'Group B',
    stage: 'Groups',
    team_a_id: 5,
    team_b_id: 6,
    team_a_name: 'Evil Geniuses',
    team_b_name: '100 Thieves',
    scheduled_at: '2026-02-17T20:00:00Z',
    stream_url: 'https://twitch.tv/valorant',
    status: 'scheduled',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const MOCK_PATCHES: Patch[] = [
  {
    patch_id: 1,
    version: '8.11',
    game: 'Valorant',
    patch_type: 'minor',
    release_date: '2026-01-15',
    summary: 'Agent balance updates and bug fixes',
    agent_changes: [
      { agent_name: 'Jett', change_type: 'adjustment', description: 'Dash cooldown increased' },
      { agent_name: 'Sage', change_type: 'buff', description: 'Heal amount increased' },
    ],
    weapon_changes: [
      { weapon_name: 'Vandal', change_type: 'nerf', description: 'First shot accuracy reduced' },
    ],
    is_active_competitive: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    patch_id: 2,
    version: '8.10',
    game: 'Valorant',
    patch_type: 'minor',
    release_date: '2026-01-08',
    summary: 'Map pool updates and competitive changes',
    map_changes: [
      { map_name: 'Lotus', change_type: 'updated', description: 'Site C redesigned' },
    ],
    is_active_competitive: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const MOCK_STANDINGS: CircuitStanding[] = [
  {
    standing_id: 1,
    circuit: 'Americas',
    season: '2026',
    team_id: 1,
    team_name: 'Sentinels',
    team_tag: 'SEN',
    points: 450,
    rank: 1,
    qualification_status: 'qualified_champions',
    wins: 12,
    losses: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    standing_id: 2,
    circuit: 'Americas',
    season: '2026',
    team_id: 2,
    team_name: 'Cloud9',
    team_tag: 'C9',
    points: 380,
    rank: 2,
    qualification_status: 'qualified_champions',
    wins: 10,
    losses: 4,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    standing_id: 3,
    circuit: 'Americas',
    season: '2026',
    team_id: 3,
    team_name: 'NRG',
    team_tag: 'NRG',
    points: 320,
    rank: 3,
    qualification_status: 'qualified_masters',
    wins: 9,
    losses: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

/**
 * useOperaData - Custom hook for OPERA eSports Hub data management
 * Fetches tournaments, schedules, patches, and circuit standings from TiDB
 * 
 * @returns UseOperaDataReturn - Data and state for OPERA hub
 */
function useOperaData(): UseOperaDataReturn {
  // Data states
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null);
  const [standings, setStandings] = useState<CircuitStanding[]>([]);

  // Loading states
  const [loading, setLoading] = useState({
    tournaments: true,
    schedules: false,
    patches: true,
    standings: true,
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Cache management
  const cacheRef = useRef<{
    tournaments?: CacheEntry<Tournament[]>;
    schedules: Record<number, CacheEntry<MatchSchedule[]>>;
    patches?: CacheEntry<Patch[]>;
    standings: Record<string, CacheEntry<CircuitStanding[]>>;
  }>({
    schedules: {},
    standings: {},
  });

  /**
   * Check if cached entry is valid (not expired)
   */
  const isCacheValid = useCallback(<T,>(entry?: CacheEntry<T>): boolean => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  /**
   * Fetch tournaments from TiDB with caching
   */
  const fetchTournaments = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!forceRefresh && isCacheValid(cacheRef.current.tournaments)) {
      setTournaments(cacheRef.current.tournaments!.data);
      setLoading(prev => ({ ...prev, tournaments: false }));
      return;
    }

    setLoading(prev => ({ ...prev, tournaments: true }));
    setError(null);

    try {
      // TODO: Replace with actual TiDB API call
      // const response = await fetch('/api/opera/tournaments');
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = MOCK_TOURNAMENTS;
      
      cacheRef.current.tournaments = {
        data,
        timestamp: Date.now(),
      };
      
      setTournaments(data);
      operaLogger.info(`Fetched ${data.length} tournaments`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tournaments';
      setError(message);
      operaLogger.error('Failed to fetch tournaments:', err);
    } finally {
      setLoading(prev => ({ ...prev, tournaments: false }));
    }
  }, [isCacheValid]);

  /**
   * Fetch schedules for a tournament
   */
  const fetchSchedules = useCallback(async (tournamentId: number, forceRefresh = false): Promise<void> => {
    const cached = cacheRef.current.schedules[tournamentId];
    if (!forceRefresh && isCacheValid(cached)) {
      setSchedules(cached.data);
      setLoading(prev => ({ ...prev, schedules: false }));
      return;
    }

    setLoading(prev => ({ ...prev, schedules: true }));

    try {
      // TODO: Replace with actual TiDB API call
      // const response = await fetch(`/api/opera/schedules?tournament_id=${tournamentId}`);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const data = MOCK_SCHEDULES.filter(s => s.tournament_id === tournamentId);
      
      cacheRef.current.schedules[tournamentId] = {
        data,
        timestamp: Date.now(),
      };
      
      setSchedules(data);
    } catch (err) {
      operaLogger.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(prev => ({ ...prev, schedules: false }));
    }
  }, [isCacheValid]);

  /**
   * Fetch patches from TiDB
   */
  const fetchPatches = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!forceRefresh && isCacheValid(cacheRef.current.patches)) {
      setPatches(cacheRef.current.patches!.data);
      setLoading(prev => ({ ...prev, patches: false }));
      return;
    }

    setLoading(prev => ({ ...prev, patches: true }));

    try {
      // TODO: Replace with actual TiDB API call
      // const response = await fetch('/api/opera/patches');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const data = MOCK_PATCHES;
      
      cacheRef.current.patches = {
        data,
        timestamp: Date.now(),
      };
      
      setPatches(data);
      operaLogger.info(`Fetched ${data.length} patches`);
    } catch (err) {
      operaLogger.error('Failed to fetch patches:', err);
    } finally {
      setLoading(prev => ({ ...prev, patches: false }));
    }
  }, [isCacheValid]);

  /**
   * Fetch circuit standings
   */
  const fetchStandings = useCallback(async (
    circuit: CircuitRegion,
    season: string,
    forceRefresh = false
  ): Promise<void> => {
    const cacheKey = `${circuit}-${season}`;
    const cached = cacheRef.current.standings[cacheKey];
    
    if (!forceRefresh && isCacheValid(cached)) {
      setStandings(cached.data);
      setLoading(prev => ({ ...prev, standings: false }));
      return;
    }

    setLoading(prev => ({ ...prev, standings: true }));

    try {
      // TODO: Replace with actual TiDB API call
      // const response = await fetch(`/api/opera/standings?circuit=${circuit}&season=${season}`);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const data = MOCK_STANDINGS.filter(s => s.circuit === circuit && s.season === season);
      
      cacheRef.current.standings[cacheKey] = {
        data,
        timestamp: Date.now(),
      };
      
      setStandings(data);
    } catch (err) {
      operaLogger.error('Failed to fetch standings:', err);
    } finally {
      setLoading(prev => ({ ...prev, standings: false }));
    }
  }, [isCacheValid]);

  /**
   * Refresh functions
   */
  const refreshTournaments = useCallback(() => fetchTournaments(true), [fetchTournaments]);
  const refreshSchedules = useCallback((tournamentId: number) => fetchSchedules(tournamentId, true), [fetchSchedules]);
  const refreshPatches = useCallback(() => fetchPatches(true), [fetchPatches]);
  const refreshStandings = useCallback((circuit: CircuitRegion, season: string) => 
    fetchStandings(circuit, season, true), [fetchStandings]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {
      schedules: {},
      standings: {},
    };
    operaLogger.info('Cache cleared');
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTournaments();
    fetchPatches();
    fetchStandings('Americas', '2026');
  }, [fetchTournaments, fetchPatches, fetchStandings]);

  // Fetch schedules when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      fetchSchedules(selectedTournament.tournament_id);
    }
  }, [selectedTournament, fetchSchedules]);

  return {
    tournaments,
    selectedTournament,
    setSelectedTournament,
    schedules,
    patches,
    selectedPatch,
    setSelectedPatch,
    standings,
    loading,
    error,
    refreshTournaments,
    refreshSchedules,
    refreshPatches,
    refreshStandings,
    clearCache,
    theme: PURPLE,
  };
}

export default useOperaData;
