export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    display_name: string;
    image_48: string;
    email: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_im: boolean;
  is_mpim: boolean;
  user?: string; // for IM channels: the other person's user ID
  unread_count?: number;
  latest?: {
    text: string;
    ts: string;
  };
}

export interface SlackMessage {
  type: string;
  text: string;
  user: string;
  ts: string;
  files?: unknown[];
}

import { captureApiError } from '@/lib/sentry';

export class SlackApiService {
  private token: string;
  private baseUrl = 'https://slack.com/api';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(method: string, params?: Record<string, string>): Promise<T> {
    // Use POST + application/x-www-form-urlencoded (CORS simple request — no preflight)
    const body = new URLSearchParams({ token: this.token, ...params });
    const res = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      body,
    });
    const data = await res.json();
    if (!data.ok) {
      const error = new Error(`Slack error: ${data.error as string}`);
      captureApiError(error, 'slack', { method, slackError: data.error });
      throw error;
    }
    return data as T;
  }

  async getAuthTest(): Promise<{ ok: boolean; user_id: string; user: string; team: string }> {
    return this.fetch('auth.test');
  }

  async getUser(userId: string): Promise<SlackUser> {
    const data = await this.fetch<{ user: SlackUser }>('users.info', { user: userId });
    return data.user;
  }

  async getUsers(userIds: string[]): Promise<Record<string, SlackUser>> {
    const results = await Promise.allSettled(userIds.map((id) => this.getUser(id)));
    const map: Record<string, SlackUser> = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') map[userIds[i]] = r.value;
    });
    return map;
  }

  async getDirectMessages(): Promise<SlackChannel[]> {
    const data = await this.fetch<{ channels: SlackChannel[] }>('conversations.list', {
      types: 'im',
      exclude_archived: 'true',
      limit: '10',
    });
    return data.channels;
  }

  async getUnreadConversations(): Promise<SlackChannel[]> {
    const data = await this.fetch<{ channels: SlackChannel[] }>('conversations.list', {
      types: 'public_channel,im',
      exclude_archived: 'true',
      limit: '50',
    });
    return data.channels.filter((ch) => (ch.unread_count ?? 0) > 0);
  }

  async getChannels(): Promise<SlackChannel[]> {
    const data = await this.fetch<{ channels: SlackChannel[] }>('conversations.list', {
      types: 'public_channel',
      exclude_archived: 'true',
      limit: '20',
    });
    return data.channels;
  }
}
