import { test, expect } from '../fixtures/index';
import { navigateTo, pressShortcut, pressChord, openCommandPalette } from '../helpers/navigate';

const isMac = process.platform === 'darwin';

test.describe('Sidebar navigation', () => {
  const sections = [
    'overview',
    'bookmarks',
    'environments',
    'github',
    'linear',
    'jira',
    'slack',
    'notion',
    'google-calendar',
    'focus',
    'tabs',
    'snippets',
    'sessions',
    'settings',
  ];

  for (const section of sections) {
    test(`clicking "${section}" nav item renders its panel @P0`, async ({ page }) => {
      await navigateTo(page, section);
      // The nav item should be active (has accent class)
      await expect(page.getByTestId(`nav-item-${section}`)).toHaveClass(/text-accent/);
    });
  }
});

test.describe('Keyboard shortcuts — section switching', () => {
  const shortcuts: Array<[string, string]> = [
    ['1', 'overview'],
    ['2', 'bookmarks'],
    ['3', 'environments'],
    ['4', 'github'],
    ['5', 'focus'],
    ['6', 'tabs'],
    ['7', 'snippets'],
    ['8', 'sessions'],
    ['9', 'settings'],
  ];

  for (const [key, section] of shortcuts) {
    test(`Cmd/Ctrl+${key} navigates to ${section} @P0`, async ({ page }) => {
      await pressShortcut(page, key);
      await expect(page.getByTestId(`nav-item-${section}`)).toHaveClass(/text-accent/);
    });
  }
});

test.describe('Chord shortcuts', () => {
  test('g→h navigates to GitHub @P0', async ({ page }) => {
    await pressChord(page, 'g', 'h');
    await expect(page.getByTestId('nav-item-github')).toHaveClass(/text-accent/);
  });

  test('j→i navigates to Jira @P0', async ({ page }) => {
    await pressChord(page, 'j', 'i');
    await expect(page.getByTestId('nav-item-jira')).toHaveClass(/text-accent/);
  });

  test('l→i navigates to Linear @P0', async ({ page }) => {
    await pressChord(page, 'l', 'i');
    await expect(page.getByTestId('nav-item-linear')).toHaveClass(/text-accent/);
  });

  test('s→l navigates to Slack @P0', async ({ page }) => {
    await pressChord(page, 's', 'l');
    await expect(page.getByTestId('nav-item-slack')).toHaveClass(/text-accent/);
  });

  test('n→o navigates to Notion @P0', async ({ page }) => {
    await pressChord(page, 'n', 'o');
    await expect(page.getByTestId('nav-item-notion')).toHaveClass(/text-accent/);
  });
});

test.describe('Sidebar collapse', () => {
  test('collapse button hides nav labels @P0', async ({ page }) => {
    await page.getByTestId('sidebar-toggle').click();
    // In collapsed mode, the nav item text spans are hidden
    await expect(page.getByTestId('nav-item-bookmarks')).not.toContainText('Bookmarks');
  });

  test('second click on collapse button restores labels @P0', async ({ page }) => {
    await page.getByTestId('sidebar-toggle').click();
    await page.getByTestId('sidebar-toggle').click();
    await expect(page.getByTestId('nav-item-bookmarks')).toContainText('Bookmarks');
  });
});

test.describe('Shortcuts respect UI state', () => {
  test('keyboard shortcuts do not fire when command palette is open @P0', async ({ page }) => {
    await navigateTo(page, 'bookmarks');
    await openCommandPalette(page);
    // Press Cmd+1 while palette is open — should NOT navigate
    await pressShortcut(page, '1');
    // Bookmarks should still be active (not overview)
    await expect(page.getByTestId('nav-item-bookmarks')).toHaveClass(/text-accent/);
    await page.keyboard.press('Escape');
  });

  test('keyboard shortcuts do not fire when an input has focus @P0', async ({ page }) => {
    await navigateTo(page, 'bookmarks');
    // Focus the search input in bookmarks
    await page.getByTestId('bookmark-search').focus();
    const modKey = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+1`);
    // Should still be on bookmarks, not overview
    await expect(page.getByTestId('nav-item-bookmarks')).toHaveClass(/text-accent/);
  });
});
