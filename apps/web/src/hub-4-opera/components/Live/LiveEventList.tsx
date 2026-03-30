/**
 * LiveEventList - Current and upcoming events sidebar
 * 
 * [Ver001.000]
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Clock,
  Users,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import type { LiveEventListProps, LiveEvent, EventStatus } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";
const LIVE_COLOR = colors.status.live;

// Format viewer count
const formatViewers = (count?: number): string => {
  if (!count) return '-';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Format countdown
const formatCountdown = (startTime: string): string => {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start.getTime() - now.getTime();

  if (diff <= 0) return 'Starting now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Status badge component
const StatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => {
  const config: Record<EventStatus, { label: string; color: string; icon: typeof Radio }> = {
    live: {
      label: 'LIVE NOW',
      color: LIVE_COLOR,
      icon: Radio,
    },
    upcoming: {
      label: 'UPCOMING',
      color: colors.status.info,
      icon: Clock,
    },
    finished: {
      label: 'FINISHED',
      color: colors.text.muted,
      icon: Trophy,
    },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {status === 'live' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Icon className="w-3 h-3" />
        </motion.div>
      )}
      {status !== 'live' && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
};

// Event card component
const EventCard: React.FC<{
  event: LiveEvent;
  isCurrent?: boolean;
  onClick: () => void;
}> = ({ event, isCurrent, onClick }) => {
  const [countdown, setCountdown] = useState(formatCountdown(event.startTime));

  // Update countdown for upcoming events
  useEffect(() => {
    if (event.status !== 'upcoming') return;

    const interval = setInterval(() => {
      setCountdown(formatCountdown(event.startTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [event.startTime, event.status]);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl border text-left transition-all duration-200',
        'hover:scale-[1.02] cursor-pointer group',
        isCurrent
          ? 'bg-white/10 border-[#9d4edd]'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      )}
      style={{
        boxShadow: isCurrent ? `0 0 20px ${OPERA_GLOW}` : undefined,
      }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-black/30">
        <img
          src={event.thumbnail}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180?text=Event';
          }}
        />
        
        {/* Live Badge */}
        {event.status === 'live' && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"
            style={{ backgroundColor: LIVE_COLOR, color: 'white' }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
            LIVE
          </div>
        )}

        {/* Viewer Count */}
        {event.viewers && event.status === 'live' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-xs text-white/90">
            <Users className="w-3 h-3" />
            {formatViewers(event.viewers)}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ChevronRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Status & Tournament */}
        <div className="flex items-center justify-between">
          <StatusBadge status={event.status} />
          <span className="text-xs text-white/50 truncate max-w-[100px]">
            {event.tournament}
          </span>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-[#9d4edd] transition-colors">
          {event.title}
        </h4>

        {/* Teams */}
        {event.teams.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.teams.slice(0, 2).map((team, i) => (
                <img
                  key={i}
                  src={team.logo}
                  alt={team.name}
                  className="w-6 h-6 rounded-full border-2 border-[#1a1a25] bg-white/10 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/24?text=${team.name.charAt(0)}`;
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/50">
              {event.teams.map(t => t.name).join(' vs ')}
            </span>
          </div>
        )}

        {/* Countdown for upcoming */}
        {event.status === 'upcoming' && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Clock className="w-3 h-3 text-white/50" />
            <span className="text-xs text-white/70 font-mono">{countdown}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

// Section header
const SectionHeader: React.FC<{
  title: string;
  count: number;
  icon: typeof Radio;
}> = ({ title, count, icon: Icon }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" style={{ color: OPERA_COLOR }} />
      <h3 className="font-semibold text-sm" style={{ color: OPERA_COLOR }}>
        {title}
      </h3>
    </div>
    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
      {count}
    </span>
  </div>
);

export const LiveEventList: React.FC<LiveEventListProps> = ({
  events,
  currentEventId,
  onEventSelect,
}) => {
  // Filter events by status
  const liveEvents = events.filter((e) => e.status === 'live');
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const finishedEvents = events.filter((e) => e.status === 'finished');

  return (
    <GlassCard className="p-4 h-full overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
        {/* Live Now Section */}
        <AnimatePresence>
          {liveEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <SectionHeader title="LIVE NOW" count={liveEvents.length} icon={Radio} />
              <div className="space-y-2">
                {liveEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isCurrent={currentEventId === event.id}
                    onClick={() => onEventSelect(event.id)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Upcoming Section */}
        {upcomingEvents.length > 0 && (
          <section>
            <SectionHeader title="UPCOMING" count={upcomingEvents.length} icon={Clock} />
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isCurrent={currentEventId === event.id}
                  onClick={() => onEventSelect(event.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Finished Section (collapsed by default, show last 3) */}
        {finishedEvents.length > 0 && (
          <section>
            <SectionHeader title="RECENT" count={finishedEvents.length} icon={Trophy} />
            <div className="space-y-2">
              {finishedEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isCurrent={currentEventId === event.id}
                  onClick={() => onEventSelect(event.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-8">
            <Radio className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-sm text-white/50">No events available</p>
          </div>
        )}
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(157, 78, 221, 0.3);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(157, 78, 221, 0.5);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </GlassCard>
  );
};

export default LiveEventList;
