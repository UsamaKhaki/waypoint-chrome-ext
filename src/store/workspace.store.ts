import { create } from 'zustand';
import type { WorkspaceMode, WorkspaceConfig, DailyFocus, FocusItem } from '@/types';
import { storage } from '@/services/storage';
import { WORKSPACE_CONFIGS } from '@/constants';
import { generateId, today } from '@/utils';

interface WorkspaceState {
  currentMode: WorkspaceMode;
  config: WorkspaceConfig;
  dailyFocus: DailyFocus | null;
  isLoading: boolean;
  load: () => Promise<void>;
  setMode: (mode: WorkspaceMode) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  updateGoals: (goals: string) => Promise<void>;
  addPriority: (text: string) => Promise<void>;
  togglePriority: (id: string) => Promise<void>;
  removePriority: (id: string) => Promise<void>;
}

const todayFocus = (): DailyFocus => ({
  date: today(),
  priorities: [],
  notes: '',
  goals: '',
});

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentMode: 'default',
  config: WORKSPACE_CONFIGS['default'],
  dailyFocus: null,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [savedMode, savedFocus] = await Promise.all([
      storage.get<WorkspaceMode>('workspaceMode'),
      storage.get<DailyFocus>('dailyFocus'),
    ]);
    const mode = savedMode ?? 'default';
    const focus = savedFocus?.date === today() ? savedFocus : todayFocus();
    set({
      currentMode: mode,
      config: WORKSPACE_CONFIGS[mode],
      dailyFocus: focus,
      isLoading: false,
    });
  },

  setMode: async (mode) => {
    set({ currentMode: mode, config: WORKSPACE_CONFIGS[mode] });
    await storage.set('workspaceMode', mode);
  },

  updateNotes: async (notes) => {
    const focus = { ...(get().dailyFocus ?? todayFocus()), notes };
    set({ dailyFocus: focus });
    await storage.set('dailyFocus', focus);
  },

  updateGoals: async (goals) => {
    const focus = { ...(get().dailyFocus ?? todayFocus()), goals };
    set({ dailyFocus: focus });
    await storage.set('dailyFocus', focus);
  },

  addPriority: async (text) => {
    const item: FocusItem = { id: generateId(), text, isCompleted: false, createdAt: Date.now() };
    const base = get().dailyFocus ?? todayFocus();
    const focus = { ...base, priorities: [...base.priorities, item] };
    set({ dailyFocus: focus });
    await storage.set('dailyFocus', focus);
  },

  togglePriority: async (id) => {
    const focus = get().dailyFocus ?? todayFocus();
    const updated = {
      ...focus,
      priorities: focus.priorities.map((p) =>
        p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
      ),
    };
    set({ dailyFocus: updated });
    await storage.set('dailyFocus', updated);
  },

  removePriority: async (id) => {
    const focus = get().dailyFocus ?? todayFocus();
    const updated = {
      ...focus,
      priorities: focus.priorities.filter((p) => p.id !== id),
    };
    set({ dailyFocus: updated });
    await storage.set('dailyFocus', updated);
  },
}));
