/**
 * State Manager - Cross-Hub State Management
 * Provides persistent storage and synchronization across all hubs
 */

class StateManagerClass {
  constructor() {
    this.prefix = 'satorx_';
    this.listeners = new Map();
    this.storage = window.localStorage;
    this.session = window.sessionStorage;
    
    // BroadcastChannel for cross-tab communication (if supported)
    this.channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('satorx_state');
      this.channel.onmessage = (event) => {
        this.handleBroadcast(event.data);
      };
    }
    
    this.init();
  }

  init() {
    // Set up storage event listener for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith(this.prefix)) {
        const key = e.key.replace(this.prefix, '');
        this.notify(key, this.parse(e.newValue));
      }
    });

    // Initialize default state
    this.setDefaultState();
  }

  /**
   * Set default state values
   */
  setDefaultState() {
    const defaults = {
      'user.theme': 'dark',
      'user.animations': true,
      'user.sound': false,
      'portal.lastVisit': null,
      'portal.visitCount': 0,
      'hub1.satorProgress': 0,
      'hub1.discoveredWords': [],
      'hub2.stats': {},
      'nav.history': []
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (this.get(key) === null) {
        this.set(key, value, { persist: true });
      }
    });
  }

  /**
   * Get a value from state
   */
  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    
    // Try localStorage first
    let value = this.storage.getItem(fullKey);
    
    // Fall back to sessionStorage
    if (value === null) {
      value = this.session.getItem(fullKey);
    }
    
    return value !== null ? this.parse(value) : defaultValue;
  }

  /**
   * Set a value in state
   */
  set(key, value, options = {}) {
    const { 
      persist = true,   // Use localStorage vs sessionStorage
      broadcast = true, // Broadcast to other tabs
      silent = false    // Don't trigger listeners
    } = options;
    
    const fullKey = this.prefix + key;
    const serialized = this.serialize(value);
    
    // Store in appropriate storage
    if (persist) {
      this.storage.setItem(fullKey, serialized);
    } else {
      this.session.setItem(fullKey, serialized);
    }
    
    // Broadcast to other tabs
    if (broadcast && this.channel) {
      this.channel.postMessage({ key, value, source: 'stateManager' });
    }
    
    // Notify local listeners
    if (!silent) {
      this.notify(key, value);
    }
    
    return this;
  }

  /**
   * Remove a value from state
   */
  remove(key) {
    const fullKey = this.prefix + key;
    this.storage.removeItem(fullKey);
    this.session.removeItem(fullKey);
    this.notify(key, null);
    return this;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Notify listeners of state change
   */
  notify(key, value) {
    // Notify exact key listeners
    this.listeners.get(key)?.forEach(cb => {
      try { cb(value, key); } catch (e) { console.error(e); }
    });
    
    // Notify wildcard listeners
    this.listeners.get('*')?.forEach(cb => {
      try { cb({ key, value }); } catch (e) { console.error(e); }
    });
  }

  /**
   * Handle broadcast messages from other tabs
   */
  handleBroadcast(data) {
    if (data.source === 'stateManager' && data.key) {
      this.notify(data.key, data.value);
    }
  }

  /**
   * Get all state keys matching a pattern
   */
  keys(pattern = null) {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        if (!pattern || cleanKey.includes(pattern)) {
          keys.push(cleanKey);
        }
      }
    }
    return keys;
  }

  /**
   * Get all state as an object
   */
  getAll() {
    const state = {};
    this.keys().forEach(key => {
      state[key] = this.get(key);
    });
    return state;
  }

  /**
   * Clear all state
   */
  clear() {
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.storage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < this.session.length; i++) {
      const key = this.session.key(i);
      if (key?.startsWith(this.prefix)) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => this.session.removeItem(key));
    
    this.listeners.clear();
  }

  /**
   * Serialize value for storage
   */
  serialize(value) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  /**
   * Parse stored value
   */
  parse(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  /**
   * Track navigation history
   */
  trackNavigation(from, to) {
    const history = this.get('nav.history', []);
    history.push({
      from,
      to,
      timestamp: Date.now(),
      url: window.location.href
    });
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }
    
    this.set('nav.history', history);
  }

  /**
   * Get navigation stats
   */
  getNavigationStats() {
    const history = this.get('nav.history', []);
    const hubVisits = {};
    
    history.forEach(entry => {
      hubVisits[entry.to] = (hubVisits[entry.to] || 0) + 1;
    });
    
    return {
      totalNavigations: history.length,
      hubVisits,
      lastVisit: history[history.length - 1] || null
    };
  }

  /**
   * Export state as JSON
   */
  export() {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import state from JSON
   */
  import(json) {
    try {
      const data = JSON.parse(json);
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (e) {
      console.error('Failed to import state:', e);
      return false;
    }
  }
}

// Create global instance
const StateManager = new StateManagerClass();
window.StateManager = StateManager;

// Track page visits
window.addEventListener('load', () => {
  const lastVisit = StateManager.get('portal.lastVisit');
  const visitCount = StateManager.get('portal.visitCount', 0);
  
  StateManager.set('portal.lastVisit', Date.now());
  StateManager.set('portal.visitCount', visitCount + 1);
  
  // Track which hub we're on
  const path = window.location.pathname;
  const hubMatch = path.match(/hub(\d)/);
  if (hubMatch) {
    StateManager.trackNavigation(lastVisit ? 'previous' : 'entry', `hub${hubMatch[1]}`);
  }
});
