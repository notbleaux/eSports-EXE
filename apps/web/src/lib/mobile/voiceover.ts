// @ts-nocheck
/** [Ver001.000]
 *
 * VoiceOver Support Library
 * 
 * iOS VoiceOver specific optimizations and attributes for the NJZiteGeisTe Platform.
 * Provides Rotor navigation, custom actions, and region announcements.
 * 
 * @module lib/mobile/voiceover
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * VoiceOver Rotor configuration options
 */
export interface VoiceOverRotorConfig {
  /** Rotor category name */
  name: string;
  /** Items in the rotor */
  items: VoiceOverRotorItem[];
  /** Default selected index */
  defaultIndex?: number;
}

/**
 * VoiceOver Rotor item
 */
export interface VoiceOverRotorItem {
  /** Item label */
  label: string;
  /** Item value/identifier */
  value: string;
  /** Action callback when selected */
  onSelect: () => void;
}

/**
 * VoiceOver custom action
 */
export interface VoiceOverCustomAction {
  /** Action name */
  name: string;
  /** Action identifier */
  id: string;
  /** Whether action is enabled */
  enabled?: boolean;
  /** Action handler */
  handler: () => void;
}

/**
 * VoiceOver region configuration
 */
export interface VoiceOverRegionConfig {
  /** Region identifier */
  id: string;
  /** Region label */
  label: string;
  /** Region description */
  description?: string;
  /** Whether region is atomic */
  atomic?: boolean;
  /** Custom traits */
  traits?: VoiceOverTrait[];
}

/**
 * VoiceOver traits for element accessibility
 */
export type VoiceOverTrait = 
  | 'button'
  | 'link'
  | 'header'
  | 'searchField'
  | 'image'
  | 'selected'
  | 'playsSound'
  | 'keyboardKey'
  | 'staticText'
  | 'summaryElement'
  | 'notEnabled'
  | 'updatesFrequently'
  | 'startsMediaSession'
  | 'adjustable'
  | 'allowsDirectInteraction'
  | 'causesPageTurn'
  | 'tabBar'
  | 'list';

/**
 * VoiceOver announcement priority
 */
export type VoiceOverPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * VoiceOver announcement options
 */
export interface VoiceOverAnnouncementOptions {
  /** Announcement text */
  text: string;
  /** Announcement priority */
  priority?: VoiceOverPriority;
  /** Delay before announcing (ms) */
  delay?: number;
  /** Interrupt current speech */
  interrupt?: boolean;
  /** Language code */
  language?: string;
}

/**
 * VoiceOver state
 */
export interface VoiceOverState {
  /** Whether VoiceOver is enabled */
  enabled: boolean;
  /** Currently focused element */
  focusedElement: Element | null;
  /** Current rotor category */
  currentRotor: string | null;
  /** Speaking rate (0.0 - 1.0) */
  speakingRate: number;
  /** Pitch multiplier */
  pitchMultiplier: number;
  /** Volume (0.0 - 1.0) */
  volume: number;
  /** Using audio ducking */
  duckingEnabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * VoiceOver specific CSS that improves accessibility
 */
export const VOICEOVER_CSS = `
  /* Ensure VoiceOver can properly identify interactive elements */
  [role="button"],
  [role="link"],
  button,
  a {
    cursor: pointer;
  }
  
  /* Prevent VoiceOver from reading decorative elements */
  [aria-hidden="true"] {
    speak: none;
  }
  
  /* Ensure proper focus visibility for VoiceOver navigation */
  :focus-visible {
    outline: 2px solid #00d4ff;
    outline-offset: 2px;
  }
  
  /* VoiceOver rotor hint styling */
  [data-voiceover-rotor="true"] {
    position: relative;
  }
  
  /* Hide elements visually but keep them accessible to VoiceOver */
  .voiceover-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

/**
 * VoiceOver trait to ARIA role mapping
 */
export const TRAIT_TO_ROLE: Record<VoiceOverTrait, string> = {
  button: 'button',
  link: 'link',
  header: 'heading',
  searchField: 'searchbox',
  image: 'img',
  selected: 'option',
  playsSound: 'application',
  keyboardKey: 'button',
  staticText: 'text',
  summaryElement: 'complementary',
  notEnabled: 'presentation',
  updatesFrequently: 'status',
  startsMediaSession: 'application',
  adjustable: 'slider',
  allowsDirectInteraction: 'application',
  causesPageTurn: 'document',
  tabBar: 'tablist',
  list: 'list',
};

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Detect if VoiceOver is enabled on iOS/macOS
 * Uses heuristics since direct detection isn't always reliable
 */
export function isVoiceOverEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for iOS/macOS
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  if (!isApple) return false;
  
  // Check for touch accessibility API (iOS)
  if ('ontouchstart' in window) {
    // VoiceOver often changes touch behavior
    try {
      const touchEvent = document.createEvent('TouchEvent');
      touchEvent.initTouchEvent('touchstart', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, [], []);
    } catch {
      // VoiceOver may modify touch events
    }
  }
  
  // Check for WebKit specific accessibility features
  // _hasAccessibility would check: 'webkitSpeechGrammarList' in window || 'speechSynthesis' in window
  
  // Use screen reader detection API if available
  if ('matchMedia' in window) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Multiple accessibility features enabled suggests screen reader
    if (prefersReducedMotion && prefersHighContrast) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect iOS version for VoiceOver specific behaviors
 */
export function getIOSVersion(): number | null {
  if (typeof window === 'undefined') return null;
  
  const match = navigator.userAgent.match(/OS (\d+)[_\d]* like Mac OS X/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if device supports advanced VoiceOver features
 */
export function supportsAdvancedVoiceOver(): boolean {
  const version = getIOSVersion();
  return version !== null && version >= 14;
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/**
 * Queue for managing VoiceOver announcements
 */
class VoiceOverAnnouncementQueue {
  private queue: VoiceOverAnnouncementOptions[] = [];
  private isSpeaking = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Add announcement to queue
   */
  announce(options: VoiceOverAnnouncementOptions): void {
    if (options.interrupt) {
      this.clear();
    }
    
    this.queue.push(options);
    this.processQueue();
  }

  /**
   * Clear all pending announcements
   */
  clear(): void {
    this.queue = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isSpeaking = false;
    
    // Cancel any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Process announcement queue
   */
  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0) return;
    
    const next = this.queue.shift();
    if (!next) return;
    
    this.isSpeaking = true;
    
    const speak = () => {
      this.speak(next.text, next.language);
      
      this.timeoutId = setTimeout(() => {
        this.isSpeaking = false;
        this.processQueue();
      }, this.estimateDuration(next.text));
    };
    
    if (next.delay && next.delay > 0) {
      this.timeoutId = setTimeout(speak, next.delay);
    } else {
      speak();
    }
  }

  /**
   * Estimate speech duration based on text length
   */
  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length;
    const msPerWord = 400; // Conservative estimate
    return Math.max(1000, words * msPerWord);
  }

  /**
   * Use speech synthesis to speak text
   */
  private speak(text: string, language?: string): void {
    if (!('speechSynthesis' in window)) {
      // Fallback: use aria-live region
      this.updateLiveRegion(text);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (language) {
      utterance.lang = language;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Update aria-live region as fallback
   */
  private updateLiveRegion(text: string): void {
    const liveRegion = document.getElementById('voiceover-live-region') || 
                       this.createLiveRegion();
    liveRegion.textContent = text;
  }

  /**
   * Create aria-live region for announcements
   */
  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.id = 'voiceover-live-region';
    region.setAttribute('aria-live', 'assertive');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'voiceover-only';
    document.body.appendChild(region);
    return region;
  }
}

// Global announcement queue instance
const announcementQueue = new VoiceOverAnnouncementQueue();

/**
 * Make an announcement via VoiceOver
 */
export function announceToVoiceOver(options: VoiceOverAnnouncementOptions | string): void {
  const opts = typeof options === 'string' ? { text: options } : options;
  announcementQueue.announce(opts);
}

/**
 * Stop all VoiceOver announcements
 */
export function stopVoiceOverAnnouncements(): void {
  announcementQueue.clear();
}

// ============================================================================
// ROTOR NAVIGATION
// ============================================================================

/**
 * Create rotor configuration for common UI patterns
 */
export function createRotorConfig(
  type: 'navigation' | 'headers' | 'links' | 'formControls' | 'custom',
  items?: VoiceOverRotorItem[]
): VoiceOverRotorConfig {
  const configs: Record<string, VoiceOverRotorConfig> = {
    navigation: {
      name: 'Navigation',
      items: items || [],
    },
    headers: {
      name: 'Headings',
      items: items || [],
    },
    links: {
      name: 'Links',
      items: items || [],
    },
    formControls: {
      name: 'Form Controls',
      items: items || [],
    },
    custom: {
      name: 'Custom',
      items: items || [],
    },
  };
  
  return configs[type];
}

/**
 * Setup Rotor navigation for a container
 */
export function setupRotorNavigation(
  container: HTMLElement,
  config: VoiceOverRotorConfig
): () => void {
  // Mark elements with rotor data attributes
  const elements = container.querySelectorAll(`[data-rotor-category="${config.name}"]`);
  
  elements.forEach((el, index) => {
    el.setAttribute('data-rotor-index', String(index));
    if (index === (config.defaultIndex || 0)) {
      el.setAttribute('data-rotor-selected', 'true');
    }
  });
  
  // Return cleanup function
  return () => {
    elements.forEach(el => {
      el.removeAttribute('data-rotor-index');
      el.removeAttribute('data-rotor-selected');
    });
  };
}

// ============================================================================
// CUSTOM ACTIONS
// ============================================================================

/**
 * Generate ARIA attributes for custom actions
 */
export function getCustomActionAttributes(
  actions: VoiceOverCustomAction[]
): Record<string, string> {
  const enabledActions = actions.filter(a => a.enabled !== false);
  
  return {
    'aria-haspopup': enabledActions.length > 0 ? 'true' : 'false',
    'data-custom-actions': enabledActions.map(a => a.id).join(','),
    'data-custom-action-labels': enabledActions.map(a => a.name).join(','),
  };
}

/**
 * Execute custom action by ID
 */
export function executeCustomAction(
  actions: VoiceOverCustomAction[],
  actionId: string
): boolean {
  const action = actions.find(a => a.id === actionId && a.enabled !== false);
  if (action) {
    action.handler();
    return true;
  }
  return false;
}

// ============================================================================
// REGION ANNOUNCEMENTS
// ============================================================================

/**
 * Create region configuration with proper ARIA attributes
 */
export function createRegionConfig(
  id: string,
  label: string,
  options: Partial<VoiceOverRegionConfig> = {}
): VoiceOverRegionConfig {
  return {
    id,
    label,
    description: options.description,
    atomic: options.atomic ?? true,
    traits: options.traits,
  };
}

/**
 * Get ARIA attributes for a region
 */
export function getRegionAttributes(
  config: VoiceOverRegionConfig
): Record<string, string> {
  const attrs: Record<string, string> = {
    'id': config.id,
    'aria-label': config.label,
    'role': 'region',
  };
  
  if (config.description) {
    attrs['aria-description'] = config.description;
  }
  
  if (config.atomic) {
    attrs['aria-atomic'] = 'true';
  }
  
  if (config.traits?.includes('header')) {
    attrs['role'] = 'banner';
  }
  
  return attrs;
}

/**
 * Announce region change to VoiceOver
 */
export function announceRegionChange(
  _regionId: string,
  regionLabel: string
): void {
  announceToVoiceOver({
    text: `${regionLabel}, region`,
    priority: 'normal',
    interrupt: false,
  });
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook for VoiceOver integration
 */
export function useVoiceOver() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [focusedElement, setFocusedElement] = useState<Element | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Check initial state
    setIsEnabled(isVoiceOverEnabled());

    // Listen for focus changes
    const handleFocus = (e: FocusEvent) => {
      setFocusedElement(e.target as Element);
    };

    // Listen for VoiceOver specific events
    const handleVoiceOverNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.enabled !== undefined) {
        setIsEnabled(customEvent.detail.enabled);
      }
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('voiceoverstatechange', handleVoiceOverNotification);

    // Polling for VoiceOver state (since there's no reliable API)
    const pollInterval = setInterval(() => {
      const currentlyEnabled = isVoiceOverEnabled();
      if (currentlyEnabled !== isEnabled) {
        setIsEnabled(currentlyEnabled);
      }
    }, 5000);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('voiceoverstatechange', handleVoiceOverNotification);
      clearInterval(pollInterval);
      listenersRef.current.forEach(cleanup => cleanup());
    };
  }, [isEnabled]);

  /**
   * Announce to VoiceOver
   */
  const announce = useCallback((options: VoiceOverAnnouncementOptions | string) => {
    announceToVoiceOver(options);
  }, []);

  /**
   * Setup rotor for a container
   */
  const setupRotor = useCallback((
    containerRef: React.RefObject<HTMLElement>,
    config: VoiceOverRotorConfig
  ) => {
    if (!containerRef.current) return () => {};
    
    const cleanup = setupRotorNavigation(containerRef.current, config);
    listenersRef.current.push(cleanup);
    return cleanup;
  }, []);

  /**
   * Focus and announce an element
   */
  const focusAndAnnounce = useCallback((
    element: HTMLElement,
    announcement?: string
  ) => {
    element.focus();
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    if (announcement) {
      announce(announcement);
    }
  }, [announce]);

  return {
    isEnabled,
    focusedElement,
    announce,
    setupRotor,
    focusAndAnnounce,
    stopAnnouncements: stopVoiceOverAnnouncements,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Optimize element for VoiceOver navigation
 */
export function optimizeForVoiceOver(element: HTMLElement): void {
  // Ensure element has proper role
  if (!element.getAttribute('role')) {
    const tagName = element.tagName.toLowerCase();
    const implicitRoles: Record<string, string> = {
      button: 'button',
      a: 'link',
      input: 'textbox',
      select: 'combobox',
      textarea: 'textbox',
      nav: 'navigation',
      main: 'main',
      aside: 'complementary',
      header: 'banner',
      footer: 'contentinfo',
    };
    
    if (implicitRoles[tagName]) {
      element.setAttribute('role', implicitRoles[tagName]);
    }
  }
  
  // Ensure element has accessible name
  if (!element.getAttribute('aria-label') && 
      !element.getAttribute('aria-labelledby') &&
      !element.textContent?.trim()) {
    const ariaLabel = element.getAttribute('title') || 
                     element.getAttribute('placeholder') ||
                     'Interactive element';
    element.setAttribute('aria-label', ariaLabel);
  }
  
  // Ensure element is focusable
  if (!element.hasAttribute('tabindex') && 
      !['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
    element.setAttribute('tabindex', '0');
  }
}

/**
 * Create VoiceOver-friendly label for complex elements
 */
export function createAccessibleLabel(
  primary: string,
  secondary?: string,
  state?: string
): string {
  const parts = [primary];
  
  if (secondary) {
    parts.push(secondary);
  }
  
  if (state) {
    parts.push(state);
  }
  
  return parts.join(', ');
}

/**
 * Format number for VoiceOver (adds natural pauses)
 */
export function formatNumberForVoiceOver(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
}

/**
 * Format percentage for VoiceOver
 */
export function formatPercentageForVoiceOver(
  value: number,
  includeDecimal = false
): string {
  const formatted = includeDecimal ? value.toFixed(1) : Math.round(value).toString();
  return `${formatted} percent`;
}

export default {
  isVoiceOverEnabled,
  announceToVoiceOver,
  useVoiceOver,
  createRotorConfig,
  createRegionConfig,
  optimizeForVoiceOver,
};
