/**
 * [Ver002.000]
 * NJZiteGeisTe Platform — Shared Types
 * =====================================
 * Root re-export for @sator/types package.
 * Core types shared across all frontend hubs and backend services.
 */

export * from './help'; // Re-export existing help/expertise/knowledge-graph types

// ─── Game Types ────────────────────────────────────────────
export type Game = 'valorant' | 'cs2';

export type HubId = 'sator' | 'rotas' | 'opera' | 'arepo' | 'tenet';

export type UserFacingRoute =
  | '/analytics'
  | '/stats'
  | '/pro-scene'
  | '/community'
  | '/hubs'
  | '/valorant'
  | '/cs2';

// ─── Player Types ──────────────────────────────────────────
export interface Player {
  id: string;
  handle: string;
  realName?: string;
  teamId?: string;
  game: Game;
  role?: string;
  nationality?: string;
  imageUrl?: string;
}

// ─── Team Types ────────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  shortName: string;
  game: Game;
  region?: string;
  logoUrl?: string;
}

// ─── Match Types ───────────────────────────────────────────
export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface Match {
  id: string;
  game: Game;
  status: MatchStatus;
  teamA: Team;
  teamB: Team;
  scheduledAt: string;
  completedAt?: string;
  winnerId?: string;
}

// ─── Analytics Types (SATOR) ───────────────────────────────
export interface SimRating {
  playerId: string;
  rating: number;
  confidence: number;
  lastUpdated: string;
}

// ─── API Response Types ────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
