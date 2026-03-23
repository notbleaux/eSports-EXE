/**
 * Schema Validator
 * 
 * JSON Schema validation, type checking, required field validation, and custom validators
 * for Libre-X-eSport 4NJZ4 TENET Platform data ingestion.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

// ============================================================================
// Schema Types
// ============================================================================

export type SchemaType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'null' 
  | 'date' 
  | 'enum' 
  | 'union'
  | 'any';

export interface SchemaField {
  name: string;
  type: SchemaType;
  required?: boolean;
  nullable?: boolean;
  default?: unknown;
  description?: string;
  
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  format?: 'email' | 'url' | 'uuid' | 'date' | 'datetime' | 'time' | 'json';
  
  // Number constraints
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  
  // Array constraints
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  itemSchema?: SchemaField;
  
  // Object constraints
  properties?: SchemaField[];
  additionalProperties?: boolean | SchemaField;
  
  // Enum
  enumValues?: (string | number | boolean)[];
  
  // Union
  unionTypes?: SchemaType[];
  
  // Custom validation
  validators?: CustomValidator[];
  
  // Cross-field validation
  dependsOn?: string[];
  conditional?: ConditionalRule[];
}

export interface ConditionalRule {
  when: { field: string; operator: 'eq' | 'neq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte'; value: unknown };
  then: Partial<SchemaField>;
}

export type CustomValidator = (value: unknown, path: string, data: unknown) => ValidationError | null;

export interface ValidationSchema {
  name: string;
  version: string;
  description?: string;
  fields: SchemaField[];
  strict?: boolean; // Reject unknown fields
}

export interface ValidationError {
  path: string;
  field: string;
  type: SchemaType | 'custom' | 'required' | 'type' | 'constraint' | 'format';
  message: string;
  value?: unknown;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data?: unknown;
  sanitized?: unknown;
  metadata: {
    schemaName: string;
    schemaVersion: string;
    validatedAt: number;
    processingTimeMs: number;
  };
}

export interface TypeGuard<T> {
  (value: unknown): value is T;
}

// ============================================================================
// Predefined Schemas
// ============================================================================

export const PlayerSchema: ValidationSchema = {
  name: 'Player',
  version: '1.0.0',
  description: 'Esports player data schema',
  strict: true,
  fields: [
    { name: 'id', type: 'string', required: true, format: 'uuid', description: 'Unique player identifier' },
    { name: 'name', type: 'string', required: true, minLength: 1, maxLength: 100, description: 'Player display name' },
    { name: 'tag', type: 'string', required: false, maxLength: 10, pattern: /^[A-Z0-9]+$/, description: 'Team/Clan tag' },
    { name: 'teamId', type: 'string', required: false, format: 'uuid', description: 'Team identifier' },
    { name: 'region', type: 'string', required: false, enumValues: ['NA', 'EU', 'APAC', 'BR', 'KR', 'CN', 'LATAM', 'JP'] },
    { name: 'role', type: 'string', required: false, enumValues: ['duelist', 'initiator', 'controller', 'sentinel', 'flex', ''] },
    { name: 'agent', type: 'string', required: false, maxLength: 50, description: 'Primary agent played' },
    { name: 'rank', type: 'number', required: false, min: 1, max: 1000, integer: true },
    { name: 'rating', type: 'number', required: false, min: 0, max: 5 },
    { name: 'isActive', type: 'boolean', required: false, default: true },
    { name: 'joinedAt', type: 'date', required: false },
    { name: 'socials', type: 'object', required: false, properties: [
      { name: 'twitter', type: 'string', format: 'url' },
      { name: 'twitch', type: 'string', format: 'url' },
      { name: 'youtube', type: 'string', format: 'url' },
    ]},
  ],
};

export const TeamSchema: ValidationSchema = {
  name: 'Team',
  version: '1.0.0',
  description: 'Esports team data schema',
  strict: true,
  fields: [
    { name: 'id', type: 'string', required: true, format: 'uuid' },
    { name: 'name', type: 'string', required: true, minLength: 1, maxLength: 100 },
    { name: 'tag', type: 'string', required: true, minLength: 2, maxLength: 10, pattern: /^[A-Z0-9]+$/ },
    { name: 'region', type: 'string', required: true, enumValues: ['NA', 'EU', 'APAC', 'BR', 'KR', 'CN', 'LATAM', 'JP'] },
    { name: 'logo', type: 'string', required: false, format: 'url' },
    { name: 'foundedAt', type: 'date', required: false },
    { name: 'socials', type: 'object', required: false, properties: [
      { name: 'twitter', type: 'string', format: 'url' },
      { name: 'website', type: 'string', format: 'url' },
    ]},
    { name: 'players', type: 'array', required: true, minItems: 1, maxItems: 10, itemSchema: { name: 'player', type: 'object' } },
    { name: 'stats', type: 'object', required: false, properties: [
      { name: 'wins', type: 'number', min: 0, integer: true },
      { name: 'losses', type: 'number', min: 0, integer: true },
      { name: 'winRate', type: 'number', min: 0, max: 1 },
    ]},
  ],
};

export const MatchSchema: ValidationSchema = {
  name: 'Match',
  version: '1.0.0',
  description: 'Esports match data schema',
  strict: true,
  fields: [
    { name: 'id', type: 'string', required: true, format: 'uuid' },
    { name: 'gameType', type: 'string', required: true, enumValues: ['valorant', 'cs2'] },
    { name: 'map', type: 'string', required: true, minLength: 1 },
    { name: 'status', type: 'string', required: true, enumValues: ['upcoming', 'live', 'completed', 'cancelled', 'postponed'] },
    { name: 'scheduledAt', type: 'date', required: false },
    { name: 'startedAt', type: 'date', required: false },
    { name: 'endedAt', type: 'date', required: false },
    { name: 'teamA', type: 'object', required: true, properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'score', type: 'number', required: true, min: 0, integer: true },
    ]},
    { name: 'teamB', type: 'object', required: true, properties: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'score', type: 'number', required: true, min: 0, integer: true },
    ]},
    { name: 'rounds', type: 'array', required: false, itemSchema: { name: 'round', type: 'object' } },
    { name: 'tournament', type: 'object', required: false, properties: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'stage', type: 'string' },
    ]},
    { name: 'vodUrl', type: 'string', required: false, format: 'url' },
  ],
};

export const PlayerStatsSchema: ValidationSchema = {
  name: 'PlayerStats',
  version: '1.0.0',
  description: 'Player performance statistics schema',
  strict: true,
  fields: [
    { name: 'playerId', type: 'string', required: true, format: 'uuid' },
    { name: 'matchId', type: 'string', required: true, format: 'uuid' },
    { name: 'kills', type: 'number', required: true, min: 0, integer: true },
    { name: 'deaths', type: 'number', required: true, min: 0, integer: true },
    { name: 'assists', type: 'number', required: true, min: 0, integer: true },
    { name: 'acs', type: 'number', required: false, min: 0 },
    { name: 'adr', type: 'number', required: false, min: 0 },
    { name: 'kast', type: 'number', required: false, min: 0, max: 100 },
    { name: 'headshotPercentage', type: 'number', required: false, min: 0, max: 100 },
    { name: 'firstKills', type: 'number', required: false, min: 0, integer: true },
    { name: 'firstDeaths', type: 'number', required: false, min: 0, integer: true },
    { name: 'plants', type: 'number', required: false, min: 0, integer: true },
    { name: 'defuses', type: 'number', required: false, min: 0, integer: true },
    { name: 'clutches', type: 'object', required: false, properties: [
      { name: '1v1', type: 'number', min: 0, integer: true },
      { name: '1v2', type: 'number', min: 0, integer: true },
      { name: '1v3', type: 'number', min: 0, integer: true },
      { name: '1v4', type: 'number', min: 0, integer: true },
      { name: '1v5', type: 'number', min: 0, integer: true },
    ]},
    { name: 'economy', type: 'object', required: false, properties: [
      { name: 'spent', type: 'number', min: 0, integer: true },
      { name: 'saved', type: 'number', min: 0, integer: true },
      { name: 'loadoutValue', type: 'number', min: 0, integer: true },
    ]},
  ],
};

// ============================================================================
// Type Guards
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isDateString(value: unknown): boolean {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ============================================================================
// Format Validators
// ============================================================================

const FORMAT_VALIDATORS: Record<string, (value: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url: (v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
  date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime()),
  datetime: (v) => !isNaN(new Date(v).getTime()),
  time: (v) => /^\d{2}:\d{2}(:\d{2})?$/.test(v),
  json: (v) => {
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// Schema Validation
// ============================================================================

export function validateSchema(
  data: unknown,
  schema: ValidationSchema,
  options: {
    strict?: boolean;
    allowPartial?: boolean;
    sanitize?: boolean;
  } = {}
): ValidationResult {
  const startTime = performance.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const sanitized: Record<string, unknown> = {};
  
  if (!isObject(data) && !isArray(data)) {
    return {
      valid: false,
      errors: [{
        path: '',
        field: 'root',
        type: 'type',
        message: `Expected object or array, got ${typeof data}`,
        value: data,
        severity: 'error',
      }],
      warnings: [],
      metadata: {
        schemaName: schema.name,
        schemaVersion: schema.version,
        validatedAt: Date.now(),
        processingTimeMs: performance.now() - startTime,
      },
    };
  }

  const dataObj = data as Record<string, unknown>;
  const strictMode = options.strict ?? schema.strict ?? false;

  // Check for unknown fields in strict mode
  if (strictMode && isObject(data)) {
    const knownFields = new Set(schema.fields.map(f => f.name));
    for (const key of Object.keys(dataObj)) {
      if (!knownFields.has(key)) {
        errors.push({
          path: key,
          field: key,
          type: 'constraint',
          message: `Unknown field '${key}' not allowed in strict mode`,
          value: dataObj[key],
          severity: 'error',
        });
      }
    }
  }

  // Validate each field
  for (const field of schema.fields) {
    const value = dataObj[field.name];
    const isPresent = field.name in dataObj;
    
    // Check required fields
    if (field.required && !isPresent && value === undefined) {
      if (!options.allowPartial) {
        errors.push({
          path: field.name,
          field: field.name,
          type: 'required',
          message: `Required field '${field.name}' is missing`,
          severity: 'error',
        });
        continue;
      }
    }

    // Skip validation if field is not present and not required
    if (!isPresent || value === undefined) {
      if (field.default !== undefined) {
        sanitized[field.name] = field.default;
      }
      continue;
    }

    // Check nullability
    if (value === null && !field.nullable) {
      errors.push({
        path: field.name,
        field: field.name,
        type: 'type',
        message: `Field '${field.name}' cannot be null`,
        value,
        severity: 'error',
      });
      continue;
    }

    // Validate field value
    const fieldResult = validateField(value, field, field.name, dataObj);
    errors.push(...fieldResult.errors);
    warnings.push(...fieldResult.warnings);

    if (fieldResult.sanitized !== undefined) {
      sanitized[field.name] = fieldResult.sanitized;
    } else if (!fieldResult.errors.length) {
      sanitized[field.name] = value;
    }
  }

  const processingTime = performance.now() - startTime;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: options.sanitize ? sanitized : data,
    sanitized: options.sanitize ? sanitized : undefined,
    metadata: {
      schemaName: schema.name,
      schemaVersion: schema.version,
      validatedAt: Date.now(),
      processingTimeMs: processingTime,
    },
  };
}

function validateField(
  value: unknown,
  field: SchemaField,
  path: string,
  rootData: unknown
): { errors: ValidationError[]; warnings: ValidationError[]; sanitized?: unknown } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Type validation
  const typeResult = validateType(value, field, path);
  if (!typeResult.valid) {
    errors.push(typeResult.error!);
    return { errors, warnings };
  }

  // Format validation for strings
  if (field.type === 'string' && field.format && isString(value)) {
    const validator = FORMAT_VALIDATORS[field.format];
    if (validator && !validator(value)) {
      errors.push({
        path,
        field: field.name,
        type: 'format',
        message: `Invalid ${field.format} format for '${field.name}'`,
        value,
        severity: 'error',
      });
    }
  }

  // String constraints
  if (field.type === 'string' && isString(value)) {
    if (field.minLength !== undefined && value.length < field.minLength) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must be at least ${field.minLength} characters`,
        value,
        severity: 'error',
      });
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      warnings.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' exceeds ${field.maxLength} characters, will be truncated`,
        value,
        severity: 'warning',
      });
    }
    if (field.pattern && !field.pattern.test(value)) {
      errors.push({
        path,
        field: field.name,
        type: 'format',
        message: `'${field.name}' does not match required pattern`,
        value,
        severity: 'error',
      });
    }
  }

  // Number constraints
  if (field.type === 'number' && isNumber(value)) {
    if (field.integer && !Number.isInteger(value)) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must be an integer`,
        value,
        severity: 'error',
      });
    }
    if (field.positive !== undefined) {
      if (field.positive && value <= 0) {
        errors.push({
          path,
          field: field.name,
          type: 'constraint',
          message: `'${field.name}' must be positive`,
          value,
          severity: 'error',
        });
      }
    }
    if (field.min !== undefined && value < field.min) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must be at least ${field.min}`,
        value,
        severity: 'error',
      });
    }
    if (field.max !== undefined && value > field.max) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must be at most ${field.max}`,
        value,
        severity: 'error',
      });
    }
  }

  // Array constraints
  if (field.type === 'array' && isArray(value)) {
    if (field.minItems !== undefined && value.length < field.minItems) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must have at least ${field.minItems} items`,
        value,
        severity: 'error',
      });
    }
    if (field.maxItems !== undefined && value.length > field.maxItems) {
      errors.push({
        path,
        field: field.name,
        type: 'constraint',
        message: `'${field.name}' must have at most ${field.maxItems} items`,
        value,
        severity: 'error',
      });
    }
    if (field.uniqueItems) {
      const seen = new Set();
      const duplicates: unknown[] = [];
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
          duplicates.push(item);
        }
        seen.add(key);
      }
      if (duplicates.length > 0) {
        errors.push({
          path,
          field: field.name,
          type: 'constraint',
          message: `'${field.name}' contains duplicate items`,
          value: duplicates,
          severity: 'error',
        });
      }
    }
    // Validate array items if schema provided
    if (field.itemSchema) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = validateField(value[i], field.itemSchema, `${path}[${i}]`, rootData);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      }
    }
  }

  // Object constraints
  if (field.type === 'object' && isObject(value) && field.properties) {
    const nestedSchema: ValidationSchema = {
      name: `${field.name}Object`,
      version: '1.0.0',
      fields: field.properties,
      strict: field.additionalProperties === false,
    };
    const nestedResult = validateSchema(value, nestedSchema);
    errors.push(...nestedResult.errors.map(e => ({ ...e, path: `${path}.${e.path}` })));
    warnings.push(...nestedResult.warnings.map(w => ({ ...w, path: `${path}.${w.path}` })));
  }

  // Enum validation
  if (field.type === 'enum' && field.enumValues && !field.enumValues.includes(value as string | number | boolean)) {
    errors.push({
      path,
      field: field.name,
      type: 'constraint',
      message: `'${field.name}' must be one of: ${field.enumValues.join(', ')}`,
      value,
      severity: 'error',
    });
  }

  // Custom validators
  if (field.validators) {
    for (const validator of field.validators) {
      const error = validator(value, path, rootData);
      if (error) {
        errors.push(error);
      }
    }
  }

  // Cross-field conditional validation
  if (field.conditional && isObject(rootData)) {
    for (const rule of field.conditional) {
      const dependentValue = (rootData as Record<string, unknown>)[rule.when.field];
      let conditionMet = false;
      
      switch (rule.when.operator) {
        case 'eq':
          conditionMet = dependentValue === rule.when.value;
          break;
        case 'neq':
          conditionMet = dependentValue !== rule.when.value;
          break;
        case 'in':
          conditionMet = Array.isArray(rule.when.value) && rule.when.value.includes(dependentValue);
          break;
        case 'gt':
          conditionMet = typeof dependentValue === 'number' && dependentValue > (rule.when.value as number);
          break;
        case 'lt':
          conditionMet = typeof dependentValue === 'number' && dependentValue < (rule.when.value as number);
          break;
        case 'gte':
          conditionMet = typeof dependentValue === 'number' && dependentValue >= (rule.when.value as number);
          break;
        case 'lte':
          conditionMet = typeof dependentValue === 'number' && dependentValue <= (rule.when.value as number);
          break;
      }

      if (conditionMet && rule.then.required && (value === undefined || value === null)) {
        errors.push({
          path,
          field: field.name,
          type: 'required',
          message: `'${field.name}' is required when ${rule.when.field} ${rule.when.operator} ${rule.when.value}`,
          severity: 'error',
        });
      }
    }
  }

  return { errors, warnings };
}

function validateType(
  value: unknown,
  field: SchemaField,
  path: string
): { valid: boolean; error?: ValidationError } {
  if (value === null && field.nullable) {
    return { valid: true };
  }

  const expectedType = field.type;
  let valid = false;

  switch (expectedType) {
    case 'string':
      valid = isString(value);
      break;
    case 'number':
      valid = isNumber(value);
      break;
    case 'boolean':
      valid = isBoolean(value);
      break;
    case 'object':
      valid = isObject(value);
      break;
    case 'array':
      valid = isArray(value);
      break;
    case 'null':
      valid = isNull(value);
      break;
    case 'date':
      valid = isDate(value) || isDateString(value);
      break;
    case 'enum':
    case 'any':
      valid = true;
      break;
  }

  if (!valid) {
    return {
      valid: false,
      error: {
        path,
        field: field.name,
        type: 'type',
        message: `Expected ${expectedType}, got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`,
        value,
        severity: 'error',
      },
    };
  }

  return { valid: true };
}

// ============================================================================
// Schema Registry
// ============================================================================

class SchemaRegistry {
  private schemas = new Map<string, ValidationSchema>();

  register(schema: ValidationSchema): void {
    this.schemas.set(`${schema.name}@${schema.version}`, schema);
    this.schemas.set(schema.name, schema); // Latest version
  }

  get(name: string, version?: string): ValidationSchema | undefined {
    if (version) {
      return this.schemas.get(`${name}@${version}`);
    }
    return this.schemas.get(name);
  }

  list(): string[] {
    const names = new Set<string>();
    for (const key of this.schemas.keys()) {
      if (!key.includes('@')) {
        names.add(key);
      }
    }
    return Array.from(names);
  }
}

export const schemaRegistry = new SchemaRegistry();

// Register predefined schemas
schemaRegistry.register(PlayerSchema);
schemaRegistry.register(TeamSchema);
schemaRegistry.register(MatchSchema);
schemaRegistry.register(PlayerStatsSchema);

// ============================================================================
// Utilities
// ============================================================================

export function createValidator<T>(schema: ValidationSchema): (data: unknown) => ValidationResult & { data?: T } {
  return (data: unknown) => validateSchema(data, schema) as ValidationResult & { data?: T };
}

export function mergeSchemas(base: ValidationSchema, extension: Partial<ValidationSchema>): ValidationSchema {
  return {
    ...base,
    ...extension,
    fields: [...base.fields, ...(extension.fields || [])],
  };
}

export function pickSchema(schema: ValidationSchema, fieldNames: string[]): ValidationSchema {
  return {
    ...schema,
    fields: schema.fields.filter(f => fieldNames.includes(f.name)),
  };
}

export function omitSchema(schema: ValidationSchema, fieldNames: string[]): ValidationSchema {
  return {
    ...schema,
    fields: schema.fields.filter(f => !fieldNames.includes(f.name)),
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
};
