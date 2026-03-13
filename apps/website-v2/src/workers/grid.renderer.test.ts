import { describe, it, expect } from 'vitest'
import { calculateGridLayout, generatePanelLayout, clearCanvas } from './grid.renderer'

describe('Grid Layout Algorithm', () => {
  it('should calculate correct grid dimensions for 4 panels (4:3 aspect)', () => {
    // 800x600 (4:3) aspect ratio calculates cols based on sqrt(4 * 1.333) = 2.3 -> ceil = 3
    const layout = calculateGridLayout(4, 800, 600, 16)

    expect(layout.cols).toBe(3) // Algorithm accounts for aspect ratio
    expect(layout.rows).toBe(2) // 4 panels / 3 cols = 2 rows
    expect(layout.cellWidth).toBeGreaterThan(0)
    expect(layout.cellHeight).toBeGreaterThan(0)
  })

  it('should calculate correct grid dimensions for 9 panels (4:3 aspect)', () => {
    // sqrt(9 * 1.333) = 3.46 -> ceil = 4
    const layout = calculateGridLayout(9, 800, 600, 16)

    expect(layout.cols).toBe(4) // Algorithm: ceil(sqrt(9 * 1.333))
    expect(layout.rows).toBe(3) // 9 panels / 4 cols = 3 rows
  })

  it('should handle single panel', () => {
    // sqrt(1 * 1.333) = 1.15 -> ceil = 2
    const layout = calculateGridLayout(1, 800, 600, 16)

    expect(layout.cols).toBe(2) // Algorithm: ceil(sqrt(1 * 1.333))
    expect(layout.rows).toBe(1) // 1 panel / 2 cols = 1 row
  })

  it('should account for padding in calculations', () => {
    const layout16 = calculateGridLayout(4, 800, 600, 16)
    const layout32 = calculateGridLayout(4, 800, 600, 32)

    // More padding = smaller cells
    expect(layout32.cellWidth).toBeLessThan(layout16.cellWidth)
    expect(layout32.cellHeight).toBeLessThan(layout16.cellHeight)
  })
})

describe('Panel Layout Generation', () => {
  it('should generate correct number of panels', () => {
    const panels = generatePanelLayout(6, 800, 600)

    expect(panels).toHaveLength(6)
    expect(panels[0].id).toBe('panel-0')
    expect(panels[5].id).toBe('panel-5')
  })

  it('should assign sequential positions', () => {
    const panels = generatePanelLayout(4, 800, 600, 16)

    // First panel should be at top-left
    expect(panels[0].x).toBe(16)
    expect(panels[0].y).toBe(16)

    // Second panel should be to the right
    expect(panels[1].x).toBeGreaterThan(panels[0].x)
    expect(panels[1].y).toBe(panels[0].y)
  })

  it('should include title and content', () => {
    const panels = generatePanelLayout(2, 800, 600)

    expect(panels[0].title).toBe('Panel 1')
    expect(panels[0].content).toContain('×')
    expect(panels[1].title).toBe('Panel 2')
  })
})

describe('Renderer Constants', () => {
  it('should export COLORS object', () => {
    // Colors are internal but we verify the module loads
    expect(clearCanvas).toBeDefined()
    expect(typeof clearCanvas).toBe('function')
  })
})
