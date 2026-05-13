import { create } from 'zustand';
import type { Command, RecentCommand } from '@/types';
import { storage } from '@/services/storage';
import { RECENT_COMMANDS_MAX } from '@/constants';

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  commands: Command[];
  recentCommands: RecentCommand[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  registerCommands: (commands: Command[]) => void;
  executeCommand: (command: Command) => Promise<void>;
  loadRecentCommands: () => Promise<void>;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set, get) => ({
  isOpen: false,
  query: '',
  commands: [],
  recentCommands: [],

  open: () => set({ isOpen: true, query: '' }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen, query: '' })),
  setQuery: (query) => set({ query }),

  registerCommands: (commands) => set({ commands }),

  executeCommand: async (command) => {
    command.action();
    const recent: RecentCommand = { commandId: command.id, usedAt: Date.now() };
    const prev = get().recentCommands.filter((r) => r.commandId !== command.id);
    const updated = [recent, ...prev].slice(0, RECENT_COMMANDS_MAX);
    set({ recentCommands: updated });
    await storage.set('recentCommands', updated);
    get().close();
  },

  loadRecentCommands: async () => {
    const saved = await storage.get<RecentCommand[]>('recentCommands');
    set({ recentCommands: saved ?? [] });
  },
}));
