/**
 * Data Cleaner
 * 
 * Removes duplicates, fills missing values, normalizes formats, and detects outliers
 * for Libre-X-eSport 4NJZ4 TENET Platform data ingestion.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

import { isNumber, isString, isObject, isArray, isDateString } from './schema';

// ============================================================================
// Types
// ============================================================================

export interface CleanOptions {
  removeDuplicates?: boolean;
  fillMissing?: boolean;
  normalizeFormats?: boolean;
  detectOutliers?: boolean;
  removeOutliers?: boolean;
  trimStrings?: boolean;
  removeEmpty?: boolean;
}

export interface CleanResult<T = unknown> {
  data: T[];
  removed: {
    duplicates: T[];
    outliers: T[];
    invalid: T[];
    empty: T[];
  };
  modified: {
    filled: number;
    normalized: number;
    trimmed: number;
  };
  stats: {
    originalCount: number;
    finalCount: number;
    duplicateCount: number;
    outlierCount: number;
    missingFilled: number;
  };
}

export interface DuplicateOptions {
  keySelector?: (item: unknown) => string;
  keep?: 'first' | 'last' | 'none';
  compareFields?: string[];
}

export interface MissingValueOptions {
  strategy: 'mean' | 'median' | 'mode' | 'constant' | 'forward' | 'backward' | 'interpolate';
  constantValue?: unknown;
  groupBy?: string;
  fields?: string[];
}

export interface NormalizationOptions {
  stringCase?: 'lower' | 'upper' | 'title' | 'none';
  dateFormat?: 'ISO' | 'UTC' | 'locale';
  numberPrecision?: number;
  trimWhitespace?: boolean;
  removeExtraSpaces?: boolean;
}

export interface OutlierOptions {
  method: 'iqr' | 'zscore' | 'modified_zscore' | 'grubbs';
  threshold?: number;
  columns?: string[];
  minSamples?: number;
}

// ============================================================================
// Duplicate Removal
// ============================================================================

export function removeDuplicates<T>(
  data: T[],
  options: DuplicateOptions = {}
): { unique: T[]; duplicates: T[] } {
  const { keySelector, keep = 'first', compareFields } = options;
  
  const seen = new Map<string, T>();
  const duplicates: T[] = [];
  const unique: T[] = [];

  for (const item of data) {
    let key: string;
    
    if (keySelector) {
      key = keySelector(item);
    } else if (compareFields && isObject(item)) {
      key = compareFields.map(f => JSON.stringify((item as Record<string, unknown>)[f])).join('|');
    } else {
      key = JSON.stringify(item);
    }

    if (seen.has(key)) {
      if (keep === 'last') {
        duplicates.push(seen.get(key)!);
        seen.set(key, item);
      } else if (keep === 'none') {
        if (!duplicates.includes(seen.get(key)!)) {
          duplicates.push(seen.get(key)!);
        }
        duplicates.push(item);
        seen.delete(key);
      } else {
        duplicates.push(item);
      }
    } else {
      seen.set(key, item);
    }
  }

  if (keep === 'none') {
    return { unique: [], duplicates: [...duplicates, ...seen.values()] };
  }

  return { unique: Array.from(seen.values()), duplicates };
}

export function findDuplicates<T>(
  data: T[],
  keySelector: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of data) {
    const key = keySelector(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  // Only return groups with duplicates
  const duplicates = new Map<string, T[]>();
  for (const [key, items] of groups) {
    if (items.length > 1) {
      duplicates.set(key, items);
    }
  }

  return duplicates;
}

// ============================================================================
// Missing Value Handling
// ============================================================================

export function fillMissingValues<T extends Record<string, unknown>>(
  data: T[],
  options: MissingValueOptions
): { filled: T[]; stats: Record<string, number> } {
  const { strategy, constantValue, groupBy, fields } = options;
  const filled = [...data];
  const stats: Record<string, number> = {};

  // Determine which fields to fill
  const targetFields = fields || Object.keys(data[0] || {});

  for (const field of targetFields) {
    stats[field] = 0;
    
    // Calculate statistics for numeric fields
    const values = data
      .map(d => d[field])
      .filter((v): v is number => isNumber(v));
    
    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length > 0 
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      : 0;

    // Group data if needed
    const groups = groupBy
      ? groupByField(data, groupBy)
      : new Map<string, T[]>([['all', data]]);

    for (let i = 0; i < filled.length; i++) {
      const item = filled[i];
      const value = item[field];

      if (value === undefined || value === null || value === '') {
        let fillValue: unknown;

        switch (strategy) {
          case 'mean':
            fillValue = mean;
            break;
          case 'median':
            fillValue = median;
            break;
          case 'mode': {
            const modeValue = calculateMode(data.map(d => d[field]).filter(v => v !== undefined && v !== null));
            fillValue = modeValue;
            break;
          }
          case 'constant':
            fillValue = constantValue;
            break;
          case 'forward':
            fillValue = findLastValid(filled, i, field);
            break;
          case 'backward':
            fillValue = findNextValid(filled, i, field);
            break;
          case 'interpolate':
            fillValue = interpolateValue(filled, i, field);
            break;
          default:
            fillValue = constantValue;
        }

        filled[i] = { ...item, [field]: fillValue };
        stats[field]++;
      }
    }
  }

  return { filled, stats };
}

function groupByField<T>(data: T[], field: string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of data) {
    const key = String((item as Record<string, unknown>)[field] ?? 'unknown');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  return groups;
}

function calculateMode(values: unknown[]): unknown {
  const counts = new Map<unknown, number>();
  for (const v of values) {
    const key = JSON.stringify(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  let maxCount = 0;
  let mode: unknown = undefined;
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mode = JSON.parse(key);
    }
  }
  return mode;
}

function findLastValid<T>(data: T[], index: number, field: string): unknown {
  for (let i = index - 1; i >= 0; i--) {
    const value = (data[i] as Record<string, unknown>)[field];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function findNextValid<T>(data: T[], index: number, field: string): unknown {
  for (let i = index + 1; i < data.length; i++) {
    const value = (data[i] as Record<string, unknown>)[field];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function interpolateValue<T>(data: T[], index: number, field: string): unknown {
  const prev = findLastValid(data, index, field);
  const next = findNextValid(data, index, field);
  
  if (isNumber(prev) && isNumber(next)) {
    return (prev + next) / 2;
  }
  
  return prev ?? next;
}

// ============================================================================
// Format Normalization
// ============================================================================

export function normalizeFormats<T extends Record<string, unknown>>(
  data: T[],
  options: NormalizationOptions = {}
): { normalized: T[]; count: number } {
  const {
    stringCase = 'none',
    dateFormat = 'ISO',
    numberPrecision,
    trimWhitespace = true,
    removeExtraSpaces = true,
  } = options;

  let count = 0;
  const normalized = data.map(item => {
    const normalizedItem: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(item)) {
      let normalizedValue = value;

      // String normalization
      if (isString(value)) {
        let str = value;
        
        if (trimWhitespace) {
          str = str.trim();
        }
        
        if (removeExtraSpaces) {
          str = str.replace(/\s+/g, ' ');
        }
        
        switch (stringCase) {
          case 'lower':
            str = str.toLowerCase();
            break;
          case 'upper':
            str = str.toUpperCase();
            break;
          case 'title':
            str = str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            break;
        }
        
        if (str !== value) count++;
        normalizedValue = str;
      }

      // Date normalization
      if (isDateString(value)) {
        const date = new Date(value);
        switch (dateFormat) {
          case 'ISO':
            normalizedValue = date.toISOString();
            break;
          case 'UTC':
            normalizedValue = date.toUTCString();
            break;
          case 'locale':
            normalizedValue = date.toLocaleString();
            break;
        }
        if (normalizedValue !== value) count++;
      }

      // Number precision
      if (isNumber(value) && numberPrecision !== undefined) {
        const rounded = Number(value.toFixed(numberPrecision));
        if (rounded !== value) count++;
        normalizedValue = rounded;
      }

      normalizedItem[key] = normalizedValue;
    }

    return normalizedItem as T;
  });

  return { normalized, count };
}

export function normalizeRegionCode(region: string): string {
  const regionMap: Record<string, string> = {
    'north america': 'NA',
    'na': 'NA',
    'europe': 'EU',
    'eu': 'EU',
    'asia pacific': 'APAC',
    'apac': 'APAC',
    'brazil': 'BR',
    'br': 'BR',
    'korea': 'KR',
    'kr': 'KR',
    'china': 'CN',
    'cn': 'CN',
    'latin america': 'LATAM',
    'latam': 'LATAM',
    'japan': 'JP',
    'jp': 'JP',
  };
  
  return regionMap[region.toLowerCase()] || region.toUpperCase();
}

export function normalizeAgentName(agent: string): string {
  const agentMap: Record<string, string> = {
    'phoenix': 'Phoenix',
    'jett': 'Jett',
    'sage': 'Sage',
    'sova': 'Sova',
    'brimstone': 'Brimstone',
    'viper': 'Viper',
    'omen': 'Omen',
    'cypher': 'Cypher',
    'reyna': 'Reyna',
    'killjoy': 'Killjoy',
    'breach': 'Breach',
    'raze': 'Raze',
    'skye': 'Skye',
    'yoru': 'Yoru',
    'astra': 'Astra',
    'kayo': 'KAY/O',
    'chamber': 'Chamber',
    'neon': 'Neon',
    'fade': 'Fade',
    'harbor': 'Harbor',
    'gekko': 'Gekko',
    'deadlock': 'Deadlock',
    'iso': 'Iso',
    'clove': 'Clove',
    'vyse': 'Vyse',
    'tejo': 'Tejo',
    'waylay': 'Waylay',
  };
  
  return agentMap[agent.toLowerCase()] || agent;
}

// ============================================================================
// Outlier Detection
// ============================================================================

export interface OutlierResult<T> {
  clean: T[];
  outliers: T[];
  bounds: Record<string, { lower: number; upper: number }>;
}

export function detectOutliers<T extends Record<string, unknown>>(
  data: T[],
  options: OutlierOptions
): OutlierResult<T> {
  const { method, threshold = 3, columns, minSamples = 10 } = options;

  if (data.length < minSamples) {
    return { clean: data, outliers: [], bounds: {} };
  }

  // Determine numeric columns to check
  const numericColumns = columns || Object.keys(data[0] || {}).filter(key => 
    data.some(d => isNumber(d[key]))
  );

  const outlierIndices = new Set<number>();
  const bounds: Record<string, { lower: number; upper: number }> = {};

  for (const column of numericColumns) {
    const values = data
      .map((d, i) => ({ value: d[column] as number, index: i }))
      .filter(item => isNumber(item.value));

    if (values.length < minSamples) continue;

    const nums = values.map(v => v.value);
    const result = calculateOutlierBounds(nums, method, threshold);
    bounds[column] = result.bounds;

    for (const item of values) {
      if (item.value < result.bounds.lower || item.value > result.bounds.upper) {
        outlierIndices.add(item.index);
      }
    }
  }

  const clean: T[] = [];
  const outliers: T[] = [];

  for (let i = 0; i < data.length; i++) {
    if (outlierIndices.has(i)) {
      outliers.push(data[i]);
    } else {
      clean.push(data[i]);
    }
  }

  return { clean, outliers, bounds };
}

function calculateOutlierBounds(
  values: number[],
  method: string,
  threshold: number
): { bounds: { lower: number; upper: number } } {
  switch (method) {
    case 'iqr': {
      const sorted = [...values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      const multiplier = threshold;
      
      return {
        bounds: {
          lower: q1 - multiplier * iqr,
          upper: q3 + multiplier * iqr,
        },
      };
    }
    
    case 'zscore': {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      
      return {
        bounds: {
          lower: mean - threshold * std,
          upper: mean + threshold * std,
        },
      };
    }
    
    case 'modified_zscore': {
      const median = calculateMedian(values);
      const mad = calculateMAD(values, median);
      const modifiedThreshold = threshold * 0.6745;
      
      return {
        bounds: {
          lower: median - modifiedThreshold * mad / 0.6745,
          upper: median + modifiedThreshold * mad / 0.6745,
        },
      };
    }
    
    default:
      return { bounds: { lower: -Infinity, upper: Infinity } };
  }
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calculateMAD(values: number[], median: number): number {
  const deviations = values.map(v => Math.abs(v - median));
  return calculateMedian(deviations);
}

// ============================================================================
// Data Cleaning Pipeline
// ============================================================================

export function cleanData<T extends Record<string, unknown>>(
  data: T[],
  options: CleanOptions = {}
): CleanResult<T> {
  const {
    removeDuplicates: doRemoveDuplicates = true,
    fillMissing: doFillMissing = true,
    normalizeFormats: doNormalizeFormats = true,
    detectOutliers: doDetectOutliers = true,
    removeOutliers = false,
    trimStrings = true,
    removeEmpty = true,
  } = options;

  const originalCount = data.length;
  let workingData = [...data];
  const removed = {
    duplicates: [] as T[],
    outliers: [] as T[],
    invalid: [] as T[],
    empty: [] as T[],
  };
  const modified = {
    filled: 0,
    normalized: 0,
    trimmed: 0,
  };

  // Remove empty records
  if (removeEmpty) {
    const nonEmpty: T[] = [];
    for (const item of workingData) {
      const hasValues = Object.values(item).some(v => 
        v !== undefined && v !== null && v !== ''
      );
      if (hasValues) {
        nonEmpty.push(item);
      } else {
        removed.empty.push(item);
      }
    }
    workingData = nonEmpty;
  }

  // Remove duplicates
  if (doRemoveDuplicates) {
    const result = removeDuplicates(workingData);
    workingData = result.unique;
    removed.duplicates = result.duplicates;
  }

  // Fill missing values
  if (doFillMissing) {
    const fillResult = fillMissingValues(workingData, {
      strategy: 'mean',
      fields: Object.keys(workingData[0] || {}).filter(key => 
        workingData.some(d => isNumber(d[key]))
      ),
    });
    workingData = fillResult.filled;
    modified.filled = Object.values(fillResult.stats).reduce((a, b) => a + b, 0);
  }

  // Normalize formats
  if (doNormalizeFormats) {
    const normResult = normalizeFormats(workingData, {
      trimWhitespace: trimStrings,
      stringCase: 'none',
    });
    workingData = normResult.normalized;
    modified.normalized = normResult.count;
  }

  // Detect and optionally remove outliers
  if (doDetectOutliers) {
    const numericColumns = Object.keys(workingData[0] || {}).filter(key => 
      workingData.some(d => isNumber(d[key]))
    );
    
    if (numericColumns.length > 0) {
      const outlierResult = detectOutliers(workingData, {
        method: 'iqr',
        columns: numericColumns,
      });
      
      if (removeOutliers) {
        workingData = outlierResult.clean;
        removed.outliers = outlierResult.outliers;
      } else {
        // Just mark them but don't remove
        removed.outliers = outlierResult.outliers;
      }
    }
  }

  return {
    data: workingData,
    removed,
    modified,
    stats: {
      originalCount,
      finalCount: workingData.length,
      duplicateCount: removed.duplicates.length,
      outlierCount: removed.outliers.length,
      missingFilled: modified.filled,
    },
  };
}

// ============================================================================
// Specialized Cleaners
// ============================================================================

export function cleanPlayerData(data: Record<string, unknown>[]): CleanResult<Record<string, unknown>> {
  return cleanData(data, {
    removeDuplicates: true,
    fillMissing: true,
    normalizeFormats: true,
    detectOutliers: true,
    removeOutliers: false,
    trimStrings: true,
    removeEmpty: true,
  });
}

export function cleanMatchData(data: Record<string, unknown>[]): CleanResult<Record<string, unknown>> {
  return cleanData(data, {
    removeDuplicates: true,
    fillMissing: false, // Don't fill match data
    normalizeFormats: true,
    detectOutliers: false,
    trimStrings: true,
    removeEmpty: true,
  });
}

export function cleanStatsData(data: Record<string, unknown>[]): CleanResult<Record<string, unknown>> {
  return cleanData(data, {
    removeDuplicates: true,
    fillMissing: true,
    normalizeFormats: true,
    detectOutliers: true,
    removeOutliers: true, // Remove stat outliers
    trimStrings: true,
    removeEmpty: true,
  });
}

// ============================================================================
// Exports
// ============================================================================

export default {
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
};
