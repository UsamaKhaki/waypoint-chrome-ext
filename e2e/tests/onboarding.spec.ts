import { extensionTest as test, expect } from '../fixtures/index';
import { clearStorage } from '../helpers/storage';

/**
 * Onboarding flow tests.
 * Uses the base extensionTest (NOT the seeded fixture) so we can control
 * whether onboardingCompleted is in storage.
 */

test.describe('Onboarding flow', () => {
  test('shows onboarding modal when onboardingCompleted is not set @P0', async ({
    chromeContext,
    newTabUrl,
  }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    await expect(page.getByTestId('onboarding-flow')).toBeVisible();
    await expect(page.getByTestId('onboarding-title')).toBeVisible();
    await page.close();
  });

  test('first step title is "Command Palette" @P0', async ({ chromeContext, newTabUrl }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    await expect(page.getByTestId('onboarding-title')).toContainText('Command Palette');
    await page.close();
  });

  test('"Next" advances through all 5 steps @P0', async ({ chromeContext, newTabUrl }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    const expectedTitles = [
      'Command Palette',
      'Smart Bookmarks',
      'Environment Switcher',
      'GitHub Hub',
      'Daily Focus',
    ];

    for (let i = 0; i < expectedTitles.length; i++) {
      await expect(page.getByTestId('onboarding-title')).toContainText(expectedTitles[i]);
      if (i < expectedTitles.length - 1) {
        await page.getByTestId('onboarding-next').click();
      }
    }
    await page.close();
  });

  test('"Get Started" on last step sets onboardingCompleted and hides modal @P0', async ({
    chromeContext,
    newTabUrl,
  }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    // Click through to step 5
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('onboarding-next').click();
    }
    // Last step — button should say "Get Started"
    await page.getByTestId('onboarding-next').click();

    await expect(page.getByTestId('onboarding-flow')).not.toBeVisible();

    // Verify storage was written
    const completed = await page.evaluate(() => {
      return new Promise<boolean | null>((resolve) => {
        chrome.storage.local.get('onboardingCompleted', (r) =>
          resolve((r.onboardingCompleted as boolean | null) ?? null)
        );
      });
    });
    expect(completed).toBe(true);
    await page.close();
  });

  test('"Skip intro" hides modal and sets onboardingCompleted @P0', async ({
    chromeContext,
    newTabUrl,
  }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    await page.getByTestId('onboarding-skip').click();

    await expect(page.getByTestId('onboarding-flow')).not.toBeVisible();
    await page.close();
  });

  test('clicking a progress dot jumps to that step @P0', async ({ chromeContext, newTabUrl }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await clearStorage(page);
    await page.reload();

    // Jump to step 3 (index 2)
    await page.getByTestId('onboarding-dot-2').click();
    await expect(page.getByTestId('onboarding-title')).toContainText('Environment Switcher');
    await page.close();
  });

  test('does NOT show onboarding when onboardingCompleted is true @P0', async ({
    chromeContext,
    newTabUrl,
  }) => {
    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    // Seed onboardingCompleted before reload
    await page.evaluate(() => {
      return new Promise<void>((resolve) =>
        chrome.storage.local.set({ onboardingCompleted: true }, resolve)
      );
    });
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');

    await expect(page.getByTestId('onboarding-flow')).not.toBeVisible();
    await page.close();
  });
});
