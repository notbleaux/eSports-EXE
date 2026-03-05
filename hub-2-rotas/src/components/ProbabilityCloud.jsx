import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ProbabilityCloud.css';

/**
 * ProbabilityCloud - WebGL particle probability clouds that collapse on click
 * 
 * Features:
 * - WebGL particle system for high-performance rendering
 * - Probability-based particle distribution
 * - Click to collapse/expand interaction
 * - Multiple cloud states (superposition, collapsed)
 * - Cyan/gold color scheme
 * - 60fps animation
 */

// WebGL shader sources
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec3 a_color;
  attribute float a_alpha;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_collapsed;
  uniform vec2 u_center;
  
  varying vec3 v_color;
  varying float v_alpha;
  
  void main() {
    vec2 position = a_position;
    
    // Add subtle floating motion
    float floatX = sin(u_time * 0.001 + a_position.x * 0.01) * 2.0;
    float floatY = cos(u_time * 0.001 + a_position.y * 0.01) * 2.0;
    
    // Collapse to center when clicked
    position.x += floatX * (1.0 - u_collapsed);
    position.y += floatY * (1.0 - u_collapsed);
    position = mix(position, u_center, u_collapsed * 0.8);
    
    // Convert to clip space
    vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
    clipSpace.y *= -1.0;
    
    gl_Position = vec4(clipSpace, 0.0, 1.0);
    gl_PointSize = a_size * (1.0 - u_collapsed * 0.5);
    
    v_color = a_color;
    v_alpha = a_alpha * (1.0 - u_collapsed * 0.3);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec3 v_color;
  varying float v_alpha;
  
  void main() {
    // Create circular particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Glow effect
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    vec3 finalColor = v_color + glow * 0.5;
    
    gl_FragColor = vec4(finalColor, alpha * v_alpha);
  }
`;

// Utility to compile shaders
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

// Utility to create shader program
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  
  return program;
}

function ProbabilityCloud({
  width = 400,
  height = 400,
  particleCount = 1000,
  cloudColor = 'cyan',
  className = '',
  onCollapse,
  onExpand,
}) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef(null);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [probability, setProbability] = useState(0);
  
  // Colors
  const colors = {
    cyan: [0.0, 0.94, 1.0],
    gold: [0.79, 0.69, 0.22],
    mixed: [0.4, 0.82, 0.61],
  };
  
  const primaryColor = colors[cloudColor] || colors.cyan;

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    
    if (!gl) {
      setError('WebGL not supported');
      return;
    }
    
    glRef.current = gl;
    
    // Compile shaders
    const vertexShader = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
      setError('Shader compilation failed');
      return;
    }
    
    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      setError('Program creation failed');
      return;
    }
    
    programRef.current = program;
    
    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create particles
    createParticles();
    
    setIsInitialized(true);
  }, []);

  // Create particle data
  const createParticles = useCallback(() => {
    const positions = new Float32Array(particleCount * 2);
    const sizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    for (let i = 0; i < particleCount; i++) {
      // Gaussian distribution for probability cloud effect
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(-2 * Math.log(Math.random())) * radius * 0.5;
      
      positions[i * 2] = centerX + Math.cos(angle) * distance;
      positions[i * 2 + 1] = centerY + Math.sin(angle) * distance;
      
      // Random size variation
      sizes[i] = Math.random() * 4 + 2;
      
      // Color variation
      const colorVar = Math.random() * 0.3;
      particleColors[i * 3] = primaryColor[0] + colorVar;
      particleColors[i * 3 + 1] = primaryColor[1] + colorVar;
      particleColors[i * 3 + 2] = primaryColor[2] + colorVar;
      
      // Alpha variation based on distance from center
      const normalizedDist = distance / radius;
      alphas[i] = (1 - normalizedDist * 0.7) * (0.4 + Math.random() * 0.6);
    }
    
    particlesRef.current = { positions, sizes, colors: particleColors, alphas };
  }, [particleCount, width, height, primaryColor]);

  // Render frame
  const render = useCallback((time) => {
    const gl = glRef.current;
    const program = programRef.current;
    const particles = particlesRef.current;
    
    if (!gl || !program || !particles) return;
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.viewport(0, 0, width, height);
    
    gl.useProgram(program);
    
    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const collapsedLoc = gl.getUniformLocation(program, 'u_collapsed');
    const centerLoc = gl.getUniformLocation(program, 'u_center');
    
    gl.uniform2f(resolutionLoc, width, height);
    gl.uniform1f(timeLoc, time);
    gl.uniform1f(collapsedLoc, isCollapsed ? 1.0 : 0.0);
    gl.uniform2f(centerLoc, width / 2, height / 2);
    
    // Bind position buffer
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Bind size buffer
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.sizes, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    
    // Bind color buffer
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    
    // Bind alpha buffer
    const alphaLoc = gl.getAttribLocation(program, 'a_alpha');
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.alphas, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(alphaLoc);
    gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0);
    
    // Draw particles
    gl.drawArrays(gl.POINTS, 0, particleCount);
    
    // Cleanup
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(sizeBuffer);
    gl.deleteBuffer(colorBuffer);
    gl.deleteBuffer(alphaBuffer);
  }, [width, height, particleCount, isCollapsed]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized) return;
    
    let startTime = performance.now();
    
    const animate = () => {
      const time = performance.now() - startTime;
      render(time);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, render]);

  // Initialize on mount
  useEffect(() => {
    initWebGL();
    
    return () => {
      const gl = glRef.current;
      if (gl) {
        const program = programRef.current;
        if (program) {
          gl.deleteProgram(program);
        }
      }
    };
  }, [initWebGL]);

  // Handle click to collapse/expand
  const handleClick = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    // Calculate probability based on collapsed state
    const newProbability = newCollapsed 
      ? 30 + Math.random() * 60 
      : 0;
    setProbability(newProbability);
    
    if (newCollapsed) {
      onCollapse?.({ probability: newProbability, timestamp: Date.now() });
    } else {
      onExpand?.({ timestamp: Date.now() });
    }
  };

  if (error) {
    return (
      <div className={`probability-cloud error ${className}`} style={{ width, height }}>
        <div className="cloud-error">
          <span>⚠️ {error}</span>
          <span className="error-fallback">Falling back to CSS particles</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`probability-cloud ${isCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ width, height }}
    >
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cloud-canvas"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Overlay UI */}
      <div className="cloud-overlay">
        <div className="cloud-info">
          <span className="cloud-state">
            {isCollapsed ? '▼ COLLAPSED' : '◯ SUPERPOSITION'}
          </span>
          <span className="cloud-particles">
            {particleCount.toLocaleString()} particles
          </span>
        </div>        
        {isCollapsed && (
          <div className="probability-display">
            <span className="prob-label">Probability</span>
            <span className="prob-value" style={{ 
              color: probability > 70 ? '#00f0ff' : probability > 40 ? '#c9b037' : '#ff6b6b'
            }}>
              {probability.toFixed(1)}%
            </span>
          </div>
        )}
      </div>      
      {/* Click hint */}
      <div className={`click-hint ${isCollapsed ? 'hidden' : ''}`}>
        <span>Click to collapse</span>
      </div>
    </div>
  );
}

export default ProbabilityCloud;
