/**
 * GestureEnhancedPlayerGrid Component
 * VirtualPlayerGrid with pinch-to-zoom and pull-to-refresh
 * [Ver001.000]
 */
import React, { useRef, useCallback, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Trophy, TrendingUp, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import type { Player as BasePlayer } from '@sator/types';
import { colors } from '@/theme/colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePinch } from '@/hooks/gestures/usePinch';
import { useSwipe } from '@/hooks/gestures/useSwipe';
import { useLongPress } from '@/hooks/gestures/useLongPress';
import { cn } from '@/lib/utils';

// Extended Player type for gesture grid (augments base Player with display metrics)
interface Player extends BasePlayer {
  name: string;
  rating: number;
  acs: number;
  kda?: string;
  winRate: number;
  avatar?: string | null;
}

const ROW_HEIGHT = 40;
const OVERSCAN_COUNT = 5;
const PULL_THRESHOLD = 80;

interface GestureEnhancedPlayerGridProps {
  players: Player[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  hubColor?: string;
  hubGlow?: string;
  hubMuted?: string;
  onPlayerClick?: (player: Player, index: number) => void;
  onPlayerLongPress?: (player: Player, index: number) => void;
  onRefresh?: () => void;
  containerHeight?: number;
  searchQuery?: string;
  enablePinchZoom?: boolean;
  enablePullToRefresh?: boolean;
  enableLongPress?: boolean;
}

interface PlayerRowProps {
  player: Player;
  index: number;
  hubColor: string;
  hubGlow: string;
  hubMuted: string;
  onClick?: (player: Player, index: number) => void;
  onLongPress?: (player: Player, index: number) => void;
  searchQuery?: string;
  style: React.CSSProperties;
  scale: number;
}

/**
 * Memoized individual player row component with gesture support
 */
const PlayerRow = React.memo<React.PropsWithChildren<PlayerRowProps>>(function PlayerRow({
  player,
  index,
  hubColor,
  hubGlow,
  hubMuted,
  onClick,
  onLongPress,
  searchQuery,
  style,
  scale,
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
  const [isPressed, setIsPressed] = useState(false);

  const rankColors = {
    1: '#ffd700',
    2: '#c0c0c0',
    3: '#cd7f32',
  };
  const rankColor = rankColors[rank as keyof typeof rankColors] || hubMuted;

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

  const { bind: longPressBind, state: longPressState } = useLongPress(
    () => {
      onLongPress?.(player, index);
    },
    () => setIsPressed(true),
    () => setIsPressed(false),
    { duration: 500, moveThreshold: 10 }
  );

  const handleClick = useCallback(() => {
    if (!longPressState.isLongPressed) {
      onClick?.(player, index);
    }
  }, [onClick, player, index, longPressState.isLongPressed]);

  return (
    <div
      style={{
        ...style,
        transform: `scale(${scale})`,
        transformOrigin: 'left center',
      }}
      className="absolute left-0 right-0 px-4"
      {...longPressBind()}
    >
      <motion.div
        className={cn(
          "flex items-center gap-3 h-[36px] px-3 rounded-lg cursor-pointer transition-all duration-150",
          isPressed && "scale-[0.98]"
        )}
        style={{
          backgroundColor: colors.gray[100],
          border: `1px solid ${longPressState.isPressing ? hubColor : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: longPressState.isPressing ? `0 0 15px ${hubGlow}` : 'none',
        }}
        onClick={handleClick}
        whileHover={{ 
          borderColor: hubColor,
          boxShadow: `0 0 10px ${hubGlow}`,
        }}
        animate={{
          scale: longPressState.progress > 0 ? 1 - longPressState.progress * 0.02 : 1,
        }}
      >
        {/* Long press progress indicator */}
        {longPressState.isPressing && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 rounded-full"
            style={{ backgroundColor: hubColor }}
            initial={{ width: 0 }}
            animate={{ width: `${longPressState.progress * 100}%` }}
          />
        )}

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
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-bold" style={{ color: hubColor }}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Player Name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block" style={{ color: colors.text.primary }}>
            {searchQuery ? highlightText(name, searchQuery) : name}
          </span>
        </div>

        {/* Team */}
        <div className="hidden md:block w-24 flex-shrink-0">
          <span className="text-xs truncate block" style={{ color: colors.text.secondary }}>
            {team}
          </span>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 w-14 justify-end">
            <Trophy className="w-3 h-3" style={{ color: hubColor }} />
            <span className="text-xs font-mono font-semibold" style={{ color: hubColor }}>
              {rating.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1 w-14 justify-end">
            <Zap className="w-3 h-3" style={{ color: hubColor }} />
            <span className="text-xs font-mono font-semibold" style={{ color: hubColor }}>
              {Math.round(acs)}
            </span>
          </div>
          <div className="flex items-center gap-1 w-14 justify-end">
            <TrendingUp className="w-3 h-3" style={{ color: hubColor }} />
            <span className="text-xs font-mono font-semibold" style={{ color: hubColor }}>
              {winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Mobile rating */}
        <div className="sm:hidden flex-shrink-0">
          <span className="text-xs font-mono font-semibold" style={{ color: hubColor }}>
            {rating.toFixed(1)}
          </span>
        </div>

        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: hubMuted }} />
      </motion.div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.index === nextProps.index &&
    prevProps.hubColor === nextProps.hubColor &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.style.top === nextProps.style.top &&
    prevProps.scale === nextProps.scale
  );
});

/**
 * GestureEnhancedPlayerGrid - Virtualized player list with touch gestures
 */
export const GestureEnhancedPlayerGrid: React.FC<GestureEnhancedPlayerGridProps> = ({
  players,
  isLoading = false,
  isRefreshing = false,
  error = null,
  hubColor = colors.hub.sator,
  hubGlow = "rgba(0, 212, 255, 0.4)",
  hubMuted = "#0099cc",
  onPlayerClick,
  onPlayerLongPress,
  onRefresh,
  containerHeight = 600,
  searchQuery = '',
  enablePinchZoom = true,
  enablePullToRefresh = true,
  enableLongPress = true,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [gridScale, setGridScale] = useState(1);
  const [pullProgress, setPullProgress] = useState(0);

  // Pull to refresh setup
  const { bind: pullBind, state: pullState } = useSwipe(
    (direction) => {
      if (direction === 'down' && pullProgress >= 1 && onRefresh) {
        onRefresh();
      }
    },
    {
      threshold: PULL_THRESHOLD,
      velocityThreshold: 0.3,
      horizontal: false,
      vertical: true,
      preventDefault: false,
    }
  );

  // Update pull progress
  React.useEffect(() => {
    if (enablePullToRefresh && pullState.isSwiping && pullState.direction === 'down') {
      // Only allow pull when scrolled to top
      if (parentRef.current?.scrollTop === 0) {
        setPullProgress(Math.min(pullState.progress, 1));
      }
    } else {
      setPullProgress(0);
    }
  }, [pullState, enablePullToRefresh]);

  // Pinch zoom setup
  const { bind: pinchBind, scaleTo } = usePinch(
    (state) => {
      if (enablePinchZoom) {
        setGridScale(state.scale);
      }
    },
    {
      minScale: 0.7,
      maxScale: 1.5,
      sensitivity: 0.8,
      doubleTapReset: true,
    }
  );

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT * gridScale,
    overscan: OVERSCAN_COUNT,
    measureElement: undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Adjusted row height based on zoom
  const adjustedRowHeight = ROW_HEIGHT * gridScale;

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-[200px]">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: hubColor, borderTopColor: 'transparent' }}
            />
            <span style={{ color: colors.text.secondary }}>Loading players...</span>
          </div>
        </div>
      </GlassCard>
    );
  }

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

  return (
    <GlassCard className="p-4 relative overflow-hidden">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {enablePullToRefresh && pullProgress > 0 && (
          <motion.div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: pullProgress * 60 - 30,
            }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
              <motion.div
                animate={{ 
                  rotate: pullProgress >= 1 ? 180 : 0,
                  scale: pullProgress >= 1 ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <RefreshCw 
                  className={cn(
                    "w-5 h-5",
                    isRefreshing && "animate-spin"
                  )} 
                  style={{ color: pullProgress >= 1 ? hubColor : colors.text.muted }} 
                />
              </motion.div>
              <span className="text-sm text-white">
                {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div 
        className="flex items-center gap-3 mb-3 px-3 pb-2 border-b border-white/10"
        style={{ transform: `scale(${gridScale})`, transformOrigin: 'left top' }}
      >
        <div className="w-6 text-center text-xs font-medium" style={{ color: colors.text.muted }}>#</div>
        <div className="flex-1 text-xs font-medium" style={{ color: colors.text.muted }}>Player</div>
        <div className="hidden md:block w-24 text-xs font-medium" style={{ color: colors.text.muted }}>Team</div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>Rating</div>
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>ACS</div>
          <div className="w-14 text-right text-xs font-medium" style={{ color: colors.text.muted }}>Win%</div>
        </div>
        <div className="w-4" />
      </div>

      {/* Virtual List Container */}
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent touch-pan-y"
        style={{
          height: containerHeight,
          willChange: 'transform',
          paddingTop: enablePullToRefresh ? pullProgress * 50 : 0,
        }}
        {...pullBind()}
        {...(enablePinchZoom ? pinchBind() : {})}
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
                onClick={onPlayerClick}
                onLongPress={enableLongPress ? onPlayerLongPress : undefined}
                searchQuery={searchQuery}
                scale={gridScale}
                style={{
                  height: `${adjustedRowHeight}px`,
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

      {/* Zoom indicator */}
      {enablePinchZoom && gridScale !== 1 && (
        <motion.div
          className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-xs font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ color: hubColor }}
        >
          {Math.round(gridScale * 100)}%
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-white/10 text-center text-xs" style={{ color: colors.text.muted }}>
        Showing {players.length.toLocaleString()} players
        {virtualItems.length < players.length && (
          <span className="ml-2">(rendering {virtualItems.length} visible)</span>
        )}
        {enablePinchZoom && <span className="ml-2">• Pinch to zoom</span>}
        {enableLongPress && <span className="ml-2">• Long press for details</span>}
      </div>
    </GlassCard>
  );
};

export default GestureEnhancedPlayerGrid;
