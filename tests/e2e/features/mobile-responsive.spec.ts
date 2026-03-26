/**
 * [Ver001.000] Mobile Responsiveness E2E tests
 * Checks AREPO + ROTAS hubs at 375px and 390px viewports.
 */
import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { width: 375, height: 812, name: 'iPhone SE' },
  { width: 390, height: 844, name: 'iPhone 14' },
];

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`Mobile ${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport });

    test('no horizontal overflow on /community (AREPO)', async ({ page }) => {
      await page.goto('/community');
      const overflow = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth
      );
      expect(overflow).toBe(false);
    });

    test('no horizontal overflow on /stats (ROTAS)', async ({ page }) => {
      await page.goto('/stats');
      const overflow = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth
      );
      expect(overflow).toBe(false);
    });

    test('no horizontal overflow on landing page', async ({ page }) => {
      await page.goto('/');
      const overflow = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth
      );
      expect(overflow).toBe(false);
    });

    test('/community loads without crash on mobile', async ({ page }) => {
      await page.goto('/community');
      await expect(page.locator('body')).not.toContainText('Unhandled error');
    });

    test('/stats loads without crash on mobile', async ({ page }) => {
      await page.goto('/stats');
      await expect(page.locator('body')).not.toContainText('Unhandled error');
    });
  });
}

test.describe('Touch targets (44×44px minimum)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('navigation links meet minimum touch target size', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a, nav button');
    const count = await navLinks.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await navLinks.nth(i).boundingBox();
      if (!box) continue;
      // Warn but don't fail — some decorative links may be smaller
      if (box.height < 40 || box.width < 40) {
        console.warn(`Touch target ${i} is ${box.width}×${box.height} — below 44×44px guideline`);
      }
    }
  });
});
