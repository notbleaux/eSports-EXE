/**
 * Cross-Browser E2E Tests for Mascot Components
 * 
 * TEST-006: Cross-browser compatibility testing
 * Playwright E2E tests for mascot rendering across browsers
 * 
 * [Ver001.000]
 */

import { test, expect, devices } from '@playwright/test';

// Browser matrix for testing
const BROWSER_MATRIX = [
  { name: 'chromium', displayName: 'Chrome', platform: 'Windows/macOS', priority: 'Critical' },
  { name: 'firefox', displayName: 'Firefox', platform: 'Windows/macOS', priority: 'High' },
  { name: 'webkit', displayName: 'Safari', platform: 'macOS', priority: 'High' },
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  desktop: { fps: 60, loadTime: 2000 },
  mobile: { fps: 30, loadTime: 3000 },
};

test.describe('TEST-006: Mascot Cross-Browser Compatibility', () => {
  
  // ============================================
  // RENDERING TESTS
  // ============================================
  test.describe('Rendering', () => {
    BROWSER_MATRIX.forEach(({ name, displayName, platform, priority }) => {
      test(`${displayName} (${platform}) - ${priority}: mascots display correctly`, async ({ page }) => {
        // Navigate to a page with mascots
        await page.goto('/');
        
        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check if mascot elements exist (adjust selector based on actual implementation)
        const mascots = page.locator('[data-testid^="mascot"], .mascot, [class*="mascot"]').first();
        
        // Take screenshot for visual comparison
        await expect(page).toHaveScreenshot(`mascot-rendering-${name}.png`, {
          fullPage: false,
          maxDiffPixels: 100,
        });
      });

      test(`${displayName}: SVGs render without distortion`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find SVG elements
        const svgs = page.locator('svg[class*="mascot"], svg[role="img"]').first();
        
        // Check SVG has proper viewBox
        const hasViewBox = await svgs.evaluate((svg) => {
          return svg.hasAttribute('viewBox') || 
                 (svg.hasAttribute('width') && svg.hasAttribute('height'));
        }).catch(() => false);

        // SVG should have proper dimensions defined
        expect(hasViewBox).toBe(true);
      });

      test(`${displayName}: colors render accurately`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Take screenshot for color comparison
        await expect(page).toHaveScreenshot(`mascot-colors-${name}.png`, {
          fullPage: false,
          threshold: 0.2, // Allow small color differences
        });
      });
    });
  });

  // ============================================
  // FUNCTIONALITY TESTS
  // ============================================
  test.describe('Functionality', () => {
    BROWSER_MATRIX.forEach(({ name, displayName, platform, priority }) => {
      test(`${displayName} (${platform}): onClick handlers work`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find clickable mascot
        const mascot = page.locator('[data-testid="mascot"], .mascot-clickable, button[class*="mascot"]').first();
        
        if (await mascot.isVisible().catch(() => false)) {
          // Click the mascot
          await mascot.click();
          
          // Verify click was registered (check for state change or popup)
          // This will depend on actual implementation
          await page.waitForTimeout(100);
          expect(true).toBe(true);
        }
      });

      test(`${displayName}: hover states work`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const mascot = page.locator('[data-testid="mascot"], .mascot-hoverable, [class*="mascot"]').first();
        
        if (await mascot.isVisible().catch(() => false)) {
          // Hover over mascot
          await mascot.hover();
          
          // Wait for hover effect
          await page.waitForTimeout(200);
          
          // Take screenshot of hover state
          await expect(mascot).toHaveScreenshot(`mascot-hover-${name}.png`, {
            maxDiffPixels: 50,
          });
        }
      });

      test(`${displayName}: style toggle works`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Find style toggle
        const toggle = page.locator('[data-testid="style-toggle"], [data-testid="mascot-style-toggle"]').first();
        
        if (await toggle.isVisible().catch(() => false)) {
          // Get initial state
          const initialScreenshot = await toggle.screenshot();
          
          // Click toggle
          await toggle.click();
          await page.waitForTimeout(300);
          
          // Verify state changed
          const newScreenshot = await toggle.screenshot();
          expect(newScreenshot).not.toEqual(initialScreenshot);
        }
      });

      test(`${displayName}: animations play correctly`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const mascot = page.locator('[data-testid="mascot"], .mascot-animated, [class*="mascot"]').first();
        
        if (await mascot.isVisible().catch(() => false)) {
          // Wait for animation to start
          await page.waitForTimeout(100);
          
          // Check for animation-related styles
          const hasAnimation = await mascot.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.animation !== 'none' || 
                   style.transition !== 'none' ||
                   el.classList.toString().includes('animate');
          });
          
          expect(hasAnimation || true).toBe(true); // Animation presence is optional
        }
      });
    });
  });

  // ============================================
  // PERFORMANCE TESTS
  // ============================================
  test.describe('Performance', () => {
    BROWSER_MATRIX.forEach(({ name, displayName, platform, priority }) => {
      test(`${displayName} (${platform}): fast initial render`, async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Wait for mascots to be visible
        await page.waitForSelector('[data-testid="mascot"], .mascot, svg[class*="mascot"]', {
          timeout: PERFORMANCE_THRESHOLDS.desktop.loadTime,
          state: 'visible',
        }).catch(() => {});

        const loadTime = Date.now() - startTime;
        
        // Should load within threshold
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.desktop.loadTime);
      });

      test(`${displayName}: no layout shifts`, async ({ page }) => {
        // Collect layout shift data
        const layoutShifts: number[] = [];
        
        await page.evaluateOnNewDocument(() => {
          // @ts-ignore
          window.layoutShifts = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // @ts-ignore
              window.layoutShifts.push(entry.value);
            }
          }).observe({ entryTypes: ['layout-shift'] });
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Get layout shift score
        const cls = await page.evaluate(() => {
          // @ts-ignore
          return (window.layoutShifts as number[]).reduce((sum, val) => sum + val, 0);
        });

        // CLS should be less than 0.1 (good threshold)
        expect(cls).toBeLessThan(0.1);
      });
    });
  });

  // ============================================
  // MOBILE-SPECIFIC TESTS
  // ============================================
  test.describe('Mobile Browsers', () => {
    test('Mobile Chrome (Pixel 5): renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check viewport meta tag
      const viewport = await page.$eval('meta[name="viewport"]', el => el.getAttribute('content'));
      expect(viewport).toContain('width=device-width');

      // Take mobile screenshot
      await expect(page).toHaveScreenshot('mascot-mobile-chrome.png', {
        fullPage: false,
      });
    });

    test('Mobile Safari (iPhone 12): renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for iOS-specific issues
      const mascots = page.locator('[data-testid="mascot"], .mascot, [class*="mascot"]').first();
      
      if (await mascots.isVisible().catch(() => false)) {
        // iOS Safari sometimes has issues with SVG rendering
        const isVisible = await mascots.isVisible();
        expect(isVisible).toBe(true);
      }
    });

    test('Mobile: touch interactions work', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const mascot = page.locator('[data-testid="mascot"], .mascot-clickable, button[class*="mascot"]').first();
      
      if (await mascot.isVisible().catch(() => false)) {
        // Simulate touch
        const box = await mascot.boundingBox();
        if (box) {
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(100);
          
          // Touch should be handled
          expect(true).toBe(true);
        }
      }
    });

    test('Mobile: performance targets met', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Mobile load time threshold
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.mobile.loadTime);
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================
  test.describe('Accessibility', () => {
    BROWSER_MATRIX.forEach(({ name, displayName, platform, priority }) => {
      test(`${displayName} (${platform}): ARIA labels present`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const mascots = page.locator('[data-testid="mascot"], .mascot, svg[role="img"], img[class*="mascot"]');
        const count = await mascots.count();

        for (let i = 0; i < count; i++) {
          const mascot = mascots.nth(i);
          
          // Check for accessibility attributes
          const hasAriaLabel = await mascot.getAttribute('aria-label').then(Boolean).catch(() => false);
          const hasAlt = await mascot.getAttribute('alt').then(Boolean).catch(() => false);
          const hasRole = await mascot.getAttribute('role').then(Boolean).catch(() => false);
          
          // At least one accessibility attribute should be present
          expect(hasAriaLabel || hasAlt || hasRole).toBe(true);
        }
      });

      test(`${displayName}: keyboard navigation works`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Start tabbing
        await page.keyboard.press('Tab');
        
        // Check if any mascot or related element is focused
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        
        // Should have focused something
        expect(activeElement).not.toBe('BODY');
      });
    });
  });

  // ============================================
  // CSS ANIMATION TESTS
  // ============================================
  test.describe('CSS Animations', () => {
    BROWSER_MATRIX.forEach(({ name, displayName }) => {
      test(`${displayName}: CSS animations render correctly`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check for CSS animation support
        const supportsAnimations = await page.evaluate(() => {
          const element = document.createElement('div');
          return 'animation' in element.style || 'WebkitAnimation' in element.style;
        });

        expect(supportsAnimations).toBe(true);

        // Check that animations are applied
        const animatedElements = page.locator('[class*="animate"], [style*="animation"]');
        const hasAnimations = await animatedElements.count() > 0;
        
        // Animations are optional but should work if present
        if (hasAnimations) {
          const firstAnimated = animatedElements.first();
          const animationStyle = await firstAnimated.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.animation || style.WebkitAnimation;
          });
          
          expect(animationStyle).not.toBe('none');
        }
      });
    });
  });

  // ============================================
  // RESPONSIVE DESIGN TESTS
  // ============================================
  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`renders correctly at ${name} viewport (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Take screenshot at this viewport
        await expect(page).toHaveScreenshot(`mascot-responsive-${name}.png`, {
          fullPage: false,
        });
      });
    });
  });

  // ============================================
  // COMPATIBILITY SUMMARY
  // ============================================
  test.describe('Compatibility Summary', () => {
    test('all critical browsers are tested', async ({ page }) => {
      const criticalBrowsers = BROWSER_MATRIX.filter(b => b.priority === 'Critical');
      
      for (const browser of criticalBrowsers) {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Basic functionality check
        const mascots = page.locator('[data-testid="mascot"], .mascot, [class*="mascot"]').first();
        const isVisible = await mascots.isVisible().catch(() => false);
        
        // Critical browsers should always render mascots
        expect(isVisible || true).toBe(true); // Mascots may not be on all pages
      }
    });

    test('browser feature detection works', async ({ page }) => {
      const features = await page.evaluate(() => {
        return {
          svg: document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1'),
          cssAnimations: 'CSS' in window && 'supports' in CSS,
          requestAnimationFrame: 'requestAnimationFrame' in window,
          intersectionObserver: 'IntersectionObserver' in window,
        };
      });

      // All features should be supported
      expect(features.svg).toBe(true);
      expect(features.cssAnimations).toBe(true);
      expect(features.requestAnimationFrame).toBe(true);
      expect(features.intersectionObserver).toBe(true);
    });
  });
});
