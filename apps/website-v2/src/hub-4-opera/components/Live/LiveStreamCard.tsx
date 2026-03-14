/**
 * LiveStreamCard - Stream thumbnail card for grid views
 * 
 * [Ver001.000]
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Users,
  Tv,
  Youtube,
  Play,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import type { LiveStreamCardProps, StreamPlatform } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const OPERA_GLOW = colors.hub.opera.glow;
const LIVE_COLOR = colors.status.live;

// Platform icon component
const PlatformIcon: React.FC<{ platform: StreamPlatform; className?: string }> = ({
  platform,
  className,
}) => {
  const Icon = platform === 'twitch' ? Tv : Youtube;
  const color = platform === 'twitch' ? '#9146ff' : '#ff0000';

  return (
    <div
      className={cn('flex items-center justify-center rounded-md', className)}
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
  );
};

// Format viewer count
const formatViewers = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const LiveStreamCard: React.FC<LiveStreamCardProps> = ({
  stream,
  onClick,
}) => {
  return (
    <GlassCard
      onClick={onClick}
      className="group cursor-pointer overflow-hidden"
      hoverGlow={OPERA_GLOW}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden">
        {/* Thumbnail Image */}
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360?text=Stream';
          }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* LIVE Badge */}
        {stream.isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold"
            style={{ backgroundColor: LIVE_COLOR, color: 'white' }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
            LIVE
          </motion.div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-3 right-3">
          <PlatformIcon platform={stream.platform} className="w-7 h-7" />
        </div>

        {/* Viewer Count */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
          <Users className="w-3 h-3 text-white/80" />
          <span className="text-xs font-medium text-white/90">
            {formatViewers(stream.viewers)}
          </span>
        </div>

        {/* Play Button Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: OPERA_COLOR }}
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Streamer Info */}
        <div className="flex items-center gap-3 mb-2">
          <img
            src={stream.streamer.avatar}
            alt={stream.streamer.name}
            className="w-9 h-9 rounded-full bg-white/10 object-cover ring-2 ring-transparent group-hover:ring-[#9d4edd] transition-all"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/36?text=${stream.streamer.name.charAt(0)}`;
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 truncate">{stream.streamer.name}</p>
            {stream.isLive && (
              <div className="flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" style={{ color: LIVE_COLOR }} />
                <span className="text-[10px]" style={{ color: LIVE_COLOR }}>
                  Streaming now
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#9d4edd] transition-colors">
          {stream.title}
        </h4>
      </div>
    </GlassCard>
  );
};

export default LiveStreamCard;
