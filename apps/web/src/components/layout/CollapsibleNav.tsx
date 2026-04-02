// @ts-nocheck
/** [Ver001.000]
 *
 * Collapsible Navigation Component
 * 
 * Mobile-first navigation with hamburger menu and slide-out drawer.
 * Supports touch gestures, 5-hub navigation for NJZiteGeisTe Platform.
 * 
 * @module components/layout/CollapsibleNav
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Menu, 
  X, 
  ChevronRight,
  Activity,
  Gamepad2,
  Users,
  BarChart3,
  Settings,
  type LucideIcon
} from 'lucide-react';
import { useBreakpoint } from '@/lib/mobile/breakpoints';

/**
 * Navigation hub item
 */
export interface NavHub {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: LucideIcon;
  /** Route path */
  href: string;
  /** Hub theme color */
  theme?: 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';
  /** Whether hub is active */
  isActive?: boolean;
  /** Sub-navigation items */
  children?: NavItem[];
}

/**
 * Navigation item
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Whether item is active */
  isActive?: boolean;
  /** External link */
  external?: boolean;
}

/**
 * Props for CollapsibleNav
 */
export interface CollapsibleNavProps {
  /** Hub navigation items (5 hubs) */
  hubs: NavHub[];
  /** Additional navigation items */
  items?: NavItem[];
  /** Brand/logo element */
  brand?: React.ReactNode;
  /** Position of drawer */
  position?: 'left' | 'right';
  /** Drawer width on mobile */
  mobileWidth?: string;
  /** Breakpoint to switch to desktop nav */
  desktopBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  /** Callback when drawer state changes */
  onDrawerChange?: (isOpen: boolean) => void;
  /** Custom trigger button */
  trigger?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show overlay */
  showOverlay?: boolean;
  /** Whether to close on route change */
  closeOnRouteChange?: boolean;
}

/**
 * Merge Tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Default 5 hubs for NJZiteGeisTe Platform
 */
export const DEFAULT_HUBS: NavHub[] = [
  {
    id: 'sator',
    label: 'Analytics',
    icon: Activity,
    href: '/analytics',
    theme: 'sator',
  },
  {
    id: 'rotas',
    label: 'Stats',
    icon: Gamepad2,
    href: '/stats',
    theme: 'rotas',
  },
  {
    id: 'arepo',
    label: 'Community',
    icon: Users,
    href: '/community',
    theme: 'arepo',
  },
  {
    id: 'opera',
    label: 'Pro Scene',
    icon: BarChart3,
    href: '/pro-scene',
    theme: 'opera',
  },
  {
    id: 'tenet',
    label: 'Hubs',
    icon: Settings,
    href: '/hubs',
    theme: 'tenet',
  },
];

/**
 * Hub theme colors
 */
const HUB_THEMES: Record<string, string> = {
  sator: 'text-sator-accent bg-sator-bg',
  rotas: 'text-rotas-accent bg-rotas-bg',
  arepo: 'text-arepo-accent bg-arepo-bg',
  opera: 'text-opera-accent bg-opera-bg',
  tenet: 'text-gold-500 bg-prussian-blue',
};

/**
 * Collapsible Navigation Component
 * 
 * Provides mobile hamburger menu with slide-out drawer and desktop horizontal nav.
 * 
 * @example
 * ```tsx
 * <CollapsibleNav 
 *   hubs={DEFAULT_HUBS}
 *   brand={<Logo />}
 *   position="left"
 * />
 * ```
 */
export function CollapsibleNav({
  hubs,
  items = [],
  brand,
  position = 'left',
  desktopBreakpoint = 'lg',
  onDrawerChange,
  trigger,
  className,
  showOverlay = true,
}: CollapsibleNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Use breakpoint to determine mobile/desktop view
  const { [`is${desktopBreakpoint.charAt(0).toUpperCase() + desktopBreakpoint.slice(1)}`]: isDesktop } = useBreakpoint();

  // Notify parent of drawer state changes
  useEffect(() => {
    onDrawerChange?.(isOpen);
  }, [isOpen, onDrawerChange]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        closeDrawer();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    controls.start('open');
  }, [controls]);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setActiveHub(null);
    controls.start('closed');
  }, [controls]);

  const toggleDrawer = useCallback(() => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isOpen, openDrawer, closeDrawer]);

  // Handle hub expansion
  const toggleHub = useCallback((hubId: string) => {
    setActiveHub((current) => (current === hubId ? null : hubId));
  }, []);

  // Drawer animation variants
  const drawerVariants = {
    closed: {
      x: position === 'left' ? '-100%' : '100%',
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    open: {
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  // Overlay animation variants
  const overlayVariants = {
    closed: { opacity: 0, pointerEvents: 'none' as const },
    open: { opacity: 1, pointerEvents: 'auto' as const },
  };

  // Hub item animation
  const hubItemVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: 'auto', opacity: 1 },
  };

  // Hamburger button (44px touch target minimum)
  const HamburgerButton = (
    <button
      onClick={toggleDrawer}
      className={cn(
        'flex items-center justify-center',
        'w-11 h-11 min-w-[44px] min-h-[44px]',
        'rounded-lg transition-colors',
        'text-porcelain hover:text-gold-500',
        'focus:outline-none focus:ring-2 focus:ring-gold-500/50',
        'active:scale-95'
      )}
      aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      aria-expanded={isOpen}
      aria-controls="mobile-nav-drawer"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.div>
    </button>
  );

  // Desktop navigation
  const DesktopNav = (
    <nav className="hidden lg:flex items-center gap-1">
      {hubs.map((hub) => {
        const Icon = hub.icon;
        return (
          <a
            key={hub.id}
            href={hub.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm font-medium transition-all duration-200',
              'text-porcelain/80 hover:text-porcelain',
              'hover:bg-white/10',
              hub.isActive && 'text-gold-500 bg-white/5'
            )}
          >
            <Icon size={18} />
            <span>{hub.label}</span>
          </a>
        );
      })}
      {items.length > 0 && (
        <div className="w-px h-6 bg-white/20 mx-2" />
      )}
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={cn(
            'px-4 py-2 rounded-lg text-sm',
            'text-porcelain/70 hover:text-porcelain',
            'transition-colors',
            item.isActive && 'text-gold-500'
          )}
          {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );

  // Mobile drawer content
  const DrawerContent = (
    <motion.div
      ref={drawerRef}
      id="mobile-nav-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className={cn(
        'fixed top-0 bottom-0',
        'w-[280px] max-w-[85vw]',
        'bg-prussian-blue/98 backdrop-blur-xl',
        'flex flex-col',
        'shadow-2xl',
        'z-50',
        position === 'left' ? 'left-0' : 'right-0'
      )}
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      variants={drawerVariants}
      initial="closed"
      animate={controls}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {brand || <div className="text-xl font-bold text-porcelain">NJZiteGeisTe</div>}
        <button
          onClick={closeDrawer}
          className={cn(
            'flex items-center justify-center',
            'w-11 h-11 min-w-[44px] min-h-[44px]',
            'rounded-lg transition-colors',
            'text-porcelain/70 hover:text-porcelain hover:bg-white/10',
            'focus:outline-none focus:ring-2 focus:ring-gold-500/50',
            'active:scale-95'
          )}
          aria-label="Close navigation"
        >
          <X size={24} />
        </button>
      </div>

      {/* Hub Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2 text-xs font-semibold text-porcelain/40 uppercase tracking-wider">
          Hubs
        </div>
        <nav className="px-2 space-y-1">
          {hubs.map((hub) => {
            const Icon = hub.icon;
            const isActive = activeHub === hub.id;
            const hasChildren = hub.children && hub.children.length > 0;

            return (
              <div key={hub.id}>
                <button
                  onClick={() => hasChildren ? toggleHub(hub.id) : closeDrawer()}
                  className={cn(
                    'w-full flex items-center justify-between',
                    'px-3 py-3 rounded-lg',
                    'text-left transition-all duration-200',
                    'min-h-[44px]',
                    hub.isActive
                      ? 'bg-white/10 text-gold-500'
                      : 'text-porcelain hover:bg-white/5 hover:text-porcelain'
                  )}
                >
                  <a
                    href={hub.href}
                    className="flex items-center gap-3 flex-1"
                    onClick={(e) => {
                      if (hasChildren) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        HUB_THEMES[hub.theme || 'tenet']
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="font-medium">{hub.label}</span>
                  </a>
                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: isActive ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={18} className="text-porcelain/50" />
                    </motion.div>
                  )}
                </button>

                {/* Sub-navigation */}
                <AnimatePresence>
                  {hasChildren && isActive && (
                    <motion.div
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      variants={hubItemVariants}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-12 pr-2 py-2 space-y-1">
                        {hub.children?.map((child) => (
                          <a
                            key={child.id}
                            href={child.href}
                            onClick={closeDrawer}
                            className={cn(
                              'block px-3 py-2 rounded-lg',
                              'text-sm transition-colors',
                              'min-h-[44px] flex items-center',
                              child.isActive
                                ? 'text-gold-500 bg-white/5'
                                : 'text-porcelain/70 hover:text-porcelain hover:bg-white/5'
                            )}
                            {...(child.external && { target: '_blank', rel: 'noopener noreferrer' })}
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Additional Items */}
        {items.length > 0 && (
          <>
            <div className="mx-4 my-4 h-px bg-white/10" />
            <div className="px-3 py-2 text-xs font-semibold text-porcelain/40 uppercase tracking-wider">
              More
            </div>
            <nav className="px-2 space-y-1">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={closeDrawer}
                  className={cn(
                    'flex items-center gap-3',
                    'px-3 py-3 rounded-lg',
                    'text-porcelain/80 hover:text-porcelain hover:bg-white/5',
                    'transition-all duration-200',
                    'min-h-[44px]'
                  )}
                  {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {item.icon && <item.icon size={20} className="text-porcelain/50" />}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-porcelain/40 text-center">
          NJZiteGeisTe Platform v2.0
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Navigation Bar */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'bg-prussian-blue/90 backdrop-blur-lg',
          'border-b border-white/10',
          className
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Menu button (mobile) or Brand */}
          <div className="flex items-center gap-2">
            {!isDesktop && (trigger || HamburgerButton)}
            <div className={cn(!isDesktop && 'ml-2')}>{brand}</div>
          </div>

          {/* Center/Right: Desktop nav or placeholder */}
          <div className="flex items-center gap-2">
            {isDesktop && DesktopNav}
            {/* Additional header actions can go here */}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div 
        className="h-14"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      />

      {/* Mobile Drawer */}
      {!isDesktop && (
        <>
          {showOverlay && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              variants={overlayVariants}
              initial="closed"
              animate={isOpen ? 'open' : 'closed'}
              onClick={closeDrawer}
              aria-hidden="true"
            />
          )}
          {DrawerContent}
        </>
      )}
    </>
  );
}

/**
 * Simple navigation link component
 */
export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  external?: boolean;
  className?: string;
  onClick?: () => void;
}

export function NavLink({
  href,
  children,
  isActive,
  external,
  className,
  onClick,
}: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2',
        'px-4 py-2 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'min-h-[44px]',
        isActive
          ? 'text-gold-500 bg-white/10'
          : 'text-porcelain/80 hover:text-porcelain hover:bg-white/5',
        className
      )}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {children}
    </a>
  );
}

export default CollapsibleNav;
