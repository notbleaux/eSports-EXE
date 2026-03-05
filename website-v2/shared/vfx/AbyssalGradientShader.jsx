/**
 * NJZ Platform v2 - AbyssalGradientShader Component
 * Advanced gradient shader with abyssal theme
 * 
 * @version 2.0.0
 * @requires react, three, @react-three/fiber
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Abyssal gradient shader uniforms and code
 */
const AbyssalGradientShader = {
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uColorVoid: { value: new THREE.Color('#0a0a0f') },
    uColorDeep: { value: new THREE.Color('#12121a') },
    uColorMid: { value: new THREE.Color('#1a1a24') },
    uColorCyan: { value: new THREE.Color('#00f0ff') },
    uColorAmber: { value: new THREE.Color('#ff9f1c') },
    uColorGold: { value: new THREE.Color('#c9b037') },
    uSpeed: { value: 0.1 },
    uMixStrength: { value: 0.5 },
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
    uniform vec2 uResolution;
    uniform vec3 uColorVoid;
    uniform vec3 uColorDeep;
    uniform vec3 uColorMid;
    uniform vec3 uColorCyan;
    uniform vec3 uColorAmber;
    uniform vec3 uColorGold;
    uniform float uSpeed;
    uniform float uMixStrength;
    
    varying vec2 vUv;
    
    // Noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for(int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 uv = vUv;
      float time = uTime * uSpeed;
      
      // Create organic movement
      vec2 q = vec2(0.0);
      q.x = fbm(uv + time * 0.1);
      q.y = fbm(uv + vec2(1.0));
      
      vec2 r = vec2(0.0);
      r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
      r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);
      
      float f = fbm(uv + r);
      
      // Create gradient layers
      vec3 color = uColorVoid;
      
      // Mix void and deep
      color = mix(color, uColorDeep, clamp((f * f) * 4.0, 0.0, 1.0));
      
      // Add mid layer
      color = mix(color, uColorMid, clamp(length(q), 0.0, 1.0));
      
      // Add cyan accents based on noise
      float cyanMix = smoothstep(0.4, 0.6, f) * 0.3 * uMixStrength;
      color = mix(color, uColorCyan, cyanMix);
      
      // Add subtle gold/amber highlights
      float highlightMix = smoothstep(0.6, 0.8, f) * 0.15 * uMixStrength;
      color = mix(color, mix(uColorAmber, uColorGold, noise(uv * 3.0)), highlightMix);
      
      // Vignette
      float vignette = 1.0 - smoothstep(0.2, 1.5, length(uv - 0.5));
      color *= vignette * 0.4 + 0.6;
      
      // Subtle grain
      float grain = random(uv * time) * 0.02;
      color += grain;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/**
 * Gradient mesh component
 */
function GradientMesh({ speed = 0.1, mixStrength = 0.5, theme = 'default' }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, size } = useThree();

  const themeColors = useMemo(() => {
    const themes = {
      default: {
        void: '#0a0a0f',
        deep: '#12121a',
        mid: '#1a1a24',
        cyan: '#00f0ff',
        amber: '#ff9f1c',
        gold: '#c9b037',
      },
      cyan: {
        void: '#0a0a0f',
        deep: '#001520',
        mid: '#002a35',
        cyan: '#00f0ff',
        amber: '#0080a0',
        gold: '#40c0d0',
      },
      amber: {
        void: '#0a0a0f',
        deep: '#1a1005',
        mid: '#2a1a0a',
        cyan: '#ff9f1c',
        amber: '#ff9f1c',
        gold: '#ffc040',
      },
      gold: {
        void: '#0a0a0f',
        deep: '#1a1508',
        mid: '#2a200e',
        cyan: '#c9b037',
        amber: '#e0c040',
        gold: '#c9b037',
      },
    };
    return themes[theme] || themes.default;
  }, [theme]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uColorVoid: { value: new THREE.Color(themeColors.void) },
    uColorDeep: { value: new THREE.Color(themeColors.deep) },
    uColorMid: { value: new THREE.Color(themeColors.mid) },
    uColorCyan: { value: new THREE.Color(themeColors.cyan) },
    uColorAmber: { value: new THREE.Color(themeColors.amber) },
    uColorGold: { value: new THREE.Color(themeColors.gold) },
    uSpeed: { value: speed },
    uMixStrength: { value: mixStrength },
  }), [size.width, size.height, speed, mixStrength, themeColors]);

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={AbyssalGradientShader.vertexShader}
        fragmentShader={AbyssalGradientShader.fragmentShader}
      />
    </mesh>
  );
}

/**
 * Abyssal gradient background component
 * @param {Object} props
 * @param {number} [props.speed=0.1] - Animation speed
 * @param {number} [props.mixStrength=0.5] - Color mixing intensity
 * @param {string} [props.theme='default'] - Color theme (default, cyan, amber, gold)
 * @param {string} [props.className] - Additional CSS classes
 */
export function AbyssalGradientShader({
  speed = 0.1,
  mixStrength = 0.5,
  theme = 'default',
  className = '',
  style = {},
}) {
  return (
    <div 
      className={`njz-abyssal-gradient ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
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
        <GradientMesh 
          speed={speed}
          mixStrength={mixStrength}
          theme={theme}
        />
      </Canvas>
    </div>
  );
}

export default AbyssalGradientShader;
