/** [Ver001.000]
 *
 * TouchExplorer Component
 * 
 * Touch-to-speak exploration mode for mobile screen readers.
 * Provides element exploration, audio feedback, and visual highlighting
 * for VoiceOver and TalkBack users.
 * 
 * Integrates with TL-A2 2-A touch gestures.
 * 
 * @module components/mobile/TouchExplorer
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouchGesture } from '../../hooks/useTouchGesture';
import { useMobileScreenReader } from '../../hooks/useMobileScreenReader';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Touch explorer state
 */
export interface TouchExplorerState {
  /** Whether touch exploration is active */
  active: boolean;
  /** Currently explored element */
  currentElement: Element | null;
  /** Element at touch position */
  touchedElement: Element | null;
  /** Whether currently exploring */
  isExploring: boolean;
  /** Last announcement text */
  lastAnnouncement: string | null;
  /** Touch position */
  touchPosition: { x: number; y: number } | null;
  /** Audio feedback enabled */
  audioEnabled: boolean;
  /** Visual highlighting enabled */
  visualEnabled: boolean;
}

/**
 * Touch explorer options
 */
export interface TouchExplorerOptions {
  /** Audio feedback enabled */
  audioEnabled?: boolean;
  /** Visual highlighting enabled */
  visualEnabled?: boolean;
  /** Exploration delay (ms) */
  explorationDelay?: number;
  /** Announcement debounce (ms) */
  announcementDebounce?: number;
  /** Element filter function */
  elementFilter?: (element: Element) => boolean;
  /** Custom announcement formatter */
  announcementFormatter?: (element: Element) => string;
}

/**
 * Explorer context value
 */
interface TouchExplorerContextValue {
  state: TouchExplorerState;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  exploreAt: (x: number, y: number) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TouchExplorerContext = createContext<TouchExplorerContextValue | null>(null);

/**
 * Hook to use touch explorer context
 */
export function useTouchExplorer(): TouchExplorerContextValue {
  const context = useContext(TouchExplorerContext);
  if (!context) {
    throw new Error('useTouchExplorer must be used within TouchExplorerProvider');
  }
  return context;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get element at touch point
 */
function getElementAtPoint(x: number, y: number): Element | null {
  // Hide visual overlay temporarily to get element underneath
  const overlays = document.querySelectorAll('.touch-explorer-overlay');
  overlays.forEach(el => {
    (el as HTMLElement).style.pointerEvents = 'none';
  });
  
  const element = document.elementFromPoint(x, y);
  
  overlays.forEach(el => {
    (el as HTMLElement).style.pointerEvents = 'auto';
  });
  
  return element;
}

/**
 * Find nearest focusable/explorable element
 */
function findExplorableElement(start: Element | null): Element | null {
  if (!start) return null;
  
  let current: Element | null = start;
  
  while (current) {
    // Check if element is explorable
    if (isExplorableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Check if element is explorable
 */
function isExplorableElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  
  // Interactive elements
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
  if (interactiveTags.includes(tagName)) return true;
  
  // Elements with roles
  if (element.getAttribute('role')) return true;
  
  // Elements with aria labels
  if (element.getAttribute('aria-label')) return true;
  
  // Elements with tabindex
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex && tabIndex !== '-1') return true;
  
  // Text containers with visible text
  if (element.textContent?.trim() && element.children.length === 0) return true;
  
  // Marked as explorable
  if (element.hasAttribute('data-explorable')) return true;
  
  return false;
}

/**
 * Generate announcement for element
 */
function generateElementAnnouncement(element: Element): string {
  // Check for custom announcement
  const customAnnouncement = element.getAttribute('data-announcement');
  if (customAnnouncement) return customAnnouncement;
  
  // Build announcement from element properties
  const parts: string[] = [];
  
  // Role/type
  const role = element.getAttribute('role');
  const tagName = element.tagName.toLowerCase();
  
  if (role) {
    parts.push(role);
  } else if (tagName === 'button') {
    parts.push('button');
  } else if (tagName === 'a') {
    parts.push('link');
  } else if (tagName === 'input') {
    const type = (element as HTMLInputElement).type;
    parts.push(type === 'text' ? 'text field' : `${type} input`);
  } else if (tagName === 'select') {
    parts.push('dropdown');
  } else if (tagName === 'textarea') {
    parts.push('text area');
  } else if (tagName === 'img') {
    parts.push('image');
  }
  
  // Label/text content
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const title = element.getAttribute('title');
  const alt = element.getAttribute('alt');
  const textContent = element.textContent?.trim();
  
  if (ariaLabel) {
    parts.push(ariaLabel);
  } else if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      parts.push(labelElement.textContent || '');
    }
  } else if (alt) {
    parts.push(alt);
  } else if (title) {
    parts.push(title);
  } else if (textContent && parts.length === 0) {
    parts.push(textContent);
  } else if (textContent) {
    parts.push(textContent);
  }
  
  // State information
  const ariaChecked = element.getAttribute('aria-checked');
  if (ariaChecked !== null) {
    parts.push(ariaChecked === 'true' ? 'checked' : 'not checked');
  }
  
  const ariaExpanded = element.getAttribute('aria-expanded');
  if (ariaExpanded !== null) {
    parts.push(ariaExpanded === 'true' ? 'expanded' : 'collapsed');
  }
  
  const ariaSelected = element.getAttribute('aria-selected');
  if (ariaSelected !== null) {
    parts.push(ariaSelected === 'true' ? 'selected' : 'not selected');
  }
  
  const ariaDisabled = element.getAttribute('aria-disabled');
  const disabled = element.hasAttribute('disabled');
  if (ariaDisabled === 'true' || disabled) {
    parts.push('disabled');
  }
  
  return parts.join(', ') || 'unknown element';
}

/**
 * Play audio feedback
 */
function playAudioFeedback(type: 'focus' | 'activate' | 'boundary' | 'explore'): void {
  if (!('AudioContext' in window) && !('webkitAudioContext' in window)) return;
  
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  switch (type) {
    case 'focus':
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      break;
    case 'activate':
      osc.frequency.value = 1200;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      break;
    case 'boundary':
      osc.frequency.value = 400;
      gain.gain.value = 0.08;
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
      break;
    case 'explore':
      osc.frequency.value = 600;
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
      break;
  }
}

// ============================================================================
// TOUCH EXPLORER PROVIDER
// ============================================================================

interface TouchExplorerProviderProps {
  children: ReactNode;
  options?: TouchExplorerOptions;
}

/**
 * TouchExplorerProvider - Provides touch exploration functionality
 */
export const TouchExplorerProvider: React.FC<TouchExplorerProviderProps> = ({
  children,
  options = {},
}) => {
  const {
    audioEnabled = true,
    visualEnabled = true,
    explorationDelay = 300,
    announcementDebounce = 100,
    elementFilter,
    announcementFormatter = generateElementAnnouncement,
  } = options;
  
  const [state, setState] = useState<TouchExplorerState>({
    active: false,
    currentElement: null,
    touchedElement: null,
    isExploring: false,
    lastAnnouncement: null,
    touchPosition: null,
    audioEnabled,
    visualEnabled,
  });
  
  const { announce } = useMobileScreenReader();
  const explorationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastElementRef = useRef<Element | null>(null);

  /**
   * Explore element at position
   */
  const exploreAt = useCallback((x: number, y: number) => {
    // Clear existing timeouts
    if (explorationTimeoutRef.current) {
      clearTimeout(explorationTimeoutRef.current);
    }
    
    setState(prev => ({
      ...prev,
      touchPosition: { x, y },
      isExploring: true,
    }));
    
    // Delay exploration to allow for scrolling gestures
    explorationTimeoutRef.current = setTimeout(() => {
      const elementAtPoint = getElementAtPoint(x, y);
      const explorableElement = findExplorableElement(elementAtPoint);
      
      // Filter element if filter provided
      const filteredElement = elementFilter && explorableElement
        ? (elementFilter(explorableElement) ? explorableElement : null)
        : explorableElement;
      
      setState(prev => ({
        ...prev,
        currentElement: filteredElement,
        touchedElement: elementAtPoint,
        isExploring: false,
      }));
      
      // Announce element if different from last
      if (filteredElement && filteredElement !== lastElementRef.current) {
        if (announcementTimeoutRef.current) {
          clearTimeout(announcementTimeoutRef.current);
        }
        
        announcementTimeoutRef.current = setTimeout(() => {
          const announcement = announcementFormatter(filteredElement);
          
          setState(prev => ({
            ...prev,
            lastAnnouncement: announcement,
          }));
          
          announce(announcement);
          
          if (audioEnabled) {
            playAudioFeedback('explore');
          }
          
          lastElementRef.current = filteredElement;
        }, announcementDebounce);
      }
    }, explorationDelay);
  }, [announce, audioEnabled, explorationDelay, announcementDebounce, elementFilter, announcementFormatter]);

  /**
   * Activate touch exploration
   */
  const activate = useCallback(() => {
    setState(prev => ({
      ...prev,
      active: true,
    }));
    
    if (audioEnabled) {
      playAudioFeedback('activate');
    }
    
    announce('Touch exploration activated. Touch and hold to explore elements.');
    
    // Add exploration class to body
    document.body.classList.add('touch-exploration-active');
  }, [announce, audioEnabled]);

  /**
   * Deactivate touch exploration
   */
  const deactivate = useCallback(() => {
    setState(prev => ({
      ...prev,
      active: false,
      currentElement: null,
      isExploring: false,
    }));
    
    if (explorationTimeoutRef.current) {
      clearTimeout(explorationTimeoutRef.current);
    }
    
    document.body.classList.remove('touch-exploration-active');
  }, []);

  /**
   * Toggle touch exploration
   */
  const toggle = useCallback(() => {
    if (state.active) {
      deactivate();
    } else {
      activate();
    }
  }, [state.active, activate, deactivate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (explorationTimeoutRef.current) {
        clearTimeout(explorationTimeoutRef.current);
      }
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      document.body.classList.remove('touch-exploration-active');
    };
  }, []);

  const contextValue: TouchExplorerContextValue = {
    state,
    activate,
    deactivate,
    toggle,
    exploreAt,
  };

  return (
    <TouchExplorerContext.Provider value={contextValue}>
      {children}
      {state.active && state.visualEnabled && (
        <TouchExplorerOverlay state={state} />
      )}
    </TouchExplorerContext.Provider>
  );
};

// ============================================================================
// TOUCH EXPLORER OVERLAY
// ============================================================================

interface TouchExplorerOverlayProps {
  state: TouchExplorerState;
}

/**
 * Visual overlay for touch exploration
 */
const TouchExplorerOverlay: React.FC<TouchExplorerOverlayProps> = ({ state }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { bind } = useTouchGesture({
    onPan: (delta, gestureState) => {
      if (gestureState.currentPosition) {
        exploreAtPosition(gestureState.currentPosition.x, gestureState.currentPosition.y);
      }
    },
    onLongPress: (position) => {
      exploreAtPosition(position.x, position.y);
    },
  });

  const exploreAtPosition = useCallback((x: number, y: number) => {
    const context = useContext(TouchExplorerContext);
    context?.exploreAt(x, y);
  }, []);

  // Get highlight position and size
  const getHighlightStyle = (): React.CSSProperties => {
    if (!state.currentElement) return { display: 'none' };
    
    const rect = state.currentElement.getBoundingClientRect();
    
    return {
      position: 'fixed',
      left: rect.left - 4,
      top: rect.top - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      pointerEvents: 'none',
      zIndex: 9999,
    };
  };

  // Get touch indicator position
  const getTouchIndicatorStyle = (): React.CSSProperties => {
    if (!state.touchPosition) return { display: 'none' };
    
    return {
      position: 'fixed',
      left: state.touchPosition.x - 20,
      top: state.touchPosition.y - 20,
      width: 40,
      height: 40,
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: 10000,
    };
  };

  return (
    <>
      {/* Touch capture overlay */}
      <div
        ref={overlayRef}
        className="touch-explorer-overlay fixed inset-0 z-[9998] touch-none"
        {...bind()}
      />
      
      {/* Element highlight */}
      <AnimatePresence>
        {state.currentElement && (
          <motion.div
            className="touch-explorer-highlight fixed rounded-lg border-2 border-[#ffd700] bg-[#ffd700]/10"
            style={getHighlightStyle()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
      
      {/* Touch indicator */}
      <AnimatePresence>
        {state.isExploring && state.touchPosition && (
          <motion.div
            className="touch-explorer-indicator fixed rounded-full border-2 border-[#00d4ff]"
            style={getTouchIndicatorStyle()}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
      
      {/* Exploration status indicator */}
      <motion.div
        className="touch-explorer-status fixed bottom-20 left-1/2 -translate-x-1/2 z-[10001] 
                   bg-[#0a0a0f]/90 backdrop-blur-sm px-4 py-2 rounded-full
                   border border-[#ffd700]/30 text-white text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffd700] animate-pulse" />
          Touch exploration active
        </span>
      </motion.div>
      
      {/* Announcement display */}
      <AnimatePresence mode="wait">
        {state.lastAnnouncement && (
          <motion.div
            key={state.lastAnnouncement}
            className="touch-explorer-announcement fixed top-20 left-4 right-4 z-[10001]
                       bg-[#0a0a0f]/95 backdrop-blur-md p-4 rounded-xl
                       border border-[#00d4ff]/30 text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium">{state.lastAnnouncement}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// TOUCH EXPLORER BUTTON
// ============================================================================

interface TouchExplorerButtonProps {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Variant style */
  variant?: 'default' | 'floating' | 'minimal';
}

/**
 * Button to toggle touch exploration mode
 */
export const TouchExplorerButton: React.FC<TouchExplorerButtonProps> = ({
  size = 'md',
  className = '',
  variant = 'default',
}) => {
  const { state, toggle } = useTouchExplorer();
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };
  
  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26,
  };
  
  const variantClasses = {
    default: `fixed bottom-24 right-4 ${sizeClasses[size]} rounded-full 
              bg-gradient-to-r from-[#00d4ff] to-[#ffd700] text-[#0a0a0f]
              shadow-lg shadow-[#00d4ff]/20 hover:shadow-[#00d4ff]/40
              flex items-center justify-center transition-all duration-200
              active:scale-95 z-50`,
    floating: `fixed bottom-24 right-4 ${sizeClasses[size]} rounded-full
               bg-[#0a0a0f]/80 backdrop-blur-md border border-[#00d4ff]/50
               text-[#00d4ff] hover:bg-[#00d4ff]/10
               flex items-center justify-center transition-all duration-200
               active:scale-95 z-50`,
    minimal: `p-2 rounded-lg bg-transparent text-[#00d4ff] hover:bg-[#00d4ff]/10
              transition-colors`,
  };

  return (
    <button
      onClick={toggle}
      className={`${variantClasses[variant]} ${state.active ? 'ring-2 ring-[#ffd700] ring-offset-2 ring-offset-[#0a0a0f]' : ''} ${className}`}
      aria-label={state.active ? 'Disable touch exploration' : 'Enable touch exploration'}
      aria-pressed={state.active}
      title={state.active ? 'Disable touch exploration' : 'Enable touch exploration'}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {state.active ? (
          // Eye off icon
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        ) : (
          // Eye icon
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 5v.01" />
            <path d="M12 19v.01" />
          </>
        )}
      </svg>
    </button>
  );
};

// ============================================================================
// TOUCH EXPLORER ZONE
// ============================================================================

interface TouchExplorationZoneProps {
  children: ReactNode;
  /** Custom announcement for this zone */
  announcement?: string;
  /** Whether zone is explorable */
  explorable?: boolean;
  /** Zone priority (higher = explored first) */
  priority?: number;
}

/**
 * Wrapper for explorable content zones
 */
export const TouchExplorationZone: React.FC<TouchExplorationZoneProps> = ({
  children,
  announcement,
  explorable = true,
  priority = 0,
}) => {
  return (
    <div
      data-explorable={explorable ? 'true' : undefined}
      data-exploration-priority={priority}
      data-announcement={announcement}
      className="touch-exploration-zone"
    >
      {children}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  TouchExplorerProvider,
  TouchExplorerButton,
  TouchExplorationZone,
  useTouchExplorer,
};
