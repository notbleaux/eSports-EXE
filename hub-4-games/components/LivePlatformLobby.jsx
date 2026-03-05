import React, { useState, useEffect, useRef } from 'react';
import '../styles/live-platform-lobby.css';

/**
 * LivePlatformLobby - Real-time Match Visualization with Resonant Sphere Progression
 * 
 * Features:
 * - Real-time match visualization
 * - Resonant sphere progression
 * - Live player count and queue status
 * - Match history and stats
 */

const MOCK_MATCHES = [
  {
    id: 'match-1',
    mode: 'Competitive',
    map: 'Nexus Arena',
    players: { current: 8, max: 10 },
    status: 'in-progress',
    timeElapsed: '12:34',
    resonance: 85,
    teams: [
      { name: 'Alpha', score: 12, color: '#00f0ff' },
      { name: 'Omega', score: 9, color: '#ff0080' }
    ]
  },
  {
    id: 'match-2',
    mode: 'Cooperative',
    map: 'Harmonic Depths',
    players: { current: 4, max: 4 },
    status: 'starting',
    timeElapsed: '00:15',
    resonance: 100,
    teams: [
      { name: 'Squad', score: 0, color: '#00ff88' }
    ]
  },
  {
    id: 'match-3',
    mode: 'Creative',
    map: 'Sandbox Prime',
    players: { current: 23, max: 50 },
    status: 'in-progress',
    timeElapsed: '2:45:12',
    resonance: 67,
    teams: [
      { name: 'Builders', score: 0, color: '#8800ff' }
    ]
  }
];

const QUEUE_STATUS = {
  players: 1247,
  avgWaitTime: '2:34',
  activeMatches: 89,
  resonanceLevel: 78
};

const RESONANCE_RINGS = 5;

const LivePlatformLobby = ({ 
  onJoinMatch,
  onSpectate,
  className = ''
}) => {
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [queueStatus, setQueueStatus] = useState(QUEUE_STATUS);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resonancePhase, setResonancePhase] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const canvasRef = useRef(null);

  // Animate resonance
  useEffect(() => {
    const interval = setInterval(() => {
      setResonancePhase(prev => (prev + 0.02) % (Math.PI * 2));
      setPulseIntensity(1 + Math.sin(Date.now() * 0.003) * 0.2);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStatus(prev => ({
        ...prev,
        players: prev.players + Math.floor(Math.random() * 10) - 5,
        resonanceLevel: Math.max(0, Math.min(100, prev.resonanceLevel + Math.floor(Math.random() * 6) - 3))
      }));

      setMatches(prev => prev.map(match => ({
        ...match,
        resonance: Math.max(0, Math.min(100, match.resonance + Math.floor(Math.random() * 10) - 5))
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Draw resonance visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw resonance rings
      for (let i = 0; i < RESONANCE_RINGS; i++) {
        const radius = 50 + i * 30;
        const phase = resonancePhase + (i * Math.PI / 3);
        const opacity = 0.3 + Math.sin(phase) * 0.2;
        const lineWidth = 2 + Math.sin(phase) * 1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * pulseIntensity, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Add glow
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw center orb
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 40
      );
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 * pulseIntensity, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw particles
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + resonancePhase;
        const distance = 100 + Math.sin(resonancePhase * 2 + i) * 30;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = 2 + Math.sin(resonancePhase + i) * 1;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.5 + Math.sin(resonancePhase + i) * 0.3})`;
        ctx.fill();
      }
    };

    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    animate();
  }, [resonancePhase, pulseIntensity]);

  const getResonanceColor = (level) => {
    if (level >= 80) return '#00ff88';
    if (level >= 60) return '#00f0ff';
    if (level >= 40) return '#ffd700';
    return '#ff4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return '#00ff88';
      case 'starting': return '#ffd700';
      case 'waiting': return '#ff4444';
      default: return '#00f0ff';
    }
  };

  return (
    <div className={`live-platform-lobby ${className}`}>
      {/* Header Stats */}
      <div className="lobby-stats-bar">
        <div className="stat-card live-indicator">
          <span className="live-dot" />
          <span className="live-text">LIVE</span>
          <span className="live-players">{queueStatus.players.toLocaleString()} online</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-content">
            <span className="stat-value">{queueStatus.avgWaitTime}</span>
            <span className="stat-label">Avg Wait</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">🎮</span>
          <div className="stat-content">
            <span className="stat-value">{queueStatus.activeMatches}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        
        <div className="stat-card resonance-card">
          <div 
            className="resonance-indicator-large"
            style={{ '--resonance-color': getResonanceColor(queueStatus.resonanceLevel) }}
          >
            <svg viewBox="0 0 36 36">
              <path
                className="resonance-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="resonance-fill"
                strokeDasharray={`${queueStatus.resonanceLevel}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="resonance-value">{queueStatus.resonanceLevel}%</span>
          </div>
          <span className="stat-label">Resonance</span>
        </div>
      </div>

      <div className="lobby-main">
        {/* Resonance Visualization */}
        <div className="resonance-visualization">
          <canvas 
            ref={canvasRef}
            width={400}
            height={400}
            className="resonance-canvas"
          />
          
          <div className="resonance-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#00ff88' }} />
              <span>Optimal</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#00f0ff' }} />
              <span>Active</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ffd700' }} />
              <span>Building</span>
            </div>
          </div>
        </div>

        {/* Active Matches */}
        <div className="matches-section">
          <h3 className="section-title">
            <span>Active Matches</span>
            <span className="match-count">{matches.length} visible</span>
          </h3>
          
          <div className="matches-list">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className={`match-card ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  '--match-status-color': getStatusColor(match.status)
                }}
                onClick={() => setSelectedMatch(selectedMatch?.id === match.id ? null : match)}
              >
                <div className="match-header">
                  <div className="match-mode-badge">
                    {match.mode}
                  </div>
                  <div 
                    className="match-status"
                    style={{ color: getStatusColor(match.status) }}
003e
                    <span className="status-dot" />
                    {match.status}
                  </div>
                </div>

                <div className="match-details">
                  <div className="match-map">
                    <span className="map-icon">🗺️</span>
                    <span>{match.map}</span>
                  </div>
                  
                  <div className="match-players">
                    <span className="players-icon">👥</span>
                    <span>{match.players.current}/{match.players.max}</span>
                  </div>
                  
                  <div className="match-time">
                    <span className="time-icon">⏱️</span>
                    <span>{match.timeElapsed}</span>
                  </div>
                </div>

                <div className="match-resonance">
                  <div className="resonance-bar">
                    <div 
                      className="resonance-fill"
                      style={{ 
                        width: `${match.resonance}%`,
                        background: getResonanceColor(match.resonance)
                      }}
                    />
                  </div>
                  <span className="resonance-text">{match.resonance}%</span>
                </div>

                {match.teams.length > 1 && (
                  <div className="match-score">
                    {match.teams.map((team, i) => (
                      <div key={team.name} className="team-score">
                        <span 
                          className="team-name"
                          style={{ color: team.color }}
                        >
                          {team.name}
                        </span>
                        <span className="score-value">{team.score}</span>
                        {i < match.teams.length - 1 && <span className="score-divider">-</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="match-actions">
                  <button 
                    className="match-action-btn spectate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpectate?.(match);
                    }}
                  >
                    👁️ Spectate
                  </button>
                  
                  {match.players.current < match.players.max && (
                    <button 
                      className="match-action-btn join"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinMatch?.(match);
                      }}
                    >
                      ▶️ Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePlatformLobby;
