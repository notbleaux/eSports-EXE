/**
 * Mystical Atmosphere Particle System
 * Creates floating golden particles for esoteric ambiance
 */

class MysticalParticles {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.isActive = true;
    
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.setupEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  createParticles() {
    const particleCount = Math.min(80, Math.floor((this.width * this.height) / 15000));
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        color: this.getRandomGoldColor()
      });
    }
  }

  getRandomGoldColor() {
    const colors = [
      { r: 212, g: 175, b: 55 },   // Gold
      { r: 229, g: 193, b: 88 },   // Light Gold
      { r: 184, g: 115, b: 51 },   // Copper
      { r: 245, g: 245, b: 220 }   // Parchment
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setupEvents() {
    // Resize handler
    window.addEventListener('resize', () => this.resize());
    
    // Mouse interaction
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    // Visibility handling
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
      if (this.isActive) {
        this.animate();
      }
    });
    
    // Scroll handling - reduce particles when scrolled down
    window.addEventListener('scroll', () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      this.opacity = Math.max(0.2, 1 - scrollPercent);
    });
  }

  animate() {
    if (!this.isActive) return;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const time = Date.now() * 0.001;
    
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Mouse repulsion
      const dx = particle.x - this.mouse.x;
      const dy = particle.y - this.mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.x += (dx / distance) * force * 2;
        particle.y += (dy / distance) * force * 2;
      }
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;
      
      // Pulsing opacity
      const pulse = Math.sin(time * particle.pulseSpeed * 50 + particle.pulsePhase);
      const currentOpacity = particle.opacity * (0.7 + pulse * 0.3) * (this.opacity || 1);
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${currentOpacity})`;
      this.ctx.fill();
      
      // Draw glow for larger particles
      if (particle.size > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
      
      // Connect nearby particles
      if (index % 3 === 0) {
        this.connectParticles(particle, index);
      }
    });
    
    requestAnimationFrame(() => this.animate());
  }

  connectParticles(particle, index) {
    for (let i = index + 1; i < Math.min(index + 5, this.particles.length); i++) {
      const other = this.particles[i];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const opacity = (1 - distance / 100) * 0.15 * (this.opacity || 1);
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(other.x, other.y);
        this.ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
      }
    }
  }

  /**
   * Add burst of particles at position
   */
  burst(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 3 + 1;
      
      this.particles.push({
        x: x,
        y: y,
        size: Math.random() * 3 + 1,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        opacity: 1,
        pulseSpeed: 0.05,
        pulsePhase: 0,
        color: this.getRandomGoldColor(),
        life: 1,
        decay: 0.02
      });
    }
  }

  /**
   * Update particle with burst logic
   */
  updateBurstParticle(particle) {
    if (particle.life !== undefined) {
      particle.life -= particle.decay;
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedX *= 0.95;
      particle.speedY *= 0.95;
      
      if (particle.life <= 0) {
        return false; // Remove particle
      }
    }
    return true;
  }
}

// Initialize when DOM is ready
let mysticalParticles;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mysticalParticles = new MysticalParticles();
    window.MysticalParticles = mysticalParticles;
  });
} else {
  mysticalParticles = new MysticalParticles();
  window.MysticalParticles = mysticalParticles;
}
