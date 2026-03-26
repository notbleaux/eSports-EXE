import { test, expect } from '@playwright/test';

test.describe('eSports Calendar', () => {
  test('OPERA /pro-scene loads calendar section without crash', async ({ page }) => {
    await page.goto('/pro-scene');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });

  test('Notification permission can be queried', async ({ page }) => {
    await page.goto('/pro-scene');
    const permission = await page.evaluate(() => Notification.permission);
    expect(['default', 'granted', 'denied']).toContain(permission);
  });
});
