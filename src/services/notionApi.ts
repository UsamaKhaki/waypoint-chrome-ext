export interface NotionUser {
  id: string;
  name: string;
  avatar_url: string | null;
  type: string;
}

export interface NotionPage {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  object: 'page' | 'database';
  title: string;
  icon: { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } } | null;
  parent: { type: string };
}

interface NotionRichText {
  plain_text: string;
}

/** The subset of a Notion search result (page or database) that we read. */
interface NotionSearchResult {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  object: 'page' | 'database';
  title?: NotionRichText[];
  properties?: Record<string, { type: string; title?: NotionRichText[] }>;
  icon?: NotionPage['icon'];
  parent?: { type: string };
}

function extractTitle(result: NotionSearchResult): string {
  if (result.object === 'database') {
    return result.title?.[0]?.plain_text ?? 'Untitled';
  }
  // page: search properties for the title field
  if (result.properties) {
    for (const value of Object.values(result.properties)) {
      if (value.type === 'title') {
        return value.title?.[0]?.plain_text ?? 'Untitled';
      }
    }
  }
  return 'Untitled';
}

function mapPage(result: NotionSearchResult): NotionPage {
  return {
    id: result.id,
    url: result.url,
    created_time: result.created_time,
    last_edited_time: result.last_edited_time,
    object: result.object,
    title: extractTitle(result),
    icon: result.icon ?? null,
    parent: result.parent ?? { type: 'workspace' },
  };
}

import { backgroundFetch } from './backgroundFetch';

export class NotionApiService {
  private headers: Record<string, string>;

  constructor(token: string) {
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };
  }

  private async fetch<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    return backgroundFetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    }) as Promise<T>;
  }

  async getUser(): Promise<NotionUser> {
    return this.fetch<NotionUser>('/users/me');
  }

  async searchPages(query?: string): Promise<NotionPage[]> {
    const body: Record<string, unknown> = {
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 20,
      ...(query ? { query } : {}),
    };
    const data = await this.fetch<{ results: NotionSearchResult[] }>('/search', 'POST', body);
    return data.results.map(mapPage);
  }

  async getDatabases(): Promise<NotionPage[]> {
    const data = await this.fetch<{ results: NotionSearchResult[] }>('/search', 'POST', {
      filter: { value: 'database', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 10,
    });
    return data.results.map(mapPage);
  }

  async getRecentPages(): Promise<NotionPage[]> {
    const data = await this.fetch<{ results: NotionSearchResult[] }>('/search', 'POST', {
      filter: { value: 'page', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 20,
    });
    return data.results.map(mapPage);
  }
}
