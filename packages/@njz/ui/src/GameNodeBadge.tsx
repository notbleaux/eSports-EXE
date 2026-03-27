import React from 'react';

/**
 * GameNodeBadge
 * Compact identifier badge showing game and node context.
 * Used in breadcrumbs, cards, and status bars.
 * [Ver001.000]
 */

export interface GameNodeBadgeProps {
  gameId: string;
  nodeId?: string;
  verified?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const GAME_LABEL: Record<string, string> = {
  valorant: 'VLR',
  cs2: 'CS2',
  lol: 'LOL',
  apex: 'APEX',
};

export function GameNodeBadge({
  gameId,
  nodeId,
  verified = false,
  size = 'sm',
  className = '',
}: GameNodeBadgeProps) {
  const label = GAME_LABEL[gameId] ?? gameId.toUpperCase().slice(0, 4);
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-widest',
        'px-2 py-0.5 border border-white/10 bg-white/[0.04] rounded-sm',
        textSize,
        'text-white/50',
        className,
      ].join(' ')}
      title={`GameNodeID: ${gameId}${nodeId ? `/${nodeId}` : ''}`}
    >
      <span className="text-white/70">{label}</span>
      {nodeId && (
        <>
          <span className="text-white/20">/</span>
          <span className="text-white/50">{nodeId}</span>
        </>
      )}
      {verified && (
        <span className="w-1 h-1 rounded-full bg-[#00d4ff] ml-0.5" title="Verified node" />
      )}
    </span>
  );
}
