[Ver001.000]

# WAVE 1.2 — AGENT 2-A TASK: WebGL Shader Library
**Priority:** P1  
**Estimated:** 10 hours  
**Due:** +48 hours from Wave 1.1 completion  
**Stream:** Advanced Lens System  
**Dependencies:** Agent 1-A Lens Framework (plugin interface, compositor)

---

## ASSIGNMENT

Build a comprehensive WebGL shader library for the lens system, including fragment shaders, vertex shaders, and uniform management for 20+ lens effects.

---

## DELIVERABLES

### 1. Shader Library Architecture (webgl/shaders/index.ts)

```typescript
export interface ShaderProgram {
  program: WebGLProgram;
  attribs: {
    position: number;
    texCoord: number;
  };
  uniforms: {
    uMatrix: WebGLUniformLocation;
    uTexture: WebGLUniformLocation;
    uTime: WebGLUniformLocation;
    uResolution: WebGLUniformLocation;
    [key: string]: WebGLUniformLocation;
  };
}

export class ShaderLibrary {
  private gl: WebGL2RenderingContext;
  private cache: Map<string, ShaderProgram> = new Map();
  
  // Core shaders
  readonly SHADERS = {
    // Pass-through
    'passthrough': this.createPassthroughShader(),
    
    // Heatmap variants
    'heatmap-density': this.createHeatmapShader('density'),
    'heatmap-viridis': this.createHeatmapShader('viridis'),
    'heatmap-magma': this.createHeatmapShader('magma'),
    
    // Particle systems
    'particle-point': this.createParticleShader('point'),
    'particle-trail': this.createParticleShader('trail'),
    'particle-glow': this.createParticleShader('glow'),
    
    // Effects
    'blur-gaussian': this.createBlurShader('gaussian'),
    'blur-kawase': this.createBlurShader('kawase'),
    'noise-fractal': this.createNoiseShader('fractal'),
    'noise-simplex': this.createNoiseShader('simplex'),
    
    // Lens-specific
    'tension-field': this.createTensionShader(),
    'ripple-distortion': this.createRippleShader(),
    'vignette-focus': this.createVignetteShader(),
    'chromatic-aberration': this.createChromaticShader(),
    
    // Compositing
    'blend-normal': this.createBlendShader('normal'),
    'blend-add': this.createBlendShader('add'),
    'blend-multiply': this.createBlendShader('multiply'),
    'blend-screen': this.createBlendShader('screen'),
    'blend-overlay': this.createBlendShader('overlay'),
  } as const;
  
  get(name: keyof typeof this.SHADERS): ShaderProgram {
    if (!this.cache.has(name)) {
      this.cache.set(name, this.SHADERS[name]);
    }
    return this.cache.get(name)!;
  }
}
```

### 2. Fragment Shader Collection

Create 20+ fragment shaders:

```glsl
// heatmap.frag
#version 300 es
precision highp float;

in vec2 vTexCoord;
uniform sampler2D uDataTexture;
uniform float uMaxValue;
uniform int uColorScheme; // 0=viridis, 1=magma, 2=red-blue

out vec4 fragColor;

vec3 viridis(float t) {
  // Viridis colormap implementation
  const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.334099805335306);
  const vec3 c1 = vec3(0.1050930431085774, 1.404513529450633, 1.384590162594685);
  // ... full viridis implementation
  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

void main() {
  float value = texture(uDataTexture, vTexCoord).r / uMaxValue;
  vec3 color = viridis(clamp(value, 0.0, 1.0));
  float alpha = smoothstep(0.0, 0.1, value); // Fade low values
  fragColor = vec4(color, alpha);
}
```

Additional shaders needed:
- `particle.frag/vert` — Point sprite particles
- `trail.frag` — Motion trails with fade
- `blur.frag` — Gaussian and Kawase blur
- `noise.frag` — Fractal and simplex noise
- `tension.frag` — Tension field visualization
- `ripple.frag` — Water ripple distortion
- `vignette.frag` — Focus vignette
- `chromatic.frag` — Chromatic aberration
- `blend_*.frag` — Blend mode shaders

### 3. Uniform Management System

```typescript
export class UniformManager {
  private gl: WebGL2RenderingContext;
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  
  setMatrix4(name: string, matrix: Float32Array): void {
    const loc = this.uniforms.get(name);
    if (loc) this.gl.uniformMatrix4fv(loc, false, matrix);
  }
  
  setFloat(name: string, value: number): void {
    const loc = this.uniforms.get(name);
    if (loc) this.gl.uniform1f(loc, value);
  }
  
  setVec2(name: string, x: number, y: number): void {
    const loc = this.uniforms.get(name);
    if (loc) this.gl.uniform2f(loc, x, y);
  }
  
  setTexture(name: string, unit: number, texture: WebGLTexture): void {
    const loc = this.uniforms.get(name);
    if (loc) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.uniform1i(loc, unit);
    }
  }
}
```

### 4. Shader Compilation Pipeline

```typescript
export class ShaderCompiler {
  compile(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;
    
    const vs = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Shader link failed: ${info}`);
    }
    
    return program;
  }
  
  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${info}`);
    }
    
    return shader;
  }
}
```

### 5. Performance Optimizations

```typescript
export class ShaderOptimizer {
  // Precompile all shaders at init
  precompileAll(library: ShaderLibrary): void {
    Object.keys(library.SHADERS).forEach(name => {
      library.get(name as any);
    });
  }
  
  // Use shader variants for quality levels
  getQualityVariant(baseShader: string, quality: 'low' | 'medium' | 'high'): string {
    const defines = {
      low: '#define QUALITY 0\n#define SAMPLES 4\n',
      medium: '#define QUALITY 1\n#define SAMPLES 8\n',
      high: '#define QUALITY 2\n#define SAMPLES 16\n'
    };
    return defines[quality] + baseShader;
  }
}
```

---

## ACCEPTANCE CRITERIA

- [ ] 20+ shaders implemented
- [ ] All shaders compile without errors
- [ ] Uniform management works correctly
- [ ] Shader switching <1ms
- [ ] Quality variants for performance scaling

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
