import { create } from 'zustand';
import type {
  WorkspaceMode,
  WorkspaceConfig,
  DailyFocus,
  FocusItem,
  CustomWorkspaceMode,
} from '@/types';
import { storage } from '@/services/storage';
import { WORKSPACE_CONFIGS } from '@/constants';
import { generateId, today } from '@/utils';
import { logActivity } from '@/store/activity.store';

interface WorkspaceState {
  currentMode: WorkspaceMode;
  config: WorkspaceConfig;
  customModes: CustomWorkspaceMode[];
  dailyFocus: DailyFocus | null;
  isLoading: boolean;
  load: () => Promise<void>;
  setMode: (mode: WorkspaceMode) => Promise<void>;
  addCustomMode: (mode: Omit<CustomWorkspaceMode, 'id'>) => Promise<CustomWorkspaceMode>;
  updateCustomMode: (id: string, patch: Partial<CustomWorkspaceMode>) => Promise<void>;
  removeCustomMode: (id: string) => Promise<void>;
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

/**
 * Resolve a mode id to a WorkspaceConfig. Custom modes use the default
 * "show everything" baseline; their custom hide-lists are read separately
 * by the sidebar / overview consumers.
 */
function configForMode(mode: WorkspaceMode, customModes: CustomWorkspaceMode[]): WorkspaceConfig {
  if (WORKSPACE_CONFIGS[mode]) return WORKSPACE_CONFIGS[mode];
  if (customModes.some((m) => m.id === mode)) return WORKSPACE_CONFIGS.default;
  return WORKSPACE_CONFIGS.default;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentMode: 'default',
  config: WORKSPACE_CONFIGS['default'],
  customModes: [],
  dailyFocus: null,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [savedMode, savedFocus, savedCustomModes] = await Promise.all([
      storage.get<WorkspaceMode>('workspaceMode'),
      storage.get<DailyFocus>('dailyFocus'),
      storage.get<CustomWorkspaceMode[]>('customWorkspaceModes'),
    ]);
    const customModes = savedCustomModes ?? [];
    // Saved mode may point at a custom mode that was deleted on another device
    // — fall back to default in that case.
    const allModes = new Set<string>([
      ...Object.keys(WORKSPACE_CONFIGS),
      ...customModes.map((m) => m.id),
    ]);
    const mode = savedMode && allModes.has(savedMode) ? savedMode : 'default';
    const focus = savedFocus?.date === today() ? savedFocus : todayFocus();
    set({
      currentMode: mode,
      config: configForMode(mode, customModes),
      customModes,
      dailyFocus: focus,
      isLoading: false,
    });

    // Hot-reload when other devices change synced workspace state.
    storage.onChange('workspaceMode', (newValue) => {
      if (typeof newValue === 'string') {
        set({
          currentMode: newValue,
          config: configForMode(newValue, get().customModes),
        });
      }
    });
    storage.onChange('customWorkspaceModes', (newValue) => {
      if (Array.isArray(newValue)) {
        const next = newValue as CustomWorkspaceMode[];
        set({
          customModes: next,
          config: configForMode(get().currentMode, next),
        });
      }
    });
  },

  setMode: async (mode) => {
    set({ currentMode: mode, config: configForMode(mode, get().customModes) });
    await storage.set('workspaceMode', mode);
  },

  addCustomMode: async (input) => {
    const newMode: CustomWorkspaceMode = { id: `custom-${generateId()}`, ...input };
    const next = [...get().customModes, newMode];
    set({ customModes: next });
    await storage.set('customWorkspaceModes', next);
    return newMode;
  },

  updateCustomMode: async (id, patch) => {
    const next = get().customModes.map((m) => (m.id === id ? { ...m, ...patch } : m));
    set({ customModes: next });
    await storage.set('customWorkspaceModes', next);
  },

  removeCustomMode: async (id) => {
    const next = get().customModes.filter((m) => m.id !== id);
    set({ customModes: next });
    await storage.set('customWorkspaceModes', next);
    // If the deleted mode was the active one, fall back to default.
    if (get().currentMode === id) {
      await get().setMode('default');
    }
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
    const target = focus.priorities.find((p) => p.id === id);
    const updated = {
      ...focus,
      priorities: focus.priorities.map((p) =>
        p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
      ),
    };
    set({ dailyFocus: updated });
    await storage.set('dailyFocus', updated);
    // Log the transition into "done" (not un-checking) so the activity feed and
    // standup digest can report what actually got finished.
    if (target && !target.isCompleted) {
      logActivity({
        type: 'priority_completed',
        title: target.text,
        context: 'Daily focus',
        dedupeKey: `priority:${target.id}`,
      });
    }
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
