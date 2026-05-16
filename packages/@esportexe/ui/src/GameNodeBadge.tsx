/**
 * GameNodeBadge
 * Compact identifier badge showing game and node context.
 * Used in breadcrumbs, cards, and status bars.
 * [Ver001.001] - Removed unused React import
 */

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
};

const SIZE_CLASSES: Record<string, { container: string; text: string; icon: string }> = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    text: 'text-[10px]',
    icon: 'w-2.5 h-2.5',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
};

export function GameNodeBadge({
  gameId,
  nodeId,
  verified = false,
  size = 'md',
  className = '',
}: GameNodeBadgeProps) {
  const gameLabel = GAME_LABEL[gameId] || gameId.toUpperCase().slice(0, 3);
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={`
        inline-flex items-center rounded font-mono font-semibold
        bg-black/60 border border-white/10 text-white/90
        ${sizeClasses.container}
        ${className}
      `}
      title={`${gameId}${nodeId ? ` / ${nodeId}` : ''}`}
    >
      <span className={sizeClasses.text}>{gameLabel}</span>
      {nodeId && (
        <>
          <span className="text-white/30">·</span>
          <span className={`${sizeClasses.text} text-white/70 truncate max-w-[80px]`}>
            {nodeId}
          </span>
        </>
      )}
      {verified && (
        <svg
          className={`${sizeClasses.icon} text-green-400`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );
}

export default GameNodeBadge;
