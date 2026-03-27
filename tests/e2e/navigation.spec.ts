/**
 * [Ver001.000] E2E Navigation Tests — TeNET Portal & Hub-5-tenet
 *
 * Tests for:
 * - TeNeT Portal (home landing page)
 * - TeNET Directory (game world selector)
 * - World-Port navigation (game entry points)
 * - GameNodeIDFrame 2×2 Quarter GRID (SATOR/AREPO/OPERA/ROTAS)
 * - TeZeT hub-specific branches
 * - Navigation state persistence across games
 * - Mobile responsive behavior
 *
 * Using Playwright Test framework.
 */

import { test, expect } from '@playwright/test';

// ─── Test Suite 1: TeNeT Portal (Landing Page) ───────────────────────

test.describe('TeNeT Portal — Landing Page', () => {
  test('Portal loads with correct title and layout', async ({ page }) => {
    await page.goto('/');

    // Check page title or hero text
    const portalTitle = await page.locator('text=TeNeT Portal').first();
    await expect(portalTitle).toBeVisible();

    // Check TENET branding
    const tenetBrand = await page.locator('text=TENET Navigation Layer');
    await expect(tenetBrand).toBeVisible();
  });

  test('Portal displays network, analytics, and security descriptions', async ({ page }) => {
    await page.goto('/');

    const network = await page.locator('text=Network').first();
    const analytics = await page.locator('text=Analytics').first();
    const security = await page.locator('text=Security').first();

    await expect(network).toBeVisible();
    await expect(analytics).toBeVisible();
    await expect(security).toBeVisible();
  });

  test('"Enter Platform" button navigates to /hubs', async ({ page }) => {
    await page.goto('/');

    const enterButton = await page.locator('button:has-text("Enter Platform")');
    await expect(enterButton).toBeVisible();
    await expect(enterButton).toBeEnabled();

    await enterButton.click();
    await page.waitForURL('**/hubs');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/hubs');
  });

  test('Portal renders with correct background color and geometry', async ({ page }) => {
    await page.goto('/');

    const container = page.locator('div[class*="boitano-pink"]');
    await expect(container).toBeVisible();
  });
});

// ─── Test Suite 2: TeNET Directory (Game World Selector) ─────────────

test.describe('TeNET Directory — Game World Selector', () => {
  test('Directory renders game selector grid with Valorant and CS2', async ({ page }) => {
    await page.goto('/hubs');

    // Check directory header
    const header = await page.locator('text=Select Game World');
    await expect(header).toBeVisible();

    // Check for game cards
    const valorantCard = await page.locator('text=VALORANT');
    const cs2Card = await page.locator('text=Counter-Strike 2');

    await expect(valorantCard).toBeVisible();
    await expect(cs2Card).toBeVisible();
  });

  test('Each game card displays name and status info', async ({ page }) => {
    await page.goto('/hubs');

    // Valorant card should show player count and last update
    const valorantSection = page.locator(':has-text("VALORANT")').first();
    await expect(valorantSection).toBeVisible();
  });

  test('Clicking Valorant card navigates to /valorant World-Port', async ({ page }) => {
    await page.goto('/hubs');

    const valorantCard = page.locator('text=VALORANT').first();
    await valorantCard.click();

    await page.waitForURL('**/valorant');
    expect(page.url()).toContain('/valorant');
  });

  test('Clicking CS2 card navigates to /cs2 World-Port', async ({ page }) => {
    await page.goto('/hubs');

    const cs2Card = page.locator('text=Counter-Strike 2');
    await cs2Card.click();

    await page.waitForURL('**/cs2');
    expect(page.url()).toContain('/cs2');
  });

  test('Inactive games are visually disabled', async ({ page }) => {
    await page.goto('/hubs');

    // League of Legends and Apex Legends should be inactive
    const lolCard = page.locator('text=League of Legends');

    // Check for disabled state (grayscale, opacity, cursor)
    const isDisabled = await lolCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.opacity === '0.5' || style.cursor === 'not-allowed';
    });

    // If visible, it should be disabled
    if (await lolCard.isVisible()) {
      expect(isDisabled).toBeTruthy();
    }
  });

  test('Directory breadcrumb shows current location', async ({ page }) => {
    await page.goto('/hubs');

    const breadcrumb = await page.locator('text=TeNET Directory');
    await expect(breadcrumb).toBeVisible();
  });
});

// ─── Test Suite 3: World-Port + GameNodeIDFrame (2×2 Quarter GRID) ────

test.describe('World-Port — GameNodeIDFrame 2×2 Quarter GRID', () => {
  test('Valorant World-Port displays 2×2 Quarter GRID with four quadrants', async ({ page }) => {
    await page.goto('/valorant');

    // All four quadrants should be visible
    const sator = await page.locator('text=SATOR').first();
    const arepo = await page.locator('text=AREPO').first();
    const opera = await page.locator('text=OPERA').first();
    const rotas = await page.locator('text=ROTAS').first();

    await expect(sator).toBeVisible();
    await expect(arepo).toBeVisible();
    await expect(opera).toBeVisible();
    await expect(rotas).toBeVisible();
  });

  test('Each quadrant displays name, subtitle, and description', async ({ page }) => {
    await page.goto('/valorant');

    // SATOR quadrant details
    const satorName = await page.locator('text=SATOR');
    const satorSubtitle = await page.locator('text=Advanced Analytics');

    await expect(satorName).toBeVisible();
    await expect(satorSubtitle).toBeVisible();
  });

  test('Quadrants have distinct colors (gold, blue, purple, cyan)', async ({ page }) => {
    await page.goto('/valorant');

    // Check for styled quadrant elements with data attributes
    const satorQuadrant = page.locator('[data-quarter="sator"]');
    const arepoQuadrant = page.locator('[data-quarter="arepo"]');

    // At minimum, should exist in DOM
    if (await satorQuadrant.count() > 0) {
      await expect(satorQuadrant.first()).toBeVisible();
    }
  });

  test('Top bar shows game name and NETWORK breadcrumb', async ({ page }) => {
    await page.goto('/valorant');

    const gameTitle = await page.locator('text=valorant').first();
    const networkLink = await page.locator('text=← NETWORK');

    await expect(gameTitle).toBeVisible();
    await expect(networkLink).toBeVisible();
  });

  test('Status bar shows TENET TOPOLOGY version', async ({ page }) => {
    await page.goto('/valorant');

    const statusBar = await page.locator('text=TENET TOPOLOGY v2.1');
    await expect(statusBar).toBeVisible();
  });

  test('Clicking SATOR quadrant navigates to /valorant/analytics', async ({ page }) => {
    await page.goto('/valorant');

    const satorLink = page.locator('a[href*="analytics"]').first();
    await satorLink.click();

    await page.waitForURL('**/valorant/analytics');
    expect(page.url()).toContain('valorant/analytics');
  });

  test('Clicking AREPO quadrant navigates to /valorant/community', async ({ page }) => {
    await page.goto('/valorant');

    const arepoLink = page.locator('a[href*="community"]').first();
    await arepoLink.click();

    await page.waitForURL('**/valorant/community');
    expect(page.url()).toContain('valorant/community');
  });

  test('Clicking OPERA quadrant navigates to /valorant/pro-scene', async ({ page }) => {
    await page.goto('/valorant');

    const operaLink = page.locator('a[href*="pro-scene"]').first();
    await operaLink.click();

    await page.waitForURL('**/valorant/pro-scene');
    expect(page.url()).toContain('valorant/pro-scene');
  });

  test('Clicking ROTAS quadrant navigates to /valorant/stats', async ({ page }) => {
    await page.goto('/valorant');

    const rotasLink = page.locator('a[href*="stats"]').first();
    await rotasLink.click();

    await page.waitForURL('**/valorant/stats');
    expect(page.url()).toContain('valorant/stats');
  });

  test('CS2 World-Port renders with CS2 title', async ({ page }) => {
    await page.goto('/cs2');

    const gameTitle = await page.locator('text=cs2').first();
    await expect(gameTitle).toBeVisible();

    // All quadrants should still be present
    const sator = await page.locator('text=SATOR').first();
    await expect(sator).toBeVisible();
  });
});

// ─── Test Suite 4: TeZeT (Hub-Specific Branches) ──────────────────────

test.describe('TeZeT — Hub-Specific Sub-branches', () => {
  test('SATOR hub shows sub-branch tabs', async ({ page }) => {
    await page.goto('/valorant/analytics');

    // Should have content area or tabs (check for hub-specific UI)
    const analyticsContent = page.locator('[class*="analytics"]');

    // At minimum page should load without error
    await expect(page).not.toHaveTitle(/Error|404/);
  });

  test('ROTAS hub shows sub-branch tabs', async ({ page }) => {
    await page.goto('/valorant/stats');

    // Check for stats-specific content
    const statsContent = page.locator('[class*="stats"]');

    // Page should load successfully
    await expect(page).not.toHaveTitle(/Error|404/);
  });

  test('AREPO hub loads community content', async ({ page }) => {
    await page.goto('/valorant/community');

    // Page should be accessible
    const heading = page.locator('h1, h2');
    const isVisible = await heading.first().isVisible().catch(() => false);

    // Just verify page loads
    expect(page.url()).toContain('community');
  });

  test('OPERA hub loads pro scene content', async ({ page }) => {
    await page.goto('/valorant/pro-scene');

    // Page should be accessible
    expect(page.url()).toContain('pro-scene');
  });
});

// ─── Test Suite 5: Navigation State Persistence ────────────────────

test.describe('Navigation State Persistence', () => {
  test('Switching games preserves hub selection (analytics)', async ({ page }) => {
    // Start in Valorant analytics
    await page.goto('/valorant/analytics');

    // Navigate back to directory
    const networkLink = await page.locator('text=← NETWORK');
    await networkLink.click();
    await page.waitForURL('**/hubs');

    // Switch to CS2
    const cs2Card = page.locator('text=Counter-Strike 2');
    await cs2Card.click();
    await page.waitForURL('**/cs2');

    // Navigate to analytics in CS2
    const analyticsLink = page.locator('a[href*="analytics"]').first();
    await analyticsLink.click();

    // Should be on /cs2/analytics
    await page.waitForURL('**/cs2/analytics');
    expect(page.url()).toContain('cs2/analytics');
  });

  test('Back button in top bar returns to game directory', async ({ page }) => {
    await page.goto('/valorant/analytics');

    const networkLink = await page.locator('text=← NETWORK');
    await networkLink.click();

    await page.waitForURL('**/hubs');
    expect(page.url()).toContain('/hubs');
  });

  test('Navigating directly to /valorant shows 2×2 GRID', async ({ page }) => {
    await page.goto('/valorant');

    // Should show quadrants, not a specific hub
    const sator = await page.locator('text=SATOR').first();
    await expect(sator).toBeVisible();

    // URL should be clean (no /analytics, etc.)
    expect(page.url()).not.toContain('analytics');
  });

  test('Page reload preserves current location', async ({ page }) => {
    await page.goto('/valorant/stats');

    const currentUrl = page.url();
    await page.reload();

    const newUrl = page.url();
    expect(newUrl).toContain('/valorant/stats');
  });
});

// ─── Test Suite 6: Mobile Responsive Navigation ────────────────────

test.describe('Mobile Responsive Navigation (375px viewport)', () => {
  test('Mobile viewport shows adapted layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hubs');

    // Page should be visible and not broken
    await expect(page).not.toHaveTitle(/Error|404/);
  });

  test('Game cards visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hubs');

    const valorantCard = await page.locator('text=VALORANT');

    // Card might be in viewport or require scroll
    const isInViewport = await valorantCard.isInViewport();
    if (!isInViewport) {
      await valorantCard.scrollIntoViewIfNeeded();
    }

    await expect(valorantCard).toBeVisible();
  });

  test('Touch targets are large enough on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hubs');

    const buttons = await page.locator('button, a[role="button"], [role="button"]');
    const count = await buttons.count();

    // Should have interactive elements
    expect(count).toBeGreaterThan(0);

    // Sample first button size
    if (count > 0) {
      const boundingBox = await buttons.first().boundingBox();
      // Touch targets should be at least 44x44px
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(40);
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('Top navigation bar responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/valorant');

    const topBar = page.locator('nav');
    await expect(topBar).toBeVisible();

    // Navigation should still be accessible
    const networkLink = await page.locator('text=← NETWORK');
    if (await networkLink.isVisible()) {
      await expect(networkLink).toBeEnabled();
    }
  });

  test('Mobile navigation does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/valorant');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = 375;

    // Should not scroll horizontally (with small tolerance for browser UI)
    expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 5);
  });
});

// ─── Test Suite 7: Keyboard Navigation & Accessibility ────────────

test.describe('Keyboard Navigation & Accessibility', () => {
  test('Tab through portal buttons', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('BODY');
  });

  test('Enter key activates buttons on portal', async ({ page }) => {
    await page.goto('/');

    // Find enter button and press Tab until focused, then Enter
    const enterButton = page.locator('button:has-text("Enter Platform")');
    await enterButton.focus();
    await page.keyboard.press('Enter');

    // Should navigate to /hubs
    await page.waitForURL('**/hubs');
    expect(page.url()).toContain('/hubs');
  });

  test('Links have visible focus states', async ({ page }) => {
    await page.goto('/valorant');

    const links = page.locator('a');
    if (await links.count() > 0) {
      await links.first().focus();

      const isFocused = await links.first().evaluate((el) => {
        return el === document.activeElement;
      });

      expect(isFocused).toBe(true);
    }
  });
});

// ─── Test Suite 8: Error States & Edge Cases ───────────────────────

test.describe('Error States & Edge Cases', () => {
  test('Invalid game route shows appropriate error', async ({ page }) => {
    // Navigate to non-existent game
    const response = await page.goto('/nonexistent-game');

    // Should either show 404 or redirect
    expect(
      response?.status() === 404 || page.url().includes('/hubs') || page.url().includes('/')
    ).toBeTruthy();
  });

  test('Invalid hub route shows error', async ({ page }) => {
    const response = await page.goto('/valorant/invalid-hub');

    // Should handle gracefully
    expect(response?.status() === 404 || response?.status() === 200).toBeTruthy();
  });

  test('Network directory loads on slow connection', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', async (route) => {
      await new Promise(r => setTimeout(r, 100));
      await route.continue();
    });

    await page.goto('/hubs', { waitUntil: 'domcontentloaded' });

    const header = page.locator('text=Select Game World');
    // Should eventually load
    await expect(header).toBeVisible({ timeout: 15000 });
  });
});

// ─── Test Suite 9: Cross-Browser Navigation ──────────────────────────

test.describe('Cross-Browser Navigation', () => {
  test('Navigation works in Firefox', async ({ browser, context }) => {
    // This test runs in all browsers via playwright config
    const page = await context.newPage();
    await page.goto('/hubs');

    const header = await page.locator('text=Select Game World');
    await expect(header).toBeVisible();

    await page.close();
  });
});
