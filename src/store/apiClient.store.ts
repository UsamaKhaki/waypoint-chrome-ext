import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';
import type { HttpMethod } from '@/services/apiClient';

export interface HeaderPair {
  key: string;
  value: string;
}

export interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status?: number;
  ok: boolean;
  timeMs: number;
  at: number;
}

export interface EnvVar {
  key: string;
  value: string;
}

const HISTORY_LIMIT = 50;

interface ApiClientState {
  requests: SavedRequest[];
  history: HistoryEntry[];
  envVars: EnvVar[];
  isLoading: boolean;
  load: () => Promise<void>;
  saveRequest: (req: Omit<SavedRequest, 'id' | 'createdAt'>) => Promise<SavedRequest>;
  deleteRequest: (id: string) => Promise<void>;
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'at'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  setEnvVars: (vars: EnvVar[]) => Promise<void>;
}

export const useApiClientStore = create<ApiClientState>((set, get) => ({
  requests: [],
  history: [],
  envVars: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [requests, history, envVars] = await Promise.all([
      storage.get<SavedRequest[]>('apiRequests'),
      storage.get<HistoryEntry[]>('apiHistory'),
      storage.get<EnvVar[]>('apiEnvironments'),
    ]);
    set({
      requests: requests ?? [],
      history: history ?? [],
      envVars: envVars ?? [],
      isLoading: false,
    });
  },

  saveRequest: async (req) => {
    const saved: SavedRequest = { ...req, id: generateId(), createdAt: Date.now() };
    const updated = [saved, ...get().requests];
    set({ requests: updated });
    await storage.set('apiRequests', updated);
    return saved;
  },

  deleteRequest: async (id) => {
    const updated = get().requests.filter((r) => r.id !== id);
    set({ requests: updated });
    await storage.set('apiRequests', updated);
  },

  addHistory: async (entry) => {
    const item: HistoryEntry = { ...entry, id: generateId(), at: Date.now() };
    const updated = [item, ...get().history].slice(0, HISTORY_LIMIT);
    set({ history: updated });
    await storage.set('apiHistory', updated);
  },

  clearHistory: async () => {
    set({ history: [] });
    await storage.set('apiHistory', []);
  },

  setEnvVars: async (vars) => {
    set({ envVars: vars });
    await storage.set('apiEnvironments', vars);
  },
}));
