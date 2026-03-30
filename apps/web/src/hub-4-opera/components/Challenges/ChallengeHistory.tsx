/**
 * ChallengeHistory Component
 * Past challenges history with filtering
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Trophy,
  CheckCircle2,
  XCircle,
  Play,
  Zap,
  Brain,
  BarChart3,
  Filter,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { ChallengeHistoryProps, ChallengeAttempt, ChallengeType } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

// Type configurations
const TYPE_CONFIG: Record<ChallengeType, { icon: typeof Play; label: string; color: string }> = {
  video_quiz: { icon: Play, label: 'Video', color: '#ff4655' },
  prediction: { icon: Zap, label: 'Prediction', color: '#00d4ff' },
  stat_guess: { icon: BarChart3, label: 'Stat', color: '#00ff88' },
  trivia: { icon: Brain, label: 'Trivia', color: '#ffd700' },
};

type FilterType = 'all' | ChallengeType;
type ResultFilter = 'all' | 'correct' | 'incorrect';

export const ChallengeHistory: React.FC<ChallengeHistoryProps> = ({ attempts }) => {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter(attempt => {
      const typeMatch = typeFilter === 'all' || attempt.type === typeFilter;
      const resultMatch = resultFilter === 'all' || 
        (resultFilter === 'correct' && attempt.isCorrect) ||
        (resultFilter === 'incorrect' && !attempt.isCorrect);
      return typeMatch && resultMatch;
    });
  }, [attempts, typeFilter, resultFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    const totalTokens = attempts.reduce((sum, a) => sum + a.tokensEarned, 0);
    return {
      total,
      correct,
      incorrect: total - correct,
      successRate: total > 0 ? Math.round((correct / total) * 100) : 0,
      totalTokens,
    };
  }, [attempts]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <GlassCard className="p-6" hoverGlow={OPERA_GLOW}>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5" style={{ color: OPERA_COLOR }} />
          <h3 className="font-semibold text-white">Challenge History</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/50">Total Attempts</p>
          </div>
          
          <div className="p-4 rounded-xl bg-green-500/10">
            <p className="text-2xl font-bold text-green-400">{stats.correct}</p>
            <p className="text-xs text-white/50">Correct</p>
          </div>
          
          <div className="p-4 rounded-xl bg-red-500/10">
            <p className="text-2xl font-bold text-red-400">{stats.incorrect}</p>
            <p className="text-xs text-white/50">Incorrect</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
              {stats.successRate}%
            </p>
            <p className="text-xs text-white/50">Success Rate</p>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="mt-4 p-4 rounded-xl bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            <span className="text-white/70">Total Tokens Earned</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
            {stats.totalTokens.toLocaleString()}
          </span>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4" hoverGlow={OPERA_GLOW}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: OPERA_COLOR }} />
            <span className="font-medium text-white">Filters</span>
          </div>
          <ChevronDown 
            className={cn(
              'w-4 h-4 text-white/50 transition-transform',
              showFilters && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Type Filter */}
                <div>
                  <p className="text-xs text-white/50 mb-2">Challenge Type</p>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'video_quiz', 'prediction', 'stat_guess', 'trivia'] as FilterType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          typeFilter === type
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {type === 'all' ? 'All Types' : TYPE_CONFIG[type].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result Filter */}
                <div>
                  <p className="text-xs text-white/50 mb-2">Result</p>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'correct', 'incorrect'] as ResultFilter[]).map((result) => (
                      <button
                        key={result}
                        onClick={() => setResultFilter(result)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          resultFilter === result
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {result === 'all' ? 'All Results' : result === 'correct' ? 'Correct' : 'Incorrect'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* History List */}
      <div className="space-y-2">
        <p className="text-sm text-white/50 px-2">
          Showing {filteredAttempts.length} of {attempts.length} attempts
        </p>
        
        {filteredAttempts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-white/50">No challenges match your filters</p>
          </GlassCard>
        ) : (
          filteredAttempts.map((attempt, index) => {
            const typeConfig = TYPE_CONFIG[attempt.type];
            const TypeIcon = typeConfig.icon;
            
            return (
              <motion.div
                key={attempt.challengeId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Result Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        attempt.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                      )}
                    >
                      {attempt.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    {/* Challenge Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{attempt.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Calendar className="w-3 h-3" />
                        {formatDate(attempt.challengeDate)}
                        <span className="mx-1">•</span>
                        <TypeIcon className="w-3 h-3" style={{ color: typeConfig.color }} />
                        {typeConfig.label}
                      </div>
                    </div>

                    {/* Tokens */}
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-bold',
                          attempt.isCorrect ? 'text-green-400' : 'text-white/30'
                        )}
                      >
                        +{attempt.tokensEarned}
                      </p>
                      <p className="text-xs text-white/50">tokens</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChallengeHistory;
