/** [Ver001.001] - Added Player export */
/**
 * TacticalView Types
 * ==================
 * Type definitions for the enriched minimap tactical view.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Position {
  x: number;
  y: number;
  z?: number; // For vertical positioning (e.g., on boxes)
}

export type TeamSide = 'attacker' | 'defender';

export type GamePhase = 
  | 'buy'
  | 'combat'
  | 'postplant'
  | 'spike_down'
  | 'clutch';

export type AgentRole = 
  | 'duelist'
  | 'initiator'
  | 'controller'
  | 'sentinel';

// ============================================================================
// Agent Types
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  color: string;
  abilities: Ability[];
  iconUrl?: string;
}

export interface Ability {
  id: string;
  name: string;
  type: 'basic' | 'signature' | 'ultimate';
  maxCharges: number;
  cost: number;
}

/** Alias for TacticalViewPlayer - used for consistency */
export type Player = TacticalViewPlayer;

export interface TacticalViewPlayer {
  id: string;
  name: string;
  teamId: string;
  teamSide: TeamSide;
  agent: Agent;
  health: number;
  maxHealth: number;
  armor: number;
  isAlive: boolean;
  credits: number;
  loadout?: Loadout;
  stats?: PlayerStats;
}

export interface Loadout {
  primaryWeapon?: Weapon;
  secondaryWeapon: Weapon;
  abilities: AbilityCharge[];
  hasSpike?: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'sidearm' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'heavy';
  cost: number;
  iconUrl?: string;
}

export interface AbilityCharge {
  abilityId: string;
  charges: number;
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  abilityUses: number;
  headshotPercentage: number;
}

// ============================================================================
// Match Timeline Types
// ============================================================================

export interface MatchTimeline {
  matchId: string;
  mapName: string;
  matchDuration: number; // in seconds
  frames: MatchFrame[];
  roundResults: RoundResult[];
  keyEvents: KeyEvent[];
}

export interface MatchFrame {
  timestamp: number; // milliseconds from match start
  roundNumber: number;
  roundTime: number; // seconds into current round
  phase: GamePhase;
  agentFrames: AgentFrame[];
  abilitiesActive: ActiveAbility[];
  spikePosition?: Position;
  spikeStatus: 'carried' | 'dropped' | 'planted' | 'defusing' | 'defused';
  spikePlantTime?: number;
}

export interface AgentFrame {
  playerId: string;
  position: Position;
  rotation: number; // degrees
  health: number;
  armor: number;
  isAlive: boolean;
  hasSpike: boolean;
  isPlanting: boolean;
  isDefusing: boolean;
  isUsingAbility: boolean;
  activeAbility?: string;
}

export interface ActiveAbility {
  abilityId: string;
  agentName: string;
  position: Position;
  radius: number;
  duration: number;
  timeRemaining: number;
  teamSide: TeamSide;
}

export interface RoundResult {
  roundNumber: number;
  winner: TeamSide;
  endMethod: 'elimination' | 'spike_explode' | 'spike_defuse' | 'timeout';
  startTimestamp: number;
  endTimestamp: number;
  score: {
    attacker: number;
    defender: number;
  };
  mvp?: string; // playerId
}

export interface KeyEvent {
  timestamp: number;
  type: 
    | 'kill'
    | 'ability'
    | 'spike_plant'
    | 'spike_defuse'
    | 'round_start'
    | 'round_end'
    | 'clutch_start'
    | 'ace';
  description: string;
  playerId?: string;
  targetId?: string;
  position?: Position;
  relatedEventIds?: string[];
}

// ============================================================================
// Map Types
// ============================================================================

export interface MapData {
  id: string;
  name: string;
  displayName: string;
  minimapUrl: string;
  dimensions: {
    inGameUnits: number;
    minimapPixels: number;
  };
  bounds: {
    min: Position;
    max: Position;
  };
  callouts: MapCallout[];
  spikeSites: SpikeSite[];
}

export interface MapCallout {
  id: string;
  name: string;
  position: Position;
  region: 'a' | 'b' | 'c' | 'mid' | 'spawn' | 'other';
}

export interface SpikeSite {
  id: string;
  name: 'A' | 'B' | 'C';
  plantPositions: Position[];
  defaultPlant: Position;
}

// ============================================================================
// Component Props
// ============================================================================

export interface TacticalViewProps {
  matchId: string;
  timeline: MatchTimeline;
  mapData: MapData;
  players: Player[];
  initialState?: Partial<TacticalViewState>;
  onFrameChange?: (frame: MatchFrame) => void;
  onEventSelect?: (event: KeyEvent) => void;
  onPlayerSelect?: (player: Player) => void;
}

export interface TacticalViewState {
  // Playback state
  isPlaying: boolean;
  playbackSpeed: typeof PLAYBACK_SPEEDS[number];
  currentTimestamp: number;
  
  // Visualization options
  showTrails: boolean;
  trailLength: number;
  showVisionCones: boolean;
  showAbilityRanges: boolean;
  showHealthBars: boolean;
  showPlayerNames: boolean;
  showLoadout: boolean;
  
  // Camera/follow
  followPlayer?: string;
  zoom: number;
  panOffset: { x: number; y: number };
  
  // Filters
  selectedTeams: TeamSide[];
  selectedPlayers: string[];
  highlightAbilityTypes: string[];
}

export interface TacticalControlsProps {
  isPlaying: boolean;
  playbackSpeed: typeof PLAYBACK_SPEEDS[number];
  showTrails: boolean;
  showVisionCones: boolean;
  showHealthBars: boolean;
  showPlayerNames: boolean;
  onTogglePlayback: () => void;
  onSpeedChange: (speed: typeof PLAYBACK_SPEEDS[number]) => void;
  onToggleTrails: () => void;
  onToggleVisionCones: () => void;
  onToggleHealthBars: () => void;
  onTogglePlayerNames: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export interface TimelineScrubberProps {
  currentTimestamp: number;
  totalDuration: number;
  roundResults: RoundResult[];
  keyEvents: KeyEvent[];
  onSeek: (timestamp: number) => void;
  currentRound: number;
}

export interface AgentSpriteProps {
  agent: Agent;
  player: Player;
  position: { x: number; y: number };
  rotation: number;
  health: number;
  armor: number;
  isAlive: boolean;
  hasSpike?: boolean;
  isDefusing?: boolean;
  isPlanting?: boolean;
  abilityCharges?: number[];
  credits?: number;
  size?: number;
  showHealth?: boolean;
  showName?: boolean;
  showAbilities?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface AbilityVisualization {
  type: 'smoke' | 'molly' | 'flash' | 'reveal' | 'barrier' | 'wall';
  position: Position;
  radius?: number;
  endPosition?: Position; // For walls
  duration: number;
  color: string;
  opacity: number;
}

export interface HeatmapConfig {
  type: 'kill' | 'death' | 'ability' | 'movement';
  timeRange?: { start: number; end: number };
  playerIds?: string[];
  resolution: number;
  colorGradient: string[];
}

export type TacticalLayer = 
  | 'agents'
  | 'trails'
  | 'abilities'
  | 'spike'
  | 'callouts'
  | 'heatmap'
  | 'vision-cones';

// ============================================================================
// Constants
// ============================================================================

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  duelist: '#ff6b6b',
  initiator: '#4ecdc4',
  controller: '#45b7d1',
  sentinel: '#96ceb4',
};

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export const DEFAULT_VIEW_STATE: TacticalViewState = {
  isPlaying: false,
  playbackSpeed: 1,
  currentTimestamp: 0,
  showTrails: true,
  trailLength: 30,
  showVisionCones: false,
  showAbilityRanges: true,
  showHealthBars: true,
  showPlayerNames: true,
  showLoadout: false,
  followPlayer: undefined,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  selectedTeams: ['attacker', 'defender'],
  selectedPlayers: [],
  highlightAbilityTypes: [],
};
