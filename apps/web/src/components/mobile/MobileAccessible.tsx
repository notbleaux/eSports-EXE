/** [Ver001.000]
 *
 * MobileAccessible Components
 * 
 * Mobile accessibility wrapper components and utilities for the 4NJZ4 TENET Platform.
 * Provides screen reader announcements, focus management, and mobile-optimized
 * accessibility patterns.
 * 
 * Extends TL-A1 accessibility with mobile-specific features.
 * 
 * @module components/mobile/MobileAccessible
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileScreenReader } from '../../hooks/useMobileScreenReader';
import { TouchExplorerProvider } from './TouchExplorer';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Mobile accessibility context value
 */
interface MobileA11yContextValue {
  /** Whether mobile accessibility mode is active */
  enabled: boolean;
  /** Current screen reader type */
  screenReaderType: 'voiceover' | 'talkback' | 'unknown' | null;
  /** Make announcement */
  announce: (message: string, priority?: 'low' | 'normal' | 'high') => void;
  /** Register focusable element */
  registerFocusable: (id: string, element: HTMLElement) => void;
  /** Unregister focusable element */
  unregisterFocusable: (id: string) => void;
  /** Focus element by ID */
  focusElement: (id: string, announce?: boolean) => boolean;
}

/**
 * MobileA11yProvider props
 */
interface MobileA11yProviderProps {
  children: ReactNode;
  /** Enable touch exploration */
  enableTouchExploration?: boolean;
  /** Touch exploration options */
  touchExplorationOptions?: {
    audioEnabled?: boolean;
    visualEnabled?: boolean;
  };
  /** Initial focus element ID */
  initialFocus?: string;
  /** Announce on mount */
  announcementOnMount?: string;
}

/**
 * Screen reader announcement props
 */
interface ScreenReaderAnnouncementProps {
  /** Announcement message */
  message: string;
  /** Announcement priority */
  priority?: 'low' | 'normal' | 'high' | 'critical';
  /** Interrupt current speech */
  interrupt?: boolean;
  /** Unique key for deduplication */
  announcementKey?: string;
  /** Delay before announcing (ms) */
  delay?: number;
}

/**
 * Mobile focus trap props
 */
interface MobileFocusTrapProps {
  children: ReactNode;
  /** Whether trap is active */
  active: boolean;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** On escape key pressed */
  onEscape?: () => void;
  /** Announce when trap activates */
  announcement?: string;
  /** Container className */
  className?: string;
}

/**
 * Skip link props
 */
interface SkipLinkProps {
  /** Target element ID */
  targetId: string;
  /** Link text */
  text?: string;
  /** Custom className */
  className?: string;
}

/**
 * Touch target wrapper props
 */
interface TouchTargetProps {
  children: ReactNode;
  /** Minimum size in pixels */
  minSize?: number;
  /** Expand visually while keeping child size */
  expandVisual?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Accessible page region props
 */
interface AccessibleRegionProps {
  children: ReactNode;
  /** Region type */
  type: 'main' | 'navigation' | 'complementary' | 'contentinfo' | 'search' | 'banner' | 'region';
  /** Region label */
  label: string;
  /** Region ID */
  id?: string;
  /** Custom className */
  className?: string;
  /** Announce on mount */
  announceOnMount?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const MobileA11yContext = createContext<MobileA11yContextValue | null>(null);

/**
 * Hook to use mobile accessibility context
 */
export function useMobileA11y(): MobileA11yContextValue {
  const context = useContext(MobileA11yContext);
  if (!context) {
    throw new Error('useMobileA11y must be used within MobileA11yProvider');
  }
  return context;
}

// ============================================================================
// MOBILE A11Y PROVIDER
// ============================================================================

/**
 * MobileA11yProvider - Main accessibility provider for mobile
 */
export const MobileA11yProvider: React.FC<MobileA11yProviderProps> = ({
  children,
  enableTouchExploration = true,
  touchExplorationOptions,
  initialFocus,
  announcementOnMount,
}) => {
  const {
    state,
    announce,
    focusAndAnnounce,
  } = useMobileScreenReader();
  
  const focusableElements = useRef<Map<string, HTMLElement>>(new Map());
  const [enabled, setEnabled] = useState(false);

  // Register focusable element
  const registerFocusable = useCallback((id: string, element: HTMLElement) => {
    focusableElements.current.set(id, element);
  }, []);

  // Unregister focusable element
  const unregisterFocusable = useCallback((id: string) => {
    focusableElements.current.delete(id);
  }, []);

  // Focus element by ID
  const focusElement = useCallback((id: string, shouldAnnounce = true): boolean => {
    const element = focusableElements.current.get(id);
    if (element) {
      focusAndAnnounce(element, shouldAnnounce ? element.getAttribute('aria-label') || undefined : undefined);
      return true;
    }
    return false;
  }, [focusAndAnnounce]);

  // Initial setup
  useEffect(() => {
    setEnabled(state.enabled);
    
    // Initial focus
    if (initialFocus) {
      setTimeout(() => {
        focusElement(initialFocus, false);
      }, 100);
    }
    
    // Mount announcement
    if (announcementOnMount) {
      setTimeout(() => {
        announce(announcementOnMount);
      }, 500);
    }
  }, [state.enabled, initialFocus, announcementOnMount, focusElement, announce]);

  const contextValue: MobileA11yContextValue = {
    enabled,
    screenReaderType: state.type,
    announce: (message, priority = 'normal') => announce({ text: message, priority }),
    registerFocusable,
    unregisterFocusable,
    focusElement,
  };

  const content = (
    <MobileA11yContext.Provider value={contextValue}>
      {/* Live region for announcements */}
      <div 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      />
      
      {children}
    </MobileA11yContext.Provider>
  );

  if (enableTouchExploration) {
    return (
      <TouchExplorerProvider options={touchExplorationOptions}>
        {content}
      </TouchExplorerProvider>
    );
  }

  return content;
};

// ============================================================================
// SCREEN READER ANNOUNCEMENT
// ============================================================================

/**
 * ScreenReaderAnnouncement - Component for dynamic announcements
 */
export const ScreenReaderAnnouncement: React.FC<ScreenReaderAnnouncementProps> = ({
  message,
  priority = 'normal',
  interrupt = false,
  announcementKey,
  delay = 0,
}) => {
  const { announce } = useMobileScreenReader();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same key
    if (announcementKey && announcementKey === lastKeyRef.current) {
      return;
    }
    
    lastKeyRef.current = announcementKey || null;
    
    const timer = setTimeout(() => {
      announce({
        text: message,
        priority,
        interrupt,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [message, priority, interrupt, announcementKey, delay, announce]);

  return null;
};

// ============================================================================
// MOBILE FOCUS TRAP
// ============================================================================

/**
 * MobileFocusTrap - Focus trap for modals/dialogs with mobile optimizations
 */
export const MobileFocusTrap: React.FC<MobileFocusTrapProps> = ({
  children,
  active,
  initialFocusRef,
  onEscape,
  announcement,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus, state } = useMobileScreenReader();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (active && containerRef.current) {
      const initialElement = initialFocusRef?.current || undefined;
      
      cleanupRef.current = trapFocus({
        container: containerRef.current,
        initialFocus: initialElement,
        onEscape,
        announceOnActivate: !!announcement,
      });
      
      // Announce activation
      if (announcement && state.enabled) {
        // Announcement is handled by trapFocus with announceOnActivate
      }
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [active, initialFocusRef, onEscape, announcement, trapFocus, state.enabled]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`mobile-focus-trap ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

// ============================================================================
// SKIP LINKS
// ============================================================================

/**
 * SkipLink - "Skip to content" link for keyboard/screen reader users
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  text = 'Skip to main content',
  className = '',
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ block: 'start' });
      target.setAttribute('tabindex', '-1');
    }
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        skip-link fixed top-4 left-4 z-[10000]
        px-4 py-2 bg-[#00d4ff] text-[#0a0a0f] font-medium rounded-lg
        transform -translate-y-[200%] focus:translate-y-0
        transition-transform duration-200 outline-none
        focus:ring-2 focus:ring-[#ffd700] focus:ring-offset-2
        ${className}
      `}
    >
      {text}
    </a>
  );
};

/**
 * SkipLinks - Container for multiple skip links
 */
interface SkipLinksProps {
  links: Array<{ targetId: string; text: string }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="skip-links-container fixed top-0 left-0 right-0 z-[10000]"
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#00d4ff]/30 p-4"
            aria-label="Skip links"
          >
            <ul className="flex flex-wrap gap-4">
              {links.map((link) => (
                <li key={link.targetId}>
                  <SkipLink targetId={link.targetId} text={link.text} />
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// TOUCH TARGET
// ============================================================================

/**
 * TouchTarget - Ensures minimum touch target size for accessibility
 */
export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  minSize = 48,
  expandVisual = false,
  className = '',
}) => {
  const style: CSSProperties = expandVisual
    ? {
        minWidth: minSize,
        minHeight: minSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {
        position: 'relative',
      };

  return (
    <span
      className={`touch-target ${className}`}
      style={style}
      data-touch-target={minSize}
    >
      {expandVisual ? (
        children
      ) : (
        <>
          {children}
          {/* Invisible touch target expansion */}
          <span
            className="touch-target-inset absolute"
            style={{
              inset: `calc((${minSize}px - 100%) / -2)`,
              minWidth: minSize,
              minHeight: minSize,
            }}
            aria-hidden="true"
          />
        </>
      )}
    </span>
  );
};

// ============================================================================
// ACCESSIBLE REGION
// ============================================================================

/**
 * AccessibleRegion - Semantic page region with proper ARIA attributes
 */
export const AccessibleRegion: React.FC<AccessibleRegionProps> = ({
  children,
  type,
  label,
  id,
  className = '',
  announceOnMount = false,
}) => {
  const { announce } = useMobileScreenReader();
  
  const roleMap: Record<string, string> = {
    main: 'main',
    navigation: 'navigation',
    complementary: 'complementary',
    contentinfo: 'contentinfo',
    search: 'search',
    banner: 'banner',
    region: 'region',
  };

  useEffect(() => {
    if (announceOnMount) {
      announce(`${label}, ${type}`);
    }
  }, [announceOnMount, announce, label, type]);

  return (
    <section
      id={id}
      role={roleMap[type]}
      aria-label={label}
      className={`accessible-region ${className}`}
    >
      {children}
    </section>
  );
};

// ============================================================================
// MOBILE A11Y TEXT
// ============================================================================

/**
 * VisuallyHiddenText - Text hidden visually but available to screen readers
 */
export const VisuallyHiddenText: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <span
      className="visually-hidden"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
    >
      {children}
    </span>
  );
};

/**
 * ScreenReaderOnly - Content only visible to screen readers
 */
export const ScreenReaderOnly: React.FC<{ children: ReactNode; as?: keyof JSX.IntrinsicElements }> = ({
  children,
  as: Component = 'span',
}) => {
  return (
    <Component
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      }}
    >
      {children}
    </Component>
  );
};

// ============================================================================
// MOBILE A11Y BUTTON
// ============================================================================

interface MobileA11yButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Expanded touch target size */
  touchSize?: number;
  /** Announce on focus */
  announceOnFocus?: string;
  /** Custom className */
  className?: string;
}

/**
 * MobileA11yButton - Button with mobile accessibility features
 */
export const MobileA11yButton: React.FC<MobileA11yButtonProps> = ({
  children,
  touchSize = 48,
  announceOnFocus,
  className = '',
  onFocus,
  ...props
}) => {
  const { announce } = useMobileScreenReader();

  const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    if (announceOnFocus) {
      announce(announceOnFocus);
    }
    onFocus?.(e);
  }, [announce, announceOnFocus, onFocus]);

  return (
    <TouchTarget minSize={touchSize} className="inline-block">
      <button
        {...props}
        onFocus={handleFocus}
        className={`
          relative z-10
          focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-2
          focus:ring-offset-[#0a0a0f]
          active:scale-95 transition-transform
          ${className}
        `}
      >
        {children}
      </button>
    </TouchTarget>
  );
};

// ============================================================================
// ANNOUNCEMENT QUEUE
// ============================================================================

interface AnnouncementQueueProps {
  /** Maximum number of announcements to queue */
  maxItems?: number;
}

/**
 * AnnouncementQueueDisplay - Visual indicator of queued announcements
 */
export const AnnouncementQueueIndicator: React.FC<AnnouncementQueueProps> = ({
  maxItems = 5,
}) => {
  const [queue, setQueue] = useState<string[]>([]);
  
  // In a real implementation, this would connect to the actual queue
  // For now, it's a placeholder component

  if (queue.length === 0) return null;

  return (
    <div
      className="announcement-queue-indicator fixed bottom-4 left-4 z-[9999]
                 bg-[#0a0a0f]/90 backdrop-blur-sm px-3 py-2 rounded-lg
                 border border-[#00d4ff]/30 text-white text-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
        {queue.length} announcement{queue.length !== 1 ? 's' : ''} queued
      </span>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  MobileA11yProvider,
  ScreenReaderAnnouncement,
  MobileFocusTrap,
  SkipLink,
  SkipLinks,
  TouchTarget,
  AccessibleRegion,
  VisuallyHiddenText,
  ScreenReaderOnly,
  MobileA11yButton,
  useMobileA11y,
};
