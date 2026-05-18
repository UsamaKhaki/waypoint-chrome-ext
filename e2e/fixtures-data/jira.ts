import type { JiraUser, JiraIssue } from '../../src/services/jiraApi';

export const JIRA_MOCKS = {
  user: {
    accountId: 'jira-account-1',
    displayName: 'Test User',
    emailAddress: 'test@acme.com',
    avatarUrls: { '48x48': 'https://example.com/avatar.png' },
    active: true,
  } satisfies JiraUser,

  issues: [
    {
      id: '10042',
      key: 'ACME-42',
      fields: {
        summary: 'Integrate Waypoint with Jira',
        status: {
          name: 'In Progress',
          statusCategory: { key: 'indeterminate', colorName: 'yellow' },
        },
        priority: {
          name: 'High',
          iconUrl: 'https://acme.atlassian.net/images/icons/priorities/high.svg',
        },
        assignee: {
          displayName: 'Test User',
          avatarUrls: { '48x48': 'https://example.com/avatar.png' },
        },
        reporter: {
          displayName: 'PM User',
          avatarUrls: { '48x48': 'https://example.com/pm-avatar.png' },
        },
        issuetype: {
          name: 'Story',
          iconUrl: 'https://acme.atlassian.net/images/icons/issuetypes/story.svg',
        },
        project: { key: 'ACME', name: 'Acme Project' },
        created: '2024-01-10T10:00:00.000+0000',
        updated: '2024-01-11T12:00:00.000+0000',
        labels: ['integration'],
        comment: { total: 3 },
      },
    },
  ] satisfies JiraIssue[],
};
