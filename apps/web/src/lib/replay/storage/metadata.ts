// @ts-nocheck
/**
 * Replay Metadata Indexing
 * Extract and index metadata from replays for fast searching
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Replay, GameType, Player, Team, KillEvent, GameEvent } from '../types';

// ============================================================================
// Metadata Types
// ============================================================================

export interface ExtractedMetadata {
  matchId: string;
  gameType: GameType;
  mapName: string;
  timestamp: number;
  duration: number;
  fileSize: number;
  
  // Teams
  teams: {
    id: string;
    name: string;
    score: number;
    side: string;
    won: boolean;
  }[];
  
  // Players
  players: {
    id: string;
    name: string;
    teamId: string;
    agent?: string;
    role?: string;
    stats: {
      kills: number;
      deaths: number;
      assists: number;
      damageDealt: number;
      headshots: number;
    };
  }[];
  
  // Match stats
  matchStats: {
    totalRounds: number;
    totalKills: number;
    totalDamage: number;
    bombPlants: number;
    bombDefuses: number;
    firstBloods: number;
    clutches: number;
    aces: number;
  };
  
  // Timeline highlights
  highlights: {
    timestamp: number;
    round: number;
    type: 'kill' | 'clutch' | 'ace' | 'multi_kill' | 'bomb_plant' | 'bomb_defuse';
    description: string;
    playerId?: string;
  }[];
  
  // Searchable text
  searchText: string;
  
  // Tags
  suggestedTags: string[];
}

export interface MetadataIndex {
  id: string;
  matchId: string;
  gameType: GameType;
  mapName: string;
  timestamp: number;
  duration: number;
  
  // Index fields
  playerIds: string[];
  playerNames: string[];
  teamIds: string[];
  teamNames: string[];
  
  // Stats for filtering
  totalRounds: number;
  totalKills: number;
  winningTeamId: string;
  scoreDiff: number;
  
  // Searchable content
  searchText: string;
  tags: string[];
  
  // Timestamps
  indexedAt: number;
}

export interface FullTextSearchResult {
  id: string;
  score: number;
  matches: {
    field: string;
    text: string;
    positions: number[];
  }[];
}

export interface SearchQuery {
  text?: string;
  filters?: {
    gameType?: GameType;
    mapName?: string;
    playerName?: string;
    teamName?: string;
    dateFrom?: number;
    dateTo?: number;
    minRounds?: number;
    maxRounds?: number;
  };
  tags?: string[];
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extract comprehensive metadata from a replay
 */
export function extractMetadata(replay: Replay, fileSize: number = 0): ExtractedMetadata {
  const matchStats = calculateMatchStats(replay);
  const highlights = extractHighlights(replay);
  const suggestedTags = generateSuggestedTags(replay, matchStats);
  
  const metadata: ExtractedMetadata = {
    matchId: replay.matchId,
    gameType: replay.gameType,
    mapName: replay.mapName,
    timestamp: replay.timestamp,
    duration: replay.duration,
    fileSize,
    
    teams: replay.teams.map(team => ({
      id: team.id,
      name: team.name,
      score: team.score,
      side: team.side,
      won: team.score === Math.max(...replay.teams.map(t => t.score)),
    })),
    
    players: replay.players.map(player => ({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      agent: player.agent,
      role: player.role,
      stats: {
        kills: player.stats.kills,
        deaths: player.stats.deaths,
        assists: player.stats.assists,
        damageDealt: player.stats.damageDealt,
        headshots: player.stats.headshots,
      },
    })),
    
    matchStats,
    highlights,
    searchText: generateSearchText(replay),
    suggestedTags,
  };
  
  return metadata;
}

/**
 * Calculate comprehensive match statistics
 */
function calculateMatchStats(replay: Replay) {
  let totalKills = 0;
  let totalDamage = 0;
  let bombPlants = 0;
  let bombDefuses = 0;
  let firstBloods = 0;
  let clutches = 0;
  let aces = 0;
  
  const roundKills = new Map<number, Map<string, number>>();
  const roundPlayersAlive = new Map<number, Set<string>>();
  
  for (const event of replay.events) {
    switch (event.type) {
      case 'kill':
        totalKills++;
        const kill = event as KillEvent;
        
        // Track kills per round per player
        if (!roundKills.has(event.roundNumber)) {
          roundKills.set(event.roundNumber, new Map());
        }
        const roundMap = roundKills.get(event.roundNumber)!;
        roundMap.set(kill.killerId, (roundMap.get(kill.killerId) || 0) + 1);
        
        // First blood detection (first kill in round)
        const roundKillCount = Array.from(roundMap.values()).reduce((a, b) => a + b, 0);
        if (roundKillCount === 1) {
          firstBloods++;
        }
        break;
        
      case 'damage':
        const damage = event as { damage: number };
        totalDamage += damage.damage || 0;
        break;
        
      case 'bomb_plant':
        bombPlants++;
        break;
        
      case 'bomb_defuse':
        bombDefuses++;
        break;
    }
  }
  
  // Detect aces (5 kills in a round by one player)
  for (const [round, kills] of roundKills) {
    for (const [playerId, count] of kills) {
      if (count >= 5) {
        aces++;
      }
    }
  }
  
  // Detect clutches (would need more detailed round state analysis)
  // Simplified: count rounds where a player won with few teammates
  
  return {
    totalRounds: replay.rounds.length,
    totalKills,
    totalDamage,
    bombPlants,
    bombDefuses,
    firstBloods,
    clutches,
    aces,
  };
}

/**
 * Extract notable highlights from the replay
 */
function extractHighlights(replay: Replay): ExtractedMetadata['highlights'] {
  const highlights: ExtractedMetadata['highlights'] = [];
  const roundKills = new Map<number, Map<string, number>>();
  
  for (const event of replay.events) {
    switch (event.type) {
      case 'kill': {
        const kill = event as KillEvent;
        
        // Track for multi-kill detection
        if (!roundKills.has(event.roundNumber)) {
          roundKills.set(event.roundNumber, new Map());
        }
        const roundMap = roundKills.get(event.roundNumber)!;
        const killCount = (roundMap.get(kill.killerId) || 0) + 1;
        roundMap.set(kill.killerId, killCount);
        
        // Multi-kill highlight (3+ kills)
        if (killCount === 3 || killCount === 4 || killCount === 5) {
          const player = replay.players.find(p => p.id === kill.killerId);
          highlights.push({
            timestamp: event.timestamp,
            round: event.roundNumber,
            type: killCount === 5 ? 'ace' : 'multi_kill',
            description: `${player?.name || 'Unknown'} ${killCount}K`,
            playerId: kill.killerId,
          });
        }
        
        // First blood
        const totalRoundKills = Array.from(roundMap.values()).reduce((a, b) => a + b, 0);
        if (totalRoundKills === 1) {
          const player = replay.players.find(p => p.id === kill.killerId);
          highlights.push({
            timestamp: event.timestamp,
            round: event.roundNumber,
            type: 'kill',
            description: `First Blood: ${player?.name || 'Unknown'}`,
            playerId: kill.killerId,
          });
        }
        break;
      }
      
      case 'bomb_plant': {
        highlights.push({
          timestamp: event.timestamp,
          round: event.roundNumber,
          type: 'bomb_plant',
          description: 'Bomb Planted',
        });
        break;
      }
      
      case 'bomb_defuse': {
        highlights.push({
          timestamp: event.timestamp,
          round: event.roundNumber,
          type: 'bomb_defuse',
          description: 'Bomb Defused',
        });
        break;
      }
    }
  }
  
  // Sort by timestamp
  highlights.sort((a, b) => a.timestamp - b.timestamp);
  
  return highlights;
}

/**
 * Generate searchable text from replay data
 */
function generateSearchText(replay: Replay): string {
  const parts: string[] = [
    replay.mapName,
    replay.matchId,
    ...replay.teams.map(t => t.name),
    ...replay.players.map(p => p.name),
    ...replay.players.map(p => p.agent || ''),
    replay.gameType,
  ];
  
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Generate suggested tags based on replay characteristics
 */
function generateSuggestedTags(
  replay: Replay, 
  stats: ExtractedMetadata['matchStats']
): string[] {
  const tags: string[] = [];
  
  // Game type
  tags.push(replay.gameType);
  
  // Map
  tags.push(replay.mapName.toLowerCase().replace(/\s+/g, '_'));
  
  // Match characteristics
  if (stats.totalRounds > 24) tags.push('overtime');
  if (stats.totalRounds < 20) tags.push('short_match');
  if (stats.aces > 0) tags.push('ace');
  if (stats.totalKills > 100) tags.push('high_kills');
  
  // Close match
  const scores = replay.teams.map(t => t.score);
  if (Math.abs(scores[0] - scores[1]) <= 2) {
    tags.push('close_match');
  }
  
  return [...new Set(tags)];
}

// ============================================================================
// Full-Text Search
// ============================================================================

/**
 * Simple full-text search implementation
 */
export function searchMetadata(
  indexes: MetadataIndex[],
  query: SearchQuery
): FullTextSearchResult[] {
  const results: FullTextSearchResult[] = [];
  
  for (const index of indexes) {
    let score = 0;
    const matches: FullTextSearchResult['matches'] = [];
    
    // Text search
    if (query.text) {
      const searchTerms = query.text.toLowerCase().split(/\s+/);
      const searchText = index.searchText;
      
      for (const term of searchTerms) {
        const positions: number[] = [];
        let pos = searchText.indexOf(term);
        
        while (pos !== -1) {
          positions.push(pos);
          pos = searchText.indexOf(term, pos + 1);
        }
        
        if (positions.length > 0) {
          score += positions.length * 10;
          matches.push({ field: 'searchText', text: term, positions });
        }
      }
    }
    
    // Tag filtering
    if (query.tags && query.tags.length > 0) {
      const hasAllTags = query.tags.every(tag => 
        index.tags.includes(tag.toLowerCase())
      );
      if (!hasAllTags) continue;
      score += query.tags.length * 5;
    }
    
    // Filters
    if (query.filters) {
      if (query.filters.gameType && index.gameType !== query.filters.gameType) continue;
      if (query.filters.mapName && !index.mapName.toLowerCase().includes(query.filters.mapName.toLowerCase())) continue;
      if (query.filters.playerName) {
        const hasPlayer = index.playerNames.some(n => 
          n.toLowerCase().includes(query.filters!.playerName!.toLowerCase())
        );
        if (!hasPlayer) continue;
      }
      if (query.filters.teamName) {
        const hasTeam = index.teamNames.some(n => 
          n.toLowerCase().includes(query.filters!.teamName!.toLowerCase())
        );
        if (!hasTeam) continue;
      }
      if (query.filters.dateFrom && index.timestamp < query.filters.dateFrom) continue;
      if (query.filters.dateTo && index.timestamp > query.filters.dateTo) continue;
      if (query.filters.minRounds && index.totalRounds < query.filters.minRounds) continue;
      if (query.filters.maxRounds && index.totalRounds > query.filters.maxRounds) continue;
    }
    
    if (score > 0 || (!query.text && !query.tags?.length)) {
      results.push({ id: index.id, score, matches });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

/**
 * Build a searchable index from metadata
 */
export function buildIndex(id: string, metadata: ExtractedMetadata): MetadataIndex {
  const winningTeam = metadata.teams.find(t => t.won);
  const scores = metadata.teams.map(t => t.score);
  
  return {
    id,
    matchId: metadata.matchId,
    gameType: metadata.gameType,
    mapName: metadata.mapName,
    timestamp: metadata.timestamp,
    duration: metadata.duration,
    
    playerIds: metadata.players.map(p => p.id),
    playerNames: metadata.players.map(p => p.name.toLowerCase()),
    teamIds: metadata.teams.map(t => t.id),
    teamNames: metadata.teams.map(t => t.name.toLowerCase()),
    
    totalRounds: metadata.matchStats.totalRounds,
    totalKills: metadata.matchStats.totalKills,
    winningTeamId: winningTeam?.id || '',
    scoreDiff: Math.abs(scores[0] - scores[1]),
    
    searchText: metadata.searchText,
    tags: metadata.suggestedTags.map(t => t.toLowerCase()),
    
    indexedAt: Date.now(),
  };
}

// ============================================================================
// Tag Management
// ============================================================================

/**
 * Get all unique tags from a collection of indexes
 */
export function extractAllTags(indexes: MetadataIndex[]): string[] {
  const allTags = new Set<string>();
  
  for (const index of indexes) {
    for (const tag of index.tags) {
      allTags.add(tag);
    }
  }
  
  return Array.from(allTags).sort();
}

/**
 * Get tag statistics
 */
export function getTagStats(indexes: MetadataIndex[]): Map<string, number> {
  const stats = new Map<string, number>();
  
  for (const index of indexes) {
    for (const tag of index.tags) {
      stats.set(tag, (stats.get(tag) || 0) + 1);
    }
  }
  
  return stats;
}

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Serialize metadata index for export
 */
export function serializeIndex(index: MetadataIndex): string {
  return JSON.stringify(index);
}

/**
 * Deserialize metadata index from import
 */
export function deserializeIndex(data: string): MetadataIndex {
  return JSON.parse(data) as MetadataIndex;
}

// ============================================================================
// Export
// ============================================================================

export default {
  extractMetadata,
  buildIndex,
  searchMetadata,
  extractAllTags,
  getTagStats,
  serializeIndex,
  deserializeIndex,
};
