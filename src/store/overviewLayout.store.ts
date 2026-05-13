import { create } from 'zustand';
import { storage } from '@/services/storage';

export type OverviewSectionId = 'search' | 'quick-apps' | 'nav-cards' | 'github-prs' | 'pinned';

export interface OverviewSectionConfig {
  id: OverviewSectionId;
  label: string;
  visible: boolean;
}

const DEFAULT_LAYOUT: OverviewSectionConfig[] = [
  { id: 'search', label: 'Search Bar', visible: true },
  { id: 'quick-apps', label: 'Quick Apps', visible: true },
  { id: 'nav-cards', label: 'Section Cards', visible: true },
  { id: 'github-prs', label: 'Open Pull Requests', visible: true },
  { id: 'pinned', label: 'Pinned Bookmarks', visible: true },
];

interface OverviewLayoutState {
  sections: OverviewSectionConfig[];
  isLoading: boolean;
  load: () => Promise<void>;
  reorder: (sections: OverviewSectionConfig[]) => Promise<void>;
  toggleVisibility: (id: OverviewSectionId) => Promise<void>;
  reset: () => Promise<void>;
}

export const useOverviewLayoutStore = create<OverviewLayoutState>((set, get) => ({
  sections: DEFAULT_LAYOUT,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<OverviewSectionConfig[]>('overviewLayout');
    if (saved && saved.length > 0) {
      // Merge saved with defaults to handle new sections added in future
      const merged = DEFAULT_LAYOUT.map((def) => {
        const found = saved.find((s) => s.id === def.id);
        return found ? { ...def, visible: found.visible } : def;
      });
      // Preserve saved order
      const orderedIds = saved.map((s) => s.id);
      const ordered = [
        ...(orderedIds
          .map((id) => merged.find((s) => s.id === id))
          .filter(Boolean) as OverviewSectionConfig[]),
        ...merged.filter((s) => !orderedIds.includes(s.id)),
      ];
      set({ sections: ordered, isLoading: false });
    } else {
      set({ sections: DEFAULT_LAYOUT, isLoading: false });
    }
  },

  reorder: async (sections) => {
    set({ sections });
    await storage.set('overviewLayout', sections);
  },

  toggleVisibility: async (id) => {
    const updated = get().sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    set({ sections: updated });
    await storage.set('overviewLayout', updated);
  },

  reset: async () => {
    set({ sections: DEFAULT_LAYOUT });
    await storage.set('overviewLayout', DEFAULT_LAYOUT);
  },
}));
