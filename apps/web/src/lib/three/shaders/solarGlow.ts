/**
 * Solar Glow Shader
 * 
 * [Ver001.000] - Rim lighting and pulsing glow effect for Sol mascot
 * 
 * Features:
 * - Rim lighting based on view angle
 * - Pulsing glow synchronized with time
 * - Gold/orange gradient colors
 * - Configurable intensity and pulse speed
 */

import * as THREE from 'three';
import { BaseShader, BaseShaderConfig, UniformDefinition, GLSL_UTILS } from './shaderLib';

export interface SolarGlowConfig extends Omit<BaseShaderConfig, 'name'> {
  /** Base color - golden yellow */
  baseColor?: THREE.Color;
  /** Rim color - bright gold */
  rimColor?: THREE.Color;
  /** Glow color - warm orange */
  glowColor?: THREE.Color;
  /** Rim intensity */
  rimIntensity?: number;
  /** Glow intensity */
  glowIntensity?: number;
  /** Pulse speed in Hz */
  pulseSpeed?: number;
  /** Pulse amplitude (0-1) */
  pulseAmplitude?: number;
  /** Fresnel power for rim falloff */
  fresnelPower?: number;
  /** Glow size/radius */
  glowRadius?: number;
}

export class SolarGlowShader extends BaseShader {
  private solarConfig: SolarGlowConfig;

  constructor(config: SolarGlowConfig = {}) {
    const defaultConfig: SolarGlowConfig = {
      baseColor: new THREE.Color(0xffaa00),
      rimColor: new THREE.Color(0xffdd44),
      glowColor: new THREE.Color(0xff6600),
      rimIntensity: 1.5,
      glowIntensity: 2.0,
      pulseSpeed: 1.0,
      pulseAmplitude: 0.3,
      fresnelPower: 2.0,
      glowRadius: 1.2,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      ...config,
    };

    super({
      name: 'solarGlow',
      ...defaultConfig,
      uniforms: {
        uBaseColor: {
          type: 'vec3',
          value: defaultConfig.baseColor,
          description: 'Base color of the solar effect',
        },
        uRimColor: {
          type: 'vec3',
          value: defaultConfig.rimColor,
          description: 'Rim highlight color',
        },
        uGlowColor: {
          type: 'vec3',
          value: defaultConfig.glowColor,
          description: 'Glow color',
        },
        uRimIntensity: {
          type: 'float',
          value: defaultConfig.rimIntensity,
          min: 0,
          max: 5,
          step: 0.1,
          description: 'Rim lighting intensity',
        },
        uGlowIntensity: {
          type: 'float',
          value: defaultConfig.glowIntensity,
          min: 0,
          max: 5,
          step: 0.1,
          description: 'Glow intensity',
        },
        uPulseSpeed: {
          type: 'float',
          value: defaultConfig.pulseSpeed,
          min: 0,
          max: 5,
          step: 0.1,
          description: 'Pulse speed in Hz',
        },
        uPulseAmplitude: {
          type: 'float',
          value: defaultConfig.pulseAmplitude,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Pulse amplitude',
        },
        uFresnelPower: {
          type: 'float',
          value: defaultConfig.fresnelPower,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Fresnel falloff power',
        },
        uGlowRadius: {
          type: 'float',
          value: defaultConfig.glowRadius,
          min: 1,
          max: 3,
          step: 0.1,
          description: 'Glow radius multiplier',
        },
      },
    });

    this.solarConfig = defaultConfig;
  }

  protected getVertexShader(): string {
    return `
      ${GLSL_UTILS.vertexHeader}
      
      varying float vFresnel;
      varying float vPulse;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Calculate view direction for fresnel
        vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
        float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
        vFresnel = pow(fresnel, uFresnelPower);
        
        // Calculate pulse
        vPulse = sin(uTime * uPulseSpeed * 6.28318) * 0.5 + 0.5;
        
        // Expand vertices for glow effect
        vec3 glowPosition = position * uGlowRadius;
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(glowPosition, 1.0);
      }
    `;
  }

  protected getFragmentShader(): string {
    return `
      precision highp float;
      
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform vec3 uGlowColor;
      uniform float uRimIntensity;
      uniform float uGlowIntensity;
      uniform float uPulseSpeed;
      uniform float uPulseAmplitude;
      
      varying float vFresnel;
      varying float vPulse;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      // Simple noise for solar flares
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
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
      
      // Solar flare effect
      float solarFlare(vec2 uv, float time) {
        float flare = 0.0;
        
        // Create multiple flare layers
        for (float i = 1.0; i <= 3.0; i++) {
          vec2 offset = vec2(
            sin(time * i * 0.5) * 0.1,
            cos(time * i * 0.3) * 0.1
          );
          
          float n = noise(uv * (3.0 + i) + offset + time * 0.2);
          flare += n * (1.0 / i);
        }
        
        return flare * 0.5;
      }
      
      void main() {
        // Create radial gradient from center
        vec2 center = vUv - vec2(0.5);
        float radialDist = length(center) * 2.0;
        
        // Base solar color with gradient
        vec3 baseColor = uBaseColor;
        
        // Add solar flare noise
        float flare = solarFlare(vUv, uTime);
        baseColor += uGlowColor * flare * 0.3;
        
        // Apply rim lighting based on fresnel
        vec3 rimColor = uRimColor * vFresnel * uRimIntensity;
        
        // Add pulsing glow
        float pulseFactor = 1.0 + (vPulse * uPulseAmplitude);
        vec3 glowColor = uGlowColor * vFresnel * uGlowIntensity * pulseFactor;
        
        // Create core brightness
        float coreBrightness = 1.0 - smoothstep(0.0, 0.5, radialDist);
        vec3 coreColor = mix(uBaseColor, vec3(1.0), coreBrightness * 0.5);
        
        // Combine all components
        vec3 finalColor = baseColor + rimColor + glowColor;
        
        // Add hot spots (simulating solar surface)
        float hotSpot = noise(vUv * 8.0 + uTime * 0.1);
        hotSpot = pow(hotSpot, 3.0) * 0.5;
        finalColor += uRimColor * hotSpot;
        
        // Alpha based on fresnel and radial falloff
        float alpha = vFresnel * (1.0 - radialDist * 0.3);
        alpha = clamp(alpha, 0.0, 1.0);
        
        // Boost alpha with pulse
        alpha *= pulseFactor;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }

  /** Set pulse phase manually (0-1) */
  setPulsePhase(phase: number): void {
    // Adjust internal time to match phase
    const targetTime = phase * (1 / this.solarConfig.pulseSpeed!);
    this.startTime = performance.now() - targetTime * 1000;
  }

  /** Create a preset for "Sun Surface" effect */
  static createSunSurfacePreset(): SolarGlowConfig {
    return {
      baseColor: new THREE.Color(0xff8800),
      rimColor: new THREE.Color(0xffff00),
      glowColor: new THREE.Color(0xff4400),
      rimIntensity: 2.0,
      glowIntensity: 3.0,
      pulseSpeed: 0.5,
      pulseAmplitude: 0.2,
      fresnelPower: 1.5,
      glowRadius: 1.0,
    };
  }

  /** Create a preset for "Golden Halo" effect */
  static createGoldenHaloPreset(): SolarGlowConfig {
    return {
      baseColor: new THREE.Color(0xffd700),
      rimColor: new THREE.Color(0xffec8b),
      glowColor: new THREE.Color(0xffa500),
      rimIntensity: 1.0,
      glowIntensity: 1.5,
      pulseSpeed: 2.0,
      pulseAmplitude: 0.4,
      fresnelPower: 3.0,
      glowRadius: 1.5,
    };
  }

  /** Create a preset for "Corona" effect */
  static createCoronaPreset(): SolarGlowConfig {
    return {
      baseColor: new THREE.Color(0xffaa00),
      rimColor: new THREE.Color(0xffffff),
      glowColor: new THREE.Color(0xff6600),
      rimIntensity: 3.0,
      glowIntensity: 4.0,
      pulseSpeed: 0.3,
      pulseAmplitude: 0.5,
      fresnelPower: 1.0,
      glowRadius: 2.0,
    };
  }
}

/** Factory function for quick shader creation */
export function createSolarGlow(config?: SolarGlowConfig): SolarGlowShader {
  return new SolarGlowShader(config);
}

/** Create solar glow material directly */
export function createSolarGlowMaterial(config?: SolarGlowConfig): THREE.ShaderMaterial | undefined {
  const shader = new SolarGlowShader(config);
  const result = shader.compile();
  return result.success ? result.material : undefined;
}
