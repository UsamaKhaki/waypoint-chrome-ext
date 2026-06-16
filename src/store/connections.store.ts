import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

export type EnvTag = 'local' | 'staging' | 'production' | 'other';

export interface SshHost {
  id: string;
  label: string;
  user: string;
  host: string;
  port: number;
  keyPath?: string;
  env: EnvTag;
  notes?: string;
  createdAt: number;
}

export type DbType = 'postgres' | 'mysql' | 'mongodb' | 'redis';

export interface DbConnection {
  id: string;
  label: string;
  type: DbType;
  host: string;
  port: number;
  database?: string;
  user?: string;
  env: EnvTag;
  /** Optional managed-console URL (Supabase/Neon/Atlas dashboard, etc.). */
  consoleUrl?: string;
  createdAt: number;
}

interface ConnectionsState {
  hosts: SshHost[];
  databases: DbConnection[];
  isLoading: boolean;
  load: () => Promise<void>;
  addHost: (host: Omit<SshHost, 'id' | 'createdAt'>) => Promise<void>;
  updateHost: (id: string, patch: Partial<SshHost>) => Promise<void>;
  removeHost: (id: string) => Promise<void>;
  addDb: (db: Omit<DbConnection, 'id' | 'createdAt'>) => Promise<void>;
  updateDb: (id: string, patch: Partial<DbConnection>) => Promise<void>;
  removeDb: (id: string) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  hosts: [],
  databases: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const [hosts, databases] = await Promise.all([
      storage.get<SshHost[]>('sshHosts'),
      storage.get<DbConnection[]>('dbConnections'),
    ]);
    set({ hosts: hosts ?? [], databases: databases ?? [], isLoading: false });
  },

  addHost: async (host) => {
    const updated = [{ ...host, id: generateId(), createdAt: Date.now() }, ...get().hosts];
    set({ hosts: updated });
    await storage.set('sshHosts', updated);
  },

  updateHost: async (id, patch) => {
    const updated = get().hosts.map((h) => (h.id === id ? { ...h, ...patch } : h));
    set({ hosts: updated });
    await storage.set('sshHosts', updated);
  },

  removeHost: async (id) => {
    const updated = get().hosts.filter((h) => h.id !== id);
    set({ hosts: updated });
    await storage.set('sshHosts', updated);
  },

  addDb: async (db) => {
    const updated = [{ ...db, id: generateId(), createdAt: Date.now() }, ...get().databases];
    set({ databases: updated });
    await storage.set('dbConnections', updated);
  },

  updateDb: async (id, patch) => {
    const updated = get().databases.map((d) => (d.id === id ? { ...d, ...patch } : d));
    set({ databases: updated });
    await storage.set('dbConnections', updated);
  },

  removeDb: async (id) => {
    const updated = get().databases.filter((d) => d.id !== id);
    set({ databases: updated });
    await storage.set('dbConnections', updated);
  },
}));

// ── Command / URL builders ────────────────────────────────────────────────

export function sshCommand(h: SshHost): string {
  const parts = ['ssh'];
  if (h.keyPath) parts.push('-i', h.keyPath);
  if (h.port && h.port !== 22) parts.push('-p', String(h.port));
  parts.push(`${h.user || 'root'}@${h.host}`);
  return parts.join(' ');
}

const DEFAULT_DB_PORT: Record<DbType, number> = {
  postgres: 5432,
  mysql: 3306,
  mongodb: 27017,
  redis: 6379,
};

export function dbDefaultPort(type: DbType): number {
  return DEFAULT_DB_PORT[type];
}

export function dbConnectionString(d: DbConnection): string {
  const auth = d.user ? `${d.user}@` : '';
  const db = d.database ? `/${d.database}` : '';
  switch (d.type) {
    case 'postgres':
      return `postgresql://${auth}${d.host}:${d.port}${db}`;
    case 'mysql':
      return `mysql://${auth}${d.host}:${d.port}${db}`;
    case 'mongodb':
      return `mongodb://${auth}${d.host}:${d.port}${db}`;
    case 'redis':
      return `redis://${auth}${d.host}:${d.port}`;
  }
}

export function dbCliCommand(d: DbConnection): string {
  switch (d.type) {
    case 'postgres':
      return `psql -h ${d.host} -p ${d.port}${d.user ? ` -U ${d.user}` : ''}${d.database ? ` -d ${d.database}` : ''}`;
    case 'mysql':
      return `mysql -h ${d.host} -P ${d.port}${d.user ? ` -u ${d.user}` : ''}${d.database ? ` ${d.database}` : ''} -p`;
    case 'mongodb':
      return `mongosh "${dbConnectionString(d)}"`;
    case 'redis':
      return `redis-cli -h ${d.host} -p ${d.port}`;
  }
}

/** Cloud web-terminal launchers — open a real shell in the browser. */
export const CLOUD_SHELLS: { label: string; url: string }[] = [
  { label: 'AWS CloudShell', url: 'https://console.aws.amazon.com/cloudshell/home' },
  { label: 'GCP Cloud Shell', url: 'https://shell.cloud.google.com/' },
  { label: 'Azure Cloud Shell', url: 'https://shell.azure.com/' },
  { label: 'GitHub Codespaces', url: 'https://github.com/codespaces' },
  { label: 'Gitpod', url: 'https://gitpod.io/workspaces' },
];
