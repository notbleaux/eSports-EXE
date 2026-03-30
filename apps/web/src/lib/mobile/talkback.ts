/** [Ver001.000]
 *
 * TalkBack Support Library
 * 
 * Android TalkBack specific optimizations and attributes for the NJZiteGeisTe Platform.
 * Provides custom traversal order, accessibility node info, and gesture handling.
 * 
 * @module lib/mobile/talkback
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * TalkBack traversal order configuration
 */
export interface TalkBackTraversalConfig {
  /** Container element */
  container: HTMLElement;
  /** Custom traversal order (element selectors or refs) */
  order?: string[] | HTMLElement[];
  /** Whether to use logical (vs visual) order */
  logicalOrder?: boolean;
  /** Custom focus callbacks */
  onFocus?: (element: HTMLElement) => void;
  onBlur?: (element: HTMLElement) => void;
}

/**
 * Accessibility node info for TalkBack
 */
export interface AccessibilityNodeInfo {
  /** Node class name */
  className?: string;
  /** Node text */
  text?: string;
  /** Node content description */
  contentDescription?: string;
  /** Whether node is clickable */
  clickable?: boolean;
  /** Whether node is focusable */
  focusable?: boolean;
  /** Whether node is checkable */
  checkable?: boolean;
  /** Whether node is checked */
  checked?: boolean;
  /** Whether node is enabled */
  enabled?: boolean;
  /** Node bounds */
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  /** Node actions */
  actions?: TalkBackAction[];
  /** Collection info for lists */
  collectionInfo?: {
    rowCount: number;
    columnCount: number;
    selectionMode: 'none' | 'single' | 'multiple';
  };
  /** Collection item info */
  collectionItemInfo?: {
    rowIndex: number;
    columnIndex: number;
    rowSpan: number;
    columnSpan: number;
    selected: boolean;
  };
}

/**
 * TalkBack action types
 */
export type TalkBackAction = 
  | 'focus'
  | 'clearFocus'
  | 'select'
  | 'clearSelection'
  | 'click'
  | 'longClick'
  | 'accessibilityFocus'
  | 'clearAccessibilityFocus'
  | 'nextAtMovementGranularity'
  | 'previousAtMovementGranularity'
  | 'nextHtmlElement'
  | 'previousHtmlElement'
  | 'scrollForward'
  | 'scrollBackward'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'setSelection'
  | 'expand'
  | 'collapse'
  | 'dismiss'
  | 'setText';

/**
 * TalkBack gesture types
 */
export type TalkBackGesture =
  | 'swipeUp'
  | 'swipeDown'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUpRight'
  | 'swipeDownRight'
  | 'swipeUpLeft'
  | 'swipeDownLeft'
  | 'singleTap'
  | 'doubleTap'
  | 'doubleTapHold'
  | 'tripleTap'
  | 'twoFingerSwipeUp'
  | 'twoFingerSwipeDown'
  | 'twoFingerSwipeLeft'
  | 'twoFingerSwipeRight'
  | 'twoFingerTap'
  | 'twoFingerDoubleTap'
  | 'threeFingerSwipeUp'
  | 'threeFingerSwipeDown'
  | 'threeFingerSwipeLeft'
  | 'threeFingerSwipeRight'
  | 'threeFingerTap'
  | 'fourFingerTap';

/**
 * TalkBack gesture handler
 */
export interface TalkBackGestureHandler {
  /** Gesture type */
  gesture: TalkBackGesture;
  /** Handler function */
  handler: (event: Event) => void;
  /** Priority (higher = processed first) */
  priority?: number;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
}

/**
 * TalkBack state
 */
export interface TalkBackState {
  /** Whether TalkBack is enabled */
  enabled: boolean;
  /** Currently focused node */
  focusedNode: AccessibilityNodeInfo | null;
  /** Current navigation granularity */
  granularity: 'default' | 'character' | 'word' | 'line' | 'paragraph' | 'page';
  /** Whether in continuous reading mode */
  continuousReading: boolean;
  /** Speech rate (0.5 - 2.0) */
  speechRate: number;
  /** Whether audio ducking is enabled */
  audioDuckingEnabled: boolean;
  /** Whether vibration feedback is enabled */
  vibrationFeedback: boolean;
}

/**
 * TalkBack announcement options
 */
export interface TalkBackAnnouncementOptions {
  /** Announcement text */
  text: string;
  /** Whether to queue or interrupt */
  queue?: boolean;
  /** Announcement priority */
  priority?: 'low' | 'normal' | 'high';
  /** Earcon (sound) to play */
  earcon?: string;
  /** Vibration pattern */
  vibration?: number | number[];
  /** Custom speech parameters */
  speechParams?: {
    pitch?: number;
    rate?: number;
    volume?: number;
  };
}

/**
 * Custom traversal strategy
 */
export type TraversalStrategy = 'row' | 'column' | 'flow' | 'custom';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * TalkBack specific CSS that improves accessibility
 */
export const TALKBACK_CSS = `
  /* Ensure TalkBack can properly identify interactive elements */
  [role="button"]:focus,
  [role="link"]:focus,
  button:focus,
  a:focus {
    outline: 3px solid #00d4ff;
    outline-offset: 2px;
  }
  
  /* TalkBack traversal highlight */
  [data-talkback-focus="true"] {
    outline: 2px dashed #ffd700;
    outline-offset: 2px;
    background-color: rgba(255, 215, 0, 0.1);
  }
  
  /* Prevent TalkBack from reading decorative elements */
  [aria-hidden="true"] {
    speak: never;
  }
  
  /* Ensure minimum touch target size for TalkBack */
  [role="button"],
  button,
  [role="link"],
  a,
  [tabindex]:not([tabindex="-1"]) {
    min-height: 48px;
    min-width: 48px;
  }
  
  /* TalkBack container styling */
  [data-talkback-container="true"] {
    contain: layout;
  }
  
  /* Hide from TalkBack but keep visual */
  .talkback-skip {
    aria-hidden: true;
  }
`;

/**
 * Default vibration patterns for TalkBack feedback
 */
export const TALKBACK_VIBRATIONS = {
  /** Light feedback for focus changes */
  focus: 15,
  /** Medium feedback for actions */
  action: [0, 30, 50, 30],
  /** Strong feedback for errors */
  error: [0, 100, 100, 100],
  /** Success feedback */
  success: [0, 50],
  /** Boundary reached */
  boundary: 10,
} as const;

/**
 * Earcon (sound) identifiers for TalkBack
 */
export const TALKBACK_EARCONS = {
  /** Focus moved */
  focus: 'focus',
  /** Action completed */
  action: 'action',
  /** Error occurred */
  error: 'error',
  /** Success */
  success: 'success',
  /** Warning */
  warning: 'warning',
  /** Scroll complete */
  scroll: 'scroll',
  /** Page change */
  page: 'page',
} as const;

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Detect if TalkBack is enabled on Android
 * Uses multiple heuristics for reliability
 */
export function isTalkBackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Android
  const isAndroid = /Android/.test(navigator.userAgent);
  if (!isAndroid) return false;
  
  // Check for accessibility features
  const hasAccessibility = 'ontouchstart' in window && 
                          navigator.maxTouchPoints > 0;
  
  // Check for Chrome accessibility features
  const isChrome = /Chrome/.test(navigator.userAgent);
  
  // Android accessibility often exposes these properties
  const hasTalkBack = 'AccessibilityEvent' in window || 
                     'accessibility' in navigator ||
                     (isAndroid && isChrome && hasAccessibility);
  
  // Check for screen reader preference
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  
  // Check for forced colors (high contrast mode often used with screen readers)
  const forcedColors = window.matchMedia?.('(forced-colors: active)').matches;
  
  return hasTalkBack || (prefersReducedMotion && forcedColors);
}

/**
 * Get Android version
 */
export function getAndroidVersion(): number | null {
  if (typeof window === 'undefined') return null;
  
  const match = navigator.userAgent.match(/Android (\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if device supports advanced TalkBack features
 */
export function supportsAdvancedTalkBack(): boolean {
  const version = getAndroidVersion();
  return version !== null && version >= 10;
}

/**
 * Check if device supports accessibility delegate API
 */
export function supportsAccessibilityDelegate(): boolean {
  return 'AccessibilityNodeInfo' in window || isTalkBackEnabled();
}

// ============================================================================
// TRAVERSAL ORDER
// ============================================================================

/**
 * Custom traversal order manager for TalkBack
 */
export class TalkBackTraversalManager {
  private container: HTMLElement | null = null;
  private order: HTMLElement[] = [];
  private currentIndex = -1;
  private listeners: (() => void)[] = [];

  /**
   * Initialize traversal order for a container
   */
  init(config: TalkBackTraversalConfig): () => void {
    this.container = config.container;
    
    // Build traversal order
    if (config.order) {
      this.order = config.order.map(el => 
        typeof el === 'string' 
          ? (this.container?.querySelector(el) as HTMLElement)
          : el
      ).filter(Boolean) as HTMLElement[];
    } else {
      // Auto-generate logical order
      this.order = this.generateLogicalOrder(config.container, config.logicalOrder);
    }
    
    // Mark elements with traversal data
    this.order.forEach((el, index) => {
      el.setAttribute('data-talkback-index', String(index));
      el.setAttribute('data-talkback-traversal', 'true');
    });
    
    // Setup focus tracking
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const index = this.order.indexOf(target);
      if (index !== -1) {
        this.currentIndex = index;
        config.onFocus?.(target);
        this.highlightElement(target);
      }
    };
    
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      config.onBlur?.(target);
      this.unhighlightElement(target);
    };
    
    config.container.addEventListener('focusin', handleFocus);
    config.container.addEventListener('focusout', handleBlur);
    
    const cleanup = () => {
      config.container.removeEventListener('focusin', handleFocus);
      config.container.removeEventListener('focusout', handleBlur);
      this.order.forEach(el => {
        el.removeAttribute('data-talkback-index');
        el.removeAttribute('data-talkback-traversal');
      });
    };
    
    this.listeners.push(cleanup);
    return cleanup;
  }

  /**
   * Generate logical traversal order
   */
  private generateLogicalOrder(
    container: HTMLElement,
    logical = true
  ): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])',
    ];
    
    const elements = Array.from(
      container.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
    
    if (logical) {
      // Sort by DOM position for logical order
      return elements.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    }
    
    return elements;
  }

  /**
   * Move to next element in traversal order
   */
  next(): HTMLElement | null {
    if (this.currentIndex < this.order.length - 1) {
      this.currentIndex++;
      const element = this.order[this.currentIndex];
      element?.focus();
      return element;
    }
    return null;
  }

  /**
   * Move to previous element in traversal order
   */
  previous(): HTMLElement | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const element = this.order[this.currentIndex];
      element?.focus();
      return element;
    }
    return null;
  }

  /**
   * Focus element at specific index
   */
  focusAt(index: number): HTMLElement | null {
    if (index >= 0 && index < this.order.length) {
      this.currentIndex = index;
      const element = this.order[index];
      element?.focus();
      return element;
    }
    return null;
  }

  /**
   * Get current element
   */
  getCurrent(): HTMLElement | null {
    return this.order[this.currentIndex] || null;
  }

  /**
   * Highlight element for TalkBack focus
   */
  private highlightElement(element: HTMLElement): void {
    element.setAttribute('data-talkback-focus', 'true');
  }

  /**
   * Remove highlight from element
   */
  private unhighlightElement(element: HTMLElement): void {
    element.removeAttribute('data-talkback-focus');
  }

  /**
   * Cleanup all listeners
   */
  destroy(): void {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }
}

/**
 * Create traversal manager instance
 */
export function createTraversalManager(): TalkBackTraversalManager {
  return new TalkBackTraversalManager();
}

// ============================================================================
// ACCESSIBILITY NODE INFO
// ============================================================================

/**
 * Build accessibility node info for an element
 */
export function buildNodeInfo(element: HTMLElement): AccessibilityNodeInfo {
  const rect = element.getBoundingClientRect();
  
  const info: AccessibilityNodeInfo = {
    className: element.className,
    text: element.textContent?.trim() || undefined,
    contentDescription: element.getAttribute('aria-label') || 
                       element.getAttribute('title') || undefined,
    clickable: element.tagName === 'BUTTON' || 
               element.getAttribute('role') === 'button' ||
               element.onclick !== null,
    focusable: element.tabIndex >= 0 || 
               element.tagName === 'BUTTON' ||
               element.tagName === 'A' ||
               element.tagName === 'INPUT' ||
               element.getAttribute('role') === 'button',
    checkable: element.getAttribute('role') === 'checkbox' ||
               element.getAttribute('role') === 'radio',
    checked: element.getAttribute('aria-checked') === 'true',
    enabled: !element.hasAttribute('disabled') && 
             element.getAttribute('aria-disabled') !== 'true',
    bounds: {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    },
  };
  
  // Extract actions based on element type
  info.actions = extractActions(element);
  
  // Collection info for lists
  if (element.getAttribute('role') === 'list' || 
      element.tagName === 'UL' || 
      element.tagName === 'OL') {
    const items = element.querySelectorAll(':scope > li, :scope > [role="listitem"]');
    info.collectionInfo = {
      rowCount: items.length,
      columnCount: 1,
      selectionMode: 'none',
    };
  }
  
  // Grid info
  if (element.getAttribute('role') === 'grid') {
    const rows = element.querySelectorAll(':scope > [role="row"], :scope > tr');
    const firstRow = rows[0];
    const cells = firstRow?.querySelectorAll(':scope > [role="gridcell"], :scope > td');
    
    info.collectionInfo = {
      rowCount: rows.length,
      columnCount: cells?.length || 0,
      selectionMode: element.getAttribute('aria-multiselectable') === 'true' ? 'multiple' : 'single',
    };
  }
  
  return info;
}

/**
 * Extract available actions for an element
 */
function extractActions(element: HTMLElement): TalkBackAction[] {
  const actions: TalkBackAction[] = [];
  
  if (element.tabIndex >= 0 || element.tagName === 'BUTTON' || element.tagName === 'A') {
    actions.push('focus', 'accessibilityFocus');
  }
  
  if (element.tagName === 'BUTTON' || 
      element.getAttribute('role') === 'button' ||
      element.onclick !== null) {
    actions.push('click');
  }
  
  if (element.getAttribute('role') === 'checkbox' || 
      element.getAttribute('role') === 'radio') {
    actions.push('select', 'clearSelection');
  }
  
  if (element.getAttribute('aria-expanded') !== null) {
    actions.push('expand', 'collapse');
  }
  
  if (element.getAttribute('aria-modal') === 'true') {
    actions.push('dismiss');
  }
  
  const isScrollable = element.scrollHeight > element.clientHeight ||
                       element.scrollWidth > element.clientWidth;
  if (isScrollable) {
    actions.push('scrollForward', 'scrollBackward');
  }
  
  return actions;
}

/**
 * Perform action on element
 */
export function performAction(
  element: HTMLElement,
  action: TalkBackAction
): boolean {
  switch (action) {
    case 'focus':
      element.focus();
      return true;
      
    case 'click':
      element.click();
      return true;
      
    case 'clearFocus':
      element.blur();
      return true;
      
    case 'select':
      if (element.tagName === 'INPUT') {
        (element as HTMLInputElement).checked = true;
      }
      element.setAttribute('aria-selected', 'true');
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
      
    case 'clearSelection':
      if (element.tagName === 'INPUT') {
        (element as HTMLInputElement).checked = false;
      }
      element.setAttribute('aria-selected', 'false');
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
      
    case 'expand':
      element.setAttribute('aria-expanded', 'true');
      element.dispatchEvent(new Event('expand', { bubbles: true }));
      return true;
      
    case 'collapse':
      element.setAttribute('aria-expanded', 'false');
      element.dispatchEvent(new Event('collapse', { bubbles: true }));
      return true;
      
    case 'dismiss':
      element.dispatchEvent(new Event('dismiss', { bubbles: true }));
      return true;
      
    case 'scrollForward':
      element.scrollBy({ top: 200, behavior: 'smooth' });
      return true;
      
    case 'scrollBackward':
      element.scrollBy({ top: -200, behavior: 'smooth' });
      return true;
      
    default:
      return false;
  }
}

// ============================================================================
// GESTURE HANDLING
// ============================================================================

/**
 * Gesture handler manager for TalkBack
 */
export class TalkBackGestureManager {
  private handlers = new Map<TalkBackGesture, TalkBackGestureHandler[]>();
  private element: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private touchCount = 0;

  /**
   * Attach gesture handler to element
   */
  attach(element: HTMLElement): void {
    this.element = element;
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  /**
   * Detach gesture handlers
   */
  detach(): void {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element = null;
    }
  }

  /**
   * Register gesture handler
   */
  onGesture(handler: TalkBackGestureHandler): () => void {
    const handlers = this.handlers.get(handler.gesture) || [];
    handlers.push(handler);
    // Sort by priority
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.handlers.set(handler.gesture, handlers);
    
    return () => {
      const list = this.handlers.get(handler.gesture) || [];
      const index = list.indexOf(handler);
      if (index !== -1) {
        list.splice(index, 1);
      }
    };
  }

  /**
   * Handle touch start
   */
  private handleTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.touchCount = e.touches.length;
  };

  /**
   * Handle touch end
   */
  private handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const duration = Date.now() - this.touchStartTime;
    
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Detect gesture type
    const gesture = this.detectGesture(deltaX, deltaY, distance, duration, this.touchCount);
    
    if (gesture) {
      this.executeGesture(gesture, e);
    }
  };

  /**
   * Detect gesture from touch movement
   */
  private detectGesture(
    deltaX: number,
    deltaY: number,
    distance: number,
    duration: number,
    touchCount: number
  ): TalkBackGesture | null {
    // Tap detection (minimal movement, short duration)
    if (distance < 10 && duration < 300) {
      if (touchCount === 1) return 'singleTap';
      if (touchCount === 2) return 'twoFingerTap';
      if (touchCount === 3) return 'threeFingerTap';
      if (touchCount === 4) return 'fourFingerTap';
      return null;
    }
    
    // Swipe detection
    if (distance > 30 && duration < 500) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const isUp = deltaY < 0;
      const isLeft = deltaX < 0;
      
      if (touchCount === 1) {
        if (isHorizontal) {
          return isLeft ? 'swipeLeft' : 'swipeRight';
        } else {
          return isUp ? 'swipeUp' : 'swipeDown';
        }
      }
      
      if (touchCount === 2) {
        if (isHorizontal) {
          return isLeft ? 'twoFingerSwipeLeft' : 'twoFingerSwipeRight';
        } else {
          return isUp ? 'twoFingerSwipeUp' : 'twoFingerSwipeDown';
        }
      }
      
      if (touchCount === 3) {
        if (isHorizontal) {
          return isLeft ? 'threeFingerSwipeLeft' : 'threeFingerSwipeRight';
        } else {
          return isUp ? 'threeFingerSwipeUp' : 'threeFingerSwipeDown';
        }
      }
    }
    
    return null;
  }

  /**
   * Execute handlers for a gesture
   */
  private executeGesture(gesture: TalkBackGesture, event: Event): void {
    const handlers = this.handlers.get(gesture) || [];
    
    for (const handler of handlers) {
      handler.handler(event);
      if (handler.preventDefault) {
        event.preventDefault();
      }
    }
  }
}

/**
 * Create gesture manager instance
 */
export function createGestureManager(): TalkBackGestureManager {
  return new TalkBackGestureManager();
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/**
 * Announce to TalkBack via accessibility events
 */
export function announceToTalkBack(options: TalkBackAnnouncementOptions | string): void {
  const opts = typeof options === 'string' ? { text: options } : options;
  
  // Create announcement event
  const event = new CustomEvent('accessibilityAnnouncement', {
    detail: opts,
    bubbles: true,
  });
  document.dispatchEvent(event);
  
  // Use live region as fallback
  const liveRegion = document.getElementById('talkback-live-region') || 
                     createTalkBackLiveRegion();
  
  // Clear and set text to trigger announcement
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = opts.text;
  });
  
  // Trigger vibration if requested
  if (opts.vibration && 'vibrate' in navigator) {
    navigator.vibrate(opts.vibration);
  }
}

/**
 * Create TalkBack live region
 */
function createTalkBackLiveRegion(): HTMLElement {
  const region = document.createElement('div');
  region.id = 'talkback-live-region';
  region.setAttribute('aria-live', 'assertive');
  region.setAttribute('aria-atomic', 'true');
  region.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
  document.body.appendChild(region);
  return region;
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook for TalkBack integration
 */
export function useTalkBack() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [granularity, setGranularity] = useState<TalkBackState['granularity']>('default');
  const traversalRef = useRef<TalkBackTraversalManager | null>(null);
  const gestureRef = useRef<TalkBackGestureManager | null>(null);

  useEffect(() => {
    // Check initial state
    setIsEnabled(isTalkBackEnabled());

    // Poll for state changes
    const interval = setInterval(() => {
      const current = isTalkBackEnabled();
      if (current !== isEnabled) {
        setIsEnabled(current);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      traversalRef.current?.destroy();
      gestureRef.current?.detach();
    };
  }, [isEnabled]);

  /**
   * Setup custom traversal order
   */
  const setupTraversal = useCallback((config: Omit<TalkBackTraversalConfig, 'container'> & { container: HTMLElement }) => {
    traversalRef.current?.destroy();
    traversalRef.current = createTraversalManager();
    return traversalRef.current.init(config);
  }, []);

  /**
   * Setup gesture handling
   */
  const setupGestures = useCallback((element: HTMLElement) => {
    gestureRef.current?.detach();
    gestureRef.current = createGestureManager();
    gestureRef.current.attach(element);
    return gestureRef.current;
  }, []);

  /**
   * Announce to TalkBack
   */
  const announce = useCallback((options: TalkBackAnnouncementOptions | string) => {
    announceToTalkBack(options);
  }, []);

  /**
   * Set navigation granularity
   */
  const setNavGranularity = useCallback((g: TalkBackState['granularity']) => {
    setGranularity(g);
    announce({ text: `Granularity: ${g}`, queue: true });
  }, [announce]);

  /**
   * Traverse to next element
   */
  const next = useCallback(() => {
    return traversalRef.current?.next() || null;
  }, []);

  /**
   * Traverse to previous element
   */
  const previous = useCallback(() => {
    return traversalRef.current?.previous() || null;
  }, []);

  return {
    isEnabled,
    granularity,
    announce,
    setupTraversal,
    setupGestures,
    setGranularity: setNavGranularity,
    next,
    previous,
    vibrate: (pattern: number | number[]) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Optimize element for TalkBack
 */
export function optimizeForTalkBack(element: HTMLElement): void {
  // Ensure element has content description
  if (!element.getAttribute('aria-label') && 
      !element.getAttribute('contentDescription') &&
      !element.textContent?.trim()) {
    element.setAttribute('aria-label', element.getAttribute('title') || 'Interactive element');
  }
  
  // Mark as important for accessibility
  element.setAttribute('data-talkback-optimized', 'true');
  
  // Ensure minimum touch target
  const rect = element.getBoundingClientRect();
  if (rect.width < 48 || rect.height < 48) {
    element.style.minWidth = '48px';
    element.style.minHeight = '48px';
  }
}

/**
 * Format number for TalkBack speech
 */
export function formatNumberForTalkBack(num: number): string {
  // Add spaces between digits for phone numbers or long numbers
  if (num > 9999 && num < 1000000000) {
    return num.toLocaleString();
  }
  return num.toString();
}

/**
 * Get TalkBack-specific ARIA attributes
 */
export function getTalkBackAttributes(
  options: {
    traversalIndex?: number;
    isHeader?: boolean;
    isFooter?: boolean;
    important?: boolean;
  }
): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  if (options.traversalIndex !== undefined) {
    attrs['data-talkback-index'] = String(options.traversalIndex);
  }
  
  if (options.isHeader) {
    attrs['role'] = 'banner';
  }
  
  if (options.isFooter) {
    attrs['role'] = 'contentinfo';
  }
  
  if (options.important) {
    attrs['aria-live'] = 'polite';
  }
  
  return attrs;
}

export default {
  isTalkBackEnabled,
  useTalkBack,
  createTraversalManager,
  createGestureManager,
  announceToTalkBack,
  optimizeForTalkBack,
};
