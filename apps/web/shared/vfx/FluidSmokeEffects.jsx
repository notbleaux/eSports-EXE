/**
 * NJZ Platform v2 - FluidSmokeEffects Component
 * WebGL-powered fluid smoke simulation
 * 
 * @version 2.0.0
 * @requires react, three, @react-three/fiber
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Fluid smoke shader material
 */
const FluidSmokeMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uColor1: { value: new THREE.Color('#0a0a0f') },
    uColor2: { value: new THREE.Color('#1a1a24') },
    uColor3: { value: new THREE.Color('#00f0ff') },
    uIntensity: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uIntensity;
    
    varying vec2 vUv;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Create flowing smoke effect
      float time = uTime * 0.15;
      
      // Layer multiple noise octaves
      float noise1 = fbm(vec3(uv * 2.0, time));
      float noise2 = fbm(vec3(uv * 4.0 + 100.0, time * 1.5));
      float noise3 = fbm(vec3(uv * 1.0 + 200.0, time * 0.5));
      
      // Mouse influence
      float mouseDist = distance(uv, uMouse);
      float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.3;
      
      // Combine noises
      float finalNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2 + mouseInfluence;
      finalNoise = finalNoise * 0.5 + 0.5;
      
      // Create color gradient
      vec3 color = mix(uColor1, uColor2, finalNoise);
      color = mix(color, uColor3, mouseInfluence * uIntensity * 2.0);
      
      // Add subtle vignette
      float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
      color *= vignette * 0.3 + 0.7;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * Fluid smoke mesh component
 */
function FluidSmokeMesh({ intensity = 0.5, mouseInfluence = true }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const { viewport, size } = useThree();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!mouseInfluence) return;
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseInfluence]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.lerp(mouseRef.current, 0.05);
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uColor1: { value: new THREE.Color('#0a0a0f') },
    uColor2: { value: new THREE.Color('#1a1a24') },
    uColor3: { value: new THREE.Color('#00f0ff') },
    uIntensity: { value: intensity },
  }), [size.width, size.height, intensity]);

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={FluidSmokeMaterial.vertexShader}
        fragmentShader={FluidSmokeMaterial.fragmentShader}
      />
    </mesh>
  );
}

/**
 * Fluid smoke effects container
 * @param {Object} props
 * @param {number} [props.intensity=0.5] - Effect intensity
 * @param {boolean} [props.mouseInfluence=true] - Enable mouse interaction
 * @param {string} [props.className] - Additional CSS classes
 */
export function FluidSmokeEffects({
  intensity = 0.5,
  mouseInfluence = true,
  className = '',
  style = {},
}) {
  return (
    <div 
      className={`njz-fluid-smoke ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ 
          antialias: false, 
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <FluidSmokeMesh 
          intensity={intensity} 
          mouseInfluence={mouseInfluence} 
        />
      </Canvas>
    </div>
  );
}

export default FluidSmokeEffects;
