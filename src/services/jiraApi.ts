export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: { '48x48': string };
  active: boolean;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: { key: string; colorName: string };
    };
    priority: { name: string; iconUrl: string } | null;
    assignee: { displayName: string; avatarUrls: { '48x48': string } } | null;
    reporter: { displayName: string; avatarUrls: { '48x48': string } } | null;
    issuetype: { name: string; iconUrl: string };
    project: { key: string; name: string };
    created: string;
    updated: string;
    labels: string[];
    comment: { total: number };
  };
}

const ISSUE_FIELDS =
  'summary,status,priority,assignee,reporter,issuetype,project,created,updated,labels,comment';

import { captureApiError } from '@/lib/sentry';

export class JiraApiService {
  private domain: string;
  private authHeader: string;
  private baseUrl: string;

  constructor(domain: string, email: string, apiToken: string) {
    this.domain = domain;
    this.baseUrl = `https://${domain}.atlassian.net/rest/api/3`;
    this.authHeader = `Basic ${btoa(`${email}:${apiToken}`)}`;
  }

  private async fetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const error = new Error(`Jira API error: ${res.status} ${res.statusText}`);
      captureApiError(error, 'jira', { path, status: res.status, domain: this.domain });
      throw error;
    }
    return res.json() as Promise<T>;
  }

  async getUser(): Promise<JiraUser> {
    return this.fetch<JiraUser>('/myself');
  }

  private async searchIssues(jql: string, maxResults = 20): Promise<JiraIssue[]> {
    const data = await this.fetch<{ issues: JiraIssue[] }>(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${ISSUE_FIELDS}`
    );
    return data.issues;
  }

  async getAssignedIssues(): Promise<JiraIssue[]> {
    return this.searchIssues(
      'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC'
    );
  }

  async getInProgressIssues(): Promise<JiraIssue[]> {
    return this.searchIssues(
      'assignee = currentUser() AND status = "In Progress" ORDER BY updated DESC'
    );
  }

  async getReportedIssues(): Promise<JiraIssue[]> {
    return this.searchIssues(
      'reporter = currentUser() AND statusCategory != Done ORDER BY updated DESC'
    );
  }

  async getRecentIssues(): Promise<JiraIssue[]> {
    return this.searchIssues(
      '(assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC',
      15
    );
  }

  issueUrl(issueKey: string): string {
    return `https://${this.domain}.atlassian.net/browse/${issueKey}`;
  }
}
