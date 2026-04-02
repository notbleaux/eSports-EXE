// @ts-nocheck
/**
 * LiveStreamViewer - Embedded stream viewer supporting Twitch and YouTube
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Tv,
  Youtube,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import type { LiveStreamViewerProps, StreamPlatform, ViewerState } from './types';
import { streamingLogger } from '@/utils/logger';

interface MatchInfo {
  teamA: { name: string; score: number; logo: string };
  teamB: { name: string; score: number; logo: string };
  map: string;
  tournament: string;
}

interface LiveStreamViewerExtendedProps extends LiveStreamViewerProps {
  matchInfo?: MatchInfo;
}

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

// Extract video ID from various YouTube URL formats
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Extract channel/video from Twitch URL
const extractTwitchChannel = (url: string): string | null => {
  const patterns = [
    /twitch\.tv\/([^/\s]+)/,
    /twitch\.tv\/videos\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Platform selector tabs
const PlatformSelector: React.FC<{
  currentPlatform: StreamPlatform;
  onPlatformChange: (platform: StreamPlatform) => void;
}> = ({ currentPlatform, onPlatformChange }) => {
  const platforms: { id: StreamPlatform; label: string; icon: typeof Tv }[] = [
    { id: 'twitch', label: 'Twitch', icon: Tv },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-black/40">
      {platforms.map(({ id, label, icon: Icon }) => {
        const isActive = currentPlatform === id;
        return (
          <button
            key={id}
            onClick={() => onPlatformChange(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
            style={{
              boxShadow: isActive ? `0 0 10px ${OPERA_GLOW}` : undefined,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: isActive ? OPERA_COLOR : undefined }} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

// Volume control slider
const VolumeControl: React.FC<{
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}> = ({ volume, isMuted, onVolumeChange, onToggleMute }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="flex items-center gap-2 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        onClick={onToggleMute}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-white/70" />
        ) : (
          <Volume2 className="w-5 h-5 text-white/70" />
        )}
      </button>
      
      <AnimatePresence>
        {(isHovering || isMuted) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-white/20 accent-[#9d4edd]"
              style={{
                background: `linear-gradient(to right, ${OPERA_COLOR} ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Match info overlay
const MatchInfoOverlay: React.FC<{ matchInfo: MatchInfo }> = ({ matchInfo }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Team A */}
          <div className="flex items-center gap-2">
            <img
              src={matchInfo.teamA.logo}
              alt={matchInfo.teamA.name}
              className="w-8 h-8 rounded-full bg-white/10 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=A';
              }}
            />
            <span className="font-semibold text-white">{matchInfo.teamA.name}</span>
            <span className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
              {matchInfo.teamA.score}
            </span>
          </div>

          {/* VS */}
          <span className="text-white/50 text-sm">VS</span>

          {/* Team B */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: OPERA_COLOR }}>
              {matchInfo.teamB.score}
            </span>
            <span className="font-semibold text-white">{matchInfo.teamB.name}</span>
            <img
              src={matchInfo.teamB.logo}
              alt={matchInfo.teamB.name}
              className="w-8 h-8 rounded-full bg-white/10 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=B';
              }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-white/80">{matchInfo.map}</div>
          <div className="text-xs text-white/50">{matchInfo.tournament}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Error display
const StreamError: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
      <div className="text-center p-6">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.status.error }} />
        <h3 className="text-lg font-semibold text-white mb-2">Stream Error</h3>
        <p className="text-sm text-white/60 mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: OPERA_COLOR, color: 'white' }}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export const LiveStreamViewer: React.FC<LiveStreamViewerExtendedProps> = ({
  streamUrl,
  platform: initialPlatform,
  matchId,
  autoPlay = true,
  onError,
  matchInfo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [platform, setPlatform] = useState<StreamPlatform>(initialPlatform);
  const [viewerState, setViewerState] = useState<ViewerState>({
    isTheaterMode: false,
    isFullscreen: false,
    volume: 50,
    isMuted: false,
    showControls: true,
  });
  const [error, setError] = useState<Error | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate embed URL
  useEffect(() => {
    try {
      let url = '';
      if (platform === 'youtube') {
        const videoId = extractYouTubeId(streamUrl);
        if (videoId) {
          url = `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=${viewerState.isMuted ? 1 : 0}&rel=0`;
        } else {
          throw new Error('Invalid YouTube URL');
        }
      } else {
        const channel = extractTwitchChannel(streamUrl);
        if (channel) {
          const isVideo = /^\d+$/.test(channel);
          if (isVideo) {
            url = `https://player.twitch.tv/?video=${channel}&parent=${window.location.hostname}&autoplay=${autoPlay}&muted=${viewerState.isMuted}`;
          } else {
            url = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=${autoPlay}&muted=${viewerState.isMuted}`;
          }
        } else {
          throw new Error('Invalid Twitch URL');
        }
      }
      setEmbedUrl(url);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    }
  }, [streamUrl, platform, autoPlay, viewerState.isMuted, onError]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setViewerState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setViewerState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch (err) {
      streamingLogger.error('Fullscreen error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  // Toggle theater mode
  const toggleTheaterMode = useCallback(() => {
    setViewerState((prev) => ({ ...prev, isTheaterMode: !prev.isTheaterMode }));
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((volume: number) => {
    setViewerState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setViewerState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Show/hide controls
  const showControls = useCallback(() => {
    setViewerState((prev) => ({ ...prev, showControls: true }));
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setViewerState((prev) => ({ ...prev, showControls: false }));
    }, 3000);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setViewerState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    // Force re-render of iframe
    setEmbedUrl((prev) => prev + '&retry=' + Date.now());
  };

  return (
    <GlassCard
      ref={containerRef}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        viewerState.isTheaterMode ? 'fixed inset-4 z-50' : 'w-full aspect-video'
      )}
      hoverGlow={OPERA_GLOW}
      onMouseMove={showControls}
    >
      {/* Platform Badge */}
      <div className="absolute top-4 right-4 z-20">
        <PlatformSelector currentPlatform={platform} onPlatformChange={setPlatform} />
      </div>

      {/* Match Info Overlay */}
      {matchInfo && <MatchInfoOverlay matchInfo={matchInfo} />}

      {/* Video Iframe */}
      {embedUrl && !error && (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          title="Live Stream"
        />
      )}

      {/* Error Display */}
      {error && <StreamError error={error} onRetry={handleRetry} />}

      {/* Loading State */}
      {!embedUrl && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-white/20 border-t-[#9d4edd] rounded-full"
          />
        </div>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {viewerState.showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="flex items-center justify-between">
              {/* Left: Volume */}
              <VolumeControl
                volume={viewerState.volume}
                isMuted={viewerState.isMuted}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
              />

              {/* Right: View Controls */}
              <div className="flex items-center gap-2">
                {/* Theater Mode */}
                <button
                  onClick={toggleTheaterMode}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewerState.isTheaterMode
                      ? 'bg-[#9d4edd]/20 text-[#9d4edd]'
                      : 'hover:bg-white/10 text-white/70'
                  )}
                  aria-label={viewerState.isTheaterMode ? 'Exit theater mode' : 'Enter theater mode'}
                >
                  <Monitor className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70"
                  aria-label={viewerState.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {viewerState.isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theater Mode Exit Button */}
      {viewerState.isTheaterMode && (
        <button
          onClick={toggleTheaterMode}
          className="absolute top-4 left-4 z-30 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors text-white/70"
        >
          <Minimize className="w-5 h-5" />
        </button>
      )}
    </GlassCard>
  );
};

export default LiveStreamViewer;
