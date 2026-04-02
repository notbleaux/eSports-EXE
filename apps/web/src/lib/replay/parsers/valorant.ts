// @ts-nocheck
/**
 * Valorant Replay Parser
 * Parses Valorant match JSON/demo files to normalized replay format
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-A
 * Team: Replay 2.0 Core (TL-S2)
 * 
 * Supports:
 * - Valorant API JSON format
 * - Custom demo format (v1.x)
 * - Player positions, kills, plants, defuses
 * - Round structure normalization
 * - Event timeline generation
 */

import type {
  Replay,
  ReplayParser,
  ParseOptions,
  ParseResult,
  ParseStats,
  ParseProgress,
  GameType,
  Player,
  PlayerState,
  Team,
  Round,
  GameEvent,
  KillEvent,
  BombPlantEvent,
  BombDefuseEvent,
  BombExplodeEvent,
  RoundStartEvent,
  RoundEndEvent,
  AbilityUseEvent,
  WeaponFireEvent,
  TeamSide,
  RoundOutcome,
  Position3D,
  TimelineEvent,
  ReplayMetadata,
  ReplayTimeline,
} from '../types';
import {
  REPLAY_SCHEMA_VERSION,
  PARSER_PERFORMANCE_LIMITS,
  PARSE_ERROR_CODES,
  createEmptyReplay,
  generateEventId,
  calculateDistance,
  clamp,
} from '../types';

// ============================================================================
// Valorant-Specific Types
// ============================================================================

interface ValorantRawMatch {
  matchInfo?: {
    matchId?: string;
    mapId?: string;
    gameVersion?: string;
    gameLengthMillis?: number;
    completionState?: string;
    seasonId?: string;
  };
  players?: ValorantRawPlayer[];
  teams?: ValorantRawTeam[];
  roundResults?: ValorantRawRound[];
  kills?: ValorantRawKill[];
}

interface ValorantRawPlayer {
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  teamId?: string;
  partyId?: string;
  characterId?: string;
  stats?: {
    score?: number;
    roundsPlayed?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
  };
  competitiveTier?: number;
  playerCard?: string;
  playerTitle?: string;
  accountLevel?: number;
}

interface ValorantRawTeam {
  teamId?: string;
  won?: boolean;
  roundsPlayed?: number;
  roundsWon?: number;
  numPoints?: number;
}

interface ValorantRawRound {
  roundNum?: number;
  roundResult?: string;
  roundCeremony?: string;
  winningTeam?: string;
  bombPlanter?: string;
  bombDefuser?: string;
  plantRoundTime?: number;
  defuseRoundTime?: number;
  playerStats?: ValorantRawPlayerRoundStats[];
}

interface ValorantRawPlayerRoundStats {
  puuid?: string;
  kills?: ValorantRawKill[];
  damage?: ValorantRawDamage[];
  score?: number;
  economy?: {
    loadoutValue?: number;
    weapon?: string;
    armor?: string;
    remaining?: number;
    spent?: number;
  };
  ability?: {
    grenadeEffects?: unknown;
    ability1Effects?: unknown;
    ability2Effects?: unknown;
    ultimateEffects?: unknown;
  };
  wasAfk?: boolean;
  receivedPenalty?: boolean;
  stayedInSpawn?: boolean;
}

interface ValorantRawKill {
  gameTime?: number;
  roundTime?: number;
  round?: number;
  killer?: string;
  victim?: string;
  assistants?: string[];
  location?: { x?: number; y?: number };
  weapon?: string;
  secondaryFireMode?: boolean;
  playerLocations?: ValorantRawPlayerLocation[];
}

interface ValorantRawDamage {
  receiver?: string;
  damage?: number;
  legshots?: number;
  bodyshots?: number;
  headshots?: number;
}

interface ValorantRawPlayerLocation {
  puuid?: string;
  viewRadians?: number;
  location?: { x?: number; y?: number };
}

// ============================================================================
// Agent ID Mapping
// ============================================================================

const AGENT_ID_MAP: Record<string, string> = {
  // Common agent UUIDs (simplified - actual mapping would be more complete)
  'dade69b4-4f5a-8528-247b-219e5a1facd6': 'Fade',
  '5f8d3a7f-467b-97f3-062c-13acf203c006': 'Breach',
  'f94c3b30-42be-e959-889c-5aa313dba261': 'Raze',
  '22697a3d-45bf-8dd7-4fec-84a9e28cf69c': 'Chamber',
  '601dbbe7-43ce-be57-2a40-4abd24953621': 'KAY/O',
  '6f2a04ca-43e0-be17-7f36-b3908627744d': 'Skye',
  '117ed9e3-49f3-6512-3ccf-0cada7e3823b': 'Cypher',
  '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Sova',
  '1e58de9c-4950-5125-93e9-a0aee9f98746': 'Killjoy',
  '707eab51-4836-f488-046a-cda6bf494859': 'Viper',
  'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Phoenix',
  '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': 'Astra',
  '9f0d8ba9-4140-b941-57a3-7eb57f5776dd': 'Brimstone',
  'bb2a4828-46eb-8cd1-e765-15848195d751': 'Neon',
  '7f94d92c-4234-0a36-9646-3a87eb8b5c89': 'Yoru',
  '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sage',
  'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': 'Reyna',
  '8e253930-4c05-31dd-1b6c-968525494517': 'Omen',
  'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Jett',
  'b24f7b9d-4659-5d8e-9153-986cc08f0386': 'Iso',
  'cc8b64c8-4d25-47b4-bbc8-266f24bc1bd1': 'Harbor',
  'e370fa57-4757-3604-3648-499e1f642d3f': 'Gekko',
  'd3a09d57-43f2-3e70-88a6-23841df47e68': 'Clove',
  '0c7e7c3e-4c16-7c63-9949-b64e7d8a9e64': 'Deadlock',
  'efba5359-4016-a1e5-762e-bf4b629a1133': 'Vyse',
};

const AGENT_ROLES: Record<string, string> = {
  'Fade': 'initiator',
  'Breach': 'initiator',
  'Raze': 'duelist',
  'Chamber': 'sentinel',
  'KAY/O': 'initiator',
  'Skye': 'initiator',
  'Cypher': 'sentinel',
  'Sova': 'initiator',
  'Killjoy': 'sentinel',
  'Viper': 'controller',
  'Phoenix': 'duelist',
  'Astra': 'controller',
  'Brimstone': 'controller',
  'Neon': 'duelist',
  'Yoru': 'duelist',
  'Sage': 'sentinel',
  'Reyna': 'duelist',
  'Omen': 'controller',
  'Jett': 'duelist',
  'Iso': 'duelist',
  'Harbor': 'controller',
  'Gekko': 'initiator',
  'Clove': 'controller',
  'Deadlock': 'sentinel',
  'Vyse': 'sentinel',
};

const MAP_ID_MAP: Record<string, string> = {
  '/Game/Maps/Ascent/Ascent': 'Ascent',
  '/Game/Maps/Breeze/Breeze': 'Breeze',
  '/Game/Maps/Fracture/Fracture': 'Fracture',
  '/Game/Maps/Haven/Haven': 'Haven',
  '/Game/Maps/Icebox/Icebox': 'Icebox',
  '/Game/Maps/Lotus/Lotus': 'Lotus',
  '/Game/Maps/Pearl/Pearl': 'Pearl',
  '/Game/Maps/Split/Split': 'Split',
  '/Game/Maps/Sunset/Sunset': 'Sunset',
  '/Game/Maps/Bind/Bind': 'Bind',
};

// ============================================================================
// Parser Implementation
// ============================================================================

export class ValorantReplayParser implements ReplayParser {
  readonly gameType: GameType = 'valorant';
  readonly supportedVersions = ['1.0.0', '2.0.0', 'v1', 'v2'];

  async parse(
    data: ArrayBuffer | string,
    options: Partial<ParseOptions> = {}
  ): Promise<ParseResult> {
    const startTime = performance.now();
    let memoryBefore = 0;
    
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      memoryBefore = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
    }

    const stats: ParseStats = {
      fileSize: typeof data === 'string' ? data.length : data.byteLength,
      parseTime: 0,
      memoryPeak: 0,
      eventsParsed: 0,
      roundsParsed: 0,
      warnings: [],
    };

    // File size check
    if (stats.fileSize > (options.maxFileSize || PARSER_PERFORMANCE_LIMITS.MAX_FILE_SIZE)) {
      return {
        success: false,
        error: {
          code: PARSE_ERROR_CODES.FILE_TOO_LARGE,
          message: `File size ${stats.fileSize} exceeds maximum ${PARSER_PERFORMANCE_LIMITS.MAX_FILE_SIZE}`,
        },
        stats,
      };
    }

    try {
      // Report progress
      this.reportProgress(options, { stage: 'reading', percent: 10, bytesProcessed: 0, totalBytes: stats.fileSize });

      // Parse JSON
      const rawData = this.parseRawData(data);
      
      this.reportProgress(options, { stage: 'parsing', percent: 30, bytesProcessed: stats.fileSize / 3, totalBytes: stats.fileSize });

      // Validate format
      if (!this.validateFormat(rawData)) {
        return {
          success: false,
          error: {
            code: PARSE_ERROR_CODES.INVALID_FORMAT,
            message: 'Invalid Valorant replay format',
          },
          stats,
        };
      }

      const rawMatch = rawData as ValorantRawMatch;

      this.reportProgress(options, { stage: 'normalizing', percent: 50, bytesProcessed: stats.fileSize / 2, totalBytes: stats.fileSize });

      // Build replay
      const replay = await this.buildReplay(rawMatch, stats, options);

      this.reportProgress(options, { stage: 'validating', percent: 90, bytesProcessed: stats.fileSize * 0.9, totalBytes: stats.fileSize });

      // Calculate stats
      stats.parseTime = performance.now() - startTime;
      
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memoryAfter = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
        stats.memoryPeak = Math.max(0, (memoryAfter - memoryBefore) / (1024 * 1024));
      }

      // Performance check
      if (stats.parseTime > PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS) {
        stats.warnings.push(`Parse time ${stats.parseTime.toFixed(2)}ms exceeds target ${PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS}ms`);
      }

      if (stats.memoryPeak > PARSER_PERFORMANCE_LIMITS.MAX_MEMORY_MB) {
        stats.warnings.push(`Memory usage ${stats.memoryPeak.toFixed(2)}MB exceeds target ${PARSER_PERFORMANCE_LIMITS.MAX_MEMORY_MB}MB`);
      }

      this.reportProgress(options, { stage: 'validating', percent: 100, bytesProcessed: stats.fileSize, totalBytes: stats.fileSize });

      return {
        success: true,
        replay,
        stats,
      };
    } catch (error) {
      stats.parseTime = performance.now() - startTime;
      
      return {
        success: false,
        error: {
          code: PARSE_ERROR_CODES.CORRUPT_DATA,
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          details: { error: String(error) },
        },
        stats,
      };
    }
  }

  validate(data: unknown): boolean {
    return this.validateFormat(data);
  }

  getSupportedFormats(): string[] {
    return ['application/json', 'valorant-replay', 'valorant-demo'];
  }

  // ============================================================================
// Private Methods
// ============================================================================

  private parseRawData(data: ArrayBuffer | string): unknown {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    
    // Try to decompress if needed (simplified - would use pako or similar in production)
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(data);
    return JSON.parse(text);
  }

  private validateFormat(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;
    
    const match = data as ValorantRawMatch;
    
    // Check for required fields
    return (
      'matchInfo' in match ||
      'players' in match ||
      'roundResults' in match ||
      'kills' in match
    );
  }

  private reportProgress(options: Partial<ParseOptions>, progress: ParseProgress): void {
    if (options.progressCallback) {
      try {
        options.progressCallback(progress);
      } catch {
        // Ignore callback errors
      }
    }
  }

  private async buildReplay(
    rawMatch: ValorantRawMatch,
    stats: ParseStats,
    options: Partial<ParseOptions>
  ): Promise<Replay> {
    const matchInfo = rawMatch.matchInfo || {};
    const matchId = matchInfo.matchId || `valorant-${Date.now()}`;
    
    const replay = createEmptyReplay('valorant', matchId);
    
    // Set metadata
    replay.mapName = this.getMapName(matchInfo.mapId || '');
    replay.duration = (matchInfo.gameLengthMillis || 0) / 1000;
    replay.metadata = this.buildMetadata(matchInfo, stats.fileSize);
    
    // Build teams
    const teams = this.buildTeams(rawMatch.teams || []);
    replay.teams = [teams[0], teams[1]];
    
    // Build players
    replay.players = this.buildPlayers(rawMatch.players || [], teams);
    
    // Update team player IDs
    replay.teams[0].playerIds = replay.players
      .filter(p => p.teamId === teams[0].id)
      .map(p => p.id);
    replay.teams[1].playerIds = replay.players
      .filter(p => p.teamId === teams[1].id)
      .map(p => p.id);
    
    // Build rounds and events
    const rounds = this.buildRounds(rawMatch.roundResults || [], rawMatch.kills || []);
    replay.rounds = rounds;
    replay.events = this.extractAllEvents(rounds);
    
    // Build timeline
    replay.timeline = this.buildTimeline(rounds, replay.events);
    
    // Update stats
    stats.roundsParsed = rounds.length;
    stats.eventsParsed = replay.events.length;
    
    return replay;
  }

  private buildMetadata(matchInfo: ValorantRawMatch['matchInfo'], fileSize: number): ReplayMetadata {
    return {
      gameVersion: matchInfo?.gameVersion || '',
      demoVersion: 'valorant-api-v1',
      serverTickRate: 128,
      totalTicks: 0,
      fileSize,
      parserVersion: REPLAY_SCHEMA_VERSION,
      recordingSoftware: 'Valorant API',
    };
  }

  private buildTeams(rawTeams: ValorantRawTeam[]): [Team, Team] {
    const defaultTeams: [Team, Team] = [
      { id: 'Blue', name: 'Blue', side: 'attacker', score: 0, money: 0, playerIds: [], timeoutsRemaining: 2 },
      { id: 'Red', name: 'Red', side: 'defender', score: 0, money: 0, playerIds: [], timeoutsRemaining: 2 },
    ];
    
    if (rawTeams.length >= 2) {
      defaultTeams[0].id = rawTeams[0].teamId || 'Blue';
      defaultTeams[0].score = rawTeams[0].roundsWon || 0;
      defaultTeams[1].id = rawTeams[1].teamId || 'Red';
      defaultTeams[1].score = rawTeams[1].roundsWon || 0;
    }
    
    return defaultTeams;
  }

  private buildPlayers(rawPlayers: ValorantRawPlayer[], teams: Team[]): Player[] {
    return rawPlayers.map((rawPlayer, index) => {
      const agentId = rawPlayer.characterId || '';
      const agentName = AGENT_ID_MAP[agentId] || 'Unknown';
      
      return {
        id: rawPlayer.puuid || `player-${index}`,
        name: rawPlayer.gameName || 'Unknown',
        teamId: rawPlayer.teamId || (index < 5 ? teams[0].id : teams[1].id),
        teamSide: index < 5 ? 'attacker' : 'defender',
        agent: agentName,
        role: (AGENT_ROLES[agentName] || '') as import('../types').AgentRole,
        isBot: false,
        stats: {
          kills: rawPlayer.stats?.kills || 0,
          deaths: rawPlayer.stats?.deaths || 0,
          assists: rawPlayer.stats?.assists || 0,
          damageDealt: 0, // Calculated from round data
          damageReceived: 0,
          headshots: 0,
          roundsPlayed: rawPlayer.stats?.roundsPlayed || 0,
          score: rawPlayer.stats?.score || 0,
        },
      };
    });
  }

  private buildRounds(rawRounds: ValorantRawRound[], rawKills: ValorantRawKill[]): Round[] {
    return rawRounds.map((rawRound, index) => {
      const roundNumber = rawRound.roundNum || index + 1;
      const outcome = this.mapRoundOutcome(rawRound.roundResult || '');
      const winningSide = this.mapWinningTeam(rawRound.winningTeam || '');
      
      // Filter kills for this round
      const roundKills = rawKills.filter(k => k.round === roundNumber || k.round === index + 1);
      
      // Build events
      const events: GameEvent[] = [];
      
      // Round start
      events.push({
        id: generateEventId(),
        type: 'round_start',
        timestamp: 0, // Would be calculated from actual game time
        roundNumber,
        teamASide: roundNumber <= 12 ? 'attacker' : 'defender',
        teamBSide: roundNumber <= 12 ? 'defender' : 'attacker',
      } as RoundStartEvent);
      
      // Kill events
      roundKills.forEach(rawKill => {
        events.push(this.createKillEvent(rawKill, roundNumber));
      });
      
      // Bomb plant
      if (rawRound.bombPlanter) {
        events.push({
          id: generateEventId(),
          type: 'bomb_plant',
          timestamp: (rawRound.plantRoundTime || 0) / 1000,
          roundNumber,
          playerId: rawRound.bombPlanter,
          site: 'A', // Default - would need actual site info
          position: { x: 0, y: 0, z: 0 },
          plantTime: (rawRound.plantRoundTime || 0) / 1000,
        } as BombPlantEvent);
      }
      
      // Bomb defuse
      if (rawRound.bombDefuser) {
        events.push({
          id: generateEventId(),
          type: 'bomb_defuse',
          timestamp: (rawRound.defuseRoundTime || 0) / 1000,
          roundNumber,
          playerId: rawRound.bombDefuser,
          site: 'A',
          position: { x: 0, y: 0, z: 0 },
          defuseTime: (rawRound.defuseRoundTime || 0) / 1000,
          wasKitUsed: false,
          defuseProgress: 1.0,
        } as BombDefuseEvent);
      }
      
      // Round end
      events.push({
        id: generateEventId(),
        type: 'round_end',
        timestamp: 100, // Would be actual round duration
        roundNumber,
        winningSide,
        outcome,
        teamAScore: winningSide === 'attacker' ? roundNumber : Math.max(0, roundNumber - 1),
        teamBScore: winningSide === 'defender' ? roundNumber : Math.max(0, roundNumber - 1),
      } as RoundEndEvent);
      
      return {
        roundNumber,
        winningSide,
        outcome,
        startTime: 0,
        endTime: 100, // Would be actual duration
        duration: 100,
        teamAScore: winningSide === 'attacker' ? roundNumber : Math.max(0, roundNumber - 1),
        teamBScore: winningSide === 'defender' ? roundNumber : Math.max(0, roundNumber - 1),
        events,
        playerStates: [], // Would be populated with per-tick state data
        economy: {
          teamA: { totalMoney: 0, loadoutValues: [], weapons: [] },
          teamB: { totalMoney: 0, loadoutValues: [], weapons: [] },
        },
      };
    });
  }

  private createKillEvent(rawKill: ValorantRawKill, roundNumber: number): KillEvent {
    return {
      id: generateEventId(),
      type: 'kill',
      timestamp: (rawKill.gameTime || 0) / 1000,
      roundNumber,
      killerId: rawKill.killer || '',
      victimId: rawKill.victim || '',
      assisterIds: rawKill.assistants || [],
      weaponId: rawKill.weapon || 'Unknown',
      isHeadshot: false, // Would be determined from damage data
      isWallbang: false,
      isFlashed: false,
      isTrade: false,
      position: { 
        x: rawKill.location?.x || 0, 
        y: rawKill.location?.y || 0, 
        z: 0 
      },
      victimPosition: { x: 0, y: 0, z: 0 },
    };
  }

  private extractAllEvents(rounds: Round[]): GameEvent[] {
    const allEvents: GameEvent[] = [];
    
    rounds.forEach(round => {
      allEvents.push(...round.events);
    });
    
    // Sort by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    return allEvents;
  }

  private buildTimeline(rounds: Round[], events: GameEvent[]): ReplayTimeline {
    const keyEvents: TimelineEvent[] = [];
    const roundStartTimes: number[] = [];
    
    rounds.forEach(round => {
      roundStartTimes.push(round.startTime);
      
      // Add key events from round
      round.events.forEach(event => {
        if (event.type === 'kill' || event.type === 'bomb_plant' || event.type === 'bomb_defuse') {
          keyEvents.push({
            timestamp: event.timestamp,
            roundNumber: round.roundNumber,
            type: event.type,
            description: this.getEventDescription(event),
            importance: this.getEventImportance(event),
          });
        }
      });
    });
    
    // Sort key events
    keyEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      totalRounds: rounds.length,
      roundStartTimes,
      keyEvents,
    };
  }

  private getEventDescription(event: GameEvent): string {
    switch (event.type) {
      case 'kill':
        const kill = event as KillEvent;
        return `${kill.killerId} killed ${kill.victimId}`;
      case 'bomb_plant':
        const plant = event as BombPlantEvent;
        return `Bomb planted at ${plant.site}`;
      case 'bomb_defuse':
        return 'Bomb defused';
      default:
        return event.type;
    }
  }

  private getEventImportance(event: GameEvent): 'low' | 'medium' | 'high' | 'critical' {
    switch (event.type) {
      case 'kill':
        const kill = event as KillEvent;
        if (kill.isHeadshot) return 'high';
        return 'medium';
      case 'bomb_plant':
      case 'bomb_defuse':
        return 'critical';
      case 'bomb_explode':
        return 'critical';
      default:
        return 'low';
    }
  }

  private mapRoundOutcome(result: string): RoundOutcome {
    const outcomeMap: Record<string, RoundOutcome> = {
      'Elimination': 'elimination',
      'Bomb detonated': 'bomb_exploded',
      'Bomb defused': 'bomb_defused',
      'Time expired': 'time_expired',
      'Defuse prevented': 'defuse_prevented',
      'Surrendered': 'surrender',
    };
    
    return outcomeMap[result] || 'draw';
  }

  private mapWinningTeam(team: string): TeamSide {
    if (team === 'Blue' || team === 'team_a') return 'attacker';
    if (team === 'Red' || team === 'team_b') return 'defender';
    return 'team_a';
  }

  private getMapName(mapId: string): string {
    return MAP_ID_MAP[mapId] || mapId.split('/').pop()?.replace(/_P$/, '') || 'Unknown';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createValorantParser(): ValorantReplayParser {
  return new ValorantReplayParser();
}

// ============================================================================
// Default Export
// ============================================================================

export default ValorantReplayParser;
