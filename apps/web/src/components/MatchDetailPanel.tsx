// @ts-nocheck
/**
 * Match Detail Panel Component
 *
 * Displays detailed information about a specific match including history and metadata.
 * Integrates with TanStack Query for server state management.
 *
 * [Ver001.000]
 */

import { useMatchData, useMatchHistoryDetail } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface MatchDetailPanelProps {
  matchId: string;
  onClose?: () => void;
}

export function MatchDetailPanel({ matchId, onClose }: MatchDetailPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    history: false,
    metadata: false,
  });

  const { data: matchData, isLoading: matchLoading, error: matchError } = useMatchData(matchId);
  const { data: historyData, isLoading: historyLoading, error: historyError } = useMatchHistoryDetail(matchId);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (
    title: string,
    key: string,
    content: React.ReactNode,
    isLoading: boolean,
    error: any
  ) => (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(key)}
        className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-between transition-colors"
      >
        <h3 className="font-bold text-white">{title}</h3>
        <motion.div
          animate={{ rotate: expandedSections[key] ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/50" />
        </motion.div>
      </button>

      {expandedSections[key] && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 p-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">Failed to load data</span>
            </div>
          ) : (
            content
          )}
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Match Details</h2>
        <div className="text-sm text-white/50 font-mono">{matchId}</div>
      </div>

      {/* Match Details Section */}
      {renderSection(
        'Match Overview',
        'details',
        matchData ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Status</p>
                <p className={`text-sm font-bold ${
                  matchData.status === 'live' ? 'text-red-400' :
                  matchData.status === 'upcoming' ? 'text-yellow-400' :
                  'text-white/70'
                }`}>
                  {matchData.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Confidence</p>
                <p className={`text-sm font-bold ${
                  matchData.confidence >= 0.85 ? 'text-green-400' :
                  matchData.confidence >= 0.7 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {(matchData.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {matchData.team1_name && matchData.team2_name && (
              <div className="p-3 bg-white/[0.03] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{matchData.team1_name}</span>
                  <span className="text-lg font-bold text-white">
                    {matchData.team1_score ?? '?'}
                  </span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{matchData.team2_name}</span>
                  <span className="text-lg font-bold text-white">
                    {matchData.team2_score ?? '?'}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/50">
                Updated {new Date(matchData.updated_at * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-white/50 text-sm">No match data available</div>
        ),
        matchLoading,
        matchError
      )}

      {/* History Section */}
      {renderSection(
        'Historical Data',
        'history',
        historyData ? (
          <div className="space-y-3">
            {historyData.history && historyData.history.length > 0 ? (
              <div className="space-y-2">
                {historyData.history.slice(0, 5).map((entry: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-white/[0.03]">
                    <span className="text-white/50">
                      {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span className="text-white/70">{entry.event}</span>
                  </div>
                ))}
                {historyData.history.length > 5 && (
                  <p className="text-xs text-white/40 pt-2">+{historyData.history.length - 5} more events</p>
                )}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No historical data available</p>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-sm">No history available</p>
        ),
        historyLoading,
        historyError
      )}

      {/* Metadata Section */}
      {renderSection(
        'Metadata',
        'metadata',
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Game</span>
            <span className="text-white/70 font-mono">{matchData?.game}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Source</span>
            <span className="text-white/70 font-mono">{matchData?.source}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Match ID</span>
            <span className="text-white/70 font-mono text-right">{matchData?.match_id}</span>
          </div>
        </div>,
        false,
        null
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/5 transition-colors"
        >
          Close
        </button>
      )}
    </motion.div>
  );
}
