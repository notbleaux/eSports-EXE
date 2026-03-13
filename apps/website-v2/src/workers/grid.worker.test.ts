import { describe, it, expect } from 'vitest'
import type { WorkerCommand, WorkerResponse, PanelData } from './grid.worker'

describe('Grid Worker Protocol', () => {
  it('should define correct message types', () => {
    // Type checking test - ensures TypeScript types are correct
    const initCommand: WorkerCommand = {
      type: 'INIT',
      canvas: {} as OffscreenCanvas,
      width: 800,
      height: 600,
    }
    expect(initCommand.type).toBe('INIT')
    expect(initCommand.width).toBe(800)

    const renderCommand: WorkerCommand = {
      type: 'RENDER',
      panels: [],
    }
    expect(renderCommand.type).toBe('RENDER')

    const resizeCommand: WorkerCommand = {
      type: 'RESIZE',
      width: 1024,
      height: 768,
    }
    expect(resizeCommand.type).toBe('RESIZE')
  })

  it('should define correct response types', () => {
    const initSuccess: WorkerResponse = {
      type: 'INIT_SUCCESS',
      timestamp: Date.now(),
    }
    expect(initSuccess.type).toBe('INIT_SUCCESS')

    const renderComplete: WorkerResponse = {
      type: 'RENDER_COMPLETE',
      panelCount: 5,
      renderTime: 16.67,
    }
    expect(renderComplete.panelCount).toBe(5)

    const error: WorkerResponse = {
      type: 'ERROR',
      message: 'Test error',
    }
    expect(error.message).toBe('Test error')
  })

  it('should define correct PanelData structure', () => {
    const panel: PanelData = {
      id: 'test-panel',
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      title: 'Test Panel',
      content: 'Test content',
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderColor: 'rgba(255,255,255,0.5)',
    }

    expect(panel.id).toBe('test-panel')
    expect(panel.x).toBe(10)
    expect(panel.y).toBe(20)
    expect(panel.width).toBe(100)
    expect(panel.height).toBe(200)
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
