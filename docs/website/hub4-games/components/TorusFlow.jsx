'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// === TORUS KNOT HOURGLASS ===
function TorusHourglass({ state }) {
  const torusRef = useRef(null);
  const innerTorusRef = useRef(null);
  const particleRef = useRef(null);
  
  const stateColors = {
    terrestrial: new THREE.Color('#8b4513'),
    harmonic: new THREE.Color('#c9b037'),
    celestial: new THREE.Color('#00f0ff')
  };

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: stateColors[state] },
    uState: { value: state === 'terrestrial' ? 0 : state === 'harmonic' ? 0.5 : 1 }
  }), [state]);

  // Flow particles
  const particleCount = 500;
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 20;
      const radius = 2 + Math.sin(t * Math.PI * 4) * 0.5;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (t - 0.5) * 8;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    uniforms.uTime.value = time;
    
    if (torusRef.current) {
      torusRef.current.rotation.z = time * 0.1;
      torusRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
    
    if (innerTorusRef.current) {
      innerTorusRef.current.rotation.z = -time * 0.15;
    }
    
    if (particleRef.current) {
      particleRef.current.rotation.y = time * 0.05;
    }
    
    // Smooth color transition
    uniforms.uColor.value.lerp(stateColors[state], 0.02);
  });

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vNormal = normal;
      
      vec3 pos = position;
      float wave = sin(pos.x * 2.0 + uTime) * cos(pos.y * 2.0 + uTime * 0.5) * 0.1;
      pos += normal * wave;
      vElevation = wave;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uState;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vElevation;
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vNormal);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      
      vec3 baseColor = uColor;
      vec3 glowColor = uColor * 1.5;
      
      float flow = sin(vUv.y * 10.0 + uTime * 2.0) * 0.5 + 0.5;
      
      vec3 finalColor = mix(baseColor, glowColor, fresnel * flow);
      float alpha = 0.3 + fresnel * 0.4;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <group>
      {/* Outer torus */}
      <mesh ref={torusRef}>
        <torusKnotGeometry args={[2.5, 0.8, 128, 32, 2, 3]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner torus - counter-rotating */}
      <mesh ref={innerTorusRef} scale={0.7}>
        <torusKnotGeometry args={[2.5, 0.6, 100, 24, 3, 2]} />
        <meshBasicMaterial
          color={stateColors[state]}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
      
      {/* Flow particles */}
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={stateColors[state]}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      
      {/* State indicators */}
      <group position={[0, 4, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial 
            color={stateColors.terrestrial} 
            transparent 
            opacity={state === 'terrestrial' ? 1 : 0.3}
          />
        </mesh>
      </group>
      
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial 
            color={stateColors.harmonic} 
            transparent 
            opacity={state === 'harmonic' ? 1 : 0.3}
          />
        </mesh>
      </group>
      
      <group position={[0, -4, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial 
            color={stateColors.celestial} 
            transparent 
            opacity={state === 'celestial' ? 1 : 0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// === STATE LABELS ===
function StateLabels({ currentState }) {
  const states = ['terrestrial', 'harmonic', 'celestial'];
  
  return (
    <div className="torus-state-labels">
      {states.map((state) => (
        <div 
          key={state}
          className={`state-label ${state} ${currentState === state ? 'active' : ''}`}
        >
          <span className="state-dot" />
          <span className="state-name">{state.charAt(0).toUpperCase() + state.slice(1)}</span>
        </div>
      ))}
    </div>
  );
}

// === MAIN COMPONENT ===
export function TorusFlow({ 
  className = '',
  autoRotate = true
}) {
  const [currentState, setCurrentState] = useState('terrestrial');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentState(current => {
            if (current === 'terrestrial') return 'harmonic';
            if (current === 'harmonic') return 'celestial';
            return 'terrestrial';
          });
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoRotate]);

  const stateDescriptions = {
    terrestrial: 'Grounded · Strategic · Foundation',
    harmonic: 'Balanced · Resonant · Flow',
    celestial: 'Transcendent · Connected · Infinite'
  };

  return (
    <div className={`torus-flow-container ${className}`}>
      <div className="torus-canvas-wrapper">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00f0ff" />
          
          <TorusHourglass state={currentState} />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>
      
      <div className="torus-ui-overlay">
        <StateLabels currentState={currentState} />
        
        <div className="state-info">
          <h3 className="state-title">{currentState.toUpperCase()}</h3>
          <p className="state-description">{stateDescriptions[currentState]}</p>
        </div>
        
        <div className="state-progress">
          <div className="progress-track">
            <div 
              className={`progress-fill ${currentState}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-markers">
            <span className={currentState === 'terrestrial' ? 'active' : ''}>T</span>
            <span className={currentState === 'harmonic' ? 'active' : ''}>H</span>
            <span className={currentState === 'celestial' ? 'active' : ''}>C</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .torus-flow-container {
          position: relative;
          width: 100%;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(10, 22, 40, 0.6) 0%, var(--nexus-void) 70%);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .torus-canvas-wrapper {
          position: absolute;
          inset: 0;
        }
        
        .torus-ui-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px;
          background: linear-gradient(180deg, transparent 0%, rgba(5, 5, 8, 0.95) 100%);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .torus-state-labels {
          display: flex;
          justify-content: center;
          gap: 32px;
        }
        
        .state-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          opacity: 0.5;
        }
        
        .state-label.active {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .state-label.terrestrial.active {
          box-shadow: 0 0 20px rgba(139, 69, 19, 0.4);
        }
        
        .state-label.harmonic.active {
          box-shadow: 0 0 20px rgba(201, 176, 55, 0.4);
        }
        
        .state-label.celestial.active {
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }
        
        .state-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .terrestrial .state-dot {
          background: #8b4513;
          box-shadow: 0 0 10px #8b4513;
        }
        
        .harmonic .state-dot {
          background: #c9b037;
          box-shadow: 0 0 10px #c9b037;
        }
        
        .celestial .state-dot {
          background: #00f0ff;
          box-shadow: 0 0 10px #00f0ff;
        }
        
        .state-name {
          font-family: var(--font-data);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--njz-porcelain);
        }
        
        .state-info {
          text-align: center;
        }
        
        .state-title {
          font-family: var(--font-header);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, 
            ${currentState === 'terrestrial' ? '#8b4513' : currentState === 'harmonic' ? '#c9b037' : '#00f0ff'} 0%,
            ${currentState === 'terrestrial' ? '#a0522d' : currentState === 'harmonic' ? '#ffd700' : '#00c8ff'} 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .state-description {
          font-size: 0.875rem;
          color: var(--njz-gray-400);
          letter-spacing: 0.05em;
        }
        
        .state-progress {
          margin-top: 8px;
        }
        
        .progress-track {
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.1s linear, background 0.3s ease;
        }
        
        .progress-fill.terrestrial {
          background: linear-gradient(90deg, #8b4513, #a0522d);
        }
        
        .progress-fill.harmonic {
          background: linear-gradient(90deg, #c9b037, #ffd700);
        }
        
        .progress-fill.celestial {
          background: linear-gradient(90deg, #00f0ff, #00c8ff);
        }
        
        .progress-markers {
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }
        
        .progress-markers span {
          font-family: var(--font-data);
          font-size: 0.625rem;
          color: var(--njz-gray-600);
          transition: color 0.3s ease;
        }
        
        .progress-markers span.active {
          color: var(--njz-porcelain);
        }
      `}</style>
    </div>
  );
}

export default TorusFlow;
