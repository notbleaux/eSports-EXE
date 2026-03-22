/**
 * VirtualPlayerGrid Component
 * High-performance virtualized player list using @tanstack/react-virtual
 * Renders only visible rows for smooth 60fps scrolling with 1000+ players
 * 
 * [Ver001.000]
 */
import React, { useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Trophy, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { colors } from '@/theme/colors';
import { GlassCard } from '@/components/ui/GlassCard';
// Player type definition (inline to avoid import issues)
interface Player {
  id: string;
  name: string;
  team?: string;
  nationality?: string;
  rating: number;
  acs: number;
  kda?: string;
  winRate: number;
  avatar?: string | null;
}

// Row height configuration - MUST match CSS
const ROW_HEIGHT = 40;
const OVERSCAN_COUNT = 5;

interface VirtualPlayerGridProps {
  /** Array of player data to display */
  players: Player[];
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
  /** Primary hub color for theming */
  hubColor?: string;
  /** Hub glow color for effects */
  hubGlow?: string;
  /** Hub muted color for secondary elements */
  hubMuted?: string;
  /** Callback when a player is clicked */
  onPlayerClick?: (player: Player, index: number) => void;
  /** Container height (default: 600px) */
  containerHeight?: number;
  /** Optional search query for highlighting */
  searchQuery?: string;
}

interface PlayerRowProps {
  player: Player;
  index: number;
  hubColor: string;
  hubGlow: string;
  hubMuted: string;
  onClick?: (player: Player, index: number) => void;
  searchQuery?: string;
  style: React.CSSProperties;
}

/**
 * Memoized individual player row component
 * Only re-renders when props change
 */
const PlayerRow = React.memo<PlayerRowProps>(function PlayerRow({
  player,
  index,
  hubColor,
  hubGlow,
  hubMuted,
  onClick,
  searchQuery,
  style,
}) {
  const {
    name = 'Unknown Player',
    team = 'Free Agent',
    rating = 0,
    acs = 0,
    winRate = 0,
    avatar,
  } = player;

  const rank = index + 1;

  // Rank colors for top 3
  const rankColors = useMemo(() => ({
    1: '#ffd700', // Gold
    2: '#c0c0c0', // Silver
    3: '#cd7f32', // Bronze
  }), []);

  const rankColor = rankColors[rank as keyof typeof rankColors] || hubMuted;

  // Highlight matching search terms
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  }, []);

  const handleClick = useCallback(() => {
    onClick?.(player, index);
  }, [onClick, player, index]);

  return (
    <div
      style={style}
      className="absolute left-0 right-0 px-4"
    >
      <div
        className="flex items-center gap-3 h-[36px] px-3 rounded-lg cursor-pointer transition-all duration-150 hover:scale-[1.01]"
        style={{
          backgroundColor: colors.porcelain.frost,
          border: `1px solid ${colors.border.subtle}`,
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = hubColor;
          e.currentTarget.style.boxShadow = `0 0 10px ${hubGlow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border.subtle;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Rank */}
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: `${rankColor}20`,
            color: rankColor,
            border: `1px solid ${rankColor}`,
          }}
        >
          {rank}
        </div>

        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ backgroundColor: colors.background.secondary }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="text-xs font-bold"
              style={{ color: hubColor }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Player Name */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium truncate block"
            style={{ color: colors.text.primary }}
          >
            {searchQuery ? highlightText(name, searchQuery) : name}
          </span>
        </div>

        {/* Team (hidden on small screens) */}
        <div className="hidden md:block w-24 flex-shrink-0">
          <span
            className="text-xs truncate block"
            style={{ color: colors.text.secondary }}
          >
            {team}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          {/* Rating */}
          <div className="flex items-center gap-1 w-14 justify-end">
            <Trophy className="w-3 h-3" style={{ color: hubColor }} />
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: hubColor }}
            >
              {rating.toFixed(2)}
            </span>
          </div>

          {/* ACS */}
          <div className="flex items-center gap-1 w-14 justify-end">
            <Zap className="w-3 h-3" style={{ color: hubColor }} />
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: hubColor }}
            >
              {Math.round(acs)}
            </span>
          </div>

          {/* Win Rate */}
          <div className="flex items-center gap-1 w-14 justify-end">
            <TrendingUp className="w-3 h-3" style={{ color: hubColor }} />
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: hubColor }}
            >
              {winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Mobile: Just rating */}
        <div className="sm:hidden flex-shrink-0">
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: hubColor }}
          >
            {rating.toFixed(1)}
          </span>
        </div>

        {/* Arrow */}
        <ChevronRight
          className="w-4 h-4 flex-shrink-0"
          style={{ color: hubMuted }}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.index === nextProps.index &&
    prevProps.hubColor === nextProps.hubColor &&
    prevProps.hubGlow === nextProps.hubGlow &&
    prevProps.hubMuted === nextProps.hubMuted &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.style.top === nextProps.style.top
  );
});

/**
 * VirtualPlayerGrid - High-performance virtualized player list
 * Uses @tanstack/react-virtual for 60fps scrolling with 1000+ items
 */
export const VirtualPlayerGrid: React.FC<VirtualPlayerGridProps> = ({
  players,
  isLoading = false,
  error = null,
  hubColor = colors.hub.sator.base,
  hubGlow = colors.hub.sator.glow,
  hubMuted = colors.hub.sator.muted,
  onPlayerClick,
  containerHeight = 600,
  searchQuery = '',
}) => {
  // Parent ref for the scroll container
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize the virtualizer
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN_COUNT,
    // Smooth scroll behavior
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0,
    // Performance: Don't measure dynamically
    measureElement: undefined,
  });

  // Get virtual items
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Memoized click handler
  const handlePlayerClick = useCallback((player: Player, index: number) => {
    onPlayerClick?.(player, index);
  }, [onPlayerClick]);

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-[200px]">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: hubColor, borderTopColor: 'transparent' }}
            />
            <span style={{ color: colors.text.secondary }}>
              Loading players...
            </span>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard className="p-6">
        <div
          className="p-4 rounded-lg text-center"
          style={{
            backgroundColor: 'rgba(255, 70, 85, 0.1)',
            color: colors.status.error,
          }}
        >
          {error}
        </div>
      </GlassCard>
    );
  }

  // Empty state
  if (players.length === 0) {
    return (
      <GlassCard className="p-6">
        <div
          className="text-center py-8"
          style={{ color: colors.text.secondary }}
        >
          No players found
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-3 pb-2 border-b border-white/10">
        <div className="w-6 text-center text-xs font-medium" style={{ color: colors.text.muted }}>
          #
        </div>
        <div className="flex-1 text-xs font-medium" style={{ color: colors.text.muted }}>
          Player
        </div>
        <div className="hidden md:block w-24 text-xs font-medium" style={{ color: colors.text.muted }}>
          Team
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>
            Rating
          </div>
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>
            ACS
          </div>
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>
            Win%
          </div>
        </div>
        <div className="w-4" />
      </div>

      {/* Virtual List Container */}
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        style={{
          height: containerHeight,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const player = players[virtualItem.index];
            if (!player) return null;

            return (
              <PlayerRow
                key={virtualItem.key}
                player={player}
                index={virtualItem.index}
                hubColor={hubColor}
                hubGlow={hubGlow}
                hubMuted={hubMuted}
                onClick={handlePlayerClick}
                searchQuery={searchQuery}
                style={{
                  height: `${virtualItem.size}px`,
                  top: `${virtualItem.start}px`,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Footer with count */}
      <div
        className="mt-3 pt-2 border-t border-white/10 text-center text-xs"
        style={{ color: colors.text.muted }}
      >
        Showing {players.length.toLocaleString()} players
        {virtualItems.length < players.length && (
          <span className="ml-2">
            (rendering {virtualItems.length} visible)
          </span>
        )}
      </div>
    </GlassCard>
  );
};

export default VirtualPlayerGrid;
