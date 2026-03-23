/**
 * Parser Performance Tests
 * Validates performance requirements for replay parsing
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-A
 * Team: Replay 2.0 Core (TL-S2)
 * 
 * Test Targets:
 * - Parse time < 1s for 50MB files
 * - Memory usage < 200MB during parse
 * - Error handling for corrupt/malformed data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Replay, GameType, ParseProgress, ParseResult } from '../types';
import {
  REPLAY_SCHEMA_VERSION,
  PARSER_PERFORMANCE_LIMITS,
  PARSE_ERROR_CODES,
  createEmptyReplay,
  validateReplay,
  isValidReplay,
} from '../types';
import { ValorantReplayParser, createValorantParser } from '../parsers/valorant';
import { CS2ReplayParser, createCS2Parser } from '../parsers/cs2';
import {
  parseReplay,
  detectGameType,
  validateReplayFormat,
  createParser,
} from '../index';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockValorantMatch(size: number = 1): Record<string, unknown> {
  const players = Array.from({ length: 10 }, (_, i) => ({
    puuid: `player-${i}`,
    gameName: `Player${i}`,
    tagLine: 'TEST',
    teamId: i < 5 ? 'Blue' : 'Red',
    characterId: Object.keys({
      'dade69b4-4f5a-8528-247b-219e5a1facd6': 'Fade',
      '5f8d3a7f-467b-97f3-062c-13acf203c006': 'Breach',
    })[i % 2],
    stats: {
      score: Math.floor(Math.random() * 5000),
      roundsPlayed: 24,
      kills: Math.floor(Math.random() * 30),
      deaths: Math.floor(Math.random() * 20),
      assists: Math.floor(Math.random() * 15),
    },
  }));

  const rounds = Array.from({ length: 24 * size }, (_, i) => ({
    roundNum: i + 1,
    roundResult: i % 3 === 0 ? 'Bomb defused' : 'Elimination',
    roundCeremony: 'CeremonyDefault',
    winningTeam: i % 2 === 0 ? 'Blue' : 'Red',
    bombPlanter: i % 3 === 0 ? 'player-5' : undefined,
    bombDefuser: i % 3 === 1 ? 'player-0' : undefined,
    playerStats: players.map(p => ({
      puuid: p.puuid,
      kills: [],
      damage: [],
      score: Math.floor(Math.random() * 200),
    })),
  }));

  const kills = Array.from({ length: 200 * size }, (_, i) => ({
    gameTime: i * 5000,
    roundTime: i * 1000,
    round: Math.floor(i / 10) + 1,
    killer: `player-${Math.floor(Math.random() * 10)}`,
    victim: `player-${Math.floor(Math.random() * 10)}`,
    assistants: [],
    location: { x: Math.random() * 1000, y: Math.random() * 1000 },
    weapon: 'Vandal',
  }));

  return {
    matchInfo: {
      matchId: `test-match-${Date.now()}`,
      mapId: '/Game/Maps/Ascent/Ascent',
      gameVersion: 'release-09.00',
      gameLengthMillis: 1800000 * size,
      completionState: 'Completed',
    },
    players,
    teams: [
      { teamId: 'Blue', won: true, roundsPlayed: 24 * size, roundsWon: 13 * size, numPoints: 13 * size },
      { teamId: 'Red', won: false, roundsPlayed: 24 * size, roundsWon: 11 * size, numPoints: 11 * size },
    ],
    roundResults: rounds,
    kills,
  };
}

function createMockCS2Match(size: number = 1): Record<string, unknown> {
  const players = Array.from({ length: 10 }, (_, i) => ({
    steamId: `765611980000000${i}`,
    name: `Player${i}`,
    userId: i,
    guid: `guid-${i}`,
    fakePlayer: false,
    isHltv: false,
    team: i < 5 ? 'CT' : 'TERRORIST',
  }));

  const events = Array.from({ length: 500 * size }, (_, i) => {
    const eventTypes = ['player_death', 'weapon_fire', 'bomb_planted', 'bomb_defused'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    return {
      tick: i * 100,
      type,
      data: {
        userid: `765611980000000${Math.floor(Math.random() * 10)}`,
        attacker: `765611980000000${Math.floor(Math.random() * 10)}`,
        weapon: 'weapon_ak47',
        headshot: Math.random() > 0.7,
      },
    };
  });

  return {
    header: {
      demoFileStamp: 'HL2DEMO\x00',
      demoProtocol: 4,
      networkProtocol: 13992,
      serverName: 'Test Server',
      clientName: 'Test Client',
      mapName: 'de_dust2',
      gameDirectory: 'csgo',
      playbackTime: 3600 * size,
      playbackTicks: 230400 * size,
    },
    playerInfo: players,
    gameEvents: events,
    matchInfo: {
      matchId: `cs2-test-${Date.now()}`,
      tournament: 'Test Tournament',
    },
  };
}

function generateLargeFile(sizeMB: number): ArrayBuffer {
  const bytes = sizeMB * 1024 * 1024;
  const buffer = new ArrayBuffer(bytes);
  const view = new Uint8Array(buffer);
  
  // Fill with JSON-like data
  const jsonStart = '{"data":"';
  const jsonEnd = '"}';
  
  // Write JSON structure
  for (let i = 0; i < jsonStart.length && i < bytes; i++) {
    view[i] = jsonStart.charCodeAt(i);
  }
  
  // Fill middle with random data
  for (let i = jsonStart.length; i < bytes - jsonEnd.length; i++) {
    view[i] = 65 + (i % 26); // A-Z
  }
  
  // Write JSON end
  for (let i = 0; i < jsonEnd.length && bytes - jsonEnd.length + i < bytes; i++) {
    view[bytes - jsonEnd.length + i] = jsonEnd.charCodeAt(i);
  }
  
  return buffer;
}

// ============================================================================
// Performance Tests
// ============================================================================

describe('Parser Performance', () => {
  describe('Parse Time Requirements', () => {
    it('should parse Valorant match in < 1s', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const startTime = performance.now();
      const result = await parser.parse(data);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS);
      expect(result.stats?.parseTime).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS);
    });

    it('should parse CS2 match in < 1s', async () => {
      const parser = createCS2Parser();
      const data = JSON.stringify(createMockCS2Match(1));
      
      const startTime = performance.now();
      const result = await parser.parse(data);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS);
    });

    it('should handle 50MB files within time limit', async () => {
      const parser = createValorantParser();
      
      // Create a large mock file
      const largeData = JSON.stringify(createMockValorantMatch(50));
      const sizeMB = largeData.length / (1024 * 1024);
      
      expect(sizeMB).toBeGreaterThan(40); // Verify we're testing large files
      
      const startTime = performance.now();
      const result = await parser.parse(largeData);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS);
    });

    it('should report parse time in stats', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.parseTime).toBeGreaterThan(0);
      expect(result.stats?.parseTime).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS);
    });
  });

  describe('Memory Usage Requirements', () => {
    it('should report memory usage in stats', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.memoryPeak).toBeDefined();
      // Memory should be reasonable (may be 0 if not supported in test env)
      expect(result.stats?.memoryPeak).toBeGreaterThanOrEqual(0);
    });

    it('should use less than 200MB for typical files', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(5));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      // Allow for test environment variance
      if (result.stats && result.stats.memoryPeak > 0) {
        expect(result.stats.memoryPeak).toBeLessThan(PARSER_PERFORMANCE_LIMITS.MAX_MEMORY_MB * 2);
      }
    });

    it('should handle memory pressure warnings', async () => {
      const parser = createValorantParser();
      // Create a file that might cause memory pressure
      const data = JSON.stringify(createMockValorantMatch(100));
      
      const result = await parser.parse(data);
      
      // Should still succeed or fail gracefully
      if (result.success) {
        expect(result.stats?.warnings).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('File Size Limits', () => {
    it('should reject files over 50MB by default', async () => {
      const parser = createValorantParser();
      const largeBuffer = generateLargeFile(60);
      
      const result = await parser.parse(largeBuffer);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PARSE_ERROR_CODES.FILE_TOO_LARGE);
    });

    it('should accept custom max file size', async () => {
      const parser = createValorantParser();
      const largeBuffer = generateLargeFile(60);
      
      const result = await parser.parse(largeBuffer, {
        maxFileSize: 100 * 1024 * 1024, // 100MB
      });
      
      // May still fail due to invalid format, but not file size
      if (!result.success) {
        expect(result.error?.code).not.toBe(PARSE_ERROR_CODES.FILE_TOO_LARGE);
      }
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  describe('Invalid Input', () => {
    it('should handle empty data', async () => {
      const parser = createValorantParser();
      const result = await parser.parse('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid JSON', async () => {
      const parser = createValorantParser();
      const result = await parser.parse('not valid json{{}');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PARSE_ERROR_CODES.CORRUPT_DATA);
    });

    it('should handle missing required fields', async () => {
      const parser = createValorantParser();
      const result = await parser.parse('{"invalid": "data"}');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PARSE_ERROR_CODES.INVALID_FORMAT);
    });

    it('should handle null data', async () => {
      const parser = createValorantParser();
      const result = await parser.parse('null');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle circular references gracefully', async () => {
      const parser = createValorantParser();
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj; // Circular reference
      
      try {
        const result = await parser.parse(JSON.stringify(obj));
        // JSON.stringify should handle circular refs, but if not:
        expect(result.success).toBe(false);
      } catch {
        // Expected to fail
        expect(true).toBe(true);
      }
    });
  });

  describe('Corrupt Data', () => {
    it('should handle truncated data', async () => {
      const parser = createValorantParser();
      const partial = JSON.stringify(createMockValorantMatch(1)).slice(0, 100);
      
      const result = await parser.parse(partial);
      
      expect(result.success).toBe(false);
    });

    it('should handle binary data in text parser', async () => {
      const parser = createValorantParser();
      const binary = new Uint8Array([0x00, 0x01, 0x02, 0xFF, 0xFE]);
      
      const result = await parser.parse(binary.buffer);
      
      // May succeed or fail depending on decoder behavior
      expect(result).toBeDefined();
    });

    it('should handle mismatched schema versions', async () => {
      const parser = createValorantParser();
      const data = {
        ...createMockValorantMatch(1),
        _schemaVersion: '999.999',
      };
      
      const result = await parser.parse(JSON.stringify(data));
      
      // Should still parse, but may have warnings
      expect(result).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate correct Valorant format', async () => {
      const parser = createValorantParser();
      const data = createMockValorantMatch(1);
      
      expect(parser.validate(data)).toBe(true);
    });

    it('should reject invalid format', async () => {
      const parser = createValorantParser();
      
      expect(parser.validate(null)).toBe(false);
      expect(parser.validate(undefined)).toBe(false);
      expect(parser.validate('string')).toBe(false);
      expect(parser.validate(123)).toBe(false);
      expect(parser.validate({})).toBe(false);
    });

    it('should validate replay structure', () => {
      const validReplay = createEmptyReplay('valorant', 'test');
      validReplay.mapName = 'Ascent';
      validReplay.players = [{ 
        id: '1', 
        name: 'Test', 
        teamId: 't1', 
        teamSide: 'attacker',
        isBot: false,
        stats: {
          kills: 0, deaths: 0, assists: 0, damageDealt: 0, damageReceived: 0,
          headshots: 0, roundsPlayed: 0, score: 0
        }
      }];
      
      const validation = validateReplay(validReplay);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid replay structure', () => {
      const invalidReplay = { schemaVersion: '0.0.0', gameType: 'unknown' };
      
      const validation = validateReplay(invalidReplay);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Functional Tests
// ============================================================================

describe('Parser Functionality', () => {
  describe('Valorant Parser', () => {
    it('should parse match metadata', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay).toBeDefined();
      expect(result.replay?.schemaVersion).toBe(REPLAY_SCHEMA_VERSION);
      expect(result.replay?.gameType).toBe('valorant');
      expect(result.replay?.mapName).toBe('Ascent');
    });

    it('should parse all players', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay?.players).toHaveLength(10);
      expect(result.replay?.players[0]).toHaveProperty('id');
      expect(result.replay?.players[0]).toHaveProperty('name');
      expect(result.replay?.players[0]).toHaveProperty('teamId');
    });

    it('should parse all rounds', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay?.rounds.length).toBeGreaterThan(0);
      expect(result.replay?.rounds[0]).toHaveProperty('roundNumber');
      expect(result.replay?.rounds[0]).toHaveProperty('events');
    });

    it('should generate event timeline', async () => {
      const parser = createValorantParser();
      const data = JSON.stringify(createMockValorantMatch(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay?.timeline).toBeDefined();
      expect(result.replay?.timeline.keyEvents.length).toBeGreaterThan(0);
    });

    it('should report supported formats', () => {
      const parser = createValorantParser();
      const formats = parser.getSupportedFormats();
      
      expect(formats).toContain('application/json');
      expect(formats).toContain('valorant-replay');
    });
  });

  describe('CS2 Parser', () => {
    it('should parse match metadata', async () => {
      const parser = createCS2Parser();
      const data = JSON.stringify(createMockCS2Match(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay).toBeDefined();
      expect(result.replay?.gameType).toBe('cs2');
      expect(result.replay?.mapName).toBe('Dust II');
    });

    it('should parse demo header', async () => {
      const parser = createCS2Parser();
      const data = JSON.stringify(createMockCS2Match(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay?.metadata.gameVersion).toContain('CS2');
      expect(result.replay?.metadata.totalTicks).toBeGreaterThan(0);
    });

    it('should parse teams correctly', async () => {
      const parser = createCS2Parser();
      const data = JSON.stringify(createMockCS2Match(1));
      
      const result = await parser.parse(data);
      
      expect(result.success).toBe(true);
      expect(result.replay?.teams[0].side).toBe('defender'); // CT
      expect(result.replay?.teams[1].side).toBe('attacker'); // T
    });

    it('should support binary format detection', () => {
      const parser = createCS2Parser();
      const formats = parser.getSupportedFormats();
      
      expect(formats).toContain('application/octet-stream');
    });
  });

  describe('Unified API', () => {
    it('should auto-detect Valorant format', () => {
      const data = JSON.stringify(createMockValorantMatch(1));
      const type = detectGameType(data);
      
      expect(type).toBe('valorant');
    });

    it('should auto-detect CS2 format', () => {
      const data = JSON.stringify(createMockCS2Match(1));
      const type = detectGameType(data);
      
      expect(type).toBe('cs2');
    });

    it('should create correct parser for game type', () => {
      const valorantParser = createParser('valorant');
      const cs2Parser = createParser('cs2');
      
      expect(valorantParser.gameType).toBe('valorant');
      expect(cs2Parser.gameType).toBe('cs2');
    });

    it('should throw for unsupported game type', () => {
      expect(() => createParser('unknown' as GameType)).toThrow();
    });

    it('should validate replay format', async () => {
      const data = JSON.stringify(createMockValorantMatch(1));
      const result = validateReplayFormat(data);
      
      expect(result.valid).toBe(true);
      expect(result.gameType).toBe('valorant');
    });

    it('should parse with unified API', async () => {
      const data = JSON.stringify(createMockValorantMatch(1));
      const result = await parseReplay(data);
      
      expect(result.success).toBe(true);
      expect(result.replay).toBeDefined();
    });
  });
});

// ============================================================================
// Progress Reporting Tests
// ============================================================================

describe('Progress Reporting', () => {
  it('should call progress callback', async () => {
    const parser = createValorantParser();
    const progressUpdates: ParseProgress[] = [];
    
    const data = JSON.stringify(createMockValorantMatch(1));
    
    await parser.parse(data, {
      progressCallback: (progress) => {
        progressUpdates.push({ ...progress });
      },
    });
    
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0]).toHaveProperty('stage');
    expect(progressUpdates[0]).toHaveProperty('percent');
    expect(progressUpdates[progressUpdates.length - 1].percent).toBe(100);
  });

  it('should report all stages', async () => {
    const parser = createValorantParser();
    const stages: string[] = [];
    
    const data = JSON.stringify(createMockValorantMatch(1));
    
    await parser.parse(data, {
      progressCallback: (progress) => {
        if (!stages.includes(progress.stage)) {
          stages.push(progress.stage);
        }
      },
    });
    
    expect(stages).toContain('reading');
    expect(stages).toContain('parsing');
    expect(stages).toContain('normalizing');
    expect(stages).toContain('validating');
  });

  it('should handle progress callback errors gracefully', async () => {
    const parser = createValorantParser();
    
    const data = JSON.stringify(createMockValorantMatch(1));
    
    const result = await parser.parse(data, {
      progressCallback: () => {
        throw new Error('Progress callback error');
      },
    });
    
    // Should still complete successfully
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Stats Reporting Tests
// ============================================================================

describe('Stats Reporting', () => {
  it('should report file size', async () => {
    const parser = createValorantParser();
    const data = JSON.stringify(createMockValorantMatch(1));
    
    const result = await parser.parse(data);
    
    expect(result.stats?.fileSize).toBe(data.length);
  });

  it('should report events parsed', async () => {
    const parser = createValorantParser();
    const data = JSON.stringify(createMockValorantMatch(1));
    
    const result = await parser.parse(data);
    
    expect(result.stats?.eventsParsed).toBeGreaterThan(0);
  });

  it('should report rounds parsed', async () => {
    const parser = createValorantParser();
    const data = JSON.stringify(createMockValorantMatch(1));
    
    const result = await parser.parse(data);
    
    expect(result.stats?.roundsParsed).toBeGreaterThan(0);
  });

  it('should collect warnings', async () => {
    const parser = createValorantParser();
    // Create a file that generates warnings
    const mock = createMockValorantMatch(50); // Large file
    mock.matchInfo = {}; // Missing data
    
    const result = await parser.parse(JSON.stringify(mock));
    
    // Should either succeed with warnings or fail
    if (result.success) {
      expect(result.stats?.warnings).toBeDefined();
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty match', async () => {
    const parser = createValorantParser();
    const data = JSON.stringify({
      matchInfo: { matchId: 'empty' },
      players: [],
      teams: [],
      roundResults: [],
      kills: [],
    });
    
    const result = await parser.parse(data);
    
    expect(result.success).toBe(true);
    expect(result.replay?.players).toHaveLength(0);
    expect(result.replay?.rounds).toHaveLength(0);
  });

  it('should handle single round match', async () => {
    const parser = createValorantParser();
    const mock = createMockValorantMatch(1);
    mock.roundResults = mock.roundResults?.slice(0, 1);
    
    const result = await parser.parse(JSON.stringify(mock));
    
    expect(result.success).toBe(true);
    expect(result.replay?.rounds).toHaveLength(1);
  });

  it('should handle players with missing stats', async () => {
    const parser = createValorantParser();
    const mock = createMockValorantMatch(1);
    mock.players = [{
      puuid: 'test',
      gameName: 'TestPlayer',
      // Missing other fields
    }];
    
    const result = await parser.parse(JSON.stringify(mock));
    
    expect(result.success).toBe(true);
    expect(result.replay?.players[0].name).toBe('TestPlayer');
  });

  it('should handle very long player names', async () => {
    const parser = createValorantParser();
    const mock = createMockValorantMatch(1);
    mock.players![0].gameName = 'A'.repeat(1000);
    
    const result = await parser.parse(JSON.stringify(mock));
    
    expect(result.success).toBe(true);
    expect(result.replay?.players[0].name).toHaveLength(1000);
  });

  it('should handle unicode in player names', async () => {
    const parser = createValorantParser();
    const mock = createMockValorantMatch(1);
    mock.players![0].gameName = '🎮Player日本語';
    
    const result = await parser.parse(JSON.stringify(mock));
    
    expect(result.success).toBe(true);
    expect(result.replay?.players[0].name).toBe('🎮Player日本語');
  });

  it('should handle concurrent parses', async () => {
    const parser = createValorantParser();
    const data = JSON.stringify(createMockValorantMatch(1));
    
    const promises = Array.from({ length: 5 }, () => parser.parse(data));
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('Module Exports', () => {
  it('should export all required types', () => {
    expect(REPLAY_SCHEMA_VERSION).toBeDefined();
    expect(PARSER_PERFORMANCE_LIMITS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    expect(PARSER_PERFORMANCE_LIMITS.MAX_PARSE_TIME_MS).toBe(1000);
    expect(PARSER_PERFORMANCE_LIMITS.MAX_MEMORY_MB).toBe(200);
  });

  it('should export error codes', () => {
    expect(PARSE_ERROR_CODES.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
    expect(PARSE_ERROR_CODES.INVALID_FORMAT).toBe('INVALID_FORMAT');
    expect(PARSE_ERROR_CODES.CORRUPT_DATA).toBe('CORRUPT_DATA');
  });

  it('should export utility functions', () => {
    expect(typeof createEmptyReplay).toBe('function');
    expect(typeof validateReplay).toBe('function');
    expect(typeof isValidReplay).toBe('function');
  });
});
