/**
 * NJZ Center Button Component
 * ===========================
 * Renders the animated + button at the center of the quarter grid.
 * Opens the help panel when clicked.
 * 
 * @module components/njz-button
 * @version 1.0.0
 */

import { createElement } from '../utils/dom.js';
import { createGlow, scale, animate } from '../utils/animations.js';

/**
 * Default button options
 */
const DEFAULT_OPTIONS = {
    size: 'large', // 'small' | 'medium' | 'large'
    animated: true,
    pulseOnIdle: true,
    glowColor: '#FFD700',
    glowIntensity: 0.6,
    onClick: null,
    className: '',
    ariaLabel: 'Open help panel'
};

/**
 * Size configurations
 */
const SIZE_CONFIG = {
    small: {
        container: 'w-12 h-12',
        icon: 'w-6 h-6',
        glow: 30
    },
    medium: {
        container: 'w-16 h-16',
        icon: 'w-8 h-8',
        glow: 40
    },
    large: {
        container: 'w-20 h-20',
        icon: 'w-10 h-10',
        glow: 50
    }
};

/**
 * Creates the NJZ Center Button component
 * @param {Object} options - Button configuration
 * @param {string} [options.size='large'] - Button size
 * @param {boolean} [options.animated=true] - Enable animations
 * @param {boolean} [options.pulseOnIdle=true] - Pulse animation when idle
 * @param {string} [options.glowColor='#FFD700'] - Glow color
 * @param {number} [options.glowIntensity=0.6] - Glow intensity
 * @param {Function} [options.onClick] - Click handler
 * @param {string} [options.className] - Additional CSS classes
 * @param {string} [options.ariaLabel='Open help panel'] - Aria label
 * @returns {HTMLElement} Button container
 * 
 * @example
 * const njzButton = createNJZButton({
 *   onClick: () => openHelpPanel(),
 *   glowColor: '#00D4FF'
 * });
 * document.getElementById('center').appendChild(njzButton);
 */
export function createNJZButton(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const size = SIZE_CONFIG[config.size] || SIZE_CONFIG.large;
    
    // Create button container
    const container = createElement('button', {
        classes: [
            'njz-center-button',
            'relative',
            size.container,
            'rounded-full',
            'flex',
            'items-center',
            'justify-center',
            'cursor-pointer',
            'group',
            'focus:outline-none',
            'focus:ring-4',
            'focus:ring-yellow-400/30',
            config.className
        ],
        attrs: {
            type: 'button',
            'aria-label': config.ariaLabel,
            'data-njz-button': ''
        }
    });
    
    // Create gradient background
    const background = createElement('div', {
        classes: [
            'absolute',
            'inset-0',
            'rounded-full',
            'bg-gradient-to-br',
            'from-yellow-300',
            'via-yellow-400',
            'to-yellow-600',
            'shadow-2xl',
            'shadow-yellow-500/50',
            'transition-all',
            'duration-300',
            'group-hover:shadow-yellow-500/70',
            'group-active:scale-95'
        ]
    });
    container.appendChild(background);
    
    // Create inner shine effect
    const shine = createElement('div', {
        classes: [
            'absolute',
            'inset-1',
            'rounded-full',
            'bg-gradient-to-br',
            'from-white/40',
            'to-transparent',
            'pointer-events-none'
        ]
    });
    container.appendChild(shine);
    
    // Create + icon
    const icon = createElement('div', {
        classes: [
            'relative',
            'z-10',
            size.icon,
            'text-slate-900',
            'transition-transform',
            'duration-300',
            'group-hover:rotate-90'
        ],
        html: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" 
                 stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `
    });
    container.appendChild(icon);
    
    // Create ring effect
    const ring = createElement('div', {
        classes: [
            'absolute',
            'inset-[-8px]',
            'rounded-full',
            'border-2',
            'border-yellow-400/30',
            'opacity-0',
            'group-hover:opacity-100',
            'group-hover:animate-ping',
            'transition-opacity'
        ]
    });
    container.appendChild(ring);
    
    // Set up glow effect
    let glowController = null;
    
    if (config.animated) {
        glowController = createGlow(container, {
            color: config.glowColor,
            intensity: config.glowIntensity,
            duration: 2000,
            infinite: true
        });
    }
    
    // Handle hover for glow
    container.addEventListener('mouseenter', () => {
        if (glowController) {
            glowController.start();
        }
        // Scale up effect
        scale(container, 1, 1.1, { duration: 200 });
    });
    
    container.addEventListener('mouseleave', () => {
        if (glowController) {
            glowController.stop();
        }
        // Scale back
        scale(container, 1.1, 1, { duration: 200 });
    });
    
    // Handle click
    if (typeof config.onClick === 'function') {
        container.addEventListener('click', (e) => {
            // Add ripple effect
            createRipple(e, container);
            
            // Execute callback
            config.onClick(e, container);
        });
    }
    
    // Handle keyboard
    container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            container.click();
        }
    });
    
    // Start idle pulse animation
    if (config.pulseOnIdle && config.animated) {
        startPulseAnimation(container);
    }
    
    // Initial entrance animation
    if (config.animated) {
        container.style.opacity = '0';
        container.style.transform = 'scale(0)';
        
        setTimeout(() => {
            scale(container, 0, 1, { 
                duration: 500,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
        }, 300);
    }
    
    // Store glow controller for external control
    container._glowController = glowController;
    
    return container;
}

/**
 * Creates a ripple effect on click
 * @param {Event} event - Click event
 * @param {HTMLElement} container - Button container
 */
function createRipple(event, container) {
    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = createElement('span', {
        classes: ['njz-ripple'],
        styles: {
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            width: `${size}px`,
            height: `${size}px`,
            left: `${x}px`,
            top: `${y}px`,
            pointerEvents: 'none',
            transform: 'scale(0)',
            animation: 'njz-ripple 0.6s ease-out'
        }
    });
    
    container.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

/**
 * Starts the idle pulse animation
 * @param {HTMLElement} container - Button container
 */
function startPulseAnimation(container) {
    let animationId = null;
    let lastPulse = 0;
    const pulseInterval = 3000; // Pulse every 3 seconds
    
    const pulse = (timestamp) => {
        if (timestamp - lastPulse > pulseInterval) {
            // Subtle scale pulse
            container.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
            ], {
                duration: 600,
                easing: 'ease-in-out'
            });
            lastPulse = timestamp;
        }
        animationId = requestAnimationFrame(pulse);
    };
    
    animationId = requestAnimationFrame(pulse);
    
    // Store animation ID for cleanup
    container._pulseAnimation = animationId;
}

/**
 * Controls for the NJZ button glow effect
 * @param {HTMLElement} button - NJZ button element
 * @returns {Object} Glow control methods
 */
export function getGlowControl(button) {
    if (!button || !button._glowController) {
        return {
            start: () => {},
            stop: () => {},
            destroy: () => {}
        };
    }
    
    return button._glowController;
}

/**
 * Updates the button's glow color
 * @param {HTMLElement} button - NJZ button element
 * @param {string} color - New glow color
 * @param {number} [intensity] - New intensity
 */
export function updateGlowColor(button, color, intensity) {
    if (!button) return;
    
    // Stop existing glow
    if (button._glowController) {
        button._glowController.stop();
    }
    
    // Create new glow with updated color
    button._glowController = createGlow(button, {
        color,
        intensity: intensity || 0.6,
        duration: 2000,
        infinite: true
    });
}

/**
 * Triggers the button click animation
 * @param {HTMLElement} button - NJZ button element
 */
export function triggerClickAnimation(button) {
    if (!button) return;
    
    // Scale down then up
    button.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.9)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' }
    ], {
        duration: 400,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
}

// Add ripple animation styles
if (!document.getElementById('njz-button-styles')) {
    const style = document.createElement('style');
    style.id = 'njz-button-styles';
    style.textContent = `
        @keyframes njz-ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .njz-center-button {
            will-change: transform, box-shadow;
        }
        
        @media (prefers-reduced-motion: reduce) {
            .njz-center-button {
                transition: none !important;
                animation: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Default export
export default {
    createNJZButton,
    getGlowControl,
    updateGlowColor,
    triggerClickAnimation,
    SIZE_CONFIG
};
