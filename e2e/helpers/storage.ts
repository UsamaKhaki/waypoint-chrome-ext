import type { Page } from '@playwright/test';
import type { Bookmark, Environment, AppSettings } from '../../src/types/index';
import type { TabSession } from '../../src/store/sessions.store';

// ── Low-level chrome.storage.local wrappers ───────────────────────────────
// All functions MUST be called while `page` is on an extension-privileged URL
// (chrome-extension://{id}/...). chrome.storage is not available on regular pages.

export async function setStorage(page: Page, data: Record<string, unknown>): Promise<void> {
  await page.evaluate((d) => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set(d, resolve);
    });
  }, data);
}

export async function getStorage<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((k) => {
    return new Promise<unknown>((resolve) => {
      chrome.storage.local.get(k, (result) => resolve(result[k] ?? null));
    });
  }, key) as Promise<T | null>;
}

export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => chrome.storage.local.clear(resolve));
  });
}

// ── Typed seed helpers ────────────────────────────────────────────────────

export async function seedOnboardingCompleted(page: Page): Promise<void> {
  await setStorage(page, { onboardingCompleted: true });
}

export async function seedBookmarks(page: Page, bookmarks: Bookmark[]): Promise<void> {
  await setStorage(page, { bookmarks });
}

export async function seedEnvironments(page: Page, environments: Environment[]): Promise<void> {
  await setStorage(page, { environments });
}

export async function seedSnippets(page: Page, snippets: unknown[]): Promise<void> {
  await setStorage(page, { snippets });
}

// Seeds into the 'sessions' key read by SessionsPanel (useSessionsStore)
export async function seedSessions(page: Page, sessions: TabSession[]): Promise<void> {
  await setStorage(page, { sessions });
}

export async function seedGitHubToken(page: Page, token = 'ghp_test_token_12345'): Promise<void> {
  await setStorage(page, { githubToken: token });
}

export async function seedLinearApiKey(
  page: Page,
  apiKey = 'lin_api_test_key_abc123'
): Promise<void> {
  await setStorage(page, { linearApiKey: apiKey });
}

export async function seedJiraCredentials(
  page: Page,
  credentials = { domain: 'acme', email: 'dev@acme.com', apiToken: 'jira_test_token_xyz' }
): Promise<void> {
  await setStorage(page, { jiraCredentials: credentials });
}

export async function seedSlackToken(
  page: Page,
  token = 'xoxb-test-slack-token-abc123'
): Promise<void> {
  await setStorage(page, { slackToken: token });
}

export async function seedNotionToken(
  page: Page,
  token = 'secret_notion_test_internal_token'
): Promise<void> {
  await setStorage(page, { notionToken: token });
}

export async function seedGoogleCalendarConnected(page: Page): Promise<void> {
  await setStorage(page, { googleCalendarConnected: true });
}

export async function seedSettings(page: Page, settings: Partial<AppSettings>): Promise<void> {
  await setStorage(page, { settings });
}

export async function seedGitHubRepo(
  page: Page,
  repo = {
    id: 'repo-1',
    owner: 'testuser',
    name: 'waypoint',
    fullName: 'testuser/waypoint',
    url: 'https://github.com/testuser/waypoint',
    isStarred: false,
    order: 0,
  }
): Promise<void> {
  await setStorage(page, { githubRepos: [repo] });
}
