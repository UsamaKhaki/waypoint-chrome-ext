export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  url: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: number;
  priorityLabel: string;
  createdAt: string;
  updatedAt: string;
  state: { name: string; color: string; type: string };
  team: { name: string; key: string };
  labels: { nodes: { name: string; color: string }[] };
  assignee: { name: string; avatarUrl: string | null } | null;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  issueCount: number;
  inProgressIssues: number;
  completedIssues: number;
}

export interface LinearNotification {
  id: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  issue: { id: string; identifier: string; title: string; url: string } | null;
}

export class LinearApiService {
  private apiKey: string;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data as T;
  }

  async getViewer(): Promise<LinearUser> {
    const data = await this.query<{ viewer: LinearUser }>(`
      query {
        viewer {
          id name email avatarUrl url
        }
      }
    `);
    return data.viewer;
  }

  async getAssignedIssues(): Promise<LinearIssue[]> {
    const data = await this.query<{ viewer: { assignedIssues: { nodes: LinearIssue[] } } }>(`
      query {
        viewer {
          assignedIssues(first: 25, filter: { state: { type: { nin: ["completed", "cancelled"] } } }) {
            nodes {
              id identifier title url priority priorityLabel createdAt updatedAt
              state { name color type }
              team { name key }
              labels { nodes { name color } }
              assignee { name avatarUrl }
            }
          }
        }
      }
    `);
    return data.viewer.assignedIssues.nodes;
  }

  async getInProgressIssues(): Promise<LinearIssue[]> {
    const data = await this.query<{ viewer: { assignedIssues: { nodes: LinearIssue[] } } }>(`
      query {
        viewer {
          assignedIssues(first: 25, filter: { state: { type: { eq: "started" } } }) {
            nodes {
              id identifier title url priority priorityLabel createdAt updatedAt
              state { name color type }
              team { name key }
              labels { nodes { name color } }
              assignee { name avatarUrl }
            }
          }
        }
      }
    `);
    return data.viewer.assignedIssues.nodes;
  }

  async getCreatedIssues(): Promise<LinearIssue[]> {
    const data = await this.query<{ viewer: { createdIssues: { nodes: LinearIssue[] } } }>(`
      query {
        viewer {
          createdIssues(first: 25, filter: { state: { type: { nin: ["completed", "cancelled"] } } }) {
            nodes {
              id identifier title url priority priorityLabel createdAt updatedAt
              state { name color type }
              team { name key }
              labels { nodes { name color } }
              assignee { name avatarUrl }
            }
          }
        }
      }
    `);
    return data.viewer.createdIssues.nodes;
  }

  async getTeams(): Promise<LinearTeam[]> {
    const data = await this.query<{ teams: { nodes: { id: string; name: string; key: string; issues: { nodes: { state: { type: string } }[] } }[] } }>(`
      query {
        teams(first: 10) {
          nodes {
            id name key
            issues(first: 50) {
              nodes { state { type } }
            }
          }
        }
      }
    `);
    return data.teams.nodes.map((team) => ({
      id: team.id,
      name: team.name,
      key: team.key,
      issueCount: team.issues.nodes.length,
      inProgressIssues: team.issues.nodes.filter((i) => i.state.type === 'started').length,
      completedIssues: team.issues.nodes.filter((i) => i.state.type === 'completed').length,
    }));
  }

  async getNotifications(): Promise<LinearNotification[]> {
    const data = await this.query<{ notifications: { nodes: LinearNotification[] } }>(`
      query {
        notifications(first: 20) {
          nodes {
            id type readAt createdAt updatedAt
            ... on IssueNotification {
              issue { id identifier title url }
            }
          }
        }
      }
    `);
    return data.notifications.nodes;
  }
}
