import { test, expect } from '../fixtures/index';
import { seedBookmarks } from '../helpers/storage';
import { BOOKMARK_FIXTURES } from '../fixtures-data/bookmarks';

const isMac = process.platform === 'darwin';
const modifier = isMac ? 'Meta' : 'Control';

// Helper: open palette and ensure the input has focus before keyboard interaction.
// The CommandPalette uses Framer Motion (150ms transition) + setTimeout(focus, 50).
// Wait for the animation to settle before clicking so Playwright sees a stable element.
async function openPaletteAndFocus(page: Parameters<typeof test.extend>[0]['page']) {
  await page.keyboard.press(`${modifier}+k`);
  await expect(page.getByTestId('command-palette')).toBeVisible();
  // Allow the 150ms open animation + 50ms focus delay to complete
  await page.waitForTimeout(250);
  await page.getByTestId('command-palette-input').click();
}

test.describe('Command Palette', () => {
  test('Cmd/Ctrl+K opens the palette @P0', async ({ page }) => {
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByTestId('command-palette')).toBeVisible();
  });

  test('Escape closes the palette @P0', async ({ page }) => {
    await openPaletteAndFocus(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('clicking the backdrop closes the palette @P0', async ({ page }) => {
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('empty query shows navigation commands @P0', async ({ page }) => {
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByTestId('command-palette-results')).toBeVisible();
    const results = page
      .getByTestId('command-palette-results')
      .locator('[data-testid^="palette-result-"]');
    await expect(results).not.toHaveCount(0);
  });

  test('typing filters results via fuzzy search @P0', async ({ page }) => {
    await seedBookmarks(page, BOOKMARK_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');

    await openPaletteAndFocus(page);
    await page.getByTestId('command-palette-input').fill('GitHub');

    await expect(page.getByTestId('command-palette-results')).toContainText('GitHub');
  });

  test('shows empty state when no results match @P0', async ({ page }) => {
    await openPaletteAndFocus(page);
    await page.getByTestId('command-palette-input').fill('xyzzy-impossible-query-12345');
    await expect(page.getByTestId('command-palette-empty')).toBeVisible();
  });

  test('ArrowDown moves selection down @P0', async ({ page }) => {
    await openPaletteAndFocus(page);

    // First result selected by default
    const firstResult = page
      .getByTestId('command-palette-results')
      .locator('[data-testid^="palette-result-"]')
      .first();
    await expect(firstResult).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown');

    const secondResult = page
      .getByTestId('command-palette-results')
      .locator('[data-testid^="palette-result-"]')
      .nth(1);
    await expect(secondResult).toHaveAttribute('aria-selected', 'true');
  });

  test('Enter executes the selected navigation command @P0', async ({ page }) => {
    await openPaletteAndFocus(page);
    await page.getByTestId('command-palette-input').fill('bookmarks');
    // Wait for results to update before pressing Enter
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('/ key opens the palette @P0', async ({ page }) => {
    await page.locator('body').click();
    await page.keyboard.press('/');
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('second Cmd/Ctrl+K closes the palette @P0', async ({ page }) => {
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await page.keyboard.press(`${modifier}+k`);
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });
});
