import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for AppFabrik Base
 * 
 * Run tests:
 *   npx playwright test              - Run all tests
 *   npx playwright test --ui         - Run tests with UI
 *   npx playwright test --headed     - Run tests with browser visible
 *   npx playwright test e2e/auth     - Run only auth tests
 *   npx playwright test tests/a11y   - Run accessibility tests
 */
export default defineConfig({
  testDir: process.env.TEST_A11Y ? './tests/a11y' : './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

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
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Run local dev server before starting tests if not in CI
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Global timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
});
