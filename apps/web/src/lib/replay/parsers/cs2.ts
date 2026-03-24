/**
 * CS2 Replay Parser
 * Parses Counter-Strike 2 demo files to normalized replay format
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-A
 * Team: Replay 2.0 Core (TL-S2)
 * 
 * Supports:
 * - CS2 demo format (experimental)
 * - Player positions, kills, plants, defuses
 * - Round structure normalization
 * - Event timeline generation
 * 
 * Note: Full CS2 demo parsing requires binary parsing of .dem files.
 * This implementation provides a normalized interface with JSON-based parsing
 * and placeholders for binary parsing integration.
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
  WeaponFireEvent,
  BuyEvent,
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
// CS2-Specific Types
// ============================================================================

interface CS2RawMatch {
  header?: CS2DemoHeader;
  gameEvents?: CS2GameEvent[];
  tickEvents?: CS2TickEvent[];
  playerInfo?: CS2PlayerInfo[];
  matchInfo?: CS2MatchInfo;
}

interface CS2DemoHeader {
  demoFileStamp?: string;
  demoProtocol?: number;
  networkProtocol?: number;
  serverName?: string;
  clientName?: string;
  mapName?: string;
  gameDirectory?: string;
  playbackTime?: number;
  playbackTicks?: number;
  playbackFrames?: number;
  signonLength?: number;
}

interface CS2GameEvent {
  tick: number;
  type: string;
  data: Record<string, unknown>;
}

interface CS2TickEvent {
  tick: number;
  players: CS2PlayerTick[];
  gameState: CS2GameState;
}

interface CS2PlayerTick {
  steamId: string;
  position: Position3D;
  rotation: Position3D;
  velocity: Position3D;
  health: number;
  armor: number;
  hasHelmet: boolean;
  weapon: string;
  ammo: number;
  money: number;
  isAlive: boolean;
  isSpotted: boolean;
}

interface CS2GameState {
  round: number;
  phase: 'freeze' | 'live' | 'over';
  bombState: 'planted' | 'defused' | 'exploded' | 'dropped' | 'carried';
  bombPosition?: Position3D;
  bombSite?: 'A' | 'B';
  ctScore: number;
  tScore: number;
  ctMoney: number;
  tMoney: number;
}

interface CS2PlayerInfo {
  steamId: string;
  name: string;
  userId: number;
  guid: string;
  fakePlayer: boolean;
  isHltv: boolean;
  customFiles?: number[];
  filesDownloaded?: number;
  // Extended info from entities
  team?: 'CT' | 'TERRORIST' | 'SPECTATOR';
  clan?: string;
}

interface CS2MatchInfo {
  matchId?: string;
  tournament?: string;
  stage?: string;
  date?: string;
  server?: string;
  demoVersion?: string;
}

// Map CS2 map names to normalized names
const CS2_MAP_NORMALIZATION: Record<string, string> = {
  'de_dust2': 'Dust II',
  'de_mirage': 'Mirage',
  'de_inferno': 'Inferno',
  'de_nuke': 'Nuke',
  'de_overpass': 'Overpass',
  'de_vertigo': 'Vertigo',
  'de_anubis': 'Anubis',
  'de_ancient': 'Ancient',
  'de_train': 'Train',
  'de_cache': 'Cache',
  'de_cobblestone': 'Cobblestone',
  'de_tuscan': 'Tuscan',
  'de_mills': 'Mills',
  'de_thera': 'Thera',
  'de_assembly': 'Assembly',
  'de_breach': 'Breach',
  'de_basalt': 'Basalt',
};

// Weapon ID mapping
const CS2_WEAPON_MAP: Record<string, string> = {
  'weapon_knife': 'Knife',
  'weapon_knife_t': 'Knife',
  'weapon_glock': 'Glock',
  'weapon_usp_silencer': 'USP-S',
  'weapon_p250': 'P250',
  'weapon_tec9': 'Tec-9',
  'weapon_fiveseven': 'Five-SeveN',
  'weapon_cz75a': 'CZ75-Auto',
  'weapon_deagle': 'Desert Eagle',
  'weapon_revolver': 'R8 Revolver',
  'weapon_dualberettas': 'Dual Berettas',
  'weapon_mac10': 'MAC-10',
  'weapon_mp9': 'MP9',
  'weapon_mp7': 'MP7',
  'weapon_ump45': 'UMP-45',
  'weapon_p90': 'P90',
  'weapon_bizon': 'PP-Bizon',
  'weapon_mp5sd': 'MP5-SD',
  'weapon_nova': 'Nova',
  'weapon_xm1014': 'XM1014',
  'weapon_mag7': 'MAG-7',
  'weapon_sawedoff': 'Sawed-Off',
  'weapon_m249': 'M249',
  'weapon_negev': 'Negev',
  'weapon_galilar': 'Galil AR',
  'weapon_famas': 'FAMAS',
  'weapon_ak47': 'AK-47',
  'weapon_m4a1': 'M4A4',
  'weapon_m4a1_silencer': 'M4A1-S',
  'weapon_ssg08': 'SSG 08',
  'weapon_aug': 'AUG',
  'weapon_sg556': 'SG 553',
  'weapon_awp': 'AWP',
  'weapon_scar20': 'SCAR-20',
  'weapon_g3sg1': 'G3SG1',
  'weapon_hegrenade': 'HE Grenade',
  'weapon_flashbang': 'Flashbang',
  'weapon_smokegrenade': 'Smoke Grenade',
  'weapon_molotov': 'Molotov',
  'weapon_incgrenade': 'Incendiary',
  'weapon_decoy': 'Decoy',
  'weapon_taser': 'Zeus x27',
  'weapon_c4': 'C4',
};

// ============================================================================
// Parser Implementation
// ============================================================================

export class CS2ReplayParser implements ReplayParser {
  readonly gameType: GameType = 'cs2';
  readonly supportedVersions = ['1.0.0', '13992', '13995'];

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
      this.reportProgress(options, { stage: 'reading', percent: 10, bytesProcessed: 0, totalBytes: stats.fileSize });

      // Detect format and parse
      const isBinary = !(typeof data === 'string');
      let rawData: CS2RawMatch;

      if (isBinary) {
        rawData = await this.parseBinaryDemo(data as ArrayBuffer, stats, options);
      } else {
        rawData = this.parseJsonData(data as string);
      }

      this.reportProgress(options, { stage: 'parsing', percent: 40, bytesProcessed: stats.fileSize / 3, totalBytes: stats.fileSize });

      // Validate format
      if (!this.validateFormat(rawData)) {
        return {
          success: false,
          error: {
            code: PARSE_ERROR_CODES.INVALID_FORMAT,
            message: 'Invalid CS2 replay format',
          },
          stats,
        };
      }

      this.reportProgress(options, { stage: 'normalizing', percent: 60, bytesProcessed: stats.fileSize / 2, totalBytes: stats.fileSize });

      // Build replay
      const replay = await this.buildReplay(rawData, stats, options);

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
    return ['application/octet-stream', 'application/json', 'cs2-demo', 'csgo-dem'];
  }

  // ============================================================================
// Private Methods
// ============================================================================

  private parseJsonData(data: string): CS2RawMatch {
    return JSON.parse(data);
  }

  private async parseBinaryDemo(
    data: ArrayBuffer,
    stats: ParseStats,
    options: Partial<ParseOptions>
  ): Promise<CS2RawMatch> {
    // This is a simplified implementation
    // Full CS2 demo parsing requires complex binary parsing of .dem files
    // which would typically be done via WebAssembly or a server-side parser
    
    const view = new DataView(data);
    const header = this.parseDemoHeader(view);
    
    // For now, return a minimal structure
    // In production, this would parse the full binary format
    return {
      header,
      gameEvents: [],
      tickEvents: [],
      playerInfo: [],
    };
  }

  private parseDemoHeader(view: DataView): CS2DemoHeader {
    // Parse CS2 demo header
    // Format: "HL2DEMO\0" + protocol + network protocol + etc.
    const decoder = new TextDecoder('ascii');
    const stampBytes = new Uint8Array(view.buffer, 0, 8);
    const demoFileStamp = decoder.decode(stampBytes);
    
    if (demoFileStamp !== 'HL2DEMO\x00') {
      throw new Error('Invalid CS2 demo file stamp');
    }
    
    return {
      demoFileStamp,
      demoProtocol: view.getInt32(8, true),
      networkProtocol: view.getInt32(12, true),
      // Additional header fields would be parsed here
    };
  }

  private validateFormat(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;
    
    const match = data as CS2RawMatch;
    
    // Check for required fields
    return (
      'header' in match ||
      'gameEvents' in match ||
      'tickEvents' in match ||
      'playerInfo' in match ||
      'matchInfo' in match
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
    rawMatch: CS2RawMatch,
    stats: ParseStats,
    options: Partial<ParseOptions>
  ): Promise<Replay> {
    const header = rawMatch.header || {};
    const matchInfo = rawMatch.matchInfo || {};
    const matchId = matchInfo.matchId || `cs2-${Date.now()}`;
    
    const replay = createEmptyReplay('cs2', matchId);
    
    // Set metadata
    replay.mapName = this.getMapName(header.mapName || '');
    replay.duration = header.playbackTime || 0;
    replay.metadata = this.buildMetadata(header, matchInfo, stats.fileSize);
    
    // Build teams
    const teams = this.buildTeams(rawMatch.playerInfo || []);
    replay.teams = [teams[0], teams[1]];
    
    // Build players
    replay.players = this.buildPlayers(rawMatch.playerInfo || [], teams);
    
    // Update team player IDs
    replay.teams[0].playerIds = replay.players
      .filter(p => p.teamSide === 'defender')
      .map(p => p.id);
    replay.teams[1].playerIds = replay.players
      .filter(p => p.teamSide === 'attacker')
      .map(p => p.id);
    
    // Build rounds and events from game events or tick data
    const rounds = this.buildRounds(
      rawMatch.gameEvents || [],
      rawMatch.tickEvents || []
    );
    replay.rounds = rounds;
    replay.events = this.extractAllEvents(rounds);
    
    // Build timeline
    replay.timeline = this.buildTimeline(rounds, replay.events);
    
    // Update stats
    stats.roundsParsed = rounds.length;
    stats.eventsParsed = replay.events.length;
    
    return replay;
  }

  private buildMetadata(
    header: CS2DemoHeader,
    matchInfo: CS2MatchInfo,
    fileSize: number
  ): ReplayMetadata {
    return {
      gameVersion: `CS2 Build ${header.networkProtocol || 'unknown'}`,
      demoVersion: matchInfo.demoVersion || 'cs2-demo',
      serverTickRate: 64, // CS2 typically 64 or 128 tick
      totalTicks: header.playbackTicks || 0,
      fileSize,
      parserVersion: REPLAY_SCHEMA_VERSION,
      recordingSoftware: header.serverName || 'CS2 Server',
      recordingPlayerId: header.clientName,
      competition: matchInfo.tournament ? {
        name: matchInfo.tournament,
        stage: matchInfo.stage,
        date: matchInfo.date,
      } : undefined,
    };
  }

  private buildTeams(playerInfo: CS2PlayerInfo[]): [Team, Team] {
    const ctPlayers = playerInfo.filter(p => p.team === 'CT');
    const tPlayers = playerInfo.filter(p => p.team === 'TERRORIST');
    
    return [
      {
        id: 'CT',
        name: 'Counter-Terrorists',
        side: 'defender',
        score: 0,
        money: 0,
        playerIds: ctPlayers.map(p => p.steamId),
        timeoutsRemaining: 4,
      },
      {
        id: 'TERRORIST',
        name: 'Terrorists',
        side: 'attacker',
        score: 0,
        money: 0,
        playerIds: tPlayers.map(p => p.steamId),
        timeoutsRemaining: 4,
      },
    ];
  }

  private buildPlayers(playerInfo: CS2PlayerInfo[], teams: Team[]): Player[] {
    return playerInfo.map((info, index) => {
      const teamSide: TeamSide = info.team === 'CT' ? 'defender' : 
                                 info.team === 'TERRORIST' ? 'attacker' : 'spectator';
      
      return {
        id: info.steamId || `player-${index}`,
        name: info.name || `Player ${index + 1}`,
        teamId: info.team === 'CT' ? teams[0].id : teams[1].id,
        teamSide,
        agent: '', // CS2 doesn't have agents
        role: '',
        isBot: info.fakePlayer || false,
        stats: {
          kills: 0,
          deaths: 0,
          assists: 0,
          damageDealt: 0,
          damageReceived: 0,
          headshots: 0,
          roundsPlayed: 0,
          score: 0,
        },
      };
    });
  }

  private buildRounds(
    gameEvents: CS2GameEvent[],
    tickEvents: CS2TickEvent[]
  ): Round[] {
    const rounds: Round[] = [];
    const roundEvents: Map<number, CS2GameEvent[]> = new Map();
    
    // Group events by round
    gameEvents.forEach(event => {
      // Determine round from tick (assuming 64 tick server)
      const roundNum = Math.floor(event.tick / (30 * 64)) + 1;
      if (!roundEvents.has(roundNum)) {
        roundEvents.set(roundNum, []);
      }
      roundEvents.get(roundNum)!.push(event);
    });
    
    // Build rounds from events
    roundEvents.forEach((events, roundNumber) => {
      const normalizedEvents: GameEvent[] = [];
      let winningSide: TeamSide = 'team_a';
      let outcome: RoundOutcome = 'elimination';
      
      // Round start event
      normalizedEvents.push({
        id: generateEventId(),
        type: 'round_start',
        timestamp: roundNumber * 100, // Approximate
        roundNumber,
        teamASide: 'defender',
        teamBSide: 'attacker',
      } as RoundStartEvent);
      
      // Process game events
      events.forEach(event => {
        const normalized = this.normalizeEvent(event, roundNumber);
        if (normalized) {
          normalizedEvents.push(normalized);
        }
        
        // Track round outcome
        if (event.type === 'round_end') {
          const winner = event.data.winner as string;
          winningSide = winner === 'CT' ? 'defender' : 'attacker';
          outcome = this.mapRoundOutcome(event.data.reason as string);
        }
      });
      
      // Round end event
      normalizedEvents.push({
        id: generateEventId(),
        type: 'round_end',
        timestamp: roundNumber * 100 + 90,
        roundNumber,
        winningSide,
        outcome,
        teamAScore: 0, // Would be calculated from cumulative data
        teamBScore: 0,
      } as RoundEndEvent);
      
      rounds.push({
        roundNumber,
        winningSide,
        outcome,
        startTime: (roundNumber - 1) * 100,
        endTime: roundNumber * 100 + 90,
        duration: 100,
        teamAScore: 0,
        teamBScore: 0,
        events: normalizedEvents,
        playerStates: [],
        economy: {
          teamA: { totalMoney: 0, loadoutValues: [], weapons: [] },
          teamB: { totalMoney: 0, loadoutValues: [], weapons: [] },
        },
      });
    });
    
    // Sort by round number
    rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    
    return rounds;
  }

  private normalizeEvent(event: CS2GameEvent, roundNumber: number): GameEvent | null {
    const baseProps = {
      id: generateEventId(),
      timestamp: event.tick / 64, // Convert ticks to seconds (assuming 64 tick)
      roundNumber,
      tick: event.tick,
    };
    
    switch (event.type) {
      case 'player_death':
        return {
          ...baseProps,
          type: 'kill',
          killerId: String(event.data.attacker || ''),
          victimId: String(event.data.userid || ''),
          assisterIds: event.data.assister ? [String(event.data.assister)] : [],
          weaponId: String(event.data.weapon || ''),
          isHeadshot: Boolean(event.data.headshot),
          isWallbang: false,
          isFlashed: Boolean(event.data.blind),
          isTrade: false,
          position: this.parsePosition(event.data.attacker_position),
          victimPosition: this.parsePosition(event.data.position),
        } as KillEvent;
        
      case 'bomb_planted':
        return {
          ...baseProps,
          type: 'bomb_plant',
          playerId: String(event.data.userid || ''),
          site: String(event.data.site || 'A') as 'A' | 'B' | 'C',
          position: this.parsePosition(event.data.position),
          plantTime: baseProps.timestamp,
        } as BombPlantEvent;
        
      case 'bomb_defused':
        return {
          ...baseProps,
          type: 'bomb_defuse',
          playerId: String(event.data.userid || ''),
          site: String(event.data.site || 'A') as 'A' | 'B' | 'C',
          position: this.parsePosition(event.data.position),
          defuseTime: baseProps.timestamp,
          wasKitUsed: Boolean(event.data.haskit),
          defuseProgress: 1.0,
        } as BombDefuseEvent;
        
      case 'weapon_fire':
        return {
          ...baseProps,
          type: 'weapon_fire',
          playerId: String(event.data.userid || ''),
          weaponId: String(event.data.weapon || ''),
          position: this.parsePosition(event.data.position),
          aimDirection: this.parsePosition(event.data.angle),
        } as WeaponFireEvent;
        
      case 'item_purchase':
        return {
          ...baseProps,
          type: 'buy',
          playerId: String(event.data.userid || ''),
          weaponId: String(event.data.item || ''),
          cost: Number(event.data.cost || 0),
          remainingMoney: Number(event.data.loadout || 0),
        } as BuyEvent;
        
      default:
        return {
          ...baseProps,
          type: 'weapon_fire', // Default fallback
        };
    }
  }

  private parsePosition(data: unknown): Position3D {
    if (Array.isArray(data) && data.length >= 3) {
      return { x: data[0], y: data[1], z: data[2] };
    }
    if (typeof data === 'object' && data !== null) {
      return {
        x: (data as { x?: number }).x || 0,
        y: (data as { y?: number }).y || 0,
        z: (data as { z?: number }).z || 0,
      };
    }
    return { x: 0, y: 0, z: 0 };
  }

  private mapRoundOutcome(reason: string): RoundOutcome {
    const outcomeMap: Record<string, RoundOutcome> = {
      'ct_win_elimination': 'elimination',
      't_win_elimination': 'elimination',
      'ct_win_defuse': 'bomb_defused',
      't_win_bomb': 'bomb_exploded',
      'ct_win_time': 'time_expired',
      'draw': 'draw',
    };
    
    return outcomeMap[reason] || 'elimination';
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

  private getMapName(mapId: string): string {
    // Normalize map name
    const normalized = mapId.toLowerCase().replace(/\\/g, '/');
    const mapName = normalized.split('/').pop() || mapId;
    
    return CS2_MAP_NORMALIZATION[mapName] || CS2_MAP_NORMALIZATION[mapId] || mapName;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCS2Parser(): CS2ReplayParser {
  return new CS2ReplayParser();
}

// ============================================================================
// Default Export
// ============================================================================

export default CS2ReplayParser;
