[Ver003.000]
/**
 * Toast Notification Component
 * ============================
 * Displays toast notifications with auto-dismiss,
 * progress bar, and stacking support.
 * 
 * @module components/toast
 * @version 1.0.0
 */

import { createElement, addClass, removeClass } from '../utils/dom.js';

/**
 * Toast type configurations
 */
const TOAST_TYPES = {
    success: {
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7" />
        </svg>`,
        bgColor: 'bg-emerald-500',
        borderColor: 'border-emerald-400/30',
        textColor: 'text-white'
    },
    error: {
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>`,
        bgColor: 'bg-red-500',
        borderColor: 'border-red-400/30',
        textColor: 'text-white'
    },
    warning: {
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>`,
        bgColor: 'bg-amber-500',
        borderColor: 'border-amber-400/30',
        textColor: 'text-white'
    },
    info: {
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>`,
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-400/30',
        textColor: 'text-white'
    }
};

/**
 * Default toast options
 */
const DEFAULT_OPTIONS = {
    type: 'info',
    message: '',
    title: null,
    duration: 5000,
    dismissible: true,
    pauseOnHover: true,
    position: 'top-right',
    onClose: null,
    onClick: null
};

/**
 * Container elements for different positions
 */
const containers = {};

/**
 * Active toasts array for stacking
 */
const activeToasts = [];

/**
 * Maximum number of toasts to show at once
 */
const MAX_TOASTS = 5;

/**
 * Shows a toast notification
 * @param {Object} options - Toast configuration
 * @param {string} [options.type='info'] - Toast type ('success' | 'error' | 'warning' | 'info')
 * @param {string} options.message - Toast message
 * @param {string} [options.title] - Optional title
 * @param {number} [options.duration=5000] - Auto-dismiss duration in ms (0 for no auto-dismiss)
 * @param {boolean} [options.dismissible=true] - Show close button
 * @param {boolean} [options.pauseOnHover=true] - Pause timer on hover
 * @param {string} [options.position='top-right'] - Position on screen
 * @param {Function} [options.onClose] - Close callback
 * @param {Function} [options.onClick] - Click callback
 * @returns {Object} Toast control object with close method
 * 
 * @example
 * showToast({
 *   type: 'success',
 *   message: 'Settings saved successfully!',
 *   duration: 3000
 * });
 */
export function showToast(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const typeConfig = TOAST_TYPES[config.type] || TOAST_TYPES.info;
    
    // Remove oldest toast if at max
    if (activeToasts.length >= MAX_TOASTS) {
        const oldest = activeToasts.shift();
        if (oldest && oldest.close) {
            oldest.close();
        }
    }
    
    // Get or create container
    const container = getContainer(config.position);
    
    // Create toast element
    const toast = createElement('div', {
        classes: [
            'toast',
            'relative',
            'flex',
            'items-start',
            'gap-3',
            'p-4',
            'rounded-xl',
            'shadow-2xl',
            'shadow-black/30',
            'border',
            typeConfig.borderColor,
            typeConfig.bgColor,
            'transform',
            'transition-all',
            'duration-300',
            'translate-x-full',
            'opacity-0'
        ],
        attrs: {
            role: 'alert',
            'aria-live': config.type === 'error' ? 'assertive' : 'polite'
        },
        styles: {
            minWidth: '300px',
            maxWidth: '400px'
        }
    });
    
    // Add icon
    const icon = createElement('div', {
        classes: [
            'flex-shrink-0',
            typeConfig.textColor
        ],
        html: typeConfig.icon
    });
    toast.appendChild(icon);
    
    // Create content container
    const content = createElement('div', {
        classes: ['flex-1', 'min-w-0']
    });
    
    // Add title if provided
    if (config.title) {
        const titleEl = createElement('div', {
            classes: [
                'font-semibold',
                typeConfig.textColor,
                'mb-1'
            ],
            text: config.title
        });
        content.appendChild(titleEl);
    }
    
    // Add message
    const messageEl = createElement('div', {
        classes: [
            'text-sm',
            typeConfig.textColor,
            'opacity-90'
        ],
        text: config.message
    });
    content.appendChild(messageEl);
    
    toast.appendChild(content);
    
    // Add close button if dismissible
    let closeBtn = null;
    if (config.dismissible) {
        closeBtn = createElement('button', {
            classes: [
                'flex-shrink-0',
                'p-1',
                'rounded-lg',
                'opacity-60',
                'hover:opacity-100',
                'transition-opacity',
                typeConfig.textColor
            ],
            attrs: {
                type: 'button',
                'aria-label': 'Close notification'
            },
            html: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12" />
            </svg>`
        });
        toast.appendChild(closeBtn);
    }
    
    // Add progress bar for auto-dismiss
    let progressBar = null;
    let progressInterval = null;
    let remainingTime = config.duration;
    let startTime = Date.now();
    let isPaused = false;
    
    if (config.duration > 0) {
        progressBar = createElement('div', {
            classes: [
                'absolute',
                'bottom-0',
                'left-0',
                'h-1',
                'bg-white/30',
                'transition-none'
            ],
            styles: {
                width: '100%'
            }
        });
        toast.appendChild(progressBar);
        
        // Animate progress bar
        const animateProgress = () => {
            if (isPaused) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.max(0, 100 - (elapsed / config.duration * 100));
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (progress <= 0) {
                close();
            }
        };
        
        progressInterval = setInterval(animateProgress, 16); // ~60fps
    }
    
    // Add to container
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        removeClass(toast, 'translate-x-full', 'opacity-0');
        addClass(toast, 'translate-x-0', 'opacity-100');
    });
    
    // Handle hover pause
    if (config.pauseOnHover && config.duration > 0) {
        toast.addEventListener('mouseenter', () => {
            isPaused = true;
            remainingTime -= Date.now() - startTime;
        });
        
        toast.addEventListener('mouseleave', () => {
            isPaused = false;
            startTime = Date.now() - (config.duration - remainingTime);
        });
    }
    
    // Handle click
    if (typeof config.onClick === 'function') {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', (e) => {
            // Don't trigger if clicking close button
            if (e.target.closest('button')) return;
            config.onClick(toast);
        });
    }
    
    // Close function
    function close() {
        // Clear interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Remove from active toasts
        const index = activeToasts.findIndex(t => t.element === toast);
        if (index > -1) {
            activeToasts.splice(index, 1);
        }
        
        // Animate out
        addClass(toast, 'translate-x-full', 'opacity-0');
        removeClass(toast, 'translate-x-0', 'opacity-100');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
            
            // Clean up container if empty
            if (container.children.length === 0) {
                container.remove();
                delete containers[config.position];
            }
            
            // Call onClose callback
            if (typeof config.onClose === 'function') {
                config.onClose();
            }
        }, 300);
    }
    
    // Bind close button
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            close();
        });
    }
    
    // Store reference
    const toastRef = {
        element: toast,
        close,
        update: (newOptions) => {
            if (newOptions.message) {
                messageEl.textContent = newOptions.message;
            }
            if (newOptions.title) {
                const titleEl = toast.querySelector('.font-semibold');
                if (titleEl) {
                    titleEl.textContent = newOptions.title;
                }
            }
        }
    };
    
    activeToasts.push(toastRef);
    
    return toastRef;
}

/**
 * Gets or creates a toast container for a position
 * @param {string} position - Container position
 * @returns {HTMLElement} Container element
 */
function getContainer(position) {
    if (containers[position]) {
        return containers[position];
    }
    
    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4'
    };
    
    const container = createElement('div', {
        classes: [
            'fixed',
            'z-[200]',
            'flex',
            'flex-col',
            'gap-3',
            'pointer-events-none',
            positionClasses[position] || positionClasses['top-right']
        ],
        styles: {
            pointerEvents: 'none'
        }
    });
    
    // Enable pointer events on children
    container.style.setProperty('--tw-pointer-events', 'auto');
    
    document.body.appendChild(container);
    containers[position] = container;
    
    return container;
}

/**
 * Clears all active toasts
 */
export function clearAllToasts() {
    activeToasts.slice().forEach(toast => {
        if (toast.close) {
            toast.close();
        }
    });
}

/**
 * Shows a success toast (convenience method)
 * @param {string} message - Toast message
 * @param {Object} [options] - Additional options
 */
export function showSuccess(message, options = {}) {
    return showToast({ type: 'success', message, ...options });
}

/**
 * Shows an error toast (convenience method)
 * @param {string} message - Toast message
 * @param {Object} [options] - Additional options
 */
export function showError(message, options = {}) {
    return showToast({ type: 'error', message, ...options });
}

/**
 * Shows a warning toast (convenience method)
 * @param {string} message - Toast message
 * @param {Object} [options] - Additional options
 */
export function showWarning(message, options = {}) {
    return showToast({ type: 'warning', message, ...options });
}

/**
 * Shows an info toast (convenience method)
 * @param {string} message - Toast message
 * @param {Object} [options] - Additional options
 */
export function showInfo(message, options = {}) {
    return showToast({ type: 'info', message, ...options });
}

// Default export
export default {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllToasts,
    TOAST_TYPES,
    MAX_TOASTS
};
