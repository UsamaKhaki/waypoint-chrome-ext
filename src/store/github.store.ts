import { create } from 'zustand';
import type { GitHubRepo, PRTemplate, BranchTemplate } from '@/types';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

interface GitHubState {
  repos: GitHubRepo[];
  prTemplates: PRTemplate[];
  branchTemplates: BranchTemplate[];
  isLoading: boolean;
  load: () => Promise<void>;
  addRepo: (repo: Omit<GitHubRepo, 'id' | 'order'>) => Promise<void>;
  removeRepo: (id: string) => Promise<void>;
  toggleStarRepo: (id: string) => Promise<void>;
  reorderRepos: (repos: GitHubRepo[]) => Promise<void>;
  addPRTemplate: (template: Omit<PRTemplate, 'id'>) => Promise<void>;
  removePRTemplate: (id: string) => Promise<void>;
  addBranchTemplate: (template: Omit<BranchTemplate, 'id'>) => Promise<void>;
  removeBranchTemplate: (id: string) => Promise<void>;
}

const DEFAULT_PR_TEMPLATES: PRTemplate[] = [
  {
    id: 'default-pr',
    name: 'Default PR Template',
    body: `## Summary\n\n## Changes\n- \n\n## Testing\n- [ ] Unit tests\n- [ ] Manual testing\n\n## Screenshots\n`,
  },
  {
    id: 'bugfix-pr',
    name: 'Bug Fix',
    body: `## Bug Description\n\n## Root Cause\n\n## Fix\n\n## Testing\n- [ ] Reproduces original bug\n- [ ] Fixed after change\n`,
  },
];

const DEFAULT_BRANCH_TEMPLATES: BranchTemplate[] = [
  { id: 'feat', name: 'Feature', pattern: 'feat/{ticket}-{description}' },
  { id: 'fix', name: 'Bug Fix', pattern: 'fix/{ticket}-{description}' },
  { id: 'chore', name: 'Chore', pattern: 'chore/{description}' },
  { id: 'hotfix', name: 'Hotfix', pattern: 'hotfix/{ticket}-{description}' },
];

export const useGitHubStore = create<GitHubState>((set, get) => ({
  repos: [],
  prTemplates: [],
  branchTemplates: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [repos, prTemplates, branchTemplates] = await Promise.all([
      storage.get<GitHubRepo[]>('githubRepos'),
      storage.get<PRTemplate[]>('prTemplates'),
      storage.get<BranchTemplate[]>('branchTemplates'),
    ]);
    set({
      repos: repos ?? [],
      prTemplates: prTemplates ?? DEFAULT_PR_TEMPLATES,
      branchTemplates: branchTemplates ?? DEFAULT_BRANCH_TEMPLATES,
      isLoading: false,
    });
  },

  addRepo: async (repo) => {
    const newRepo: GitHubRepo = { ...repo, id: generateId(), order: get().repos.length };
    const updated = [...get().repos, newRepo];
    set({ repos: updated });
    await storage.set('githubRepos', updated);
  },

  removeRepo: async (id) => {
    const updated = get().repos.filter((r) => r.id !== id);
    set({ repos: updated });
    await storage.set('githubRepos', updated);
  },

  toggleStarRepo: async (id) => {
    const updated = get().repos.map((r) => (r.id === id ? { ...r, isStarred: !r.isStarred } : r));
    set({ repos: updated });
    await storage.set('githubRepos', updated);
  },

  reorderRepos: async (repos) => {
    set({ repos });
    await storage.set('githubRepos', repos);
  },

  addPRTemplate: async (template) => {
    const newTemplate: PRTemplate = { ...template, id: generateId() };
    const updated = [...get().prTemplates, newTemplate];
    set({ prTemplates: updated });
    await storage.set('prTemplates', updated);
  },

  removePRTemplate: async (id) => {
    const updated = get().prTemplates.filter((t) => t.id !== id);
    set({ prTemplates: updated });
    await storage.set('prTemplates', updated);
  },

  addBranchTemplate: async (template) => {
    const newTemplate: BranchTemplate = { ...template, id: generateId() };
    const updated = [...get().branchTemplates, newTemplate];
    set({ branchTemplates: updated });
    await storage.set('branchTemplates', updated);
  },

  removeBranchTemplate: async (id) => {
    const updated = get().branchTemplates.filter((t) => t.id !== id);
    set({ branchTemplates: updated });
    await storage.set('branchTemplates', updated);
  },
}));
