import { create } from 'zustand';
import { storage } from '@/services/storage';

export type OverviewSectionId =
  | 'search'
  | 'quick-apps'
  | 'nav-cards'
  | 'github-prs'
  | 'pinned'
  | 'cicd'
  | 'integrations'
  | 'slack-unread'
  | 'linear-issues'
  | 'jira-issues'
  | 'notion-pages'
  | 'calendar-events';

export interface OverviewSectionConfig {
  id: OverviewSectionId;
  label: string;
  visible: boolean;
}

const DEFAULT_LAYOUT: OverviewSectionConfig[] = [
  { id: 'search', label: 'Search Bar', visible: true },
  { id: 'quick-apps', label: 'Quick Apps', visible: true },
  // 'nav-cards' (Section Cards) removed — same destinations are already in the
  // sidebar, so there's no need to duplicate them on the overview.
  { id: 'github-prs', label: 'Open Pull Requests', visible: true },
  { id: 'calendar-events', label: 'Calendar — Today', visible: true },
  { id: 'linear-issues', label: 'Linear Issues', visible: true },
  { id: 'jira-issues', label: 'Jira Issues', visible: true },
  { id: 'slack-unread', label: 'Slack Unread', visible: true },
  { id: 'notion-pages', label: 'Notion — Recent', visible: true },
  { id: 'pinned', label: 'Pinned Bookmarks', visible: true },
  { id: 'cicd', label: 'CI/CD Status', visible: true },
  { id: 'integrations', label: 'Linear & Jira (Pro tease)', visible: false },
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

    // Cross-device sync: pick up layout changes from other Chrome profiles.
    storage.onChange('overviewLayout', (newValue) => {
      if (Array.isArray(newValue)) {
        set({ sections: newValue as OverviewSectionConfig[] });
      }
    });
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
