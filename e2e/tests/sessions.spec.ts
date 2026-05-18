import { test, expect } from '../fixtures/index';
import { seedSessions, getStorage } from '../helpers/storage';
import { navigateTo } from '../helpers/navigate';
import { SESSION_FIXTURES } from '../fixtures-data/sessions';

test.describe('Sessions panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, 'sessions');
  });

  test('shows empty state when no sessions in storage @P1', async ({ page }) => {
    await expect(page.getByTestId('sessions-panel')).toBeVisible();
    await expect(page.locator('[data-testid^="session-card-"]')).toHaveCount(0);
  });

  test('renders seeded sessions with tab count @P1', async ({ page }) => {
    await seedSessions(page, SESSION_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'sessions');

    await expect(page.getByTestId('session-card-sess-1')).toBeVisible();
    await expect(page.getByTestId('session-card-sess-2')).toBeVisible();
    // sess-1 has 3 tabs
    await expect(page.getByTestId('session-card-sess-1')).toContainText('3');
  });

  test('"Save" button with a name creates a new session @P1', async ({ page }) => {
    await page.getByTestId('session-name-input').fill('My Test Session');
    await page.getByTestId('session-save-btn').click();

    // A session card should appear
    await expect(page.locator('[data-testid^="session-card-"]').filter({ hasText: 'My Test Session' })).toBeVisible();

    // Verify it's in storage — SessionsPanel uses useSessionsStore which writes to 'sessions'
    const stored = await getStorage<unknown[]>(page, 'sessions');
    expect(stored?.some((s: unknown) => (s as { name: string }).name === 'My Test Session')).toBe(true);
  });

  test('delete button removes a session @P1', async ({ page }) => {
    await seedSessions(page, SESSION_FIXTURES);
    await page.reload();
    await page.waitForSelector('[data-testid="main-layout"]');
    await navigateTo(page, 'sessions');

    // First click changes the button to "Confirm"; second click performs the delete
    await page.getByTestId('session-delete-sess-2').click();
    await page.getByTestId('session-delete-sess-2').click();

    await expect(page.getByTestId('session-card-sess-2')).not.toBeVisible();
  });
});
