/**
 * Animation Utilities
 * ===================
 * Helper functions for CSS transitions, animations,
 * glow effects, and smooth scrolling.
 * 
 * @module utils/animations
 * @version 1.0.0
 */

/**
 * Fade in an element
 * @param {HTMLElement} element - Element to fade in
 * @param {Object} [options] - Animation options
 * @param {number} [options.duration=300] - Duration in milliseconds
 * @param {string} [options.easing='ease-out'] - CSS easing function
 * @param {Function} [options.onComplete] - Callback when animation completes
 * @returns {Promise<void>}
 * 
 * @example
 * await fadeIn(element, { duration: 500 });
 */
export function fadeIn(element, options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 300,
            easing = 'ease-out',
            onComplete
        } = options;
        
        // Remove any existing transition
        element.style.transition = 'none';
        element.style.opacity = '0';
        
        // Force reflow
        element.offsetHeight;
        
        // Apply transition and fade in
        element.style.transition = `opacity ${duration}ms ${easing}`;
        element.style.opacity = '1';
        
        const cleanup = () => {
            element.removeEventListener('transitionend', onTransitionEnd);
            element.style.transition = '';
            if (onComplete) onComplete();
            resolve();
        };
        
        const onTransitionEnd = (e) => {
            if (e.propertyName === 'opacity') {
                cleanup();
            }
        };
        
        element.addEventListener('transitionend', onTransitionEnd);
        
        // Fallback in case transition doesn't fire
        setTimeout(cleanup, duration + 50);
    });
}

/**
 * Fade out an element
 * @param {HTMLElement} element - Element to fade out
 * @param {Object} [options] - Animation options
 * @param {number} [options.duration=300] - Duration in milliseconds
 * @param {string} [options.easing='ease-in'] - CSS easing function
 * @param {boolean} [options.hide=true] - Set display:none after fade
 * @param {Function} [options.onComplete] - Callback when animation completes
 * @returns {Promise<void>}
 */
export function fadeOut(element, options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 300,
            easing = 'ease-in',
            hide = true,
            onComplete
        } = options;
        
        element.style.transition = `opacity ${duration}ms ${easing}`;
        element.style.opacity = '0';
        
        const cleanup = () => {
            element.removeEventListener('transitionend', onTransitionEnd);
            element.style.transition = '';
            if (hide) {
                element.style.display = 'none';
            }
            if (onComplete) onComplete();
            resolve();
        };
        
        const onTransitionEnd = (e) => {
            if (e.propertyName === 'opacity') {
                cleanup();
            }
        };
        
        element.addEventListener('transitionend', onTransitionEnd);
        setTimeout(cleanup, duration + 50);
    });
}

/**
 * Slide an element in from a direction
 * @param {HTMLElement} element - Element to slide
 * @param {string} [direction='right'] - Direction to slide from
 * @param {Object} [options] - Animation options
 * @returns {Promise<void>}
 */
export function slideIn(element, direction = 'right', options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 400,
            distance = '100%',
            easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
        } = options;
        
        const directions = {
            left: { translate: `translateX(-${distance})`, origin: 'translateX(0)' },
            right: { translate: `translateX(${distance})`, origin: 'translateX(0)' },
            up: { translate: `translateY(-${distance})`, origin: 'translateY(0)' },
            down: { translate: `translateY(${distance})`, origin: 'translateY(0)' }
        };
        
        const dir = directions[direction] || directions.right;
        
        element.style.transition = 'none';
        element.style.transform = dir.translate;
        element.style.opacity = '0';
        element.offsetHeight;
        
        element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
        element.style.transform = dir.origin;
        element.style.opacity = '1';
        
        const cleanup = () => {
            element.removeEventListener('transitionend', onTransitionEnd);
            element.style.transition = '';
            resolve();
        };
        
        const onTransitionEnd = () => cleanup();
        element.addEventListener('transitionend', onTransitionEnd);
        setTimeout(cleanup, duration + 50);
    });
}

/**
 * Slide an element out in a direction
 * @param {HTMLElement} element - Element to slide
 * @param {string} [direction='left'] - Direction to slide to
 * @param {Object} [options] - Animation options
 * @returns {Promise<void>}
 */
export function slideOut(element, direction = 'left', options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 300,
            distance = '100%',
            easing = 'cubic-bezier(0.4, 0, 1, 1)',
            hide = true
        } = options;
        
        const directions = {
            left: `translateX(-${distance})`,
            right: `translateX(${distance})`,
            up: `translateY(-${distance})`,
            down: `translateY(${distance})`
        };
        
        const translate = directions[direction] || directions.left;
        
        element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
        element.style.transform = translate;
        element.style.opacity = '0';
        
        const cleanup = () => {
            element.removeEventListener('transitionend', onTransitionEnd);
            element.style.transition = '';
            if (hide) {
                element.style.display = 'none';
            }
            resolve();
        };
        
        const onTransitionEnd = () => cleanup();
        element.addEventListener('transitionend', onTransitionEnd);
        setTimeout(cleanup, duration + 50);
    });
}

/**
 * Scale animation (zoom in/out)
 * @param {HTMLElement} element - Element to scale
 * @param {number} [from=0] - Starting scale
 * @param {number} [to=1] - Ending scale
 * @param {Object} [options] - Animation options
 * @returns {Promise<void>}
 */
export function scale(element, from = 0, to = 1, options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 300,
            easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        } = options;
        
        element.style.transition = 'none';
        element.style.transform = `scale(${from})`;
        element.style.opacity = from < to ? '0' : '1';
        element.offsetHeight;
        
        element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ease`;
        element.style.transform = `scale(${to})`;
        element.style.opacity = to > 0.5 ? '1' : '0';
        
        const cleanup = () => {
            element.removeEventListener('transitionend', onTransitionEnd);
            element.style.transition = '';
            resolve();
        };
        
        const onTransitionEnd = () => cleanup();
        element.addEventListener('transitionend', onTransitionEnd);
        setTimeout(cleanup, duration + 50);
    });
}

/**
 * Creates a glow pulse effect on an element
 * @param {HTMLElement} element - Element to apply glow to
 * @param {Object} [options] - Glow options
 * @param {string} [options.color='#FFD700'] - Glow color
 * @param {number} [options.intensity=0.6] - Glow intensity (0-1)
 * @param {number} [options.duration=2000] - Pulse duration in ms
 * @param {boolean} [options.infinite=true] - Whether to loop infinitely
 * @returns {Object} Control object with start, stop, and destroy methods
 * 
 * @example
 * const glow = createGlow(element, { color: '#00D4FF', intensity: 0.8 });
 * glow.start();
 * // Later...
 * glow.stop();
 */
export function createGlow(element, options = {}) {
    if (!element) {
        return { start: () => {}, stop: () => {}, destroy: () => {} };
    }
    
    const {
        color = '#FFD700',
        intensity = 0.6,
        duration = 2000,
        infinite = true
    } = options;
    
    let animationId = null;
    let isRunning = false;
    
    const start = () => {
        if (isRunning) return;
        isRunning = true;
        
        const animate = (time) => {
            if (!isRunning) return;
            
            const progress = (time % duration) / duration;
            const pulse = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
            const currentIntensity = intensity * (0.3 + pulse * 0.7);
            const blur = 20 + pulse * 30;
            
            element.style.boxShadow = `0 0 ${blur}px ${blur / 2}px ${hexToRgba(color, currentIntensity)}`;
            
            if (infinite || time < duration) {
                animationId = requestAnimationFrame(animate);
            }
        };
        
        animationId = requestAnimationFrame(animate);
    };
    
    const stop = () => {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        element.style.boxShadow = '';
    };
    
    const destroy = () => {
        stop();
        element.style.boxShadow = '';
    };
    
    return { start, stop, destroy };
}

/**
 * Applies a CSS keyframe animation to an element
 * @param {HTMLElement} element - Target element
 * @param {string} animationName - Name of CSS animation
 * @param {Object} [options] - Animation options
 * @returns {Promise<void>}
 */
export function animate(element, animationName, options = {}) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const {
            duration = 500,
            easing = 'ease',
            delay = 0,
            fill = 'both'
        } = options;
        
        element.style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms ${fill}`;
        
        const cleanup = () => {
            element.removeEventListener('animationend', onAnimationEnd);
            resolve();
        };
        
        const onAnimationEnd = () => cleanup();
        element.addEventListener('animationend', onAnimationEnd);
        setTimeout(cleanup, duration + delay + 50);
    });
}

/**
 * Staggers animations across multiple elements
 * @param {HTMLElement[]} elements - Elements to animate
 * @param {Function} animationFn - Animation function to apply
 * @param {Object} [options] - Stagger options
 * @returns {Promise<void>}
 */
export function stagger(elements, animationFn, options = {}) {
    const {
        staggerDelay = 100,
        ...animationOptions
    } = options;
    
    return Promise.all(
        elements.map((element, index) => 
            new Promise(resolve => {
                setTimeout(() => {
                    animationFn(element, animationOptions).then(resolve);
                }, index * staggerDelay);
            })
        )
    );
}

/**
 * Smooth scroll to an element
 * @param {HTMLElement|string} target - Element or selector to scroll to
 * @param {Object} [options] - Scroll options
 * @returns {Promise<void>}
 */
export function scrollTo(target, options = {}) {
    return new Promise((resolve) => {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (!element) {
            resolve();
            return;
        }
        
        const {
            offset = 0,
            duration = 500,
            easing = 'easeInOutCubic'
        } = options;
        
        const startY = window.scrollY;
        const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
        const distance = targetY - startY;
        
        const easings = {
            linear: t => t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        };
        
        const easeFn = easings[easing] || easings.easeInOutCubic;
        const startTime = performance.now();
        
        const scroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);
            
            window.scrollTo(0, startY + distance * easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(scroll);
            } else {
                resolve();
            }
        };
        
        requestAnimationFrame(scroll);
    });
}

/**
 * Parallax effect on scroll
 * @param {HTMLElement} element - Element to apply parallax
 * @param {Object} [options] - Parallax options
 * @returns {Function} Cleanup function
 */
export function parallax(element, options = {}) {
    if (!element) return () => {};
    
    const {
        speed = 0.5,
        direction = 'vertical' // 'vertical' | 'horizontal'
    } = options;
    
    let ticking = false;
    
    const updatePosition = () => {
        const rect = element.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = scrolled * speed;
        
        if (direction === 'vertical') {
            element.style.transform = `translateY(${rate}px)`;
        } else {
            element.style.transform = `translateX(${rate}px)`;
        }
        
        ticking = false;
    };
    
    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(updatePosition);
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}

/**
 * Helper function to convert hex color to rgba
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Creates a ripple effect on click (Material Design style)
 * @param {HTMLElement} element - Element to apply ripple
 * @param {Object} [options] - Ripple options
 * @returns {Function} Cleanup function
 */
export function createRipple(element, options = {}) {
    if (!element) return () => {};
    
    const {
        color = 'rgba(255, 255, 255, 0.3)',
        duration = 600
    } = options;
    
    const handleClick = (e) => {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            animation: ripple-animation ${duration}ms ease-out;
        `;
        
        element.style.position = element.style.position || 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), duration);
    };
    
    element.addEventListener('click', handleClick);
    
    return () => element.removeEventListener('click', handleClick);
}

// Add ripple animation keyframes to document if not present
if (!document.getElementById('ripple-animation-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-style';
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Default export with all utilities
export default {
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scale,
    createGlow,
    animate,
    stagger,
    scrollTo,
    parallax,
    createRipple
};
