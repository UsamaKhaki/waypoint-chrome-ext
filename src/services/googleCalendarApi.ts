export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink: string;
  colorId?: string;
  attendees?: { email: string; displayName?: string; responseStatus: string }[];
  organizer: { email: string; displayName?: string };
  status: string;
  hangoutLink?: string;
}

export interface CalendarList {
  id: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string;
  primary?: boolean;
}

import { captureApiError } from '@/lib/sentry';

export class GoogleCalendarApiService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      const error = new Error(`Google Calendar API error: ${res.status}`);
      captureApiError(error, 'google_calendar', { status: res.status });
      throw error;
    }
    return res.json() as Promise<T>;
  }

  async getCalendars(): Promise<CalendarList[]> {
    const data = await this.fetch<{ items: CalendarList[] }>(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList'
    );
    return data.items;
  }

  async getTodayEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    ).toISOString();
    const data = await this.fetch<{ items: CalendarEvent[] }>(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime&maxResults=20`
    );
    return data.items ?? [];
  }

  async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const data = await this.fetch<{ items: CalendarEvent[] }>(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(weekFromNow)}&singleEvents=true&orderBy=startTime&maxResults=20`
    );
    return data.items ?? [];
  }

  async getUserProfile(): Promise<{ email: string; name: string; picture: string }> {
    const data = await this.fetch<{ email: string; name: string; picture: string }>(
      'https://www.googleapis.com/oauth2/v2/userinfo'
    );
    return { email: data.email, name: data.name, picture: data.picture };
  }
}
