/**
 * Data Transformer
 * ================
 * Normalizes data formats, maps schemas, enriches data, and resolves conflicts.
 * 
 * [Ver001.000] - Data transformer
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import type {
  RawDataRecord,
  NormalizedRecord,
  IngestionDataType,
  DataSourceType,
  SchemaMapping,
  FieldMapping,
  FieldTransform,
  FieldValidation,
  ValidationRule,
  DataConflict,
  ConflictResolution,
  DataEnrichment,
} from './types';

// =============================================================================
// Schema Registry
// =============================================================================

interface SchemaDefinition {
  version: string;
  fields: SchemaField[];
  required: string[];
  indexes: string[];
}

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  nullable?: boolean;
  default?: unknown;
  validators?: ValidationRule[];
}

// Standard schemas for each data type
const SCHEMA_REGISTRY: Record<IngestionDataType, SchemaDefinition> = {
  match: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'tournamentId', type: 'string', nullable: true },
      { name: 'seriesId', type: 'string', nullable: true },
      { name: 'teamAId', type: 'string', nullable: false },
      { name: 'teamBId', type: 'string', nullable: false },
      { name: 'teamAName', type: 'string', nullable: false },
      { name: 'teamBName', type: 'string', nullable: false },
      { name: 'teamAScore', type: 'number', nullable: false, default: 0 },
      { name: 'teamBScore', type: 'number', nullable: false, default: 0 },
      { name: 'status', type: 'string', nullable: false },
      { name: 'scheduledAt', type: 'date', nullable: true },
      { name: 'startedAt', type: 'date', nullable: true },
      { name: 'endedAt', type: 'date', nullable: true },
      { name: 'game', type: 'string', nullable: false },
      { name: 'format', type: 'string', nullable: true },
      { name: 'maps', type: 'array', nullable: true, default: [] },
      { name: 'streams', type: 'array', nullable: true, default: [] },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'teamAId', 'teamBId', 'status', 'game'],
    indexes: ['id', 'sourceId', 'tournamentId', 'teamAId', 'teamBId'],
  },
  player: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'realName', type: 'string', nullable: true },
      { name: 'nationality', type: 'string', nullable: true },
      { name: 'teamId', type: 'string', nullable: true },
      { name: 'teamName', type: 'string', nullable: true },
      { name: 'role', type: 'string', nullable: true },
      { name: 'age', type: 'number', nullable: true },
      { name: 'game', type: 'string', nullable: false },
      { name: 'stats', type: 'object', nullable: true, default: {} },
      { name: 'socialLinks', type: 'object', nullable: true, default: {} },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'name', 'game'],
    indexes: ['id', 'sourceId', 'teamId', 'name'],
  },
  team: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'tag', type: 'string', nullable: true },
      { name: 'logo', type: 'string', nullable: true },
      { name: 'country', type: 'string', nullable: true },
      { name: 'game', type: 'string', nullable: false },
      { name: 'players', type: 'array', nullable: true, default: [] },
      { name: 'ranking', type: 'number', nullable: true },
      { name: 'stats', type: 'object', nullable: true, default: {} },
      { name: 'socialLinks', type: 'object', nullable: true, default: {} },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'name', 'game'],
    indexes: ['id', 'sourceId', 'name'],
  },
  tournament: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'name', type: 'string', nullable: false },
      { name: 'slug', type: 'string', nullable: true },
      { name: 'game', type: 'string', nullable: false },
      { name: 'region', type: 'string', nullable: true },
      { name: 'startDate', type: 'date', nullable: true },
      { name: 'endDate', type: 'date', nullable: true },
      { name: 'prizePool', type: 'object', nullable: true },
      { name: 'teams', type: 'array', nullable: true, default: [] },
      { name: 'matches', type: 'array', nullable: true, default: [] },
      { name: 'status', type: 'string', nullable: false },
      { name: 'tier', type: 'string', nullable: true },
      { name: 'organizer', type: 'string', nullable: true },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'name', 'game', 'status'],
    indexes: ['id', 'sourceId', 'name', 'startDate'],
  },
  series: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'tournamentId', type: 'string', nullable: true },
      { name: 'name', type: 'string', nullable: false },
      { name: 'game', type: 'string', nullable: false },
      { name: 'teamAId', type: 'string', nullable: false },
      { name: 'teamBId', type: 'string', nullable: false },
      { name: 'matches', type: 'array', nullable: true, default: [] },
      { name: 'status', type: 'string', nullable: false },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'name', 'game', 'teamAId', 'teamBId', 'status'],
    indexes: ['id', 'sourceId', 'tournamentId'],
  },
  statistics: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'entityType', type: 'string', nullable: false },
      { name: 'entityId', type: 'string', nullable: false },
      { name: 'game', type: 'string', nullable: false },
      { name: 'matchId', type: 'string', nullable: true },
      { name: 'tournamentId', type: 'string', nullable: true },
      { name: 'stats', type: 'object', nullable: false },
      { name: 'calculatedAt', type: 'date', nullable: false },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'entityType', 'entityId', 'game', 'stats'],
    indexes: ['id', 'entityId', 'matchId', 'tournamentId'],
  },
  event: {
    version: '1.0.0',
    fields: [
      { name: 'id', type: 'string', nullable: false },
      { name: 'sourceId', type: 'string', nullable: false },
      { name: 'sourceType', type: 'string', nullable: false },
      { name: 'matchId', type: 'string', nullable: false },
      { name: 'type', type: 'string', nullable: false },
      { name: 'timestamp', type: 'date', nullable: false },
      { name: 'round', type: 'number', nullable: true },
      { name: 'data', type: 'object', nullable: false },
      { name: 'metadata', type: 'object', nullable: true, default: {} },
    ],
    required: ['id', 'sourceId', 'sourceType', 'matchId', 'type', 'timestamp', 'data'],
    indexes: ['id', 'matchId', 'type', 'timestamp'],
  },
};

// =============================================================================
// Source-Specific Mappings
// =============================================================================

const SOURCE_MAPPINGS: Record<DataSourceType, Record<string, SchemaMapping>> = {
  pandascore: {
    match: {
      id: 'pandascore-match-v1',
      sourceType: 'pandascore',
      dataType: 'match',
      version: '1.0.0',
      mappings: [
        { sourceField: 'id', targetField: 'id', required: true },
        { sourceField: 'id', targetField: 'sourceId', required: true },
        { sourceField: 'tournament_id', targetField: 'tournamentId', required: false },
        { sourceField: 'serie_id', targetField: 'seriesId', required: false },
        { sourceField: 'opponents.0.opponent.id', targetField: 'teamAId', required: true },
        { sourceField: 'opponents.1.opponent.id', targetField: 'teamBId', required: true },
        { sourceField: 'opponents.0.opponent.name', targetField: 'teamAName', required: true },
        { sourceField: 'opponents.1.opponent.name', targetField: 'teamBName', required: true },
        { sourceField: 'results.0.score', targetField: 'teamAScore', required: false, defaultValue: 0 },
        { sourceField: 'results.1.score', targetField: 'teamBScore', required: false, defaultValue: 0 },
        { sourceField: 'status', targetField: 'status', required: true },
        { sourceField: 'scheduled_at', targetField: 'scheduledAt', required: false, converter: 'date' },
        { sourceField: 'begin_at', targetField: 'startedAt', required: false, converter: 'date' },
        { sourceField: 'end_at', targetField: 'endedAt', required: false, converter: 'date' },
        { sourceField: 'videogame.name', targetField: 'game', required: true, converter: 'custom', customConverter: 'normalizeGame' },
        { sourceField: 'number_of_games', targetField: 'format', required: false },
        { sourceField: 'games', targetField: 'maps', required: false, converter: 'array' },
        { sourceField: 'streams_list', targetField: 'streams', required: false, converter: 'array' },
      ],
      transforms: [
        { field: 'status', operation: 'lowercase' },
        { field: 'teamAName', operation: 'trim' },
        { field: 'teamBName', operation: 'trim' },
      ],
      validations: [
        { field: 'id', rules: [{ type: 'required' }, { type: 'type', expectedType: 'string' }] },
        { field: 'teamAScore', rules: [{ type: 'type', expectedType: 'number' }, { type: 'min', value: 0 }] },
        { field: 'teamBScore', rules: [{ type: 'type', expectedType: 'number' }, { type: 'min', value: 0 }] },
      ],
    },
    player: {
      id: 'pandascore-player-v1',
      sourceType: 'pandascore',
      dataType: 'player',
      version: '1.0.0',
      mappings: [
        { sourceField: 'id', targetField: 'id', required: true },
        { sourceField: 'id', targetField: 'sourceId', required: true },
        { sourceField: 'name', targetField: 'name', required: true },
        { sourceField: 'first_name', targetField: 'realName', required: false, converter: 'custom', customConverter: 'combineNames' },
        { sourceField: 'nationality', targetField: 'nationality', required: false },
        { sourceField: 'current_team.id', targetField: 'teamId', required: false },
        { sourceField: 'current_team.name', targetField: 'teamName', required: false },
        { sourceField: 'role', targetField: 'role', required: false },
        { sourceField: 'age', targetField: 'age', required: false, converter: 'number' },
        { sourceField: 'videogame.name', targetField: 'game', required: true, converter: 'custom', customConverter: 'normalizeGame' },
      ],
      transforms: [
        { field: 'name', operation: 'trim' },
        { field: 'nationality', operation: 'uppercase' },
      ],
      validations: [
        { field: 'id', rules: [{ type: 'required' }] },
        { field: 'name', rules: [{ type: 'required' }] },
      ],
    },
    team: {
      id: 'pandascore-team-v1',
      sourceType: 'pandascore',
      dataType: 'team',
      version: '1.0.0',
      mappings: [
        { sourceField: 'id', targetField: 'id', required: true },
        { sourceField: 'id', targetField: 'sourceId', required: true },
        { sourceField: 'name', targetField: 'name', required: true },
        { sourceField: 'acronym', targetField: 'tag', required: false },
        { sourceField: 'image_url', targetField: 'logo', required: false },
        { sourceField: 'location', targetField: 'country', required: false },
        { sourceField: 'videogame.name', targetField: 'game', required: true, converter: 'custom', customConverter: 'normalizeGame' },
        { sourceField: 'players', targetField: 'players', required: false, converter: 'array' },
      ],
      transforms: [
        { field: 'name', operation: 'trim' },
        { field: 'tag', operation: 'uppercase' },
      ],
      validations: [
        { field: 'id', rules: [{ type: 'required' }] },
        { field: 'name', rules: [{ type: 'required' }] },
      ],
    },
    tournament: {
      id: 'pandascore-tournament-v1',
      sourceType: 'pandascore',
      dataType: 'tournament',
      version: '1.0.0',
      mappings: [
        { sourceField: 'id', targetField: 'id', required: true },
        { sourceField: 'id', targetField: 'sourceId', required: true },
        { sourceField: 'name', targetField: 'name', required: true },
        { sourceField: 'slug', targetField: 'slug', required: false },
        { sourceField: 'videogame.name', targetField: 'game', required: true, converter: 'custom', customConverter: 'normalizeGame' },
        { sourceField: 'serie.league_id', targetField: 'region', required: false },
        { sourceField: 'begin_at', targetField: 'startDate', required: false, converter: 'date' },
        { sourceField: 'end_at', targetField: 'endDate', required: false, converter: 'date' },
        { sourceField: 'prizepool', targetField: 'prizePool', required: false },
        { sourceField: 'teams', targetField: 'teams', required: false, converter: 'array' },
        { sourceField: 'status', targetField: 'status', required: true },
        { sourceField: 'tier', targetField: 'tier', required: false },
        { sourceField: 'serie.full_name', targetField: 'organizer', required: false },
      ],
      transforms: [
        { field: 'name', operation: 'trim' },
        { field: 'status', operation: 'lowercase' },
      ],
      validations: [
        { field: 'id', rules: [{ type: 'required' }] },
        { field: 'name', rules: [{ type: 'required' }] },
      ],
    },
    series: {
      id: 'pandascore-series-v1',
      sourceType: 'pandascore',
      dataType: 'series',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    statistics: {
      id: 'pandascore-stats-v1',
      sourceType: 'pandascore',
      dataType: 'statistics',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    event: {
      id: 'pandascore-event-v1',
      sourceType: 'pandascore',
      dataType: 'event',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
  },
  liquipedia: {
    match: {
      id: 'liquipedia-match-v1',
      sourceType: 'liquipedia',
      dataType: 'match',
      version: '1.0.0',
      mappings: [
        { sourceField: 'match2id', targetField: 'id', required: true },
        { sourceField: 'match2id', targetField: 'sourceId', required: true },
        { sourceField: 'tournament', targetField: 'tournamentId', required: false },
        { sourceField: 'opponent1', targetField: 'teamAName', required: true, converter: 'custom', customConverter: 'extractTeamName' },
        { sourceField: 'opponent2', targetField: 'teamBName', required: true, converter: 'custom', customConverter: 'extractTeamName' },
        { sourceField: 'opponent1score', targetField: 'teamAScore', required: false, converter: 'number', defaultValue: 0 },
        { sourceField: 'opponent2score', targetField: 'teamBScore', required: false, converter: 'number', defaultValue: 0 },
        { sourceField: 'winner', targetField: 'status', required: false, converter: 'custom', customConverter: 'winnerToStatus' },
        { sourceField: 'date', targetField: 'scheduledAt', required: false, converter: 'date' },
        { sourceField: 'game', targetField: 'game', required: true },
        { sourceField: 'format', targetField: 'format', required: false },
        { sourceField: 'stream', targetField: 'streams', required: false, converter: 'array' },
      ],
      transforms: [
        { field: 'teamAName', operation: 'trim' },
        { field: 'teamBName', operation: 'trim' },
      ],
      validations: [
        { field: 'id', rules: [{ type: 'required' }] },
      ],
    },
    player: {
      id: 'liquipedia-player-v1',
      sourceType: 'liquipedia',
      dataType: 'player',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    team: {
      id: 'liquipedia-team-v1',
      sourceType: 'liquipedia',
      dataType: 'team',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    tournament: {
      id: 'liquipedia-tournament-v1',
      sourceType: 'liquipedia',
      dataType: 'tournament',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    series: {
      id: 'liquipedia-series-v1',
      sourceType: 'liquipedia',
      dataType: 'series',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    statistics: {
      id: 'liquipedia-stats-v1',
      sourceType: 'liquipedia',
      dataType: 'statistics',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    event: {
      id: 'liquipedia-event-v1',
      sourceType: 'liquipedia',
      dataType: 'event',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
  },
  hltv: {
    match: {
      id: 'hltv-match-v1',
      sourceType: 'hltv',
      dataType: 'match',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    player: {
      id: 'hltv-player-v1',
      sourceType: 'hltv',
      dataType: 'player',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    team: {
      id: 'hltv-team-v1',
      sourceType: 'hltv',
      dataType: 'team',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    tournament: {
      id: 'hltv-tournament-v1',
      sourceType: 'hltv',
      dataType: 'tournament',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    series: {
      id: 'hltv-series-v1',
      sourceType: 'hltv',
      dataType: 'series',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    statistics: {
      id: 'hltv-stats-v1',
      sourceType: 'hltv',
      dataType: 'statistics',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    event: {
      id: 'hltv-event-v1',
      sourceType: 'hltv',
      dataType: 'event',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
  },
  manual: {
    match: {
      id: 'manual-match-v1',
      sourceType: 'manual',
      dataType: 'match',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    player: {
      id: 'manual-player-v1',
      sourceType: 'manual',
      dataType: 'player',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    team: {
      id: 'manual-team-v1',
      sourceType: 'manual',
      dataType: 'team',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    tournament: {
      id: 'manual-tournament-v1',
      sourceType: 'manual',
      dataType: 'tournament',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    series: {
      id: 'manual-series-v1',
      sourceType: 'manual',
      dataType: 'series',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    statistics: {
      id: 'manual-stats-v1',
      sourceType: 'manual',
      dataType: 'statistics',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    event: {
      id: 'manual-event-v1',
      sourceType: 'manual',
      dataType: 'event',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
  },
  file: {
    match: {
      id: 'file-match-v1',
      sourceType: 'file',
      dataType: 'match',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    player: {
      id: 'file-player-v1',
      sourceType: 'file',
      dataType: 'player',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    team: {
      id: 'file-team-v1',
      sourceType: 'file',
      dataType: 'team',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    tournament: {
      id: 'file-tournament-v1',
      sourceType: 'file',
      dataType: 'tournament',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    series: {
      id: 'file-series-v1',
      sourceType: 'file',
      dataType: 'series',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    statistics: {
      id: 'file-stats-v1',
      sourceType: 'file',
      dataType: 'statistics',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
    event: {
      id: 'file-event-v1',
      sourceType: 'file',
      dataType: 'event',
      version: '1.0.0',
      mappings: [],
      transforms: [],
      validations: [],
    },
  },
};

// =============================================================================
// Custom Converters
// =============================================================================

const CUSTOM_CONVERTERS: Record<string, (value: unknown, data: unknown) => unknown> = {
  normalizeGame: (value: unknown) => {
    const gameMap: Record<string, string> = {
      'Valorant': 'valorant',
      'CS:GO': 'cs2',
      'Counter-Strike': 'cs2',
      'League of Legends': 'lol',
    };
    return gameMap[String(value)] || String(value).toLowerCase();
  },
  combineNames: (value: unknown, data: unknown) => {
    const d = data as Record<string, unknown>;
    const firstName = String(d.first_name || '');
    const lastName = String(d.last_name || '');
    return `${firstName} ${lastName}`.trim();
  },
  extractTeamName: (value: unknown) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>).name || '';
    }
    return '';
  },
  winnerToStatus: (value: unknown) => {
    if (value === '' || value === null || value === undefined) return 'upcoming';
    return 'completed';
  },
};

// =============================================================================
// Data Transformer
// =============================================================================

export class DataTransformer {
  private conflicts: DataConflict[] = [];
  private enrichments: DataEnrichment[] = [];

  /**
   * Transform raw data to normalized format
   */
  transform(
    record: RawDataRecord,
    existingData?: Record<string, unknown>
  ): NormalizedRecord {
    this.conflicts = [];
    this.enrichments = [];

    const mapping = SOURCE_MAPPINGS[record.sourceType]?.[record.dataType];
    const schema = SCHEMA_REGISTRY[record.dataType];

    // Start with default values from schema
    const normalized: Record<string, unknown> = {};
    for (const field of schema.fields) {
      if (field.default !== undefined) {
        normalized[field.name] = field.default;
      }
    }

    // Add source metadata
    normalized.sourceType = record.sourceType;

    // Apply field mappings
    if (mapping) {
      for (const fieldMapping of mapping.mappings) {
        const value = this.getNestedValue(record.rawData, fieldMapping.sourceField);
        
        if (value !== undefined && value !== null) {
          const converted = this.convertValue(value, fieldMapping, record.rawData);
          normalized[fieldMapping.targetField] = converted;
        } else if (fieldMapping.required && fieldMapping.defaultValue !== undefined) {
          normalized[fieldMapping.targetField] = fieldMapping.defaultValue;
        }
      }

      // Apply transforms
      for (const transform of mapping.transforms) {
        const value = normalized[transform.field];
        if (value !== undefined) {
          normalized[transform.field] = this.applyTransform(value, transform);
        }
      }
    } else {
      // No mapping available, pass through raw data
      Object.assign(normalized, record.rawData);
    }

    // Check for conflicts with existing data
    if (existingData) {
      this.detectConflicts(normalized, existingData);
    }

    // Apply data enrichments
    this.applyEnrichments(normalized, record);

    return {
      id: `norm_${record.id}`,
      sourceRecordId: record.id,
      dataType: record.dataType,
      normalizedData: normalized,
      schemaVersion: schema.version,
      normalizedAt: new Date().toISOString(),
      conflicts: [...this.conflicts],
      enrichments: [...this.enrichments],
    };
  }

  /**
   * Transform multiple records
   */
  transformBatch(
    records: RawDataRecord[],
    existingDataMap?: Map<string, Record<string, unknown>>
  ): NormalizedRecord[] {
    return records.map(record => {
      const existing = existingDataMap?.get(String(this.getNestedValue(record.rawData, 'id')));
      return this.transform(record, existing);
    });
  }

  /**
   * Validate normalized data against schema
   */
  validate(normalized: NormalizedRecord): { valid: boolean; errors: string[] } {
    const schema = SCHEMA_REGISTRY[normalized.dataType];
    const errors: string[] = [];
    const data = normalized.normalizedData as Record<string, unknown>;

    // Check required fields
    for (const fieldName of schema.required) {
      if (data[fieldName] === undefined || data[fieldName] === null) {
        errors.push(`Required field '${fieldName}' is missing`);
      }
    }

    // Validate field types
    for (const field of schema.fields) {
      const value = data[field.name];
      if (value !== undefined && value !== null) {
        const typeValid = this.validateType(value, field.type);
        if (!typeValid) {
          errors.push(`Field '${field.name}' should be of type ${field.type}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Resolve conflicts using specified strategy
   */
  resolveConflicts(
    record: NormalizedRecord,
    strategy: ConflictResolution['strategy'] = 'timestamp',
    existingData?: Record<string, unknown>
  ): NormalizedRecord {
    const resolved = { ...record };
    const data = resolved.normalizedData as Record<string, unknown>;

    for (const conflict of record.conflicts) {
      let resolvedValue: unknown;

      switch (strategy) {
        case 'source_wins':
          resolvedValue = conflict.sourceValue;
          break;
        case 'existing_wins':
          resolvedValue = conflict.existingValue;
          break;
        case 'timestamp':
          // Source wins if it's newer (assume it is for now)
          resolvedValue = conflict.sourceValue;
          break;
        case 'merge':
          resolvedValue = this.mergeValues(conflict.sourceValue, conflict.existingValue);
          break;
        case 'manual':
          // Keep source value, mark for manual review
          resolvedValue = conflict.sourceValue;
          break;
        default:
          resolvedValue = conflict.sourceValue;
      }

      data[conflict.field] = resolvedValue;
      conflict.resolution = {
        strategy,
        resolvedValue,
        resolvedAt: new Date().toISOString(),
      };
    }

    return resolved;
  }

  /**
   * Get schema for data type
   */
  getSchema(dataType: IngestionDataType): SchemaDefinition {
    return SCHEMA_REGISTRY[dataType];
  }

  /**
   * Get mapping for source and data type
   */
  getMapping(sourceType: DataSourceType, dataType: IngestionDataType): SchemaMapping | undefined {
    return SOURCE_MAPPINGS[sourceType]?.[dataType];
  }

  /**
   * Register custom mapping
   */
  registerMapping(mapping: SchemaMapping): void {
    if (!SOURCE_MAPPINGS[mapping.sourceType]) {
      SOURCE_MAPPINGS[mapping.sourceType] = {} as Record<IngestionDataType, SchemaMapping>;
    }
    SOURCE_MAPPINGS[mapping.sourceType][mapping.dataType] = mapping;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;
    
    const keys = path.split('.');
    let value: unknown = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      
      // Handle array indices
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''), 10);
        const arr = (value as Record<string, unknown>)[arrayKey];
        if (!Array.isArray(arr)) return undefined;
        value = arr[index];
      } else {
        value = (value as Record<string, unknown>)[key];
      }
    }
    
    return value;
  }

  private convertValue(
    value: unknown,
    mapping: FieldMapping,
    rawData: unknown
  ): unknown {
    if (mapping.customConverter && CUSTOM_CONVERTERS[mapping.customConverter]) {
      return CUSTOM_CONVERTERS[mapping.customConverter](value, rawData);
    }

    switch (mapping.converter) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(String(value)).toISOString();
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : {};
      default:
        return value;
    }
  }

  private applyTransform(value: unknown, transform: FieldTransform): unknown {
    const str = String(value);
    
    switch (transform.operation) {
      case 'uppercase':
        return str.toUpperCase();
      case 'lowercase':
        return str.toLowerCase();
      case 'trim':
        return str.trim();
      case 'split':
        return str.split(transform.params?.separator as string || ',');
      case 'join':
        return Array.isArray(value) 
          ? value.join(transform.params?.separator as string || ',')
          : str;
      case 'replace':
        return str.replace(
          new RegExp(transform.params?.pattern as string, 'g'),
          transform.params?.replacement as string || ''
        );
      default:
        return value;
    }
  }

  private detectConflicts(newData: Record<string, unknown>, existingData: Record<string, unknown>): void {
    for (const key of Object.keys(newData)) {
      const newValue = newData[key];
      const existingValue = existingData[key];

      if (existingValue !== undefined && existingValue !== null) {
        if (JSON.stringify(newValue) !== JSON.stringify(existingValue)) {
          this.conflicts.push({
            id: `conflict_${key}_${Date.now()}`,
            field: key,
            sourceValue: newValue,
            existingValue,
            severity: this.calculateConflictSeverity(key, newValue, existingValue),
          });
        }
      }
    }
  }

  private calculateConflictSeverity(
    field: string,
    newValue: unknown,
    existingValue: unknown
  ): DataConflict['severity'] {
    // Critical fields
    const criticalFields = ['id', 'teamAId', 'teamBId', 'status'];
    if (criticalFields.includes(field)) return 'critical';

    // High priority fields
    const highFields = ['teamAScore', 'teamBScore', 'scheduledAt', 'startDate'];
    if (highFields.includes(field)) return 'high';

    // Medium priority fields
    const mediumFields = ['teamAName', 'teamBName', 'format', 'maps'];
    if (mediumFields.includes(field)) return 'medium';

    return 'low';
  }

  private mergeValues(source: unknown, existing: unknown): unknown {
    if (Array.isArray(source) && Array.isArray(existing)) {
      return [...existing, ...source];
    }
    if (typeof source === 'object' && typeof existing === 'object') {
      return { ...existing, ...source };
    }
    return source;
  }

  private applyEnrichments(normalized: Record<string, unknown>, record: RawDataRecord): void {
    // Add computed fields
    if (record.dataType === 'match') {
      const teamAScore = Number(normalized.teamAScore) || 0;
      const teamBScore = Number(normalized.teamBScore) || 0;
      
      if (teamAScore > 0 || teamBScore > 0) {
        normalized.totalRounds = teamAScore + teamBScore;
        
        if (teamAScore > teamBScore) {
          normalized.winnerId = normalized.teamAId;
          normalized.winnerName = normalized.teamAName;
        } else if (teamBScore > teamAScore) {
          normalized.winnerId = normalized.teamBId;
          normalized.winnerName = normalized.teamBName;
        }

        this.enrichments.push({
          field: 'totalRounds',
          source: 'computed',
          value: normalized.totalRounds,
          confidence: 1.0,
        });
      }
    }

    // Add ingestion metadata
    normalized.ingestedAt = new Date().toISOString();
    normalized.ingestionSource = record.sourceType;
  }

  private validateType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return !isNaN(Date.parse(String(value)));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

export function createTransformer(): DataTransformer {
  return new DataTransformer();
}

export function createSchemaMapping(
  sourceType: DataSourceType,
  dataType: IngestionDataType,
  mappings: FieldMapping[],
  transforms: FieldTransform[] = [],
  validations: FieldValidation[] = []
): SchemaMapping {
  return {
    id: `${sourceType}-${dataType}-v1`,
    sourceType,
    dataType,
    version: '1.0.0',
    mappings,
    transforms,
    validations,
  };
}

// Default export
export default DataTransformer;
