/**
 * Normalized Replay Schema
 * Game-agnostic replay format for Valorant and CS2
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-A
 * Team: Replay 2.0 Core (TL-S2)
 */

// ============================================================================
// Schema Version
// ============================================================================

export const REPLAY_SCHEMA_VERSION = '1.0.0';

// ============================================================================
// Core Types
// ============================================================================

export type GameType = 'valorant' | 'cs2';

export type TeamSide = 'attacker' | 'defender' | 'team_a' | 'team_b' | 'spectator';

export type RoundOutcome = 
  | 'elimination' 
  | 'bomb_exploded' 
  | 'bomb_defused' 
  | 'time_expired' 
  | 'defuse_prevented'
  | 'surrender'
  | 'draw';

export type WeaponCategory = 
  | 'sidearm' 
  | 'smg' 
  | 'shotgun' 
  | 'rifle' 
  | 'sniper' 
  | 'machine_gun' 
  | 'melee' 
  | 'utility';

export type AgentRole = 
  | 'duelist' 
  | 'initiator' 
  | 'controller' 
  | 'sentinel' 
  | '';

export type AbilityType = 
  | 'basic' 
  | 'signature' 
  | 'ultimate' 
  | 'grenade' 
  | 'flash' 
  | 'smoke' 
  | 'molly' 
  | 'decoy';

// ============================================================================
// Spatial Types
// ============================================================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

export interface Zone {
  id: string;
  name: string;
  type: 'bombsite' | 'spawn' | 'mid' | 'connector' | 'other';
  bounds: BoundingBox;
}

// ============================================================================
// Player Types
// ============================================================================

export interface ReplayPlayer {
  id: string;
  name: string;
  teamId: string;
  teamSide: TeamSide;
  agent?: string; // Valorant agent name or CS2 player model
  role?: AgentRole;
  isBot: boolean;
  stats: PlayerMatchStats;
}

export interface PlayerMatchStats {
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageReceived: number;
  headshots: number;
  roundsPlayed: number;
  score: number;
}

export interface PlayerState {
  playerId: string;
  timestamp: number;
  position: Position3D;
  rotation: Position3D; // pitch, yaw, roll
  velocity: Velocity;
  health: number;
  shield: number;
  armor: number;
  isAlive: boolean;
  isSpotted: boolean;
  weaponId: string;
  ammoInMag: number;
  ammoInReserve: number;
  abilities: AbilityState[];
  money: number;
  equipment: string[];
}

export interface AbilityState {
  id: string;
  name: string;
  type: AbilityType;
  charges: number;
  maxCharges: number;
  isReady: boolean;
  cooldownRemaining: number;
}

// ============================================================================
// Team Types
// ============================================================================

export interface Team {
  id: string;
  name: string;
  side: TeamSide;
  score: number;
  money: number;
  playerIds: string[];
  timeoutsRemaining: number;
}

// ============================================================================
// Round Types
// ============================================================================

export interface Round {
  roundNumber: number;
  winningSide: TeamSide;
  outcome: RoundOutcome;
  startTime: number;
  endTime: number;
  duration: number;
  teamAScore: number;
  teamBScore: number;
  events: GameEvent[];
  playerStates: PlayerState[];
  economy: EconomySnapshot;
}

export interface EconomySnapshot {
  teamA: TeamEconomy;
  teamB: TeamEconomy;
}

export interface TeamEconomy {
  totalMoney: number;
  loadoutValues: number[];
  weapons: string[];
}

// ============================================================================
// Event Types
// ============================================================================

export type EventType = 
  | 'kill'
  | 'assist'
  | 'damage'
  | 'bomb_plant'
  | 'bomb_defuse'
  | 'bomb_explode'
  | 'round_start'
  | 'round_end'
  | 'ability_use'
  | 'ability_damage'
  | 'weapon_fire'
  | 'weapon_reload'
  | 'weapon_pickup'
  | 'weapon_drop'
  | 'player_spawn'
  | 'player_death'
  | 'chat_message'
  | 'buy'
  | 'freeze_end';

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: number;
  roundNumber: number;
  tick?: number;
}

export interface KillEvent extends BaseEvent {
  type: 'kill';
  killerId: string;
  victimId: string;
  assisterIds: string[];
  weaponId: string;
  isHeadshot: boolean;
  isWallbang: boolean;
  isFlashed: boolean;
  isTrade: boolean;
  position: Position3D;
  victimPosition: Position3D;
}

export interface DamageEvent extends BaseEvent {
  type: 'damage';
  attackerId: string;
  victimId: string;
  damage: number;
  weaponId: string;
  isHeadshot: boolean;
  isFriendlyFire: boolean;
  hitGroup: 'head' | 'chest' | 'stomach' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
}

export interface BombPlantEvent extends BaseEvent {
  type: 'bomb_plant';
  playerId: string;
  site: 'A' | 'B' | 'C';
  position: Position3D;
  plantTime: number;
}

export interface BombDefuseEvent extends BaseEvent {
  type: 'bomb_defuse';
  playerId: string;
  site: 'A' | 'B' | 'C';
  position: Position3D;
  defuseTime: number;
  wasKitUsed: boolean;
  defuseProgress: number; // 0-1
}

export interface BombExplodeEvent extends BaseEvent {
  type: 'bomb_explode';
  site: 'A' | 'B' | 'C';
  position: Position3D;
}

export interface RoundStartEvent extends BaseEvent {
  type: 'round_start';
  roundNumber: number;
  teamASide: TeamSide;
  teamBSide: TeamSide;
}

export interface RoundEndEvent extends BaseEvent {
  type: 'round_end';
  roundNumber: number;
  winningSide: TeamSide;
  outcome: RoundOutcome;
  teamAScore: number;
  teamBScore: number;
}

export interface AbilityUseEvent extends BaseEvent {
  type: 'ability_use';
  playerId: string;
  abilityId: string;
  abilityName: string;
  abilityType: AbilityType;
  position: Position3D;
  targetPosition?: Position3D;
}

export interface WeaponFireEvent extends BaseEvent {
  type: 'weapon_fire';
  playerId: string;
  weaponId: string;
  position: Position3D;
  aimDirection: Position3D;
}

export interface BuyEvent extends BaseEvent {
  type: 'buy';
  playerId: string;
  weaponId: string;
  cost: number;
  remainingMoney: number;
}

export type GameEvent = 
  | KillEvent 
  | DamageEvent 
  | BombPlantEvent 
  | BombDefuseEvent 
  | BombExplodeEvent
  | RoundStartEvent 
  | RoundEndEvent 
  | AbilityUseEvent 
  | WeaponFireEvent
  | BuyEvent
  | BaseEvent;

// ============================================================================
// Replay Types
// ============================================================================

export interface Replay {
  schemaVersion: string;
  gameType: GameType;
  matchId: string;
  mapName: string;
  timestamp: number;
  duration: number;
  teams: [Team, Team];
  players: Player[];
  rounds: Round[];
  events: GameEvent[];
  metadata: ReplayMetadata;
  timeline: ReplayTimeline;
}

export interface ReplayMetadata {
  gameVersion: string;
  demoVersion: string;
  serverTickRate: number;
  totalTicks: number;
  recordingPlayerId?: string;
  competition?: CompetitionInfo;
  recordingSoftware?: string;
  fileSize: number;
  parserVersion: string;
}

export interface CompetitionInfo {
  name: string;
  stage?: string;
  matchType?: string;
  date?: string;
}

export interface ReplayTimeline {
  totalRounds: number;
  roundStartTimes: number[];
  keyEvents: TimelineEvent[];
  heatmapData?: Position2D[];
}

export interface TimelineEvent {
  timestamp: number;
  roundNumber: number;
  type: EventType;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Parser Types
// ============================================================================

export interface ParseOptions {
  gameType: GameType;
  maxFileSize?: number; // bytes
  maxDuration?: number; // seconds
  includePlayerStates?: boolean;
  includeHeatmapData?: boolean;
  progressCallback?: (progress: ParseProgress) => void;
}

export interface ParseProgress {
  stage: 'reading' | 'parsing' | 'normalizing' | 'validating';
  percent: number;
  bytesProcessed: number;
  totalBytes: number;
  estimatedTimeRemaining?: number;
}

export interface ParseResult {
  success: boolean;
  replay?: Replay;
  error?: ParseError;
  stats: ParseStats;
}

export interface ParseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ParseStats {
  fileSize: number;
  parseTime: number;
  memoryPeak: number;
  eventsParsed: number;
  roundsParsed: number;
  warnings: string[];
}

// ============================================================================
// Parser Interface
// ============================================================================

export interface ReplayParser {
  readonly gameType: GameType;
  readonly supportedVersions: string[];
  parse(data: ArrayBuffer | string, options?: Partial<ParseOptions>): Promise<ParseResult>;
  validate(data: unknown): boolean;
  getSupportedFormats(): string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

export function isValidPosition3D(obj: unknown): obj is Position3D {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'x' in obj && typeof (obj as Position3D).x === 'number' &&
    'y' in obj && typeof (obj as Position3D).y === 'number' &&
    'z' in obj && typeof (obj as Position3D).z === 'number'
  );
}

export function isValidPlayer(obj: unknown): obj is Player {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj && typeof (obj as Player).id === 'string' &&
    'name' in obj && typeof (obj as Player).name === 'string' &&
    'teamId' in obj && typeof (obj as Player).teamId === 'string' &&
    'teamSide' in obj && typeof (obj as Player).teamSide === 'string'
  );
}

export function isValidReplay(obj: unknown): obj is Replay {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const replay = obj as Replay;
  return (
    replay.schemaVersion === REPLAY_SCHEMA_VERSION &&
    (replay.gameType === 'valorant' || replay.gameType === 'cs2') &&
    typeof replay.matchId === 'string' &&
    typeof replay.mapName === 'string' &&
    Array.isArray(replay.teams) &&
    replay.teams.length === 2 &&
    Array.isArray(replay.players) &&
    Array.isArray(replay.rounds) &&
    typeof replay.metadata === 'object'
  );
}

export function validateReplay(replay: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof replay !== 'object' || replay === null) {
    return { valid: false, errors: ['Replay must be an object'] };
  }
  
  const r = replay as Partial<Replay>;
  
  if (r.schemaVersion !== REPLAY_SCHEMA_VERSION) {
    errors.push(`Invalid schema version: expected ${REPLAY_SCHEMA_VERSION}, got ${r.schemaVersion}`);
  }
  
  if (r.gameType !== 'valorant' && r.gameType !== 'cs2') {
    errors.push(`Invalid game type: ${r.gameType}`);
  }
  
  if (!r.matchId || typeof r.matchId !== 'string') {
    errors.push('Missing or invalid matchId');
  }
  
  if (!r.mapName || typeof r.mapName !== 'string') {
    errors.push('Missing or invalid mapName');
  }
  
  if (!Array.isArray(r.teams) || r.teams.length !== 2) {
    errors.push('Teams must be an array of exactly 2 teams');
  }
  
  if (!Array.isArray(r.players) || r.players.length === 0) {
    errors.push('Players must be a non-empty array');
  }
  
  if (!Array.isArray(r.rounds)) {
    errors.push('Rounds must be an array');
  }
  
  if (!r.metadata || typeof r.metadata !== 'object') {
    errors.push('Missing or invalid metadata');
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createEmptyReplay(gameType: GameType, matchId: string): Replay {
  const now = Date.now();
  
  return {
    schemaVersion: REPLAY_SCHEMA_VERSION,
    gameType,
    matchId,
    mapName: '',
    timestamp: now,
    duration: 0,
    teams: [
      { id: 'team-a', name: 'Team A', side: 'team_a', score: 0, money: 0, playerIds: [], timeoutsRemaining: 0 },
      { id: 'team-b', name: 'Team B', side: 'team_b', score: 0, money: 0, playerIds: [], timeoutsRemaining: 0 },
    ],
    players: [],
    rounds: [],
    events: [],
    metadata: {
      gameVersion: '',
      demoVersion: '',
      serverTickRate: 128,
      totalTicks: 0,
      fileSize: 0,
      parserVersion: REPLAY_SCHEMA_VERSION,
    },
    timeline: {
      totalRounds: 0,
      roundStartTimes: [],
      keyEvents: [],
    },
  };
}

export function normalizePosition(pos: Position3D, mapScale: number = 1): Position3D {
  return {
    x: pos.x * mapScale,
    y: pos.y * mapScale,
    z: pos.z * mapScale,
  };
}

export function calculateDistance(a: Position3D, b: Position3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Performance Constants
// ============================================================================

export const PARSER_PERFORMANCE_LIMITS = {
  /** Maximum file size: 50MB */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Maximum parse time: 1 second */
  MAX_PARSE_TIME_MS: 1000,
  /** Maximum memory usage: 200MB */
  MAX_MEMORY_MB: 200,
  /** Default tick rate assumption */
  DEFAULT_TICK_RATE: 128,
  /** Batch size for event processing */
  BATCH_SIZE: 1000,
  /** Worker chunk size */
  WORKER_CHUNK_SIZE: 64 * 1024, // 64KB
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const PARSE_ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  CORRUPT_DATA: 'CORRUPT_DATA',
  PARSE_TIMEOUT: 'PARSE_TIMEOUT',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;

// ============================================================================
// Export Default
// ============================================================================

export default {
  REPLAY_SCHEMA_VERSION,
  PARSER_PERFORMANCE_LIMITS,
  PARSE_ERROR_CODES,
};
