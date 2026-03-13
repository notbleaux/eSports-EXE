/**
 * Minimap Panel - Tactical radar display
 * 
 * [Ver001.000]
 */
import { useState } from 'react';
import { ZoomIn, ZoomOut, Crosshair, MapPin } from 'lucide-react';
import { colors } from '@/theme/colors';

const MOCK_PLAYERS = [
  { id: 1, x: 30, y: 40, team: 'ally', name: 'Player1' },
  { id: 2, x: 60, y: 50, team: 'ally', name: 'Player2' },
  { id: 3, x: 45, y: 60, team: 'ally', name: 'Player3' },
  { id: 4, x: 70, y: 30, team: 'enemy', name: 'Enemy1' },
  { id: 5, x: 25, y: 70, team: 'enemy', name: 'Enemy2' },
];

export function MinimapPanel() {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  
  const zoomIn = () => setZoom((z) => Math.min(z + 0.5, 5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));
  
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0f] rounded-lg overflow-hidden">
      {/* Minimap Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid Background */}
        {showGrid && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            }}
          />
        )}
        
        {/* Radar Sweep Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 w-[200%] h-[200%] origin-top-left"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.1) 60deg, transparent 60deg)',
              animation: 'radarSweep 4s linear infinite',
            }}
          />
        </div>
        
        {/* Players */}
        <div 
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {MOCK_PLAYERS.map((player) => (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm rotate-45"
                style={{
                  backgroundColor: player.team === 'ally' ? colors.hub.rotas.base : colors.status.error,
                  boxShadow: `0 0 8px ${player.team === 'ally' ? colors.hub.rotas.glow : 'rgba(255,70,85,0.5)'}`,
                }}
              />
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] text-white/70 whitespace-nowrap">
                {player.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Crosshair className="w-6 h-6 text-white/20" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-t border-white/10 bg-[#14141a]">
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/60 w-12 text-center">
            {zoom.toFixed(1)}x
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            disabled={zoom >= 5}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded transition-colors ${
            showGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
