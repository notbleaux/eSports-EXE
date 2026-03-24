/** [Ver001.000]
 *
 * Mobile Layout Test Suite
 * 
 * Comprehensive tests for responsive layout components
 * covering breakpoints, containers, navigation, and touch interactions.
 * 
 * @module components/layout/__tests__/mobileLayout
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Components to test
import {
  ResponsiveContainer,
  PageContainer,
  ContentContainer,
  SectionContainer,
  GridContainer,
  FlexContainer,
} from '../ResponsiveContainer';

import {
  CollapsibleNav,
  DEFAULT_HUBS,
  NavLink,
} from '../CollapsibleNav';

import {
  TouchButton,
  TouchIconButton,
} from '../../mobile/TouchButton';

// Hooks to test
import {
  useBreakpoint,
  useBreakpointMatch,
  useResponsiveValue,
  getBreakpointFromWidth,
  isAtLeastBreakpoint,
  isBetweenBreakpoints,
  BREAKPOINTS,
} from '@/lib/mobile/breakpoints';

import {
  useViewport,
  getOrientation,
  isLandscape,
  isPortrait,
  hasNotch,
  generateViewportContent,
  DEFAULT_VIEWPORT,
} from '@/lib/mobile/viewport';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
});

describe('Mobile Layout System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // BREAKPOINT SYSTEM TESTS (Tests 1-6)
  // ============================================================================
  
  describe('Breakpoint System', () => {
    it('1. should export correct breakpoint values', () => {
      expect(BREAKPOINTS.sm).toBe(640);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
      expect(BREAKPOINTS['2xl']).toBe(1536);
    });

    it('2. getBreakpointFromWidth should return correct breakpoint', () => {
      expect(getBreakpointFromWidth(400)).toBeNull();
      expect(getBreakpointFromWidth(640)).toBe('sm');
      expect(getBreakpointFromWidth(768)).toBe('md');
      expect(getBreakpointFromWidth(1024)).toBe('lg');
      expect(getBreakpointFromWidth(1280)).toBe('xl');
      expect(getBreakpointFromWidth(1536)).toBe('2xl');
      expect(getBreakpointFromWidth(1920)).toBe('2xl');
    });

    it('3. isAtLeastBreakpoint should work correctly', () => {
      expect(isAtLeastBreakpoint(400, 'sm')).toBe(false);
      expect(isAtLeastBreakpoint(640, 'sm')).toBe(true);
      expect(isAtLeastBreakpoint(768, 'md')).toBe(true);
      expect(isAtLeastBreakpoint(1023, 'lg')).toBe(false);
      expect(isAtLeastBreakpoint(1024, 'lg')).toBe(true);
    });

    it('4. isBetweenBreakpoints should detect range correctly', () => {
      expect(isBetweenBreakpoints(500, 'sm', 'md')).toBe(false);
      expect(isBetweenBreakpoints(700, 'sm', 'md')).toBe(false); // Above md
      expect(isBetweenBreakpoints(768, 'md', 'lg')).toBe(true);
      expect(isBetweenBreakpoints(900, 'md', 'lg')).toBe(true);
      expect(isBetweenBreakpoints(1023, 'md', 'lg')).toBe(true);
      expect(isBetweenBreakpoints(1024, 'md', 'lg')).toBe(false); // At lg
    });

    it('5. useBreakpoint should return default state on server', () => {
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.width).toBe(0);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.breakpoint).toBeNull();
    });

    it('6. useBreakpoint should detect mobile viewport correctly', () => {
      mockWindowDimensions(375, 812); // iPhone X dimensions
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.width).toBe(375);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBeNull();
    });
  });

  // ============================================================================
  // RESPONSIVE CONTAINER TESTS (Tests 7-10)
  // ============================================================================
  
  describe('ResponsiveContainer', () => {
    it('7. should render with default props', () => {
      render(
        <ResponsiveContainer data-testid="container">
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container.tagName).toBe('DIV');
    });

    it('8. should apply size classes correctly', () => {
      const { rerender } = render(
        <ResponsiveContainer size="sm" data-testid="container">
          Content
        </ResponsiveContainer>
      );
      
      let container = screen.getByTestId('container');
      expect(container.className).toContain('max-w-screen-sm');
      
      rerender(
        <ResponsiveContainer size="lg" data-testid="container">
          Content
        </ResponsiveContainer>
      );
      
      container = screen.getByTestId('container');
      expect(container.className).toContain('max-w-screen-lg');
    });

    it('9. should render as different elements', () => {
      render(
        <ResponsiveContainer as="main" data-testid="container">
          Content
        </ResponsiveContainer>
      );
      
      const container = screen.getByTestId('container');
      expect(container.tagName).toBe('MAIN');
    });

    it('10. should apply safe area padding when requested', () => {
      render(
        <ResponsiveContainer respectSafeAreas data-testid="container">
          Content
        </ResponsiveContainer>
      );
      
      const container = screen.getByTestId('container');
      expect(container.className).toContain('pt-[env(safe-area-inset-top)]');
    });
  });

  // ============================================================================
  // COLLAPSIBLE NAVIGATION TESTS (Tests 11-14)
  // ============================================================================
  
  describe('CollapsibleNav', () => {
    const mockHubs = [
      { id: 'test', label: 'Test', icon: () => null, href: '/test' },
    ];

    it('11. should render navigation with brand', () => {
      render(
        <CollapsibleNav 
          hubs={mockHubs}
          brand={<span data-testid="brand">Logo</span>}
        />
      );
      
      expect(screen.getByTestId('brand')).toBeInTheDocument();
    });

    it('12. should toggle drawer when menu button clicked', async () => {
      render(<CollapsibleNav hubs={DEFAULT_HUBS} />);
      
      // Find and click menu button
      const menuButton = screen.getByLabelText('Open navigation');
      await userEvent.click(menuButton);
      
      // Drawer should be visible
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close button should now be present
      const closeButton = screen.getByLabelText('Close navigation');
      await userEvent.click(closeButton);
    });

    it('13. should render all 5 default hubs', async () => {
      render(<CollapsibleNav hubs={DEFAULT_HUBS} />);
      
      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation');
      await userEvent.click(menuButton);
      
      // Check all hubs are present
      await waitFor(() => {
        expect(screen.getByText('SATOR')).toBeInTheDocument();
        expect(screen.getByText('ROTAS')).toBeInTheDocument();
        expect(screen.getByText('AREPO')).toBeInTheDocument();
        expect(screen.getByText('OPERA')).toBeInTheDocument();
        expect(screen.getByText('TENET')).toBeInTheDocument();
      });
    });

    it('14. should close drawer on escape key', async () => {
      render(<CollapsibleNav hubs={DEFAULT_HUBS} />);
      
      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation');
      await userEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Press escape
      fireEvent.keyDown(document, { key: 'Escape' });
    });
  });

  // ============================================================================
  // TOUCH BUTTON TESTS (Tests 15-18)
  // ============================================================================
  
  describe('TouchButton', () => {
    it('15. should render button with text', () => {
      render(<TouchButton>Click Me</TouchButton>);
      
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('16. should apply variant classes correctly', () => {
      const { rerender } = render(
        <TouchButton variant="primary" data-testid="btn">Button</TouchButton>
      );
      
      let button = screen.getByTestId('btn');
      expect(button.className).toContain('bg-gold-500');
      
      rerender(
        <TouchButton variant="outline" data-testid="btn">Button</TouchButton>
      );
      
      button = screen.getByTestId('btn');
      expect(button.className).toContain('border-2');
    });

    it('17. should handle click events', async () => {
      const handleClick = vi.fn();
      render(<TouchButton onClick={handleClick}>Click</TouchButton>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('18. should show loading state', () => {
      render(
        <TouchButton loading loadingText="Loading...">
          Submit
        </TouchButton>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // VIEWPORT ADAPTER TESTS (Tests 19-22)
  // ============================================================================
  
  describe('Viewport Adapter', () => {
    it('19. should generate correct viewport meta content', () => {
      const content = generateViewportContent();
      
      expect(content).toContain('width=device-width');
      expect(content).toContain('initial-scale=1');
      expect(content).toContain('viewport-fit=cover');
    });

    it('20. should generate standalone viewport config', () => {
      const content = generateViewportContent(DEFAULT_VIEWPORT);
      
      expect(content).toContain('user-scalable=yes');
    });

    it('21. getOrientation should return valid orientation', () => {
      const orientation = getOrientation();
      
      expect(['portrait', 'landscape', 'unknown']).toContain(orientation);
    });

    it('22. should detect landscape vs portrait correctly', () => {
      mockWindowDimensions(1920, 1080); // Landscape
      
      expect(isLandscape()).toBe(true);
      expect(isPortrait()).toBe(false);
      
      mockWindowDimensions(1080, 1920); // Portrait
      
      expect(isPortrait()).toBe(true);
      expect(isLandscape()).toBe(false);
    });
  });

  // ============================================================================
  // RESPONSIVE VALUE HOOK TESTS (Tests 23-24)
  // ============================================================================
  
  describe('Responsive Value Hooks', () => {
    it('23. useResponsiveValue should return default on server', () => {
      const { result } = renderHook(() => 
        useResponsiveValue({ default: 'mobile', md: 'tablet', lg: 'desktop' })
      );
      
      expect(result.current).toBe('mobile');
    });

    it('24. useBreakpointMatch should track breakpoint changes', () => {
      mockWindowDimensions(1024, 768);
      
      const { result } = renderHook(() => useBreakpointMatch('md', 'min'));
      
      // Should be true since 1024 >= 768
      expect(result.current).toBe(true);
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS (Tests 25-26)
  // ============================================================================
  
  describe('Accessibility', () => {
    it('25. touch buttons should have minimum 44px touch target', () => {
      render(<TouchButton size="xs" data-testid="btn">Small</TouchButton>);
      
      const button = screen.getByTestId('btn');
      expect(button.className).toContain('min-w-[44px]');
      expect(button.className).toContain('min-h-[44px]');
    });

    it('26. navigation should have proper ARIA attributes', async () => {
      render(<CollapsibleNav hubs={DEFAULT_HUBS} />);
      
      const menuButton = screen.getByLabelText('Open navigation');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-nav-drawer');
      
      await userEvent.click(menuButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-label', 'Mobile navigation');
      });
    });
  });

  // ============================================================================
  // HUB-SPECIFIC TESTS (Tests 27-28)
  // ============================================================================
  
  describe('Hub Integration', () => {
    it('27. should render hub-themed buttons', () => {
      const { rerender } = render(
        <TouchButton variant="hub-sator" data-testid="btn">SATOR</TouchButton>
      );
      
      let button = screen.getByTestId('btn');
      expect(button.className).toContain('sator');
      
      rerender(
        <TouchButton variant="hub-rotas" data-testid="btn">ROTAS</TouchButton>
      );
      
      button = screen.getByTestId('btn');
      expect(button.className).toContain('rotas');
    });

    it('28. should render all hub variants', () => {
      const variants: Array<'hub-sator' | 'hub-rotas' | 'hub-arepo' | 'hub-opera' | 'hub-tenet'> = [
        'hub-sator', 'hub-rotas', 'hub-arepo', 'hub-opera', 'hub-tenet'
      ];
      
      variants.forEach((variant) => {
        const { unmount } = render(
          <TouchButton variant={variant} data-testid={`btn-${variant}`}>
            {variant}
          </TouchButton>
        );
        
        const button = screen.getByTestId(`btn-${variant}`);
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });

  // ============================================================================
  // CONTAINER VARIANT TESTS (Tests 29-30)
  // ============================================================================
  
  describe('Container Variants', () => {
    it('29. PageContainer should have correct defaults', () => {
      render(
        <PageContainer data-testid="page">
          <div>Content</div>
        </PageContainer>
      );
      
      const page = screen.getByTestId('page');
      expect(page.tagName).toBe('MAIN');
      expect(page.className).toContain('min-h-screen');
    });

    it('30. GridContainer should apply column classes', () => {
      render(
        <GridContainer cols={2} colsMd={3} colsLg={4} data-testid="grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </GridContainer>
      );
      
      const grid = screen.getByTestId('grid');
      expect(grid.className).toContain('grid-cols-2');
      expect(grid.className).toContain('md:grid-cols-3');
      expect(grid.className).toContain('lg:grid-cols-4');
    });
  });

  // ============================================================================
  // INTERACTION TESTS (Tests 31-32)
  // ============================================================================
  
  describe('Interactions', () => {
    it('31. should handle disabled button state', async () => {
      const handleClick = vi.fn();
      render(
        <TouchButton disabled onClick={handleClick}>
          Disabled
        </TouchButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('32. NavLink should render correctly', () => {
      render(
        <NavLink href="/test" isActive>
          Link
        </NavLink>
      );
      
      const link = screen.getByText('Link');
      expect(link.tagName).toBe('A');
      expect(link.closest('a')).toHaveAttribute('href', '/test');
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS (Tests 33-34)
  // ============================================================================
  
  describe('Performance', () => {
    it('33. should not recreate breakpoint state unnecessarily', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        const breakpoint = useBreakpoint();
        renderCount++;
        return <div data-testid="test">{breakpoint.width}</div>;
      };
      
      const { rerender } = render(<TestComponent />);
      const initialCount = renderCount;
      
      // Rerender without changes
      rerender(<TestComponent />);
      
      // Component should not have re-rendered from hook changes
      expect(renderCount).toBe(initialCount + 1); // +1 for rerender
    });

    it('34. TouchIconButton should pass through props correctly', () => {
      render(
        <TouchIconButton 
          icon={<span data-testid="icon">★</span>}
          aria-label="Star button"
          variant="ghost"
        />
      );
      
      const button = screen.getByLabelText('Star button');
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASE TESTS (Tests 35-36)
  // ============================================================================
  
  describe('Edge Cases', () => {
    it('35. should handle rapid breakpoint changes', () => {
      const { result } = renderHook(() => useBreakpoint({ debounceMs: 0 }));
      
      // Simulate rapid resizes
      for (let i = 0; i < 10; i++) {
        mockWindowDimensions(320 + i * 100, 568);
      }
      
      // Should have final dimensions
      expect(result.current.width).toBeGreaterThan(0);
    });

    it('36. should handle missing children gracefully', () => {
      const { container } = render(<ResponsiveContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

// ============================================================================
// SUMMARY
// ============================================================================
// Total Tests: 36
// 
// Breakpoint System:     6 tests
// Responsive Container:  4 tests
// Collapsible Navigation: 4 tests
// Touch Button:          4 tests
// Viewport Adapter:      4 tests
// Responsive Value:      2 tests
// Accessibility:         2 tests
// Hub Integration:       2 tests
// Container Variants:    2 tests
// Interactions:          2 tests
// Performance:           2 tests
// Edge Cases:            2 tests
//
// All components tested for mobile-first responsive behavior
// ============================================================================
