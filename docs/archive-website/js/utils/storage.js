[Ver001.000]
/**
 * Storage Utilities
 * =================
 * Helper functions for localStorage, sessionStorage,
 * and session management with error handling.
 * 
 * @module utils/storage
 * @version 1.0.0
 */

const STORAGE_PREFIX = 'sator_';

/**
 * Checks if localStorage is available
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Checks if sessionStorage is available
 * @returns {boolean}
 */
function isSessionStorageAvailable() {
    try {
        const test = '__storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Gets an item from localStorage with JSON parsing
 * @param {string} key - Storage key
 * @param {*} [defaultValue=null] - Default value if not found
 * @returns {*} Parsed value or default
 * 
 * @example
 * const user = getItem('user', { name: 'Guest' });
 */
export function getItem(key, defaultValue = null) {
    if (!isLocalStorageAvailable()) {
        return defaultValue;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const item = localStorage.getItem(prefixedKey);
        
        if (item === null) {
            return defaultValue;
        }
        
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Error reading from localStorage: ${error.message}`);
        return defaultValue;
    }
}

/**
 * Sets an item in localStorage with JSON serialization
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 * 
 * @example
 * setItem('user', { name: 'John', id: 123 });
 */
export function setItem(key, value) {
    if (!isLocalStorageAvailable()) {
        return false;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serialized = JSON.stringify(value);
        localStorage.setItem(prefixedKey, serialized);
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded');
        } else {
            console.warn(`Error writing to localStorage: ${error.message}`);
        }
        return false;
    }
}

/**
 * Removes an item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeItem(key) {
    if (!isLocalStorageAvailable()) {
        return false;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        localStorage.removeItem(prefixedKey);
        return true;
    } catch (error) {
        console.warn(`Error removing from localStorage: ${error.message}`);
        return false;
    }
}

/**
 * Clears all SATOR items from localStorage
 * @returns {boolean} Success status
 */
export function clear() {
    if (!isLocalStorageAvailable()) {
        return false;
    }
    
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return true;
    } catch (error) {
        console.warn(`Error clearing localStorage: ${error.message}`);
        return false;
    }
}

/**
 * Gets all SATOR keys from localStorage
 * @returns {string[]} Array of keys (without prefix)
 */
export function getKeys() {
    if (!isLocalStorageAvailable()) {
        return [];
    }
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key.slice(STORAGE_PREFIX.length));
        }
    }
    return keys;
}

/**
 * Gets session item (clears when browser closes)
 * @param {string} key - Session key
 * @param {*} [defaultValue=null] - Default value
 * @returns {*} Parsed value or default
 */
export function getSessionItem(key, defaultValue = null) {
    if (!isSessionStorageAvailable()) {
        return defaultValue;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const item = sessionStorage.getItem(prefixedKey);
        
        if (item === null) {
            return defaultValue;
        }
        
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Error reading from sessionStorage: ${error.message}`);
        return defaultValue;
    }
}

/**
 * Sets session item
 * @param {string} key - Session key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export function setSessionItem(key, value) {
    if (!isSessionStorageAvailable()) {
        return false;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        const serialized = JSON.stringify(value);
        sessionStorage.setItem(prefixedKey, serialized);
        return true;
    } catch (error) {
        console.warn(`Error writing to sessionStorage: ${error.message}`);
        return false;
    }
}

/**
 * Removes session item
 * @param {string} key - Session key
 * @returns {boolean} Success status
 */
export function removeSessionItem(key) {
    if (!isSessionStorageAvailable()) {
        return false;
    }
    
    try {
        const prefixedKey = STORAGE_PREFIX + key;
        sessionStorage.removeItem(prefixedKey);
        return true;
    } catch (error) {
        console.warn(`Error removing from sessionStorage: ${error.message}`);
        return false;
    }
}

/**
 * Session state management (stub for future auth integration)
 * Tracks basic session metadata without actual authentication
 */
export const session = {
    /**
     * Gets current session ID
     * @returns {string|null}
     */
    getId() {
        let sessionId = getSessionItem('session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            setSessionItem('session_id', sessionId);
        }
        return sessionId;
    },
    
    /**
     * Gets session start time
     * @returns {number} Timestamp
     */
    getStartTime() {
        let startTime = getSessionItem('session_start');
        if (!startTime) {
            startTime = Date.now();
            setSessionItem('session_start', startTime);
        }
        return startTime;
    },
    
    /**
     * Gets current HUB from session
     * @returns {string|null}
     */
    getCurrentHub() {
        return getSessionItem('current_hub', null);
    },
    
    /**
     * Sets current HUB in session
     * @param {string} hub - Hub identifier
     */
    setCurrentHub(hub) {
        setSessionItem('current_hub', hub);
    },
    
    /**
     * Gets session duration in milliseconds
     * @returns {number}
     */
    getDuration() {
        return Date.now() - this.getStartTime();
    },
    
    /**
     * Ends current session
     */
    end() {
        removeSessionItem('session_id');
        removeSessionItem('session_start');
        removeSessionItem('current_hub');
    }
};

/**
 * User preferences management
 */
export const preferences = {
    /**
     * Gets a preference value
     * @param {string} key - Preference key
     * @param {*} [defaultValue=null] - Default value
     * @returns {*}
     */
    get(key, defaultValue = null) {
        return getItem(`pref_${key}`, defaultValue);
    },
    
    /**
     * Sets a preference value
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     * @returns {boolean}
     */
    set(key, value) {
        return setItem(`pref_${key}`, value);
    },
    
    /**
     * Removes a preference
     * @param {string} key - Preference key
     * @returns {boolean}
     */
    remove(key) {
        return removeItem(`pref_${key}`);
    },
    
    /**
     * Gets all preferences
     * @returns {Object}
     */
    getAll() {
        const all = {};
        getKeys().forEach(key => {
            if (key.startsWith('pref_')) {
                all[key.slice(5)] = getItem(key);
            }
        });
        return all;
    },
    
    /**
     * Clears all preferences
     * @returns {boolean}
     */
    clear() {
        getKeys().forEach(key => {
            if (key.startsWith('pref_')) {
                removeItem(key);
            }
        });
        return true;
    }
};

/**
 * Cache management with TTL support
 */
export const cache = {
    /**
     * Sets a cached value with optional TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} [ttlMs] - Time to live in milliseconds
     * @returns {boolean}
     */
    set(key, value, ttlMs = null) {
        const item = {
            value,
            timestamp: Date.now(),
            ttl: ttlMs
        };
        return setItem(`cache_${key}`, item);
    },
    
    /**
     * Gets a cached value if not expired
     * @param {string} key - Cache key
     * @param {*} [defaultValue=null] - Default if not found/expired
     * @returns {*}
     */
    get(key, defaultValue = null) {
        const item = getItem(`cache_${key}`, null);
        
        if (!item) {
            return defaultValue;
        }
        
        // Check if expired
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            removeItem(`cache_${key}`);
            return defaultValue;
        }
        
        return item.value;
    },
    
    /**
     * Checks if cache entry exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key, undefined) !== undefined;
    },
    
    /**
     * Removes cached value
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    remove(key) {
        return removeItem(`cache_${key}`);
    },
    
    /**
     * Clears all cached values
     */
    clear() {
        getKeys().forEach(key => {
            if (key.startsWith('cache_')) {
                removeItem(key);
            }
        });
    }
};

/**
 * Generates a unique session ID
 * @returns {string}
 */
function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default export with all utilities
export default {
    getItem,
    setItem,
    removeItem,
    clear,
    getKeys,
    getSessionItem,
    setSessionItem,
    removeSessionItem,
    session,
    preferences,
    cache
};
