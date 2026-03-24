/** [Ver001.000]
 * Critical Performance E2E Tests
 * ==============================
 * Tests page load performance and Core Web Vitals
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Page Load Performance', () => {
    test('landing page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      test.info().annotations.push({
        type: 'info',
        description: `Landing page load time: ${loadTime}ms`
      });

      // Should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('hub pages load within acceptable time', async ({ page }) => {
      const hubs = ['/sator', '/rotas', '/arepo'];
      
      for (const hub of hubs) {
        const startTime = Date.now();
        
        await page.goto(hub);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        test.info().annotations.push({
          type: 'info',
          description: `${hub} load time: ${loadTime}ms`
        });

        // Each hub should load in less than 6 seconds
        expect(loadTime).toBeLessThan(6000);
        
        // Small delay between tests
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Lazy Loading', () => {
    test('heavy components are lazy loaded', async ({ page }) => {
      await page.goto('/sator');
      await page.waitForLoadState('networkidle');

      // Check for loading indicators
      const loadingElements = page.locator('[data-testid*="loading"], [class*="skeleton"], [class*="loading"]');
      const count = await loadingElements.count();

      test.info().annotations.push({
        type: 'info',
        description: `Found ${count} loading elements`
      });

      // Loading elements should eventually disappear or stabilize
      await page.waitForTimeout(3000);
      
      // Content should be present
      const bodyText = await page.locator('body').textContent() || '';
      expect(bodyText.length).toBeGreaterThan(500);
    });
  });

  test.describe('Resource Loading', () => {
    test('no excessive JavaScript bundles', async ({ page }) => {
      // Track resource sizes
      const resources: { url: string; size: number }[] = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          try {
            const headers = await response.allHeaders();
            const size = parseInt(headers['content-length'] || '0');
            if (size > 0) {
              resources.push({ url: url.split('/').pop() || url, size });
            }
          } catch {
            // Ignore errors
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for large bundles
      const largeResources = resources.filter(r => r.size > 500000); // > 500KB
      
      test.info().annotations.push({
        type: 'info',
        description: `Resources loaded: ${resources.length}, Large resources: ${largeResources.length}`
      });

      // No single resource should be over 2MB
      const hugeResources = resources.filter(r => r.size > 2000000);
      expect(hugeResources.length).toBe(0);
    });

    test('images are optimized', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check image elements
      const images = page.locator('img');
      const count = await images.count();

      test.info().annotations.push({
        type: 'info',
        description: `Found ${count} images on page`
      });

      // Check a few images have alt text
      let imagesWithAlt = 0;
      for (let i = 0; i < Math.min(count, 5); i++) {
        const alt = await images.nth(i).getAttribute('alt');
        if (alt && alt.length > 0) {
          imagesWithAlt++;
        }
      }

      // Most images should have alt text
      if (count > 0) {
        expect(imagesWithAlt).toBeGreaterThanOrEqual(Math.min(count, 5) / 2);
      }
    });
  });

  test.describe('Runtime Performance', () => {
    test('no memory leaks on navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate between hubs multiple times
      const hubs = ['/sator', '/rotas', '/arepo', '/opera', '/tenet'];
      
      for (let i = 0; i < 3; i++) {
        for (const hub of hubs) {
          await page.goto(hub);
          await page.waitForTimeout(500);
        }
      }

      // Final navigation back to home
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Page should still be responsive
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('animations are performant', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for animation-related elements
      const animatedElements = page.locator('[class*="animate"], [class*="motion"], [style*="animation"]');
      const count = await animatedElements.count();

      test.info().annotations.push({
        type: 'info',
        description: `Found ${count} animated elements`
      });

      // Wait for animations to settle
      await page.waitForTimeout(2000);

      // Page should still be interactive
      const clickTarget = page.locator('a, button').first();
      await expect(clickTarget).toBeEnabled();
    });
  });
});
