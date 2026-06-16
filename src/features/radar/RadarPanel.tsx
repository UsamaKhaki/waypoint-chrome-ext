import { useEffect, useState } from 'react';
import {
  Radar as RadarIcon,
  Activity,
  Package,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { PanelShell, PanelHeader, PanelEmptyState } from '@/features/shared/PanelShell';
import {
  SERVICE_TARGETS,
  fetchServiceStatus,
  packageUrl,
  type ServiceStatus,
  type StatusIndicator,
  type Registry,
} from '@/services/radar';
import { useRadarStore } from '@/store/radar.store';
import { cn } from '@/lib/utils';

const INDICATOR: Record<StatusIndicator, { color: string; label: string }> = {
  operational: { color: '#22c55e', label: 'Operational' },
  minor: { color: '#f59e0b', label: 'Minor issues' },
  major: { color: '#f97316', label: 'Partial outage' },
  critical: { color: '#ef4444', label: 'Major outage' },
  unknown: { color: '#64748b', label: 'Unknown' },
};

function StatusTab() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const entries = await Promise.all(
      SERVICE_TARGETS.map(async (t) => [t.id, await fetchServiceStatus(t)] as const)
    );
    setStatuses(Object.fromEntries(entries));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const downCount = Object.values(statuses).filter(
    (s) => s.indicator !== 'operational' && s.indicator !== 'unknown'
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {loading
            ? 'Checking services…'
            : downCount === 0
              ? 'All tracked services operational'
              : `${downCount} service${downCount > 1 ? 's' : ''} reporting issues`}
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border-subtle bg-surface hover:bg-surface-elevated text-secondary hover:text-primary transition-all"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERVICE_TARGETS.map((t) => {
          const s = statuses[t.id];
          const ind = INDICATOR[s?.indicator ?? 'unknown'];
          return (
            <button
              key={t.id}
              onClick={() => chrome.tabs.create({ url: t.pageUrl })}
              className="card p-4 flex items-center gap-3 text-left hover:bg-surface-elevated transition-colors group"
            >
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ind.color, boxShadow: `0 0 8px ${ind.color}80` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{t.name}</p>
                <p className="text-xs text-muted truncate">{s ? s.description : 'Checking…'}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PackagesTab() {
  const { packages, isLoading, load, addPackage, removePackage, refreshAll } = useRadarStore();
  const [name, setName] = useState('');
  const [registry, setRegistry] = useState<Registry>('npm');

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    await addPackage(name, registry);
    setName('');
  };

  return (
    <div className="space-y-4">
      {/* Add bar */}
      <div className="card p-3 flex items-center gap-2">
        <div className="flex gap-1 bg-surface-elevated rounded-xl p-1">
          {(['npm', 'pypi'] as Registry[]).map((r) => (
            <button
              key={r}
              onClick={() => setRegistry(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                registry === r
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {r === 'npm' ? 'npm' : 'PyPI'}
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={registry === 'npm' ? 'e.g. react' : 'e.g. requests'}
          className="flex-1 rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent font-mono"
        />
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Watch
        </button>
        {packages.length > 0 && (
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            title="Refresh all"
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      {packages.length === 0 ? (
        <PanelEmptyState
          icon={Package}
          title="No packages watched"
          hint="Track npm or PyPI packages to see their latest published version at a glance."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {packages.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3 group">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{
                  backgroundColor: p.registry === 'npm' ? '#cb000415' : '#3775a915',
                  color: p.registry === 'npm' ? '#cb0004' : '#3775a9',
                }}
              >
                {p.registry === 'npm' ? 'npm' : 'PyPI'}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => chrome.tabs.create({ url: packageUrl(p.name, p.registry) })}
                  className="text-sm font-medium text-primary hover:text-accent transition-colors truncate block"
                >
                  {p.name}
                </button>
                <p className="text-xs text-muted">
                  {p.error ? 'Not found' : p.latest ? `Latest: v${p.latest}` : 'Checking…'}
                </p>
              </div>
              <button
                onClick={() => removePackage(p.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-destructive transition-all flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RadarPanel() {
  const [tab, setTab] = useState<'status' | 'packages'>('status');

  return (
    <PanelShell testId="radar-panel">
      <PanelHeader
        icon={RadarIcon}
        title="Radar"
        subtitle="Service status across the tools you depend on, and latest versions of packages you watch."
      />

      <div className="flex gap-1 border-b border-border-subtle">
        {(
          [
            ['status', 'Service Status', Activity],
            ['packages', 'Packages', Package],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
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

      {tab === 'status' ? <StatusTab /> : <PackagesTab />}
    </PanelShell>
  );
}
