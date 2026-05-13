import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

export type WidgetType =
  | 'clock'
  | 'goals'
  | 'pomodoro'
  | 'github-prs'
  | 'cicd'
  | 'quick-stats'
  | 'jira'
  | 'linear'
  | 'calendar';

export type WidgetSize = 'sm' | 'md' | 'lg';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: number;
  visible: boolean;
}

export const WIDGET_META: Record<
  WidgetType,
  { label: string; description: string; defaultSize: WidgetSize; isPro: boolean; icon: string }
> = {
  clock: {
    label: 'Clock',
    description: 'Live digital clock and date',
    defaultSize: 'sm',
    isPro: false,
    icon: '🕐',
  },
  goals: {
    label: "Today's Goals",
    description: 'Your daily priorities and progress',
    defaultSize: 'md',
    isPro: false,
    icon: '🎯',
  },
  pomodoro: {
    label: 'Pomodoro',
    description: '25-minute focus timer',
    defaultSize: 'sm',
    isPro: false,
    icon: '⏱',
  },
  'github-prs': {
    label: 'GitHub PRs',
    description: 'Your open pull requests',
    defaultSize: 'md',
    isPro: false,
    icon: '⎇',
  },
  cicd: {
    label: 'CI/CD Status',
    description: 'Build status across your repos',
    defaultSize: 'md',
    isPro: false,
    icon: '✓',
  },
  'quick-stats': {
    label: 'Quick Stats',
    description: 'Snippet count, session count, PR count',
    defaultSize: 'sm',
    isPro: false,
    icon: '📊',
  },
  jira: {
    label: 'Jira',
    description: 'Assigned tickets from your board',
    defaultSize: 'md',
    isPro: true,
    icon: '📋',
  },
  linear: {
    label: 'Linear',
    description: 'Assigned Linear issues',
    defaultSize: 'md',
    isPro: true,
    icon: '◆',
  },
  calendar: {
    label: 'Calendar',
    description: "Today's meetings and events",
    defaultSize: 'md',
    isPro: true,
    icon: '📅',
  },
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w-clock', type: 'clock', size: 'sm', position: 0, visible: true },
  { id: 'w-pomodoro', type: 'pomodoro', size: 'sm', position: 1, visible: true },
  { id: 'w-goals', type: 'goals', size: 'md', position: 2, visible: true },
  { id: 'w-gh-prs', type: 'github-prs', size: 'md', position: 3, visible: true },
  { id: 'w-cicd', type: 'cicd', size: 'md', position: 4, visible: true },
  { id: 'w-stats', type: 'quick-stats', size: 'sm', position: 5, visible: true },
];

interface WidgetsState {
  widgets: WidgetConfig[];
  load: () => Promise<void>;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (ids: string[]) => void;
  resizeWidget: (id: string, size: WidgetSize) => void;
}

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  widgets: DEFAULT_WIDGETS,

  load: async () => {
    const saved = await storage.get<WidgetConfig[]>('widgets');
    if (saved && saved.length > 0) set({ widgets: saved });
  },

  addWidget: (type) => {
    const existing = get().widgets.find((w) => w.type === type);
    if (existing) return;
    const meta = WIDGET_META[type];
    const widget: WidgetConfig = {
      id: generateId(),
      type,
      size: meta.defaultSize,
      position: get().widgets.length,
      visible: true,
    };
    const widgets = [...get().widgets, widget];
    storage.set('widgets', widgets);
    set({ widgets });
  },

  removeWidget: (id) => {
    const widgets = get()
      .widgets.filter((w) => w.id !== id)
      .map((w, i) => ({ ...w, position: i }));
    storage.set('widgets', widgets);
    set({ widgets });
  },

  reorderWidgets: (ids) => {
    const map = new Map(get().widgets.map((w) => [w.id, w]));
    const widgets = ids
      .filter((id) => map.has(id))
      .map((id, i) => ({ ...map.get(id)!, position: i }));
    storage.set('widgets', widgets);
    set({ widgets });
  },

  resizeWidget: (id, size) => {
    const widgets = get().widgets.map((w) => (w.id === id ? { ...w, size } : w));
    storage.set('widgets', widgets);
    set({ widgets });
  },
}));
