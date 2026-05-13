export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  repository_url: string;
  repoName?: string;
  labels: { name: string; color: string }[];
  requested_reviewers: { login: string }[];
  review_comments: number;
  comments: number;
  mergeable_state?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  repository_url: string;
  repoName?: string;
  labels: { name: string; color: string }[];
  comments: number;
  assignees: { login: string; avatar_url: string }[];
}

export interface GitHubNotification {
  id: string;
  reason: string;
  unread: boolean;
  subject: { title: string; type: string; url: string };
  repository: { full_name: string; html_url: string };
  updated_at: string;
}

function repoName(repositoryUrl: string): string {
  return repositoryUrl.replace('https://api.github.com/repos/', '');
}

export class GitHubApiService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  async getUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user');
  }

  async getMyOpenPRs(): Promise<GitHubPR[]> {
    const data = await this.fetch<{ items: GitHubPR[] }>(
      '/search/issues?q=is:open+is:pr+author:@me&sort=updated&per_page=20'
    );
    return data.items.map((pr) => ({ ...pr, repoName: repoName(pr.repository_url) }));
  }

  async getAssignedIssues(): Promise<GitHubIssue[]> {
    const data = await this.fetch<{ items: GitHubIssue[] }>(
      '/search/issues?q=is:open+is:issue+assignee:@me&sort=updated&per_page=20'
    );
    return data.items.map((issue) => ({ ...issue, repoName: repoName(issue.repository_url) }));
  }

  async getReviewRequests(): Promise<GitHubPR[]> {
    const data = await this.fetch<{ items: GitHubPR[] }>(
      '/search/issues?q=is:open+is:pr+review-requested:@me&sort=updated&per_page=20'
    );
    return data.items.map((pr) => ({ ...pr, repoName: repoName(pr.repository_url) }));
  }

  async getNotifications(): Promise<GitHubNotification[]> {
    return this.fetch<GitHubNotification[]>('/notifications?per_page=10');
  }
}
