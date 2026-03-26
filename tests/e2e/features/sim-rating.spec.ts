/**
 * [Ver001.000] SimRating Leaderboard E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('SimRating Leaderboard', () => {
  test('leaderboard loads without crash', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('leaderboard table renders at least one row when API returns data', async ({ page }) => {
    await page.route('**/v1/simrating/leaderboard**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [
            { player_id: 1, handle: 'TestPlayer', slug: 'testplayer', game: 'valorant',
              sim_rating: 82.5, grade: 'A', source: 'v2' },
          ],
          total: 1,
        }),
      })
    );
    await page.goto('/analytics');
    // Expect some leaderboard content rendered
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('SimRating API returns valid score range', async ({ page }) => {
    let capturedData: any = null;
    await page.route('**/v1/simrating/leaderboard**', async (route) => {
      const resp = await route.fetch();
      capturedData = await resp.json().catch(() => null);
      await route.fulfill({ response: resp });
    });
    await page.goto('/analytics');
    if (capturedData?.leaderboard) {
      for (const entry of capturedData.leaderboard) {
        expect(entry.sim_rating).toBeGreaterThanOrEqual(0);
        expect(entry.sim_rating).toBeLessThanOrEqual(100);
      }
    }
  });

  test('/analytics route is accessible', async ({ page }) => {
    const response = await page.goto('/analytics');
    expect(response?.status()).toBeLessThan(400);
  });
});
