/**
 * Live Data Contracts — Frontend WebSocket Client
 * NJZ eSports Platform — Path A Distribution
 *
 * These are the contracts for real-time WebSocket messages consumed by:
 * - Web app (apps/web)
 * - Companion App (apps/companion)
 * - Browser Extension (apps/browser-extension)
 * - LiveStream Overlay (apps/overlay)
 *
 * SCHEMA CHANGE: Initial definition — 2026-03-27
 *
 * NOTE: Internal service contracts (PathALiveEvent etc.) are in tenet-protocol.ts.
 * These types are the simplified, frontend-optimized view.
 *
 * @see data/schemas/tenet-protocol.ts — Internal service contracts
 */

// Re-export the live event types from tenet-protocol for convenience
export type { PathALiveEvent, LiveEventType, MatchScorePayload, RoundUpdatePayload, MatchEndPayload } from './tenet-protocol';

// ─── WebSocket Connection ─────────────────────────────────────────────────────

export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'reconnecting';

export interface WebSocketState {
  status: WebSocketStatus;
  matchId: string | null;
  lastEventAt: number | null; // Unix ms timestamp
  reconnectAttempts: number;
  error: string | null;
}

// ─── Live Match View ──────────────────────────────────────────────────────────

/**
 * The current state of a live match as maintained by the frontend.
 * Assembled from streaming WebSocket events.
 */
export interface LiveMatchView {
  matchId: string;
  game: string;
  status: LiveMatchStatus;
  teams: [LiveTeamView, LiveTeamView];
  currentRound: number;
  half: 'first' | 'second' | 'overtime';
  /** Unix ms — last update received */
  lastUpdated: number;
  /** Source confidence (always null for live — live data is unverified) */
  confidence: null;
}

export type LiveMatchStatus =
  | 'upcoming'    // Match scheduled but not started
  | 'live'        // Match in progress
  | 'break'       // Between halves / overtimes
  | 'completed'   // Match finished
  | 'cancelled';  // Match cancelled

export interface LiveTeamView {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  score: number;
  /** Side for this half: attacker, defender */
  side?: 'attacker' | 'defender' | null;
}

// ─── Live Player Stats ────────────────────────────────────────────────────────

/**
 * Simplified per-player stats for live display.
 * Only includes what can be reliably derived from live API data.
 */
export interface LivePlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  /** Average Combat Score (Valorant) or Rating (CS2) — may be null if not available live */
  combatScore: number | null;
  isAlive: boolean;
}

// ─── Live Round Summary ───────────────────────────────────────────────────────

export interface LiveRoundSummary {
  roundNumber: number;
  winningTeamId: string;
  winCondition: string;
  /** Duration in seconds */
  duration: number;
  mvpPlayerId: string | null;
}

// ─── Live Economy Snapshot ────────────────────────────────────────────────────

/**
 * Economy state shown during the buy phase.
 * Derived from live API — lower accuracy than Path B legacy economy logs.
 */
export interface LiveEconomySnapshot {
  roundNumber: number;
  teamA: LiveTeamEconomy;
  teamB: LiveTeamEconomy;
}

export interface LiveTeamEconomy {
  teamId: string;
  totalSpent: number;
  buyType: 'full' | 'force' | 'eco' | 'unknown';
}

// ─── WebSocket Message Envelope ──────────────────────────────────────────────

/**
 * All WebSocket messages from the server arrive in this envelope.
 */
export interface WsMessage<T = unknown> {
  type: WsMessageType;
  matchId: string;
  timestamp: number; // Unix ms
  payload: T;
}

export type WsMessageType =
  | 'MATCH_START'
  | 'ROUND_START'
  | 'ROUND_END'
  | 'SCORE_UPDATE'
  | 'PLAYER_STATS_UPDATE'
  | 'ECONOMY_SNAPSHOT'
  | 'MATCH_END'
  | 'HEARTBEAT'
  | 'ERROR';

// Typed message constructors
export type WsMatchStartMessage = WsMessage<LiveMatchView>;
export type WsScoreUpdateMessage = WsMessage<{ teamA: number; teamB: number; round: number }>;
export type WsRoundEndMessage = WsMessage<LiveRoundSummary>;
export type WsPlayerStatsMessage = WsMessage<LivePlayerStats[]>;
export type WsEconomyMessage = WsMessage<LiveEconomySnapshot>;
export type WsMatchEndMessage = WsMessage<{ winnerId: string; finalScore: { teamA: number; teamB: number } }>;
export type WsHeartbeatMessage = WsMessage<{ serverTime: number }>;
