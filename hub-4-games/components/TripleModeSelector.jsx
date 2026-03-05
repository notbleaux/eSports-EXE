import React, { useState, useEffect, useRef } from 'react';
import '../styles/triple-mode-selector.css';

/**
 * TripleModeSelector - CSS 3D Star Tetrahedron
 * 
 * Features:
 * - 3D star tetrahedron rendered with CSS transforms
 * - 9 game mode configurations (3x3 matrix)
 * - Smooth rotation and selection animations
 * - Glowing node effects
 */

const MODE_MATRIX = {
  // Primary modes (tetrahedron vertices)
  primary: [
    { 
      id: 'casual',
      name: 'CASUAL',
      description: 'Relaxed Play',
      icon: '☕',
      color: '#00ff88',
      subModes: ['Zen Garden', 'Coffee Break', 'Story Mode']
    },
    { 
      id: 'competitive',
      name: 'COMPETITIVE',
      description: 'Ranked Matches',
      icon: '⚔️',
      color: '#ff0080',
      subModes: ['Ranked Ladder', 'Tournament', 'Arena']
    },
    { 
      id: 'creative',
      name: 'CREATIVE',
      description: 'Build & Design',
      icon: '🎨',
      color: '#8800ff',
      subModes: ['Sandbox', 'Level Editor', 'Mod Workshop']
    }
  ],
  // Secondary modes (tetrahedron face centers)
  secondary: [
    {
      id: 'exploration',
      name: 'EXPLORATION',
      description: 'Discovery Mode',
      icon: '🗺️',
      color: '#0088ff',
      subModes: ['Open World', 'Expedition', 'Treasure Hunt']
    },
    {
      id: 'strategic',
      name: 'STRATEGIC',
      description: 'Tactical Depth',
      icon: '♟️',
      color: '#ff8c00',
      subModes: ['Turn-Based', 'Real-Time', '4X Strategy']
    },
    {
      id: 'cooperative',
      name: 'COOPERATIVE',
      description: 'Team Play',
      icon: '🤝',
      color: '#ffd700',
      subModes: ['Squad Mode', 'Raid', 'Co-op Campaign']
    }
  ],
  // Tertiary mode (center)
  tertiary: {
    id: 'hybrid',
    name: 'HYBRID',
    description: 'Mixed Modes',
    icon: '🔮',
    color: '#00f0ff',
    subModes: ['Dynamic Events', 'Rotating Modes', 'Custom Rules']
  }
};

const TripleModeSelector = ({ 
  onModeSelect,
  selectedMode = null,
  className = ''
}) => {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedSubMode, setSelectedSubMode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: -20, y: 45 });

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isDragging) return;

    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: (prev.y + 0.5) % 360
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Handle mouse/touch events for rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = {
      x: e.clientX || e.touches?.[0]?.clientX,
      y: e.clientY || e.touches?.[0]?.clientY
    };
    rotationRef.current = { ...rotation };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    setRotation({
      x: Math.max(-60, Math.min(60, rotationRef.current.x - deltaY * 0.5)),
      y: (rotationRef.current.y + deltaX * 0.5) % 360
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 2000);
  };

  // Handle node click
  const handleNodeClick = (mode, type) => {
    if (onModeSelect) {
      onModeSelect({ ...mode, type });
    }
  };

  // Handle sub-mode click
  const handleSubModeClick = (subMode, parentMode) => {
    setSelectedSubMode({ name: subMode, parent: parentMode });
  };

  // Calculate node position on tetrahedron
  const getNodePosition = (index, total, radius = 150) => {
    const angle = (index / total) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5,
      z: Math.sin(angle) * radius
    };
  };

  return (
    <div 
      className={`triple-mode-selector ${className}`}
      ref={containerRef}
    >
      <div className="tetrahedron-header">
        <h3 className="tetrahedron-title">
          <span className="title-icon">✦</span>
          Mode Matrix
        </h3>
        <button 
          className="auto-rotate-toggle"
          onClick={() => setAutoRotate(!autoRotate)}
        >
          {autoRotate ? '⏸️' : '▶️'}
        </button>
      </div>

      <div 
        className={`tetrahedron-container ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="tetrahedron"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
          }}
        >
          {/* Connection Lines */}
          <svg className="connection-lines">
            <!-- Connect primary modes -->
            {MODE_MATRIX.primary.map((_, i) => {
              const nextIndex = (i + 1) % 3;
              return (
                <line
                  key={`primary-${i}`}
                  className="connection-line"
                  x1="50%"
                  y1="30%"
                  x2={`${30 + nextIndex * 20}%`}
                  y2="70%"
                  stroke={MODE_MATRIX.primary[i].color}
                  strokeOpacity="0.3"
                />
              );
            })}
            
            <!-- Connect to center -->
            {MODE_MATRIX.primary.map((mode, i) => (
              <line
                key={`center-${i}`}
                className="connection-line"
                x1={`${30 + i * 20}%`}
                y1="30%"
                x2="50%"
                y2="50%"
                stroke={mode.color}
                strokeOpacity="0.2"
              />
            ))}
          </svg>

          {/* Primary Mode Nodes */}
          {MODE_MATRIX.primary.map((mode, index) => {
            const pos = getNodePosition(index, 3, 120);
            const isSelected = selectedMode?.id === mode.id;
            const isHovered = hoveredNode === mode.id;
            
            return (
              <div
                key={mode.id}
                className={`tetra-node primary ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  '--node-color': mode.color,
                  transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`
                }}
                onMouseEnter={() => setHoveredNode(mode.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(mode, 'primary')}
              >
                <div className="node-core">
                  <span className="node-icon">{mode.icon}</span>
                </div>
                <div className="node-glow" />
                <div className="node-ring" />
                
                {(isHovered || isSelected) && (
                  <div className="node-tooltip">
                    <div className="tooltip-name" style={{ color: mode.color }}>
                      {mode.name}
                    </div>
                    <div className="tooltip-desc">{mode.description}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Secondary Mode Nodes */}
          {MODE_MATRIX.secondary.map((mode, index) => {
            const pos = getNodePosition(index + 0.5, 3, 80);
            const isSelected = selectedMode?.id === mode.id;
            const isHovered = hoveredNode === mode.id;
            
            return (
              <div
                key={mode.id}
                className={`tetra-node secondary ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  '--node-color': mode.color,
                  transform: `translate3d(${pos.x}px, ${pos.y + 40}px, ${pos.z}px)`
                }}
                onMouseEnter={() => setHoveredNode(mode.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(mode, 'secondary')}
              >
                <div className="node-core">
                  <span className="node-icon">{mode.icon}</span>
                </div>
                <div className="node-glow" />
                
                {(isHovered || isSelected) && (
                  <div className="node-tooltip">
                    <div className="tooltip-name" style={{ color: mode.color }}>
                      {mode.name}
                    </div>
                    <div className="tooltip-desc">{mode.description}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Center Node */}
          <div
            className={`tetra-node center ${selectedMode?.id === MODE_MATRIX.tertiary.id ? 'selected' : ''}`}
            style={{ '--node-color': MODE_MATRIX.tertiary.color }}
            onClick={() => handleNodeClick(MODE_MATRIX.tertiary, 'tertiary')}
          >
            <div className="node-core">
              <span className="node-icon">{MODE_MATRIX.tertiary.icon}</span>
            </div>
            <div className="node-glow" />
            <div className="center-rings">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="center-ring" />
              ))}
            </div>
          </div>
        </div>

        <div className="rotation-hint">
          Drag to rotate • Click to select
        </div>
      </div>

      {/* Sub-Modes Panel */}
      {selectedMode && (
        <div className="submodes-panel animate-vortex-in">
          <div className="submodes-header">
            <div 
              className="selected-mode-indicator"
              style={{ '--mode-color': selectedMode.color }}
            >
              <span className="mode-icon-large">{selectedMode.icon}</span>
              <div className="mode-info">
                <h4 style={{ color: selectedMode.color }}>{selectedMode.name}</h4>
                <p>{selectedMode.description}</p>
              </div>
            </div>
          </div>

          <div className="submodes-grid">
            {selectedMode.subModes?.map((subMode, index) => (
              <button
                key={subMode}
                className={`submode-card ${selectedSubMode?.name === subMode ? 'selected' : ''}`}
                style={{ 
                  '--card-color': selectedMode.color,
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleSubModeClick(subMode, selectedMode)}
              >
                <span className="submode-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="submode-name">{subMode}</span>
                <div className="submode-glow" />
              </button>
            ))}
          </div>

          {selectedSubMode && (
            <div className="submode-confirmation">
              <p>
                Selected: <strong style={{ color: selectedMode.color }}>
                  {selectedSubMode.name}
                </strong> in {selectedSubMode.parent.name}
              </p㸮
              <button className="confirm-button">
                Enter Queue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripleModeSelector;
