// @ts-nocheck
/** [Ver001.002] - Fixed Vector2D re-export */
/**
 * Lens System Types
 * =================
 * Type definitions for the SpecMapViewer lens system.
 * Lenses provide visual overlays that reveal hidden patterns in tactical data.
 */

// Import and re-export Vector2D from TacticalMap types
import type { Vector2D as TacticalMapVector2D } from '@/hub-3-arepo/components/TacticalMap/types'
export type Vector2D = TacticalMapVector2D

/** Game data structure for lens rendering */
export interface GameData {
  /** Kill events with position and timing */
  killEvents: KillEvent[]
  /** Sound events (footsteps, abilities, gunfire) */
  soundEvents: SoundEvent[]
  /** Damage events for blood trail visualization */
  damageEvents: DamageEvent[]
  /** Player position history for flow analysis */
  playerPositions: PlayerPosition[]
  /** Match metadata */
  metadata: {
    mapName: string
    roundNumber: number
    matchTime: number
  }
}

/** Kill event data */
export interface KillEvent {
  position: Vector2D
  timestamp: number
  killer: string
  victim: string
  weapon: string
  isHeadshot: boolean
  isFirstBlood: boolean
}

/** Sound event data */
export interface SoundEvent {
  position: Vector2D
  timestamp: number
  type: 'footstep' | 'gunfire' | 'ability' | 'reload' | 'defuse'
  source: string
  intensity: number // 0.0 to 1.0
}

/** Damage event data */
export interface DamageEvent {
  position: Vector2D
  timestamp: number
  attacker: string
  victim: string
  damage: number
  isFirstBlood: boolean
  isFatal: boolean
}

/** Player position history entry */
export interface PlayerPosition {
  playerId: string
  team: 'attackers' | 'defenders'
  agent: string
  positions: TimedPosition[]
}

/** Position with timestamp */
export interface TimedPosition {
  x: number
  y: number
  timestamp: number
  velocity: Vector2D
}

/** Vector for flow field calculations */
export interface FlowVector {
  position: Vector2D
  direction: Vector2D
  magnitude: number
}

/** Heatmap cell data */
export interface HeatmapCell {
  x: number
  y: number
  value: number // 0.0 to 1.0
  intensity: number
}

/** Lens configuration options */
export interface LensOptions {
  /** Base opacity for the lens overlay (0.0 to 1.0) */
  opacity: number
  /** Color theme */
  color: string
  /** Blend mode for canvas rendering */
  blendMode: GlobalCompositeOperation
  /** Animation speed multiplier */
  animationSpeed: number
  /** Whether to show labels */
  showLabels: boolean
}

/** Lens interface - all lenses must implement this */
export interface Lens {
  /** Unique identifier for the lens */
  name: string
  /** Display name for UI */
  displayName: string
  /** Description of what this lens reveals */
  description: string
  /** Default opacity (0.0 to 1.0) */
  opacity: number
  /** Default options */
  defaultOptions: LensOptions
  /** Render function - draws the lens overlay to canvas */
  render: (ctx: CanvasRenderingContext2D, data: GameData, options?: Partial<LensOptions>) => void
  /** Optional: Update animation state */
  update?: (deltaTime: number) => void
  /** Optional: Reset lens state */
  reset?: () => void
}

/** Lens registry for managing available lenses */
export interface LensRegistry {
  /** Register a new lens */
  register: (lens: Lens) => void
  /** Get a lens by name */
  get: (name: string) => Lens | undefined
  /** Get all registered lenses */
  getAll: () => Lens[]
  /** Get active lenses */
  getActive: () => string[]
  /** Toggle lens activation */
  toggle: (name: string) => void
  /** Set lens opacity */
  setOpacity: (name: string, opacity: number) => void
  /** Composite multiple lenses for rendering */
  composite: (ctx: CanvasRenderingContext2D, data: GameData, lensNames: string[]) => void
}

/** Render helper functions */
export interface RenderHelpers {
  /** Render a heatmap from cell data */
  renderHeatmap: (
    ctx: CanvasRenderingContext2D,
    cells: HeatmapCell[],
    options: { color: string; opacity: number; radius: number }
  ) => void
  
  /** Render a ripple effect */
  renderRipple: (
    ctx: CanvasRenderingContext2D,
    center: Vector2D,
    progress: number, // 0.0 to 1.0
    options: { color: string; maxRadius: number; lineWidth: number }
  ) => void
  
  /** Render a stain/decal */
  renderStain: (
    ctx: CanvasRenderingContext2D,
    position: Vector2D,
    color: string,
    intensity: number,
    options?: { radius?: number; irregularity?: number }
  ) => void
  
  /** Render a vector field */
  renderVectorField: (
    ctx: CanvasRenderingContext2D,
    vectors: FlowVector[],
    options: { color: string; density: number; arrowSize: number }
  ) => void
  
  /** Calculate tension grid from kill events */
  calculateTension: (events: KillEvent[], mapBounds: { width: number; height: number }) => HeatmapCell[]
  
  /** Calculate movement flow field */
  calculateMovementFlow: (positions: PlayerPosition[]) => FlowVector[]
}
