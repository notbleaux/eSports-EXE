/** [Ver001.000] */
/**
 * TacticalControls Component
 * ==========================
 * Playback controls and visualization options for TacticalView.
 */

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Eye, EyeOff, Users, Heart, Activity } from 'lucide-react';
import { TacticalViewState, PLAYBACK_SPEEDS } from './types';

interface TacticalControlsProps {
  isPlaying: boolean;
  playbackSpeed: typeof PLAYBACK_SPEEDS[number];
  showTrails: boolean;
  showVisionCones: boolean;
  showHealthBars: boolean;
  showPlayerNames: boolean;
  onTogglePlayback: () => void;
  onSpeedChange: (speed: typeof PLAYBACK_SPEEDS[number]) => void;
  onToggleTrails: () => void;
  onToggleVisionCones: () => void;
  onToggleHealthBars: () => void;
  onTogglePlayerNames: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const TacticalControls: React.FC<TacticalControlsProps> = ({
  isPlaying,
  playbackSpeed,
  showTrails,
  showVisionCones,
  showHealthBars,
  showPlayerNames,
  onTogglePlayback,
  onSpeedChange,
  onToggleTrails,
  onToggleVisionCones,
  onToggleHealthBars,
  onTogglePlayerNames,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="tactical-controls">
      {/* Playback Controls */}
      <div className="tactical-controls__section">
        <button
          onClick={onTogglePlayback}
          className="tactical-controls__button tactical-controls__button--primary"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div className="tactical-controls__speed-selector">
          {PLAYBACK_SPEEDS.map(speed => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`tactical-controls__speed-button ${
                playbackSpeed === speed ? 'tactical-controls__speed-button--active' : ''
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Toggles */}
      <div className="tactical-controls__section">
        <button
          onClick={onToggleTrails}
          className={`tactical-controls__toggle ${showTrails ? 'tactical-controls__toggle--active' : ''}`}
          title="Show Movement Trails"
        >
          <Activity size={16} />
          <span>Trails</span>
        </button>

        <button
          onClick={onToggleVisionCones}
          className={`tactical-controls__toggle ${showVisionCones ? 'tactical-controls__toggle--active' : ''}`}
          title="Show Vision Cones"
        >
          <Eye size={16} />
          <span>Vision</span>
        </button>

        <button
          onClick={onToggleHealthBars}
          className={`tactical-controls__toggle ${showHealthBars ? 'tactical-controls__toggle--active' : ''}`}
          title="Show Health Bars"
        >
          <Heart size={16} />
          <span>Health</span>
        </button>

        <button
          onClick={onTogglePlayerNames}
          className={`tactical-controls__toggle ${showPlayerNames ? 'tactical-controls__toggle--active' : ''}`}
          title="Show Player Names"
        >
          <Users size={16} />
          <span>Names</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="tactical-controls__section">
        <button
          onClick={onZoomOut}
          className="tactical-controls__button"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={onZoomIn}
          className="tactical-controls__button"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
      </div>

      <style>{`
        .tactical-controls {
          display: flex;
          gap: 16px;
          padding: 12px;
          background: #2d3436;
          border-radius: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .tactical-controls__section {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 0 12px;
          border-right: 1px solid #636e72;
        }

        .tactical-controls__section:last-child {
          border-right: none;
        }

        .tactical-controls__button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: #636e72;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tactical-controls__button:hover {
          background: #74b9ff;
        }

        .tactical-controls__button--primary {
          background: #0984e3;
          width: 48px;
          height: 48px;
        }

        .tactical-controls__button--primary:hover {
          background: #74b9ff;
        }

        .tactical-controls__speed-selector {
          display: flex;
          gap: 4px;
        }

        .tactical-controls__speed-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          background: #636e72;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tactical-controls__speed-button:hover {
          background: #74b9ff;
        }

        .tactical-controls__speed-button--active {
          background: #0984e3;
        }

        .tactical-controls__toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: #636e72;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tactical-controls__toggle:hover {
          background: #74b9ff;
        }

        .tactical-controls__toggle--active {
          background: #00b894;
        }

        .tactical-controls__toggle--active:hover {
          background: #00cec9;
        }
      `}</style>
    </div>
  );
};
