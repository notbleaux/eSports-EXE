import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import '../styles/torus-flow.css';

/**
 * TorusFlow - Three.js Hourglass Flow Visualization
 * Shows Terrestrial → Harmonic → Celestial states
 * 
 * Visual Design:
 * - Deep cobalt torus structure for offline state
 * - Neon cyan glow for live/active states
 * - Hourglass flow animation between states
 * - Toroidal vortex transitions
 */

const STATE_CONFIG = {
  terrestrial: {
    color: 0x003399,
    emissive: 0x001133,
    intensity: 0.3,
    label: 'TERRESTRIAL',
    description: 'Physical Realm'
  },
  harmonic: {
    color: 0x0055ff,
    emissive: 0x002266,
    intensity: 0.6,
    label: 'HARMONIC',
    description: 'Resonance Layer'
  },
  celestial: {
    color: 0x00f0ff,
    emissive: 0x00444d,
    intensity: 1.0,
    label: 'CELESTIAL',
    description: 'Ethereal Plane'
  }
};

const TorusFlow = ({ 
  currentState = 'harmonic',
  onStateChange,
  isLive = false,
  className = ''
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const torusRef = useRef(null);
  const particlesRef = useRef(null);
  const hourglassRef = useRef(null);
  const frameIdRef = useRef(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c14, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0c14, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 1, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0055ff, 0.8, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Create Torus Knot (Hourglass shape)
    createTorus(scene);
    
    // Create Particle System
    createParticles(scene);
    
    // Create Hourglass Flow
    createHourglassFlow(scene);

    setIsInitialized(true);
  }, []);

  // Create main torus structure
  const createTorus = (scene) => {
    // Main torus knot geometry
    const geometry = new THREE.TorusKnotGeometry(2, 0.6, 150, 20, 2, 3);
    
    // Custom shader material for iridescent effect
    const material = new THREE.MeshPhysicalMaterial({
      color: STATE_CONFIG[currentState].color,
      emissive: STATE_CONFIG[currentState].emissive,
      emissiveIntensity: STATE_CONFIG[currentState].intensity * 0.5,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });

    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = Math.PI / 4;
    scene.add(torus);
    torusRef.current = torus;

    // Wireframe overlay for tech effect
    const wireframeGeometry = new THREE.TorusKnotGeometry(2.1, 0.65, 100, 16, 2, 3);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.rotation.x = Math.PI / 4;
    torus.add(wireframe);
  };

  // Create particle system
  const createParticles = (scene) => {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Position particles in toroidal pattern
      const t = (i / particleCount) * Math.PI * 2;
      const u = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      
      positions[i * 3] = Math.cos(t) * (3 + Math.cos(u)) * 0.8;
      positions[i * 3 + 1] = Math.sin(t) * (3 + Math.cos(u)) * 0.8;
      positions[i * 3 + 2] = Math.sin(u) * 0.8;

      // Colors: cyan to blue gradient
      const colorChoice = Math.random();
      if (colorChoice > 0.6) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.94;
        colors[i * 3 + 2] = 1;
      } else if (colorChoice > 0.3) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.33;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.6;
      }

      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
  };

  // Create hourglass flow visualization
  const createHourglassFlow = (scene) => {
    const flowGroup = new THREE.Group();
    
    // Create flow particles
    const flowCount = 50;
    const flowGeometry = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowCount * 3);

    for (let i = 0; i < flowCount; i++) {
      const t = i / flowCount;
      const angle = t * Math.PI * 4;
      const radius = 0.5 + Math.sin(t * Math.PI) * 1.5;
      
      flowPositions[i * 3] = Math.cos(angle) * radius;
      flowPositions[i * 3 + 1] = (t - 0.5) * 6;
      flowPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));

    const flowMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 4,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const flowParticles = new THREE.Points(flowGeometry, flowMaterial);
    flowGroup.add(flowParticles);

    // Add connecting lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    for (let i = 0; i < flowCount - 1; i++) {
      const t1 = i / flowCount;
      const t2 = (i + 1) / flowCount;
      const angle1 = t1 * Math.PI * 4;
      const angle2 = t2 * Math.PI * 4;
      const radius1 = 0.5 + Math.sin(t1 * Math.PI) * 1.5;
      const radius2 = 0.5 + Math.sin(t2 * Math.PI) * 1.5;
      
      linePositions.push(
        Math.cos(angle1) * radius1, (t1 - 0.5) * 6, Math.sin(angle1) * radius1,
        Math.cos(angle2) * radius2, (t2 - 0.5) * 6, Math.sin(angle2) * radius2
      );
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    flowGroup.add(lines);

    scene.add(flowGroup);
    hourglassRef.current = flowGroup;
  };

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const time = Date.now() * 0.001;

    // Rotate torus
    if (torusRef.current) {
      torusRef.current.rotation.z += 0.003;
      torusRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
      
      // Pulse effect based on state
      const config = STATE_CONFIG[currentState];
      const pulse = 1 + Math.sin(time * 2) * 0.05;
      torusRef.current.scale.setScalar(pulse);
      
      // Update material intensity
      torusRef.current.material.emissiveIntensity = 
        config.intensity * 0.5 + Math.sin(time * 3) * 0.1;
    }

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002;
      particlesRef.current.rotation.z += 0.001;
    }

    // Animate hourglass flow
    if (hourglassRef.current) {
      hourglassRef.current.rotation.y += 0.01;
      
      // Flow particles up and down
      const positions = hourglassRef.current.children[0].geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];
        positions[i * 3 + 1] = y + Math.sin(time * 2 + i * 0.1) * 0.01;
      }
      hourglassRef.current.children[0].geometry.attributes.position.needsUpdate = true;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, [currentState]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Update state colors
  useEffect(() => {
    if (torusRef.current) {
      const config = STATE_CONFIG[currentState];
      torusRef.current.material.color.setHex(config.color);
      torusRef.current.material.emissive.setHex(config.emissive);
    }
  }, [currentState]);

  // Initialize and cleanup
  useEffect(() => {
    initScene();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [initScene, handleResize]);

  // Start animation
  useEffect(() => {
    if (isInitialized) {
      animate();
    }
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isInitialized, animate]);

  const handleStateClick = (state) => {
    if (onStateChange) {
      onStateChange(state);
    }
  };

  return (
    <div className={`torus-flow-wrapper ${className}`}>
      <div 
        ref={containerRef} 
        className={`torus-canvas-container ${isLive ? 'live' : 'offline'}`}
      />
      
      <div className="torus-state-controls">
        {Object.entries(STATE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            className={`torus-state-button ${currentState === key ? 'active' : ''} ${isLive ? 'live' : ''}`}
            onClick={() => handleStateClick(key)}
            onMouseEnter={() => setHoveredState(key)}
            onMouseLeave={() => setHoveredState(null)}
          >
            <span className="state-indicator" style={{ 
              backgroundColor: `#${config.color.toString(16).padStart(6, '0')}`,
              boxShadow: `0 0 10px #${config.color.toString(16).padStart(6, '0')}`
            }} />
            <span className="state-label">{config.label}</span>
            {hoveredState === key && (
              <span className="state-description">{config.description}</span>
            )}
          </button>
        ))}
      </div>

      <div className="torus-flow-info">
        <div className="flow-metric">
          <span className="metric-value">
            {currentState === 'terrestrial' ? '∞' : currentState === 'harmonic' ? '∞²' : '∞³'}
          </span>
          <span className="metric-label">Dimensional Depth</span>
        </div>
        <div className="flow-metric">
          <span className="metric-value">
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="metric-label">Connection Status</span>
        </div>
      </div>
    </div>
  );
};

export default TorusFlow;
