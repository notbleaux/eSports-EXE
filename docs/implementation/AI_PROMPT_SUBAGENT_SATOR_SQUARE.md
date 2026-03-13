[Ver002.000]

# OPTIMIZED AI SUB-AGENT PROMPT: SATOR Square 3D Visualization
## Interactive WebGL Component with SVG Fallback

**Role:** 3D Graphics & Visualization Specialist  
**Priority:** P1 - Experience Layer  
**Dependencies:** Mode Store (for mode-aware coloring)

---

## I. MISSION OBJECTIVE

Create a high-performance, interactive SATOR Square visualization with WebGL (Three.js) as primary renderer and SVG fallback for mobile/accessibility. Must support click navigation, hover states, and mode-responsive theming.

**Success Criteria:**
- [ ] Three.js scene at 60fps with 5 rotating rings
- [ ] Click-to-navigate on each ring
- [ ] Hover tooltips with hub descriptions
- [ ] SVG fallback for low-spec devices
- [ ] Mode-aware color transitions (SATOR↔ROTAS)

---

## II. ARCHITECTURE SPECIFICATION

### 2.1 Data Structure

```typescript
// constants/satorSquare.js
export const SATOR_LAYERS = [
  {
    id: 'SATOR',
    name: 'SATOR',
    description: 'Raw Data Ingestion',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    path: '/sator',
    radius: 3.5,
    speed: 0.3,
    letterCount: 5,
  },
  {
    id: 'AREPO',
    name: 'AREPO',
    description: 'Processing Layer',
    color: '#0066FF',
    glowColor: 'rgba(0, 102, 255, 0.5)',
    path: '/arepo',
    radius: 2.8,
    speed: -0.4,
    letterCount: 5,
  },
  {
    id: 'TENET',
    name: 'TENET',
    description: 'Control Center',
    color: '#FFFFFF',
    glowColor: 'rgba(255, 255, 255, 0.4)',
    path: '/tenet',
    radius: 2.1,
    speed: 0.5,
    letterCount: 5,
  },
  {
    id: 'OPERA',
    name: 'OPERA',
    description: 'Visualization Layer',
    color: '#9D4EDD',
    glowColor: 'rgba(157, 78, 221, 0.5)',
    path: '/opera',
    radius: 1.4,
    speed: -0.6,
    letterCount: 5,
  },
  {
    id: 'ROTAS',
    name: 'ROTAS',
    description: 'Distribution Network',
    color: '#00D4FF',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    path: '/rotas',
    radius: 0.7,
    speed: 0.7,
    letterCount: 5,
  },
];

// Mode-aware color overrides
export const MODE_COLOR_OVERRIDES = {
  SATOR: {
    // No overrides in SATOR mode - use default colors
  },
  ROTAS: {
    SATOR: { color: '#FFAA00', glowColor: 'rgba(255, 170, 0, 0.5)' },
    ROTAS: { color: '#FF6B6B', glowColor: 'rgba(255, 107, 107, 0.5)' },
  },
};
```

### 2.2 Main Component Structure

```typescript
// components/SatorSquare/index.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { useModeStore } from '@/store/modeStore';

// Lazy load WebGL component for code splitting
const SatorSquareWebGL = lazy(() => import('./SatorSquareWebGL'));
const SatorSquareSVG = lazy(() => import('./SatorSquareSVG'));

// Feature detection hook
function useWebGLSupport() {
  const [supported, setSupported] = useState(true);
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
    setChecked(true);
  }, []);
  
  return { supported, checked };
}

// Reduced motion preference
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    
    const handler = (e) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return reduced;
}

export function SatorSquare({ 
  onLayerClick,
  className = '',
  size = 'large', // 'small' | 'medium' | 'large'
}) {
  const { supported, checked } = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const { mode } = useModeStore();
  
  // Use SVG for: no WebGL, reduced motion preference, or small size
  const useSVG = !supported || reducedMotion || size === 'small';
  
  if (!checked) {
    return <SatorSquareSkeleton size={size} />;
  }
  
  return (
    <div className={`relative ${className}`} style={{ minHeight: getSizeHeight(size) }}>
      <Suspense fallback={<SatorSquareSkeleton size={size} />}>
        {useSVG ? (
          <SatorSquareSVG 
            onLayerClick={onLayerClick}
            mode={mode}
            reducedMotion={reducedMotion}
          />
        ) : (
          <SatorSquareWebGL 
            onLayerClick={onLayerClick}
            mode={mode}
            reducedMotion={reducedMotion}
          />
        )}
      </Suspense>
    </div>
  );
}

function getSizeHeight(size) {
  const sizes = { small: '200px', medium: '400px', large: '600px' };
  return sizes[size] || sizes.large;
}

function SatorSquareSkeleton({ size }) {
  return (
    <div 
      className="w-full flex items-center justify-center"
      style={{ height: getSizeHeight(size) }}
    >
      <div className="animate-pulse">
        <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-white/30 animate-spin" />
      </div>
    </div>
  );
}
```

### 2.3 WebGL Implementation (Three.js)

```typescript
// components/SatorSquare/SatorSquareWebGL.jsx
import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SATOR_LAYERS, MODE_COLOR_OVERRIDES } from '@/constants/satorSquare';

function Scene({ onLayerClick, mode, reducedMotion }) {
  const groupRef = useRef();
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  
  // Get mode-adjusted colors
  const getLayerColor = useCallback((layer) => {
    const override = MODE_COLOR_OVERRIDES[mode]?.[layer.id];
    return override?.color || layer.color;
  }, [mode]);
  
  // Global rotation
  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  const handleLayerClick = useCallback((layer) => {
    setSelectedLayer(layer.id);
    onLayerClick?.(layer);
  }, [onLayerClick]);
  
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00D4FF" />
      
      {/* Stars background */}
      <Stars 
        radius={50} 
        depth={50} 
        count={500} 
        factor={2} 
        saturation={0} 
        fade 
      />
      
      {/* Central core */}
      <CentralCore 
        hovered={hoveredLayer === 'CENTER'}
        onHover={setHoveredLayer}
      />
      
      {/* SATOR Square layers - reversed for proper Z-ordering */}
      <group ref={groupRef}>
        {[...SATOR_LAYERS].reverse().map((layer, index) => (
          <SatorRing
            key={layer.id}
            layer={layer}
            color={getLayerColor(layer)}
            isHovered={hoveredLayer === layer.id}
            isSelected={selectedLayer === layer.id}
            onHover={setHoveredLayer}
            onClick={handleLayerClick}
            reducedMotion={reducedMotion}
          />
        ))}
      </group>
      
      {/* Controls */}
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

function SatorRing({ layer, color, isHovered, isSelected, onHover, onClick, reducedMotion }) {
  const ringRef = useRef();
  const textRefs = useRef([]);
  
  // Individual ring rotation
  useFrame((state) => {
    if (ringRef.current && !reducedMotion) {
      ringRef.current.rotation.z = state.clock.elapsedTime * layer.speed * 0.3;
    }
    
    // Counter-rotate text to keep upright
    textRefs.current.forEach((textRef) => {
      if (textRef) {
        textRef.rotation.z = -ringRef.current.rotation.z;
      }
    });
  });
  
  // Calculate letter positions
  const letters = useMemo(() => {
    return layer.name.split('').map((letter, i) => {
      const angle = (i / layer.letterCount) * Math.PI * 2;
      return {
        letter,
        x: Math.cos(angle) * layer.radius,
        y: Math.sin(angle) * layer.radius,
      };
    });
  }, [layer]);
  
  // Hover pulse animation
  useEffect(() => {
    if (ringRef.current && isHovered) {
      // Subtle scale pulse
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const scale = 1 + Math.sin(elapsed * 0.005) * 0.02;
        ringRef.current.scale.setScalar(scale);
        if (isHovered) requestAnimationFrame(animate);
        else ringRef.current.scale.setScalar(1);
      };
      animate();
    }
  }, [isHovered]);
  
  return (
    <group 
      ref={ringRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick(layer);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(layer.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Main ring */}
      <mesh>
        <torusGeometry args={[layer.radius, isHovered ? 0.04 : 0.02, 16, 100]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isHovered ? 0.8 : 0.5}
          toneMapped={false}
        />
      </mesh>
      
      {/* Glow ring */}
      <mesh>
        <torusGeometry args={[layer.radius, 0.08, 16, 100]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isHovered ? 0.3 : (isSelected ? 0.25 : 0.15)}
        />
      </mesh>
      
      {/* Letters */}
      {letters.map((item, i) => (
        <group key={i} position={[item.x, item.y, 0]}>
          <Text
            ref={(el) => (textRefs.current[i] = el)}
            fontSize={isHovered ? 0.45 : 0.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/SpaceGrotesk-Bold.ttf"
            letterSpacing={0.1}
            material-toneMapped={false}
          >
            {item.letter}
          </Text>
          
          {/* Letter glow plane */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}
      
      {/* Tooltip on hover */}
      {isHovered && (
        <Html position={[layer.radius + 1, 0, 0]} center>
          <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none">
            <div className="text-sm font-bold" style={{ color }}>{layer.name}</div>
            <div className="text-xs text-white/60">{layer.description}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function CentralCore({ hovered, onHover }) {
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
      <mesh
        onPointerOver={() => {
          onHover('CENTER');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
      
      {/* Glow layers */}
      {[0.7, 0.9, 1.1].map((radius, i) => (
        <mesh key={i}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.1 - i * 0.02}
          />
        </mesh>
      ))}
      
      {/* Center label */}
      <Text
        position={[0, 0, 0.55]}
        fontSize={0.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        font="/fonts/SpaceGrotesk-Bold.ttf"
      >
        4NJZ4
      </Text>
    </group>
  );
}

export default function SatorSquareWebGL(props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 45 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]} // Responsive DPR
      style={{ background: 'transparent' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
```

### 2.4 SVG Fallback Implementation

```typescript
// components/SatorSquare/SatorSquareSVG.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SATOR_LAYERS, MODE_COLOR_OVERRIDES } from '@/constants/satorSquare';

export default function SatorSquareSVG({ onLayerClick, mode, reducedMotion }) {
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef();
  
  // Animation loop
  useEffect(() => {
    if (reducedMotion) return;
    
    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      
      setRotation(r => r + delta * 0.0005);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [reducedMotion]);
  
  const getLayerColor = (layer) => {
    const override = MODE_COLOR_OVERRIDES[mode]?.[layer.id];
    return override?.color || layer.color;
  };
  
  const handleLayerClick = (layer) => {
    setSelectedLayer(layer.id);
    onLayerClick?.(layer);
  };
  
  return (
    <svg viewBox="-5 -5 10 10" className="w-full h-full">
      <defs>
        {/* Glow filters */}
        {SATOR_LAYERS.map((layer) => (
          <filter key={layer.id} id={`glow-${layer.id}`}>
            <feGaussianBlur stdDeviation="0.1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
      
      {/* Background circle */}
      <circle 
        cx="0" 
        cy="0" 
        r="4.5" 
        fill="none" 
        stroke="rgba(255,255,255,0.05)" 
        strokeWidth="0.02"
      />
      
      {/* Central core */}
      <g>
        <circle cx="0" cy="0" r="0.5" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="0" cy="0" r="0.7" fill="#FFFFFF" fillOpacity="0.15" />
        <circle cx="0" cy="0" r="0.9" fill="#FFFFFF" fillOpacity="0.05" />
        <text
          x="0"
          y="0.05"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="0.2"
          fontWeight="bold"
          fontFamily="Space Grotesk, sans-serif"
        >
          4NJZ4
        </text>
      </g>
      
      {/* Rings - reversed order */}
      {[...SATOR_LAYERS].reverse().map((layer) => {
        const isHovered = hoveredLayer === layer.id;
        const isSelected = selectedLayer === layer.id;
        const color = getLayerColor(layer);
        const ringRotation = rotation * layer.speed;
        
        return (
          <g
            key={layer.id}
            transform={`rotate(${ringRotation * (180 / Math.PI)})`}
            onClick={() => handleLayerClick(layer)}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{ cursor: 'pointer' }}
            filter={isHovered ? `url(#glow-${layer.id})` : undefined}
          >
            {/* Ring circle */}
            <circle
              cx="0"
              cy="0"
              r={layer.radius}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? 0.06 : 0.04}
              strokeOpacity={isHovered ? 0.8 : 0.5}
            />
            
            {/* Outer glow */}
            <circle
              cx="0"
              cy="0"
              r={layer.radius}
              fill="none"
              stroke={color}
              strokeWidth={0.12}
              strokeOpacity={isSelected ? 0.3 : (isHovered ? 0.2 : 0.1)}
            />
            
            {/* Letters */}
            {layer.name.split('').map((letter, i) => {
              const angle = (i / layer.letterCount) * Math.PI * 2;
              const x = Math.cos(angle) * layer.radius;
              const y = Math.sin(angle) * layer.radius;
              
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  {/* Letter glow background */}
                  <circle
                    r={isHovered ? 0.35 : 0.3}
                    fill={color}
                    fillOpacity={0.15}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={isHovered ? 0.4 : 0.35}
                    fontWeight="bold"
                    fontFamily="Space Grotesk, sans-serif"
                    style={{ userSelect: 'none' }}
                  >
                    {letter}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      
      {/* Tooltip layer */}
      {hoveredLayer && (
        <g>
          {(() => {
            const layer = SATOR_LAYERS.find(l => l.id === hoveredLayer);
            if (!layer) return null;
            const color = getLayerColor(layer);
            
            return (
              <g transform={`translate(${layer.radius + 1}, 0)`}>
                <rect
                  x="-0.8"
                  y="-0.4"
                  width="1.6"
                  height="0.8"
                  rx="0.1"
                  fill="rgba(0,0,0,0.8)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.02"
                />
                <text
                  y="-0.1"
                  textAnchor="middle"
                  fill={color}
                  fontSize="0.18"
                  fontWeight="bold"
                  fontFamily="Space Grotesk, sans-serif"
                >
                  {layer.name}
                </text>
                <text
                  y="0.2"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)"
                  fontSize="0.12"
                  fontFamily="Space Grotesk, sans-serif"
                >
                  {layer.description}
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
```

---

## III. TESTING REQUIREMENTS

### 3.1 Performance Benchmarks

```typescript
// tests/SatorSquare.perf.test.js
describe('SatorSquare Performance', () => {
  test('maintains 60fps during rotation', async () => {
    const { container } = render(<SatorSquare />);
    // Use Puppeteer or similar to measure frame rate
  });
  
  test('switches to SVG on low-end devices', () => {
    // Mock WebGL failure
    const { container } = render(<SatorSquare />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  
  test('respects reduced motion preference', () => {
    // Mock prefers-reduced-motion
    const { container } = render(<SatorSquare />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
```

---

## IV. DELIVERABLES

1. `components/SatorSquare/index.jsx` - Main entry with feature detection
2. `components/SatorSquare/SatorSquareWebGL.jsx` - Three.js implementation
3. `components/SatorSquare/SatorSquareSVG.jsx` - SVG fallback
4. `constants/satorSquare.js` - Layer configuration
5. `hooks/useWebGLSupport.js` - Feature detection
6. `hooks/usePrefersReducedMotion.js` - Accessibility

---

*End of SATOR Square Sub-Agent Prompt*
