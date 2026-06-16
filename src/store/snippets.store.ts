import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';
import { logActivity } from '@/store/activity.store';

export type SnippetCategory = 'terminal' | 'api' | 'sql' | 'git' | 'docker' | 'other';

export interface Snippet {
  id: string;
  title: string;
  content: string;
  category: SnippetCategory;
  description?: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  lastUsedAt?: number;
  usageCount: number;
}

export const SNIPPET_CATEGORIES: Record<
  SnippetCategory,
  { label: string; color: string; icon: string }
> = {
  terminal: { label: 'Terminal', color: '#22c55e', icon: '>' },
  api: { label: 'API', color: '#3b82f6', icon: '~' },
  sql: { label: 'SQL', color: '#f59e0b', icon: '#' },
  git: { label: 'Git', color: '#a78bfa', icon: '$' },
  docker: { label: 'Docker', color: '#06b6d4', icon: '□' },
  other: { label: 'Other', color: '#94a3b8', icon: '*' },
};

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'snip-1',
    title: 'List all Docker containers',
    content: 'docker ps -a',
    category: 'docker',
    tags: ['docker', 'list'],
    isPinned: false,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'snip-2',
    title: 'Git log pretty',
    content: 'git log --oneline --graph --decorate --all',
    category: 'git',
    tags: ['git', 'log'],
    isPinned: false,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'snip-3',
    title: 'Kill process on port',
    content: 'lsof -ti:<PORT> | xargs kill -9',
    category: 'terminal',
    tags: ['port', 'kill'],
    isPinned: false,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'snip-4',
    title: 'cURL with auth header',
    content: 'curl -H "Authorization: Bearer <TOKEN>" https://api.example.com/endpoint',
    category: 'api',
    tags: ['curl', 'auth'],
    isPinned: false,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'snip-5',
    title: 'Check table sizes (PostgreSQL)',
    content:
      "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;",
    category: 'sql',
    tags: ['postgres', 'size'],
    isPinned: false,
    createdAt: Date.now(),
    usageCount: 0,
  },
];

interface SnippetsState {
  snippets: Snippet[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'usageCount'>) => Promise<void>;
  update: (id: string, updates: Partial<Snippet>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
}

export const useSnippetsStore = create<SnippetsState>((set, get) => ({
  snippets: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<Snippet[]>('snippets');
    set({ snippets: saved ?? DEFAULT_SNIPPETS, isLoading: false });
  },

  add: async (snippet) => {
    const newSnippet: Snippet = {
      ...snippet,
      id: generateId(),
      createdAt: Date.now(),
      usageCount: 0,
    };
    const updated = [...get().snippets, newSnippet];
    set({ snippets: updated });
    await storage.set('snippets', updated);
    logActivity({
      type: 'snippet_created',
      title: newSnippet.title,
      context: newSnippet.category,
      dedupeKey: `snippet:${newSnippet.id}`,
    });
  },

  update: async (id, updates) => {
    const updated = get().snippets.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ snippets: updated });
    await storage.set('snippets', updated);
  },

  remove: async (id) => {
    const updated = get().snippets.filter((s) => s.id !== id);
    set({ snippets: updated });
    await storage.set('snippets', updated);
  },

  togglePin: async (id) => {
    const updated = get().snippets.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    set({ snippets: updated });
    await storage.set('snippets', updated);
  },

  markUsed: async (id) => {
    const updated = get().snippets.map((s) =>
      s.id === id ? { ...s, lastUsedAt: Date.now(), usageCount: s.usageCount + 1 } : s
    );
    set({ snippets: updated });
    await storage.set('snippets', updated);
  },
}));
