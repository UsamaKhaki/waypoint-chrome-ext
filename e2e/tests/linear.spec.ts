import { test, expect } from '../fixtures/index';
import { seedLinearApiKey, getStorage } from '../helpers/storage';
import { navigateTo, openConnectorSetup } from '../helpers/navigate';
import { mockLinearApi, mockLinearApiError } from '../helpers/api-mocks';
import { LINEAR_MOCKS } from '../fixtures-data/linear';

test.describe('Linear panel — unauthenticated', () => {
  test('shows connect screen when no API key in storage @P1', async ({ page }) => {
    await openConnectorSetup(page, 'linear');
    await expect(page.getByTestId('linear-connect')).toBeVisible();
  });

  test('submitting invalid key shows error message @P1', async ({ page }) => {
    await mockLinearApiError(page, 401);
    await openConnectorSetup(page, 'linear');

    await page.getByTestId('linear-input').fill('lin_invalid_key');
    await page.getByTestId('linear-connect-btn').click();

    await expect(page.getByTestId('linear-error')).toBeVisible();
  });

  test('valid key shows Linear dashboard with user name @P1', async ({ page }) => {
    await mockLinearApi(page);
    await openConnectorSetup(page, 'linear');

    await page.getByTestId('linear-input').fill('lin_api_valid_key_xyz');
    await page.getByTestId('linear-connect-btn').click();

    await expect(page.getByTestId('linear-dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('linear-dashboard')).toContainText(LINEAR_MOCKS.viewer.name);
  });
});

test.describe('Linear panel — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockLinearApi(page);
    await seedLinearApiKey(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'linear');
    await expect(page.getByTestId('linear-dashboard')).toContainText(LINEAR_MOCKS.viewer.name, {
      timeout: 10_000,
    });
    // Ensure refresh() data is loaded before any test body runs
    await expect(page.getByTestId('linear-dashboard')).toContainText('ENG-42', { timeout: 10_000 });
  });

  test('assigned issues render with identifier and title @P1', async ({ page }) => {
    await expect(page.getByTestId('linear-dashboard')).toContainText('ENG-42');
    await expect(page.getByTestId('linear-dashboard')).toContainText(
      'Implement keyboard shortcuts'
    );
  });

  test('team stats render @P1', async ({ page }) => {
    await expect(page.getByTestId('linear-dashboard')).toContainText('Engineering');
  });

  test('Disconnect clears API key from storage @P1', async ({ page }) => {
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-linear').click();

    const key = await getStorage<string>(page, 'linearApiKey');
    expect(key).toBeNull();

    await openConnectorSetup(page, 'linear');
    await expect(page.getByTestId('linear-connect')).toBeVisible();
  });
});
