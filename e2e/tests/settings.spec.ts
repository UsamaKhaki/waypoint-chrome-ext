import { test, expect } from '../fixtures/index';
import { seedGitHubToken } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';

test.describe('Settings panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'settings');
  });

  test('renders all section tabs @P1', async ({ page }) => {
    await expect(page.getByTestId('settings-panel')).toBeVisible();
    const sections = [
      'subscription',
      'profile',
      'appearance',
      'notifications',
      'connectors',
      'data',
      'about',
    ];
    for (const section of sections) {
      await expect(page.getByTestId(`settings-section-${section}`)).toBeVisible();
    }
  });

  test('clicking Appearance section shows accent color swatches @P1', async ({ page }) => {
    await page.getByTestId('settings-section-appearance').click();
    // Accent color swatches should be visible
    await expect(page.locator('[data-testid^="accent-color-"]').first()).toBeVisible();
  });

  test('clicking an accent color updates the CSS variable @P1', async ({ page }) => {
    await page.getByTestId('settings-section-appearance').click();
    // Click first accent color swatch
    await page.locator('[data-testid^="accent-color-"]').first().click();
    // The html element should have the CSS variable updated (applied by useApplySettings)
    const accentColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accentColor).toBeTruthy();
  });

  test('Connectors section shows integration status @P1', async ({ page }) => {
    await seedGitHubToken(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();

    // GitHub should show as connected
    await expect(page.getByTestId('disconnect-github')).toBeVisible();
  });

  test('Data section Export button is present @P1', async ({ page }) => {
    await page.getByTestId('settings-section-data').click();
    await expect(page.getByTestId('settings-export-btn')).toBeVisible();
  });
});
