import { create } from 'zustand';
import { storage } from '@/services/storage';
import {
  GitHubApiService,
  type GitHubUser,
  type GitHubPR,
  type GitHubIssue,
  type GitHubNotification,
  type RepoCiStatus,
} from '@/services/githubApi';
import { useGitHubStore } from './github.store';

interface GitHubAuthState {
  token: string | null;
  user: GitHubUser | null;
  myPRs: GitHubPR[];
  assignedIssues: GitHubIssue[];
  reviewRequests: GitHubPR[];
  notifications: GitHubNotification[];
  ciStatus: RepoCiStatus[];
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
  ciStatus: [],
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadToken: async () => {
    const token = await storage.get<string>('githubToken');
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
      await storage.set('githubToken', token);
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
    await storage.remove('githubToken');
    set({
      token: null,
      user: null,
      myPRs: [],
      assignedIssues: [],
      reviewRequests: [],
      notifications: [],
      ciStatus: [],
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
      const repos = useGitHubStore.getState().repos;
      const [user, myPRs, assignedIssues, reviewRequests, notifications, ciStatus] =
        await Promise.all([
          api.getUser(),
          api.getMyOpenPRs(),
          api.getAssignedIssues(),
          api.getReviewRequests(),
          api.getNotifications(),
          api.getAllRepoCiStatus(repos.map((r) => ({ fullName: r.fullName, url: r.url }))),
        ]);
      set({
        user,
        myPRs,
        assignedIssues,
        reviewRequests,
        notifications,
        ciStatus,
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to fetch GitHub data. Check your connection.', isLoading: false });
    }
  },
}));
