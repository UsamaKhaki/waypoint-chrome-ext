import { create } from 'zustand';
import { storage } from '@/services/storage';
import { SlackApiService, type SlackUser, type SlackChannel } from '@/services/slackApi';
import type { StorageKey } from '@/types';

// Cast 'slackToken' to StorageKey — will be added to types by the types owner
const SLACK_TOKEN_KEY = 'slackToken' as StorageKey;

interface SlackAuthInfo {
  userId: string;
  userName: string;
  teamName: string;
}

interface SlackAuthState {
  token: string | null;
  authInfo: SlackAuthInfo | null;
  user: SlackUser | null;
  directMessages: SlackChannel[];
  dmUsers: Record<string, SlackUser>; // userId → SlackUser for DM contacts
  unreadConversations: SlackChannel[];
  channels: SlackChannel[];
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
  user: null,
  directMessages: [],
  dmUsers: {},
  unreadConversations: [],
  channels: [],
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
    try {
      const api = new SlackApiService(token);
      const authTest = await api.getAuthTest();
      const authInfo: SlackAuthInfo = {
        userId: authTest.user_id,
        userName: authTest.user,
        teamName: authTest.team,
      };
      // getUser can fail for bot tokens with limited profile scopes — treat as non-fatal
      const user = await api.getUser(authTest.user_id).catch(() => null);
      await storage.set(SLACK_TOKEN_KEY, token);
      set({ token, authInfo, user, isConnected: true, isLoading: false });
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to connect to Slack.',
        isLoading: false,
      });
    }
  },

  disconnect: async () => {
    await storage.remove(SLACK_TOKEN_KEY);
    set({
      token: null,
      authInfo: null,
      user: null,
      directMessages: [],
      dmUsers: {},
      unreadConversations: [],
      channels: [],
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const api = new SlackApiService(token);
      const authTest = await api.getAuthTest();
      const authInfo: SlackAuthInfo = {
        userId: authTest.user_id,
        userName: authTest.user,
        teamName: authTest.team,
      };
      const [user, directMessages, unreadConversations, channels] = await Promise.all([
        api.getUser(authTest.user_id).catch(() => null),
        api.getDirectMessages(),
        api.getUnreadConversations(),
        api.getChannels(),
      ]);
      // Resolve user info for each DM so we can show avatars and names
      const dmUserIds = directMessages.map((ch) => ch.user).filter(Boolean) as string[];
      const dmUsers = await api.getUsers(dmUserIds).catch(() => ({}));
      set({ authInfo, user, directMessages, dmUsers, unreadConversations, channels, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch Slack data.', isLoading: false });
    }
  },
}));
