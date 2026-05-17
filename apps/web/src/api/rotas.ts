/**
 * ROTAS API Client - Frontend Integration
 * Connects to ZeSporteXte backend ROTAS endpoints for stats reference data.
 *
 * [Ver001.000] - Phase 1: Core endpoints (matches, players, teams, tournaments)
 */

import { API_BASE_URL, API_CONFIG } from '../config/api'

const ROTAS_BASE = `${API_BASE_URL}/v1/rotas`

// ============================================================================
// Shared Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// ============================================================================
// Type Definitions (mirroring backend Pydantic models)
// ============================================================================

export interface RotasPlayerSummary {
  id: number
  name: string
  slug: string
  nationality: string | null
  game: string
  team_name: string | null
}

export interface RotasPlayerDetail extends RotasPlayerSummary {
  created_at: string
  updated_at: string
}

export interface RotasPlayerStats {
  total_matches: number
  matches_won: number
  matches_lost: number
  overall_kd: number
  avg_kills_per_round: number
  avg_damage_per_round: number
  total_first_bloods: number
  total_clutches_won: number
  recent_win_rate: number
  recent_avg_rating: number
}

export interface RotasTeamSummary {
  id: number
  name: string
  slug: string
  acronym: string | null
  game: string
  region: string | null
}

export interface RotasTeamDetail extends RotasTeamSummary {
  players: RotasPlayerSummary[]
  created_at: string
  updated_at: string
}

export interface RotasTeamStats {
  total_matches: number
  matches_won: number
  matches_lost: number
  win_rate: number
  total_rounds: number
  rounds_won: number
  round_win_rate: number
  recent_form: string[] | null
}

export interface RotasMatchSummary {
  id: number
  name: string
  game: string
  status: string
  scheduled_at: string | null
  finished_at: string | null
  team1_name: string | null
  team2_name: string | null
  team1_score: number
  team2_score: number
  winner_name: string | null
}

export interface RotasMatchDetail extends RotasMatchSummary {
  team1_id: number | null
  team2_id: number | null
  winner_id: number | null
  best_of: number
  map_veto: Record<string, unknown> | null
}

export interface RotasTournamentSummary {
  id: number
  name: string
  slug: string
  game: string
  tier: string | null
  region: string | null
  start_date: string | null
  end_date: string | null
  status: string
  prize_pool: string | null
}

export interface RotasLeaderboardEntry {
  rank: number
  player_id: number
  name: string
  nationality: string | null
  team: string | null
  matches: number
  kills?: number
  deaths?: number
  kd_ratio?: number
  adr?: number
}

export interface RotasLeaderboard {
  game: string
  category: string
  players: RotasLeaderboardEntry[]
}

// ============================================================================
// Generic HTTP helpers
// ============================================================================

async function rotasFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${ROTAS_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value))
    })
  }

  const response = await fetch(url.toString(), {
    headers: API_CONFIG.headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

// ============================================================================
// Match Endpoints
// ============================================================================

export async function fetchMatches(
  game?: string,
  teamId?: number,
  status?: 'not_started' | 'running' | 'finished',
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RotasMatchSummary>> {
  return rotasFetch('/matches', { game, team_id: teamId, status, page, per_page: perPage })
}

export async function fetchMatch(matchId: number): Promise<RotasMatchDetail> {
  return rotasFetch(`/matches/${matchId}`)
}

export async function fetchLiveMatches(
  game = 'valorant',
  limit = 20
): Promise<RotasMatchSummary[]> {
  const response = await fetchMatches(game, undefined, 'running', 1, limit)
  return response.items
}

export async function fetchMatchHistory(
  game?: string,
  teamId?: number,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RotasMatchSummary>> {
  return fetchMatches(game, teamId, 'finished', page, perPage)
}

// ============================================================================
// Player Endpoints
// ============================================================================

export async function fetchPlayers(
  game?: string,
  teamId?: number,
  search?: string,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RotasPlayerSummary>> {
  return rotasFetch('/players', { game, team_id: teamId, search, page, per_page: perPage })
}

export async function fetchPlayer(playerId: number): Promise<RotasPlayerDetail> {
  return rotasFetch(`/players/${playerId}`)
}

export async function fetchPlayerStats(
  playerId: number,
  game?: string
): Promise<RotasPlayerStats> {
  const params: Record<string, string> = {}
  if (game) params.game = game
  const url = new URL(`${ROTAS_BASE}/players/${playerId}/stats`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

  const response = await fetch(url.toString(), { headers: API_CONFIG.headers })
  if (!response.ok) throw new Error(`Failed to fetch player stats: ${response.status}`)
  return response.json()
}

// ============================================================================
// Team Endpoints
// ============================================================================

export async function fetchTeams(
  game?: string,
  region?: string,
  search?: string,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RotasTeamSummary>> {
  return rotasFetch('/teams', { game, region, search, page, per_page: perPage })
}

export async function fetchTeam(teamId: number): Promise<RotasTeamDetail> {
  return rotasFetch(`/teams/${teamId}`)
}

export async function fetchTeamStats(teamId: number, game?: string): Promise<RotasTeamStats> {
  const params: Record<string, string> = {}
  if (game) params.game = game
  const url = new URL(`${ROTAS_BASE}/teams/${teamId}/stats`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

  const response = await fetch(url.toString(), { headers: API_CONFIG.headers })
  if (!response.ok) throw new Error(`Failed to fetch team stats: ${response.status}`)
  return response.json()
}

// ============================================================================
// Tournament Endpoints
// ============================================================================

export async function fetchTournaments(
  game?: string,
  status?: 'upcoming' | 'ongoing' | 'finished',
  tier?: string,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RotasTournamentSummary>> {
  return rotasFetch('/tournaments', { game, status, tier, page, per_page: perPage })
}

// ============================================================================
// Leaderboard Endpoints
// ============================================================================

export async function fetchKDLeaderboard(
  game: string,
  minMatches = 5,
  limit = 20
): Promise<RotasLeaderboard> {
  return rotasFetch('/leaderboards/kd', { game, min_matches: minMatches, limit })
}

export async function fetchADRLeaderboard(
  game: string,
  minMatches = 5,
  limit = 20
): Promise<RotasLeaderboard> {
  return rotasFetch('/leaderboards/adr', { game, min_matches: minMatches, limit })
}

// ============================================================================
// Convenience export
// ============================================================================

export const rotasApi = {
  matches: {
    list: fetchMatches,
    get: fetchMatch,
    live: fetchLiveMatches,
    history: fetchMatchHistory,
  },
  players: {
    list: fetchPlayers,
    get: fetchPlayer,
    stats: fetchPlayerStats,
  },
  teams: {
    list: fetchTeams,
    get: fetchTeam,
    stats: fetchTeamStats,
  },
  tournaments: {
    list: fetchTournaments,
  },
  leaderboards: {
    kd: fetchKDLeaderboard,
    adr: fetchADRLeaderboard,
  },
} as const
