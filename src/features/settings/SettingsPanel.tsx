import { useState, useRef, useEffect } from 'react';
import { Download, Upload, RotateCcw, Check, ExternalLink, Cloud, Lock, Bell } from 'lucide-react';
import { useSettingsStore } from '@/store/settings.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { PRO_FEATURES } from '@/constants/subscription';
import { storage } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Green', value: '#10b981' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Rose', value: '#f43f5e' },
];

export function SettingsPanel() {
  const { settings, update, reset } = useSettingsStore();
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const deactivate = useSubscriptionStore((s) => s.deactivate);
  const [exportDone, setExportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [cloudSync, setCloudSync] = useState(false);
  const [deactivateKey, setDeactivateKey] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pollDone, setPollDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = plan === 'pro' || plan === 'team';

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get('notificationsEnabled', (res) => {
      setNotificationsEnabled(res.notificationsEnabled !== false);
    });
  }, []);

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ notificationsEnabled: val });
    }
  };

  const handlePollNow = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'POLL_NOW' }, () => {
        setPollDone(true);
        setTimeout(() => setPollDone(false), 2000);
      });
    }
  };

  const handleExport = async () => {
    const json = await storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoint-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await storage.importAll(text);
      setImportError('');
      window.location.reload();
    } catch {
      setImportError('Invalid file. Please use a Waypoint backup JSON.');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-primary">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Customize your Waypoint workspace</p>
      </div>

      {/* Subscription */}
      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">Subscription</h2>
          {plan === 'free' && <Badge variant="secondary">Free</Badge>}
          {plan === 'pro' && <Badge variant="success">Pro</Badge>}
          {plan === 'team' && <Badge variant="default">Team</Badge>}
        </div>

        {!isPro ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">Upgrade to Pro</p>
              <p className="text-xs text-muted">Unlock unlimited snippets, cloud sync, and more</p>
            </div>
            <Button size="sm" onClick={() => openUpgradeModal()}>
              Upgrade →
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm text-secondary">
                {plan === 'team' ? 'Team plan active' : 'Pro plan active'}
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted">Deactivate license</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Confirm deactivation"
                  value={deactivateKey}
                  onChange={(e) => setDeactivateKey(e.target.value)}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    deactivate();
                    setDeactivateKey('');
                  }}
                  className="flex-shrink-0"
                >
                  Deactivate
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold text-primary">Notifications</h2>
          </div>
          {!isPro && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent">
              <Lock className="h-2.5 w-2.5" /> Pro
            </span>
          )}
        </div>

        {!isPro ? (
          <p className="text-xs text-muted">
            Upgrade to Pro to enable GitHub PR and CI notifications.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">PR review reminders</p>
                <p className="text-xs text-muted">Notify when PRs are waiting for your review</p>
              </div>
              <button
                onClick={() => toggleNotifications(!notificationsEnabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                  notificationsEnabled ? 'bg-accent' : 'bg-surface-elevated'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">CI failure alerts</p>
                <p className="text-xs text-muted">
                  Notify when a build fails on your tracked repos
                </p>
              </div>
              <button
                onClick={() => toggleNotifications(!notificationsEnabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                  notificationsEnabled ? 'bg-accent' : 'bg-surface-elevated'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={handlePollNow} className="gap-2">
              {pollDone ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              {pollDone ? 'Triggered!' : 'Test notification'}
            </Button>
          </>
        )}
      </section>

      {/* Profile */}
      <section className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-primary">Profile</h2>
        <div>
          <label className="text-xs text-muted block mb-1.5">Your name</label>
          <input
            type="text"
            placeholder="e.g. Usama"
            value={settings.userName ?? ''}
            onChange={(e) => update({ userName: e.target.value })}
            className="w-full max-w-xs rounded-xl bg-surface-elevated border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-muted"
          />
          <p className="text-xs text-muted mt-1.5">
            Used for greetings and personalized messages across the workspace.
          </p>
        </div>
      </section>

      {/* Appearance */}
      <section className="card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-primary">Appearance</h2>

        {/* Accent color */}
        <div>
          <p className="text-xs text-muted mb-2">Accent Color</p>
          <div className="flex gap-2 flex-wrap">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => update({ accentColor: color.value })}
                title={color.label}
                className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: color.value }}
              >
                {settings.accentColor === color.value && (
                  <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background color */}
        <div>
          <p className="text-xs text-muted mb-2">Background Color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Midnight', value: '#070a13' },
              { label: 'Obsidian', value: '#0a0a0a' },
              { label: 'Navy', value: '#050d1a' },
              { label: 'Forest', value: '#060f0a' },
              { label: 'Aubergine', value: '#0d0614' },
              { label: 'Slate', value: '#080c12' },
              { label: 'Espresso', value: '#0f0b09' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => update({ backgroundColor: preset.value })}
                title={preset.label}
                className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: preset.value,
                  borderColor:
                    (settings.backgroundColor ?? '#070a13') === preset.value
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--border))',
                }}
              >
                {(settings.backgroundColor ?? '#070a13') === preset.value && (
                  <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
            {/* Free color picker */}
            <label
              className="relative h-8 w-8 rounded-full border-2 border-border overflow-hidden cursor-pointer hover:scale-110 transition-transform"
              title="Custom color"
              style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}
            >
              <input
                type="color"
                value={settings.backgroundColor ?? '#070a13'}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-xs text-muted mb-2">Font Size</p>
          <div className="flex gap-1 bg-surface-elevated rounded-xl p-1 w-fit">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => update({ fontSize: size })}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  settings.fontSize === size
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-secondary'
                )}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Compact mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary">Compact Mode</p>
            <p className="text-xs text-muted">Reduce spacing and padding throughout the UI</p>
          </div>
          <button
            onClick={() => update({ compactMode: !settings.compactMode })}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              settings.compactMode ? 'bg-accent' : 'bg-surface-elevated'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                settings.compactMode ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Show clock */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary">Show Clock in Sidebar</p>
            <p className="text-xs text-muted">
              Display the current time at the bottom of the sidebar
            </p>
          </div>
          <button
            onClick={() => update({ showClock: !settings.showClock })}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              settings.showClock ? 'bg-accent' : 'bg-surface-elevated'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                settings.showClock ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Cloud Sync */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <Cloud className="h-4 w-4 text-muted mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-secondary">Cloud Sync</p>
                {!isPro && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent">
                    <Lock className="h-2.5 w-2.5" /> Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">Sync your data across devices</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isPro) {
                openUpgradeModal(PRO_FEATURES.CLOUD_SYNC);
                return;
              }
              setCloudSync((v) => !v);
            }}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              isPro && cloudSync ? 'bg-accent' : 'bg-surface-elevated'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                isPro && cloudSync ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Chrome Appearance */}
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
          <div>
            <p className="text-sm text-secondary">Chrome Appearance</p>
            <p className="text-xs text-muted">Change Chrome theme, font, and page zoom</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => chrome.tabs.create({ url: 'chrome://settings/appearance' })}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Button>
        </div>
      </section>

      {/* Data */}
      <section className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary">Data Management</h2>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            {exportDone ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportDone ? 'Exported!' : 'Export Backup'}
          </Button>

          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Import Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {importError && <p className="text-xs text-destructive">{importError}</p>}

        <div className="border-t border-border-subtle pt-4">
          {confirmReset ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-destructive flex-1">
                This will reset all settings to defaults. Are you sure?
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                Yes, Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmReset(true)}
              className="gap-2 text-muted hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Settings to Defaults
            </Button>
          )}
        </div>
      </section>

      {/* About */}
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-primary mb-3">About</h2>
        <div className="space-y-1 text-xs text-muted">
          <p>Waypoint v1.0.0</p>
          <p>A developer productivity command center for Chrome.</p>
          <p className="mt-2">
            Built with React, TypeScript, Vite, TailwindCSS, Zustand, and Framer Motion.
          </p>
        </div>
      </section>
    </div>
  );
}
