// @ts-nocheck
/**
 * Data Validator - Live Match Data Validation System
 * 
 * Features:
 * - Schema validation for incoming live data
 * - Data quality scoring
 * - Field-level validation
 * - Custom validation rules
 * - Validation result tracking
 * 
 * [Ver001.000] - Data validation system
 */

import { logger } from '../../../utils/logger';
import type { 
  LiveEvent, 
  LiveEventType, 
  LiveEventData,
  KillEventData,
  RoundEventData,
  EconomyEventData,
  ScoreEventData,
  MatchEventData,
  AbilityEventData,
  DamageEventData,
  PlayerEventData,
} from '../types';

const validatorLogger = logger.child('DataValidator');

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  qualityScore: number; // 0-100
  normalizedData?: LiveEvent;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validate?: (value: unknown) => boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
}

export interface ValidationConfig {
  strictMode: boolean;
  allowPartialData: boolean;
  minQualityScore: number;
  maxErrorsBeforeReject: number;
  customRules?: ValidationRule[];
}

export interface BatchValidationResult {
  total: number;
  valid: number;
  invalid: number;
  results: ValidationResult[];
  aggregatedQualityScore: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: ValidationConfig = {
  strictMode: false,
  allowPartialData: true,
  minQualityScore: 50,
  maxErrorsBeforeReject: 5,
};

// =============================================================================
// Schema Definitions
// =============================================================================

const BASE_EVENT_RULES: ValidationRule[] = [
  { field: 'id', required: true, type: 'string' },
  { field: 'type', required: true, type: 'string' },
  { field: 'matchId', required: true, type: 'string' },
  { field: 'timestamp', required: true, type: 'string' },
  { field: 'data', required: true, type: 'object' },
  { field: 'source', required: true, type: 'string', enum: ['official', 'community', 'simulation'] },
  { field: 'confidence', required: true, type: 'number', min: 0, max: 1 },
];

const EVENT_TYPE_RULES: Record<LiveEventType, ValidationRule[]> = {
  match_start: [
    { field: 'data.matchId', required: true, type: 'string' },
    { field: 'data.status', required: true, type: 'string' },
    { field: 'data.map', required: false, type: 'string' },
    { field: 'data.currentRound', required: false, type: 'number', min: 0 },
  ],
  match_end: [
    { field: 'data.matchId', required: true, type: 'string' },
    { field: 'data.status', required: true, type: 'string' },
    { field: 'data.duration', required: false, type: 'number', min: 0 },
  ],
  round_start: [
    { field: 'data.roundNumber', required: true, type: 'number', min: 1 },
  ],
  round_end: [
    { field: 'data.roundNumber', required: true, type: 'number', min: 1 },
    { field: 'data.winningTeam', required: true, type: 'string' },
    { field: 'data.winCondition', required: true, type: 'string' },
    { field: 'data.teamAScore', required: true, type: 'number', min: 0 },
    { field: 'data.teamBScore', required: true, type: 'number', min: 0 },
    { field: 'data.duration', required: false, type: 'number', min: 0 },
  ],
  kill: [
    { field: 'data.attackerId', required: true, type: 'string' },
    { field: 'data.attackerTeam', required: true, type: 'string' },
    { field: 'data.victimId', required: true, type: 'string' },
    { field: 'data.victimTeam', required: true, type: 'string' },
    { field: 'data.headshot', required: true, type: 'boolean' },
    { field: 'data.wallbang', required: true, type: 'boolean' },
    { field: 'data.throughSmoke', required: true, type: 'boolean' },
    { field: 'data.weapon', required: false, type: 'string' },
    { field: 'data.assists', required: false, type: 'array' },
  ],
  death: [
    { field: 'data.victimId', required: true, type: 'string' },
    { field: 'data.victimTeam', required: true, type: 'string' },
  ],
  assist: [
    { field: 'data.assisterId', required: true, type: 'string' },
    { field: 'data.victimId', required: true, type: 'string' },
  ],
  spike_plant: [
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.teamId', required: true, type: 'string' },
    { field: 'data.position', required: false, type: 'object' },
  ],
  spike_defuse: [
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.teamId', required: true, type: 'string' },
  ],
  spike_explode: [
    { field: 'data.winningTeam', required: true, type: 'string' },
  ],
  economy_update: [
    { field: 'data.teamId', required: true, type: 'string' },
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.credits', required: true, type: 'number', min: 0, max: 9000 },
    { field: 'data.spent', required: true, type: 'number', min: 0 },
    { field: 'data.loadoutValue', required: true, type: 'number', min: 0 },
  ],
  ability_use: [
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.agent', required: true, type: 'string' },
    { field: 'data.ability', required: true, type: 'string' },
  ],
  damage_dealt: [
    { field: 'data.attackerId', required: true, type: 'string' },
    { field: 'data.victimId', required: true, type: 'string' },
    { field: 'data.damage', required: true, type: 'number', min: 0, max: 200 },
    { field: 'data.remainingHealth', required: true, type: 'number', min: 0, max: 200 },
    { field: 'data.hitLocation', required: true, type: 'string', enum: ['head', 'body', 'leg'] },
  ],
  score_update: [
    { field: 'data.teamAId', required: true, type: 'string' },
    { field: 'data.teamBId', required: true, type: 'string' },
    { field: 'data.teamAScore', required: true, type: 'number', min: 0 },
    { field: 'data.teamBScore', required: true, type: 'number', min: 0 },
  ],
  player_connect: [
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.teamId', required: true, type: 'string' },
    { field: 'data.action', required: true, type: 'string' },
  ],
  player_disconnect: [
    { field: 'data.playerId', required: true, type: 'string' },
    { field: 'data.teamId', required: true, type: 'string' },
    { field: 'data.action', required: true, type: 'string' },
    { field: 'data.reason', required: false, type: 'string' },
  ],
  timeout_called: [
    { field: 'data.teamId', required: true, type: 'string' },
  ],
  timeout_end: [],
  pause: [],
  resume: [],
  team_switch: [
    { field: 'data.teamAId', required: true, type: 'string' },
    { field: 'data.teamBId', required: true, type: 'string' },
  ],
  overtime: [
    { field: 'data.overtimeNumber', required: false, type: 'number', min: 1 },
  ],
  technical_issue: [
    { field: 'data.reason', required: false, type: 'string' },
  ],
};

// =============================================================================
// Data Validator Class
// =============================================================================

export class DataValidator {
  private config: ValidationConfig;
  private validationStats: {
    totalValidated: number;
    validCount: number;
    invalidCount: number;
    averageQualityScore: number;
  } = {
    totalValidated: 0,
    validCount: 0,
    invalidCount: 0,
    averageQualityScore: 0,
  };

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    validatorLogger.info('DataValidator initialized', { config: this.config });
  }

  /**
   * Validate a single live event
   */
  validate(event: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if event is an object
    if (!event || typeof event !== 'object') {
      return {
        valid: false,
        errors: [{
          field: 'root',
          code: 'INVALID_TYPE',
          message: 'Event must be an object',
          severity: 'critical',
        }],
        warnings: [],
        qualityScore: 0,
      };
    }

    const eventObj = event as Record<string, unknown>;

    // Validate base event structure
    this.validateBaseStructure(eventObj, errors, warnings);

    // Validate event type specific fields
    const eventType = eventObj.type as LiveEventType;
    if (eventType && EVENT_TYPE_RULES[eventType]) {
      this.validateEventType(eventObj, eventType, errors, warnings);
    }

    // Apply custom rules
    if (this.config.customRules) {
      this.applyCustomRules(eventObj, this.config.customRules, errors, warnings);
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(errors, warnings);

    // Determine validity
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const isValid = criticalErrors.length === 0 && 
      errors.length <= this.config.maxErrorsBeforeReject &&
      (this.config.allowPartialData || errors.length === 0);

    // Update stats
    this.updateStats(isValid, qualityScore);

    // Normalize data if valid
    let normalizedData: LiveEvent | undefined;
    if (isValid) {
      normalizedData = this.normalizeEvent(eventObj as Partial<LiveEvent>);
    }

    const result: ValidationResult = {
      valid: isValid,
      errors,
      warnings,
      qualityScore,
      normalizedData,
    };

    if (!isValid) {
      validatorLogger.warn('Event validation failed', { 
        eventType, 
        errorCount: errors.length,
        qualityScore 
      });
    }

    return result;
  }

  /**
   * Validate multiple events in batch
   */
  validateBatch(events: unknown[]): BatchValidationResult {
    const results = events.map(event => this.validate(event));
    
    const valid = results.filter(r => r.valid);
    const totalQuality = results.reduce((sum, r) => sum + r.qualityScore, 0);

    return {
      total: events.length,
      valid: valid.length,
      invalid: results.length - valid.length,
      results,
      aggregatedQualityScore: results.length > 0 ? totalQuality / results.length : 0,
    };
  }

  /**
   * Quick validation check
   */
  isValid(event: unknown): boolean {
    return this.validate(event).valid;
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return { ...this.validationStats };
  }

  /**
   * Reset validation statistics
   */
  resetStats(): void {
    this.validationStats = {
      totalValidated: 0,
      validCount: 0,
      invalidCount: 0,
      averageQualityScore: 0,
    };
    validatorLogger.info('Validation statistics reset');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    validatorLogger.info('Validation configuration updated', { config: this.config });
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private validateBaseStructure(
    event: Record<string, unknown>,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const rule of BASE_EVENT_RULES) {
      const value = this.getFieldValue(event, rule.field);
      
      if (value === undefined) {
        if (rule.required) {
          errors.push({
            field: rule.field,
            code: 'REQUIRED_FIELD_MISSING',
            message: `Required field '${rule.field}' is missing`,
            severity: 'critical',
          });
        }
        continue;
      }

      // Type check
      if (!this.checkType(value, rule.type)) {
        errors.push({
          field: rule.field,
          code: 'INVALID_TYPE',
          message: `Field '${rule.field}' should be of type ${rule.type}`,
          severity: 'error',
        });
        continue;
      }

      // Range check for numbers
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            code: 'VALUE_TOO_LOW',
            message: `Field '${rule.field}' value ${value} is below minimum ${rule.min}`,
            severity: 'error',
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            code: 'VALUE_TOO_HIGH',
            message: `Field '${rule.field}' value ${value} exceeds maximum ${rule.max}`,
            severity: 'error',
          });
        }
      }

      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          code: 'INVALID_ENUM_VALUE',
          message: `Field '${rule.field}' value '${value}' is not in allowed values: ${rule.enum.join(', ')}`,
          severity: 'error',
        });
      }

      // Pattern check for strings
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          code: 'PATTERN_MISMATCH',
          message: `Field '${rule.field}' does not match required pattern`,
          severity: 'error',
        });
      }

      // Custom validation
      if (rule.validate && !rule.validate(value)) {
        errors.push({
          field: rule.field,
          code: 'CUSTOM_VALIDATION_FAILED',
          message: `Field '${rule.field}' failed custom validation`,
          severity: 'error',
        });
      }
    }
  }

  private validateEventType(
    event: Record<string, unknown>,
    eventType: LiveEventType,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const rules = EVENT_TYPE_RULES[eventType];
    if (!rules) return;

    for (const rule of rules) {
      const value = this.getFieldValue(event, rule.field);
      
      if (value === undefined) {
        if (rule.required) {
          errors.push({
            field: rule.field,
            code: 'REQUIRED_FIELD_MISSING',
            message: `Required field '${rule.field}' for event type '${eventType}' is missing`,
            severity: 'error',
          });
        }
        continue;
      }

      if (!this.checkType(value, rule.type)) {
        errors.push({
          field: rule.field,
          code: 'INVALID_TYPE',
          message: `Field '${rule.field}' should be of type ${rule.type}`,
          severity: 'error',
        });
      }

      // Range check
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            code: 'VALUE_TOO_LOW',
            message: `Field '${rule.field}' value ${value} is below minimum ${rule.min}`,
            severity: 'error',
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            code: 'VALUE_TOO_HIGH',
            message: `Field '${rule.field}' value ${value} exceeds maximum ${rule.max}`,
            severity: 'error',
          });
        }
      }

      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          code: 'INVALID_ENUM_VALUE',
          message: `Field '${rule.field}' value '${value}' is not in allowed values`,
          severity: 'error',
        });
      }
    }
  }

  private applyCustomRules(
    event: Record<string, unknown>,
    rules: ValidationRule[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const rule of rules) {
      const value = this.getFieldValue(event, rule.field);
      
      if (value === undefined) {
        if (rule.required) {
          errors.push({
            field: rule.field,
            code: 'CUSTOM_RULE_VIOLATION',
            message: `Custom rule: Required field '${rule.field}' is missing`,
            severity: 'error',
          });
        }
        continue;
      }

      if (rule.validate && !rule.validate(value)) {
        errors.push({
          field: rule.field,
          code: 'CUSTOM_VALIDATION_FAILED',
          message: `Custom validation failed for field '${rule.field}'`,
          severity: 'error',
        });
      }
    }
  }

  private getFieldValue(obj: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let current: unknown = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    
    return current;
  }

  private checkType(value: unknown, expectedType: string): boolean {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    return actualType === expectedType;
  }

  private calculateQualityScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const regularErrors = errors.filter(e => e.severity === 'error').length;
    
    // Start with 100 and deduct
    let score = 100;
    score -= criticalErrors * 30; // Critical errors are severe
    score -= regularErrors * 10;  // Regular errors
    score -= warnings.length * 2;  // Warnings are minor
    
    return Math.max(0, Math.min(100, score));
  }

  private normalizeEvent(event: Partial<LiveEvent>): LiveEvent {
    return {
      id: event.id || this.generateId(),
      type: event.type || 'technical_issue',
      matchId: event.matchId || 'unknown',
      timestamp: event.timestamp || new Date().toISOString(),
      round: event.round,
      data: event.data || {},
      source: event.source || 'community',
      confidence: Math.max(0, Math.min(1, event.confidence || 0.5)),
    } as LiveEvent;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateStats(isValid: boolean, qualityScore: number): void {
    this.validationStats.totalValidated++;
    
    if (isValid) {
      this.validationStats.validCount++;
    } else {
      this.validationStats.invalidCount++;
    }

    // Update running average
    const n = this.validationStats.totalValidated;
    this.validationStats.averageQualityScore = 
      ((this.validationStats.averageQualityScore * (n - 1)) + qualityScore) / n;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a validator instance
 */
export function createValidator(config?: Partial<ValidationConfig>): DataValidator {
  return new DataValidator(config);
}

/**
 * Quick validate function
 */
export function validateEvent(event: unknown): ValidationResult {
  const validator = new DataValidator();
  return validator.validate(event);
}

/**
 * Validate batch of events
 */
export function validateEvents(events: unknown[]): BatchValidationResult {
  const validator = new DataValidator();
  return validator.validateBatch(events);
}

/**
 * Create validation rules from schema
 */
export function createValidationRules(schema: Record<string, unknown>): ValidationRule[] {
  const rules: ValidationRule[] = [];
  
  for (const [field, config] of Object.entries(schema)) {
    if (typeof config === 'object' && config !== null) {
      const cfg = config as { type?: string; required?: boolean };
      rules.push({
        field,
        required: cfg.required ?? true,
        type: (cfg.type as ValidationRule['type']) || 'string',
      });
    }
  }
  
  return rules;
}

// =============================================================================
// Singleton Instance
// =============================================================================

let defaultValidator: DataValidator | null = null;

/**
 * Get default validator instance
 */
export function getDefaultValidator(): DataValidator {
  if (!defaultValidator) {
    defaultValidator = new DataValidator();
  }
  return defaultValidator;
}

/**
 * Reset default validator
 */
export function resetDefaultValidator(): void {
  defaultValidator = null;
}

// =============================================================================
// Default Export
// =============================================================================

export default DataValidator;
