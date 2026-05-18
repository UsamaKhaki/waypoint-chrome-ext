import { test, expect } from '../fixtures/index';
import { seedGoogleCalendarConnected, getStorage, setStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { mockGoogleCalendarApi } from '../helpers/api-mocks';
import { GCAL_MOCKS } from '../fixtures-data/google-calendar';

test.describe('Google Calendar panel — unauthenticated', () => {
  test('shows connect screen when googleCalendarConnected is false @P1', async ({ page }) => {
    await navigateTo(page, 'google-calendar');
    await expect(page.getByTestId('google-calendar-connect')).toBeVisible();
  });
});

test.describe('Google Calendar panel — authenticated', () => {
  // chrome.identity.getAuthToken() cannot be triggered in automated tests.
  // We inject a mock via addInitScript that patches chrome.identity BEFORE the
  // extension page loads, so getAuthToken immediately returns a fake token.
  // Then we mock the Calendar REST calls via page.route().

  const FAKE_TOKEN = 'ya29.fake-gcal-access-token';

  test.beforeEach(async ({ chromeContext, newTabUrl }) => {
    // Inject chrome.identity mock before any extension page script runs
    await chromeContext.addInitScript(`
      if (typeof chrome !== 'undefined' && chrome.identity) {
        const fakeToken = '${FAKE_TOKEN}';
        chrome.identity.getAuthToken = function(_options, callback) {
          if (callback) callback(fakeToken);
          return Promise.resolve(fakeToken);
        };
        chrome.identity.removeCachedAuthToken = function(_options, callback) {
          if (callback) callback();
        };
      }
    `);

    const page = await chromeContext.newPage();
    await page.goto(newTabUrl);
    await mockGoogleCalendarApi(page);
    await seedGoogleCalendarConnected(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'google-calendar');
    await expect(page.getByTestId('google-calendar-dashboard')).toBeVisible({ timeout: 10_000 });
    await page.close();
  });

  // NOTE: These tests use a fresh page from the seeded fixture
  test("shows today's events @P1", async ({ page }) => {
    await mockGoogleCalendarApi(page);
    await seedGoogleCalendarConnected(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'google-calendar');
    await expect(page.getByTestId('google-calendar-dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('google-calendar-dashboard')).toContainText('Daily Standup');
  });

  test('shows user profile email @P1', async ({ page }) => {
    await mockGoogleCalendarApi(page);
    await seedGoogleCalendarConnected(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'google-calendar');
    await expect(page.getByTestId('google-calendar-dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('google-calendar-dashboard')).toContainText(
      GCAL_MOCKS.userProfile.email
    );
  });

  test('Disconnect clears storage flag @P1', async ({ page }) => {
    await seedGoogleCalendarConnected(page);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'settings');
    await page.getByTestId('settings-section-connectors').click();
    await page.getByTestId('disconnect-google-calendar').click();

    const connected = await getStorage(page, 'googleCalendarConnected');
    expect(connected).toBeNull();

    await navigateTo(page, 'google-calendar');
    await expect(page.getByTestId('google-calendar-connect')).toBeVisible();
  });
});
