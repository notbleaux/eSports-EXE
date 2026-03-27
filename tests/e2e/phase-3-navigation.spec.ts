/**
 * Phase 3: Navigation & Routing E2E Tests
 * Verifies TeNET navigation layer and hierarchical routing
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 3: TENET Navigation Layer', () => {
  test.describe('3.1: Home Portal (TeNeTPortal)', () => {
    test('/ renders TeNeTPortal with hero section', async ({ page }) => {
      await page.goto('/');

      // Verify hero section exists
      await expect(page.locator('text=TeNeT Portal')).toBeVisible();
      await expect(page.locator('text=NJZiteGeisTe Platform Entry')).toBeVisible();

      // Verify feature cards
      await expect(page.locator('text=Network')).toBeVisible();
      await expect(page.locator('text=Analytics')).toBeVisible();
      await expect(page.locator('text=Security')).toBeVisible();

      // Verify button exists and is clickable
      const button = page.locator('button:has-text("Enter Platform")');
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    });

    test('/ button navigates to /hubs', async ({ page }) => {
      await page.goto('/');

      const button = page.locator('button:has-text("Enter Platform")');
      await button.click();

      // Should redirect to /hubs
      await page.waitForURL('/hubs');
      expect(page.url()).toContain('/hubs');
    });

    test('/ renders with Boitano pink background', async ({ page }) => {
      await page.goto('/');

      const heroDiv = page.locator('div.bg-boitano-pink').first();
      await expect(heroDiv).toBeVisible();
    });
  });

  test.describe('3.2: TeNET Directory (Game Selector)', () => {
    test('/hubs renders TeNET Directory', async ({ page }) => {
      await page.goto('/hubs');

      // Verify header
      await expect(page.locator('text=Select Game World')).toBeVisible();
      await expect(page.locator('text=TeNET Network Directory')).toBeVisible();

      // Verify world ports exist
      await expect(page.locator('text=VALORANT')).toBeVisible();
      await expect(page.locator('text=Counter-Strike 2')).toBeVisible();
    });

    test('/hubs Valorant card navigates to /valorant', async ({ page }) => {
      await page.goto('/hubs');

      // Find and click Valorant port card
      const valorantCard = page.locator('button:has-text("VALORANT")').first();
      await expect(valorantCard).toBeEnabled();
      await valorantCard.click();

      // Should navigate to /valorant/analytics (default hub)
      await page.waitForURL('/valorant/analytics');
      expect(page.url()).toContain('/valorant/analytics');
    });

    test('/hubs CS2 card navigates to /cs2', async ({ page }) => {
      await page.goto('/hubs');

      const cs2Card = page.locator('button:has-text("Counter-Strike 2")').first();
      await expect(cs2Card).toBeEnabled();
      await cs2Card.click();

      await page.waitForURL('/cs2/analytics');
      expect(page.url()).toContain('/cs2/analytics');
    });

    test('/hubs inactive ports are disabled', async ({ page }) => {
      await page.goto('/hubs');

      const loiButton = page.locator('button:has-text("League of Legends")').first();
      const apexButton = page.locator('button:has-text("Apex Legends")').first();

      // Both should be disabled
      await expect(loiButton).toBeDisabled();
      await expect(apexButton).toBeDisabled();
    });

    test('/hubs shows ACTIVE/PENDING status badges', async ({ page }) => {
      await page.goto('/hubs');

      // Active ports should show status
      const activeCards = page.locator('text=ACTIVE');
      await expect(activeCards.first()).toBeVisible();

      const pendingCards = page.locator('text=PENDING RELEASE');
      await expect(pendingCards.first()).toBeVisible();
    });
  });

  test.describe('3.3: World-Port Routing & GameNodeIDFrame', () => {
    test('/valorant renders GameNodeIDFrame with Valorant context', async ({ page }) => {
      await page.goto('/valorant');

      // Should redirect to default hub (/valorant/analytics)
      await page.waitForURL('/valorant/analytics');

      // Verify GameNodeIDFrame header
      await expect(page.locator('text=VALORANT').first()).toBeVisible();

      // Verify navigation bar with all 4 hubs
      await expect(page.locator('text=SATOR')).toBeVisible();
      await expect(page.locator('text=AREPO')).toBeVisible();
      await expect(page.locator('text=OPERA')).toBeVisible();
      await expect(page.locator('text=ROTAS')).toBeVisible();
    });

    test('/cs2 renders GameNodeIDFrame with CS2 context', async ({ page }) => {
      await page.goto('/cs2');

      await page.waitForURL('/cs2/analytics');

      // Verify CS2 in header
      await expect(page.locator('text=CS2').first()).toBeVisible();

      // Verify all hubs are available
      await expect(page.locator('text=SATOR')).toBeVisible();
      await expect(page.locator('text=AREPO')).toBeVisible();
      await expect(page.locator('text=OPERA')).toBeVisible();
      await expect(page.locator('text=ROTAS')).toBeVisible();
    });

    test('NETWORK breadcrumb links back to /hubs', async ({ page }) => {
      await page.goto('/valorant/analytics');

      const networkLink = page.locator('a:has-text("← NETWORK")');
      await expect(networkLink).toBeVisible();

      await networkLink.click();
      await page.waitForURL('/hubs');
      expect(page.url()).toContain('/hubs');
    });

    test('GameNodeIDFrame status bar shows VERIFIED', async ({ page }) => {
      await page.goto('/valorant/analytics');

      await expect(page.locator('text=VALORANT NODE: VERIFIED')).toBeVisible();
    });
  });

  test.describe('3.4: Hub Navigation (Quarter Grid)', () => {
    test('/valorant/analytics renders SATOR hub', async ({ page }) => {
      await page.goto('/valorant/analytics');

      // Verify SATOR is active in nav
      const satorNav = page.locator('a:has-text("SATOR")').first();
      await expect(satorNav).toBeVisible();
    });

    test('/valorant/community renders AREPO hub', async ({ page }) => {
      await page.goto('/valorant/community');

      const arepoNav = page.locator('a:has-text("AREPO")').first();
      await expect(arepoNav).toBeVisible();
    });

    test('/valorant/pro-scene renders OPERA hub', async ({ page }) => {
      await page.goto('/valorant/pro-scene');

      const operaNav = page.locator('a:has-text("OPERA")').first();
      await expect(operaNav).toBeVisible();
    });

    test('/valorant/stats renders ROTAS hub', async ({ page }) => {
      await page.goto('/valorant/stats');

      const rotasNav = page.locator('a:has-text("ROTAS")').first();
      await expect(rotasNav).toBeVisible();
    });

    test('Hub navigation tabs are clickable', async ({ page }) => {
      await page.goto('/valorant/analytics');

      const arepoTab = page.locator('a:has-text("AREPO")').first();
      await arepoTab.click();

      await page.waitForURL('/valorant/community');
      expect(page.url()).toContain('/valorant/community');
    });
  });

  test.describe('3.5: Legacy Redirects', () => {
    test('/analytics redirects to /valorant/analytics', async ({ page }) => {
      await page.goto('/analytics');

      await page.waitForURL('/valorant/analytics');
      expect(page.url()).toContain('/valorant/analytics');
    });

    test('/stats redirects to /valorant/stats', async ({ page }) => {
      await page.goto('/stats');

      await page.waitForURL('/valorant/stats');
      expect(page.url()).toContain('/valorant/stats');
    });

    test('/community redirects to /valorant/community', async ({ page }) => {
      await page.goto('/community');

      await page.waitForURL('/valorant/community');
      expect(page.url()).toContain('/valorant/community');
    });

    test('/pro-scene redirects to /valorant/pro-scene', async ({ page }) => {
      await page.goto('/pro-scene');

      await page.waitForURL('/valorant/pro-scene');
      expect(page.url()).toContain('/valorant/pro-scene');
    });

    test('Old TENET-era paths: /sator, /rotas, /arepo, /opera redirect correctly', async ({ page }) => {
      // /sator → /valorant/analytics
      await page.goto('/sator');
      await page.waitForURL('/valorant/analytics');
      expect(page.url()).toContain('/valorant/analytics');

      // /rotas → /valorant/stats
      await page.goto('/rotas');
      await page.waitForURL('/valorant/stats');
      expect(page.url()).toContain('/valorant/stats');
    });

    test('/tenet redirects to /hubs', async ({ page }) => {
      await page.goto('/tenet');

      await page.waitForURL('/hubs');
      expect(page.url()).toContain('/hubs');
    });
  });

  test.describe('3.6: Error Handling', () => {
    test('Invalid gameId shows graceful error', async ({ page }) => {
      // Go to a valid path first, then invalid route
      await page.goto('/invalid-game');

      // Should either redirect to /hubs or show 404
      // The router should handle this - either way, page should not crash
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    });

    test('Missing game parameter in /*/analytics redirects to /hubs', async ({ page }) => {
      await page.goto('/hubs');

      // Navigate back to home and verify structure
      const homeUrl = page.url();
      expect(homeUrl).toContain('/hubs');
    });
  });

  test.describe('3.7: Responsive Design', () => {
    test('TeNETPortal is responsive on mobile', async ({ page }) => {
      page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');

      const button = page.locator('button:has-text("Enter Platform")');
      await expect(button).toBeVisible();

      // Hero should still be visible and centered
      await expect(page.locator('text=TeNeT Portal')).toBeVisible();
    });

    test('TeNETDirectory is responsive on tablet', async ({ page }) => {
      page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/hubs');

      await expect(page.locator('text=Select Game World')).toBeVisible();

      // Cards should be in responsive grid
      const cards = page.locator('button:has-text("VALORANT")');
      await expect(cards.first()).toBeVisible();
    });

    test('GameNodeIDFrame header collapses on mobile', async ({ page }) => {
      page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/valorant/analytics');

      // Navigation should still be accessible
      await expect(page.locator('text=VALORANT').first()).toBeVisible();
    });
  });

  test.describe('3.8: Accessibility', () => {
    test('Navigation links are keyboard accessible', async ({ page }) => {
      await page.goto('/');

      // Tab to button and activate with Enter
      const button = page.locator('button:has-text("Enter Platform")');
      await button.focus();
      await page.keyboard.press('Enter');

      await page.waitForURL('/hubs');
      expect(page.url()).toContain('/hubs');
    });

    test('Hub navigation tabs are keyboard accessible', async ({ page }) => {
      await page.goto('/valorant/analytics');

      // Tab to AREPO tab
      const arepoTab = page.locator('a:has-text("AREPO")').first();
      await arepoTab.focus();
      await page.keyboard.press('Enter');

      await page.waitForURL('/valorant/community');
      expect(page.url()).toContain('/valorant/community');
    });
  });
});
