/**
 * PlayerCompare Component
 * Side-by-side SimRating comparison panel for up to 3 players.
 * [Ver001.000]
 */
// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Plus, X } from 'lucide-react';
import { usePlayerSimRating } from '@/shared/api/hooks';
import { usePlayers } from '@/shared/api/hooks';
import type { Player } from '@sator/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SATOR_GOLD = '#ffd700';

const GRADE_COLOR: Record<string, string> = {
  S: '#ffd700', A: '#22c55e', B: '#3b82f6',
  C: '#f59e0b', D: '#ef4444', F: '#6b7280',
};

const COMPARE_COLORS = ['#ffd700', '#00d4ff', '#9d4edd'] as const;

// ============================================================================
// SINGLE PLAYER SLOT
// ============================================================================

interface PlayerSlotProps {
  playerId: number | null;
  color: string;
  onRemove: () => void;
}

function PlayerSlotData({ playerId, color }: { playerId: number; color: string }): JSX.Element {
  const { data: rd, isLoading } = usePlayerSimRating(playerId);

  if (isLoading) return <p className="text-xs text-gray-500 text-center py-2">Loading...</p>;
  if (!rd) return <p className="text-xs text-gray-600 text-center py-2">No data</p>;

  const grade = (rd as { grade?: string }).grade ?? '?';
  const source = (rd as { source?: string }).source;
  const components = (rd as { components?: Record<string, number> }).components;
  const kd = components?.kd_score != null ? (components.kd_score / 25 * 2).toFixed(2) : '--';
  const acs = components?.acs_score != null ? Math.round(components.acs_score / 25 * 300) : '--';

  return (
    <div className="text-center">
      <div
        className="text-2xl font-bold"
        style={{ color }}
      >
        {rd.simrating != null ? rd.simrating.toFixed(1) : '--'}
      </div>
      <div className="text-lg font-semibold" style={{ color: GRADE_COLOR[grade] ?? '#6b7280' }}>
        {grade}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>K/D</span><span className="font-mono">{kd}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>ACS</span><span className="font-mono">{acs}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Source</span>
          <span style={{ color: source === 'v2_stats' ? '#22c55e' : '#6b7280' }}>
            {source === 'v2_stats' ? 'v2' : 'est.'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER PICKER DROPDOWN
// ============================================================================

interface PlayerPickerProps {
  onSelect: (player: Player) => void;
  excludeIds: number[];
}

function PlayerPicker({ onSelect, excludeIds }: PlayerPickerProps): JSX.Element {
  const [query, setQuery] = useState('');
  const { data, isLoading } = usePlayers('valorant');
  const players = (data?.players ?? []).filter(
    p => !excludeIds.includes(p.id) &&
         (query === '' || p.handle.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 8);

  return (
    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-lg overflow-hidden shadow-xl">
      <div className="p-2 border-b border-white/5">
        <input
          autoFocus
          type="text"
          placeholder="Search player..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none"
        />
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-500 p-3">Loading...</p>
      ) : players.length === 0 ? (
        <p className="text-xs text-gray-600 p-3">No results</p>
      ) : (
        <div className="max-h-40 overflow-y-auto">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
            >
              {p.handle}
              <span className="ml-2 text-gray-600">{p.game}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerCompare(): JSX.Element {
  const [slots, setSlots] = useState<(Player | null)[]>([null, null, null]);
  const [picking, setPicking] = useState<number | null>(null);

  const addSlot = (idx: number, player: Player) => {
    setSlots(prev => prev.map((s, i) => (i === idx ? player : s)));
    setPicking(null);
  };

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.map((s, i) => (i === idx ? null : s)));
  };

  const filledSlots = slots.filter(Boolean).length;

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitCompare className="w-4 h-4" style={{ color: SATOR_GOLD }} />
        <h3 className="text-sm font-semibold" style={{ color: SATOR_GOLD }}>
          Player Compare
        </h3>
        <span className="text-[10px] text-gray-600 ml-auto">
          {filledSlots}/3 selected
        </span>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((player, idx) => {
          const color = COMPARE_COLORS[idx];
          return (
            <div key={idx} className="relative">
              <div
                className="rounded-lg p-2 min-h-[120px] flex flex-col"
                style={{
                  border: `1px solid ${player ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                  backgroundColor: player ? `${color}08` : 'rgba(255,255,255,0.02)',
                }}
              >
                {player ? (
                  <>
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold truncate" style={{ color }}>
                        {player.handle}
                      </span>
                      <button
                        onClick={() => removeSlot(idx)}
                        className="shrink-0 ml-1 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <PlayerSlotData playerId={player.id} color={color} />
                  </>
                ) : (
                  <button
                    onClick={() => setPicking(idx)}
                    className="flex flex-col items-center justify-center h-full gap-1 w-full text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px]">Add</span>
                  </button>
                )}
              </div>

              {/* Picker dropdown */}
              <AnimatePresence>
                {picking === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    <PlayerPicker
                      onSelect={p => addSlot(idx, p)}
                      excludeIds={slots.filter(Boolean).map(s => (s as Player).id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Close picker on outside click */}
      {picking !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setPicking(null)}
        />
      )}

      {filledSlots < 2 && (
        <p className="text-[10px] text-gray-600 text-center">
          Add at least 2 players to compare
        </p>
      )}
    </div>
  );
}
