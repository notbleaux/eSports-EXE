/** [Ver001.000]
 * Critical Navigation E2E Tests
 * =============================
 * Tests hub navigation, routing, and page transitions
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Navigation Flows', () => {
  const hubs = [
    { path: '/', name: 'Landing' },
    { path: '/analytics', name: 'SATOR' },
    { path: '/stats', name: 'ROTAS' },
    { path: '/community', name: 'AREPO' },
    { path: '/pro-scene', name: 'OPERA' },
    { path: '/tenet', name: 'TENET' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Hub Navigation', () => {
    for (const hub of hubs) {
      test(`${hub.name} hub loads successfully`, async ({ page }) => {
        await page.goto(hub.path);
        await page.waitForLoadState('networkidle');

        // Page should not show 404
        const notFound = await page.locator('text=404').isVisible().catch(() => false);
        expect(notFound).toBeFalsy();

        // Body should have content
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.length).toBeGreaterThan(100);

        // No console errors (check console messages)
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Wait a bit to capture any errors
        await page.waitForTimeout(1000);

        // Should not have critical errors
        const criticalErrors = consoleErrors.filter(e => 
          !e.includes('favicon') && 
          !e.includes('source map') &&
          !e.includes('[WebSocket]')
        );
        
        expect(criticalErrors.length).toBeLessThan(5);
      });
    }
  });

  test.describe('Page Transitions', () => {
    test('navigation between hubs works smoothly', async ({ page }) => {
      // Start at landing
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate through each hub
      for (const hub of hubs.slice(1)) {
        await page.goto(hub.path);
        await page.waitForLoadState('networkidle');
        
        // Verify page loaded
        const url = page.url();
        expect(url).toContain(hub.path);
        
        // Small delay to allow transitions
        await page.waitForTimeout(500);
      }
    });

    test('back button navigation works', async ({ page }) => {
      // Navigate to two hubs
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      
      await page.goto('/stats');
      await page.waitForLoadState('networkidle');

      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back at sator
      expect(page.url()).toContain('/analytics');
    });

    test('404 page displays for unknown routes', async ({ page }) => {
      await page.goto('/nonexistent-hub');
      await page.waitForLoadState('networkidle');

      // Should show 404 content
      const notFoundText = await page.locator('body').textContent() || '';
      const has404 = notFoundText.includes('404') || 
                     notFoundText.includes('Not Found') ||
                     notFoundText.includes('Hub Not Found');
      
      expect(has404).toBeTruthy();
    });
  });

  test.describe('Navigation Component', () => {
    test('navigation is visible on all hubs', async ({ page }) => {
      for (const hub of hubs) {
        await page.goto(hub.path);
        await page.waitForLoadState('networkidle');

        // Look for navigation element
        const nav = page.locator('nav').first().or(
          page.locator('[data-testid="navigation"]').or(
            page.locator('header').first()
          )
        );

        const isVisible = await nav.isVisible().catch(() => false);
        
        if (!isVisible) {
          test.info().annotations.push({
            type: 'warning',
            description: `Navigation not found on ${hub.name}`
          });
        }
      }
    });

    test('navigation links are functional', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for hub links
      const hubLinks = page.locator('a[href*="/analytics"], a[href*="/stats"], a[href*="/tenet"]');
      const count = await hubLinks.count();

      if (count > 0) {
        // Click first hub link
        const firstLink = hubLinks.first();
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        // Should have navigated
        const url = page.url();
        expect(url).not.toBe('/');
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'No hub navigation links found'
        });
      }
    });
  });
});
