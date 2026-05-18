import type {
  LinearUser,
  LinearIssue,
  LinearTeam,
  LinearNotification,
} from '../../src/services/linearApi';

export const LINEAR_MOCKS = {
  viewer: {
    id: 'user-lin-1',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    url: 'https://linear.app/testuser',
  } satisfies LinearUser,

  assignedIssues: [
    {
      id: 'issue-lin-1',
      identifier: 'ENG-42',
      title: 'Implement keyboard shortcuts for sidebar navigation',
      url: 'https://linear.app/team/ENG-42',
      priority: 2,
      priorityLabel: 'High',
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-11T12:00:00.000Z',
      state: { name: 'In Progress', color: '#4ea7fc', type: 'started' },
      team: { name: 'Engineering', key: 'ENG' },
      labels: { nodes: [{ name: 'feature', color: '#26b5ce' }] },
      assignee: { name: 'Test User', avatarUrl: null },
    },
  ] satisfies LinearIssue[],

  inProgressIssues: [
    {
      id: 'issue-lin-1',
      identifier: 'ENG-42',
      title: 'Implement keyboard shortcuts for sidebar navigation',
      url: 'https://linear.app/team/ENG-42',
      priority: 2,
      priorityLabel: 'High',
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-11T12:00:00.000Z',
      state: { name: 'In Progress', color: '#4ea7fc', type: 'started' },
      team: { name: 'Engineering', key: 'ENG' },
      labels: { nodes: [] },
      assignee: { name: 'Test User', avatarUrl: null },
    },
  ] satisfies LinearIssue[],

  createdIssues: [] as LinearIssue[],

  teams: [
    {
      id: 'team-1',
      name: 'Engineering',
      key: 'ENG',
      issueCount: 15,
      inProgressIssues: 3,
      completedIssues: 42,
    },
  ] satisfies LinearTeam[],

  notifications: [] as LinearNotification[],
};
