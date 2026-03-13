[Ver001.000]

# AI IMPLEMENTATION PROMPT: SATOR Square Visualization
## 5-Layer Palindromic WebGL Component

**Purpose:** Guide AI agents to enhance the existing SATOR Square with interactive layers, click navigation, and SVG fallback.

---

## I. CURRENT STATE ANALYSIS

The existing SATOR Square (`src/hub-5-tenet/components/SatorSquare.jsx`) implements:
- ✅ Three.js via React Three Fiber
- ✅ 5 rotating rings with letters
- ✅ Central glowing core
- ✅ Starfield background
- ✅ OrbitControls for camera

**Enhancement Goals:**
- Add click-to-navigate functionality
- Implement layer selection state
- Add tooltip/info on hover
- Create SVG fallback for mobile/low-spec
- Optimize performance (lazy load)

---

## II. ENHANCED FEATURE SPECIFICATION

### 2.1 Interactive Layer System

Each of the 5 rings should be clickable and navigate to its respective hub:

```typescript
interface SatorSquareLayer {
  id: 'SATOR' | 'AREPO' | 'TENET' | 'OPERA' | 'ROTAS';
  name: string;
  color: string;
  path: string;
  description: string;
  radius: number;
  speed: number;
  letterCount: number;
}

const LAYERS: SatorSquareLayer[] = [
  { 
    id: 'SATOR', 
    name: 'SATOR', 
    color: '#ffd700', 
    path: '/sator',
    description: 'Raw Data Ingestion',
    radius: 3.5, 
    speed: 0.3,
    letterCount: 5 
  },
  { 
    id: 'AREPO', 
    name: 'AREPO', 
    color: '#0066ff', 
    path: '/arepo',
    description: 'Processing Layer',
    radius: 2.8, 
    speed: -0.4,
    letterCount: 5 
  },
  { 
    id: 'TENET', 
    name: 'TENET', 
    color: '#ffffff', 
    path: '/tenet',
    description: 'Control Center',
    radius: 2.1, 
    speed: 0.5,
    letterCount: 5 
  },
  { 
    id: 'OPERA', 
    name: 'OPERA', 
    color: '#9d4edd', 
    path: '/opera',
    description: 'Visualization Layer',
    radius: 1.4, 
    speed: -0.6,
    letterCount: 5 
  },
  { 
    id: 'ROTAS', 
    name: 'ROTAS', 
    color: '#00d4ff', 
    path: '/rotas',
    description: 'Distribution Network',
    radius: 0.7, 
    speed: 0.7,
    letterCount: 5 
  },
];
```

### 2.2 Click Interaction

```typescript
// Navigation on ring click
const handleLayerClick = (layer: SatorSquareLayer) => {
  // Visual feedback
  setSelectedLayer(layer.id);
  
  // Trigger navigation
  navigate(layer.path);
  
  // Analytics tracking
  trackEvent('sator_square_navigate', { layer: layer.id });
};

// Hover state for tooltips
const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
```

### 2.3 Enhanced Ring Component

```typescript
interface RingProps {
  layer: SatorSquareLayer;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function InteractiveRing({ layer, isSelected, isHovered, onClick, onHover }: RingProps) {
  const ringRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (ringRef.current) {
      // Base rotation
      ringRef.current.rotation.z = state.clock.elapsedTime * layer.speed * 0.3;
      
      // Selection pulse effect
      if (isSelected) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        ringRef.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group 
      ref={ringRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Visual ring with enhanced glow on hover */}
      <mesh>
        <torusGeometry args={[layer.radius, hovered ? 0.04 : 0.02, 16, 100]} />
        <meshBasicMaterial 
          color={layer.color} 
          transparent 
          opacity={hovered ? 0.6 : 0.3} 
        />
      </mesh>
      
      {/* Outer glow - intensifies on hover/selection */}
      <mesh>
        <torusGeometry 
          args={[layer.radius, isSelected || hovered ? 0.12 : 0.08, 16, 100]} 
        />
        <meshBasicMaterial 
          color={layer.color} 
          transparent 
          opacity={isSelected ? 0.2 : hovered ? 0.15 : 0.1} 
        />
      </mesh>
      
      {/* Letters */}
      {layer.name.split('').map((letter, i) => {
        const angle = (i / layer.letterCount) * Math.PI * 2;
        const x = Math.cos(angle) * layer.radius;
        const y = Math.sin(angle) * layer.radius;
        
        return (
          <Text
            key={i}
            position={[x, y, 0]}
            fontSize={hovered ? 0.4 : 0.35}
            color={layer.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/SpaceGrotesk-Bold.ttf"
          >
            {letter}
          </Text>
        );
      })}
      
      {/* Hub name label - only visible on hover */}
      {hovered && (
        <group position={[layer.radius + 0.8, 0, 0]}>
          <Text
            fontSize={0.25}
            color={layer.color}
            anchorX="center"
            anchorY="middle"
            font="/fonts/SpaceGrotesk-Regular.ttf"
          >
            {layer.name}
          </Text>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/SpaceGrotesk-Regular.ttf"
          >
            {layer.description}
          </Text>
        </group>
      )}
    </group>
  );
}
```

---

## III. SVG FALLBACK IMPLEMENTATION

For mobile devices and low-spec environments:

```typescript
// Feature detection hook
function useWebGLSupport() {
  const [supported, setSupported] = useState(true);
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);
  
  return supported;
}

// SVG Fallback Component
function SatorSquareSVG({ onLayerClick }: { onLayerClick: (layer: SatorSquareLayer) => void }) {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  
  // Animate rotation
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setRotation(r => r + 0.002);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <svg viewBox="-5 -5 10 10" className="w-full h-full">
      {/* Background */}
      <circle cx="0" cy="0" r="4.5" fill="none" stroke="#ffffff" strokeOpacity="0.05" />
      
      {/* Central core */}
      <circle cx="0" cy="0" r="0.4" fill="#ffffff" fillOpacity="0.9" />
      <circle cx="0" cy="0" r="0.6" fill="#ffffff" fillOpacity="0.15" />
      <circle cx="0" cy="0" r="0.8" fill="#ffffff" fillOpacity="0.05" />
      
      {/* Rings - reversed order */}
      {[...LAYERS].reverse().map((layer) => {
        const isHovered = hoveredLayer === layer.id;
        const ringRotation = rotation * layer.speed * 10;
        
        return (
          <g
            key={layer.id}
            transform={`rotate(${ringRotation})`}
            onClick={() => onLayerClick(layer)}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Ring circle */}
            <circle
              cx="0"
              cy="0"
              r={layer.radius}
              fill="none"
              stroke={layer.color}
              strokeWidth={isHovered ? 0.08 : 0.04}
              strokeOpacity={isHovered ? 0.6 : 0.3}
            />
            
            {/* Outer glow */}
            <circle
              cx="0"
              cy="0"
              r={layer.radius}
              fill="none"
              stroke={layer.color}
              strokeWidth={isHovered ? 0.15 : 0.1}
              strokeOpacity={isHovered ? 0.2 : 0.1}
            />
            
            {/* Letters */}
            {layer.name.split('').map((letter, i) => {
              const angle = (i / layer.letterCount) * Math.PI * 2;
              const x = Math.cos(angle) * layer.radius;
              const y = Math.sin(angle) * layer.radius;
              
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill={layer.color}
                  fontSize={isHovered ? 0.4 : 0.35}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {letter}
                </text>
              );
            })}
            
            {/* Label on hover */}
            {isHovered && (
              <g transform={`translate(${layer.radius + 0.8}, 0)`}>
                <text
                  fill={layer.color}
                  fontSize={0.25}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {layer.name}
                </text>
                <text
                  y={0.3}
                  fill="#ffffff"
                  fontSize={0.15}
                  textAnchor="middle"
                >
                  {layer.description}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

---

## IV. PERFORMANCE OPTIMIZATIONS

### 4.1 Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const SatorSquareWebGL = lazy(() => import('./SatorSquareWebGL'));

export function SatorSquare({ className = '' }) {
  const webglSupported = useWebGLSupport();
  
  return (
    <div className={`w-full h-full min-h-[500px] ${className}`}>
      {webglSupported ? (
        <Suspense fallback={<SatorSquareSkeleton />}>
          <SatorSquareWebGL />
        </Suspense>
      ) : (
        <SatorSquareSVG />
      )}
    </div>
  );
}

function SatorSquareSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-32 h-32 rounded-full border-4 border-white/10" />
      </div>
    </div>
  );
}
```

### 4.2 Reduced Motion Support

```typescript
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return reduced;
}

// In component
const reducedMotion = usePrefersReducedMotion();

useFrame((state) => {
  if (ringRef.current && !reducedMotion) {
    ringRef.current.rotation.z = state.clock.elapsedTime * speed * 0.3;
  }
});
```

---

## V. INTEGRATION WITH MODE TOGGLE

The SATOR Square should respond to the global mode state:

```typescript
// When in ROTAS mode, reverse rotation direction or change colors
const { mode } = useModeStore();

const adjustedSpeed = mode === 'ROTAS' ? -speed : speed;
const adjustedColor = mode === 'ROTAS' 
  ? adjustColorForRotasMode(layer.color) 
  : layer.color;
```

---

## VI. TESTING CHECKLIST

- [ ] Click on each ring navigates to correct hub
- [ ] Hover shows layer name and description
- [ ] Selected layer has pulse animation
- [ ] WebGL renders correctly on desktop
- [ ] SVG fallback renders correctly on mobile
- [ ] Reduced motion preference respected
- [ ] Lazy loading works (component splits)
- [ ] No console errors
- [ ] Performance: 60fps on mid-tier hardware

---

## VII. COMMON AI PITFALLS TO AVOID

### ❌ DON'T:
1. Forget to add `e.stopPropagation()` on click handlers
2. Use `window.open` for navigation (use React Router)
3. Forget to clean up cursor style on unmount
4. Hardcode colors - use the LAYERS config
5. Forget to handle WebGL context loss
6. Make tooltips overflow viewport

### ✅ DO:
1. Use React Three Fiber's `useFrame` for animations
2. Implement proper cleanup in useEffect
3. Test both WebGL and SVG paths
4. Add loading states for lazy-loaded component
5. Consider touch devices for hover states
6. Add aria-labels for accessibility

---

## VIII. USAGE EXAMPLE

```tsx
import { SatorSquare } from '@/components/SatorSquare';
import { useNavigate } from 'react-router-dom';

function TenetHub() {
  const navigate = useNavigate();
  
  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-center text-2xl font-bold mb-4">
        TENET Control Center
      </h1>
      
      <div className="flex-1">
        <SatorSquare 
          className="w-full h-full"
          onLayerClick={(layer) => navigate(layer.path)}
        />
      </div>
      
      <p className="text-center text-sm text-white/50 mt-4">
        Click any ring to navigate to that hub
      </p>
    </div>
  );
}
```

---

*End of SATOR Square Enhancement Prompt*
