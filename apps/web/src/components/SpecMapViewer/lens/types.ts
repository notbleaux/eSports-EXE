/** [Ver001.000]
 * SpecMapViewer Lens Types
 * ========================
 * Type definitions for SpecMapViewer lens system
 */

// ============================================================================
// Core Types
// ============================================================================

/** 2D vector for map positions */
export interface Vector2D {
  x: number
  y: number
}

/** 3D vector for map positions */
export interface Vector3D {
  x: number
  y: number
  z: number
}

// ============================================================================
// Lens Types
// ============================================================================

/** Base lens interface */
export interface Lens {
  id: string
  name: string
  description: string
  render: (ctx: CanvasRenderingContext2D, data: GameData, options?: LensOptions) => void
  /** Default options for the lens */
  defaultOptions?: Partial<LensOptions>
  /** Display name for UI */
  displayName?: string
  /** Default opacity */
  opacity?: number
}

/** Lens rendering options */
export interface LensOptions {
  /** Canvas context for rendering */
  ctx: CanvasRenderingContext2D
  /** Map bounds */
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  /** Color scheme */
  colors?: Record<string, string>
  /** Opacity for overlays */
  opacity?: number
  /** Scale factor */
  scale?: number
  /** Default options for the lens */
  defaultOptions?: Partial<LensOptions>
  /** Display name */
  displayName?: string
  /** Blend mode for canvas */
  blendMode?: GlobalCompositeOperation
  /** Animation speed */
  animationSpeed?: number
  /** Show labels */
  showLabels?: boolean
}

// ============================================================================
// Game Data Types
// ============================================================================

/** Main game data interface */
export interface GameData {
  /** Match identifier */
  matchId: string
  /** Map name */
  mapName: string
  /** Round data */
  rounds: RoundData[]
  /** Player information */
  players: PlayerData[]
  /** Sound events */
  soundEvents: SoundEvent[]
  /** Kill events */
  killEvents: KillEvent[]
  /** Damage events */
  damageEvents: DamageEvent[]
  /** Player positions over time */
  playerPositions: PlayerPosition[]
  /** Match metadata */
  metadata?: {
    matchTime?: number
    [key: string]: unknown
  }
}

/** Round data */
export interface RoundData {
  roundNumber: number
  /** Round duration in seconds */
  duration: number
  /** Winning team */
  winner: 'attackers' | 'defenders'
  /** Events that occurred during the round */
  events: GameEvent[]
}

/** Player data */
export interface PlayerData {
  id: string
  name: string
  team: 'attackers' | 'defenders'
  agent: string
}

// ============================================================================
// Event Types
// ============================================================================

/** Base game event */
export interface GameEvent {
  timestamp: number
  type: string
  position?: Vector2D
}

/** Kill event */
export interface KillEvent extends GameEvent {
  type: 'kill'
  killer: string
  victim: string
  weapon: string
  headshot: boolean
  position: Vector2D
  isFirstBlood?: boolean
}

/** Damage event */
export interface DamageEvent extends GameEvent {
  type: 'damage'
  attacker: string
  victim: string
  damage: number
  weapon: string
  position: Vector2D
  isFatal?: boolean
}

/** Sound event (footsteps, abilities, etc.) */
export interface SoundEvent extends GameEvent {
  type: 'sound'
  source: string
  soundType: 'footstep' | 'ability' | 'weapon' | 'voiceline'
  position: Vector2D
  audibleTo: string[] // Player IDs who could hear
}

// ============================================================================
// Position Types
// ============================================================================

/** Player position at a point in time */
export interface PlayerPosition {
  playerId: string
  position: Vector2D
  timestamp: number
  rotation?: number
  team?: 'attackers' | 'defenders'
  /** Array of positions for trajectory rendering */
  positions?: TimedPosition[]
}

/** Timed position for trajectory rendering */
export interface TimedPosition {
  x: number
  y: number
  timestamp: number
  playerId: string
  velocity?: { x: number; y: number }
}

// ============================================================================
// Utility Types
// ============================================================================

/** Heatmap data point */
export interface HeatmapPoint {
  position: Vector2D
  intensity: number
  radius?: number
}

/** Trajectory data */
export interface TrajectoryData {
  playerId: string
  positions: TimedPosition[]
  color?: string
}
