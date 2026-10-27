import { test, expect } from '../fixtures/index';
import { navigateTo } from '../helpers/navigate';

test.describe('Daily Focus panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'focus');
  });

  test('renders without crashing @P1', async ({ page }) => {
    await expect(page.getByTestId('focus-panel')).toBeVisible();
  });

  test('adding a priority item saves it @P1', async ({ page }) => {
    await page.getByTestId('priority-input').fill('Write E2E tests');
    await page.keyboard.press('Enter');

    await expect(
      page.locator('[data-testid^="priority-item-"]').filter({ hasText: 'Write E2E tests' })
    ).toBeVisible();
  });

  test('checking off a priority marks it complete @P1', async ({ page }) => {
    await page.getByTestId('priority-input').fill('Finish feature');
    await page.keyboard.press('Enter');

    // Click the checkbox button for the new item
    const item = page
      .locator('[data-testid^="priority-item-"]')
      .filter({ hasText: 'Finish feature' });
    await item.locator('[data-testid^="priority-check-"]').click();

    // The text span inside the item should have line-through styling
    await expect(item.locator('span').filter({ hasText: 'Finish feature' })).toHaveClass(
      /line-through/
    );
  });

  test('notes textarea persists content on reload @P1', async ({ page }) => {
    // Switch to the Notes tab (panel defaults to Priorities)
    await page.getByTestId('focus-tab-notes').click();
    await page.getByTestId('focus-notes').fill('Remember to review PR #42');
    // Wait for the debounced auto-save to fire (800ms debounce + buffer)
    await page.waitForTimeout(1200);

    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'focus');
    await page.getByTestId('focus-tab-notes').click();

    await expect(page.getByTestId('focus-notes')).toHaveValue('Remember to review PR #42');
  });
});
