import { test, expect } from '../fixtures/index';
import { seedSlackToken, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { mockSlackApi } from '../helpers/api-mocks';
import { SLACK_MOCKS } from '../fixtures-data/slack';

test.describe('Slack panel — unauthenticated', () => {
  test('shows connect screen when no token in storage @P1', async ({ page }) => {
    await navigateTo(page, 'slack');
    await expect(page.getByTestId('slack-connect')).toBeVisible();
  });
});

test.describe('Slack panel — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockSlackApi(page);
    await seedSlackToken(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'slack');
    await expect(page.getByTestId('slack-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('shows user name and team in dashboard @P1', async ({ page }) => {
    // Dashboard displays real_name ("Test User"), not the username ("testuser")
    await expect(page.getByTestId('slack-dashboard')).toContainText(SLACK_MOCKS.user.real_name);
    await expect(page.getByTestId('slack-dashboard')).toContainText(SLACK_MOCKS.authTest.team);
  });

  test('shows unread conversations @P1', async ({ page }) => {
    // Channel "general" and DM "D001" both have unread_count > 0
    await expect(page.getByTestId('slack-dashboard')).toContainText('general');
  });

  test('Disconnect clears token from storage @P1', async ({ page }) => {
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-slack').click();

    const token = await getStorage(page, 'slackToken');
    expect(token).toBeNull();

    await navigateTo(page, 'slack');
    await expect(page.getByTestId('slack-connect')).toBeVisible();
  });
});
