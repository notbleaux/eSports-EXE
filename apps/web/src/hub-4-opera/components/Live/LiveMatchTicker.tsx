// @ts-nocheck
/**
 * LiveMatchTicker - Live score ticker bar at top
 * 
 * [Ver001.000]
 */
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Circle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trophy,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import type { LiveMatchTickerProps, LiveMatch, MatchStatus } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";
const LIVE_COLOR = colors.status.live;

// Status badge component
const StatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  const statusConfig: Record<MatchStatus, { label: string; icon?: typeof Circle; color: string }> = {
    live: {
      label: 'LIVE',
      icon: Circle,
      color: LIVE_COLOR,
    },
    upcoming: {
      label: 'UPCOMING',
      color: colors.status.info,
    },
    finished: {
      label: 'FINISHED',
      color: colors.text.muted,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      {Icon && (
        <motion.div
          animate={status === 'live' ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Icon className="w-2 h-2 fill-current" />
        </motion.div>
      )}
      <span>{config.label}</span>
    </div>
  );
};

// Individual match card
const MatchCard: React.FC<{
  match: LiveMatch;
  onClick: () => void;
  isActive?: boolean;
}> = ({ match, onClick, isActive }) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 p-3 rounded-xl border transition-all duration-200',
        'hover:scale-[1.02] cursor-pointer',
        isActive
          ? 'bg-white/10 border-[#9d4edd]'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      )}
      style={{
        boxShadow: isActive ? `0 0 20px ${OPERA_GLOW}` : undefined,
        minWidth: '280px',
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header: Status & Tournament */}
      <div className="flex items-center justify-between mb-2">
        <StatusBadge status={match.status} />
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Trophy className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{match.tournament}</span>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={match.teamA.logo}
            alt={match.teamA.name}
            className="w-6 h-6 rounded-full bg-white/10 object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/24?text=${match.teamA.name.charAt(0)}`;
            }}
          />
          <span className="text-sm font-medium truncate">{match.teamA.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-3">
          <span
            className={cn(
              'text-lg font-bold',
              match.teamA.score > match.teamB.score && match.status === 'finished'
                ? 'text-white'
                : 'text-white/70'
            )}
          >
            {match.teamA.score}
          </span>
          <span className="text-white/30">-</span>
          <span
            className={cn(
              'text-lg font-bold',
              match.teamB.score > match.teamA.score && match.status === 'finished'
                ? 'text-white'
                : 'text-white/70'
            )}
          >
            {match.teamB.score}
          </span>
        </div>

        {/* Team B */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium truncate">{match.teamB.name}</span>
          <img
            src={match.teamB.logo}
            alt={match.teamB.name}
            className="w-6 h-6 rounded-full bg-white/10 object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/24?text=${match.teamB.name.charAt(0)}`;
            }}
          />
        </div>
      </div>

      {/* Footer: Map & ETA */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-xs text-white/50">{match.map}</span>
        {match.eta && (
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Clock className="w-3 h-3" />
            <span>{match.eta}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export const LiveMatchTicker: React.FC<LiveMatchTickerProps> = ({
  matches,
  onMatchClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Check scroll availability
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [matches]);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Handle match click
  const handleMatchClick = (matchId: string) => {
    setActiveMatchId(matchId);
    onMatchClick(matchId);
  };

  // Live matches first
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return 0;
  });

  return (
    <div className="relative group">
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full',
          'bg-black/50 backdrop-blur-sm border border-white/10',
          'transition-all duration-200',
          canScrollLeft
            ? 'opacity-100 hover:bg-black/70'
            : 'opacity-0 pointer-events-none'
        )}
      >
        <ChevronLeft className="w-4 h-4 text-white/70" />
      </button>

      <button
        onClick={() => scroll('right')}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full',
          'bg-black/50 backdrop-blur-sm border border-white/10',
          'transition-all duration-200',
          canScrollRight
            ? 'opacity-100 hover:bg-black/70'
            : 'opacity-0 pointer-events-none'
        )}
      >
        <ChevronRight className="w-4 h-4 text-white/70" />
      </button>

      {/* Ticker */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sortedMatches.length === 0 ? (
          <div className="flex-1 text-center py-4 text-white/50 text-sm">
            No matches available
          </div>
        ) : (
          sortedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => handleMatchClick(match.id)}
              isActive={activeMatchId === match.id}
            />
          ))
        )}
      </div>

      {/* Custom Scrollbar Hide Style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LiveMatchTicker;
