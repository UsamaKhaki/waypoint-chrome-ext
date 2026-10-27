import { captureApiError } from '@/lib/sentry';
import { backgroundFetch } from './backgroundFetch';

export class SlackApiService {
  private token: string;
  private baseUrl = 'https://slack.com/api';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(
    method: string,
    params?: Record<string, string>,
    _retries = 1
  ): Promise<T> {
    const body = new URLSearchParams({ token: this.token, ...params }).toString();
    let rawData: unknown;
    try {
      rawData = await backgroundFetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err) {
      if (_retries > 0 && err instanceof Error && err.message.includes('429')) {
        await new Promise((r) => setTimeout(r, 1500));
        return this.fetch(method, params, _retries - 1);
      }
      throw err;
    }
    const data = rawData as { ok: boolean; error?: string; retry_after?: number } & T;
    if (!data.ok) {
      if (data.error === 'ratelimited' && _retries > 0) {
        await new Promise((r) => setTimeout(r, (data.retry_after ?? 1) * 1000));
        return this.fetch(method, params, _retries - 1);
      }
      const error = new Error(`Slack error: ${data.error as string}`);
      captureApiError(error, 'slack', { method, slackError: data.error });
      throw error;
    }
    return data as T;
  }

  async getAuthTest(): Promise<{ ok: boolean; user_id: string; user: string; team: string }> {
    return this.fetch('auth.test');
  }

  async getUnreadCount(): Promise<number> {
    const data = await this.fetch<{ channels: Array<{ unread_count?: number }> }>(
      'users.conversations',
      {
        types: 'public_channel,private_channel,im,mpim',
        exclude_archived: 'true',
        limit: '200',
      }
    );
    return data.channels.reduce((sum, ch) => sum + (ch.unread_count ?? 0), 0);
  }
}
