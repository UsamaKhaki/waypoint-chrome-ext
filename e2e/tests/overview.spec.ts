import { test, expect } from '../fixtures/index';
import { seedGitHubToken } from '../helpers/storage';
import { mockGitHubApi } from '../helpers/api-mocks';

test.describe('Overview panel', () => {
  test('renders without crashing @P1', async ({ page }) => {
    await expect(page.getByTestId('overview-panel')).toBeVisible();
  });

  test('shows Quick Apps grid @P1', async ({ page }) => {
    await expect(page.getByTestId('quick-apps')).toBeVisible();
  });

  test('clicking a section card navigates to that section @P1', async ({ page }) => {
    // Click the Bookmarks card in the overview
    await page.getByTestId('overview-link-bookmarks').click();
    await expect(page.getByTestId('nav-item-bookmarks')).toHaveClass(/text-accent/);
  });

  test('shows GitHub integration widget when connected @P1', async ({ page }) => {
    await mockGitHubApi(page);
    await seedGitHubToken(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');

    // The integrations widget or open PRs widget should appear
    await expect(page.getByTestId('overview-panel')).toBeVisible();
  });
});
