/**
 * [Ver001.000] Player Profile Page E2E tests
 */
import { test, expect } from '@playwright/test';

const MOCK_PLAYER = {
  player: {
    id: 1, name: 'TestPlayer', slug: 'testplayer',
    game: 'valorant', nationality: 'US', team_id: null,
  },
};

const MOCK_SIMRATING = {
  player_id: 1, sim_rating: 78.4, grade: 'B',
  kd_ratio: 1.42, acs: 245.0, headshot_pct: 22.1,
};

test.describe('Player Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/players/1', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_PLAYER) })
    );
    await page.route('**/v1/simrating**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_SIMRATING) })
    );
  });

  test('/player/:slug loads without crash', async ({ page }) => {
    await page.goto('/player/testplayer');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('page renders without 500 error for any slug', async ({ page }) => {
    const response = await page.goto('/player/some-slug');
    expect(response?.status()).not.toBe(500);
  });

  test('back navigation returns to previous page', async ({ page }) => {
    await page.goto('/stats');
    await page.goto('/player/testplayer');
    await page.goBack();
    await expect(page).toHaveURL('/stats');
  });

  test('unknown player slug shows 404 page not crash', async ({ page }) => {
    await page.route('**/v1/players/**', (route) =>
      route.fulfill({ status: 404, contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not found' }) })
    );
    await page.goto('/player/nonexistent-player-xyz');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });
});
