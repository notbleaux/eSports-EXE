import React, { useState, useEffect, useCallback, useRef } from 'react';
import './OrbitalRingSystem.css';

/**
 * OrbitalRingSystem - 5 Concentric Orbital Rings
 * Based on David Langarica's orbital hero concept
 * 
 * Features:
 * - 5 animated rings representing data categories
 * - CSS 3D transforms for depth
 * - Clickable filtering with visual feedback
 * - Signal-amber accents with glow effects
 */

const ORBITAL_DATA = [
  {
    id: 'teams',
    name: 'TEAMS',
    count: 48,
    radius: 100,
    speed: 20,
    color: '#ff9f1c',
    description: 'Active team formations',
    nodes: 8
  },
  {
    id: 'matches',
    name: 'MATCHES',
    count: 1247,
    radius: 150,
    speed: 30,
    color: '#ff8c42',
    description: 'Competitive encounters',
    nodes: 12
  },
  {
    id: 'players',
    name: 'PLAYERS',
    count: 3842,
    radius: 210,
    speed: 45,
    color: '#ff7b59',
    description: 'Registered competitors',
    nodes: 16
  },
  {
    id: 'tournaments',
    name: 'TOURNAMENTS',
    count: 156,
    radius: 280,
    speed: 60,
    color: '#ff6b6b',
    description: 'Organized events',
    nodes: 20
  },
  {
    id: 'history',
    name: 'HISTORY',
    count: 8921,
    radius: 360,
    speed: 80,
    color: '#ff5e78',
    description: 'Archived records',
    nodes: 24
  }
];

const OrbitalRingSystem = ({ onFilterChange, activeFilter }) => {
  const [hoveredRing, setHoveredRing] = useState(null);
  const [rotationOffset, setRotationOffset] = useState(0);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  // Continuous rotation animation - optimized for 60fps
  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      if (time - lastTime >= 16) { // ~60fps
        setRotationOffset(prev => (prev + 0.05) % 360);
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleRingClick = useCallback((ringId) => {
    onFilterChange?.(activeFilter === ringId ? null : ringId);
  }, [activeFilter, onFilterChange]);

  const generateRingNodes = (ring, index) => {
    const nodes = [];
    const nodeCount = ring.nodes;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (360 / nodeCount) * i;
      const radian = (angle * Math.PI) / 180;
      const x = Math.cos(radian) * ring.radius;
      const y = Math.sin(radian) * ring.radius;
      
      nodes.push(
        <div
          key={`${ring.id}-node-${i}`}
          className={`ring-node ${activeFilter === ring.id ? 'active' : ''}`}
          style={{
            transform: `translate(${x}px, ${y}px)`,
            backgroundColor: ring.color,
            animationDelay: `${i * 0.1}s`
          }}
        />
      );
    }
    return nodes;
  };

  return (
    <div ref={containerRef} className="orbital-system">
      <div className="orbital-center">
        <div className="center-core">
          <div className="core-pulse" />
          <div className="core-text">SATOR</div>
          <div className="core-glyph">◈</div>
        </div>
      </div>
      
      <div className="rings-container sator-perspective">
        {ORBITAL_DATA.map((ring, index) => {
          const isActive = activeFilter === ring.id;
          const isHovered = hoveredRing === ring.id;
          const baseRotation = (rotationOffset * (20 / ring.speed)) % 360;
          
          return (
            <div
              key={ring.id}
              className={`orbital-ring-wrapper ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
              style={{
                width: ring.radius * 2,
                height: ring.radius * 2,
                zIndex: 5 - index
              }}
              onMouseEnter={() => setHoveredRing(ring.id)}
              onMouseLeave={() => setHoveredRing(null)}
              onClick={() => handleRingClick(ring.id)}
            >
              {/* Main ring */}
              <div
                className="orbital-ring"
                style={{
                  transform: `
                    rotateX(75deg) 
                    rotateZ(${baseRotation}deg)
                    ${isHovered ? 'scale(1.02)' : ''}
                    ${isActive ? 'scale(1.05)' : ''}
                  `,
                  borderColor: isActive ? ring.color : `${ring.color}30`,
                  boxShadow: isActive ? `0 0 40px ${ring.color}40` : 'none'
                }}
              >
                {/* Ring label positioned on the ring */}
                <div 
                  className="ring-label-track"
                  style={{ transform: `rotateZ(${-baseRotation}deg)` }}
                >
                  <span 
                    className="ring-label"
                    style={{ color: ring.color }}
                  >
                    {ring.name}
                  </span>
                </div>
              </div>
              
              {/* Orbiting nodes */}
              <div 
                className="ring-nodes-container"
                style={{
                  transform: `rotateX(75deg) rotateZ(${baseRotation}deg)`
                }}
              >
                {generateRingNodes(ring, index)}
              </div>
              
              {/* Ring info card (visible on hover or active) */}
              {(isHovered || isActive) && (
                <div className={`ring-info ${isActive ? 'active' : ''}`}>
                  <div className="ring-info-name" style={{ color: ring.color }}>
                    {ring.name}
                  </div>
                  <div className="ring-info-count">
                    {ring.count.toLocaleString()}
                  </div>
                  <div className="ring-info-desc">
                    {ring.description}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Filter status indicator */}
      <div className="filter-status">
        {activeFilter ? (
          <div className="filter-active">
            <span className="filter-label">FILTER:</span>
            <span className="filter-value">
              {ORBITAL_DATA.find(r => r.id === activeFilter)?.name}
            </span>
            <button 
              className="filter-clear"
              onClick={() => onFilterChange?.(null)}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="filter-inactive">
            <span className="filter-hint">
              Click a ring to filter
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrbitalRingSystem;
