import { defineConfig, devices } from '@playwright/test';

// Runs against the built site (`bun run build`) served the way Cloudflare serves it.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:8787',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bunx wrangler dev --port 8787',
    url: 'http://localhost:8787/en',
    reuseExistingServer: !process.env.CI,
  },
});
