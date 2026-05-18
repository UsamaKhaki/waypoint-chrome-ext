import type {
  GitHubUser,
  GitHubPR,
  GitHubIssue,
  GitHubNotification,
  WorkflowRun,
} from '../../src/services/githubApi';

export const GITHUB_MOCKS = {
  user: {
    login: 'testuser',
    name: 'Test User',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    html_url: 'https://github.com/testuser',
    public_repos: 42,
    followers: 100,
  } satisfies GitHubUser,

  myPRs: [
    {
      id: 1001,
      number: 42,
      title: 'feat: add dark mode toggle',
      html_url: 'https://github.com/testuser/waypoint/pull/42',
      state: 'open',
      draft: false,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-11T12:00:00Z',
      user: { login: 'testuser', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
      repository_url: 'https://api.github.com/repos/testuser/waypoint',
      repoName: 'testuser/waypoint',
      labels: [{ name: 'enhancement', color: '84b6eb' }],
      requested_reviewers: [{ login: 'reviewer1' }],
      review_comments: 2,
      comments: 3,
    },
  ] satisfies GitHubPR[],

  assignedIssues: [
    {
      id: 2001,
      number: 17,
      title: 'Fix command palette keyboard navigation',
      html_url: 'https://github.com/testuser/waypoint/issues/17',
      state: 'open',
      created_at: '2024-01-09T09:00:00Z',
      updated_at: '2024-01-10T11:00:00Z',
      user: { login: 'maintainer', avatar_url: 'https://avatars.githubusercontent.com/u/2' },
      repository_url: 'https://api.github.com/repos/testuser/waypoint',
      repoName: 'testuser/waypoint',
      labels: [{ name: 'bug', color: 'd73a4a' }],
      comments: 1,
      assignees: [{ login: 'testuser', avatar_url: 'https://avatars.githubusercontent.com/u/1' }],
    },
  ] satisfies GitHubIssue[],

  reviewRequests: [] satisfies GitHubPR[],

  notifications: [
    {
      id: 'notif-1',
      reason: 'review_requested',
      unread: true,
      subject: {
        title: 'feat: new sidebar layout',
        type: 'PullRequest',
        url: 'https://api.github.com/repos/testuser/waypoint/pulls/55',
      },
      repository: {
        full_name: 'testuser/waypoint',
        html_url: 'https://github.com/testuser/waypoint',
      },
      updated_at: '2024-01-11T08:00:00Z',
    },
  ] satisfies GitHubNotification[],

  workflowRuns: [
    {
      id: 9001,
      name: 'CI',
      status: 'completed',
      conclusion: 'success',
      html_url: 'https://github.com/testuser/waypoint/actions/runs/9001',
      created_at: '2024-01-11T07:00:00Z',
      updated_at: '2024-01-11T07:15:00Z',
      head_branch: 'main',
      head_sha: 'abc123def456',
      run_number: 42,
      repository: {
        full_name: 'testuser/waypoint',
        html_url: 'https://github.com/testuser/waypoint',
      },
      actor: { login: 'testuser', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
    },
  ] satisfies WorkflowRun[],
};
