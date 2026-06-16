import { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Cloud,
} from 'lucide-react';
import { PanelShell, PanelHeader, PanelEmptyState } from '@/features/shared/PanelShell';
import {
  useConnectionsStore,
  sshCommand,
  dbConnectionString,
  dbCliCommand,
  dbDefaultPort,
  CLOUD_SHELLS,
  type EnvTag,
  type DbType,
  type SshHost,
  type DbConnection,
} from '@/store/connections.store';
import { cn } from '@/lib/utils';

const ENV_COLOR: Record<EnvTag, string> = {
  local: '#22c55e',
  staging: '#f59e0b',
  production: '#ef4444',
  other: '#64748b',
};

const DB_LABEL: Record<DbType, string> = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
};

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        copied
          ? 'bg-success/15 text-success'
          : 'bg-surface-elevated text-secondary hover:text-primary'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function EnvBadge({ env }: { env: EnvTag }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${ENV_COLOR[env]}1a`, color: ENV_COLOR[env] }}
    >
      {env}
    </span>
  );
}

const inputCls =
  'w-full rounded-lg bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent transition-colors';

// ── Host form ─────────────────────────────────────────────────────────────
function HostForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (h: Omit<SshHost, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    label: '',
    user: 'root',
    host: '',
    port: 22,
    keyPath: '',
    env: 'production' as EnvTag,
    notes: '',
  });
  const valid = f.label.trim() && f.host.trim();
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputCls}
          placeholder="Label (e.g. Prod API)"
          value={f.label}
          onChange={(e) => setF({ ...f, label: e.target.value })}
        />
        <select
          className={inputCls}
          value={f.env}
          onChange={(e) => setF({ ...f, env: e.target.value as EnvTag })}
        >
          {(['production', 'staging', 'local', 'other'] as EnvTag[]).map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="User"
          value={f.user}
          onChange={(e) => setF({ ...f, user: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Host / IP"
          value={f.host}
          onChange={(e) => setF({ ...f, host: e.target.value })}
        />
        <input
          className={inputCls}
          type="number"
          placeholder="Port"
          value={f.port}
          onChange={(e) => setF({ ...f, port: Number(e.target.value) })}
        />
        <input
          className={inputCls}
          placeholder="Key path (optional)"
          value={f.keyPath}
          onChange={(e) => setF({ ...f, keyPath: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-primary"
        >
          Cancel
        </button>
        <button
          disabled={!valid}
          onClick={() => onSubmit({ ...f, keyPath: f.keyPath || undefined })}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white disabled:opacity-40"
        >
          Add host
        </button>
      </div>
    </div>
  );
}

// ── DB form ───────────────────────────────────────────────────────────────
function DbForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: Omit<DbConnection, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    label: '',
    type: 'postgres' as DbType,
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    env: 'production' as EnvTag,
    consoleUrl: '',
  });
  const valid = f.label.trim() && f.host.trim();
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputCls}
          placeholder="Label (e.g. Main DB)"
          value={f.label}
          onChange={(e) => setF({ ...f, label: e.target.value })}
        />
        <select
          className={inputCls}
          value={f.type}
          onChange={(e) => {
            const type = e.target.value as DbType;
            setF({ ...f, type, port: dbDefaultPort(type) });
          }}
        >
          {(Object.keys(DB_LABEL) as DbType[]).map((t) => (
            <option key={t} value={t}>
              {DB_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="Host"
          value={f.host}
          onChange={(e) => setF({ ...f, host: e.target.value })}
        />
        <input
          className={inputCls}
          type="number"
          placeholder="Port"
          value={f.port}
          onChange={(e) => setF({ ...f, port: Number(e.target.value) })}
        />
        <input
          className={inputCls}
          placeholder="Database (optional)"
          value={f.database}
          onChange={(e) => setF({ ...f, database: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="User (optional)"
          value={f.user}
          onChange={(e) => setF({ ...f, user: e.target.value })}
        />
        <select
          className={inputCls}
          value={f.env}
          onChange={(e) => setF({ ...f, env: e.target.value as EnvTag })}
        >
          {(['production', 'staging', 'local', 'other'] as EnvTag[]).map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="Console URL (optional)"
          value={f.consoleUrl}
          onChange={(e) => setF({ ...f, consoleUrl: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-primary"
        >
          Cancel
        </button>
        <button
          disabled={!valid}
          onClick={() =>
            onSubmit({
              ...f,
              database: f.database || undefined,
              user: f.user || undefined,
              consoleUrl: f.consoleUrl || undefined,
            })
          }
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white disabled:opacity-40"
        >
          Add database
        </button>
      </div>
    </div>
  );
}

export function ConnectionsPanel() {
  const { hosts, databases, load, addHost, removeHost, addDb, removeDb } = useConnectionsStore();
  const [tab, setTab] = useState<'hosts' | 'databases'>('hosts');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PanelShell testId="connections-panel">
      <PanelHeader
        icon={Server}
        title="Connections"
        subtitle="Your SSH hosts and database connections — copy commands and launch web shells."
        actions={
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add {tab === 'hosts' ? 'host' : 'database'}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {(
          [
            ['hosts', 'SSH Hosts', Server],
            ['databases', 'Databases', Database],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setAdding(false);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-secondary'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'hosts' && (
        <div className="space-y-4">
          {/* Cloud shells */}
          <div className="card p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              <Cloud className="h-3.5 w-3.5" /> Launch a web shell
            </p>
            <div className="flex flex-wrap gap-2">
              {CLOUD_SHELLS.map((s) => (
                <button
                  key={s.url}
                  onClick={() => chrome.tabs.create({ url: s.url })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border-subtle bg-surface hover:bg-surface-elevated text-secondary hover:text-primary transition-all"
                >
                  <Terminal className="h-3.5 w-3.5" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {adding && (
            <HostForm
              onSubmit={(h) => {
                void addHost(h);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {hosts.length === 0 && !adding ? (
            <PanelEmptyState
              icon={Server}
              title="No hosts yet"
              hint="Add your SSH hosts to keep connection details handy and copy the ssh command in one click."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {hosts.map((h) => (
                <div key={h.id} className="card p-4 group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary truncate">{h.label}</p>
                        <EnvBadge env={h.env} />
                      </div>
                      <p className="text-xs text-muted font-mono mt-0.5 truncate">
                        {h.user}@{h.host}:{h.port}
                      </p>
                    </div>
                    <button
                      onClick={() => removeHost(h.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <CopyChip label="Copy ssh command" value={sshCommand(h)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'databases' && (
        <div className="space-y-4">
          {adding && (
            <DbForm
              onSubmit={(d) => {
                void addDb(d);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {databases.length === 0 && !adding ? (
            <PanelEmptyState
              icon={Database}
              title="No databases yet"
              hint="Store connection details to copy connection strings, CLI commands, and jump to managed consoles."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {databases.map((d) => (
                <div key={d.id} className="card p-4 group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-primary truncate">{d.label}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                          {DB_LABEL[d.type]}
                        </span>
                        <EnvBadge env={d.env} />
                      </div>
                      <p className="text-xs text-muted font-mono mt-0.5 truncate">
                        {d.host}:{d.port}
                        {d.database ? `/${d.database}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDb(d.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyChip label="Connection string" value={dbConnectionString(d)} />
                    <CopyChip label="CLI" value={dbCliCommand(d)} />
                    {d.consoleUrl && (
                      <button
                        onClick={() => chrome.tabs.create({ url: d.consoleUrl! })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated text-secondary hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Console
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PanelShell>
  );
}
