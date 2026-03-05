'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// === IRIDESCENT BUBBLE COMPONENT ===
function IridescentBubble({ 
  position, 
  scale = 1, 
  colorStart = '#ff006e',
  colorMid = '#8338ec', 
  colorEnd = '#00f0ff',
  orbitRadius = 0,
  orbitSpeed = 0,
  orbitOffset = 0
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(colorStart) },
    uColorMid: { value: new THREE.Color(colorMid) },
    uColorEnd: { value: new THREE.Color(colorEnd) },
    uIridescence: { value: 1.0 }
  }), [colorStart, colorMid, colorEnd]);

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      vec3 pos = position;
      float noise = sin(pos.x * 3.0 + uTime) * cos(pos.y * 3.0 + uTime) * sin(pos.z * 3.0 + uTime) * 0.05;
      pos += normal * noise;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColorStart;
    uniform vec3 uColorMid;
    uniform vec3 uColorEnd;
    uniform float uIridescence;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
      
      float angle = atan(vNormal.y, vNormal.x) + uTime * 0.2;
      float gradient = (sin(angle) + 1.0) * 0.5;
      
      vec3 color = mix(uColorStart, uColorMid, gradient);
      color = mix(color, uColorEnd, fresnel * uIridescence);
      
      float alpha = 0.4 + fresnel * 0.4;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      uniforms.uTime.value = state.clock.elapsedTime;
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
    
    if (groupRef.current && orbitRadius > 0) {
      const time = state.clock.elapsedTime * orbitSpeed + orbitOffset;
      groupRef.current.position.x = Math.cos(time) * orbitRadius;
      groupRef.current.position.z = Math.sin(time) * orbitRadius;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh scale={scale * 1.02}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={colorEnd}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// === CHEMISTRY ORBIT SYSTEM ===
function ChemistryOrbit({ centerBubble, satelliteBubbles }) {
  const orbitRef = useRef(null);
  
  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      orbitRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={orbitRef}>
      {/* Central nucleus bubble */}
      <IridescentBubble
        position={centerBubble.position}
        scale={centerBubble.scale}
        colorStart={centerBubble.colors[0]}
        colorMid={centerBubble.colors[1]}
        colorEnd={centerBubble.colors[2]}
      />
      
      {/* Orbital paths visualization */}
      {satelliteBubbles.map((sat, i) => (
        <group key={i}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[sat.orbitRadius - 0.02, sat.orbitRadius + 0.02, 64]} />
            <meshBasicMaterial 
              color="#00f0ff" 
              transparent 
              opacity={0.1} 
              side={THREE.DoubleSide}
            />
          </mesh>
          <IridescentBubble
            position={[0, 0, 0]}
            scale={sat.scale}
            colorStart={sat.colors[0]}
            colorMid={sat.colors[1]}
            colorEnd={sat.colors[2]}
            orbitRadius={sat.orbitRadius}
            orbitSpeed={sat.orbitSpeed}
            orbitOffset={sat.orbitOffset}
          />
        </group>
      ))}
    </group>
  );
}

// === PARTICLE FIELD ===
function ParticleField() {
  const pointsRef = useRef(null);
  const count = 200;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00f0ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// === MATCHMAKING VISUALIZER ===
function MatchmakingCore() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff006e" />
      <pointLight position={[0, 10, -10]} intensity={0.5} color="#8338ec" />
      
      <ParticleField />
      
      {/* Main player bubble */}
      <ChemistryOrbit
        centerBubble={{
          position: [0, 0, 0],
          scale: 1.5,
          colors: ['#00f0ff', '#8338ec', '#ff006e']
        }}
        satelliteBubbles={[
          { orbitRadius: 3, orbitSpeed: 0.5, orbitOffset: 0, scale: 0.6, colors: ['#ff006e', '#00f0ff', '#8338ec'] },
          { orbitRadius: 4.5, orbitSpeed: 0.3, orbitOffset: 2, scale: 0.5, colors: ['#8338ec', '#ff006e', '#00f0ff'] },
          { orbitRadius: 6, orbitSpeed: 0.2, orbitOffset: 4, scale: 0.7, colors: ['#00f0ff', '#8338ec', '#ff006e'] },
          { orbitRadius: 5.5, orbitSpeed: 0.4, orbitOffset: 1, scale: 0.4, colors: ['#ff9f1c', '#00f0ff', '#8338ec'] },
        ]}
      />
      
      {/* Secondary chemistry systems */}
      <group position={[8, 2, -5]}>
        <ChemistryOrbit
          centerBubble={{
            position: [0, 0, 0],
            scale: 0.8,
            colors: ['#10b981', '#00f0ff', '#8338ec']
          }}
          satelliteBubbles={[
            { orbitRadius: 2, orbitSpeed: 0.6, orbitOffset: 0, scale: 0.3, colors: ['#00f0ff', '#10b981', '#8338ec'] },
            { orbitRadius: 3, orbitSpeed: 0.4, orbitOffset: 3, scale: 0.25, colors: ['#8338ec', '#00f0ff', '#10b981'] },
          ]}
        />
      </group>
      
      <group position={[-7, -3, 4]}>
        <ChemistryOrbit
          centerBubble={{
            position: [0, 0, 0],
            scale: 0.9,
            colors: ['#ffd700', '#ff006e', '#00f0ff']
          }}
          satelliteBubbles={[
            { orbitRadius: 2.2, orbitSpeed: 0.55, orbitOffset: 1, scale: 0.35, colors: ['#ff006e', '#ffd700', '#00f0ff'] },
            { orbitRadius: 3.5, orbitSpeed: 0.35, orbitOffset: 4, scale: 0.3, colors: ['#00f0ff', '#ff006e', '#ffd700'] },
          ]}
        />
      </group>
      
      <Stars radius={50} depth={50} count={500} factor={4} saturation={0.8} fade speed={0.5} />
    </>
  );
}

// === MAIN COMPONENT ===
export function ResonantMatchmaking({ 
  className = '',
  onMatchFound
}) {
  const [matchStatus, setMatchStatus] = useState('searching');
  const [matchProgress, setMatchProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatchProgress(prev => {
        if (prev >= 100) {
          setMatchStatus('found');
          setTimeout(() => {
            setMatchStatus('connected');
            onMatchFound?.();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [onMatchFound]);

  return (
    <div className={`resonant-matchmaking ${className}`}>
      <div className="matchmaking-canvas-container">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <MatchmakingCore />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
      
      <div className="matchmaking-overlay">
        <div className={`match-status ${matchStatus}`}>
          <div className="status-indicator">
            <span className={`status-dot ${matchStatus}`} />
            <span className="status-text">
              {matchStatus === 'searching' && 'Finding Resonant Match...'}
              {matchStatus === 'found' && 'Match Resonance Detected!'}
              {matchStatus === 'connected' && 'Connected'}
            </span>
          </div>
          
          <div className="match-progress-bar">
            <div 
              className="match-progress-fill"
              style={{ width: `${Math.min(matchProgress, 100)}%` }}
            />
          </div>
          
          <div className="match-stats">
            <div className="stat">
              <span className="stat-value">{Math.floor(matchProgress * 0.8)}</span>
              <span className="stat-label">Players</span>
            </div>
            <div className="stat">
              <span className="stat-value">{matchStatus === 'searching' ? '<50ms' : '<20ms'}</span>
              <span className="stat-label">Latency</span>
            </div>
            <div className="stat">
              <span className="stat-value">98%</span>
              <span className="stat-label">Match</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .resonant-matchmaking {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .matchmaking-canvas-container {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(10, 22, 40, 0.8) 0%, var(--nexus-void) 100%);
        }
        
        .matchmaking-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: linear-gradient(180deg, transparent 0%, rgba(5, 5, 8, 0.9) 100%);
        }
        
        .match-status {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .status-dot.searching {
          background: #00f0ff;
          box-shadow: 0 0 10px #00f0ff;
        }
        
        .status-dot.found {
          background: #ffd700;
          box-shadow: 0 0 20px #ffd700;
          animation: none;
        }
        
        .status-dot.connected {
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: none;
        }
        
        .status-text {
          font-family: var(--font-data);
          font-size: 0.875rem;
          color: var(--njz-porcelain);
          letter-spacing: 0.05em;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        .match-progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .match-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff, #8338ec, #ff006e);
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }
        
        .match-stats {
          display: flex;
          gap: 32px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .stat-value {
          font-family: var(--font-data);
          font-size: 1.25rem;
          font-weight: 600;
          color: #00f0ff;
        }
        
        .stat-label {
          font-size: 0.625rem;
          color: var(--njz-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}

export default ResonantMatchmaking;
