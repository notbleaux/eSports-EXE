/** [Ver001.000] */
/**
 * TacticalView Component
 * ======================
 * Enriched minimap tactical view for VCT matches.
 * Renders real-time agent positions, trails, and match events.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  TacticalViewProps, 
  TacticalViewState, 
  MatchFrame, 
  Position
} from './types';
import { PLAYBACK_SPEEDS } from './types';
import { TacticalControls } from './TacticalControls';
import { TimelineScrubber } from './TimelineScrubber';
// TODO: AgentSprite and AGENT_ROLE_COLORS to be used for enhanced sprite rendering in future update
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { logger } from '@/utils/logger';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;
const FPS = 10; // Frames per second for playback

export const TacticalView: React.FC<TacticalViewProps> = ({
  matchId: _matchId,
  timeline,
  mapData,
  players,
  initialState,
  onFrameChange,
  onEventSelect: _onEventSelect,
  onPlayerSelect: _onPlayerSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Component state
  const [state, setState] = useState<TacticalViewState>({
    isPlaying: false,
    playbackSpeed: 1,
    currentTimestamp: 0,
    showTrails: true,
    trailLength: 30,
    showVisionCones: false,
    showAbilityRanges: true,
    showHealthBars: true,
    showPlayerNames: true,
    showLoadout: false,
    followPlayer: undefined,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    selectedTeams: ['attacker', 'defender'],
    selectedPlayers: players.map(p => p.id),
    highlightAbilityTypes: [],
    ...initialState,
  });

  // Get current frame based on timestamp
  const currentFrame = useMemo((): MatchFrame | null => {
    if (!timeline.frames.length) return null;
    
    // Find frame closest to current timestamp
    return timeline.frames.reduce((closest, frame) => {
      if (!closest) return frame;
      const closestDiff = Math.abs(closest.timestamp - state.currentTimestamp);
      const frameDiff = Math.abs(frame.timestamp - state.currentTimestamp);
      return frameDiff < closestDiff ? frame : closest;
    }, null as MatchFrame | null);
  }, [timeline.frames, state.currentTimestamp]);

  // Coordinate transformation: in-game → canvas
  const gameToCanvas = useCallback((pos: Position): { x: number; y: number } => {
    const scaleX = CANVAS_WIDTH / mapData.dimensions.inGameUnits;
    const scaleY = CANVAS_HEIGHT / mapData.dimensions.inGameUnits;
    
    return {
      x: (pos.x * scaleX * state.zoom) + state.panOffset.x + (CANVAS_WIDTH / 2),
      y: (pos.y * scaleY * state.zoom) + state.panOffset.y + (CANVAS_HEIGHT / 2),
    };
  }, [mapData.dimensions, state.zoom, state.panOffset]);

  // Draw frame on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw minimap background (if loaded)
    // TODO: Load and draw minimap image

    // Draw grid
    if (state.zoom > 0.5) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 50 * state.zoom;
      
      for (let x = state.panOffset.x % gridSize; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      
      for (let y = state.panOffset.y % gridSize; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    // Get frames for trail rendering
    const currentFrameIndex = timeline.frames.indexOf(currentFrame);
    const trailFrames = timeline.frames.slice(
      Math.max(0, currentFrameIndex - state.trailLength),
      currentFrameIndex + 1
    );

    // Draw trails first (behind agents)
    if (state.showTrails) {
      players.forEach(player => {
        if (!state.selectedPlayers.includes(player.id)) return;
        
        const trailPositions: Position[] = [];
        trailFrames.forEach(frame => {
          const agentFrame = frame.agentFrames.find(af => af.playerId === player.id);
          if (agentFrame) {
            trailPositions.push(agentFrame.position);
          }
        });

        if (trailPositions.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = `${player.agent.color}40`; // 25% opacity
          ctx.lineWidth = 3 * state.zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          trailPositions.forEach((pos, i) => {
            const canvasPos = gameToCanvas(pos);
            if (i === 0) {
              ctx.moveTo(canvasPos.x, canvasPos.y);
            } else {
              ctx.lineTo(canvasPos.x, canvasPos.y);
            }
          });
          ctx.stroke();
        }
      });
    }

    // Draw active abilities
    currentFrame.abilitiesActive.forEach(ability => {
      const pos = gameToCanvas(ability.position);
      const radius = ability.radius * state.zoom * (CANVAS_WIDTH / mapData.dimensions.inGameUnits);
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${ability.agentName === 'Phoenix' ? '#ff6b35' : '#ffffff'}20`;
      ctx.fill();
      ctx.strokeStyle = ability.agentName === 'Phoenix' ? '#ff6b35' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw spike
    if (currentFrame.spikePosition && currentFrame.spikeStatus !== 'defused') {
      const spikePos = gameToCanvas(currentFrame.spikePosition);
      ctx.beginPath();
      ctx.arc(spikePos.x, spikePos.y, 15 * state.zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Pulse effect
      const pulseRadius = 20 * state.zoom + Math.sin(Date.now() / 200) * 5;
      ctx.beginPath();
      ctx.arc(spikePos.x, spikePos.y, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw agents
    currentFrame.agentFrames.forEach(agentFrame => {
      const player = players.find(p => p.id === agentFrame.playerId);
      if (!player) return;
      if (!state.selectedPlayers.includes(player.id)) return;
      if (!state.selectedTeams.includes(player.teamSide)) return;

      const pos = gameToCanvas(agentFrame.position);
      
      // Draw agent sprite
      const size = 20 * state.zoom;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((agentFrame.rotation * Math.PI) / 180);
      
      // Agent body
      ctx.fillStyle = player.teamSide === 'attacker' ? '#ff4757' : '#3742fa';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 4, -size / 4);
      ctx.lineTo(size / 4, size / 4);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Health bar
      if (state.showHealthBars && player.health > 0) {
        const barWidth = 30 * state.zoom;
        const barHeight = 4 * state.zoom;
        ctx.fillStyle = '#000000';
        ctx.fillRect(pos.x - barWidth / 2, pos.y - size - 10, barWidth, barHeight);
        ctx.fillStyle = player.health > 50 ? '#2ed573' : player.health > 25 ? '#ffa502' : '#ff4757';
        ctx.fillRect(pos.x - barWidth / 2, pos.y - size - 10, barWidth * (player.health / 100), barHeight);
      }

      // Player name
      if (state.showPlayerNames) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${10 * state.zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(player.name, pos.x, pos.y + size + 15);
      }
    });

    // Draw callouts (if zoomed in enough)
    if (state.zoom > 1.5) {
      // TODO: Draw map callouts
    }
  }, [currentFrame, gameToCanvas, players, state, timeline.frames, mapData]);

  // Animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (state.isPlaying) {
        const deltaTime = currentTime - lastFrameTimeRef.current;
        
        if (deltaTime >= 1000 / (FPS * state.playbackSpeed)) {
          setState(prev => {
            const newTimestamp = prev.currentTimestamp + (1000 / FPS);
            const maxTimestamp = timeline.matchDuration * 1000;
            
            // Loop or stop at end
            if (newTimestamp >= maxTimestamp) {
              return { ...prev, currentTimestamp: 0, isPlaying: false };
            }
            
            return { ...prev, currentTimestamp: newTimestamp };
          });
          
          lastFrameTimeRef.current = currentTime;
        }
      }
      
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.playbackSpeed, state.currentTimestamp, timeline.matchDuration, draw]);

  // Notify parent of frame change
  useEffect(() => {
    if (currentFrame && onFrameChange) {
      onFrameChange(currentFrame);
    }
  }, [currentFrame, onFrameChange]);

  // Canvas context loss/restoration handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      logger.warn('Canvas context lost');
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleContextRestored = () => {
      logger.info('Canvas context restored');
      // Force redraw
      draw();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [draw]);

  // Handle play/pause
  const togglePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Handle speed change
  const setSpeed = useCallback((speed: typeof PLAYBACK_SPEEDS[number]) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  // Handle timeline scrub
  const seekTo = useCallback((timestamp: number) => {
    setState(prev => ({ 
      ...prev, 
      currentTimestamp: timestamp,
      isPlaying: false 
    }));
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 4) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.25) }));
  }, []);

  return (
    <div className="tactical-view">
      <div className="tactical-view__canvas-container">
        <CanvasErrorBoundary>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="tactical-view__canvas"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              background: '#1a1a2e',
              borderRadius: '8px',
            }}
          />
        </CanvasErrorBoundary>
      </div>

      <TacticalControls
        isPlaying={state.isPlaying}
        playbackSpeed={state.playbackSpeed}
        showTrails={state.showTrails}
        showVisionCones={state.showVisionCones}
        showHealthBars={state.showHealthBars}
        showPlayerNames={state.showPlayerNames}
        onTogglePlayback={togglePlayback}
        onSpeedChange={setSpeed}
        onToggleTrails={() => setState(prev => ({ ...prev, showTrails: !prev.showTrails }))}
        onToggleVisionCones={() => setState(prev => ({ ...prev, showVisionCones: !prev.showVisionCones }))}
        onToggleHealthBars={() => setState(prev => ({ ...prev, showHealthBars: !prev.showHealthBars }))}
        onTogglePlayerNames={() => setState(prev => ({ ...prev, showPlayerNames: !prev.showPlayerNames }))}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      <TimelineScrubber
        currentTimestamp={state.currentTimestamp}
        totalDuration={timeline.matchDuration * 1000}
        roundResults={timeline.roundResults}
        keyEvents={timeline.keyEvents}
        onSeek={seekTo}
        currentRound={currentFrame?.roundNumber || 1}
      />
    </div>
  );
};

export default TacticalView;
