import { test, expect } from '../fixtures/index';
import { seedJiraCredentials, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { mockJiraApi } from '../helpers/api-mocks';
import { JIRA_MOCKS } from '../fixtures-data/jira';

test.describe('Jira panel — unauthenticated', () => {
  test('shows connect screen when no credentials in storage @P1', async ({ page }) => {
    await navigateTo(page, 'jira');
    await expect(page.getByTestId('jira-connect')).toBeVisible();
  });
});

test.describe('Jira panel — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockJiraApi(page);
    await seedJiraCredentials(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'jira');
    await expect(page.getByTestId('jira-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('shows user display name in dashboard @P1', async ({ page }) => {
    await expect(page.getByTestId('jira-dashboard')).toContainText(JIRA_MOCKS.user.displayName);
  });

  test('assigned issues show key and summary @P1', async ({ page }) => {
    await expect(page.getByTestId('jira-dashboard')).toContainText('ACME-42');
    await expect(page.getByTestId('jira-dashboard')).toContainText('Integrate Waypoint with Jira');
  });

  test('Disconnect clears credentials from storage @P1', async ({ page }) => {
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-jira').click();

    const creds = await getStorage(page, 'jiraCredentials');
    expect(creds).toBeNull();

    await navigateTo(page, 'jira');
    await expect(page.getByTestId('jira-connect')).toBeVisible();
  });
});
