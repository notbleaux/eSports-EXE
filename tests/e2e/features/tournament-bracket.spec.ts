import { test, expect } from '@playwright/test';

test.describe('OPERA Tournament Bracket', () => {
  test('OPERA /pro-scene loads without crash', async ({ page }) => {
    await page.goto('/pro-scene');
    await expect(page).toHaveURL('/pro-scene');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText('Unhandled error');
  });
});
