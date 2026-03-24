/**
 * Magic Sparkle Shader
 * 
 * [Ver001.000] - Rainbow sparkles with nebula swirl for Uni mascot
 * 
 * Features:
 * - Rainbow colored sparkles
 * - Nebula swirl effect
 * - Starburst patterns
 * - Magical shimmer and glow
 */

import * as THREE from 'three';
import { BaseShader, BaseShaderConfig, GLSL_UTILS } from './shaderLib';

export interface MagicSparkleConfig extends Omit<BaseShaderConfig, 'name'> {
  /** Primary sparkle color */
  sparkleColor?: THREE.Color;
  /** Secondary rainbow tint */
  rainbowTint?: number;
  /** Nebula base color */
  nebulaColor?: THREE.Color;
  /** Star center color */
  starColor?: THREE.Color;
  /** Number of sparkles */
  sparkleCount?: number;
  /** Sparkle size */
  sparkleSize?: number;
  /** Swirl intensity */
  swirlIntensity?: number;
  /** Nebula density */
  nebulaDensity?: number;
  /** Starburst ray count */
  starburstRays?: number;
  /** Animation speed */
  speed?: number;
  /** Magic shimmer amount */
  shimmer?: number;
}

export class MagicSparkleShader extends BaseShader {
  private magicConfig: MagicSparkleConfig;

  constructor(config: MagicSparkleConfig = {}) {
    const defaultConfig: MagicSparkleConfig = {
      sparkleColor: new THREE.Color(0xffffff),
      rainbowTint: 0.7,
      nebulaColor: new THREE.Color(0x9966ff),
      starColor: new THREE.Color(0xffffaa),
      sparkleCount: 60,
      sparkleSize: 0.03,
      swirlIntensity: 0.6,
      nebulaDensity: 0.5,
      starburstRays: 8,
      speed: 1.0,
      shimmer: 0.8,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      ...config,
    };

    super({
      name: 'magicSparkle',
      ...defaultConfig,
      uniforms: {
        uSparkleColor: {
          type: 'vec3',
          value: defaultConfig.sparkleColor,
          description: 'Primary sparkle color',
        },
        uRainbowTint: {
          type: 'float',
          value: defaultConfig.rainbowTint,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Rainbow tint amount',
        },
        uNebulaColor: {
          type: 'vec3',
          value: defaultConfig.nebulaColor,
          description: 'Nebula base color',
        },
        uStarColor: {
          type: 'vec3',
          value: defaultConfig.starColor,
          description: 'Starburst center color',
        },
        uSparkleCount: {
          type: 'float',
          value: defaultConfig.sparkleCount,
          min: 0,
          max: 150,
          step: 1,
          description: 'Number of sparkles',
        },
        uSparkleSize: {
          type: 'float',
          value: defaultConfig.sparkleSize,
          min: 0.005,
          max: 0.1,
          step: 0.001,
          description: 'Sparkle size',
        },
        uSwirlIntensity: {
          type: 'float',
          value: defaultConfig.swirlIntensity,
          min: 0,
          max: 2,
          step: 0.1,
          description: 'Nebula swirl intensity',
        },
        uNebulaDensity: {
          type: 'float',
          value: defaultConfig.nebulaDensity,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Nebula density',
        },
        uStarburstRays: {
          type: 'float',
          value: defaultConfig.starburstRays,
          min: 4,
          max: 16,
          step: 1,
          description: 'Number of starburst rays',
        },
        uSpeed: {
          type: 'float',
          value: defaultConfig.speed,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Animation speed',
        },
        uShimmer: {
          type: 'float',
          value: defaultConfig.shimmer,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Shimmer amount',
        },
      },
    });

    this.magicConfig = defaultConfig;
  }

  protected getVertexShader(): string {
    return `
      ${GLSL_UTILS.vertexHeader}
      
      varying float vMagic;
      varying vec3 vLocalPos;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vLocalPos = position;
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Magic aura calculation
        float magic = sin(length(position) * 5.0 - uTime * 2.0) * 0.5 + 0.5;
        vMagic = magic;
        
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;
  }

  protected getFragmentShader(): string {
    return `
      precision highp float;
      
      uniform float uTime;
      uniform vec3 uSparkleColor;
      uniform float uRainbowTint;
      uniform vec3 uNebulaColor;
      uniform vec3 uStarColor;
      uniform float uSparkleCount;
      uniform float uSparkleSize;
      uniform float uSwirlIntensity;
      uniform float uNebulaDensity;
      uniform float uStarburstRays;
      uniform float uSpeed;
      uniform float uShimmer;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vMagic;
      varying vec3 vLocalPos;
      
      // Hash function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      // 2D rotation
      mat2 rotate2D(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }
      
      // HSV to RGB
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      // Noise function
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
      
      // Rainbow color generation
      vec3 rainbow(float t) {
        return hsv2rgb(vec3(fract(t), 1.0, 1.0));
      }
      
      // Sparkle particle
      float sparkle(vec2 uv, vec2 pos, float size, float phase) {
        float dist = length(uv - pos);
        
        // Main sparkle dot
        float dot = smoothstep(size, 0.0, dist);
        
        // Cross sparkle arms
        vec2 toSparkle = uv - pos;
        float angle = atan(toSparkle.y, toSparkle.x);
        float crossPattern = abs(sin(angle * 4.0));
        crossPattern = pow(crossPattern, 8.0);
        
        float armLength = size * 4.0;
        float arms = smoothstep(armLength, 0.0, dist) * crossPattern;
        
        // Twinkle
        float twinkle = sin(uTime * 5.0 + phase) * 0.5 + 0.5;
        twinkle = pow(twinkle, 2.0);
        
        return (dot + arms * 0.5) * twinkle;
      }
      
      // Nebula swirl effect
      float nebula(vec2 uv, float time) {
        vec2 center = uv - vec2(0.5);
        float dist = length(center);
        float angle = atan(center.y, center.x);
        
        // Swirl coordinates
        float swirl = angle + dist * 5.0 - time * 0.5;
        vec2 swirlUv = vec2(
          cos(swirl) * dist,
          sin(swirl) * dist
        );
        
        // Layered noise for nebula
        float n = 0.0;
        float amplitude = 0.5;
        float frequency = 3.0;
        
        for (int i = 0; i < 4; i++) {
          n += amplitude * snoise(vec3(swirlUv * frequency, time * 0.2 + float(i)));
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return n * uNebulaDensity;
      }
      
      // Starburst pattern
      float starburst(vec2 uv, vec2 center, int rays, float time) {
        vec2 toCenter = uv - center;
        float dist = length(toCenter);
        float angle = atan(toCenter.y, toCenter.x);
        
        // Rotate rays
        angle += time * 0.3;
        
        // Create rays
        float rayPattern = cos(float(rays) * angle);
        rayPattern = pow(rayPattern, 4.0);
        
        // Radial falloff
        float falloff = 1.0 - smoothstep(0.0, 0.4, dist);
        
        // Center glow
        float centerGlow = 1.0 - smoothstep(0.0, 0.1, dist);
        
        return (rayPattern * falloff * 0.5 + centerGlow) * falloff;
      }
      
      // Magic dust particles
      float magicDust(vec2 uv, float time) {
        float dust = 0.0;
        
        for (float i = 0.0; i < 30.0; i++) {
          float seed = i / 30.0;
          
          // Orbit position
          float orbitRadius = 0.1 + hash(vec2(seed, 0.0)) * 0.3;
          float orbitSpeed = (hash(vec2(seed, 1.0)) - 0.5) * 2.0;
          float angle = time * orbitSpeed + seed * 6.28;
          
          vec2 pos = vec2(0.5) + vec2(cos(angle), sin(angle)) * orbitRadius;
          
          // Vertical drift
          pos.y += sin(time * 0.5 + seed * 3.14) * 0.1;
          
          // Particle
          float size = 0.003 + hash(vec2(seed, 2.0)) * 0.006;
          float brightness = hash(vec2(seed, 3.0));
          float twinkle = sin(time * 3.0 + seed * 6.28) * 0.5 + 0.5;
          
          float dist = length(uv - pos);
          dust += smoothstep(size * 2.0, 0.0, dist) * brightness * twinkle;
        }
        
        return dust;
      }
      
      // Shimmer effect
      float shimmer(vec2 uv, float time) {
        float s = 0.0;
        
        for (float i = 0.0; i < 5.0; i++) {
          vec2 offset = vec2(
            sin(time * 0.5 + i) * 0.2,
            cos(time * 0.3 + i) * 0.2
          );
          
          float n = noise(uv * 10.0 + offset);
          s += n * pow(0.5, i);
        }
        
        return s * uShimmer;
      }
      
      void main() {
        vec2 uv = vUv;
        vec2 centered = uv - vec2(0.5);
        float radialDist = length(centered);
        
        // Nebula background
        float nebulaPattern = nebula(uv, uTime * uSpeed * 0.5);
        vec3 nebulaColor = mix(uNebulaColor, rainbow(nebulaPattern + uTime * 0.1), uRainbowTint * 0.3);
        nebulaColor *= 0.5 + nebulaPattern * 0.5;
        
        // Starburst center
        float burst = starburst(uv, vec2(0.5), int(uStarburstRays), uTime * uSpeed);
        vec3 burstColor = mix(uStarColor, rainbow(uTime * 0.2), uRainbowTint * 0.5) * burst;
        
        // Generate sparkles
        float sparklePattern = 0.0;
        vec3 sparkleColor = vec3(0.0);
        
        for (float i = 0.0; i < 150.0; i++) {
          if (i >= uSparkleCount) break;
          
          float seed = i / 150.0;
          
          // Sparkle position (orbiting or floating)
          float angle = seed * 6.28318 + uTime * uSpeed * (hash(vec2(seed, 0.0)) - 0.5) * 2.0;
          float radius = 0.05 + hash(vec2(seed, 1.0)) * 0.35;
          
          vec2 pos = vec2(0.5) + vec2(cos(angle), sin(angle)) * radius;
          
          // Add vertical float
          pos.y += sin(uTime * uSpeed * 0.5 + seed * 3.14) * 0.05;
          
          // Calculate sparkle
          float phase = seed * 10.0;
          float s = sparkle(uv, pos, uSparkleSize, phase);
          
          // Rainbow color for this sparkle
          vec3 sColor = mix(uSparkleColor, rainbow(seed + uTime * 0.1), uRainbowTint);
          
          sparklePattern += s;
          sparkleColor += sColor * s;
        }
        
        // Normalize sparkle color
        if (sparklePattern > 0.0) {
          sparkleColor /= sparklePattern;
        }
        
        // Magic dust
        float dust = magicDust(uv, uTime * uSpeed);
        vec3 dustColor = rainbow(uTime * 0.15) * dust * 0.5;
        
        // Shimmer overlay
        float shimmerVal = shimmer(uv, uTime * uSpeed);
        vec3 shimmerColor = vec3(shimmerVal * 0.3);
        
        // Combine all effects
        vec3 finalColor = nebulaColor * 0.4;
        finalColor += burstColor;
        finalColor += sparkleColor * sparklePattern;
        finalColor += dustColor;
        finalColor += shimmerColor;
        
        // Rainbow swirl overlay
        float swirlAngle = atan(centered.y, centered.x) + radialDist * 3.0 - uTime * uSpeed * 0.5;
        vec3 rainbowSwirl = rainbow(swirlAngle / 6.28 + uTime * 0.1) * uRainbowTint * 0.2 * (1.0 - radialDist);
        finalColor += rainbowSwirl;
        
        // Magic aura glow
        float aura = 1.0 - smoothstep(0.2, 0.5, radialDist);
        finalColor += uNebulaColor * aura * 0.3 * vMagic;
        
        // Brightness boost for magical effect
        finalColor *= 1.2;
        
        // Alpha calculation
        float alpha = nebulaPattern * 0.3 + burst * 0.8 + sparklePattern * 0.9;
        alpha += dust * 0.5;
        alpha = clamp(alpha, 0.0, 1.0);
        
        // Edge fade
        alpha *= 1.0 - smoothstep(0.4, 0.5, radialDist);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }

  /** Cast a magical burst of sparkles */
  castBurst(duration: number = 1.0): void {
    const originalCount = this.getUniform('uSparkleCount') as number || 60;
    const originalSize = this.getUniform('uSparkleSize') as number || 0.03;
    
    this.setUniform('uSparkleCount', originalCount * 2);
    this.setUniform('uSparkleSize', originalSize * 1.5);
    
    setTimeout(() => {
      this.setUniform('uSparkleCount', originalCount);
      this.setUniform('uSparkleSize', originalSize);
    }, duration * 1000);
  }

  /** Set the mood with color preset */
  setMood(mood: 'rainbow' | 'mystic' | 'golden' | 'frost'): void {
    switch (mood) {
      case 'rainbow':
        this.setUniform('uRainbowTint', 1.0);
        this.setUniform('uNebulaColor', new THREE.Color(0x9966ff));
        break;
      case 'mystic':
        this.setUniform('uRainbowTint', 0.3);
        this.setUniform('uNebulaColor', new THREE.Color(0x660099));
        this.setUniform('uSparkleColor', new THREE.Color(0xaa88ff));
        break;
      case 'golden':
        this.setUniform('uRainbowTint', 0.2);
        this.setUniform('uNebulaColor', new THREE.Color(0xffaa00));
        this.setUniform('uSparkleColor', new THREE.Color(0xffffaa));
        this.setUniform('uStarColor', new THREE.Color(0xffdd88));
        break;
      case 'frost':
        this.setUniform('uRainbowTint', 0.4);
        this.setUniform('uNebulaColor', new THREE.Color(0x88ccff));
        this.setUniform('uSparkleColor', new THREE.Color(0xe0f7ff));
        this.setUniform('uStarColor', new THREE.Color(0xffffff));
        break;
    }
  }

  /** Create rainbow unicorn preset */
  static createRainbowPreset(): MagicSparkleConfig {
    return {
      sparkleColor: new THREE.Color(0xffffff),
      rainbowTint: 1.0,
      nebulaColor: new THREE.Color(0xcc88ff),
      starColor: new THREE.Color(0xffffaa),
      sparkleCount: 80,
      sparkleSize: 0.025,
      swirlIntensity: 0.8,
      nebulaDensity: 0.6,
      starburstRays: 12,
      speed: 1.2,
      shimmer: 0.9,
    };
  }

  /** Create starlight preset */
  static createStarlightPreset(): MagicSparkleConfig {
    return {
      sparkleColor: new THREE.Color(0xffffff),
      rainbowTint: 0.2,
      nebulaColor: new THREE.Color(0x2244aa),
      starColor: new THREE.Color(0xffffff),
      sparkleCount: 100,
      sparkleSize: 0.02,
      swirlIntensity: 0.4,
      nebulaDensity: 0.4,
      starburstRays: 16,
      speed: 0.6,
      shimmer: 0.5,
    };
  }

  /** Create fairy dust preset */
  static createFairyDustPreset(): MagicSparkleConfig {
    return {
      sparkleColor: new THREE.Color(0xaaffaa),
      rainbowTint: 0.5,
      nebulaColor: new THREE.Color(0x88ffaa),
      starColor: new THREE.Color(0xeeffee),
      sparkleCount: 120,
      sparkleSize: 0.015,
      swirlIntensity: 1.0,
      nebulaDensity: 0.3,
      starburstRays: 8,
      speed: 1.5,
      shimmer: 1.0,
    };
  }

  /** Create cosmic preset */
  static createCosmicPreset(): MagicSparkleConfig {
    return {
      sparkleColor: new THREE.Color(0x88ddff),
      rainbowTint: 0.6,
      nebulaColor: new THREE.Color(0x330066),
      starColor: new THREE.Color(0xffddff),
      sparkleCount: 60,
      sparkleSize: 0.03,
      swirlIntensity: 0.7,
      nebulaDensity: 0.7,
      starburstRays: 10,
      speed: 0.8,
      shimmer: 0.7,
    };
  }
}

/** Factory function for quick shader creation */
export function createMagicSparkle(config?: MagicSparkleConfig): MagicSparkleShader {
  return new MagicSparkleShader(config);
}

/** Create magic sparkle material directly */
export function createMagicSparkleMaterial(config?: MagicSparkleConfig): THREE.ShaderMaterial | undefined {
  const shader = new MagicSparkleShader(config);
  const result = shader.compile();
  return result.success ? result.material : undefined;
}
