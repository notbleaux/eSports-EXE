/**
 * ConicalDirectory.jsx
 * Three.js conical structure for 2,135 teams with zoom drill-down
 * Reference: Darkroom comparison, Phamily segmentation
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TEAMS_DATA, generateTeamsList } from '../data/teams';
import { useWindowSize, useReducedMotion } from '../hooks';
import '../styles/conical-directory.css';

// Team node component
const TeamNode = ({ position, team, onHover, onClick, isHovered, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const color = useMemo(() => {
    const colors = {
      'tier-s': '#c9b037',
      'tier-a': '#e8e6e3',
      'tier-b': '#b8b6b2',
      'tier-c': '#7a7874',
      'tier-d': '#5a5854'
    };
    return colors[team.tier] || '#7a7874';
  }, [team.tier]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle floating animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
    
    // Scale on hover/select
    const targetScale = isHovered || isSelected ? 1.5 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });
  
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    onHover?.(team);
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(team);
  };
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 0.8 : 0.2}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Glow effect for selected/hovered */}
      {(isHovered || isSelected) && (
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
      
      {/* Label for selected team */}
      {isSelected && (
        <Html distanceFactor={10}>
          <div className="team-tooltip">
            <div className="team-tooltip-header">
              <span className={`team-tier-badge ${team.tier}`}>{team.tier.replace('tier-', '').toUpperCase()}</span>
              <h4>{team.name}</h4>
            </div>
            <div className="team-tooltip-body">
              <div className="team-tooltip-stat">
                <span>Region</span>
                <span>{team.region.toUpperCase()}</span>
              </div>
              <div className="team-tooltip-stat">
                <span>Members</span>
                <span>{team.members}</span>
              </div>
              <div className="team-tooltip-stat">
                <span>Founded</span>
                <span>{team.founded}</span>
              </div>
              <div className="team-tooltip-stat">
                <span>Earnings</span>
                <span className="earnings">{team.earnings}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Conical structure component
const ConicalStructure = ({ teams, onTeamHover, onTeamSelect, selectedTeam, hoveredTeam }) => {
  const groupRef = useRef();
  const prefersReducedMotion = useReducedMotion();
  
  // Arrange teams in conical spiral
  const teamPositions = useMemo(() => {
    return teams.map((team, index) => {
      const spiralIndex = index / teams.length;
      const angle = spiralIndex * Math.PI * 8; // 4 full rotations
      const radius = 2 + spiralIndex * 3; // Expanding radius
      const height = spiralIndex * 8 - 4; // Vertical spread
      
      return {
        team,
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ]
      };
    });
  }, [teams]);
  
  // Gentle rotation
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Central cone structure */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[1, 8, 32, 1, true]} />
        <meshStandardMaterial 
          color="#1a1a20"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      
      {/* Team nodes */}
      {teamPositions.map(({ team, position }) => (
        <TeamNode
          key={team.id}
          position={position}
          team={team}
          onHover={onTeamHover}
          onClick={onTeamSelect}
          isHovered={hoveredTeam?.id === team.id}
          isSelected={selectedTeam?.id === team.id}
        />
      ))}
      
      {/* Connection lines to cone */}
      <lineSegments>
        <bufferGeometry>
          {useMemo(() => {
            const points = [];
            teamPositions.forEach(({ position }) => {
              points.push(new THREE.Vector3(...position));
              points.push(new THREE.Vector3(0, position[1] * 0.5, 0));
            });
            return <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />;
          }, [teamPositions])}
        </bufferGeometry>
        <lineBasicMaterial color="#c9b037" transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
};

// Camera controller
const CameraController = ({ selectedTeam, teamPositions }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 10));
  
  useEffect(() => {
    if (selectedTeam && teamPositions) {
      const pos = teamPositions.find(tp => tp.team.id === selectedTeam.id)?.position;
      if (pos) {
        targetPosition.current.set(pos[0] + 2, pos[1], pos[2] + 2);
      }
    } else {
      targetPosition.current.set(0, 0, 10);
    }
  }, [selectedTeam, teamPositions]);
  
  useFrame(() => {
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

// Stats overlay
const StatsOverlay = ({ totalTeams, hoveredTeam, selectedTeam }) => {
  return (
    <div className="conical-stats">
      <div className="stat-item">
        <span className="stat-value">{totalTeams.toLocaleString()}</span>
        <span className="stat-label">Total Teams</span>
      </div>
      
      {hoveredTeam && (
        <div className="stat-item hovered">
          <span className="stat-value">{hoveredTeam.name}</span>
          <span className="stat-label">Hover to explore</span>
        </div>
      )}
      
      {selectedTeam && (
        <div className="stat-item selected">
          <span className="stat-value">{selectedTeam.name}</span>
          <span className="stat-label">Selected</span>
        </div>
      )}
    </div>
  );
};

// Main Conical Directory Component
const ConicalDirectory = () => {
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [filter, setFilter] = useState('all');
  const { width } = useWindowSize();
  
  // Generate sample teams (using subset for performance)
  const teams = useMemo(() => {
    const allTeams = generateTeamsList(200); // Show 200 teams in 3D view
    if (filter === 'all') return allTeams;
    return allTeams.filter(t => t.tier === filter || t.region === filter);
  }, [filter]);
  
  const teamPositions = useMemo(() => {
    return teams.map((team, index) => {
      const spiralIndex = index / teams.length;
      const angle = spiralIndex * Math.PI * 8;
      const radius = 2 + spiralIndex * 3;
      const height = spiralIndex * 8 - 4;
      
      return {
        team,
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ]
      };
    });
  }, [teams]);
  
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setSelectedTeam(null);
  }, []);
  
  const isMobile = width < 768;
  
  return (
    <div className="conical-directory">
      <div className="conical-controls">
        <div className="filter-group">
          <span className="filter-label">Filter:</span>
          <div className="filter-buttons">
            {['all', 'tier-s', 'tier-a', 'tier-b', 'tier-c', 'tier-d'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''} ${f}`}
                onClick={() => handleFilterChange(f)}
              >
                {f === 'all' ? 'All' : f.replace('tier-', 'Tier ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          className="reset-view-btn"
          onClick={() => setSelectedTeam(null)}
          disabled={!selectedTeam}
        >
          Reset View
        </button>
      </div>
      
      <div className="conical-canvas-container">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c9b037" />
          
          <ConicalStructure
            teams={teams}
            onTeamHover={setHoveredTeam}
            onTeamSelect={setSelectedTeam}
            selectedTeam={selectedTeam}
            hoveredTeam={hoveredTeam}
          />
          
          <CameraController selectedTeam={selectedTeam} teamPositions={teamPositions} />
          
          {!isMobile && (<OrbitControls 
            enablePan={false}
            minDistance={5}
            maxDistance={20}
            autoRotate={!selectedTeam}
            autoRotateSpeed={0.5}
          />)}
        </Canvas>
        
        <StatsOverlay 
          totalTeams={TEAMS_DATA.total}
          hoveredTeam={hoveredTeam}
          selectedTeam={selectedTeam}
        />
      </div>
      
      <div className="conical-legend">
        <span className="legend-title">Tier Colors:</span>
        <div className="legend-items">
          {TEAMS_DATA.tiers.map((tier) => (
            <div key={tier.id} className="legend-item">
              <span 
                className="legend-color" 
                style={{ background: tier.id === 'tier-s' ? '#c9b037' : 
                               tier.id === 'tier-a' ? '#e8e6e3' :
                               tier.id === 'tier-b' ? '#b8b6b2' :
                               tier.id === 'tier-c' ? '#7a7874' : '#5a5854' }}
              />
              <span className="legend-label">{tier.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConicalDirectory;
