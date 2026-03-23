/**
 * Playwright Configuration for Visual Regression Testing
 * 
 * [Ver001.000]
 * 
 * Separate config for visual tests to allow independent execution
 * from standard E2E tests.
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './src/components/mascots/__tests__',
  
  /* Only run visual regression test files */
  testMatch: /visual-regression\.test\.tsx/,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'playwright-report/visual' }],
    ['list'],
    ['json', { outputFile: 'test-results/visual-regression-results.json' }],
  ],
  
  /* Shared settings */
  use: {
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying */
    trace: 'on-first-retry',
    
    /* Always take screenshots for visual tests */
    screenshot: 'on',
    
    /* Video recording for debugging */
    video: 'retain-on-failure',
    
    /* Visual comparison options */
    viewport: { width: 1920, height: 1080 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Snapshot configuration for visual regression */
  snapshotPathTemplate: 'tests/visual/baselines/{arg}{ext}',
  expect: {
    /* Maximum time expect() should wait */
    timeout: 5000,
    
    /* Visual comparison options */
    toHaveScreenshot: {
      /* An acceptable ratio of pixels that are different */
      maxDiffPixelRatio: 0.001,
      
      /* An acceptable amount of pixels that could be different */
      maxDiffPixels: 50,
      
      /* Threshold for pixel comparison */
      threshold: 0.1,
      
      /* Scale for screenshot comparison */
      scale: 'device',
      
      /* Animations */
      animations: 'disabled',
    },
    toMatchSnapshot: {
      /* Maximum pixel ratio difference */
      maxDiffPixelRatio: 0.001,
      
      /* Threshold for comparison */
      threshold: 0.1,
    },
  },

  /* Configure projects for different browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Ensure consistent rendering */
        launchOptions: {
          args: [
            '--force-color-profile=srgb',
            '--font-render-hinting=none',
            '--disable-skia-runtime-opts',
            '--disable-lcd-text',
          ],
        },
      },
    },
    {
      name: 'chromium-dark',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Local dev server */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
