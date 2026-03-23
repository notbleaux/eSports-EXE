/**
 * Fire VFX Shader
 * 
 * [Ver001.000] - Flame particle simulation with heat distortion for Fat mascot
 * 
 * Features:
 * - Flame particle simulation
 * - Heat distortion waves
 * - Ember trails and sparks
 * - Turbulent fire motion
 */

import * as THREE from 'three';
import { BaseShader, BaseShaderConfig, GLSL_UTILS } from './shaderLib';

export interface FireVFXConfig extends Omit<BaseShaderConfig, 'name'> {
  /** Core flame color - bright yellow/white */
  coreColor?: THREE.Color;
  /** Mid flame color - orange */
  midColor?: THREE.Color;
  /** Outer flame color - red */
  outerColor?: THREE.Color;
  /** Ember/spark color */
  emberColor?: THREE.Color;
  /** Flame height multiplier */
  flameHeight?: number;
  /** Flame spread/width */
  flameSpread?: number;
  /** Turbulence/noise amount */
  turbulence?: number;
  /** Flame speed */
  speed?: number;
  /** Number of ember particles */
  emberCount?: number;
  /** Heat distortion intensity */
  heatDistortion?: number;
  /** Smoke amount (0-1) */
  smokeAmount?: number;
}

export class FireVFXShader extends BaseShader {
  private fireConfig: FireVFXConfig;

  constructor(config: FireVFXConfig = {}) {
    const defaultConfig: FireVFXConfig = {
      coreColor: new THREE.Color(0xffffaa),
      midColor: new THREE.Color(0xff8800),
      outerColor: new THREE.Color(0xff2200),
      emberColor: new THREE.Color(0xffaa00),
      flameHeight: 2.0,
      flameSpread: 1.0,
      turbulence: 0.5,
      speed: 1.0,
      emberCount: 30,
      heatDistortion: 0.3,
      smokeAmount: 0.2,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      ...config,
    };

    super({
      name: 'fireVFX',
      ...defaultConfig,
      uniforms: {
        uCoreColor: {
          type: 'vec3',
          value: defaultConfig.coreColor,
          description: 'Core flame color',
        },
        uMidColor: {
          type: 'vec3',
          value: defaultConfig.midColor,
          description: 'Mid flame color',
        },
        uOuterColor: {
          type: 'vec3',
          value: defaultConfig.outerColor,
          description: 'Outer flame color',
        },
        uEmberColor: {
          type: 'vec3',
          value: defaultConfig.emberColor,
          description: 'Ember/spark color',
        },
        uFlameHeight: {
          type: 'float',
          value: defaultConfig.flameHeight,
          min: 0.5,
          max: 5,
          step: 0.1,
          description: 'Flame height',
        },
        uFlameSpread: {
          type: 'float',
          value: defaultConfig.flameSpread,
          min: 0.1,
          max: 3,
          step: 0.1,
          description: 'Flame spread',
        },
        uTurbulence: {
          type: 'float',
          value: defaultConfig.turbulence,
          min: 0,
          max: 2,
          step: 0.1,
          description: 'Turbulence amount',
        },
        uSpeed: {
          type: 'float',
          value: defaultConfig.speed,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Flame animation speed',
        },
        uEmberCount: {
          type: 'float',
          value: defaultConfig.emberCount,
          min: 0,
          max: 100,
          step: 1,
          description: 'Number of embers',
        },
        uHeatDistortion: {
          type: 'float',
          value: defaultConfig.heatDistortion,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Heat distortion intensity',
        },
        uSmokeAmount: {
          type: 'float',
          value: defaultConfig.smokeAmount,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Smoke amount',
        },
      },
    });

    this.fireConfig = defaultConfig;
  }

  protected getVertexShader(): string {
    return `
      ${GLSL_UTILS.vertexHeader}
      
      varying float vHeat;
      varying vec3 vLocalPosition;
      
      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
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
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vLocalPosition = position;
        
        // Calculate heat distortion
        float heatNoise = snoise(vec3(position.x * 2.0, position.y * 2.0 - uTime * uSpeed, uTime * 0.5));
        vHeat = heatNoise * 0.5 + 0.5;
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Apply heat distortion to vertices
        vec3 distortedPosition = position;
        distortedPosition.x += heatNoise * uHeatDistortion * uFlameSpread * 0.2;
        distortedPosition.z += heatNoise * uHeatDistortion * 0.1;
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(distortedPosition, 1.0);
      }
    `;
  }

  protected getFragmentShader(): string {
    return `
      precision highp float;
      
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uOuterColor;
      uniform vec3 uEmberColor;
      uniform float uFlameHeight;
      uniform float uFlameSpread;
      uniform float uTurbulence;
      uniform float uSpeed;
      uniform float uEmberCount;
      uniform float uHeatDistortion;
      uniform float uSmokeAmount;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vHeat;
      varying vec3 vLocalPosition;
      
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
      
      // Simplex noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
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
      
      // Fractional Brownian Motion for flame shape
      float fbm(vec3 p, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 4; i++) {
          if (i >= octaves) break;
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      // Flame shape function
      float flameShape(vec2 uv, float time) {
        // Base flame shape (teardrop)
        float x = uv.x - 0.5;
        float y = 1.0 - uv.y;
        
        // Width varies with height
        float width = uFlameSpread * (1.0 - y * 0.5) * (0.5 + 0.5 * sin(y * 3.14159));
        
        // Distance from center line
        float dist = abs(x) / width;
        
        // Height cutoff
        float height = y / uFlameHeight;
        
        // Add turbulence
        vec3 noisePos = vec3(x * 3.0, y * 2.0 - time * uSpeed, time * 0.3);
        float turb = fbm(noisePos, 3) * uTurbulence;
        
        // Combine shape with turbulence
        float shape = 1.0 - smoothstep(0.0, 1.0, dist + turb * 0.3);
        shape *= 1.0 - smoothstep(0.7, 1.0, height);
        
        return max(0.0, shape);
      }
      
      // Ember particle system
      float embers(vec2 uv, float time) {
        float result = 0.0;
        
        for (float i = 0.0; i < 100.0; i++) {
          if (i >= uEmberCount) break;
          
          // Random ember properties
          float seed = i / 100.0;
          float x = hash(vec2(seed, 0.0));
          float spawnTime = hash(vec2(seed, 1.0)) * 5.0;
          float size = 0.005 + hash(vec2(seed, 2.0)) * 0.015;
          float speed = 0.2 + hash(vec2(seed, 3.0)) * 0.5;
          float life = hash(vec2(seed, 4.0));
          
          // Calculate ember position
          float localTime = mod(time + spawnTime, 5.0);
          float emberY = localTime * speed * uFlameHeight * 0.3;
          float emberX = x + sin(localTime * 3.0 + seed * 10.0) * 0.1 * uFlameSpread;
          
          // Wither as it rises
          float age = localTime / 5.0;
          float intensity = 1.0 - smoothstep(0.0, life, age);
          
          // Distance to ember
          vec2 emberPos = vec2(emberX, emberY);
          float dist = length(uv - emberPos);
          
          // Add ember glow
          float ember = smoothstep(size * 3.0, 0.0, dist) * intensity;
          result += ember;
        }
        
        return min(1.0, result);
      }
      
      // Heat haze distortion
      float heatHaze(vec2 uv, float time) {
        float haze = 0.0;
        
        for (float i = 0.0; i < 3.0; i++) {
          float y = (i + 0.5) / 3.0;
          float wave = sin(uv.x * 20.0 + time * (2.0 + i) + i * 2.0) * 0.5 + 0.5;
          haze += wave * uHeatDistortion * (1.0 - y);
        }
        
        return haze / 3.0;
      }
      
      // Smoke effect
      float smoke(vec2 uv, float time) {
        vec3 smokePos = vec3(uv * 2.0, time * 0.2);
        float smokeNoise = fbm(smokePos, 4);
        
        // Smoke rises and disperses
        float smokeY = uv.y + time * 0.1;
        float dispersion = smoothstep(0.5, 1.0, smokeY);
        
        return smokeNoise * uSmokeAmount * dispersion * (1.0 - uv.y);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Apply heat haze to UVs
        float haze = heatHaze(uv, uTime);
        vec2 distortedUv = uv + vec2(0.0, haze * 0.02);
        
        // Calculate flame shape
        float flame = flameShape(distortedUv, uTime);
        
        // Add detail to flame
        vec3 noisePos = vec3(distortedUv * 4.0, uTime * uSpeed);
        float detailNoise = fbm(noisePos, 3);
        flame *= 0.8 + detailNoise * 0.4;
        
        // Calculate color based on flame intensity and height
        float heightFactor = 1.0 - distortedUv.y;
        
        vec3 color = uOuterColor;
        
        // Mix colors based on intensity and height
        if (flame > 0.3) {
          color = mix(uOuterColor, uMidColor, smoothstep(0.3, 0.7, flame));
        }
        if (flame > 0.6) {
          color = mix(color, uCoreColor, smoothstep(0.6, 1.0, flame));
        }
        
        // Add brightness at bottom (base of flame)
        float baseBrightness = smoothstep(0.0, 0.3, distortedUv.y);
        color = mix(uCoreColor * 1.5, color, baseBrightness);
        
        // Add embers
        float emberPattern = embers(distortedUv, uTime);
        color = mix(color, uEmberColor, emberPattern);
        
        // Add smoke at top
        float smokePattern = smoke(distortedUv, uTime);
        vec3 smokeColor = vec3(0.2, 0.2, 0.25) * smokePattern;
        color = mix(color, smokeColor, smokePattern * smoothstep(0.5, 1.0, distortedUv.y));
        
        // Calculate alpha
        float alpha = flame * 0.9;
        alpha = max(alpha, emberPattern * 0.8);
        alpha += smokePattern * 0.3;
        
        // Boost intensity
        color *= 1.0 + flame * 0.5;
        
        // Vignette effect
        vec2 centered = uv - vec2(0.5);
        float vignette = 1.0 - dot(centered, centered) * 0.5;
        color *= vignette;
        
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `;
  }

  /** Intensify the flame temporarily */
  intensify(duration: number = 1.0, multiplier: number = 1.5): void {
    const originalHeight = this.getUniform('uFlameHeight') as number || 2.0;
    const originalTurbulence = this.getUniform('uTurbulence') as number || 0.5;
    
    this.setUniform('uFlameHeight', originalHeight * multiplier);
    this.setUniform('uTurbulence', originalTurbulence * multiplier);
    
    setTimeout(() => {
      this.setUniform('uFlameHeight', originalHeight);
      this.setUniform('uTurbulence', originalTurbulence);
    }, duration * 1000);
  }

  /** Create campfire preset */
  static createCampfirePreset(): FireVFXConfig {
    return {
      coreColor: new THREE.Color(0xffffcc),
      midColor: new THREE.Color(0xff6600),
      outerColor: new THREE.Color(0xff2200),
      emberColor: new THREE.Color(0xffaa44),
      flameHeight: 1.5,
      flameSpread: 0.8,
      turbulence: 0.6,
      speed: 0.8,
      emberCount: 40,
      heatDistortion: 0.4,
      smokeAmount: 0.3,
    };
  }

  /** Create torch preset */
  static createTorchPreset(): FireVFXConfig {
    return {
      coreColor: new THREE.Color(0xffffff),
      midColor: new THREE.Color(0xffaa00),
      outerColor: new THREE.Color(0xff4400),
      emberColor: new THREE.Color(0xffdd66),
      flameHeight: 3.0,
      flameSpread: 0.5,
      turbulence: 0.4,
      speed: 2.0,
      emberCount: 20,
      heatDistortion: 0.2,
      smokeAmount: 0.1,
    };
  }

  /** Create inferno preset */
  static createInfernoPreset(): FireVFXConfig {
    return {
      coreColor: new THREE.Color(0xffffaa),
      midColor: new THREE.Color(0xff8800),
      outerColor: new THREE.Color(0xff0000),
      emberColor: new THREE.Color(0xffff00),
      flameHeight: 4.0,
      flameSpread: 2.0,
      turbulence: 1.2,
      speed: 1.5,
      emberCount: 80,
      heatDistortion: 0.6,
      smokeAmount: 0.4,
    };
  }

  /** Create magical fire preset (blue/purple) */
  static createMagicFirePreset(): FireVFXConfig {
    return {
      coreColor: new THREE.Color(0xaaddff),
      midColor: new THREE.Color(0x4488ff),
      outerColor: new THREE.Color(0x6600ff),
      emberColor: new THREE.Color(0x88ffff),
      flameHeight: 2.5,
      flameSpread: 1.2,
      turbulence: 0.8,
      speed: 1.0,
      emberCount: 50,
      heatDistortion: 0.3,
      smokeAmount: 0.15,
    };
  }
}

/** Factory function for quick shader creation */
export function createFireVFX(config?: FireVFXConfig): FireVFXShader {
  return new FireVFXShader(config);
}

/** Create fire VFX material directly */
export function createFireVFXMaterial(config?: FireVFXConfig): THREE.ShaderMaterial | undefined {
  const shader = new FireVFXShader(config);
  const result = shader.compile();
  return result.success ? result.material : undefined;
}
