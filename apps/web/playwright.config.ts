import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import {
  E2E_API_URL,
  E2E_DATABASE_URL,
  E2E_NEXT_DIST_DIR,
  E2E_WEB_PORT,
  E2E_WEB_URL,
} from './e2e/env';

const repoRoot = path.join(__dirname, '../..');

function childEnv(overrides: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  return { ...env, ...overrides };
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: E2E_WEB_URL,
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:dev -w @compy/api',
      url: E2E_API_URL,
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: childEnv({
        PORT: '3100',
        DATABASE_URL: E2E_DATABASE_URL,
        WEB_ORIGIN: E2E_WEB_URL,
      }),
    },
    {
      command: `npx next dev -p ${E2E_WEB_PORT}`,
      url: E2E_WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: childEnv({
        API_URL: E2E_API_URL,
        NEXT_DIST_DIR: E2E_NEXT_DIST_DIR,
      }),
    },
  ],
});
