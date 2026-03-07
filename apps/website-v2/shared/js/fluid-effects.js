/**
 * NJZ Platform v2 - Fluid Effects
 * Liquid motion and morphing animations
 * 
 * @version 2.0.0
 * @requires gsap
 */

import { gsap } from 'gsap';

/**
 * Liquid button hover effect
 * Creates a fluid morphing border effect on hover
 * @param {Element} element - Target button element
 * @param {Object} options - Effect options
 * @returns {Function} Cleanup function
 */
export function liquidButton(element, options = {}) {
  const {
    color = '#00f0ff',
    intensity = 1,
    speed = 0.5,
  } = options;

  // Create SVG filter for liquid effect
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('style', 'position: absolute; width: 0; height: 0;');
  
  const defs = document.createElementNS(svgNS, 'defs');
  const filter = document.createElementNS(svgNS, 'filter');
  filter.setAttribute('id', `liquid-${Math.random().toString(36).substr(2, 9)}`);
  
  const turbulence = document.createElementNS(svgNS, 'feTurbulence');
  turbulence.setAttribute('type', 'fractalNoise');
  turbulence.setAttribute('baseFrequency', '0.01');
  turbulence.setAttribute('numOctaves', '3');
  turbulence.setAttribute('result', 'noise');
  
  const displacement = document.createElementNS(svgNS, 'feDisplacementMap');
  displacement.setAttribute('in', 'SourceGraphic');
  displacement.setAttribute('in2', 'noise');
  displacement.setAttribute('scale', '10');
  displacement.setAttribute('xChannelSelector', 'R');
  displacement.setAttribute('yChannelSelector', 'G');
  
  filter.appendChild(turbulence);
  filter.appendChild(displacement);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  // Apply filter to element
  const originalStyle = element.style.cssText;
  element.style.filter = `url(#${filter.getAttribute('id')})`;

  // Animate turbulence on hover
  let animation;
  const handleMouseEnter = () => {
    animation = gsap.to(turbulence, {
      attr: { baseFrequency: 0.03 * intensity },
      duration: speed,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (animation) animation.kill();
    gsap.to(turbulence, {
      attr: { baseFrequency: 0.01 },
      duration: speed * 2,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.style.cssText = originalStyle;
    svg.remove();
  };
}

/**
 * Morphing blob shape animation
 * @param {Element} element - SVG path element
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function morphingBlob(element, options = {}) {
  const {
    paths = [],
    duration = 4,
    ease = 'sine.inOut',
  } = options;

  if (paths.length < 2) {
    console.warn('morphingBlob requires at least 2 paths');
    return null;
  }

  const tl = gsap.timeline({ repeat: -1, yoyo: true });

  paths.forEach((path, index) => {
    if (index < paths.length - 1) {
      tl.to(element, {
        attr: { d: paths[index + 1] },
        duration: duration / (paths.length - 1),
        ease,
      });
    }
  });

  return tl;
}

/**
 * Wave distortion effect for images/text
 * @param {Element} element - Target element
 * @param {Object} options - Effect options
 * @returns {Function} Cleanup function
 */
export function waveDistortion(element, options = {}) {
  const {
    amplitude = 10,
    frequency = 0.02,
    speed = 1,
    direction = 'vertical',
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Store original content
  const originalHTML = element.innerHTML;
  const computedStyle = window.getComputedStyle(element);
  
  canvas.width = element.offsetWidth;
  canvas.height = element.offsetHeight;
  canvas.style.cssText = computedStyle.cssText;
  
  element.innerHTML = '';
  element.appendChild(canvas);

  let time = 0;
  let animationId;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    // Create wave distortion
    for (let i = 0; i < canvas.height; i += 2) {
      const offset = direction === 'vertical'
        ? Math.sin(i * frequency + time) * amplitude
        : 0;
      
      ctx.drawImage(
        element,
        0, i, canvas.width, 2,
        offset, i, canvas.width, 2
      );
    }
    
    ctx.restore();
    
    time += speed * 0.05;
    animationId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationId);
    element.innerHTML = originalHTML;
  };
}

/**
 * Ripple effect on click
 * @param {Element} element - Target element
 * @param {Object} options - Effect options
 * @returns {Function} Cleanup function
 */
export function rippleEffect(element, options = {}) {
  const {
    color = 'rgba(0, 240, 255, 0.3)',
    duration = 0.6,
    maxScale = 4,
  } = options;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';

  const handleClick = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${color};
      transform: scale(0);
      pointer-events: none;
      width: 100px;
      height: 100px;
      margin-left: -50px;
      margin-top: -50px;
      left: ${x}px;
      top: ${y}px;
    `;

    element.appendChild(ripple);

    gsap.to(ripple, {
      scale: maxScale,
      opacity: 0,
      duration,
      ease: 'power2.out',
      onComplete: () => ripple.remove(),
    });
  };

  element.addEventListener('click', handleClick);

  return () => {
    element.removeEventListener('click', handleClick);
  };
}

/**
 * Fluid gradient background animation
 * @param {Element} element - Target element
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function fluidGradient(element, options = {}) {
  const {
    colors = ['#0a0a0f', '#1a1a24', '#00f0ff'],
    duration = 10,
  } = options;

  const gradientStops = colors.map((color, i) => ({
    stop: i / (colors.length - 1),
    color,
  }));

  // Create canvas for fluid gradient
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    z-index: -1;
  `;
  
  element.style.position = 'relative';
  element.insertBefore(canvas, element.firstChild);

  const resize = () => {
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Animation variables
  let time = 0;
  let animationId;

  const noise = (x, y, t) => {
    return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.5);
  };

  const animate = () => {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      
      const n = noise(x, y, time);
      const colorIndex = Math.floor((n + 1) / 2 * (colors.length - 1));
      const color = hexToRgb(colors[Math.min(colorIndex, colors.length - 1)]);
      
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    time += 0.01;
    animationId = requestAnimationFrame(animate);
  };

  animate();

  return {
    kill: () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.remove();
    },
  };
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {Object} RGB values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Liquid cursor trail effect
 * @param {Object} options - Effect options
 * @returns {Function} Cleanup function
 */
export function liquidCursorTrail(options = {}) {
  const {
    color = '#00f0ff',
    trailLength = 20,
    size = 8,
  } = options;

  const points = [];
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
  document.body.appendChild(container);

  // Create trail elements
  const trailElements = [];
  for (let i = 0; i < trailLength; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      opacity: ${1 - i / trailLength};
      transform: translate(-50%, -50%);
      filter: blur(${i * 0.5}px);
    `;
    container.appendChild(el);
    trailElements.push(el);
  }

  let mouseX = 0;
  let mouseY = 0;

  const handleMouseMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  document.addEventListener('mousemove', handleMouseMove);

  // Animation loop
  let animationId;
  const animate = () => {
    points.unshift({ x: mouseX, y: mouseY });
    if (points.length > trailLength) points.pop();

    trailElements.forEach((el, i) => {
      const point = points[i] || points[points.length - 1];
      gsap.to(el, {
        x: point.x,
        y: point.y,
        duration: 0.1,
        ease: 'power2.out',
      });
    });

    animationId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationId);
    document.removeEventListener('mousemove', handleMouseMove);
    container.remove();
  };
}

export default {
  liquidButton,
  morphingBlob,
  waveDistortion,
  rippleEffect,
  fluidGradient,
  liquidCursorTrail,
};
