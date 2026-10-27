// Runs as Chrome extension service worker — no DOM, no React
import * as Sentry from '@sentry/browser';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: 'waypoint@1.0.0',
      // Disable all browser/DOM integrations — service worker has no window/document
      defaultIntegrations: false,
      tracesSampleRate: 0,
      initialScope: { tags: { context: 'background' } },
    });
  } catch {
    // Sentry init failed in service worker context — continue without it
  }
}

const ALARM_NAME = 'waypoint-gh-poll';

// ── Install ──────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'waypoint-save-snippet',
    title: 'Save to Waypoint Snippets',
    contexts: ['selection'],
  });
  scheduleAlarm();
});

chrome.runtime.onStartup.addListener(scheduleAlarm);

// ── Context menu ─────────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'waypoint-save-snippet') return;
  const text = info.selectionText ?? '';
  if (!text.trim()) return;

  const pending = {
    content: text,
    title: tab?.title ? `From: ${tab.title.slice(0, 60)}` : 'Saved snippet',
    sourceUrl: tab?.url ?? '',
    savedAt: Date.now(),
  };

  chrome.storage.local.set({ pendingSnippet: pending }, () => {
    chrome.notifications.create('snippet-saved', {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Saved to Waypoint',
      message: `"${text.slice(0, 80)}${text.length > 80 ? '…' : ''}" added to Snippets`,
    });
  });
});

// ── Alarms (GitHub polling) ───────────────────────────────────────────────────
function scheduleAlarm() {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 15 });
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  pollGitHub().catch((err: Error) => {
    Sentry.captureException(err, { tags: { action: 'poll_github' } });
  });
});

/** Set the toolbar badge to the pending-review count (or clear it at 0). */
function setReviewBadge(count: number) {
  if (!chrome.action) return;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  chrome.action.setTitle({
    title:
      count > 0 ? `Waypoint — ${count} PR${count > 1 ? 's' : ''} awaiting your review` : 'Waypoint',
  });
}

/**
 * Remember which notification maps to which URL so a click opens the right
 * thing. Persisted because the service worker can be torn down between the
 * notification firing and the user clicking it.
 */
async function rememberNotificationTarget(id: string, url: string) {
  const { notificationTargets } = await chrome.storage.local.get('notificationTargets');
  const targets = (notificationTargets as Record<string, string>) ?? {};
  targets[id] = url;
  await chrome.storage.local.set({ notificationTargets: targets });
}

interface ReviewPR {
  number: number;
  title: string;
  url: string;
  repo: string;
  updated_at: string;
}

async function pollGitHub() {
  const result = await chrome.storage.local.get([
    'githubAuth',
    'githubToken',
    'notificationsEnabled',
    'lastNotifiedReviewIds',
    'lastNotifiedCI',
  ]);

  // The app persists the PAT under `githubToken`; older builds nested it under
  // `githubAuth.token`. Accept either.
  const token =
    (result.githubToken as string | undefined) ??
    (result.githubAuth as { token?: string } | undefined)?.token;
  const enabled = result.notificationsEnabled !== false; // default true
  if (!token) {
    setReviewBadge(0);
    return;
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const prRes = await fetch(
      'https://api.github.com/search/issues?q=is:open+is:pr+review-requested:@me&sort=updated&per_page=20',
      { headers }
    );
    if (prRes.ok) {
      const data = (await prRes.json()) as {
        items?: Array<{
          number: number;
          title: string;
          html_url: string;
          repository_url: string;
          updated_at: string;
        }>;
      };
      const reviews: ReviewPR[] = (data.items ?? []).map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        repo: pr.repository_url.replace('https://api.github.com/repos/', ''),
        updated_at: pr.updated_at,
      }));

      // Badge + cache update happen regardless of the notifications toggle — the
      // badge is a passive, always-on signal; desktop notifications are opt-out.
      setReviewBadge(reviews.length);
      await chrome.storage.local.set({ reviewRequestsCache: reviews });

      const notified = new Set((result.lastNotifiedReviewIds as string[]) ?? []);
      const fresh = reviews.filter((r) => !notified.has(r.url));

      if (enabled && fresh.length > 0) {
        if (fresh.length === 1) {
          const pr = fresh[0];
          const id = `waypoint-review-${pr.number}`;
          chrome.notifications.create(id, {
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Waypoint — Review requested',
            message: `${pr.repo} #${pr.number}: ${pr.title}`,
          });
          await rememberNotificationTarget(id, pr.url);
        } else {
          const id = 'waypoint-reviews';
          chrome.notifications.create(id, {
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Waypoint — PRs need your review',
            message: `${fresh.length} new pull requests are waiting for your review`,
          });
          await rememberNotificationTarget(id, fresh[0].url);
        }
      }

      // Persist the full current set so PRs that disappear (reviewed/closed) can
      // re-notify if they come back, and already-seen ones stay quiet.
      await chrome.storage.local.set({ lastNotifiedReviewIds: reviews.map((r) => r.url) });
    } else {
      Sentry.captureMessage(`GitHub PR poll returned ${prRes.status}`, {
        level: 'warning',
        tags: { action: 'poll_github_prs' },
      });
    }
  } catch (err) {
    // Network error — capture and continue to CI check
    Sentry.captureException(err, { tags: { action: 'poll_github_prs' } });
  }

  if (!enabled) return; // CI alerts are notification-only; respect the opt-out.

  try {
    const reposResult = await chrome.storage.local.get('githubRepos');
    // The store persists repos with camelCase `fullName`/`url`.
    const repos: Array<{ fullName: string }> =
      (reposResult.githubRepos as Array<{ fullName: string }>) ?? [];

    const failing: string[] = [];
    let firstFailingRunUrl = '';
    for (const repo of repos.slice(0, 5)) {
      if (!repo.fullName) continue;
      const runRes = await fetch(
        `https://api.github.com/repos/${repo.fullName}/actions/runs?per_page=1&branch=main`,
        { headers }
      );
      if (!runRes.ok) continue;
      const { workflow_runs } = await runRes.json();
      const latest = workflow_runs?.[0];
      if (latest?.conclusion === 'failure') {
        failing.push(repo.fullName.split('/')[1] ?? repo.fullName);
        if (!firstFailingRunUrl && latest.html_url) firstFailingRunUrl = latest.html_url;
      }
    }

    if (failing.length > 0) {
      const lastCI = result.lastNotifiedCI ?? '';
      const key = failing.join(',');
      if (key !== lastCI) {
        const id = 'waypoint-ci';
        chrome.notifications.create(id, {
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Waypoint — CI Failure',
          message: `Build failing: ${failing.join(', ')}`,
        });
        if (firstFailingRunUrl) await rememberNotificationTarget(id, firstFailingRunUrl);
        chrome.storage.local.set({ lastNotifiedCI: key });
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { action: 'poll_github_ci' } });
  }
}

// ── Message passing ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // FETCH and API_FETCH are open proxies that run with the extension's host
  // permissions. Only accept messages from our own pages (new tab, palette),
  // never from content scripts running inside arbitrary websites.
  if (!sender.url?.startsWith(chrome.runtime.getURL(''))) return;

  if (msg.type === 'POLL_NOW') {
    pollGitHub()
      .then(() => sendResponse({ ok: true }))
      .catch((err: Error) => {
        Sentry.captureException(err, { tags: { action: 'poll_now' } });
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
  if (msg.type === 'UPDATE_ALARM_INTERVAL') {
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: msg.interval ?? 15 });
    });
    sendResponse({ ok: true });
  }

  // Rich proxy for the in-app API client. Unlike FETCH (which assumes JSON),
  // this returns status, headers, raw text body, and timing — and never throws
  // on non-JSON or error responses.
  if (msg.type === 'API_FETCH') {
    const started = Date.now();
    fetch(msg.url as string, {
      method: (msg.method as string) ?? 'GET',
      headers: (msg.headers as Record<string, string>) ?? {},
      body: (msg.body as string | undefined) ?? undefined,
    })
      .then(async (res) => {
        const text = await res.text();
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          headers[k] = v;
        });
        sendResponse({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          headers,
          body: text,
          size: text.length,
          timeMs: Date.now() - started,
        });
      })
      .catch((err: Error) => {
        sendResponse({ ok: false, error: err.message, timeMs: Date.now() - started });
      });
    return true; // async
  }

  // Proxy fetch through service worker to bypass CORS in extension pages
  if (msg.type === 'FETCH') {
    fetch(msg.url as string, {
      method: msg.method ?? 'GET',
      headers: msg.headers as Record<string, string>,
      body: msg.body ?? undefined,
    })
      .then(async (res) => {
        const data = await res.json();
        sendResponse({ ok: res.ok, status: res.status, data });
      })
      .catch((err: Error) => {
        Sentry.captureException(err, {
          tags: { action: 'background_fetch_proxy' },
          extra: { url: msg.url as string },
        });
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async response
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  void (async () => {
    const { notificationTargets } = await chrome.storage.local.get('notificationTargets');
    const targets = (notificationTargets as Record<string, string>) ?? {};
    const url = targets[notificationId];
    if (url) {
      chrome.tabs.create({ url });
      // Tidy up so the map can't grow unbounded.
      delete targets[notificationId];
      await chrome.storage.local.set({ notificationTargets: targets });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
    chrome.notifications.clear(notificationId);
  })();
});
