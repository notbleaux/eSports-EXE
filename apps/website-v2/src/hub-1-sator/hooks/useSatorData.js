/**
 * useSatorData Hook
 * Data fetching hook for SATOR Hub
 * 
 * [Ver001.000]
 */
import { useState, useEffect } from 'react';

// Mock player data for demonstration
const MOCK_PLAYERS = [
  {
    id: '1',
    name: 'TenZ',
    team: 'Sentinels',
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
    rating: 1.15,
    acs: 241.8,
    kda: '1.28',
    winRate: 58.9,
    avatar: null,
  },
];

const MOCK_STATS = [
  { value: 2847, label: 'Teams', trend: 'up' },
  { value: 156, label: 'Matches', trend: 'neutral' },
  { value: 12847, label: 'Players', trend: 'up' },
  { value: 48, label: 'Tournaments', trend: 'up' },
  { value: 2400000, label: 'Records', trend: 'up' },
  { value: 99.9, label: 'Uptime %', trend: 'neutral' },
];

/**
 * useSatorData - Custom hook for fetching SATOR hub data
 * 
 * @returns {Object} - Data and state for SATOR hub
 * @returns {Array} return.stats - Platform statistics
 * @returns {Array} return.players - Top player data
 * @returns {boolean} return.isLoading - Loading state
 * @returns {string|null} return.error - Error message if any
 * @returns {Function} return.refresh - Function to refresh data
 */
export function useSatorData() {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real implementation, this would fetch from the API:
      // const response = await fetch('/api/sator/stats');
      // const data = await response.json();
      
      // For now, use mock data
      setStats(MOCK_STATS);
      setPlayers(MOCK_PLAYERS);
    } catch (err) {
      setError(err.message || 'Failed to fetch SATOR data');
      console.error('SATOR data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = () => {
    fetchData();
  };

  return {
    stats,
    players,
    isLoading,
    error,
    refresh,
  };
}

export default useSatorData;
