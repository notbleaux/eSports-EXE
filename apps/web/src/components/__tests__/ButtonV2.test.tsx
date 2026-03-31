/**
 * ButtonV2 Component Tests
 * 
 * Tests for Valorant-styled button component
 * 
 * [Ver001.000]
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ButtonV2 } from '../ui/ButtonV2'

describe('ButtonV2', () => {
  it('should render with text content', () => {
    render(<ButtonV2>Click Me</ButtonV2>)
    
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    
    render(<ButtonV2 onClick={handleClick}>Clickable</ButtonV2>)
    
    fireEvent.click(screen.getByText('Clickable'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render all variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <ButtonV2 variant={variant}>{variant} Button</ButtonV2>
      )
      expect(screen.getByText(`${variant} Button`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should render all sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <ButtonV2 size={size}>{size} Button</ButtonV2>
      )
      expect(screen.getByText(`${size} Button`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should show loading state', () => {
    render(<ButtonV2 loading>Loading Button</ButtonV2>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    // Check for spinner element (svg)
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('should render with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>
    
    render(<ButtonV2 leftIcon={<LeftIcon />}>With Icon</ButtonV2>)
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('should render with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>
    
    render(<ButtonV2 rightIcon={<RightIcon />}>With Icon</ButtonV2>)
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('should apply fullWidth class', () => {
    const { container } = render(
      <ButtonV2 fullWidth>Full Width</ButtonV2>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('w-full')
  })

  it('should apply glow class when glow prop is true', () => {
    const { container } = render(
      <ButtonV2 glow>Glowing Button</ButtonV2>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('shadow-valorant-glow')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ButtonV2 disabled>Disabled</ButtonV2>)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ButtonV2 className="custom-class">Custom</ButtonV2>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    
    render(<ButtonV2 ref={ref}>Ref Test</ButtonV2>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should have uppercase tracking-wider text', () => {
    const { container } = render(<ButtonV2>Styled Text</ButtonV2>)
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('uppercase', 'tracking-wider')
  })

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn()
    
    render(<ButtonV2 disabled onClick={handleClick}>Disabled</ButtonV2>)
    
    fireEvent.click(screen.getByText('Disabled'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when loading', () => {
    const handleClick = vi.fn()
    
    render(<ButtonV2 loading onClick={handleClick}>Loading</ButtonV2>)
    
    fireEvent.click(screen.getByText('Loading'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should hide icons when loading', () => {
    const LeftIcon = () => <span data-testid="loading-left-icon">←</span>
    const RightIcon = () => <span data-testid="loading-right-icon">→</span>
    
    render(
      <ButtonV2 loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Loading
      </ButtonV2>
    )
    
    // When loading, icons should not be rendered (only spinner)
    expect(screen.queryByTestId('loading-left-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-right-icon')).not.toBeInTheDocument()
  })

  it('should have focus ring styles', () => {
    const { container } = render(<ButtonV2>Focusable</ButtonV2>)
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('focus:ring-2', 'focus:ring-valorant-accent-red')
  })

  it('should have active scale transform', () => {
    const { container } = render(<ButtonV2>Clickable</ButtonV2>)
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('active:scale-[0.98]')
  })
})
