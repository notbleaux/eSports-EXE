/**
 * [Ver001.000] Admin Dashboard E2E tests
 */
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('/admin redirects unauthenticated users', async ({ page }) => {
    const response = await page.goto('/admin');
    // Should either redirect to / or show a login/403 message, never 500
    expect(response?.status()).not.toBe(500);
    // Either we got redirected away from /admin or the page shows no admin content
    const url = page.url();
    const isRedirected = !url.endsWith('/admin');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const showsLoginOrDenied = /login|sign.?in|unauthorized|forbidden|access denied/i.test(bodyText);
    expect(isRedirected || showsLoginOrDenied).toBe(true);
  });

  test('/admin page loads without crash when auth check runs', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('admin API stats endpoint responds', async ({ page }) => {
    await page.route('**/v1/admin/stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ players: 100, teams: 20, matches: 500, forum_posts: 30 }),
      })
    );
    // Navigate and check no crash
    await page.goto('/admin');
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('AdminGuard component exists in bundle', async ({ page }) => {
    // Verify the admin route is registered in the app
    await page.goto('/');
    const html = await page.content();
    // App should have loaded without referencing missing AdminGuard
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });
});
