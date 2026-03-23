[Ver001.000]

/**
 * useMobileScreenReader Hook
 * 
 * Unified mobile screen reader detection and management for iOS VoiceOver
 * and Android TalkBack. Detects active screen reader, tracks state, and
 * optimizes the experience for mobile accessibility.
 * 
 * Integrates with TL-A2 2-A touch gestures and extends TL-A1 accessibility.
 * 
 * @module hooks/useMobileScreenReader
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isVoiceOverEnabled,
  announceToVoiceOver,
  VoiceOverAnnouncementOptions,
  VoiceOverState,
} from '../lib/mobile/voiceover';
import {
  isTalkBackEnabled,
  announceToTalkBack,
  TalkBackAnnouncementOptions,
  TalkBackState,
} from '../lib/mobile/talkback';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Screen reader types
 */
export type ScreenReaderType = 'voiceover' | 'talkback' | 'unknown' | null;

/**
 * Screen reader state
 */
export interface MobileScreenReaderState {
  /** Whether any screen reader is enabled */
  enabled: boolean;
  /** Which screen reader is active */
  type: ScreenReaderType;
  /** Screen reader is ready for interaction */
  ready: boolean;
  /** Currently focused element */
  focusedElement: Element | null;
  /** Whether audio feedback is muted */
  audioMuted: boolean;
  /** Navigation granularity level */
  granularity: 'default' | 'fine' | 'coarse';
  /** Current page/region being announced */
  currentRegion: string | null;
  /** Last announcement made */
  lastAnnouncement: string | null;
  /** Touch exploration mode active */
  touchExploration: boolean;
}

/**
 * Screen reader announcement options
 */
export interface MobileAnnouncementOptions {
  /** Announcement text */
  text: string;
  /** Screen reader type to target (defaults to detected) */
  target?: ScreenReaderType;
  /** Priority level */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  /** Interrupt current speech */
  interrupt?: boolean;
  /** Delay before announcing (ms) */
  delay?: number;
  /** Queue this announcement */
  queue?: boolean;
  /** Vibration pattern */
  vibration?: number | number[];
}

/**
 * Screen reader navigation options
 */
export interface ScreenReaderNavigationOptions {
  /** Target element or selector */
  target: HTMLElement | string;
  /** Announcement text after navigation */
  announcement?: string;
  /** Focus delay (ms) */
  focusDelay?: number;
  /** Scroll into view */
  scrollIntoView?: boolean;
}

/**
 * Page change announcement options
 */
export interface PageChangeOptions {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Page type */
  type?: 'page' | 'modal' | 'dialog' | 'region' | 'route';
  /** Whether to announce loading state first */
  announceLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Whether to clear previous announcements */
  clearQueue?: boolean;
}

/**
 * Focus trap configuration for modals/dialogs
 */
export interface FocusTrapConfig {
  /** Container element */
  container: HTMLElement;
  /** Initial focus element */
  initialFocus?: HTMLElement;
  /** Elements to exclude from tab order */
  exclude?: string[];
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Announce when trap activates */
  announceOnActivate?: boolean;
}

/**
 * Hook return type
 */
export interface UseMobileScreenReaderReturn {
  /** Current screen reader state */
  state: MobileScreenReaderState;
  /** Make an announcement */
  announce: (options: MobileAnnouncementOptions | string) => void;
  /** Navigate to element with announcement */
  navigateTo: (options: ScreenReaderNavigationOptions) => void;
  /** Announce page/region change */
  announcePageChange: (options: PageChangeOptions) => void;
  /** Focus element with announcement */
  focusAndAnnounce: (element: HTMLElement, announcement?: string) => void;
  /** Enable touch exploration mode */
  enableTouchExploration: () => void;
  /** Disable touch exploration mode */
  disableTouchExploration: () => void;
  /** Trap focus within container */
  trapFocus: (config: FocusTrapConfig) => () => void;
  /** Stop all announcements */
  stopAnnouncements: () => void;
  /** Check if specific reader is active */
  isActive: (type: ScreenReaderType) => boolean;
  /** Get optimized touch target size */
  getTouchTargetSize: () => number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum touch target size for screen reader users */
const SCREEN_READER_TOUCH_TARGET = 48;

/** Larger touch target for better accessibility */
const LARGE_TOUCH_TARGET = 56;

/** Announcement queue maximum size */
const MAX_QUEUE_SIZE = 10;

// ============================================================================
// SCREEN READER DETECTION
// ============================================================================

/**
 * Detect which screen reader is active
 */
function detectScreenReader(): ScreenReaderType {
  if (typeof window === 'undefined') return null;
  
  // Check VoiceOver first (iOS/macOS)
  if (isVoiceOverEnabled()) {
    return 'voiceover';
  }
  
  // Check TalkBack (Android)
  if (isTalkBackEnabled()) {
    return 'talkback';
  }
  
  // Additional heuristics for unknown screen readers
  const hasAccessibilityFeatures = 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia?.('(prefers-contrast: high)').matches ||
    window.matchMedia?.('(forced-colors: active)').matches;
  
  if (hasAccessibilityFeatures) {
    return 'unknown';
  }
  
  return null;
}

// ============================================================================
// ANNOUNCEMENT QUEUE
// ============================================================================

/**
 * Announcement queue manager
 */
class AnnouncementQueue {
  private queue: MobileAnnouncementOptions[] = [];
  private processing = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Add announcement to queue
   */
  add(options: MobileAnnouncementOptions): void {
    if (options.interrupt) {
      this.clear();
    }
    
    // Prevent queue overflow
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift();
    }
    
    this.queue.push(options);
    
    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Clear all announcements
   */
  clear(): void {
    this.queue = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.processing = false;
    
    // Cancel speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Process next announcement in queue
   */
  private process(): void {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const next = this.queue.shift();
    
    if (!next) {
      this.processing = false;
      return;
    }
    
    // Determine screen reader type
    const targetType = next.target || detectScreenReader();
    
    // Announce based on target
    if (targetType === 'voiceover') {
      const voOptions: VoiceOverAnnouncementOptions = {
        text: next.text,
        priority: next.priority,
        delay: next.delay,
        interrupt: next.interrupt,
      };
      announceToVoiceOver(voOptions);
    } else if (targetType === 'talkback') {
      const tbOptions: TalkBackAnnouncementOptions = {
        text: next.text,
        queue: next.queue,
        priority: next.priority,
        vibration: next.vibration,
      };
      announceToTalkBack(tbOptions);
    } else {
      // Fallback: use both methods
      announceToVoiceOver(next.text);
      announceToTalkBack(next.text);
    }
    
    // Schedule next
    const duration = this.estimateDuration(next.text);
    this.timeoutId = setTimeout(() => {
      this.process();
    }, (next.delay || 0) + duration);
  }

  /**
   * Estimate announcement duration
   */
  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute = 400ms per word
    const words = text.split(/\s+/).length;
    return Math.max(1000, words * 400);
  }
}

// Global queue instance
const globalQueue = new AnnouncementQueue();

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Create focus trap for modals/dialogs
 */
function createFocusTrap(config: FocusTrapConfig): () => void {
  const { container, initialFocus, exclude = [], onEscape, announceOnActivate } = config;
  
  // Store previously focused element
  const previousFocus = document.activeElement as HTMLElement;
  
  // Get focusable elements
  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    '[contenteditable]:not([aria-hidden="true"])',
  ];
  
  const getFocusableElements = (): HTMLElement[] => {
    const elements = Array.from(
      container.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
    
    return elements.filter(el => {
      // Exclude specified selectors
      return !exclude.some(sel => el.matches(sel));
    });
  };
  
  let focusableElements = getFocusableElements();
  let currentIndex = 0;
  
  // Set initial focus
  if (initialFocus) {
    currentIndex = focusableElements.indexOf(initialFocus);
    initialFocus.focus();
  } else if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
  
  // Announce activation
  if (announceOnActivate) {
    const announcement = container.getAttribute('aria-label') || 
                        container.getAttribute('aria-labelledby') ||
                        'Dialog opened';
    announceToTalkBack(announcement);
  }
  
  // Handle keydown for focus trapping
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Update focusable elements (DOM may have changed)
      focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) return;
      
      if (e.shiftKey) {
        // Move backwards
        currentIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      } else {
        // Move forwards
        currentIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      }
      
      focusableElements[currentIndex].focus();
    }
    
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  };
  
  // Handle focus leaving container
  const handleFocusOut = (e: FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    if (!container.contains(relatedTarget)) {
      // Refocus to container
      if (focusableElements.length > 0) {
        focusableElements[currentIndex].focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  container.addEventListener('focusout', handleFocusOut);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    container.removeEventListener('focusout', handleFocusOut);
    
    // Restore previous focus
    previousFocus?.focus();
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * React hook for mobile screen reader support
 */
export function useMobileScreenReader(): UseMobileScreenReaderReturn {
  const [state, setState] = useState<MobileScreenReaderState>({
    enabled: false,
    type: null,
    ready: false,
    focusedElement: null,
    audioMuted: false,
    granularity: 'default',
    currentRegion: null,
    lastAnnouncement: null,
    touchExploration: false,
  });
  
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initial detection
    const detectedType = detectScreenReader();
    const isEnabled = detectedType !== null;
    
    setState(prev => ({
      ...prev,
      enabled: isEnabled,
      type: detectedType,
      ready: true,
    }));
    
    // Listen for focus changes
    const handleFocusIn = (e: FocusEvent) => {
      setState(prev => ({
        ...prev,
        focusedElement: e.target as Element,
      }));
    };
    
    const handleFocusOut = () => {
      setState(prev => ({
        ...prev,
        focusedElement: null,
      }));
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    // Polling for screen reader state changes
    const pollInterval = setInterval(() => {
      const currentType = detectScreenReader();
      const currentlyEnabled = currentType !== null;
      
      setState(prev => {
        if (prev.enabled !== currentlyEnabled || prev.type !== currentType) {
          return {
            ...prev,
            enabled: currentlyEnabled,
            type: currentType,
          };
        }
        return prev;
      });
    }, 5000);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      clearInterval(pollInterval);
      cleanupRef.current?.();
    };
  }, []);

  /**
   * Make an announcement
   */
  const announce = useCallback((options: MobileAnnouncementOptions | string) => {
    const opts = typeof options === 'string' ? { text: options } : options;
    
    setState(prev => ({
      ...prev,
      lastAnnouncement: opts.text,
    }));
    
    globalQueue.add(opts);
  }, []);

  /**
   * Navigate to element with optional announcement
   */
  const navigateTo = useCallback((options: ScreenReaderNavigationOptions) => {
    const target = typeof options.target === 'string'
      ? document.querySelector(options.target) as HTMLElement
      : options.target;
    
    if (!target) return;
    
    const { focusDelay = 0, scrollIntoView = true, announcement } = options;
    
    setTimeout(() => {
      if (scrollIntoView) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      
      target.focus();
      
      if (announcement) {
        announce(announcement);
      }
    }, focusDelay);
  }, [announce]);

  /**
   * Announce page/region change
   */
  const announcePageChange = useCallback((options: PageChangeOptions) => {
    if (options.clearQueue) {
      globalQueue.clear();
    }
    
    if (options.announceLoading && options.loadingMessage) {
      announce({
        text: options.loadingMessage,
        interrupt: true,
      });
    }
    
    // Build announcement
    const parts: string[] = [options.title];
    
    if (options.description) {
      parts.push(options.description);
    }
    
    if (options.type === 'page') {
      parts.push('page');
    } else if (options.type === 'modal' || options.type === 'dialog') {
      parts.push('dialog');
    } else if (options.type === 'region') {
      parts.push('region');
    }
    
    const text = parts.join(', ');
    
    setState(prev => ({
      ...prev,
      currentRegion: options.title,
      lastAnnouncement: text,
    }));
    
    // Delay page announcement to let loading finish
    setTimeout(() => {
      announce({
        text,
        interrupt: true,
        priority: 'high',
      });
    }, options.announceLoading ? 500 : 0);
  }, [announce]);

  /**
   * Focus element with announcement
   */
  const focusAndAnnounce = useCallback((
    element: HTMLElement,
    announcement?: string
  ) => {
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    element.focus();
    
    if (announcement) {
      announce(announcement);
    } else {
      // Announce element content
      const text = element.getAttribute('aria-label') ||
                   element.textContent ||
                   'Element focused';
      announce(text);
    }
  }, [announce]);

  /**
   * Enable touch exploration mode
   */
  const enableTouchExploration = useCallback(() => {
    setState(prev => ({
      ...prev,
      touchExploration: true,
    }));
    
    announce({
      text: 'Touch exploration enabled. Tap and hold to explore.',
      priority: 'high',
    });
    
    // Add touch exploration class to body
    document.body.classList.add('touch-exploration-active');
  }, [announce]);

  /**
   * Disable touch exploration mode
   */
  const disableTouchExploration = useCallback(() => {
    setState(prev => ({
      ...prev,
      touchExploration: false,
    }));
    
    document.body.classList.remove('touch-exploration-active');
  }, []);

  /**
   * Trap focus within container
   */
  const trapFocus = useCallback((config: FocusTrapConfig) => {
    // Clean up previous trap
    cleanupRef.current?.();
    
    cleanupRef.current = createFocusTrap(config);
    
    return cleanupRef.current;
  }, []);

  /**
   * Stop all announcements
   */
  const stopAnnouncements = useCallback(() => {
    globalQueue.clear();
  }, []);

  /**
   * Check if specific screen reader is active
   */
  const isActive = useCallback((type: ScreenReaderType): boolean => {
    return state.type === type;
  }, [state.type]);

  /**
   * Get optimized touch target size based on screen reader state
   */
  const getTouchTargetSize = useCallback((): number => {
    if (!state.enabled) return SCREEN_READER_TOUCH_TARGET;
    
    // Larger targets for screen reader users
    return state.touchExploration ? LARGE_TOUCH_TARGET : SCREEN_READER_TOUCH_TARGET;
  }, [state.enabled, state.touchExploration]);

  return {
    state,
    announce,
    navigateTo,
    announcePageChange,
    focusAndAnnounce,
    enableTouchExploration,
    disableTouchExploration,
    trapFocus,
    stopAnnouncements,
    isActive,
    getTouchTargetSize,
  };
}

export default useMobileScreenReader;
