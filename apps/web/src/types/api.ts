/** [Ver001.000]
 * API Types — NJZiteGeisTe Platform
 * 
 * TypeScript definitions aligned with FastAPI Pydantic schemas.
 * These types represent the complete API contract.
 * 
 * @module types/api
 */

// ============================================================================
// Core Entity Types (from database models)
// ============================================================================

/**
 * Player entity from database
 */
export interface Player {
  id: number;
  pandascoreId: number;
  name: string;
  slug: string;
  nationality: string | null;
  game: 'valorant' | 'cs2';
  teamId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team entity from database
 */
export interface Team {
  id: number;
  pandascoreId: number;
  name: string;
  slug: string;
  acronym: string | null;
  game: 'valorant' | 'cs2';
  region: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Match entity from database
 */
export interface Match {
  id: number;
  pandascoreId: number;
  name: string;
  game: 'valorant' | 'cs2';
  status: 'not_started' | 'running' | 'finished' | 'canceled';
  scheduledAt: string | null;
  finishedAt: string | null;
  team1Id: number | null;
  team2Id: number | null;
  winnerId: number | null;
  createdAt: string;
}

/**
 * Player statistics from database
 */
export interface PlayerStats {
  id: number;
  playerId: number;
  matchId: number | null;
  game: 'valorant' | 'cs2';
  kills: number;
  deaths: number;
  assists: number;
  headshotPct: number;
  firstBloods: number;
  clutchesWon: number;
  roundsPlayed: number;
  kdRatio: number;
  acs: number;
  recordedAt: string;
}

// ============================================================================
// Tournament Types
// ============================================================================

export type TournamentFormat = 
  | 'single_elimination' 
  | 'double_elimination' 
  | 'round_robin' 
  | 'swiss' 
  | 'gSL';

export type TournamentStatus = 
  | 'draft' 
  | 'registration' 
  | 'active' 
  | 'completed' 
  | 'cancelled';

export type TournamentTier = 'S' | 'A' | 'B' | 'C' | 'qualifier';

/**
 * Tournament entity
 */
export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  game: 'valorant' | 'cs2';
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: string;
  endDate: string | null;
  maxTeams: number;
  prizePool: number | null;
  currency: string | null;
  registeredTeams: number;
  tier: TournamentTier;
  region: string;
  winnerId: string | null;
  winnerName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tournament with bracket information
 */
export interface TournamentWithBracket extends Tournament {
  bracket: BracketMatch[];
  teams: TournamentTeam[];
}

/**
 * Tournament team registration
 */
export interface TournamentTeam {
  teamId: string;
  teamName: string;
  seed: number;
  status: 'registered' | 'checked_in' | 'disqualified';
}

/**
 * Match within a tournament bracket
 */
export interface BracketMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'bye';
  scheduledAt: string | null;
  nextMatchId: string | null;
}

// ============================================================================
// Match Types
// ============================================================================

export type MatchStatus = 
  | 'scheduled' 
  | 'live' 
  | 'completed' 
  | 'cancelled' 
  | 'postponed';

export interface MatchDetail {
  id: string;
  tournamentId: string | null;
  team1: MatchTeam;
  team2: MatchTeam;
  status: MatchStatus;
  round: number | null;
  position: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  maps: MapResult[];
  playerStats: PlayerMatchStats[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  score: number;
}

export interface MapResult {
  mapName: string;
  team1Score: number;
  team2Score: number;
  pickedBy: string | null;
  duration: number | null;
}

// ============================================================================
// Player Match Statistics
// ============================================================================

export type PlayerTeam = 'team_a' | 'team_b';

export type AgentRole = 'duelist' | 'initiator' | 'controller' | 'sentinel' | 'flex';

/**
 * Comprehensive player statistics for a match
 */
export interface PlayerMatchStats {
  playerId: string;
  playerName: string;
  teamId: string;
  team: PlayerTeam;
  agentId: string | null;
  agentName: string | null;
  role: AgentRole | null;
  
  // Combat stats
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  damageReceived: number;
  
  // Accuracy stats
  headshots: number;
  bodyshots: number;
  legshots: number;
  headshotPercentage: number;
  
  // Utility stats
  utilityDamage: number;
  utilityCasts: number;
  flashAssists: number;
  
  // Impact stats
  firstKills: number;
  firstDeaths: number;
  multikills: number[];
  
  // Clutch stats
  clutchesWon: number;
  clutchesLost: number;
  clutchAttempts: number;
  
  // Derived stats
  kast: number;
  adr: number;
  acs: number | null;
  kpr: number;
  survivalRate: number;
  
  // Round stats
  roundsPlayed: number;
  roundsWon: number;
  roundsLost: number;
}

// ============================================================================
// Analytics Types (SimRating, RAR)
// ============================================================================

/**
 * SimRating components breakdown
 */
export interface SimRating {
  combat: number;
  tactical: number;
  economic: number;
  impact: number;
  consistency: number;
  overall: number;
}

/**
 * SimRating with metadata
 */
export interface SimRatingWithMeta {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  game: 'valorant' | 'cs2';
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    kd: number;
    acs: number;
    headshotRate: number;
    firstBloods: number;
    clutchRate: number;
  };
  sampleSize: number;
  confidence: number;
  version: 'v1' | 'v2';
  lastUpdated: string;
}

/**
 * Role-Adjusted Replacement (RAR)
 */
export interface RAR {
  role: AgentRole;
  value: number;
  baseline: number;
  rarScore: number;
}

/**
 * RAR with investment grading
 */
export interface RARWithGrade extends RAR {
  investmentGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  interpretation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// API Request/Response Types (from FastAPI routers)
// ============================================================================

// SimRating API
export interface SimRatingRequest {
  killsZ: number;
  deathsZ: number;
  adjustedKillValueZ: number;
  adrZ: number;
  kastPctZ: number;
}

export interface SimRatingResponse {
  simRating: number;
  components: Record<string, number>;
  zScores: Record<string, number>;
  percentile: number;
  interpretation: string;
}

// RAR API
export interface RARRequest {
  rawRating: number;
  role: string;
}

export interface RARResponse {
  role: string;
  rawRating: number;
  replacementLevel: number;
  rarScore: number;
  investmentGrade: string;
  interpretation: string;
}

// Investment Grade API
export interface InvestmentGradeRequest {
  rawRating: number;
  role: string;
  age: number;
  recordDate: string | null;
}

export interface InvestmentGradeResponse {
  rarScore: number;
  ageFactor: number;
  adjustedRar: number;
  investmentGrade: string;
  inPeakAge: boolean;
  careerStage: string;
  peakProximity: number;
  decayFactor: number;
}

// Age Curve API
export interface AgeCurveResponse {
  role: string;
  age: number;
  peakRange: [number, number];
  careerStage: 'rising' | 'peak' | 'declining';
  peakProximity: number;
}

// Batch Grade API
export interface BatchGradeRequest {
  players: Array<{
    playerId: string;
    rawRating: number;
    role: string;
    age: number;
    recordDate?: string;
  }>;
}

export interface BatchGradeResponse {
  results: Array<InvestmentGradeResponse & { playerId: string }>;
  count: number;
}

// ============================================================================
// Feature Store Types
// ============================================================================

export type FeatureType = 
  | 'numeric' 
  | 'categorical' 
  | 'boolean' 
  | 'vector' 
  | 'embedding' 
  | 'timestamp';

export type FeatureStoreType = 'online' | 'offline' | 'both';

/**
 * Feature definition in the feature store
 */
export interface FeatureDefinition {
  name: string;
  version: string;
  entityType: 'player' | 'team' | 'match';
  featureType: FeatureType;
  storeType: FeatureStoreType;
  ttlSeconds: number | null;
  description: string;
  tags: string[];
  nullability: boolean;
  defaultValue: unknown;
  validationRules: Record<string, unknown>;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature value with provenance
 */
export interface FeatureValue {
  featureName: string;
  entityId: string;
  entityType: string;
  value: number | string | boolean | number[] | null;
  valueType: FeatureType;
  featureDefinitionVersion: string;
  computedAt: string;
  eventTimestamp: string | null;
  ingestionTimestamp: string;
  sourceSystem: string;
  sourceId: string | null;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Feature view (collection of features)
 */
export interface FeatureView {
  name: string;
  entityType: string;
  features: string[];
  materializeOnline: boolean;
  materializeOffline: boolean;
  refreshIntervalMinutes: number;
  lookbackWindowDays: number;
  description: string;
  owner: string;
  createdAt: string;
}

/**
 * Feature vector for ML inference
 */
export interface FeatureVector {
  entityId: string;
  entityType: string;
  timestamp: string;
  features: Record<string, unknown>;
  featureNames: string[];
  missingFeatures: string[];
  imputedFeatures: Record<string, unknown>;
}

/**
 * Online feature store response
 */
export interface OnlineFeatureResponse {
  entityId: string;
  entityType: string;
  features: Record<string, unknown>;
  lookupTimeMs: number;
  cacheHit: boolean;
  missingFeatures: string[];
}

// ============================================================================
// Forum Types
// ============================================================================

export interface ForumPost {
  id: number;
  userId: number | null;
  title: string;
  content: string;
  category: string | null;
  game: 'valorant' | 'cs2' | null;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
}

export interface ForumComment {
  id: number;
  postId: number;
  userId: number | null;
  content: string;
  createdAt: string;
}

export interface ForumFlag {
  id: number;
  postId: number;
  reporterUserId: number | null;
  reason: string | null;
  createdAt: string;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type WebSocketMessageType = 
  | 'MATCH_START'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'SCORE_UPDATE'
  | 'PLAYER_STATS_UPDATE'
  | 'ECONOMY_SNAPSHOT'
  | 'MATCH_END'
  | 'HEARTBEAT'
  | 'ERROR'
  | 'SUBSCRIBE'
  | 'UNSUBSCRIBE'
  | 'CHAT_MESSAGE';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  matchId: string;
  timestamp: string;
  payload: unknown;
}

export interface WebSocketSubscribeMessage {
  type: 'SUBSCRIBE';
  channels: string[];
}

export interface WebSocketChatMessage {
  type: 'CHAT_MESSAGE';
  channel: string;
  userId: string;
  content: string;
}

// ============================================================================
// Health/Status Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessCheckResponse {
  ready: boolean;
  checks: {
    database: boolean;
    cache?: boolean;
    mlService?: boolean;
  };
  timestamp: string;
}

export interface AnalyticsHealthResponse {
  status: string;
  calculators: {
    simrating: boolean;
    rar: boolean;
    grader: boolean;
  };
  availableRoles: string[];
}

// ============================================================================
// API Error Types
// ============================================================================

export interface APIError {
  detail: string;
  code?: string;
  field?: string;
}

export interface ValidationError extends APIError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  id: string;
  type: 'player' | 'team' | 'tournament' | 'match';
  name: string;
  description: string | null;
  game: 'valorant' | 'cs2' | null;
  score: number;
}

export interface SearchFilters {
  types?: ('player' | 'team' | 'tournament' | 'match')[];
  games?: ('valorant' | 'cs2')[];
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * API response wrapper
 */
export type APIResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: APIError;
};
