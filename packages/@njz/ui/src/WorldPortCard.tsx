import React from 'react';

/**
 * WorldPortCard
 * Displays a single World-Port (game) entry in the TeNET Directory.
 * [Ver001.000]
 */

export interface WorldPortCardProps {
  id: string;
  displayName: string;
  game: string;
  isActive: boolean;
  nodeCount: number;
  lastUpdated: string;
  route: string;
  onClick?: () => void;
  className?: string;
}

const GAME_ACCENT: Record<string, { border: string; glow: string; badge: string }> = {
  valorant: {
    border: 'border-[#ff4655]/40',
    glow: 'hover:shadow-[0_0_20px_rgba(255,70,85,0.25)]',
    badge: 'bg-[#ff4655]/10 text-[#ff4655]',
  },
  cs2: {
    border: 'border-[#f0a500]/40',
    glow: 'hover:shadow-[0_0_20px_rgba(240,165,0,0.25)]',
    badge: 'bg-[#f0a500]/10 text-[#f0a500]',
  },
};

const DEFAULT_ACCENT = {
  border: 'border-white/10',
  glow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]',
  badge: 'bg-white/10 text-white/50',
};

export function WorldPortCard({
  displayName,
  game,
  isActive,
  nodeCount,
  lastUpdated,
  onClick,
  className = '',
}: WorldPortCardProps) {
  const accent = GAME_ACCENT[game] ?? DEFAULT_ACCENT;

  return (
    <button
      onClick={onClick}
      disabled={!isActive}
      className={[
        'group w-full text-left p-6 rounded-none border bg-white/[0.02]',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
        accent.border,
        isActive ? `cursor-pointer ${accent.glow}` : 'cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {/* Game name */}
      <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">
        {displayName}
      </h3>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={[
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm',
            accent.badge,
          ].join(' ')}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current animate-pulse' : 'bg-current opacity-40'}`}
          />
          {isActive ? 'ACTIVE' : 'PENDING RELEASE'}
        </span>
      </div>

      {/* Stats */}
      {isActive && (
        <div className="space-y-1">
          <p className="text-xs font-mono text-white/40">
            <span className="text-white/70">{nodeCount.toLocaleString()}</span> nodes
          </p>
          <p className="text-xs font-mono text-white/30">Updated {lastUpdated}</p>
        </div>
      )}

      {/* Enter arrow */}
      {isActive && (
        <div className="mt-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white/20 group-hover:text-white/60 transition-colors">
          ENTER WORLD →
        </div>
      )}
    </button>
  );
}
