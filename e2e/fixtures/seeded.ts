import type { Page } from '@playwright/test';
import { extensionTest, type WorkerFixtures } from './extension';
import { clearStorage, seedOnboardingCompleted } from '../helpers/storage';

type SeededFixtures = {
  page: Page;
};

/**
 * Provides a page that's pre-loaded with the extension, storage cleared, and
 * onboarding skipped. The browser window (chromeContext) is shared across tests
 * in the same worker — only the page is recreated per test.
 */
export const test = extensionTest.extend<SeededFixtures, WorkerFixtures>({
  page: async ({ chromeContext, newTabUrl }, use) => {
    const page = await chromeContext.newPage();

    await page.goto(newTabUrl);
    await clearStorage(page);
    await seedOnboardingCompleted(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]', { timeout: 10_000 });

    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
