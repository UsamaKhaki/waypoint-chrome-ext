import { useMemo, useState } from 'react';
import {
  Wrench,
  Braces,
  KeyRound,
  Binary,
  Link2,
  Hash,
  Fingerprint,
  Clock,
  CalendarClock,
  Type as TypeIcon,
  Palette,
  GitCompare,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { PanelShell, PanelHeader } from '@/features/shared/PanelShell';
import { cn } from '@/lib/utils';

// ── Shared primitives ─────────────────────────────────────────────────────

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!value) return;
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
          : 'bg-surface-elevated text-secondary hover:text-primary',
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
  mono = true,
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  readOnly?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      spellCheck={false}
      className={cn(
        'w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-muted resize-y',
        mono && 'font-mono text-xs leading-relaxed',
        readOnly && 'bg-surface-elevated'
      )}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{children}</p>
  );
}

// ── Pure helpers ────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(
    atob(b64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function toCases(input: string) {
  const words =
    input
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-./]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean) ?? [];
  const lower = words.map((w) => w.toLowerCase());
  return {
    camelCase: lower.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join(''),
    PascalCase: lower.map((w) => w[0].toUpperCase() + w.slice(1)).join(''),
    snake_case: lower.join('_'),
    'kebab-case': lower.join('-'),
    CONSTANT_CASE: lower.join('_').toUpperCase(),
    'Title Case': lower.map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
    'sentence case': lower.length ? lower[0][0].toUpperCase() + lower.join(' ').slice(1) : '',
  };
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace('#', '');
  const full =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.7222 * a[2];
}

function contrastRatio(c1: [number, number, number], c2: [number, number, number]): number {
  const l1 = relLuminance(c1);
  const l2 = relLuminance(c2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Enter a 5-field cron expression: minute hour day month weekday';
  const [min, hour, dom, mon, dow] = parts;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const segs: string[] = [];
  if (min === '*' && hour === '*') segs.push('Every minute');
  else if (min !== '*' && hour === '*') segs.push(`At minute ${min} of every hour`);
  else if (min === '0' && hour !== '*') segs.push(`At ${hour.padStart(2, '0')}:00`);
  else if (hour !== '*') segs.push(`At ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`);
  else segs.push(`At minute ${min}`);
  if (dom !== '*') segs.push(`on day ${dom} of the month`);
  if (mon !== '*') segs.push(`in month ${mon}`);
  if (dow !== '*') {
    const d = Number(dow);
    segs.push(`on ${Number.isNaN(d) ? dow : days[d % 7]}`);
  }
  if (dom === '*' && dow === '*' && mon === '*') segs.push('every day');
  return segs.join(' ') + '.';
}

interface DiffLine {
  type: 'same' | 'add' | 'remove';
  text: string;
}

function lineDiff(a: string, b: string): DiffLine[] {
  const left = a.split('\n');
  const right = b.split('\n');
  const n = left.length;
  const m = right.length;
  // Longest common subsequence DP over lines.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      out.push({ type: 'same', text: left[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'remove', text: left[i] });
      i++;
    } else {
      out.push({ type: 'add', text: right[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'remove', text: left[i++] });
  while (j < m) out.push({ type: 'add', text: right[j++] });
  return out;
}

// ── Individual tools ──────────────────────────────────────────────────────

function JsonTool() {
  const [input, setInput] = useState('');
  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      return { output: JSON.stringify(JSON.parse(input), null, 2), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  }, [input]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Input">
        <TextArea value={input} onChange={setInput} placeholder='{"hello":"world"}' rows={16} />
      </Field>
      <Field label="Formatted">
        {error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : (
          <>
            <TextArea value={output} readOnly rows={16} />
            {output && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-success">Valid JSON</span>
                <CopyButton value={output} />
              </div>
            )}
          </>
        )}
      </Field>
    </div>
  );
}

function JwtTool() {
  const [token, setToken] = useState('');
  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    const segs = token.trim().split('.');
    if (segs.length < 2) return { error: 'Not a valid JWT (expected header.payload.signature)' };
    try {
      const header = JSON.parse(base64UrlDecode(segs[0]));
      const payload = JSON.parse(base64UrlDecode(segs[1]));
      let expNote = '';
      if (payload.exp) {
        const expMs = payload.exp * 1000;
        expNote =
          expMs < Date.now()
            ? `Expired ${new Date(expMs).toLocaleString()}`
            : `Expires ${new Date(expMs).toLocaleString()}`;
      }
      return {
        header: JSON.stringify(header, null, 2),
        payload: JSON.stringify(payload, null, 2),
        expNote,
        expired: payload.exp ? payload.exp * 1000 < Date.now() : false,
      };
    } catch {
      return { error: 'Could not decode token' };
    }
  }, [token]);

  return (
    <div className="space-y-4">
      <Field label="JWT">
        <TextArea value={token} onChange={setToken} placeholder="eyJhbGci..." rows={4} />
      </Field>
      {decoded && 'error' in decoded && <ErrorNote>{decoded.error}</ErrorNote>}
      {decoded && !('error' in decoded) && (
        <>
          {decoded.expNote && (
            <p
              className={cn(
                'text-xs rounded-lg px-3 py-2',
                decoded.expired
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-success/10 text-success'
              )}
            >
              {decoded.expNote}
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Header">
              <TextArea value={decoded.header} readOnly rows={8} />
            </Field>
            <Field label="Payload">
              <TextArea value={decoded.payload} readOnly rows={8} />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}

function Base64Tool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const output = useMemo(() => {
    if (!input) return '';
    try {
      if (mode === 'encode') return btoa(unescape(encodeURIComponent(input)));
      return decodeURIComponent(escape(atob(input)));
    } catch {
      return '⚠ Invalid input for this mode';
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <ModeToggle value={mode} onChange={setMode} options={['encode', 'decode']} />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label={mode === 'encode' ? 'Plain text' : 'Base64'}>
          <TextArea value={input} onChange={setInput} rows={10} mono={mode === 'decode'} />
        </Field>
        <Field label={mode === 'encode' ? 'Base64' : 'Plain text'}>
          <TextArea value={output} readOnly rows={10} />
          {output && <CopyButton value={output} />}
        </Field>
      </div>
    </div>
  );
}

function UrlTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const output = useMemo(() => {
    if (!input) return '';
    try {
      return mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
    } catch {
      return '⚠ Invalid input';
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <ModeToggle value={mode} onChange={setMode} options={['encode', 'decode']} />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Input">
          <TextArea value={input} onChange={setInput} rows={8} />
        </Field>
        <Field label="Output">
          <TextArea value={output} readOnly rows={8} />
          {output && <CopyButton value={output} />}
        </Field>
      </div>
    </div>
  );
}

function HashTool() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const compute = async () => {
    const enc = new TextEncoder().encode(input);
    const algos: Array<[string, AlgorithmIdentifier]> = [
      ['SHA-1', 'SHA-1'],
      ['SHA-256', 'SHA-256'],
      ['SHA-512', 'SHA-512'],
    ];
    const next: Record<string, string> = {};
    for (const [label, algo] of algos) {
      const buf = await crypto.subtle.digest(algo, enc);
      next[label] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    setHashes(next);
  };

  return (
    <div className="space-y-4">
      <Field label="Input">
        <TextArea value={input} onChange={setInput} rows={4} mono={false} />
      </Field>
      <button
        onClick={compute}
        disabled={!input}
        className="px-3 py-2 rounded-xl text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
      >
        Compute hashes
      </button>
      <div className="space-y-2">
        {Object.entries(hashes).map(([label, value]) => (
          <div key={label} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-accent">{label}</span>
              <CopyButton value={value} />
            </div>
            <p className="text-xs font-mono text-secondary break-all">{value}</p>
          </div>
        ))}
        <p className="text-xs text-muted">
          SHA family via Web Crypto. MD5 is intentionally omitted (insecure & not in Web Crypto).
        </p>
      </div>
    </div>
  );
}

function UuidTool() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length: 5 }, () => crypto.randomUUID())
  );
  const regenerate = () => setIds(Array.from({ length: count }, () => crypto.randomUUID()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted">Count</label>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
          className="w-20 rounded-lg bg-surface border border-border-subtle text-primary text-sm px-2 py-1.5 outline-none focus:border-accent"
        />
        <button
          onClick={regenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Generate
        </button>
        <CopyButton value={ids.join('\n')} />
      </div>
      <div className="card p-3 space-y-1">
        {ids.map((id) => (
          <p key={id} className="text-xs font-mono text-secondary">
            {id}
          </p>
        ))}
      </div>
    </div>
  );
}

function TimestampTool() {
  const [unix, setUnix] = useState(`${Math.floor(Date.now() / 1000)}`);
  const parsed = useMemo(() => {
    const n = Number(unix);
    if (!unix || Number.isNaN(n)) return null;
    // Heuristic: treat 13-digit as ms, else seconds.
    const ms = unix.trim().length > 10 ? n : n * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return {
      iso: d.toISOString(),
      local: d.toLocaleString(),
      utc: d.toUTCString(),
      relative: `${Math.round((ms - Date.now()) / 1000)}s from now`,
    };
  }, [unix]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <Field label="Unix timestamp (s or ms)">
          <input
            value={unix}
            onChange={(e) => setUnix(e.target.value)}
            className="w-56 rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent font-mono"
          />
        </Field>
        <button
          onClick={() => setUnix(`${Math.floor(Date.now() / 1000)}`)}
          className="px-3 py-2.5 rounded-xl text-sm font-medium bg-surface-elevated text-secondary hover:text-primary transition-colors"
        >
          Now
        </button>
      </div>
      {parsed && (
        <div className="card divide-y divide-border-subtle">
          {[
            ['ISO 8601', parsed.iso],
            ['Local', parsed.local],
            ['UTC', parsed.utc],
            ['Relative', parsed.relative],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted">{label}</span>
              <span className="text-sm text-secondary font-mono">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CronTool() {
  const [expr, setExpr] = useState('0 9 * * 1');
  const desc = useMemo(() => describeCron(expr), [expr]);
  const presets = [
    ['Every minute', '* * * * *'],
    ['Hourly', '0 * * * *'],
    ['Daily 9am', '0 9 * * *'],
    ['Weekdays 9am', '0 9 * * 1-5'],
    ['Midnight', '0 0 * * *'],
  ];
  return (
    <div className="space-y-4">
      <Field label="Cron expression">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent font-mono"
        />
      </Field>
      <div className="card p-4 bg-accent/5 border-accent/20">
        <p className="text-sm text-primary">{desc}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(([label, value]) => (
          <button
            key={value}
            onClick={() => setExpr(value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-elevated text-secondary hover:text-primary transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CaseTool() {
  const [input, setInput] = useState('');
  const cases = useMemo(() => toCases(input), [input]);
  return (
    <div className="space-y-4">
      <Field label="Input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="hello world example"
          className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent"
        />
      </Field>
      <div className="card divide-y divide-border-subtle">
        {Object.entries(cases).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-xs text-muted flex-shrink-0">{label}</span>
            <span className="text-sm text-secondary font-mono truncate">{value || '—'}</span>
            {value && <CopyButton value={value} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorTool() {
  const [fg, setFg] = useState('#ffffff');
  const [bg, setBg] = useState('#6366f1');
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const ratio = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;

  const grade = (r: number) => ({
    aaNormal: r >= 4.5,
    aaLarge: r >= 3,
    aaaNormal: r >= 7,
  });
  const g = ratio ? grade(ratio) : null;

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        {[
          ['Foreground', fg, setFg, fgRgb],
          ['Background', bg, setBg, bgRgb],
        ].map(([label, val, set, rgb]) => (
          <div key={label as string} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                className="h-10 w-10 rounded-lg border border-border-subtle cursor-pointer bg-transparent"
              />
              <input
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                className="flex-1 rounded-lg bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent font-mono"
              />
            </div>
            <p className="text-xs text-muted font-mono">
              {label as string}:{' '}
              {rgb
                ? `rgb(${(rgb as number[]).join(', ')}) · hsl(${rgbToHsl(
                    (rgb as number[])[0],
                    (rgb as number[])[1],
                    (rgb as number[])[2]
                  ).join(', ')})`
                : 'invalid'}
            </p>
          </div>
        ))}
      </div>

      {/* Preview + contrast */}
      <div
        className="rounded-xl p-6 text-center border border-border-subtle"
        style={{ backgroundColor: bg, color: fg }}
      >
        <p className="text-lg font-bold">The quick brown fox</p>
        <p className="text-sm">jumps over the lazy dog · 1234567890</p>
      </div>

      {ratio && g && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-2xl font-bold text-primary">{ratio.toFixed(2)}:1</div>
          {[
            ['AA Normal', g.aaNormal],
            ['AA Large', g.aaLarge],
            ['AAA Normal', g.aaaNormal],
          ].map(([label, pass]) => (
            <span
              key={label as string}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold',
                pass ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
              )}
            >
              {label as string} {pass ? '✓' : '✗'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffTool() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const diff = useMemo(() => (a || b ? lineDiff(a, b) : []), [a, b]);
  const stats = useMemo(
    () => ({
      add: diff.filter((d) => d.type === 'add').length,
      remove: diff.filter((d) => d.type === 'remove').length,
    }),
    [diff]
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Original">
          <TextArea value={a} onChange={setA} rows={8} />
        </Field>
        <Field label="Changed">
          <TextArea value={b} onChange={setB} rows={8} />
        </Field>
      </div>
      {diff.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-success">+{stats.add} added</span>
            <span className="text-destructive">−{stats.remove} removed</span>
          </div>
          <div className="card p-0 overflow-hidden font-mono text-xs">
            {diff.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'px-3 py-0.5 flex gap-2',
                  line.type === 'add' && 'bg-success/10 text-success',
                  line.type === 'remove' && 'bg-destructive/10 text-destructive',
                  line.type === 'same' && 'text-muted'
                )}
              >
                <span className="select-none opacity-60 w-3">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                </span>
                <span className="whitespace-pre-wrap break-all">{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
}) {
  return (
    <div className="flex gap-1 bg-surface-elevated rounded-xl p-1 w-fit">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
            value === opt ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-secondary'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Tool registry + panel ────────────────────────────────────────────────

interface ToolDef {
  id: string;
  label: string;
  icon: React.ElementType;
  render: () => JSX.Element;
}

const TOOLS: ToolDef[] = [
  { id: 'json', label: 'JSON Formatter', icon: Braces, render: () => <JsonTool /> },
  { id: 'jwt', label: 'JWT Decoder', icon: KeyRound, render: () => <JwtTool /> },
  { id: 'base64', label: 'Base64', icon: Binary, render: () => <Base64Tool /> },
  { id: 'url', label: 'URL Encode', icon: Link2, render: () => <UrlTool /> },
  { id: 'hash', label: 'Hash', icon: Hash, render: () => <HashTool /> },
  { id: 'uuid', label: 'UUID Generator', icon: Fingerprint, render: () => <UuidTool /> },
  { id: 'timestamp', label: 'Timestamp', icon: Clock, render: () => <TimestampTool /> },
  { id: 'cron', label: 'Cron Explainer', icon: CalendarClock, render: () => <CronTool /> },
  { id: 'case', label: 'Case Converter', icon: TypeIcon, render: () => <CaseTool /> },
  { id: 'color', label: 'Color & Contrast', icon: Palette, render: () => <ColorTool /> },
  { id: 'diff', label: 'Text Diff', icon: GitCompare, render: () => <DiffTool /> },
];

export function ToolboxPanel() {
  const [active, setActive] = useState(TOOLS[0].id);
  const tool = TOOLS.find((t) => t.id === active) ?? TOOLS[0];

  return (
    <PanelShell testId="toolbox-panel">
      <PanelHeader
        icon={Wrench}
        title="Toolbox"
        subtitle="Offline dev utilities — runs entirely in your browser, no data leaves the tab."
      />
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Tool list */}
        <div className="col-span-12 md:col-span-3">
          <div className="card p-2 space-y-0.5 md:sticky md:top-4">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                    isActive
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-secondary hover:bg-surface-elevated hover:text-primary'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-left">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Work area */}
        <div className="col-span-12 md:col-span-9">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <tool.icon className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-primary">{tool.label}</h2>
            </div>
            {tool.render()}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
