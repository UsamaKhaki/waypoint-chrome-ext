import { create } from 'zustand';
import { storage } from '@/services/storage';
import { SlackApiService } from '@/services/slackApi';
import { analytics } from '@/lib/analytics';
import type { StorageKey } from '@/types';

const SLACK_TOKEN_KEY = 'slackToken' as StorageKey;
const SLACK_CACHE_KEY = 'slackCache' as StorageKey;
const CACHE_TTL = 5 * 60 * 1000;

interface SlackAuthInfo {
  userId: string;
  userName: string;
  teamName: string;
}

interface SlackDashboardCache {
  authInfo: SlackAuthInfo;
  unreadCount: number;
  timestamp: number;
}

interface SlackAuthState {
  token: string | null;
  authInfo: SlackAuthInfo | null;
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useSlackAuthStore = create<SlackAuthState>((set, get) => ({
  token: null,
  authInfo: null,
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadToken: async () => {
    const token = await storage.get<string>(SLACK_TOKEN_KEY);
    if (token) {
      set({ token, isConnected: true, isInitializing: false });
      get()
        .refresh()
        .catch(() => {});
    } else {
      set({ isInitializing: false });
    }
  },

  connect: async (token: string) => {
    set({ isLoading: true, error: null });
    analytics.integrationConnectStarted('slack');
    try {
      const api = new SlackApiService(token);
      const authTest = await api.getAuthTest();
      const authInfo: SlackAuthInfo = {
        userId: authTest.user_id,
        userName: authTest.user,
        teamName: authTest.team,
      };
      await storage.set(SLACK_TOKEN_KEY, token);
      set({ token, authInfo, isConnected: true, isLoading: false });
      analytics.integrationConnectSuccess('slack');
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      set({
        error: err instanceof Error ? err.message : 'Failed to connect to Slack.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('slack', reason);
    }
  },

  disconnect: async () => {
    await Promise.all([storage.remove(SLACK_TOKEN_KEY), storage.remove(SLACK_CACHE_KEY)]);
    analytics.integrationDisconnected('slack');
    set({
      token: null,
      authInfo: null,
      unreadCount: 0,
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const cached = await storage.get<SlackDashboardCache>(SLACK_CACHE_KEY);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        set({ authInfo: cached.authInfo, unreadCount: cached.unreadCount, isLoading: false });
        return;
      }

      const api = new SlackApiService(token);
      const [authTest, unreadCount] = await Promise.all([api.getAuthTest(), api.getUnreadCount()]);
      const authInfo: SlackAuthInfo = {
        userId: authTest.user_id,
        userName: authTest.user,
        teamName: authTest.team,
      };

      await storage.set(SLACK_CACHE_KEY, {
        authInfo,
        unreadCount,
        timestamp: Date.now(),
      } satisfies SlackDashboardCache);
      set({ authInfo, unreadCount, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch Slack data.',
        isLoading: false,
      });
    }
  },
}));
