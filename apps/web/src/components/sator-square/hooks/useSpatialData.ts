/**
 * useSpatialData — Hook for fetching and transforming spatial event data
 * for all five SATOR Square layers.
 * 
 * Integration: Connects to eSports-EXE Feature Store API for live match data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// Feature Store API integration
const FEATURE_STORE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SpatialDataState {
  satorEvents: SatorEventData[];
  arepoMarkers: ArepoMarkerData[];
  rotasTrails: RotasTrailData[];
  controlZones: ControlZoneData[];
  visibilityMask: Float32Array | null;
  loading: boolean;
  error: Error | null;
}

export interface SatorEventData {
  playerId: string;
  mapX: number;
  mapY: number;
  eventType: 'plant' | 'mvp' | 'hotstreak' | 'ace' | 'clutch' | 'entry';
  intensity: number;
  timestamp: number;
  roundNumber: number;
}

export interface ArepoMarkerData {
  x: number;
  y: number;
  victimTeam: 'attack' | 'defense';
  victimPlayerId: string;
  killerPlayerId: string;
  isMultikill: boolean;
  multikillCount: number;
  isClutch: boolean;
  isFirstBlood: boolean;
  roundNumber: number;
  age: number; // How long ago (for fade effect)
}

export interface RotasTrailData {
  playerId: string;
  team: 'attack' | 'defense';
  positions: Array<{ x: number; y: number; tick: number; velocity: number }>;
  directionLR: -1 | 0 | 1;
  totalDistance: number;
  avgSpeed: number;
}

export interface ControlZoneData {
  id: string;
  polygon: Array<[number, number]>;
  controlTeam: 'attack' | 'defense' | 'contested';
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  controlStrength: number; // 0-1
  lastContested: number;
}

const EMPTY_MASK = new Float32Array(0);

interface FeatureStoreResponse {
  entity_type: string;
  entity_id: string;
  feature_values: Record<string, any>;
  timestamp: string;
}

/**
 * Fetch spatial data from Feature Store API
 */
async function fetchSpatialFeatures(matchId?: string): Promise<SpatialDataState> {
  if (!matchId) {
    return {
      satorEvents: [],
      arepoMarkers: [],
      rotasTrails: [],
      controlZones: [],
      visibilityMask: EMPTY_MASK,
      loading: false,
      error: null,
    };
  }

  try {
    // Fetch from Feature Store API
    const response = await fetch(
      `${FEATURE_STORE_API}/v1/features/match/${matchId}/spatial`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Fallback to mock data if API not available
      console.warn('Feature Store API unavailable, using fallback data');
      return generateMockData();
    }

    const features: FeatureStoreResponse = await response.json();
    
    // Transform Feature Store data to SATOR Square format
    return {
      satorEvents: transformSatorEvents(features.feature_values),
      arepoMarkers: transformArepoMarkers(features.feature_values),
      rotasTrails: transformRotasTrails(features.feature_values),
      controlZones: transformControlZones(features.feature_values),
      visibilityMask: generateVisibilityMask(features.feature_values),
      loading: false,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching spatial data:', error);
    return {
      ...generateMockData(),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Data transformation functions
function transformSatorEvents(features: Record<string, any>): SatorEventData[] {
  const events: SatorEventData[] = [];
  
  // Transform high-impact events from features
  if (features.impact_events) {
    events.push(...features.impact_events.map((e: any) => ({
      playerId: e.player_id,
      mapX: e.x,
      mapY: e.y,
      eventType: e.type,
      intensity: e.intensity || 1.0,
      timestamp: e.timestamp,
      roundNumber: e.round || 1,
    })));
  }
  
  return events;
}

function transformArepoMarkers(features: Record<string, any>): ArepoMarkerData[] {
  const markers: ArepoMarkerData[] = [];
  
  if (features.death_events) {
    markers.push(...features.death_events.map((d: any) => ({
      x: d.x,
      y: d.y,
      victimTeam: d.victim_team,
      victimPlayerId: d.victim_id,
      killerPlayerId: d.killer_id,
      isMultikill: d.is_multikill || false,
      multikillCount: d.multikill_count || 1,
      isClutch: d.is_clutch || false,
      isFirstBlood: d.is_first_blood || false,
      roundNumber: d.round || 1,
      age: Date.now() - d.timestamp,
    })));
  }
  
  return markers;
}

function transformRotasTrails(features: Record<string, any>): RotasTrailData[] {
  const trails: RotasTrailData[] = [];
  
  if (features.movement_trails) {
    trails.push(...features.movement_trails.map((t: any) => ({
      playerId: t.player_id,
      team: t.team,
      positions: t.positions,
      directionLR: t.direction_lr,
      totalDistance: t.total_distance,
      avgSpeed: t.avg_speed,
    })));
  }
  
  return trails;
}

function transformControlZones(features: Record<string, any>): ControlZoneData[] {
  const zones: ControlZoneData[] = [];
  
  if (features.control_zones) {
    zones.push(...features.control_zones.map((z: any) => ({
      id: z.id,
      polygon: z.polygon,
      controlTeam: z.control_team,
      grade: z.grade,
      controlStrength: z.strength,
      lastContested: z.last_contested,
    })));
  }
  
  return zones;
}

function generateVisibilityMask(features: Record<string, any>): Float32Array {
  // Generate fog of war mask based on visibility data
  const size = 256; // 256x256 grid
  const mask = new Float32Array(size * size);
  
  if (features.visibility_grid) {
    for (let i = 0; i < size * size; i++) {
      mask[i] = features.visibility_grid[i] || 0;
    }
  }
  
  return mask;
}

// Mock data generator for development/testing
function generateMockData(): SpatialDataState {
  return {
    satorEvents: [
      { playerId: 'player_1', mapX: 0.3, mapY: 0.4, eventType: 'ace', intensity: 1.0, timestamp: Date.now(), roundNumber: 5 },
      { playerId: 'player_2', mapX: 0.7, mapY: 0.6, eventType: 'clutch', intensity: 0.9, timestamp: Date.now() - 1000, roundNumber: 8 },
    ],
    arepoMarkers: [
      { x: 0.5, y: 0.5, victimTeam: 'attack', victimPlayerId: 'p1', killerPlayerId: 'p2', isMultikill: false, multikillCount: 1, isClutch: false, isFirstBlood: true, roundNumber: 1, age: 5000 },
      { x: 0.3, y: 0.7, victimTeam: 'defense', victimPlayerId: 'p3', killerPlayerId: 'p1', isMultikill: true, multikillCount: 3, isClutch: false, isFirstBlood: false, roundNumber: 3, age: 3000 },
    ],
    rotasTrails: [
      { playerId: 'player_1', team: 'attack', positions: [{ x: 0.1, y: 0.1, tick: 0, velocity: 1.0 }, { x: 0.5, y: 0.5, tick: 100, velocity: 1.2 }], directionLR: 1, totalDistance: 100, avgSpeed: 1.1 },
    ],
    controlZones: [
      { id: 'site_a', polygon: [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6]], controlTeam: 'attack', grade: 'B', controlStrength: 0.75, lastContested: Date.now() - 5000 },
      { id: 'site_b', polygon: [[0.7, 0.2], [0.9, 0.2], [0.9, 0.4], [0.7, 0.4]], controlTeam: 'defense', grade: 'A', controlStrength: 0.9, lastContested: Date.now() - 10000 },
    ],
    visibilityMask: EMPTY_MASK,
    loading: false,
    error: null,
  };
}

// React Query hook for modern data fetching
export function useSpatialDataQuery(matchId?: string) {
  return useQuery({
    queryKey: ['spatialData', matchId],
    queryFn: () => fetchSpatialFeatures(matchId),
    enabled: !!matchId,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000,
  });
}

// Legacy hook for backward compatibility
export function useSpatialData(matchId?: string, roundNumber?: number): SpatialDataState {
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
    if (!matchId) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchSpatialFeatures(matchId);
      setState(data);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, [matchId, roundNumber]);

  useEffect(() => {
    fetchData();
    
    // Poll for updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return state;
}

export default useSpatialData;
