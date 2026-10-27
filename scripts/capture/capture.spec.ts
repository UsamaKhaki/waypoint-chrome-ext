/**
 * Captures the README screenshots (and optionally a walkthrough video) from the
 * built extension with a fictional sample dataset. GitHub API responses are
 * mocked; bookmarks are created through the real chrome.bookmarks API.
 *
 *   npm run build && npm run docs:media
 *   VIDEO_DIR=/tmp/waypoint-video npm run docs:media
 */
import { test, chromium, type BrowserContext, type Page } from '@playwright/test';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EXT = path.join(REPO, 'dist');
const OUT = process.env.SHOT_DIR ?? path.join(REPO, 'docs/screenshots');
const VIDEO = process.env.VIDEO_DIR;
const W = VIDEO ? 1280 : 1440;
const H = 900;
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const repoUrl = 'https://api.github.com/repos/acme/web-app';
const avatar =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#3b4252"/></svg>'
  );
const pr = (n: number, title: string, h: number, author = 'alex-dev', labels: string[] = []) => ({
  id: 1000 + n,
  number: n,
  title,
  html_url: `https://github.com/acme/web-app/pull/${n}`,
  state: 'open',
  draft: false,
  created_at: ago(h + 20),
  updated_at: ago(h),
  user: { login: author, avatar_url: avatar },
  repository_url: repoUrl,
  labels: labels.map((name) => ({ name, color: '84b6eb' })),
  requested_reviewers: [{ login: 'you' }],
  review_comments: 2,
  comments: 1,
});

async function mockApis(ctx: BrowserContext) {
  await ctx.route('https://avatars.githubusercontent.com/**', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', body: decodeURIComponent(avatar.split(',')[1]) })
  );
  await ctx.route('https://api.github.com/user', (r) =>
    r.fulfill({
      json: {
        login: 'demo-dev',
        name: 'Demo Developer',
        avatar_url: avatar,
        html_url: 'https://github.com/demo-dev',
        public_repos: 12,
        followers: 30,
      },
    })
  );
  await ctx.route('https://api.github.com/search/issues*', (r) => {
    const u = decodeURIComponent(r.request().url());
    if (u.includes('review-requested'))
      return r.fulfill({
        json: {
          items: [
            pr(318, 'feat(billing): prorate plan changes mid-cycle', 2, 'maria-k', ['billing']),
            pr(321, 'fix(auth): refresh token race on parallel requests', 5, 'jun-l', ['bug']),
          ],
          total_count: 2,
        },
      });
    if (u.includes('author'))
      return r.fulfill({
        json: {
          items: [
            pr(322, 'chore: upgrade to React 18.3 and drop legacy context', 1, 'demo-dev'),
            pr(315, 'feat(search): debounce queries and cache results', 26, 'demo-dev', [
              'enhancement',
            ]),
          ],
          total_count: 2,
        },
      });
    if (u.includes('is:issue'))
      return r.fulfill({
        json: {
          items: [
            {
              ...pr(309, 'Checkout button stays disabled after coupon removal', 8, 'support-bot'),
              assignees: [{ login: 'demo-dev', avatar_url: avatar }],
              labels: [{ name: 'bug', color: 'd73a4a' }],
            },
          ],
          total_count: 1,
        },
      });
    return r.fulfill({ json: { items: [], total_count: 0 } });
  });
  await ctx.route('https://api.github.com/notifications*', (r) => r.fulfill({ json: [] }));
  await ctx.route('https://api.github.com/repos/*/actions/runs*', (r) =>
    r.fulfill({
      json: {
        workflow_runs: [
          {
            id: 1,
            name: 'CI',
            head_branch: 'main',
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://github.com/acme/web-app/actions/runs/1',
            created_at: ago(1),
            updated_at: ago(1),
            run_number: 488,
            event: 'push',
            head_commit: { message: 'Merge pull request #317' },
          },
          {
            id: 2,
            name: 'E2E',
            head_branch: 'feat/billing',
            status: 'in_progress',
            conclusion: null,
            html_url: 'https://github.com/acme/web-app/actions/runs/2',
            created_at: ago(0.2),
            updated_at: ago(0.1),
            run_number: 212,
            event: 'pull_request',
            head_commit: { message: 'prorate plan changes' },
          },
        ],
      },
    })
  );
  // Anything else on api.github.com: empty but valid.
  await ctx.route(/api\.github\.com\/(?!user$|search|notifications|repos\/.*\/actions)/, (r) =>
    r.fulfill({ json: [] })
  );
}

async function seed(page: Page) {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    await chrome.storage.local.set({
      onboardingCompleted: true,
      githubToken: 'demo-token',
      githubRepos: [
        {
          id: 'r1',
          owner: 'acme',
          name: 'web-app',
          fullName: 'acme/web-app',
          url: 'https://github.com/acme/web-app',
          isStarred: true,
          order: 0,
        },
      ],
    });
    const bar = (await chrome.bookmarks.getTree())[0].children![0];
    const folder = async (title: string, items: [string, string][]) => {
      const f = await chrome.bookmarks.create({ parentId: bar.id, title });
      for (const [t, url] of items)
        await chrome.bookmarks.create({ parentId: f.id, title: t, url });
    };
    await folder('GitHub', [
      ['acme/web-app', 'https://github.com/acme/web-app'],
      ['Pull requests', 'https://github.com/pulls'],
    ]);
    await folder('Monitoring', [
      ['Grafana: API latency', 'https://grafana.example.com/d/api'],
      ['Sentry issues', 'https://sentry.io/organizations/acme/issues/'],
    ]);
    await folder('Documentation', [
      ['React docs', 'https://react.dev/reference/react'],
      ['MDN: Fetch API', 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API'],
      ['Chrome extension APIs', 'https://developer.chrome.com/docs/extensions/reference/api'],
    ]);
    await folder('Production', [['Admin console', 'https://admin.example.com']]);
  });
}

let ctx: BrowserContext;
let page: Page;
let newTab: string;

test.beforeAll(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'waypoint-shots-'));
  ctx = await chromium.launchPersistentContext(dir, {
    headless: false,
    viewport: { width: W, height: H },
    colorScheme: 'dark',
    args: ['--headless=new', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    // With an extension loaded in --headless=new, the screencast only covers
    // the top (viewport height - 180px), so record into a frame of that size.
    ...(VIDEO ? { recordVideo: { dir: VIDEO, size: { width: W, height: H - 180 } } } : {}),
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  newTab = `chrome-extension://${sw.url().split('/')[2]}/index.html`;
  await mockApis(ctx);
  page = await ctx.newPage();
  await page.goto(newTab);
  await seed(page);
  await page.reload();
  await page.waitForSelector('[data-testid="main-layout"]');
  await page.waitForTimeout(1500);
});

test.afterAll(async () => {
  await ctx.close();
});

const shot = (name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const go = async (id: string) => {
  await page.click(`[data-testid="nav-item-${id}"]`);
  await page.waitForTimeout(VIDEO ? 1800 : 900);
};

test('screens', async () => {
  test.setTimeout(180_000);
  await fs.mkdir(OUT, { recursive: true });
  await page.mouse.move(W - 5, H - 5);

  await page.waitForTimeout(1500);
  await shot('overview');

  await page.keyboard.press(`${mod}+k`);
  await page.keyboard.type('graf', { delay: VIDEO ? 140 : 0 });
  await page.waitForTimeout(VIDEO ? 1800 : 600);
  await shot('command-palette');
  await page.keyboard.press('Escape');

  await go('bookmarks');
  await shot('bookmarks');
  if (VIDEO) {
    await page.click('[data-testid="bookmark-search"]');
    await page.keyboard.type('docs', { delay: 140 });
    await page.waitForTimeout(1800);
    await page.fill('[data-testid="bookmark-search"]', '');
  }

  await go('github');
  await page.waitForTimeout(1500);
  await shot('github');

  await go('snippets');
  await shot('snippets');

  await go('toolbox');
  await page
    .locator('[data-testid="toolbox-panel"] textarea')
    .first()
    .fill('{"id":318,"title":"prorate plan changes","labels":["billing"],"draft":false}');
  await page.waitForTimeout(VIDEO ? 1800 : 500);
  await shot('toolbox');

  await go('api-client');
  await shot('api-client');

  await go('settings');
  await page.click('[data-testid="settings-section-connectors"]');
  await page.waitForTimeout(VIDEO ? 1800 : 700);
  await shot('settings-connectors');
});
