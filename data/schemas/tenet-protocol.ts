/**
 * TeneT Protocol — Canonical Type Specification
 * NJZ eSports Platform
 *
 * Defines the data verification and routing contracts for the TeneT Key.Links
 * verification bridge. This is the brokerage and regulation layer between raw
 * multi-source data and the two distribution paths (Live / Static Truth Legacy).
 *
 * SCHEMA CHANGE: Initial definition — 2026-03-27
 *
 * Hierarchy:
 *   TeNeT Portal → TeNET Network Directory → World-Port → GameNodeID
 *   → tenet (lowercase: network channels/DB directory)
 *   → TeneT Key.Links (verification bridge)
 *   → Path A (Live) | Path B (Static Truth Legacy)
 *
 * @see docs/architecture/TENET_TOPOLOGY.md
 * @see data/schemas/GameNodeID.ts for GameNodeID types
 */

// ─── Data Source Trust Levels ─────────────────────────────────────────────────

/**
 * Trust level assigned to each data ingestion source.
 * Used by TeneT Key.Links when computing consensus confidence.
 */
export enum TrustLevel {
  /** Official API data from game publisher or Pandascore */
  HIGH = 'HIGH',
  /** Video analysis (computer vision), Liquidpedia, manual review */
  MEDIUM = 'MEDIUM',
  /** Scraped community sites: VLR.gg, fan forums */
  LOW = 'LOW',
  /** Unverified user submission */
  UNVERIFIED = 'UNVERIFIED',
}

export type DataSourceType =
  | 'pandascore_api'      // Pandascore official API
  | 'riot_official_api'   // Riot Games official API
  | 'video_analysis'      // Automated computer vision on match video
  | 'video_manual_review' // Human-reviewed video grading
  | 'minimap_analysis'    // Computer vision on minimap frames
  | 'livestream_grading'  // Grade assigned during/after livestream review
  | 'vlr_scrape'          // Scraped from VLR.gg
  | 'liquidpedia_scrape'  // Scraped from Liquidpedia
  | 'youtube_extract'     // Data extracted from YouTube video descriptions/streams
  | 'fan_forum'           // Fan-submitted data from community forums
  | 'manual_entry'        // Manually entered by platform admin
  | string;

/** Maps each DataSourceType to its default TrustLevel */
export const DATA_SOURCE_TRUST: Record<DataSourceType, TrustLevel> = {
  pandascore_api: TrustLevel.HIGH,
  riot_official_api: TrustLevel.HIGH,
  video_analysis: TrustLevel.MEDIUM,
  video_manual_review: TrustLevel.HIGH,
  minimap_analysis: TrustLevel.MEDIUM,
  livestream_grading: TrustLevel.MEDIUM,
  vlr_scrape: TrustLevel.LOW,
  liquidpedia_scrape: TrustLevel.MEDIUM,
  youtube_extract: TrustLevel.LOW,
  fan_forum: TrustLevel.LOW,
  manual_entry: TrustLevel.HIGH,
};

// ─── Confidence Scoring ───────────────────────────────────────────────────────

/**
 * Confidence score output from TeneT Key.Links verification.
 * Ranges 0.0 (no confidence) to 1.0 (fully verified).
 */
export interface ConfidenceScore {
  /** Aggregate confidence (0.0 – 1.0) */
  value: number;
  /** Number of independent sources that contributed */
  sourceCount: number;
  /** Breakdown by source */
  bySource: ConfidenceSourceContribution[];
  /** Were any discrepancies detected across sources? */
  hasConflicts: boolean;
  /** Fields where sources disagreed */
  conflictFields: string[];
  /** ISO 8601 — when this confidence was computed */
  computedAt: string;
}

export interface ConfidenceSourceContribution {
  sourceType: DataSourceType;
  trustLevel: TrustLevel;
  /** Weight applied to this source in the consensus calculation */
  weight: number;
  /** What confidence this source alone would yield (0.0 – 1.0) */
  sourceConfidence: number;
  /** ISO 8601 — when this data point was ingested */
  ingestedAt: string;
}

// ─── Verification Actions ─────────────────────────────────────────────────────

export type VerificationStatus =
  | 'ACCEPTED'       // confidence >= 0.90, stored in truth layer
  | 'FLAGGED'        // confidence 0.70–0.89, queued for review
  | 'REJECTED'       // confidence < 0.70, not stored
  | 'PENDING'        // verification in progress
  | 'MANUAL_OVERRIDE'; // human reviewer overrode automated result

export interface TenetVerificationResult {
  /** ID of the entity being verified (match, player stat, etc.) */
  entityId: string;
  entityType: 'match' | 'player_stat' | 'team_roster' | 'tournament' | string;
  /** Game this entity belongs to */
  game: string;
  /** The TeneT Key used to look up this entity's schema requirements */
  tenetKey: string;
  status: VerificationStatus;
  confidence: ConfidenceScore;
  /** Raw data from each source, keyed by DataSourceType */
  sourcesContributed: DataSourceType[];
  /** If FLAGGED or REJECTED, the specific reasons */
  rejectionReasons?: string[];
  /** If MANUAL_OVERRIDE, who reviewed and the decision */
  manualReview?: ManualReviewRecord;
  /** ISO 8601 */
  verifiedAt: string;
  /** Which distribution path this result routes to */
  distributionPath: 'PATH_A_LIVE' | 'PATH_B_LEGACY' | 'BOTH' | 'NONE';
}

export interface ManualReviewRecord {
  reviewerId: string;
  decision: 'ACCEPT' | 'REJECT' | 'NEEDS_MORE_DATA';
  notes: string;
  reviewedAt: string;
}

// ─── Distribution Paths ───────────────────────────────────────────────────────

/**
 * Path A — Live / Real-time
 * Low latency, simple schemas, eventual accuracy.
 * Feeds: MatchLIVE Score Updates, Round Updates, Companion App, Browser Extension
 */
export interface PathALiveEvent {
  eventType: LiveEventType;
  matchId: string;
  game: string;
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  payload: MatchScorePayload | RoundUpdatePayload | MatchEndPayload;
}

export type LiveEventType =
  | 'MATCH_START'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'SCORE_UPDATE'
  | 'MATCH_END'
  | 'PLAYER_ELIMINATED'
  | 'OBJECTIVE_CAPTURED';

export interface MatchScorePayload {
  teamA: { id: string; name: string; score: number };
  teamB: { id: string; name: string; score: number };
  currentRound: number;
  half: 'first' | 'second' | 'overtime';
}

export interface RoundUpdatePayload {
  roundNumber: number;
  roundResult: 'teamA_win' | 'teamB_win';
  winCondition: string; // e.g., 'elimination', 'spike_detonated', 'spike_defused'
  duration: number; // seconds
}

export interface MatchEndPayload {
  winnerId: string;
  finalScore: { teamA: number; teamB: number };
  totalRounds: number;
  duration: number; // seconds
}

/**
 * Path B — Static Truth Legacy
 * High granularity, authoritative, asynchronous.
 * Feeds: Historical Statistics, XSimulation training, Comprehensive analytics
 */
export interface PathBLegacyRecord {
  matchId: string;
  game: string;
  /** TeneT verification result that certified this data */
  verificationId: string;
  confidence: ConfidenceScore;
  /** Full round-by-round granularity */
  rounds: LegacyRoundRecord[];
  /** Economy state per round */
  economyLog: EconomyLogEntry[];
  /** Minimap frames if available */
  minimapFrames?: MinimapFrame[];
  /** Video review grades if available */
  videoReviews?: VideoReviewGrade[];
  /** ISO 8601 — when this record entered the truth layer */
  truthLayerAt: string;
}

export interface LegacyRoundRecord {
  roundNumber: number;
  startTime: string; // ISO 8601
  endTime: string;
  winningTeamId: string;
  winCondition: string;
  /** Per-player stats for this round */
  playerStats: LegacyRoundPlayerStat[];
}

export interface LegacyRoundPlayerStat {
  playerId: string;
  kills: number;
  deaths: number;
  assists: number;
  /** Agent (Valorant) or role (CS2) */
  role?: string;
  utilityUsed?: number;
  firstBloods?: number;
  clutchAttempts?: number;
  clutchWins?: number;
  adr?: number; // average damage per round
  headshotRate?: number;
}

export interface EconomyLogEntry {
  roundNumber: number;
  phase: 'buy' | 'active' | 'end';
  teamA: TeamEconomyState;
  teamB: TeamEconomyState;
}

export interface TeamEconomyState {
  teamId: string;
  totalCredits: number;
  avgLoadoutValue: number;
  fullBuy: boolean;
  forcesBuy: boolean;
  eco: boolean;
}

export interface MinimapFrame {
  roundNumber: number;
  /** Seconds since round start */
  tick: number;
  /** Player positions at this tick */
  positions: PlayerPositionSnapshot[];
}

export interface PlayerPositionSnapshot {
  playerId: string;
  /** Normalized coordinates (0.0 – 1.0) relative to map bounds */
  x: number;
  y: number;
  isAlive: boolean;
  /** If extracted from video, confidence of detection */
  detectionConfidence?: number;
}

export interface VideoReviewGrade {
  reviewType: 'automated' | 'manual';
  reviewerId?: string;
  /** What aspect was reviewed */
  scope: 'full_match' | 'round' | 'player' | 'clip';
  roundNumber?: number;
  playerId?: string;
  grades: {
    metric: string;
    score: number; // 0–100
    notes?: string;
  }[];
  reviewedAt: string;
}

// ─── TeneT Key.Links Bridge Interface ────────────────────────────────────────

/**
 * The interface contract for the TeneT Key.Links verification bridge service.
 * Services implementing this interface must be found at services/tenet-verification/.
 */
export interface ITenetKeyLinksService {
  /**
   * Submit raw data from one or more sources for verification.
   * Returns a verification result with routing decision.
   */
  verify(request: TenetVerificationRequest): Promise<TenetVerificationResult>;

  /**
   * Retrieve the current verification status for an entity.
   */
  getStatus(entityId: string, entityType: string): Promise<TenetVerificationResult | null>;

  /**
   * List entities currently in the manual review queue.
   */
  getReviewQueue(game?: string): Promise<TenetVerificationResult[]>;

  /**
   * Submit a manual review decision for a flagged entity.
   */
  submitManualReview(
    entityId: string,
    review: ManualReviewRecord
  ): Promise<TenetVerificationResult>;
}

export interface TenetVerificationRequest {
  entityId: string;
  entityType: string;
  game: string;
  tenetKey: string;
  /** Data payloads from each contributing source */
  sourceData: SourceDataPayload[];
}

export interface SourceDataPayload {
  sourceType: DataSourceType;
  ingestedAt: string;
  /** Raw data as received from the source */
  rawData: Record<string, unknown>;
}

// ─── tenet (lowercase) — Network Channel Types ───────────────────────────────

/**
 * tenet (lowercase) represents the network channels and DB directory
 * used to connect and map the base of the TENETs. These are the indexed
 * directory keys that manage routing between data sources and hubs.
 */
export interface TenetDirectoryEntry {
  /** Unique key for this directory entry */
  key: string;
  /** Which GameNodeID this entry indexes */
  gameNodeId: string;
  /** The game this entry belongs to */
  game: string;
  /** Which hub quarters this entry maps to */
  quarters: ('SATOR' | 'AREPO' | 'OPERA' | 'ROTAS')[];
  /** Data tier requirements for this entry */
  dataTierRequirements: DataTierRequirement[];
  /** Schema version for this entry type */
  schemaVersion: string;
}

export interface DataTierRequirement {
  quarter: 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';
  /** Minimum confidence required for data to be shown in this quarter */
  minimumConfidence: number;
  /** Which distribution path feeds this quarter */
  acceptedPaths: ('PATH_A_LIVE' | 'PATH_B_LEGACY')[];
  /** Required data sources (at least one must be present) */
  requiredSources: DataSourceType[];
}
