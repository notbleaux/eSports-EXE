/** [Ver002.000] - Updated for backend integration */
/**
 * SpecMapViewer E2E Tests
 * =======================
 * Playwright E2E tests for SpecMapViewer component.
 * 
 * Prerequisites:
 * - Backend API running on localhost:8000
 * - Frontend dev server running
 * 
 * Coverage:
 * - Map loading and display
 * - Dimension mode switching
 * - Lens overlays
 * - Camera controls
 * - Real-time updates via WebSocket
 */

import { test, expect } from '@playwright/test';

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = process.env.WS_URL || 'ws://localhost:8000';

test.describe('SpecMapViewer', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ROTAS hub
    await page.goto('/rotas');
    
    // Wait for map to load with timeout
    await page.waitForSelector('[data-testid="specmap-canvas"]', { 
      timeout: 10000,
      state: 'visible'
    });
  });

  test.describe('Map Loading', () => {
    test('should display default map', async ({ page }) => {
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
      
      // Check map has dimensions
      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      expect(width).toBeTruthy();
      expect(height).toBeTruthy();
    });

    test('should load map grid data from API', async ({ page }) => {
      // Wait for grid API response
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/maps/') && response.url().includes('/grid'),
        { timeout: 5000 }
      );
      
      await page.goto('/rotas');
      const response = await responsePromise;
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('map_id');
      expect(data).toHaveProperty('dimensions');
      expect(data).toHaveProperty('sites');
    });

    test('should display site markers', async ({ page }) => {
      // Wait for sites to be rendered
      await page.waitForSelector('[data-testid^="site-marker-"]', { timeout: 5000 });
      
      const siteMarkers = page.locator('[data-testid^="site-marker-"]');
      const count = await siteMarkers.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should handle API errors gracefully', async ({ page, context }) => {
      // Mock API failure
      await context.route('**/api/maps/**/grid', route => 
        route.fulfill({ status: 500, body: '{"detail": "Server error"}' })
      );
      
      await page.goto('/rotas');
      
      // Should show error state
      const errorMessage = page.locator('[data-testid="map-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Dimension Mode Switching', () => {
    test('should switch to 3D mode', async ({ page }) => {
      const mode3D = page.locator('[data-testid="mode-3d"]');
      await expect(mode3D).toBeEnabled();
      await mode3D.click();
      
      // Wait for mode indicator to update
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('3D', { timeout: 1000 });
      
      // Canvas should remain visible
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

    test('should animate smoothly between modes', async ({ page }) => {
      const mode3D = page.locator('[data-testid="mode-3d"]');
      const mode2D = page.locator('[data-testid="mode-2d"]');
      
      // Switch to 3D
      await mode3D.click();
      await page.waitForTimeout(600); // Wait for animation
      
      // Switch back to 2D
      await mode2D.click();
      
      // Should complete animation within reasonable time
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('2D', { timeout: 1000 });
    });
  });

  test.describe('Lens Overlays', () => {
    test('should toggle tension lens', async ({ page }) => {
      const tensionToggle = page.locator('[data-testid="lens-tension"]');
      await tensionToggle.click();
      
      // Wait for lens data API response
      const response = await page.waitForResponse(
        response => response.url().includes('/api/maps/') && response.url().includes('/lens-data'),
        { timeout: 5000 }
      );
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.lens_data).toHaveProperty('tension');
      
      // Toggle should be active
      await expect(tensionToggle).toHaveClass(/active/);
    });

    test('should toggle multiple lenses', async ({ page }) => {
      const tensionToggle = page.locator('[data-testid="lens-tension"]');
      const windToggle = page.locator('[data-testid="lens-wind"]');
      
      await tensionToggle.click();
      await windToggle.click();
      
      const response = await page.waitForResponse(
        response => response.url().includes('/lens-data'),
        { timeout: 5000 }
      );
      
      const data = await response.json();
      expect(data.lens_types).toContain('tension');
      expect(data.lens_types).toContain('wind');
      
      await expect(tensionToggle).toHaveClass(/active/);
      await expect(windToggle).toHaveClass(/active/);
    });

    test('should reject invalid lens types', async ({ page, context }) => {
      // Intercept and modify request
      await context.route('**/api/maps/*/lens-data', async (route, request) => {
        if (request.method() === 'POST') {
          // Forward with invalid lens type
          await route.continue({
            postData: JSON.stringify({ lens_types: ['invalid_lens'] })
          });
        } else {
          await route.continue();
        }
      });

      const tensionToggle = page.locator('[data-testid="lens-tension"]');
      await tensionToggle.click();
      
      // Should show error for invalid lens
      const errorMessage = page.locator('[data-testid="lens-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Camera Controls', () => {
    test('should zoom in and out', async ({ page }) => {
      const zoomIn = page.locator('[data-testid="zoom-in"]');
      const zoomOut = page.locator('[data-testid="zoom-out"]');
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      
      // Get initial transform
      const initialTransform = await canvas.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Zoom in
      await zoomIn.click();
      
      // Wait for transform to change
      await expect.poll(async () => {
        const newTransform = await canvas.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        return newTransform !== initialTransform;
      }, { timeout: 500 }).toBe(true);
      
      // Zoom out
      const zoomedTransform = await canvas.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      await zoomOut.click();
      
      await expect.poll(async () => {
        const newTransform = await canvas.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        return newTransform !== zoomedTransform;
      }, { timeout: 500 }).toBe(true);
    });

    test('should focus on site', async ({ page }) => {
      const focusA = page.locator('[data-testid="focus-site-a"]');
      await expect(focusA).toBeEnabled();
      
      await focusA.click();
      
      // Wait for any animation to complete
      await page.waitForTimeout(500);
      
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });

    test('should reset camera', async ({ page }) => {
      const resetButton = page.locator('[data-testid="camera-reset"]');
      await resetButton.click();
      
      await page.waitForTimeout(500);
      
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('WebSocket Real-time Updates', () => {
    test('should connect to WebSocket', async ({ page }) => {
      // Wait for WebSocket connection
      const wsPromise = page.waitForEvent('websocket', ws => 
        ws.url().includes('/ws/lens-updates')
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
      const wsPromise = page.waitForEvent('websocket');
      
      const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');
      await realtimeToggle.click();
      
      const ws = await wsPromise;
      
      // Wait for lens update message
      const message = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const timeout = setTimeout(() => 
          reject(new Error('Timeout waiting for message')), 10000
        );
        
        ws.on('framereceived', (data: string) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'lens_update') {
              clearTimeout(timeout);
              resolve(msg);
            }
          } catch {
            // Ignore parse errors
          }
        });
      });
      
      expect(message).toHaveProperty('type', 'lens_update');
      expect(message).toHaveProperty('map_id');
      expect(message).toHaveProperty('data');
    });

    test('should reconnect on disconnect', async ({ page }) => {
      const wsPromise = page.waitForEvent('websocket');
      
      const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');
      await realtimeToggle.click();
      
      const ws = await wsPromise;
      
      // Simulate disconnect
      await page.evaluate(() => {
        // @ts-ignore - close WebSocket from page context
        window.specMapWebSocket?.close();
      });
      
      // Should reconnect
      const wsReconnectPromise = page.waitForEvent('websocket', { timeout: 10000 });
      const ws2 = await wsReconnectPromise;
      
      expect(ws2).toBeTruthy();
    });
  });

  test.describe('Map Selection', () => {
    test('should switch to Haven map', async ({ page }) => {
      const mapSelect = page.locator('[data-testid="map-select"]');
      await mapSelect.selectOption('haven');
      
      // Wait for new map to load
      const response = await page.waitForResponse(
        response => response.url().includes('/api/maps/haven/grid'),
        { timeout: 5000 }
      );
      
      expect(response.status()).toBe(200);
      
      const mapLabel = page.locator('[data-testid="map-label"]');
      await expect(mapLabel).toContainText('Haven');
    });

    test('should switch to Ascent map', async ({ page }) => {
      const mapSelect = page.locator('[data-testid="map-select"]');
      await mapSelect.selectOption('ascent');
      
      const response = await page.waitForResponse(
        response => response.url().includes('/api/maps/ascent/grid'),
        { timeout: 5000 }
      );
      
      expect(response.status()).toBe(200);
      
      const mapLabel = page.locator('[data-testid="map-label"]');
      await expect(mapLabel).toContainText('Ascent');
    });

    test('should handle invalid map selection', async ({ page }) => {
      // Try to select non-existent map
      const mapSelect = page.locator('[data-testid="map-select"]');
      
      // This should not be possible in UI, but test API directly
      const response = await page.evaluate(async () => {
        const res = await fetch('http://localhost:8000/api/maps/invalid-map/grid');
        return { status: res.status };
      });
      
      expect(response.status).toBe(404);
    });
  });

  test.describe('Pathfinding', () => {
    test('should calculate path between points', async ({ page }) => {
      // Trigger pathfinding (assuming UI has pathfinding trigger)
      const pathfindButton = page.locator('[data-testid="pathfind-button"]');
      
      // Skip if pathfinding UI not present
      const count = await pathfindButton.count();
      if (count === 0) {
        test.skip('Pathfinding UI not available');
      }
      
      await pathfindButton.click();
      
      const response = await page.waitForResponse(
        response => response.url().includes('/api/maps/pathfind'),
        { timeout: 5000 }
      );
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('path');
      expect(data).toHaveProperty('distance');
      expect(data.path.length).toBeGreaterThan(1);
    });
  });

  test.describe('Performance', () => {
    test('should load map data within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/rotas');
      await page.waitForSelector('[data-testid="specmap-canvas"]', { 
        timeout: 2000,
        state: 'visible'
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle rapid interactions', async ({ page }) => {
      const mode3D = page.locator('[data-testid="mode-3d"]');
      const mode2D = page.locator('[data-testid="mode-2d"]');
      
      // Rapidly switch modes
      for (let i = 0; i < 5; i++) {
        await mode3D.click();
        await mode2D.click();
      }
      
      // Should still be responsive
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Start tabbing from body
      await page.keyboard.press('Tab');
      
      // Should have focused element
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
      
      // Tab through controls
      let tabCount = 0;
      while (tabCount < 10) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        // Check if we've cycled back or reached canvas
        const activeElement = await page.evaluate(() => 
          document.activeElement?.tagName
        );
        
        if (activeElement === 'CANVAS' || activeElement === 'BODY') {
          break;
        }
      }
      
      expect(tabCount).toBeLessThan(10);
    });

    test('should have ARIA labels', async ({ page }) => {
      const canvas = page.locator('[data-testid="specmap-canvas"]');
      
      // Should have aria-label or aria-labelledby
      const ariaLabel = await canvas.getAttribute('aria-label');
      const ariaLabelledBy = await canvas.getAttribute('aria-labelledby');
      
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    });

    test('should respect reduced motion preference', async ({ page }) => {
      // Emulate reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/rotas');
      
      // Animations should be disabled or instant
      const mode3D = page.locator('[data-testid="mode-3d"]');
      await mode3D.click();
      
      // Mode should switch immediately (no animation delay)
      const modeIndicator = page.locator('[data-testid="mode-indicator"]');
      await expect(modeIndicator).toContainText('3D', { timeout: 100 });
    });
  });
});
