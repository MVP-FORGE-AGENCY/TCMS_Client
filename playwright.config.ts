import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Playwright configuration for TCMS E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in sequence for data consistency */
  fullyParallel: false,
  workers: 1,
  
  /* Fail build on CI if accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* No retries - we want to catch flaky tests */
  retries: 0,
  
  /* Reporter configuration */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  
  /* Test timeout */
  timeout: 30000,
  
  /* Expect timeout */
  expect: {
    timeout: 5000
  },
  
  /* Shared settings for all projects */
  use: {
    /* Base URL for navigation */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    /* Collect trace on failure */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'on-first-retry',
    
    /* Default viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Can add more browsers later:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Run local dev server before starting tests - optional */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
