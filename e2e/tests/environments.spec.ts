import { test, expect } from '../fixtures/index';
import { seedEnvironments } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { ENVIRONMENT_FIXTURES } from '../fixtures-data/environments';

test.describe('Environments panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'environments');
  });

  test('renders default 3 environments (Local, Stage, Production) on first load @P1', async ({
    page,
  }) => {
    // Default environments are seeded by the store when storage is empty
    const cards = page.locator('[data-testid^="environment-card-"]');
    await expect(cards).toHaveCount(3);
  });

  test('renders environments from seeded storage @P1', async ({ page }) => {
    await seedEnvironments(page, ENVIRONMENT_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'environments');

    await expect(page.getByTestId('environment-card-env-local')).toBeVisible();
    await expect(page.getByTestId('environment-card-env-staging')).toBeVisible();
  });

  test('"Add Environment" button opens form modal @P1', async ({ page }) => {
    await page.getByTestId('add-environment-btn').click();
    await expect(page.getByTestId('environment-form')).toBeVisible();
  });

  test('adding an environment saves to storage @P1', async ({ page }) => {
    await page.getByTestId('add-environment-btn').click();
    await page.getByTestId('environment-form').locator('[data-testid="env-form-name"]').fill('QA');
    await page.getByTestId('environment-form').locator('[data-testid="env-form-save"]').click();

    await expect(page.getByTestId('environment-form')).not.toBeVisible();
    await expect(page.locator('[data-testid^="environment-card-"]').filter({ hasText: 'QA' })).toBeVisible();
  });
});
