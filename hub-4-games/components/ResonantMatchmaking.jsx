import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import '../styles/resonant-matchmaking.css';

/**
 * ResonantMatchmaking - Iridescent Bubble Physics with Chemistry Orbits
 * 
 * Features:
 * - Floating iridescent bubbles representing potential matches
 * - Chemistry orbits showing compatibility connections
 * - Physics-based interactions
 * - Toroidal vortex transitions
 */

const MATCH_TYPES = {
  COMPETITIVE: { color: '#ff0080', label: 'Competitive', icon: '⚔️' },
  COOPERATIVE: { color: '#00ff88', label: 'Cooperative', icon: '🤝' },
  SOCIAL: { color: '#ffd700', label: 'Social', icon: '💬' },
  CREATIVE: { color: '#8800ff', label: 'Creative', icon: '🎨' },
  EXPLORATION: { color: '#0088ff', label: 'Exploration', icon: '🗺️' },
  STRATEGY: { color: '#ff8c00', label: 'Strategy', icon: '♟️' }
};

const CHEMISTRY_LEVELS = {
  LOW: { threshold: 30, color: '#ff4444', label: 'Low' },
  MEDIUM: { threshold: 60, color: '#ffaa00', label: 'Medium' },
  HIGH: { threshold: 80, color: '#00f0ff', label: 'High' },
  PERFECT: { threshold: 95, color: '#00ff88', label: 'Perfect' }
};

const ResonantMatchmaking = ({ 
  playerProfile,
  onMatchFound,
  searchEnabled = true,
  className = ''
}) => {
  const [bubbles, setBubbles] = useState([]);
  const [orbits, setOrbits] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const bubbleIdCounter = useRef(0);

  // Generate random bubbles
  const generateBubble = useCallback(() => {
    const types = Object.keys(MATCH_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 60 + Math.random() * 80;
    const x = 10 + Math.random() * 80;
    const y = 10 + Math.random() * 80;
    const chemistry = Math.floor(Math.random() * 100);
    
    return {
      id: `bubble-${bubbleIdCounter.current++}`,
      type,
      size,
      x,
      y,
      chemistry,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.6 + (chemistry / 100) * 0.4,
      pulseSpeed: 2 + Math.random() * 2,
      matchData: {
        username: `Player${Math.floor(Math.random() * 9999)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        level: Math.floor(Math.random() * 100),
        winRate: Math.floor(Math.random() * 100),
        region: ['NA', 'EU', 'ASIA', 'SA'][Math.floor(Math.random() * 4)]
      }
    };
  }, []);

  // Initialize bubbles
  useEffect(() => {
    const initialBubbles = Array.from({ length: 8 }, generateBubble);
    setBubbles(initialBubbles);
  }, [generateBubble]);

  // Generate chemistry orbits between compatible bubbles
  const generateOrbits = useCallback((bubbleList) => {
    const newOrbits = [];
    for (let i = 0; i < bubbleList.length; i++) {
      for (let j = i + 1; j < bubbleList.length; j++) {
        const b1 = bubbleList[i];
        const b2 = bubbleList[j];
        const distance = Math.sqrt(
          Math.pow(b1.x - b2.x, 2) + Math.pow(b1.y - b2.y, 2)
        );
        
        // Create orbit if bubbles are close and have good chemistry
        if (distance < 30 && Math.abs(b1.chemistry - b2.chemistry) < 20) {
          const chemistry = Math.floor((b1.chemistry + b2.chemistry) / 2);
          newOrbits.push({
            id: `orbit-${b1.id}-${b2.id}`,
            from: b1.id,
            to: b2.id,
            chemistry,
            x1: b1.x,
            y1: b1.y,
            x2: b2.x,
            y2: b2.y,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    }
    setOrbits(newOrbits);
  }, []);

  // Update orbits when bubbles change
  useEffect(() => {
    if (bubbles.length > 0) {
      generateOrbits(bubbles);
    }
  }, [bubbles, generateOrbits]);

  // Animate bubbles
  useEffect(() => {
    const animate = () => {
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          let newX = bubble.x + bubble.vx;
          let newY = bubble.y + bubble.vy;
          let newVx = bubble.vx;
          let newVy = bubble.vy;

          // Bounce off walls
          if (newX < 5 || newX > 95) newVx *= -1;
          if (newY < 5 || newY > 95) newVy *= -1;

          // Keep in bounds
          newX = Math.max(5, Math.min(95, newX));
          newY = Math.max(5, Math.min(95, newY));

          // Add slight floating motion
          const floatX = Math.sin(Date.now() * 0.001 + bubble.phase) * 0.2;
          const floatY = Math.cos(Date.now() * 0.001 + bubble.phase * 0.7) * 0.2;

          return {
            ...bubble,
            x: newX + floatX,
            y: newY + floatY,
            vx: newVx,
            vy: newVy,
            phase: bubble.phase + 0.02
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Search for matches
  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setMatchProgress(0);
    setResonanceLevel(0);

    // Simulate search progress
    const progressInterval = setInterval(() => {
      setMatchProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate resonance buildup
    const resonanceInterval = setInterval(() => {
      setResonanceLevel(prev => {
        if (prev >= 100) {
          clearInterval(resonanceInterval);
          setIsSearching(false);
          // Add new bubbles
          const newBubbles = Array.from({ length: 3 }, generateBubble);
          setBubbles(prev => [...prev.slice(-6), ...newBubbles]);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 300);
  }, [generateBubble]);

  // Get chemistry level
  const getChemistryLevel = (chemistry) => {
    if (chemistry >= CHEMISTRY_LEVELS.PERFECT.threshold) return CHEMISTRY_LEVELS.PERFECT;
    if (chemistry >= CHEMISTRY_LEVELS.HIGH.threshold) return CHEMISTRY_LEVELS.HIGH;
    if (chemistry >= CHEMISTRY_LEVELS.MEDIUM.threshold) return CHEMISTRY_LEVELS.MEDIUM;
    return CHEMISTRY_LEVELS.LOW;
  };

  // Handle bubble click
  const handleBubbleClick = (bubble) => {
    setSelectedBubble(selectedBubble?.id === bubble.id ? null : bubble);
  };

  // Handle match accept
  const handleMatchAccept = () => {
    if (selectedBubble && onMatchFound) {
      onMatchFound(selectedBubble);
    }
  };

  // Memoized iridescent gradient
  const iridescentGradient = useMemo(() => (chemistry) => {
    const hue = (chemistry * 3.6 + Date.now() * 0.05) % 360;
    return `linear-gradient(135deg, 
      hsl(${hue}, 80%, 60%) 0%, 
      hsl(${(hue + 60) % 360}, 80%, 50%) 50%, 
      hsl(${(hue + 120) % 360}, 80%, 60%) 100%)`;
  }, []);

  return (
    <div className={`resonant-matchmaking ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="matchmaking-header">
        <div className="matchmaking-title">
          <span className="matchmaking-icon">🔮</span>
          <h3>Resonant Matchmaking</h3>
        </div>
        <div className="matchmaking-controls">
          {searchEnabled && (
            <button
              className={`search-button ${isSearching ? 'searching' : ''}`}
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <span className="search-spinner" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Find Match</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search Progress */}
      {isSearching && (
        <div className="search-progress-container">
          <div className="search-progress-bar">
            <div 
              className="search-progress-fill"
              style={{ width: `${Math.min(matchProgress, 100)}%` }}
            />
          </div>
          <div className="search-progress-info">
            <span>Scanning resonance fields...</span>
            <span>{Math.floor(Math.min(matchProgress, 100))}%</span>
          </div>
        </div>
      )}

      {/* Resonance Level */}
      <div className="resonance-indicator">
        <div className="resonance-label">Resonance Level</div>
        <div className="resonance-bar">
          <div 
            className="resonance-fill"
            style={{ 
              width: `${Math.min(resonanceLevel, 100)}%`,
              boxShadow: `0 0 ${resonanceLevel / 5}px var(--neon-cyan)`
            }}
          />
        </div>
        <div className="resonance-value">{Math.floor(resonanceLevel)}%</div>
      </div>

      {/* Bubble Field */}
      <div className="bubble-field">
        {/* Chemistry Orbits */}
        <svg className="orbits-svg">
          {orbits.map(orbit => {
            const chemistryLevel = getChemistryLevel(orbit.chemistry);
            return (
              <line
                key={orbit.id}
                x1={`${orbit.x1}%`}
                y1={`${orbit.y1}%`}
                x2={`${orbit.x2}%`}
                y2={`${orbit.y2}%`}
                stroke={chemistryLevel.color}
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="8"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </line>
            );
          })}
        </svg>

        {/* Bubbles */}
        {bubbles.map(bubble => {
          const type = MATCH_TYPES[bubble.type];
          const chemistryLevel = getChemistryLevel(bubble.chemistry);
          const isSelected = selectedBubble?.id === bubble.id;
          
          return (
            <div
              key={bubble.id}
              className={`match-bubble ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                background: iridescentGradient(bubble.chemistry),
                opacity: bubble.opacity,
                animationDuration: `${bubble.pulseSpeed}s`
              }}
              onClick={() => handleBubbleClick(bubble)}
            >
              {/* Bubble Content */}
              <div className="bubble-content">
                <span className="bubble-icon">{type.icon}</span>
                <div className="bubble-chemistry" style={{ color: chemistryLevel.color }}>
                  {bubble.chemistry}%
                </div>
              </div>

              {/* Bubble Glow */}
              <div 
                className="bubble-glow"
                style={{ 
                  background: `radial-gradient(circle, ${chemistryLevel.color}40 0%, transparent 70%)`,
                }}
              />

              {/* Chemistry Rings */}
              <div className="chemistry-rings">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="chemistry-ring"
                    style={{
                      animationDelay: `${i * 0.5}s`,
                      borderColor: chemistryLevel.color
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Vortex Effect */}
        <div className="vortex-center">
          <div className="vortex-ring" />
          <div className="vortex-ring" />
          <div className="vortex-ring" />
        </div>
      </div>

      {/* Selected Bubble Details */}
      {selectedBubble && (
        <div className="bubble-details animate-vortex-in">
          <div className="bubble-details-header">
            <img 
              src={selectedBubble.matchData.avatar} 
              alt={selectedBubble.matchData.username}
              className="bubble-avatar"
            />
            <div className="bubble-info">
              <h4>{selectedBubble.matchData.username}</h4>
              <div className="bubble-meta">
                <span className="meta-tag">Lv.{selectedBubble.matchData.level}</span>
                <span className="meta-tag">{selectedBubble.matchData.region}</span>
                <span className="meta-tag win-rate">
                  {selectedBubble.matchData.winRate}% WR
                </span>
              </div>
            </div>
            <div 
              className="bubble-chemistry-badge"
              style={{ 
                background: getChemistryLevel(selectedBubble.chemistry).color,
                boxShadow: `0 0 20px ${getChemistryLevel(selectedBubble.chemistry).color}`
              }}
            >
              {selectedBubble.chemistry}%
            </div>
          </div>

          <div className="bubble-type-info">
            <span className="type-icon">{MATCH_TYPES[selectedBubble.type].icon}</span>
            <span className="type-label">{MATCH_TYPES[selectedBubble.type].label}</span>
          </div>

          <div className="bubble-actions">
            <button className="action-button secondary" onClick={() => setSelectedBubble(null)}>
              Skip
            </button>
            <button className="action-button primary" onClick={handleMatchAccept}>
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="matchmaking-legend">
        {Object.entries(MATCH_TYPES).map(([key, config]) => (
          <div key={key} className="legend-item">
            <span className="legend-icon" style={{ color: config.color }}>
              {config.icon}
            </span>
            <span className="legend-label">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResonantMatchmaking;
