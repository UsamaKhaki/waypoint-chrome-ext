import type { CalendarEvent, CalendarList } from '../../src/services/googleCalendarApi';

const TODAY = new Date().toISOString().split('T')[0];

export const GCAL_MOCKS = {
  userProfile: {
    email: 'test@gmail.com',
    name: 'Test User',
    picture: 'https://example.com/gcal-avatar.png',
  },

  calendars: [
    {
      id: 'primary',
      summary: 'Test User',
      backgroundColor: '#039be5',
      foregroundColor: '#ffffff',
      primary: true,
    },
  ] satisfies CalendarList[],

  events: [
    {
      id: 'event-1',
      summary: 'Daily Standup',
      start: { dateTime: `${TODAY}T09:00:00Z` },
      end: { dateTime: `${TODAY}T09:15:00Z` },
      htmlLink: 'https://calendar.google.com/event?eid=event-1',
      organizer: { email: 'manager@acme.com', displayName: 'Manager' },
      status: 'confirmed',
      attendees: [
        { email: 'test@gmail.com', responseStatus: 'accepted' },
        { email: 'team@acme.com', responseStatus: 'accepted' },
      ],
    },
    {
      id: 'event-2',
      summary: 'Code Review — feat/dark-mode',
      start: { dateTime: `${TODAY}T14:00:00Z` },
      end: { dateTime: `${TODAY}T14:30:00Z` },
      htmlLink: 'https://calendar.google.com/event?eid=event-2',
      organizer: { email: 'test@gmail.com' },
      status: 'confirmed',
      hangoutLink: 'https://meet.google.com/abc-def-ghi',
    },
  ] satisfies CalendarEvent[],
};
