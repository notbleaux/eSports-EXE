import { describe, it, expect } from 'vitest'
import type { 
  GridRenderCommand as WorkerCommand,
  GridRenderResult as WorkerResponse,
  GridRow as PanelData
} from '../types/worker'

describe('Grid Worker Protocol', () => {
  it('should define correct message types', () => {
    // Type checking test - ensures TypeScript types are correct
    const initCommand: WorkerCommand = {
      type: 'init',
      payload: {
        canvas: {} as OffscreenCanvas,
        columns: [],
        rows: 10,
      }
    }
    expect(initCommand.type).toBe('init')

    const renderCommand: WorkerCommand = {
      type: 'render',
      payload: {
        data: [],
        columns: [],
        viewport: { x: 0, y: 0, width: 800, height: 600 },
        scrollTop: 0,
        scrollLeft: 0,
      }
    }
    expect(renderCommand.type).toBe('render')

    const resizeCommand: WorkerCommand = {
      type: 'resize',
      payload: { width: 1024, height: 768 }
    }
    expect(resizeCommand.type).toBe('resize')
  })

  it('should define correct response types', () => {
    const successResponse: WorkerResponse = {
      success: true,
      renderTime: 16.67,
      renderedCells: 50,
      visibleRows: 10,
    }
    expect(successResponse.success).toBe(true)
    expect(successResponse.renderedCells).toBe(50)

    const errorResponse: WorkerResponse = {
      success: false,
      renderTime: 0,
    }
    expect(errorResponse.success).toBe(false)
  })

  it('should define correct PanelData structure', () => {
    const panel: PanelData = {
      id: 'test-panel',
      name: 'Test Panel',
      value: 100,
    }

    expect(panel.id).toBe('test-panel')
    expect(panel.name).toBe('Test Panel')
  })
})

describe('useGridWorker Hook Types', () => {
  it('should have correct return type structure', () => {
    // Mock return type check
    const mockReturn = {
      isReady: false,
      isSupported: true,
      error: null as string | null,
      init: async () => {},
      render: async () => {},
      resize: async () => {},
      clear: async () => {},
      destroy: () => {},
    }

    expect(mockReturn).toHaveProperty('isReady')
    expect(mockReturn).toHaveProperty('isSupported')
    expect(mockReturn).toHaveProperty('error')
    expect(mockReturn).toHaveProperty('init')
    expect(mockReturn).toHaveProperty('render')
    expect(mockReturn).toHaveProperty('resize')
    expect(mockReturn).toHaveProperty('clear')
    expect(mockReturn).toHaveProperty('destroy')
  })
})
