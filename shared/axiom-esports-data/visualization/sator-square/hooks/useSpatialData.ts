/**
 * useSpatialData — Hook for fetching and transforming spatial event data
 * for all five SATOR Square layers.
 * 
 * Returns { data, loading, error } pattern for consistent error handling
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from './fetchWithRetry';

export interface SpatialDataState {
  satorEvents: SatorEventData[];
  arepoMarkers: ArepoMarkerData[];
  rotasTrails: RotasTrailData[];
  controlZones: ControlZoneData[];
  visibilityMask: Float32Array | null;
  loading: boolean;
  error: string | null;
}

export interface SatorEventData {
  playerId: string;
  mapX: number;
  mapY: number;
  eventType: 'plant' | 'mvp' | 'hotstreak' | 'ace';
  intensity: number;
}

export interface ArepoMarkerData {
  x: number;
  y: number;
  victimTeam: 'attack' | 'defense';
  isMultikill: boolean;
  multikillCount: number;
  isClutch: boolean;
  roundNumber: number;
  age: number;
}

export interface RotasTrailData {
  playerId: string;
  team: 'attack' | 'defense';
  positions: Array<{ x: number; y: number; tick: number }>;
  directionLR: -1 | 0 | 1;
}

export interface ControlZoneData {
  id: string;
  polygon: Array<[number, number]>;
  controlTeam: 'attack' | 'defense' | 'contested';
  grade: 'A' | 'B' | 'C' | 'D';
  controlStrength: number;
}

const EMPTY_MASK = new Float32Array(0);

// Validation schemas
const SatorEventSchema = {
  validate(data: unknown): data is SatorEventData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.playerId === 'string' &&
      typeof d.mapX === 'number' &&
      typeof d.mapY === 'number' &&
      ['plant', 'mvp', 'hotstreak', 'ace'].includes(d.eventType as string) &&
      typeof d.intensity === 'number'
    );
  }
};

const ArepoMarkerSchema = {
  validate(data: unknown): data is ArepoMarkerData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.x === 'number' &&
      typeof d.y === 'number' &&
      ['attack', 'defense'].includes(d.victimTeam as string) &&
      typeof d.isMultikill === 'boolean' &&
      typeof d.multikillCount === 'number' &&
      typeof d.isClutch === 'boolean' &&
      typeof d.roundNumber === 'number' &&
      typeof d.age === 'number'
    );
  }
};

const RotasTrailSchema = {
  validate(data: unknown): data is RotasTrailData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.playerId === 'string' &&
      ['attack', 'defense'].includes(d.team as string) &&
      Array.isArray(d.positions) &&
      d.positions.every((p: unknown) =>
        p && typeof p === 'object' &&
        typeof (p as Record<string, unknown>).x === 'number' &&
        typeof (p as Record<string, unknown>).y === 'number' &&
        typeof (p as Record<string, unknown>).tick === 'number'
      ) &&
      [-1, 0, 1].includes(d.directionLR as number)
    );
  }
};

/**
 * Fetch and validate spatial data with retry logic
 */
async function fetchSpatialDataWithRetry<T>(
  url: string,
  validator: { validate: (data: unknown) => data is T }
): Promise<T[]> {
  const data = await fetchWithRetry<unknown[]>(url, {}, 3);

  // Validate each item, filter invalid ones
  const validated = data.filter((item: unknown) => {
    const isValid = validator.validate(item);
    if (!isValid) {
      console.warn('[useSpatialData] Invalid data item:', item);
    }
    return isValid;
  });

  return validated;
}

export function useSpatialData(matchId: string, roundNumber: number): SpatialDataState {
  const [state, setState] = useState<SpatialDataState>({
    satorEvents: [],
    arepoMarkers: [],
    rotasTrails: [],
    controlZones: [],
    visibilityMask: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!matchId) {
      setState({
        satorEvents: [],
        arepoMarkers: [],
        rotasTrails: [],
        controlZones: [],
        visibilityMask: null,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Use Promise.allSettled for partial success handling with retry
      const results = await Promise.allSettled([
        fetchSpatialDataWithRetry(
          `/api/matches/${encodeURIComponent(matchId)}/rounds/${roundNumber}/sator-events`,
          SatorEventSchema
        ),
        fetchSpatialDataWithRetry(
          `/api/matches/${encodeURIComponent(matchId)}/rounds/${roundNumber}/arepo-markers`,
          ArepoMarkerSchema
        ),
        fetchSpatialDataWithRetry(
          `/api/matches/${encodeURIComponent(matchId)}/rounds/${roundNumber}/rotas-trails`,
          RotasTrailSchema
        ),
      ]);

      const [satorResult, arepoResult, rotasResult] = results;

      // Handle partial failures
      const satorEvents = satorResult.status === 'fulfilled' ? satorResult.value : [];
      const arepoMarkers = arepoResult.status === 'fulfilled' ? arepoResult.value : [];
      const rotasTrails = rotasResult.status === 'fulfilled' ? rotasResult.value : [];

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[useSpatialData] API ${index} failed:`, result.reason);
        }
      });

      // If all failed, throw error
      if (results.every(r => r.status === 'rejected')) {
        throw new Error('All data sources failed');
      }

      setState({
        satorEvents,
        arepoMarkers,
        rotasTrails,
        controlZones: [],
        visibilityMask: EMPTY_MASK,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch spatial data';
      console.error('[useSpatialData] Fetch error:', errorMessage);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [matchId, roundNumber]);

  useEffect(() => {
    // Debounce to prevent rapid API calls
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData]);

  return state;
}

export default useSpatialData;
