/** [Ver001.000] */
/**
 * TimelineScrubber Component
 * ==========================
 * Match timeline scrubber with round indicators and key events.
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { TimelineScrubberProps } from './types';

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTimestamp,
  totalDuration,
  roundResults,
  keyEvents,
  onSeek,
  currentRound,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Format timestamp to MM:SS.ms
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (currentTimestamp / totalDuration) * 100;

  // Handle click/drag on timeline
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const timestamp = percentage * totalDuration;
    
    onSeek(timestamp);
  }, [totalDuration, onSeek]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const seekAmount = 5000; // 5 seconds
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentTimestamp - seekAmount));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTimestamp + seekAmount));
        break;
      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;
      case 'End':
        e.preventDefault();
        onSeek(totalDuration);
        break;
    }
  }, [currentTimestamp, totalDuration, onSeek]);

  // ARIA value text
  const ariaValueText = useMemo(() => 
    `${formatTime(currentTimestamp)} of ${formatTime(totalDuration)}`,
    [currentTimestamp, totalDuration]
  );

  // Get event icon based on type
  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'kill': return '💀';
      case 'ability': return '✨';
      case 'spike_plant': return '💣';
      case 'spike_defuse': return '🛡️';
      case 'round_end': return '🏁';
      case 'round_start': return '🚦';
      default: return '•';
    }
  };

  // Get event color based on type
  const getEventColor = (type: string): string => {
    switch (type) {
      case 'kill': return '#ff4757';
      case 'ability': return '#a29bfe';
      case 'spike_plant': return '#fdcb6e';
      case 'spike_defuse': return '#00b894';
      case 'round_end': return '#dfe6e9';
      case 'round_start': return '#74b9ff';
      default: return '#636e72';
    }
  };

  return (
    <div className="timeline-scrubber">
      {/* Current time display */}
      <div className="timeline-scrubber__time">
        <span className="timeline-scrubber__current-time">{formatTime(currentTimestamp)}</span>
        <span className="timeline-scrubber__separator"> / </span>
        <span className="timeline-scrubber__total-time">{formatTime(totalDuration)}</span>
        <span className="timeline-scrubber__round">Round {currentRound}</span>
      </div>

      {/* Timeline track */}
      <div 
        ref={timelineRef}
        className="timeline-scrubber__track"
        onClick={handleTimelineClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Match timeline"
        aria-valuenow={currentTimestamp}
        aria-valuemin={0}
        aria-valuemax={totalDuration}
        aria-valuetext={ariaValueText}
      >
        {/* Progress bar */}
        <div 
          className="timeline-scrubber__progress"
          style={{ width: `${progress}%` }}
        />

        {/* Round markers */}
        {roundResults.map((round, index) => {
          const position = (round.startTimestamp / totalDuration) * 100;
          const endPosition = (round.endTimestamp / totalDuration) * 100;
          
          return (
            <div
              key={round.roundNumber}
              className="timeline-scrubber__round-marker"
              style={{
                left: `${position}%`,
                width: `${endPosition - position}%`,
                backgroundColor: round.winner === 'attacker' ? '#ff4757' : '#3742fa',
              }}
              title={`Round ${round.roundNumber}: ${round.winner} wins${round.endMethod ? ` (${round.endMethod})` : ''}`}
            >
              <span className="timeline-scrubber__round-number">{round.roundNumber}</span>
            </div>
          );
        })}

        {/* Key event markers */}
        {keyEvents.map((event, _index) => {
          const position = (event.timestamp / totalDuration) * 100;
          
          return (
            <div
              key={`${event.timestamp}-${index}`}
              className="timeline-scrubber__event"
              style={{
                left: `${position}%`,
                backgroundColor: getEventColor(event.type),
              }}
              title={`${event.type}: ${event.description} (${formatTime(event.timestamp)})`}
            >
              <span className="timeline-scrubber__event-icon">{getEventIcon(event.type)}</span>
            </div>
          );
        })}

        {/* Playhead */}
        <div 
          className="timeline-scrubber__playhead"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Legend */}
      <div className="timeline-scrubber__legend">
        <div className="timeline-scrubber__legend-item">
          <span className="timeline-scrubber__legend-color" style={{ backgroundColor: '#ff4757' }} />
          <span>Attacker Win</span>
        </div>
        <div className="timeline-scrubber__legend-item">
          <span className="timeline-scrubber__legend-color" style={{ backgroundColor: '#3742fa' }} />
          <span>Defender Win</span>
        </div>
      </div>

      <style>{`
        .timeline-scrubber {
          background: #2d3436;
          padding: 16px;
          border-radius: 8px;
          margin-top: 12px;
        }

        .timeline-scrubber__time {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: #dfe6e9;
        }

        .timeline-scrubber__current-time {
          color: #74b9ff;
          font-weight: bold;
        }

        .timeline-scrubber__separator {
          color: #636e72;
        }

        .timeline-scrubber__total-time {
          color: #b2bec3;
        }

        .timeline-scrubber__round {
          margin-left: auto;
          padding: 4px 12px;
          background: #0984e3;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .timeline-scrubber__track {
          position: relative;
          height: 40px;
          background: #1a1a2e;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .timeline-scrubber__progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: rgba(116, 185, 255, 0.3);
          pointer-events: none;
        }

        .timeline-scrubber__round-marker {
          position: absolute;
          top: 8px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .timeline-scrubber__round-marker:hover {
          opacity: 1;
        }

        .timeline-scrubber__round-number {
          font-size: 10px;
          font-weight: bold;
          color: white;
        }

        .timeline-scrubber__event {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.2s;
          z-index: 10;
        }

        .timeline-scrubber__event:hover {
          transform: translate(-50%, -50%) scale(1.3);
        }

        .timeline-scrubber__playhead {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background: #fff;
          transform: translateX(-50%);
          z-index: 20;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }

        .timeline-scrubber__playhead::before {
          content: '';
          position: absolute;
          top: -6px;
          left: -5px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #fff;
        }

        .timeline-scrubber__legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #b2bec3;
        }

        .timeline-scrubber__legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .timeline-scrubber__legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};
