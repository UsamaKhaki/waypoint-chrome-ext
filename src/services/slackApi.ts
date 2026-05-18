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
import { backgroundFetch } from './backgroundFetch';

export class SlackApiService {
  private token: string;
  private baseUrl = 'https://slack.com/api';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(method: string, params?: Record<string, string>): Promise<T> {
    const body = new URLSearchParams({ token: this.token, ...params }).toString();
    const data = (await backgroundFetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })) as { ok: boolean; error?: string } & T;
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
    // `conversations.list` doesn't return unread counts — that field only
    // comes back from `users.conversations` (which returns the conversations
    // the calling user belongs to, with `unread_count` and `unread_count_display`).
    // Fall back to per-conversation `conversations.info` for the unread fields
    // since some workspaces don't expose `unread_count` on the list response.
    const data = await this.fetch<{ channels: SlackChannel[] }>('users.conversations', {
      types: 'public_channel,private_channel,im,mpim',
      exclude_archived: 'true',
      limit: '200',
    });
    const candidates = data.channels;

    // For any channel missing an unread_count, fetch its `conversations.info`
    // and merge the unread metadata. We cap the fan-out to avoid hammering
    // the API on huge workspaces.
    const needsInfo = candidates.filter((ch) => ch.unread_count === undefined).slice(0, 50);
    const infoResults = await Promise.allSettled(
      needsInfo.map((ch) =>
        this.fetch<{ channel: SlackChannel }>('conversations.info', {
          channel: ch.id,
          include_num_members: 'false',
        }).then((r) => r.channel)
      )
    );
    const byId: Record<string, SlackChannel> = {};
    infoResults.forEach((r, i) => {
      if (r.status === 'fulfilled') byId[needsInfo[i].id] = r.value;
    });
    const merged = candidates.map((ch) => ({ ...ch, ...(byId[ch.id] ?? {}) }));
    return merged.filter((ch) => (ch.unread_count ?? 0) > 0);
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
