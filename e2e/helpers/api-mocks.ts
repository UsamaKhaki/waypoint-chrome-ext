import type { BrowserContext, Page, Route } from '@playwright/test';
import { GITHUB_MOCKS } from '../fixtures-data/github';
import { LINEAR_MOCKS } from '../fixtures-data/linear';
import { JIRA_MOCKS } from '../fixtures-data/jira';
import { SLACK_MOCKS } from '../fixtures-data/slack';
import { NOTION_MOCKS } from '../fixtures-data/notion';
import { GCAL_MOCKS } from '../fixtures-data/google-calendar';

// ── GitHub (direct fetch from extension page) ─────────────────────────────

export async function mockGitHubApi(
  page: Page,
  overrides: Partial<typeof GITHUB_MOCKS> = {}
): Promise<void> {
  const m = { ...GITHUB_MOCKS, ...overrides };

  await page.route('https://api.github.com/user', (route) => route.fulfill({ json: m.user }));
  await page.route('https://api.github.com/search/issues*', (route) => {
    const url = route.request().url();
    if (url.includes('review-requested')) {
      return route.fulfill({
        json: { items: m.reviewRequests, total_count: m.reviewRequests.length },
      });
    }
    if (url.includes('is:pr+author')) {
      return route.fulfill({ json: { items: m.myPRs, total_count: m.myPRs.length } });
    }
    if (url.includes('is:issue+assignee')) {
      return route.fulfill({
        json: { items: m.assignedIssues, total_count: m.assignedIssues.length },
      });
    }
    return route.fulfill({ json: { items: [], total_count: 0 } });
  });
  await page.route('https://api.github.com/notifications*', (route) =>
    route.fulfill({ json: m.notifications })
  );
  await page.route('https://api.github.com/repos/*/actions/runs*', (route) =>
    route.fulfill({ json: { workflow_runs: m.workflowRuns } })
  );
}

// ── Linear (direct fetch to GraphQL endpoint) ─────────────────────────────
// page.route() can be unreliable for Chrome extension pages when auth state
// is loaded from storage on mount. We patch fetch() via addInitScript so the
// mock is active before any extension scripts run, surviving page reloads.

async function linearRouteHandler(route: Route, m: typeof LINEAR_MOCKS): Promise<void> {
  const q = route.request().postData() ?? '';
  if (q.includes('assignedIssues') && q.includes('started')) {
    await route.fulfill({
      json: { data: { viewer: { assignedIssues: { nodes: m.inProgressIssues } } } },
    });
  } else if (q.includes('assignedIssues')) {
    await route.fulfill({
      json: { data: { viewer: { assignedIssues: { nodes: m.assignedIssues } } } },
    });
  } else if (q.includes('createdIssues')) {
    await route.fulfill({
      json: { data: { viewer: { createdIssues: { nodes: m.createdIssues } } } },
    });
  } else if (q.includes('teams')) {
    // getTeams() computes counts from raw issues.nodes — return raw API shape, not LinearTeam[]
    const rawTeams = m.teams.map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
      issues: {
        nodes: [
          ...Array(t.inProgressIssues).fill({ state: { type: 'started' } }),
          ...Array(t.completedIssues).fill({ state: { type: 'completed' } }),
          ...Array(Math.max(0, t.issueCount - t.inProgressIssues - t.completedIssues)).fill({
            state: { type: 'backlog' },
          }),
        ],
      },
    }));
    await route.fulfill({ json: { data: { teams: { nodes: rawTeams } } } });
  } else if (q.includes('notifications')) {
    await route.fulfill({ json: { data: { notifications: { nodes: m.notifications } } } });
  } else {
    await route.fulfill({ json: { data: { viewer: m.viewer } } });
  }
}

export async function mockLinearApi(
  page: Page,
  overrides: Partial<typeof LINEAR_MOCKS> = {}
): Promise<void> {
  const m = { ...LINEAR_MOCKS, ...overrides };
  await page.route('https://api.linear.app/graphql', (route) => linearRouteHandler(route, m));
}

// ── Jira (direct fetch from extension page) ───────────────────────────────

export async function mockJiraApi(
  page: Page,
  domain = 'acme',
  overrides: Partial<typeof JIRA_MOCKS> = {}
): Promise<void> {
  const m = { ...JIRA_MOCKS, ...overrides };

  await page.route(`https://${domain}.atlassian.net/rest/api/3/myself`, (route) =>
    route.fulfill({ json: m.user })
  );
  await page.route(`https://${domain}.atlassian.net/rest/api/3/search*`, (route) =>
    route.fulfill({ json: { issues: m.issues, total: m.issues.length } })
  );
}

// ── Slack (direct POST fetch) ─────────────────────────────────────────────

export async function mockSlackApi(
  page: Page,
  overrides: Partial<typeof SLACK_MOCKS> = {}
): Promise<void> {
  const m = { ...SLACK_MOCKS, ...overrides };

  await page.route('https://slack.com/api/auth.test', (route) =>
    route.fulfill({ json: { ok: true, ...m.authTest } })
  );
  await page.route('https://slack.com/api/users.info*', (route) =>
    route.fulfill({ json: { ok: true, user: m.user } })
  );
  await page.route('https://slack.com/api/conversations.list*', (route) =>
    route.fulfill({ json: { ok: true, channels: m.channels } })
  );
}

// ── Notion (backgroundFetch → service worker → fetch) ────────────────────
// Notion uses backgroundFetch which routes through the service worker.
// Must intercept at context level — context.route() catches SW-level requests.

export async function mockNotionApi(
  context: BrowserContext,
  overrides: Partial<typeof NOTION_MOCKS> = {}
): Promise<void> {
  const m = { ...NOTION_MOCKS, ...overrides };

  await context.route('https://api.notion.com/v1/users/me', (route) =>
    route.fulfill({ json: m.user })
  );
  // Return raw Notion API format — notionApi.ts's mapPage() calls extractTitle()
  // which reads title[0].plain_text (database) or properties.*.title[0].plain_text (page)
  const rawPages = m.pages.map((p) =>
    p.object === 'database'
      ? {
          object: 'database',
          id: p.id,
          url: p.url,
          created_time: p.created_time,
          last_edited_time: p.last_edited_time,
          icon: p.icon,
          parent: p.parent,
          title: [{ plain_text: p.title, text: { content: p.title } }],
        }
      : {
          object: 'page',
          id: p.id,
          url: p.url,
          created_time: p.created_time,
          last_edited_time: p.last_edited_time,
          icon: p.icon,
          parent: p.parent,
          properties: {
            Name: { type: 'title', title: [{ plain_text: p.title }] },
          },
        }
  );
  await context.route('https://api.notion.com/v1/search', (route) =>
    route.fulfill({ json: { results: rawPages } })
  );
}

// ── Google Calendar (direct fetch) ───────────────────────────────────────

export async function mockGoogleCalendarApi(
  page: Page,
  overrides: Partial<typeof GCAL_MOCKS> = {}
): Promise<void> {
  const m = { ...GCAL_MOCKS, ...overrides };

  await page.route('https://www.googleapis.com/oauth2/v2/userinfo', (route) =>
    route.fulfill({ json: m.userProfile })
  );
  await page.route('https://www.googleapis.com/calendar/v3/users/me/calendarList', (route) =>
    route.fulfill({ json: { items: m.calendars } })
  );
  await page.route('https://www.googleapis.com/calendar/v3/calendars/primary/events*', (route) =>
    route.fulfill({ json: { items: m.events } })
  );
}

// ── Error + offline simulation helpers ───────────────────────────────────

export async function mockGitHubApiError(page: Page, status = 401): Promise<void> {
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({ status, json: { message: 'Bad credentials' } })
  );
}

export async function mockLinearApiError(page: Page, status = 401): Promise<void> {
  await page.route('https://api.linear.app/**', (route) =>
    route.fulfill({ status, json: { errors: [{ message: 'Authentication required' }] } })
  );
}

export async function mockNetworkOffline(page: Page): Promise<void> {
  await page.route('https://api.github.com/**', (route) => route.abort('failed'));
  await page.route('https://api.linear.app/**', (route) => route.abort('failed'));
  await page.route('https://*.atlassian.net/**', (route) => route.abort('failed'));
  await page.route('https://slack.com/**', (route) => route.abort('failed'));
}
