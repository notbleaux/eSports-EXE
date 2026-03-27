/**
 * Match History Component
 *
 * Displays historical match data with filtering, sorting, and pagination.
 * Integrates with TanStack Query for server state management.
 *
 * [Ver002.000]
 */

import { useState, useMemo } from 'react';
import { useMatchHistory } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface MatchHistoryProps {
  game?: string;
  limit?: number;
}

export function MatchHistory({ game, limit = 50 }: MatchHistoryProps) {
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');

  const { data, isLoading, error } = useMatchHistory(game, limit, offset);
  const matches = data?.matches || [];
  const total = data?.total || 0;

  const sortedMatches = useMemo(() => {
    const sorted = [...matches];
    if (sortBy === 'confidence') {
      sorted.sort((a, b) => b.confidence - a.confidence);
    }
    return sorted;
  }, [matches, sortBy]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Match History</h2>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'confidence')}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-white/30"
          >
            <option value="date">Sort by Date</option>
            <option value="confidence">Sort by Confidence</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg text-red-400 text-sm">
          Failed to load match history
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="text-center py-8 text-white/50">No matches found</div>
      ) : (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {sortedMatches.map((match, idx) => (
            <motion.div
              key={match.match_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="p-3 border border-white/10 bg-white/[0.02] rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-mono text-white/70">{match.match_id}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {match.game} • {new Date(match.updated_at * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-white/50">Confidence</p>
                    <p className={`text-sm font-bold ${
                      match.confidence >= 0.85 ? 'text-green-400' :
                      match.confidence >= 0.5 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {(match.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    match.confidence >= 0.85 ? 'bg-green-400' :
                    match.confidence >= 0.5 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && sortedMatches.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-xs text-white/50">
            Page {currentPage} of {totalPages} • {total} total matches
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={offset === 0}
              className="p-2 border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white/50" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={offset + limit >= total}
              className="p-2 border border-white/10 rounded hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
