[Ver002.000]

# OPTIMIZED AI SUB-AGENT PROMPT: Testing & QA Automation
## Comprehensive Test Suite for Quaternary Grid System

**Role:** Quality Assurance & Test Automation Specialist  
**Priority:** P2 - Quality Layer  
**Dependencies:** All implementation components complete

---

## I. MISSION OBJECTIVE

Create a comprehensive test suite covering unit tests, integration tests, performance benchmarks, and E2E tests for the Quaternary Grid system. Ensure 80%+ code coverage and 60fps performance guarantee.

**Success Criteria:**
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] Performance benchmarks established
- [ ] E2E tests for user workflows
- [ ] Accessibility audit passed

---

## II. TEST ARCHITECTURE

### 2.1 Test File Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── stores/
│   │   │   ├── gridStore.test.js
│   │   │   └── modeStore.test.js
│   │   ├── components/
│   │   │   ├── DraggablePanel.test.jsx
│   │   │   ├── QuaternaryGrid.test.jsx
│   │   │   └── ModeToggle.test.jsx
│   │   └── hooks/
│   │       ├── useGridActions.test.js
│   │       └── usePanel.test.js
│   ├── integration/
│   │   ├── grid-system.test.jsx
│   │   ├── panel-lifecycle.test.jsx
│   │   └── mode-switching.test.jsx
│   ├── performance/
│   │   ├── render-perf.bench.js
│   │   ├── drag-perf.bench.js
│   │   └── memory-leak.test.js
│   └── e2e/
│       ├── user-workflows.spec.js
│       └── accessibility.spec.js
└── test-utils/
    ├── renderWithProviders.jsx
    ├── mockData.js
    └── test-helpers.js
```

### 2.2 Test Utilities Setup

```typescript
// test-utils/renderWithProviders.jsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useGridStore } from '@/store/gridStore';
import { useModeStore } from '@/store/modeStore';

// Test wrapper with all providers
export function renderWithProviders(ui, { 
  initialGridState = {},
  initialModeState = {},
  ...options 
} = {}) {
  // Reset stores to initial state
  useGridStore.setState({
    panels: DEFAULT_PANELS,
    groupViews: [{ id: 'default', name: 'Default', panels: DEFAULT_PANELS }],
    currentGroupId: 'default',
    ...initialGridState,
  });
  
  useModeStore.setState({
    mode: 'SATOR',
    isTransitioning: false,
    ...initialModeState,
  });
  
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }
  
  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock data factories
export function createMockPanel(overrides = {}) {
  return {
    i: `panel-${Math.random().toString(36).substr(2, 9)}`,
    x: 0,
    y: 0,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'minimap',
    title: 'Test Panel',
    hub: 'SATOR',
    state: 'normal',
    ...overrides,
  };
}

// Async test helpers
export async function waitForAnimation() {
  await new Promise(resolve => setTimeout(resolve, 100));
}

export function simulateDrag(element, { deltaX, deltaY }) {
  const start = { clientX: 0, clientY: 0 };
  const end = { clientX: deltaX, clientY: deltaY };
  
  element.dispatchEvent(new MouseEvent('mousedown', start));
  element.dispatchEvent(new MouseEvent('mousemove', end));
  element.dispatchEvent(new MouseEvent('mouseup', end));
}
```

---

## III. UNIT TESTS

### 3.1 Grid Store Tests

```typescript
// __tests__/unit/stores/gridStore.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGridStore, DEFAULT_PANELS } from '@/store/gridStore';

describe('Grid Store', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useGridStore.setState({
      panels: DEFAULT_PANELS,
      groupViews: [{ id: 'default', name: 'Default', panels: DEFAULT_PANELS }],
      currentGroupId: 'default',
    });
  });
  
  describe('Panel Management', () => {
    it('should update single panel property', () => {
      const { updatePanel } = useGridStore.getState();
      
      updatePanel('minimap', { h: 6 });
      
      const state = useGridStore.getState();
      expect(state.panels[0].h).toBe(6);
      expect(state.panels[1]).toEqual(DEFAULT_PANELS[1]);
    });
    
    it('should batch update multiple panels', () => {
      const { updatePanels } = useGridStore.getState();
      
      updatePanels([
        { id: 'minimap', updates: { x: 1 } },
        { id: 'analytics', updates: { y: 2 } },
      ]);
      
      const state = useGridStore.getState();
      expect(state.panels[0].x).toBe(1);
      expect(state.panels[1].y).toBe(2);
    });
    
    it('should add new panel at correct position', () => {
      const { addPanel } = useGridStore.getState();
      
      addPanel('chat', 'TENET', 'Chat Panel');
      
      const state = useGridStore.getState();
      expect(state.panels).toHaveLength(5);
      expect(state.panels[4].type).toBe('chat');
      expect(state.panels[4].title).toBe('Chat Panel');
    });
    
    it('should close panel and remove from array', () => {
      const { closePanel } = useGridStore.getState();
      
      closePanel('minimap');
      
      const state = useGridStore.getState();
      expect(state.panels).toHaveLength(3);
      expect(state.panels.find(p => p.i === 'minimap')).toBeUndefined();
    });
    
    it('should change panel state without affecting position', () => {
      const { minimizePanel, maximizePanel, restorePanel } = useGridStore.getState();
      
      minimizePanel('minimap');
      expect(useGridStore.getState().panels[0].state).toBe('minimized');
      
      maximizePanel('minimap');
      expect(useGridStore.getState().panels[0].state).toBe('maximized');
      
      restorePanel('minimap');
      expect(useGridStore.getState().panels[0].state).toBe('normal');
    });
  });
  
  describe('Group Views', () => {
    it('should save current layout as new group view', () => {
      const { saveGroupView, updatePanel } = useGridStore.getState();
      
      // Modify layout
      updatePanel('minimap', { h: 8 });
      
      // Save as new view
      saveGroupView('Tall Minimap View');
      
      const state = useGridStore.getState();
      expect(state.groupViews).toHaveLength(2);
      expect(state.currentGroupId).not.toBe('default');
      
      const newView = state.groupViews.find(g => g.name === 'Tall Minimap View');
      expect(newView.panels[0].h).toBe(8);
    });
    
    it('should load group view and replace current panels', () => {
      const { saveGroupView, loadGroupView, closePanel } = useGridStore.getState();
      
      // Setup: save view, then close a panel
      saveGroupView('Test View');
      const savedId = useGridStore.getState().currentGroupId;
      closePanel('minimap');
      
      expect(useGridStore.getState().panels).toHaveLength(3);
      
      // Load should restore all panels
      loadGroupView(savedId);
      expect(useGridStore.getState().panels).toHaveLength(4);
    });
    
    it('should delete group view and reset to default', () => {
      const { saveGroupView, deleteGroupView } = useGridStore.getState();
      
      saveGroupView('To Delete');
      const id = useGridStore.getState().currentGroupId;
      
      deleteGroupView(id);
      
      const state = useGridStore.getState();
      expect(state.groupViews).toHaveLength(1);
      expect(state.currentGroupId).toBe('default');
    });
    
    it('should enforce maximum group view limit (LRU eviction)', () => {
      const { saveGroupView } = useGridStore.getState();
      
      // Create 12 views (limit is 10)
      for (let i = 0; i < 12; i++) {
        saveGroupView(`View ${i}`);
      }
      
      const state = useGridStore.getState();
      expect(state.groupViews.length).toBeLessThanOrEqual(11); // 10 + default
    });
  });
  
  describe('Persistence', () => {
    it('should compress data for localStorage', () => {
      const { saveGroupView } = useGridStore.getState();
      saveGroupView('Compression Test');
      
      // Verify by checking localStorage directly
      const stored = localStorage.getItem('quaternary-grid-v2');
      const data = JSON.parse(stored);
      
      // Should use abbreviated keys
      expect(data.p || data.panels).toBeDefined();
    });
    
    it('should recover gracefully from corrupted storage', () => {
      // Inject corrupted data
      localStorage.setItem('quaternary-grid-v2', 'invalid json{{');
      
      // Reset should fall back to defaults
      useGridStore.persist.rehydrate();
      
      expect(useGridStore.getState().panels).toEqual(DEFAULT_PANELS);
    });
  });
});
```

### 3.2 Component Tests

```typescript
// __tests__/unit/components/DraggablePanel.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggablePanel } from '@/components/grid/DraggablePanel';
import { renderWithProviders, createMockPanel } from '@/test-utils';

describe('DraggablePanel', () => {
  const mockPanel = createMockPanel({ i: 'test-panel', title: 'Test Panel' });
  
  it('renders panel with correct title', () => {
    renderWithProviders(
      <DraggablePanel panel={mockPanel}>
        <div>Panel Content</div>
      </DraggablePanel>
    );
    
    expect(screen.getByText('Test Panel')).toBeInTheDocument();
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });
  
  it('minimizes panel when minimize button clicked', () => {
    renderWithProviders(
      <DraggablePanel panel={mockPanel}>
        <div>Panel Content</div>
      </DraggablePanel>
    );
    
    const minimizeBtn = screen.getByTitle('Minimize');
    fireEvent.click(minimizeBtn);
    
    // Content should be hidden
    expect(screen.queryByText('Panel Content')).not.toBeVisible();
  });
  
  it('closes panel when close button clicked', () => {
    const { container } = renderWithProviders(
      <DraggablePanel panel={mockPanel}>
        <div>Panel Content</div>
      </DraggablePanel>
    );
    
    const closeBtn = screen.getByTitle('Close');
    fireEvent.click(closeBtn);
    
    // Should trigger store action (verify by checking store state)
    const state = useGridStore.getState();
    expect(state.panels.find(p => p.i === 'test-panel')).toBeUndefined();
  });
  
  it('applies correct hub color theming', () => {
    const satorPanel = createMockPanel({ hub: 'SATOR' });
    const { container } = renderWithProviders(
      <DraggablePanel panel={satorPanel}>
        <div>Content</div>
      </DraggablePanel>
    );
    
    // Check for gold color (SATOR hub)
    const header = container.querySelector('.draggable-handle');
    expect(header).toHaveStyle({ borderBottomColor: expect.stringContaining('ffd700') });
  });
  
  it('shows drag visual feedback when isDragging prop is true', () => {
    const { container } = renderWithProviders(
      <DraggablePanel panel={mockPanel} isDragging={true}>
        <div>Content</div>
      </DraggablePanel>
    );
    
    expect(container.firstChild).toHaveClass('shadow-2xl');
  });
  
  it('prevents unnecessary re-renders with React.memo', () => {
    const renderSpy = vi.fn();
    
    function TestPanel({ panel }) {
      renderSpy();
      return <DraggablePanel panel={panel}>Content</DraggablePanel>;
    }
    
    const { rerender } = renderWithProviders(<TestPanel panel={mockPanel} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    // Re-render with same props
    rerender(<TestPanel panel={mockPanel} />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    
    // Re-render with different props
    rerender(<TestPanel panel={{ ...mockPanel, title: 'Changed' }} />);
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });
});
```

---

## IV. INTEGRATION TESTS

```typescript
// __tests__/integration/grid-system.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuaternaryGrid } from '@/components/QuaternaryGrid';
import { renderWithProviders } from '@/test-utils';

describe('Grid System Integration', () => {
  it('renders all default panels on mount', () => {
    renderWithProviders(<QuaternaryGrid />);
    
    expect(screen.getByText('Minimap')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Player Stats')).toBeInTheDocument();
    expect(screen.getByText('Video Feed')).toBeInTheDocument();
  });
  
  it('adds new panel via Add Panel menu', async () => {
    renderWithProviders(<QuaternaryGrid />);
    
    // Open add menu
    fireEvent.click(screen.getByText('Add Panel'));
    
    // Click on minimap option
    fireEvent.click(screen.getByText('Minimap'));
    
    await waitFor(() => {
      // Should now have 5 panels
      const panels = screen.getAllByText(/Minimap/i);
      expect(panels).toHaveLength(2);
    });
  });
  
  it('saves and loads group views', async () => {
    renderWithProviders(<QuaternaryGrid />);
    
    // Close a panel
    const closeButtons = screen.getAllByTitle('Close');
    fireEvent.click(closeButtons[0]);
    
    // Save current layout
    fireEvent.click(screen.getByText('Save Current'));
    
    // Type name
    const input = screen.getByPlaceholderText('View name...');
    fireEvent.change(input, { target: { value: 'My Custom View' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('My Custom View')).toBeInTheDocument();
    });
    
    // Reset layout
    fireEvent.click(screen.getByTitle('Reset Layout'));
    
    // Should have 4 panels again
    await waitFor(() => {
      expect(screen.getAllByText(/Minimap|Analytics|Stats|Video/)).toHaveLength(4);
    });
    
    // Load custom view
    fireEvent.change(screen.getByRole('combobox'), { 
      target: { value: 'my-custom-view-id' } 
    });
    
    // Should have 3 panels (one was closed)
    await waitFor(() => {
      expect(screen.getAllByText(/Minimap|Analytics|Stats|Video/)).toHaveLength(3);
    });
  });
  
  it('synchronizes panel state across components', async () => {
    renderWithProviders(<QuaternaryGrid />);
    
    // Minimize panel
    const minimizeBtns = screen.getAllByTitle('Minimize');
    fireEvent.click(minimizeBtns[0]);
    
    // Content should be hidden
    await waitFor(() => {
      // Check store state
      const state = useGridStore.getState();
      expect(state.panels[0].state).toBe('minimized');
    });
  });
});
```

---

## V. PERFORMANCE TESTS

```typescript
// __tests__/performance/render-perf.bench.js
import { benchmark } from 'vitest';
import { render } from '@testing-library/react';
import { QuaternaryGrid } from '@/components/QuaternaryGrid';
import { renderWithProviders } from '@/test-utils';

benchmark('QuaternaryGrid initial render', () => {
  const { unmount } = renderWithProviders(<QuaternaryGrid />);
  unmount();
}, { time: 1000 });

benchmark('add 4 panels', () => {
  const { getByText } = renderWithProviders(<QuaternaryGrid />);
  
  for (let i = 0; i < 4; i++) {
    fireEvent.click(getByText('Add Panel'));
    fireEvent.click(getByText('Minimap'));
  }
});

benchmark('update panel layout 100x', () => {
  const { updateLayout } = useGridStore.getState();
  const panels = useGridStore.getState().panels;
  
  for (let i = 0; i < 100; i++) {
    updateLayout(panels.map(p => ({ ...p, x: p.x + 1 })));
  }
});

// Memory leak test
describe('Memory Leaks', () => {
  it('should not leak memory when adding/removing panels', async () => {
    const { getByText, unmount } = renderWithProviders(<QuaternaryGrid />);
    
    const initialMemory = performance.memory?.usedJSHeapSize;
    
    // Add and remove 100 panels
    for (let i = 0; i < 100; i++) {
      fireEvent.click(getByText('Add Panel'));
      fireEvent.click(getByText('Minimap'));
      
      const closeBtns = screen.getAllByTitle('Close');
      fireEvent.click(closeBtns[closeBtns.length - 1]);
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = performance.memory?.usedJSHeapSize;
    
    // Memory growth should be minimal (< 10MB)
    if (initialMemory && finalMemory) {
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
    }
    
    unmount();
  });
});
```

---

## VI. E2E TESTS (Playwright)

```typescript
// __tests__/e2e/user-workflows.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
  });
  
  test('complete drag and resize workflow', async ({ page }) => {
    // Wait for grid to load
    await page.waitForSelector('[data-testid="grid-container"]');
    
    // Get first panel
    const panel = page.locator('[data-testid="panel"]').first();
    
    // Drag panel
    const handle = panel.locator('.draggable-handle');
    await handle.dragTo(page.locator('[data-grid-pos="3,0"]'));
    
    // Verify new position (check data attributes)
    await expect(panel).toHaveAttribute('data-x', '3');
    await expect(panel).toHaveAttribute('data-y', '0');
  });
  
  test('mode toggle changes theme', async ({ page }) => {
    // Click mode toggle
    await page.click('[data-testid="mode-toggle"]');
    
    // Wait for transition
    await page.waitForTimeout(600);
    
    // Check that accent color changed
    const header = page.locator('header');
    await expect(header).toHaveCSS('--mode-accent', '#FF4655');
  });
  
  test('group view persistence across reloads', async ({ page }) => {
    // Create custom view
    await page.click('text=Save Current');
    await page.fill('[placeholder="View name..."]', 'My View');
    await page.click('text=Save');
    
    // Reload page
    await page.reload();
    
    // View should still exist
    await expect(page.locator('text=My View')).toBeVisible();
  });
  
  test('keyboard navigation accessibility', async ({ page }) => {
    // Tab to first panel
    await page.keyboard.press('Tab');
    
    // Should focus panel header
    const focused = page.locator(':focus');
    await expect(focused).toHaveClass(/draggable-handle/);
    
    // Ctrl+M to minimize
    await page.keyboard.press('Control+m');
    
    // Panel should be minimized
    const panel = page.locator('[data-testid="panel"]').first();
    await expect(panel).toHaveAttribute('data-state', 'minimized');
  });
});
```

---

## VII. ACCESSIBILITY AUDIT

```typescript
// __tests__/e2e/accessibility.spec.js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await injectAxe(page);
  });
  
  test('should have no accessibility violations', async ({ page }) => {
    await checkA11y(page, {
      exclude: [['.react-grid-layout']], // Exclude layout container (has aria issues)
    });
  });
  
  test('panel controls have accessible labels', async ({ page }) => {
    const minimizeBtn = page.locator('[title="Minimize"]').first();
    await expect(minimizeBtn).toHaveAttribute('aria-label', 'Minimize panel');
    
    const closeBtn = page.locator('[title="Close"]').first();
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close panel');
  });
  
  test('color contrast meets WCAG AA', async ({ page }) => {
    // Check contrast of text elements
    const results = await page.evaluate(async () => {
      const axe = await import('axe-core');
      return axe.run({
        runOnly: { type: 'rule', values: ['color-contrast'] },
      });
    });
    
    expect(results.violations).toHaveLength(0);
  });
  
  test('reduced motion preference respected', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // Check that SVG fallback is used instead of WebGL
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();
  });
});
```

---

## VIII. TEST RUNNER CONFIGURATION

```typescript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
      ],
    },
    benchmark: {
      include: ['**/*.bench.js'],
    },
  },
});
```

---

## IX. DELIVERABLES

1. `vitest.config.js` - Test runner configuration
2. `src/test-utils/` - Test utilities and helpers
3. `src/__tests__/unit/` - Unit test suites
4. `src/__tests__/integration/` - Integration tests
5. `src/__tests__/performance/` - Performance benchmarks
6. `src/__tests__/e2e/` - Playwright E2E tests
7. `.github/workflows/test.yml` - CI test workflow

---

*End of Testing & QA Sub-Agent Prompt*
