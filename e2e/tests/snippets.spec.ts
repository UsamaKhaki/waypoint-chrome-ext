import { test, expect } from '../fixtures/index';
import { seedSnippets, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { SNIPPET_FIXTURES } from '../fixtures-data/snippets';

test.describe('Snippets panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'snippets');
  });

  test('shows 5 default snippets on first load (no storage) @P0', async ({ page }) => {
    // The store populates default snippets when storage is empty
    const cards = page.locator('[data-testid^="snippet-card-"]');
    await expect(cards).toHaveCount(5);
  });

  test('renders seeded snippets @P0', async ({ page }) => {
    await seedSnippets(page, SNIPPET_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'snippets');

    await expect(page.getByTestId('snippet-card-snip-1')).toBeVisible();
    await expect(page.getByTestId('snippet-card-snip-2')).toBeVisible();
    await expect(page.getByTestId('snippet-card-snip-3')).toBeVisible();
  });

  test('"Add Snippet" button opens form modal @P0', async ({ page }) => {
    await page.getByTestId('add-snippet-btn').click();
    await expect(page.getByTestId('snippet-form')).toBeVisible();
  });

  test('adding snippet saves to storage and appears in list @P0', async ({ page }) => {
    await page.getByTestId('add-snippet-btn').click();

    await page.getByTestId('snippet-form').locator('[data-testid="snippet-form-title"]').fill('My New Snippet');
    await page.getByTestId('snippet-form').locator('[data-testid="snippet-form-content"]').fill('echo "hello world"');
    await page.getByTestId('snippet-form').locator('[data-testid="snippet-form-save"]').click();

    await expect(page.getByTestId('snippet-form')).not.toBeVisible();
    await expect(page.locator('[data-testid^="snippet-card-"]').filter({ hasText: 'My New Snippet' })).toBeVisible();

    // Verify storage
    const stored = await getStorage<unknown[]>(page, 'snippets');
    expect(stored?.some((s: unknown) => (s as { title: string }).title === 'My New Snippet')).toBe(true);
  });

  test('category filter shows only matching snippets @P0', async ({ page }) => {
    await seedSnippets(page, SNIPPET_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'snippets');

    // Click Terminal category
    await page.getByTestId('snippet-filter-terminal').click();
    await expect(page.getByTestId('snippet-card-snip-1')).toBeVisible(); // terminal
    await expect(page.getByTestId('snippet-card-snip-2')).not.toBeVisible(); // git
    await expect(page.getByTestId('snippet-card-snip-3')).not.toBeVisible(); // api
  });

  test('search filters by title and content @P0', async ({ page }) => {
    await seedSnippets(page, SNIPPET_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'snippets');

    await page.getByTestId('snippet-search').fill('docker');
    await expect(page.getByTestId('snippet-card-snip-1')).toBeVisible();
    await expect(page.getByTestId('snippet-card-snip-2')).not.toBeVisible();
  });

  test('pinned snippet appears at top of list @P0', async ({ page }) => {
    await seedSnippets(page, SNIPPET_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'snippets');

    // snip-1 is pinned, should be first
    const firstCard = page.locator('[data-testid^="snippet-card-"]').first();
    await expect(firstCard).toHaveAttribute('data-testid', 'snippet-card-snip-1');
  });

  test('copy button copies content to clipboard @P0', async ({ page }) => {
    await seedSnippets(page, SNIPPET_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'snippets');

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.getByTestId('snippet-copy-snip-1').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('docker compose up -d --build');
  });
});
