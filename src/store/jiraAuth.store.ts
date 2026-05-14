import { create } from 'zustand';
import { storage } from '@/services/storage';
import { JiraApiService, type JiraUser, type JiraIssue } from '@/services/jiraApi';

interface JiraCredentials {
  domain: string;
  email: string;
  apiToken: string;
}

interface JiraAuthState {
  credentials: JiraCredentials | null;
  user: JiraUser | null;
  assignedIssues: JiraIssue[];
  inProgressIssues: JiraIssue[];
  reportedIssues: JiraIssue[];
  recentIssues: JiraIssue[];
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  connect: (domain: string, email: string, apiToken: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  loadCredentials: () => Promise<void>;
}

export const useJiraAuthStore = create<JiraAuthState>((set, get) => ({
  credentials: null,
  user: null,
  assignedIssues: [],
  inProgressIssues: [],
  reportedIssues: [],
  recentIssues: [],
  isConnected: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  loadCredentials: async () => {
    const credentials = await storage.get<JiraCredentials>('jiraCredentials');
    if (credentials) {
      set({ credentials, isConnected: true, isInitializing: false });
      get()
        .refresh()
        .catch(() => {});
    } else {
      set({ isInitializing: false });
    }
  },

  connect: async (domain: string, email: string, apiToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const api = new JiraApiService(domain, email, apiToken);
      const user = await api.getUser();
      const credentials = { domain, email, apiToken };
      await storage.set('jiraCredentials', credentials);
      set({ credentials, user, isConnected: true, isLoading: false });
      get()
        .refresh()
        .catch(() => {});
    } catch {
      set({
        error: 'Invalid credentials or domain. Check your details and try again.',
        isLoading: false,
      });
    }
  },

  disconnect: async () => {
    await storage.remove('jiraCredentials');
    set({
      credentials: null,
      user: null,
      assignedIssues: [],
      inProgressIssues: [],
      reportedIssues: [],
      recentIssues: [],
      isConnected: false,
      error: null,
    });
  },

  refresh: async () => {
    const { credentials } = get();
    if (!credentials) return;
    set({ isLoading: true, error: null });
    try {
      const api = new JiraApiService(
        credentials.domain,
        credentials.email,
        credentials.apiToken
      );
      const [user, assignedIssues, inProgressIssues, reportedIssues, recentIssues] =
        await Promise.all([
          api.getUser(),
          api.getAssignedIssues(),
          api.getInProgressIssues(),
          api.getReportedIssues(),
          api.getRecentIssues(),
        ]);
      set({ user, assignedIssues, inProgressIssues, reportedIssues, recentIssues, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch Jira data. Check your connection.', isLoading: false });
    }
  },
}));
