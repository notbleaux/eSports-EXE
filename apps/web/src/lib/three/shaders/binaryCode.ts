// @ts-nocheck
/**
 * Binary Code Shader
 * 
 * [Ver001.000] - Matrix-style falling binary code with glitch effects for Bin mascot
 * 
 * Features:
 * - Falling matrix-style binary code
 * - Glitch and digital distortion effects
 * - Scan lines and data stream visualization
 * - Cyberpunk aesthetic
 */

import * as THREE from 'three';
import { BaseShader, BaseShaderConfig, GLSL_UTILS } from './shaderLib';

export interface BinaryCodeConfig extends Omit<BaseShaderConfig, 'name'> {
  /** Primary code color - matrix green */
  codeColor?: THREE.Color;
  /** Secondary color - bright green */
  accentColor?: THREE.Color;
  /** Background color - dark */
  backgroundColor?: THREE.Color;
  /** Glitch color - cyan/magenta */
  glitchColor?: THREE.Color;
  /** Code density (0-1) */
  density?: number;
  /** Fall speed */
  fallSpeed?: number;
  /** Glitch frequency */
  glitchFrequency?: number;
  /** Glitch intensity */
  glitchIntensity?: number;
  /** Scan line visibility */
  scanLines?: number;
  /** Code trail length */
  trailLength?: number;
  /** Binary or hex mode */
  mode?: 'binary' | 'hex' | 'matrix';
}

export class BinaryCodeShader extends BaseShader {
  private binaryConfig: BinaryCodeConfig;

  constructor(config: BinaryCodeConfig = {}) {
    const defaultConfig: BinaryCodeConfig = {
      codeColor: new THREE.Color(0x00ff41),
      accentColor: new THREE.Color(0x88ff88),
      backgroundColor: new THREE.Color(0x001100),
      glitchColor: new THREE.Color(0x00ffff),
      density: 0.7,
      fallSpeed: 1.0,
      glitchFrequency: 0.1,
      glitchIntensity: 0.5,
      scanLines: 0.3,
      trailLength: 0.8,
      mode: 'matrix',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      ...config,
    };

    super({
      name: 'binaryCode',
      ...defaultConfig,
      uniforms: {
        uCodeColor: {
          type: 'vec3',
          value: defaultConfig.codeColor,
          description: 'Primary code color',
        },
        uAccentColor: {
          type: 'vec3',
          value: defaultConfig.accentColor,
          description: 'Accent/highlight color',
        },
        uBackgroundColor: {
          type: 'vec3',
          value: defaultConfig.backgroundColor,
          description: 'Background color',
        },
        uGlitchColor: {
          type: 'vec3',
          value: defaultConfig.glitchColor,
          description: 'Glitch effect color',
        },
        uDensity: {
          type: 'float',
          value: defaultConfig.density,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Code density',
        },
        uFallSpeed: {
          type: 'float',
          value: defaultConfig.fallSpeed,
          min: 0.1,
          max: 5,
          step: 0.1,
          description: 'Code fall speed',
        },
        uGlitchFrequency: {
          type: 'float',
          value: defaultConfig.glitchFrequency,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Glitch frequency',
        },
        uGlitchIntensity: {
          type: 'float',
          value: defaultConfig.glitchIntensity,
          min: 0,
          max: 2,
          step: 0.1,
          description: 'Glitch intensity',
        },
        uScanLines: {
          type: 'float',
          value: defaultConfig.scanLines,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Scan line intensity',
        },
        uTrailLength: {
          type: 'float',
          value: defaultConfig.trailLength,
          min: 0,
          max: 1,
          step: 0.05,
          description: 'Code trail length',
        },
        uMode: {
          type: 'float',
          value: defaultConfig.mode === 'binary' ? 0.0 : defaultConfig.mode === 'hex' ? 1.0 : 2.0,
          min: 0,
          max: 2,
          step: 1,
          description: 'Display mode (0=binary, 1=hex, 2=matrix)',
        },
      },
    });

    this.binaryConfig = defaultConfig;
  }

  protected getVertexShader(): string {
    return `
      ${GLSL_UTILS.vertexHeader}
      
      varying float vDistortion;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        // Add slight vertex distortion for digital effect
        float distortion = sin(position.y * 10.0 + uTime * 2.0) * 0.02;
        vDistortion = distortion;
        
        vec3 distortedPosition = position + normal * distortion;
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(distortedPosition, 1.0);
      }
    `;
  }

  protected getFragmentShader(): string {
    return `
      precision highp float;
      
      uniform float uTime;
      uniform vec3 uCodeColor;
      uniform vec3 uAccentColor;
      uniform vec3 uBackgroundColor;
      uniform vec3 uGlitchColor;
      uniform float uDensity;
      uniform float uFallSpeed;
      uniform float uGlitchFrequency;
      uniform float uGlitchIntensity;
      uniform float uScanLines;
      uniform float uTrailLength;
      uniform float uMode;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vDistortion;
      
      // Hash function for random numbers
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      }
      
      // Noise function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
      
      // Random function with seed
      float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Binary digit generation
      float binaryDigit(vec2 uv, float time) {
        float col = floor(uv.x * 20.0);
        float row = floor(uv.y * 30.0);
        vec2 cellUv = fract(vec2(uv.x * 20.0, uv.y * 30.0));
        
        // Random seed for this cell
        float seed = hash(vec2(col, row));
        
        // Falling animation
        float fallOffset = mod(row * 0.1 + time * uFallSpeed, 1.0);
        
        // Only show some cells based on density
        if (seed > uDensity) return 0.0;
        
        // Create binary digit (0 or 1)
        float digit = floor(seed * 2.0);
        
        // Fade out at bottom of trail
        float trail = pow(fallOffset, 1.0 + uTrailLength * 3.0);
        
        // Character shape (simple block for 0 or 1)
        float charMask = 0.0;
        if (digit < 0.5) {
          // Zero - hollow rectangle
          float border = 0.15;
          charMask = step(border, cellUv.x) * step(cellUv.x, 1.0 - border) *
                     step(border, cellUv.y) * step(cellUv.y, 1.0 - border);
          charMask = 1.0 - charMask * step(border * 1.5, cellUv.x) * step(cellUv.x, 1.0 - border * 1.5) *
                           step(border * 1.5, cellUv.y) * step(cellUv.y, 1.0 - border * 1.5);
        } else {
          // One - vertical line
          charMask = step(0.4, cellUv.x) * step(cellUv.x, 0.6) *
                     step(0.1, cellUv.y) * step(cellUv.y, 0.9);
        }
        
        return charMask * trail * (0.5 + 0.5 * sin(time * 5.0 + seed * 10.0));
      }
      
      // Hex digit generation
      float hexDigit(vec2 uv, float time) {
        float col = floor(uv.x * 15.0);
        float row = floor(uv.y * 20.0);
        vec2 cellUv = fract(vec2(uv.x * 15.0, uv.y * 20.0));
        
        float seed = hash(vec2(col, row));
        if (seed > uDensity * 0.8) return 0.0;
        
        float fallOffset = mod(row * 0.08 + time * uFallSpeed, 1.0);
        float trail = pow(fallOffset, 1.0 + uTrailLength * 2.0);
        
        // Hex character grid pattern
        float hexChar = step(0.2, cellUv.x) * step(cellUv.x, 0.8) *
                        step(0.2, cellUv.y) * step(cellUv.y, 0.8);
        
        return hexChar * trail * (0.7 + 0.3 * sin(time * 3.0 + seed * 6.28));
      }
      
      // Matrix symbols (Katakana-like)
      float matrixSymbol(vec2 uv, float time) {
        float col = floor(uv.x * 25.0);
        float row = floor(uv.y * 40.0);
        vec2 cellUv = fract(vec2(uv.x * 25.0, uv.y * 40.0));
        
        float seed = hash(vec2(col, row));
        if (seed > uDensity) return 0.0;
        
        float fallOffset = mod(row * 0.05 + time * uFallSpeed * 1.5, 1.0);
        float trail = pow(fallOffset, 1.0 + uTrailLength * 2.5);
        
        // Symbol composed of lines
        float symbol = 0.0;
        float lineWidth = 0.08;
        
        // Vertical segments
        if (mod(seed * 7.0, 2.0) > 1.0) {
          symbol += step(0.2, cellUv.x) * step(cellUv.x, 0.3) * step(0.1, cellUv.y) * step(cellUv.y, 0.9);
        }
        if (mod(seed * 11.0, 2.0) > 1.0) {
          symbol += step(0.7, cellUv.x) * step(cellUv.x, 0.8) * step(0.1, cellUv.y) * step(cellUv.y, 0.9);
        }
        
        // Horizontal segments
        if (mod(seed * 13.0, 2.0) > 1.0) {
          symbol += step(0.2, cellUv.x) * step(cellUv.x, 0.8) * step(0.15, cellUv.y) * step(cellUv.y, 0.25);
        }
        if (mod(seed * 17.0, 2.0) > 1.0) {
          symbol += step(0.2, cellUv.x) * step(cellUv.x, 0.8) * step(0.45, cellUv.y) * step(cellUv.y, 0.55);
        }
        if (mod(seed * 19.0, 2.0) > 1.0) {
          symbol += step(0.2, cellUv.x) * step(cellUv.x, 0.8) * step(0.75, cellUv.y) * step(cellUv.y, 0.85);
        }
        
        float brightness = 0.5 + 0.5 * sin(time * 8.0 + seed * 10.0);
        return clamp(symbol, 0.0, 1.0) * trail * brightness;
      }
      
      // Glitch effect
      vec2 glitchOffset(vec2 uv, float time, float intensity) {
        float glitchTime = floor(time * 20.0) / 20.0;
        float seed = hash(vec2(glitchTime, 0.0));
        
        if (seed > uGlitchFrequency) return vec2(0.0);
        
        float xOffset = (hash(vec2(uv.y * 10.0, glitchTime)) - 0.5) * intensity;
        float yOffset = (hash(vec2(uv.x * 10.0, glitchTime + 1.0)) - 0.5) * intensity * 0.3;
        
        return vec2(xOffset, yOffset);
      }
      
      // Digital noise
      float digitalNoise(vec2 uv, float time) {
        return hash(uv + time) * 0.1;
      }
      
      // Scan lines
      float scanLines(vec2 uv, float intensity) {
        float lines = sin(uv.y * 200.0 + time * 2.0) * 0.5 + 0.5;
        return lines * intensity;
      }
      
      // RGB shift glitch
      vec3 rgbShift(vec2 uv, float time, float intensity) {
        float shift = hash(vec2(time, 0.0)) * intensity * 0.02;
        
        float r = 0.0;
        float g = 0.0;
        float b = 0.0;
        
        if (uMode < 0.5) {
          r = binaryDigit(uv + vec2(shift, 0.0), time);
          g = binaryDigit(uv, time);
          b = binaryDigit(uv - vec2(shift, 0.0), time);
        } else if (uMode < 1.5) {
          r = hexDigit(uv + vec2(shift, 0.0), time);
          g = hexDigit(uv, time);
          b = hexDigit(uv - vec2(shift, 0.0), time);
        } else {
          r = matrixSymbol(uv + vec2(shift, 0.0), time);
          g = matrixSymbol(uv, time);
          b = matrixSymbol(uv - vec2(shift, 0.0), time);
        }
        
        return vec3(r, g, b);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Apply glitch offset
        vec2 glitchUv = uv + glitchOffset(uv, uTime, uGlitchIntensity);
        
        // Get code pattern based on mode
        float codePattern = 0.0;
        vec3 rgbCode = vec3(0.0);
        
        if (uGlitchIntensity > 0.5 && hash(vec2(floor(uTime * 10.0), 0.0)) < 0.3) {
          // RGB shift during heavy glitch
          rgbCode = rgbShift(glitchUv, uTime, uGlitchIntensity);
          codePattern = max(rgbCode.r, max(rgbCode.g, rgbCode.b));
        } else {
          if (uMode < 0.5) {
            codePattern = binaryDigit(glitchUv, uTime);
          } else if (uMode < 1.5) {
            codePattern = hexDigit(glitchUv, uTime);
          } else {
            codePattern = matrixSymbol(glitchUv, uTime);
          }
        }
        
        // Color based on pattern
        vec3 codeColor = uCodeColor;
        if (uGlitchIntensity > 0.5) {
          codeColor = mix(uCodeColor, uGlitchColor, hash(vec2(uTime * 5.0, 0.0)));
        }
        
        vec3 accentColor = uAccentColor;
        
        // Highlight leading edges
        float highlight = 0.0;
        if (uMode < 0.5) {
          highlight = binaryDigit(glitchUv + vec2(0.0, 0.02), uTime);
        } else if (uMode < 1.5) {
          highlight = hexDigit(glitchUv + vec2(0.0, 0.02), uTime);
        } else {
          highlight = matrixSymbol(glitchUv + vec2(0.0, 0.02), uTime);
        }
        
        vec3 finalColor = mix(uBackgroundColor, codeColor, codePattern);
        finalColor = mix(finalColor, accentColor, (1.0 - highlight) * codePattern * 0.5);
        
        // Add digital noise
        finalColor += digitalNoise(uv, uTime) * uGlitchIntensity;
        
        // Add scan lines
        float scanLinePattern = scanLines(uv, uScanLines);
        finalColor *= (0.9 + scanLinePattern * 0.2);
        
        // Add glitch color flashes
        if (hash(vec2(uTime * 30.0, uv.y)) < uGlitchFrequency * 0.5) {
          finalColor = mix(finalColor, uGlitchColor, uGlitchIntensity * 0.3);
        }
        
        // Vignette effect
        vec2 centered = uv - vec2(0.5);
        float vignette = 1.0 - dot(centered, centered) * 0.8;
        finalColor *= vignette;
        
        // Alpha based on code presence
        float alpha = codePattern * 0.9 + 0.1 * vignette;
        alpha = clamp(alpha, 0.0, 1.0);
        
        // Boost alpha during glitch
        if (uGlitchIntensity > 0.3) {
          alpha = min(1.0, alpha * 1.2);
        }
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
  }

  /** Trigger a glitch effect */
  triggerGlitch(duration: number = 0.5): void {
    const originalIntensity = this.getUniform('uGlitchIntensity') as number || 0.5;
    this.setUniform('uGlitchIntensity', 2.0);
    
    setTimeout(() => {
      this.setUniform('uGlitchIntensity', originalIntensity);
    }, duration * 1000);
  }

  /** Set display mode */
  setMode(mode: 'binary' | 'hex' | 'matrix'): void {
    const modeValue = mode === 'binary' ? 0.0 : mode === 'hex' ? 1.0 : 2.0;
    this.setUniform('uMode', modeValue);
  }

  /** Create classic matrix preset */
  static createMatrixPreset(): BinaryCodeConfig {
    return {
      codeColor: new THREE.Color(0x00ff41),
      accentColor: new THREE.Color(0xccffcc),
      backgroundColor: new THREE.Color(0x001100),
      glitchColor: new THREE.Color(0x00ffff),
      density: 0.75,
      fallSpeed: 1.2,
      glitchFrequency: 0.08,
      glitchIntensity: 0.3,
      scanLines: 0.4,
      trailLength: 0.85,
      mode: 'matrix',
    };
  }

  /** Create cyberpunk preset */
  static createCyberpunkPreset(): BinaryCodeConfig {
    return {
      codeColor: new THREE.Color(0xff00ff),
      accentColor: new THREE.Color(0xffff00),
      backgroundColor: new THREE.Color(0x1a0033),
      glitchColor: new THREE.Color(0x00ffff),
      density: 0.6,
      fallSpeed: 2.0,
      glitchFrequency: 0.2,
      glitchIntensity: 0.8,
      scanLines: 0.5,
      trailLength: 0.6,
      mode: 'hex',
    };
  }

  /** Create data stream preset */
  static createDataStreamPreset(): BinaryCodeConfig {
    return {
      codeColor: new THREE.Color(0x00aaff),
      accentColor: new THREE.Color(0xffffff),
      backgroundColor: new THREE.Color(0x000a1a),
      glitchColor: new THREE.Color(0xff0066),
      density: 0.5,
      fallSpeed: 3.0,
      glitchFrequency: 0.05,
      glitchIntensity: 0.2,
      scanLines: 0.2,
      trailLength: 0.4,
      mode: 'binary',
    };
  }
}

/** Factory function for quick shader creation */
export function createBinaryCode(config?: BinaryCodeConfig): BinaryCodeShader {
  return new BinaryCodeShader(config);
}

/** Create binary code material directly */
export function createBinaryCodeMaterial(config?: BinaryCodeConfig): THREE.ShaderMaterial | undefined {
  const shader = new BinaryCodeShader(config);
  const result = shader.compile();
  return result.success ? result.material : undefined;
}
