import { create } from 'zustand';
import { storage } from '@/services/storage';
import { analytics } from '@/lib/analytics';
import {
  LinearApiService,
  type LinearUser,
  type LinearIssue,
  type LinearTeam,
  type LinearNotification,
} from '@/services/linearApi';

interface LinearAuthState {
  apiKey: string | null;
  user: LinearUser | null;
  assignedIssues: LinearIssue[];
  inProgressIssues: LinearIssue[];
  createdIssues: LinearIssue[];
  teams: LinearTeam[];
  notifications: LinearNotification[];
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  connect: (apiKey: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadApiKey: () => Promise<void>;
}

export const useLinearAuthStore = create<LinearAuthState>((set, get) => ({
  apiKey: null,
  user: null,
  assignedIssues: [],
  inProgressIssues: [],
  createdIssues: [],
  teams: [],
  notifications: [],
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadApiKey: async () => {
    const apiKey = await storage.get<string>('linearApiKey');
    if (apiKey) {
      set({ apiKey, isConnected: true, isInitializing: false });
      get()
        .refresh()
        .catch(() => {});
    } else {
      set({ isInitializing: false });
    }
  },

  connect: async (apiKey: string) => {
    set({ isLoading: true, error: null });
    analytics.integrationConnectStarted('linear');
    try {
      const api = new LinearApiService(apiKey);
      const user = await api.getViewer();
      await storage.set('linearApiKey', apiKey);
      set({ apiKey, user, isConnected: true, isLoading: false });
      analytics.integrationConnectSuccess('linear');
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      set({
        error: 'Invalid API key or network error. Check your Linear API key and try again.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('linear', reason);
    }
  },

  disconnect: async () => {
    await storage.remove('linearApiKey');
    analytics.integrationDisconnected('linear');
    set({
      apiKey: null,
      user: null,
      assignedIssues: [],
      inProgressIssues: [],
      createdIssues: [],
      teams: [],
      notifications: [],
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { apiKey } = get();
    if (!apiKey) return;
    set({ isLoading: true, error: null });
    try {
      const api = new LinearApiService(apiKey);
      const [user, assignedIssues, inProgressIssues, createdIssues, teams, notifications] =
        await Promise.all([
          api.getViewer(),
          api.getAssignedIssues(),
          api.getInProgressIssues(),
          api.getCreatedIssues(),
          api.getTeams(),
          api.getNotifications(),
        ]);
      set({
        user,
        assignedIssues,
        inProgressIssues,
        createdIssues,
        teams,
        notifications,
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to fetch Linear data. Check your connection.', isLoading: false });
    }
  },
}));
