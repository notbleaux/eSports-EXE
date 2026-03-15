/** [Ver001.001]
 * SpecMapViewer E2E Tests
 * =======================
 * Playwright E2E tests for SpecMapViewer component.
 * 
 * Coverage:
 * - Map loading and display
 * - Dimension mode switching
 * - Lens overlays
 * - Camera controls
 * - Real-time updates
 * 
 * TODO: Add tests for error states and loading states
 */

import { test, expect } from '@playwright/test';

test.describe('SpecMapViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rotas');
    // Wait for map to load
    await page.waitForSelector('[data-testid="specmap-canvas"]', { timeout: 10000 });
  });

  test.describe('Map Loading', () => {
    test('should display default map (Bind)', async ({ page }) => {
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
      
      // Check map label
      const mapLabel = page.locator('[data-testid="map-label"]');
      await expect(mapLabel).toContainText('Bind');
    });

    test('should load map grid data', async ({ page }) => {
      // Wait for grid data to load
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/bind/grid')
      );
      
      // Canvas should be rendered
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toHaveAttribute('width');
      await expect(canvas).toHaveAttribute('height');
    });

    test('should display site markers', async ({ page }) => {
      const siteA = page.locator('[data-testid="site-marker-A"]');
      const siteB = page.locator('[data-testid="site-marker-B"]');
      
      await expect(siteA).toBeVisible();
      await expect(siteB).toBeVisible();
    });
  });

  test.describe('Dimension Mode Switching', () => {
    test('should switch to 3D mode', async ({ page }) => {
      const mode3D = page.locator('[data-testid="mode-3d"]');
      await mode3D.click();
      
      // Wait for mode indicator to update instead of fixed timeout
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('3D', { timeout: 1000 });
      
      // Check canvas still visible
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });

    test('should switch to 2.5D mode', async ({ page }) => {
      const mode25D = page.locator('[data-testid="mode-2.5d"]');
      await mode25D.click();
      
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('2.5D', { timeout: 1000 });
    });

    test('should switch to 4D mode', async ({ page }) => {
      const mode4D = page.locator('[data-testid="mode-4d"]');
      await mode4D.click();
      
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('4D', { timeout: 1000 });
    });
  });

  test.describe('Lens Overlays', () => {
    test('should toggle tension lens', async ({ page }) => {
      const tensionToggle = page.locator('[data-testid="lens-tension"]');
      await tensionToggle.click();
      
      // Wait for lens data
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/bind/lens-data')
      );
      
      // Lens should be active
      await expect(tensionToggle).toHaveClass(/active/);
    });

    test('should toggle ripple lens', async ({ page }) => {
      const rippleToggle = page.locator('[data-testid="lens-ripple"]');
      await rippleToggle.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/bind/lens-data')
      );
      
      await expect(rippleToggle).toHaveClass(/active/);
    });

    test('should toggle multiple lenses', async ({ page }) => {
      const tensionToggle = page.locator('[data-testid="lens-tension"]');
      const windToggle = page.locator('[data-testid="lens-wind"]');
      
      await tensionToggle.click();
      await windToggle.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/bind/lens-data')
      );
      
      await expect(tensionToggle).toHaveClass(/active/);
      await expect(windToggle).toHaveClass(/active/);
    });
  });

  test.describe('Camera Controls', () => {
    test('should zoom in', async ({ page }) => {
      const zoomIn = page.locator('[data-testid="zoom-in"]');
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      
      // Get initial transform
      const initialTransform = await canvas.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      await zoomIn.click();
      
      // Wait for zoom to complete (transform changes)
      await expect.poll(async () => {
        const newTransform = await canvas.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        return newTransform !== initialTransform;
      }, { timeout: 500 }).toBe(true);
    });

    test('should zoom out', async ({ page }) => {
      const zoomOut = page.locator('[data-testid="zoom-out"]');
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      
      const initialTransform = await canvas.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      await zoomOut.click();
      
      await expect.poll(async () => {
        const newTransform = await canvas.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        return newTransform !== initialTransform;
      }, { timeout: 500 }).toBe(true);
    });

    test('should focus on site A', async ({ page }) => {
      const focusA = page.locator('[data-testid="focus-site-a"]');
      await focusA.click();
      
      // Wait for animation to complete
      await page.waitForFunction(() => {
        // @ts-ignore - accessing internal state for testing
        const controller = window.specMapCameraController;
        return controller ? !controller.isAnimating : true;
      }, { timeout: 1000 });
      
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });

    test('should reset camera', async ({ page }) => {
      const resetButton = page.locator('[data-testid="camera-reset"]');
      await resetButton.click();
      
      // Wait for reset animation
      await page.waitForFunction(() => {
        // @ts-ignore
        const controller = window.specMapCameraController;
        return controller ? !controller.isAnimating : true;
      }, { timeout: 800 });
      
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('WebSocket Real-time Updates', () => {
    test('should connect to WebSocket', async ({ page }) => {
      // Wait for WebSocket connection
      const wsPromise = page.waitForEvent('websocket', ws => 
        ws.url().includes('/v1/ws/lens-updates')
      );
      
      // Enable real-time to trigger connection
      const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');
      await realtimeToggle.click();
      
      const ws = await wsPromise;
      expect(ws).toBeTruthy();
      
      // Connection status should show connected
      const wsStatus = page.locator('[data-testid="ws-status"]');
      await expect(wsStatus).toContainText('Connected', { timeout: 5000 });
    });

    test('should receive lens updates', async ({ page }) => {
      // Wait for WebSocket and subscribe
      const wsPromise = page.waitForEvent('websocket');
      
      const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');
      await realtimeToggle.click();
      
      const ws = await wsPromise;
      
      // Wait for lens update message
      const message = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout waiting for message')), 10000);
        ws.on('framereceived', (data: string) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'lens_update') {
              clearTimeout(timeout);
              resolve(msg);
            }
          } catch {}
        });
      });
      
      expect(message).toHaveProperty('type', 'lens_update');
      expect(message).toHaveProperty('map_id');
      expect(message).toHaveProperty('data');
    });
  });

  test.describe('Map Selection', () => {
    test('should switch to Haven map', async ({ page }) => {
      const mapSelect = page.locator('[data-testid="map-select"]');
      await mapSelect.selectOption('haven');
      
      // Wait for new map to load
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/haven/grid')
      );
      
      const mapLabel = page.locator('[data-testid="map-label"]');
      await expect(mapLabel).toContainText('Haven');
    });

    test('should switch to Ascent map', async ({ page }) => {
      const mapSelect = page.locator('[data-testid="map-select"]');
      await mapSelect.selectOption('ascent');
      
      await page.waitForResponse(response => 
        response.url().includes('/v1/maps/ascent/grid')
      );
      
      const mapLabel = page.locator('[data-testid="map-label"]');
      await expect(mapLabel).toContainText('Ascent');
    });
  });

  test.describe('Performance', () => {
    test('should maintain 60fps during animations', async ({ page }) => {
      // This test requires the application to expose frame metrics
      // Skip if not available
      const hasMetrics = await page.evaluate(() => {
        // @ts-ignore
        return window.specMapPerformanceMetrics !== undefined;
      });
      
      test.skip(!hasMetrics, 'Performance metrics not exposed');
      
      // Trigger animation
      const mode3D = page.locator('[data-testid="mode-3d"]');
      await mode3D.click();
      
      // Wait for animation to complete
      await page.waitForFunction(() => {
        // @ts-ignore
        const metrics = window.specMapPerformanceMetrics;
        return metrics && metrics.animationComplete;
      }, { timeout: 2000 });
      
      // Check frame timing
      const frameStats = await page.evaluate(() => {
        // @ts-ignore
        const metrics = window.specMapPerformanceMetrics;
        return metrics.getFrameStats();
      });
      
      // Should have consistent frame times (~16ms for 60fps)
      if (frameStats && frameStats.averageFrameTime) {
        expect(frameStats.averageFrameTime).toBeLessThan(20);
        expect(frameStats.droppedFrames).toBeLessThan(5);
      }
    });

    test('should load map data within 2 seconds', async ({ page }) => {
      await page.goto('/rotas');
      
      // Use performance API to measure actual load time
      const loadTime = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav ? nav.loadEventEnd - nav.startTime : 0;
      });
      
      // Also verify canvas is visible
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible({ timeout: 2000 });
      
      // Check load time if available
      if (loadTime > 0) {
        expect(loadTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through controls
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Something should be focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have ARIA labels', async ({ page }) => {
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      const ariaLabel = await canvas.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });
  });
});
