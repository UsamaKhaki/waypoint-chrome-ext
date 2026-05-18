import { test, expect } from '../fixtures/index';
import { seedGitHubToken, seedGitHubRepo, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { mockGitHubApi, mockGitHubApiError } from '../helpers/api-mocks';
import { GITHUB_MOCKS } from '../fixtures-data/github';

test.describe('GitHub panel — unauthenticated', () => {
  test('shows connect screen when no token in storage @P0', async ({ page }) => {
    await navigateTo(page, 'github');
    await expect(page.getByTestId('github-connect')).toBeVisible();
    await expect(page.getByTestId('github-dashboard')).not.toBeVisible();
  });

  test('connect button is disabled when token input is empty @P0', async ({ page }) => {
    await navigateTo(page, 'github');
    await expect(page.getByTestId('github-connect-btn')).toBeDisabled();
  });

  test('submitting invalid token shows error message @P0', async ({ page }) => {
    await mockGitHubApiError(page, 401);
    await navigateTo(page, 'github');

    await page.getByTestId('github-token-input').fill('invalid_token_xyz');
    await page.getByTestId('github-connect-btn').click();

    await expect(page.getByTestId('github-connect-error')).toBeVisible();
    await expect(page.getByTestId('github-connect-error')).toContainText(/invalid|error/i);
  });

  test('submitting valid token shows GitHub dashboard @P0', async ({ page }) => {
    await mockGitHubApi(page);
    await navigateTo(page, 'github');

    await page.getByTestId('github-token-input').fill('ghp_valid_test_token');
    await page.getByTestId('github-connect-btn').click();

    await expect(page.getByTestId('github-dashboard')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('GitHub panel — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockGitHubApi(page);
    await seedGitHubToken(page);
    await seedGitHubRepo(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'github');
    // Wait for dashboard to load after auth check
    await expect(page.getByTestId('github-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('shows user login in dashboard @P0', async ({ page }) => {
    await expect(page.getByTestId('github-dashboard')).toContainText(GITHUB_MOCKS.user.login);
  });

  test('shows open PRs list @P0', async ({ page }) => {
    await expect(page.getByTestId('github-prs-list')).toBeVisible();
    await expect(page.getByTestId('github-prs-list')).toContainText(GITHUB_MOCKS.myPRs[0].title);
  });

  test('disconnect removes token from storage and shows connect screen @P0', async ({ page }) => {
    // Navigate to settings to find disconnect button
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-github').click();

    // Token should be gone from storage
    const token = await getStorage<string>(page, 'githubToken');
    expect(token).toBeNull();

    // Navigating back to github should show connect screen
    await navigateTo(page, 'github');
    await expect(page.getByTestId('github-connect')).toBeVisible();
  });
});
