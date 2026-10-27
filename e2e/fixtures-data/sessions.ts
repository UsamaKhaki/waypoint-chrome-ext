import type { TabSession } from '../../src/store/sessions.store';

// Uses TabSession shape (key: 'sessions', favIconUrl, windowCount)
// matching what SessionsPanel reads via useSessionsStore.
export const SESSION_FIXTURES: TabSession[] = [
  {
    id: 'sess-1',
    name: 'Morning Dev Setup',
    tabs: [
      {
        url: 'https://github.com/testuser/waypoint/pulls',
        title: 'Pull Requests · testuser/waypoint',
        favIconUrl: 'https://github.com/favicon.ico',
      },
      { url: 'http://localhost:3000', title: 'Local Dev Server', favIconUrl: undefined },
      {
        url: 'https://linear.app/team/ENG',
        title: 'Engineering | Linear',
        favIconUrl: 'https://linear.app/favicon.ico',
      },
    ],
    createdAt: Date.now() - 86400000,
    windowCount: 1,
  },
  {
    id: 'sess-2',
    name: 'Code Review',
    tabs: [
      {
        url: 'https://github.com/testuser/waypoint/pull/42',
        title: 'feat: add dark mode toggle #42',
        favIconUrl: 'https://github.com/favicon.ico',
      },
      {
        url: 'https://github.com/testuser/waypoint/pull/41',
        title: 'fix: palette keyboard nav #41',
        favIconUrl: 'https://github.com/favicon.ico',
      },
    ],
    createdAt: Date.now() - 3600000,
    windowCount: 1,
  },
];
