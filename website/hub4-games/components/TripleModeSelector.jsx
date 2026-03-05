'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GameMode = {
  id: string;
  name: string;
  category: 'terrestrial' | 'harmonic' | 'celestial';
  description: string;
  players: string;
  duration: string;
  difficulty: 'casual' | 'normal' | 'ranked';
  icon: string;
};

const GAME_MODES: GameMode[] = [
  // Terrestrial Modes
  {
    id: 't1',
    name: 'Academy',
    category: 'terrestrial',
    description: 'Learn the fundamentals in a guided environment',
    players: '1-4',
    duration: '15-30m',
    difficulty: 'casual',
    icon: '🎓'
  },
  {
    id: 't2',
    name: 'Scrimmage',
    category: 'terrestrial',
    description: 'Practice matches with AI opponents',
    players: '1-5',
    duration: '20-40m',
    difficulty: 'normal',
    icon: '🤖'
  },
  {
    id: 't3',
    name: 'Draft',
    category: 'terrestrial',
    description: 'Build your team through strategic picks',
    players: '1',
    duration: '10-20m',
    difficulty: 'normal',
    icon: '📋'
  },
  // Harmonic Modes
  {
    id: 'h1',
    name: 'Quick Match',
    category: 'harmonic',
    description: 'Fast-paced matches with balanced teams',
    players: '10',
    duration: '25-35m',
    difficulty: 'normal',
    icon: '⚡'
  },
  {
    id: 'h2',
    name: 'Ranked',
    category: 'harmonic',
    description: 'Competitive matches with skill-based matchmaking',
    players: '10',
    duration: '30-45m',
    difficulty: 'ranked',
    icon: '🏆'
  },
  {
    id: 'h3',
    name: 'Tournament',
    category: 'harmonic',
    description: 'Bracket-style elimination competition',
    players: '8-64',
    duration: '2-4h',
    difficulty: 'ranked',
    icon: '🏅'
  },
  // Celestial Modes
  {
    id: 'c1',
    name: 'Conquest',
    category: 'celestial',
    description: 'Large-scale territorial control battles',
    players: '20-50',
    duration: '45-60m',
    difficulty: 'ranked',
    icon: '🌌'
  },
  {
    id: 'c2',
    name: 'Eternal',
    category: 'celestial',
    description: 'Infinite progression with persistent world',
    players: '∞',
    duration: '∞',
    difficulty: 'ranked',
    icon: '♾️'
  },
  {
    id: 'c3',
    name: 'Singularity',
    category: 'celestial',
    description: 'Ultimate test of skill and strategy',
    players: '100',
    duration: '60m+',
    difficulty: 'ranked',
    icon: '⚫'
  }
];

// === STAR TETRAHEDRON FACE ===
function TetraFace({ 
  mode, 
  isActive, 
  onClick,
  rotation 
}: { 
  mode: GameMode;
  isActive: boolean;
  onClick: () => void;
  rotation: { x: number; y: number; z: number };
}) {
  const categoryColors = {
    terrestrial: { base: '#8b4513', glow: 'rgba(139, 69, 19, 0.5)' },
    harmonic: { base: '#c9b037', glow: 'rgba(201, 176, 55, 0.5)' },
    celestial: { base: '#00f0ff', glow: 'rgba(0, 240, 255, 0.5)' }
  };

  const colors = categoryColors[mode.category];

  return (
    <motion.div
      className={`tetra-face ${mode.category} ${isActive ? 'active' : ''}`}
      onClick={onClick}
      initial={false}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
        rotateZ: rotation.z,
        scale: isActive ? 1.1 : 1,
      }}
      transition={{ duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] }}
      style={{
        ['--face-color']: colors.base,
        ['--face-glow']: colors.glow,
      }}
    >
      <div className="face-content">
        <span className="face-icon">{mode.icon}</span>
        <span className="face-name">{mode.name}</span>
      </div>
      <div className="face-shine" />
    </motion.div>
  );
}

// === 3D STAR TETRAHEDRON ===
function StarTetrahedron({ 
  activeMode,
  onModeSelect 
}: { 
  activeMode: GameMode | null;
  onModeSelect: (mode: GameMode) => void;
}) {
  const [rotation, setRotation] = useState({ x: -20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  // Face positions for star tetrahedron (stellated octahedron)
  const faces = [
    // Upper pyramid (pointing up)
    { mode: GAME_MODES[0], rot: { x: 0, y: 0, z: 0 } },      // Front
    { mode: GAME_MODES[1], rot: { x: 0, y: 120, z: 0 } },    // Right
    { mode: GAME_MODES[2], rot: { x: 0, y: 240, z: 0 } },    // Left
    // Lower pyramid (pointing down)
    { mode: GAME_MODES[3], rot: { x: 180, y: 0, z: 0 } },    // Back
    { mode: GAME_MODES[4], rot: { x: 180, y: 120, z: 0 } },  // Left-down
    { mode: GAME_MODES[5], rot: { x: 180, y: 240, z: 0 } },  // Right-down
    // Additional faces for full star
    { mode: GAME_MODES[6], rot: { x: 90, y: 0, z: 0 } },     // Top
    { mode: GAME_MODES[7], rot: { x: -90, y: 0, z: 0 } },    // Bottom
    { mode: GAME_MODES[8], rot: { x: 0, y: 60, z: 90 } },    // Side
  ];

  return (
    <div 
      ref={containerRef}
      className="tetrahedron-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="tetrahedron"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
        }}
      >
        {faces.map(({ mode, rot }, i) => (
          <TetraFace
            key={mode.id}
            mode={mode}
            isActive={activeMode?.id === mode.id}
            onClick={() => onModeSelect(mode)}
            rotation={rot}
          />
        ))}
      </div>
      
      <div className="rotation-hint">
        <span>🖱️ Drag to rotate</span>
      </div>
    </div>
  );
}

// === MODE DETAILS PANEL ===
function ModeDetails({ mode }: { mode: GameMode | null }) {
  if (!mode) {
    return (
      <div className="mode-details empty">
        <div className="empty-state">
          <span className="empty-icon">✨</span>
          <p>Select a mode from the star tetrahedron</p>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    terrestrial: { label: 'Terrestrial', color: '#8b4513' },
    harmonic: { label: 'Harmonic', color: '#c9b037' },
    celestial: { label: 'Celestial', color: '#00f0ff' }
  };

  const difficultyLabels = {
    casual: { label: 'Casual', color: '#10b981' },
    normal: { label: 'Normal', color: '#f59e0b' },
    ranked: { label: 'Ranked', color: '#ef4444' }
  };

  const cat = categoryLabels[mode.category];
  const diff = difficultyLabels[mode.difficulty];

  return (
    <motion.div 
      className="mode-details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="details-header">
        <span className="mode-icon large">{mode.icon}</span>
        <div className="header-info">
          <span 
            className="category-badge"
            style={{ color: cat.color, borderColor: cat.color }}
          >
            {cat.label}
          </span>
          <h3 className="mode-name">{mode.name}</h3>
        </div>
      </div>
      
      <p className="mode-description">{mode.description}</p>
      
      <div className="mode-meta">
        <div className="meta-item">
          <span className="meta-label">Players</span>
          <span className="meta-value">{mode.players}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Duration</span>
          <span className="meta-value">{mode.duration}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Difficulty</span>
          <span 
            className="meta-value difficulty"
            style={{ color: diff.color }}
          >
            {diff.label}
          </span>
        </div>
      </div>
      
      <button className="play-button">
        <span>▶ Play {mode.name}</span>
      </button>
    </motion.div>
  );
}

// === MAIN COMPONENT ===
export function TripleModeSelector({ 
  className = '',
  onModeChange
}: { 
  className?: string;
  onModeChange?: (mode: GameMode) => void;
}) {
  const [activeMode, setActiveMode] = useState<GameMode | null>(null);

  const handleModeSelect = (mode: GameMode) => {
    setActiveMode(mode);
    onModeChange?.(mode);
  };

  return (
    <div className={`triple-mode-selector ${className}`}>
      <div className="selector-header">
        <h2>Choose Your Path</h2>
        <p>Nine modes across three realms</p>
      </div>
      
      <div className="selector-content">
        <StarTetrahedron 
          activeMode={activeMode}
          onModeSelect={handleModeSelect}
        />
        
        <AnimatePresence mode="wait">
          <ModeDetails key={activeMode?.id || 'empty'} mode={activeMode} />
        </AnimatePresence>
      </div>
      
      <div className="mode-categories">
        <div className="category terrestrial">
          <span className="cat-indicator" />
          <span className="cat-name">Terrestrial</span>
          <span className="cat-desc">Foundation & Learning</span>
        </div>
        <div className="category harmonic">
          <span className="cat-indicator" />
          <span className="cat-name">Harmonic</span>
          <span className="cat-desc">Balance & Competition</span>
        </div>
        <div className="category celestial">
          <span className="cat-indicator" />
          <span className="cat-name">Celestial</span>
          <span className="cat-desc">Transcendence & Scale</span>
        </div>
      </div>
      
      <style jsx>{`
        .triple-mode-selector {
          background: linear-gradient(135deg, 
            rgba(10, 22, 40, 0.6) 0%, 
            rgba(5, 5, 8, 0.9) 100%);
          border-radius: 24px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .selector-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .selector-header h2 {
          font-family: var(--font-header);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #00f0ff, #8338ec);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .selector-header p {
          color: var(--njz-gray-500);
          font-size: 0.875rem;
        }
        
        .selector-content {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 40px;
          align-items: center;
          min-height: 400px;
        }
        
        @media (max-width: 900px) {
          .selector-content {
            grid-template-columns: 1fr;
          }
        }
        
        /* Tetrahedron Styles */
        .tetrahedron-container {
          position: relative;
          height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          perspective: 1000px;
        }
        
        .tetrahedron-container:active {
          cursor: grabbing;
        }
        
        .tetrahedron {
          position: relative;
          width: 200px;
          height: 200px;
          transform-style: preserve-3d;
          transition: transform 0.1s ease-out;
        }
        
        .tetra-face {
          position: absolute;
          width: 100px;
          height: 100px;
          left: 50%;
          top: 50%;
          margin-left: -50px;
          margin-top: -50px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform-style: preserve-3d;
          backface-visibility: visible;
          transition: all 0.3s ease;
        }
        
        .tetra-face::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--face-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .tetra-face:hover::before,
        .tetra-face.active::before {
          opacity: 0.2;
        }
        
        .tetra-face.terrestrial {
          border-color: rgba(139, 69, 19, 0.5);
        }
        
        .tetra-face.harmonic {
          border-color: rgba(201, 176, 55, 0.5);
        }
        
        .tetra-face.celestial {
          border-color: rgba(0, 240, 255, 0.5);
        }
        
        .tetra-face.active {
          box-shadow: 0 0 30px var(--face-glow);
          border-color: var(--face-color);
        }
        
        .face-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 30px;
        }
        
        .face-icon {
          font-size: 1.5rem;
        }
        
        .face-name {
          font-family: var(--font-data);
          font-size: 0.625rem;
          color: var(--njz-porcelain);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
          max-width: 80px;
        }
        
        .face-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.2) 0%,
            transparent 50%);
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .tetra-face:hover .face-shine {
          opacity: 1;
        }
        
        .rotation-hint {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: var(--njz-gray-600);
          opacity: 0.7;
        }
        
        /* Mode Details */
        .mode-details {
          background: linear-gradient(135deg,
            rgba(13, 17, 23, 0.8) 0%,
            rgba(10, 22, 40, 0.6) 100%);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-height: 280px;
        }
        
        .mode-details.empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .empty-state {
          text-align: center;
          color: var(--njz-gray-500);
        }
        
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .details-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .mode-icon.large {
          font-size: 3rem;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }
        
        .header-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .category-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid;
          width: fit-content;
        }
        
        .mode-name {
          font-family: var(--font-header);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--njz-porcelain);
        }
        
        .mode-description {
          color: var(--njz-gray-400);
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        
        .mode-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }
        
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }
        
        .meta-label {
          font-size: 0.625rem;
          color: var(--njz-gray-600);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .meta-value {
          font-family: var(--font-data);
          font-size: 0.875rem;
          color: var(--njz-porcelain);
          font-weight: 600;
        }
        
        .play-button {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #00f0ff, #8338ec);
          border: none;
          border-radius: 10px;
          color: var(--nexus-void);
          font-family: var(--font-header);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .play-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.3);
        }
        
        /* Mode Categories Legend */
        .mode-categories {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .category {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .category:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .cat-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .terrestrial .cat-indicator {
          background: #8b4513;
          box-shadow: 0 0 10px #8b4513;
        }
        
        .harmonic .cat-indicator {
          background: #c9b037;
          box-shadow: 0 0 10px #c9b037;
        }
        
        .celestial .cat-indicator {
          background: #00f0ff;
          box-shadow: 0 0 10px #00f0ff;
        }
        
        .cat-name {
          font-family: var(--font-header);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--njz-porcelain);
        }
        
        .cat-desc {
          font-size: 0.75rem;
          color: var(--njz-gray-500);
        }
        
        @media (max-width: 768px) {
          .mode-categories {
            flex-direction: column;
            gap: 12px;
          }
          
          .category {
            justify-content: center;
          }
          
          .mode-meta {
            grid-template-columns: 1fr;
            text-align: left;
          }
          
          .meta-item {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

export default TripleModeSelector;
