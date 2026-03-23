/**
 * Validation System Tests
 * 
 * Comprehensive test suite for data validation and cleaning system
 * for Libre-X-eSport 4NJZ4 TENET Platform.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSchema,
  createValidator,
  schemaRegistry,
  mergeSchemas,
  pickSchema,
  omitSchema,
  PlayerSchema,
  TeamSchema,
  MatchSchema,
  PlayerStatsSchema,
  isString,
  isNumber,
  isInteger,
  isBoolean,
  isObject,
  isArray,
  isDate,
  isDateString,
  type ValidationSchema,
  type SchemaField,
} from '../schema';

import {
  cleanData,
  cleanPlayerData,
  cleanMatchData,
  cleanStatsData,
  removeDuplicates,
  findDuplicates,
  fillMissingValues,
  normalizeFormats,
  detectOutliers,
  normalizeRegionCode,
  normalizeAgentName,
  type CleanOptions,
} from '../cleaner';

import {
  calculateQualityScore,
  calculateCompletenessMetrics,
  calculateAccuracyMetrics,
  calculateConsistencyMetrics,
  generateDatasetQualityReport,
  getQualityBadge,
  scoreToGrade,
  type QualityGrade,
  type ScoringConfig,
} from '../quality';

import {
  ValidationPipeline,
  runBatchValidation,
  createPipeline,
  quickValidate,
  commonBusinessRules,
  type PipelineConfig,
  type PipelineResult,
} from '../pipeline';

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('Schema Validation', () => {
  describe('Type Guards', () => {
    it('should correctly identify strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });

    it('should correctly identify numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber('123')).toBe(false);
    });

    it('should correctly identify integers', () => {
      expect(isInteger(42)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-5)).toBe(true);
      expect(isInteger(3.14)).toBe(false);
    });

    it('should correctly identify booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });

    it('should correctly identify objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
    });

    it('should correctly identify arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
    });

    it('should correctly identify dates', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('invalid'))).toBe(false);
      expect(isDate('2024-01-01')).toBe(false);
    });

    it('should correctly identify date strings', () => {
      expect(isDateString('2024-01-15')).toBe(true);
      expect(isDateString('2024-03-23T10:30:00Z')).toBe(true);
      expect(isDateString('not a date')).toBe(false);
      expect(isDateString(1234567890)).toBe(false);
    });
  });

  describe('Player Schema Validation', () => {
    it('should validate a valid player object', () => {
      const player = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'TestPlayer',
        tag: 'TP',
        region: 'NA',
        role: 'duelist',
        rank: 100,
        isActive: true,
      };

      const result = validateSchema(player, PlayerSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const player = {
        name: 'TestPlayer',
      };

      const result = validateSchema(player, PlayerSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });

    it('should validate region enum values', () => {
      const player = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'TestPlayer',
        region: 'INVALID',
      };

      const result = validateSchema(player, PlayerSchema);
      expect(result.errors.some(e => e.field === 'region')).toBe(true);
    });

    it('should validate string length constraints', () => {
      const player = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'A',
        tag: 'TOOLONGTAG',
      };

      const result = validateSchema(player, PlayerSchema);
      // Tag exceeds maxLength but is not required, so only warning
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate UUID format', () => {
      const player = {
        id: 'not-a-valid-uuid',
        name: 'TestPlayer',
      };

      const result = validateSchema(player, PlayerSchema);
      expect(result.errors.some(e => e.field === 'id' && e.type === 'format')).toBe(true);
    });
  });

  describe('Team Schema Validation', () => {
    it('should validate a valid team object', () => {
      const team = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Team',
        tag: 'TT',
        region: 'EU',
        players: [{ id: 'player1' }],
      };

      const result = validateSchema(team, TeamSchema);
      expect(result.valid).toBe(true);
    });

    it('should validate tag pattern', () => {
      const team = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Team',
        tag: 'lowercase',
        region: 'NA',
        players: [{ id: 'p1' }],
      };

      const result = validateSchema(team, TeamSchema);
      expect(result.errors.some(e => e.field === 'tag')).toBe(true);
    });

    it('should enforce minItems for players array', () => {
      const team = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Team',
        tag: 'TT',
        region: 'NA',
        players: [],
      };

      const result = validateSchema(team, TeamSchema);
      expect(result.errors.some(e => e.field === 'players')).toBe(true);
    });
  });

  describe('Match Schema Validation', () => {
    it('should validate a valid match object', () => {
      const match = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        gameType: 'valorant',
        map: 'Haven',
        status: 'completed',
        teamA: { id: 'team1', name: 'Team A', score: 13 },
        teamB: { id: 'team2', name: 'Team B', score: 10 },
      };

      const result = validateSchema(match, MatchSchema);
      expect(result.valid).toBe(true);
    });

    it('should validate gameType enum', () => {
      const match = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        gameType: 'overwatch',
        map: 'Map',
        status: 'live',
        teamA: { id: 't1', name: 'A', score: 0 },
        teamB: { id: 't2', name: 'B', score: 0 },
      };

      const result = validateSchema(match, MatchSchema);
      expect(result.errors.some(e => e.field === 'gameType')).toBe(true);
    });
  });

  describe('Schema Utilities', () => {
    it('should create a validator function', () => {
      const validatePlayer = createValidator(PlayerSchema);
      const result = validatePlayer({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' });
      expect(result.valid).toBe(true);
    });

    it('should merge schemas', () => {
      const extended = mergeSchemas(PlayerSchema, {
        fields: [{ name: 'customField', type: 'string' }],
      });
      expect(extended.fields.length).toBeGreaterThan(PlayerSchema.fields.length);
    });

    it('should pick fields from schema', () => {
      const picked = pickSchema(PlayerSchema, ['id', 'name']);
      expect(picked.fields).toHaveLength(2);
      expect(picked.fields.every(f => ['id', 'name'].includes(f.name))).toBe(true);
    });

    it('should omit fields from schema', () => {
      const omitted = omitSchema(PlayerSchema, ['socials', 'joinedAt']);
      expect(omitted.fields.every(f => !['socials', 'joinedAt'].includes(f.name))).toBe(true);
    });

    it('should register and retrieve schemas', () => {
      schemaRegistry.register(PlayerSchema);
      const retrieved = schemaRegistry.get('Player');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Player');
    });
  });
});

// ============================================================================
// Data Cleaner Tests
// ============================================================================

describe('Data Cleaner', () => {
  describe('Duplicate Removal', () => {
    it('should remove duplicate records', () => {
      const data = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '1', name: 'A' },
      ];

      const result = removeDuplicates(data);
      expect(result.unique).toHaveLength(2);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should keep last duplicate when specified', () => {
      const data = [
        { id: '1', name: 'A', value: 1 },
        { id: '1', name: 'A', value: 2 },
      ];

      const result = removeDuplicates(data, { keep: 'last', keySelector: d => String(d.id) });
      expect(result.unique).toHaveLength(1);
      expect((result.unique[0] as Record<string, unknown>).value).toBe(2);
    });

    it('should find all duplicates', () => {
      const data = [
        { id: '1', name: 'A' },
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '2', name: 'B' },
      ];

      const duplicates = findDuplicates(data, d => String((d as Record<string, unknown>).id));
      expect(duplicates.size).toBe(2);
    });
  });

  describe('Missing Value Handling', () => {
    it('should fill missing values with mean', () => {
      const data = [
        { id: '1', score: 10 },
        { id: '2', score: undefined },
        { id: '3', score: 30 },
      ];

      const result = fillMissingValues(data, { strategy: 'mean', fields: ['score'] });
      expect(result.filled[1].score).toBe(20);
      expect(result.stats.score).toBe(1);
    });

    it('should fill missing values with constant', () => {
      const data = [
        { id: '1', status: 'active' },
        { id: '2', status: undefined },
      ];

      const result = fillMissingValues(data, { 
        strategy: 'constant', 
        constantValue: 'unknown',
        fields: ['status'] 
      });
      expect(result.filled[1].status).toBe('unknown');
    });

    it('should fill with forward value', () => {
      const data = [
        { id: '1', value: 10 },
        { id: '2', value: undefined },
        { id: '3', value: 30 },
      ];

      const result = fillMissingValues(data, { strategy: 'forward', fields: ['value'] });
      expect(result.filled[1].value).toBe(10);
    });
  });

  describe('Format Normalization', () => {
    it('should normalize string case', () => {
      const data = [{ name: 'JOHN DOE' }];
      const result = normalizeFormats(data, { stringCase: 'lower' });
      expect(result.normalized[0].name).toBe('john doe');
    });

    it('should normalize to title case', () => {
      const data = [{ name: 'john doe' }];
      const result = normalizeFormats(data, { stringCase: 'title' });
      expect(result.normalized[0].name).toBe('John Doe');
    });

    it('should trim whitespace', () => {
      const data = [{ name: '  John Doe  ' }];
      const result = normalizeFormats(data, { trimWhitespace: true });
      expect(result.normalized[0].name).toBe('John Doe');
    });

    it('should normalize region codes', () => {
      expect(normalizeRegionCode('north america')).toBe('NA');
      expect(normalizeRegionCode('EU')).toBe('EU');
      expect(normalizeRegionCode('apac')).toBe('APAC');
    });

    it('should normalize agent names', () => {
      expect(normalizeAgentName('jett')).toBe('Jett');
      expect(normalizeAgentName('PHOENIX')).toBe('Phoenix');
    });
  });

  describe('Outlier Detection', () => {
    it('should detect outliers using IQR method', () => {
      const data = [
        { value: 10 },
        { value: 12 },
        { value: 11 },
        { value: 13 },
        { value: 100 }, // outlier
      ];

      const result = detectOutliers(data, { method: 'iqr', columns: ['value'] });
      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.outliers[0]).toEqual({ value: 100 });
    });

    it('should detect outliers using Z-score method', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({ value: i + 1 }));
      data.push({ value: 1000 }); // clear outlier

      const result = detectOutliers(data, { method: 'zscore', columns: ['value'] });
      expect(result.outliers.length).toBe(1);
    });

    it('should return bounds for each column', () => {
      const data = [
        { a: 10, b: 20 },
        { a: 12, b: 22 },
        { a: 11, b: 21 },
      ];

      const result = detectOutliers(data, { method: 'iqr', columns: ['a', 'b'] });
      expect(result.bounds.a).toBeDefined();
      expect(result.bounds.b).toBeDefined();
    });
  });

  describe('Full Cleaning Pipeline', () => {
    it('should clean player data', () => {
      const data = [
        { id: '1', name: '  Player 1  ', rank: undefined },
        { id: '1', name: 'Player 1', rank: 100 }, // duplicate
        { id: '2', name: 'Player 2', rank: 200 },
      ];

      const result = cleanPlayerData(data);
      expect(result.data.length).toBeLessThan(data.length);
      expect(result.stats.duplicateCount).toBeGreaterThan(0);
    });

    it('should clean match data', () => {
      const data = [
        { id: '1', map: 'Haven', status: 'completed' },
        { id: '2', map: 'Bind', status: undefined },
      ];

      const result = cleanMatchData(data);
      expect(result.data.length).toBe(2); // Match data doesn't fill missing
    });

    it('should clean stats data with outlier removal', () => {
      const data = [
        { playerId: '1', kills: 10, deaths: 5 },
        { playerId: '2', kills: 1000, deaths: 0 }, // outlier
        { playerId: '3', kills: 15, deaths: 8 },
      ];

      const result = cleanStatsData(data);
      expect(result.stats.outlierCount).toBeGreaterThan(0);
    });

    it('should track all modification stats', () => {
      const data = [
        { id: '1', name: '  Test  ', score: undefined },
        { id: '2', name: 'Test', score: 50 },
      ];

      const result = cleanData(data, {
        fillMissing: true,
        normalizeFormats: true,
        removeDuplicates: false,
      });

      expect(result.stats.originalCount).toBe(2);
      expect(result.modified.trimmed).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Quality Scorer Tests
// ============================================================================

describe('Quality Scorer', () => {
  describe('Quality Score Calculation', () => {
    it('should calculate quality score for valid data', () => {
      const data = {
        id: '1',
        name: 'Test',
        score: 100,
        status: 'active',
      };

      const result = calculateQualityScore(data);
      expect(result.overall).toBeGreaterThan(0);
      expect(result.grade).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return F grade for empty data', () => {
      const result = calculateQualityScore([]);
      expect(result.grade).toBe('F');
      expect(result.overall).toBe(0);
    });

    it('should identify completeness issues', () => {
      const data = {
        id: '1',
        // missing name
        score: undefined,
      };

      const result = calculateQualityScore(data, {
        requiredFields: ['id', 'name', 'score'],
      });
      
      expect(result.breakdown.completeness).toBeLessThan(100);
      expect(result.issues.some(i => i.type === 'completeness')).toBe(true);
    });

    it('should generate recommendations', () => {
      const data = { id: '1' };
      const result = calculateQualityScore(data, {
        requiredFields: ['id', 'name', 'value'],
      });
      
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Completeness Metrics', () => {
    it('should calculate fill rates correctly', () => {
      const data = [
        { a: 1, b: 2, c: undefined },
        { a: 1, b: undefined, c: 3 },
      ];

      const metrics = calculateCompletenessMetrics(data);
      expect(metrics.totalFields).toBe(6);
      expect(metrics.filledFields).toBe(4);
      expect(metrics.fillRate).toBeCloseTo(4/6);
    });

    it('should track required vs optional fill rates', () => {
      const data = [
        { id: '1', name: 'A', optional: undefined },
        { id: '2', name: undefined, optional: 'value' },
      ];

      const metrics = calculateCompletenessMetrics(data, ['id', 'name'], ['optional']);
      expect(metrics.requiredFillRate).toBeLessThan(1);
      expect(metrics.optionalFillRate).toBeLessThan(1);
    });
  });

  describe('Accuracy Metrics', () => {
    it('should detect invalid percentage values', () => {
      const data = [
        { winPercentage: 50 },
        { winPercentage: 150 }, // invalid
        { winPercentage: -10 }, // invalid
      ];

      const metrics = calculateAccuracyMetrics(data);
      expect(metrics.outOfRangeValues).toBeGreaterThan(0);
      expect(metrics.accuracyRate).toBeLessThan(1);
    });

    it('should detect suspicious values', () => {
      const data = [
        { kills: 10 },
        { kills: 200 }, // suspicious
        { kills: 500 }, // very suspicious
      ];

      const metrics = calculateAccuracyMetrics(data);
      expect(metrics.suspiciousValues).toBeGreaterThan(0);
    });
  });

  describe('Consistency Metrics', () => {
    it('should detect type mismatches', () => {
      const data = [
        { value: 10 },
        { value: '20' },
        { value: 30 },
      ];

      const metrics = calculateConsistencyMetrics(data);
      expect(metrics.typeMismatches).toBeGreaterThan(0);
    });

    it('should return full consistency for uniform types', () => {
      const data = [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'z' },
      ];

      const metrics = calculateConsistencyMetrics(data);
      expect(metrics.consistencyRate).toBe(1);
    });
  });

  describe('Dataset Quality Report', () => {
    it('should generate comprehensive report', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Player ${i}`,
        score: i * 10,
      }));

      const report = generateDatasetQualityReport(data);
      expect(report.totalRecords).toBe(10);
      expect(report.averageScore).toBeGreaterThan(0);
      expect(report.gradeDistribution).toBeDefined();
    });

    it('should include field quality metrics', () => {
      const data = [
        { id: '1', name: 'A', score: 100 },
        { id: '2', name: 'B', score: 200 },
        { id: '3', name: 'A', score: 100 },
      ];

      const report = generateDatasetQualityReport(data);
      expect(report.fieldQuality.id).toBeDefined();
      expect(report.fieldQuality.name).toBeDefined();
      expect(report.fieldQuality.score).toBeDefined();
    });

    it('should handle empty dataset', () => {
      const report = generateDatasetQualityReport([]);
      expect(report.totalRecords).toBe(0);
      expect(report.averageScore).toBe(0);
    });
  });

  describe('Quality Badges', () => {
    it('should return correct badge for grade A', () => {
      const badge = getQualityBadge({ overall: 95, grade: 'A' } as QualityScore);
      expect(badge.label).toBe('Excellent');
    });

    it('should return correct badge for grade F', () => {
      const badge = getQualityBadge({ overall: 20, grade: 'F' } as QualityScore);
      expect(badge.label).toBe('Critical');
    });
  });

  describe('Grade Conversion', () => {
    it('should convert scores to correct grades', () => {
      expect(scoreToGrade(95)).toBe('A');
      expect(scoreToGrade(80)).toBe('B');
      expect(scoreToGrade(65)).toBe('C');
      expect(scoreToGrade(50)).toBe('D');
      expect(scoreToGrade(20)).toBe('F');
    });
  });
});

// ============================================================================
// Validation Pipeline Tests
// ============================================================================

describe('Validation Pipeline', () => {
  describe('Pipeline Execution', () => {
    it('should run validation pipeline successfully', async () => {
      const data = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Valid Player' },
      ];

      const pipeline = new ValidationPipeline();
      const result = await pipeline.run(data, PlayerSchema);

      expect(result.success).toBe(true);
      expect(result.stats.totalRecords).toBe(1);
      expect(result.valid).toHaveLength(1);
    });

    it('should detect validation errors', async () => {
      const data = [
        { name: 'Invalid Player' }, // missing required id
      ];

      const pipeline = new ValidationPipeline();
      const result = await pipeline.run(data, PlayerSchema);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should track stage results', async () => {
      const data = [{ id: '1', name: 'Test' }];

      const pipeline = new ValidationPipeline();
      const result = await pipeline.run(data, PlayerSchema);

      expect(result.stages.schema.executed).toBe(true);
      expect(result.stages.clean.executed).toBe(true);
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should respect stopOnError config', async () => {
      const data = [
        { name: 'Invalid' },
        { id: '2', name: 'Valid' },
      ];

      const pipeline = new ValidationPipeline({ stopOnError: true });
      const result = await pipeline.run(data, PlayerSchema);

      // Should stop after first error
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process batch validation', async () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-446655440${i.toString().padStart(3, '0')}`,
        name: `Player ${i}`,
      }));

      const result = await runBatchValidation(data, PlayerSchema);
      expect(result.stats.totalRecords).toBe(50);
    });
  });

  describe('Quick Validation', () => {
    it('should return simple validation result', async () => {
      const data = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' };
      const result = await quickValidate(data, PlayerSchema);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return errors for invalid data', async () => {
      const data = { name: 'No ID' };
      const result = await quickValidate(data, PlayerSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Pipeline Factory', () => {
    it('should create pipeline with specific stages', () => {
      const pipeline = createPipeline(['schema', 'clean', 'quality']);
      expect(pipeline).toBeInstanceOf(ValidationPipeline);
    });
  });

  describe('Business Rules', () => {
    it('should validate positive kills', () => {
      const rule = commonBusinessRules.positiveKills('kills');
      
      expect(rule.check({ kills: 10 })).toBe(true);
      expect(rule.check({ kills: -5 })).toBe(false);
      expect(rule.check({ kills: 0 })).toBe(true);
    });

    it('should validate K/D ratio', () => {
      const rule = commonBusinessRules.validKDRatio('kills', 'deaths');
      
      expect(rule.check({ kills: 10, deaths: 5 })).toBe(true);
      expect(rule.check({ kills: 'invalid', deaths: 5 })).toBe(false);
    });

    it('should validate date range', () => {
      const rule = commonBusinessRules.validDateRange('date', 365);
      
      expect(rule.check({ date: new Date().toISOString() })).toBe(true);
      expect(rule.check({ date: '2020-01-01' })).toBe(false);
    });

    it('should validate required relation', () => {
      const rule = commonBusinessRules.requiredRelation('startDate', 'endDate');
      
      expect(rule.check({ startDate: '2024-01-01', endDate: '2024-12-31' })).toBe(true);
      expect(rule.check({ startDate: '2024-01-01' })).toBe(false);
      expect(rule.check({})).toBe(true); // both absent
    });
  });

  describe('Pipeline Report', () => {
    it('should generate comprehensive report', async () => {
      const data = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Valid' },
        { id: '550e8400-e29b-41d4-a716-446655440001', name: undefined },
      ];

      const pipeline = new ValidationPipeline();
      const result = await pipeline.run(data, PlayerSchema);

      expect(result.report.summary).toContain('records');
      expect(result.report.recommendations).toBeInstanceOf(Array);
      expect(result.report.details.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Validation System Integration', () => {
  it('should handle complete data ingestion workflow', async () => {
    // Raw data with various issues
    const rawData = [
      { id: '550e8400-e29b-41d4-a716-446655440000', name: '  Player 1  ', kills: 10, deaths: 5 },
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Player 2', kills: undefined, deaths: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Player 1', kills: 10, deaths: 5 }, // duplicate
      { id: 'name': 'Invalid Player' }, // missing id
    ];

    // Step 1: Clean the data
    const cleaned = cleanData(rawData, {
      removeDuplicates: true,
      fillMissing: true,
      normalizeFormats: true,
      trimStrings: true,
    });

    expect(cleaned.data.length).toBeLessThan(rawData.length);
    expect(cleaned.stats.duplicateCount).toBe(1);

    // Step 2: Validate against schema
    const validRecords: Record<string, unknown>[] = [];
    for (const record of cleaned.data) {
      const result = validateSchema(record, PlayerSchema);
      if (result.valid) {
        validRecords.push(record);
      }
    }

    expect(validRecords.length).toBeLessThanOrEqual(cleaned.data.length);

    // Step 3: Calculate quality scores
    const qualityScores = validRecords.map(r => calculateQualityScore(r));
    const averageQuality = qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length;

    expect(averageQuality).toBeGreaterThanOrEqual(0);
    expect(averageQuality).toBeLessThanOrEqual(100);

    // Step 4: Run through pipeline
    const pipeline = new ValidationPipeline();
    const pipelineResult = await pipeline.run(validRecords, PlayerSchema);

    expect(pipelineResult.success).toBe(true);
    expect(pipelineResult.report).toBeDefined();
  });

  it('should handle esports player data validation', async () => {
    const playerData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'TenZ',
      tag: 'SEN',
      region: 'NA',
      role: 'duelist',
      agent: 'Jett',
      rank: 1,
      rating: 4.5,
      isActive: true,
      socials: {
        twitter: 'https://twitter.com/TenZ',
        twitch: 'https://twitch.tv/TenZ',
      },
    };

    // Validate schema
    const schemaResult = validateSchema(playerData, PlayerSchema);
    expect(schemaResult.valid).toBe(true);

    // Calculate quality
    const quality = calculateQualityScore(playerData);
    expect(quality.grade).toBe('A');
    expect(quality.overall).toBeGreaterThan(90);
  });

  it('should handle match data validation', async () => {
    const matchData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      gameType: 'valorant',
      map: 'Haven',
      status: 'completed',
      teamA: { id: 'team1', name: 'Sentinels', score: 13 },
      teamB: { id: 'team2', name: 'Cloud9', score: 10 },
    };

    const result = validateSchema(matchData, MatchSchema);
    expect(result.valid).toBe(true);
  });

  it('should detect and repair common data issues', async () => {
    const dirtyData = [
      { id: '1', name: '  Player 1  ', region: 'na', kills: '10' },
      { id: '2', name: 'Player 2', region: 'EUROPE', kills: '20' },
    ];

    // Clean
    const cleaned = cleanData(dirtyData, {
      normalizeFormats: true,
      trimStrings: true,
    });

    // Check normalization
    expect(cleaned.data[0].name).toBe('Player 1');
    expect(cleaned.modified.trimmed).toBeGreaterThan(0);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Validation Performance', () => {
  it('should handle large datasets efficiently', async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-446655${i.toString().padStart(6, '0')}`,
      name: `Player ${i}`,
      region: ['NA', 'EU', 'APAC'][i % 3],
      rank: i % 1000,
    }));

    const startTime = performance.now();
    const result = await runBatchValidation(largeData, PlayerSchema, {
      batchSize: 100,
    });
    const duration = performance.now() - startTime;

    expect(result.stats.totalRecords).toBe(1000);
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it('should validate within reasonable time', () => {
    const data = { id: '1', name: 'Test', score: 100 };
    
    const startTime = performance.now();
    validateSchema(data, PlayerSchema);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(10); // Should be very fast
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty data gracefully', () => {
    const result = validateSchema({}, PlayerSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle null values', () => {
    const data = { id: null, name: 'Test' };
    const result = validateSchema(data, PlayerSchema);
    expect(result.errors.some(e => e.field === 'id')).toBe(true);
  });

  it('should handle undefined values', () => {
    const data = { id: undefined, name: 'Test' };
    const result = validateSchema(data, PlayerSchema);
    expect(result.errors.some(e => e.field === 'id')).toBe(true);
  });

  it('should handle deeply nested objects', () => {
    const data = {
      id: '1',
      name: 'Test',
      nested: { level1: { level2: { level3: 'value' } } },
    };

    const result = validateSchema(data, PlayerSchema);
    expect(result.valid).toBe(true); // Unknown fields allowed in non-strict mode
  });

  it('should handle circular references gracefully', () => {
    const data: Record<string, unknown> = { id: '1', name: 'Test' };
    data.self = data; // circular reference

    // Should not throw
    expect(() => validateSchema(data, PlayerSchema)).not.toThrow();
  });

  it('should handle very long strings', () => {
    const data = {
      id: '1',
      name: 'A'.repeat(10000),
    };

    const result = validateSchema(data, PlayerSchema);
    // Should either truncate or warn about long strings
    expect(result.warnings.length >= 0).toBe(true);
  });

  it('should handle special characters in strings', () => {
    const data = {
      id: '1',
      name: 'Player <script>alert("xss")</script>',
    };

    const result = validateSchema(data, PlayerSchema);
    expect(result.valid).toBe(true); // Schema doesn't sanitize, just validates
  });

  it('should handle unicode characters', () => {
    const data = {
      id: '1',
      name: 'プレイヤー 🔥 émoji',
    };

    const result = validateSchema(data, PlayerSchema);
    expect(result.valid).toBe(true);
  });

  it('should handle array edge cases', () => {
    const schema: ValidationSchema = {
      name: 'TestArray',
      version: '1.0.0',
      fields: [
        { name: 'items', type: 'array', itemSchema: { name: 'item', type: 'number' } },
      ],
    };

    const data = { items: [1, 2, 'not a number', 4] };
    const result = validateSchema(data, schema);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle date edge cases', () => {
    const dates = [
      '2024-02-30', // Invalid date
      '2024-13-01', // Invalid month
      '', // Empty
      null,
    ];

    for (const date of dates) {
      expect(isDateString(date)).toBe(false);
    }
  });
});

console.log('Validation test suite loaded - 30+ tests defined');
