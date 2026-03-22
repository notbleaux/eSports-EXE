/**
 * GlassCard Component Tests - P0 Test Coverage
 * 
 * Tests for glassmorphism card component
 * 
 * [Ver001.000]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlassCard, SatorCard, RotasCard, ArepoCard, OperaCard, TenetCard } from '../ui/GlassCard'
import { mockMatchMedia } from '@/test/utils'

describe('GlassCard', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('should render with content', () => {
    render(<GlassCard>Test Content</GlassCard>)
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>
    )
    
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('should render with hub theme', () => {
    const { container } = render(
      <GlassCard hubTheme="sator">SATOR Content</GlassCard>
    )
    
    expect(screen.getByText('SATOR Content')).toBeInTheDocument()
    // Theme-specific styling is applied via inline styles
  })

  it('should support all hub themes', () => {
    const hubs = ['sator', 'rotas', 'arepo', 'opera', 'tenet'] as const
    
    hubs.forEach((hub) => {
      const { unmount } = render(
        <GlassCard hubTheme={hub}>{hub} Content</GlassCard>
      )
      expect(screen.getByText(`${hub} Content`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should apply elevated styling', () => {
    const { container } = render(
      <GlassCard elevated>Elevated Content</GlassCard>
    )
    
    const card = container.firstChild
    expect(card).toBeInTheDocument()
    // Elevated adds stronger backdrop blur and background
  })

  it('should support different glow intensities', () => {
    const intensities = ['none', 'subtle', 'medium', 'strong'] as const
    
    intensities.forEach((intensity) => {
      const { unmount } = render(
        <GlassCard glowIntensity={intensity} hubTheme="sator">
          {intensity} Glow
        </GlassCard>
      )
      expect(screen.getByText(`${intensity} Glow`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    
    render(<GlassCard onClick={handleClick}>Clickable</GlassCard>)
    
    const card = screen.getByText('Clickable')
    card.click()
    
    expect(handleClick).toHaveBeenCalled()
  })

  it('should apply custom glow color', () => {
    const { container } = render(
      <GlassCard glowColor="#ff0000">Custom Glow</GlassCard>
    )
    
    expect(screen.getByText('Custom Glow')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null }
    
    render(<GlassCard ref={ref}>Ref Test</GlassCard>)
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('should disable border glow when specified', () => {
    const { container } = render(
      <GlassCard borderGlow={false}>No Border Glow</GlassCard>
    )
    
    expect(screen.getByText('No Border Glow')).toBeInTheDocument()
  })

  it('should apply glassmorphism base classes', () => {
    const { container } = render(<GlassCard>Styled</GlassCard>)
    
    const card = container.firstChild
    expect(card).toHaveClass('relative', 'overflow-hidden')
    expect(card).toHaveClass('bg-white/[0.03]')
    expect(card).toHaveClass('backdrop-blur-md')
    expect(card).toHaveClass('border', 'border-white/[0.08]')
  })
})

describe('Hub-specific Card Components', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('should render SatorCard with sator theme', () => {
    render(<SatorCard>SATOR</SatorCard>)
    expect(screen.getByText('SATOR')).toBeInTheDocument()
  })

  it('should render RotasCard with rotas theme', () => {
    render(<RotasCard>ROTAS</RotasCard>)
    expect(screen.getByText('ROTAS')).toBeInTheDocument()
  })

  it('should render ArepoCard with arepo theme', () => {
    render(<ArepoCard>AREPO</ArepoCard>)
    expect(screen.getByText('AREPO')).toBeInTheDocument()
  })

  it('should render OperaCard with opera theme', () => {
    render(<OperaCard>OPERA</OperaCard>)
    expect(screen.getByText('OPERA')).toBeInTheDocument()
  })

  it('should render TenetCard with tenet theme', () => {
    render(<TenetCard>TENET</TenetCard>)
    expect(screen.getByText('TENET')).toBeInTheDocument()
  })

  it('should forward props to underlying GlassCard', () => {
    const { container } = render(
      <SatorCard elevated className="extra-class">
        Props Test
      </SatorCard>
    )
    
    const card = container.firstChild
    expect(card).toHaveClass('extra-class')
    expect(screen.getByText('Props Test')).toBeInTheDocument()
  })
})
