/**
 * Cross-Reference API Client - AREPO Hub Cross-Reference Engine
 * Connects SATOR (Component B) and OPERA (Component D) data
 * 
 * [Ver001.000]
 */

import { api } from './client'
import type { ApiResponse } from './types'

// ============================================================================
// TYPES
// ============================================================================

export type DataSource = 'sator' | 'opera' | 'rotas' | 'combined'

export interface CrossHubQueryResult {
  sator_data?: Record<string, unknown>
  opera_metadata?: Record<string, unknown>
  rotas_analytics?: Record<string, unknown>
  query_time_ms: number
  data_sources: DataSource[]
}

export interface PlayerTournamentPerformance {
  player_id: string
  player_name: string
  tournament_id: string
  tournament_name: string
  // SATOR data
  performance: {
    matches_played: number
    avg_acs: number
    avg_adr: number
    avg_kast: number
    kdr: number
    avg_sim_rating: number
    peak_performance: number
    consistency_score: number
  }
  // OPERA metadata
  tournament_context: {
    circuit: string
    season: string
    region: string
    start_date: string
    end_date: string
    status: string
    prize_pool?: number
  }
  // Cross-reference analytics
  tournament_ranking: number
  performance_trend: 'improving' | 'stable' | 'declining'
  comparison_to_average: number // percentage above/below tournament average
}

export interface PatchPerformanceImpact {
  patch_version: string
  patch_date: string
  agent_name: string
  // OPERA patch data
  patch_changes: {
    buffs: string[]
    nerfs: string[]
    adjustments: string[]
  }
  // SATOR before/after data
  before_patch: {
    matches: number
    pick_rate: number
    win_rate: number
    avg_acs: number
    avg_adr: number
  }
  after_patch: {
    matches: number
    pick_rate: number
    win_rate: number
    avg_acs: number
    avg_adr: number
  }
  // Impact analysis
  impact_score: number // -10 to +10
  impact_category: 'major_buff' | 'minor_buff' | 'neutral' | 'minor_nerf' | 'major_nerf'
  win_rate_delta: number
  pick_rate_delta: number
  acs_delta: number
}

export interface TeamComparisonResult {
  team_a: {
    id: string
    name: string
    region: string
  }
  team_b: {
    id: string
    name: string
    region: string
  }
  tournaments: string[]
  // SATOR stats comparison
  stats_comparison: {
    matches_played: { team_a: number; team_b: number }
    win_rate: { team_a: number; team_b: number }
    avg_acs: { team_a: number; team_b: number }
    avg_adr: { team_a: number; team_b: number }
    avg_kast: { team_a: number; team_b: number }
    tournament_wins: { team_a: number; team_b: number }
  }
  // Head-to-head
  head_to_head: {
    total_matches: number
    team_a_wins: number
    team_b_wins: number
    draws: number
    last_match?: {
      date: string
      tournament: string
      winner: string
      score: string
    }
  }
  // OPERA tournament contexts
  tournament_contexts: Array<{
    tournament_id: string
    tournament_name: string
    team_a_placement?: number
    team_b_placement?: number
    team_a_prize?: number
    team_b_prize?: number
  }>
}

export interface CrossHubQueryConfig {
  // SATOR filters (Component B)
  sator_filters?: {
    players?: string[]
    teams?: string[]
    date_range?: { start: string; end: string }
    min_matches?: number
    metrics?: string[]
  }
  // OPERA filters (Component D)
  opera_filters?: {
    tournaments?: string[]
    circuits?: string[]
    seasons?: string[]
    regions?: string[]
    patch_versions?: string[]
  }
  // Aggregation options
  group_by?: 'player' | 'team' | 'tournament' | 'date'
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SavedQuery {
  id: string
  name: string
  type: 'player-tournament' | 'patch-impact' | 'team-comparison' | 'custom'
  config: Record<string, unknown>
  created_at: string
  last_run?: string
}

export interface QueryHistoryItem {
  id: string
  type: string
  timestamp: string
  query_summary: string
  result_count?: number
}

// ============================================================================
// CROSS-REFERENCE FUNCTIONS
// ============================================================================

/**
 * Get player performance in a specific tournament
 * Cross-reference: SATOR (performance) + OPERA (tournament metadata)
 */
export async function getPlayerTournamentPerformance(
  playerId: string,
  tournamentId: string
): Promise<PlayerTournamentPerformance> {
  const response = await api.get<PlayerTournamentPerformance>(
    `/v1/cross-reference/player-tournament?player_id=${encodeURIComponent(playerId)}&tournament_id=${encodeURIComponent(tournamentId)}`
  )
  return response.data
}

/**
 * Get patch performance impact for an agent/weapon
 * Cross-reference: OPERA (patch changes) + SATOR (before/after performance)
 */
export async function getPatchPerformanceImpact(
  patchVersion: string,
  agentName: string
): Promise<PatchPerformanceImpact> {
  const response = await api.get<PatchPerformanceImpact>(
    `/v1/cross-reference/patch-impact?patch_version=${encodeURIComponent(patchVersion)}&agent_name=${encodeURIComponent(agentName)}`
  )
  return response.data
}

/**
 * Compare two teams across tournaments
 * Cross-reference: SATOR (team stats) + OPERA (tournament contexts)
 */
export async function compareTeamsAcrossTournaments(
  teamA: string,
  teamB: string,
  tournaments?: string[]
): Promise<TeamComparisonResult> {
  const params = new URLSearchParams()
  params.append('team_a', teamA)
  params.append('team_b', teamB)
  if (tournaments && tournaments.length > 0) {
    tournaments.forEach(t => params.append('tournaments', t))
  }
  
  const response = await api.get<TeamComparisonResult>(
    `/v1/cross-reference/team-comparison?${params.toString()}`
  )
  return response.data
}

/**
 * Execute custom cross-hub query
 */
export async function executeCrossHubQuery(
  config: CrossHubQueryConfig
): Promise<CrossHubQueryResult> {
  const response = await api.post<CrossHubQueryResult>('/v1/cross-reference/query', config)
  return response.data
}

// ============================================================================
// QUERY MANAGEMENT
// ============================================================================

/**
 * Get user's query history
 */
export async function getQueryHistory(limit: number = 50): Promise<{ queries: QueryHistoryItem[] }> {
  const response = await api.get<{ queries: QueryHistoryItem[] }>(
    `/v1/cross-reference/history?limit=${limit}`
  )
  return response.data
}

/**
 * Save a query for later use
 */
export async function saveQuery(query: Partial<SavedQuery>): Promise<SavedQuery> {
  const response = await api.post<SavedQuery>('/v1/cross-reference/saved-queries', query)
  return response.data
}

/**
 * Get saved queries
 */
export async function getSavedQueries(): Promise<{ queries: SavedQuery[] }> {
  const response = await api.get<{ queries: SavedQuery[] }>('/v1/cross-reference/saved-queries')
  return response.data
}

/**
 * Delete a saved query
 */
export async function deleteSavedQuery(queryId: string): Promise<void> {
  await api.delete(`/v1/cross-reference/saved-queries/${queryId}`)
}

/**
 * Execute a saved query
 */
export async function executeSavedQuery(queryId: string): Promise<CrossHubQueryResult> {
  const response = await api.post<CrossHubQueryResult>(`/v1/cross-reference/saved-queries/${queryId}/execute`)
  return response.data
}

// ============================================================================
// DATA SOURCE UTILITIES
// ============================================================================

/**
 * Get available data sources status
 */
export async function getDataSourcesStatus(): Promise<{
  sator: { available: boolean; last_sync: string }
  opera: { available: boolean; last_sync: string }
  rotas: { available: boolean; last_sync: string }
}> {
  const response = await api.get('/v1/cross-reference/data-sources')
  return response.data
}

/**
 * Get available tournaments for cross-referencing
 */
export async function getAvailableTournaments(
  circuit?: string,
  season?: string
): Promise<Array<{
  id: string
  name: string
  circuit: string
  season: string
  start_date: string
  end_date: string
  status: string
}>> {
  const params = new URLSearchParams()
  if (circuit) params.append('circuit', circuit)
  if (season) params.append('season', season)
  
  const response = await api.get(`/v1/cross-reference/tournaments?${params.toString()}`)
  return response.data.tournaments
}

/**
 * Get available patches for cross-referencing
 */
export async function getAvailablePatches(): Promise<Array<{
  version: string
  release_date: string
  game_version: string
  change_summary: string
}>> {
  const response = await api.get('/v1/cross-reference/patches')
  return response.data.patches
}

// ============================================================================
// MOCK DATA HELPERS (for development)
// ============================================================================

/**
 * Get mock player tournament performance (for development)
 */
export function getMockPlayerTournamentPerformance(): PlayerTournamentPerformance {
  return {
    player_id: 'player-123',
    player_name: 'TenZ',
    tournament_id: 'vct-2025-masters',
    tournament_name: 'VCT 2025 Masters Tokyo',
    performance: {
      matches_played: 12,
      avg_acs: 245.5,
      avg_adr: 168.2,
      avg_kast: 0.74,
      kdr: 1.32,
      avg_sim_rating: 87.5,
      peak_performance: 312.0,
      consistency_score: 0.82
    },
    tournament_context: {
      circuit: 'VCT',
      season: '2025',
      region: 'International',
      start_date: '2025-06-15',
      end_date: '2025-06-28',
      status: 'completed',
      prize_pool: 1000000
    },
    tournament_ranking: 3,
    performance_trend: 'improving',
    comparison_to_average: 15.2
  }
}

/**
 * Get mock patch impact data (for development)
 */
export function getMockPatchImpactData(): PatchPerformanceImpact {
  return {
    patch_version: '8.11',
    patch_date: '2025-05-28',
    agent_name: 'Jett',
    patch_changes: {
      buffs: ['Tailwind dash distance increased by 10%'],
      nerfs: ['Blade Storm ultimate cost increased from 7 to 8 points'],
      adjustments: ['Cloudburst smoke duration reduced from 4.5s to 4s']
    },
    before_patch: {
      matches: 1250,
      pick_rate: 0.42,
      win_rate: 0.51,
      avg_acs: 228.5,
      avg_adr: 152.3
    },
    after_patch: {
      matches: 980,
      pick_rate: 0.38,
      win_rate: 0.48,
      avg_acs: 221.2,
      avg_adr: 148.7
    },
    impact_score: -3.5,
    impact_category: 'minor_nerf',
    win_rate_delta: -3.0,
    pick_rate_delta: -4.0,
    acs_delta: -7.3
  }
}

/**
 * Get mock team comparison (for development)
 */
export function getMockTeamComparison(): TeamComparisonResult {
  return {
    team_a: {
      id: 'sentinels',
      name: 'Sentinels',
      region: 'NA'
    },
    team_b: {
      id: 'fnatic',
      name: 'Fnatic',
      region: 'EMEA'
    },
    tournaments: ['vct-2025-masters', 'vct-2025-champions'],
    stats_comparison: {
      matches_played: { team_a: 45, team_b: 52 },
      win_rate: { team_a: 0.67, team_b: 0.71 },
      avg_acs: { team_a: 234.2, team_b: 241.5 },
      avg_adr: { team_a: 158.3, team_b: 162.1 },
      avg_kast: { team_a: 0.72, team_b: 0.74 },
      tournament_wins: { team_a: 2, team_b: 3 }
    },
    head_to_head: {
      total_matches: 8,
      team_a_wins: 3,
      team_b_wins: 5,
      draws: 0,
      last_match: {
        date: '2025-08-20',
        tournament: 'VCT 2025 Champions',
        winner: 'fnatic',
        score: '2-1'
      }
    },
    tournament_contexts: [
      {
        tournament_id: 'vct-2025-masters',
        tournament_name: 'VCT 2025 Masters Tokyo',
        team_a_placement: 3,
        team_b_placement: 1,
        team_a_prize: 150000,
        team_b_prize: 300000
      },
      {
        tournament_id: 'vct-2025-champions',
        tournament_name: 'VCT 2025 Champions Seoul',
        team_a_placement: 2,
        team_b_placement: 4,
        team_a_prize: 400000,
        team_b_prize: 120000
      }
    ]
  }
}

export default {
  getPlayerTournamentPerformance,
  getPatchPerformanceImpact,
  compareTeamsAcrossTournaments,
  executeCrossHubQuery,
  getQueryHistory,
  saveQuery,
  getSavedQueries,
  deleteSavedQuery,
  executeSavedQuery,
  getDataSourcesStatus,
  getAvailableTournaments,
  getAvailablePatches
}
