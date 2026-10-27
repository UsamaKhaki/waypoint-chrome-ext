import { test, expect } from '../fixtures/index';
import { seedSlackToken, getStorage } from '../helpers/storage';
import { navigateTo, openConnectorSetup } from '../helpers/navigate';
import { mockSlackApi } from '../helpers/api-mocks';
import { SLACK_MOCKS } from '../fixtures-data/slack';

test.describe('Slack panel — unauthenticated', () => {
  test('shows connect screen when no token in storage @P1', async ({ page }) => {
    await openConnectorSetup(page, 'slack');
    await expect(page.getByTestId('slack-connect')).toBeVisible();
  });
});

test.describe('Slack panel — authenticated', () => {
  test.beforeEach(async ({ page, chromeContext }) => {
    await mockSlackApi(chromeContext);
    await seedSlackToken(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'slack');
    await expect(page.getByTestId('slack-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('shows workspace name and user handle in dashboard @P1', async ({ page }) => {
    await expect(page.getByTestId('slack-dashboard')).toContainText(SLACK_MOCKS.authTest.team);
    await expect(page.getByTestId('slack-dashboard')).toContainText(
      `@${SLACK_MOCKS.authTest.user}`
    );
  });

  test('shows total unread count across conversations @P1', async ({ page }) => {
    const total = SLACK_MOCKS.channels.reduce((sum, ch) => sum + ch.unread_count, 0);
    await expect(page.getByTestId('slack-dashboard')).toContainText(`${total}`);
    await expect(page.getByTestId('slack-dashboard')).toContainText('unread messages');
  });

  test('Disconnect clears token from storage @P1', async ({ page }) => {
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-slack').click();

    const token = await getStorage(page, 'slackToken');
    expect(token).toBeNull();

    await openConnectorSetup(page, 'slack');
    await expect(page.getByTestId('slack-connect')).toBeVisible();
  });
});
