import type { Page } from '@playwright/test';

const isMac = process.platform === 'darwin';
const modifier = isMac ? 'Meta' : 'Control';

/** Click a sidebar navigation item by section id */
export async function navigateTo(page: Page, section: string): Promise<void> {
  await page.click(`[data-testid="nav-item-${section}"]`);
}

/**
 * Open a connector that isn't connected yet. The sidebar only lists connected
 * connectors, so go through Settings → Connectors → Connect like a user would.
 */
export async function openConnectorSetup(page: Page, connector: string): Promise<void> {
  await navigateTo(page, 'settings');
  await page.click('[data-testid="settings-section-connectors"]');
  await page.click(`[data-testid="connect-${connector}"]`);
}

/** Press Cmd/Ctrl + a number key to switch sections via keyboard shortcut */
export async function pressShortcut(page: Page, key: string): Promise<void> {
  await page.keyboard.press(`${modifier}+${key}`);
}

/** Press a two-key chord (e.g. 'g' then 'h' for GitHub) */
export async function pressChord(page: Page, first: string, second: string): Promise<void> {
  await page.keyboard.press(first);
  await page.keyboard.press(second);
}

/** Open the command palette via keyboard */
export async function openCommandPalette(page: Page): Promise<void> {
  await page.keyboard.press(`${modifier}+k`);
  await page.waitForSelector('[data-testid="command-palette"]');
}

/** Close the command palette via Escape */
export async function closeCommandPalette(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}
