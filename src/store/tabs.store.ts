import { create } from 'zustand';
import type { SavedSession } from '@/types';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

interface TabsState {
  savedSessions: SavedSession[];
  isLoading: boolean;
  load: () => Promise<void>;
  saveSession: (name: string) => Promise<void>;
  restoreSession: (sessionId: string) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  savedSessions: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<SavedSession[]>('savedSessions');
    set({ savedSessions: saved ?? [], isLoading: false });
  },

  saveSession: async (name) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const session: SavedSession = {
      id: generateId(),
      name,
      tabs: tabs.map((t) => ({
        url: t.url ?? '',
        title: t.title ?? '',
        favicon: t.favIconUrl,
      })),
      createdAt: Date.now(),
    };
    const updated = [...get().savedSessions, session];
    set({ savedSessions: updated });
    await storage.set('savedSessions', updated);
  },

  restoreSession: async (sessionId) => {
    const session = get().savedSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.tabs.forEach((t) => chrome.tabs.create({ url: t.url }));
  },

  removeSession: async (sessionId) => {
    const updated = get().savedSessions.filter((s) => s.id !== sessionId);
    set({ savedSessions: updated });
    await storage.set('savedSessions', updated);
  },
}));
