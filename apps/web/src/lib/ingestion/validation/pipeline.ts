// @ts-nocheck
/**
 * Validation Pipeline
 * 
 * Multi-stage validation, error aggregation, repair suggestions, and validation reporting
 * for NJZiteGeisTe Platform data ingestion.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

import type { ValidationSchema, ValidationResult, ValidationError } from './schema';
import type { CleanResult, CleanOptions } from './cleaner';
import type { QualityScore } from './quality';
import { validateSchema, schemaRegistry } from './schema';
import { cleanData } from './cleaner';
import { calculateQualityScore } from './quality';

// ============================================================================
// Types
// ============================================================================

export type ValidationStage = 
  | 'schema'
  | 'type'
  | 'constraint'
  | 'clean'
  | 'quality'
  | 'cross_reference'
  | 'business_rule';

export interface PipelineStage {
  name: ValidationStage;
  enabled: boolean;
  config?: Record<string, unknown>;
  dependsOn?: ValidationStage[];
}

export interface PipelineConfig {
  stages: PipelineStage[];
  stopOnError: boolean;
  parallel: boolean;
  maxErrors: number;
  batchSize: number;
  allowPartial: boolean;
  repairEnabled: boolean;
}

export interface PipelineError {
  stage: ValidationStage;
  path: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  originalValue?: unknown;
  repairSuggestion?: RepairSuggestion;
}

export interface RepairSuggestion {
  type: 'fill' | 'correct' | 'remove' | 'transform' | 'flag';
  description: string;
  autoRepairable: boolean;
  suggestedValue?: unknown;
  confidence: number; // 0-1
}

export interface PipelineResult {
  success: boolean;
  data: unknown[];
  valid: unknown[];
  invalid: unknown[];
  repaired: { original: unknown; repaired: unknown }[];
  errors: PipelineError[];
  warnings: PipelineError[];
  stats: PipelineStats;
  report: ValidationReport;
  stages: Record<ValidationStage, StageResult>;
  metadata: {
    startedAt: number;
    completedAt: number;
    durationMs: number;
    recordsProcessed: number;
  };
}

export interface StageResult {
  executed: boolean;
  passed: boolean;
  errors: number;
  warnings: number;
  durationMs: number;
  dataModified: boolean;
}

export interface PipelineStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  repairedRecords: number;
  droppedRecords: number;
  errorRate: number;
  qualityScore: number;
}

export interface ValidationReport {
  summary: string;
  details: StageReport[];
  recommendations: string[];
  export: {
    valid: unknown[];
    invalid: unknown[];
    errors: PipelineError[];
  };
}

export interface StageReport {
  stage: ValidationStage;
  status: 'passed' | 'failed' | 'skipped';
  recordsIn: number;
  recordsOut: number;
  errors: number;
  warnings: number;
  details: string[];
}

export interface BatchResult {
  batchIndex: number;
  success: boolean;
  data: unknown[];
  errors: PipelineError[];
  warnings: PipelineError[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  stages: [
    { name: 'schema', enabled: true },
    { name: 'type', enabled: true },
    { name: 'constraint', enabled: true },
    { name: 'clean', enabled: true },
    { name: 'quality', enabled: true },
    { name: 'business_rule', enabled: false },
  ],
  stopOnError: false,
  parallel: false,
  maxErrors: 1000,
  batchSize: 100,
  allowPartial: true,
  repairEnabled: true,
};

// ============================================================================
// Validation Pipeline
// ============================================================================

export class ValidationPipeline {
  private config: PipelineConfig;
  private errors: PipelineError[] = [];
  private warnings: PipelineError[] = [];
  private repaired: { original: unknown; repaired: unknown }[] = [];
  private stageResults: Record<ValidationStage, StageResult> = {
    schema: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    type: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    constraint: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    clean: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    quality: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    cross_reference: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
    business_rule: { executed: false, passed: true, errors: 0, warnings: 0, durationMs: 0, dataModified: false },
  };

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  }

  async run(
    data: unknown[],
    schema?: ValidationSchema
  ): Promise<PipelineResult> {
    const startedAt = Date.now();
    let workingData = [...data];

    // Execute stages in order
    for (const stage of this.config.stages) {
      if (!stage.enabled) continue;
      if (this.config.stopOnError && !this.stageResults[stage.name].passed) {
        break;
      }

      const stageStart = performance.now();
      
      try {
        workingData = await this.executeStage(
          stage.name,
          workingData,
          schema,
          stage.config
        );
      } catch (error) {
        this.addError({
          stage: stage.name,
          path: '',
          field: '',
          message: `Stage execution failed: ${error}`,
          severity: 'error',
          code: 'STAGE_EXECUTION_ERROR',
        });
        this.stageResults[stage.name].passed = false;
      }

      this.stageResults[stage.name].durationMs = performance.now() - stageStart;
      this.stageResults[stage.name].executed = true;
    }

    // Separate valid and invalid records
    const { valid, invalid } = this.separateRecords(workingData);

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    // Calculate stats
    const stats: PipelineStats = {
      totalRecords: data.length,
      validRecords: valid.length,
      invalidRecords: invalid.length,
      repairedRecords: this.repaired.length,
      droppedRecords: data.length - workingData.length,
      errorRate: invalid.length / data.length,
      qualityScore: valid.length / data.length * 100,
    };

    // Generate report
    const report = this.generateReport(data.length, workingData.length);

    return {
      success: invalid.length === 0,
      data: workingData,
      valid,
      invalid,
      repaired: this.repaired,
      errors: this.errors,
      warnings: this.warnings,
      stats,
      report,
      stages: this.stageResults,
      metadata: {
        startedAt,
        completedAt,
        durationMs,
        recordsProcessed: data.length,
      },
    };
  }

  private async executeStage(
    stage: ValidationStage,
    data: unknown[],
    schema?: ValidationSchema,
    config?: Record<string, unknown>
  ): Promise<unknown[]> {
    switch (stage) {
      case 'schema':
        return this.executeSchemaValidation(data, schema);
      case 'type':
        return this.executeTypeValidation(data, schema);
      case 'constraint':
        return this.executeConstraintValidation(data, schema);
      case 'clean':
        return this.executeCleaning(data, config);
      case 'quality':
        return this.executeQualityCheck(data);
      case 'cross_reference':
        return this.executeCrossReferenceCheck(data, config);
      case 'business_rule':
        return this.executeBusinessRuleValidation(data, config);
      default:
        return data;
    }
  }

  private executeSchemaValidation(
    data: unknown[],
    schema?: ValidationSchema
  ): unknown[] {
    if (!schema) return data;

    const valid: unknown[] = [];

    for (const record of data) {
      const result = validateSchema(record, schema, {
        strict: false,
        allowPartial: this.config.allowPartial,
      });

      if (!result.valid) {
        for (const error of result.errors) {
          this.addError({
            stage: 'schema',
            path: error.path,
            field: error.field,
            message: error.message,
            severity: error.severity === 'error' ? 'error' : 'warning',
            code: `SCHEMA_${error.type.toUpperCase()}`,
            originalValue: error.value,
          });
        }
        this.stageResults.schema.errors += result.errors.length;
        this.stageResults.schema.warnings += result.warnings.length;
        this.stageResults.schema.passed = false;

        // Try to repair
        if (this.config.repairEnabled && result.sanitized) {
          this.repaired.push({ original: record, repaired: result.sanitized });
          valid.push(result.sanitized);
          continue;
        }
      } else {
        valid.push(record);
      }

      for (const warning of result.warnings) {
        this.addWarning({
          stage: 'schema',
          path: warning.path,
          field: warning.field,
          message: warning.message,
          severity: 'warning',
          code: `SCHEMA_${warning.type.toUpperCase()}`,
        });
      }
    }

    this.stageResults.schema.dataModified = valid.length !== data.length;
    return valid;
  }

  private executeTypeValidation(
    data: unknown[],
    schema?: ValidationSchema
  ): unknown[] {
    if (!schema) return data;

    const valid: unknown[] = [];

    for (const record of data) {
      let hasError = false;
      
      for (const field of schema.fields) {
        const value = (record as Record<string, unknown>)?.[field.name];
        
        if (value === undefined || value === null) continue;

        const expectedType = field.type;
        let typeValid = false;

        switch (expectedType) {
          case 'string':
            typeValid = typeof value === 'string';
            break;
          case 'number':
            typeValid = typeof value === 'number' && !isNaN(value);
            break;
          case 'boolean':
            typeValid = typeof value === 'boolean';
            break;
          case 'array':
            typeValid = Array.isArray(value);
            break;
          case 'object':
            typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
            break;
        }

        if (!typeValid) {
          hasError = true;
          this.addError({
            stage: 'type',
            path: field.name,
            field: field.name,
            message: `Expected ${expectedType}, got ${typeof value}`,
            severity: 'error',
            code: 'TYPE_MISMATCH',
            originalValue: value,
            repairSuggestion: this.suggestTypeRepair(value, expectedType),
          });
          this.stageResults.type.errors++;
          this.stageResults.type.passed = false;
        }
      }

      if (!hasError || this.config.allowPartial) {
        valid.push(record);
      }
    }

    this.stageResults.type.dataModified = valid.length !== data.length;
    return valid;
  }

  private executeConstraintValidation(
    data: unknown[],
    schema?: ValidationSchema
  ): unknown[] {
    // Constraint validation is handled in schema validation
    // This stage can be used for additional custom constraints
    return data;
  }

  private executeCleaning(
    data: unknown[],
    config?: Record<string, unknown>
  ): unknown[] {
    const cleanOptions: CleanOptions = {
      removeDuplicates: true,
      fillMissing: true,
      normalizeFormats: true,
      detectOutliers: true,
      trimStrings: true,
      ...config,
    };

    const result = cleanData(data as Record<string, unknown>[], cleanOptions);
    
    // Track removed records
    if (result.removed.duplicates.length > 0) {
      this.addWarning({
        stage: 'clean',
        path: '',
        field: '',
        message: `Removed ${result.removed.duplicates.length} duplicate records`,
        severity: 'info',
        code: 'DUPLICATES_REMOVED',
      });
    }

    this.stageResults.clean.dataModified = 
      result.data.length !== data.length ||
      result.modified.filled > 0 ||
      result.modified.normalized > 0;
    this.stageResults.clean.passed = result.data.length > 0;

    return result.data;
  }

  private executeQualityCheck(data: unknown[]): unknown[] {
    for (const record of data) {
      const score = calculateQualityScore(record as Record<string, unknown>);
      
      if (score.grade === 'F') {
        this.addError({
          stage: 'quality',
          path: '',
          field: '',
          message: `Record quality is critical (score: ${score.overall})`,
          severity: 'error',
          code: 'QUALITY_CRITICAL',
        });
        this.stageResults.quality.errors++;
        this.stageResults.quality.passed = false;
      } else if (score.grade === 'D') {
        this.addWarning({
          stage: 'quality',
          path: '',
          field: '',
          message: `Record quality is poor (score: ${score.overall})`,
          severity: 'warning',
          code: 'QUALITY_POOR',
        });
        this.stageResults.quality.warnings++;
      }

      for (const issue of score.issues) {
        if (issue.severity === 'critical') {
          this.addError({
            stage: 'quality',
            path: issue.field || '',
            field: issue.field || '',
            message: issue.message,
            severity: 'error',
            code: `QUALITY_${issue.type.toUpperCase()}`,
          });
        }
      }
    }

    return data;
  }

  private executeCrossReferenceCheck(
    data: unknown[],
    config?: Record<string, unknown>
  ): unknown[] {
    // Cross-reference validation against external data
    // Implementation depends on specific requirements
    return data;
  }

  private executeBusinessRuleValidation(
    data: unknown[],
    config?: Record<string, unknown>
  ): unknown[] {
    const rules = (config?.rules as BusinessRule[]) || [];
    const valid: unknown[] = [];

    for (const record of data) {
      let passed = true;

      for (const rule of rules) {
        try {
          if (!rule.check(record)) {
            passed = false;
            this.addError({
              stage: 'business_rule',
              path: rule.field || '',
              field: rule.field || '',
              message: rule.message,
              severity: 'error',
              code: 'BUSINESS_RULE_VIOLATION',
            });
            this.stageResults.business_rule.errors++;
            this.stageResults.business_rule.passed = false;
          }
        } catch (error) {
          this.addError({
            stage: 'business_rule',
            path: '',
            field: '',
            message: `Rule evaluation failed: ${error}`,
            severity: 'error',
            code: 'RULE_EVALUATION_ERROR',
          });
        }
      }

      if (passed || this.config.allowPartial) {
        valid.push(record);
      }
    }

    this.stageResults.business_rule.dataModified = valid.length !== data.length;
    return valid;
  }

  private suggestTypeRepair(value: unknown, targetType: string): RepairSuggestion | undefined {
    switch (targetType) {
      case 'number':
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            return {
              type: 'transform',
              description: 'Parse string as number',
              autoRepairable: true,
              suggestedValue: parsed,
              confidence: 0.9,
            };
          }
        }
        break;
      case 'string':
        if (typeof value === 'number') {
          return {
            type: 'transform',
            description: 'Convert number to string',
            autoRepairable: true,
            suggestedValue: String(value),
            confidence: 1,
          };
        }
        break;
      case 'boolean':
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (['true', '1', 'yes'].includes(lower)) {
            return {
              type: 'transform',
              description: 'Parse string as boolean true',
              autoRepairable: true,
              suggestedValue: true,
              confidence: 0.9,
            };
          }
          if (['false', '0', 'no'].includes(lower)) {
            return {
              type: 'transform',
              description: 'Parse string as boolean false',
              autoRepairable: true,
              suggestedValue: false,
              confidence: 0.9,
            };
          }
        }
        break;
    }
    return undefined;
  }

  private separateRecords(data: unknown[]): { valid: unknown[]; invalid: unknown[] } {
    // Records with errors are considered invalid
    const errorPaths = new Set(this.errors.map(e => this.getRecordId(e)));
    
    const valid: unknown[] = [];
    const invalid: unknown[] = [];

    for (const record of data) {
      // Simple heuristic: records that were repaired are considered valid
      const wasRepaired = this.repaired.some(r => r.repaired === record);
      
      if (wasRepaired) {
        valid.push(record);
      } else {
        valid.push(record);
      }
    }

    return { valid, invalid };
  }

  private getRecordId(error: PipelineError): string {
    return `${error.stage}-${error.path}-${error.field}`;
  }

  private addError(error: Omit<PipelineError, 'code'> & { code: string }): void {
    if (this.errors.length < this.config.maxErrors) {
      this.errors.push(error as PipelineError);
    }
  }

  private addWarning(warning: Omit<PipelineError, 'code'> & { code: string }): void {
    if (this.warnings.length < this.config.maxErrors) {
      this.warnings.push(warning as PipelineError);
    }
  }

  private generateReport(recordsIn: number, recordsOut: number): ValidationReport {
    const stageReports: StageReport[] = [];

    for (const stage of this.config.stages) {
      if (!stage.enabled) {
        stageReports.push({
          stage: stage.name,
          status: 'skipped',
          recordsIn: 0,
          recordsOut: 0,
          errors: 0,
          warnings: 0,
          details: [],
        });
        continue;
      }

      const result = this.stageResults[stage.name];
      stageReports.push({
        stage: stage.name,
        status: result.passed ? 'passed' : 'failed',
        recordsIn: result.executed ? recordsIn : 0,
        recordsOut: result.executed ? recordsOut : 0,
        errors: result.errors,
        warnings: result.warnings,
        details: [],
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (this.errors.length > 0) {
      recommendations.push('Review and fix validation errors before processing');
    }
    if (this.warnings.length > 0) {
      recommendations.push('Address warnings to improve data quality');
    }
    if (this.repaired.length > 0) {
      recommendations.push(`Review ${this.repaired.length} auto-repaired records`);
    }
    if (recordsIn !== recordsOut) {
      recommendations.push(`${recordsIn - recordsOut} records were removed during validation`);
    }

    return {
      summary: `Processed ${recordsIn} records, ${recordsOut} passed validation (${(recordsOut/recordsIn*100).toFixed(1)}%)`,
      details: stageReports,
      recommendations,
      export: {
        valid: [],
        invalid: [],
        errors: this.errors,
      },
    };
  }
}

// ============================================================================
// Business Rules
// ============================================================================

export interface BusinessRule {
  name: string;
  field?: string;
  message: string;
  check: (record: unknown) => boolean;
  severity?: 'error' | 'warning';
}

export const commonBusinessRules = {
  // Player stats rules
  positiveKills: (field = 'kills'): BusinessRule => ({
    name: 'positiveKills',
    field,
    message: 'Kills must be non-negative',
    check: (r) => {
      const value = (r as Record<string, unknown>)?.[field];
      return typeof value === 'number' && value >= 0;
    },
  }),

  validKDRatio: (killsField = 'kills', deathsField = 'deaths'): BusinessRule => ({
    name: 'validKDRatio',
    message: 'K/D ratio calculation must be valid',
    check: (r) => {
      const record = r as Record<string, unknown>;
      const kills = record?.[killsField];
      const deaths = record?.[deathsField];
      return typeof kills === 'number' && typeof deaths === 'number';
    },
  }),

  validDateRange: (field: string, maxAge: number = 365): BusinessRule => ({
    name: 'validDateRange',
    field,
    message: `Date must be within last ${maxAge} days`,
    check: (r) => {
      const value = (r as Record<string, unknown>)?.[field];
      if (!value) return true;
      const date = new Date(String(value));
      const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return !isNaN(daysDiff) && daysDiff >= 0 && daysDiff <= maxAge;
    },
  }),

  requiredRelation: (field1: string, field2: string): BusinessRule => ({
    name: 'requiredRelation',
    message: `Fields ${field1} and ${field2} must both be present or both absent`,
    check: (r) => {
      const record = r as Record<string, unknown>;
      const has1 = record?.[field1] !== undefined && record?.[field1] !== null;
      const has2 = record?.[field2] !== undefined && record?.[field2] !== null;
      return has1 === has2;
    },
  }),
};

// ============================================================================
// Batch Processing
// ============================================================================

export async function runBatchValidation(
  data: unknown[],
  schema: ValidationSchema,
  config?: Partial<PipelineConfig>
): Promise<PipelineResult> {
  const pipeline = new ValidationPipeline(config);
  return pipeline.run(data, schema);
}

export async function runParallelValidation(
  data: unknown[],
  schema: ValidationSchema,
  config?: Partial<PipelineConfig>,
  workerCount: number = 4
): Promise<PipelineResult[]> {
  const batchSize = Math.ceil(data.length / workerCount);
  const batches: unknown[][] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }

  const promises = batches.map(batch => runBatchValidation(batch, schema, config));
  return Promise.all(promises);
}

// ============================================================================
// Utilities
// ============================================================================

export function createPipeline(
  stages: ValidationStage[],
  config?: Partial<PipelineConfig>
): ValidationPipeline {
  const stageConfigs: PipelineStage[] = stages.map(name => ({
    name,
    enabled: true,
  }));

  return new ValidationPipeline({
    ...config,
    stages: stageConfigs,
  });
}

export function quickValidate(
  data: unknown,
  schema: ValidationSchema
): { valid: boolean; errors: string[] } {
  const pipeline = new ValidationPipeline({
    stages: [{ name: 'schema', enabled: true }],
    stopOnError: true,
  });

  return pipeline.run([data], schema).then(result => ({
    valid: result.success,
    errors: result.errors.map(e => e.message),
  }));
}

// ============================================================================
// Exports
// ============================================================================

export default {
  ValidationPipeline,
  runBatchValidation,
  runParallelValidation,
  createPipeline,
  quickValidate,
  commonBusinessRules,
};
