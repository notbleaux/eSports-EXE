// @ts-nocheck
/**
 * PredictionHistory Component
 * History of past predictions with stats and filtering
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target,
  Filter,
  TrendingUp,
  Calendar,
  ChevronRight,
  Trophy,
  Swords,
  Users
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { PredictionHistoryProps, PastPrediction, PredictionStats } from './types';
import { PURPLE } from './mockData';

type FilterType = 'all' | 'team' | 'player' | 'duel';
type ResultFilter = 'all' | 'correct' | 'incorrect' | 'pending';

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ 
  predictions, 
  onViewDetails 
}) => {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Calculate stats
  const stats: PredictionStats = useMemo(() => {
    const filtered = filteredPredictions;
    const correct = filtered.filter(p => p.wasCorrect === true).length;
    const total = filtered.length;
    const confidenceSum = filtered.reduce((sum, p) => sum + p.confidence, 0);
    
    return {
      totalPredictions: total,
      correctPredictions: correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      averageConfidence: total > 0 ? confidenceSum / total : 0,
      byType: {
        team: {
          total: filtered.filter(p => p.type === 'team').length,
          correct: filtered.filter(p => p.type === 'team' && p.wasCorrect).length,
        },
        player: {
          total: filtered.filter(p => p.type === 'player').length,
          correct: filtered.filter(p => p.type === 'player' && p.wasCorrect).length,
        },
        duel: {
          total: filtered.filter(p => p.type === 'duel').length,
          correct: filtered.filter(p => p.type === 'duel' && p.wasCorrect).length,
        },
      },
    };
  }, [predictions]);

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter(prediction => {
      // Type filter
      if (typeFilter !== 'all' && prediction.type !== typeFilter) return false;
      
      // Result filter
      if (resultFilter === 'correct' && prediction.wasCorrect !== true) return false;
      if (resultFilter === 'incorrect' && prediction.wasCorrect !== false) return false;
      if (resultFilter === 'pending' && prediction.actual !== undefined) return false;
      
      // Date filter
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(prediction.date) < cutoff) return false;
      }
      
      return true;
    });
  }, [predictions, typeFilter, resultFilter, dateRange]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'team': return Trophy;
      case 'player': return Users;
      case 'duel': return Swords;
      default: return Target;
    }
  };

  // Get result icon and color
  const getResultDisplay = (prediction: PastPrediction) => {
    if (prediction.actual === undefined) {
      return { icon: Clock, color: '#64748b', label: 'Pending' };
    }
    if (prediction.wasCorrect) {
      return { icon: CheckCircle2, color: '#22c55e', label: 'Correct' };
    }
    return { icon: XCircle, color: '#ef4444', label: 'Incorrect' };
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: PURPLE.base }}>
            {stats.totalPredictions}
          </div>
          <div className="text-xs opacity-60">Total</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className={`text-2xl font-bold ${stats.accuracy >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
            {stats.accuracy.toFixed(1)}%
          </div>
          <div className="text-xs opacity-60">Accuracy</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.correctPredictions}
          </div>
          <div className="text-xs opacity-60">Correct</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {stats.averageConfidence.toFixed(0)}%
          </div>
          <div className="text-xs opacity-60">Avg Confidence</div>
        </GlassCard>
      </div>

      {/* Type Breakdown */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: PURPLE.base }}>
          <TrendingUp className="w-4 h-4" />
          By Prediction Type
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['team', 'player', 'duel'] as const).map((type) => {
            const typeStats = stats.byType[type];
            const typeAccuracy = typeStats.total > 0 
              ? (typeStats.correct / typeStats.total) * 100 
              : 0;
            const Icon = getTypeIcon(type);
            
            return (
              <div key={type} className="bg-white/5 rounded-lg p-3 text-center">
                <Icon className="w-5 h-5 mx-auto mb-2 opacity-60" />
                <div className="text-lg font-bold">{typeStats.total}</div>
                <div className="text-xs opacity-60 capitalize">{type}</div>
                <div className={`text-xs mt-1 ${typeAccuracy >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {typeAccuracy.toFixed(0)}% acc
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" style={{ color: PURPLE.base }} />
          <span className="text-sm font-medium" style={{ color: PURPLE.base }}>Filters</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Types</option>
            <option value="team">Team</option>
            <option value="player">Player</option>
            <option value="duel">Duel</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Results</option>
            <option value="correct">Correct</option>
            <option value="incorrect">Incorrect</option>
            <option value="pending">Pending</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </GlassCard>

      {/* Predictions List */}
      <div className="space-y-2">
        {filteredPredictions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: PURPLE.base }} />
            <p className="text-sm opacity-60">No predictions found</p>
            <p className="text-xs opacity-40 mt-1">Try adjusting your filters</p>
          </GlassCard>
        ) : (
          filteredPredictions.map((prediction, index) => {
            const result = getResultDisplay(prediction);
            const ResultIcon = result.icon;
            const TypeIcon = getTypeIcon(prediction.type);

            return (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard 
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => onViewDetails(prediction.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Type Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${PURPLE.base}20` }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: PURPLE.base }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {prediction.teams[0]}
                        </span>
                        <span className="text-xs opacity-40">vs</span>
                        <span className="font-medium text-sm truncate">
                          {prediction.teams[1]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-60 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(prediction.date)}
                        <span>•</span>
                        <span className="capitalize">{prediction.type}</span>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="text-center hidden sm:block">
                      <div className="text-xs opacity-60">Confidence</div>
                      <div 
                        className="font-medium"
                        style={{ 
                          color: prediction.confidence >= 70 ? '#22c55e' : 
                                 prediction.confidence >= 50 ? '#eab308' : '#ef4444'
                        }}
                      >
                        {prediction.confidence}%
                      </div>
                    </div>

                    {/* Prediction */}
                    <div className="text-center hidden sm:block">
                      <div className="text-xs opacity-60">Predicted</div>
                      <div className="font-medium text-sm truncate max-w-20">
                        {prediction.predicted}
                      </div>
                    </div>

                    {/* Result */}
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ 
                        backgroundColor: `${result.color}20`,
                        color: result.color 
                      }}
                    >
                      <ResultIcon className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">{result.label}</span>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs opacity-50 text-center">
        Showing {filteredPredictions.length} of {predictions.length} predictions
      </div>
    </div>
  );
};

export default PredictionHistory;
