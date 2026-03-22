/**
 * Search API Client - Full-text search across players, teams, and matches
 * 
 * [Ver001.000]
 */

import { api, apiCancellable } from './client'

// ============================================================================
// TYPES
// ============================================================================

export type SearchType = 'players' | 'teams' | 'matches' | 'all'
export type SortMethod = 'relevance' | 'name' | 'date'
export type GameType = 'cs' | 'valorant'

export interface SearchResultPlayer {
  id: string
  name: string
  real_name?: string
  team?: string
  region?: string
  nationality?: string
  role?: string
  sim_rating?: number
  rar_score?: number
  investment_grade?: string
  relevance_score: number
}

export interface SearchResultTeam {
  id: string
  name: string
  location?: string
  region?: string
  game: GameType
  player_count?: number
  relevance_score: number
}

export interface SearchResultMatch {
  id: string
  tournament: string
  map_name?: string
  game: GameType
  team1?: string
  team2?: string
  match_date?: string
  player_count: number
  relevance_score: number
}

export interface SearchResponse {
  query: string
  type?: SearchType
  total: number
  limit: number
  offset: number
  sort: SortMethod
  players: SearchResultPlayer[]
  teams: SearchResultTeam[]
  matches: SearchResultMatch[]
  execution_ms: number
}

export interface PlayerSearchResponse {
  query: string
  total: number
  limit: number
  offset: number
  sort: SortMethod
  results: SearchResultPlayer[]
  execution_ms: number
}

export interface TeamSearchResponse {
  query: string
  total: number
  limit: number
  offset: number
  sort: SortMethod
  results: SearchResultTeam[]
  execution_ms: number
}

export interface MatchSearchResponse {
  query: string
  total: number
  limit: number
  offset: number
  sort: SortMethod
  results: SearchResultMatch[]
  execution_ms: number
}

export interface SearchSuggestion {
  type: 'player' | 'team'
  name: string
  id: string
}

export interface SearchSuggestionsResponse {
  query: string
  suggestions: SearchSuggestion[]
  total: number
  rate_limited?: boolean
}

export interface SearchParams {
  q: string
  type?: SearchType
  limit?: number
  offset?: number
  sort?: SortMethod
  game?: GameType
}

export interface PlayerSearchParams extends Omit<SearchParams, 'type'> {
  team?: string
  region?: string
}

export interface TeamSearchParams extends Omit<SearchParams, 'type'> {
  region?: string
}

export interface MatchSearchParams extends Omit<SearchParams, 'type'> {
  tournament?: string
  map_name?: string
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search across all content types (players, teams, matches)
 */
export async function searchAll(params: SearchParams): Promise<SearchResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.type && params.type !== 'all') {
    queryParams.append('type', params.type)
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  
  const response = await api.get<SearchResponse>(`/v1/search/?${queryParams.toString()}`)
  return response.data
}

/**
 * Search players specifically
 */
export async function searchPlayers(params: PlayerSearchParams): Promise<PlayerSearchResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  if (params.team) {
    queryParams.append('team', params.team)
  }
  if (params.region) {
    queryParams.append('region', params.region)
  }
  
  const response = await api.get<PlayerSearchResponse>(`/v1/search/players?${queryParams.toString()}`)
  return response.data
}

/**
 * Search teams specifically
 */
export async function searchTeams(params: TeamSearchParams): Promise<TeamSearchResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  if (params.region) {
    queryParams.append('region', params.region)
  }
  
  const response = await api.get<TeamSearchResponse>(`/v1/search/teams?${queryParams.toString()}`)
  return response.data
}

/**
 * Search matches specifically
 */
export async function searchMatches(params: MatchSearchParams): Promise<MatchSearchResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  if (params.tournament) {
    queryParams.append('tournament', params.tournament)
  }
  if (params.map_name) {
    queryParams.append('map_name', params.map_name)
  }
  
  const response = await api.get<MatchSearchResponse>(`/v1/search/matches?${queryParams.toString()}`)
  return response.data
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(
  query: string,
  type: 'players' | 'teams' | 'all' = 'all',
  limit: number = 10
): Promise<SearchSuggestionsResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append('q', query)
  queryParams.append('type', type)
  queryParams.append('limit', limit.toString())
  
  const response = await api.get<SearchSuggestionsResponse>(
    `/v1/search/suggestions?${queryParams.toString()}`
  )
  return response.data
}

// ============================================================================
// CANCELLABLE SEARCH (for debounced inputs)
// ============================================================================

/**
 * Cancellable search across all content types
 * Use this for search-as-you-type with debouncing
 */
export function searchAllCancellable(params: SearchParams) {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.type && params.type !== 'all') {
    queryParams.append('type', params.type)
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  
  return apiCancellable.get<SearchResponse>(`/v1/search/?${queryParams.toString()}`)
}

/**
 * Cancellable player search
 */
export function searchPlayersCancellable(params: PlayerSearchParams) {
  const queryParams = new URLSearchParams()
  queryParams.append('q', params.q)
  
  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString())
  }
  if (params.sort) {
    queryParams.append('sort', params.sort)
  }
  if (params.game) {
    queryParams.append('game', params.game)
  }
  if (params.team) {
    queryParams.append('team', params.team)
  }
  if (params.region) {
    queryParams.append('region', params.region)
  }
  
  return apiCancellable.get<PlayerSearchResponse>(`/v1/search/players?${queryParams.toString()}`)
}

/**
 * Cancellable suggestions for autocomplete
 */
export function getSearchSuggestionsCancellable(
  query: string,
  type: 'players' | 'teams' | 'all' = 'all',
  limit: number = 10
) {
  const queryParams = new URLSearchParams()
  queryParams.append('q', query)
  queryParams.append('type', type)
  queryParams.append('limit', limit.toString())
  
  return apiCancellable.get<SearchSuggestionsResponse>(
    `/v1/search/suggestions?${queryParams.toString()}`
  )
}
