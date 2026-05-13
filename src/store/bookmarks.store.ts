import { create } from 'zustand';
import type { Bookmark, BookmarkCategory } from '@/types';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

interface BookmarksState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  update: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (bookmarks: Bookmark[]) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
  getByCategory: (category: BookmarkCategory) => Bookmark[];
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<Bookmark[]>('bookmarks');
    set({ bookmarks: saved ?? [], isLoading: false });
  },

  add: async (bookmark) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: generateId(),
      createdAt: Date.now(),
      order: get().bookmarks.length,
    };
    const updated = [...get().bookmarks, newBookmark];
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  update: async (id, updates) => {
    const updated = get().bookmarks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  remove: async (id) => {
    const updated = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  reorder: async (bookmarks) => {
    set({ bookmarks });
    await storage.set('bookmarks', bookmarks);
  },

  togglePin: async (id) => {
    const updated = get().bookmarks.map((b) => (b.id === id ? { ...b, isPinned: !b.isPinned } : b));
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  toggleFavorite: async (id) => {
    const updated = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
    );
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  markUsed: async (id) => {
    const updated = get().bookmarks.map((b) =>
      b.id === id ? { ...b, lastUsedAt: Date.now() } : b
    );
    set({ bookmarks: updated });
    await storage.set('bookmarks', updated);
  },

  getByCategory: (category) => get().bookmarks.filter((b) => b.category === category),
}));
