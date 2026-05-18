import { test as base, chromium, type BrowserContext } from '@playwright/test';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { EXTENSION_PATH } from '../playwright.config';

// Worker-scoped fixtures: one browser instance shared across all tests in a worker.
// This means one Chrome window stays open for the whole test file — no per-test flicker.
export type WorkerFixtures = {
  chromeContext: BrowserContext;
  extensionId: string;
  newTabUrl: string;
};

export const extensionTest = base.extend<Record<string, never>, WorkerFixtures>({
  chromeContext: [
    async ({}, use) => {
      const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'waypoint-test-'));
      const ctx = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
          ...(process.env.CI ? ['--headless=new'] : []),
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
        ],
      });
      await use(ctx);
      await ctx.close();
      await fs.rm(userDataDir, { recursive: true, force: true });
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ chromeContext }, use) => {
      let [bg] = chromeContext.serviceWorkers();
      if (!bg) bg = await chromeContext.waitForEvent('serviceworker');
      await use(bg.url().split('/')[2]);
    },
    { scope: 'worker' },
  ],

  newTabUrl: [
    async ({ extensionId }, use) => {
      await use(`chrome-extension://${extensionId}/index.html`);
    },
    { scope: 'worker' },
  ],
});

export { extensionTest as test };
export { expect } from '@playwright/test';
