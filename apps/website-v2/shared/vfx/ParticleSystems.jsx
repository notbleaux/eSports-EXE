/**
 * NJZ Platform v2 - ParticleSystems Component
 * Interactive particle effects
 * 
 * @version 2.0.0
 * @requires react, three, @react-three/fiber, @react-three/drei
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Floating particles component
 */
function FloatingParticles({ count = 100, color = '#00f0ff', mouseInfluence = true }) {
  const pointsRef = useRef();
  const mouseRef = useRef(new THREE.Vector3(0, 0, 0));
  const { viewport } = useThree();

  // Generate random particles
  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * viewport.width * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * viewport.height * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;
      
      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    
    return [positions, velocities];
  }, [count, viewport]);

  useEffect(() => {
    if (!mouseInfluence) return;
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.set(x * viewport.width, y * viewport.height, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseInfluence, viewport]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Add gentle floating motion
      positions[i3] += velocities[i3] + Math.sin(time * 0.5 + i) * 0.002;
      positions[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.3 + i) * 0.002;
      positions[i3 + 2] += velocities[i3 + 2];
      
      // Mouse repulsion
      if (mouseInfluence) {
        const dx = positions[i3] - mouseRef.current.x;
        const dy = positions[i3 + 1] - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 1.5) {
          const force = (1.5 - dist) * 0.02;
          positions[i3] += dx * force;
          positions[i3 + 1] += dy * force;
        }
      }
      
      // Boundary wrap
      if (positions[i3] > viewport.width) positions[i3] = -viewport.width;
      if (positions[i3] < -viewport.width) positions[i3] = viewport.width;
      if (positions[i3 + 1] > viewport.height) positions[i3 + 1] = -viewport.height;
      if (positions[i3 + 1] < -viewport.height) positions[i3 + 1] = viewport.height;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} limit={count}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

/**
 * Connection lines between particles
 */
function ConnectionLines({ count = 50, maxDistance = 1.5, color = '#00f0ff' }) {
  const linesRef = useRef();
  const { viewport } = useThree();

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * viewport.width * 2,
      y: (Math.random() - 0.5) * viewport.height * 2,
      vx: (Math.random() - 0.5) * 0.005,
      vy: (Math.random() - 0.5) * 0.005,
    }));
  }, [count, viewport]);

  useFrame(() => {
    // Update particle positions
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x > viewport.width) p.x = -viewport.width;
      if (p.x < -viewport.width) p.x = viewport.width;
      if (p.y > viewport.height) p.y = -viewport.height;
      if (p.y < -viewport.height) p.y = viewport.height;
    });
  });

  // Generate connection lines
  const lineGeometry = useMemo(() => {
    const positions = [];
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < maxDistance) {
          positions.push(
            particles[i].x, particles[i].y, 0,
            particles[j].x, particles[j].y, 0
          );
        }
      }
    }
    
    return new Float32Array(positions);
  }, [particles, maxDistance]);

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={lineGeometry.length / 3}
          array={lineGeometry}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.1}
      />
    </lineSegments>
  );
}

/**
 * Star field background
 */
function StarField({ count = 200, depth = 5 }) {
  const pointsRef = useRef();
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
    }
    return positions;
  }, [count, depth]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.03}
        sizeAttenuation
        opacity={0.8}
      />
    </Points>
  );
}

/**
 * Particle systems container
 * @param {Object} props
 * @param {string} [props.type='floating'] - Particle type (floating, connections, stars, combined)
 * @param {number} [props.count=100] - Number of particles
 * @param {string} [props.color='#00f0ff'] - Particle color
 * @param {boolean} [props.mouseInfluence=true] - Enable mouse interaction
 */
export function ParticleSystems({
  type = 'floating',
  count = 100,
  color = '#00f0ff',
  mouseInfluence = true,
  className = '',
  style = {},
}) {
  return (
    <div 
      className={`njz-particles ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        {type === 'floating' && (
          <FloatingParticles 
            count={count} 
            color={color}
            mouseInfluence={mouseInfluence}
          />
        )}
        
        {type === 'connections' && (
          <>
            <FloatingParticles count={count} color={color} mouseInfluence={false} />
            <ConnectionLines count={Math.min(count, 50)} color={color} />
          </>
        )}
        
        {type === 'stars' && (
          <StarField count={count} />
        )}
        
        {type === 'combined' && (
          <>
            <StarField count={200} />
            <FloatingParticles count={count} color={color} mouseInfluence={mouseInfluence} />
          </>
        )}
      </Canvas>
    </div>
  );
}

export default ParticleSystems;
