import { extensionTest as test, expect } from '../fixtures/index';
import { seedSnippets } from '../helpers/storage';
import { SNIPPET_FIXTURES } from '../fixtures-data/snippets';

/**
 * Content script tests — Cmd+K palette overlay on regular web pages.
 *
 * The content script only injects into http:// and https:// pages (per manifest).
 * We use page.route() to serve a fake HTTPS page so the content script fires.
 */

const TEST_URL = 'https://waypoint-e2e-test.internal/';

async function navigateToTestPage(chromeContext: import('@playwright/test').BrowserContext) {
  const page = await chromeContext.newPage();
  await page.route(TEST_URL, (route) =>
    route.fulfill({
      body: '<html><body><h1>E2E Test Page</h1></body></html>',
      contentType: 'text/html',
    })
  );
  await page.goto(TEST_URL);
  return page;
}

test.describe('Content script — snippet palette overlay', () => {
  test('Cmd/Ctrl+K on a regular page opens the Waypoint snippet palette @P0', async ({
    chromeContext,
    extensionId,
    newTabUrl,
  }) => {
    const extPage = await chromeContext.newPage();
    await extPage.goto(newTabUrl);
    await seedSnippets(extPage, SNIPPET_FIXTURES);
    await extPage.close();

    const page = await navigateToTestPage(chromeContext);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const iframe = page.locator(`iframe[src*="${extensionId}/palette.html"]`);
    await expect(iframe).toBeAttached({ timeout: 5_000 });
    await expect(iframe).toHaveCSS('opacity', '1');

    await page.close();
  });

  test('typing in palette search filters snippets @P0', async ({
    chromeContext,
    extensionId,
    newTabUrl,
  }) => {
    const extPage = await chromeContext.newPage();
    await extPage.goto(newTabUrl);
    await seedSnippets(extPage, SNIPPET_FIXTURES);
    await extPage.close();

    const page = await navigateToTestPage(chromeContext);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const iframe = page.locator(`iframe[src*="${extensionId}/palette.html"]`);
    await expect(iframe).toBeAttached({ timeout: 5_000 });

    const paletteFrame = page.frameLocator(`iframe[src*="${extensionId}/palette.html"]`);
    await paletteFrame.locator('#palette-search').fill('docker');

    await expect(paletteFrame.locator(`[data-snippet-id="snip-1"]`)).toBeVisible();

    await page.close();
  });

  test('Escape closes the palette iframe @P0', async ({
    chromeContext,
    extensionId,
    newTabUrl,
  }) => {
    const extPage = await chromeContext.newPage();
    await extPage.goto(newTabUrl);
    await seedSnippets(extPage, SNIPPET_FIXTURES);
    await extPage.close();

    const page = await navigateToTestPage(chromeContext);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const iframe = page.locator(`iframe[src*="${extensionId}/palette.html"]`);
    await expect(iframe).toBeAttached({ timeout: 5_000 });
    await expect(iframe).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(iframe).toHaveCSS('opacity', '0');

    await page.close();
  });

  test('second Cmd/Ctrl+K toggles palette closed @P0', async ({
    chromeContext,
    extensionId,
    newTabUrl,
  }) => {
    const extPage = await chromeContext.newPage();
    await extPage.goto(newTabUrl);
    await seedSnippets(extPage, SNIPPET_FIXTURES);
    await extPage.close();

    const page = await navigateToTestPage(chromeContext);

    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+k`);
    const iframe = page.locator(`iframe[src*="${extensionId}/palette.html"]`);
    await expect(iframe).toBeAttached({ timeout: 5_000 });
    await expect(iframe).toHaveCSS('opacity', '1');

    await page.keyboard.press(`${modifier}+k`);
    await expect(iframe).toHaveCSS('opacity', '0');

    await page.close();
  });

  test('WAYPOINT_PALETTE_CLOSE postMessage closes the palette @P0', async ({
    chromeContext,
    extensionId,
    newTabUrl,
  }) => {
    const extPage = await chromeContext.newPage();
    await extPage.goto(newTabUrl);
    await seedSnippets(extPage, SNIPPET_FIXTURES);
    await extPage.close();

    const page = await navigateToTestPage(chromeContext);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const iframe = page.locator(`iframe[src*="${extensionId}/palette.html"]`);
    await expect(iframe).toBeAttached({ timeout: 5_000 });
    await expect(iframe).toHaveCSS('opacity', '1');

    await page.evaluate(() => {
      window.postMessage({ type: 'WAYPOINT_PALETTE_CLOSE' }, '*');
    });

    await expect(iframe).toHaveCSS('opacity', '0');
    await page.close();
  });
});
