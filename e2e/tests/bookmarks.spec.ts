import { test, expect } from '../fixtures/index';
import { seedBookmarks, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { BOOKMARK_FIXTURES } from '../fixtures-data/bookmarks';
import type { Bookmark } from '../../src/types/index';

test.describe('Bookmarks panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'bookmarks');
  });

  test('renders empty state when no bookmarks in storage @P0', async ({ page }) => {
    await expect(page.getByTestId('bookmarks-panel')).toBeVisible();
    // No bookmark cards should be present
    await expect(page.locator('[data-testid^="bookmark-card-"]')).toHaveCount(0);
  });

  test('renders bookmarks from seeded storage @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'bookmarks');

    // bm-1 is pinned so it renders twice (pinned section + category section) — use .first()
    await expect(page.getByTestId('bookmark-card-bm-1').first()).toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-2')).toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-3')).toBeVisible();
  });

  test('"Add Bookmark" button opens form modal @P0', async ({ page }) => {
    await page.getByTestId('add-bookmark-btn').click();
    await expect(page.getByTestId('bookmark-form')).toBeVisible();
  });

  test('filling form and saving adds bookmark to list @P0', async ({ page }) => {
    await page.getByTestId('add-bookmark-btn').click();
    await page.getByTestId('bookmark-form-title').fill('Test Bookmark');
    await page.getByTestId('bookmark-form-url').fill('https://example.com');
    await page.getByTestId('bookmark-form-save').click();

    await expect(page.getByTestId('bookmark-form')).not.toBeVisible();
    await expect(page.locator('[data-testid^="bookmark-card-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="bookmark-card-"]').first()).toContainText(
      'Test Bookmark'
    );
  });

  test('adding bookmark persists to storage @P0', async ({ page }) => {
    await page.getByTestId('add-bookmark-btn').click();
    await page.getByTestId('bookmark-form-title').fill('Persisted Bookmark');
    await page.getByTestId('bookmark-form-url').fill('https://persisted.example.com');
    await page.getByTestId('bookmark-form-save').click();

    // Read storage directly to verify persistence
    const stored = await getStorage<Bookmark[]>(page, 'bookmarks');
    expect(stored).not.toBeNull();
    expect(stored!.some((b) => b.title === 'Persisted Bookmark')).toBe(true);
  });

  test('search input filters bookmarks by title @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'bookmarks');

    await page.getByTestId('bookmark-search').fill('GitHub');

    await expect(page.getByTestId('bookmark-card-bm-1')).toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-2')).not.toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-3')).not.toBeVisible();
  });

  test('search input filters bookmarks by tag @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'bookmarks');

    await page.getByTestId('bookmark-search').fill('monitoring');
    await expect(page.getByTestId('bookmark-card-bm-2')).toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-1')).not.toBeVisible();
  });

  test('"Pinned" filter tab shows only pinned bookmarks @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'bookmarks');

    await page.getByTestId('bookmark-filter-pinned').click();
    // bm-1 is pinned — confirm at least one card is visible and others are not
    await expect(page.getByTestId('bookmark-card-bm-1').first()).toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-2')).not.toBeVisible();
    await expect(page.getByTestId('bookmark-card-bm-3')).not.toBeVisible();
  });

  test('"Favorites" filter tab shows only favorited bookmarks @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'bookmarks');

    await page.getByTestId('bookmark-filter-favorites').click();
    // bm-2 is favorited
    await expect(page.getByTestId('bookmark-card-bm-2')).toBeVisible();
    await expect(page.locator('[data-testid^="bookmark-card-"]')).toHaveCount(1);
  });
});
