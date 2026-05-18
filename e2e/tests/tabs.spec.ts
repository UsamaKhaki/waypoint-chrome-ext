import { test, expect } from '../fixtures/index';
import { navigateTo } from '../helpers/navigate';

test.describe('Tabs panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'tabs');
  });

  test('renders the tabs panel without crashing @P2', async ({ page }) => {
    await expect(page.getByTestId('tabs-panel')).toBeVisible();
  });

  test('shows open tabs in the current window @P2', async ({ page }) => {
    // At minimum the extension's own new-tab page is open
    await expect(page.getByTestId('tabs-panel')).toBeVisible();
    // Tab list should have at least one entry (the current tab)
    await expect(page.locator('[data-testid^="tab-row-"]').first()).toBeVisible();
  });

  test('save session button is present @P2', async ({ page }) => {
    await expect(page.getByTestId('tabs-save-session-btn')).toBeVisible();
  });
});
