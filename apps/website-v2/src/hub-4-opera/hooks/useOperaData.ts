/**
 * useOperaData Hook
 * Data fetching and management for OPERA Hub visualization
 * [Ver003.000] - Converted to TypeScript
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';
import type {
  MapData,
  MapListItem,
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

// Mock map data - in production, this would come from an API
const MOCK_MAP_DATA: Record<string, MapData> = {
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    game: 'Valorant',
    size: { width: 100, height: 100 },
    sites: [
      { id: 'a', name: 'A Site', x: 35, y: 30, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 65, y: 70, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 50, y: 90 },
      defender: { x: 50, y: 10 },
    },
    callouts: [
      { id: 'tree', name: 'Tree', x: 25, y: 40 },
      { id: 'market', name: 'Market', x: 75, y: 60 },
      { id: 'mid', name: 'Mid', x: 50, y: 50 },
      { id: 'link', name: 'Link', x: 60, y: 40 },
      { id: 'main', name: 'A Main', x: 15, y: 25 },
      { id: 'window', name: 'Window', x: 45, y: 35 },
    ],
    heatmap: [
      { x: 35, y: 30, intensity: 0.9 },
      { x: 65, y: 70, intensity: 0.85 },
      { x: 50, y: 50, intensity: 0.7 },
    ],
    stats: {
      avgControlTime: '2:34',
      rotationSpeed: 14.2,
      peakZones: 7,
      sightCoverage: 73,
    },
  },
  bind: {
    id: 'bind',
    name: 'Bind',
    game: 'Valorant',
    size: { width: 120, height: 80 },
    sites: [
      { id: 'a', name: 'A Site', x: 25, y: 50, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 75, y: 50, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 15, y: 50 },
      defender: { x: 85, y: 50 },
    },
    callouts: [
      { id: 'hookah', name: 'Hookah', x: 50, y: 70 },
      { id: 'showers', name: 'Showers', x: 50, y: 30 },
      { id: 'short', name: 'Short', x: 35, y: 40 },
      { id: 'long', name: 'Long', x: 35, y: 60 },
    ],
    heatmap: [
      { x: 25, y: 50, intensity: 0.88 },
      { x: 75, y: 50, intensity: 0.82 },
    ],
    stats: {
      avgControlTime: '2:18',
      rotationSpeed: 12.5,
      peakZones: 6,
      sightCoverage: 68,
    },
  },
  haven: {
    id: 'haven',
    name: 'Haven',
    game: 'Valorant',
    size: { width: 100, height: 100 },
    sites: [
      { id: 'a', name: 'A Site', x: 25, y: 25, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 75, y: 25, type: 'bombsite' },
      { id: 'c', name: 'C Site', x: 50, y: 75, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 50, y: 90 },
      defender: { x: 50, y: 10 },
    },
    callouts: [
      { id: 'short', name: 'A Short', x: 35, y: 20 },
      { id: 'long', name: 'A Long', x: 15, y: 30 },
      { id: 'window', name: 'Window', x: 50, y: 40 },
      { id: 'garage', name: 'Garage', x: 65, y: 35 },
    ],
    heatmap: [
      { x: 25, y: 25, intensity: 0.75 },
      { x: 75, y: 25, intensity: 0.72 },
      { x: 50, y: 75, intensity: 0.8 },
    ],
    stats: {
      avgControlTime: '2:45',
      rotationSpeed: 16.8,
      peakZones: 9,
      sightCoverage: 65,
    },
  },
  split: {
    id: 'split',
    name: 'Split',
    game: 'Valorant',
    size: { width: 80, height: 120 },
    sites: [
      { id: 'a', name: 'A Site', x: 50, y: 20, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 50, y: 80, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 50, y: 95 },
      defender: { x: 50, y: 5 },
    },
    callouts: [
      { id: 'ramps', name: 'Ramps', x: 20, y: 35 },
      { id: 'sewer', name: 'Sewer', x: 80, y: 65 },
      { id: 'vent', name: 'Vent', x: 35, y: 50 },
      { id: 'heaven', name: 'Heaven', x: 65, y: 20 },
      { id: 'hell', name: 'Hell', x: 65, y: 80 },
    ],
    heatmap: [
      { x: 50, y: 20, intensity: 0.85 },
      { x: 50, y: 80, intensity: 0.83 },
    ],
    stats: {
      avgControlTime: '2:28',
      rotationSpeed: 11.2,
      peakZones: 8,
      sightCoverage: 70,
    },
  },
  lotus: {
    id: 'lotus',
    name: 'Lotus',
    game: 'Valorant',
    size: { width: 100, height: 100 },
    sites: [
      { id: 'a', name: 'A Site', x: 20, y: 50, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 50, y: 20, type: 'bombsite' },
      { id: 'c', name: 'C Site', x: 80, y: 50, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 50, y: 85 },
      defender: { x: 50, y: 15 },
    },
    callouts: [
      { id: 'door', name: 'A Door', x: 35, y: 50 },
      { id: 'main', name: 'A Main', x: 10, y: 50 },
      { id: 'drop', name: 'Drop', x: 50, y: 50 },
      { id: 'wall', name: 'C Wall', x: 65, y: 50 },
    ],
    heatmap: [
      { x: 20, y: 50, intensity: 0.78 },
      { x: 50, y: 20, intensity: 0.8 },
      { x: 80, y: 50, intensity: 0.76 },
    ],
    stats: {
      avgControlTime: '2:52',
      rotationSpeed: 18.5,
      peakZones: 10,
      sightCoverage: 62,
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    game: 'Valorant',
    size: { width: 110, height: 90 },
    sites: [
      { id: 'a', name: 'A Site', x: 25, y: 50, type: 'bombsite' },
      { id: 'b', name: 'B Site', x: 75, y: 50, type: 'bombsite' },
    ],
    spawns: {
      attacker: { x: 10, y: 50 },
      defender: { x: 90, y: 50 },
    },
    callouts: [
      { id: 'elbow', name: 'Elbow', x: 40, y: 40 },
      { id: 'market', name: 'Market', x: 50, y: 60 },
      { id: ' CT', name: 'CT', x: 80, y: 50 },
      { id: 'mid', name: 'Mid', x: 50, y: 50 },
    ],
    heatmap: [
      { x: 25, y: 50, intensity: 0.82 },
      { x: 75, y: 50, intensity: 0.8 },
    ],
    stats: {
      avgControlTime: '2:22',
      rotationSpeed: 13.8,
      peakZones: 6,
      sightCoverage: 75,
    },
  },
};

// Map list for reference
const MAP_LIST: MapListItem[] = Object.values(MOCK_MAP_DATA).map((map) => ({
  id: map.id,
  name: map.name,
  game: map.game,
}));

/**
 * useOperaData - Custom hook for OPERA hub data management
 * @param mapId - The ID of the map to load
 * @returns Map data, loading state, and error
 */
function useOperaData(mapId: string = 'ascent'): UseOperaDataReturn {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapList, setMapList] = useState<MapListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Refs for cache management
  const cacheRef = useRef<Record<string, CacheEntry<unknown>>>({});

  /**
   * Check if cached entry is valid (not expired)
   */
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = cacheRef.current[cacheKey];
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, []);

  /**
   * Fetch map list with caching
   */
  const fetchMapList = useCallback(
    async (forceRefresh: boolean = false): Promise<MapListItem[]> => {
      const cacheKey = 'opera_map_list';

      // Check cache
      if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = cacheRef.current[cacheKey] as CacheEntry<MapListItem[]>;
        setMapList(cached.data);
        return cached.data;
      }

      try {
        // Simulate API call with delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        const data = MAP_LIST;

        // Cache the result
        cacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now(),
        };

        setMapList(data);
        return data;
      } catch (err) {
        logger.error('OPERA Map List Error:', err);
        throw err;
      }
    },
    [isCacheValid]
  );

  /**
   * Fetch individual map data with TTL caching
   */
  const fetchMapData = useCallback(
    async (id: string, forceRefresh: boolean = false): Promise<MapData | undefined> => {
      const cacheKey = `opera_map_${id}`;

      // Check cache with TTL validation
      if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = cacheRef.current[cacheKey] as CacheEntry<MapData>;
        setMapData(cached.data);
        setLoading(false);
        return cached.data;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate API call with delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Get mock data
        const data = MOCK_MAP_DATA[id];

        if (!data) {
          throw new Error(`Map data not found for: ${id}`);
        }

        // Cache the result with timestamp
        cacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now(),
        };

        setMapData(data);
        setLastUpdated(Date.now());
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        logger.error('OPERA Data Error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isCacheValid]
  );

  // Fetch data when mapId changes
  useEffect(() => {
    fetchMapData(mapId);
  }, [mapId, fetchMapData]);

  // Fetch map list on mount
  useEffect(() => {
    fetchMapList();
  }, [fetchMapList]);

  /**
   * Refresh function to reload data (force cache invalidation)
   */
  const refresh = useCallback(() => {
    return fetchMapData(mapId, true);
  }, [mapId, fetchMapData]);

  /**
   * Refresh all data including map list
   */
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMapList(true), fetchMapData(mapId, true)]);
      setLastUpdated(Date.now());
    } catch {
      // Error already handled in individual fetch functions
    } finally {
      setLoading(false);
    }
  }, [fetchMapList, fetchMapData, mapId]);

  /**
   * Invalidate specific map cache
   */
  const invalidateMapCache = useCallback(
    (id: string = mapId) => {
      delete cacheRef.current[`opera_map_${id}`];
    },
    [mapId]
  );

  /**
   * Invalidate all OPERA cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    setMapData(null);
    setMapList([]);
    setLastUpdated(null);
  }, []);

  /**
   * Preload map data into cache
   */
  const preloadMap = useCallback(
    async (id: string): Promise<MapData | undefined> => {
      const cacheKey = `opera_map_${id}`;
      if (isCacheValid(cacheKey)) {
        const cached = cacheRef.current[cacheKey] as CacheEntry<MapData>;
        return cached.data;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const data = MOCK_MAP_DATA[id];
        if (data) {
          cacheRef.current[cacheKey] = {
            data,
            timestamp: Date.now(),
          };
        }
        return data;
      } catch (err) {
        logger.error('OPERA Preload Error:', err);
        return undefined;
      }
    },
    [isCacheValid]
  );

  // Get heatmap data for visualization
  const getHeatmapData = useCallback(() => {
    return mapData?.heatmap ?? [];
  }, [mapData]);

  // Get callout by ID
  const getCallout = useCallback(
    (calloutId: string) => {
      return mapData?.callouts?.find((c) => c.id === calloutId) ?? null;
    },
    [mapData]
  );

  // Get site data
  const getSite = useCallback(
    (siteId: string) => {
      return mapData?.sites?.find((s) => s.id === siteId) ?? null;
    },
    [mapData]
  );

  // Convert map coordinates to screen coordinates
  const mapToScreen = useCallback(
    (mapX: number, mapY: number, canvasWidth: number, canvasHeight: number) => {
      if (!mapData?.size) return { x: 0, y: 0 };

      const scaleX = canvasWidth / mapData.size.width;
      const scaleY = canvasHeight / mapData.size.height;

      return {
        x: mapX * scaleX,
        y: mapY * scaleY,
      };
    },
    [mapData]
  );

  // Convert screen coordinates to map coordinates
  const screenToMap = useCallback(
    (screenX: number, screenY: number, canvasWidth: number, canvasHeight: number) => {
      if (!mapData?.size) return { x: 0, y: 0 };

      const scaleX = mapData.size.width / canvasWidth;
      const scaleY = mapData.size.height / canvasHeight;

      return {
        x: screenX * scaleX,
        y: screenY * scaleY,
      };
    },
    [mapData]
  );

  return {
    mapData,
    mapList,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshAll,
    invalidateMapCache,
    clearCache,
    preloadMap,
    getHeatmapData,
    getCallout,
    getSite,
    mapToScreen,
    screenToMap,
    // Theme colors
    theme: PURPLE,
  };
}

export default useOperaData;
