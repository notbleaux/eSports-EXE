/**
 * GlowButton Component Tests - P0 Test Coverage
 * 
 * Tests for glow button with ripple effects
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlowButton, SatorButton, RotasButton, ArepoButton, OperaButton, TenetButton } from '../ui/GlowButton'
import { mockMatchMedia } from '@/test/utils'

describe('GlowButton', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('should render with text content', () => {
    render(<GlowButton>Click Me</GlowButton>)
    
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    
    render(<GlowButton onClick={handleClick}>Clickable</GlowButton>)
    
    const button = screen.getByText('Clickable')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })

  it('should be disabled when specified', () => {
    render(<GlowButton disabled>Disabled</GlowButton>)
    
    const button = screen.getByText('Disabled')
    expect(button.closest('button')).toBeDisabled()
    expect(button.closest('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('should show loading state', () => {
    render(<GlowButton loading>Loading</GlowButton>)
    
    const button = screen.getByText('Loading')
    expect(button.closest('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('should show success loading state', () => {
    render(<GlowButton loadingState="success">Success</GlowButton>)
    
    expect(screen.getByText('Success')).toBeInTheDocument()
    // Check for checkmark icon
  })

  it('should show error loading state', () => {
    render(<GlowButton loadingState="error">Error</GlowButton>)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    // Check for error icon
  })

  it('should support different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <GlowButton size={size}>{size} Button</GlowButton>
      )
      expect(screen.getByText(`${size} Button`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should support different variants', () => {
    const variants = ['primary', 'secondary', 'ghost'] as const
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <GlowButton variant={variant}>{variant} Button</GlowButton>
      )
      expect(screen.getByText(`${variant} Button`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should apply hub theme', () => {
    const hubs = ['sator', 'rotas', 'arepo', 'opera', 'tenet'] as const
    
    hubs.forEach((hub) => {
      const { unmount } = render(
        <GlowButton hubTheme={hub}>{hub} Button</GlowButton>
      )
      expect(screen.getByText(`${hub} Button`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should support ripple effect', () => {
    render(<GlowButton ripple>Ripple</GlowButton>)
    
    const button = screen.getByText('Ripple')
    fireEvent.click(button)
    
    // Ripple effect should be triggered
    expect(button).toBeInTheDocument()
  })

  it('should disable ripple when reduced motion is enabled', () => {
    mockMatchMedia(true) // Enable reduced motion
    
    render(<GlowButton ripple>No Ripple</GlowButton>)
    
    const button = screen.getByText('No Ripple')
    fireEvent.click(button)
    
    // No ripple should be created
  })

  it('should apply custom glow color', () => {
    render(<GlowButton glowColor="#ff0000">Custom Glow</GlowButton>)
    
    expect(screen.getByText('Custom Glow')).toBeInTheDocument()
  })

  it('should forward type attribute', () => {
    render(<GlowButton type="submit">Submit</GlowButton>)
    
    const button = screen.getByText('Submit')
    expect(button.closest('button')).toHaveAttribute('type', 'submit')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <GlowButton className="custom-class">Custom Class</GlowButton>
    )
    
    const button = container.querySelector('.custom-class')
    expect(button).toBeInTheDocument()
  })

  it('should combine loading and disabled states', () => {
    render(<GlowButton loading disabled>Loading Disabled</GlowButton>)
    
    const button = screen.getByText('Loading Disabled').closest('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('should handle disabled click prevention', () => {
    const handleClick = vi.fn()
    
    render(
      <GlowButton onClick={handleClick} disabled>
        Disabled Click
      </GlowButton>
    )
    
    const button = screen.getByText('Disabled Click')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})

describe('Hub-specific Button Components', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('should render SatorButton', () => {
    render(<SatorButton>SATOR</SatorButton>)
    expect(screen.getByText('SATOR')).toBeInTheDocument()
  })

  it('should render RotasButton', () => {
    render(<RotasButton>ROTAS</RotasButton>)
    expect(screen.getByText('ROTAS')).toBeInTheDocument()
  })

  it('should render ArepoButton', () => {
    render(<ArepoButton>AREPO</ArepoButton>)
    expect(screen.getByText('AREPO')).toBeInTheDocument()
  })

  it('should render OperaButton', () => {
    render(<OperaButton>OPERA</OperaButton>)
    expect(screen.getByText('OPERA')).toBeInTheDocument()
  })

  it('should render TenetButton', () => {
    render(<TenetButton>TENET</TenetButton>)
    expect(screen.getByText('TENET')).toBeInTheDocument()
  })

  it('should forward all props to GlowButton', () => {
    const handleClick = vi.fn()
    
    render(
      <SatorButton
        onClick={handleClick}
        loading
        size="lg"
        className="hub-button"
      >
        Hub Props
      </SatorButton>
    )
    
    const button = screen.getByText('Hub Props')
    expect(button).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalled()
  })
})
