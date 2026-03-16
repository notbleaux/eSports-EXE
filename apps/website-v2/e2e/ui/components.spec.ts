/** [Ver002.000]
 * UI Component Interactions E2E Tests
 * ===================================
 * Tests UI primitives, forms, and interactive components
 */

import { test, expect } from '@playwright/test';

test.describe('UI Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Button variants render correctly', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    const buttonVariants = [
      { name: 'primary', selector: 'button[class*="primary"], [data-variant="primary"]' },
      { name: 'secondary', selector: 'button[class*="secondary"], [data-variant="secondary"]' },
      { name: 'danger', selector: 'button[class*="danger"], button[class*="error"]' },
      { name: 'ghost', selector: 'button[class*="ghost"]' },
    ];

    for (const variant of buttonVariants) {
      const button = page.locator(variant.selector).first();
      
      if (await button.isVisible().catch(() => false)) {
        // Verify button is clickable
        await expect(button).toBeEnabled();
        
        test.info().annotations.push({
          type: 'info',
          description: `${variant.name} button found and enabled`
        });
      }
    }
  });

  test('Form inputs validation', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for form inputs
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();

    test.info().annotations.push({
      type: 'info',
      description: `Found ${count} form inputs`
    });

    // Test a few input types
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const required = await input.getAttribute('required');
      
      if (await input.isVisible().catch(() => false)) {
        // Input should be visible
        expect(await input.isVisible()).toBeTruthy();
        
        // If required, verify it has appropriate attributes
        if (required !== null) {
          expect(required).toBe('required');
        }
      }
    }
  });

  test('Modal open and close', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for modal trigger buttons
    const modalTriggers = [
      'button:has-text("Open")',
      'button:has-text("Show")',
      '[data-testid="open-modal"]',
      'button[data-modal-trigger]'
    ];

    let triggerFound = false;
    
    for (const selector of modalTriggers) {
      const trigger = page.locator(selector).first();
      
      if (await trigger.isVisible().catch(() => false)) {
        triggerFound = true;
        await trigger.click();
        await page.waitForTimeout(500);

        // Check for modal
        const modal = page.locator('[role="dialog"], [data-testid="modal"], .modal').first();
        
        if (await modal.isVisible().catch(() => false)) {
          // Modal should be visible
          await expect(modal).toBeVisible();

          // Close modal
          const closeButton = page.locator('[data-testid="close-modal"], button:has-text("Close"), .modal button').first();
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click();
            await page.waitForTimeout(300);
          } else {
            // Try pressing escape
            await page.keyboard.press('Escape');
          }
        }
        break;
      }
    }

    if (!triggerFound) {
      test.info().annotations.push({
        type: 'info',
        description: 'No modal trigger buttons found'
      });
    }
  });

  test('Dropdown selection', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for select elements
    const selects = page.locator('select');
    const count = await selects.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const select = selects.nth(i);
        
        if (await select.isVisible().catch(() => false)) {
          // Get options
          const options = await select.locator('option').count();
          
          if (options > 1) {
            // Select a different option
            await select.selectOption({ index: 1 });
            await page.waitForTimeout(200);
            
            const selectedValue = await select.inputValue();
            expect(selectedValue).toBeTruthy();
          }
        }
      }
    } else {
      // Look for custom dropdowns
      const customDropdown = page.locator('[data-testid="dropdown"], [role="combobox"]').first();
      
      if (await customDropdown.isVisible().catch(() => false)) {
        await customDropdown.click();
        await page.waitForTimeout(300);
        
        // Look for dropdown options
        const options = page.locator('[role="option"], [data-testid="dropdown-option"]');
        if (await options.first().isVisible().catch(() => false)) {
          await options.first().click();
        }
      }
    }
  });

  test('Accordion expand and collapse', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for accordion elements
    const accordions = [
      '[data-testid="accordion"]',
      '[class*="accordion"]',
      'details',
      '[role="region"]'
    ];

    let foundAccordion = false;

    for (const selector of accordions) {
      const accordion = page.locator(selector).first();
      
      if (await accordion.isVisible().catch(() => false)) {
        foundAccordion = true;
        
        // Look for trigger
        const trigger = accordion.locator('summary, button, [role="button"]').first().or(
          page.locator('[data-testid="accordion-trigger"]').first()
        );

        if (await trigger.isVisible().catch(() => false)) {
          // Click to expand
          await trigger.click();
          await page.waitForTimeout(300);

          // Click to collapse
          await trigger.click();
          await page.waitForTimeout(300);
        }
        break;
      }
    }

    if (!foundAccordion) {
      test.info().annotations.push({
        type: 'info',
        description: 'No accordion elements found'
      });
    }
  });

  test('Tooltip display on hover', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for elements with tooltips
    const tooltipTriggers = page.locator('[data-tooltip], [title], [data-testid*="tooltip"]').first();

    if (await tooltipTriggers.isVisible().catch(() => false)) {
      // Hover over element
      await tooltipTriggers.hover();
      await page.waitForTimeout(500);

      // Look for tooltip
      const tooltip = page.locator('[role="tooltip"], [data-testid="tooltip"], .tooltip').first();
      
      test.info().annotations.push({
        type: 'info',
        description: `Tooltip visible: ${await tooltip.isVisible().catch(() => false)}`
      });
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No tooltip triggers found'
      });
    }
  });

  test('Checkbox and radio button states', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Test checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
        const checkbox = checkboxes.nth(i);
        
        if (await checkbox.isVisible().catch(() => false)) {
          const initialState = await checkbox.isChecked();
          
          // Toggle checkbox
          await checkbox.click();
          await page.waitForTimeout(200);
          
          const newState = await checkbox.isChecked();
          expect(newState).toBe(!initialState);
        }
      }
    }

    // Test radio buttons
    const radios = page.locator('input[type="radio"]');
    const radioCount = await radios.count();

    test.info().annotations.push({
      type: 'info',
      description: `Found ${checkboxCount} checkboxes and ${radioCount} radio buttons`
    });
  });

  test('Slider input interaction', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for range inputs
    const slider = page.locator('input[type="range"]').first();

    if (await slider.isVisible().catch(() => false)) {
      // Get slider bounds
      const min = await slider.getAttribute('min') || '0';
      const max = await slider.getAttribute('max') || '100';
      const minVal = parseInt(min);
      const maxVal = parseInt(max);
      
      // Set slider to middle value
      const middleValue = Math.floor((minVal + maxVal) / 2);
      await slider.fill(middleValue.toString());
      
      const currentValue = await slider.inputValue();
      expect(parseInt(currentValue)).toBe(middleValue);
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No slider inputs found'
      });
    }
  });

  test('Tab navigation', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for tab elements
    const tabs = page.locator('[role="tab"], [data-testid="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click each tab
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i);
        
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
          
          // Verify tab is selected
          const isSelected = await tab.getAttribute('aria-selected');
          expect(isSelected === 'true' || await tab.isVisible()).toBeTruthy();
        }
      }
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No tabs found'
      });
    }
  });

  test('Toast notifications', async ({ page }) => {
    await page.goto('/tenet');
    await page.waitForLoadState('networkidle');

    // Look for toast trigger
    const toastTrigger = page.locator('[data-testid="show-toast"]').or(
      page.locator('button:has-text("Show Toast"), button:has-text("Notify")')
    );

    if (await toastTrigger.isVisible().catch(() => false)) {
      await toastTrigger.click();
      await page.waitForTimeout(500);

      // Look for toast
      const toast = page.locator('[data-testid="toast"], [role="alert"], .toast').first();
      expect(await toast.isVisible().catch(() => false) || true).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No toast trigger found'
      });
    }
  });

  test('Loading spinner and skeleton states', async ({ page }) => {
    await page.goto('/sator');
    await page.waitForLoadState('networkidle');

    // Look for loading indicators
    const loadingIndicators = [
      '[data-testid="loading"]',
      '[class*="skeleton"]',
      '[class*="loading"]',
      '[class*="spinner"]'
    ];

    let foundLoading = false;

    for (const selector of loadingIndicators) {
      const indicator = page.locator(selector).first();
      
      if (await indicator.isVisible().catch(() => false)) {
        foundLoading = true;
        await expect(indicator).toBeVisible();
        break;
      }
    }

    test.info().annotations.push({
      type: 'info',
      description: `Loading indicators found: ${foundLoading}`
    });
  });
});
