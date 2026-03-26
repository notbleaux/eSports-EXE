import { test, expect } from '@playwright/test';

test.describe('Error Boundaries and 404', () => {
  test('404 page for unknown route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz-abc');
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });

  test('404 page has navigation links', async ({ page }) => {
    await page.goto('/unknown-route-xyz');
    const link = page.getByRole('link', { name: /home|hubs|analytics/i }).first();
    await expect(link).toBeVisible();
  });

  test('all hub routes load without crash', async ({ page }) => {
    const routes = ['/analytics', '/stats', '/community', '/pro-scene', '/hubs'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('body')).not.toContainText('Unhandled error');
    }
  });
});
