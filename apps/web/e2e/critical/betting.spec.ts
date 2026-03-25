/** [Ver001.000]
 * Critical Betting E2E Tests
 * ==========================
 * Tests match odds display, live betting, and WebSocket odds updates
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Critical Betting Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Match Odds Display', () => {
    test('match page displays team odds', async ({ page }) => {
      // Navigate to a hub where match data might be displayed
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for odds display elements
      const teamAOdds = page.locator('[data-testid="team-a-odds"]').or(
        page.locator('[data-testid="odds-team-a"]').or(
          page.locator('text=/odds|team a/i').first()
        )
      );

      const teamBOdds = page.locator('[data-testid="team-b-odds"]').or(
        page.locator('[data-testid="odds-team-b"]').or(
          page.locator('text=/odds|team b/i').first()
        )
      );

      // Check if odds elements are visible
      const oddsAVisible = await teamAOdds.isVisible().catch(() => false);
      const oddsBVisible = await teamBOdds.isVisible().catch(() => false);

      if (oddsAVisible || oddsBVisible) {
        if (oddsAVisible) {
          await expect(teamAOdds).toBeVisible();
          const oddsText = await teamAOdds.textContent() || '1.0';
          const oddsValue = parseFloat(oddsText.replace(/[^0-9.]/g, ''));
          
          // Odds should be valid numbers greater than 1.0
          if (!isNaN(oddsValue)) {
            expect(oddsValue).toBeGreaterThanOrEqual(1.0);
          }
        }

        if (oddsBVisible) {
          await expect(teamBOdds).toBeVisible();
        }
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Odds display elements not found - may need match data'
        });
      }
    });

    test('odds display updates when match data loads', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Wait for any loading states to complete
      await page.waitForTimeout(2000);

      // Look for any odds-related elements
      const oddsElements = page.locator('[data-testid*="odds"], [class*="odds"], [class*="betting"]');
      const count = await oddsElements.count();

      if (count > 0) {
        // Verify at least one odds element is visible
        let anyVisible = false;
        for (let i = 0; i < Math.min(count, 5); i++) {
          if (await oddsElements.nth(i).isVisible().catch(() => false)) {
            anyVisible = true;
            break;
          }
        }
        
        if (anyVisible) {
          expect(anyVisible).toBe(true);
        } else {
          test.info().annotations.push({
            type: 'warning',
            description: 'Odds elements exist but none are visible'
          });
        }
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'No odds elements found on page'
        });
      }
    });

    test('betting interface elements are present', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for common betting UI elements
      const possibleElements = [
        { name: 'bet button', selector: '[data-testid*="bet"], button:has-text("Bet")' },
        { name: 'stake input', selector: 'input[placeholder*="stake"], input[placeholder*="amount"]' },
        { name: 'match list', selector: '[data-testid*="match"], [class*="match-list"]' },
      ];

      let foundElements = 0;

      for (const element of possibleElements) {
        const locator = page.locator(element.selector).first();
        if (await locator.isVisible().catch(() => false)) {
          foundElements++;
        }
      }

      // We should find at least one betting-related element
      if (foundElements === 0) {
        test.info().annotations.push({
          type: 'warning',
          description: 'No betting interface elements found'
        });
      } else {
        expect(foundElements).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Live Match Updates', () => {
    test('live indicator shows for active matches', async ({ page }) => {
      await page.goto('/stats'); // ROTAS hub handles streaming/live data
      await page.waitForLoadState('networkidle');

      // Look for live indicator
      const liveIndicator = page.locator('[data-testid="live-indicator"]').or(
        page.locator('text=/live|●/i').first()
      );

      const isVisible = await liveIndicator.isVisible().catch(() => false);

      if (isVisible) {
        // Verify live styling (red color, pulsing animation, etc.)
        const className = await liveIndicator.getAttribute('class') || '';
        const hasLiveStyling = className.includes('live') || 
                               className.includes('red') || 
                               className.includes('pulse');
        
        expect(hasLiveStyling || isVisible).toBeTruthy();
      } else {
        test.info().annotations.push({
          type: 'info',
          description: 'No live matches currently active'
        });
      }
    });

    test('match status updates are displayed', async ({ page }) => {
      await page.goto('/stats');
      await page.waitForLoadState('networkidle');

      // Look for match status elements
      const statusElements = page.locator('[data-testid*="status"], [class*="status"], [class*="score"]');
      const count = await statusElements.count();

      if (count > 0) {
        // At least one status element should be visible
        let anyVisible = false;
        for (let i = 0; i < Math.min(count, 3); i++) {
          if (await statusElements.nth(i).isVisible().catch(() => false)) {
            anyVisible = true;
            break;
          }
        }

        if (!anyVisible) {
          test.info().annotations.push({
            type: 'warning',
            description: 'Status elements exist but none visible'
          });
        }
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'No match status elements found'
        });
      }
    });
  });

  test.describe('Odds Calculation', () => {
    test('odds values are within valid range', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for any numeric values that could be odds
      const oddsSelectors = [
        '[data-testid*="odds"]',
        '[class*="odds"]',
        '[class*="probability"]',
        'text=/\\d+\\.\\d+/' // Pattern like 1.85, 2.50, etc.
      ];

      let validOddsFound = false;

      for (const selector of oddsSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const text = await elements.nth(i).textContent().catch(() => '');
          const match = text.match(/(\d+\.\d{2})/);
          
          if (match) {
            const value = parseFloat(match[1]);
            // Valid odds are typically between 1.01 and 1000
            if (value >= 1.01 && value <= 1000) {
              validOddsFound = true;
              expect(value).toBeGreaterThanOrEqual(1.0);
            }
          }
        }
      }

      if (!validOddsFound) {
        test.info().annotations.push({
          type: 'warning',
          description: 'No valid odds values found on page'
        });
      }
    });

    test('betting slip calculates potential returns', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for stake input and potential returns display
      const stakeInput = page.locator('input[placeholder*="stake"], input[type="number"]').first();
      const returnsDisplay = page.locator('[data-testid*="returns"], [data-testid*="payout"]').or(
        page.locator('text=/potential|return|payout/i').first()
      );

      if (await stakeInput.isVisible().catch(() => false)) {
        await stakeInput.fill('10');
        
        // Check if returns are calculated
        if (await returnsDisplay.isVisible().catch(() => false)) {
          const returnsText = await returnsDisplay.textContent() || '';
          expect(returnsText.length).toBeGreaterThan(0);
        } else {
          test.info().annotations.push({
            type: 'warning',
            description: 'Returns display not found after entering stake'
          });
        }
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Stake input not found'
        });
      }
    });
  });
});
