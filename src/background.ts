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

async function pollGitHub() {
  const result = await chrome.storage.local.get([
    'githubAuth',
    'notificationsEnabled',
    'lastNotifiedPRs',
    'lastNotifiedCI',
  ]);

  const token = (result.githubAuth as { token?: string } | undefined)?.token;
  const enabled = result.notificationsEnabled !== false; // default true
  if (!token || !enabled) return;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const prRes = await fetch(
      'https://api.github.com/search/issues?q=is:open+is:pr+review-requested:@me',
      { headers }
    );
    if (prRes.ok) {
      const { total_count } = await prRes.json();
      const last = result.lastNotifiedPRs ?? 0;
      if (total_count > 0 && total_count !== last) {
        chrome.notifications.create('waypoint-prs', {
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Waypoint — PRs need your review',
          message: `You have ${total_count} pull request${total_count > 1 ? 's' : ''} waiting for review`,
        });
        chrome.storage.local.set({ lastNotifiedPRs: total_count });
      }
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

  try {
    const reposResult = await chrome.storage.local.get('githubRepos');
    const repos: Array<{ full_name: string }> =
      (reposResult.githubRepos as Array<{ full_name: string }>) ?? [];

    const failing: string[] = [];
    for (const repo of repos.slice(0, 5)) {
      const runRes = await fetch(
        `https://api.github.com/repos/${repo.full_name}/actions/runs?per_page=1&branch=main`,
        { headers }
      );
      if (!runRes.ok) continue;
      const { workflow_runs } = await runRes.json();
      const latest = workflow_runs?.[0];
      if (latest?.conclusion === 'failure') {
        failing.push(repo.full_name.split('/')[1]);
      }
    }

    if (failing.length > 0) {
      const lastCI = result.lastNotifiedCI ?? '';
      const key = failing.join(',');
      if (key !== lastCI) {
        chrome.notifications.create('waypoint-ci', {
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Waypoint — CI Failure',
          message: `Build failing: ${failing.join(', ')}`,
        });
        chrome.storage.local.set({ lastNotifiedCI: key });
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { action: 'poll_github_ci' } });
  }
}

// ── Message passing ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
