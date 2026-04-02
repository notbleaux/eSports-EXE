// @ts-nocheck
/**
 * Action Detection Engine for Camera Director
 * Detects significant gameplay events for automated camera switching
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import type {
  GameEvent,
  KillEvent,
  BombPlantEvent,
  BombDefuseEvent,
  RoundEndEvent,
  Player,
  Team,
  Round,
  Position3D,
} from '../types';

// ============================================================================
// Action Types
// ============================================================================

export type ActionType =
  | 'kill'
  | 'multi_kill'
  | 'clutch'
  | 'bomb_plant'
  | 'bomb_defuse'
  | 'round_win'
  | 'ace'
  | 'trade_kill'
  | 'opening_kill'
  | 'retake';

export type ActionImportance = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedAction {
  id: string;
  type: ActionType;
  timestamp: number;
  roundNumber: number;
  importance: ActionImportance;
  dramaScore: number; // 0-100
  position: Position3D;
  primaryPlayerId?: string;
  secondaryPlayerIds?: string[];
  description: string;
  metadata: Record<string, unknown>;
  duration: number; // How long to focus on this action (ms)
}

export interface KillChain {
  playerId: string;
  kills: KillEvent[];
  startTime: number;
  endTime: number;
  isMultiKill: boolean;
}

export interface ClutchSituation {
  playerId: string;
  teamId: string;
  enemiesRemaining: number;
  alliesRemaining: number;
  startTime: number;
  roundNumber: number;
  succeeded?: boolean;
}

// ============================================================================
// Detection Configuration
// ============================================================================

export const DETECTION_CONFIG = {
  /** Time window for multi-kill detection (ms) */
  MULTI_KILL_WINDOW_MS: 5000,
  /** Minimum kills for multi-kill */
  MIN_MULTI_KILL: 3,
  /** Time window for trade kill detection (ms) */
  TRADE_KILL_WINDOW_MS: 1500,
  /** Time window for opening kill (from round start) (ms) */
  OPENING_KILL_WINDOW_MS: 15000,
  /** Minimum drama score to trigger camera focus */
  MIN_DRAMA_SCORE: 30,
  /** Drama score multipliers */
  MULTIPLIERS: {
    HEADSHOT: 1.3,
    WALLBANG: 1.4,
    CLUTCH_1v1: 1.5,
    CLUTCH_1v2: 2.0,
    CLUTCH_1v3_PLUS: 2.5,
    ACE: 3.0,
    MULTI_KILL_3: 1.4,
    MULTI_KILL_4: 1.8,
    MULTI_KILL_5: 2.2,
    BOMB_PLANT: 1.2,
    BOMB_DEFUSE: 1.5,
    ROUND_WIN_CLUTCH: 1.3,
  },
  /** Base scores for action types */
  BASE_SCORES: {
    kill: 25,
    multi_kill: 40,
    clutch: 50,
    bomb_plant: 35,
    bomb_defuse: 45,
    round_win: 30,
    ace: 80,
    trade_kill: 20,
    opening_kill: 30,
    retake: 40,
  },
  /** Duration to focus on each action type (ms) */
  FOCUS_DURATION: {
    kill: 2000,
    multi_kill: 4000,
    clutch: 5000,
    bomb_plant: 3000,
    bomb_defuse: 4000,
    round_win: 2500,
    ace: 6000,
    trade_kill: 1500,
    opening_kill: 2500,
    retake: 3500,
  },
} as const;

// ============================================================================
// Action Detection Engine
// ============================================================================

export class ActionDetectionEngine {
  private events: GameEvent[] = [];
  private players: Map<string, Player> = new Map();
  private teams: Map<string, Team> = new Map();
  private rounds: Round[] = [];
  private killChains: Map<string, KillChain> = new Map();
  private activeClutches: Map<string, ClutchSituation> = new Map();
  private detectedActions: DetectedAction[] = [];
  private roundStartTimes: Map<number, number> = new Map();
  private playerDeathsInRound: Map<number, Set<string>> = new Map();

  constructor(
    events: GameEvent[],
    players: Player[],
    teams: Team[],
    rounds: Round[]
  ) {
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    players.forEach(p => this.players.set(p.id, p));
    teams.forEach(t => this.teams.set(t.id, t));
    this.rounds = rounds;
    this.initializeRoundTracking();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Process all events and detect actions
   */
  detectAllActions(): DetectedAction[] {
    this.detectedActions = [];
    
    // Process events chronologically
    this.events.forEach(event => {
      this.processEvent(event);
    });

    // Sort by timestamp
    this.detectedActions.sort((a, b) => a.timestamp - b.timestamp);

    return this.detectedActions;
  }

  /**
   * Get actions within a time window
   */
  getActionsInWindow(startTime: number, endTime: number): DetectedAction[] {
    return this.detectedActions.filter(
      a => a.timestamp >= startTime && a.timestamp <= endTime
    );
  }

  /**
   * Get the most important action at a given time
   */
  getPrimaryActionAtTime(timestamp: number, windowMs: number = 1000): DetectedAction | null {
    const windowStart = timestamp - windowMs / 2;
    const windowEnd = timestamp + windowMs / 2;
    
    const actions = this.getActionsInWindow(windowStart, windowEnd);
    if (actions.length === 0) return null;

    return actions.reduce((highest, current) =>
      current.dramaScore > highest.dramaScore ? current : highest
    );
  }

  /**
   * Predict upcoming actions based on current game state
   */
  predictUpcomingActions(currentTime: number): DetectedAction[] {
    const predictions: DetectedAction[] = [];
    const currentRound = this.getCurrentRound(currentTime);
    
    if (!currentRound) return predictions;

    // Check for active clutch situations
    this.activeClutches.forEach((clutch, playerId) => {
      if (clutch.roundNumber === currentRound.roundNumber) {
        const player = this.players.get(playerId);
        if (player) {
          predictions.push({
            id: `pred-${playerId}`,
            type: 'clutch',
            timestamp: currentTime + 1000,
            roundNumber: currentRound.roundNumber,
            importance: clutch.enemiesRemaining >= 2 ? 'high' : 'medium',
            dramaScore: this.calculateClutchDramaScore(clutch),
            position: this.getPlayerPosition(playerId, currentTime),
            primaryPlayerId: playerId,
            description: `${player.name} in ${clutch.enemiesRemaining}v${clutch.alliesRemaining} clutch`,
            metadata: { predicted: true, clutch },
            duration: DETECTION_CONFIG.FOCUS_DURATION.clutch,
          });
        }
      }
    });

    return predictions.sort((a, b) => b.dramaScore - a.dramaScore);
  }

  // --------------------------------------------------------------------------
  // Event Processing
  // --------------------------------------------------------------------------

  private processEvent(event: GameEvent): void {
    switch (event.type) {
      case 'kill':
        this.processKill(event as KillEvent);
        break;
      case 'bomb_plant':
        this.processBombPlant(event as BombPlantEvent);
        break;
      case 'bomb_defuse':
        this.processBombDefuse(event as BombDefuseEvent);
        break;
      case 'round_end':
        this.processRoundEnd(event as RoundEndEvent);
        break;
      case 'round_start':
        this.processRoundStart(event);
        break;
    }
  }

  private processKill(kill: KillEvent): void {
    this.trackKillChain(kill);
    this.updateClutchSituations(kill);
    this.trackPlayerDeath(kill);

    let dramaScore = DETECTION_CONFIG.BASE_SCORES.kill;
    const multipliers: number[] = [];

    // Check for headshot
    if (kill.isHeadshot) {
      multipliers.push(DETECTION_CONFIG.MULTIPLIERS.HEADSHOT);
    }

    // Check for wallbang
    if (kill.isWallbang) {
      multipliers.push(DETECTION_CONFIG.MULTIPLIERS.WALLBANG);
    }

    // Check for trade kill
    const isTrade = this.isTradeKill(kill);
    if (isTrade) {
      multipliers.push(DETECTION_CONFIG.MULTIPLIERS.TRADE_KILL);
    }

    // Check for opening kill
    const isOpening = this.isOpeningKill(kill);
    if (isOpening) {
      multipliers.push(DETECTION_CONFIG.MULTIPLIERS.OPENING_KILL);
    }

    // Apply multipliers
    multipliers.forEach(m => dramaScore *= m);

    // Create action
    const action: DetectedAction = {
      id: `kill-${kill.id}`,
      type: isTrade ? 'trade_kill' : isOpening ? 'opening_kill' : 'kill',
      timestamp: kill.timestamp,
      roundNumber: kill.roundNumber,
      importance: this.scoreToImportance(dramaScore),
      dramaScore: Math.min(100, dramaScore),
      position: kill.position,
      primaryPlayerId: kill.killerId,
      secondaryPlayerIds: [kill.victimId],
      description: this.describeKill(kill, isOpening, isTrade),
      metadata: { kill, multipliers },
      duration: isTrade 
        ? DETECTION_CONFIG.FOCUS_DURATION.trade_kill 
        : isOpening 
          ? DETECTION_CONFIG.FOCUS_DURATION.opening_kill 
          : DETECTION_CONFIG.FOCUS_DURATION.kill,
    };

    this.detectedActions.push(action);

    // Check for multi-kill completion
    this.checkMultiKill(kill);

    // Check for ace
    this.checkAce(kill);
  }

  private processBombPlant(plant: BombPlantEvent): void {
    const player = this.players.get(plant.playerId);
    
    let dramaScore = DETECTION_CONFIG.BASE_SCORES.bomb_plant;
    dramaScore *= DETECTION_CONFIG.MULTIPLIERS.BOMB_PLANT;

    // Higher drama in clutch situations
    const clutch = this.activeClutches.get(plant.playerId);
    if (clutch) {
      dramaScore *= 1.3;
    }

    const action: DetectedAction = {
      id: `plant-${plant.id}`,
      type: 'bomb_plant',
      timestamp: plant.timestamp,
      roundNumber: plant.roundNumber,
      importance: 'high',
      dramaScore: Math.min(100, dramaScore),
      position: plant.position,
      primaryPlayerId: plant.playerId,
      description: `${player?.name || 'Unknown'} planted the bomb at ${plant.site}`,
      metadata: { plant, site: plant.site },
      duration: DETECTION_CONFIG.FOCUS_DURATION.bomb_plant,
    };

    this.detectedActions.push(action);

    // Check for retake situation
    this.detectRetakeSituation(plant);
  }

  private processBombDefuse(defuse: BombDefuseEvent): void {
    const player = this.players.get(defuse.playerId);
    
    let dramaScore = DETECTION_CONFIG.BASE_SCORES.bomb_defuse;
    dramaScore *= DETECTION_CONFIG.MULTIPLIERS.BOMB_DEFUSE;

    // Higher drama if defuse was close
    if (defuse.defuseProgress > 0.8) {
      dramaScore *= 1.5;
    }

    const action: DetectedAction = {
      id: `defuse-${defuse.id}`,
      type: 'bomb_defuse',
      timestamp: defuse.timestamp,
      roundNumber: defuse.roundNumber,
      importance: 'critical',
      dramaScore: Math.min(100, dramaScore),
      position: defuse.position,
      primaryPlayerId: defuse.playerId,
      description: `${player?.name || 'Unknown'} defused the bomb`,
      metadata: { defuse, progress: defuse.defuseProgress },
      duration: DETECTION_CONFIG.FOCUS_DURATION.bomb_defuse,
    };

    this.detectedActions.push(action);
  }

  private processRoundEnd(roundEnd: RoundEndEvent): void {
    // Resolve active clutches
    this.activeClutches.forEach((clutch, playerId) => {
      if (clutch.roundNumber === roundEnd.roundNumber) {
        clutch.succeeded = this.didClutchSucceed(clutch, roundEnd);
        
        if (clutch.succeeded) {
          const player = this.players.get(playerId);
          const dramaScore = this.calculateClutchDramaScore(clutch) * 
            DETECTION_CONFIG.MULTIPLIERS.ROUND_WIN_CLUTCH;

          const action: DetectedAction = {
            id: `clutch-win-${playerId}-${roundEnd.roundNumber}`,
            type: 'clutch',
            timestamp: roundEnd.timestamp,
            roundNumber: roundEnd.roundNumber,
            importance: 'critical',
            dramaScore: Math.min(100, dramaScore),
            position: this.getPlayerPosition(playerId, roundEnd.timestamp),
            primaryPlayerId: playerId,
            description: `${player?.name || 'Unknown'} won the ${clutch.enemiesRemaining}v${clutch.alliesRemaining} clutch!`,
            metadata: { clutch, won: true },
            duration: DETECTION_CONFIG.FOCUS_DURATION.clutch,
          };

          this.detectedActions.push(action);
        }
      }
    });

    // Clear active clutches for this round
    this.activeClutches.clear();

    // Round win action
    const winningTeam = this.teams.get(
      roundEnd.winningSide === 'attacker' ? 'team-a' : 'team-b'
    );
    
    const action: DetectedAction = {
      id: `round-end-${roundEnd.roundNumber}`,
      type: 'round_win',
      timestamp: roundEnd.timestamp,
      roundNumber: roundEnd.roundNumber,
      importance: 'medium',
      dramaScore: DETECTION_CONFIG.BASE_SCORES.round_win,
      position: { x: 0, y: 0, z: 0 }, // Center of map
      description: `${winningTeam?.name || roundEnd.winningSide} wins the round`,
      metadata: { roundEnd },
      duration: DETECTION_CONFIG.FOCUS_DURATION.round_win,
    };

    this.detectedActions.push(action);
  }

  private processRoundStart(event: GameEvent): void {
    this.roundStartTimes.set(event.roundNumber, event.timestamp);
    this.playerDeathsInRound.set(event.roundNumber, new Set());
    this.killChains.clear();
  }

  // --------------------------------------------------------------------------
  // Detection Helpers
  // --------------------------------------------------------------------------

  private trackKillChain(kill: KillEvent): void {
    const existingChain = this.killChains.get(kill.killerId);
    
    if (existingChain) {
      // Check if within multi-kill window
      if (kill.timestamp - existingChain.endTime <= DETECTION_CONFIG.MULTI_KILL_WINDOW_MS) {
        existingChain.kills.push(kill);
        existingChain.endTime = kill.timestamp;
        existingChain.isMultiKill = existingChain.kills.length >= DETECTION_CONFIG.MIN_MULTI_KILL;
      } else {
        // Start new chain
        this.killChains.set(kill.killerId, {
          playerId: kill.killerId,
          kills: [kill],
          startTime: kill.timestamp,
          endTime: kill.timestamp,
          isMultiKill: false,
        });
      }
    } else {
      this.killChains.set(kill.killerId, {
        playerId: kill.killerId,
        kills: [kill],
        startTime: kill.timestamp,
        endTime: kill.timestamp,
        isMultiKill: false,
      });
    }
  }

  private checkMultiKill(kill: KillEvent): void {
    const chain = this.killChains.get(kill.killerId);
    if (!chain || !chain.isMultiKill) return;

    // Only trigger on the kill that completes the multi-kill
    if (chain.kills[chain.kills.length - 1].id !== kill.id) return;

    const player = this.players.get(kill.killerId);
    const killCount = chain.kills.length;

    let dramaScore = DETECTION_CONFIG.BASE_SCORES.multi_kill;
    
    // Apply multi-kill multipliers
    if (killCount === 3) {
      dramaScore *= DETECTION_CONFIG.MULTIPLIERS.MULTI_KILL_3;
    } else if (killCount === 4) {
      dramaScore *= DETECTION_CONFIG.MULTIPLIERS.MULTI_KILL_4;
    } else if (killCount >= 5) {
      dramaScore *= DETECTION_CONFIG.MULTIPLIERS.MULTI_KILL_5;
    }

    const action: DetectedAction = {
      id: `multikill-${kill.killerId}-${kill.timestamp}`,
      type: 'multi_kill',
      timestamp: chain.startTime,
      roundNumber: kill.roundNumber,
      importance: killCount >= 4 ? 'critical' : 'high',
      dramaScore: Math.min(100, dramaScore),
      position: kill.position,
      primaryPlayerId: kill.killerId,
      description: `${player?.name || 'Unknown'} gets a ${killCount}K!`,
      metadata: { chain, killCount, kills: chain.kills },
      duration: DETECTION_CONFIG.FOCUS_DURATION.multi_kill,
    };

    this.detectedActions.push(action);
  }

  private checkAce(kill: KillEvent): void {
    const chain = this.killChains.get(kill.killerId);
    if (!chain) return;

    // Check if this is the 5th kill in the round for this player
    const roundKills = chain.kills.filter(k => k.roundNumber === kill.roundNumber);
    if (roundKills.length !== 5) return;

    const player = this.players.get(kill.killerId);
    const dramaScore = DETECTION_CONFIG.BASE_SCORES.ace * DETECTION_CONFIG.MULTIPLIERS.ACE;

    const action: DetectedAction = {
      id: `ace-${kill.killerId}-${kill.timestamp}`,
      type: 'ace',
      timestamp: chain.startTime,
      roundNumber: kill.roundNumber,
      importance: 'critical',
      dramaScore: Math.min(100, dramaScore),
      position: kill.position,
      primaryPlayerId: kill.killerId,
      description: `${player?.name || 'Unknown'} gets the ACE!`,
      metadata: { chain, kills: roundKills },
      duration: DETECTION_CONFIG.FOCUS_DURATION.ace,
    };

    this.detectedActions.push(action);
  }

  private updateClutchSituations(kill: KillEvent): void {
    const round = this.getRound(kill.roundNumber);
    if (!round) return;

    // Track deaths
    const deathsInRound = this.playerDeathsInRound.get(kill.roundNumber) || new Set();
    deathsInRound.add(kill.victimId);
    this.playerDeathsInRound.set(kill.roundNumber, deathsInRound);

    // Get team compositions
    const victim = this.players.get(kill.victimId);
    if (!victim) return;

    const victimTeamId = victim.teamId;
    const victimTeam = this.teams.get(victimTeamId);
    if (!victimTeam) return;

    // Count alive players per team
    const teamPlayers = Array.from(this.players.values()).filter(p => p.teamId === victimTeamId);
    const alivePlayers = teamPlayers.filter(p => !deathsInRound.has(p.id));

    // If only one player left on team, it's a clutch
    if (alivePlayers.length === 1) {
      const clutchPlayer = alivePlayers[0];
      const enemyTeamId = this.teams.get(victimTeamId)?.id === this.teams.get('team-a')?.id 
        ? 'team-b' 
        : 'team-a';
      const enemyPlayers = Array.from(this.players.values()).filter(p => p.teamId === enemyTeamId);
      const aliveEnemies = enemyPlayers.filter(p => !deathsInRound.has(p.id));

      if (aliveEnemies.length >= 1 && !this.activeClutches.has(clutchPlayer.id)) {
        const clutch: ClutchSituation = {
          playerId: clutchPlayer.id,
          teamId: victimTeamId,
          enemiesRemaining: aliveEnemies.length,
          alliesRemaining: 0,
          startTime: kill.timestamp,
          roundNumber: kill.roundNumber,
        };

        this.activeClutches.set(clutchPlayer.id, clutch);

        // Create clutch detected action
        const dramaScore = this.calculateClutchDramaScore(clutch);
        
        const action: DetectedAction = {
          id: `clutch-start-${clutchPlayer.id}-${kill.timestamp}`,
          type: 'clutch',
          timestamp: kill.timestamp,
          roundNumber: kill.roundNumber,
          importance: aliveEnemies.length >= 2 ? 'high' : 'medium',
          dramaScore,
          position: this.getPlayerPosition(clutchPlayer.id, kill.timestamp),
          primaryPlayerId: clutchPlayer.id,
          description: `${clutchPlayer.name} in a ${aliveEnemies.length}v1 clutch situation!`,
          metadata: { clutch, started: true },
          duration: DETECTION_CONFIG.FOCUS_DURATION.clutch,
        };

        this.detectedActions.push(action);
      }
    }
  }

  private detectRetakeSituation(plant: BombPlantEvent): void {
    const round = this.getRound(plant.roundNumber);
    if (!round) return;

    // Check if defenders are at a disadvantage
    const deathsInRound = this.playerDeathsInRound.get(plant.roundNumber) || new Set();
    
    // This is simplified - in reality would check team sides
    const action: DetectedAction = {
      id: `retake-${plant.roundNumber}`,
      type: 'retake',
      timestamp: plant.timestamp,
      roundNumber: plant.roundNumber,
      importance: 'high',
      dramaScore: DETECTION_CONFIG.BASE_SCORES.retake,
      position: plant.position,
      primaryPlayerId: plant.playerId,
      description: `Retake situation at ${plant.site}`,
      metadata: { plant },
      duration: DETECTION_CONFIG.FOCUS_DURATION.retake,
    };

    this.detectedActions.push(action);
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private isTradeKill(kill: KillEvent): boolean {
    // Check if victim killed someone very recently
    const victimKills = this.events.filter(
      e => 
        e.type === 'kill' && 
        (e as KillEvent).killerId === kill.victimId &&
        e.timestamp > kill.timestamp - DETECTION_CONFIG.TRADE_KILL_WINDOW_MS &&
        e.timestamp < kill.timestamp
    );

    return victimKills.length > 0;
  }

  private isOpeningKill(kill: KillEvent): boolean {
    const roundStart = this.roundStartTimes.get(kill.roundNumber);
    if (!roundStart) return false;

    return kill.timestamp - roundStart <= DETECTION_CONFIG.OPENING_KILL_WINDOW_MS;
  }

  private didClutchSucceed(clutch: ClutchSituation, roundEnd: RoundEndEvent): boolean {
    const player = this.players.get(clutch.playerId);
    if (!player) return false;

    const playerTeam = this.teams.get(player.teamId);
    if (!playerTeam) return false;

    // Determine if player's team won
    const winningTeamSide = roundEnd.winningSide;
    const playerTeamSide = player.teamSide;

    return winningTeamSide === playerTeamSide;
  }

  private calculateClutchDramaScore(clutch: ClutchSituation): number {
    let score = DETECTION_CONFIG.BASE_SCORES.clutch;

    if (clutch.enemiesRemaining === 1) {
      score *= DETECTION_CONFIG.MULTIPLIERS.CLUTCH_1v1;
    } else if (clutch.enemiesRemaining === 2) {
      score *= DETECTION_CONFIG.MULTIPLIERS.CLUTCH_1v2;
    } else if (clutch.enemiesRemaining >= 3) {
      score *= DETECTION_CONFIG.MULTIPLIERS.CLUTCH_1v3_PLUS;
    }

    return Math.min(100, score);
  }

  private describeKill(kill: KillEvent, isOpening: boolean, isTrade: boolean): string {
    const killer = this.players.get(kill.killerId);
    const victim = this.players.get(kill.victimId);
    
    const parts: string[] = [];
    
    if (isOpening) parts.push('Opening');
    if (kill.isHeadshot) parts.push('headshot');
    if (kill.isWallbang) parts.push('wallbang');
    if (isTrade) parts.push('trade');
    
    const modifier = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    
    return `${killer?.name || 'Unknown'} killed ${victim?.name || 'Unknown'}${modifier}`;
  }

  private scoreToImportance(score: number): ActionImportance {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private getRound(roundNumber: number): Round | undefined {
    return this.rounds.find(r => r.roundNumber === roundNumber);
  }

  private getCurrentRound(timestamp: number): Round | undefined {
    return this.rounds.find(
      r => r.startTime <= timestamp && r.endTime >= timestamp
    );
  }

  private getPlayerPosition(playerId: string, timestamp: number): Position3D {
    // In a real implementation, this would look up the player's position
    // from the player state data at the given timestamp
    return { x: 0, y: 0, z: 0 };
  }

  private trackPlayerDeath(kill: KillEvent): void {
    const deaths = this.playerDeathsInRound.get(kill.roundNumber) || new Set();
    deaths.add(kill.victimId);
    this.playerDeathsInRound.set(kill.roundNumber, deaths);
  }

  private initializeRoundTracking(): void {
    this.rounds.forEach(round => {
      this.roundStartTimes.set(round.roundNumber, round.startTime);
      this.playerDeathsInRound.set(round.roundNumber, new Set());
    });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createActionDetectionEngine(
  events: GameEvent[],
  players: Player[],
  teams: Team[],
  rounds: Round[]
): ActionDetectionEngine {
  return new ActionDetectionEngine(events, players, teams, rounds);
}

// ============================================================================
// Utility Exports
// ============================================================================

export function calculateActionPriority(actions: DetectedAction[]): DetectedAction[] {
  return [...actions].sort((a, b) => {
    // Sort by importance first, then by drama score
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
    
    if (importanceDiff !== 0) return importanceDiff;
    return b.dramaScore - a.dramaScore;
  });
}

export function mergeOverlappingActions(
  actions: DetectedAction[],
  mergeWindowMs: number = 2000
): DetectedAction[] {
  if (actions.length === 0) return [];

  const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
  const merged: DetectedAction[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    const overlap = (last.timestamp + last.duration) >= (current.timestamp - mergeWindowMs);

    if (overlap && current.dramaScore > last.dramaScore) {
      // Replace with higher drama action
      merged[merged.length - 1] = current;
    } else if (!overlap) {
      merged.push(current);
    }
  }

  return merged;
}

// ============================================================================
// Default Export
// ============================================================================

export default ActionDetectionEngine;
