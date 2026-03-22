/**
 * useSatorData Hook
 * Data fetching hook for SATOR Hub with Pandascore API integration
 * 
 * [Ver003.000] - Added virtual scrolling support with large dataset generation
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import {
  pandascoreApi,
  fetchSatorPlayers,
  getPlatformStats,
  isPandascoreAvailable,
} from '@/api/pandascore';

// Test dataset sizes for performance testing
export const TEST_DATASET_SIZES = {
  SMALL: 100,
  MEDIUM: 500,
  LARGE: 1000,
  XLARGE: 5000,
};

// Player name pool for generating mock data
const PLAYER_NAMES = [
  'TenZ', 'aspas', 'yay', 'ScreaM', 'Derke', 'Alfajer', 'Boaster', 'Chronicle',
  'Leo', 'Sayf', 'Redgar', 'nAts', 'cNed', 'zeek', 'Soulcas', 'Kiles',
  'Mixwell', 'Shao', 'Zyppan', 'Suygetsu', 'Ardiis', 'Crashies', 'FNS', 'Victor',
  'Marved', 'yay', 'Leaf', 'Vanity', 'Xeta', 'Autumn', 'Sike', 'Effys',
  'Boostio', 'Bdog', 'Asuna', 'Cryocells', 'Ethan', 'Demon1', 'Jawgemo', 'Boostio',
  'F0rsakeN', 'Jinggg', 'Mindfreak', 'Something', 'Benkai', 'Deryeon', 'Lenne', 'Retla',
  'Medusa', 'BORKUM', 'Dispenser', 'JessieVash', 'Khaled', 'Paradox', 'Pengg', 'Wild0reoo',
  'NagZ', 'Klaus', 'DaveeyS', 'Melser', 'Tacolilla', 'Adverso', 'Shyy', 'Nozwerr',
  'Heat', 'TxoziN', 'Mazin', 'Qck', 'Less', 'Saadhak', 'Sato', 'Pancada',
  'Tuyz', 'Cauanzin', 'Nozwerr', 'Khalil', 'Takk', 'Frz', 'Kon4n', 'Nyang',
  'Artzin', 'Dgzin', 'Mwzera', 'Rglmeister', 'Ptc', 'Splendiferous', 'Primmie', 'JcVash'
];

const TEAMS = [
  'Sentinels', 'Leviatán', 'Disguised', 'Karmine Corp', 'FNATIC', 'NAVI', 'Team Liquid',
  'Paper Rex', 'DRX', 'Gen.G', 'T1', 'ZETA DIVISION', 'Rex Regum Qeon', 'BLEED',
  'Evil Geniuses', 'Cloud9', 'LOUD', 'NRG', 'G2 Esports', '100 Thieves', 'FaZe Clan',
  'Version1', 'Shopify Rebellion', 'Moist Moguls', 'Talon Esports', 'Global Esports',
  'Team Secret', 'MIBR', 'Furia', 'Vivo Keyd', 'Liberty', 'Fluxo', 'Oxygen Esports'
];

const NATIONALITIES = ['US', 'CA', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'EU', 'UK', 'FR', 'DE', 'ES', 'PT', 'IT', 'PL', 'RU', 'UA', 'TR', 'KR', 'JP', 'CN', 'TW', 'TH', 'SG', 'ID', 'PH', 'VN', 'AU', 'NZ'];

/**
 * Generate mock players for performance testing
 * @param {number} count - Number of players to generate
 * @returns {Array} Array of mock player objects
 */
export function generateMockPlayers(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const name = PLAYER_NAMES[index % PLAYER_NAMES.length] + (index >= PLAYER_NAMES.length ? ` ${Math.floor(index / PLAYER_NAMES.length) + 1}` : '');
    const team = TEAMS[index % TEAMS.length];
    const nationality = NATIONALITIES[index % NATIONALITIES.length];
    
    // Generate realistic stats with some randomness
    const baseRating = 0.8 + Math.random() * 0.6; // 0.8 - 1.4
    const baseACS = 180 + Math.random() * 120; // 180 - 300
    const baseWinRate = 40 + Math.random() * 40; // 40% - 80%
    
    return {
      id: `player-${index + 1}`,
      name,
      team,
      nationality,
      rating: parseFloat(baseRating.toFixed(2)),
      acs: Math.round(baseACS),
      kda: (0.8 + Math.random() * 0.8).toFixed(2),
      winRate: parseFloat(baseWinRate.toFixed(1)),
      avatar: null,
    };
  });
}

// Default mock player data for fallback (small set)
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
 * @param {Object} options - Hook options
 * @param {number} options.testDatasetSize - Size of mock dataset for testing (default: 6)
 * @returns {Object} - Data and state for SATOR hub
 * @returns {Array} return.stats - Platform statistics
 * @returns {Array} return.players - Top player data
 * @returns {boolean} return.isLoading - Loading state
 * @returns {string|null} return.error - Error message if any
 * @returns {Function} return.refresh - Function to refresh data
 * @returns {boolean} return.isUsingMockData - Whether currently using mock data
 * @returns {Function} return.generateTestData - Generate test dataset of specified size
 */
export function useSatorData(options = {}) {
  const { testDatasetSize = null } = options;
  
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Generate test data function
  const generateTestData = useCallback((size) => {
    const mockPlayers = generateMockPlayers(size);
    setPlayers(mockPlayers);
    setIsUsingMockData(true);
    setError(null);
    satorLogger.info(`Generated test dataset with ${size} players`);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsUsingMockData(false);

    try {
      // Check if test dataset size is specified (for performance testing)
      if (testDatasetSize && testDatasetSize > 0) {
        satorLogger.info(`Generating test dataset with ${testDatasetSize} players`);
        setIsUsingMockData(true);
        setStats(MOCK_STATS);
        setPlayers(generateMockPlayers(testDatasetSize));
        setIsLoading(false);
        return;
      }

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
    generateTestData,
  };
}

export default useSatorData;
