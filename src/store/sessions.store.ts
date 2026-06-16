import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';
import { logActivity } from '@/store/activity.store';

export interface TabSession {
  id: string;
  name: string;
  tabs: Array<{ url: string; title: string; favIconUrl?: string }>;
  createdAt: number;
  windowCount: number;
}

interface SessionsState {
  sessions: TabSession[];
  isLoading: boolean;
  load: () => Promise<void>;
  saveCurrentTabs: (name: string) => Promise<void>;
  restoreSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  isLoading: false,

  load: async () => {
    const saved = await storage.get<TabSession[]>('sessions');
    set({ sessions: saved ?? [] });
  },

  saveCurrentTabs: async (name: string) => {
    set({ isLoading: true });
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const session: TabSession = {
        id: generateId(),
        name,
        tabs: tabs
          .filter((t) => t.url && !t.url.startsWith('chrome://'))
          .map((t) => ({ url: t.url!, title: t.title ?? t.url!, favIconUrl: t.favIconUrl })),
        createdAt: Date.now(),
        windowCount: 1,
      };
      const sessions = [session, ...get().sessions];
      await storage.set('sessions', sessions);
      set({ sessions, isLoading: false });
      logActivity({
        type: 'session_saved',
        title: session.name,
        context: `${session.tabs.length} tab${session.tabs.length === 1 ? '' : 's'}`,
        dedupeKey: `session:${session.id}`,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  restoreSession: async (id: string) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    for (const tab of session.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
  },

  deleteSession: (id: string) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    storage.set('sessions', sessions);
    set({ sessions });
  },

  renameSession: (id: string, name: string) => {
    const sessions = get().sessions.map((s) => (s.id === id ? { ...s, name } : s));
    storage.set('sessions', sessions);
    set({ sessions });
  },
}));
