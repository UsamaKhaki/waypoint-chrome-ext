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
import { useActivityStore } from './activity.store';

/** Nudge the background worker to refresh the review-request badge now. */
function pokeBadge() {
  try {
    chrome.runtime?.sendMessage?.({ type: 'POLL_NOW' }, () => void chrome.runtime.lastError);
  } catch {
    /* not in an extension context (dev) — ignore */
  }
}

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
      pokeBadge();
      get()
        .refresh()
        .catch(() => {});
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      const isPatLifetime = reason.includes('PAT lifetime') || reason.includes('forbids access');
      set({
        error: isPatLifetime
          ? reason
          : 'Invalid token or network error. Check your PAT and try again.',
        isLoading: false,
      });
      analytics.integrationConnectFailed('github', reason);
    }
  },

  disconnect: async () => {
    await storage.remove('githubToken');
    analytics.integrationDisconnected('github');
    pokeBadge(); // worker sees no token → clears the badge
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

      // Backfill the activity log with merged PRs / closed issues from the last
      // two weeks. Deduped by URL so repeated refreshes don't double-count.
      void (async () => {
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const [merged, closed] = await Promise.allSettled([
          api.getRecentlyMergedPRs(since),
          api.getRecentlyClosedIssues(since),
        ]);
        const batch: Array<{
          type: 'pr_merged' | 'issue_closed';
          title: string;
          url: string;
          context?: string;
          timestamp: number;
          dedupeKey: string;
        }> = [];
        if (merged.status === 'fulfilled') {
          for (const pr of merged.value) {
            batch.push({
              type: 'pr_merged',
              title: pr.title,
              url: pr.html_url,
              context: pr.repoName,
              timestamp: new Date(pr.updated_at).getTime(),
              dedupeKey: `gh:merged:${pr.html_url}`,
            });
          }
        }
        if (closed.status === 'fulfilled') {
          for (const issue of closed.value) {
            batch.push({
              type: 'issue_closed',
              title: issue.title,
              url: issue.html_url,
              context: issue.repoName,
              timestamp: new Date(issue.updated_at).getTime(),
              dedupeKey: `gh:closed:${issue.html_url}`,
            });
          }
        }
        if (batch.length > 0) await useActivityStore.getState().logMany(batch);
      })().catch(() => {});

      // Surface an error only if the core user fetch fails
      if (userRes.status === 'rejected') {
        const msg = userRes.reason instanceof Error ? userRes.reason.message : '';
        partial.error =
          msg.includes('PAT lifetime') || msg.includes('forbids access')
            ? msg
            : 'Failed to fetch GitHub data. Check your connection.';
      }

      set(partial);
    } catch {
      set({ error: 'Failed to fetch GitHub data. Check your connection.', isLoading: false });
    }
  },
}));
