/**
 * Replay Parser Module
 * Main entry point for replay parsing functionality
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-A
 * Team: Replay 2.0 Core (TL-S2)
 */

// Re-export types
export * from './types';

// Export parsers
export { ValorantReplayParser, createValorantParser } from './parsers/valorant';
export { CS2ReplayParser, createCS2Parser } from './parsers/cs2';

// Export utilities
export { ReplayParserWorker, createParserWorker, parseReplayWithWorker } from './worker';

import type {
  GameType,
  ParseOptions,
  ParseResult,
  ReplayParser,
} from './types';
import { ValorantReplayParser, createValorantParser } from './parsers/valorant';
import { CS2ReplayParser, createCS2Parser } from './parsers/cs2';

// ============================================================================
// Parser Factory
// ============================================================================

const parserRegistry = new Map<GameType, () => ReplayParser>();

// Register default parsers
parserRegistry.set('valorant', createValorantParser);
parserRegistry.set('cs2', createCS2Parser);

/**
 * Register a custom parser for a game type
 */
export function registerParser(
  gameType: GameType,
  factory: () => ReplayParser
): void {
  parserRegistry.set(gameType, factory);
}

/**
 * Create a parser for the specified game type
 */
export function createParser(gameType: GameType): ReplayParser {
  const factory = parserRegistry.get(gameType);
  if (!factory) {
    throw new Error(`No parser registered for game type: ${gameType}`);
  }
  return factory();
}

/**
 * Check if a parser is available for a game type
 */
export function hasParser(gameType: GameType): boolean {
  return parserRegistry.has(gameType);
}

/**
 * Get list of supported game types
 */
export function getSupportedGameTypes(): GameType[] {
  return Array.from(parserRegistry.keys());
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Parse a replay file with automatic game type detection
 */
export async function parseReplay(
  data: ArrayBuffer | string,
  options: Partial<ParseOptions> & { gameType?: GameType } = {}
): Promise<ParseResult> {
  const gameType = options.gameType || detectGameType(data);
  
  if (!hasParser(gameType)) {
    return {
      success: false,
      error: {
        code: 'UNSUPPORTED_GAME_TYPE',
        message: `No parser available for game type: ${gameType}`,
      },
      stats: {
        fileSize: typeof data === 'string' ? data.length : data.byteLength,
        parseTime: 0,
        memoryPeak: 0,
        eventsParsed: 0,
        roundsParsed: 0,
        warnings: [],
      },
    };
  }
  
  const parser = createParser(gameType);
  return parser.parse(data, options);
}

/**
 * Detect game type from file data
 */
export function detectGameType(data: ArrayBuffer | string): GameType {
  // Try to parse as JSON first
  let parsed: unknown;
  
  try {
    if (typeof data === 'string') {
      parsed = JSON.parse(data);
    } else {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(data.slice(0, 1024)); // Check first 1KB
      parsed = JSON.parse(text);
    }
  } catch {
    // Not JSON, check binary signatures
    if (data instanceof ArrayBuffer) {
      const view = new DataView(data);
      const decoder = new TextDecoder('ascii');
      const header = decoder.decode(new Uint8Array(data, 0, Math.min(8, data.byteLength)));
      
      // CS2 demo files start with "HL2DEMO"
      if (header.startsWith('HL2DEMO')) {
        return 'cs2';
      }
    }
    
    // Default to valorant for JSON files we can't identify
    return 'valorant';
  }
  
  // Check for Valorant-specific fields
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    
    if (obj.matchInfo && typeof obj.matchInfo === 'object') {
      const matchInfo = obj.matchInfo as Record<string, unknown>;
      if (matchInfo.mapId && typeof matchInfo.mapId === 'string') {
        if (matchInfo.mapId.includes('Game/Maps') || matchInfo.mapId.includes('Valorant')) {
          return 'valorant';
        }
      }
    }
    
    if (Array.isArray(obj.roundResults) || Array.isArray(obj.characterId)) {
      return 'valorant';
    }
    
    // Check for CS2-specific fields
    if (obj.header && typeof obj.header === 'object') {
      const header = obj.header as Record<string, unknown>;
      if (header.demoFileStamp || header.demoProtocol) {
        return 'cs2';
      }
    }
    
    if (Array.isArray(obj.gameEvents)) {
      return 'cs2';
    }
  }
  
  // Default fallback
  return 'valorant';
}

/**
 * Validate a replay file without full parsing
 */
export function validateReplayFormat(
  data: ArrayBuffer | string,
  gameType?: GameType
): { valid: boolean; gameType: GameType; error?: string } {
  const detectedType = gameType || detectGameType(data);
  
  if (!hasParser(detectedType)) {
    return {
      valid: false,
      gameType: detectedType,
      error: `No parser available for game type: ${detectedType}`,
    };
  }
  
  try {
    let parsed: unknown;
    
    if (typeof data === 'string') {
      parsed = JSON.parse(data);
    } else {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(data);
      parsed = JSON.parse(text);
    }
    
    const parser = createParser(detectedType);
    const isValid = parser.validate(parsed);
    
    return {
      valid: isValid,
      gameType: detectedType,
      error: isValid ? undefined : 'Failed validation',
    };
  } catch (error) {
    // For binary formats, just check the header
    if (detectedType === 'cs2' && data instanceof ArrayBuffer) {
      const decoder = new TextDecoder('ascii');
      const header = decoder.decode(new Uint8Array(data, 0, Math.min(8, data.byteLength)));
      const isValid = header.startsWith('HL2DEMO');
      
      return {
        valid: isValid,
        gameType: detectedType,
        error: isValid ? undefined : 'Invalid CS2 demo header',
      };
    }
    
    return {
      valid: false,
      gameType: detectedType,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Constants
// ============================================================================

export { REPLAY_SCHEMA_VERSION, PARSER_PERFORMANCE_LIMITS, PARSE_ERROR_CODES } from './types';

// ============================================================================
// Default Export
// ============================================================================

export default {
  createParser,
  createValorantParser,
  createCS2Parser,
  parseReplay,
  detectGameType,
  validateReplayFormat,
  registerParser,
  hasParser,
  getSupportedGameTypes,
};
