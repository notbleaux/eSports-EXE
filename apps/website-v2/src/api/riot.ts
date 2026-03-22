/**
 * Riot Games API Client - Frontend Integration
 * Official Valorant API client with caching and rate limiting
 * 
 * [Ver001.000] - Initial implementation for SATOR hub
 * 
 * NOTE: Riot API requires a valid API key from https://developer.riotgames.com/
 * Personal API keys have rate limits: 20 req/s, 100 req/2min
 */

import { logger } from '@/utils/logger';

const apiLogger = logger.child('RiotAPI');

// Environment variable for Riot API key (should be server-side in production)
const RIOT_API_KEY = (import.meta as unknown as { env: Record<string, string> }).env.VITE_RIOT_API_KEY || '';
const RIOT_API_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_RIOT_API_URL || 'http://localhost:8000/api/riot'; // Proxy through backend

// Cache configuration
const CACHE_TTL = {
  content: 24 * 60 * 60 * 1000,    // 24 hours for static content
  match: 60 * 60 * 1000,           // 1 hour for matches
  matchlist: 5 * 60 * 1000,        // 5 minutes for matchlists
  leaderboard: 60 * 60 * 1000,     // 1 hour for leaderboards
  status: 5 * 60 * 1000,           // 5 minutes for status
  account: 60 * 60 * 1000,         // 1 hour for account info
};

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerSecond: 20,
  requestsPer2Minutes: 100,
};

// ============================================================================
// Type Definitions
// ============================================================================

// Common types
export interface ContentItem {
  id: string;
  name: string;
  localizedNames?: Record<string, string>;
  assetName?: string;
  assetPath?: string;
}

export interface GameContent {
  version: string;
  characters: ContentItem[];      // Agents
  maps: ContentItem[];
  chromas: ContentItem[];
  skins: ContentItem[];
  skinLevels: ContentItem[];
  equips: ContentItem[];
  gameModes: ContentItem[];
  sprays: ContentItem[];
  sprayLevels: ContentItem[];
  charms: ContentItem[];
  charmLevels: ContentItem[];
  playerCards: ContentItem[];
  playerTitles: ContentItem[];
  acts: ContentItem[];
  ceremonies: ContentItem[];
}

export interface PlatformStatus {
  id: string;
  name: string;
  locales: string[];
  maintenances: MaintenanceIncident[];
  incidents: MaintenanceIncident[];
}

export interface MaintenanceIncident {
  id: number;
  maintenanceStatus: string;
  incidentSeverity: string;
  titles: { locale: string; content: string }[];
  updates: {
    id: number;
    publishLocations: string[];
    author: string;
    createdAt: string;
    updatedAt: string;
    translations: { locale: string; content: string }[];
  }[];
  createdAt: string;
  archiveAt: string | null;
  updatedAt: string | null;
  platforms: string[];
}

// Match types
export interface MatchMetadata {
  matchId: string;
  mapId: string;
  gameVersion: string;
  gameLengthMillis: number;
  gameStartMillis: number;
  provisioningFlowId: string;
  isCompleted: boolean;
  customGameName: string;
  queueId: string;
  gameMode: string;
  isRanked: boolean;
  seasonId: string;
}

export interface PlayerAbilityCasts {
  grenadeCasts: number;
  ability1Casts: number;
  ability2Casts: number;
  ultimateCasts: number;
}

export interface PlayerStats {
  score: number;
  roundsPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  playtimeMillis: number;
  abilityCasts?: PlayerAbilityCasts;
}

export interface MatchPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  partyId: string;
  characterId: string;  // Agent ID
  stats: PlayerStats;
  competitiveTier: number;
  playerCard: string;
  playerTitle: string;
  accountLevel: number;
}

export interface MatchTeam {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
  numPoints: number;
}

export interface PlayerRoundStats {
  puuid: string;
  kills: {
    gameTimeMillis: number;
    roundTimeMillis: number;
    killer: string;
    victim: string;
    victimLocation: { x: number; y: number };
    assistants: string[];
    playerLocations: {
      puuid: string;
      viewRadians: number;
      location: { x: number; y: number };
    }[];
    finishingDamage: {
      damageType: string;
      damageItem: string;
      isSecondaryFireMode: boolean;
    };
  }[];
  damage: {
    receiver: string;
    damage: number;
    legshots: number;
    bodyshots: number;
    headshots: number;
  }[];
  score: number;
  economy: {
    loadoutValue: number;
    weapon: string;
    armor: string;
    remaining: number;
    spent: number;
  };
  ability: {
    grenadeEffects: unknown;
    ability1Effects: unknown;
    ability2Effects: unknown;
    ultimateEffects: unknown;
  };
}

export interface RoundResult {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
  bombPlanter: string | null;
  bombDefuser: string | null;
  plantRoundTime: number;
  plantPlayerLocations: {
    puuid: string;
    viewRadians: number;
    location: { x: number; y: number };
  }[] | null;
  plantLocation: { x: number; y: number } | null;
  plantSite: string | null;
  defuseRoundTime: number;
  defusePlayerLocations: {
    puuid: string;
    viewRadians: number;
    location: { x: number; y: number };
  }[] | null;
  defuseLocation: { x: number; y: number } | null;
  playerStats: PlayerRoundStats[];
  roundResultCode: string;
}

export interface RiotMatch {
  matchInfo: MatchMetadata;
  players: MatchPlayer[];
  teams: MatchTeam[];
  roundResults: RoundResult[];
}

// Matchlist types
export interface MatchlistEntry {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
}

export interface Matchlist {
  puuid: string;
  history: MatchlistEntry[];
}

// Leaderboard types
export interface LeaderboardPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  leaderboardRank: number;
  rankedRating: number;
  numberOfWins: number;
  competitiveTier: number;
}

export interface Leaderboard {
  shard: string;
  actId: string;
  totalPlayers: number;
  players: LeaderboardPlayer[];
  immortal1StartPage: number;
  immortal2StartPage: number;
  immortal3StartPage: number;
  radiantStartPage: number;
  immortal1StartIndex: number;
  immortal2StartIndex: number;
  immortal3StartIndex: number;
  radiantStartIndex: number;
  isTop500Schema: boolean;
}

// Account types
export interface RiotAccount {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
}

export interface ActiveShard {
  puuid: string;
  game: string;
  activeShard: string;
}

// SATOR-transformed types
export interface SatorMatchSummary {
  id: string;
  mapName: string;
  gameMode: string;
  isRanked: boolean;
  gameLength: string;
  gameStart: Date;
  teams: {
    teamId: string;
    won: boolean;
    roundsWon: number;
    players: {
      name: string;
      tagLine: string;
      agentId: string;
      kills: number;
      deaths: number;
      assists: number;
      score: number;
    }[];
  }[];
}

export interface SatorPlayerStats {
  puuid: string;
  name: string;
  tagLine: string;
  matchesPlayed: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  averageScore: number;
  winRate: number;
  kda: number;
}

// ============================================================================
// In-Memory Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SimpleCache();

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private readonly lock = new Map<string, Promise<void>>();

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Clean old requests (older than 2 minutes)
    this.requests = this.requests.filter(time => now - time < 120000);
    
    // Check limits
    const requestsInLastSecond = this.requests.filter(time => now - time < 1000).length;
    const requestsInLast2Minutes = this.requests.length;
    
    if (requestsInLastSecond >= RATE_LIMIT.requestsPerSecond) {
      // Wait for next second
      const oldestInSecond = this.requests.find(time => now - time < 1000);
      if (oldestInSecond) {
        const waitTime = 1000 - (now - oldestInSecond);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    if (requestsInLast2Minutes >= RATE_LIMIT.requestsPer2Minutes) {
      // Wait for oldest request to expire
      const oldest = this.requests[0];
      if (oldest) {
        const waitTime = 120000 - (now - oldest);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Check if Riot API is available (key configured)
 */
export function isRiotApiAvailable(): boolean {
  return RIOT_API_KEY.length > 0;
}

/**
 * Make rate-limited API request to Riot API
 * In production, this should go through your backend proxy
 */
async function riotRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  // Wait for rate limit
  await rateLimiter.throttle();

  // In production, use your backend as a proxy to protect API key
  const url = new URL(`${RIOT_API_URL}/${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  apiLogger.debug(`Riot API Request: ${endpoint}`, params);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // API key should be handled server-side in production
      ...(RIOT_API_KEY && { 'X-Riot-Token': RIOT_API_KEY }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.status?.message || `HTTP ${response.status}`;
    apiLogger.error(`Riot API error: ${errorMessage}`);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 403) {
      throw new Error('API key invalid or expired. Check your RIOT_API_KEY.');
    }
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }
    
    throw new Error(`Riot API error: ${errorMessage}`);
  }

  return response.json();
}

// ============================================================================
// VAL-CONTENT-V1 Endpoints
// ============================================================================

/**
 * Get Valorant game content (maps, agents, etc.)
 */
export async function getContent(locale: string = 'en-US'): Promise<GameContent> {
  const cacheKey = `content_${locale}`;
  
  const cached = cache.get<GameContent>(cacheKey, CACHE_TTL.content);
  if (cached) {
    apiLogger.debug('Using cached content data');
    return cached;
  }

  try {
    const data = await riotRequest<GameContent>('content/v1/contents', { locale });
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch content:', error);
    throw error;
  }
}

// ============================================================================
// VAL-MATCH-V1 Endpoints
// ============================================================================

/**
 * Get match by ID
 */
export async function getMatch(matchId: string): Promise<RiotMatch | null> {
  const cacheKey = `match_${matchId}`;
  
  const cached = cache.get<RiotMatch>(cacheKey, CACHE_TTL.match);
  if (cached) {
    apiLogger.debug('Using cached match data');
    return cached;
  }

  try {
    const data = await riotRequest<RiotMatch>(`match/v1/matches/${matchId}`);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    apiLogger.error(`Failed to fetch match ${matchId}:`, error);
    throw error;
  }
}

/**
 * Get matchlist for a player
 */
export async function getMatchlist(
  puuid: string,
  queue?: string,
  startIndex: number = 0,
  endIndex: number = 20
): Promise<Matchlist> {
  const cacheKey = `matchlist_${puuid}_${queue}_${startIndex}_${endIndex}`;
  
  const cached = cache.get<Matchlist>(cacheKey, CACHE_TTL.matchlist);
  if (cached) {
    apiLogger.debug('Using cached matchlist data');
    return cached;
  }

  try {
    const params: Record<string, string | number> = {};
    if (queue) params.queue = queue;
    if (startIndex > 0) params.startIndex = startIndex;
    if (endIndex !== 20) params.endIndex = endIndex;
    
    const data = await riotRequest<Matchlist>(`match/v1/matchlists/by-puuid/${puuid}`, params);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error(`Failed to fetch matchlist for ${puuid}:`, error);
    throw error;
  }
}

/**
 * Get recent matches for a queue
 */
export async function getRecentMatches(queue: string): Promise<{ matches: MatchlistEntry[] }> {
  const cacheKey = `recent_${queue}`;
  
  const cached = cache.get<{ matches: MatchlistEntry[] }>(cacheKey, CACHE_TTL.matchlist);
  if (cached) {
    return cached;
  }

  try {
    const data = await riotRequest<{ matches: MatchlistEntry[] }>(`match/v1/recent-matches/by-queue/${queue}`);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error(`Failed to fetch recent matches for ${queue}:`, error);
    throw error;
  }
}

// ============================================================================
// VAL-RANKED-V1 Endpoints
// ============================================================================

/**
 * Get leaderboard for an act
 */
export async function getLeaderboard(
  actId: string,
  size: number = 200,
  startIndex: number = 0
): Promise<Leaderboard | null> {
  const cacheKey = `leaderboard_${actId}_${size}_${startIndex}`;
  
  const cached = cache.get<Leaderboard>(cacheKey, CACHE_TTL.leaderboard);
  if (cached) {
    apiLogger.debug('Using cached leaderboard data');
    return cached;
  }

  try {
    const data = await riotRequest<Leaderboard>(`ranked/v1/leaderboards/by-act/${actId}`, {
      size: Math.min(size, 1000),
      startIndex,
    });
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    apiLogger.error(`Failed to fetch leaderboard for act ${actId}:`, error);
    throw error;
  }
}

// ============================================================================
// VAL-STATUS-V1 Endpoints
// ============================================================================

/**
 * Get platform status
 */
export async function getPlatformData(): Promise<PlatformStatus> {
  const cacheKey = 'platform_status';
  
  const cached = cache.get<PlatformStatus>(cacheKey, CACHE_TTL.status);
  if (cached) {
    return cached;
  }

  try {
    const data = await riotRequest<PlatformStatus>('status/v1/platformData');
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch platform status:', error);
    throw error;
  }
}

// ============================================================================
// Account/RSO Endpoints (Production keys only)
// ============================================================================

/**
 * Get account by Riot ID (requires Production API key)
 */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount | null> {
  const cacheKey = `account_${gameName}_${tagLine}`;
  
  const cached = cache.get<RiotAccount>(cacheKey, CACHE_TTL.account);
  if (cached) {
    return cached;
  }

  try {
    // Note: Account endpoints use regional routing
    const data = await riotRequest<RiotAccount>(`account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    apiLogger.error(`Failed to fetch account for ${gameName}#${tagLine}:`, error);
    throw error;
  }
}

/**
 * Get account by PUUID (requires Production API key)
 */
export async function getAccountByPuuid(puuid: string): Promise<RiotAccount | null> {
  const cacheKey = `account_puuid_${puuid}`;
  
  const cached = cache.get<RiotAccount>(cacheKey, CACHE_TTL.account);
  if (cached) {
    return cached;
  }

  try {
    const data = await riotRequest<RiotAccount>(`account/v1/accounts/by-puuid/${puuid}`);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    apiLogger.error(`Failed to fetch account for ${puuid}:`, error);
    throw error;
  }
}

// ============================================================================
// Data Transformation Functions
// ============================================================================

/**
 * Transform Riot match to SATOR summary format
 */
export function transformMatchToSator(match: RiotMatch): SatorMatchSummary {
  const gameLengthMinutes = Math.floor(match.matchInfo.gameLengthMillis / 60000);
  const gameLengthSeconds = Math.floor((match.matchInfo.gameLengthMillis % 60000) / 1000);
  
  // Group players by team
  const playersByTeam = match.players.reduce((acc, player) => {
    if (!acc[player.teamId]) {
      acc[player.teamId] = [];
    }
    acc[player.teamId].push(player);
    return acc;
  }, {} as Record<string, MatchPlayer[]>);

  return {
    id: match.matchInfo.matchId,
    mapName: match.matchInfo.mapId, // Would need to lookup actual name from content
    gameMode: match.matchInfo.gameMode,
    isRanked: match.matchInfo.isRanked,
    gameLength: `${gameLengthMinutes}m ${gameLengthSeconds}s`,
    gameStart: new Date(match.matchInfo.gameStartMillis),
    teams: match.teams.map(team => ({
      teamId: team.teamId,
      won: team.won,
      roundsWon: team.roundsWon,
      players: (playersByTeam[team.teamId] || []).map(p => ({
        name: p.gameName,
        tagLine: p.tagLine,
        agentId: p.characterId,
        kills: p.stats.kills,
        deaths: p.stats.deaths,
        assists: p.stats.assists,
        score: p.stats.score,
      })),
    })),
  };
}

/**
 * Calculate player stats from match history
 */
export function calculatePlayerStats(
  puuid: string,
  matches: RiotMatch[]
): SatorPlayerStats | null {
  if (matches.length === 0) return null;

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalScore = 0;
  let wins = 0;

  for (const match of matches) {
    const player = match.players.find(p => p.puuid === puuid);
    if (player) {
      totalKills += player.stats.kills;
      totalDeaths += player.stats.deaths;
      totalAssists += player.stats.assists;
      totalScore += player.stats.score;
      
      const team = match.teams.find(t => t.teamId === player.teamId);
      if (team?.won) wins++;
    }
  }

  const matchesPlayed = matches.length;
  const kda = totalDeaths === 0 
    ? totalKills + totalAssists 
    : (totalKills + totalAssists) / totalDeaths;

  return {
    puuid,
    name: matches[0].players.find(p => p.puuid === puuid)?.gameName || 'Unknown',
    tagLine: matches[0].players.find(p => p.puuid === puuid)?.tagLine || '',
    matchesPlayed,
    totalKills,
    totalDeaths,
    totalAssists,
    averageScore: Math.round(totalScore / matchesPlayed),
    winRate: Math.round((wins / matchesPlayed) * 1000) / 10,
    kda: Math.round(kda * 100) / 100,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format game length in human-readable format
 */
export function formatGameLength(millis: number): string {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Calculate KDA ratio
 */
export function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return Math.round(((kills + assists) / deaths) * 100) / 100;
}

/**
 * Get agent name from content
 */
export function getAgentName(agentId: string, content: GameContent): string {
  const agent = content.characters.find(c => c.id === agentId);
  return agent?.name || 'Unknown Agent';
}

/**
 * Get map name from content
 */
export function getMapName(mapId: string, content: GameContent): string {
  const map = content.maps.find(m => m.id === mapId);
  return map?.name || 'Unknown Map';
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
  apiLogger.info('Riot API cache cleared');
}

/**
 * Clear cache for specific endpoint type
 */
export function clearCacheByType(
  type: 'content' | 'match' | 'matchlist' | 'leaderboard' | 'status'
): void {
  cache.clearByPrefix(type);
  apiLogger.info(`Riot API ${type} cache cleared`);
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check Riot API health
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  region?: string;
  platform?: string;
  incidents?: number;
  error?: string;
}> {
  try {
    const status = await getPlatformData();
    return {
      healthy: true,
      region: 'na', // Would be dynamic based on config
      platform: status.name,
      incidents: status.incidents.length,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Export default client
// ============================================================================

export const riotApi = {
  // Status
  isAvailable: isRiotApiAvailable,
  healthCheck,
  
  // Content
  getContent,
  
  // Matches
  getMatch,
  getMatchlist,
  getRecentMatches,
  
  // Ranked
  getLeaderboard,
  
  // Status
  getPlatformData,
  
  // Account (Production keys only)
  getAccountByRiotId,
  getAccountByPuuid,
  
  // Transformations
  transformMatchToSator,
  calculatePlayerStats,
  
  // Utilities
  formatGameLength,
  calculateKDA,
  getAgentName,
  getMapName,
  
  // Cache management
  clearCache,
  clearCacheByType,
  
  // Types
  type: {
    GameContent: {} as GameContent,
    RiotMatch: {} as RiotMatch,
    Matchlist: {} as Matchlist,
    Leaderboard: {} as Leaderboard,
    PlatformStatus: {} as PlatformStatus,
    RiotAccount: {} as RiotAccount,
    SatorMatchSummary: {} as SatorMatchSummary,
    SatorPlayerStats: {} as SatorPlayerStats,
  },
};

export default riotApi;
