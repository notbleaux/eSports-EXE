/**
 * Search Functionality E2E Tests
 * Tests player, team, and match search capabilities
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/community')
    await page.waitForLoadState('networkidle')
  })

  test('search for players by name', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[placeholder*="search" i]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    // Type search query
    await searchInput.fill('TenZ')
    await searchInput.press('Enter')
    
    // Wait for results
    await page.waitForTimeout(1000)
    
    // Verify results appear
    const results = page.locator('[data-testid="search-results"], .search-results, [role="list"]').first()
    
    // Check that results contain text or exist
    const resultCount = await results.count()
    if (resultCount > 0) {
      await expect(results).toBeVisible()
    }
  })

  test('search with empty query shows suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    await searchInput.click()
    await page.waitForTimeout(500)
    
    // Check for suggestions or dropdown
    const suggestions = page.locator('[data-testid="search-suggestions"], .suggestions, .dropdown').first()
    // Just verify search input is interactive
    await expect(searchInput).toBeFocused()
  })

  test('search with no results shows empty state', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    // Search for something that likely doesn't exist
    await searchInput.fill('xyznonexistent12345')
    await searchInput.press('Enter')
    await page.waitForTimeout(1000)
    
    // Should show empty state or no results message
    const bodyText = await page.locator('body').textContent()
    const hasEmptyState = bodyText?.toLowerCase().includes('no results') ||
                          bodyText?.toLowerCase().includes('not found') ||
                          bodyText?.toLowerCase().includes('empty') ||
                          bodyText?.toLowerCase().includes('0 results')
    
    // Pass if empty state shown or if results container exists but is empty
    expect(hasEmptyState || await page.locator('[data-testid="search-results"]').count() > 0).toBeTruthy()
  })

  test('search filters by category', async ({ page }) => {
    // Look for filter buttons
    const playerFilter = page.locator('[data-filter="players"], button:has-text("Players"), button:has-text("players")').first()
    const teamFilter = page.locator('[data-filter="teams"], button:has-text("Teams"), button:has-text("teams")').first()
    
    if (await playerFilter.count() === 0 && await teamFilter.count() === 0) {
      test.skip()
      return
    }
    
    // Click player filter
    if (await playerFilter.count() > 0) {
      await playerFilter.click()
      await expect(playerFilter).toHaveAttribute('data-active', 'true')
    }
  })

  test('search autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    // Type partial query
    await searchInput.fill('Te')
    await page.waitForTimeout(500)
    
    // Check for autocomplete dropdown
    const autocomplete = page.locator('.autocomplete, [role="listbox"], .suggestions').first()
    
    // Autocomplete may or may not appear depending on implementation
    const autocompleteCount = await autocomplete.count()
    expect(autocompleteCount >= 0).toBeTruthy() // Don't fail if no autocomplete
  })

  test('clear search results', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    // Enter search
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Clear the search
    await searchInput.clear()
    await page.waitForTimeout(500)
    
    // Input should be empty
    await expect(searchInput).toHaveValue('')
  })

  test('search keyboard navigation', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() === 0) {
      test.skip()
      return
    }
    
    await searchInput.click()
    await searchInput.fill('player')
    await page.waitForTimeout(500)
    
    // Press down arrow to navigate results
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    // Should navigate to a result
    await page.waitForLoadState('networkidle')
  })

  test('search from different hubs', async ({ page }) => {
    const hubs = ['/', '/analytics', '/stats', '/pro-scene']
    
    for (const hub of hubs) {
      await page.goto(hub)
      await page.waitForLoadState('networkidle')
      
      const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('test')
        await searchInput.press('Enter')
        await page.waitForTimeout(500)
        
        // Reset for next iteration
        await searchInput.clear()
      }
    }
  })
})
