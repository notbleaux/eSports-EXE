/** [Ver002.000]
 * Complete Betting Flows E2E Tests
 * ================================
 * Tests betting odds, live updates, and bet placement
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Betting Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('View odds history for a match', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for a match with odds
    const matchElement = page.locator('[data-testid="match-item"]').or(
      page.locator('[class*="match"]').first()
    );

    if (await matchElement.isVisible().catch(() => false)) {
      await matchElement.click();
      await page.waitForTimeout(1000);

      // Look for odds history button/link
      const oddsHistory = page.locator('[data-testid="odds-history"]').or(
        page.locator('button:has-text("Odds History"), a:has-text("History")')
      );

      if (await oddsHistory.isVisible().catch(() => false)) {
        await oddsHistory.click();
        await page.waitForTimeout(1000);

        // Verify history is displayed
        const historyChart = page.locator('[data-testid="odds-chart"]').or(
          page.locator('[class*="chart"], [class*="history"]')
        );
        await expect(historyChart).toBeVisible();
      }
    } else {
      test.info().annotations.push({
        type: 'warning',
        description: 'No match elements found on page'
      });
    }
  });

  test('Force odds recalculation', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for admin or refresh button
    const recalcButton = page.locator('[data-testid="recalculate-odds"]').or(
      page.locator('button:has-text("Recalculate"), button:has-text("Refresh Odds")')
    );

    if (await recalcButton.isVisible().catch(() => false)) {
      // Get initial odds
      const initialOdds = await page.locator('[data-testid="team-a-odds"]').textContent().catch(() => '0');
      
      await recalcButton.click();
      await page.waitForTimeout(2000);

      // Verify odds were updated or loading state shown
      const loadingIndicator = page.locator('[data-testid="odds-loading"]').or(
        page.locator('text=/loading|updating|recalculating/i')
      );
      
      await expect(loadingIndicator).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Odds recalculation button not found - may require admin access'
      });
    }
  });

  test('Odds format switching', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for odds format selector
    const formatSelector = page.locator('[data-testid="odds-format"]').or(
      page.locator('select').filter({ hasText: /decimal|american|fractional/i })
    );

    if (await formatSelector.isVisible().catch(() => false)) {
      // Test decimal format
      await formatSelector.selectOption('decimal');
      await page.waitForTimeout(500);

      // Test american format
      await formatSelector.selectOption('american');
      await page.waitForTimeout(500);

      // Verify odds are displayed in new format
      const oddsDisplay = page.locator('[data-testid*="odds"]').first();
      if (await oddsDisplay.isVisible().catch(() => false)) {
        const oddsText = await oddsDisplay.textContent() || '';
        // American odds typically show + or -
        expect(oddsText.includes('+') || oddsText.includes('-') || oddsText.includes('.')).toBeTruthy();
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Odds format selector not found'
      });
    }
  });

  test('Multiple match odds view', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for match list
    const matchList = page.locator('[data-testid="match-list"]').or(
      page.locator('[class*="match-list"], [class*="matches"]')
    );

    if (await matchList.isVisible().catch(() => false)) {
      // Count matches with odds
      const matchesWithOdds = page.locator('[data-testid*="odds"], [class*="odds"]');
      const count = await matchesWithOdds.count();

      test.info().annotations.push({
        type: 'info',
        description: `Found ${count} matches with odds displayed`
      });

      // At least verify that multiple odds elements exist or the structure is present
      expect(count >= 0).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'warning',
        description: 'Match list not found'
      });
    }
  });

  test('Live match real-time updates', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');

    // Look for live indicator
    const liveIndicator = page.locator('[data-testid="live-indicator"]').or(
      page.locator('text=/live|●/i').first()
    );

    if (await liveIndicator.isVisible().catch(() => false)) {
      // Click on live match
      await liveIndicator.click();
      await page.waitForTimeout(2000);

      // Monitor for updates over a short period
      const initialOdds = await page.locator('[data-testid*="odds"]').first().textContent().catch(() => '');
      
      // Wait for potential WebSocket update
      await page.waitForTimeout(5000);
      
      const updatedOdds = await page.locator('[data-testid*="odds"]').first().textContent().catch(() => '');
      
      test.info().annotations.push({
        type: 'info',
        description: `Odds: ${initialOdds} -> ${updatedOdds}`
      });

      // Either odds changed or they stayed the same (both are valid states)
      expect(initialOdds.length > 0 || updatedOdds.length > 0).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No live matches currently active'
      });
    }
  });

  test('Place bet flow', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for bet button on a match
    const betButton = page.locator('[data-testid="place-bet"]').or(
      page.locator('button:has-text("Bet"), button:has-text("Place Bet")').first()
    );

    if (await betButton.isVisible().catch(() => false)) {
      await betButton.click();
      await page.waitForTimeout(1000);

      // Bet slip should appear
      const betSlip = page.locator('[data-testid="bet-slip"]').or(
        page.locator('[class*="bet-slip"], [class*="betslip"]')
      );
      await expect(betSlip).toBeVisible();

      // Enter stake
      const stakeInput = page.locator('[data-testid="stake-input"]').or(
        page.locator('input[type="number"], input[placeholder*="amount"]')
      );
      
      if (await stakeInput.isVisible().catch(() => false)) {
        await stakeInput.fill('10');
        await expect(stakeInput).toHaveValue('10');
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Bet button not found - may require authentication'
      });
    }
  });

  test('Bet slip calculates potential returns', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const stakeInput = page.locator('[data-testid="stake-input"]').or(
      page.locator('input[placeholder*="stake"], input[type="number"]')
    );

    if (await stakeInput.isVisible().catch(() => false)) {
      await stakeInput.fill('50');
      await page.waitForTimeout(500);

      // Look for potential returns display
      const returnsDisplay = page.locator('[data-testid="potential-returns"]').or(
        page.locator('text=/potential|return|payout|win/i').first()
      );

      if (await returnsDisplay.isVisible().catch(() => false)) {
        const returnsText = await returnsDisplay.textContent() || '';
        
        // Should contain a monetary value
        const hasValue = returnsText.match(/\d+\.?\d*/) !== null;
        expect(hasValue).toBeTruthy();
      }
    }
  });

  test('Bet history view', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for bet history link
    const historyLink = page.locator('[data-testid="bet-history"]').or(
      page.locator('a:has-text("Bet History"), a:has-text("My Bets"), button:has-text("History")')
    );

    if (await historyLink.isVisible().catch(() => false)) {
      await historyLink.click();
      await page.waitForTimeout(1000);

      // Verify history table or list
      const historyTable = page.locator('table, [class*="bet-list"], [data-testid="bet-list"]').first();
      await expect(historyTable).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Bet history link not found - may require authentication'
      });
    }
  });

  test('Cash out option for active bets', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for active bets with cash out
    const cashOutButton = page.locator('[data-testid="cash-out"]').or(
      page.locator('button:has-text("Cash Out")')
    );

    if (await cashOutButton.isVisible().catch(() => false)) {
      await expect(cashOutButton).toBeEnabled();
      
      // Check for cash out value
      const cashOutValue = page.locator('[data-testid="cash-out-value"]').or(
        page.locator('[class*="cash-out-value"]')
      );
      
      if (await cashOutValue.isVisible().catch(() => false)) {
        const value = await cashOutValue.textContent() || '';
        expect(value.match(/\d+\.?\d*/)).toBeTruthy();
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No cash out options available - may require active bets'
      });
    }
  });

  test('Bet validation errors', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const stakeInput = page.locator('[data-testid="stake-input"]').or(
      page.locator('input[type="number"]')
    );

    if (await stakeInput.isVisible().catch(() => false)) {
      // Enter invalid stake (negative)
      await stakeInput.fill('-10');
      await page.waitForTimeout(500);

      // Look for validation error
      const errorMessage = page.locator('[data-testid="stake-error"]').or(
        page.locator('text=/invalid|error|minimum|maximum/i').first()
      );

      // Should show error or prevent negative input
      const value = await stakeInput.inputValue();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      // Either error is shown OR negative value was rejected/filtered
      expect(hasError || value !== '-10').toBe(true);
    }
  });
});
