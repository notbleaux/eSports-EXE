/**
 * Camera Director System
 * Automated camera switching and scene composition for replay viewing
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Position3D, GameEvent, Player, Team, Round } from '../types';
import type { DetectedAction, ActionType } from './actionDetection';
import {
  ActionDetectionEngine,
  createActionDetectionEngine,
  DETECTION_CONFIG,
  calculateActionPriority,
  mergeOverlappingActions,
} from './actionDetection';
import {
  BaseCamera,
  FreeCamera,
  FollowCamera,
  OrbitCamera,
  CinematicCamera,
  CameraMode,
  CameraState,
  CameraBounds,
  CinematicShot,
  CinematicSequence,
  DEFAULT_FOLLOW_CONFIG,
  DEFAULT_ORBIT_CONFIG,
} from './modes';

// ============================================================================
// Director Types
// ============================================================================

export type DirectorMode = 'auto' | 'manual' | 'cinematic';

export interface DirectorConfig {
  mode: DirectorMode;
  /** Minimum time between camera switches (ms) */
  minSwitchInterval: number;
  /** How long to anticipate upcoming actions (ms) */
  anticipationTime: number;
  /** How long to linger after action ends (ms) */
  lingerTime: number;
  /** Whether to prefer player perspectives */
  preferPlayerPerspectives: boolean;
  /** Whether to show kill replays */
  showKillReplays: boolean;
  /** Drama score threshold for switching */
  dramaThreshold: number;
  /** Camera bounds for all modes */
  bounds?: CameraBounds;
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
  mode: 'auto',
  minSwitchInterval: 1000,
  anticipationTime: 500,
  lingerTime: 1000,
  preferPlayerPerspectives: true,
  showKillReplays: true,
  dramaThreshold: DETECTION_CONFIG.MIN_DRAMA_SCORE,
};

export interface SceneComposition {
  primarySubject: string | null; // player ID or action ID
  secondarySubjects: string[];
  framing: 'close' | 'medium' | 'wide';
  angle: 'low' | 'eye' | 'high';
  movement: 'static' | 'tracking' | 'orbiting';
}

export interface CameraDecision {
  timestamp: number;
  mode: CameraMode;
  targetPlayerId?: string;
  targetActionId?: string;
  state: CameraState;
  duration: number;
  reason: string;
  dramaScore: number;
}

export interface DramaScore {
  total: number;
  actionScore: number;
  proximityScore: number;
  momentumScore: number;
  importanceBonus: number;
}

// ============================================================================
// Camera Director
// ============================================================================

export class CameraDirector {
  private config: DirectorConfig;
  private actionEngine: ActionDetectionEngine;
  private detectedActions: DetectedAction[] = [];
  private cameraHistory: CameraDecision[] = [];
  private lastSwitchTime: number = 0;
  private currentDecision: CameraDecision | null = null;
  private upcomingDecisions: CameraDecision[] = [];

  // Camera instances
  private freeCamera: FreeCamera;
  private followCamera: FollowCamera;
  private orbitCamera: OrbitCamera;
  private cinematicCamera: CinematicCamera;
  private activeCamera: BaseCamera;

  // Callbacks
  private onDecisionMade?: (decision: CameraDecision) => void;
  private onCameraSwitched?: (from: CameraMode, to: CameraMode) => void;

  constructor(
    events: GameEvent[],
    players: Player[],
    teams: Team[],
    rounds: Round[],
    config: Partial<DirectorConfig> = {},
    getPlayerPosition: (playerId: string, timestamp: number) => Position3D | null,
    getPlayerVelocity: (playerId: string, timestamp: number) => Position3D | null
  ) {
    this.config = { ...DEFAULT_DIRECTOR_CONFIG, ...config };
    this.actionEngine = createActionDetectionEngine(events, players, teams, rounds);
    
    // Initialize cameras
    const bounds = this.config.bounds;
    this.freeCamera = new FreeCamera(undefined, bounds);
    this.followCamera = new FollowCamera(getPlayerPosition, getPlayerVelocity, {}, bounds);
    this.orbitCamera = new OrbitCamera({}, bounds);
    this.cinematicCamera = new CinematicCamera();
    this.activeCamera = this.freeCamera;

    // Pre-detect all actions
    this.detectedActions = this.actionEngine.detectAllActions();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Set callbacks for director events
   */
  setCallbacks(callbacks: {
    onDecisionMade?: (decision: CameraDecision) => void;
    onCameraSwitched?: (from: CameraMode, to: CameraMode) => void;
  }): void {
    this.onDecisionMade = callbacks.onDecisionMade;
    this.onCameraSwitched = callbacks.onCameraSwitched;
  }

  /**
   * Update director for current frame
   */
  update(deltaTime: number, timestamp: number): CameraState {
    // Make camera decisions
    this.evaluateCameraDecision(timestamp);

    // Update active camera
    this.activeCamera.update(deltaTime, timestamp);

    return this.activeCamera.getState();
  }

  /**
   * Get current camera state
   */
  getCurrentState(): CameraState {
    return this.activeCamera.getState();
  }

  /**
   * Get current camera mode
   */
  getCurrentMode(): CameraMode {
    if (this.activeCamera === this.freeCamera) return 'free';
    if (this.activeCamera === this.followCamera) return 'follow';
    if (this.activeCamera === this.orbitCamera) return 'orbit';
    return 'cinematic';
  }

  /**
   * Switch to manual camera control
   */
  setManualMode(mode: CameraMode, initialState?: Partial<CameraState>): void {
    const previousMode = this.getCurrentMode();

    switch (mode) {
      case 'free':
        if (initialState) this.freeCamera.setState(initialState);
        this.activeCamera = this.freeCamera;
        break;
      case 'follow':
        this.activeCamera = this.followCamera;
        break;
      case 'orbit':
        if (initialState?.target) {
          this.orbitCamera.setCenter(initialState.target);
        }
        this.activeCamera = this.orbitCamera;
        break;
      case 'cinematic':
        this.activeCamera = this.cinematicCamera;
        break;
    }

    if (previousMode !== mode) {
      this.onCameraSwitched?.(previousMode, mode);
    }
  }

  /**
   * Set target player for follow camera
   */
  setFollowTarget(playerId: string | null): void {
    this.followCamera.setTarget(playerId);
    if (this.activeCamera === this.followCamera && playerId) {
      this.currentDecision = {
        timestamp: performance.now(),
        mode: 'follow',
        targetPlayerId: playerId,
        state: this.followCamera.getState(),
        duration: 0,
        reason: 'Manual follow target',
        dramaScore: 0,
      };
    }
  }

  /**
   * Set orbit center point
   */
  setOrbitCenter(point: Position3D): void {
    this.orbitCamera.setCenter(point);
  }

  /**
   * Play a cinematic sequence
   */
  playCinematicSequence(sequence: CinematicSequence, timestamp: number): boolean {
    this.cinematicCamera.addSequence(sequence);
    const success = this.cinematicCamera.playSequence(sequence.id, timestamp);
    if (success) {
      this.setManualMode('cinematic');
    }
    return success;
  }

  /**
   * Get all detected actions
   */
  getDetectedActions(): DetectedAction[] {
    return [...this.detectedActions];
  }

  /**
   * Get actions filtered by type
   */
  getActionsByType(type: ActionType): DetectedAction[] {
    return this.detectedActions.filter(a => a.type === type);
  }

  /**
   * Get upcoming actions
   */
  getUpcomingActions(timestamp: number, windowMs: number = 10000): DetectedAction[] {
    return this.detectedActions.filter(
      a => a.timestamp > timestamp && a.timestamp <= timestamp + windowMs
    );
  }

  /**
   * Get camera decision history
   */
  getDecisionHistory(): CameraDecision[] {
    return [...this.cameraHistory];
  }

  /**
   * Get current scene composition analysis
   */
  getSceneComposition(timestamp: number): SceneComposition {
    const activeAction = this.actionEngine.getPrimaryActionAtTime(timestamp);
    const nearbyActions = this.actionEngine.getActionsInWindow(
      timestamp - 2000,
      timestamp + 2000
    );

    const primarySubject = activeAction?.primaryPlayerId || null;
    const secondarySubjects = nearbyActions
      .filter(a => a.primaryPlayerId !== primarySubject)
      .map(a => a.primaryPlayerId)
      .filter((id): id is string => id !== undefined);

    // Determine framing based on action type
    let framing: SceneComposition['framing'] = 'medium';
    if (activeAction) {
      if (activeAction.type === 'ace' || activeAction.type === 'clutch') {
        framing = 'close';
      } else if (activeAction.type === 'bomb_plant' || activeAction.type === 'bomb_defuse') {
        framing = 'wide';
      }
    }

    // Determine angle
    let angle: SceneComposition['angle'] = 'eye';
    if (activeAction?.type === 'multi_kill' || activeAction?.type === 'ace') {
      angle = 'low'; // Dramatic low angle
    }

    // Determine movement
    let movement: SceneComposition['movement'] = 'static';
    if (this.activeCamera === this.orbitCamera) {
      movement = 'orbiting';
    } else if (this.activeCamera === this.followCamera) {
      movement = 'tracking';
    }

    return {
      primarySubject,
      secondarySubjects: [...new Set(secondarySubjects)].slice(0, 3),
      framing,
      angle,
      movement,
    };
  }

  /**
   * Calculate drama score for a timestamp
   */
  calculateDramaScore(timestamp: number): DramaScore {
    const action = this.actionEngine.getPrimaryActionAtTime(timestamp);
    const recentActions = this.actionEngine.getActionsInWindow(
      timestamp - 5000,
      timestamp + 5000
    );

    // Action score from current action
    const actionScore = action?.dramaScore || 0;

    // Proximity score based on nearby actions
    const proximityScore = Math.min(25, recentActions.length * 5);

    // Momentum score based on action trend
    const momentumScore = this.calculateMomentumScore(recentActions, timestamp);

    // Importance bonus
    let importanceBonus = 0;
    if (action?.importance === 'critical') importanceBonus = 15;
    else if (action?.importance === 'high') importanceBonus = 10;
    else if (action?.importance === 'medium') importanceBonus = 5;

    return {
      total: Math.min(100, actionScore + proximityScore + momentumScore + importanceBonus),
      actionScore,
      proximityScore,
      momentumScore,
      importanceBonus,
    };
  }

  /**
   * Generate upcoming camera schedule
   */
  generateSchedule(startTime: number, duration: number): CameraDecision[] {
    const schedule: CameraDecision[] = [];
    const endTime = startTime + duration;
    
    // Get all actions in the time range
    const actions = this.detectedActions.filter(
      a => a.timestamp >= startTime && a.timestamp <= endTime
    );

    // Merge overlapping actions
    const mergedActions = mergeOverlappingActions(actions);

    let lastEndTime = startTime;

    mergedActions.forEach(action => {
      // Add transition decision if there's a gap
      if (action.timestamp - lastEndTime > this.config.minSwitchInterval) {
        const transitionDecision = this.createTransitionDecision(
          lastEndTime,
          action.timestamp - 500
        );
        if (transitionDecision) {
          schedule.push(transitionDecision);
        }
      }

      // Create decision for this action
      const decision = this.createDecisionForAction(action);
      schedule.push(decision);

      lastEndTime = action.timestamp + action.duration;
    });

    return schedule;
  }

  /**
   * Get recommended camera position for an action
   */
  getRecommendedPosition(action: DetectedAction): Position3D {
    switch (action.type) {
      case 'kill':
      case 'multi_kill':
      case 'ace':
        // Position behind and above the action
        return {
          x: action.position.x - 100,
          y: action.position.y + 150,
          z: action.position.z - 100,
        };
      case 'clutch':
        // Close up position
        return {
          x: action.position.x - 50,
          y: action.position.y + 30,
          z: action.position.z - 50,
        };
      case 'bomb_plant':
      case 'bomb_defuse':
        // Wide angle showing the site
        return {
          x: action.position.x - 200,
          y: action.position.y + 100,
          z: action.position.z - 200,
        };
      default:
        return {
          x: action.position.x - 150,
          y: action.position.y + 100,
          z: action.position.z - 150,
        };
    }
  }

  /**
   * Estimate transition timing between two actions
   */
  estimateTransitionTime(from: DetectedAction, to: DetectedAction): number {
    const distance = this.calculateDistance(from.position, to.position);
    
    // Base transition time
    let transitionTime = 500;
    
    // Add time based on distance
    transitionTime += distance * 2;
    
    // Add anticipation time
    transitionTime += this.config.anticipationTime;
    
    return Math.min(transitionTime, 2000); // Cap at 2 seconds
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private evaluateCameraDecision(timestamp: number): void {
    if (this.config.mode === 'manual') return;

    // Check if enough time has passed since last switch
    if (timestamp - this.lastSwitchTime < this.config.minSwitchInterval) {
      return;
    }

    // Get primary action
    const primaryAction = this.actionEngine.getPrimaryActionAtTime(
      timestamp,
      this.config.anticipationTime * 2
    );

    if (!primaryAction) {
      // No significant action, use ambient camera
      this.handleAmbientCamera(timestamp);
      return;
    }

    // Check if action is worth switching to
    if (primaryAction.dramaScore < this.config.dramaThreshold) {
      return;
    }

    // Determine best camera mode for this action
    const decision = this.createDecisionForAction(primaryAction, timestamp);

    // Check if this is a new decision
    if (!this.currentDecision || this.currentDecision.targetActionId !== decision.targetActionId) {
      this.executeDecision(decision, timestamp);
    }
  }

  private createDecisionForAction(action: DetectedAction, timestamp?: number): CameraDecision {
    const ts = timestamp ?? action.timestamp;
    
    // Determine best camera mode
    let mode: CameraMode = 'orbit';
    let targetPlayerId: string | undefined;
    let targetActionId: string | undefined;
    let duration: number;
    let reason: string;

    switch (action.type) {
      case 'kill':
      case 'trade_kill':
      case 'opening_kill':
        if (this.config.preferPlayerPerspectives && action.primaryPlayerId) {
          mode = 'follow';
          targetPlayerId = action.primaryPlayerId;
          reason = `Following ${action.description}`;
        } else {
          mode = 'orbit';
          targetActionId = action.id;
          reason = `Orbiting ${action.description}`;
        }
        duration = action.duration;
        break;

      case 'multi_kill':
      case 'ace':
        // Use cinematic for multi-kills
        mode = 'cinematic';
        targetActionId = action.id;
        reason = `Cinematic shot of ${action.description}`;
        duration = action.duration;
        break;

      case 'clutch':
        mode = 'follow';
        targetPlayerId = action.primaryPlayerId;
        reason = `Clutch situation: ${action.description}`;
        duration = action.duration;
        break;

      case 'bomb_plant':
      case 'bomb_defuse':
        mode = 'orbit';
        targetActionId = action.id;
        reason = `${action.type === 'bomb_plant' ? 'Bomb plant' : 'Bomb defuse'} at ${action.metadata.site || 'site'}`;
        duration = action.duration;
        break;

      case 'round_win':
        mode = 'orbit';
        reason = 'Round conclusion';
        duration = action.duration;
        break;

      default:
        mode = 'orbit';
        targetActionId = action.id;
        reason = action.description;
        duration = action.duration;
    }

    // Get recommended camera position
    const recommendedPosition = this.getRecommendedPosition(action);

    return {
      timestamp: ts,
      mode,
      targetPlayerId,
      targetActionId,
      state: {
        position: recommendedPosition,
        rotation: { x: -0.3, y: 0, z: 0 },
        fov: mode === 'cinematic' ? 60 : 75,
        target: action.position,
        up: { x: 0, y: 1, z: 0 },
      },
      duration,
      reason,
      dramaScore: action.dramaScore,
    };
  }

  private createTransitionDecision(startTime: number, endTime: number): CameraDecision | null {
    const duration = endTime - startTime;
    if (duration < 500) return null;

    return {
      timestamp: startTime,
      mode: 'orbit',
      state: {
        position: { x: 0, y: 300, z: 400 },
        rotation: { x: -0.5, y: 0, z: 0 },
        fov: 90,
        up: { x: 0, y: 1, z: 0 },
      },
      duration,
      reason: 'Transition/ambient view',
      dramaScore: 10,
    };
  }

  private executeDecision(decision: CameraDecision, timestamp: number): void {
    const previousMode = this.getCurrentMode();

    // Switch camera mode if needed
    if (decision.mode !== previousMode) {
      this.setManualMode(decision.mode, decision.state);
    }

    // Set camera target if follow mode
    if (decision.mode === 'follow' && decision.targetPlayerId) {
      this.followCamera.setTarget(decision.targetPlayerId);
    }

    // Set orbit center if orbit mode
    if (decision.mode === 'orbit' && decision.state.target) {
      this.orbitCamera.setCenter(decision.state.target);
    }

    // Start cinematic shot if cinematic mode
    if (decision.mode === 'cinematic' && decision.targetActionId) {
      const shot: CinematicShot = {
        id: `auto-${decision.targetActionId}`,
        name: decision.reason,
        startState: decision.state,
        endState: {
          ...decision.state,
          position: {
            x: decision.state.position.x + 50,
            y: decision.state.position.y,
            z: decision.state.position.z + 50,
          },
        },
        duration: decision.duration,
        easing: 'easeInOut',
        shakeIntensity: decision.dramaScore > 70 ? 0.3 : 0,
        focusPoint: decision.state.target,
      };

      const sequence: CinematicSequence = {
        id: `seq-${decision.targetActionId}`,
        name: decision.reason,
        shots: [shot],
        loop: false,
      };

      this.playCinematicSequence(sequence, timestamp);
    }

    // Apply transition
    this.activeCamera.transitionTo(
      decision.state,
      500,
      decision.dramaScore > 70 ? 'spring' : 'easeInOut'
    );

    // Update tracking
    this.currentDecision = decision;
    this.cameraHistory.push(decision);
    this.lastSwitchTime = timestamp;

    // Notify callbacks
    this.onDecisionMade?.(decision);
    if (previousMode !== decision.mode) {
      this.onCameraSwitched?.(previousMode, decision.mode);
    }
  }

  private handleAmbientCamera(timestamp: number): void {
    // No significant action - use wide orbit or free camera
    if (this.getCurrentMode() !== 'orbit') {
      this.setManualMode('orbit');
    }

    // Slow auto-orbit
    this.orbitCamera.setConfig({
      ...DEFAULT_ORBIT_CONFIG,
      autoOrbit: true,
      orbitSpeed: 0.1, // Slow rotation
    });
  }

  private calculateMomentumScore(actions: DetectedAction[], timestamp: number): number {
    if (actions.length < 2) return 0;

    // Sort by time
    const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate trend
    let increasingDrama = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].dramaScore > sorted[i - 1].dramaScore) {
        increasingDrama++;
      }
    }

    // Score based on trend
    const trendRatio = increasingDrama / (sorted.length - 1);
    return trendRatio * 20;
  }

  private calculateDistance(a: Position3D, b: Position3D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCameraDirector(
  events: GameEvent[],
  players: Player[],
  teams: Team[],
  rounds: Round[],
  config?: Partial<DirectorConfig>,
  getPlayerPosition?: (playerId: string, timestamp: number) => Position3D | null,
  getPlayerVelocity?: (playerId: string, timestamp: number) => Position3D | null
): CameraDirector {
  const defaultGetPosition = () => ({ x: 0, y: 0, z: 0 });
  const defaultGetVelocity = () => ({ x: 0, y: 0, z: 0 });

  return new CameraDirector(
    events,
    players,
    teams,
    rounds,
    config,
    getPlayerPosition || defaultGetPosition,
    getPlayerVelocity || defaultGetVelocity
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate highlight reel schedule from best actions
 */
export function generateHighlightSchedule(
  actions: DetectedAction[],
  maxHighlights: number = 10,
  minDramaScore: number = 50
): DetectedAction[] {
  // Filter by drama score
  const highDrama = actions.filter(a => a.dramaScore >= minDramaScore);
  
  // Sort by drama score
  const sorted = calculateActionPriority(highDrama);
  
  // Take top N, ensuring no overlaps
  const highlights: DetectedAction[] = [];
  
  for (const action of sorted) {
    // Check for overlaps with already selected highlights
    const overlaps = highlights.some(h =>
      Math.abs(h.timestamp - action.timestamp) < (h.duration + action.duration) / 2
    );
    
    if (!overlaps) {
      highlights.push(action);
      if (highlights.length >= maxHighlights) break;
    }
  }
  
  // Sort by timestamp for chronological playback
  return highlights.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Analyze camera coverage quality
 */
export function analyzeCameraCoverage(
  decisions: CameraDecision[],
  totalDuration: number
): {
  coveragePercent: number;
  missedActions: number;
  avgDramaScore: number;
  switchCount: number;
} {
  if (decisions.length === 0) {
    return {
      coveragePercent: 0,
      missedActions: 0,
      avgDramaScore: 0,
      switchCount: 0,
    };
  }

  const totalDecisionTime = decisions.reduce((sum, d) => sum + d.duration, 0);
  const coveragePercent = (totalDecisionTime / totalDuration) * 100;
  const avgDramaScore = decisions.reduce((sum, d) => sum + d.dramaScore, 0) / decisions.length;

  return {
    coveragePercent: Math.min(100, coveragePercent),
    missedActions: 0, // Would need expected action count
    avgDramaScore,
    switchCount: decisions.length,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  CameraDirector,
  createCameraDirector,
  generateHighlightSchedule,
  analyzeCameraCoverage,
  DEFAULT_DIRECTOR_CONFIG,
};
