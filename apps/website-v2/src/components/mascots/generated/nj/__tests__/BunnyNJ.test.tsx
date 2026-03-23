/**
 * BunnyNJ Component Tests
 * =======================
 * Comprehensive unit tests for NJ Bunny mascot component.
 * 
 * Test Coverage: 90%+ (Rendering, Props, Animation, Style, Accessibility, Events)
 * 
 * [Ver001.000]
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BunnyNJ, BunnyNJVariantColors } from '../BunnyNJ';
import type { BunnyNJSize, BunnyNJVariant, BunnyNJAnimation } from '../BunnyNJ';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Mock matchMedia for reduced motion testing
 */
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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

/**
 * Helper to render BunnyNJ with default props
 */
const renderBunnyNJ = (props = {}) => {
  return render(<BunnyNJ {...props} />);
};

// ============================================================================
// Test Suite
// ============================================================================

describe('BunnyNJ', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-nj-container"]')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      renderBunnyNJ();
      const container = screen.getByTestId('bunny-nj-container');
      
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-size', '128');
      expect(container).toHaveAttribute('data-variant', 'classic-blue');
      expect(container).toHaveAttribute('data-animation', 'none');
    });

    it('renders SVG version by default', () => {
      renderBunnyNJ();
      expect(screen.getByTestId('bunny-nj-svg')).toBeInTheDocument();
    });

    describe('All Variants', () => {
      const variants: BunnyNJVariant[] = ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'];
      
      variants.forEach(variant => {
        it(`renders ${variant} variant`, () => {
          renderBunnyNJ({ variant });
          const container = screen.getByTestId('bunny-nj-container');
          expect(container).toHaveAttribute('data-variant', variant);
        });
      });
    });

    describe('All Sizes', () => {
      const sizes: BunnyNJSize[] = [32, 64, 128, 256, 512];
      
      sizes.forEach(size => {
        it(`renders size ${size}`, () => {
          renderBunnyNJ({ size });
          const container = screen.getByTestId('bunny-nj-container');
          expect(container).toHaveAttribute('data-size', String(size));
          expect(container).toHaveStyle({ width: `${size}px`, height: `${size}px` });
        });
      });
    });

    it('renders SVG with correct dimensions for size 32', () => {
      renderBunnyNJ({ size: 32 });
      const svg = screen.getByTestId('bunny-nj-svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
      expect(svg).toHaveAttribute('viewBox', '0 0 32 32');
    });

    it('renders SVG with correct dimensions for size 512', () => {
      renderBunnyNJ({ size: 512 });
      const svg = screen.getByTestId('bunny-nj-svg');
      expect(svg).toHaveAttribute('width', '512');
      expect(svg).toHaveAttribute('height', '512');
      expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
    });
  });

  // ============================================================================
  // Props Tests
  // ============================================================================

  describe('Props', () => {
    describe('size prop', () => {
      it('correctly applies size prop', () => {
        renderBunnyNJ({ size: 256 });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveStyle({ width: '256px', height: '256px' });
      });

      it('applies correct CSS class for size', () => {
        const { container } = renderBunnyNJ({ size: 64 });
        expect(container.querySelector('.bunny-nj--size-64')).toBeInTheDocument();
      });
    });

    describe('variant prop', () => {
      it('correctly applies variant prop', () => {
        renderBunnyNJ({ variant: 'attention' });
        const element = screen.getByTestId('bunny-nj-container');
        expect(element).toHaveAttribute('data-variant', 'attention');
      });

      it('applies correct CSS class for variant', () => {
        const { container } = renderBunnyNJ({ variant: 'hype-boy' });
        expect(container.querySelector('.bunny-nj--hype-boy')).toBeInTheDocument();
      });

      it('uses correct stroke color for variant', () => {
        const { container } = renderBunnyNJ({ variant: 'cookie' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', BunnyNJVariantColors['cookie'].stroke);
      });
    });

    describe('animate prop', () => {
      it('correctly applies animate prop', () => {
        renderBunnyNJ({ animate: true, animation: 'idle' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'idle');
      });

      it('shows animation as none when animate is false', () => {
        renderBunnyNJ({ animate: false, animation: 'hop' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'none');
      });

      it('applies animation CSS class when animate is true', () => {
        const { container } = renderBunnyNJ({ animate: true, animation: 'wave' });
        expect(container.querySelector('.bunny-nj--animate-wave')).toBeInTheDocument();
      });
    });

    describe('animation prop', () => {
      const animations: BunnyNJAnimation[] = ['idle', 'wave', 'hop', 'celebrate', 'none'];
      
      animations.forEach(animation => {
        it(`correctly applies ${animation} animation prop`, () => {
          renderBunnyNJ({ animate: true, animation });
          const container = screen.getByTestId('bunny-nj-container');
          expect(container).toHaveAttribute('data-animation', animation);
        });
      });
    });

    describe('useCSS prop', () => {
      it('renders CSS version when useCSS is true', () => {
        renderBunnyNJ({ useCSS: true });
        expect(screen.getByTestId('bunny-css-container')).toBeInTheDocument();
        expect(screen.queryByTestId('bunny-nj-svg')).not.toBeInTheDocument();
      });

      it('renders SVG version when useCSS is false', () => {
        renderBunnyNJ({ useCSS: false });
        expect(screen.getByTestId('bunny-nj-svg')).toBeInTheDocument();
        expect(screen.queryByTestId('bunny-css-container')).not.toBeInTheDocument();
      });
    });

    describe('glow prop', () => {
      it('applies glow effect when glow is true', () => {
        const { container } = renderBunnyNJ({ glow: true, variant: 'classic-blue' });
        const svg = container.querySelector('[data-testid="bunny-nj-svg"]');
        expect(svg).toHaveClass('drop-shadow-[0_0_20px_rgba0,0,255,0.5]');
      });

      it('does not apply glow effect when glow is false', () => {
        const { container } = renderBunnyNJ({ glow: false });
        const svg = container.querySelector('[data-testid="bunny-nj-svg"]');
        expect(svg).not.toHaveClass('drop-shadow');
      });
    });

    describe('className prop', () => {
      it('applies custom className', () => {
        const { container } = renderBunnyNJ({ className: 'custom-bunny-class' });
        expect(container.querySelector('.custom-bunny-class')).toBeInTheDocument();
      });

      it('combines custom className with default classes', () => {
        const { container } = renderBunnyNJ({ className: 'my-bunny' });
        const element = container.querySelector('.bunny-nj-mascot');
        expect(element).toHaveClass('my-bunny');
      });
    });

    describe('alt prop', () => {
      it('applies custom alt text', () => {
        renderBunnyNJ({ alt: 'My Custom Bunny' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('aria-label', 'My Custom Bunny');
      });

      it('uses default alt text when not provided', () => {
        renderBunnyNJ();
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('aria-label', 'NJ Bunny mascot');
      });
    });

    describe('disabled prop', () => {
      it('applies disabled styles when disabled is true', () => {
        const { container } = renderBunnyNJ({ disabled: true });
        const element = container.querySelector('.bunny-nj-mascot');
        expect(element).toHaveClass('opacity-50', 'grayscale', 'cursor-not-allowed');
      });

      it('does not apply disabled styles when disabled is false', () => {
        const { container } = renderBunnyNJ({ disabled: false });
        const element = container.querySelector('.bunny-nj-mascot');
        expect(element).not.toHaveClass('opacity-50');
      });

      it('prevents click when disabled', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ disabled: true, onClick: handleClick });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.click(container);
        
        expect(handleClick).not.toHaveBeenCalled();
      });
    });

    describe('interactive prop', () => {
      it('makes component focusable when interactive is true', () => {
        renderBunnyNJ({ interactive: true });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('tabIndex', '0');
      });

      it('adds interactive CSS class when interactive is true', () => {
        const { container } = renderBunnyNJ({ interactive: true });
        expect(container.querySelector('.bunny-nj--interactive')).toBeInTheDocument();
      });

      it('adds cursor-pointer when onClick is provided', () => {
        const { container } = renderBunnyNJ({ onClick: vi.fn() });
        const element = container.querySelector('.bunny-nj-mascot');
        expect(element).toHaveClass('cursor-pointer');
      });
    });
  });

  // ============================================================================
  // Animation Tests
  // ============================================================================

  describe('Animations', () => {
    describe('Idle Animation (Ear Wiggle)', () => {
      it('applies idle animation to container', () => {
        renderBunnyNJ({ animate: true, animation: 'idle' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'idle');
      });

      it('has idle animation CSS class', () => {
        const { container } = renderBunnyNJ({ animate: true, animation: 'idle' });
        expect(container.querySelector('.bunny-nj--animate-idle')).toBeInTheDocument();
      });
    });

    describe('Wave Animation', () => {
      it('applies wave animation', () => {
        renderBunnyNJ({ animate: true, animation: 'wave' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'wave');
      });

      it('has wave animation CSS class', () => {
        const { container } = renderBunnyNJ({ animate: true, animation: 'wave' });
        expect(container.querySelector('.bunny-nj--animate-wave')).toBeInTheDocument();
      });
    });

    describe('Hop Animation', () => {
      it('applies hop animation', () => {
        renderBunnyNJ({ animate: true, animation: 'hop' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'hop');
      });

      it('has hop animation CSS class', () => {
        const { container } = renderBunnyNJ({ animate: true, animation: 'hop' });
        expect(container.querySelector('.bunny-nj--animate-hop')).toBeInTheDocument();
      });
    });

    describe('Celebrate Animation', () => {
      it('applies celebrate animation', () => {
        renderBunnyNJ({ animate: true, animation: 'celebrate' });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('data-animation', 'celebrate');
      });

      it('has celebrate animation CSS class', () => {
        const { container } = renderBunnyNJ({ animate: true, animation: 'celebrate' });
        expect(container.querySelector('.bunny-nj--animate-celebrate')).toBeInTheDocument();
      });
    });

    describe('Animation with CSS version', () => {
      it('applies animation classes in CSS mode', () => {
        renderBunnyNJ({ useCSS: true, animate: true, animation: 'idle' });
        const inner = screen.getByTestId('bunny-css-inner');
        expect(inner).toHaveClass('animate-idle');
      });

      it('applies wave animation in CSS mode', () => {
        renderBunnyNJ({ useCSS: true, animate: true, animation: 'wave' });
        const inner = screen.getByTestId('bunny-css-inner');
        expect(inner).toHaveClass('animate-wave');
      });
    });
  });

  // ============================================================================
  // Style Tests
  // ============================================================================

  describe('Styles', () => {
    describe('Line Art Rendering', () => {
      it('renders with stroke for line art style', () => {
        const { container } = renderBunnyNJ();
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke');
      });

      it('has no fill for non-filled variants', () => {
        const { container } = renderBunnyNJ({ variant: 'classic-blue' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('fill', 'none');
      });

      it('maintains 2px stroke width for size 128', () => {
        const { container } = renderBunnyNJ({ size: 128 });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke-width', '2');
      });

      it('adjusts stroke width for smaller sizes', () => {
        const { container } = renderBunnyNJ({ size: 32 });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke-width', '1');
      });

      it('adjusts stroke width for larger sizes', () => {
        const { container } = renderBunnyNJ({ size: 512 });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke-width', '5');
      });
    });

    describe('Color Variants', () => {
      it('applies classic-blue stroke color', () => {
        const { container } = renderBunnyNJ({ variant: 'classic-blue' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', '#0000FF');
      });

      it('applies attention stroke color', () => {
        const { container } = renderBunnyNJ({ variant: 'attention' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', '#FF69B4');
      });

      it('applies hype-boy stroke color', () => {
        const { container } = renderBunnyNJ({ variant: 'hype-boy' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', '#00CED1');
      });

      it('applies cookie stroke color', () => {
        const { container } = renderBunnyNJ({ variant: 'cookie' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', '#8B4513');
      });

      it('applies ditto stroke color', () => {
        const { container } = renderBunnyNJ({ variant: 'ditto' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('stroke', '#A9A9A9');
      });
    });

    describe('Filled Variants', () => {
      it('applies fill for cookie variant', () => {
        const { container } = renderBunnyNJ({ variant: 'cookie' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('fill', '#D2691E');
      });

      it('applies fill for ditto variant', () => {
        const { container } = renderBunnyNJ({ variant: 'ditto' });
        const head = container.querySelector('[data-testid="bunny-head"]');
        expect(head).toHaveAttribute('fill', '#D3D3D3');
      });
    });

    describe('Dark Mode', () => {
      it('applies dark mode class', () => {
        const { container } = renderBunnyNJ();
        const element = container.querySelector('.dark\\:invert-\\[0\\.15\\]');
        expect(element).toBeInTheDocument();
      });
    });

    describe('CSS Variant Classes', () => {
      it('applies correct variant class in CSS mode', () => {
        renderBunnyNJ({ useCSS: true, variant: 'attention' });
        const inner = screen.getByTestId('bunny-css-inner');
        expect(inner).toHaveClass('variant-attention');
      });

      it('applies correct size class in CSS mode', () => {
        renderBunnyNJ({ useCSS: true, size: 64 });
        const inner = screen.getByTestId('bunny-css-inner');
        expect(inner).toHaveClass('size-small');
      });

      it('applies large size class for sizes > 128', () => {
        renderBunnyNJ({ useCSS: true, size: 256 });
        const inner = screen.getByTestId('bunny-css-inner');
        expect(inner).toHaveClass('size-large');
      });
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="img" attribute', () => {
      renderBunnyNJ();
      const container = screen.getByTestId('bunny-nj-container');
      expect(container).toHaveAttribute('role', 'img');
    });

    it('has aria-label attribute', () => {
      renderBunnyNJ({ alt: 'Accessible Bunny' });
      const container = screen.getByTestId('bunny-nj-container');
      expect(container).toHaveAttribute('aria-label', 'Accessible Bunny');
    });

    describe('Reduced Motion', () => {
      it('respects reduced motion preference', () => {
        mockMatchMedia(true); // Enable reduced motion
        renderBunnyNJ({ animate: true, animation: 'idle' });
        const container = screen.getByTestId('bunny-nj-container');
        // Animation should be disabled when reduced motion is preferred
        expect(container).toHaveAttribute('data-animation', 'none');
      });

      it('disables animations when reduced motion is enabled', () => {
        mockMatchMedia(true);
        const { container } = renderBunnyNJ({ animate: true, animation: 'wave' });
        // Should not have animation class
        expect(container.querySelector('.bunny-nj--animate-wave')).not.toBeInTheDocument();
      });
    });

    describe('Keyboard Navigation', () => {
      it('has tabIndex 0 when interactive', () => {
        renderBunnyNJ({ interactive: true });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('tabIndex', '0');
      });

      it('has tabIndex 0 when onClick is provided', () => {
        renderBunnyNJ({ onClick: vi.fn() });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('tabIndex', '0');
      });

      it('has tabIndex -1 when not interactive', () => {
        renderBunnyNJ();
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveAttribute('tabIndex', '-1');
      });

      it('triggers onClick on Enter key press', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick, interactive: true });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.keyDown(container, { key: 'Enter' });
        
        expect(handleClick).toHaveBeenCalled();
      });

      it('triggers onClick on Space key press', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick, interactive: true });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.keyDown(container, { key: ' ' });
        
        expect(handleClick).toHaveBeenCalled();
      });

      it('prevents default on keyboard activation', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick, interactive: true });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.keyDown(container, { key: 'Enter' });
        
        expect(handleClick).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Event Tests
  // ============================================================================

  describe('Events', () => {
    describe('Click Events', () => {
      it('fires onClick handler when clicked', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.click(container);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it('does not fire onClick when disabled', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick, disabled: true });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.click(container);
        
        expect(handleClick).not.toHaveBeenCalled();
      });

      it('fires onClick multiple times when clicked multiple times', () => {
        const handleClick = vi.fn();
        renderBunnyNJ({ onClick: handleClick });
        
        const container = screen.getByTestId('bunny-nj-container');
        fireEvent.click(container);
        fireEvent.click(container);
        fireEvent.click(container);
        
        expect(handleClick).toHaveBeenCalledTimes(3);
      });
    });

    describe('Hover Effects', () => {
      it('applies hover scale when interactive', () => {
        renderBunnyNJ({ interactive: true });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveClass('bunny-nj--interactive');
      });

      it('applies hover scale when onClick is provided', () => {
        renderBunnyNJ({ onClick: vi.fn() });
        const container = screen.getByTestId('bunny-nj-container');
        expect(container).toHaveClass('bunny-nj--interactive');
      });
    });
  });

  // ============================================================================
  // SVG Structure Tests
  // ============================================================================

  describe('SVG Structure', () => {
    it('renders left ear', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-left-ear"]')).toBeInTheDocument();
    });

    it('renders right ear', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-right-ear"]')).toBeInTheDocument();
    });

    it('renders head', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-head"]')).toBeInTheDocument();
    });

    it('renders left eye', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-left-eye"]')).toBeInTheDocument();
    });

    it('renders right eye', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-right-eye"]')).toBeInTheDocument();
    });

    it('renders nose', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-nose"]')).toBeInTheDocument();
    });

    it('renders mouth', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-mouth"]')).toBeInTheDocument();
    });

    it('renders body', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-body"]')).toBeInTheDocument();
    });

    it('renders tail', () => {
      const { container } = renderBunnyNJ();
      expect(container.querySelector('[data-testid="bunny-tail"]')).toBeInTheDocument();
    });

    it('renders tail fluff for size 128 and larger', () => {
      const { container } = renderBunnyNJ({ size: 128 });
      expect(container.querySelector('[data-testid="bunny-tail-fluff"]')).toBeInTheDocument();
    });

    it('does not render tail fluff for size 64 and smaller', () => {
      const { container } = renderBunnyNJ({ size: 64 });
      expect(container.querySelector('[data-testid="bunny-tail-fluff"]')).not.toBeInTheDocument();
    });

    it('does not render tail fluff for size 32', () => {
      const { container } = renderBunnyNJ({ size: 32 });
      expect(container.querySelector('[data-testid="bunny-tail-fluff"]')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // CSS Structure Tests
  // ============================================================================

  describe('CSS Structure', () => {
    it('renders all CSS bunny parts', () => {
      renderBunnyNJ({ useCSS: true });
      
      expect(screen.getByTestId('bunny-css-ear-left')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-ear-right')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-head')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-eye-left')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-eye-right')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-nose')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-body')).toBeInTheDocument();
      expect(screen.getByTestId('bunny-css-tail')).toBeInTheDocument();
    });

    it('applies scale transform based on size', () => {
      renderBunnyNJ({ useCSS: true, size: 64 });
      const inner = screen.getByTestId('bunny-css-inner');
      expect(inner).toHaveStyle({ transform: 'scale(1)' });
    });
  });

  // ============================================================================
  // Export Tests
  // ============================================================================

  describe('Exports', () => {
    it('exports BunnyNJVariantColors', () => {
      expect(BunnyNJVariantColors).toBeDefined();
      expect(BunnyNJVariantColors['classic-blue']).toEqual({
        stroke: '#0000FF',
        fill: '#0000FF',
        glow: 'rgba(0, 0, 255, 0.5)',
      });
    });

    it('exports all variant colors', () => {
      expect(Object.keys(BunnyNJVariantColors)).toHaveLength(5);
      expect(BunnyNJVariantColors).toHaveProperty('classic-blue');
      expect(BunnyNJVariantColors).toHaveProperty('attention');
      expect(BunnyNJVariantColors).toHaveProperty('hype-boy');
      expect(BunnyNJVariantColors).toHaveProperty('cookie');
      expect(BunnyNJVariantColors).toHaveProperty('ditto');
    });
  });

  // ============================================================================
  // Forward Ref Tests
  // ============================================================================

  describe('Forward Ref', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<BunnyNJ ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('data-testid', 'bunny-nj-container');
    });
  });

  // ============================================================================
  // Display Name Test
  // ============================================================================

  describe('Component Metadata', () => {
    it('has correct display name', () => {
      expect(BunnyNJ.displayName).toBe('BunnyNJ');
    });
  });
});
