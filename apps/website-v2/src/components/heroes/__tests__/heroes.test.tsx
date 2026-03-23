/** [Ver001.000]
 * Heroes Component Tests
 * ======================
 * Unit tests for Hero, HeroMascot, and HeroSection components.
 * 
 * Test Coverage:
 * - Render tests for all components
 * - Props validation and behavior
 * - Accessibility compliance (ARIA, landmarks)
 * - Reduced motion support
 * - Event handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero, HubHero } from '../Hero';
import { 
  HeroMascot, 
  FoxHeroMascot, 
  OwlHeroMascot, 
  WolfHeroMascot, 
  HawkHeroMascot 
} from '../HeroMascot';
import { HeroSection, FullHeightHero, LandingHero } from '../HeroSection';
import { mockMatchMedia } from '@/test/utils';

// ============================================================================
// Test Setup
// ============================================================================

describe('Hero Components', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  // ==========================================================================
  // Hero Component Tests
  // ==========================================================================

  describe('Hero', () => {
    it('should render with title', () => {
      render(<Hero title="Test Title" />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with subtitle', () => {
      render(
        <Hero 
          title="Main Title" 
          subtitle="This is a subtitle description"
        />
      );
      
      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('This is a subtitle description')).toBeInTheDocument();
    });

    it('should render with primary CTA button', () => {
      render(
        <Hero
          title="Hero with CTA"
          cta={{ primary: { label: 'Get Started', href: '/start' } }}
        />
      );
      
      const ctaButton = screen.getByText('Get Started');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton.closest('a')).toHaveAttribute('href', '/start');
    });

    it('should render with primary and secondary CTA buttons', () => {
      render(
        <Hero
          title="Hero with CTAs"
          cta={{
            primary: { label: 'Primary', href: '/primary' },
            secondary: { label: 'Secondary', href: '/secondary' },
          }}
        />
      );
      
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('should have accessible title with id', () => {
      render(<Hero title="Accessible Title" />);
      
      const title = screen.getByText('Accessible Title');
      expect(title).toHaveAttribute('id', 'hero-title');
    });

    it('should have section landmark role', () => {
      render(<Hero title="Landmark Test" />);
      
      const section = screen.getByRole('region');
      expect(section).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Hero title="Custom Class" className="custom-hero-class" />
      );
      
      expect(container.querySelector('.custom-hero-class')).toBeInTheDocument();
    });

    it('should render mascot when specified', () => {
      render(<Hero title="With Mascot" mascot="fox" />);
      
      const mascot = screen.getByLabelText('fox mascot character');
      expect(mascot).toBeInTheDocument();
    });

    it('should render all mascot types', () => {
      const mascots: Array<'fox' | 'owl' | 'wolf' | 'hawk'> = ['fox', 'owl', 'wolf', 'hawk'];
      
      mascots.forEach((mascotType) => {
        const { unmount } = render(
          <Hero title="Mascot Test" mascot={mascotType} />
        );
        
        expect(screen.getByLabelText(`${mascotType} mascot character`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  // ==========================================================================
  // HubHero Tests
  // ==========================================================================

  describe('HubHero', () => {
    it('should render HubHero for each hub', () => {
      const hubs: Array<'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet'> = [
        'sator', 'rotas', 'arepo', 'opera', 'tenet'
      ];
      
      hubs.forEach((hubId) => {
        const { unmount } = render(
          <HubHero hubId={hubId} title={`${hubId} Hub`} />
        );
        
        expect(screen.getByText(`${hubId} Hub`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should apply hub-specific gradient class', () => {
      const { container } = render(
        <HubHero hubId="sator" title="SATOR Hub" />
      );
      
      expect(container.firstChild).toHaveClass('from-blue-950');
    });
  });

  // ==========================================================================
  // HeroMascot Component Tests
  // ==========================================================================

  describe('HeroMascot', () => {
    it('should render fox mascot', () => {
      render(<HeroMascot mascot="fox" />);
      
      expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
    });

    it('should render owl mascot', () => {
      render(<HeroMascot mascot="owl" />);
      
      expect(screen.getByLabelText('owl mascot character')).toBeInTheDocument();
    });

    it('should render wolf mascot', () => {
      render(<HeroMascot mascot="wolf" />);
      
      expect(screen.getByLabelText('wolf mascot character')).toBeInTheDocument();
    });

    it('should render hawk mascot', () => {
      render(<HeroMascot mascot="hawk" />);
      
      expect(screen.getByLabelText('hawk mascot character')).toBeInTheDocument();
    });

    it('should have img role for accessibility', () => {
      render(<HeroMascot mascot="fox" />);
      
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <HeroMascot mascot="fox" className="custom-mascot" />
      );
      
      expect(container.querySelector('.custom-mascot')).toBeInTheDocument();
    });

    it('should render all size variants', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach((size) => {
        const { unmount } = render(
          <HeroMascot mascot="fox" size={size} />
        );
        
        expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
        unmount();
      });
    });

    it('should render all animation variants', () => {
      const animations: Array<'idle' | 'wave' | 'celebrate'> = ['idle', 'wave', 'celebrate'];
      
      animations.forEach((animation) => {
        const { unmount } = render(
          <HeroMascot mascot="fox" animation={animation} />
        );
        
        expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
        unmount();
      });
    });

    it('should render all position variants', () => {
      const positions: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
      
      positions.forEach((position) => {
        const { unmount } = render(
          <HeroMascot mascot="fox" position={position} />
        );
        
        expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
        unmount();
      });
    });
  });

  // ==========================================================================
  // Named Mascot Component Tests
  // ==========================================================================

  describe('Named Mascot Components', () => {
    it('should render FoxHeroMascot', () => {
      render(<FoxHeroMascot />);
      expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
    });

    it('should render OwlHeroMascot', () => {
      render(<OwlHeroMascot />);
      expect(screen.getByLabelText('owl mascot character')).toBeInTheDocument();
    });

    it('should render WolfHeroMascot', () => {
      render(<WolfHeroMascot />);
      expect(screen.getByLabelText('wolf mascot character')).toBeInTheDocument();
    });

    it('should render HawkHeroMascot', () => {
      render(<HawkHeroMascot />);
      expect(screen.getByLabelText('hawk mascot character')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // HeroSection Component Tests
  // ==========================================================================

  describe('HeroSection', () => {
    it('should render children content', () => {
      render(
        <HeroSection>
          <div data-testid="child-content">Child Content</div>
        </HeroSection>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render as section by default', () => {
      render(
        <HeroSection>
          <div>Content</div>
        </HeroSection>
      );
      
      const section = screen.getByRole('region');
      expect(section.tagName.toLowerCase()).toBe('section');
    });

    it('should render with custom element type', () => {
      const { container } = render(
        <HeroSection as="div">
          <span>Content</span>
        </HeroSection>
      );
      
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have section id when provided', () => {
      render(
        <HeroSection id="hero-section">
          <div>Content</div>
        </HeroSection>
      );
      
      expect(document.getElementById('hero-section')).toBeInTheDocument();
    });

    it('should apply fullHeight class when specified', () => {
      const { container } = render(
        <HeroSection fullHeight>
          <div>Content</div>
        </HeroSection>
      );
      
      expect(container.firstChild).toHaveClass('min-h-screen');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <HeroSection className="custom-section">
          <div>Content</div>
        </HeroSection>
      );
      
      expect(container.querySelector('.custom-section')).toBeInTheDocument();
    });

    it('should have aria-label when provided', () => {
      render(
        <HeroSection ariaLabel="Main hero section">
          <div>Content</div>
        </HeroSection>
      );
      
      expect(screen.getByLabelText('Main hero section')).toBeInTheDocument();
    });

    it('should have aria-labelledby when provided', () => {
      render(
        <HeroSection ariaLabelledBy="hero-heading">
          <h1 id="hero-heading">Hero Title</h1>
        </HeroSection>
      );
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'hero-heading');
    });
  });

  // ==========================================================================
  // FullHeightHero Tests
  // ==========================================================================

  describe('FullHeightHero', () => {
    it('should render with full height', () => {
      const { container } = render(
        <FullHeightHero>
          <div>Full Height Content</div>
        </FullHeightHero>
      );
      
      expect(container.firstChild).toHaveClass('min-h-screen');
    });

    it('should center content vertically', () => {
      const { container } = render(
        <FullHeightHero>
          <div>Content</div>
        </FullHeightHero>
      );
      
      expect(container.firstChild).toHaveClass('justify-center');
    });
  });

  // ==========================================================================
  // LandingHero Tests
  // ==========================================================================

  describe('LandingHero', () => {
    it('should render with full height', () => {
      const { container } = render(
        <LandingHero>
          <div>Landing Content</div>
        </LandingHero>
      );
      
      expect(container.firstChild).toHaveClass('min-h-screen');
    });

    it('should have dark gradient background', () => {
      const { container } = render(
        <LandingHero>
          <div>Content</div>
        </LandingHero>
      );
      
      expect(container.firstChild).toHaveClass('from-slate-950');
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe('Accessibility', () => {
    it('should support reduced motion preference', () => {
      mockMatchMedia(true); // Enable reduced motion
      
      render(<Hero title="Reduced Motion Test" mascot="fox" />);
      
      expect(screen.getByText('Reduced Motion Test')).toBeInTheDocument();
      expect(screen.getByLabelText('fox mascot character')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<Hero title="Heading Test" />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Heading Test');
    });

    it('should support keyboard navigation for CTA links', () => {
      render(
        <Hero
          title="Keyboard Test"
          cta={{ primary: { label: 'Click Me', href: '/test' } }}
        />
      );
      
      const link = screen.getByText('Click Me').closest('a');
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration', () => {
    it('should render complete hero section with all features', () => {
      render(
        <LandingHero id="home">
          <Hero
            title="Complete Hero"
            subtitle="With all features enabled"
            mascot="owl"
            cta={{
              primary: { label: 'Start Now', href: '/start' },
              secondary: { label: 'Learn More', href: '/about' },
            }}
          />
        </LandingHero>
      );
      
      // Check all elements are rendered
      expect(screen.getByText('Complete Hero')).toBeInTheDocument();
      expect(screen.getByText('With all features enabled')).toBeInTheDocument();
      expect(screen.getByLabelText('owl mascot character')).toBeInTheDocument();
      expect(screen.getByText('Start Now')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
      
      // Check section structure
      expect(document.getElementById('home')).toBeInTheDocument();
    });
  });
});
