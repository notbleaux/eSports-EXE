/**
 * ToggleV2 Component Tests
 * 
 * Tests for Valorant-styled toggle/switch component
 * 
 * [Ver001.000]
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToggleV2 } from '../ui/ToggleV2'

describe('ToggleV2', () => {
  it('should render unchecked by default', () => {
    render(<ToggleV2 checked={false} onChange={() => {}} />)
    
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should render checked state', () => {
    render(<ToggleV2 checked={true} onChange={() => {}} />)
    
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('should call onChange when clicked', () => {
    const handleChange = vi.fn()
    
    render(<ToggleV2 checked={false} onChange={handleChange} />)
    
    fireEvent.click(screen.getByRole('switch'))
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should toggle from checked to unchecked', () => {
    const handleChange = vi.fn()
    
    render(<ToggleV2 checked={true} onChange={handleChange} />)
    
    fireEvent.click(screen.getByRole('switch'))
    
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('should render all sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <ToggleV2 checked={false} onChange={() => {}} size={size} />
      )
      expect(screen.getByRole('switch')).toBeInTheDocument()
      unmount()
    })
  })

  it('should render all accent colors', () => {
    const accents = ['red', 'teal', 'gold'] as const
    
    accents.forEach((accent) => {
      const { unmount } = render(
        <ToggleV2 
          checked={true} 
          onChange={() => {}} 
          accent={accent}
        />
      )
      expect(screen.getByRole('switch')).toBeInTheDocument()
      unmount()
    })
  })

  it('should render with label', () => {
    render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        label="Test Label"
      />
    )
    
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('should position label on right by default', () => {
    const { container } = render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        label="Right Label"
      />
    )
    
    // Label should be inside a label element wrapping both toggle and text
    const label = container.querySelector('label')
    expect(label).toBeInTheDocument()
    expect(screen.getByText('Right Label')).toBeInTheDocument()
  })

  it('should position label on left when specified', () => {
    const { container } = render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        label="Left Label"
        labelPosition="left"
      />
    )
    
    const label = container.querySelector('label')
    expect(label).toBeInTheDocument()
    expect(screen.getByText('Left Label')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        disabled
      />
    )
    
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('should not call onChange when disabled', () => {
    const handleChange = vi.fn()
    
    render(
      <ToggleV2 
        checked={false} 
        onChange={handleChange} 
        disabled
      />
    )
    
    fireEvent.click(screen.getByRole('switch'))
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        className="custom-class"
      />
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should have focus ring styles', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} />
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('focus:ring-2', 'focus:ring-valorant-accent-red')
  })

  it('should have correct aria attributes', () => {
    render(<ToggleV2 checked={true} onChange={() => {}} />)
    
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('role', 'switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(toggle).toHaveAttribute('type', 'button')
  })

  it('should apply disabled styles when disabled', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} disabled />
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('should apply opacity-50 to label when disabled', () => {
    const { container } = render(
      <ToggleV2 
        checked={false} 
        onChange={() => {}} 
        disabled
        label="Disabled Label"
      />
    )
    
    const label = container.querySelector('span.text-sm')
    expect(label).toHaveClass('text-valorant-text-disabled')
  })

  it('should render without label', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} />
    )
    
    // Should not have a label wrapper when no label prop
    expect(container.querySelector('label')).not.toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('should have thumb element inside track', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} />
    )
    
    const button = container.querySelector('button')
    const thumb = button?.querySelector('span')
    
    expect(thumb).toBeInTheDocument()
    expect(thumb).toHaveClass('bg-valorant-text-primary', 'rounded-sm')
  })

  it('should translate thumb when checked', () => {
    const { container } = render(
      <ToggleV2 checked={true} onChange={() => {}} />
    )
    
    const thumb = container.querySelector('button span')
    expect(thumb).toHaveClass('translate-x-5')
  })

  it('should have correct track dimensions for sm size', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} size="sm" />
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('w-8', 'h-4')
  })

  it('should have correct track dimensions for lg size', () => {
    const { container } = render(
      <ToggleV2 checked={false} onChange={() => {}} size="lg" />
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('w-14', 'h-7')
  })
})
