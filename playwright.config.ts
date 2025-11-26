import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * 
 * This configuration sets up Playwright for E2E testing of the Private Tutoring Dashboard Platform.
 * 
 * Key Features:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Failure artifact capture (screenshots, videos, traces)
 * - Parallel test execution
 * - CI/CD optimized settings
 */
export default defineConfig({
  // Test directory - all E2E tests live here
  testDir: './tests/e2e',
  
  // Run tests in parallel for faster execution
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only (2 retries) to catch flaky tests
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI (use 1 worker) to avoid resource contention
  workers: process.env.CI ? 1 : undefined,
  
  // Test timeout: 60 seconds per test
  timeout: 60 * 1000,
  
  // Expect timeout: 15 seconds for assertions
  expect: {
    timeout: 15 * 1000,
  },
  
  // Reporter configuration
  // - HTML: Interactive test report
  // - JUnit: CI/CD integration
  // - List: Console output
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for all tests (override with BASE_URL env var)
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace: Capture on failure for debugging
    trace: 'retain-on-failure',
    
    // Screenshots: Only capture on failure to save storage
    screenshot: 'only-on-failure',
    
    // Videos: Retain on failure, delete on success
    video: 'retain-on-failure',
    
    // Action timeout: 15 seconds for individual actions (click, fill, etc.)
    actionTimeout: 15 * 1000,
    
    // Navigation timeout: 30 seconds for page loads
    navigationTimeout: 30 * 1000,
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
  
  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

