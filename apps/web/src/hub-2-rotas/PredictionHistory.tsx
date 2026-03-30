/**
 * Prediction History - List view of recent ML predictions
 * Displays prediction records with filtering, sorting, and pagination
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import {
  usePredictionHistoryStore,
  PredictionResult,
  PredictionFilters,
} from '@/store/predictionHistoryStore';

const ITEMS_PER_PAGE = 50;

type SortField = 'timestamp' | 'confidence' | 'latency';
type SortDirection = 'asc' | 'desc';

/**
 * Confidence badge component
 */
interface ConfidenceBadgeProps {
  confidence: number;
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let color = colors.status.error;
  let Icon = AlertCircle;
  let label = 'Low';

  if (confidence >= 0.95) {
    color = colors.status.success;
    Icon = CheckCircle2;
    label = 'Very High';
  } else if (confidence >= 0.8) {
    color = colors.status.success;
    Icon = CheckCircle2;
    label = 'High';
  } else if (confidence >= 0.5) {
    color = colors.status.warning;
    Icon = Target;
    label = 'Medium';
  }

  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-sm font-medium" style={{ color }}>
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * Sort button component
 */
interface SortButtonProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortButton({ field, currentField, direction, onSort, children }: SortButtonProps) {
  const isActive = field === currentField;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ color: isActive ? colors.text.primary : colors.text.muted }}
    >
      {children}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

/**
 * Main Prediction History component
 */
interface PredictionHistoryProps {
  color?: string;
  glow?: string;
  muted?: string;
}

function PredictionHistory({
  color = colors.hub.rotas,
  glow = 'rgba(255, 68, 68, 0.4)',
  muted = '#cc3333',
}: PredictionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { predictions, filterPredictions, exportToCSV, exportToJSON } =
    usePredictionHistoryStore();

  // Get unique model IDs
  const availableModels = useMemo(() => {
    const modelSet = new Set(predictions.map((p) => p.modelId));
    return Array.from(modelSet).sort();
  }, [predictions]);

  // Apply filters
  const filteredPredictions = useMemo(() => {
    const filters: PredictionFilters = {
      query: searchQuery || undefined,
      modelId: selectedModel !== 'all' ? selectedModel : undefined,
      minConfidence: typeof confidenceFilter === 'number' ? confidenceFilter : undefined,
    };
    return filterPredictions(filters);
  }, [filterPredictions, searchQuery, selectedModel, confidenceFilter]);

  // Apply sorting
  const sortedPredictions = useMemo(() => {
    const sorted = [...filteredPredictions];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'latency':
          comparison = a.latencyMs - b.latencyMs;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredPredictions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedPredictions.length / ITEMS_PER_PAGE);
  const paginatedPredictions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPredictions.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPredictions, currentPage]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Export handlers
  const handleExport = (format: 'csv' | 'json') => {
    const data = format === 'csv' ? exportToCSV() : exportToJSON();
    const blob = new Blob([data], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-history-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <GlassCard hoverGlow={glow} className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <History className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Prediction History
            </h2>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              {filteredPredictions.length.toLocaleString()} predictions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
            <input
              type="text"
              placeholder="Search predictions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/20 transition-colors w-48"
              style={{ color: colors.text.primary }}
            />
          </div>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: colors.text.secondary }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-white/5">
        <Filter className="w-4 h-4" style={{ color: colors.text.muted }} />
        
        {/* Model filter */}
        <select
          value={selectedModel}
          onChange={(e) => {
            setSelectedModel(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/20"
          style={{ color: colors.text.secondary }}
        >
          <option value="all">All Models</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>

        {/* Confidence filter */}
        <select
          value={confidenceFilter}
          onChange={(e) => {
            setConfidenceFilter(e.target.value === 'all' ? 'all' : parseFloat(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/20"
          style={{ color: colors.text.secondary }}
        >
          <option value="all">All Confidence</option>
          <option value={0.95}>{'>'}95%</option>
          <option value={0.9}>{'>'}90%</option>
          <option value={0.8}>{'>'}80%</option>
          <option value={0.5}>{'>'}50%</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4">
                <SortButton
                  field="timestamp"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                    Timestamp
                  </span>
                </SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                  Model
                </span>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton
                  field="confidence"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                    Confidence
                  </span>
                </SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton
                  field="latency"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                    Latency
                  </span>
                </SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                  Accuracy
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPredictions.length > 0 ? (
              paginatedPredictions.map((prediction, index) => (
                <motion.tr
                  key={prediction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        {formatTimestamp(prediction.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        {prediction.modelId}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ConfidenceBadge confidence={prediction.confidence} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        {prediction.latencyMs.toFixed(0)}ms
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {prediction.accuracy !== undefined ? (
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            prediction.accuracy >= 0.9
                              ? colors.status.success
                              : prediction.accuracy >= 0.7
                              ? colors.status.warning
                              : colors.status.error,
                        }}
                      >
                        {(prediction.accuracy * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: colors.text.muted }}>
                        —
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center"
                  style={{ color: colors.text.muted }}
                >
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No predictions found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your filters or search query
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedPredictions.length)} of{' '}
            {sortedPredictions.length} predictions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              style={{ color: colors.text.secondary }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm" style={{ color: colors.text.secondary }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              style={{ color: colors.text.secondary }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default PredictionHistory;
