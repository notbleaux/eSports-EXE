/** [Ver001.000]
 * Audio Settings Component
 * ========================
 * UI component for audio configuration.
 * Provides volume sliders, mute toggles, and quality settings.
 * 
 * Features:
 * - Master volume control with slider
 * - Individual category volume controls
 * - Mute toggles for each category
 * - Audio quality selection
 * - Preset configurations
 * - Visual feedback and indicators
 */

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useAudio, AUDIO_PRESETS, applyAudioPreset } from '@/lib/audio';
import type { AudioCategory, AudioQuality } from '@/lib/audio/types';

// ============================================================================
// Types
// ============================================================================

export interface AudioSettingsProps {
  /** Additional CSS classes */
  className?: string;
  /** Called when settings change */
  onSettingsChange?: () => void;
  /** Show compact version */
  compact?: boolean;
}

interface VolumeSliderProps {
  label: string;
  value: number;
  muted: boolean;
  onChange: (value: number) => void;
  onToggleMute: () => void;
  icon: React.ReactNode;
  colorClass?: string;
}

// ============================================================================
// Icons
// ============================================================================

const VolumeIcon: React.FC<{ level: 'off' | 'low' | 'medium' | 'high' }> = ({ level }) => {
  const paths = {
    off: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    low: 'M7 9v6h4l5 5V4l-5 5H7z',
    medium: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z',
    high: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  };
  
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d={paths[level]} />
    </svg>
  );
};

const SFXIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

const VoiceIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
  </svg>
);

const AmbientIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
  </svg>
);

const UIIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h8v2H6zm0 4h8v2H6zm10-4h2v2h-2zm0 4h2v2h-2z" />
  </svg>
);

const AbilityIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

// ============================================================================
// Volume Slider Component
// ============================================================================

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  value,
  muted,
  onChange,
  onToggleMute,
  icon,
  colorClass: _ = 'bg-primary',
}) => {
  const getVolumeLevel = (): 'off' | 'low' | 'medium' | 'high' => {
    if (muted || value === 0) return 'off';
    if (value < 0.33) return 'low';
    if (value < 0.66) return 'medium';
    return 'high';
  };

  const volumeLevel = getVolumeLevel();

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface/50 hover:bg-surface transition-colors">
      <button
        onClick={onToggleMute}
        className={cn(
          "p-2 rounded-lg transition-colors",
          muted ? "text-text-tertiary bg-surface" : "text-text-primary bg-surface/80"
        )}
        aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
      >
        {icon || <VolumeIcon level={volumeLevel} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text-primary truncate">
            {label}
          </span>
          <span className="text-xs text-text-secondary">
            {muted ? 'Muted' : `${Math.round(value * 100)}%`}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={muted ? 0 : Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer",
            "bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            muted && "opacity-50"
          )}
          style={{
            background: muted 
              ? undefined 
              : `linear-gradient(to right, var(--color-primary) ${value * 100}%, var(--color-surface) ${value * 100}%)`
          }}
          aria-label={`${label} volume`}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  className,
  onSettingsChange,
  compact = false,
}) => {
  const audio = useAudio({ autoInitialize: true });
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [expanded, setExpanded] = useState(!compact);

  // Handle preset change
  const handlePresetChange = useCallback((preset: keyof typeof AUDIO_PRESETS) => {
    setSelectedPreset(preset);
    applyAudioPreset(preset);
    onSettingsChange?.();
  }, [onSettingsChange]);

  // Handle volume changes
  const handleMasterVolumeChange = useCallback((value: number) => {
    audio.setMasterVolume(value);
    onSettingsChange?.();
  }, [audio, onSettingsChange]);

  const handleCategoryVolumeChange = useCallback((category: AudioCategory, value: number) => {
    audio.setCategoryVolume(category, value);
    onSettingsChange?.();
  }, [audio, onSettingsChange]);

  // Handle mute toggles
  const handleMasterMuteToggle = useCallback(() => {
    audio.toggleMute();
    onSettingsChange?.();
  }, [audio, onSettingsChange]);

  const handleCategoryMuteToggle = useCallback((category: AudioCategory) => {
    audio.toggleCategoryMute(category);
    onSettingsChange?.();
  }, [audio, onSettingsChange]);

  // Quality options
  const qualityOptions: { value: AudioQuality; label: string }[] = [
    { value: 'low', label: 'Low (Mobile)' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High (Desktop)' },
  ];

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-surface text-text-primary hover:bg-surface/80",
          "transition-colors",
          className
        )}
      >
        <SettingsIcon />
        <span className="text-sm font-medium">Audio</span>
        <VolumeIcon level={audio.masterMuted ? 'off' : audio.masterVolume < 0.33 ? 'low' : audio.masterVolume < 0.66 ? 'medium' : 'high'} />
      </button>
    );
  }

  return (
    <div className={cn(
      "bg-background border border-border rounded-xl overflow-hidden",
      compact && "shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SettingsIcon />
          <h3 className="font-semibold text-text-primary">Audio Settings</h3>
        </div>
        {compact && (
          <button
            onClick={() => setExpanded(false)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Master Volume */}
        <VolumeSlider
          label="Master Volume"
          value={audio.masterVolume}
          muted={audio.masterMuted}
          onChange={handleMasterVolumeChange}
          onToggleMute={handleMasterMuteToggle}
          icon={<VolumeIcon level={audio.masterMuted ? 'off' : audio.masterVolume < 0.33 ? 'low' : audio.masterVolume < 0.66 ? 'medium' : 'high'} />}
        />

        {/* Category Volumes */}
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Categories
          </p>
          
          <VolumeSlider
            label="Sound Effects"
            value={audio.getCategoryVolume('sfx')}
            muted={audio.isCategoryMuted('sfx')}
            onChange={(v) => handleCategoryVolumeChange('sfx', v)}
            onToggleMute={() => handleCategoryMuteToggle('sfx')}
            icon={<SFXIcon />}
          />
          
          <VolumeSlider
            label="Mascot Voices"
            value={audio.getCategoryVolume('voice')}
            muted={audio.isCategoryMuted('voice')}
            onChange={(v) => handleCategoryVolumeChange('voice', v)}
            onToggleMute={() => handleCategoryMuteToggle('voice')}
            icon={<VoiceIcon />}
          />
          
          <VolumeSlider
            label="Ambient Audio"
            value={audio.getCategoryVolume('ambient')}
            muted={audio.isCategoryMuted('ambient')}
            onChange={(v) => handleCategoryVolumeChange('ambient', v)}
            onToggleMute={() => handleCategoryMuteToggle('ambient')}
            icon={<AmbientIcon />}
          />
          
          <VolumeSlider
            label="UI Sounds"
            value={audio.getCategoryVolume('ui')}
            muted={audio.isCategoryMuted('ui')}
            onChange={(v) => handleCategoryVolumeChange('ui', v)}
            onToggleMute={() => handleCategoryMuteToggle('ui')}
            icon={<UIIcon />}
          />
          
          <VolumeSlider
            label="Ability Sounds"
            value={audio.getCategoryVolume('ability')}
            muted={audio.isCategoryMuted('ability')}
            onChange={(v) => handleCategoryVolumeChange('ability', v)}
            onToggleMute={() => handleCategoryMuteToggle('ability')}
            icon={<AbilityIcon />}
          />
        </div>

        {/* Quality Selection */}
        <div className="pt-2 border-t border-border">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-2">
            Audio Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {qualityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => audio.setQuality(option.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "border border-border",
                  audio.getQuality?.() === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-text-secondary hover:bg-surface/80"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="pt-2 border-t border-border">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-2">
            Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(AUDIO_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key as keyof typeof AUDIO_PRESETS)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "border border-border text-left",
                  selectedPreset === key
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface text-text-secondary hover:bg-surface/80"
                )}
              >
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>
        </div>

        {/* Test Sound */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => audio.playSFX({
              id: 'test_click',
              type: 'ui_click',
              category: 'ui',
              priority: 'normal',
              duration: 0.1,
            })}
            className={cn(
              "w-full px-4 py-2 rounded-lg text-sm font-medium",
              "bg-surface text-text-primary hover:bg-surface/80",
              "border border-border transition-colors",
              "flex items-center justify-center gap-2"
            )}
          >
            <VolumeIcon level="medium" />
            Test Audio
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Compact Audio Toggle Component
// ============================================================================

export interface AudioToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const AudioToggle: React.FC<AudioToggleProps> = ({
  className,
  showLabel = false,
}) => {
  const audio = useAudio({ autoInitialize: true });
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = () => {
    audio.toggleMute();
  };

  const getVolumeIcon = () => {
    if (audio.masterMuted || audio.masterVolume === 0) return 'off';
    if (audio.masterVolume < 0.33) return 'low';
    if (audio.masterVolume < 0.66) return 'medium';
    return 'high';
  };

  return (
    <>
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowSettings(true);
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "transition-colors",
          audio.masterMuted
            ? "bg-surface text-text-tertiary"
            : "bg-surface text-text-primary hover:bg-surface/80",
          className
        )}
        title="Click to mute, right-click for settings"
      >
        <VolumeIcon level={getVolumeIcon()} />
        {showLabel && (
          <span className="text-sm font-medium">
            {audio.masterMuted ? 'Muted' : `${Math.round(audio.masterVolume * 100)}%`}
          </span>
        )}
      </button>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <AudioSettings 
              className="shadow-2xl" 
              onSettingsChange={() => {}}
            />
            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// Audio Indicator Component
// ============================================================================

export interface AudioIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioIndicator: React.FC<AudioIndicatorProps> = ({
  className,
  size = 'md',
}) => {
  const audio = useAudio({ autoInitialize: true });

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const getVolumeLevel = (): 'off' | 'low' | 'medium' | 'high' => {
    if (audio.masterMuted || audio.masterVolume === 0) return 'off';
    if (audio.masterVolume < 0.33) return 'low';
    if (audio.masterVolume < 0.66) return 'medium';
    return 'high';
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        audio.masterMuted ? "bg-error/20 text-error" : "bg-success/20 text-success",
        sizeClasses[size],
        className
      )}
      title={audio.masterMuted ? 'Audio muted' : `Volume: ${Math.round(audio.masterVolume * 100)}%`}
    >
      <VolumeIcon level={getVolumeLevel()} />
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default AudioSettings;
