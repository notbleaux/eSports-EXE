import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { {{ComponentName}} } from './{{ComponentName}}';
import { mockSpatialData } from '../test/mocks';

// Mock D3 to avoid SVG rendering issues in tests
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
  })),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
}));

describe('{{ComponentName}}', () => {
  const defaultProps = {
    data: mockSpatialData,
    width: 800,
    height: 600,
  };

  it('renders without crashing', () => {
    render(<{{ComponentName}} {...defaultProps} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('applies correct dimensions', () => {
    const { container } = render(
      <{{ComponentName}} {...defaultProps} width={1024} height={768} />
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '1024');
    expect(svg).toHaveAttribute('height', '768');
  });

  it('applies opacity when provided', () => {
    const { container } = render(
      <{{ComponentName}} {...defaultProps} opacity={0.5} />
    );
    
    const layerContainer = container.firstChild as HTMLElement;
    expect(layerContainer).toHaveStyle({ opacity: '0.5' });
  });

  it('calls onRenderComplete when rendering finishes', async () => {
    const onRenderComplete = jest.fn();
    
    render(
      <{{ComponentName}} 
        {...defaultProps} 
        onRenderComplete={onRenderComplete} 
      />
    );

    await waitFor(() => {
      expect(onRenderComplete).toHaveBeenCalled();
    });
  });

  it('re-renders when data changes', () => {
    const { rerender } = render(<{{ComponentName}} {...defaultProps} />);
    
    const newData = { ...mockSpatialData, events: [] };
    rerender(<{{ComponentName}} {...defaultProps} data={newData} />);
    
    // Verify component re-rendered with new data
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
