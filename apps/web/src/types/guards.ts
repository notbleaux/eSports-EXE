/** [Ver001.000]
 * Type Guards — NJZiteGeisTe Platform
 * 
 * Runtime type checking utilities for API responses and complex types.
 * 
 * @module types/guards
 */

import type {
  Tournament,
  MatchDetail,
  PlayerMatchStats,
  Player,
  Team,
  SimRatingWithMeta,
  RARWithGrade,
  ForumPost,
  ForumComment,
  FeatureValue,
  WebSocketMessage,
  PlayerTeam,
  AgentRole,
  TournamentStatus,
  MatchStatus,
  FeatureType,
} from './api';

// ============================================================================
// Entity Type Guards
// ============================================================================

/**
 * Type guard for Player
 */
export function isPlayer(obj: unknown): obj is Player {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'number' &&
    typeof p.pandascoreId === 'number' &&
    typeof p.name === 'string' &&
    typeof p.slug === 'string' &&
    (p.nationality === null || typeof p.nationality === 'string') &&
    (p.game === 'valorant' || p.game === 'cs2')
  );
}

/**
 * Type guard for Team
 */
export function isTeam(obj: unknown): obj is Team {
  if (typeof obj !== 'object' || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === 'number' &&
    typeof t.pandascoreId === 'number' &&
    typeof t.name === 'string' &&
    typeof t.slug === 'string' &&
    (t.acronym === null || typeof t.acronym === 'string') &&
    (t.game === 'valorant' || t.game === 'cs2')
  );
}

/**
 * Type guard for Tournament
 */
export function isTournament(obj: unknown): obj is Tournament {
  if (typeof obj !== 'object' || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    (t.game === 'valorant' || t.game === 'cs2') &&
    isValidTournamentStatus(t.status) &&
    typeof t.startDate === 'string' &&
    typeof t.createdAt === 'string'
  );
}

/**
 * Type guard for MatchDetail
 */
export function isMatchDetail(obj: unknown): obj is MatchDetail {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.team1 === 'object' &&
    typeof m.team2 === 'object' &&
    isValidMatchStatus(m.status)
  );
}

/**
 * Type guard for PlayerMatchStats
 */
export function isPlayerMatchStats(obj: unknown): obj is PlayerMatchStats {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.playerId === 'string' &&
    typeof s.playerName === 'string' &&
    typeof s.teamId === 'string' &&
    isValidPlayerTeam(s.team) &&
    typeof s.kills === 'number' &&
    typeof s.deaths === 'number' &&
    typeof s.assists === 'number'
  );
}

// ============================================================================
// Analytics Type Guards
// ============================================================================

/**
 * Type guard for SimRatingWithMeta
 */
export function isSimRatingWithMeta(obj: unknown): obj is SimRatingWithMeta {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.playerId === 'string' &&
    typeof s.score === 'number' &&
    typeof s.components === 'object' &&
    s.components !== null &&
    isValidSimRatingGrade(s.grade) &&
    (s.version === 'v1' || s.version === 'v2')
  );
}

/**
 * Type guard for RARWithGrade
 */
export function isRARWithGrade(obj: unknown): obj is RARWithGrade {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.role === 'string' &&
    typeof r.value === 'number' &&
    typeof r.baseline === 'number' &&
    typeof r.rarScore === 'number' &&
    typeof r.investmentGrade === 'string' &&
    isValidRiskLevel(r.riskLevel)
  );
}

// ============================================================================
// Forum Type Guards
// ============================================================================

/**
 * Type guard for ForumPost
 */
export function isForumPost(obj: unknown): obj is ForumPost {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'number' &&
    typeof p.title === 'string' &&
    typeof p.content === 'string' &&
    typeof p.flagged === 'boolean' &&
    typeof p.createdAt === 'string'
  );
}

/**
 * Type guard for ForumComment
 */
export function isForumComment(obj: unknown): obj is ForumComment {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === 'number' &&
    typeof c.postId === 'number' &&
    typeof c.content === 'string' &&
    typeof c.createdAt === 'string'
  );
}

// ============================================================================
// Feature Store Type Guards
// ============================================================================

/**
 * Type guard for FeatureValue
 */
export function isFeatureValue(obj: unknown): obj is FeatureValue {
  if (typeof obj !== 'object' || obj === null) return false;
  const f = obj as Record<string, unknown>;
  return (
    typeof f.featureName === 'string' &&
    typeof f.entityId === 'string' &&
    typeof f.entityType === 'string' &&
    isValidFeatureType(f.valueType) &&
    typeof f.computedAt === 'string' &&
    typeof f.isValid === 'boolean'
  );
}

// ============================================================================
// WebSocket Type Guards
// ============================================================================

/**
 * Type guard for WebSocketMessage
 */
export function isWebSocketMessage(obj: unknown): obj is WebSocketMessage {
  if (typeof obj !== 'object' || obj === null) return false;
  const w = obj as Record<string, unknown>;
  return (
    typeof w.type === 'string' &&
    typeof w.matchId === 'string' &&
    typeof w.timestamp === 'string'
  );
}

// ============================================================================
// Enum Validation Helpers
// ============================================================================

const VALID_TOURNAMENT_STATUSES: TournamentStatus[] = [
  'draft',
  'registration',
  'active',
  'completed',
  'cancelled',
];

const VALID_MATCH_STATUSES: MatchStatus[] = [
  'scheduled',
  'live',
  'completed',
  'cancelled',
  'postponed',
];

const VALID_PLAYER_TEAMS: PlayerTeam[] = ['team_a', 'team_b'];

const VALID_AGENT_ROLES: AgentRole[] = [
  'duelist',
  'initiator',
  'controller',
  'sentinel',
  'flex',
];

const VALID_FEATURE_TYPES: FeatureType[] = [
  'numeric',
  'categorical',
  'boolean',
  'vector',
  'embedding',
  'timestamp',
];

const VALID_SIM_RATING_GRADES = ['S', 'A', 'B', 'C', 'D', 'F'] as const;

const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;

export function isValidTournamentStatus(status: unknown): status is TournamentStatus {
  return typeof status === 'string' && VALID_TOURNAMENT_STATUSES.includes(status as TournamentStatus);
}

export function isValidMatchStatus(status: unknown): status is MatchStatus {
  return typeof status === 'string' && VALID_MATCH_STATUSES.includes(status as MatchStatus);
}

export function isValidPlayerTeam(team: unknown): team is PlayerTeam {
  return typeof team === 'string' && VALID_PLAYER_TEAMS.includes(team as PlayerTeam);
}

export function isValidAgentRole(role: unknown): role is AgentRole {
  return typeof role === 'string' && VALID_AGENT_ROLES.includes(role as AgentRole);
}

export function isValidFeatureType(type: unknown): type is FeatureType {
  return typeof type === 'string' && VALID_FEATURE_TYPES.includes(type as FeatureType);
}

export function isValidSimRatingGrade(grade: unknown): boolean {
  return typeof grade === 'string' && VALID_SIM_RATING_GRADES.includes(grade as typeof VALID_SIM_RATING_GRADES[number]);
}

export function isValidRiskLevel(level: unknown): level is 'low' | 'medium' | 'high' {
  return typeof level === 'string' && VALID_RISK_LEVELS.includes(level as typeof VALID_RISK_LEVELS[number]);
}

// ============================================================================
// Array Type Guards
// ============================================================================

/**
 * Type guard for array of Players
 */
export function isPlayerArray(arr: unknown): arr is Player[] {
  return Array.isArray(arr) && arr.every(isPlayer);
}

/**
 * Type guard for array of Teams
 */
export function isTeamArray(arr: unknown): arr is Team[] {
  return Array.isArray(arr) && arr.every(isTeam);
}

/**
 * Type guard for array of Tournaments
 */
export function isTournamentArray(arr: unknown): arr is Tournament[] {
  return Array.isArray(arr) && arr.every(isTournament);
}

/**
 * Type guard for array of MatchDetails
 */
export function isMatchDetailArray(arr: unknown): arr is MatchDetail[] {
  return Array.isArray(arr) && arr.every(isMatchDetail);
}

/**
 * Type guard for array of PlayerMatchStats
 */
export function isPlayerMatchStatsArray(arr: unknown): arr is PlayerMatchStats[] {
  return Array.isArray(arr) && arr.every(isPlayerMatchStats);
}

// ============================================================================
// Primitive Type Guards
// ============================================================================

/**
 * Type guard for non-null value
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Type guard for valid date string (ISO 8601)
 */
export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard for valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================================================
// API Response Guards
// ============================================================================

interface APIErrorResponse {
  detail: string;
  code?: string;
}

/**
 * Check if response is an API error
 */
export function isAPIError(response: unknown): response is APIErrorResponse {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as Record<string, unknown>;
  return typeof r.detail === 'string';
}

/**
 * Assert that value is of expected type (throws if not)
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message || `Type assertion failed`);
  }
}

/**
 * Narrow type with guard, returning default if fails
 */
export function narrowOrDefault<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  defaultValue: T
): T {
  return guard(value) ? value : defaultValue;
}
