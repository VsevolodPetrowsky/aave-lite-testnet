import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E tests with MetaMask via Synpress
 *
 * To run E2E tests:
 * 1. Build wallet cache: npm run test:e2e:cache
 * 2. Run tests: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // MetaMask tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for wallet tests
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 300000, // 5 minutes per test (Sepolia blockchain is slow)

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
