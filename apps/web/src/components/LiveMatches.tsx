/**
 * Live Matches Component
 *
 * Real-time match display with WebSocket integration and confidence scoring.
 * Integrates with TanStack Query for server state management.
 *
 * [Ver002.000]
 */

import { useMemo } from 'react';
import { useLiveMatches, type LiveMatch } from '@/lib/api-client';
import { useWebSocket as useWebSocketHook } from '@/lib/websocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface LiveMatchesProps {
  game?: string;
  compact?: boolean;
}

export function LiveMatches({ game, compact = false }: LiveMatchesProps) {
  const { data, isLoading, error } = useLiveMatches(game);
  const matches = data?.matches || [];

  // WebSocket connection for real-time updates
  const wsMessage = useWebSocketHook(null, {
    reconnectDelay: 3000,
    maxReconnectAttempts: 5,
  });

  // Filter high-priority matches (low confidence)
  const highPriorityMatches = useMemo(() => {
    return matches.filter((m: LiveMatch) => m.confidence < 0.7);
  }, [matches]);

  const stableMatches = useMemo(() => {
    return matches.filter((m: LiveMatch) => m.confidence >= 0.7);
  }, [matches]);

  const renderMatch = (match: LiveMatch) => (
    <motion.div
      key={match.match_id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-4 border rounded-lg transition-colors ${
        match.confidence < 0.7
          ? 'border-yellow-500/30 bg-yellow-500/[0.05]'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-kunst-green" />
            <h3 className="font-bold text-white text-sm">{match.match_id}</h3>
          </div>
          <p className="text-xs text-white/50">{match.game}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">Confidence</p>
          <p className={`font-bold ${
            match.confidence >= 0.85 ? 'text-green-400' :
            match.confidence >= 0.7 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {(match.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Match Details */}
      {match.team1_name && match.team2_name && (
        <div className="flex items-center justify-between mb-3 px-2 py-2 bg-white/[0.03] rounded">
          <div className="text-xs text-white/70 font-mono">{match.team1_name}</div>
          <div className="text-white/50 text-xs font-bold">
            {match.team1_score ?? '?'} - {match.team2_score ?? '?'}
          </div>
          <div className="text-xs text-white/70 font-mono">{match.team2_name}</div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded font-mono ${
          match.status === 'live'
            ? 'bg-red-500/20 text-red-400'
            : match.status === 'upcoming'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-white/10 text-white/50'
        }`}>
          {match.status.toUpperCase()}
        </span>
        <span className="text-white/40">{match.source}</span>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="space-y-2 text-center">
          <Activity className="w-5 h-5 mx-auto text-white/40 animate-pulse" />
          <p className="text-xs text-white/40">Loading live matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-400">Failed to load matches</p>
          <p className="text-xs text-red-400/70">Check your connection and try again</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p className="text-sm">No live matches at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Live Matches</h2>
        <div className="flex items-center gap-2 text-xs text-white/50">
          {wsMessage.isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-400" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-white/30" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* High Priority Matches */}
      {highPriorityMatches.length > 0 && !compact && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">
            ⚠ Requiring Review ({highPriorityMatches.length})
          </p>
          <AnimatePresence>
            {highPriorityMatches.map(renderMatch)}
          </AnimatePresence>
        </div>
      )}

      {/* All Matches or Stable Matches */}
      <div className="space-y-2">
        {!compact && stableMatches.length > 0 && (
          <p className="text-xs font-bold text-white/50 uppercase tracking-wide">
            Active Matches
          </p>
        )}
        <AnimatePresence>
          {(compact ? matches : stableMatches).map(renderMatch)}
        </AnimatePresence>
      </div>
    </div>
  );
}
