/**
 * Video Panel - VOD player and stream embed
 * 
 * [Ver001.000]
 */
import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { colors } from '@/theme/colors';

export function VideoPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35);
  
  return (
    <div className="w-full h-full flex flex-col bg-black rounded-lg overflow-hidden">
      {/* Video Placeholder */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        {/* Play Button Overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors group"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </button>
        
        {/* Video Info Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div>
            <div className="text-xs text-white/60 mb-1">SEN vs LEV - Map 3</div>
            <div className="text-sm font-medium text-white">VCT Americas 2024</div>
          </div>
          <div 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: colors.hub.opera.base + '20', color: colors.hub.opera.base }}
          >
            LIVE
          </div>
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-3 right-3 text-xs text-white/60">
          34:20 / 52:15
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-[#14141a] border-t border-white/10">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${progress}%`,
                backgroundColor: colors.hub.opera.base 
              }}
            />
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              style={{ backgroundColor: colors.hub.opera.base + '20' }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" style={{ color: colors.hub.opera.base }} />
              ) : (
                <Play className="w-4 h-4 ml-0.5" style={{ color: colors.hub.opera.base }} />
              )}
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
