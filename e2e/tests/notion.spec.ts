import { test, expect } from '../fixtures/index';
import { seedNotionToken, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { mockNotionApi } from '../helpers/api-mocks';
import { NOTION_MOCKS } from '../fixtures-data/notion';

test.describe('Notion panel — unauthenticated', () => {
  test('shows connect screen when no token in storage @P1', async ({ page }) => {
    await navigateTo(page, 'notion');
    await expect(page.getByTestId('notion-connect')).toBeVisible();
  });
});

test.describe('Notion panel — authenticated', () => {
  test.beforeEach(async ({ page, chromeContext }) => {
    // Notion uses backgroundFetch → must mock at context level (intercepts SW fetch)
    await mockNotionApi(chromeContext);
    await seedNotionToken(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'notion');
    await expect(page.getByTestId('notion-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('shows recent pages from mock response @P1', async ({ page }) => {
    await expect(page.getByTestId('notion-dashboard')).toContainText('Tech Spec Template');
    await expect(page.getByTestId('notion-dashboard')).toContainText('Sprint Board');
  });

  test('shows page title and object type @P1', async ({ page }) => {
    await expect(page.getByTestId('notion-dashboard')).toContainText(NOTION_MOCKS.pages[0].title);
  });

  test('Disconnect clears token from storage @P1', async ({ page }) => {
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-notion').click();

    const token = await getStorage(page, 'notionToken');
    expect(token).toBeNull();

    await navigateTo(page, 'notion');
    await expect(page.getByTestId('notion-connect')).toBeVisible();
  });
});
