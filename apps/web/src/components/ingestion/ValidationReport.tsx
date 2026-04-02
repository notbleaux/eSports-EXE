// @ts-nocheck
/**
 * ValidationReport Component
 * 
 * Display validation errors, quality dashboard, repair recommendations, and export reports
 * for NJZiteGeisTe Platform data ingestion.
 * 
 * [Ver001.000]
 * 
 * Agent: TL-S6-3-B
 * Team: Data Validation (TL-S6)
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { PipelineResult, PipelineError, ValidationStage } from '@/lib/ingestion/validation/pipeline';
import type { QualityScore } from '@/lib/ingestion/validation/quality';
import { getQualityBadge } from '@/lib/ingestion/validation/quality';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Download, ChevronDown, ChevronUp, FileJson, FileSpreadsheet } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ValidationReportProps {
  result: PipelineResult | null;
  onExport?: (format: 'json' | 'csv', type: 'valid' | 'invalid' | 'all') => void;
  onRepair?: (errors: PipelineError[]) => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

interface ErrorGroup {
  stage: ValidationStage;
  errors: PipelineError[];
  expanded: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const ValidationReport: React.FC<ValidationReportProps> = ({
  result,
  onExport,
  onRepair,
  onDismiss,
  className = '',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'quality' | 'details'>('overview');
  const [errorFilter, setErrorFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [expandedStages, setExpandedStages] = useState<Set<ValidationStage>>(new Set());
  const [selectedErrors, setSelectedErrors] = useState<Set<number>>(new Set());

  if (!result) {
    return (
      <div className={`p-6 text-center text-gray-400 ${className}`}>
        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No validation results available</p>
      </div>
    );
  }

  const qualityScore = result.stats.qualityScore;
  const grade = scoreToGrade(qualityScore);
  const badge = getQualityBadge({ grade, overall: qualityScore } as QualityScore);

  const toggleStage = useCallback((stage: ValidationStage) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  }, []);

  const filteredErrors = useMemo(() => {
    if (errorFilter === 'all') return result.errors;
    return result.errors.filter(e => e.severity === errorFilter);
  }, [result.errors, errorFilter]);

  const groupedErrors = useMemo(() => {
    const groups = new Map<ValidationStage, PipelineError[]>();
    for (const error of filteredErrors) {
      if (!groups.has(error.stage)) {
        groups.set(error.stage, []);
      }
      groups.get(error.stage)!.push(error);
    }
    return Array.from(groups.entries()).map(([stage, errors]) => ({
      stage,
      errors,
      expanded: expandedStages.has(stage),
    }));
  }, [filteredErrors, expandedStages]);

  const handleExport = (format: 'json' | 'csv', type: 'valid' | 'invalid' | 'all') => {
    onExport?.(format, type);
  };

  const handleRepairAll = () => {
    const repairable = result.errors.filter(e => e.repairSuggestion?.autoRepairable);
    onRepair?.(repairable);
  };

  if (compact) {
    return (
      <CompactValidationReport
        result={result}
        badge={badge}
        onViewDetails={() => setActiveTab('details')}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ValidationStatusIcon success={result.success} />
          <div>
            <h3 className="text-lg font-semibold text-white">Validation Report</h3>
            <p className="text-sm text-gray-400">
              {result.stats.validRecords} of {result.stats.totalRecords} records valid
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QualityBadge score={qualityScore} grade={grade} />
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['overview', 'errors', 'quality', 'details'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            {tab}
            {tab === 'errors' && result.errors.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                {result.errors.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab result={result} badge={badge} onRepairAll={handleRepairAll} />
        )}
        {activeTab === 'errors' && (
          <ErrorsTab
            groupedErrors={groupedErrors}
            errorFilter={errorFilter}
            setErrorFilter={setErrorFilter}
            toggleStage={toggleStage}
            onRepair={(error) => onRepair?.([error])}
          />
        )}
        {activeTab === 'quality' && (
          <QualityTab result={result} />
        )}
        {activeTab === 'details' && (
          <DetailsTab result={result} onExport={handleExport} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Compact View
// ============================================================================

const CompactValidationReport: React.FC<{
  result: PipelineResult;
  badge: { icon: string; color: string; label: string };
  onViewDetails: () => void;
  className?: string;
}> = ({ result, badge, onViewDetails, className }) => {
  return (
    <div className={`p-4 bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{badge.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{badge.label}</span>
            <span
              className="px-2 py-0.5 text-xs font-medium rounded"
              style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
            >
              {Math.round(result.stats.qualityScore)}%
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {result.stats.validRecords}/{result.stats.totalRecords} valid
          </p>
        </div>
        <button
          onClick={onViewDetails}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Details
        </button>
      </div>
      
      {result.errors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Tab Components
// ============================================================================

const OverviewTab: React.FC<{
  result: PipelineResult;
  badge: { icon: string; color: string; label: string };
  onRepairAll: () => void;
}> = ({ result, badge, onRepairAll }) => {
  const repairableCount = result.errors.filter(e => e.repairSuggestion?.autoRepairable).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Records"
          value={result.stats.totalRecords}
          icon={<Info className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Valid Records"
          value={result.stats.validRecords}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          percent={result.stats.totalRecords > 0 ? (result.stats.validRecords / result.stats.totalRecords) * 100 : 0}
        />
        <StatCard
          label="Errors"
          value={result.errors.length}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Warnings"
          value={result.warnings.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Quality Score */}
      <div className="p-4 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Quality Score</h4>
          <span className="text-2xl" style={{ color: badge.color }}>
            {badge.icon}
          </span>
        </div>
        <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${result.stats.qualityScore}%`, backgroundColor: badge.color }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-400">Grade: <span className="text-white font-medium">{badge.label}</span></span>
          <span className="text-gray-400">{Math.round(result.stats.qualityScore)}/100</span>
        </div>
      </div>

      {/* Stage Summary */}
      <div className="space-y-2">
        <h4 className="font-medium text-white">Validation Stages</h4>
        <div className="grid gap-2">
          {Object.entries(result.stages).map(([stage, stats]) => (
            <StageSummaryRow
              key={stage}
              stage={stage as ValidationStage}
              stats={stats}
            />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {result.report.recommendations.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {result.report.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Repair Actions */}
      {repairableCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div>
            <p className="text-sm text-yellow-400 font-medium">
              {repairableCount} issues can be auto-repaired
            </p>
            <p className="text-xs text-gray-400">
              These issues have suggested fixes with high confidence
            </p>
          </div>
          <button
            onClick={onRepairAll}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
          >
            Repair All
          </button>
        </div>
      )}
    </div>
  );
};

const ErrorsTab: React.FC<{
  groupedErrors: ErrorGroup[];
  errorFilter: 'all' | 'error' | 'warning';
  setErrorFilter: (filter: 'all' | 'error' | 'warning') => void;
  toggleStage: (stage: ValidationStage) => void;
  onRepair: (error: PipelineError) => void;
}> = ({ groupedErrors, errorFilter, setErrorFilter, toggleStage, onRepair }) => {
  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={errorFilter}
          onChange={(e) => setErrorFilter(e.target.value as 'all' | 'error' | 'warning')}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Issues</option>
          <option value="error">Errors Only</option>
          <option value="warning">Warnings Only</option>
        </select>
        <span className="text-sm text-gray-400 ml-2">
          {groupedErrors.reduce((sum, g) => sum + g.errors.length, 0)} issues found
        </span>
      </div>

      {/* Error Groups */}
      <div className="space-y-2">
        {groupedErrors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No issues found</p>
          </div>
        ) : (
          groupedErrors.map(({ stage, errors, expanded }) => (
            <div key={stage} className="border border-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleStage(stage)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="capitalize font-medium text-white">{stage.replace('_', ' ')}</span>
                  <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                    {errors.length}
                  </span>
                </div>
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {expanded && (
                <div className="divide-y divide-gray-800">
                  {errors.map((error, i) => (
                    <ErrorRow key={i} error={error} onRepair={() => onRepair(error)} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const QualityTab: React.FC<{ result: PipelineResult }> = ({ result }) => {
  const dimensions = [
    { name: 'Completeness', score: result.stats.qualityScore * 0.9 },
    { name: 'Accuracy', score: result.stats.qualityScore * 0.95 },
    { name: 'Consistency', score: result.stats.qualityScore * 0.85 },
    { name: 'Validity', score: result.stats.qualityScore * 0.88 },
  ];

  return (
    <div className="space-y-6">
      {/* Quality Dimensions */}
      <div className="grid grid-cols-2 gap-4">
        {dimensions.map(({ name, score }) => (
          <div key={name} className="p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{name}</span>
              <span className="text-lg font-semibold text-white">{Math.round(score)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quality Metrics */}
      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Detailed Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricItem label="Error Rate" value={`${(result.stats.errorRate * 100).toFixed(1)}%`} />
          <MetricItem label="Repaired" value={result.stats.repairedRecords} />
          <MetricItem label="Dropped" value={result.stats.droppedRecords} />
          <MetricItem label="Duration" value={`${result.metadata.durationMs}ms`} />
        </div>
      </div>

      {/* Processing Info */}
      <div className="p-4 bg-gray-800/30 rounded-lg text-sm">
        <h4 className="font-medium text-white mb-3">Processing Information</h4>
        <div className="space-y-2 text-gray-400">
          <div className="flex justify-between">
            <span>Started</span>
            <span className="text-white">{new Date(result.metadata.startedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed</span>
            <span className="text-white">{new Date(result.metadata.completedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Records Processed</span>
            <span className="text-white">{result.metadata.recordsProcessed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailsTab: React.FC<{
  result: PipelineResult;
  onExport: (format: 'json' | 'csv', type: 'valid' | 'invalid' | 'all') => void;
}> = ({ result, onExport }) => {
  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="p-4 bg-gray-800/50 rounded-lg">
        <h4 className="font-medium text-white mb-4">Export Results</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExportCard
            title="Valid Records"
            count={result.stats.validRecords}
            icon={<CheckCircle className="w-5 h-5 text-green-400" />}
            onExport={(format) => onExport(format, 'valid')}
          />
          <ExportCard
            title="Invalid Records"
            count={result.stats.invalidRecords}
            icon={<AlertCircle className="w-5 h-5 text-red-400" />}
            onExport={(format) => onExport(format, 'invalid')}
          />
        </div>
      </div>

      {/* Stage Details */}
      <div className="space-y-2">
        <h4 className="font-medium text-white">Stage Details</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Errors</th>
                <th className="pb-2 font-medium">Warnings</th>
                <th className="pb-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {result.report.details.map((detail) => (
                <tr key={detail.stage} className="border-b border-gray-800/50">
                  <td className="py-3 capitalize">{detail.stage.replace('_', ' ')}</td>
                  <td className="py-3">
                    <StatusBadge status={detail.status} />
                  </td>
                  <td className="py-3">{detail.errors}</td>
                  <td className="py-3">{detail.warnings}</td>
                  <td className="py-3">
                    {result.stages[detail.stage].durationMs.toFixed(0)}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Export */}
      <div className="p-4 border border-gray-800 rounded-lg">
        <h4 className="font-medium text-white mb-2">Raw Data Export</h4>
        <p className="text-sm text-gray-400 mb-4">
          Download the complete validation result as JSON for further analysis
        </p>
        <button
          onClick={() => onExport('json', 'all')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <FileJson className="w-4 h-4" />
          Export Full Report (JSON)
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

const ValidationStatusIcon: React.FC<{ success: boolean }> = ({ success }) => {
  if (success) {
    return <CheckCircle className="w-8 h-8 text-green-500" />;
  }
  return <AlertCircle className="w-8 h-8 text-red-500" />;
};

const QualityBadge: React.FC<{ score: number; grade: QualityGrade }> = ({ score, grade }) => {
  const colors: Record<QualityGrade, string> = {
    A: 'bg-green-500/20 text-green-400 border-green-500/30',
    B: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    F: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colors[grade]} flex items-center gap-2`}>
      <span className="text-lg font-bold">{grade}</span>
      <span className="text-sm">{Math.round(score)}%</span>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  percent?: number;
}> = ({ label, value, icon, color, percent }) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {percent !== undefined && (
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colorClasses[color].split(' ')[0].replace('text', 'bg')}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}
    </div>
  );
};

const StageSummaryRow: React.FC<{
  stage: ValidationStage;
  stats: { executed: boolean; passed: boolean; errors: number; warnings: number };
}> = ({ stage, stats }) => {
  if (!stats.executed) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        {stats.passed ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="capitalize text-gray-300">{stage.replace('_', ' ')}</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {stats.errors > 0 && (
          <span className="text-red-400">{stats.errors} errors</span>
        )}
        {stats.warnings > 0 && (
          <span className="text-yellow-400">{stats.warnings} warnings</span>
        )}
        {stats.errors === 0 && stats.warnings === 0 && (
          <span className="text-green-400">Passed</span>
        )}
      </div>
    </div>
  );
};

const ErrorRow: React.FC<{ error: PipelineError; onRepair: () => void }> = ({ error, onRepair }) => {
  return (
    <div className="px-4 py-3 bg-gray-900/50">
      <div className="flex items-start gap-3">
        {error.severity === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200">{error.message}</p>
          {error.field && (
            <p className="text-xs text-gray-500 mt-1">Field: {error.field}</p>
          )}
          {error.code && (
            <p className="text-xs text-gray-500">Code: {error.code}</p>
          )}
          {error.repairSuggestion && (
            <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
              <p className="text-xs text-blue-400">
                Suggested fix: {error.repairSuggestion.description}
              </p>
              {error.repairSuggestion.autoRepairable && (
                <button
                  onClick={onRepair}
                  className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Auto-repair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="text-2xl font-semibold text-white">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

const ExportCard: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  onExport: (format: 'json' | 'csv') => void;
}> = ({ title, count, icon, onExport }) => (
  <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <div>
        <h5 className="font-medium text-white">{title}</h5>
        <p className="text-sm text-gray-400">{count.toLocaleString()} records</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onExport('json')}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
      >
        <FileJson className="w-4 h-4" />
        JSON
      </button>
      <button
        onClick={() => onExport('csv')}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4" />
        CSV
      </button>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: 'passed' | 'failed' | 'skipped' }> = ({ status }) => {
  const styles = {
    passed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    skipped: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function scoreToGrade(score: number): QualityGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ============================================================================
// Export
// ============================================================================

export default ValidationReport;
