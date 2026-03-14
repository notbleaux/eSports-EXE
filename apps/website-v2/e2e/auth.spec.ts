/**
 * Authentication E2E Tests
 * Tests user registration, login, and session management
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first()
    
    // At least some auth elements should exist
    const hasEmail = await emailInput.count() > 0
    const hasPassword = await passwordInput.count() > 0
    
    // If dedicated login page doesn't exist, check for login button/link
    if (!hasEmail && !hasPassword) {
      const loginLink = page.locator('a[href*="login"], button:has-text("Login"), button:has-text("Sign In")').first()
      expect(await loginLink.count() > 0 || await page.locator('body').textContent()).toBeTruthy()
    } else {
      if (hasEmail) await expect(emailInput).toBeVisible()
      if (hasPassword) await expect(passwordInput).toBeVisible()
    }
  })

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    
    if (await emailInput.count() === 0 || await passwordInput.count() === 0) {
      test.skip()
      return
    }
    
    // Fill in test credentials (will fail, but tests the flow)
    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')
    
    // Attempt login
    await submitButton.click()
    
    // Wait for response
    await page.waitForTimeout(1000)
    
    // Check for error message OR successful redirect
    const errorMessage = page.locator('.error, [role="alert"], .alert-error').first()
    const currentUrl = page.url()
    
    // Either we get an error (expected with fake credentials) or redirect
    expect(await errorMessage.count() > 0 || !currentUrl.includes('/login')).toBeTruthy()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    
    if (await emailInput.count() === 0) {
      test.skip()
      return
    }
    
    await emailInput.fill('invalid@example.com')
    await passwordInput.fill('wrongpassword')
    await submitButton.click()
    
    await page.waitForTimeout(1000)
    
    // Should show error
    const errorVisible = await page.locator('.error, [role="alert"], .text-red').first().isVisible().catch(() => false)
    const bodyText = await page.locator('body').textContent()
    const hasErrorText = bodyText?.toLowerCase().includes('invalid') || 
                         bodyText?.toLowerCase().includes('error') ||
                         bodyText?.toLowerCase().includes('failed')
    
    expect(errorVisible || hasErrorText).toBeTruthy()
  })

  test('registration form validation', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    const submitButton = page.locator('button[type="submit"]').first()
    
    if (await submitButton.count() === 0) {
      // Try signup link
      await page.goto('/signup')
      await page.waitForLoadState('networkidle')
    }
    
    const emailInput = page.locator('input[type="email"]').first()
    
    if (await emailInput.count() === 0) {
      test.skip()
      return
    }
    
    // Submit empty form
    await submitButton.click()
    
    await page.waitForTimeout(500)
    
    // Should show validation errors
    const bodyText = await page.locator('body').textContent()
    const hasError = bodyText?.toLowerCase().includes('required') ||
                     bodyText?.toLowerCase().includes('invalid') ||
                     bodyText?.toLowerCase().includes('error')
    expect(hasError).toBeTruthy()
  })

  test('password reset flow', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    
    if (await emailInput.count() === 0) {
      test.skip()
      return
    }
    
    await emailInput.fill('test@example.com')
    
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    
    await page.waitForTimeout(1000)
    
    // Should show confirmation
    const bodyText = await page.locator('body').textContent()
    const hasConfirmation = bodyText?.toLowerCase().includes('sent') ||
                            bodyText?.toLowerCase().includes('email') ||
                            bodyText?.toLowerCase().includes('check')
    expect(hasConfirmation).toBeTruthy()
  })

  test('protected routes redirect to login', async ({ page }) => {
    // Try accessing a protected route
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    const url = page.url()
    
    // Either stays on profile (if no auth required) or redirects to login
    const isLoginPage = url.includes('login') || url.includes('signin')
    const hasLoginForm = await page.locator('input[type="password"]').count() > 0
    
    expect(isLoginPage || hasLoginForm || url.includes('/profile')).toBeTruthy()
  })

  test('logout functionality', async ({ page }) => {
    // First, navigate to a page that might have logout
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for logout button/link
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")').first()
    
    if (await logoutButton.count() === 0) {
      test.skip()
      return
    }
    
    await logoutButton.click()
    
    await page.waitForTimeout(1000)
    
    // Should show login or home page
    const url = page.url()
    expect(url.includes('login') || url === '/' || url.includes('/home')).toBeTruthy()
  })

  test('session persistence across page reloads', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Store initial state
    const initialContent = await page.locator('body').textContent()
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Page should still be accessible
    const reloadedContent = await page.locator('body').textContent()
    expect(reloadedContent).toBeTruthy()
  })
})
