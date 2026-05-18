import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { storage } from '@/services/storage';
import { DEFAULT_SETTINGS } from '@/constants';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  load: () => Promise<void>;
  update: (updates: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<AppSettings>('settings');
    set({ settings: { ...DEFAULT_SETTINGS, ...saved }, isLoading: false });

    // Pick up settings changes from other Chrome profiles (synced).
    storage.onChange('settings', (newValue) => {
      if (newValue && typeof newValue === 'object') {
        set({ settings: { ...DEFAULT_SETTINGS, ...(newValue as Partial<AppSettings>) } });
      }
    });
  },

  update: async (updates) => {
    let next: AppSettings = DEFAULT_SETTINGS;
    set((s) => {
      next = { ...s.settings, ...updates };
      return { settings: next };
    });
    await storage.set('settings', next);
  },

  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await storage.set('settings', DEFAULT_SETTINGS);
  },
}));
