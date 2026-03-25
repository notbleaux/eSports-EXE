/**
 * TopPerformers Component
 * Shows top 5 players by SimRating for a selected game.
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useSimRatingLeaderboard } from '@/shared/api/hooks';

// ============================================================================
// CONSTANTS
// ============================================================================

const SATOR_GOLD = '#ffd700';
const SATOR_GLOW = 'rgba(255,215,0,0.35)';

const GRADE_COLOR: Record<string, string> = {
  S: '#ffd700', A: '#22c55e', B: '#3b82f6',
  C: '#f59e0b', D: '#ef4444', F: '#6b7280',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ============================================================================
// COMPONENT
// ============================================================================

export default function TopPerformers(): JSX.Element {
  const [game, setGame] = useState<'valorant' | 'cs2' | undefined>(undefined);
  const { data: lb, isLoading } = useSimRatingLeaderboard(game);

  const top5 = (lb ?? []).slice(0, 5);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: SATOR_GOLD }} />
          <h3 className="text-sm font-semibold" style={{ color: SATOR_GOLD }}>
            Top Performers
          </h3>
        </div>

        {/* Game filter */}
        <div className="flex gap-1">
          {([undefined, 'valorant', 'cs2'] as const).map(g => (
            <button
              key={String(g)}
              onClick={() => setGame(g)}
              className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
              style={{
                backgroundColor: game === g ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
                color: game === g ? SATOR_GOLD : '#9ca3af',
                border: `1px solid ${game === g ? SATOR_GOLD : 'transparent'}`,
              }}
            >
              {g == null ? 'All' : g === 'valorant' ? 'VCT' : 'CS2'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading...</p>
      ) : top5.length === 0 ? (
        <p className="text-xs text-gray-600">No data — run sync_pandascore.py to seed.</p>
      ) : (
        <div className="space-y-2">
          {top5.map((p, i) => (
            <motion.div
              key={p.player_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{
                backgroundColor: i === 0 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.25)' : 'transparent'}`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm w-5 shrink-0">
                  {RANK_MEDAL[i + 1] ?? <span className="text-gray-600 text-xs">{i + 1}</span>}
                </span>
                <Link
                  to={`/player/${p.player_slug}`}
                  className="text-xs truncate hover:underline"
                  style={{ color: i === 0 ? SATOR_GOLD : '#e5e7eb' }}
                >
                  {p.player_name}
                </Link>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {p.grade && (
                  <span className="text-[10px] font-bold" style={{ color: GRADE_COLOR[p.grade] ?? '#6b7280' }}>
                    {p.grade}
                  </span>
                )}
                <span className="text-xs font-mono" style={{ color: SATOR_GOLD }}>
                  {p.simrating?.toFixed(1)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer CTA */}
      <Link
        to="/stats"
        className="block text-center text-[10px] py-1.5 rounded transition-colors"
        style={{
          color: '#9ca3af',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 0 8px ${SATOR_GLOW}`,
        }}
      >
        Full leaderboard → ROTAS
      </Link>
    </div>
  );
}
