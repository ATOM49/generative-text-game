import { defineConfig, devices } from '@playwright/test';

const worldbuilderUrl = 'http://localhost:3100';
const watcherUrl = 'http://localhost:4100';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/playwright',
  timeout: 10 * 60 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: worldbuilderUrl,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'watcher',
      command:
        'pnpm build:schema && pnpm build:ai && pnpm build:cdn && pnpm build:watcher && pnpm --filter @talespin/watcher exec fastify start -l info -p 4100 dist/app.js',
      url: watcherUrl,
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      name: 'worldbuilder',
      command: 'pnpm --filter @talespin/worldbuilder dev --port 3100',
      url: worldbuilderUrl,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        E2E_TEST_MODE: 'true',
        NEXTAUTH_URL: worldbuilderUrl,
        AUTH_URL: worldbuilderUrl,
        WATCHER_API_URL: watcherUrl,
        WATCHER_GENERATION_TIMEOUT_MS: '300000',
      },
    },
  ],
});
