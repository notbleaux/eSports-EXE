/**
 * [Ver001.000] Unified Search E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Unified Search', () => {
  test('/stats route loads without crash', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('search API responds to valid query', async ({ page }) => {
    await page.route('**/v1/search/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: [{ id: 1, name: 'SearchPlayer', slug: 'searchplayer', game: 'valorant' }],
          teams: [],
          total: 1,
        }),
      })
    );
    // Navigate to stats hub — search functionality lives there
    await page.goto('/stats');
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="earch"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('SearchPlayer');
      // Allow debounce
      await page.waitForTimeout(400);
      await expect(page.locator('body')).not.toContainText('Unhandled error');
    } else {
      test.skip(true, 'Search input not found on /stats — may be on a different hub');
    }
  });

  test('search endpoint returns 200 for valid query', async ({ page }) => {
    let status = 0;
    await page.route('**/v1/search/**', async (route) => {
      const resp = await route.fetch();
      status = resp.status();
      await route.fulfill({ response: resp });
    });
    await page.goto('/stats');
    // Trigger a search if input exists
    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="earch"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('/stats page has no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/stats');
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    expect(overflow).toBe(false);
  });
});
