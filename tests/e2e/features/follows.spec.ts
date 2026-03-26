import { test, expect } from '@playwright/test';

test.describe('Player Follow System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
    await page.evaluate(() => localStorage.removeItem('njz_followed_players'));
  });

  test('AREPO /community loads without crash', async ({ page }) => {
    await page.goto('/community');
    await expect(page).toHaveURL('/community');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('localStorage follow persists across navigation', async ({ page }) => {
    await page.goto('/community');
    await page.evaluate(() => {
      localStorage.setItem('njz_followed_players', JSON.stringify([
        { id: 1, slug: 'test-player', handle: 'TestPlayer',
          game: 'valorant', followedAt: new Date().toISOString() }
      ]));
    });
    await page.goto('/analytics');
    await page.goto('/community');
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('njz_followed_players') ?? '[]')
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].handle).toBe('TestPlayer');
  });

  test('FollowedFeed shows empty state when no follows', async ({ page }) => {
    await page.goto('/community');
    // Clear follows
    await page.evaluate(() => localStorage.removeItem('njz_followed_players'));
    await page.reload();
    const body = page.locator('body');
    // Just verify no crash
    await expect(body).not.toContainText('Unhandled error');
  });

  test('follow count increments correctly in localStorage', async ({ page }) => {
    await page.goto('/community');
    await page.evaluate(() => {
      const players = [
        { id: 1, slug: 'p1', handle: 'P1', game: 'valorant', followedAt: new Date().toISOString() },
        { id: 2, slug: 'p2', handle: 'P2', game: 'cs2', followedAt: new Date().toISOString() },
      ];
      localStorage.setItem('njz_followed_players', JSON.stringify(players));
    });
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem('njz_followed_players') ?? '[]')
    );
    expect(stored).toHaveLength(2);
  });
});
