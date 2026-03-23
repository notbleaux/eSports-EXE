/**
 * Quality Scorer
 * 
 * Data quality scoring, completeness metrics, accuracy estimation, and confidence levels
 * for Libre-X-eSport 4NJZ4 TENET Platform data ingestion.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

import { isNumber, isString, isObject, isArray, isDate } from './schema';

// ============================================================================
// Types
// ============================================================================

export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityScore {
  overall: number; // 0-100
  grade: QualityGrade;
  breakdown: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    validity: number;
  };
  confidence: number; // 0-1
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity';
  severity: 'critical' | 'major' | 'minor';
  field?: string;
  message: string;
  impact: number; // 0-1, impact on overall score
}

export interface CompletenessMetrics {
  totalFields: number;
  filledFields: number;
  missingFields: number;
  nullFields: number;
  emptyStringFields: number;
  fillRate: number; // 0-1
  requiredFillRate: number;
  optionalFillRate: number;
}

export interface AccuracyMetrics {
  validValues: number;
  invalidValues: number;
  suspiciousValues: number;
  outOfRangeValues: number;
  formatErrors: number;
  accuracyRate: number;
}

export interface ConsistencyMetrics {
  consistentRecords: number;
  inconsistentRecords: number;
  crossFieldViolations: number;
  typeMismatches: number;
  formatInconsistencies: number;
  consistencyRate: number;
}

export interface DatasetQualityReport {
  totalRecords: number;
  scoredRecords: number;
  averageScore: number;
  gradeDistribution: Record<QualityGrade, number>;
  fieldQuality: Record<string, FieldQualityMetrics>;
  issues: QualityIssue[];
  trends: QualityTrend[];
  timestamp: number;
}

export interface FieldQualityMetrics {
  field: string;
  fillRate: number;
  accuracyRate: number;
  uniqueValues: number;
  nullCount: number;
  outlierCount: number;
  mostCommonValue: unknown;
  dataType: string;
}

export interface QualityTrend {
  timestamp: number;
  score: number;
  records: number;
  issues: number;
}

export interface ScoringConfig {
  weights: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    validity: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  requiredFields: string[];
  criticalFields: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ScoringConfig = {
  weights: {
    completeness: 0.25,
    accuracy: 0.25,
    consistency: 0.20,
    timeliness: 0.15,
    validity: 0.15,
  },
  thresholds: {
    excellent: 90,
    good: 75,
    acceptable: 60,
    poor: 40,
  },
  requiredFields: [],
  criticalFields: [],
};

// ============================================================================
// Quality Scoring
// ============================================================================

export function calculateQualityScore<T extends Record<string, unknown>>(
  data: T | T[],
  config: Partial<ScoringConfig> = {}
): QualityScore {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const records = isArray(data) ? data : [data];
  
  if (records.length === 0) {
    return createEmptyScore();
  }

  const issues: QualityIssue[] = [];
  
  // Calculate individual dimension scores
  const completeness = calculateCompletenessScore(records, cfg, issues);
  const accuracy = calculateAccuracyScore(records, cfg, issues);
  const consistency = calculateConsistencyScore(records, cfg, issues);
  const timeliness = calculateTimelinessScore(records, issues);
  const validity = calculateValidityScore(records, cfg, issues);

  // Calculate weighted overall score
  const overall = Math.round(
    completeness * cfg.weights.completeness +
    accuracy * cfg.weights.accuracy +
    consistency * cfg.weights.consistency +
    timeliness * cfg.weights.timeliness +
    validity * cfg.weights.validity
  ) * 100;

  const grade = scoreToGrade(overall, cfg.thresholds);
  const confidence = calculateConfidence(overall, issues);
  const recommendations = generateRecommendations(issues, cfg);

  return {
    overall,
    grade,
    breakdown: {
      completeness: Math.round(completeness * 100),
      accuracy: Math.round(accuracy * 100),
      consistency: Math.round(consistency * 100),
      timeliness: Math.round(timeliness * 100),
      validity: Math.round(validity * 100),
    },
    confidence,
    issues: issues.sort((a, b) => b.impact - a.impact),
    recommendations,
  };
}

function createEmptyScore(): QualityScore {
  return {
    overall: 0,
    grade: 'F',
    breakdown: {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      timeliness: 0,
      validity: 0,
    },
    confidence: 0,
    issues: [{
      type: 'completeness',
      severity: 'critical',
      message: 'No data records to score',
      impact: 1,
    }],
    recommendations: ['Provide data records for quality assessment'],
  };
}

function scoreToGrade(score: number, thresholds: ScoringConfig['thresholds']): QualityGrade {
  if (score >= thresholds.excellent) return 'A';
  if (score >= thresholds.good) return 'B';
  if (score >= thresholds.acceptable) return 'C';
  if (score >= thresholds.poor) return 'D';
  return 'F';
}

function calculateConfidence(overallScore: number, issues: QualityIssue[]): number {
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const majorIssues = issues.filter(i => i.severity === 'major').length;
  const minorIssues = issues.filter(i => i.severity === 'minor').length;
  
  let confidence = overallScore / 100;
  confidence -= criticalIssues * 0.25;
  confidence -= majorIssues * 0.10;
  confidence -= minorIssues * 0.02;
  
  return Math.max(0, Math.min(1, confidence));
}

function generateRecommendations(issues: QualityIssue[], config: ScoringConfig): string[] {
  const recommendations: string[] = [];
  
  // Group issues by type
  const byType = new Map<QualityIssue['type'], QualityIssue[]>();
  for (const issue of issues) {
    if (!byType.has(issue.type)) {
      byType.set(issue.type, []);
    }
    byType.get(issue.type)!.push(issue);
  }

  // Generate recommendations based on issue types
  if (byType.get('completeness')?.some(i => i.severity === 'critical')) {
    recommendations.push('Address critical missing fields immediately');
  }
  if (byType.get('completeness')?.length) {
    recommendations.push('Implement data collection for missing fields');
  }
  if (byType.get('accuracy')?.length) {
    recommendations.push('Review and correct invalid data values');
  }
  if (byType.get('consistency')?.length) {
    recommendations.push('Standardize data formats across records');
  }
  if (byType.get('validity')?.length) {
    recommendations.push('Validate data against schema constraints');
  }

  return recommendations.length > 0 ? recommendations : ['Data quality is acceptable'];
}

// ============================================================================
// Completeness Scoring
// ============================================================================

function calculateCompletenessScore<T extends Record<string, unknown>>(
  records: T[],
  config: ScoringConfig,
  issues: QualityIssue[]
): number {
  const fields = Object.keys(records[0]);
  const required = config.requiredFields.length > 0 ? config.requiredFields : fields;
  
  let totalFields = 0;
  let filledFields = 0;
  let criticalMissing = 0;

  for (const record of records) {
    for (const field of fields) {
      totalFields++;
      const value = record[field];
      
      const isFilled = value !== undefined && value !== null && value !== '';
      if (isFilled) {
        filledFields++;
      } else if (required.includes(field)) {
        criticalMissing++;
      }
    }
  }

  const score = totalFields > 0 ? filledFields / totalFields : 0;

  // Add issues for missing critical fields
  if (criticalMissing > 0) {
    issues.push({
      type: 'completeness',
      severity: 'major',
      message: `${criticalMissing} required fields are missing`,
      impact: criticalMissing / totalFields,
    });
  }

  return score;
}

export function calculateCompletenessMetrics<T extends Record<string, unknown>>(
  records: T[],
  requiredFields?: string[],
  optionalFields?: string[]
): CompletenessMetrics {
  if (records.length === 0) {
    return {
      totalFields: 0,
      filledFields: 0,
      missingFields: 0,
      nullFields: 0,
      emptyStringFields: 0,
      fillRate: 0,
      requiredFillRate: 0,
      optionalFillRate: 0,
    };
  }

  const fields = Object.keys(records[0]);
  const required = requiredFields || fields;
  const optional = optionalFields || [];

  let totalFields = 0;
  let filledFields = 0;
  let nullFields = 0;
  let emptyStringFields = 0;
  let requiredFilled = 0;
  let optionalFilled = 0;
  let requiredTotal = 0;
  let optionalTotal = 0;

  for (const record of records) {
    for (const field of fields) {
      totalFields++;
      const value = record[field];

      if (value === undefined) {
        // Missing
      } else if (value === null) {
        nullFields++;
      } else if (value === '') {
        emptyStringFields++;
      } else {
        filledFields++;
      }

      // Track required vs optional
      if (required.includes(field)) {
        requiredTotal++;
        if (value !== undefined && value !== null && value !== '') {
          requiredFilled++;
        }
      } else if (optional.includes(field)) {
        optionalTotal++;
        if (value !== undefined && value !== null && value !== '') {
          optionalFilled++;
        }
      }
    }
  }

  return {
    totalFields,
    filledFields,
    missingFields: totalFields - filledFields - nullFields - emptyStringFields,
    nullFields,
    emptyStringFields,
    fillRate: totalFields > 0 ? filledFields / totalFields : 0,
    requiredFillRate: requiredTotal > 0 ? requiredFilled / requiredTotal : 0,
    optionalFillRate: optionalTotal > 0 ? optionalFilled / optionalTotal : 0,
  };
}

// ============================================================================
// Accuracy Scoring
// ============================================================================

function calculateAccuracyScore<T extends Record<string, unknown>>(
  records: T[],
  config: ScoringConfig,
  issues: QualityIssue[]
): number {
  let totalValues = 0;
  let validValues = 0;
  let suspiciousValues = 0;

  for (const record of records) {
    for (const [field, value] of Object.entries(record)) {
      if (value === undefined || value === null || value === '') continue;
      
      totalValues++;
      
      const accuracy = assessValueAccuracy(field, value, record);
      if (accuracy === 'valid') {
        validValues++;
      } else if (accuracy === 'suspicious') {
        suspiciousValues++;
      }
    }
  }

  const score = totalValues > 0 ? (validValues + suspiciousValues * 0.5) / totalValues : 1;

  if (suspiciousValues > 0) {
    issues.push({
      type: 'accuracy',
      severity: 'minor',
      message: `${suspiciousValues} values appear suspicious`,
      impact: suspiciousValues / totalValues * 0.5,
    });
  }

  return score;
}

function assessValueAccuracy(
  field: string,
  value: unknown,
  record: Record<string, unknown>
): 'valid' | 'suspicious' | 'invalid' {
  // Numeric field checks
  if (isNumber(value)) {
    // Check for unrealistic values
    if (field.includes('percentage') && (value < 0 || value > 100)) {
      return 'invalid';
    }
    if (field === 'kills' && value > 100) {
      return 'suspicious';
    }
    if (field === 'deaths' && value > 50) {
      return 'suspicious';
    }
    if (field === 'rating' && (value < 0 || value > 10)) {
      return 'invalid';
    }
    if (value < 0) {
      return 'invalid';
    }
  }

  // String field checks
  if (isString(value)) {
    // Check for suspicious patterns
    if (value.includes('test') || value.includes('dummy')) {
      return 'suspicious';
    }
    if (value.length > 200) {
      return 'suspicious';
    }
  }

  return 'valid';
}

export function calculateAccuracyMetrics<T extends Record<string, unknown>>(
  records: T[]
): AccuracyMetrics {
  let validValues = 0;
  let invalidValues = 0;
  let suspiciousValues = 0;
  let outOfRangeValues = 0;
  let formatErrors = 0;
  let totalValues = 0;

  for (const record of records) {
    for (const [field, value] of Object.entries(record)) {
      if (value === undefined || value === null || value === '') continue;
      
      totalValues++;
      const accuracy = assessValueAccuracy(field, value, record);
      
      switch (accuracy) {
        case 'valid':
          validValues++;
          break;
        case 'suspicious':
          suspiciousValues++;
          break;
        case 'invalid':
          invalidValues++;
          break;
      }

      // Additional checks
      if (isNumber(value)) {
        if (field.includes('percentage') && (value < 0 || value > 100)) {
          outOfRangeValues++;
        }
      }

      if (isString(value) && field.includes('email')) {
        if (!value.includes('@')) {
          formatErrors++;
        }
      }
    }
  }

  return {
    validValues,
    invalidValues,
    suspiciousValues,
    outOfRangeValues,
    formatErrors,
    accuracyRate: totalValues > 0 ? validValues / totalValues : 0,
  };
}

// ============================================================================
// Consistency Scoring
// ============================================================================

function calculateConsistencyScore<T extends Record<string, unknown>>(
  records: T[],
  config: ScoringConfig,
  issues: QualityIssue[]
): number {
  if (records.length < 2) return 1;

  let inconsistencies = 0;
  let totalChecks = 0;

  // Check for type consistency within fields
  const fieldTypes = new Map<string, Set<string>>();
  
  for (const record of records) {
    for (const [field, value] of Object.entries(record)) {
      if (value === undefined || value === null) continue;
      
      if (!fieldTypes.has(field)) {
        fieldTypes.set(field, new Set());
      }
      fieldTypes.get(field)!.add(typeof value);
    }
  }

  for (const [field, types] of fieldTypes) {
    totalChecks++;
    if (types.size > 1) {
      inconsistencies++;
      issues.push({
        type: 'consistency',
        severity: 'major',
        field,
        message: `Field '${field}' has inconsistent types: ${Array.from(types).join(', ')}`,
        impact: 0.1,
      });
    }
  }

  return totalChecks > 0 ? 1 - (inconsistencies / totalChecks) : 1;
}

export function calculateConsistencyMetrics<T extends Record<string, unknown>>(
  records: T[]
): ConsistencyMetrics {
  if (records.length < 2) {
    return {
      consistentRecords: records.length,
      inconsistentRecords: 0,
      crossFieldViolations: 0,
      typeMismatches: 0,
      formatInconsistencies: 0,
      consistencyRate: 1,
    };
  }

  let typeMismatches = 0;
  const fieldTypes = new Map<string, string>();

  for (const record of records) {
    for (const [field, value] of Object.entries(record)) {
      if (value === undefined || value === null) continue;
      
      const type = typeof value;
      if (!fieldTypes.has(field)) {
        fieldTypes.set(field, type);
      } else if (fieldTypes.get(field) !== type) {
        typeMismatches++;
      }
    }
  }

  return {
    consistentRecords: records.length,
    inconsistentRecords: 0,
    crossFieldViolations: 0,
    typeMismatches,
    formatInconsistencies: 0,
    consistencyRate: typeMismatches === 0 ? 1 : Math.max(0, 1 - typeMismatches / records.length),
  };
}

// ============================================================================
// Timeliness Scoring
// ============================================================================

function calculateTimelinessScore<T extends Record<string, unknown>>(
  records: T[],
  issues: QualityIssue[]
): number {
  let timelyRecords = 0;
  let outdatedRecords = 0;
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

  for (const record of records) {
    const timestamp = extractTimestamp(record);
    
    if (timestamp) {
      const age = now - timestamp.getTime();
      if (age < maxAge) {
        timelyRecords++;
      } else {
        outdatedRecords++;
      }
    } else {
      // No timestamp, assume timely
      timelyRecords++;
    }
  }

  const total = timelyRecords + outdatedRecords;
  const score = total > 0 ? timelyRecords / total : 1;

  if (outdatedRecords > 0) {
    issues.push({
      type: 'timeliness',
      severity: 'minor',
      message: `${outdatedRecords} records are outdated (>30 days)`,
      impact: outdatedRecords / total * 0.2,
    });
  }

  return score;
}

function extractTimestamp(record: Record<string, unknown>): Date | null {
  const timestampFields = ['timestamp', 'createdAt', 'updatedAt', 'date', 'recordedAt', 'matchDate'];
  
  for (const field of timestampFields) {
    const value = record[field];
    if (value) {
      if (isDate(value)) return value;
      if (isString(value) || isNumber(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }
  
  return null;
}

// ============================================================================
// Validity Scoring
// ============================================================================

function calculateValidityScore<T extends Record<string, unknown>>(
  records: T[],
  config: ScoringConfig,
  issues: QualityIssue[]
): number {
  let validRecords = 0;
  let totalRecords = records.length;

  for (const record of records) {
    if (isValidRecord(record, config)) {
      validRecords++;
    }
  }

  const score = totalRecords > 0 ? validRecords / totalRecords : 1;

  if (validRecords < totalRecords) {
    issues.push({
      type: 'validity',
      severity: 'major',
      message: `${totalRecords - validRecords} records fail validity checks`,
      impact: (totalRecords - validRecords) / totalRecords * 0.3,
    });
  }

  return score;
}

function isValidRecord(record: Record<string, unknown>, config: ScoringConfig): boolean {
  // Check required fields
  for (const field of config.requiredFields) {
    if (!(field in record) || record[field] === undefined || record[field] === null) {
      return false;
    }
  }

  // Check critical fields
  for (const field of config.criticalFields) {
    const value = record[field];
    if (value === undefined || value === null || value === '') {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Dataset Quality Report
// ============================================================================

export function generateDatasetQualityReport<T extends Record<string, unknown>>(
  records: T[],
  config: Partial<ScoringConfig> = {}
): DatasetQualityReport {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (records.length === 0) {
    return {
      totalRecords: 0,
      scoredRecords: 0,
      averageScore: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      fieldQuality: {},
      issues: [],
      trends: [],
      timestamp: Date.now(),
    };
  }

  // Score individual records
  const scores = records.map(r => calculateQualityScore(r, cfg));
  const averageScore = scores.reduce((a, b) => a + b.overall, 0) / scores.length;

  // Grade distribution
  const gradeDistribution: Record<QualityGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const score of scores) {
    gradeDistribution[score.grade]++;
  }

  // Field quality metrics
  const fieldQuality = analyzeFieldQuality(records);

  // Aggregate issues
  const allIssues = scores.flatMap(s => s.issues);
  const uniqueIssues = deduplicateIssues(allIssues);

  return {
    totalRecords: records.length,
    scoredRecords: records.length,
    averageScore,
    gradeDistribution,
    fieldQuality,
    issues: uniqueIssues,
    trends: [], // Would be populated from historical data
    timestamp: Date.now(),
  };
}

function analyzeFieldQuality<T extends Record<string, unknown>>(
  records: T[]
): Record<string, FieldQualityMetrics> {
  if (records.length === 0) return {};

  const fields = Object.keys(records[0]);
  const metrics: Record<string, FieldQualityMetrics> = {};

  for (const field of fields) {
    const values = records.map(r => r[field]).filter(v => v !== undefined && v !== null);
    const uniqueValues = new Set(values.map(v => JSON.stringify(v)));
    
    // Calculate most common value
    const counts = new Map<string, number>();
    for (const v of values) {
      const key = JSON.stringify(v);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let mostCommon: unknown = undefined;
    let maxCount = 0;
    for (const [key, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = JSON.parse(key);
      }
    }

    // Count outliers for numeric fields
    let outlierCount = 0;
    const numericValues = values.filter(isNumber);
    if (numericValues.length > 0) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const variance = numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length;
      const std = Math.sqrt(variance);
      outlierCount = numericValues.filter(v => Math.abs(v - mean) > 3 * std).length;
    }

    metrics[field] = {
      field,
      fillRate: values.length / records.length,
      accuracyRate: 1, // Simplified
      uniqueValues: uniqueValues.size,
      nullCount: records.length - values.length,
      outlierCount,
      mostCommonValue: mostCommon,
      dataType: typeof values[0] || 'unknown',
    };
  }

  return metrics;
}

function deduplicateIssues(issues: QualityIssue[]): QualityIssue[] {
  const seen = new Set<string>();
  return issues.filter(issue => {
    const key = `${issue.type}-${issue.field}-${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// Quality Badges
// ============================================================================

export function getQualityBadge(score: QualityScore): {
  icon: string;
  color: string;
  label: string;
} {
  const badges = {
    A: { icon: '🏆', color: '#22c55e', label: 'Excellent' },
    B: { icon: '⭐', color: '#84cc16', label: 'Good' },
    C: { icon: '✓', color: '#eab308', label: 'Acceptable' },
    D: { icon: '⚠️', color: '#f97316', label: 'Poor' },
    F: { icon: '❌', color: '#ef4444', label: 'Critical' },
  };

  return badges[score.grade];
}

// ============================================================================
// Exports
// ============================================================================

export default {
  calculateQualityScore,
  calculateCompletenessMetrics,
  calculateAccuracyMetrics,
  calculateConsistencyMetrics,
  generateDatasetQualityReport,
  getQualityBadge,
  scoreToGrade,
};
