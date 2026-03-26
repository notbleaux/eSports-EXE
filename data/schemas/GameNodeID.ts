/**
 * GameNodeID — Canonical Type Specification
 * NJZ eSports Platform
 *
 * This is the base unit of the TENET hierarchy. Every World-Port (game-specific entry
 * point) produces GameNodeIDs. Each GameNodeID carries a standardized 2×2 Quarter GRID
 * containing the four WorldTree hubs: SATOR, AREPO, OPERA, ROTAS.
 *
 * SCHEMA CHANGE: Initial definition — 2026-03-27
 *
 * @see docs/architecture/TENET_TOPOLOGY.md for full hierarchy documentation
 * @see .agents/SCHEMA_REGISTRY.md for all registered types
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type SupportedGame = 'valorant' | 'cs2' | 'lol' | 'r6' | 'apex' | string;

export type QuarterKey = 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';

export type TeZeTRoute = '/analytics' | '/community' | '/pro-scene' | '/stats';

// ─── Quarter GRID ─────────────────────────────────────────────────────────────

/**
 * The four WorldTree hubs available within every GameNodeID.
 * These appear as a 2×2 grid in the UI.
 */
export interface QuarterGrid {
  SATOR: QuarterConfig; // Advanced Analytics hub
  AREPO: QuarterConfig; // Community hub
  OPERA: QuarterConfig; // Pro eSports / Pro Scene hub
  ROTAS: QuarterConfig; // Stats Reference / Simulation hub
}

export interface QuarterConfig {
  key: QuarterKey;
  route: TeZeTRoute;
  /** Whether this quarter is available for the given game */
  enabled: boolean;
  /** Game-specific overrides for this quarter's content */
  gameVariant?: GameQuarterVariant;
}

/** Per-game customizations layered onto the base QuarterConfig */
export interface GameQuarterVariant {
  game: SupportedGame;
  /** Label to show in UI instead of the default hub name */
  displayLabel?: string;
  /** Additional data sources enabled for this game × quarter combination */
  dataSources?: string[];
  /** TeZeT sub-branches available within this quarter for this game */
  teZeTBranches?: TeZeTBranch[];
}

export interface TeZeTBranch {
  id: string;
  label: string;
  /** Route fragment appended to the quarter route */
  subroute: string;
  /** Whether this branch requires authentication */
  requiresAuth?: boolean;
}

// ─── Base GameNodeID ──────────────────────────────────────────────────────────

/**
 * The base unit of the TENET hierarchy.
 *
 * A GameNodeID represents a specific indexing node within a World-Port.
 * It carries the Quarter GRID and a TeneT Key for verification bridge access.
 */
export interface BaseGameNodeID {
  /** Unique identifier for this node */
  id: string;
  /** Human-readable slug for routing */
  slug: string;
  /** The game this node belongs to */
  game: SupportedGame;
  /** The World-Port this node lives within */
  worldPortId: string;
  /** TeneT verification key — links to the TeneT Key.Links bridge */
  tenetKey: string;
  /** The standardized 2×2 Quarter GRID for this node */
  quarterGrid: QuarterGrid;
  /** ISO 8601 — when this node was first indexed */
  indexedAt: string;
  /** ISO 8601 — last verification timestamp */
  lastVerifiedAt: string | null;
  /** Confidence score from the last TeneT verification (0.0 – 1.0) */
  verificationConfidence: number | null;
}

// ─── Game-Specific GameNodeID Variants ───────────────────────────────────────

/**
 * Valorant-specific GameNodeID.
 * Adds Valorant economy, agent data, and map context.
 */
export interface GameNodeIDValorant extends BaseGameNodeID {
  game: 'valorant';
  /** Valorant-specific extensions */
  valorant: {
    mapId: string;
    mapName: string;
    agentPool: string[]; // agent UUIDs
    economySystem: ValorantEconomy;
    hasSpikeData: boolean;
  };
}

export interface ValorantEconomy {
  /** Starting credits per half */
  startingCredits: number;
  /** Bonus per round loss */
  lossBonus: number[];
  /** Weapon tier price bands */
  weaponTiers: {
    pistol: [number, number];
    rifle: [number, number];
    sniper: [number, number];
    heavy: [number, number];
  };
}

/**
 * CS2-specific GameNodeID.
 * Adds CS2 economy, weapon data, and map pool context.
 */
export interface GameNodeIDCS2 extends BaseGameNodeID {
  game: 'cs2';
  cs2: {
    mapId: string;
    mapName: string;
    weaponPool: string[];
    economySystem: CS2Economy;
    hasFlashbangData: boolean;
    hasUtilityData: boolean;
  };
}

export interface CS2Economy {
  startingMoney: number;
  maxMoney: number;
  lossBonus: number[];
  weaponTiers: {
    pistol: [number, number];
    mid: [number, number];
    rifle: [number, number];
  };
}

/** Union of all concrete GameNodeID types */
export type GameNodeID = GameNodeIDValorant | GameNodeIDCS2 | BaseGameNodeID;

/** Type guard: is this a Valorant GameNodeID? */
export function isValorantNode(node: GameNodeID): node is GameNodeIDValorant {
  return node.game === 'valorant';
}

/** Type guard: is this a CS2 GameNodeID? */
export function isCS2Node(node: GameNodeID): node is GameNodeIDCS2 {
  return node.game === 'cs2';
}

// ─── World-Port ───────────────────────────────────────────────────────────────

/**
 * A World-Port is the game-specific entry point within the TeNET network.
 * It is the parent of all GameNodeIDs for a given game.
 *
 * URL pattern: /<game> (e.g., /valorant, /cs2)
 */
export interface WorldPort {
  id: string;
  game: SupportedGame;
  /** Display name (e.g., "VALORANT", "Counter-Strike 2") */
  displayName: string;
  /** URL segment (e.g., "valorant", "cs2") */
  routeSegment: string;
  /** Whether this World-Port is currently active and accessible */
  isActive: boolean;
  /** ISO 8601 — when this World-Port was initialized */
  launchedAt: string | null;
  /** Default QuarterGrid configuration for all nodes in this World-Port */
  defaultQuarterGrid: QuarterGrid;
  /** Total GameNodeIDs indexed under this World-Port */
  nodeCount: number;
}

// ─── TeZeT ───────────────────────────────────────────────────────────────────

/**
 * TeZeT is the World-Tree within each Quarter.
 * It represents the hub-specific composition or individual focus
 * within a particular World-Port + Quarter combination.
 *
 * URL pattern: /<game>/<quarter>/<tezet-branch>
 * Example:     /valorant/analytics/simrating
 */
export interface TeZeT {
  id: string;
  gameNodeId: string; // references BaseGameNodeID.id
  quarter: QuarterKey;
  branch: TeZeTBranch;
  /** The specific data view or feature this TeZeT presents */
  contentType: TeZeTContentType;
  /** Whether real-time data is available at this branch */
  hasLiveData: boolean;
  /** Whether legacy/historical data is available at this branch */
  hasLegacyData: boolean;
}

export type TeZeTContentType =
  | 'simrating'        // SATOR: SimRating analytics
  | 'player-compare'   // SATOR: Player comparison
  | 'map-analysis'     // SATOR: Map-specific analysis
  | 'xsimulation'      // SATOR/ROTAS: XSim what-if
  | 'leaderboard'      // ROTAS: Stats leaderboard
  | 'raw-stats'        // ROTAS: Raw stat tables
  | 'match-history'    // ROTAS: Historical matches
  | 'forum'            // AREPO: Discussion forum
  | 'player-follows'   // AREPO: Followed players feed
  | 'community-picks'  // AREPO: Community predictions
  | 'tournament'       // OPERA: Tournament brackets
  | 'pro-roster'       // OPERA: Professional team rosters
  | 'live-match'       // OPERA: Live match feed
  | 'calendar'         // OPERA: Event calendar
  | string;
