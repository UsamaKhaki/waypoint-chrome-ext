import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';
import { fetchPackageLatest, type Registry } from '@/services/radar';

export interface WatchedPackage {
  id: string;
  name: string;
  registry: Registry;
  latest?: string;
  checkedAt?: number;
  error?: boolean;
}

interface RadarState {
  packages: WatchedPackage[];
  isLoading: boolean;
  load: () => Promise<void>;
  addPackage: (name: string, registry: Registry) => Promise<void>;
  removePackage: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useRadarStore = create<RadarState>((set, get) => ({
  packages: [],
  isLoading: false,

  load: async () => {
    const saved = await storage.get<WatchedPackage[]>('watchedPackages');
    set({ packages: saved ?? [] });
    if ((saved ?? []).length > 0) void get().refreshAll();
  },

  addPackage: async (name, registry) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Avoid duplicates of the same name+registry.
    if (get().packages.some((p) => p.name === trimmed && p.registry === registry)) return;
    const pkg: WatchedPackage = { id: generateId(), name: trimmed, registry };
    const updated = [...get().packages, pkg];
    set({ packages: updated });
    await storage.set('watchedPackages', updated);

    const latest = await fetchPackageLatest(trimmed, registry);
    const withLatest = get().packages.map((p) =>
      p.id === pkg.id ? { ...p, latest: latest?.version, error: !latest, checkedAt: Date.now() } : p
    );
    set({ packages: withLatest });
    await storage.set('watchedPackages', withLatest);
  },

  removePackage: async (id) => {
    const updated = get().packages.filter((p) => p.id !== id);
    set({ packages: updated });
    await storage.set('watchedPackages', updated);
  },

  refreshAll: async () => {
    set({ isLoading: true });
    const results = await Promise.all(
      get().packages.map(async (p) => {
        const latest = await fetchPackageLatest(p.name, p.registry);
        return { ...p, latest: latest?.version, error: !latest, checkedAt: Date.now() };
      })
    );
    set({ packages: results, isLoading: false });
    await storage.set('watchedPackages', results);
  },
}));
