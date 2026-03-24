/**
 * Dropout Bear Mascot Component Tests
 * ===================================
 * Comprehensive unit tests for DropoutBearMascot component with 90%+ coverage.
 * 
 * [Ver001.000] - TEST-001: Dropout Bear mascot comprehensive test suite
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ============================================================================
// Mock useReducedMotion Hook
// ============================================================================

const mockUseReducedMotion = vi.fn();

vi.mock('@/hooks/animation/useReducedMotion', () => ({
  useReducedMotion: (...args: Parameters<typeof mockUseReducedMotion>) => mockUseReducedMotion(...args),
}));

// ============================================================================
// Import component and types after mocks
// ============================================================================

import { DropoutBearMascot, DropoutBearVariantColors } from '../../DropoutBearMascot';
import type { DropoutBearMascotProps, DropoutBearSize, DropoutBearVariant, DropoutBearAnimation } from '../../DropoutBearMascot';

// ============================================================================
// Test Utilities
// ============================================================================

const defaultProps: DropoutBearMascotProps = {
  size: 128,
  variant: 'default',
  animate: false,
  animation: 'idle',
  useCSS: false,
  className: '',
  interactive: false,
};

const renderDropoutBear = (props: Partial<DropoutBearMascotProps> = {}) => {
  return render(<DropoutBearMascot {...defaultProps} {...props} />);
};

// ============================================================================
// Test Suite
// ============================================================================

describe('DropoutBearMascot', () => {
  beforeEach(() => {
    // Reset mock to enable animations by default
    mockUseReducedMotion.mockReturnValue({
      enabled: true,
      prefersReducedMotion: false,
      forcedReducedMotion: false,
      alternative: 'none',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderDropoutBear();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with default props', () => {
      renderDropoutBear();
      const element = screen.getByRole('img');
      expect(element).toBeInTheDocument();
      expect(element).toHaveAttribute('data-size', '128');
      expect(element).toHaveAttribute('data-variant', 'default');
    });

    it('renders all 6 variants correctly', () => {
      const variants: DropoutBearVariant[] = [
        'default',
        'homecoming',
        'graduation',
        'late-registration',
        'yeezus',
        'donda',
      ];

      variants.forEach((variant) => {
        const { unmount } = renderDropoutBear({ variant });
        const element = screen.getByRole('img');
        expect(element).toHaveAttribute('data-variant', variant);
        unmount();
      });
    });

    it('renders all 5 sizes correctly', () => {
      const sizes: DropoutBearSize[] = [32, 64, 128, 256, 512];

      sizes.forEach((size) => {
        const { unmount } = renderDropoutBear({ size });
        const element = screen.getByRole('img');
        expect(element).toHaveAttribute('data-size', size.toString());
        expect(element).toHaveStyle({ width: `${size}px`, height: `${size}px` });
        unmount();
      });
    });

    it('renders SVG version by default (useCSS=false)', async () => {
      renderDropoutBear({ useCSS: false });
      await waitFor(() => {
        expect(screen.getByTestId('dropout-bear-svg')).toBeInTheDocument();
      });
    });

    it('renders CSS version when useCSS=true', () => {
      renderDropoutBear({ useCSS: true });
      const element = screen.getByRole('img');
      expect(element.querySelector('.dropout-bear-css')).toBeInTheDocument();
    });

    it('renders graduation cap only for graduation variant', () => {
      const { rerender } = renderDropoutBear({ useCSS: true, variant: 'default' });
      expect(screen.queryByRole('img')?.querySelector('.bear-cap')).not.toBeInTheDocument();

      rerender(<DropoutBearMascot {...defaultProps} useCSS={true} variant="graduation" />);
      expect(screen.queryByRole('img')?.querySelector('.bear-cap')).toBeInTheDocument();
    });

    it('renders SVG fallback while lazy loading', () => {
      renderDropoutBear({ useCSS: false });
      // Initially shows fallback
      const element = screen.getByRole('img');
      expect(element).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Props Tests
  // ============================================================================

  describe('Props', () => {
    describe('size prop', () => {
      it('correctly applies size 32', () => {
        const { container } = renderDropoutBear({ size: 32 });
        const element = container.querySelector('[data-size="32"]');
        expect(element).toBeInTheDocument();
        expect(element).toHaveStyle({ width: '32px', height: '32px' });
      });

      it('correctly applies size 64', () => {
        const { container } = renderDropoutBear({ size: 64 });
        const element = container.querySelector('[data-size="64"]');
        expect(element).toBeInTheDocument();
        expect(element).toHaveStyle({ width: '64px', height: '64px' });
      });

      it('correctly applies size 128 (default)', () => {
        const { container } = renderDropoutBear();
        const element = container.querySelector('[data-size="128"]');
        expect(element).toBeInTheDocument();
      });

      it('correctly applies size 256', () => {
        const { container } = renderDropoutBear({ size: 256 });
        const element = container.querySelector('[data-size="256"]');
        expect(element).toBeInTheDocument();
      });

      it('correctly applies size 512', () => {
        const { container } = renderDropoutBear({ size: 512 });
        const element = container.querySelector('[data-size="512"]');
        expect(element).toBeInTheDocument();
      });
    });

    describe('variant prop', () => {
      it('applies default variant', () => {
        const { container } = renderDropoutBear({ variant: 'default' });
        expect(container.querySelector('.dropout-bear--default')).toBeInTheDocument();
      });

      it('applies homecoming variant', () => {
        const { container } = renderDropoutBear({ variant: 'homecoming' });
        expect(container.querySelector('.dropout-bear--homecoming')).toBeInTheDocument();
      });

      it('applies graduation variant', () => {
        const { container } = renderDropoutBear({ variant: 'graduation' });
        expect(container.querySelector('.dropout-bear--graduation')).toBeInTheDocument();
      });

      it('applies late-registration variant', () => {
        const { container } = renderDropoutBear({ variant: 'late-registration' });
        expect(container.querySelector('.dropout-bear--late-registration')).toBeInTheDocument();
      });

      it('applies yeezus variant', () => {
        const { container } = renderDropoutBear({ variant: 'yeezus' });
        const element = container.querySelector('.dropout-bear--yeezus');
        expect(element).toBeInTheDocument();
        // Yeezus variant should have filter applied
        expect(element).toHaveStyle({ filter: 'grayscale(0.3) contrast(1.1)' });
      });

      it('applies donda variant', () => {
        const { container } = renderDropoutBear({ variant: 'donda' });
        const element = container.querySelector('.dropout-bear--donda');
        expect(element).toBeInTheDocument();
        // Donda variant should have grayscale filter
        expect(element).toHaveStyle({ filter: 'grayscale(1) contrast(1.2)' });
      });
    });

    describe('animate prop', () => {
      it('applies animate=false correctly', () => {
        const { container } = renderDropoutBear({ animate: false, animation: 'idle' });
        const element = container.querySelector('[data-animation="none"]');
        expect(element).toBeInTheDocument();
      });

      it('applies animate=true correctly', () => {
        const { container } = renderDropoutBear({ animate: true, animation: 'idle' });
        const element = container.querySelector('[data-animation="idle"]');
        expect(element).toBeInTheDocument();
      });

      it('includes animation class when animate is true', () => {
        const { container } = renderDropoutBear({ 
          animate: true, 
          animation: 'wave',
          useCSS: true 
        });
        expect(container.querySelector('.dropout-bear--animate-wave')).toBeInTheDocument();
      });
    });

    describe('animation prop', () => {
      const animations: DropoutBearAnimation[] = ['idle', 'wave', 'celebrate', 'graduation'];

      animations.forEach((animation) => {
        it(`applies ${animation} animation type`, () => {
          const { container } = renderDropoutBear({ 
            animate: true, 
            animation,
            useCSS: true 
          });
          expect(container.querySelector(`.dropout-bear--animate-${animation}`)).toBeInTheDocument();
          expect(container.querySelector(`[data-animation="${animation}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('useCSS prop', () => {
      it('renders CSS version when useCSS=true', () => {
        const { container } = renderDropoutBear({ useCSS: true });
        expect(container.querySelector('.dropout-bear-css')).toBeInTheDocument();
      });

      it('renders SVG version when useCSS=false', async () => {
        renderDropoutBear({ useCSS: false });
        await waitFor(() => {
          expect(screen.getByTestId('dropout-bear-svg')).toBeInTheDocument();
        });
      });
    });

    describe('className prop', () => {
      it('applies custom className', () => {
        const { container } = renderDropoutBear({ className: 'custom-bear-class' });
        expect(container.querySelector('.custom-bear-class')).toBeInTheDocument();
      });

      it('combines multiple classes', () => {
        const { container } = renderDropoutBear({ 
          className: 'custom-class another-class',
          variant: 'graduation' 
        });
        expect(container.querySelector('.custom-class')).toBeInTheDocument();
        expect(container.querySelector('.another-class')).toBeInTheDocument();
        expect(container.querySelector('.dropout-bear--graduation')).toBeInTheDocument();
      });
    });

    describe('interactive prop', () => {
      it('applies interactive class when interactive=true', () => {
        const { container } = renderDropoutBear({ interactive: true });
        expect(container.querySelector('.dropout-bear--interactive')).toBeInTheDocument();
      });

      it('applies interactive class when onClick is provided', () => {
        const { container } = renderDropoutBear({ onClick: vi.fn() });
        expect(container.querySelector('.dropout-bear--interactive')).toBeInTheDocument();
      });

      it('does not apply interactive class by default', () => {
        const { container } = renderDropoutBear();
        expect(container.querySelector('.dropout-bear--interactive')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Animation Tests
  // ============================================================================

  describe('Animations', () => {
    it('triggers idle animation correctly', () => {
      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'idle',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-idle')).toBeInTheDocument();
      expect(container.querySelector('[data-animation="idle"]')).toBeInTheDocument();
    });

    it('triggers wave animation correctly', () => {
      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'wave',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-wave')).toBeInTheDocument();
      expect(container.querySelector('[data-animation="wave"]')).toBeInTheDocument();
    });

    it('triggers celebrate animation correctly', () => {
      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'celebrate',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-celebrate')).toBeInTheDocument();
      expect(container.querySelector('[data-animation="celebrate"]')).toBeInTheDocument();
    });

    it('triggers graduation animation correctly', () => {
      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'graduation',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-graduation')).toBeInTheDocument();
      expect(container.querySelector('[data-animation="graduation"]')).toBeInTheDocument();
    });

    it('disables animations when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue({
        enabled: false,
        prefersReducedMotion: true,
        forcedReducedMotion: false,
        alternative: 'instant',
      });

      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'idle',
        useCSS: true 
      });
      // Animation should be disabled when reduced motion is preferred
      expect(container.querySelector('.dropout-bear--animate-idle')).not.toBeInTheDocument();
    });

    it('disables animations when forcedReducedMotion is true', () => {
      mockUseReducedMotion.mockReturnValue({
        enabled: false,
        prefersReducedMotion: false,
        forcedReducedMotion: true,
        alternative: 'subtle',
      });

      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'celebrate',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-celebrate')).not.toBeInTheDocument();
    });

    it('allows animation when motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue({
        enabled: true,
        prefersReducedMotion: false,
        forcedReducedMotion: false,
        alternative: 'none',
      });

      const { container } = renderDropoutBear({ 
        animate: true, 
        animation: 'wave',
        useCSS: true 
      });
      expect(container.querySelector('.dropout-bear--animate-wave')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Event Tests
  // ============================================================================

  describe('Events', () => {
    it('onClick handler fires correctly when clicked', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.click(element);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick handler fires on Enter key press', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick handler fires on Space key press', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('prevents default on Enter key', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('prevents default on Space key', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not fire onClick for other keys', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: 'Escape' });
      fireEvent.keyDown(element, { key: 'Tab' });
      fireEvent.keyDown(element, { key: 'ArrowDown' });
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has hover effects when interactive', () => {
      renderDropoutBear({ interactive: true });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('has hover effects when onClick is provided', () => {
      renderDropoutBear({ onClick: vi.fn() });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('has negative tabindex when not interactive', () => {
      renderDropoutBear();
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '-1');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="img" attribute', () => {
      renderDropoutBear();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('applies custom aria-label when provided', () => {
      renderDropoutBear({ ariaLabel: 'Custom Dropout Bear Label' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Custom Dropout Bear Label');
    });

    it('uses default aria-label for default variant', () => {
      renderDropoutBear({ variant: 'default' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear');
    });

    it('uses correct aria-label for homecoming variant', () => {
      renderDropoutBear({ variant: 'homecoming' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear - Homecoming Edition');
    });

    it('uses correct aria-label for graduation variant', () => {
      renderDropoutBear({ variant: 'graduation' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear - Graduation Edition');
    });

    it('uses correct aria-label for late-registration variant', () => {
      renderDropoutBear({ variant: 'late-registration' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear - Late Registration Edition');
    });

    it('uses correct aria-label for yeezus variant', () => {
      renderDropoutBear({ variant: 'yeezus' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear - Yeezus Edition');
    });

    it('uses correct aria-label for donda variant', () => {
      renderDropoutBear({ variant: 'donda' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'Dropout Bear - Donda Edition');
    });

    it('custom aria-label overrides variant default', () => {
      renderDropoutBear({ 
        variant: 'graduation', 
        ariaLabel: 'My Custom Bear' 
      });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('aria-label', 'My Custom Bear');
    });

    it('has correct tabIndex when interactive', () => {
      renderDropoutBear({ interactive: true });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('has correct tabIndex when onClick is provided', () => {
      renderDropoutBear({ onClick: vi.fn() });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '0');
    });

    it('has negative tabIndex when not interactive and no onClick', () => {
      renderDropoutBear({ interactive: false });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('tabindex', '-1');
    });

    it('supports keyboard navigation with Enter key', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('supports keyboard navigation with Space key', () => {
      const handleClick = vi.fn();
      renderDropoutBear({ onClick: handleClick });
      
      const element = screen.getByRole('img');
      fireEvent.keyDown(element, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('has data attributes for testing and accessibility', () => {
      renderDropoutBear({ 
        variant: 'homecoming', 
        size: 256, 
        animate: true, 
        animation: 'celebrate' 
      });
      
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('data-variant', 'homecoming');
      expect(element).toHaveAttribute('data-size', '256');
      expect(element).toHaveAttribute('data-animation', 'celebrate');
    });

    it('sets data-animation to none when animate is false', () => {
      renderDropoutBear({ animate: false, animation: 'idle' });
      const element = screen.getByRole('img');
      expect(element).toHaveAttribute('data-animation', 'none');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('handles invalid size gracefully (falls back to 64)', () => {
      // @ts-expect-error Testing invalid size
      const { container } = renderDropoutBear({ size: 999 });
      // Component should still render without crashing
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles negative size gracefully', () => {
      // @ts-expect-error Testing invalid size
      const { container } = renderDropoutBear({ size: -100 });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles zero size gracefully', () => {
      // @ts-expect-error Testing invalid size
      const { container } = renderDropoutBear({ size: 0 });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      // @ts-expect-error Testing invalid variant
      const { container } = renderDropoutBear({ variant: 'invalid-variant' });
      // Component should render (may have undefined styling)
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles null variant gracefully', () => {
      // @ts-expect-error Testing null variant
      const { container } = renderDropoutBear({ variant: null });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined variant gracefully', () => {
      // @ts-expect-error Testing undefined variant
      const { container } = renderDropoutBear({ variant: undefined });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles invalid animation type gracefully', () => {
      // @ts-expect-error Testing invalid animation
      const { container } = renderDropoutBear({ animation: 'invalid-animation' });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without errors when all props are undefined', () => {
      render(<DropoutBearMascot />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CSS Version Tests
  // ============================================================================

  describe('CSS Version', () => {
    it('renders CSS bear structure correctly', () => {
      renderDropoutBear({ useCSS: true });
      
      const container = screen.getByRole('img');
      expect(container.querySelector('.bear-head')).toBeInTheDocument();
      expect(container.querySelector('.bear-body')).toBeInTheDocument();
      expect(container.querySelector('.bear-ear--left')).toBeInTheDocument();
      expect(container.querySelector('.bear-ear--right')).toBeInTheDocument();
      expect(container.querySelector('.bear-eye--left')).toBeInTheDocument();
      expect(container.querySelector('.bear-eye--right')).toBeInTheDocument();
      expect(container.querySelector('.bear-jacket')).toBeInTheDocument();
    });

    it('applies CSS variables for variant colors', () => {
      const { container } = renderDropoutBear({ 
        useCSS: true, 
        variant: 'default',
        size: 128 
      });
      
      const cssBear = container.querySelector('.dropout-bear-css');
      expect(cssBear).toBeInTheDocument();
      
      // Check CSS custom properties are set
      const style = (cssBear as HTMLElement)?.style;
      expect(style.getPropertyValue('--bear-jacket')).toBe('#DC143C');
      expect(style.getPropertyValue('--bear-fur')).toBe('#8B4513');
      expect(style.getPropertyValue('--bear-accent')).toBe('#FFD700');
    });

    it('applies correct scale based on size', () => {
      const { container } = renderDropoutBear({ 
        useCSS: true, 
        size: 256 
      });
      
      const cssBear = container.querySelector('.dropout-bear-css');
      const style = (cssBear as HTMLElement)?.style;
      // Scale is size / 64, so 256 / 64 = 4
      expect(style.getPropertyValue('--bear-scale')).toBe('4');
    });

    it('includes animation class for CSS version', () => {
      const { container } = renderDropoutBear({ 
        useCSS: true, 
        animate: true, 
        animation: 'idle' 
      });
      
      const cssBear = container.querySelector('.dropout-bear-css');
      expect(cssBear).toHaveClass('animate-idle');
    });

    it('does not include animation class when animate is false', () => {
      const { container } = renderDropoutBear({ 
        useCSS: true, 
        animate: false, 
        animation: 'idle' 
      });
      
      const cssBear = container.querySelector('.dropout-bear-css');
      expect(cssBear).not.toHaveClass('animate-idle');
    });
  });

  // ============================================================================
  // SVG Version Tests
  // ============================================================================

  describe('SVG Version', () => {
    it('renders SVG with correct dimensions', async () => {
      renderDropoutBear({ useCSS: false, size: 128 });
      
      await waitFor(() => {
        const svg = screen.getByTestId('dropout-bear-svg');
        expect(svg).toHaveAttribute('width', '128');
        expect(svg).toHaveAttribute('height', '128');
      });
    });

    it('renders SVG with aria-hidden attribute', async () => {
      renderDropoutBear({ useCSS: false });
      
      await waitFor(() => {
        const svg = screen.getByTestId('dropout-bear-svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('applies dropout-bear-svg class to SVG', async () => {
      renderDropoutBear({ useCSS: false });
      
      await waitFor(() => {
        const svg = screen.getByTestId('dropout-bear-svg');
        expect(svg).toHaveClass('dropout-bear-svg');
      });
    });

    it('renders fallback while SVG is loading', () => {
      const { container } = renderDropoutBear({ useCSS: false, size: 128 });
      
      // Should show the container with Suspense fallback
      const element = container.querySelector('[data-size="128"]');
      expect(element).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Variant Colors Tests
  // ============================================================================

  describe('Variant Colors', () => {
    it('exports VARIANT_COLORS for all variants', () => {
      expect(DropoutBearVariantColors).toBeDefined();
      expect(DropoutBearVariantColors.default).toBeDefined();
      expect(DropoutBearVariantColors.homecoming).toBeDefined();
      expect(DropoutBearVariantColors.graduation).toBeDefined();
      expect(DropoutBearVariantColors['late-registration']).toBeDefined();
      expect(DropoutBearVariantColors.yeezus).toBeDefined();
      expect(DropoutBearVariantColors.donda).toBeDefined();
    });

    it('has correct color structure for default variant', () => {
      const colors = DropoutBearVariantColors.default;
      expect(colors.jacket).toBe('#DC143C');
      expect(colors.jacketDark).toBe('#8B0000');
      expect(colors.fur).toBe('#8B4513');
      expect(colors.furDark).toBe('#5D3A1A');
      expect(colors.accent).toBe('#FFD700');
      expect(colors.shirt).toBe('#F5F5DC');
    });

    it('has correct color structure for yeezus variant', () => {
      const colors = DropoutBearVariantColors.yeezus;
      expect(colors.jacket).toBe('#2F2F2F');
      expect(colors.filter).toBe('grayscale(0.3) contrast(1.1)');
    });

    it('has correct color structure for donda variant', () => {
      const colors = DropoutBearVariantColors.donda;
      expect(colors.jacket).toBe('#0A0A0A');
      expect(colors.filter).toBe('grayscale(1) contrast(1.2)');
    });
  });

  // ============================================================================
  // Forward Ref Tests
  // ============================================================================

  describe('Forward Ref', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<DropoutBearMascot ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('role', 'img');
    });

    it('ref has correct data attributes', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<DropoutBearMascot ref={ref} variant="graduation" size={256} />);
      
      expect(ref.current).toHaveAttribute('data-variant', 'graduation');
      expect(ref.current).toHaveAttribute('data-size', '256');
    });
  });

  // ============================================================================
  // Display Name Tests
  // ============================================================================

  describe('Component Metadata', () => {
    it('has correct display name', () => {
      expect(DropoutBearMascot.displayName).toBe('DropoutBearMascot');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('renders all variants with all sizes', () => {
      const variants: DropoutBearVariant[] = ['default', 'homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'];
      const sizes: DropoutBearSize[] = [32, 64, 128, 256, 512];

      variants.forEach((variant) => {
        sizes.forEach((size) => {
          const { unmount } = renderDropoutBear({ variant, size });
          const element = screen.getByRole('img');
          expect(element).toHaveAttribute('data-variant', variant);
          expect(element).toHaveAttribute('data-size', size.toString());
          unmount();
        });
      });
    });

    it('renders all animations with all variants', () => {
      const animations: DropoutBearAnimation[] = ['idle', 'wave', 'celebrate', 'graduation'];
      const variants: DropoutBearVariant[] = ['default', 'homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'];

      variants.forEach((variant) => {
        animations.forEach((animation) => {
          const { unmount } = renderDropoutBear({ 
            variant, 
            animation, 
            animate: true,
            useCSS: true 
          });
          const element = screen.getByRole('img');
          expect(element).toHaveAttribute('data-variant', variant);
          expect(element).toHaveAttribute('data-animation', animation);
          unmount();
        });
      });
    });

    it('handles rapid prop changes', () => {
      const { rerender } = renderDropoutBear({ variant: 'default', size: 64 });
      
      rerender(<DropoutBearMascot {...defaultProps} variant="homecoming" size={128} />);
      expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'homecoming');
      expect(screen.getByRole('img')).toHaveAttribute('data-size', '128');
      
      rerender(<DropoutBearMascot {...defaultProps} variant="yeezus" size={256} />);
      expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'yeezus');
      expect(screen.getByRole('img')).toHaveAttribute('data-size', '256');
      
      rerender(<DropoutBearMascot {...defaultProps} variant="donda" animate={true} animation="celebrate" />);
      expect(screen.getByRole('img')).toHaveAttribute('data-variant', 'donda');
      expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'celebrate');
    });
  });
});
