import { create } from 'zustand';
import type { Environment, EnvironmentLink, EnvironmentType } from '@/types';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';
import { ENVIRONMENT_COLORS } from '@/constants';

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'local',
    name: 'Local',
    type: 'local',
    links: [],
    healthStatus: 'unknown',
    color: ENVIRONMENT_COLORS.local,
    isActive: true,
  },
  {
    id: 'stage',
    name: 'Stage',
    type: 'stage',
    links: [],
    healthStatus: 'unknown',
    color: ENVIRONMENT_COLORS.stage,
    isActive: true,
  },
  {
    id: 'production',
    name: 'Production',
    type: 'production',
    links: [],
    healthStatus: 'unknown',
    color: ENVIRONMENT_COLORS.production,
    isActive: true,
  },
];

interface EnvironmentsState {
  environments: Environment[];
  isLoading: boolean;
  load: () => Promise<void>;
  add: (env: Omit<Environment, 'id'>) => Promise<void>;
  update: (id: string, updates: Partial<Environment>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addLink: (envId: string, link: EnvironmentLink) => Promise<void>;
  removeLink: (envId: string, linkLabel: string) => Promise<void>;
  getByType: (type: EnvironmentType) => Environment | undefined;
}

export const useEnvironmentsStore = create<EnvironmentsState>((set, get) => ({
  environments: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<Environment[]>('environments');
    set({ environments: saved ?? DEFAULT_ENVIRONMENTS, isLoading: false });
  },

  add: async (env) => {
    const newEnv: Environment = { ...env, id: generateId() };
    const updated = [...get().environments, newEnv];
    set({ environments: updated });
    await storage.set('environments', updated);
  },

  update: async (id, updates) => {
    const updated = get().environments.map((e) => (e.id === id ? { ...e, ...updates } : e));
    set({ environments: updated });
    await storage.set('environments', updated);
  },

  remove: async (id) => {
    const updated = get().environments.filter((e) => e.id !== id);
    set({ environments: updated });
    await storage.set('environments', updated);
  },

  addLink: async (envId, link) => {
    const updated = get().environments.map((e) =>
      e.id === envId ? { ...e, links: [...e.links, link] } : e
    );
    set({ environments: updated });
    await storage.set('environments', updated);
  },

  removeLink: async (envId, linkLabel) => {
    const updated = get().environments.map((e) =>
      e.id === envId ? { ...e, links: e.links.filter((l) => l.label !== linkLabel) } : e
    );
    set({ environments: updated });
    await storage.set('environments', updated);
  },

  getByType: (type) => get().environments.find((e) => e.type === type),
}));
