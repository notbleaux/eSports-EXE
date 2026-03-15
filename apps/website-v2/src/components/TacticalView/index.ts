/** [Ver001.000] */
/**
 * TacticalView Module
 * ===================
 * Enriched minimap tactical view for VCT matches.
 * 
 * Provides Canvas-based rendering of agent positions, movement trails,
 * ability visualization, and match timeline scrubbing.
 */

export { TacticalView } from './TacticalView';
export { TacticalControls } from './TacticalControls';
export { TimelineScrubber } from './TimelineScrubber';
export { AgentSprite } from './AgentSprite';
export { useTacticalWebSocket } from './useTacticalWebSocket';
export { TacticalViewDemo } from './TacticalViewDemo';

export type {
  // Core types
  Position,
  TeamSide,
  GamePhase,
  AgentRole,
  
  // Agent types
  Agent,
  Player,
  AgentFrame,
  Loadout,
  
  // Match types
  MatchFrame,
  RoundResult,
  KeyEvent,
  MatchTimeline,
  MapData,
  
  // Component props
  TacticalViewProps,
  TacticalViewState,
  TacticalControlsProps,
  TimelineScrubberProps,
  AgentSpriteProps,
  
  // Utility types
  AbilityVisualization,
  HeatmapConfig,
  TacticalLayer,
} from './types';

export {
  AGENT_ROLE_COLORS,
  PLAYBACK_SPEEDS,
  DEFAULT_VIEW_STATE,
} from './types';

// Import CSS styles
import './TacticalView.css';
