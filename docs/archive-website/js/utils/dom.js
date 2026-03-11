[Ver002.000]
/**
 * DOM Utilities
 * =============
 * Helper functions for DOM manipulation, element creation,
 * event delegation, and class management.
 * 
 * @module utils/dom
 * @version 1.0.0
 */

/**
 * Creates a DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @param {string} [options.text] - Text content
 * @param {string} [options.html] - HTML content
 * @param {Object} [options.attrs] - Attributes object
 * @param {string[]} [options.classes] - CSS classes array
 * @param {Object} [options.styles] - Inline styles object
 * @param {HTMLElement[]} [options.children] - Child elements
 * @param {HTMLElement} [options.parent] - Parent element to append to
 * @returns {HTMLElement} Created element
 * 
 * @example
 * const button = createElement('button', {
 *   text: 'Click me',
 *   classes: ['btn', 'btn-primary'],
 *   attrs: { 'data-id': '123', disabled: true }
 * });
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    // Set text or HTML content
    if (options.text !== undefined) {
        element.textContent = options.text;
    }
    if (options.html !== undefined) {
        element.innerHTML = options.html;
    }
    
    // Set attributes
    if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
            if (value === true) {
                element.setAttribute(key, '');
            } else if (value !== false && value !== null && value !== undefined) {
                element.setAttribute(key, String(value));
            }
        });
    }
    
    // Add classes
    if (options.classes) {
        element.classList.add(...options.classes.filter(Boolean));
    }
    
    // Set inline styles
    if (options.styles) {
        Object.assign(element.style, options.styles);
    }
    
    // Append children
    if (options.children) {
        options.children.forEach(child => {
            if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }
    
    // Append to parent
    if (options.parent && options.parent instanceof HTMLElement) {
        options.parent.appendChild(element);
    }
    
    return element;
}

/**
 * Sets up event delegation on a container element
 * @param {HTMLElement} container - Container element
 * @param {string} selector - CSS selector for target elements
 * @param {string} eventType - Event type to listen for
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Event listener options
 * @returns {Function} Function to remove the event listener
 * 
 * @example
 * delegate(document.body, '.btn', 'click', (e, target) => {
 *   console.log('Button clicked:', target);
 * });
 */
export function delegate(container, selector, eventType, handler, options = {}) {
    const eventHandler = (event) => {
        const target = event.target.closest(selector);
        if (target && container.contains(target)) {
            handler.call(target, event, target);
        }
    };
    
    container.addEventListener(eventType, eventHandler, options);
    
    // Return cleanup function
    return () => {
        container.removeEventListener(eventType, eventHandler, options);
    };
}

/**
 * Toggles a CSS class on an element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to toggle
 * @param {boolean} [force] - Force add/remove
 * @returns {boolean} Whether class is now present
 */
export function toggleClass(element, className, force) {
    if (!element || !className) return false;
    return element.classList.toggle(className, force);
}

/**
 * Adds CSS classes to an element
 * @param {HTMLElement} element - Target element
 * @param {...string} classes - Classes to add
 */
export function addClass(element, ...classes) {
    if (!element) return;
    element.classList.add(...classes.filter(Boolean));
}

/**
 * Removes CSS classes from an element
 * @param {HTMLElement} element - Target element
 * @param {...string} classes - Classes to remove
 */
export function removeClass(element, ...classes) {
    if (!element) return;
    element.classList.remove(...classes.filter(Boolean));
}

/**
 * Checks if element has a CSS class
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to check
 * @returns {boolean}
 */
export function hasClass(element, className) {
    if (!element || !className) return false;
    return element.classList.contains(className);
}

/**
 * Safely queries for an element
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Search context
 * @returns {HTMLElement|null}
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Queries for all matching elements
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Search context
 * @returns {HTMLElement[]}
 */
export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Waits for DOM to be ready
 * @param {Function} callback - Function to execute
 */
export function ready(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * Gets data attributes from an element
 * @param {HTMLElement} element - Target element
 * @param {string} [prefix] - Optional data attribute prefix
 * @returns {Object} Data attributes object
 */
export function getDataAttributes(element, prefix) {
    if (!element) return {};
    
    const data = {};
    const attrs = element.attributes;
    
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr.name.startsWith('data-')) {
            let key = attr.name.slice(5);
            if (prefix && key.startsWith(prefix + '-')) {
                key = key.slice(prefix.length + 1);
            }
            // Try to parse as JSON, number, or boolean
            let value = attr.value;
            try {
                value = JSON.parse(value);
            } catch {
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
            }
            data[key] = value;
        }
    }
    
    return data;
}

/**
 * Sets data attributes on an element
 * @param {HTMLElement} element - Target element
 * @param {Object} data - Data attributes object
 */
export function setDataAttributes(element, data) {
    if (!element || !data) return;
    
    Object.entries(data).forEach(([key, value]) => {
        const attrValue = typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value);
        element.setAttribute(`data-${key.replace(/[A-Z]/g, '-$&').toLowerCase()}`, attrValue);
    });
}

/**
 * Removes all children from an element
 * @param {HTMLElement} element - Target element
 */
export function clearChildren(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Replaces an element's content
 * @param {HTMLElement} element - Target element
 * @param {HTMLElement|HTMLElement[]|string} content - New content
 */
export function setContent(element, content) {
    if (!element) return;
    
    clearChildren(element);
    
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof Node) {
        element.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }
}

/**
 * Finds the closest ancestor matching a selector
 * @param {HTMLElement} element - Starting element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
export function closest(element, selector) {
    if (!element) return null;
    if (element.closest) {
        return element.closest(selector);
    }
    // Polyfill for older browsers
    let el = element;
    while (el && el !== document.body && el !== document.documentElement) {
        if (el.matches(selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}

/**
 * Safely parses HTML string to DOM elements
 * @param {string} html - HTML string
 * @param {boolean} [returnAll=false] - Return all children or just first
 * @returns {HTMLElement|HTMLElement[]|null}
 */
export function parseHTML(html, returnAll = false) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const content = template.content;
    
    if (returnAll) {
        return Array.from(content.children);
    }
    return content.firstElementChild;
}

/**
 * Focuses an element safely with fallback
 * @param {HTMLElement|string} element - Element or selector
 * @param {Object} [options] - Focus options
 */
export function safeFocus(element, options = {}) {
    const el = typeof element === 'string' ? $(element) : element;
    if (el && typeof el.focus === 'function') {
        // Save previous focus
        const previousFocus = document.activeElement;
        el.focus(options);
        return () => {
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus();
            }
        };
    }
    return () => {};
}

/**
 * Traps focus within a container (for modals, panels)
 * @param {HTMLElement} container - Container element
 * @returns {Function} Function to release focus trap
 */
export function trapFocus(container) {
    if (!container) return () => {};
    
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstFocusable) {
        firstFocusable.focus();
    }
    
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Throttles a function to run at most once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait period in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, wait) {
    let timeout = null;
    let previous = 0;
    
    return function throttled(...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}

/**
 * Debounces a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait period in milliseconds
 * @param {boolean} [immediate=false] - Run immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function debounced(...args) {
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            if (!immediate) {
                func.apply(this, args);
            }
        }, wait);
        
        if (callNow) {
            func.apply(this, args);
        }
    };
}

// Default export with all utilities
export default {
    createElement,
    delegate,
    toggleClass,
    addClass,
    removeClass,
    hasClass,
    $,
    $$,
    ready,
    getDataAttributes,
    setDataAttributes,
    clearChildren,
    setContent,
    closest,
    parseHTML,
    safeFocus,
    trapFocus,
    escapeHTML,
    throttle,
    debounce
};
