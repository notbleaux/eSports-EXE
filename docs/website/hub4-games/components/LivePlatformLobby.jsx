'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// === MOCK DATA ===
const REGIONS = ['NA-East', 'NA-West', 'EU-West', 'EU-East', 'Asia', 'OCE'];
const MODES = ['Quick Match', 'Ranked', 'Tournament', 'Conquest'];

const generateMockPlayer = (id) => ({
  id,
  name: `Player_${Math.floor(Math.random() * 9999)}`,
  avatar: ['🎮', '👾', '🕹️', '🎯', '🎲', '🎪'][Math.floor(Math.random() * 6)],
  rank: Math.floor(Math.random() * 100) + 1,
  region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
  ping: Math.floor(Math.random() * 80) + 10,
  status: 'queued'
});

const generateMockMatch = (id) => {
  const maxPlayers = [2, 5, 10, 20, 50][Math.floor(Math.random() * 5)];
  const currentPlayers = Math.floor(Math.random() * maxPlayers);
  
  return {
    id,
    mode: MODES[Math.floor(Math.random() * MODES.length)],
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    players: Array.from({ length: currentPlayers }, (_, i) => generateMockPlayer(`${id}-p${i}`)),
    maxPlayers,
    status: ['waiting', 'forming', 'ready', 'live'][Math.floor(Math.random() * 4)],
    resonance: Math.floor(Math.random() * 30) + 70
  };
};

// === RESONANT SPHERE ===
function ResonantSphere({ resonance, size = 120, pulse = false }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId;
    let time = 0;
    
    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, size, size);
      
      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.35;
      
      // Outer glow rings
      for (let i = 3; i >= 0; i--) {
        const radius = baseRadius + i * 8 + (pulse ? Math.sin(time * 2) * 3 : 0);
        const alpha = (0.1 - i * 0.02) * (resonance / 100);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Main sphere with gradient
      const gradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        0,
        centerX,
        centerY,
        baseRadius
      );
      
      const hue = 180 + (resonance * 0.6);
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 70%, 40%, 0.4)`);
      gradient.addColorStop(1, `hsla(${hue}, 60%, 20%, 0.1)`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Inner energy waves
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + (resonance / 200)})`;
      ctx.lineWidth = 1.5;
      
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        const ringRadius = baseRadius * (0.3 + ring * 0.25);
        
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
          const wave = Math.sin(angle * 8 + time * (1 + ring * 0.5)) * (3 + ring * 2);
          const x = centerX + Math.cos(angle) * (ringRadius + wave);
          const y = centerY + Math.sin(angle) * (ringRadius + wave);
          
          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
      
      // Resonance particles
      const particleCount = Math.floor(resonance / 5);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
        const dist = baseRadius + 15 + Math.sin(time * 3 + i) * 5;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.6 + Math.sin(time * 2 + i) * 0.3})`;
        ctx.fill();
      }
      
      // Center highlight
      ctx.beginPath();
      ctx.arc(centerX - baseRadius * 0.2, centerY - baseRadius * 0.2, baseRadius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationId);
  }, [resonance, size, pulse]);
  
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="resonant-sphere"
    />
  );
}

// === MATCH CARD ===
function MatchCard({ match, onJoin }) {
  const statusColors = {
    waiting: '#6b7280',
    forming: '#f59e0b',
    ready: '#10b981',
    live: '#ef4444',
    completed: '#8b5cf6'
  };

  const statusLabels = {
    waiting: 'Waiting',
    forming: 'Forming',
    ready: 'Ready',
    live: 'LIVE',
    completed: 'Done'
  };

  return (
    <motion.div
      className="match-card"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="match-header">
        <div className="match-mode">{match.mode}</div>
        <div 
          className="match-status-badge"
          style={{ 
            background: `${statusColors[match.status]}20`,
            color: statusColors[match.status],
            borderColor: statusColors[match.status]
          }}
        >
          {match.status === 'live' && <span className="live-dot" />}
          {statusLabels[match.status]}
        </div>
      </div>
      
      <div className="match-region">
        <span className="region-icon">🌍</span>
        {match.region}
      </div>
      
      <div className="match-resonance">
        <ResonantSphere resonance={match.resonance} size={80} pulse={match.status === 'forming'} />
        <div className="resonance-value">
          <span className="resonance-percent">{match.resonance}%</span>
          <span className="resonance-label">Resonance</span>
        </div>
      </div>
      
      <div className="match-players">
        <div className="player-avatars">
          {match.players.slice(0, 5).map((player, i) => (
            <motion.div
              key={player.id}
              className="player-avatar"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              title={`${player.name} (${player.ping}ms)`}
            >
              {player.avatar}
            </motion.div>
          ))}
          {match.players.length > 5 && (
            <div className="player-overflow">+{match.players.length - 5}</div>
          )}
        </div>
        <div className="player-count">
          {match.players.length}/{match.maxPlayers}
        </div>
      </div>
      
      <button 
        className={`join-btn ${match.status}`}
        onClick={() => onJoin(match)}
        disabled={match.status === 'live' || match.status === 'completed'}
      >
        {match.status === 'waiting' && 'Join Queue'}
        {match.status === 'forming' && 'Join Match'}
        {match.status === 'ready' && 'Enter Lobby'}
        {match.status === 'live' && 'In Progress'}
        {match.status === 'completed' && 'Finished'}
      </button>
    </motion.div>
  );
}

// === QUEUE STATUS ===
function QueueStatus({ position, estimatedTime, playersOnline }) {
  return (
    <div className="queue-status">
      <div className="queue-position">
        <span className="position-label">Queue Position</span>
        <span className="position-value">#{position}</span>
      </div>
      
      <div className="queue-time">
        <span className="time-label">Est. Wait</span>
        <span className="time-value">{estimatedTime}</span>
      </div>
      
      <div className="queue-players">
        <span className="players-online">
          <span className="online-dot" />
          {playersOnline.toLocaleString()} online
        </span>
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===
export function LivePlatformLobby({ className = '', onMatchJoin }) {
  const [matches, setMatches] = useState([]);
  const [queuePosition, setQueuePosition] = useState(42);
  const [playersOnline, setPlayersOnline] = useState(12453);
  const [selectedMode, setSelectedMode] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Generate initial matches
    setMatches(Array.from({ length: 6 }, (_, i) => generateMockMatch(`match-${i}`)));
    
    // Update matches periodically
    const interval = setInterval(() => {
      setMatches(prev => {
        const updated = [...prev];
        const idx = Math.floor(Math.random() * updated.length);
        updated[idx] = {
          ...updated[idx],
          players: [...updated[idx].players, generateMockPlayer(`new-${Date.now()}`)].slice(0, updated[idx].maxPlayers)
        };
        return updated;
      });
      
      setQueuePosition(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
      setPlayersOnline(prev => prev + Math.floor(Math.random() * 50) - 25);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = selectedMode === 'all' 
    ? matches 
    : matches.filter(m => m.mode.toLowerCase().includes(selectedMode.toLowerCase()));

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <div className={`live-platform-lobby ${className}`}>
      <div className="lobby-header">
        <div className="header-title">
          <span className="live-indicator">
            <span className="live-pulse" />
            LIVE
          </span>
          <h2>Platform Lobby</h2>
        </div>
        
        <QueueStatus 
          position={queuePosition}
          estimatedTime="~2:30"
          playersOnline={playersOnline}
        />
      </div>
      
      <div className="lobby-controls">
        <div className="mode-filters">
          {['all', ...MODES].map(mode => (
            <button
              key={mode}
              className={`filter-btn ${selectedMode === mode ? 'active' : ''}`}
              onClick={() => setSelectedMode(mode)}
            >
              {mode === 'all' ? 'All Modes' : mode}
            </button>
          ))}
        </div>
        
        <button 
          className={`search-btn ${isSearching ? 'searching' : ''}`}
          onClick={handleSearch}
        >
          {isSearching ? (
            <>
              <span className="search-spinner" />
              Finding Match...
            </>
          ) : (
            <>🔍 Quick Search</>
          )}
        </button>
      </div>
      
      <div className="matches-grid">
        <AnimatePresence mode="popLayout">
          {filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onJoin={onMatchJoin || (() => {})}
            />
          ))}
        </AnimatePresence>
      </div>
      
      <style jsx>{`
        .live-platform-lobby {
          background: linear-gradient(180deg,
            rgba(10, 22, 40, 0.6) 0%,
            rgba(5, 5, 8, 0.9) 100%);
          border-radius: 24px;
          padding: 32px;
          border: 1px solid rgba(0, 240, 255, 0.1);
        }
        
        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 20px;
          font-family: var(--font-data);
          font-size: 0.75rem;
          font-weight: 600;
          color: #ef4444;
        }
        
        .live-pulse {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: livePulse 1.5s ease-in-out infinite;
        }
        
        @keyframes livePulse {
          0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% { 
            opacity: 0.7;
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }
        
        .header-title h2 {
          font-family: var(--font-header);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--njz-porcelain);
        }
        
        /* Queue Status */
        .queue-status {
          display: flex;
          gap: 24px;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
        }
        
        .queue-position,
        .queue-time,
        .queue-players {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .position-label,
        .time-label {
          font-size: 0.625rem;
          color: var(--njz-gray-600);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .position-value {
          font-family: var(--font-data);
          font-size: 1.25rem;
          font-weight: 700;
          color: #00f0ff;
        }
        
        .time-value {
          font-family: var(--font-data);
          font-size: 1rem;
          color: var(--njz-porcelain);
        }
        
        .players-online {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          color: #10b981;
        }
        
        .online-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
        }
        
        /* Lobby Controls */
        .lobby-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .mode-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: var(--njz-gray-500);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--njz-porcelain);
        }
        
        .filter-btn.active {
          background: rgba(0, 240, 255, 0.2);
          border-color: rgba(0, 240, 255, 0.4);
          color: #00f0ff;
        }
        
        .search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #00f0ff, #8338ec);
          border: none;
          border-radius: 10px;
          color: var(--nexus-void);
          font-family: var(--font-header);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .search-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.3);
        }
        
        .search-btn.searching {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .search-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.3);
          border-top-color: var(--nexus-void);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Matches Grid */
        .matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        
        /* Match Card */
        .match-card {
          background: linear-gradient(135deg,
            rgba(13, 17, 23, 0.9) 0%,
            rgba(10, 22, 40, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
        }
        
        .match-card:hover {
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 10px 40px rgba(0, 240, 255, 0.1);
        }
        
        .match-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .match-mode {
          font-family: var(--font-header);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--njz-porcelain);
        }
        
        .match-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid;
        }
        
        .live-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .match-region {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--njz-gray-500);
          margin-bottom: 16px;
        }
        
        .region-icon {
          font-size: 0.875rem;
        }
        
        .match-resonance {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }
        
        .resonant-sphere {
          flex-shrink: 0;
        }
        
        .resonance-value {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .resonance-percent {
          font-family: var(--font-data);
          font-size: 1.5rem;
          font-weight: 700;
          color: #00f0ff;
        }
        
        .resonance-label {
          font-size: 0.625rem;
          color: var(--njz-gray-600);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .match-players {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .player-avatars {
          display: flex;
          margin-left: 8px;
        }
        
        .player-avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(131, 56, 236, 0.2));
          border: 2px solid rgba(0, 240, 255, 0.3);
          border-radius: 50%;
          font-size: 0.875rem;
          margin-left: -8px;
        }
        
        .player-avatar:first-child {
          margin-left: 0;
        }
        
        .player-overflow {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 0.625rem;
          color: var(--njz-gray-400);
          margin-left: -8px;
        }
        
        .player-count {
          font-family: var(--font-data);
          font-size: 0.875rem;
          color: var(--njz-gray-500);
        }
        
        .join-btn {
          width: 100%;
          padding: 12px;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 10px;
          color: #00f0ff;
          font-family: var(--font-header);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .join-btn:hover:not(:disabled) {
          background: rgba(0, 240, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .join-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .join-btn.live {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .join-btn.completed {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.3);
          color: #8b5cf6;
        }
        
        @media (max-width: 768px) {
          .live-platform-lobby {
            padding: 20px;
          }
          
          .lobby-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .queue-status {
            justify-content: space-between;
          }
          
          .lobby-controls {
            flex-direction: column;
          }
          
          .mode-filters {
            width: 100%;
            justify-content: center;
          }
          
          .search-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default LivePlatformLobby;
