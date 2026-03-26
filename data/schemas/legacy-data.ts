/**
 * Legacy / Historical Data Contracts — Frontend API Client
 * NJZ eSports Platform — Path B Distribution
 *
 * These are the contracts for REST API responses from Path B (Static Truth Legacy)
 * endpoints. Data here has passed through TeneT Key.Links verification and carries
 * confidence scores.
 *
 * SCHEMA CHANGE: Initial definition — 2026-03-27
 *
 * Used by:
 * - SATOR hub (analytics, SimRating)
 * - ROTAS hub (leaderboards, raw stats)
 * - OPERA hub (tournament history)
 *
 * @see data/schemas/tenet-protocol.ts — Internal verification contracts
 */

// Re-export verification types needed on the frontend
export type { ConfidenceScore, VerificationStatus } from './tenet-protocol';

// ─── Paginated Response Wrapper ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  /** Null for non-verified endpoints (live data) */
  confidence: import('./tenet-protocol').ConfidenceScore | null;
  /** ISO 8601 */
  retrievedAt: string;
}

// ─── Verified Match ───────────────────────────────────────────────────────────

/**
 * A fully verified match record from the truth layer.
 * This is the frontend-facing shape — a subset of PathBLegacyRecord.
 */
export interface VerifiedMatchSummary {
  matchId: string;
  game: string;
  /** ISO 8601 */
  date: string;
  teamA: MatchTeamRef;
  teamB: MatchTeamRef;
  winner: string; // team ID
  finalScore: { teamA: number; teamB: number };
  totalRounds: number;
  /** Duration in seconds */
  duration: number;
  /** Confidence from TeneT verification */
  confidence: number; // 0.0 – 1.0
  verificationStatus: import('./tenet-protocol').VerificationStatus;
  /** True if per-round granular data is available */
  hasDetailedData: boolean;
  tournamentId: string | null;
  tournamentName: string | null;
}

export interface MatchTeamRef {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

// ─── Detailed Match (Round-by-Round) ─────────────────────────────────────────

/**
 * Full match detail including per-round data.
 * Only available when hasDetailedData = true.
 */
export interface VerifiedMatchDetail extends VerifiedMatchSummary {
  rounds: VerifiedRoundRecord[];
  economyLog: VerifiedEconomyEntry[];
  playerPerformances: PlayerMatchPerformance[];
  /** Only present if minimap data was captured and verified */
  minimapAvailable: boolean;
}

export interface VerifiedRoundRecord {
  roundNumber: number;
  winningTeamId: string;
  winCondition: string;
  /** Duration in seconds */
  duration: number;
  playerStats: VerifiedRoundPlayerStat[];
}

export interface VerifiedRoundPlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number | null;
  headshotRate: number | null;
  firstBloods: number;
  clutchAttempts: number;
  clutchWins: number;
  /** Agent name (Valorant) or primary weapon (CS2) */
  roleOrAgent: string | null;
}

export interface VerifiedEconomyEntry {
  roundNumber: number;
  teamA: VerifiedTeamEconomy;
  teamB: VerifiedTeamEconomy;
}

export interface VerifiedTeamEconomy {
  teamId: string;
  totalCredits: number;
  avgLoadoutValue: number;
  buyType: 'full_buy' | 'force_buy' | 'eco' | 'pistol';
}

// ─── Player Stats Aggregated ──────────────────────────────────────────────────

/**
 * Aggregated player stats across matches.
 * Used by SATOR (SimRating) and ROTAS (leaderboards).
 */
export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  teamId: string;
  matchId: string;
  game: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  acs: number | null;
  adr: number | null;
  headshotRate: number | null;
  firstBloods: number;
  clutchRate: number | null;
  /** SimRating v2 score for this performance */
  simRating: number | null;
  simRatingGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
}

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  teamId: string;
  game: string;
  /** Season or date range */
  period: string;
  matchCount: number;
  avgKd: number;
  avgAcs: number | null;
  avgAdr: number | null;
  avgHeadshotRate: number | null;
  avgSimRating: number | null;
  simRatingGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  /** Confidence across all matches in this period */
  periodConfidence: number;
}

// ─── Tournament Records ───────────────────────────────────────────────────────

export interface TournamentRecord {
  tournamentId: string;
  name: string;
  game: string;
  /** ISO 8601 */
  startDate: string;
  endDate: string | null;
  region: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'qualifier' | string;
  teamCount: number;
  matchCount: number;
  winnerId: string | null;
  winnerName: string | null;
  prizePool: number | null;
  currency: string | null;
}

// ─── SimRating ────────────────────────────────────────────────────────────────

export interface SimRatingEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  game: string;
  score: number; // 0–100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    kd: number;
    acs: number;
    headshotRate: number;
    firstBloods: number;
    clutchRate: number;
  };
  /** Number of matches this rating is based on */
  sampleSize: number;
  confidence: number;
  /** 'v1' = synthetic/fallback, 'v2' = real stats */
  version: 'v1' | 'v2';
  lastUpdated: string; // ISO 8601
}
