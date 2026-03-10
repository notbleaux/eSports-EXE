[Ver003.000]
/**
 * Utilities Index
 * ===============
 * Central export point for all utility modules.
 * 
 * @module utils
 * @version 1.0.0
 */

// Import all utility modules
import * as dom from './dom.js';
import * as animations from './animations.js';
import * as storage from './storage.js';

// Re-export all utilities
export { dom, animations, storage };

// Default export with all utilities
export default {
    dom,
    animations,
    storage
};
