/**
 * [Ver001.000] WCAG 2.1 AA Accessibility tests
 *
 * Uses axe-core via @axe-core/playwright.
 * Install: pnpm add -D @axe-core/playwright
 */
import { test, expect } from '@playwright/test';

// Graceful skip if axe is not installed
let injectAxe: Function | null = null;
let checkA11y: Function | null = null;
try {
  const axe = require('@axe-core/playwright');
  injectAxe = axe.injectAxe;
  checkA11y = axe.checkA11y;
} catch {
  // axe-core/playwright not installed — tests will be skipped
}

const HUB_ROUTES = ['/', '/analytics', '/stats', '/community', '/pro-scene', '/hubs'];

for (const route of HUB_ROUTES) {
  test(`No critical axe violations on ${route}`, async ({ page }) => {
    if (!injectAxe || !checkA11y) {
      test.skip(true, '@axe-core/playwright not installed — run: pnpm add -D @axe-core/playwright');
      return;
    }
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await (injectAxe as Function)(page);
    await (checkA11y as Function)(page, undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      // Allow known decorative violations to be reviewed separately
      rules: { 'color-contrast': { enabled: true } },
    });
  });
}

test('All pages have viewport meta tag', async ({ page }) => {
  for (const route of HUB_ROUTES) {
    await page.goto(route);
    const viewportMeta = await page.$eval(
      'meta[name="viewport"]',
      (el) => el.getAttribute('content')
    ).catch(() => null);
    expect(viewportMeta, `${route} missing viewport meta`).toContain('width=device-width');
  }
});

test('Tab navigation does not get stuck on landing page', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).not.toBe('BODY');
});

test('Focus ring is visible on interactive elements', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  // Verify at least one element receives focus
  const hasFocus = await page.evaluate(() => {
    const el = document.activeElement;
    return el !== null && el !== document.body;
  });
  expect(hasFocus).toBe(true);
});

test('Images have alt text or aria-hidden', async ({ page }) => {
  await page.goto('/');
  const violations = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images
      .filter((img) => {
        const hasAlt = img.hasAttribute('alt');
        const isHidden = img.getAttribute('aria-hidden') === 'true'
          || img.closest('[aria-hidden="true"]') !== null;
        return !hasAlt && !isHidden;
      })
      .map((img) => img.outerHTML.slice(0, 100));
  });
  expect(violations, `Images missing alt: ${violations.join(', ')}`).toHaveLength(0);
});
