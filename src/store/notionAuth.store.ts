import { create } from 'zustand';
import { storage } from '@/services/storage';
import { NotionApiService, type NotionUser, type NotionPage } from '@/services/notionApi';
import { analytics } from '@/lib/analytics';
import type { StorageKey } from '@/types';

// notionToken is not yet in the StorageKey union; cast to bypass the type check
const NOTION_TOKEN_KEY = 'notionToken' as StorageKey;

interface NotionAuthState {
  token: string | null;
  user: NotionUser | null;
  recentPages: NotionPage[];
  databases: NotionPage[];
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useNotionAuthStore = create<NotionAuthState>((set, get) => ({
  token: null,
  user: null,
  recentPages: [],
  databases: [],
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadToken: async () => {
    const token = await storage.get<string>(NOTION_TOKEN_KEY);
    if (token) {
      set({ token, isConnected: true, isInitializing: false });
      get()
        .refresh()
        .catch((err) => {
          set({ error: err instanceof Error ? err.message : 'Failed to load Notion data.' });
        });
    } else {
      set({ isInitializing: false });
    }
  },

  connect: async (token: string) => {
    set({ isLoading: true, error: null });
    analytics.integrationConnectStarted('notion');
    try {
      const api = new NotionApiService(token);
      const user = await api.getUser();
      await storage.set(NOTION_TOKEN_KEY, token);
      set({ token, user, isConnected: true, isLoading: false });
      analytics.integrationConnectSuccess('notion');
      get()
        .refresh()
        .catch((err) => {
          set({ error: err instanceof Error ? err.message : 'Failed to load pages.' });
        });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      set({
        error: err instanceof Error ? err.message : 'Invalid token. Make sure you copied the full Internal Integration Token.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('notion', reason);
    }
  },

  disconnect: async () => {
    await storage.remove(NOTION_TOKEN_KEY);
    analytics.integrationDisconnected('notion');
    set({
      token: null,
      user: null,
      recentPages: [],
      databases: [],
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const api = new NotionApiService(token);
      const user = await api.getUser();
      // Fetch pages independently so one failure doesn't block the other
      const [recentPages, databases] = await Promise.all([
        api.getRecentPages().catch(() => [] as NotionPage[]),
        api.getDatabases().catch(() => [] as NotionPage[]),
      ]);
      set({ user, recentPages, databases, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Notion data.';
      // Token was revoked or is invalid — reset to disconnected so user can re-enter token
      if (message.includes('invalid') || message.includes('401') || message.includes('unauthorized')) {
        await storage.remove(NOTION_TOKEN_KEY);
        set({ token: null, user: null, recentPages: [], databases: [], isConnected: false, error: message, isLoading: false });
      } else {
        set({ error: message, isLoading: false });
      }
    }
  },
}));
