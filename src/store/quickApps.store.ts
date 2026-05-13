import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

export interface QuickApp {
  id: string;
  name: string;
  url: string;
  emoji?: string;
  order: number;
}

interface QuickAppsState {
  apps: QuickApp[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (app: Omit<QuickApp, 'id' | 'order'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, updates: Partial<QuickApp>) => Promise<void>;
  reorder: (apps: QuickApp[]) => Promise<void>;
}

const DEFAULT_APPS: QuickApp[] = [
  { id: 'qa-github', name: 'GitHub', url: 'https://github.com', emoji: '🐙', order: 0 },
  { id: 'qa-gmail', name: 'Gmail', url: 'https://mail.google.com', emoji: '📧', order: 1 },
  { id: 'qa-gcal', name: 'Calendar', url: 'https://calendar.google.com', emoji: '📅', order: 2 },
  { id: 'qa-notion', name: 'Notion', url: 'https://notion.so', emoji: '📝', order: 3 },
  { id: 'qa-linear', name: 'Linear', url: 'https://linear.app', emoji: '🔷', order: 4 },
  { id: 'qa-figma', name: 'Figma', url: 'https://figma.com', emoji: '🎨', order: 5 },
  { id: 'qa-slack', name: 'Slack', url: 'https://app.slack.com', emoji: '💬', order: 6 },
  { id: 'qa-vercel', name: 'Vercel', url: 'https://vercel.com', emoji: '▲', order: 7 },
];

export const useQuickAppsStore = create<QuickAppsState>((set, get) => ({
  apps: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<QuickApp[]>('quickApps' as any);
    set({ apps: saved ?? DEFAULT_APPS, isLoading: false });
  },

  add: async (app) => {
    const newApp: QuickApp = { ...app, id: generateId(), order: get().apps.length };
    const updated = [...get().apps, newApp];
    set({ apps: updated });
    await storage.set('quickApps' as any, updated);
  },

  remove: async (id) => {
    const updated = get().apps.filter((a) => a.id !== id);
    set({ apps: updated });
    await storage.set('quickApps' as any, updated);
  },

  update: async (id, updates) => {
    const updated = get().apps.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ apps: updated });
    await storage.set('quickApps' as any, updated);
  },

  reorder: async (apps) => {
    set({ apps });
    await storage.set('quickApps' as any, apps);
  },
}));
