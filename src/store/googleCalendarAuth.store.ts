import { create } from 'zustand';
import { storage } from '@/services/storage';
import {
  GoogleCalendarApiService,
  type CalendarEvent,
  type CalendarList,
} from '@/services/googleCalendarApi';
import { analytics } from '@/lib/analytics';
import type { StorageKey } from '@/types';

function extractToken(result: chrome.identity.GetAuthTokenResult): string | undefined {
  if (typeof result === 'string') return result || undefined;
  return undefined;
}

function getIdentityApi(): typeof chrome.identity | null {
  try {
    return typeof chrome !== 'undefined' && chrome?.identity ? chrome.identity : null;
  } catch {
    return null;
  }
}

// Cast to StorageKey — 'googleCalendarConnected' will be added to types by another contributor
const STORAGE_KEY = 'googleCalendarConnected' as StorageKey;

interface GoogleCalendarAuthState {
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  userProfile: { email: string; name: string; picture: string } | null;
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  calendars: CalendarList[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadConnection: () => Promise<void>;
}

export const useGoogleCalendarAuthStore = create<GoogleCalendarAuthState>((set, get) => ({
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  userProfile: null,
  todayEvents: [],
  upcomingEvents: [],
  calendars: [],

  loadConnection: async () => {
    const connected = await storage.get<boolean>(STORAGE_KEY);
    if (connected) {
      set({ isConnected: true, isInitializing: false });
      get()
        .refresh()
        .catch(() => {});
    } else {
      set({ isInitializing: false });
    }
  },

  connect: async () => {
    const identity = getIdentityApi();
    if (!identity) {
      set({ error: 'chrome.identity is not available. Load the extension via chrome://extensions first.', isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    analytics.integrationConnectStarted('google_calendar');
    try {
      // MV3: scopes come from manifest oauth2.scopes — do not pass them here
      const token = await new Promise<string>((resolve, reject) => {
        identity.getAuthToken({ interactive: true }, (result) => {
          const token = extractToken(result);
          if (chrome.runtime.lastError || !token) {
            reject(new Error(chrome.runtime.lastError?.message ?? 'Auth cancelled or failed'));
          } else {
            resolve(token);
          }
        });
      });

      const api = new GoogleCalendarApiService(token);
      const userProfile = await api.getUserProfile();
      await storage.set(STORAGE_KEY, true);
      set({ isConnected: true, isLoading: false, userProfile });
      analytics.integrationConnectSuccess('google_calendar');
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      set({
        error: err instanceof Error ? err.message : 'Failed to connect to Google Calendar.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('google_calendar', reason);
    }
  },

  disconnect: async () => {
    analytics.integrationDisconnected('google_calendar');
    const identity = getIdentityApi();
    if (identity) {
      const token = await new Promise<string | null>((resolve) => {
        identity.getAuthToken({ interactive: false }, (result) => resolve(extractToken(result) ?? null));
      });
      if (token) {
        identity.removeCachedAuthToken({ token }, () => {});
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
      }
    }
    await storage.remove(STORAGE_KEY);
    set({
      isConnected: false,
      userProfile: null,
      todayEvents: [],
      upcomingEvents: [],
      calendars: [],
      error: null,
    });
  },

  refresh: async () => {
    const identity = getIdentityApi();
    if (!identity) {
      set({ error: 'chrome.identity is not available.', isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const token = await new Promise<string>((resolve, reject) => {
        identity.getAuthToken({ interactive: false }, (result) => {
          const t = extractToken(result);
          if (!t) reject(new Error('Not authenticated'));
          else resolve(t);
        });
      });
      const api = new GoogleCalendarApiService(token);
      const [userProfile, todayEvents, upcomingEvents, calendars] = await Promise.all([
        api.getUserProfile(),
        api.getTodayEvents(),
        api.getUpcomingEvents(),
        api.getCalendars(),
      ]);
      set({ userProfile, todayEvents, upcomingEvents, calendars, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch calendar data. Check your connection.', isLoading: false });
    }
  },
}));
