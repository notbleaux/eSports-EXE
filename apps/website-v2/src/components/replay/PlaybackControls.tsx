/** [Ver002.000] */
/**
 * Playback Controls Component
 * ===========================
 * Comprehensive playback controls with keyboard shortcuts.
 * Includes play/pause, speed control, skip, and frame advance.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Repeat,
  Repeat1,
  Zap,
  Clock,
  ChevronDown,
} from 'lucide-react';
import {
  useTimelineStore,
  usePlaybackState,
  useSpeed,
  useLoopMode,
  PLAYBACK_SPEEDS,
  formatTime,
  type PlaybackSpeed,
  type LoopMode,
} from '@/lib/replay/timeline/state';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export interface PlaybackControlsProps {
  className?: string;
  variant?: 'compact' | 'full' | 'minimal';
  showSpeedControl?: boolean;
  showLoopControl?: boolean;
  showTimeDisplay?: boolean;
  showFrameControls?: boolean;
  skipInterval?: number;
  onKeyboardShortcut?: (key: string, e: KeyboardEvent) => void;
}

export interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// Control Button
// ============================================================================

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  active = false,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const variantClasses = {
    default: cn(
      'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
      'disabled:bg-slate-900 disabled:text-slate-600',
      active && 'bg-cyan-500/20 text-cyan-400'
    ),
    primary: cn(
      'bg-cyan-500 text-slate-900 hover:bg-cyan-400',
      'disabled:bg-slate-800 disabled:text-slate-600'
    ),
    ghost: cn(
      'bg-transparent text-slate-400 hover:text-white',
      'disabled:text-slate-700',
      active && 'text-cyan-400'
    ),
  };

  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSizes[size] })
    : icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
        'active:scale-95',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={label}
    >
      {iconElement}
    </button>
  );
};

// ============================================================================
// Speed Selector
// ============================================================================

interface SpeedSelectorProps {
  currentSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  disabled?: boolean;
}

const SpeedSelector: React.FC<SpeedSelectorProps> = ({
  currentSpeed,
  onSpeedChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const speedLabels: Record<PlaybackSpeed, string> = {
    0.25: '0.25x',
    0.5: '0.5x',
    1: '1x',
    1.5: '1.5x',
    2: '2x',
    4: '4x',
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg',
          'bg-slate-800 text-slate-300 text-sm font-medium',
          'hover:bg-slate-700 transition-colors',
          'disabled:bg-slate-900 disabled:text-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
        )}
      >
        <Zap size={14} className={currentSpeed > 1 ? 'text-yellow-400' : ''} />
        <span>{speedLabels[currentSpeed]}</span>
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 z-50 min-w-full">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => {
                    onSpeedChange(speed);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-sm text-left transition-colors',
                    'hover:bg-slate-700',
                    currentSpeed === speed && 'bg-cyan-500/20 text-cyan-400'
                  )}
                >
                  {speedLabels[speed]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Loop Mode Button
// ============================================================================

interface LoopModeButtonProps {
  mode: LoopMode;
  onModeChange: (mode: LoopMode) => void;
  disabled?: boolean;
}

const LoopModeButton: React.FC<LoopModeButtonProps> = ({
  mode,
  onModeChange,
  disabled = false,
}) => {
  const modes: LoopMode[] = ['none', 'loop', 'loop-round'];
  
  const icons = {
    none: Repeat,
    loop: Repeat,
    'loop-round': Repeat1,
  };

  const labels = {
    none: 'No Loop',
    loop: 'Loop All',
    'loop-round': 'Loop Round',
  };

  const handleClick = useCallback(() => {
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onModeChange(nextMode);
  }, [mode, onModeChange]);

  const Icon = icons[mode];

  return (
    <ControlButton
      icon={<Icon className={mode !== 'none' ? 'text-cyan-400' : ''} />}
      label={labels[mode]}
      onClick={handleClick}
      disabled={disabled}
      active={mode !== 'none'}
      variant="ghost"
      size="md"
    />
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  className,
  variant = 'full',
  showSpeedControl = true,
  showLoopControl = true,
  showTimeDisplay = true,
  showFrameControls = true,
  skipInterval = 5,
  onKeyboardShortcut,
}) => {
  // Store state and actions
  const store = useTimelineStore();
  const playbackState = usePlaybackState();
  const speed = useSpeed();
  const loopMode = useLoopMode();

  const isPlaying = playbackState === 'playing';

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let handled = true;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          store.toggle();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            store.skipBackward(skipInterval * 2);
          } else if (e.ctrlKey || e.metaKey) {
            store.prevFrame();
          } else {
            store.skipBackward(skipInterval);
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            store.skipForward(skipInterval * 2);
          } else if (e.ctrlKey || e.metaKey) {
            store.nextFrame();
          } else {
            store.skipForward(skipInterval);
          }
          break;
        case 'j':
          store.skipBackward(skipInterval);
          break;
        case 'l':
          store.skipForward(skipInterval);
          break;
        case ',':
          store.prevFrame();
          break;
        case '.':
          store.nextFrame();
          break;
        case 'Home':
          e.preventDefault();
          store.stop();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
          // Number keys 0-4 map to speed 0.25x, 0.5x, 1x, 2x, 4x
          const speedIndex = parseInt(e.key);
          const speeds: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];
          if (speedIndex < speeds.length) {
            store.setSpeed(speeds[speedIndex]);
          }
          break;
        case 'r':
          store.cycleLoopMode();
          break;
        case 'm':
          store.nextChapter();
          break;
        case 'n':
          store.prevChapter();
          break;
        default:
          handled = false;
      }

      if (handled) {
        onKeyboardShortcut?.(e.key, e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, skipInterval, onKeyboardShortcut]);

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <ControlButton
          icon={<SkipBack size={18} />}
          label="Previous"
          shortcut="←"
          onClick={() => store.skipBackward(skipInterval)}
          variant="ghost"
          size="sm"
        />
        <ControlButton
          icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
          label={isPlaying ? 'Pause' : 'Play'}
          shortcut="Space"
          onClick={() => store.toggle()}
          variant="primary"
          size="md"
        />
        <ControlButton
          icon={<SkipForward size={18} />}
          label="Next"
          shortcut="→"
          onClick={() => store.skipForward(skipInterval)}
          variant="ghost"
          size="sm"
        />
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <ControlButton
          icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
          label={isPlaying ? 'Pause' : 'Play'}
          shortcut="Space"
          onClick={() => store.toggle()}
          variant="primary"
          size="md"
        />
        {showSpeedControl && (
          <SpeedSelector
            currentSpeed={speed}
            onSpeedChange={store.setSpeed}
          />
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Main controls row */}
      <div className="flex items-center justify-between">
        {/* Left: Skip and frame controls */}
        <div className="flex items-center gap-1">
          <ControlButton
            icon={<RotateCcw size={18} />}
            label="Restart"
            shortcut="Home"
            onClick={() => store.stop()}
            variant="ghost"
            size="md"
          />
          
          <div className="w-px h-6 bg-slate-700 mx-1" />
          
          <ControlButton
            icon={<SkipBack size={18} />}
            label={`Back ${skipInterval}s`}
            shortcut="← or J"
            onClick={() => store.skipBackward(skipInterval)}
            variant="ghost"
            size="md"
          />
          
          {showFrameControls && (
            <ControlButton
              icon={<ChevronLeft size={18} />}
              label="Previous Frame"
              shortcut="Ctrl+← or ,"
              onClick={() => store.prevFrame()}
              variant="ghost"
              size="sm"
            />
          )}
        </div>

        {/* Center: Play/Pause */}
        <div className="flex items-center gap-2">
          <ControlButton
            icon={isPlaying ? <Pause size={28} /> : <Play size={28} />}
            label={isPlaying ? 'Pause' : 'Play'}
            shortcut="Space or K"
            onClick={() => store.toggle()}
            variant="primary"
            size="lg"
          />
        </div>

        {/* Right: Forward and speed */}
        <div className="flex items-center gap-1">
          {showFrameControls && (
            <ControlButton
              icon={<ChevronRight size={18} />}
              label="Next Frame"
              shortcut="Ctrl+→ or ."
              onClick={() => store.nextFrame()}
              variant="ghost"
              size="sm"
            />
          )}
          
          <ControlButton
            icon={<SkipForward size={18} />}
            label={`Forward ${skipInterval}s`}
            shortcut="→ or L"
            onClick={() => store.skipForward(skipInterval)}
            variant="ghost"
            size="md"
          />
          
          <div className="w-px h-6 bg-slate-700 mx-1" />
          
          {showLoopControl && (
            <LoopModeButton
              mode={loopMode}
              onModeChange={store.setLoopMode}
            />
          )}
        </div>
      </div>

      {/* Bottom row: Speed and time */}
      <div className="flex items-center justify-between px-1">
        {showSpeedControl ? (
          <SpeedSelector
            currentSpeed={speed}
            onSpeedChange={store.setSpeed}
          />
        ) : (
          <div />
        )}

        {showTimeDisplay && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock size={14} />
            <span className="font-mono">
              {formatTime(store.currentTime)} / {formatTime(store.duration)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Shortcuts:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Space</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">→</kbd>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Chapter Navigation
// ============================================================================

export interface ChapterNavigationProps {
  className?: string;
  onChapterChange?: (direction: 'prev' | 'next') => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  className,
  onChapterChange,
}) => {
  const store = useTimelineStore();
  const activeChapter = useTimelineStore(state => 
    state.chapters.find(ch => ch.id === state.activeChapterId)
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ControlButton
        icon={<ChevronLeft size={16} />}
        label="Previous Chapter"
        shortcut="N"
        onClick={() => {
          store.prevChapter();
          onChapterChange?.('prev');
        }}
        variant="ghost"
        size="sm"
      />
      
      <div className="px-3 py-1.5 bg-slate-800 rounded-lg min-w-[120px] text-center">
        <span className="text-sm text-slate-300 truncate block">
          {activeChapter?.label || 'No Chapter'}
        </span>
      </div>
      
      <ControlButton
        icon={<ChevronRight size={16} />}
        label="Next Chapter"
        shortcut="M"
        onClick={() => {
          store.nextChapter();
          onChapterChange?.('next');
        }}
        variant="ghost"
        size="sm"
      />
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default PlaybackControls;
