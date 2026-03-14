/**
 * useSatorData Hook
 * Data fetching hook for SATOR Hub with Pandascore API integration
 * 
 * [Ver002.000] - Integrated Pandascore API with caching and fallback
 */
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  pandascoreApi,
  fetchSatorPlayers,
  getPlatformStats,
  isPandascoreAvailable,
} from '@/api/pandascore';

// Mock player data for fallback
const MOCK_PLAYERS = [
  {
    id: '1',
    name: 'TenZ',
    team: 'Sentinels',
    nationality: 'CA',
    rating: 1.25,
    acs: 265.4,
    kda: '1.45',
    winRate: 68.5,
    avatar: null,
  },
  {
    id: '2',
    name: 'aspas',
    team: 'Leviatán',
    nationality: 'BR',
    rating: 1.22,
    acs: 258.7,
    kda: '1.38',
    winRate: 72.3,
    avatar: null,
  },
  {
    id: '3',
    name: 'yay',
    team: 'Disguised',
    nationality: 'US',
    rating: 1.18,
    acs: 249.2,
    kda: '1.32',
    winRate: 61.2,
    avatar: null,
  },
  {
    id: '4',
    name: 'ScreaM',
    team: 'Karmine Corp',
    nationality: 'BE',
    rating: 1.15,
    acs: 241.8,
    kda: '1.28',
    winRate: 58.9,
    avatar: null,
  },
  {
    id: '5',
    name: 'Derke',
    team: 'FNATIC',
    nationality: 'FI',
    rating: 1.20,
    acs: 252.3,
    kda: '1.35',
    winRate: 70.1,
    avatar: null,
  },
  {
    id: '6',
    name: 'Alfajer',
    team: 'FNATIC',
    nationality: 'TR',
    rating: 1.17,
    acs: 245.6,
    kda: '1.30',
    winRate: 68.8,
    avatar: null,
  },
];

// Mock stats for fallback
const MOCK_STATS = [
  { value: 2847, label: 'Teams', trend: 'up' },
  { value: 156, label: 'Matches', trend: 'neutral' },
  { value: 12847, label: 'Players', trend: 'up' },
  { value: 48, label: 'Tournaments', trend: 'up' },
  { value: 2400000, label: 'Records', trend: 'up' },
  { value: 99.9, label: 'Uptime %', trend: 'neutral' },
];

const satorLogger = logger.child('useSatorData');

/**
 * useSatorData - Custom hook for fetching SATOR hub data
 * Attempts to fetch from Pandascore API, falls back to mock data on failure
 * 
 * @returns {Object} - Data and state for SATOR hub
 * @returns {Array} return.stats - Platform statistics
 * @returns {Array} return.players - Top player data
 * @returns {boolean} return.isLoading - Loading state
 * @returns {string|null} return.error - Error message if any
 * @returns {Function} return.refresh - Function to refresh data
 * @returns {boolean} return.isUsingMockData - Whether currently using mock data
 */
export function useSatorData() {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsUsingMockData(false);

    try {
      // Check if Pandascore API is available
      if (!isPandascoreAvailable()) {
        satorLogger.warn('Pandascore API token not configured, using mock data');
        setIsUsingMockData(true);
        setStats(MOCK_STATS);
        setPlayers(MOCK_PLAYERS);
        return;
      }

      // Fetch real data from Pandascore API
      const [platformStats, topPlayers] = await Promise.all([
        getPlatformStats().catch(err => {
          satorLogger.error('Failed to fetch platform stats:', err);
          return null;
        }),
        fetchSatorPlayers(10).catch(err => {
          satorLogger.error('Failed to fetch players:', err);
          return null;
        }),
      ]);

      // Use real data if available, otherwise fallback to mock
      if (platformStats && platformStats.length > 0) {
        setStats(platformStats);
      } else {
        satorLogger.warn('Platform stats empty, using mock stats');
        setStats(MOCK_STATS);
        setIsUsingMockData(true);
      }

      if (topPlayers && topPlayers.length > 0) {
        setPlayers(topPlayers);
      } else {
        satorLogger.warn('Players data empty, using mock players');
        setPlayers(MOCK_PLAYERS);
        setIsUsingMockData(true);
      }

      satorLogger.info('SATOR data fetched successfully', {
        statsCount: platformStats?.length || MOCK_STATS.length,
        playersCount: topPlayers?.length || MOCK_PLAYERS.length,
        usingMock: !platformStats || !topPlayers || topPlayers.length === 0,
      });
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch SATOR data';
      satorLogger.error('SATOR data fetch error:', err);
      
      setError(errorMessage);
      setIsUsingMockData(true);
      
      // Fallback to mock data on error
      setStats(MOCK_STATS);
      setPlayers(MOCK_PLAYERS);
      
      satorLogger.info('Fallback to mock data due to error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    // Clear cache before refreshing
    pandascoreApi.clearCache();
    fetchData();
  }, [fetchData]);

  return {
    stats,
    players,
    isLoading,
    error,
    refresh,
    isUsingMockData,
  };
}

export default useSatorData;
