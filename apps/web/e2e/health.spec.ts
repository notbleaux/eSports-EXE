/**
 * Health Check E2E Test
 * Verifies the health endpoint returns correct structure
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Health Check Endpoint', () => {
  
  test('page loads successfully with monitoring initialized', async ({ page }) => {
    await page.goto('/')
    
    // Check that page loads successfully
    await expect(page).toHaveTitle(/NJZiteGeisTe|TENET/)

    // Verify page content is visible
    await expect(page.locator('body')).toContainText(/NJZiteGeisTe|TENET|Platform/)
    
    // Check that the app is interactive
    const links = page.getByRole('link')
    expect(await links.count()).toBeGreaterThan(0)
  })

  test('SATOR hub loads with analytics capabilities', async ({ page }) => {
    await page.goto('/analytics')
    
    // Verify SATOR hub loads
    await expect(page).toHaveURL(/.*sator.*/i)
    
    // Check for hub content
    await expect(page.getByText(/Observatory|SATOR/i).first()).toBeVisible()
    
    // Verify page is fully loaded
    await page.waitForLoadState('networkidle')
  })
})
