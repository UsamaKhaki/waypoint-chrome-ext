import { create } from 'zustand';
import { storage } from '@/services/storage';
import { analytics } from '@/lib/analytics';
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
    analytics.integrationConnectStarted('github');
    try {
      const api = new GitHubApiService(token);
      const user = await api.getUser();
      await storage.set('githubToken', token);
      set({ token, user, isConnected: true, isLoading: false });
      analytics.integrationConnectSuccess('github');
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      set({
        error: 'Invalid token or network error. Check your PAT and try again.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('github', reason);
    }
  },

  disconnect: async () => {
    await storage.remove('githubToken');
    analytics.integrationDisconnected('github');
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
      const [userRes, myPRsRes, assignedRes, reviewsRes, notificationsRes, ciRes] =
        await Promise.allSettled([
          api.getUser(),
          api.getMyOpenPRs(),
          api.getAssignedIssues(),
          api.getReviewRequests(),
          api.getNotifications(),
          api.getAllRepoCiStatus(repos.map((r) => ({ fullName: r.fullName, url: r.url }))),
        ]);

      const partial: Partial<GitHubAuthState> = { isLoading: false };
      if (userRes.status === 'fulfilled') partial.user = userRes.value;
      if (myPRsRes.status === 'fulfilled') partial.myPRs = myPRsRes.value;
      if (assignedRes.status === 'fulfilled') partial.assignedIssues = assignedRes.value;
      if (reviewsRes.status === 'fulfilled') partial.reviewRequests = reviewsRes.value;
      if (notificationsRes.status === 'fulfilled') partial.notifications = notificationsRes.value;
      if (ciRes.status === 'fulfilled') partial.ciStatus = ciRes.value;

      // Surface an error only if the core user fetch fails
      if (userRes.status === 'rejected') {
        partial.error = 'Failed to fetch GitHub data. Check your connection.';
      }

      set(partial);
    } catch {
      set({ error: 'Failed to fetch GitHub data. Check your connection.', isLoading: false });
    }
  },
}));
