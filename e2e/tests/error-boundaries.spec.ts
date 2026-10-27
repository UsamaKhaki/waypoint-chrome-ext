import { test, expect } from '../fixtures/index';
import { navigateTo } from '../helpers/navigate';

// Injects a broken snippet (non-object) that causes Array.map to throw during render.
// This bypasses the store's null-safety (null → []) by injecting AFTER the store loads.
async function corruptSnippetsState(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    // Find the Zustand snippets store and directly corrupt its in-memory state.
    // We replace the snippets array with one containing a non-object that
    // causes snippet.id / snippet.title access to throw during render.
    const stores = (
      window as unknown as {
        __zustand_stores?: Map<string, { getState: () => unknown; setState: (s: unknown) => void }>;
      }
    ).__zustand_stores;
    if (stores) {
      for (const [, store] of stores) {
        const state = store.getState() as Record<string, unknown>;
        if ('snippets' in state) {
          store.setState({ snippets: [null] }); // null item causes .id access to throw
          return;
        }
      }
    }
    // Fallback: corrupt via storage AND reload is handled by the test
  });
}

test.describe('Error boundaries', () => {
  test('error boundary fallback renders when a panel throws @P2', async ({ page }) => {
    // Navigate to snippets first so the store is loaded
    await navigateTo(page, 'snippets');

    // Inject an invalid snippet item that will throw on render (null.id → TypeError)
    await page.evaluate(() => {
      // Walk all script module exports looking for the zustand store set function.
      // Simpler approach: override the store state via the window-exposed Zustand internals.
      // If the approach above doesn't work, force a React render error via bad data.
      const event = new CustomEvent('waypoint-test-corrupt-snippets');
      window.dispatchEvent(event);
    });

    // Alternative reliable method: seed null snippet items and reload
    await page.evaluate(() => {
      return new Promise<void>((resolve) =>
        chrome.storage.local.set({ snippets: [null, null] }, resolve)
      );
    });

    // Force the snippets store to re-read storage by navigating away and back
    await navigateTo(page, 'overview');
    await navigateTo(page, 'snippets');

    // The error boundary should catch the render error
    await expect(page.getByTestId('error-boundary-fallback')).toBeVisible({ timeout: 8_000 });
  });

  test('"Try again" button resets the error boundary @P2', async ({ page }) => {
    await page.evaluate(() => {
      return new Promise<void>((resolve) =>
        chrome.storage.local.set({ snippets: [null, null] }, resolve)
      );
    });

    await navigateTo(page, 'overview');
    await navigateTo(page, 'snippets');

    await expect(page.getByTestId('error-boundary-fallback')).toBeVisible({ timeout: 8_000 });

    // Fix the storage before clicking retry so the panel can re-render successfully
    await page.evaluate(() => {
      return new Promise<void>((resolve) => chrome.storage.local.set({ snippets: [] }, resolve));
    });

    await page.getByTestId('error-boundary-retry').click();

    await expect(page.getByTestId('snippets-panel')).toBeVisible();
    await expect(page.getByTestId('error-boundary-fallback')).not.toBeVisible();
  });

  test('one panel crashing does not affect other panels @P2', async ({ page }) => {
    await page.evaluate(() => {
      return new Promise<void>((resolve) =>
        chrome.storage.local.set({ snippets: [null, null] }, resolve)
      );
    });

    await navigateTo(page, 'overview');
    await navigateTo(page, 'snippets');

    // Even if snippets crashes, bookmarks should be fine
    await navigateTo(page, 'bookmarks');
    await expect(page.getByTestId('bookmarks-panel')).toBeVisible();
    await expect(page.getByTestId('error-boundary-fallback')).not.toBeVisible();
  });
});
