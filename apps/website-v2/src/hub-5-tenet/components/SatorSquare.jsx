/**
 * SATOR Square 3D Visualization
 * Five concentric rings representing the palindromic SATOR square
 * [Ver001.000]
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// SATOR Square data - the 5x5 palindrome
const SATOR_SQUARE = [
  { row: 'SATOR',  color: '#ffd700', name: 'SATOR',  radius: 3.5, speed: 0.3 },  // Gold
  { row: 'AREPO',  color: '#0066ff', name: 'AREPO',  radius: 2.8, speed: -0.4 },  // Blue
  { row: 'TENET',  color: '#ffffff', name: 'TENET',  radius: 2.1, speed: 0.5 },  // White
  { row: 'OPERA',  color: '#9d4edd', name: 'OPERA',  radius: 1.4, speed: -0.6 },  // Purple
  { row: 'ROTAS',  color: '#00d4ff', name: 'ROTAS',  radius: 0.7, speed: 0.7 },  // Cyan
];

// Individual ring component
function Ring({ row, color, name, radius, speed, index }) {
  const ringRef = useRef();
  const textRefs = useRef([]);

  useFrame((state) => {
    if (ringRef.current) {
      // Rotate the entire ring
      ringRef.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
    }
    
    // Keep text upright by counter-rotating
    textRefs.current.forEach((textRef, i) => {
      if (textRef) {
        textRef.rotation.z = -ringRef.current.rotation.z;
      }
    });
  });

  // Calculate positions for each letter in the row
  const letters = useMemo(() => {
    return row.split('').map((letter, i) => {
      const angle = (i / row.length) * Math.PI * 2;
      return {
        letter,
        angle,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [row, radius]);

  return (
    <group ref={ringRef}>
      {/* Ring glow effect */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius, 0.08, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      {/* Letters positioned around the ring */}
      {letters.map((item, i) => (
        <group key={i} position={[item.x, item.y, 0]}>
          <Text
            ref={(el) => (textRefs.current[i] = el)}
            fontSize={0.35}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/SpaceGrotesk-Bold.ttf"
            letterSpacing={0.1}
          >
            {item.letter}
            <meshBasicMaterial
              color={color}
              toneMapped={false}
            />
          </Text>
          {/* Letter glow */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Hub label on the ring */}
      <group position={[radius + 0.6, 0, 0]}>
        <Text
          fontSize={0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/SpaceGrotesk-Regular.ttf"
        >
          {name}
        </Text>
      </group>
    </group>
  );
}

// Central core component
function CentralCore() {
  const coreRef = useRef();
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Inner sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
        />
      </mesh>

      {/* Center text */}
      <Text
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.45]}
        font="/fonts/SpaceGrotesk-Bold.ttf"
      >
        4NJZ4
      </Text>
    </group>
  );
}

// Particle field for background
function ParticleField() {
  const points = useMemo(() => {
    const p = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      p[i * 3] = (Math.random() - 0.5) * 15;
      p[i * 3 + 1] = (Math.random() - 0.5) * 15;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Main scene component
function Scene() {
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light */}
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Stars background */}
      <Stars
        radius={20}
        depth={50}
        count={500}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />
      
      {/* Particle field */}
      <ParticleField />
      
      {/* Central core */}
      <CentralCore />
      
      {/* SATOR Square rings - reversed order for proper layering */}
      {[...SATOR_SQUARE].reverse().map((layer, index) => (
        <Ring
          key={layer.name}
          row={layer.row}
          color={layer.color}
          name={layer.name}
          radius={layer.radius}
          speed={layer.speed}
          index={index}
        />
      ))}
      
      {/* Orbit controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={3}
        maxDistance={12}
      />
    </>
  );
}

// Main SatorSquare component
export function SatorSquare({ className = '' }) {
  return (
    <div className={`w-full h-full min-h-[500px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

export default SatorSquare;
