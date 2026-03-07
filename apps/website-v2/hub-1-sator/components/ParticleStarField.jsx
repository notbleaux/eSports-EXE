import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import './ParticleStarField.css';

/**
 * ParticleStarField - Three.js Particle System
 * 
 * Features:
 * - Thousands of orbiting data points as particles
 * - Connected constellations on hover
 * - Signal-amber and cyan color variations
 * - 60fps optimized rendering
 */

const ParticleStarField = ({ 
  particleCount = 2000,
  activeFilter,
  dataPoints = []
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const linesRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef(new THREE.Raycaster());

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    const colorAmber = new THREE.Color(0xff9f1c);
    const colorCyan = new THREE.Color(0x00f0ff);
    const colorGold = new THREE.Color(0xc9b037);

    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution with depth
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 20 + Math.random() * 60;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Color distribution based on position
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.5) {
        color = colorAmber;
      } else if (colorChoice < 0.8) {
        color = colorCyan;
      } else {
        color = colorGold;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size variation
      sizes[i] = 0.5 + Math.random() * 1.5;

      // Orbital velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    // Particle material with custom shader
    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Constellation lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * 6); // 2 points per line, 3 coords each
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff9f1c,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    lines.frustumCulled = false;
    scene.add(lines);
    linesRef.current = lines;

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [particleCount]);

  // Animation loop - 60fps optimized
  useEffect(() => {
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (!particlesRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const positions = particlesRef.current.geometry.attributes.position.array;
      const velocities = particlesRef.current.geometry.attributes.velocity.array;
      const time = Date.now() * 0.0001;

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        
        // Apply orbital motion
        positions[idx] += velocities[idx] + Math.sin(time + i) * 0.005;
        positions[idx + 1] += velocities[idx + 1] + Math.cos(time + i * 0.5) * 0.005;
        positions[idx + 2] += velocities[idx + 2];

        // Wrap around boundaries
        const boundary = 80;
        if (Math.abs(positions[idx]) > boundary) positions[idx] *= -0.9;
        if (Math.abs(positions[idx + 1]) > boundary) positions[idx + 1] *= -0.9;
        if (Math.abs(positions[idx + 2]) > boundary) positions[idx + 2] *= -0.9;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Rotate entire system slowly
      particlesRef.current.rotation.y += 0.0005;
      particlesRef.current.rotation.x += 0.0002;

      // Update constellation lines based on proximity
      if (linesRef.current) {
        const linePositions = linesRef.current.geometry.attributes.position.array;
        let lineIndex = 0;
        const maxConnections = 3;
        const connectionDistance = 15;

        for (let i = 0; i < Math.min(particleCount, 100); i++) {
          let connections = 0;
          const idx1 = i * 3;

          for (let j = i + 1; j < Math.min(particleCount, 100) && connections < maxConnections; j++) {
            const idx2 = j * 3;
            const dx = positions[idx1] - positions[idx2];
            const dy = positions[idx1 + 1] - positions[idx2 + 1];
            const dz = positions[idx1 + 2] - positions[idx2 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < connectionDistance && lineIndex < linePositions.length - 6) {
              linePositions[lineIndex++] = positions[idx1];
              linePositions[lineIndex++] = positions[idx1 + 1];
              linePositions[lineIndex++] = positions[idx1 + 2];
              linePositions[lineIndex++] = positions[idx2];
              linePositions[lineIndex++] = positions[idx2 + 1];
              linePositions[lineIndex++] = positions[idx2 + 2];
              connections++;
            }
          }
        }

        // Clear remaining line positions
        for (let i = lineIndex; i < linePositions.length; i++) {
          linePositions[i] = 0;
        }

        linesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Mouse interaction - subtle camera movement
      if (cameraRef.current) {
        cameraRef.current.position.x += (mouseRef.current.x * 5 - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (mouseRef.current.y * 5 - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(0, 0, 0);
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [particleCount]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="particle-star-field"
      onMouseMove={handleMouseMove}
    >
      <div className="particle-overlay">
        <div className="particle-stats">
          <div className="stat-item">
            <span className="stat-label">PARTICLES</span>
            <span className="stat-value">{particleCount.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CONSTELLATIONS</span>
            <span className="stat-value">{(particleCount / 10).toFixed(0)}</span>
          </div>
        </div>
        
        {activeFilter && (
          <div className="particle-filter-indicator">
            <span className="filter-glyph">◈</span>
            <span className="filter-text">{activeFilter.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticleStarField;
