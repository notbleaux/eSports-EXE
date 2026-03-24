/**
 * Lunar Glow Shader
 * 
 * [Ver001.000] - Cool blue/white glow with phase-based intensity for Lun mascot
 * 
 * Features:
 * - Cool blue/white glow effect
 * - Phase-based intensity (moon phases)
 * - Star particle effects
 * - Crater shadow simulation
 */

import * as THREE from 'three';
import { BaseShader, BaseShaderConfig, GLSL_UTILS } from './shaderLib';

export interface LunarGlowConfig extends Omit<BaseShaderConfig, 'name'> {
  /** Base moon color - pale blue/white */
  baseColor?: THREE.Color;
  /** Glow color - cool blue */
  glowColor?: THREE.Color;
  /** Star color - bright white/blue */
  starColor?: THREE.Color;
  /** Shadow color - deep blue */
  shadowColor?: THREE.Color;
  /** Phase of the moon (0-1, 0=new, 0.5=full, 1=new) */
  phase?: number;
  /** Glow intensity */
  glowIntensity?: number;
  /** Number of stars to render */
  starCount?: number;
  /** Star twinkle speed */
  twinkleSpeed?: number;
  /** Surface detail intensity */
  surfaceDetail?: number;
  /** Crater visibility */
  craterIntensity?: number;
}

export class LunarGlowShader extends BaseShader {
  private lunarConfig: LunarGlowConfig;

  constructor(config: LunarGlowConfig = {}) {
    const defaultConfig: LunarGlowConfig = {
      baseColor: new THREE.Color(0xe0e8ff),
      glowColor: new THREE.Color(0x6699ff),
      starColor: new THREE.Color(0xffffff),
      shadowColor: new THREE.Color(0x1a237e),
      phase: 0.5, // Full moon
      glowIntensity: 1.5,
      starCount: 50,
      twinkleSpeed: 2.0,
      surfaceDetail: 0.5,
      craterIntensity: 0.3,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      ...config,
    };

    super({
      name: 'lunarGlow',
      ...defaultConfig,
      uniforms: {
        uBaseColor: {
          type: 'vec3',
          value: defaultConfig.baseColor,
          description: 'Base moon surface color',
        },
        uGlowColor: {
          type: 'vec3',
          value: defaultConfig.glowColor,
          description: 'Glow color',
        },
        uStarColor: {
          type: 'vec3',
          value: defaultConfig.starColor,
          description: 'Star particle color',
        },
        uShadowColor: {
          type: 'vec3',
          value: defaultConfig.shadowColor,
          description: 'Shadow/crater color',
        },
        uPhase: {
          type: 'float',
          value: defaultConfig.phase,
          min: 0,
          max: 1,
          step: 0.01,
          description: 'Moon phase (0-1)',
        },
        uGlowIntensity: {
          type: 'float',
          value: defaultConfig.glowIntensity,
          min: 0,
          max: 5,
          step: 0.1,
          description: 'Glow intensity',
        },
        uStarCount: {
          type: 'float',
          value: defaultConfig.starCount,
          min: 0,
          max: 100,
          step: 1,
          description: 'Number of stars',
        },
        uTwinkleSpeed: {
          type: 'float',
          value: defaultConfig.twinkleSpeed,
          min: 0,
          max: 10,
          step: 0.1,
          description: 'Star twinkle speed',
        },
        uSurfaceDetail: {
          type: 'float',
          value: defaultConfig.surfaceDetail,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Surface detail level',
        },
        uCraterIntensity: {
          type: 'float',
          value: defaultConfig.craterIntensity,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Crater visibility',
        },
      },
    });

    this.lunarConfig = defaultConfig;
  }

  protected getVertexShader(): string {
    return `
      ${GLSL_UTILS.vertexHeader}
      
      varying float vFresnel;
      varying vec3 vWorldNormal;
      
      // Pseudo-random function for star positions
      float starHash(float n) {
        return fract(sin(n) * 43758.5453);
      }
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Calculate fresnel for glow
        vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
        float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
        vFresnel = pow(fresnel, 1.5);
        
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;
  }

  protected getFragmentShader(): string {
    return `
      precision highp float;
      
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uGlowColor;
      uniform vec3 uStarColor;
      uniform vec3 uShadowColor;
      uniform float uPhase;
      uniform float uGlowIntensity;
      uniform float uStarCount;
      uniform float uTwinkleSpeed;
      uniform float uSurfaceDetail;
      uniform float uCraterIntensity;
      
      varying float vFresnel;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      
      // Hash function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      // Value noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // 3D noise for surface detail
      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = hash3(i);
        n += hash3(i + vec3(1.0, 0.0, 0.0)) * f.x;
        n += hash3(i + vec3(0.0, 1.0, 0.0)) * f.y;
        n += hash3(i + vec3(0.0, 0.0, 1.0)) * f.z;
        
        return n / 2.0;
      }
      
      // Crater generation
      float craters(vec2 uv, float intensity) {
        float result = 0.0;
        
        // Large craters
        for (float i = 0.0; i < 5.0; i++) {
          vec2 center = vec2(
            hash(vec2(i, 0.0)),
            hash(vec2(i, 1.0))
          );
          float radius = 0.05 + hash(vec2(i, 2.0)) * 0.1;
          float dist = length(uv - center);
          
          if (dist < radius) {
            float craterDepth = 1.0 - smoothstep(0.0, radius, dist);
            craterDepth *= sin(dist / radius * 3.14159);
            result += craterDepth * intensity;
          }
        }
        
        // Small craters
        for (float i = 5.0; i < 15.0; i++) {
          vec2 center = vec2(
            hash(vec2(i, 0.0)),
            hash(vec2(i, 1.0))
          );
          float radius = 0.01 + hash(vec2(i, 2.0)) * 0.03;
          float dist = length(uv - center);
          
          if (dist < radius) {
            float craterDepth = 1.0 - smoothstep(0.0, radius, dist);
            result += craterDepth * intensity * 0.5;
          }
        }
        
        return result;
      }
      
      // Star field generation
      float stars(vec2 uv, float count, float time) {
        float result = 0.0;
        
        for (float i = 0.0; i < 100.0; i++) {
          if (i >= count) break;
          
          // Star position
          vec2 starPos = vec2(
            hash(vec2(i, 0.0)),
            hash(vec2(i, 1.0))
          );
          
          // Twinkle
          float twinkle = sin(time * uTwinkleSpeed + i * 6.28) * 0.5 + 0.5;
          twinkle = pow(twinkle, 3.0);
          
          // Distance to star
          float dist = length(uv - starPos);
          float size = 0.002 + hash(vec2(i, 2.0)) * 0.003;
          
          // Star glow
          float star = smoothstep(size * 3.0, 0.0, dist) * twinkle;
          result += star;
        }
        
        return result;
      }
      
      // Phase calculation
      float calculatePhase(vec2 uv, float phase) {
        // Create phase shadow
        vec2 lightDir = vec2(cos(phase * 6.28318), 0.0);
        vec2 center = uv - vec2(0.5);
        
        // Distance from center
        float dist = length(center) * 2.0;
        if (dist > 1.0) return 0.0;
        
        // Project onto light direction
        float lit = dot(normalize(center), lightDir);
        
        // Create terminator (shadow line)
        float terminator = smoothstep(-0.1, 0.1, lit);
        
        // Adjust for waxing/waning
        if (phase > 0.5) {
          terminator = 1.0 - terminator;
        }
        
        return terminator;
      }
      
      void main() {
        vec2 centeredUv = vUv - vec2(0.5);
        float radialDist = length(centeredUv);
        
        if (radialDist > 0.5) {
          discard;
        }
        
        // Normalize UV for moon surface
        vec2 moonUv = vUv;
        
        // Surface detail noise
        float surfaceNoise = noise3(vec3(moonUv * 4.0, 0.0)) * uSurfaceDetail;
        
        // Generate craters
        float craterMask = craters(moonUv, uCraterIntensity);
        
        // Calculate phase illumination
        float illumination = calculatePhase(moonUv, uPhase);
        
        // Base surface color with detail
        vec3 surfaceColor = mix(uBaseColor, uShadowColor, craterMask * 0.5);
        surfaceColor = mix(surfaceColor, uShadowColor, surfaceNoise * 0.3);
        
        // Apply phase shadow
        surfaceColor *= illumination;
        
        // Add glow around edges
        vec3 glowColor = uGlowColor * vFresnel * uGlowIntensity;
        
        // Add soft outer glow
        float outerGlow = 1.0 - smoothstep(0.4, 0.5, radialDist);
        glowColor += uGlowColor * outerGlow * 0.5 * uGlowIntensity;
        
        // Generate stars
        float starField = stars(vUv, uStarCount, uTime);
        vec3 starColor = uStarColor * starField;
        
        // Combine everything
        vec3 finalColor = surfaceColor + glowColor + starColor;
        
        // Alpha calculation
        float alpha = vFresnel * 0.8 + outerGlow * 0.5;
        alpha = clamp(alpha + starField, 0.0, 1.0);
        
        // Boost alpha for surface
        if (radialDist < 0.48) {
          alpha = max(alpha, illumination * 0.9);
        }
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }

  /** Set moon phase (0=new, 0.5=full, 1=new) */
  setPhase(phase: number): void {
    this.setUniform('uPhase', Math.max(0, Math.min(1, phase)));
  }

  /** Animate through all phases */
  animatePhase(duration: number = 30): void {
    const startTime = performance.now();
    
    const updatePhase = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = (elapsed % duration) / duration;
      this.setPhase(progress);
      requestAnimationFrame(updatePhase);
    };
    
    updatePhase();
  }

  /** Create full moon preset */
  static createFullMoonPreset(): LunarGlowConfig {
    return {
      baseColor: new THREE.Color(0xf0f4ff),
      glowColor: new THREE.Color(0x88aaff),
      starColor: new THREE.Color(0xffffff),
      shadowColor: new THREE.Color(0x2a3f6e),
      phase: 0.5,
      glowIntensity: 1.5,
      starCount: 60,
      twinkleSpeed: 1.5,
      surfaceDetail: 0.6,
      craterIntensity: 0.4,
    };
  }

  /** Create crescent moon preset */
  static createCrescentPreset(): LunarGlowConfig {
    return {
      baseColor: new THREE.Color(0xe8ecff),
      glowColor: new THREE.Color(0x6699ff),
      starColor: new THREE.Color(0xffffff),
      shadowColor: new THREE.Color(0x1a237e),
      phase: 0.15,
      glowIntensity: 2.0,
      starCount: 80,
      twinkleSpeed: 2.0,
      surfaceDetail: 0.4,
      craterIntensity: 0.2,
    };
  }

  /** Create blood moon preset */
  static createBloodMoonPreset(): LunarGlowConfig {
    return {
      baseColor: new THREE.Color(0xff6b4a),
      glowColor: new THREE.Color(0xff3333),
      starColor: new THREE.Color(0xffcccc),
      shadowColor: new THREE.Color(0x4a1a1a),
      phase: 0.5,
      glowIntensity: 2.5,
      starCount: 40,
      twinkleSpeed: 0.5,
      surfaceDetail: 0.5,
      craterIntensity: 0.5,
    };
  }
}

/** Factory function for quick shader creation */
export function createLunarGlow(config?: LunarGlowConfig): LunarGlowShader {
  return new LunarGlowShader(config);
}

/** Create lunar glow material directly */
export function createLunarGlowMaterial(config?: LunarGlowConfig): THREE.ShaderMaterial | undefined {
  const shader = new LunarGlowShader(config);
  const result = shader.compile();
  return result.success ? result.material : undefined;
}
