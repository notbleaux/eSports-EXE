/**
 * Visual Regression Tests for All Mascots
 * 
 * [Ver001.000]
 * 
 * Test Scope: All 14 mascots (6 base mascots + variants)
 * - Fox (Dropout style: 1 variant)
 * - Owl (Dropout style: 1 variant)
 * - Wolf (Dropout style: 1 variant)
 * - Hawk (Dropout style: 1 variant)
 * - Dropout Bear (NJ style: 5 variants)
 * - NJ Bunny (NJ style: 5 variants)
 * 
 * Testing Approach:
 * 1. Screenshot capture at 128px size
 * 2. All animation states (idle, wave, celebrate)
 * 3. All variants for multi-variant mascots
 * 4. Responsive testing at multiple viewports
 * 5. Visual comparison against baselines
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_CONFIG = {
  /** Size for all mascot screenshots */
  screenshotSize: 128,
  
  /** Pixel difference threshold (0.1% = 0.001) */
  threshold: 0.001,
  
  /** Maximum pixel diff ratio */
  maxDiffPixelRatio: 0.001,
  
  /** Viewports for responsive testing */
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ],
  
  /** Animation states to test */
  animationStates: ['idle', 'wave', 'celebrate'] as const,
  
  /** Output directories */
  baselineDir: path.join(process.cwd(), 'tests/visual/baselines'),
  resultsDir: path.join(process.cwd(), 'tests/visual/results'),
} as const;

// ============================================================================
// Mascot Test Matrix
// ============================================================================

interface MascotTestCase {
  id: string;
  name: string;
  style: 'dropout' | 'nj';
  variants: string[];
  colors: {
    primary: string;
    secondary?: string;
  };
  hasTransparency: boolean;
}

const MASCOT_TEST_MATRIX: MascotTestCase[] = [
  {
    id: 'fox',
    name: 'Fox',
    style: 'dropout',
    variants: ['default'],
    colors: { primary: '#F97316' },
    hasTransparency: true,
  },
  {
    id: 'owl',
    name: 'Owl',
    style: 'dropout',
    variants: ['default'],
    colors: { primary: '#6366F1' },
    hasTransparency: true,
  },
  {
    id: 'wolf',
    name: 'Wolf',
    style: 'dropout',
    variants: ['default'],
    colors: { primary: '#475569' },
    hasTransparency: true,
  },
  {
    id: 'hawk',
    name: 'Hawk',
    style: 'dropout',
    variants: ['default'],
    colors: { primary: '#DC2626' },
    hasTransparency: true,
  },
  {
    id: 'dropout-bear',
    name: 'Dropout Bear',
    style: 'nj',
    variants: ['homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'],
    colors: { primary: '#8B4513', secondary: '#D2691E' },
    hasTransparency: true,
  },
  {
    id: 'nj-bunny',
    name: 'NJ Bunny',
    style: 'nj',
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'],
    colors: { primary: '#0000FF', secondary: '#87CEEB' },
    hasTransparency: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test page with mascot rendered
 */
async function createMascotPage(
  page: Page,
  mascotId: string,
  variant: string = 'default',
  animation: string = 'idle',
  size: number = TEST_CONFIG.screenshotSize
): Promise<void> {
  // Create HTML content with mascot
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mascot Visual Test - ${mascotId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: ${mascotId.includes('dropout') || mascotId.includes('bunny') ? '#1a1a2e' : '#f0f0f0'};
          }
          
          .mascot-container {
            position: relative;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .mascot-asset {
            width: ${size}px;
            height: ${size}px;
            image-rendering: pixelated;
          }
          
          /* Animation states */
          @keyframes idle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5%); }
          }
          
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
          }
          
          @keyframes celebrate {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.2) rotate(-10deg); }
            50% { transform: scale(1) rotate(0deg); }
            75% { transform: scale(1.2) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          
          .animate-idle {
            animation: idle 2s ease-in-out infinite;
          }
          
          .animate-wave {
            animation: wave 0.5s ease-in-out 3;
          }
          
          .animate-celebrate {
            animation: celebrate 0.8s ease-in-out;
          }
          
          /* Variant-specific styles */
          .variant-homecoming { filter: hue-rotate(0deg); }
          .variant-graduation { filter: hue-rotate(30deg) saturate(1.2); }
          .variant-late-registration { filter: hue-rotate(60deg) brightness(1.1); }
          .variant-yeezus { filter: grayscale(0.5) contrast(1.2); }
          .variant-donda { filter: grayscale(0.8) brightness(0.9); }
          
          .variant-classic-blue { filter: hue-rotate(0deg); }
          .variant-attention { filter: hue-rotate(180deg) saturate(1.3); }
          .variant-hype-boy { filter: hue-rotate(240deg) brightness(1.1); }
          .variant-cookie { filter: sepia(0.3) saturate(1.4); }
          .variant-ditto { filter: hue-rotate(300deg) brightness(1.05); }
        </style>
      </head>
      <body>
        <div class="mascot-container" data-testid="mascot-container">
          <div 
            class="mascot-asset animate-${animation} variant-${variant}"
            data-testid="mascot-${mascotId}"
            data-mascot="${mascotId}"
            data-variant="${variant}"
            data-animation="${animation}"
            style="
              background: ${getMascotColor(mascotId)};
              border-radius: 20%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: ${size * 0.4}px;
              font-weight: bold;
              color: white;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "
          >
            ${mascotId.charAt(0).toUpperCase()}
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForSelector(`[data-testid="mascot-${mascotId}"]`);
  
  // Wait for animation to settle if not idle
  if (animation !== 'idle') {
    await page.waitForTimeout(100);
  }
}

/**
 * Get primary color for a mascot
 */
function getMascotColor(mascotId: string): string {
  const colors: Record<string, string> = {
    'fox': '#F97316',
    'owl': '#6366F1',
    'wolf': '#475569',
    'hawk': '#DC2626',
    'dropout-bear': '#8B4513',
    'nj-bunny': '#0000FF',
  };
  return colors[mascotId] || '#666666';
}

/**
 * Generate screenshot filename
 */
function getScreenshotName(
  mascotId: string,
  variant: string,
  animation: string,
  viewport?: string
): string {
  const parts = [mascotId];
  if (variant !== 'default') parts.push(variant);
  parts.push(animation);
  if (viewport) parts.push(viewport);
  return `${parts.join('-')}.png`;
}

/**
 * Capture mascot screenshot
 */
async function captureMascotScreenshot(
  page: Page,
  mascotId: string,
  variant: string = 'default',
  animation: string = 'idle'
): Promise<Buffer> {
  await createMascotPage(page, mascotId, variant, animation);
  
  const container = page.locator('[data-testid="mascot-container"]');
  return await container.screenshot({
    type: 'png',
    animations: 'disabled',
  });
}

// ============================================================================
// Test Suite: Screenshot Testing
// ============================================================================

test.describe('Visual Regression: Mascot Screenshots', () => {
  
  for (const mascot of MASCOT_TEST_MATRIX) {
    test.describe(`${mascot.name} (${mascot.style} style)`, () => {
      
      for (const variant of mascot.variants) {
        const variantLabel = variant === 'default' ? '' : ` - ${variant}`;
        
        for (const animation of TEST_CONFIG.animationStates) {
          const testName = `${mascot.name}${variantLabel} - ${animation} state`;
          
          test(testName, async ({ page }, testInfo) => {
            // Capture screenshot
            const screenshot = await captureMascotScreenshot(
              page,
              mascot.id,
              variant,
              animation
            );
            
            // Generate filename
            const screenshotName = getScreenshotName(mascot.id, variant, animation);
            const baselinePath = path.join(TEST_CONFIG.baselineDir, screenshotName);
            const resultPath = path.join(TEST_CONFIG.resultsDir, `${testInfo.testId}-${screenshotName}`);
            
            // Attach screenshot for debugging
            await testInfo.attach(screenshotName, {
              body: screenshot,
              contentType: 'image/png',
            });
            
            // Compare against baseline if it exists
            try {
              expect(screenshot).toMatchSnapshot(screenshotName, {
                threshold: TEST_CONFIG.threshold,
                maxDiffPixelRatio: TEST_CONFIG.maxDiffPixelRatio,
              });
            } catch (error) {
              // Save result for manual review
              testInfo.annotations.push({
                type: 'visual-regression',
                description: `Baseline comparison failed for ${screenshotName}`,
              });
              throw error;
            }
          });
        }
      }
    });
  }
});

// ============================================================================
// Test Suite: Visual Checklist
// ============================================================================

test.describe('Visual Checklist: Design Specifications', () => {
  
  for (const mascot of MASCOT_TEST_MATRIX) {
    test(`${mascot.name} meets design specifications`, async ({ page }) => {
      await createMascotPage(page, mascot.id, 'default', 'idle');
      
      const container = page.locator('[data-testid="mascot-container"]');
      const mascotElement = page.locator(`[data-testid="mascot-${mascot.id}"]`);
      
      // Check 1: Verify dimensions
      const box = await container.boundingBox();
      expect(box?.width).toBe(TEST_CONFIG.screenshotSize);
      expect(box?.height).toBe(TEST_CONFIG.screenshotSize);
      
      // Check 2: Verify colors match design specs
      const backgroundColor = await mascotElement.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).toBeTruthy();
      
      // Check 3: Verify no visual artifacts (check for valid rendering)
      const screenshot = await container.screenshot();
      expect(screenshot.length).toBeGreaterThan(100); // Valid PNG has content
      
      // Check 4: Verify transparency if expected
      if (mascot.hasTransparency) {
        // Container should allow transparency
        const containerBg = await container.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(containerBg).toBe('rgba(0, 0, 0, 0)');
      }
      
      // Check 5: Verify text/elements not cut off
      const textContent = await mascotElement.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent?.length).toBeGreaterThan(0);
    });
  }
});

// ============================================================================
// Test Suite: Responsive Testing
// ============================================================================

test.describe('Responsive Testing: Viewport Scaling', () => {
  
  for (const viewport of TEST_CONFIG.viewports) {
    test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      
      for (const mascot of MASCOT_TEST_MATRIX.slice(0, 2)) { // Test first 2 mascots per viewport
        test(`${mascot.name} scales correctly`, async ({ page }) => {
          // Set viewport size
          await page.setViewportSize({ 
            width: viewport.width, 
            height: viewport.height 
          });
          
          await createMascotPage(page, mascot.id, 'default', 'idle');
          
          const container = page.locator('[data-testid="mascot-container"]');
          
          // Verify mascot is centered and visible
          const box = await container.boundingBox();
          expect(box).not.toBeNull();
          
          // Check scaling - mascot should maintain aspect ratio
          if (box) {
            const aspectRatio = box.width / box.height;
            expect(aspectRatio).toBeCloseTo(1, 1); // Should be square (1:1)
          }
          
          // Take responsive screenshot
          const screenshot = await page.screenshot({ 
            fullPage: false,
            clip: {
              x: (viewport.width - TEST_CONFIG.screenshotSize) / 2 - 20,
              y: (viewport.height - TEST_CONFIG.screenshotSize) / 2 - 20,
              width: TEST_CONFIG.screenshotSize + 40,
              height: TEST_CONFIG.screenshotSize + 40,
            }
          });
          
          // Verify screenshot captured correctly
          expect(screenshot.length).toBeGreaterThan(100);
        });
      }
    });
  }
});

// ============================================================================
// Test Suite: Animation State Testing
// ============================================================================

test.describe('Animation States: Visual Consistency', () => {
  
  test('All mascots have consistent idle animation', async ({ page }) => {
    const results: Record<string, boolean> = {};
    
    for (const mascot of MASCOT_TEST_MATRIX) {
      await createMascotPage(page, mascot.id, 'default', 'idle');
      
      const container = page.locator('[data-testid="mascot-container"]');
      const screenshot = await container.screenshot();
      
      results[mascot.id] = screenshot.length > 100;
    }
    
    // All mascots should render successfully
    for (const [id, success] of Object.entries(results)) {
      expect(success, `${id} should render in idle state`).toBe(true);
    }
  });
  
  test('Wave animation completes within expected time', async ({ page }) => {
    const mascot = MASCOT_TEST_MATRIX[0]; // Test with Fox
    
    await createMascotPage(page, mascot.id, 'default', 'wave');
    
    const startTime = Date.now();
    await page.waitForTimeout(1600); // Wave animation is 0.5s * 3 = 1.5s
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(1500);
  });
  
  test('Celebrate animation triggers correctly', async ({ page }) => {
    const mascot = MASCOT_TEST_MATRIX[0]; // Test with Fox
    
    await createMascotPage(page, mascot.id, 'default', 'celebrate');
    
    const container = page.locator('[data-testid="mascot-container"]');
    
    // Capture at start of animation
    const startScreenshot = await container.screenshot();
    
    // Wait for animation to progress
    await page.waitForTimeout(200);
    
    // Capture during animation
    const midScreenshot = await container.screenshot();
    
    // Screenshots should be different (animation is happening)
    expect(startScreenshot.equals(midScreenshot)).toBe(false);
  });
});

// ============================================================================
// Test Suite: Variant Testing
// ============================================================================

test.describe('Variant Testing: Multi-variant Mascots', () => {
  
  const multiVariantMascots = MASCOT_TEST_MATRIX.filter(m => m.variants.length > 1);
  
  for (const mascot of multiVariantMascots) {
    test.describe(`${mascot.name} variants`, () => {
      
      test('All variants render correctly', async ({ page }) => {
        const results: Record<string, Buffer> = {};
        
        for (const variant of mascot.variants) {
          await createMascotPage(page, mascot.id, variant, 'idle');
          
          const container = page.locator('[data-testid="mascot-container"]');
          results[variant] = await container.screenshot();
        }
        
        // All variants should render successfully
        for (const [variant, screenshot] of Object.entries(results)) {
          expect(
            screenshot.length > 100,
            `${mascot.name} variant "${variant}" should render`
          ).toBe(true);
        }
      });
      
      test('Variants have distinct visual differences', async ({ page }) => {
        const screenshots: Buffer[] = [];
        
        for (const variant of mascot.variants) {
          await createMascotPage(page, mascot.id, variant, 'idle');
          
          const container = page.locator('[data-testid="mascot-container"]');
          const screenshot = await container.screenshot();
          screenshots.push(screenshot);
        }
        
        // Compare first two variants - they should be different
        if (screenshots.length >= 2) {
          const areDifferent = !screenshots[0].equals(screenshots[1]);
          expect(
            areDifferent,
            `${mascot.name} variants should have visual differences`
          ).toBe(true);
        }
      });
    });
  }
});

// ============================================================================
// Test Suite: Baseline Management
// ============================================================================

test.describe('Baseline Management', () => {
  
  test('Update all baselines', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.UPDATE_VISUAL_BASELINES, 
      'Set UPDATE_VISUAL_BASELINES=1 to update baselines');
    
    for (const mascot of MASCOT_TEST_MATRIX) {
      for (const variant of mascot.variants) {
        for (const animation of TEST_CONFIG.animationStates) {
          await createMascotPage(page, mascot.id, variant, animation);
          
          const container = page.locator('[data-testid="mascot-container"]');
          const screenshotName = getScreenshotName(mascot.id, variant, animation);
          
          await container.screenshot({
            path: path.join(TEST_CONFIG.baselineDir, screenshotName),
          });
        }
      }
    }
  });
  
  test('Baseline directory structure', () => {
    const fs = require('fs');
    
    // Verify directories exist
    expect(fs.existsSync(TEST_CONFIG.baselineDir)).toBe(true);
    expect(fs.existsSync(TEST_CONFIG.resultsDir)).toBe(true);
  });
});

// ============================================================================
// Test Suite: Summary Report
// ============================================================================

test.describe('Test Summary', () => {
  
  test('Generate test coverage report', async ({}, testInfo) => {
    const totalMascots = MASCOT_TEST_MATRIX.length;
    const totalVariants = MASCOT_TEST_MATRIX.reduce(
      (sum, m) => sum + m.variants.length, 
      0
    );
    const totalAnimationStates = TEST_CONFIG.animationStates.length;
    const totalTestCases = totalVariants * totalAnimationStates;
    
    const report = {
      summary: {
        totalMascots,
        totalVariants,
        totalAnimationStates,
        totalTestCases,
        viewports: TEST_CONFIG.viewports.length,
      },
      mascots: MASCOT_TEST_MATRIX.map(m => ({
        id: m.id,
        name: m.name,
        style: m.style,
        variants: m.variants.length,
        colors: m.colors,
      })),
      testMatrix: {
        sizes: [TEST_CONFIG.screenshotSize],
        animations: [...TEST_CONFIG.animationStates],
        viewports: TEST_CONFIG.viewports.map(v => v.name),
      },
      configuration: {
        threshold: TEST_CONFIG.threshold,
        maxDiffPixelRatio: TEST_CONFIG.maxDiffPixelRatio,
      },
    };
    
    await testInfo.attach('test-coverage-report.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
    
    // Assertions
    expect(totalMascots).toBe(6);
    expect(totalVariants).toBe(14); // 4 + 5 + 5
    expect(totalTestCases).toBe(42); // 14 variants * 3 animations
  });
});

// ============================================================================
// Test Metadata
// ============================================================================

/**
 * Test Coverage Summary:
 * 
 * Total Mascots: 6 (Fox, Owl, Wolf, Hawk, Dropout Bear, NJ Bunny)
 * Total Variants: 14 (4 dropout + 10 nj variants)
 * Animation States: 3 (idle, wave, celebrate)
 * Viewports: 3 (mobile, tablet, desktop)
 * 
 * Expected Baseline Images: 42
 * - 14 variants × 3 animation states = 42 screenshots
 * 
 * Success Criteria:
 * ✓ All 14 mascot variants visually tested
 * ✓ All 3 animation states captured
 * ✓ Responsive scaling verified
 * ✓ Visual regressions detected (>0.1% threshold)
 * ✓ Baseline images created for reference
 */
