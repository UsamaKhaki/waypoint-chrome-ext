import { useEffect, useMemo, useState } from 'react';
import {
  Zap,
  Send,
  Save,
  Trash2,
  Plus,
  X,
  History,
  Bookmark,
  Variable,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';
import { PanelShell, PanelHeader } from '@/features/shared/PanelShell';
import {
  useApiClientStore,
  type HeaderPair,
  type SavedRequest,
  type EnvVar,
} from '@/store/apiClient.store';
import {
  sendApiRequest,
  interpolate,
  type HttpMethod,
  type ApiResponseResult,
} from '@/services/apiClient';
import { cn } from '@/lib/utils';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
  HEAD: '#64748b',
  OPTIONS: '#64748b',
};

function statusColor(status?: number): string {
  if (!status) return '#ef4444';
  if (status < 300) return '#22c55e';
  if (status < 400) return '#3b82f6';
  if (status < 500) return '#f59e0b';
  return '#ef4444';
}

function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: {
  pairs: HeaderPair[];
  onChange: (pairs: HeaderPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const update = (i: number, patch: Partial<HeaderPair>) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={p.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className="flex-1 rounded-lg bg-surface border border-border-subtle text-primary text-xs px-2.5 py-2 outline-none focus:border-accent font-mono"
          />
          <input
            value={p.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            className="flex-1 rounded-lg bg-surface border border-border-subtle text-primary text-xs px-2.5 py-2 outline-none focus:border-accent font-mono"
          />
          <button
            onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
            className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...pairs, { key: '', value: '' }])}
        className="flex items-center gap-1.5 text-xs text-accent hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    </div>
  );
}

export function ApiClientPanel() {
  const {
    requests,
    history,
    envVars,
    load,
    saveRequest,
    deleteRequest,
    addHistory,
    clearHistory,
    setEnvVars,
  } = useApiClientStore();

  useEffect(() => {
    void load();
  }, [load]);

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderPair[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'headers' | 'body' | 'auth'>('headers');
  const [authToken, setAuthToken] = useState('');
  const [respTab, setRespTab] = useState<'body' | 'headers'>('body');
  const [response, setResponse] = useState<ApiResponseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [showEnv, setShowEnv] = useState(false);
  const [copied, setCopied] = useState(false);

  const envMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of envVars) if (v.key.trim()) m[v.key.trim()] = v.value;
    return m;
  }, [envVars]);

  const send = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);

    const finalHeaders: Record<string, string> = {};
    for (const h of headers)
      if (h.key.trim()) finalHeaders[interpolate(h.key, envMap)] = interpolate(h.value, envMap);
    if (authToken.trim())
      finalHeaders['Authorization'] = `Bearer ${interpolate(authToken, envMap)}`;

    const res = await sendApiRequest({
      method,
      url: interpolate(url, envMap),
      headers: finalHeaders,
      body: interpolate(body, envMap),
    });
    setResponse(res);
    setLoading(false);
    await addHistory({ method, url, status: res.status, ok: res.ok, timeMs: res.timeMs });
  };

  const loadRequest = (r: SavedRequest) => {
    setMethod(r.method);
    setUrl(r.url);
    setHeaders(r.headers.length ? r.headers : [{ key: '', value: '' }]);
    setBody(r.body);
    setResponse(null);
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    const name = url.replace(/^https?:\/\//, '').slice(0, 40);
    await saveRequest({ name, method, url, headers: headers.filter((h) => h.key.trim()), body });
  };

  const prettyBody = useMemo(() => {
    if (!response?.body) return '';
    const ct = response.headers?.['content-type'] ?? '';
    if (
      ct.includes('json') ||
      response.body.trim().startsWith('{') ||
      response.body.trim().startsWith('[')
    ) {
      try {
        return JSON.stringify(JSON.parse(response.body), null, 2);
      } catch {
        return response.body;
      }
    }
    return response.body;
  }, [response]);

  const copyResp = async () => {
    if (!prettyBody) return;
    try {
      await navigator.clipboard.writeText(prettyBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <PanelShell testId="api-client-panel">
      <PanelHeader
        icon={Zap}
        title="API Client"
        subtitle="Send HTTP requests right from your new tab — saved requests, history, and variables."
      />

      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Sidebar: saved + history + env */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* Environment */}
          <div className="card p-3">
            <button
              onClick={() => setShowEnv((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-medium text-primary"
            >
              <span className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-accent" /> Variables
                {envVars.filter((v) => v.key).length > 0 && (
                  <span className="text-xs text-muted">
                    ({envVars.filter((v) => v.key).length})
                  </span>
                )}
              </span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showEnv && 'rotate-180')}
              />
            </button>
            {showEnv && (
              <div className="mt-3 space-y-2">
                <KeyValueEditor
                  pairs={envVars.length ? envVars : [{ key: '', value: '' }]}
                  onChange={(p) => setEnvVars(p as EnvVar[])}
                  valuePlaceholder="Value"
                />
                <p className="text-xs text-muted">
                  Use <code className="text-accent">{'{{name}}'}</code> in URL, headers, or body.
                </p>
              </div>
            )}
          </div>

          {/* Saved */}
          <div className="card p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <Bookmark className="h-4 w-4 text-accent" /> Saved
            </p>
            {requests.length === 0 ? (
              <p className="text-xs text-muted py-2">No saved requests yet.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {requests.map((r) => (
                  <div key={r.id} className="group flex items-center gap-2">
                    <button
                      onClick={() => loadRequest(r)}
                      className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                    >
                      <span
                        className="text-[10px] font-bold flex-shrink-0"
                        style={{ color: METHOD_COLOR[r.method] }}
                      >
                        {r.method}
                      </span>
                      <span className="text-xs text-secondary truncate">{r.name}</span>
                    </button>
                    <button
                      onClick={() => deleteRequest(r.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <History className="h-4 w-4 text-accent" /> History
              </p>
              {history.length > 0 && (
                <button
                  onClick={() => clearHistory()}
                  className="text-xs text-muted hover:text-destructive"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted py-2">No requests yet.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setMethod(h.method);
                      setUrl(h.url);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                  >
                    <span
                      className="text-[10px] font-bold flex-shrink-0"
                      style={{ color: METHOD_COLOR[h.method] }}
                    >
                      {h.method}
                    </span>
                    <span
                      className="text-[10px] font-semibold flex-shrink-0"
                      style={{ color: statusColor(h.status) }}
                    >
                      {h.status ?? 'ERR'}
                    </span>
                    <span className="text-xs text-muted truncate">
                      {h.url.replace(/^https?:\/\//, '')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main: builder + response */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* URL bar */}
          <div className="card p-3 space-y-3">
            <div className="flex items-center gap-2">
              {/* Method dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMethodOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-elevated text-sm font-bold min-w-[96px] justify-between"
                  style={{ color: METHOD_COLOR[method] }}
                >
                  {method}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                {methodOpen && (
                  <div className="absolute z-20 mt-1 w-32 card p-1 shadow-xl">
                    {METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMethod(m);
                          setMethodOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-surface-elevated transition-colors"
                        style={{ color: METHOD_COLOR[m] }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="https://api.example.com/v1/users"
                className="flex-1 rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent font-mono"
              />
              <button
                onClick={send}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" /> {loading ? 'Sending…' : 'Send'}
              </button>
              <button
                onClick={handleSave}
                disabled={!url.trim()}
                title="Save request"
                className="p-2.5 rounded-xl bg-surface-elevated text-secondary hover:text-primary transition-colors disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>

            {/* Request tabs */}
            <div className="flex gap-1 border-b border-border-subtle">
              {(['headers', 'body', 'auth'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors',
                    tab === t
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-secondary'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="pt-1">
              {tab === 'headers' && <KeyValueEditor pairs={headers} onChange={setHeaders} />}
              {tab === 'body' && (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{ "key": "value" }'
                  rows={8}
                  spellCheck={false}
                  className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-xs px-3 py-2.5 outline-none focus:border-accent font-mono resize-y"
                />
              )}
              {tab === 'auth' && (
                <div className="space-y-2">
                  <label className="text-xs text-muted">
                    Bearer token (added as Authorization header)
                  </label>
                  <input
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="token or {{token}}"
                    className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-xs px-3 py-2.5 outline-none focus:border-accent font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response */}
          {response && (
            <div className="card p-3 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {response.error ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/15 text-destructive">
                    Error
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${statusColor(response.status)}22`,
                      color: statusColor(response.status),
                    }}
                  >
                    {response.status} {response.statusText}
                  </span>
                )}
                <span className="text-xs text-muted">{response.timeMs} ms</span>
                {typeof response.size === 'number' && (
                  <span className="text-xs text-muted">{response.size} B</span>
                )}
                {!response.error && (
                  <button
                    onClick={copyResp}
                    className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated text-secondary hover:text-primary transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {response.error ? (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {response.error}
                </p>
              ) : (
                <>
                  <div className="flex gap-1 border-b border-border-subtle">
                    {(['body', 'headers'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setRespTab(t)}
                        className={cn(
                          'px-3 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors',
                          respTab === t
                            ? 'border-accent text-accent'
                            : 'border-transparent text-muted hover:text-secondary'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {respTab === 'body' ? (
                    <pre className="text-xs font-mono text-secondary bg-surface-elevated rounded-xl p-3 overflow-auto max-h-[420px] whitespace-pre-wrap break-all">
                      {prettyBody || '(empty response)'}
                    </pre>
                  ) : (
                    <div className="card divide-y divide-border-subtle text-xs">
                      {Object.entries(response.headers ?? {}).map(([k, v]) => (
                        <div key={k} className="flex gap-3 px-3 py-2">
                          <span className="text-muted font-mono flex-shrink-0">{k}</span>
                          <span className="text-secondary font-mono break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}
