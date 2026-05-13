import { create } from 'zustand';
import { storage } from '@/services/storage';
import {
  GitHubApiService,
  type GitHubUser,
  type GitHubPR,
  type GitHubIssue,
  type GitHubNotification,
} from '@/services/githubApi';

interface GitHubAuthState {
  token: string | null;
  user: GitHubUser | null;
  myPRs: GitHubPR[];
  assignedIssues: GitHubIssue[];
  reviewRequests: GitHubPR[];
  notifications: GitHubNotification[];
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean; // true until loadToken() has finished its storage check
  error: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useGitHubAuthStore = create<GitHubAuthState>((set, get) => ({
  token: null,
  user: null,
  myPRs: [],
  assignedIssues: [],
  reviewRequests: [],
  notifications: [],
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadToken: async () => {
    const token = await storage.get<string>('githubToken' as any);
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
      const api = new GitHubApiService(token);
      const user = await api.getUser();
      await storage.set('githubToken' as any, token);
      set({ token, user, isConnected: true, isLoading: false });
      get()
        .refresh()
        .catch(() => {});
    } catch {
      set({
        error: 'Invalid token or network error. Check your PAT and try again.',
        isLoading: false,
      });
    }
  },

  disconnect: async () => {
    await storage.remove('githubToken' as any);
    set({
      token: null,
      user: null,
      myPRs: [],
      assignedIssues: [],
      reviewRequests: [],
      notifications: [],
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const api = new GitHubApiService(token);
      const [user, myPRs, assignedIssues, reviewRequests, notifications] = await Promise.all([
        api.getUser(),
        api.getMyOpenPRs(),
        api.getAssignedIssues(),
        api.getReviewRequests(),
        api.getNotifications(),
      ]);
      set({ user, myPRs, assignedIssues, reviewRequests, notifications, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch GitHub data. Check your connection.', isLoading: false });
    }
  },
}));
