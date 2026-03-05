/**
 * Three.js SATOR Sphere Visualization
 */

class SatorSphere {
  constructor() {
    this.container = document.getElementById('sphere-container');
    if (!this.container) return;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.particles = null;
    this.glowMesh = null;
    
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    
    this.init();
  }

  init() {
    this.setupScene();
    this.createSphere();
    this.createGlow();
    this.createParticles();
    this.addLights();
    this.setupEvents();
    this.animate();
  }

  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x2C241B, 0.02);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  createSphere() {
    // Create icosahedron geometry for sacred geometry look
    const geometry = new THREE.IcosahedronGeometry(1.5, 2);
    
    // Gold material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xD4AF37,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0xB8941F,
      emissiveIntensity: 0.1,
      envMapIntensity: 1.5
    });
    
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
    
    // Add wireframe overlay
    const wireGeometry = new THREE.IcosahedronGeometry(1.52, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xE5C158,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    this.wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    this.sphere.add(this.wireframe);
    
    // Add inner core
    const coreGeometry = new THREE.IcosahedronGeometry(0.8, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xB8941F,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.sphere.add(this.core);
  }

  createGlow() {
    // Outer glow sphere
    const glowGeometry = new THREE.IcosahedronGeometry(2.2, 2);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xD4AF37) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          intensity *= (0.8 + 0.2 * sin(time * 2.0));
          gl_FragColor = vec4(color, intensity * 0.4);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.glowMesh);
  }

  createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color1 = new THREE.Color(0xD4AF37);
    const color2 = new THREE.Color(0xB87333);
    
    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.5 + Math.random() * 2;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Mix colors
      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
      
      sizes[i] = Math.random() * 0.05 + 0.02;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Main directional light (golden)
    const mainLight = new THREE.DirectionalLight(0xD4AF37, 2);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);
    
    // Rim light
    const rimLight = new THREE.DirectionalLight(0xB87333, 1.5);
    rimLight.position.set(-5, 0, -5);
    this.scene.add(rimLight);
    
    // Point lights for sparkle
    const pointLight1 = new THREE.PointLight(0xE5C158, 1, 10);
    pointLight1.position.set(2, 2, 2);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xB8941F, 1, 10);
    pointLight2.position.set(-2, -2, 2);
    this.scene.add(pointLight2);
    
    this.lights = { mainLight, rimLight, pointLight1, pointLight2 };
  }

  setupEvents() {
    // Mouse movement for parallax
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Touch movement
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
    
    // Resize handler
    window.addEventListener('resize', () => {
      if (!this.container) return;
      
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    // Rotate main sphere
    if (this.sphere) {
      this.sphere.rotation.y += 0.003;
      this.sphere.rotation.x = Math.sin(time * 0.5) * 0.1;
      
      // Counter-rotate wireframe for interesting effect
      if (this.wireframe) {
        this.wireframe.rotation.y -= 0.002;
        this.wireframe.rotation.z = time * 0.1;
      }
      
      // Pulse core
      if (this.core) {
        this.core.rotation.y -= 0.005;
        this.core.rotation.x += 0.003;
      }
    }
    
    // Rotate glow
    if (this.glowMesh) {
      this.glowMesh.rotation.y += 0.001;
      this.glowMesh.material.uniforms.time.value = time;
    }
    
    // Animate particles
    if (this.particles) {
      this.particles.rotation.y += 0.0005;
      this.particles.rotation.z += 0.0002;
      
      // Orbital wobble
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;
        const radius = Math.sqrt(
          positions[i] ** 2 + 
          positions[i + 1] ** 2 + 
          positions[i + 2] ** 2
        );
        const wobble = Math.sin(time + idx) * 0.02;
        const scale = (radius + wobble) / radius;
        positions[i] *= scale;
        positions[i + 1] *= scale;
        positions[i + 2] *= scale;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Mouse parallax
    this.targetRotation.x = this.mouse.y * 0.3;
    this.targetRotation.y = this.mouse.x * 0.3;
    
    this.camera.position.x += (this.targetRotation.y - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.targetRotation.x - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);
    
    // Animate lights
    if (this.lights) {
      this.lights.pointLight1.position.x = Math.sin(time) * 3;
      this.lights.pointLight1.position.z = Math.cos(time) * 3;
      this.lights.pointLight2.position.x = Math.sin(time + Math.PI) * 3;
      this.lights.pointLight2.position.y = Math.cos(time * 0.7) * 2;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Change sphere color
   */
  setColor(colorHex) {
    if (this.sphere) {
      this.sphere.material.color.setHex(colorHex);
      this.sphere.material.emissive.setHex(colorHex);
    }
    if (this.glowMesh) {
      this.glowMesh.material.uniforms.color.value.setHex(colorHex);
    }
  }

  /**
   * Destroy the scene
   */
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Initialize when DOM is ready
let satorSphere;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    satorSphere = new SatorSphere();
    window.SatorSphere = satorSphere;
  });
} else {
  satorSphere = new SatorSphere();
  window.SatorSphere = satorSphere;
}
